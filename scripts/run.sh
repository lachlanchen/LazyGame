#!/usr/bin/env bash
set -euo pipefail
umask 077

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
runtime_dir="${GAME_RUNTIME_DIR:-$project_root/.local/runtime/app}"
app_port="${GAME_APP_PORT:-8011}"
pid_file="$runtime_dir/app.pid"
log_file="$runtime_dir/app.log"
lock_file="$project_root/.local/runtime/app-control.lock"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

validate_runtime_dir() {
  local lexical resolved current
  [[ "$runtime_dir" = /* ]] || runtime_dir="$project_root/$runtime_dir"
  lexical="$(realpath -ms -- "$runtime_dir")"
  [[ "$lexical" == "$project_root/.local/"* ]] || die "runtime must stay below $project_root/.local"
  current="$lexical"
  while [[ "$current" != "$project_root" && "$current" != "/" ]]; do
    [[ ! -L "$current" ]] || die "runtime path must not contain symbolic links: $current"
    current="$(dirname -- "$current")"
  done
  resolved="$(realpath -m -- "$runtime_dir")"
  [[ "$resolved" == "$lexical" ]] || die "runtime path must resolve without redirection"
  runtime_dir="$resolved"
  pid_file="$runtime_dir/app.pid"
  log_file="$runtime_dir/app.log"
  validate_private_file_target "$pid_file"
  validate_private_file_target "$log_file"
  validate_private_file_target "$lock_file"
}

validate_private_file_target() {
  local path="$1"
  [[ ! -L "$path" ]] || die "private output must not be a symbolic link: $path"
  [[ ! -e "$path" || -f "$path" ]] || die "private output must be a regular file: $path"
}

prepare_private_directory() {
  local path="$1"
  [[ ! -L "$path" ]] || die "private directory must not be a symbolic link: $path"
  [[ ! -e "$path" || -d "$path" ]] || die "private path must be a directory: $path"
  mkdir -p -- "$path"
  chmod 700 -- "$path"
}

valid_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && ((10#$1 >= 1024 && 10#$1 <= 65535))
}

cmdline_has_arg() {
  local pid="$1" expected="$2" arg
  while IFS= read -r -d '' arg; do
    [[ "$arg" == "$expected" ]] && return 0
  done <"/proc/$pid/cmdline"
  return 1
}

cmdline_has_basename_arg() {
  local pid="$1" expected="$2" arg
  while IFS= read -r -d '' arg; do
    [[ "$(basename -- "$arg")" == "$expected" ]] && return 0
  done <"/proc/$pid/cmdline"
  return 1
}

cmdline_has_pair() {
  local pid="$1" first="$2" second="$3" index
  local -a args=()
  mapfile -d '' -t args <"/proc/$pid/cmdline" || true
  for ((index = 0; index + 1 < ${#args[@]}; index += 1)); do
    [[ "${args[index]}" == "$first" && "${args[index + 1]}" == "$second" ]] && return 0
  done
  return 1
}

pid_owned() {
  local pid="${1:-}" process_group
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  [[ -r "/proc/$pid/cmdline" ]] || return 1
  cmdline_has_basename_arg "$pid" vite.js &&
    cmdline_has_arg "$pid" preview &&
    cmdline_has_pair "$pid" --config "$project_root/apps/demo/vite.config.ts" &&
    cmdline_has_pair "$pid" --host 127.0.0.1 &&
    cmdline_has_pair "$pid" --port "$app_port" &&
    cmdline_has_arg "$pid" --strictPort || return 1
  process_group="$(ps -p "$pid" -o pgid= 2>/dev/null | tr -d ' ')"
  [[ "$process_group" == "$pid" ]]
}

healthy() {
  curl --fail --silent --show-error --max-time 2 "http://127.0.0.1:$app_port/" >/dev/null 2>&1
}

start_app() {
  prepare_private_directory "$runtime_dir"
  prepare_private_directory "$(dirname "$lock_file")"
  validate_private_file_target "$pid_file"
  validate_private_file_target "$log_file"
  if [[ -e "$pid_file" ]]; then
    local existing
    existing="$(<"$pid_file")"
    if pid_owned "$existing" && healthy; then
      printf '{"url":"http://127.0.0.1:%s/","pid":%s,"healthy":true}\n' "$app_port" "$existing"
      return
    fi
    pid_owned "$existing" && die "owned app process exists but is not healthy"
    rm -f -- "$pid_file"
  fi
  if ss -ltn "sport = :$app_port" | tail -n +2 | grep -q .; then
    die "port $app_port is already occupied"
  fi
  npm --prefix "$project_root" run build
  : >"$log_file"
  chmod 600 "$log_file"
  setsid "$project_root/node_modules/vite/bin/vite.js" preview \
    --config "$project_root/apps/demo/vite.config.ts" \
    --host 127.0.0.1 --port "$app_port" --strictPort \
    9>&- </dev/null >>"$log_file" 2>&1 &
  local pid=$!
  printf '%s\n' "$pid" >"$pid_file"
  chmod 600 "$pid_file"
  for _ in $(seq 1 80); do
    if pid_owned "$pid" && healthy; then
      printf '{"url":"http://127.0.0.1:%s/","pid":%s,"healthy":true}\n' "$app_port" "$pid"
      return
    fi
    sleep 0.1
  done
  kill -TERM -- "-$pid" 2>/dev/null || true
  rm -f -- "$pid_file"
  die "app did not become healthy; see $log_file"
}

stop_app() {
  [[ -e "$pid_file" ]] || return 0
  local pid
  pid="$(<"$pid_file")"
  if ! pid_owned "$pid"; then
    rm -f -- "$pid_file"
    return 0
  fi
  kill -TERM -- "-$pid" 2>/dev/null || true
  for _ in $(seq 1 50); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.1
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL -- "-$pid" 2>/dev/null || true
  fi
  rm -f -- "$pid_file"
}

status_app() {
  local owned=false pid=null
  if [[ -e "$pid_file" ]]; then
    local candidate
    candidate="$(<"$pid_file")"
    if pid_owned "$candidate"; then owned=true; pid="$candidate"; fi
  fi
  local ready=false
  healthy && ready=true
  printf '{"url":"http://127.0.0.1:%s/","pid":%s,"pidOwned":%s,"healthy":%s,"log":"%s"}\n' \
    "$app_port" "$pid" "$owned" "$ready" "$log_file"
}

validate_runtime_dir
valid_port "$app_port" || die "GAME_APP_PORT must be between 1024 and 65535"
mkdir -p "$(dirname "$lock_file")"
exec 9>"$lock_file"
flock -x 9

case "${1:-status}" in
  start) start_app ;;
  stop) stop_app ;;
  restart) stop_app; start_app ;;
  status) status_app ;;
  *) die "usage: $0 {start|stop|restart|status}" ;;
esac
