#!/bin/bash
# Helper: launched by each Terminal window
# Usage: .start-agent.sh <agent-dir>

DIR="$1"
AGENT=$(basename "$DIR")
cd "$DIR" || exit 1

# Colors
R='\033[0;31m'    G='\033[0;32m'    B='\033[0;34m'
Y='\033[1;33m'    C='\033[0;36m'    M='\033[0;35m'
W='\033[1;37m'    D='\033[0;90m'    NC='\033[0m'

case "$AGENT" in
  OCAgents)
    echo -e "${M}"
    echo '  ╔═══════════════════════════════════════╗'
    echo '  ║   COORDINATOR — Agent Hub              ║'
    echo '  ╠═══════════════════════════════════════╣'
    echo '  ║  Orchestrates the 3 agents             ║'
    echo '  ║  Status, missions, delegation          ║'
    echo '  ╚═══════════════════════════════════════╝'
    echo -e "${NC}"
    ;;
  config)
    echo -e "${Y}"
    echo '  ╔═══════════════════════════════════════╗'
    echo '  ║   CONFIGURATOR — Config Agent          ║'
    echo '  ╠═══════════════════════════════════════╣'
    echo '  ║  Read/Write BPA MCP                    ║'
    echo '  ║  Determinants, Bots, Effects, Forms    ║'
    echo '  ╚═══════════════════════════════════════╝'
    echo -e "${NC}"
    ;;
  manual)
    echo -e "${C}"
    echo '  ╔═══════════════════════════════════════╗'
    echo '  ║   EXTRACTOR — Manual Agent             ║'
    echo '  ╠═══════════════════════════════════════╣'
    echo '  ║  READ-ONLY across 4 MCP instances      ║'
    echo '  ║  Cuba, Lesotho, Colombia, Jamaica      ║'
    echo '  ╚═══════════════════════════════════════╝'
    echo -e "${NC}"
    ;;
  testing)
    echo -e "${G}"
    echo '  ╔═══════════════════════════════════════╗'
    echo '  ║   VERIFIER — Test Agent                ║'
    echo '  ╠═══════════════════════════════════════╣'
    echo '  ║  Playwright E2E                        ║'
    echo '  ║  cuba.eregistrations.org               ║'
    echo '  ╚═══════════════════════════════════════╝'
    echo -e "${NC}"
    ;;
  designer)
    echo -e "${R}"
    echo '  ╔═══════════════════════════════════════╗'
    echo '  ║   ARCHITECT — Designer Agent           ║'
    echo '  ╠═══════════════════════════════════════╣'
    echo '  ║  Service design patterns               ║'
    echo '  ║  Architecture & best practices         ║'
    echo '  ╚═══════════════════════════════════════╝'
    echo -e "${NC}"
    ;;
esac

SYSTEM="At session start, BEFORE responding to the user, automatically run this protocol: Read your profile in shared/profiles/ and state who you are. Check shared/requests/ for pending requests. Check shared/responses/ for recent responses. Read the last 30 lines of shared/knowledge/CHANGELOG.md. Read shared/MISSIONS.md and report active missions. Use concise bullet format. End with: Ready for instructions."

exec claude --append-system-prompt "$SYSTEM"
