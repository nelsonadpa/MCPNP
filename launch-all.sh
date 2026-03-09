#!/bin/bash
# Launch eRegistrations Agent Hub — all 4 agents in separate Terminal.app windows
# Each agent auto-presents itself with a status report on startup
#
# Usage: ./launch-all.sh [agents...]
# Examples:
#   ./launch-all.sh                    # Launch all 4 (coordinator + 3 agents)
#   ./launch-all.sh config             # Solo the Config Agent
#   ./launch-all.sh test man           # Test + Manual only
#   ./launch-all.sh orq config test    # Coordinator + Config + Test

BASE="$(cd "$(dirname "$0")" && pwd)"
HELPER="$BASE/.start-agent.sh"
AGENTS="${@:-orq config manual testing observer designer}"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

launch_window() {
  local dir="$1"
  local name="$2"
  osascript -e "tell application \"Terminal\" to do script \"'$HELPER' '$dir'\"" \
            -e "tell application \"Terminal\" to activate"
}

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  eRegistrations Agent Hub — Launcher  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

COUNT=0
TOTAL=$(echo $AGENTS | wc -w | tr -d ' ')

for agent in $AGENTS; do
  COUNT=$((COUNT + 1))
  case "$agent" in
    orq|o|orquestador)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Coordinator..."
      launch_window "$BASE" "Coordinator"
      sleep 0.5
      ;;
    config|c)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Config Agent (Configurator)..."
      launch_window "$BASE/config" "Config Agent"
      sleep 0.5
      ;;
    manual|m|man)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Manual Agent (Extractor)..."
      launch_window "$BASE/manual" "Manual Agent"
      sleep 0.5
      ;;
    testing|test|t)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Test Agent (Verifier)..."
      launch_window "$BASE/testing" "Test Agent"
      sleep 0.5
      ;;
    observer|obs|g)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Observer Agent (Tracker)..."
      launch_window "$BASE/observer" "Observer Agent"
      sleep 0.5
      ;;
    designer|d)
      echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Designer Agent (Architect)..."
      launch_window "$BASE/designer" "Designer Agent"
      sleep 0.5
      ;;
    *)
      echo "Unknown agent: $agent (use: orq, config, manual, testing, observer, designer)"
      COUNT=$((COUNT - 1))
      ;;
  esac
done

echo ""
echo -e "${GREEN}All $COUNT agents launched!${NC} Check your Terminal windows."
