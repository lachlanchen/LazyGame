#!/usr/bin/env bash
set -euo pipefail

# Keep the one owned browser fitted for the lifetime of the reusable stack.
# The launcher terminates this lightweight guard together with Chrome.
while true; do
  window="$(xdotool search --onlyvisible --class 'google-chrome' 2>/dev/null | tail -1 || true)"
  if [[ -n "$window" ]]; then
    read -r width height < <(xdotool getdisplaygeometry)
    xdotool windowmove --sync "$window" 0 0
    xdotool windowsize --sync "$window" "$width" "$height"
  fi
  sleep 2
done
