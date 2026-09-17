#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-.dev-server.log}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m'

# Next.js page/route timing: "GET /admin/eleves 200 in 364ms"
NEXT_TIMING='(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) /[^ ]+ .* in [0-9]+ms'
# API timing from lib/dev/with-dev-perf.ts: "[perf] label GET → 200 (12.3ms)"
PERF_LOG='\[perf\]'

if [[ ! -f "$LOG_FILE" ]]; then
  echo "Fichier ${LOG_FILE} introuvable."
  echo "Terminal 1 : npm run dev:log"
  echo "Terminal 2 : npm run perf:watch"
  exit 1
fi

echo -e "${DIM}Surveillance des temps de réponse (${LOG_FILE})${NC}"
echo -e "${DIM}  • pages/routes Next.js (GET /... in XXXms)${NC}"
echo -e "${DIM}  • API withDevPerf ([perf] ...)${NC}"
echo "---"

tail -n 0 -F "$LOG_FILE" | grep --line-buffered -E "${NEXT_TIMING}|${PERF_LOG}" | while IFS= read -r line; do
  if [[ "$line" == *"[perf]"* ]]; then
    printf '%b%s%b\n' "$YELLOW" "$line" "$NC"
  else
    printf '%b%s%b\n' "$GREEN" "$line" "$NC"
  fi
done
