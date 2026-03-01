#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  eRegistrations Agent Hub — Interactive Menu
#  Usage: ./menu.sh
# ═══════════════════════════════════════════════════════════════

BASE="$HOME/Desktop/OCAgents"
HELPER="$BASE/.start-agent.sh"

# Colors
R='\033[0;31m'    G='\033[0;32m'    B='\033[0;34m'
Y='\033[1;33m'    C='\033[0;36m'    M='\033[0;35m'
W='\033[1;37m'    D='\033[0;90m'    NC='\033[0m'
BOLD='\033[1m'    DIM='\033[2m'     UL='\033[4m'

clear_screen() { printf '\033[2J\033[H'; }

header() {
  echo -e "${M}${BOLD}"
  echo '  ╔═══════════════════════════════════════════════════════════╗'
  echo '  ║          eRegistrations Agent Hub — Menu                 ║'
  echo '  ╚═══════════════════════════════════════════════════════════╝'
  echo -e "${NC}"
}

# ─── Launch agent in new Terminal window ───
launch_agent() {
  local dir="$1"
  osascript -e "tell application \"Terminal\" to do script \"'$HELPER' '$dir'\"" \
            -e "tell application \"Terminal\" to activate" 2>/dev/null
}

# ─── Count missions by status ───
count_missions() {
  local file="$1"
  local active blocked complete
  active=$(grep -cE '^\#\#.*ACTIVA|^\#\#.*IN PROGRESS' "$file" 2>/dev/null) || active=0
  blocked=$(grep -cE '^\#\#.*BLOQUEADA' "$file" 2>/dev/null) || blocked=0
  complete=$(grep -cE '^\#\#.*COMPLETADA|^\#\#.*COMPLETE' "$file" 2>/dev/null) || complete=0
  printf '%da/%db/%dc' "$active" "$blocked" "$complete"
}

# ═══════════════════════════════════════════════════════════════
#  MAIN MENU
# ═══════════════════════════════════════════════════════════════
main_menu() {
  clear_screen
  header

  local cuba_m=$(count_missions "$BASE/countries/cuba/missions/MISSIONS.md")
  local jamaica_m=$(count_missions "$BASE/countries/jamaica/missions/MISSIONS.md")

  echo -e "  ${W}${BOLD}PAISES${NC}"
  echo -e "  ${Y}1${NC}  Cuba        ${D}18 servicios | Misiones: ${cuba_m}${NC}"
  echo -e "  ${Y}2${NC}  Jamaica     ${D}1 servicio   | Misiones: ${jamaica_m}${NC}"
  echo ""
  echo -e "  ${W}${BOLD}AGENTES${NC}"
  echo -e "  ${Y}3${NC}  ${M}Coordinator${NC}  ${D}Orquestacion, misiones, delegacion${NC}"
  echo -e "  ${Y}4${NC}  ${Y}Config${NC}       ${D}Read/Write BPA — determinants, bots, effects${NC}"
  echo -e "  ${Y}5${NC}  ${C}Manual${NC}       ${D}Read-only MCP — extraccion, documentacion${NC}"
  echo -e "  ${Y}6${NC}  ${G}Testing${NC}      ${D}Playwright E2E — specs, page objects${NC}"
  echo -e "  ${Y}7${NC}  ${B}Observer${NC}     ${D}Graylog — logs, dashboards, bot tracing${NC}"
  echo ""
  echo -e "  ${W}${BOLD}TOOLKIT${NC}"
  echo -e "  ${Y}8${NC}  Skills Catalog         ${D}16 skills — ver, abrir, usar${NC}"
  echo ""
  echo -e "  ${W}${BOLD}ACCIONES RAPIDAS${NC}"
  echo -e "  ${Y}9${NC}  Lanzar TODOS los agentes"
  echo -e "  ${Y}0${NC}  Abrir Dashboard ${D}(Vercel)${NC}"
  echo ""
  echo -e "  ${D}q  Salir${NC}"
  echo ""
  echo -ne "  ${BOLD}Elige opcion: ${NC}"
  read -r choice

  case "$choice" in
    1) cuba_menu ;;
    2) jamaica_menu ;;
    3) launch_agent "$BASE" && echo -e "\n  ${G}Coordinator lanzado${NC}" && pause_return main_menu ;;
    4) launch_agent "$BASE/config" && echo -e "\n  ${G}Config Agent lanzado${NC}" && pause_return main_menu ;;
    5) launch_agent "$BASE/manual" && echo -e "\n  ${G}Manual Agent lanzado${NC}" && pause_return main_menu ;;
    6) launch_agent "$BASE/testing" && echo -e "\n  ${G}Test Agent lanzado${NC}" && pause_return main_menu ;;
    7) launch_agent "$BASE/observer" && echo -e "\n  ${G}Observer Agent lanzado${NC}" && pause_return main_menu ;;
    8) skills_menu ;;
    9) "$BASE/launch-all.sh" && pause_return main_menu ;;
    0) open "https://agent-hub-delta-opal.vercel.app" && main_menu ;;
    q|Q) echo -e "\n  ${D}Hasta luego.${NC}\n"; exit 0 ;;
    *) main_menu ;;
  esac
}

pause_return() {
  echo ""
  echo -ne "  ${D}Enter para continuar...${NC}"
  read -r
  "$1"
}

# ═══════════════════════════════════════════════════════════════
#  SKILLS / TOOLKIT MENU
# ═══════════════════════════════════════════════════════════════
skills_menu() {
  clear_screen
  header
  echo -e "  ${W}${BOLD}eRegistrations Toolkit${NC} ${D}— 16 skills${NC}"
  echo -e "  ${D}Online: agent-hub-delta-opal.vercel.app/skills-catalog.html${NC}"
  echo ""
  echo -e "  ${Y}${BOLD}CONFIG AGENT${NC} ${D}(read/write BPA)${NC}"
  echo -e "  ${Y} 1${NC}  My Files Block          ${D}Query, view & delegate user files (DataGrid + 2 bots)${NC}"
  echo -e "  ${Y} 2${NC}  Full Service Setup       ${D}Connect service to Bitacora (det + behaviour + bots)${NC}"
  echo ""
  echo -e "  ${C}${BOLD}MANUAL AGENT${NC} ${D}(read-only MCP)${NC}"
  echo -e "  ${Y} 3${NC}  Technical Documentation  ${D}User manuals, HTML guides, FAQs${NC}"
  echo -e "  ${Y} 4${NC}  Change Detection         ${D}Diff services between versions or instances${NC}"
  echo ""
  echo -e "  ${G}${BOLD}TEST AGENT${NC} ${D}(Playwright E2E)${NC}"
  echo -e "  ${Y} 5${NC}  Playwright E2E           ${D}Generate E2E tests (PRD + page objects + specs)${NC}"
  echo -e "  ${Y} 6${NC}  Page Object Patterns     ${D}Selector conventions for eRegistrations${NC}"
  echo ""
  echo -e "  ${B}${BOLD}OBSERVER AGENT${NC} ${D}(Graylog)${NC}"
  echo -e "  ${Y} 7${NC}  Service Health Check     ${D}Log volume, errors, bot status${NC}"
  echo -e "  ${Y} 8${NC}  Trace Dossier            ${D}Follow dossier lifecycle through logs${NC}"
  echo -e "  ${Y} 9${NC}  Bot Failure Report       ${D}Find and diagnose all bot failures${NC}"
  echo -e "  ${Y}10${NC}  Correlate Test + Logs    ${D}Match E2E runs to Graylog evidence${NC}"
  echo ""
  echo -e "  ${R}${BOLD}COUNTRY-SPECIFIC${NC}"
  echo -e "  ${Y}11${NC}  Cuba: Fix Determinants   ${D}REST API workaround for MCP bugs${NC}"
  echo -e "  ${Y}12${NC}  Cuba: E2E Service Test   ${D}Form fill + submit for 18 Cuba services${NC}"
  echo -e "  ${Y}13${NC}  Jamaica: Form Fill       ${D}SEZ form with uploads + validation${NC}"
  echo ""
  echo -e "  ${M}${BOLD}SLASH COMMANDS${NC}"
  echo -e "  ${Y}14${NC}  /check-bpa              ${D}Verify BPA connection status${NC}"
  echo -e "  ${Y}15${NC}  /connect-service         ${D}Run Bitacora connection pattern${NC}"
  echo -e "  ${Y}16${NC}  /debug-service           ${D}Full diagnostic scan of a service${NC}"
  echo ""
  echo -e "  ${W}${BOLD}ACCIONES${NC}"
  echo -e "  ${Y} w${NC}  Abrir Toolkit online     ${D}(navegador)${NC}"
  echo ""
  echo -e "  ${D}b  Volver${NC}"
  echo ""
  echo -ne "  ${BOLD}Elige opcion: ${NC}"
  read -r choice

  case "$choice" in
     1) less "$BASE/config/.claude/skills/my-files-block.md" && skills_menu ;;
     2) less "$BASE/config/.claude/skills/service-setup.md" && skills_menu ;;
     3) less "$BASE/manual/.claude/skills/documentation.md" && skills_menu ;;
     4) less "$BASE/manual/.claude/skills/change-detection.md" && skills_menu ;;
     5) less "$BASE/testing/.claude/skills/playwright-e2e.md" && skills_menu ;;
     6) less "$BASE/testing/.claude/skills/page-objects.md" && skills_menu ;;
     7) less "$BASE/observer/.claude/skills/service-health-check.md" && skills_menu ;;
     8) less "$BASE/observer/.claude/skills/trace-dossier.md" && skills_menu ;;
     9) less "$BASE/observer/.claude/skills/bot-failure-report.md" && skills_menu ;;
    10) less "$BASE/observer/.claude/skills/correlate-test-logs.md" && skills_menu ;;
    11) less "$BASE/countries/cuba/skills/fix-determinant-effects/SKILL.md" && skills_menu ;;
    12) less "$BASE/countries/cuba/skills/e2e-service-test/SKILL.md" && skills_menu ;;
    13) less "$BASE/countries/jamaica/skills/form-fill-submit/SKILL.md" && skills_menu ;;
    14) less "$BASE/.claude/commands/check-bpa.md" && skills_menu ;;
    15) less "$BASE/.claude/commands/connect-service.md" && skills_menu ;;
    16) less "$BASE/.claude/commands/debug-service.md" && skills_menu ;;
     w|W) open "https://agent-hub-delta-opal.vercel.app/skills-catalog.html" && skills_menu ;;
     b|B) main_menu ;;
     *) skills_menu ;;
  esac
}

# ═══════════════════════════════════════════════════════════════
#  CUBA MENU
# ═══════════════════════════════════════════════════════════════
cuba_menu() {
  clear_screen
  header
  echo -e "  ${W}${BOLD}CUBA${NC} ${D}— cuba.eregistrations.org${NC}"
  echo ""
  echo -e "  ${W}${BOLD}MISIONES${NC}"
  echo -e "  ${Y}1${NC}  M-001  StatusBitacora     ${D}Conectar 18 servicios${NC}     ${Y}ACTIVA${NC}"
  echo -e "  ${Y}2${NC}  M-002  Expirado Badges    ${D}Logica vencimiento${NC}        ${R}BLOQUEADA${NC}"
  echo -e "  ${Y}3${NC}  M-003  E2E Test Suite     ${D}Playwright specs${NC}          ${Y}ACTIVA${NC}"
  echo -e "  ${Y}4${NC}  M-004  Panel Empresa      ${D}Mustache templates${NC}        ${Y}ACTIVA${NC}"
  echo -e "  ${Y}5${NC}  M-005  Documentacion      ${D}Manuales HTML${NC}             ${Y}ACTIVA${NC}"
  echo ""
  echo -e "  ${W}${BOLD}AREAS DE TRABAJO${NC}"
  echo -e "  ${Y}6${NC}  Ver SERVICES-MAP          ${D}18 servicios, IDs, estado${NC}"
  echo -e "  ${Y}7${NC}  Ver CHANGELOG             ${D}Ultimos cambios${NC}"
  echo -e "  ${Y}8${NC}  E2E Service Factory       ${D}Pipeline: discovery → config → test${NC}"
  echo -e "  ${Y}9${NC}  Abrir BPA Cuba            ${D}(navegador)${NC}"
  echo ""
  echo -e "  ${W}${BOLD}LANZAR AGENTE (contexto Cuba)${NC}"
  echo -e "  ${Y}c${NC}  Config Agent   ${Y}t${NC}  Test Agent   ${Y}m${NC}  Manual Agent   ${Y}g${NC}  Observer"
  echo ""
  echo -e "  ${D}b  Volver${NC}"
  echo ""
  echo -ne "  ${BOLD}Elige opcion: ${NC}"
  read -r choice

  case "$choice" in
    1) less "$BASE/countries/cuba/missions/MISSIONS.md" && cuba_menu ;;
    2) less "$BASE/countries/cuba/missions/MISSIONS.md" && cuba_menu ;;
    3) less "$BASE/countries/cuba/missions/MISSIONS.md" && cuba_menu ;;
    4) less "$BASE/countries/cuba/missions/MISSIONS.md" && cuba_menu ;;
    5) less "$BASE/countries/cuba/missions/MISSIONS.md" && cuba_menu ;;
    6) less "$BASE/countries/cuba/knowledge/SERVICES-MAP.md" && cuba_menu ;;
    7) less "$BASE/countries/cuba/knowledge/CHANGELOG.md" && cuba_menu ;;
    8) less "$BASE/tasks/todo.md" && cuba_menu ;;
    9) open "https://bpa.cuba.eregistrations.org" && cuba_menu ;;
    c|C) launch_agent "$BASE/config" && echo -e "\n  ${G}Config Agent lanzado${NC}" && pause_return cuba_menu ;;
    t|T) launch_agent "$BASE/testing" && echo -e "\n  ${G}Test Agent lanzado${NC}" && pause_return cuba_menu ;;
    m|M) launch_agent "$BASE/manual" && echo -e "\n  ${G}Manual Agent lanzado${NC}" && pause_return cuba_menu ;;
    g|G) launch_agent "$BASE/observer" && echo -e "\n  ${G}Observer lanzado${NC}" && pause_return cuba_menu ;;
    b|B) main_menu ;;
    *) cuba_menu ;;
  esac
}

# ═══════════════════════════════════════════════════════════════
#  JAMAICA MENU
# ═══════════════════════════════════════════════════════════════
jamaica_menu() {
  clear_screen
  header
  echo -e "  ${W}${BOLD}JAMAICA${NC} ${D}— jamaica.eregistrations.org${NC}"
  echo ""
  echo -e "  ${W}${BOLD}MISIONES${NC}"
  echo -e "  ${Y}1${NC}  M-J001  Service Discovery  ${D}Extraer servicios, IDs${NC}   ${D}PENDING${NC}"
  echo -e "  ${Y}2${NC}  M-J002  Configuration      ${D}Configurar servicios${NC}     ${D}PENDING${NC}"
  echo -e "  ${Y}3${NC}  M-J003  Testing Cycle 2    ${D}E2E + negative testing${NC}   ${Y}IN PROGRESS${NC}"
  echo ""
  echo -e "  ${W}${BOLD}AREAS DE TRABAJO${NC}"
  echo -e "  ${Y}4${NC}  Ver SERVICES-MAP          ${D}Servicios Jamaica${NC}"
  echo -e "  ${Y}5${NC}  Ver CHANGELOG             ${D}Ultimos cambios${NC}"
  echo -e "  ${Y}6${NC}  Plan Cycle 2              ${D}Gap analysis + execution${NC}"
  echo -e "  ${Y}7${NC}  Test Results              ${D}Resultados front-office${NC}"
  echo -e "  ${Y}8${NC}  Abrir BPA Jamaica         ${D}(navegador)${NC}"
  echo -e "  ${Y}9${NC}  Abrir Front-Office        ${D}(navegador)${NC}"
  echo ""
  echo -e "  ${W}${BOLD}LANZAR AGENTE (contexto Jamaica)${NC}"
  echo -e "  ${Y}t${NC}  Test Agent   ${Y}m${NC}  Manual Agent"
  echo ""
  echo -e "  ${D}b  Volver${NC}"
  echo ""
  echo -ne "  ${BOLD}Elige opcion: ${NC}"
  read -r choice

  case "$choice" in
    1|2|3) less "$BASE/countries/jamaica/missions/MISSIONS.md" && jamaica_menu ;;
    4) less "$BASE/countries/jamaica/knowledge/SERVICES-MAP.md" && jamaica_menu ;;
    5) less "$BASE/countries/jamaica/knowledge/CHANGELOG.md" && jamaica_menu ;;
    6) less "$BASE/countries/jamaica/missions/M-J003-plan.md" && jamaica_menu ;;
    7) less "$BASE/countries/jamaica/testing/02-front-office-tests/test-results.md" && jamaica_menu ;;
    8) open "https://bpa.jamaica.eregistrations.org" && jamaica_menu ;;
    9) open "https://jamaica.eregistrations.org" && jamaica_menu ;;
    t|T) launch_agent "$BASE/testing" && echo -e "\n  ${G}Test Agent lanzado${NC}" && pause_return jamaica_menu ;;
    m|M) launch_agent "$BASE/manual" && echo -e "\n  ${G}Manual Agent lanzado${NC}" && pause_return jamaica_menu ;;
    b|B) main_menu ;;
    *) jamaica_menu ;;
  esac
}

# ═══════════════════════════════════════════════════════════════
#  START
# ═══════════════════════════════════════════════════════════════
main_menu
