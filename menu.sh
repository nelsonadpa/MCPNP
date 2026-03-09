#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  eRegistrations Agent Hub — Interactive Menu
#  Usage: ./menu.sh
# ═══════════════════════════════════════════════════════════════

BASE="$(cd "$(dirname "$0")" && pwd)"
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
  echo -e "  ${Y}d${NC}  ${R}Designer${NC}     ${D}Patrones de diseno, arquitectura, best practices${NC}"
  echo ""
  echo -e "  ${W}${BOLD}TOOLKIT${NC}"
  echo -e "  ${Y}8${NC}  Skills Catalog         ${D}16 skills — ver, abrir, usar${NC}"
  echo -e "  ${Y}a${NC}  Agent Catalog          ${D}77 agentes globales por categoria${NC}"
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
    d|D) launch_agent "$BASE/designer" && echo -e "\n  ${G}Designer Agent lanzado${NC}" && pause_return main_menu ;;
    8) skills_menu ;;
    a|A) agent_catalog_menu ;;
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
  echo -e "  ${W}${BOLD}eRegistrations Toolkit${NC} ${D}— 17 skills${NC}"
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
  echo -e "  ${Y}14${NC}  Jamaica: Part B E2E      ${D}12 patrones universales para Part B testing${NC}"
  echo ""
  echo -e "  ${M}${BOLD}SLASH COMMANDS${NC}"
  echo -e "  ${Y}15${NC}  /check-bpa              ${D}Verify BPA connection status${NC}"
  echo -e "  ${Y}16${NC}  /connect-service         ${D}Run Bitacora connection pattern${NC}"
  echo -e "  ${Y}17${NC}  /debug-service           ${D}Full diagnostic scan of a service${NC}"
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
    14) less "$BASE/countries/jamaica/testing/knowledge/partb-e2e-patterns.md" && skills_menu ;;
    15) less "$BASE/.claude/commands/check-bpa.md" && skills_menu ;;
    16) less "$BASE/.claude/commands/connect-service.md" && skills_menu ;;
    17) less "$BASE/.claude/commands/debug-service.md" && skills_menu ;;
     w|W) open "https://agent-hub-delta-opal.vercel.app/skills-catalog.html" && skills_menu ;;
     b|B) main_menu ;;
     *) skills_menu ;;
  esac
}

# ═══════════════════════════════════════════════════════════════
#  AGENT CATALOG
# ═══════════════════════════════════════════════════════════════
agent_catalog_menu() {
  clear_screen
  header
  echo -e "  ${W}${BOLD}Agent Catalog${NC} ${D}— 77 custom agents in ~/.claude/agents/${NC}"
  echo -e "  ${G}${BOLD}These are GLOBAL agents — available in any Claude Code session${NC}"
  echo ""

  echo -e "  ${R}${BOLD}DESIGN${NC} ${D}(7)${NC}"
  echo -e "    ${W}brand-guardian${NC}           ${D}Brand consistency and identity enforcement${NC}"
  echo -e "    ${W}image-prompt-engineer${NC}    ${D}AI image prompt crafting and refinement${NC}"
  echo -e "    ${W}ui-designer${NC}              ${D}User interface design and component systems${NC}"
  echo -e "    ${W}ux-architect${NC}             ${D}Information architecture and user flows${NC}"
  echo -e "    ${W}ux-researcher${NC}            ${D}User research, interviews, usability testing${NC}"
  echo -e "    ${W}visual-storyteller${NC}       ${D}Visual narrative and presentation design${NC}"
  echo -e "    ${W}whimsy-injector${NC}          ${D}Delight and personality in product experiences${NC}"
  echo ""

  echo -e "  ${B}${BOLD}ENGINEERING${NC} ${D}(8)${NC}"
  echo -e "    ${W}ai-engineer${NC}              ${D}ML pipelines, model integration, AI systems${NC}"
  echo -e "    ${W}backend-architect${NC}        ${D}APIs, databases, server architecture${NC}"
  echo -e "    ${W}devops-automator${NC}         ${D}CI/CD, infrastructure, deployment pipelines${NC}"
  echo -e "    ${W}frontend-developer${NC}       ${D}Web UIs, components, responsive design${NC}"
  echo -e "    ${W}mobile-app-builder${NC}       ${D}iOS/Android app development${NC}"
  echo -e "    ${W}rapid-prototyper${NC}         ${D}Quick MVPs and proof-of-concept builds${NC}"
  echo -e "    ${W}security-engineer${NC}        ${D}Security audits, threat modeling, hardening${NC}"
  echo -e "    ${W}senior-developer${NC}         ${D}Full-stack development, code review, mentoring${NC}"
  echo ""

  echo -e "  ${Y}${BOLD}MARKETING${NC} ${D}(11)${NC}"
  echo -e "    ${W}app-store-optimizer${NC}      ${D}ASO, store listings, keyword optimization${NC}"
  echo -e "    ${W}content-creator${NC}          ${D}Blog posts, copywriting, content strategy${NC}"
  echo -e "    ${W}growth-hacker${NC}            ${D}Growth experiments, funnels, acquisition${NC}"
  echo -e "    ${W}instagram-curator${NC}        ${D}Instagram content, stories, engagement${NC}"
  echo -e "    ${W}reddit-community-builder${NC} ${D}Reddit presence, community management${NC}"
  echo -e "    ${W}social-media-strategist${NC}  ${D}Cross-platform social media planning${NC}"
  echo -e "    ${W}tiktok-strategist${NC}        ${D}TikTok content, trends, viral strategies${NC}"
  echo -e "    ${W}twitter-engager${NC}          ${D}Twitter/X engagement, threads, audience growth${NC}"
  echo -e "    ${W}wechat-official-account${NC}  ${D}WeChat content and account management${NC}"
  echo -e "    ${W}xiaohongshu-specialist${NC}   ${D}Xiaohongshu/RED content and marketing${NC}"
  echo -e "    ${W}zhihu-strategist${NC}         ${D}Zhihu Q&A, articles, thought leadership${NC}"
  echo ""

  echo -e "  ${C}${BOLD}PRODUCT${NC} ${D}(3)${NC}"
  echo -e "    ${W}feedback-synthesizer${NC}     ${D}User feedback analysis and prioritization${NC}"
  echo -e "    ${W}sprint-prioritizer${NC}       ${D}Sprint planning, backlog prioritization${NC}"
  echo -e "    ${W}trend-researcher${NC}         ${D}Market trends, competitive intelligence${NC}"
  echo ""

  echo -e "  ${M}${BOLD}PROJECT MANAGEMENT${NC} ${D}(5)${NC}"
  echo -e "    ${W}experiment-tracker${NC}       ${D}A/B tests, experiment management, results${NC}"
  echo -e "    ${W}project-shepherd${NC}         ${D}Project oversight, milestones, risk tracking${NC}"
  echo -e "    ${W}studio-operations${NC}        ${D}Studio workflow and operations management${NC}"
  echo -e "    ${W}studio-producer${NC}          ${D}Production scheduling and resource coordination${NC}"
  echo -e "    ${W}senior-project-manager${NC}   ${D}End-to-end project delivery and governance${NC}"
  echo ""

  echo -e "  ${C}${BOLD}SPATIAL COMPUTING${NC} ${D}(6)${NC}"
  echo -e "    ${W}macos-spatial-metal-engineer${NC}  ${D}Metal shaders, macOS spatial rendering${NC}"
  echo -e "    ${W}terminal-integration-specialist${NC} ${D}Terminal integration for spatial apps${NC}"
  echo -e "    ${W}visionos-spatial-engineer${NC}     ${D}visionOS spatial app development${NC}"
  echo -e "    ${W}xr-cockpit-interaction-specialist${NC} ${D}XR cockpit UI and interaction design${NC}"
  echo -e "    ${W}xr-immersive-developer${NC}        ${D}Immersive XR experiences and environments${NC}"
  echo -e "    ${W}xr-interface-architect${NC}         ${D}XR interface systems and spatial UX${NC}"
  echo ""

  echo -e "  ${G}${BOLD}SPECIALIZED${NC} ${D}(7)${NC}"
  echo -e "    ${W}agentic-identity-trust${NC}   ${D}Agent identity, trust, and authentication${NC}"
  echo -e "    ${W}agents-orchestrator${NC}      ${D}Multi-agent coordination and orchestration${NC}"
  echo -e "    ${W}data-analytics-reporter${NC}  ${D}Data analysis, dashboards, reporting${NC}"
  echo -e "    ${W}data-consolidation-agent${NC} ${D}Data merging, deduplication, normalization${NC}"
  echo -e "    ${W}lsp-index-engineer${NC}       ${D}Language server protocol and code indexing${NC}"
  echo -e "    ${W}report-distribution-agent${NC} ${D}Automated report generation and delivery${NC}"
  echo -e "    ${W}sales-data-extraction-agent${NC} ${D}Sales data extraction and pipeline management${NC}"
  echo ""

  echo -e "  ${Y}${BOLD}STRATEGY${NC}"
  echo -e "    ${W}NEXUS framework${NC}          ${D}Playbooks, runbooks, coordination strategies${NC}"
  echo ""

  echo -e "  ${B}${BOLD}SUPPORT${NC} ${D}(6)${NC}"
  echo -e "    ${W}analytics-reporter${NC}       ${D}Analytics dashboards and automated reports${NC}"
  echo -e "    ${W}executive-summary-generator${NC} ${D}Executive summaries and stakeholder briefs${NC}"
  echo -e "    ${W}finance-tracker${NC}          ${D}Budget tracking, financial reporting${NC}"
  echo -e "    ${W}infrastructure-maintainer${NC} ${D}Infrastructure health, updates, maintenance${NC}"
  echo -e "    ${W}legal-compliance-checker${NC}  ${D}Legal review, compliance, regulatory checks${NC}"
  echo -e "    ${W}support-responder${NC}        ${D}Customer support, ticket resolution${NC}"
  echo ""

  echo -e "  ${G}${BOLD}TESTING${NC} ${D}(8)${NC}"
  echo -e "    ${W}accessibility-auditor${NC}    ${D}WCAG audits, a11y testing, remediation${NC}"
  echo -e "    ${W}api-tester${NC}               ${D}API testing, contract validation, load tests${NC}"
  echo -e "    ${W}evidence-collector${NC}       ${D}Test evidence gathering and documentation${NC}"
  echo -e "    ${W}performance-benchmarker${NC}  ${D}Performance testing, benchmarks, profiling${NC}"
  echo -e "    ${W}reality-checker${NC}          ${D}Assumption validation, sanity checks${NC}"
  echo -e "    ${W}test-results-analyzer${NC}    ${D}Test result analysis and trend reporting${NC}"
  echo -e "    ${W}tool-evaluator${NC}           ${D}Tool comparison, evaluation, recommendations${NC}"
  echo -e "    ${W}workflow-optimizer${NC}       ${D}Workflow analysis and process improvement${NC}"
  echo ""

  echo -e "  ${D}b  Volver${NC}"
  echo ""
  echo -ne "  ${BOLD}Elige opcion: ${NC}"
  read -r choice

  case "$choice" in
    b|B) main_menu ;;
    *) agent_catalog_menu ;;
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
  echo ""
  echo -e "  ${W}${BOLD}CONOCIMIENTO${NC}"
  echo -e "  ${Y}k${NC}  ${G}Part B E2E Patterns${NC}      ${D}12 patrones reutilizables para testing Part B${NC}"
  echo -e "  ${Y}r${NC}  CI Routing Report         ${D}Reporte final: 39/39 tareas completadas${NC}"
  echo ""
  echo -e "  ${W}${BOLD}ACCESOS RAPIDOS${NC}"
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
    k|K) less "$BASE/countries/jamaica/testing/knowledge/partb-e2e-patterns.md" && jamaica_menu ;;
    r|R) less "$BASE/shared/responses/test-coordinator_007.md" && jamaica_menu ;;
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
