/* ============================================================
   eRegistrations Agent Hub — Unified Dashboard v2
   Showcase: Overview | Agents | Chat | Toolkit
   2026-03-01
   ============================================================ */

function AgentDashboard() {
  var React = window.React || require("react");
  var useState = React.useState;

  // ── State ──────────────────────────────────────────────────
  var _tab = useState(0);
  var activeTab = _tab[0], setActiveTab = _tab[1];
  var _dark = useState(true);
  var dark = _dark[0], setDark = _dark[1];
  var _toolkitSub = useState(0);
  var toolkitSub = _toolkitSub[0], setToolkitSub = _toolkitSub[1];
  var _search = useState("");
  var search = _search[0], setSearch = _search[1];
  // Expose tab setter for hash-based deep links
  if (typeof window !== "undefined") { window.__setTab = setActiveTab; }

  var _filter = useState("all");
  var filter = _filter[0], setFilter = _filter[1];
  var _expandedSkills = useState({});
  var expandedSkills = _expandedSkills[0], setExpandedSkills = _expandedSkills[1];
  var _expandedMcp = useState({});
  var expandedMcp = _expandedMcp[0], setExpandedMcp = _expandedMcp[1];
  var _mcpSearch = useState("");
  var mcpSearch = _mcpSearch[0], setMcpSearch = _mcpSearch[1];
  var _bmState = useState("idle");
  var bmState = _bmState[0], setBmState = _bmState[1];
  var _bmCode = useState("");
  var bmCode = _bmCode[0], setBmCode = _bmCode[1];

  // ── Theme ──────────────────────────────────────────────────
  var t = dark
    ? { bg:"#0a0e1a", text:"#e2e8f0", card:"rgba(255,255,255,0.02)", cardBorder:"rgba(255,255,255,0.06)",
        sub:"#94a3b8", dim:"#64748b", codeBg:"rgba(0,0,0,0.3)", headerBg:"rgba(255,255,255,0.08)",
        bright:"#f8fafc", surface:"#1a1d27", surface2:"#222633", border:"#2d3348" }
    : { bg:"#f8fafc", text:"#1e293b", card:"#ffffff", cardBorder:"#e2e8f0",
        sub:"#64748b", dim:"#94a3b8", codeBg:"#f1f5f9", headerBg:"rgba(0,0,0,0.04)",
        bright:"#0f172a", surface:"#ffffff", surface2:"#f1f5f9", border:"#e2e8f0" };

  var C = {
    test:"#22d3ee", manual:"#a78bfa", config:"#fb923c", orchestrator:"#f472b6",
    observer:"#10b981", designer:"#f59e0b", filler:"#8b5cf6", accent:"#6c8cff", accent2:"#4ecdc4", accent3:"#ff6b9d",
    done:"#22c55e", warn:"#ffd54f", broken:"#ef4444",
  };

  var fontMono = "'JetBrains Mono','Fira Code','SF Mono',monospace";

  var TABS = [
    { label:"Overview", icon:"\u2302" },
    { label:"Agents", icon:"\u2699" },
    { label:"Chat", icon:"\u2709" },
    { label:"Toolkit", icon:"\u26A1" },
  ];

  // ── Helpers ────────────────────────────────────────────────
  var h = React.createElement;
  function safeLen(arr) { return arr ? arr.length : 0; }

  function cardStyle(extra) {
    var base = { background:t.card, border:"1px solid "+t.cardBorder, borderRadius:"12px", padding:"20px", marginBottom:"16px" };
    return extra ? Object.assign({}, base, extra) : base;
  }

  function badgeStyle(bg, fg) {
    return { display:"inline-block", padding:"2px 10px", borderRadius:"9999px", fontSize:"11px",
      fontWeight:"700", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase",
      background:bg, color:fg||"#000", marginRight:"6px", marginBottom:"4px" };
  }

  function sectionTitle(text) {
    return h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px",
      textTransform:"uppercase", color:t.dim, marginBottom:"12px", marginTop:"24px" }}, text);
  }

  function iconCircle(letter, color, size) {
    var s = size || 40;
    return h("div", { style:{ width:s+"px", height:s+"px", borderRadius:"50%",
      background:color+"22", border:"2px solid "+color, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:Math.round(s*0.4)+"px", fontWeight:"800",
      color:color, fontFamily:fontMono, flexShrink:0 }}, letter);
  }

  function dotStyle(color, size) {
    var s = size || 8;
    return { display:"inline-block", width:s+"px", height:s+"px", borderRadius:"50%",
      background:color, marginRight:"6px", flexShrink:0 };
  }

  function tag(label, color) {
    return h("span", { style:{ padding:"2px 10px", borderRadius:"12px", fontSize:"11px",
      fontWeight:"500", background:color+"18", color:color, border:"1px solid "+color+"40" }}, label);
  }

  // ══════════════════════════════════════════════════════════
  // AGENTS DATA
  // ══════════════════════════════════════════════════════════
  var agents = [
    { name:"Designer Agent", alias:"Architect", letter:"D", color:C.designer, dir:"designer/",
      desc:"Service design knowledge engine. Understands why services are configured the way they are, recognizes cross-service patterns, and defines proven configuration blueprints before implementation.",
      skills:["CI Selective Routing","Bitacora Connection Model","Workflow Architecture","Expirado Badge Pattern","Rosetta Stone"],
      skillFiles:[],
      mcpServers:[{name:"BPA-cuba",access:"read-only",tools:37},{name:"BPA-jamaica",access:"read-only",tools:16}],
      hooks:["SessionStart"],
      example:"Analyze the PARTB workflow: identify the 2-track pattern (main flow + CI loop), explain how OR determinants enable selective unit routing.",
    },
    { name:"Config Agent", alias:"Configurator", letter:"C", color:C.config, dir:"config/",
      desc:"Executes configurations based on Designer patterns. Creates bots, determinants, form components, effects, and component actions. Connects services together.",
      skills:["My Files Block Setup","Connect Service to Dashboard","Debug Service","Bot Configuration"],
      skillFiles:["setup-my-files-block.md","service-setup.md"],
      mcpServers:[{name:"BPA-cuba",access:"read/write",tools:82}],
      hooks:["SessionStart","PostToolUse","PreToolUse"],
      example:"Connect CENASA to the Bitacora: apply the Bitacora Connection pattern — create StatusBitacora determinant, INTERNO/LISTAR bots, EditGrid, and component actions.",
    },
    { name:"Test Agent", alias:"Verifier", letter:"T", color:C.test, dir:"testing/",
      desc:"Generates and runs end-to-end Playwright tests against production. Simulates real users filling forms, clicking buttons, and submitting applications.",
      skills:["Playwright E2E Test Generation","Page Object Patterns","Cuba E2E Service Test","Jamaica SEZ Form Fill & Submit"],
      skillFiles:["playwright-e2e.md","page-objects.md","cuba-e2e-service-test.md","jamaica-form-fill-submit.md"],
      mcpServers:[{name:"BPA-cuba",access:"read-only",tools:17}],
      hooks:["SessionStart","PostToolUse"],
      example:"Generate E2E tests for the Zoosanitario service, run them against production, and report pass/fail with screenshots.",
    },
    { name:"Manual Agent", alias:"Extractor", letter:"M", color:C.manual, dir:"manual/",
      desc:"Read-only MCP access across multiple country instances. Extracts live data, generates documentation, and detects changes between service versions.",
      skills:["Technical Documentation","Change Detection","Service Manual (Bitacora)","Service Manual (Direct)"],
      skillFiles:["documentation.md","change-detection.md"],
      mcpServers:[{name:"BPA-cuba",access:"read-only",tools:37},{name:"BPA-lesotho2",access:"read-only",tools:16},{name:"BPA-jamaica",access:"read-only",tools:16},{name:"BPA-colombia-test",access:"read-only",tools:16}],
      hooks:["SessionStart","PostToolUse","PreToolUse"],
      example:"Extract the complete structure of CENASA Zoosanitario: form hierarchy, 455 fields, 20 determinants, 10 bots.",
    },
    { name:"Observer Agent", alias:"Tracker", letter:"G", color:C.observer, dir:"observer/",
      desc:"Connects to Graylog for log analysis. Monitors bot executions, diagnoses failures, traces dossier lifecycles, and correlates E2E tests with backend activity.",
      skills:["Service Health Check","Trace Dossier Lifecycle","Bot Failure Report","Correlate E2E Tests with Logs"],
      skillFiles:["service-health-check.md","trace-dossier.md","bot-failure-report.md","correlate-test-logs.md"],
      mcpServers:[{name:"mcp-graylog",access:"read-only",tools:11},{name:"BPA-cuba",access:"read-only",tools:17}],
      hooks:["SessionStart"],
      example:"Find all bot failures in the last 24h, group by service, and recommend fixes for the top 3 issues.",
    },
    { name:"Form Filler Agent", alias:"AutoFiller", letter:"F", color:C.filler, dir:"bookmarklet/",
      desc:"Human-assist agent that lives in the browser. Helps consultants, testers, and demo presenters fill complex eRegistrations forms in one click. While the Test Agent runs autonomously via Playwright, the Form Filler works alongside the human — filling 100+ fields, uploading documents, and scanning keys so you can focus on the workflow, not the data entry.",
      skills:["Auto Fill (any form, zero setup)","Preset Fill (demo/test/edge scenarios)","File Upload via Form.io API","Key Scanner & Export","EditGrid/DataGrid Row Generation","Survey Auto-fill","Part A + Part B support"],
      skillFiles:[],
      mcpServers:[],
      hooks:[],
      example:"Open any eRegistrations form (Part A or Part B), click the bookmarklet, hit Auto Fill. All fields populated in one click. Then review, adjust, and submit — the human stays in control.",
    },
    { name:"Orchestrator", alias:"Coordinator", letter:"O", color:C.orchestrator, dir:"(root)",
      desc:"Coordinates all agents, decomposes complex tasks, generates SITREPs, and maintains project-wide knowledge. The entry point for multi-agent workflows.",
      skills:["Fix Determinant Effects","Agent Protocol"],
      skillFiles:[],
      mcpServers:[{name:"BPA-cuba",access:"ad-hoc"},{name:"BPA-lesotho2",access:"ad-hoc"}],
      hooks:["PreToolUse"],
      example:"Connect CENASA to Bitacora: decompose into Manual extraction → Designer review → Config setup → Test validation, coordinating all agents.",
    },
  ];

  // ══════════════════════════════════════════════════════════
  // SKILLS DATA (for Toolkit tab)
  // ══════════════════════════════════════════════════════════
  var skillCategories = [
    { name:"Config Agent Skills", color:C.config, icon:"\u2699", count:2, intro:"Read/write BPA admin API. Create bots, form components, conditional logic, connect services.",
      skills:[
        { name:"Setup: My Files Block — Query, View & Delegate", file:"config/setup-my-files-block.md", dl:"setup-my-files-block.md",
          summary:"Adds a complete 'My Files' block: query button, DataGrid table, view links, and email delegation. 16-step guide.",
          tags:["config","reusable"], featured:true,
          details:"Creates 2 bots (Get my files + Delegar file), a DataGrid with 14 columns, component actions, and all input/output mappings using save_all.",
          mcpTools:"muleservice_list, bot_create (x2), form_component_add (x15), componentaction_save (x2), bot_input_mapping_save_all, bot_output_mapping_save_all (x2), debug_scan, service_publish",
          searchKw:"my account query user files bot dossier delegate email share TOBE-17236" },
        { name:"Connect a Service to the Dashboard", file:"config/.claude/skills/service-setup.md", dl:"service-setup.md",
          summary:"Connects a new service to the central Bitacora dashboard. 8-step workflow: bots, determinants, EditGrid, component actions. Proven across 18 services.",
          tags:["config","reusable"],
          details:"Creates INTERNO bots, LISTAR bot, EditGrid table, conditional logic. NIT/Empresa keys vary per service.",
          mcpTools:"service_get, form_get, field_list, bot_create, bot_input_mapping_save_all, bot_output_mapping_save_all, componentaction_save, form_component_add, effect_create",
          searchKw:"bitacora hub interno listar editgrid component action mapping" },
      ]},
    { name:"Manual Agent Skills", color:C.manual, icon:"\uD83D\uDCD6", count:2, intro:"Read-only. Extracts data, generates docs, detects changes. Never modifies servers.",
      skills:[
        { name:"Technical Documentation for Government Services", file:"manual/.claude/skills/documentation.md", dl:"documentation.md",
          summary:"Generates user manuals (HTML or Markdown, 7 sections). Extracts live data from MCP: forms, roles, bots, determinants, print documents. Plain language, no jargon.",
          tags:["manual","reusable"],
          details:"7-section manual structure optimized for government readers. Verifies against production UI.",
          mcpTools:"service_get, form_get, form_query, role_list, bot_list, determinant_list, print_document_list",
          searchKw:"documentation technical user manual html markdown government" },
        { name:"Change Detection Between Service Versions", file:"manual/.claude/skills/change-detection.md", dl:"change-detection.md",
          summary:"Detects changes between two points in time, or compares across instances (Cuba vs Jamaica). Structured reports: Added / Removed / Modified / Impact.",
          tags:["manual","reusable"],
          details:"Cross-instance comparison: match by NAME not ID. Distinguishes cosmetic from functional changes.",
          mcpTools:"service_get, form_get, determinant_list, bot_list, role_list",
          searchKw:"diff compare versions snapshot cross instance audit" },
      ]},
    { name:"Testing Agent Skills", color:C.test, icon:"\u2705", count:2, intro:"End-to-end tests using Playwright against production. Simulates real users.",
      skills:[
        { name:"Playwright E2E Test Generation for BPA Services", file:"testing/.claude/skills/playwright-e2e.md", dl:"playwright-e2e.md",
          summary:"Complete E2E tests: PRD, Page Object, spec file. Includes all eRegistrations patterns: Choices.js dropdowns, file uploads, Form.io JS API for hidden fields.",
          tags:["testing","reusable"],
          details:"5 platform patterns, complete selector reference, PRD generation methodology, 15+ mistakes to avoid.",
          mcpTools:"form_get, form_query, service_get",
          searchKw:"playwright e2e test generation choices.js dropdown file upload form.io prd spec" },
        { name:"Page Object Patterns for eRegistrations", file:"testing/.claude/skills/page-objects.md", dl:"page-objects.md",
          summary:"Page Object conventions: selector patterns, naming rules, eRegistrations-specific patterns (EditGrid async, hidden components, Choices.js wrappers).",
          tags:["testing","reusable"],
          details:"Selector patterns: [ref='key'], .formio-component-{key}. Naming conventions for files, classes, locators.",
          mcpTools:"form_get",
          searchKw:"page object playwright locator selector typescript" },
      ]},
    { name:"Observer Agent Skills", color:C.observer, icon:"\uD83D\uDC41", count:4, intro:"Graylog log analysis. Diagnose problems, verify backend processes, monitor health.",
      skills:[
        { name:"Bot Failure Report", file:"observer/.claude/skills/bot-failure-report.md", dl:"bot-failure-report.md",
          summary:"Finds all bot failures across services. Groups by bot and service, detects intermittent vs consistent patterns, generates recommendations.",
          tags:["observer","reusable"],
          mcpTools:"search_logs, get_error_logs",
          searchKw:"bot failure diagnostic errors grouped pattern intermittent" },
        { name:"Service Health Check", file:"observer/.claude/skills/service-health-check.md", dl:"service-health-check.md",
          summary:"Quick health assessment: log volume, error rate, failed bots, empty payloads, active users. Returns HEALTHY / WARNING / CRITICAL.",
          tags:["observer","reusable"],
          mcpTools:"search_logs, get_error_logs, search_stream_logs",
          searchKw:"health check graylog logs monitoring healthy warning critical" },
        { name:"Trace Dossier Lifecycle", file:"observer/.claude/skills/trace-dossier.md", dl:"trace-dossier.md",
          summary:"Follow a specific case/dossier from creation to current state. Shows the full bot execution chain with timestamps and highlights errors.",
          tags:["observer","reusable"],
          mcpTools:"search_logs",
          searchKw:"trace dossier lifecycle bot execution chain chronological" },
        { name:"Correlate E2E Tests with Backend Logs", file:"observer/.claude/skills/correlate-test-logs.md", dl:"correlate-test-logs.md",
          summary:"After running E2E tests, finds corresponding Graylog logs by time window, user, and service. Verdict: MATCH or MISMATCH.",
          tags:["observer","reusable"],
          mcpTools:"search_logs, bot_list, service_get",
          searchKw:"correlate test logs e2e backend verify match mismatch" },
      ]},
    { name:"Country-Specific Skills", color:C.warn, icon:"\uD83C\uDF0E", count:3, intro:"Tailored to specific country instances. Encode unique form structures, field keys, and UI behaviors.",
      skills:[
        { name:"Fix Determinant + Effect Linkages via REST API", file:"countries/cuba/skills/fix-determinant-effects/SKILL.md", dl:"cuba-fix-determinant-effects.md",
          summary:"Cuba-specific bulk fix for 18 services: REST API payloads for radio/grid determinants, Playwright scripts, service inventory.",
          tags:["country","config"],
          searchKw:"cuba fix determinant effect rest api statusbitacora bulk" },
        { name:"Cuba E2E Service Test — Form Fill & Submit", file:"countries/cuba/skills/e2e-service-test/SKILL.md", dl:"cuba-e2e-service-test.md",
          summary:"Complete front-office test automation: 9-step process, 13 helpers, 5-phase adaptation guide, Cuba vs Jamaica comparison.",
          tags:["country","testing"],
          searchKw:"cuba e2e service test form fill submit automation" },
        { name:"Jamaica SEZ — Form Fill & Submit Automation", file:"countries/jamaica/skills/form-fill-submit/SKILL.md", dl:"jamaica-form-fill-submit.md",
          summary:"Complete front-office automation: 7-tab form, 30+ file uploads, DOM browse map, hidden required fields, all platform patterns.",
          tags:["country","testing"],
          searchKw:"jamaica sez zone form fill submit multi-tab upload" },
      ]},
    { name:"Slash Commands", color:C.accent3, icon:"\u26A1", count:11, intro:"One-click actions invoked via /command-name in Claude Code.",
      skills:[
        { name:"/check-bpa — Check BPA Connection Status", file:".claude/commands/check-bpa.md", dl:"check-bpa.md",
          summary:"Verifies MCP connections across all instances. Reports status table, auto-retries authentication.", tags:["command","reusable"],
          mcpTools:"connection_status, service_list, auth_login", searchKw:"check bpa status connection health" },
        { name:"/connect-service — Connect Service to Dashboard", file:".claude/commands/connect-service.md", dl:"connect-service.md",
          summary:"Complete dashboard connection: 10-step workflow creating INTERNO bots, LISTAR bot, EditGrid, and component actions.", tags:["command","config"],
          mcpTools:"connection_status, service_get, bot_create, form_component_add, componentaction_save", searchKw:"connect service bitacora hub" },
        { name:"/debug-service — Debug an eRegistrations Service", file:".claude/commands/debug-service.md", dl:"debug-service.md",
          summary:"Full 6-step diagnostic: scan, group, investigate, plan, report. Asks before applying fixes.", tags:["command","reusable"],
          mcpTools:"debug_scan, debug_group_issues, debug_investigate, debug_plan", searchKw:"debug service scan investigate" },
        { name:"/my-files-block — Setup: My Files Block", file:".claude/commands/my-files-block.md", dl:"my-files-block.md",
          summary:"21-step workflow: 'My Files' panel with query, view links, email delegation. 2 bots, DataGrid, optional badge.", tags:["command","config","reusable"],
          mcpTools:"muleservice_list, bot_create, form_component_add, componentaction_save, bot_input_mapping_save_all", searchKw:"my files block query view delegate" },
        { name:"/service-health — Service Health Check", file:".claude/commands/service-health.md", dl:"service-health.md",
          summary:"Quick 24h snapshot: log volume, error rate, failed bots. HEALTHY / WARNING / CRITICAL.", tags:["command","observer","reusable"],
          mcpTools:"search_logs, get_error_logs", searchKw:"service health check graylog" },
        { name:"/trace-dossier — Trace Dossier Lifecycle", file:".claude/commands/trace-dossier.md", dl:"trace-dossier.md",
          summary:"Follow a dossier through its lifecycle via Graylog logs. Chronological bot execution chain.", tags:["command","observer","reusable"],
          mcpTools:"search_logs, search_stream_logs", searchKw:"trace dossier lifecycle" },
        { name:"/bot-failures — Bot Failure Report", file:".claude/commands/bot-failures.md", dl:"bot-failures.md",
          summary:"Find all bot failures: groups by bot/service, counts, detects intermittent vs consistent. Recommendations.", tags:["command","observer","reusable"],
          mcpTools:"search_logs, get_error_logs", searchKw:"bot failures report diagnostic" },
        { name:"/generate-docs — Generate Service Documentation", file:".claude/commands/generate-docs.md", dl:"generate-docs.md",
          summary:"Extracts live structure via MCP, generates user manual (HTML) or technical doc (Markdown).", tags:["command","manual","reusable"],
          mcpTools:"service_get, form_get, determinant_list, bot_list, role_list", searchKw:"generate docs documentation manual" },
        { name:"/change-detection — Compare Service Versions", file:".claude/commands/change-detection.md", dl:"cmd-change-detection.md",
          summary:"Detect changes over time or across instances. Diffs components, determinants, bots, roles. Impact report.", tags:["command","manual","reusable"],
          mcpTools:"service_get, form_get, determinant_list, bot_list", searchKw:"change detection diff compare" },
        { name:"/e2e-test — Generate & Run E2E Tests", file:".claude/commands/e2e-test.md", dl:"e2e-test.md",
          summary:"Complete Playwright pipeline: extract, PRD, Page Object, spec, run until 100% pass. eRegistrations patterns included.", tags:["command","testing","reusable"],
          mcpTools:"service_get, form_get, determinant_list", searchKw:"e2e test playwright generate" },
        { name:"/correlate-logs — Correlate Tests with Backend Logs", file:".claude/commands/correlate-logs.md", dl:"correlate-logs.md",
          summary:"After E2E tests, find Graylog logs within ±5 min window. MATCH or MISMATCH verdict.", tags:["command","observer","reusable"],
          mcpTools:"search_logs, search_stream_logs", searchKw:"correlate logs e2e backend" },
      ]},
  ];

  // ══════════════════════════════════════════════════════════
  // WORKFLOWS DATA
  // ══════════════════════════════════════════════════════════
  var workflows = [
    { name:"Configure a Service from Scratch", desc:"Set up a new government service in BPA, from creation to live deployment.",
      steps:[
        { n:1, label:"Create Service", detail:"Define name, registration, institution", color:C.config },
        { n:2, label:"Build Form", detail:"Add panels, fields, grids, upload areas", color:C.config },
        { n:3, label:"Add Roles", detail:"Define workflow: who approves what", color:C.config },
        { n:4, label:"Configure Bots", detail:"Connect to GDB APIs and external services", color:C.config },
        { n:5, label:"Publish & Verify", detail:"Publish, then run debug scan", color:C.test },
      ],
      uses:["service-setup skill","/debug-service","MCP: service_create, form_component_add, role_create, bot_create"] },
    { name:"Link a Service to the Dashboard", desc:"Connect an existing service to the Bitacora so all cases appear in one view.",
      steps:[
        { n:1, label:"Pre-flight", detail:"Verify field keys & existing components", color:C.manual },
        { n:2, label:"Determinant", detail:"Create StatusBitacora radio determinant", color:C.config },
        { n:3, label:"Bots", detail:"Create INTERNO + LISTAR with mappings", color:C.config },
        { n:4, label:"EditGrid", detail:"Add table + button + component actions", color:C.config },
        { n:5, label:"Verify", detail:"Publish & test from applicant view", color:C.test },
      ],
      uses:["service-setup skill","/connect-service","MCP: bot_create, effect_create, componentaction_save"] },
    { name:"Test a Service End-to-End", desc:"Generate and run a complete test simulating a real applicant, then verify backend processing.",
      steps:[
        { n:1, label:"Extract Structure", detail:"Pull form schema via MCP", color:C.manual },
        { n:2, label:"Generate PRD", detail:"User stories + acceptance criteria", color:C.test },
        { n:3, label:"Write Tests", detail:"Page Object + spec file", color:C.test },
        { n:4, label:"Run Tests", detail:"Execute via Playwright against production", color:C.test },
        { n:5, label:"Correlate Logs", detail:"Match test results with Graylog", color:C.observer },
      ],
      uses:["playwright-e2e skill","page-objects skill","correlate-test-logs skill"] },
    { name:"Create a Service Manual", desc:"Generate a complete user manual for government officials and applicants.",
      steps:[
        { n:1, label:"Extract Data", detail:"Pull service, form, roles, bots via MCP", color:C.manual },
        { n:2, label:"Analyze Structure", detail:"Map workflow, identify key fields", color:C.manual },
        { n:3, label:"Generate Doc", detail:"7-section manual in HTML or Markdown", color:C.manual },
        { n:4, label:"Review", detail:"Cross-check against live production UI", color:C.manual },
      ],
      uses:["documentation skill","MCP: service_get, form_get, role_list, bot_list"] },
    { name:"Submit Files via API (Fast)", desc:"Create and submit files using the backend API with iterative validation. Best for: bulk submissions (3+ files), CI/CD pipelines, speed-critical tasks. ~30 sec per file.",
      steps:[
        { n:1, label:"Create File", detail:"POST /backend/files with serviceId", color:C.test },
        { n:2, label:"Load Form Data", detail:"Navigate to form, extract submission.data", color:C.test },
        { n:3, label:"Iterative Submit", detail:"POST start_process → fix 400 errors → retry", color:C.test },
        { n:4, label:"Process Pipeline", detail:"DocCheck → evals → approvals via Playwright", color:C.test },
        { n:5, label:"Verify", detail:"Confirm file reached target role (e.g. ARC)", color:C.test },
      ],
      uses:["main-3files-to-arc spec","iterative submit pattern","Playwright for back-office roles"] },
    { name:"Submit Files via UI (Realistic)", desc:"Fill and submit files through the actual UI with Playwright interactions. Best for: demo recordings, UX validation, single file tests, production smoke tests. ~5-8 min per file.",
      steps:[
        { n:1, label:"Navigate Form", detail:"Open service URL, wait for Formio load", color:C.test },
        { n:2, label:"Fill Fields", detail:"Formio setValue + upload docs via filechooser", color:C.test },
        { n:3, label:"Consent & Send", detail:"Navigate to Send tab, check boxes, click Submit", color:C.test },
        { n:4, label:"Process Pipeline", detail:"DocCheck → evals → approvals via Playwright", color:C.test },
        { n:5, label:"Verify", detail:"Confirm file reached target role (e.g. ARC)", color:C.test },
      ],
      uses:["fix-and-submit spec","form filler bookmarklet","Playwright headed mode"] },
  ];

  // ══════════════════════════════════════════════════════════
  // MCP REFERENCE DATA
  // ══════════════════════════════════════════════════════════
  var mcpCategories = [
    { name:"Service Management", count:11, desc:"Create, configure, manage lifecycle.",
      tools:[
        ["service_list","List all services","ok"],["service_get","Get complete details","ok"],["service_create","Create service","ok"],
        ["service_update","Update metadata","ok"],["service_publish","Publish to frontend","ok"],["service_activate","Activate/deactivate","ok"],
        ["service_delete","Delete service (destructive)","ok"],["service_export_raw","Export as JSON","ok"],["service_to_yaml","Transform to YAML","ok"],
        ["service_copy","Clone service","ok"],["analyze_service","AI-optimized analysis","ok"],
      ]},
    { name:"Form & Components", count:10, desc:"Form schemas, panels, fields, grids, buttons.",
      tools:[
        ["form_get","Get form schema","ok"],["form_query","Selectively query components","ok"],["form_update","Update entire schema","ok"],
        ["form_component_get","Get component details","ok"],["form_component_add","Add component","ok"],["form_component_update","Update component","ok"],
        ["form_component_remove","Delete component","ok"],["form_component_move","Move/copy component","ok"],
        ["field_list","List fields with filtering","ok"],["field_get","Get field by key","ok"],
      ]},
    { name:"Determinants (Conditional Logic)", count:12, desc:"Business rules controlling visibility.",
      tools:[
        ["determinant_list","List all determinants","ok"],["determinant_get","Get details","partial"],["determinant_search","Search by criteria","ok"],
        ["determinant_delete","Delete determinant","ok"],["textdeterminant_create","Text comparison","ok"],["textdeterminant_update","Update text det","ok"],
        ["numericdeterminant_create","Numeric comparison","ok"],["booleandeterminant_create","Checkbox true/false","ok"],
        ["classificationdeterminant_create","Catalog matching","ok"],["selectdeterminant_create","Select/radio","broken"],
        ["griddeterminant_create","Grid row conditions","broken"],["datedeterminant_create","Date comparison","broken"],
      ]},
    { name:"Behaviours & Effects", count:5, desc:"Link determinants to components.",
      tools:[
        ["componentbehaviour_list","List behaviours","ok"],["componentbehaviour_get","Get by ID","partial"],
        ["componentbehaviour_get_by_component","Get for component","partial"],["effect_create","Create effect","ok"],["effect_delete","Delete effect","ok"],
      ]},
    { name:"Component Actions", count:6, desc:"Link buttons to bot execution.",
      tools:[
        ["componentaction_get","Get by ID","ok"],["componentaction_get_by_component","Get for component","ok"],
        ["componentaction_get_system_actions","List built-in actions","ok"],["componentaction_save","Save/link bot actions","ok"],
        ["componentaction_update","Update actions","ok"],["componentaction_delete","Remove actions","ok"],
      ]},
    { name:"Bots & Mappings", count:24, desc:"Bots execute integrations. Mappings connect form fields to bot I/O.",
      tools:[
        ["bot_list","List bots","ok"],["bot_get","Get details","ok"],["bot_create","Create bot","ok"],["bot_update","Update","ok"],
        ["bot_delete","Delete bot","ok"],["bot_validate","Verify GDB service","ok"],["bot_clone","Clone with mappings","ok"],
        ["bot_upgrade_version","Upgrade API version","ok"],["bot_history_list","Revision history","ok"],["bot_history_revert","Revert revision","ok"],
        ["bot_input_mapping_list","List inputs","ok"],["bot_input_mapping_create","Create input","partial"],
        ["bot_input_mapping_update","Update input","ok"],["bot_input_mapping_delete","Delete input","ok"],
        ["bot_input_mapping_save_all","Replace ALL inputs","ok"],["bot_output_mapping_list","List outputs","ok"],
        ["bot_output_mapping_create","Create output","partial"],["bot_output_mapping_update","Update output","ok"],
        ["bot_output_mapping_delete","Delete output","ok"],["bot_output_mapping_save_all","Replace ALL outputs","ok"],
        ["bot_mapping_summary","Diagnose health","ok"],["bot_suggest_mappings","Suggest by comparing","ok"],
        ["bot_input_visibility_update","Control input visibility","ok"],["bot_output_visibility_update","Control output visibility","ok"],
      ]},
    { name:"Roles & Workflow", count:14, desc:"Approval pipeline definition.",
      tools:[
        ["role_list","List roles","ok"],["role_get","Get with statuses","ok"],["role_create","Create role","ok"],["role_update","Update role","ok"],
        ["rolestatus_get","Get transition","ok"],["rolestatus_create","Create transition","ok"],["rolestatus_update","Update transition","ok"],
        ["rolestatus_delete","Delete transition","ok"],["roleinstitution_create","Assign institution","ok"],["roleregistration_create","Assign registration","ok"],
        ["roleunit_list","List org units","ok"],["roleunit_get","Get unit details","ok"],["roleunit_create","Assign unit","ok"],["roleunit_delete","Remove unit","ok"],
      ]},
    { name:"Registrations & Institutions", count:10, desc:"Service variants and agencies.",
      tools:[
        ["registration_list","List registrations","ok"],["registration_get","Get details","ok"],["registration_create","Create","ok"],
        ["registration_activate","Activate/deactivate","ok"],["registration_delete","Delete","ok"],["serviceregistration_link","Link to service","ok"],
        ["institution_create","Create in Keycloak","ok"],["institution_discover","Find IDs","ok"],
        ["registrationinstitution_create","Assign institution","ok"],["registrationinstitution_delete","Remove assignment","ok"],
      ]},
    { name:"Classifications (Catalogs)", count:8, desc:"Lookup lists for dropdowns.",
      tools:[
        ["classification_list","List all","ok"],["classification_get","Get with entries","ok"],["classification_search","Search by name","ok"],
        ["classification_create","Create","ok"],["classification_update","Update entries","ok"],["classification_delete","Delete","ok"],
        ["classification_export_csv","Export CSV","ok"],["classification_apply_country_codes","Map to keys","ok"],
      ]},
    { name:"Print Documents & Certificates", count:14, desc:"Document templates for certificates.",
      tools:[
        ["print_document_list","List documents","ok"],["print_document_get","Get schema","ok"],["print_document_create","Create","ok"],
        ["print_document_update","Update metadata","ok"],["print_document_delete","Delete","ok"],["print_document_templates","List templates","ok"],
        ["print_document_component_get","Get component","ok"],["print_document_component_add","Add component","ok"],
        ["print_document_component_update","Update component","ok"],["print_document_component_remove","Delete component","ok"],
        ["print_document_component_move","Move component","ok"],["print_document_sort","Reorder","ok"],
        ["print_document_history","Revision history","ok"],["print_document_revert","Revert revision","ok"],
      ]},
    { name:"Debug & Repair", count:7, desc:"Health checks and issue detection.",
      tools:[
        ["debug_scan","Full service scan","ok"],["debug_investigate","Root cause analysis","ok"],["debug_group_issues","Group by criteria","ok"],
        ["debug_plan","Generate fix phases","ok"],["debug_verify","Verify with before/after","ok"],["debug_fix","Fix single issue","ok"],
        ["debug_fix_batch","Batch fixes with rollback","ok"],
      ]},
    { name:"Orchestrated Workflows (Arazzo)", count:13, desc:"Multi-step orchestrations.",
      tools:[
        ["workflow_list","List workflows","ok"],["workflow_describe","Get spec","ok"],["workflow_search","Search by keyword","ok"],
        ["workflow_execute","Run (supports dry-run)","ok"],["workflow_status","Check status","ok"],["workflow_cancel","Stop workflow","ok"],
        ["workflow_retry","Resume failed","ok"],["workflow_rollback","Rollback steps","ok"],["workflow_chain","Execute sequentially","ok"],
        ["workflow_start_interactive","Begin interactive","ok"],["workflow_continue","Provide value","ok"],
        ["workflow_confirm","Confirm and execute","ok"],["workflow_validate","Validate definitions","ok"],
      ]},
    { name:"Audit & Rollback", count:5, desc:"Change history and undo.",
      tools:[
        ["audit_list","List entries","ok"],["audit_get","Get full entry","ok"],["rollback","Undo operation","ok"],
        ["rollback_history","State change history","ok"],["rollback_cleanup","Delete old states","ok"],
      ]},
    { name:"Costs, Notifications, Messages, External", count:19, desc:"Fees, alerts, templates, integrations.",
      tools:[
        ["cost_create_fixed","Fixed fee","ok"],["cost_create_formula","Formula fee","ok"],["cost_update","Update cost","ok"],["cost_delete","Delete cost","ok"],
        ["notification_list","List notifications","ok"],["notification_create","Create trigger","ok"],
        ["message_list","List templates","ok"],["message_get","Get template","ok"],["message_create","Create template","ok"],
        ["message_update","Update template","ok"],["message_delete","Delete template","ok"],
        ["requirement_list","List doc types","ok"],["documentrequirement_list","List requirements","ok"],
        ["documentrequirement_create","Link requirement","ok"],["documentrequirement_update","Update","partial"],["documentrequirement_delete","Delete","ok"],
        ["muleservice_list","List external APIs","ok"],["muleservice_get","Get fields","ok"],["muleservice_discover","Find by category","ok"],
      ]},
    { name:"Connection & Authentication", count:6, desc:"Instance connections and auth.",
      tools:[
        ["auth_login","Authenticate","ok"],["connection_status","View state","ok"],["server_info","Instance metadata","ok"],
        ["instance_list","List instances","ok"],["instance_add","Register new","ok"],["instance_remove","Remove instance","ok"],
      ]},
  ];

  // ══════════════════════════════════════════════════════════
  // TAB 0: OVERVIEW
  // ══════════════════════════════════════════════════════════
  function renderOverview() {
    // Hero
    var hero = h("div", { style:Object.assign({}, cardStyle(), { borderLeft:"4px solid "+C.accent, padding:"32px" }) },
      h("div", { style:{ fontSize:"24px", fontWeight:"800", color:t.bright, marginBottom:"8px" }},
        "eRegistrations ", h("span", { style:{ color:C.accent }}, "Agent Hub")),
      h("div", { style:{ fontSize:"14px", color:t.sub, lineHeight:"1.7", maxWidth:"800px" }},
        "Design, configure, test, document, and monitor digital government services using AI agents. ",
        "Instead of manually clicking through admin panels, describe what you want and the agents handle the rest."),
      h("div", { style:{ display:"flex", gap:"24px", marginTop:"20px", flexWrap:"wrap" }},
        [{n:"7",l:"Agents"},{n:"24",l:"Skills"},{n:"4",l:"Workflows"},{n:"120+",l:"MCP Tools"},{n:"2",l:"Countries"}].map(function(s,i) {
          return h("div", { key:i, style:{ display:"flex", alignItems:"baseline", gap:"6px" }},
            h("span", { style:{ fontSize:"24px", fontWeight:"800", color:C.accent, fontFamily:fontMono }}, s.n),
            h("span", { style:{ fontSize:"12px", color:t.dim }}, s.l));
        }))
    );

    // 4 quadrants: what it does
    var quads = [
      { title:"Design", color:C.designer, items:["Analyze service architecture and workflow patterns","Define proven configuration patterns before implementation","Document reusable blueprints across countries and services"] },
      { title:"Configure", color:C.config, items:["Apply design patterns: create bots, determinants, and workflows","Connect services to the central dashboard","Set up conditional logic, effects, and component actions"] },
      { title:"Test & Verify", color:C.test, items:["Run end-to-end tests against production","Automate form fill, submit, and status checks","Correlate test results with backend logs"] },
      { title:"Document", color:C.manual, items:["Generate user manuals for government officers","Detect changes between service versions","Extract live data from any configured instance"] },
      { title:"Monitor", color:C.observer, items:["Check service health via Graylog logs","Find and diagnose bot failures","Trace a case through its full lifecycle"] },
    ];
    var quadGrid = h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginTop:"8px" }},
      quads.map(function(q, i) {
        return h("div", { key:i, style:Object.assign({}, cardStyle(), { borderTop:"3px solid "+q.color, marginBottom:"0" }) },
          h("div", { style:{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.05em", color:q.color, fontWeight:"700", marginBottom:"8px" }}, q.title),
          q.items.map(function(item, j) {
            return h("div", { key:j, style:{ padding:"3px 0 3px 14px", position:"relative", color:t.sub, fontSize:"13px" }},
              h("span", { style:{ position:"absolute", left:0, color:q.color, fontWeight:"600" }}, ">"), item);
          }));
      }));

    // How It Works (CENASA timeline)
    var demoPrompt = "Connect service CENASA Registro Zoosanitario to the Bitacora. Step 1: Manual Agent extracts structure. Step 2: Config Agent creates determinant + effect + panel. Step 3: Test Agent generates and runs E2E tests.";

    var timelineSteps = [
      { n:"1", agent:"Orchestrator", color:C.orchestrator, letter:"O", title:"Receives and decomposes the task",
        desc:"Analyzes the prompt, identifies 3 sub-tasks and launches agents in sequence.", produces:"Launches Manual Agent with specific prompt" },
      { n:"2", agent:"Manual Agent", color:C.manual, letter:"M", title:"Extracts service structure via MCP",
        desc:"Connects to BPA-cuba, executes service_get + form_get + field_list + bot_list for CENASA. Writes structured response.",
        produces:"shared/responses/manual-config_NNN.md" },
      { n:"3", agent:"Config Agent", color:C.config, letter:"C", title:"Configures determinant + effect + panel",
        desc:"Reads the extraction, identifies target block, creates StatusBitacora via REST API, creates effect + mustache panel.",
        produces:"Changes in BPA-cuba + updated CHANGELOG" },
      { n:"4", agent:"Test Agent", color:C.test, letter:"T", title:"Generates and runs E2E tests",
        desc:"Reads extraction + CHANGELOG. Generates Playwright spec: Bitacora -> company -> CENASA -> verifies Block12.",
        produces:"testing/tests/specs/cenasa.spec.ts + results" },
      { n:"5", agent:"Orchestrator", color:C.orchestrator, letter:"O", title:"Consolidates and reports",
        desc:"Receives results from all 3 agents. Updates MISSIONS.md, generates SITREP, refreshes dashboard.",
        produces:"SITREP + updated MISSIONS.md" },
    ];

    var timeline = h("div", { style:{ marginTop:"8px" }},
      sectionTitle("How it works — real example"),
      h("div", { style:Object.assign({}, cardStyle(), { borderLeft:"4px solid "+C.orchestrator }) },
        h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase", color:t.dim, marginBottom:"8px" }}, "EXACT PROMPT TO COORDINATOR"),
        h("div", { style:{ padding:"14px 16px", background:t.codeBg, borderRadius:"8px", border:"1px solid "+C.orchestrator+"44",
          fontSize:"13px", fontFamily:fontMono, color:C.orchestrator, lineHeight:"1.6", cursor:"pointer" },
          title:"Click to copy", onClick:function(){ if(navigator.clipboard) navigator.clipboard.writeText(demoPrompt); }},
          "> " + demoPrompt)
      ),
      h("div", { style:{ marginTop:"16px" }},
        timelineSteps.map(function(step, idx) {
          return h("div", { key:idx, style:{ display:"flex", gap:"16px" }},
            h("div", { style:{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:"40px" }},
              iconCircle(step.letter, step.color, 36),
              idx < timelineSteps.length - 1 ? h("div", { style:{ width:"2px", flex:1, background:step.color+"44", minHeight:"20px" }}) : null),
            h("div", { style:Object.assign({}, cardStyle(), { flex:1, borderLeft:"3px solid "+step.color, marginBottom:"12px" }) },
              h("div", { style:{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }},
                h("span", { style:badgeStyle(step.color+"33", step.color) }, "STEP " + step.n),
                h("span", { style:{ fontSize:"13px", fontWeight:"700", color:t.text, fontFamily:fontMono }}, step.agent)),
              h("div", { style:{ fontSize:"14px", fontWeight:"700", color:t.text, marginBottom:"6px" }}, step.title),
              h("div", { style:{ fontSize:"12px", color:t.sub, lineHeight:"1.6", marginBottom:"8px" }}, step.desc),
              h("div", { style:{ fontSize:"11px", color:C.done, fontFamily:fontMono }}, "Produces: " + step.produces)
            ));
        }))
    );

    // Getting started
    var gettingStarted = h("div", { style:{ marginTop:"8px" }},
      sectionTitle("Getting started"),
      h("div", { style:Object.assign({}, cardStyle()) },
        h("ol", { style:{ paddingLeft:"20px", color:t.sub, fontSize:"13px", lineHeight:"2" }},
          h("li", null, h("strong", null, "Install the MCP server"), ": ", h("code", { style:{ background:t.codeBg, padding:"2px 6px", borderRadius:"4px", fontFamily:fontMono, fontSize:"12px", color:C.accent2 }}, "npx mcp-eregistrations-bpa"), " — connects your AI agent to the BPA admin API"),
          h("li", null, h("strong", null, "Download skills from the Toolkit tab"), " — each skill card has a Download .md button"),
          h("li", null, h("strong", null, "Place the .md files"), " in ", h("code", { style:{ background:t.codeBg, padding:"2px 6px", borderRadius:"4px", fontFamily:fontMono, fontSize:"12px", color:C.accent2 }}, ".claude/skills/"), " or ", h("code", { style:{ background:t.codeBg, padding:"2px 6px", borderRadius:"4px", fontFamily:fontMono, fontSize:"12px", color:C.accent2 }}, ".claude/commands/")),
          h("li", null, h("strong", null, "Describe what you want"), ": \"Add a My Files block to this service\" — the agent picks the right skill"),
          h("li", null, h("strong", null, "Check the Workflows"), " in the Toolkit tab for step-by-step guides")))
    );

    // Skills vs MCP
    var skillsVsMcp = h("div", { style:Object.assign({}, cardStyle(), { marginTop:"0" }) },
      h("div", { style:{ fontSize:"14px", fontWeight:"700", color:t.text, marginBottom:"10px" }}, "Skills vs MCP Tools"),
      h("div", { style:{ fontSize:"13px", color:t.sub, lineHeight:"1.7" }},
        h("strong", null, "Skills"), " are structured instructions that teach the agent how to accomplish a complete task. They combine multiple tool calls, domain knowledge, and verification steps. ",
        h("strong", null, "MCP tools"), " are the 120+ individual API operations used under the hood. Skills = recipes, MCP tools = ingredients. ",
        h("strong", null, "Most users only need skills and workflows."))
    );

    return h("div", null, hero, quadGrid, timeline, gettingStarted, skillsVsMcp);
  }

  // ══════════════════════════════════════════════════════════
  // TAB 1: AGENTS
  // ══════════════════════════════════════════════════════════
  function renderAgents() {
    return h("div", null,
      sectionTitle("5 Specialized Agents"),
      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr", gap:"16px" }},
        agents.map(function(ag, i) {
          return h("div", { key:i, style:Object.assign({}, cardStyle(), { borderLeft:"4px solid "+ag.color, marginBottom:"0" }) },
            // Header
            h("div", { style:{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }},
              iconCircle(ag.letter, ag.color, 48),
              h("div", null,
                h("div", { style:{ fontSize:"16px", fontWeight:"800", color:t.text, fontFamily:fontMono }}, ag.name),
                h("div", { style:{ fontSize:"12px", color:ag.color, fontFamily:fontMono }}, ag.alias + " | " + ag.dir))),
            // Description
            h("div", { style:{ fontSize:"13px", color:t.sub, lineHeight:"1.7", marginBottom:"16px" }}, ag.desc),
            // Skills
            h("div", { style:{ marginBottom:"16px" }},
              h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase", color:t.dim, marginBottom:"8px" }}, "SKILLS (" + safeLen(ag.skills) + ")"),
              h("div", { style:{ display:"flex", gap:"6px", flexWrap:"wrap" }},
                ag.skills.map(function(sk, j) {
                  var dlFile = ag.skillFiles && ag.skillFiles[j];
                  return h("span", { key:j, style:{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"4px 10px",
                    background:ag.color+"15", border:"1px solid "+ag.color+"30", borderRadius:"8px", fontSize:"12px", color:ag.color }},
                    sk,
                    dlFile ? h("a", { href:"skills/"+dlFile, download:dlFile,
                      style:{ color:C.accent2, fontSize:"10px", marginLeft:"4px", textDecoration:"none" },
                      onClick:function(e){ e.stopPropagation(); }}, "\u2B07") : null);
                }))),
            // MCP Servers
            h("div", { style:{ marginBottom:"16px" }},
              h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase", color:t.dim, marginBottom:"8px" }}, "MCP SERVERS"),
              h("div", { style:{ display:"flex", gap:"8px", flexWrap:"wrap" }},
                ag.mcpServers.map(function(s, j) {
                  return h("span", { key:j, style:{ padding:"4px 10px", background:t.codeBg, borderRadius:"6px", fontSize:"11px", fontFamily:fontMono, color:t.sub }},
                    s.name + " (" + s.access + (s.tools ? ", " + s.tools + " tools" : "") + ")");
                }))),
            // Hooks
            h("div", { style:{ marginBottom:"16px" }},
              h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase", color:t.dim, marginBottom:"8px" }}, "HOOKS"),
              h("div", { style:{ display:"flex", gap:"6px", flexWrap:"wrap" }},
                ag.hooks.map(function(hk, j) {
                  return h("span", { key:j, style:badgeStyle(t.codeBg, t.sub) }, hk);
                }))),
            // Example prompt
            h("div", null,
              h("div", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", textTransform:"uppercase", color:t.dim, marginBottom:"8px" }}, "EXAMPLE PROMPT"),
              h("div", { style:{ padding:"12px 16px", background:t.codeBg, borderRadius:"8px", border:"1px solid "+ag.color+"33",
                fontSize:"12px", fontFamily:fontMono, color:ag.color, lineHeight:"1.6", cursor:"pointer" },
                title:"Click to copy", onClick:function(){ if(navigator.clipboard) navigator.clipboard.writeText(ag.example); }},
                "> " + ag.example))
          );
        }))
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB 2: CHAT
  // ══════════════════════════════════════════════════════════
  function renderChat() {
    var msgs = (typeof CHAT_DATA !== "undefined") ? CHAT_DATA : [];

    function agentColor(name) {
      if (name.indexOf("Test") >= 0) return C.test;
      if (name.indexOf("Manual") >= 0) return C.manual;
      if (name.indexOf("Config") >= 0) return C.config;
      if (name.indexOf("Observer") >= 0) return C.observer;
      return C.orchestrator;
    }

    function dateSeparator(dateStr) {
      return h("div", { style:{ display:"flex", alignItems:"center", gap:"16px", margin:"20px 0 16px" }},
        h("div", { style:{ flex:1, height:"1px", background:t.cardBorder }}),
        h("span", { style:{ fontSize:"11px", fontFamily:fontMono, letterSpacing:"2px", color:t.dim,
          padding:"4px 16px", background:dark?"rgba(10,14,26,0.9)":"#e2e8f0", borderRadius:"12px",
          border:"1px solid "+t.cardBorder }}, dateStr),
        h("div", { style:{ flex:1, height:"1px", background:t.cardBorder }}));
    }

    var firstSender = msgs.length > 0 ? msgs[0].from : "";

    function chatBubble(msg, idx) {
      var color = msg.fromColor || agentColor(msg.from);
      var letter = msg.fromLetter || msg.from[0];
      var isRight = msg.from !== firstSender;

      var itemEls = [];
      if (msg.items) {
        for (var k = 0; k < msg.items.length; k++) {
          itemEls.push(h("div", { key:"bi-"+k, style:{ fontSize:"12px", color:dark?"#cbd5e1":"#475569",
            padding:"4px 0 4px 12px", borderLeft:"2px solid "+color+"55", marginBottom:"2px" }}, msg.items[k]));
        }
      }

      var bubbleRadius = isRight ? "12px 4px 12px 12px" : "4px 12px 12px 12px";
      var avatar = iconCircle(letter, color, 38);

      var nameRow = h("div", { style:{ display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"5px",
          flexDirection:isRight?"row-reverse":"row" }},
        h("span", { style:{ fontSize:"13px", fontWeight:"700", fontFamily:fontMono, color:color }}, msg.from),
        h("span", { style:{ fontSize:"10px", fontFamily:fontMono, color:t.dim, padding:"1px 8px",
          background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderRadius:"4px" }}, "\u2192 " + msg.to),
        h("span", { style:{ fontSize:"11px", color:t.dim, fontFamily:fontMono }}, msg.time || ""));

      var bubble = h("div", { style:{ background:dark?color+"15":color+"0c", border:"1px solid "+color+"30",
          borderRadius:bubbleRadius, padding:"14px 18px" }},
        h("div", { style:{ fontSize:"14px", fontWeight:"700", color:t.text, marginBottom:"8px" }}, msg.subject),
        msg.body && msg.body !== "(see attached file)" ? h("div", { style:{ fontSize:"13px", color:t.sub, lineHeight:"1.7",
          marginBottom:itemEls.length > 0 ? "12px" : "0" }}, msg.body) : null,
        itemEls.length > 0 ? h("div", { style:{ marginTop:"6px" }}, itemEls) : null);

      var attachment = msg.file ? h("div", { style:{ marginTop:"8px", display:"flex",
          justifyContent:isRight?"flex-end":"flex-start" }},
        h("span", { style:{ fontSize:"11px", fontFamily:fontMono, color:color, padding:"5px 14px",
          borderRadius:"8px", background:dark?color+"18":color+"10", border:"1px solid "+color+"33",
          display:"inline-flex", alignItems:"center", gap:"6px" }}, "\uD83D\uDCCE " + msg.file)) : null;

      var bubbleWrapper = h("div", { style:{ flex:1, maxWidth:"75%" }}, nameRow, bubble, attachment);
      var rowChildren = isRight ? [bubbleWrapper, avatar] : [avatar, bubbleWrapper];

      return h("div", { key:"chat-"+idx, style:{ display:"flex", gap:"12px", marginBottom:"20px",
          alignItems:"flex-start", justifyContent:isRight?"flex-end":"flex-start" }},
        rowChildren[0], rowChildren[1]);
    }

    // Build chat elements
    var chatElements = [];
    var lastDate = "";
    for (var j = 0; j < msgs.length; j++) {
      if (msgs[j].date !== lastDate) {
        chatElements.push(dateSeparator(msgs[j].date));
        lastDate = msgs[j].date;
      }
      chatElements.push(chatBubble(msgs[j], j));
    }

    if (msgs.length === 0) {
      chatElements.push(h("div", { key:"empty", style:{ textAlign:"center", padding:"60px 20px", color:t.dim }},
        h("div", { style:{ fontSize:"14px", fontFamily:fontMono }}, "No agent messages yet"),
        h("div", { style:{ fontSize:"12px", marginTop:"8px" }}, "Run node build-chat-data.js to populate from shared/requests/ + responses/")));
    }

    // Participant badges
    var participants = {};
    for (var p = 0; p < msgs.length; p++) {
      participants[msgs[p].from] = msgs[p].fromColor || agentColor(msgs[p].from);
      participants[msgs[p].to] = agentColor(msgs[p].to);
    }
    var pBadges = Object.keys(participants).map(function(name, i) {
      return h("span", { key:"p-"+i, style:{ display:"inline-flex", alignItems:"center", gap:"5px",
        fontSize:"11px", fontFamily:fontMono, color:participants[name] }},
        h("span", { style:dotStyle(participants[name], 8) }), name);
    });

    var chatHeader = h("div", { style:{ display:"flex", alignItems:"center", gap:"16px", padding:"14px 24px",
        background:dark?"rgba(255,255,255,0.03)":"#ffffff", border:"1px solid "+t.cardBorder,
        borderRadius:"12px 12px 0 0", flexWrap:"wrap" }},
      h("span", { style:{ fontSize:"14px", fontWeight:"700", fontFamily:fontMono, color:t.text }}, "# agent-comms"),
      h("span", { style:{ width:"1px", height:"16px", background:t.cardBorder }}),
      h("div", { style:{ display:"flex", gap:"14px", flex:1, flexWrap:"wrap" }}, pBadges),
      h("span", { style:{ fontSize:"11px", fontFamily:fontMono, color:t.dim, padding:"4px 12px",
        background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderRadius:"6px" }}, msgs.length + " msgs"));

    var chatArea = h("div", { style:{ background:dark?"rgba(0,0,0,0.25)":"#f1f5f9", borderRadius:"0 0 12px 12px",
        border:"1px solid "+t.cardBorder, borderTop:"none", padding:"12px 24px 24px", minHeight:"400px" }}, chatElements);

    var chatHint = h("div", { style:{ marginTop:"12px", fontSize:"11px", fontFamily:fontMono, color:t.dim,
        textAlign:"center", fontStyle:"italic" }}, "Source: shared/requests/ + shared/responses/ | Rebuilt via build-chat-data.js");

    return h("div", null, chatHeader, chatArea, chatHint);
  }

  // ══════════════════════════════════════════════════════════
  // TAB 3: TOOLKIT (sub-tabs: Skills | Workflows | MCP Ref)
  // ══════════════════════════════════════════════════════════
  function renderToolkit() {
    var subTabs = ["Skills (24)","Workflows (6)","MCP Reference (120+)","Form Filler"];

    var subTabBar = h("div", { style:{ display:"flex", gap:"0", marginBottom:"20px", borderBottom:"1px solid "+t.cardBorder }},
      subTabs.map(function(label, i) {
        var isActive = toolkitSub === i;
        return h("button", { key:i, onClick:function(){ setToolkitSub(i); setSearch(""); setFilter("all"); setMcpSearch(""); },
          style:{ padding:"10px 20px", border:"none", borderBottom:isActive?"2px solid "+C.accent:"2px solid transparent",
            background:"transparent", color:isActive?C.accent:t.dim, fontFamily:fontMono, fontSize:"12px",
            fontWeight:isActive?"700":"400", cursor:"pointer" }}, label);
      }));

    if (toolkitSub === 0) return h("div", null, subTabBar, renderSkills());
    if (toolkitSub === 1) return h("div", null, subTabBar, renderWorkflows());
    if (toolkitSub === 2) return h("div", null, subTabBar, renderMcpRef());
    return h("div", null, subTabBar, renderFormFiller());
  }

  // ── Skills sub-tab ────────────────────────────────────────
  function renderSkills() {
    var filterButtons = [
      { label:"All", value:"all" },
      { label:"Config", value:"config" },
      { label:"Manual", value:"manual" },
      { label:"Testing", value:"testing" },
      { label:"Observer", value:"observer" },
      { label:"Country", value:"country" },
      { label:"Commands", value:"command" },
    ];

    var searchBox = h("input", { type:"text", value:search, placeholder:"Search skills by name, keyword, or use case...",
      onChange:function(e){ setSearch(e.target.value); },
      style:{ width:"100%", padding:"12px 16px", background:t.surface, border:"1px solid "+t.border,
        borderRadius:"10px", color:t.text, fontSize:"14px", outline:"none", fontFamily:"inherit", marginBottom:"12px" }});

    var filterRow = h("div", { style:{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"24px" }},
      filterButtons.map(function(fb, i) {
        var active = filter === fb.value;
        return h("button", { key:i, onClick:function(){ setFilter(fb.value); },
          style:{ padding:"5px 12px", borderRadius:"18px", border:"1px solid "+(active?C.accent:t.border),
            background:active?"rgba(108,140,255,0.12)":"transparent", color:active?C.accent:t.dim,
            fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}, fb.label);
      }));

    var totalVisible = 0;
    var categories = skillCategories.map(function(cat, ci) {
      var visibleSkills = cat.skills.filter(function(sk) {
        var matchFilter = filter === "all" || (sk.tags && sk.tags.indexOf(filter) >= 0);
        var q = search.toLowerCase();
        var matchSearch = !q || q.split(" ").every(function(w) {
          return (sk.name + " " + (sk.summary||"") + " " + (sk.searchKw||"")).toLowerCase().indexOf(w) >= 0;
        });
        return matchFilter && matchSearch;
      });

      totalVisible += visibleSkills.length;
      if (visibleSkills.length === 0) return null;

      return h("div", { key:ci, style:{ marginBottom:"32px" }},
        h("div", { style:{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px", paddingBottom:"12px", borderBottom:"1px solid "+t.border }},
          h("div", { style:{ width:"34px", height:"34px", borderRadius:"8px", background:cat.color+"22",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}, cat.icon),
          h("div", { style:{ fontSize:"16px", fontWeight:"600", color:t.text }}, cat.name),
          h("span", { style:{ background:t.surface2, padding:"2px 10px", borderRadius:"12px", fontSize:"11px", color:t.dim, marginLeft:"auto" }}, visibleSkills.length + " skills")),
        cat.intro ? h("div", { style:{ color:t.sub, fontSize:"13px", marginBottom:"16px", lineHeight:"1.6" }}, cat.intro) : null,
        h("div", { style:{ display:"grid", gridTemplateColumns:"1fr", gap:"12px" }},
          visibleSkills.map(function(sk, si) {
            var skKey = ci + "-" + si;
            var isExpanded = expandedSkills[skKey];

            return h("div", { key:si, style:{ background:t.surface, border:"1px solid "+(sk.featured?C.accent:t.border),
                borderRadius:"12px", overflow:"hidden", position:"relative",
                boxShadow:sk.featured?"0 0 0 1px "+C.accent+", 0 4px 24px rgba(108,140,255,0.10)":"none" }},
              sk.featured ? h("div", { style:{ position:"absolute", top:"12px", right:"12px", background:C.accent,
                color:"#fff", fontSize:"10px", fontWeight:"700", padding:"2px 8px", borderRadius:"4px", letterSpacing:"0.05em" }}, "HIGHLIGHTED") : null,
              // Top: title + download + expand
              h("div", { onClick:function(){ var n={}; n[skKey]=!isExpanded; setExpandedSkills(Object.assign({},expandedSkills,n)); },
                style:{ padding:"20px 24px 0", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }},
                h("div", null,
                  h("div", { style:{ fontSize:"14px", fontWeight:"600", color:t.text, marginBottom:"4px" }}, sk.name),
                  h("div", { style:{ display:"flex", alignItems:"center", gap:"8px" }},
                    h("span", { style:{ fontFamily:fontMono, fontSize:"11px", color:C.accent2, background:"rgba(78,205,196,0.1)",
                      padding:"2px 8px", borderRadius:"4px" }}, sk.file),
                    sk.dl ? h("a", { href:"skills/"+sk.dl, download:sk.dl,
                      onClick:function(e){ e.stopPropagation(); },
                      style:{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"3px 8px", borderRadius:"6px",
                        border:"1px solid "+C.accent2, background:"rgba(78,205,196,0.08)", color:C.accent2,
                        fontSize:"11px", fontWeight:"500", cursor:"pointer", textDecoration:"none" }}, "\u2B07 Download .md") : null)),
                h("span", { style:{ color:t.dim, fontSize:"16px", cursor:"pointer", transform:isExpanded?"rotate(180deg)":"none",
                  transition:"transform 0.3s", flexShrink:0, padding:"4px" }}, "\u25BC")),
              // Summary
              h("div", { style:{ padding:"6px 24px 14px", fontSize:"13px", color:t.sub, lineHeight:"1.6" }}, sk.summary),
              // Tags
              h("div", { style:{ display:"flex", gap:"6px", flexWrap:"wrap", padding:"0 24px 14px" }},
                (sk.tags||[]).map(function(tg, ti) {
                  var colors = { config:C.config, manual:C.manual, testing:C.test, observer:C.observer,
                    country:C.warn, command:C.accent3, reusable:C.accent2, mcp:"#78909c" };
                  var tc = colors[tg] || t.dim;
                  return h("span", { key:ti, style:{ padding:"2px 10px", borderRadius:"12px", fontSize:"11px",
                    background:tc+"18", color:tc, border:"1px solid "+tc+"40" }}, tg);
                })),
              // Expanded details
              isExpanded ? h("div", { style:{ padding:"16px 24px 24px", borderTop:"1px solid "+t.border }},
                sk.details ? h("div", { style:{ marginBottom:"14px" }},
                  h("div", { style:{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.06em", color:C.accent, marginBottom:"6px" }}, "DETAILS"),
                  h("div", { style:{ fontSize:"13px", color:t.sub, lineHeight:"1.6" }}, sk.details)) : null,
                sk.mcpTools ? h("div", { style:{ background:"rgba(120,144,156,0.08)", border:"1px solid rgba(120,144,156,0.2)",
                  borderRadius:"8px", padding:"12px 16px" }},
                  h("div", { style:{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.06em", color:"#78909c", marginBottom:"6px" }}, "MCP TOOLS USED"),
                  h("code", { style:{ fontSize:"12px", fontFamily:fontMono, color:C.accent2 }}, sk.mcpTools)) : null
              ) : null);
          })));
    });

    var noResults = totalVisible === 0 ? h("div", { style:{ textAlign:"center", padding:"60px 0", color:t.dim }},
      h("div", { style:{ fontSize:"16px", marginBottom:"8px" }}, "No skills match your search.")) : null;

    return h("div", null, searchBox, filterRow, categories, noResults);
  }

  // ── Workflows sub-tab ─────────────────────────────────────
  function renderWorkflows() {
    return h("div", null,
      h("div", { style:{ marginBottom:"28px" }},
        h("div", { style:{ fontSize:"16px", fontWeight:"600", color:t.text, marginBottom:"8px" }}, "End-to-End Workflows"),
        h("div", { style:{ color:t.sub, fontSize:"13px" }}, "Complete processes for common tasks. Each step maps to specific skills and tools.")),
      workflows.map(function(wf, wi) {
        var gradients = [
          [C.config, C.accent2], [C.config, C.accent], [C.test, C.observer], [C.manual, C.accent2],
          [C.test, C.accent2], [C.test, C.accent3]
        ];
        var grad = gradients[wi] || [C.accent, C.accent2];

        return h("div", { key:wi, style:Object.assign({}, cardStyle(), { position:"relative", overflow:"hidden" }) },
          h("div", { style:{ position:"absolute", top:0, left:0, right:0, height:"3px",
            background:"linear-gradient(90deg, "+grad[0]+", "+grad[1]+")" }}),
          h("div", { style:{ fontSize:"15px", fontWeight:"600", color:t.text, marginBottom:"6px" }}, "Workflow " + (wi+1) + ": " + wf.name),
          h("div", { style:{ color:t.sub, fontSize:"13px", marginBottom:"18px" }}, wf.desc),
          // Steps
          h("div", { style:{ display:"flex", gap:"0", alignItems:"flex-start", flexWrap:"wrap", marginBottom:"16px" }},
            wf.steps.map(function(step, si) {
              return h(React.Fragment, { key:si },
                h("div", { style:{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", flex:1, minWidth:"100px", maxWidth:"160px" }},
                  h("div", { style:{ width:"36px", height:"36px", borderRadius:"50%", display:"flex", alignItems:"center",
                    justifyContent:"center", fontWeight:"700", fontSize:"13px", marginBottom:"8px",
                    background:step.color+"22", color:step.color }}, step.n),
                  h("div", { style:{ fontSize:"12px", color:t.text, fontWeight:"500", marginBottom:"2px" }}, step.label),
                  h("div", { style:{ fontSize:"11px", color:t.dim, lineHeight:"1.4" }}, step.detail)),
                si < wf.steps.length - 1 ? h("div", { style:{ display:"flex", alignItems:"center", justifyContent:"center",
                  color:t.dim, fontSize:"16px", padding:"0 2px", marginTop:"8px" }}, "\u2192") : null);
            })),
          // Uses
          h("div", { style:{ display:"flex", gap:"8px", flexWrap:"wrap", paddingTop:"12px", borderTop:"1px solid "+t.border }},
            h("span", { style:{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.05em", color:t.dim, marginRight:"4px", lineHeight:"2" }}, "Uses:"),
            wf.uses.map(function(u, ui) {
              return h("span", { key:ui, style:{ padding:"2px 10px", borderRadius:"12px", fontSize:"11px",
                background:C.accent+"15", color:C.accent, border:"1px solid "+C.accent+"30" }}, u);
            })));
      }));
  }

  // ── MCP Reference sub-tab ─────────────────────────────────
  function renderMcpRef() {
    // MCP servers overview
    var serversOverview = h("div", { style:Object.assign({}, cardStyle(), { marginBottom:"20px" }) },
      h("div", { style:{ fontSize:"13px", color:t.sub, marginBottom:"14px" }},
        "The toolkit uses multiple MCP servers. ", h("strong", null, "Most users won't need these directly"), " — skills handle the orchestration."),
      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }},
        [
          { name:"mcp-eregistrations-bpa v0.17.3", desc:"120+ tools for BPA admin API", status:"Active", statusColor:C.done },
          { name:"mcp-graylog", desc:"11 tools for log analysis", status:"Active", statusColor:C.done },
          { name:"mcp-keycloak", desc:"User management (coming soon)", status:"Planned", statusColor:C.warn },
        ].map(function(srv, i) {
          return h("div", { key:i, style:{ background:t.surface2, border:"1px solid "+t.border, borderRadius:"8px", padding:"14px" }},
            h("div", { style:{ fontWeight:"600", fontSize:"13px", marginBottom:"4px", color:t.text }}, srv.name),
            h("div", { style:{ color:t.dim, fontSize:"12px", marginBottom:"4px" }}, srv.desc),
            h("span", { style:{ fontSize:"11px", color:srv.statusColor }}, srv.status));
        })),
      h("div", { style:{ color:t.dim, fontSize:"12px", marginTop:"14px" }},
        "Status: ", h("span", { style:{ color:C.done }}, "OK"), " = working, ",
        h("span", { style:{ color:C.warn }}, "PARTIAL"), " = limited, ",
        h("span", { style:{ color:C.broken }}, "BROKEN"), " = use workaround")
    );

    // Search
    var searchBox = h("input", { type:"text", value:mcpSearch, placeholder:"Search MCP tools by name or purpose...",
      onChange:function(e){ setMcpSearch(e.target.value); },
      style:{ width:"100%", padding:"12px 16px", background:t.surface, border:"1px solid "+t.border,
        borderRadius:"10px", color:t.text, fontSize:"14px", outline:"none", fontFamily:"inherit", marginBottom:"20px" }});

    var totalVisible = 0;
    var categories = mcpCategories.map(function(cat, ci) {
      var q = mcpSearch.toLowerCase();
      var visibleTools = cat.tools.filter(function(tool) {
        if (!q) return true;
        return q.split(" ").every(function(w) { return (tool[0] + " " + tool[1]).toLowerCase().indexOf(w) >= 0; });
      });

      totalVisible += visibleTools.length;
      if (visibleTools.length === 0 && q) return null;

      var isOpen = expandedMcp[ci] || (q && visibleTools.length > 0);

      return h("div", { key:ci, style:{ marginBottom:"12px" }},
        h("div", { onClick:function(){ var n={}; n[ci]=!expandedMcp[ci]; setExpandedMcp(Object.assign({},expandedMcp,n)); },
          style:{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 0 8px", borderBottom:"1px solid "+t.border, cursor:"pointer" }},
          h("div", { style:{ fontSize:"14px", fontWeight:"600", color:t.text, flex:1 }}, cat.name),
          h("span", { style:{ background:t.surface2, padding:"2px 10px", borderRadius:"12px", fontSize:"11px", color:t.dim }}, cat.count + " tools"),
          h("span", { style:{ color:t.dim, fontSize:"14px", transform:isOpen?"rotate(180deg)":"none", transition:"transform 0.3s" }}, "\u25BC")),
        isOpen ? h("div", { style:{ padding:"8px 0" }},
          cat.desc ? h("div", { style:{ color:t.dim, fontSize:"12px", marginBottom:"8px" }}, cat.desc) : null,
          h("table", { style:{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }},
            h("thead", null, h("tr", null,
              h("th", { style:{ textAlign:"left", padding:"6px 10px", background:t.surface2, color:t.dim, fontWeight:"500", border:"1px solid "+t.border }}, "Tool"),
              h("th", { style:{ textAlign:"left", padding:"6px 10px", background:t.surface2, color:t.dim, fontWeight:"500", border:"1px solid "+t.border }}, "Purpose"),
              h("th", { style:{ textAlign:"left", padding:"6px 10px", background:t.surface2, color:t.dim, fontWeight:"500", border:"1px solid "+t.border }}, "Status"))),
            h("tbody", null,
              visibleTools.map(function(tool, ti) {
                var statusColor = tool[2] === "ok" ? C.done : tool[2] === "partial" ? C.warn : C.broken;
                var statusLabel = tool[2] === "ok" ? "OK" : tool[2] === "partial" ? "PARTIAL" : "BROKEN";
                return h("tr", { key:ti, style:{ display:q && visibleTools.indexOf(tool) < 0 ? "none" : "" }},
                  h("td", { style:{ padding:"6px 10px", border:"1px solid "+t.border, fontFamily:fontMono, fontSize:"11px", color:C.accent2, whiteSpace:"nowrap" }}, tool[0]),
                  h("td", { style:{ padding:"6px 10px", border:"1px solid "+t.border, color:t.dim }}, tool[1]),
                  h("td", { style:{ padding:"6px 10px", border:"1px solid "+t.border, color:statusColor, fontWeight:"600" }}, statusLabel));
              }))))
        : null);
    });

    var noResults = totalVisible === 0 && mcpSearch ? h("div", { style:{ textAlign:"center", padding:"60px 0", color:t.dim }},
      "No MCP tools match your search.") : null;

    return h("div", null, serversOverview, searchBox, categories, noResults);
  }

  // ── Form Filler sub-tab ──────────────────────────────────
  function renderFormFiller() {
    function loadBookmarklet() {
      setBmState("loading");
      fetch("er-filler.bookmarklet.txt").then(function(r) {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      }).then(function(code) {
        setBmCode(code.trim());
        setBmState("ready");
      }).catch(function() { setBmState("error"); });
    }

    // User stories data
    var userStories = [
      { id:"US-01", role:"Applicant", action:"fill all flat fields on the current tab with one click",
        benefit:"I don't have to manually type 100+ fields during a demo or test",
        acceptance:["All text, number, select, radio, checkbox, and date fields are populated from the preset",
          "Values appear in visible inputs (not just internal data)",
          "No layout or CSS breakage after fill"],
        status:"done" },
      { id:"US-02", role:"Applicant", action:"fill EditGrid/DataGrid rows (shareholders, parcels, timelines) automatically",
        benefit:"nested grids with multiple rows are the hardest to fill manually",
        acceptance:["Rows are added to submission data as arrays",
          "EditGrid rows are saved (state='saved', not 'new')",
          "Works for grids on the current tab; data loads on unvisited tabs when navigated"],
        status:"done" },
      { id:"US-03", role:"Applicant", action:"upload demo PDF documents to all file fields with one click",
        benefit:"I can submit a complete application without manually attaching 30+ files",
        acceptance:["A mini valid PDF is created in-memory",
          "comp.upload([File]) sends it to the server via Form.io API",
          "Server returns a document ID and URL",
          "Already-uploaded fields are skipped"],
        status:"done" },
      { id:"US-04", role:"Tester", action:"switch between demo, test, and edge presets for the same service",
        benefit:"I can test different scenarios (full realistic, minimal valid, stress test) without editing data",
        acceptance:["3 scenario buttons (demo/test/edge) in the Fill tab",
          "Each loads different data from localStorage",
          "Preset status shows field count and generation date"],
        status:"done" },
      { id:"US-05", role:"Developer", action:"scan all field keys on the current page and copy them",
        benefit:"I can quickly discover component keys without opening the BPA admin",
        acceptance:["Keys tab shows all detected keys with type and required badge",
          "Filter/search by key name or label",
          "Copy individual key or export all as JSON"],
        status:"done" },
      { id:"US-06", role:"Developer", action:"generate presets automatically via /fill-form command in Claude Code",
        benefit:"presets are built from the real form schema via MCP, not hand-crafted",
        acceptance:["/fill-form reads form_get + classification_get from MCP",
          "Generates realistic values matching field types and catalogs",
          "Saves to er-presets/[serviceId]/[scenario].json",
          "Rebuilds bookmarklet with embedded presets"],
        status:"done" },
      { id:"US-07", role:"Applicant", action:"import and manage presets from the Manage tab",
        benefit:"I can add presets for new services without rebuilding the bookmarklet",
        acceptance:["Paste JSON from /fill-form output into the import textarea",
          "Presets persist in localStorage across sessions",
          "Export/delete individual service presets"],
        status:"done" },
      { id:"US-08", role:"Tester", action:"use the bookmarklet across any eRegistrations country instance",
        benefit:"same tool works for Jamaica, Cuba, El Salvador, etc.",
        acceptance:["Service auto-detected from URL pattern /services/[uuid]",
          "Presets keyed by service UUID (unique per instance)",
          "Form.io API patterns are universal across instances"],
        status:"done" },
      { id:"US-09", role:"Tester", action:"auto-fill any form without pre-built presets",
        benefit:"I can instantly test any service without generating presets first",
        acceptance:["Auto Fill button reads Form.io component tree in real-time",
          "Generates appropriate data per type: text, number, select, radio, checkbox, date, EditGrid, etc.",
          "Smart field detection: email fields get emails, phone fields get phones, name fields get names",
          "EditGrid/DataGrid rows auto-generated from child component definitions",
          "Works on any eRegistrations form on any country instance with zero configuration"],
        status:"done" },
    ];

    var statusColors = { done:C.done, wip:C.warn, planned:t.dim };
    var statusLabels = { done:"DONE", wip:"IN PROGRESS", planned:"PLANNED" };

    // Hero section
    var hero = h("div", { style:Object.assign({}, cardStyle(), { position:"relative", overflow:"hidden", marginBottom:"24px" }) },
      h("div", { style:{ position:"absolute", top:0, left:0, right:0, height:"3px",
        background:"linear-gradient(90deg, #6c8cff, #4ecdc4, #f472b6)" }}),
      h("div", { style:{ display:"flex", alignItems:"flex-start", gap:"20px", flexWrap:"wrap" }},
        h("div", { style:{ flex:1, minWidth:"280px" }},
          h("div", { style:{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }},
            h("span", { style:{ fontSize:"28px" }}, "\uD83D\uDCCB"),
            h("span", { style:{ fontSize:"20px", fontWeight:"700", color:t.text }}, "eR Form Filler"),
            h("span", { style:{ fontSize:"11px", padding:"2px 8px", borderRadius:"4px", background:C.done+"22", color:C.done, fontWeight:"600" }}, "v3.0")),
          h("div", { style:{ color:t.sub, fontSize:"13px", lineHeight:"1.7", marginBottom:"12px" }},
            "A browser bookmarklet that fills eRegistrations forms instantly. Auto Fill works on any form with zero setup. Auto-Pilot mode fills Part B role forms and highlights the action button."),
          h("a", { href:"/form-filler.html", style:{ display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"13px", fontWeight:"600", color:C.accent2, textDecoration:"none", marginBottom:"16px", padding:"6px 14px", borderRadius:"8px", background:C.accent2+"12", border:"1px solid "+C.accent2+"30" }}, "\uD83D\uDCD6 Full Installation Guide"),
          h("div", { style:{ display:"flex", gap:"8px", flexWrap:"wrap" }},
            ["Auto Fill","Auto-Pilot","Form.io API","EditGrid Save","File Upload","Multi-tab","Preset Manager","Key Scanner"].map(function(tag, i) {
              return h("span", { key:i, style:{ padding:"3px 10px", borderRadius:"12px", fontSize:"11px",
                background:C.accent2+"18", color:C.accent2, border:"1px solid "+C.accent2+"40" }}, tag);
            }))),
        // Install box
        h("div", { style:{ minWidth:"240px", background:t.surface2, border:"1px solid "+t.border,
          borderRadius:"10px", padding:"18px", textAlign:"center" }},
          h("div", { style:{ fontSize:"12px", fontWeight:"600", color:t.text, marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.05em" }}, "Install Bookmarklet"),
          bmState === "idle" ? h("button", { onClick:loadBookmarklet,
            style:{ padding:"10px 24px", borderRadius:"8px", border:"none", cursor:"pointer", fontFamily:"inherit",
              background:"linear-gradient(135deg, #2b6cb0, #4ecdc4)", color:"#fff", fontSize:"13px", fontWeight:"600",
              boxShadow:"0 4px 12px rgba(43,108,176,0.3)" }}, "Load Installer") :
          bmState === "loading" ? h("div", { style:{ color:t.dim, fontSize:"12px", padding:"10px" }}, "Loading bookmarklet...") :
          bmState === "error" ? h("div", { style:{ color:C.broken, fontSize:"12px", padding:"10px" }}, "Bookmarklet file not found. Deploy er-filler.bookmarklet.txt alongside the dashboard.") :
          h("div", null,
            h("a", { href:bmCode, style:{ display:"inline-block", padding:"10px 24px", borderRadius:"8px",
              background:"linear-gradient(135deg, #2b6cb0, #4ecdc4)", color:"#fff", fontSize:"13px", fontWeight:"600",
              textDecoration:"none", boxShadow:"0 4px 12px rgba(43,108,176,0.3)", cursor:"grab",
              border:"2px dashed rgba(255,255,255,0.3)" }}, "\uD83D\uDCCB eR Form Filler"),
            h("div", { style:{ color:t.dim, fontSize:"11px", marginTop:"8px", lineHeight:"1.5" }},
              "Drag the button above to your bookmarks bar"),
            h("div", { style:{ color:t.dim, fontSize:"10px", marginTop:"4px" }},
              "Or right-click \u2192 Bookmark this link")),
          h("div", { style:{ marginTop:"12px", fontSize:"11px", color:t.dim, borderTop:"1px solid "+t.border, paddingTop:"10px" }},
            "Presets for Jamaica SEZ included"))));

    // How it works
    var howItWorks = h("div", { style:Object.assign({}, cardStyle(), { marginBottom:"24px" }) },
      h("div", { style:{ fontSize:"15px", fontWeight:"600", color:t.text, marginBottom:"16px" }}, "How It Works"),
      h("div", { style:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"16px" }},
        [
          { step:"1", icon:"\u26A1", title:"Auto Fill (NEW)", desc:"Click the bookmarklet on any form. Hit Auto Fill. It reads Form.io components live and generates smart data. Zero setup." },
          { step:"2", icon:"\uD83C\uDFAF", title:"Preset Fill", desc:"For curated data: run /fill-form to generate presets via MCP, then use Fill Form with demo/test/edge scenarios." },
          { step:"3", icon:"\uD83D\uDCC4", title:"Upload Files", desc:"Click Fill Files to upload a demo PDF to every file component via Form.io's internal API." },
          { step:"4", icon:"\uD83D\uDD0D", title:"Scan Keys", desc:"Use the Keys tab to discover all field keys on the current page. Filter, copy, or export as JSON." },
        ].map(function(s, i) {
          return h("div", { key:i, style:{ background:t.surface2, border:"1px solid "+t.border, borderRadius:"10px", padding:"16px", textAlign:"center" }},
            h("div", { style:{ fontSize:"24px", marginBottom:"6px" }}, s.icon),
            h("div", { style:{ fontSize:"11px", color:C.accent, fontWeight:"600", marginBottom:"4px" }}, "STEP " + s.step),
            h("div", { style:{ fontSize:"13px", fontWeight:"600", color:t.text, marginBottom:"4px" }}, s.title),
            h("div", { style:{ fontSize:"12px", color:t.sub, lineHeight:"1.5" }}, s.desc));
        })));

    // User stories
    var stories = h("div", { style:{ marginBottom:"24px" }},
      h("div", { style:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }},
        h("div", { style:{ fontSize:"15px", fontWeight:"600", color:t.text }}, "User Stories"),
        h("div", { style:{ display:"flex", gap:"12px", fontSize:"12px" }},
          h("span", { style:{ color:C.done } }, "\u25CF " + userStories.filter(function(s){return s.status==="done"}).length + " done"),
          h("span", { style:{ color:C.warn } }, "\u25CF " + userStories.filter(function(s){return s.status==="wip"}).length + " in progress"),
          h("span", { style:{ color:t.dim } }, "\u25CF " + userStories.filter(function(s){return s.status==="planned"}).length + " planned"))),
      userStories.map(function(story, i) {
        var skKey = "ff-" + i;
        var isExpanded = expandedSkills[skKey];
        var sc = statusColors[story.status];

        return h("div", { key:i, style:Object.assign({}, cardStyle(), { marginBottom:"8px", borderLeft:"3px solid "+sc }) },
          h("div", { onClick:function(){ var n={}; n[skKey]=!isExpanded; setExpandedSkills(Object.assign({},expandedSkills,n)); },
            style:{ display:"flex", alignItems:"center", gap:"12px", cursor:"pointer" }},
            h("span", { style:{ fontFamily:fontMono, fontSize:"11px", color:C.accent, fontWeight:"600", flexShrink:0 }}, story.id),
            h("div", { style:{ flex:1 }},
              h("div", { style:{ fontSize:"13px", color:t.text, lineHeight:"1.5" }},
                "As a ", h("strong", null, story.role), ", I want to ", story.action, " so that ", story.benefit)),
            h("span", { style:{ fontSize:"10px", padding:"2px 8px", borderRadius:"4px", background:sc+"22",
              color:sc, fontWeight:"600", flexShrink:0 }}, statusLabels[story.status]),
            h("span", { style:{ color:t.dim, fontSize:"14px", transform:isExpanded?"rotate(180deg)":"none",
              transition:"transform 0.3s", flexShrink:0 }}, "\u25BC")),
          isExpanded ? h("div", { style:{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid "+t.border }},
            h("div", { style:{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.05em", color:C.accent, marginBottom:"8px" }}, "ACCEPTANCE CRITERIA"),
            story.acceptance.map(function(ac, ai) {
              return h("div", { key:ai, style:{ display:"flex", gap:"8px", alignItems:"flex-start", marginBottom:"4px" }},
                h("span", { style:{ color:story.status==="done"?C.done:t.dim, flexShrink:0 }}, story.status==="done"?"\u2713":"\u25CB"),
                h("span", { style:{ fontSize:"12px", color:t.sub, lineHeight:"1.5" }}, ac));
            })) : null);
      }));

    // Architecture
    var arch = h("div", { style:Object.assign({}, cardStyle(), { marginBottom:"24px" }) },
      h("div", { style:{ fontSize:"15px", fontWeight:"600", color:t.text, marginBottom:"16px" }}, "Architecture"),
      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }},
        h("div", null,
          h("div", { style:{ fontSize:"12px", fontWeight:"600", color:C.accent, marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}, "Source Files"),
          [
            { f:"bookmarklet/er-filler.js", d:"Main source (~600 lines)" },
            { f:"bookmarklet/build-bookmarklet.js", d:"Build script + preset embedder" },
            { f:"er-presets/[serviceId]/[scenario].json", d:"Preset data files" },
            { f:".claude/commands/bookmarklet.md", d:"/bookmarklet slash command" },
            { f:".claude/commands/fill-form.md", d:"/fill-form preset generator" },
          ].map(function(item, i) {
            return h("div", { key:i, style:{ marginBottom:"6px" }},
              h("code", { style:{ fontSize:"11px", fontFamily:fontMono, color:C.accent2 }}, item.f),
              h("div", { style:{ fontSize:"11px", color:t.dim, marginLeft:"4px" }}, item.d));
          })),
        h("div", null,
          h("div", { style:{ fontSize:"12px", fontWeight:"600", color:C.accent, marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}, "Key Patterns"),
          [
            { p:"form.submission = { data }", d:"Triggers Form.io component updates" },
            { p:"comp.saveRow(i)", d:"Saves EditGrid rows from 'new' to 'saved'" },
            { p:"comp.upload([File])", d:"Uploads files via Form.io internal API" },
            { p:"everyComponent()", d:"Iterates current-page components only" },
            { p:"NEVER wiz.redraw()", d:"Breaks CSS layout across all tabs" },
          ].map(function(item, i) {
            return h("div", { key:i, style:{ marginBottom:"6px" }},
              h("code", { style:{ fontSize:"11px", fontFamily:fontMono, color:"#f472b6" }}, item.p),
              h("div", { style:{ fontSize:"11px", color:t.dim, marginLeft:"4px" }}, item.d));
          }))));

    // Commands
    var commands = h("div", { style:Object.assign({}, cardStyle()) },
      h("div", { style:{ fontSize:"15px", fontWeight:"600", color:t.text, marginBottom:"12px" }}, "Claude Code Commands"),
      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }},
        [
          { cmd:"/fill-form [serviceId]", desc:"Generate preset from form schema via MCP. Reads field types, catalogs, validations. Saves to er-presets/." },
          { cmd:"/fill-form [id] --all-scenarios", desc:"Generate demo + test + edge presets in one go." },
          { cmd:"/bookmarklet build", desc:"Rebuild bookmarklet with latest presets embedded." },
          { cmd:"/bookmarklet test --headed", desc:"Run Playwright diagnostic: fill, layout check, file upload." },
        ].map(function(item, i) {
          return h("div", { key:i, style:{ background:t.surface2, border:"1px solid "+t.border, borderRadius:"8px", padding:"12px" }},
            h("code", { style:{ fontSize:"12px", fontFamily:fontMono, color:C.accent, display:"block", marginBottom:"4px" }}, item.cmd),
            h("div", { style:{ fontSize:"12px", color:t.sub, lineHeight:"1.5" }}, item.desc));
        })));

    return h("div", null, hero, howItWorks, stories, arch, commands);
  }

  // ══════════════════════════════════════════════════════════
  // TAB ROUTER
  // ══════════════════════════════════════════════════════════
  function renderActiveTab() {
    if (activeTab === 0) return renderOverview();
    if (activeTab === 1) return renderAgents();
    if (activeTab === 2) return renderChat();
    if (activeTab === 3) return renderToolkit();
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
  return h("div", { style:{ minHeight:"100vh", background:t.bg, color:t.text,
      fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif", padding:"0" }},
    // Header
    h("div", { style:{ background:t.headerBg, borderBottom:"1px solid "+t.cardBorder, padding:"16px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }},
      h("div", { style:{ display:"flex", alignItems:"center", gap:"12px" }},
        h("span", { style:{ fontSize:"20px", fontWeight:"800", fontFamily:fontMono, letterSpacing:"2px", color:t.bright }}, "eREG"),
        h("span", { style:{ fontSize:"14px", color:t.dim, fontFamily:fontMono }}, "Agent Hub"),
        h("span", { style:badgeStyle(C.done+"33", C.done) }, "LIVE")),
      h("div", { style:{ display:"flex", alignItems:"center", gap:"12px" }},
        h("span", { style:{ fontSize:"12px", fontFamily:fontMono, color:t.dim }}, "2026-03-01"),
        h("button", { onClick:function(){ setDark(!dark); },
          style:{ padding:"6px 14px", borderRadius:"6px", border:"1px solid "+t.cardBorder,
            background:t.card, color:t.text, fontFamily:fontMono, fontSize:"12px", cursor:"pointer" }},
          dark ? "LIGHT" : "DARK"))),
    // Tab bar
    h("div", { style:{ display:"flex", overflowX:"auto", borderBottom:"1px solid "+t.cardBorder,
        background:t.headerBg, padding:"0 16px" }},
      TABS.map(function(tab, i) {
        var isActive = activeTab === i;
        return h("button", { key:i, onClick:function(){ setActiveTab(i); },
          style:{ padding:"12px 20px", border:"none",
            borderBottom:isActive?"2px solid "+C.accent:"2px solid transparent",
            background:"transparent", color:isActive?t.bright:t.dim, fontFamily:fontMono, fontSize:"13px",
            fontWeight:isActive?"700":"400", cursor:"pointer", whiteSpace:"nowrap",
            transition:"all 0.2s", letterSpacing:"1px" }},
          h("span", { style:{ marginRight:"6px", fontSize:"12px", opacity:0.7 }}, tab.icon), tab.label);
      })),
    // Content
    h("div", { style:{ maxWidth:"1200px", margin:"0 auto", padding:"24px" }}, renderActiveTab()),
    // Footer
    h("div", { style:{ textAlign:"center", padding:"24px", fontSize:"11px", fontFamily:fontMono,
        color:t.dim, borderTop:"1px solid "+t.cardBorder }},
      "eRegistrations Agent Hub | 7 agents | 24 skills | 120+ MCP tools | Form Filler | 2 countries | ",
      h("a", { href:"https://www.npmjs.com/package/mcp-eregistrations-bpa",
        style:{ color:C.accent2, textDecoration:"none" }}, "mcp-eregistrations-bpa v0.17.3"))
  );
}

// Export
if (typeof module !== "undefined" && module.exports) { module.exports = AgentDashboard; }
if (typeof window !== "undefined") { window.AgentDashboard = AgentDashboard; }
