#!/usr/bin/env bash
set -euo pipefail
umask 077

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
runtime_dir="${GAME_NOVNC_RUNTIME_DIR:-$project_root/.local/runtime/browser}"
display="${GAME_DISPLAY:-:110}"
vnc_port="${GAME_VNC_PORT:-5940}"
novnc_port="${GAME_NOVNC_PORT:-6140}"
cdp_port="${GAME_CDP_PORT:-9480}"
app_port="${GAME_APP_PORT:-8011}"
app_url="http://127.0.0.1:$app_port/"
lock_file="$project_root/.local/runtime/browser-control.lock"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

validate_runtime_dir() {
  local lexical resolved current output
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
  for output in \
    "$runtime_dir/xvfb.pid" "$runtime_dir/x11vnc.pid" "$runtime_dir/novnc.pid" \
    "$runtime_dir/chrome.pid" "$runtime_dir/fit.pid" \
    "$runtime_dir/logs/xvfb.log" "$runtime_dir/logs/x11vnc.log" \
    "$runtime_dir/logs/novnc.log" "$runtime_dir/logs/chrome.log" \
    "$runtime_dir/logs/fit.log" "$lock_file"; do
    validate_private_file_target "$output"
  done
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

component_pid() {
  local name="$1"
  if [[ -f "$runtime_dir/$name.pid" ]]; then
    cat "$runtime_dir/$name.pid"
  else
    printf ''
  fi
}

cmdline_has_arg() {
  local pid="$1" expected="$2" arg
  while IFS= read -r -d '' arg; do
    [[ "$arg" == "$expected" ]] && return 0
  done <"/proc/$pid/cmdline"
  return 1
}

cmdline_executable_is() {
  local pid="$1" expected="$2" executable
  IFS= read -r -d '' executable <"/proc/$pid/cmdline" || true
  [[ "$(basename -- "$executable")" == "$expected" ]]
}

proc_executable_is() {
  local pid="$1" expected="$2" executable
  executable="$(readlink -f -- "/proc/$pid/exe" 2>/dev/null)" || return 1
  [[ "$(basename -- "$executable")" == "$expected" ]]
}

# Chromium rewrites its argv memory into a single space-delimited process title
# after startup. The flags below contain no spaces, so compare whole title tokens
# while anchoring authority to the actual /proc executable.
cmdline_title_has_token() {
  local pid="$1" expected="$2" entry token
  while IFS= read -r -d '' entry; do
    for token in $entry; do
      [[ "$token" == "$expected" ]] && return 0
    done
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

component_owned() {
  local name="$1" pid
  pid="$(component_pid "$name")"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  [[ -r "/proc/$pid/cmdline" ]] || return 1
  case "$name" in
    xvfb) cmdline_executable_is "$pid" Xvfb && cmdline_has_arg "$pid" "$display" ;;
    x11vnc)
      cmdline_executable_is "$pid" x11vnc &&
        cmdline_has_pair "$pid" -display "$display" &&
        cmdline_has_pair "$pid" -rfbport "$vnc_port"
      ;;
    novnc)
      cmdline_has_basename_arg "$pid" websockify &&
        cmdline_has_arg "$pid" "127.0.0.1:$novnc_port" &&
        cmdline_has_arg "$pid" "127.0.0.1:$vnc_port"
      ;;
    chrome)
      { proc_executable_is "$pid" chrome || proc_executable_is "$pid" google-chrome; } &&
        cmdline_title_has_token "$pid" "--remote-debugging-port=$cdp_port" &&
        cmdline_title_has_token "$pid" "--user-data-dir=$runtime_dir/profile" &&
        cmdline_title_has_token "$pid" "$app_url"
      ;;
    fit) cmdline_has_arg "$pid" "$project_root/scripts/fit-window.sh" ;;
    *) return 1 ;;
  esac
}

register_pid() {
  validate_private_file_target "$runtime_dir/$1.pid"
  printf '%s\n' "$2" >"$runtime_dir/$1.pid"
  chmod 600 "$runtime_dir/$1.pid"
}

stop_component() {
  local name="$1" pid
  pid="$(component_pid "$name")"
  if component_owned "$name"; then
    kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 40); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.1
    done
    if kill -0 "$pid" 2>/dev/null; then kill -KILL "$pid" 2>/dev/null || true; fi
  fi
  rm -f -- "$runtime_dir/$name.pid"
}

http_ready() {
  curl --fail --silent --max-time 2 "$1" >/dev/null 2>&1
}

port_ready() {
  ss -H -ltn "sport = :$1" 2>/dev/null | grep -q .
}

wait_for_display() {
  local display_number="${display#:}"
  for _ in $(seq 1 100); do
    if component_owned xvfb && [[ -S "/tmp/.X11-unix/X$display_number" ]]; then return 0; fi
    sleep 0.1
  done
  return 1
}

wait_for_owned_port() {
  local name="$1" port="$2"
  for _ in $(seq 1 100); do
    if component_owned "$name" && port_ready "$port"; then return 0; fi
    sleep 0.1
  done
  return 1
}

wait_for_owned_http() {
  local name="$1" url="$2"
  for _ in $(seq 1 100); do
    if component_owned "$name" && http_ready "$url"; then return 0; fi
    sleep 0.1
  done
  return 1
}

status_stack() {
  local app=false cdp=false vnc=false novnc=false chrome_owned=false xvfb_owned=false
  local x11vnc_owned=false novnc_owned=false fit_owned=false
  http_ready "$app_url" && app=true
  http_ready "http://127.0.0.1:$cdp_port/json/version" && cdp=true
  port_ready "$vnc_port" && vnc=true
  http_ready "http://127.0.0.1:$novnc_port/vnc.html" && novnc=true
  component_owned chrome && chrome_owned=true
  component_owned xvfb && xvfb_owned=true
  component_owned x11vnc && x11vnc_owned=true
  component_owned novnc && novnc_owned=true
  component_owned fit && fit_owned=true
  printf '{"display":"%s","app":"%s","appReady":%s,"cdp":"http://127.0.0.1:%s","cdpReady":%s,"vncReady":%s,"novnc":"http://127.0.0.1:%s/vnc.html?host=127.0.0.1&port=%s&autoconnect=1&resize=scale","novncReady":%s,"xvfbOwned":%s,"x11vncOwned":%s,"novncOwned":%s,"chromeOwned":%s,"fitOwned":%s}\n' \
    "$display" "$app_url" "$app" "$cdp_port" "$cdp" "$vnc" \
    "$novnc_port" "$novnc_port" "$novnc" "$xvfb_owned" "$x11vnc_owned" \
    "$novnc_owned" "$chrome_owned" "$fit_owned"
}

stop_stack() {
  stop_component fit
  stop_component chrome
  stop_component novnc
  stop_component x11vnc
  stop_component xvfb
}

start_stack() {
  local display_number="${display#:}"
  local display_lock="/tmp/.X${display_number}-lock"
  local display_socket="/tmp/.X11-unix/X${display_number}"
  [[ "$display_number" =~ ^[0-9]+$ ]] || die "GAME_DISPLAY must look like :110"
  for command in Xvfb x11vnc websockify google-chrome xdotool curl; do
    command -v "$command" >/dev/null || die "$command is required"
  done
  http_ready "$app_url" || die "start the Game demo before noVNC"
  if component_owned chrome && component_owned xvfb && component_owned x11vnc &&
    component_owned novnc && component_owned fit && port_ready "$vnc_port" &&
    http_ready "http://127.0.0.1:$novnc_port/vnc.html" &&
    http_ready "http://127.0.0.1:$cdp_port/json/version"; then
    status_stack
    return
  fi
  stop_stack
  if [[ -e "$display_lock" ]]; then
    local lock_pid
    lock_pid="$(tr -d ' ' <"$display_lock")"
    if [[ "$lock_pid" =~ ^[0-9]+$ ]] && kill -0 "$lock_pid" 2>/dev/null; then
      die "display $display is already occupied"
    fi
    [[ "$(stat -c '%u' "$display_lock")" == "$(id -u)" ]] || die "stale display lock is not owned by this user"
    if [[ -e "$display_socket" ]]; then
      [[ "$(stat -c '%u' "$display_socket")" == "$(id -u)" ]] || die "stale display socket is not owned by this user"
    fi
    rm -f -- "$display_lock" "$display_socket"
  fi
  for port in "$vnc_port" "$novnc_port" "$cdp_port"; do
    if ss -ltn "sport = :$port" | tail -n +2 | grep -q .; then die "port $port is already occupied"; fi
  done
  prepare_private_directory "$runtime_dir"
  prepare_private_directory "$runtime_dir/logs"
  prepare_private_directory "$runtime_dir/profile"
  prepare_private_directory "$runtime_dir/evidence"

  setsid Xvfb "$display" -screen 0 1440x1000x24 -nolisten tcp -ac 9>&- </dev/null >"$runtime_dir/logs/xvfb.log" 2>&1 &
  register_pid xvfb $!
  wait_for_display || { stop_stack; die "Xvfb did not become ready"; }
  DISPLAY="$display" setsid x11vnc -display "$display" -localhost -nopw -forever -shared -rfbport "$vnc_port" 9>&- </dev/null >"$runtime_dir/logs/x11vnc.log" 2>&1 &
  register_pid x11vnc $!
  wait_for_owned_port x11vnc "$vnc_port" || { stop_stack; die "x11vnc did not become ready"; }
  setsid websockify --web=/usr/share/novnc "127.0.0.1:$novnc_port" "127.0.0.1:$vnc_port" 9>&- </dev/null >"$runtime_dir/logs/novnc.log" 2>&1 &
  register_pid novnc $!
  wait_for_owned_http novnc "http://127.0.0.1:$novnc_port/vnc.html" || {
    stop_stack
    die "noVNC did not become ready"
  }
  DISPLAY="$display" setsid google-chrome \
    --user-data-dir="$runtime_dir/profile" \
    --remote-debugging-address=127.0.0.1 --remote-debugging-port="$cdp_port" \
    --window-position=0,0 --window-size=1440,1000 --no-first-run --no-default-browser-check \
    --disable-dev-shm-usage --disable-gpu --disable-breakpad --disable-crashpad-for-testing \
    --enable-features=NetworkServiceInProcess2 \
    --host-resolver-rules='MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost' \
    --proxy-server=http://127.0.0.1:9 --proxy-bypass-list='localhost;127.0.0.1' --disable-quic \
    --disable-background-networking --disable-background-mode --disable-component-update \
    --disable-default-apps --disable-domain-reliability --disable-extensions --disable-sync \
    --disable-features=AutofillServerCommunication,MediaRouter,Notifications,OptimizationGuideModelDownloading,OptimizationHints,PushMessaging,Translate \
    "$app_url" 9>&- </dev/null >"$runtime_dir/logs/chrome.log" 2>&1 &
  register_pid chrome $!
  wait_for_owned_http chrome "http://127.0.0.1:$cdp_port/json/version" || {
    stop_stack
    die "Chrome CDP did not become ready"
  }

  DISPLAY="$display" setsid "$project_root/scripts/fit-window.sh" 9>&- </dev/null >"$runtime_dir/logs/fit.log" 2>&1 &
  register_pid fit $!
  component_owned fit || { stop_stack; die "window-fit guard did not remain running"; }
  status_stack
}

validate_runtime_dir
for port in "$vnc_port" "$novnc_port" "$cdp_port" "$app_port"; do
  valid_port "$port" || die "invalid port: $port"
done
mkdir -p "$(dirname "$lock_file")"
exec 9>"$lock_file"
flock -x 9

case "${1:-status}" in
  start) start_stack ;;
  stop) stop_stack ;;
  restart) stop_stack; start_stack ;;
  status) status_stack ;;
  *) die "usage: $0 {start|stop|restart|status}" ;;
esac
