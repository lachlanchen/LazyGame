#!/usr/bin/env bash
set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
if [[ -L "$project_root/.local" ]]; then
  printf '[runtime-safety] FAIL: project .local must not be a symlink\n' >&2
  exit 1
fi
mkdir -p -- "$project_root/.local"
chmod 700 -- "$project_root/.local"
fixture_root="$(mktemp -d "$project_root/.local/runtime-safety.XXXXXX")"

cleanup() {
  if [[ -n "${deceptive_pid:-}" ]] && kill -0 "$deceptive_pid" 2>/dev/null; then
    kill -TERM "$deceptive_pid" 2>/dev/null || true
  fi
  if [[ -n "${fixture_root:-}" && -d "$fixture_root" &&
        "$fixture_root" == "$project_root/.local/runtime-safety."* ]]; then
    rm -rf -- "$fixture_root"
  fi
}
trap cleanup EXIT

fail() {
  printf '[runtime-safety] FAIL: %s\n' "$*" >&2
  exit 1
}

expect_rejected() {
  local variable="$1" value="$2" script="$3"
  if env "$variable=$value" bash "$script" status >/dev/null 2>&1; then
    fail "$script accepted unsafe $variable=$value"
  fi
}

run_script="$project_root/scripts/run.sh"
browser_script="$project_root/scripts/launch-novnc.sh"
bash -n "$run_script" "$browser_script"

expect_rejected GAME_RUNTIME_DIR / "$run_script"
expect_rejected GAME_NOVNC_RUNTIME_DIR / "$browser_script"

mkdir -p -- "$fixture_root/real" "$fixture_root/app" "$fixture_root/browser"
ln -s -- "$fixture_root/real" "$fixture_root/runtime-link"
expect_rejected GAME_RUNTIME_DIR "$fixture_root/runtime-link" "$run_script"
expect_rejected GAME_NOVNC_RUNTIME_DIR "$fixture_root/runtime-link" "$browser_script"

sentinel="$fixture_root/sentinel"
printf 'keep\n' >"$sentinel"
ln -s -- "$sentinel" "$fixture_root/app/app.pid"
expect_rejected GAME_RUNTIME_DIR "$fixture_root/app" "$run_script"
ln -s -- "$sentinel" "$fixture_root/browser/chrome.pid"
expect_rejected GAME_NOVNC_RUNTIME_DIR "$fixture_root/browser" "$browser_script"
[[ "$(<"$sentinel")" == 'keep' ]] || fail 'output validation modified the sentinel'
rm -f -- "$fixture_root/app/app.pid"

setsid node -e 'setInterval(() => {}, 1000)' \
  "$project_root/node_modules/vite/bin/vite.jsx" preview \
  --config "$project_root/apps/demo/vite.config.ts.bak" \
  --host 127.0.0.10 --port "${GAME_APP_PORT:-8011}0" --strictPort >/dev/null 2>&1 &
deceptive_pid=$!
printf '%s\n' "$deceptive_pid" >"$fixture_root/app/app.pid"
deceptive_status="$(GAME_RUNTIME_DIR="$fixture_root/app" bash "$run_script" status)"
grep -Fq '"pidOwned":false' <<<"$deceptive_status" ||
  fail 'app ownership accepted deceptive argv prefixes'
kill -TERM "$deceptive_pid" 2>/dev/null || true
wait "$deceptive_pid" 2>/dev/null || true
deceptive_pid=''

grep -Fq '9>&- </dev/null' "$run_script" || fail 'app child inherits lifecycle lock'
grep -Fq 'npm --prefix "$project_root" run build' "$run_script" ||
  fail 'app build depends on the caller working directory'
[[ "$(grep -Fc '9>&- </dev/null' "$browser_script")" -ge 5 ]] ||
  fail 'browser child inherits lifecycle lock'

printf '[runtime-safety] PASS\n'
