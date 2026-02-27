/* ============================================================
   eRegistrations Agent Hub Dashboard
   Real filesystem scan data - 2026-02-26
   ============================================================ */

function AgentDashboard() {
  var React = window.React || require("react");
  var useState = React.useState;

  // ── State ──────────────────────────────────────────────────
  var [activeTab, setActiveTab] = useState(0);
  var [dark, setDark] = useState(true);
  var [selectedAgent, setSelectedAgent] = useState(0);
  var [expandedMission, setExpandedMission] = useState(null);

  // ── Theme ──────────────────────────────────────────────────
  var theme = dark
    ? {
        bg: "#0a0e1a",
        text: "#e2e8f0",
        card: "rgba(255,255,255,0.02)",
        cardBorder: "rgba(255,255,255,0.06)",
        sub: "#94a3b8",
        dim: "#64748b",
        codeBg: "rgba(0,0,0,0.3)",
        headerBg: "rgba(255,255,255,0.08)",
        bright: "#f8fafc",
      }
    : {
        bg: "#f8fafc",
        text: "#1e293b",
        card: "#ffffff",
        cardBorder: "#e2e8f0",
        sub: "#64748b",
        dim: "#94a3b8",
        codeBg: "#f1f5f9",
        headerBg: "rgba(0,0,0,0.04)",
        bright: "#0f172a",
      };

  // ── Colors ─────────────────────────────────────────────────
  var COLORS = {
    test: "#22d3ee",
    manual: "#a78bfa",
    config: "#fb923c",
    orchestrator: "#f472b6",
    observer: "#10b981",
    nelson: "#22c55e",
    critical: "#ef4444",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#6b7280",
    done: "#22c55e",
    progress: "#3b82f6",
    pending: "#94a3b8",
    blocked: "#ef4444",
  };

  // ── Tabs ───────────────────────────────────────────────────
  var TABS = [
    { label: "Command Center", icon: "[CC]" },
    { label: "Missions", icon: "[MS]" },
    { label: "Agents", icon: "[AG]" },
    { label: "Chat", icon: "[CH]" },
    { label: "Knowledge", icon: "[KB]" },
    { label: "Brain", icon: "[BR]" },
    { label: "How It Works", icon: "[HW]" },
  ];

  // ── Agents Data ────────────────────────────────────────────
  var agents = [
    {
      name: "Test Agent",
      alias: "Verifier",
      dir: "testing/",
      color: COLORS.test,
      letter: "T",
      maturity: 100,
      claudeMd: true,
      settings: true,
      settingsLines: 56,
      skills: [
        "page-objects.md",
        "playwright-e2e.md",
      ],
      rules: ["shared-protocol.md", "test-patterns.md"],
      hooks: ["SessionStart", "PostToolUse"],
      profile: "test-agent.md",
      hasProfile: true,
      testSpecs: [
        "acreditaciones.spec.ts",
        "block22-permisos.spec.ts",
        "permisos-eventuales.spec.ts",
      ],
      mcpServers: [
        { name: "BPA-cuba", access: "read-only", tools: 17 },
      ],
      currentTask:
        "36 tests generated, pending auth-state.json and execution",
    },
    {
      name: "Manual Agent",
      alias: "Extractor",
      dir: "manual/",
      color: COLORS.manual,
      letter: "M",
      maturity: 95,
      claudeMd: true,
      settings: true,
      settingsLines: 141,
      skills: [
        "change-detection.md",
        "documentation.md",
      ],
      rules: ["multi-instance.md", "read-only.md", "shared-protocol.md"],
      hooks: ["SessionStart", "PostToolUse", "PreToolUse"],
      profile: "manual-agent.md",
      hasProfile: true,
      testSpecs: [],
      mcpServers: [
        { name: "BPA-cuba", access: "read-only", tools: 37 },
        { name: "BPA-lesotho2", access: "read-only", tools: 16 },
        { name: "BPA-colombia-test", access: "read-only", tools: 16 },
        { name: "BPA-jamaica", access: "read-only", tools: 16 },
      ],
      currentTask:
        "On-demand MCP extractions, 3 HTML manuals generated",
    },
    {
      name: "Config Agent",
      alias: "Configurator",
      dir: "config/",
      color: COLORS.config,
      letter: "C",
      maturity: 95,
      claudeMd: true,
      settings: true,
      settingsLines: 150,
      skills: [
        "bot-config.md",
        "determinant-config.md",
        "playwright-workaround.md",
        "service-setup.md",
      ],
      rules: [
        "always-changelog.md",
        "backup-first.md",
        "shared-protocol.md",
      ],
      hooks: ["SessionStart", "PostToolUse", "PreToolUse"],
      profile: "config-agent.md",
      hasProfile: true,
      testSpecs: [],
      mcpServers: [
        { name: "BPA-cuba", access: "read/write", tools: 82 },
      ],
      currentTask:
        "M-001 StatusBitacora: 1/18 OK, 8 cleanup, 9 pending",
    },
    {
      name: "Observer Agent",
      alias: "Tracker",
      dir: "observer/",
      color: COLORS.observer,
      letter: "G",
      maturity: 90,
      claudeMd: true,
      settings: true,
      settingsLines: 37,
      skills: [
        "service-health-check.md",
        "trace-dossier.md",
        "bot-failure-report.md",
        "correlate-test-logs.md",
      ],
      rules: ["evidence-first.md", "query-patterns.md"],
      hooks: ["SessionStart"],
      profile: "observer-agent.md",
      hasProfile: true,
      testSpecs: [],
      mcpServers: [
        { name: "mcp-graylog", access: "read-only", tools: 11 },
        { name: "BPA-cuba", access: "read-only", tools: 17 },
      ],
      currentTask:
        "PE dashboard live, bot health monitoring, 36K+ logs/day baseline",
    },
    {
      name: "Orchestrator",
      alias: "Coordinator",
      dir: "(root) ~/Desktop/OCAgents/",
      color: COLORS.orchestrator,
      letter: "O",
      maturity: 85,
      claudeMd: true,
      settings: true,
      settingsLines: 0,
      skills: ["fix-determinant-effects/"],
      rules: ["agent-protocol.md"],
      hooks: ["PreToolUse"],
      profile: null,
      hasProfile: false,
      testSpecs: [],
      mcpServers: [
        { name: "BPA-cuba", access: "ad-hoc", tools: 0 },
        { name: "BPA-lesotho2", access: "ad-hoc", tools: 0 },
      ],
      currentTask:
        "Coordinates agents, generates SITREPs, launcher operational",
    },
  ];

  // ── Missions Data ──────────────────────────────────────────
  var missions = [
    {
      id: "M-001",
      name: "StatusBitacora",
      desc: "Connect 18 services to Bitacora",
      status: "ACTIVE",
      priority: "critical",
      deadline: "2026-02-28",
      owner: "Config Agent",
      support: "Manual + Test",
      why: "Each service needs radio determinant StatusBitacora=TRUE + behaviour + effect to activate form from Bitacora",
      progress: "1/18 OK, 8 need cleanup, 9 not started",
      progressNum: 1,
      progressTotal: 18,
      tasks: [
        {
          agent: "Config",
          color: COLORS.config,
          text: "Cleanup 8 incorrect behaviours + recreate",
          status: "progress",
        },
        {
          agent: "Config",
          color: COLORS.config,
          text: "REST API for 9 pending services",
          status: "pending",
        },
        {
          agent: "Test",
          color: COLORS.test,
          text: "Validate E2E post-fix",
          status: "blocked",
        },
      ],
    },
    {
      id: "M-002",
      name: "Expirado Badges",
      desc: "Expiration logic for EditGrids",
      status: "BLOCKED",
      priority: "high",
      deadline: "2026-03-07",
      owner: "Config + Nelson (manual BPA UI)",
      support: "",
      why: "14+ EditGrids need red 'Expired' badge for expired permits",
      progress: "Blocked by MCP bugs 4-5-6",
      progressNum: 0,
      progressTotal: 14,
      tasks: [
        {
          agent: "Nelson",
          color: COLORS.nelson,
          text: "Create row det + grid det manually in BPA UI",
          status: "blocked",
        },
        {
          agent: "Config",
          color: COLORS.config,
          text: "Link effects via MCP effect_create",
          status: "pending",
        },
      ],
    },
    {
      id: "M-003",
      name: "E2E Test Suite",
      desc: "Playwright tests for Bitacora",
      status: "ACTIVE",
      priority: "medium",
      deadline: "ongoing",
      owner: "Test Agent",
      support: "Manual",
      why: "E2E suite validating Bitacora dashboard, forms, complete flows",
      progress: "36 tests written, pending execution",
      progressNum: 0,
      progressTotal: 36,
      tasks: [
        {
          agent: "Test",
          color: COLORS.test,
          text: "Generate auth-state.json with CAS login",
          status: "pending",
        },
        {
          agent: "Test",
          color: COLORS.test,
          text: "Execute 36 tests, adjust selectors",
          status: "pending",
        },
        {
          agent: "Manual",
          color: COLORS.manual,
          text: "Provide service structure on-demand",
          status: "progress",
        },
      ],
    },
    {
      id: "M-004",
      name: 'Panel "Su empresa seleccionada"',
      desc: "Visual company/NIT mustache panel in destination services",
      status: "ACTIVE",
      priority: "medium",
      deadline: "2026-03-07",
      owner: "Config Agent",
      support: "",
      why: "Each destination service shows visual panel with company/NIT via mustache templates",
      progress: "6/18 done",
      progressNum: 6,
      progressTotal: 18,
      tasks: [
        {
          agent: "Config",
          color: COLORS.config,
          text: "Create panel in 12 remaining services",
          status: "pending",
        },
      ],
    },
    {
      id: "M-005",
      name: "Documentation",
      desc: "Navigable HTML manuals",
      status: "ACTIVE",
      priority: "low",
      deadline: "ongoing",
      owner: "Manual Agent",
      support: "",
      why: "Navigable HTML manuals for each service, published on gh-pages",
      progress: "3/18 done",
      progressNum: 3,
      progressTotal: 18,
      tasks: [
        {
          agent: "Manual",
          color: COLORS.manual,
          text: "Generate manuals for 15 remaining services",
          status: "pending",
        },
      ],
    },
  ];

  // ── Knowledge Base ─────────────────────────────────────────
  var knowledgeFiles = [
    {
      name: "acreditaciones-knowledge-for-tester.md",
      section: "shared/knowledge/",
    },
    {
      name: "bitacora-knowledge-for-agent.md",
      section: "shared/knowledge/",
    },
    { name: "bpa-rest-api.md", section: "shared/knowledge/" },
    { name: "CHANGELOG.md", section: "shared/knowledge/" },
    {
      name: "guia-replicacion-servicio.md",
      section: "shared/knowledge/",
    },
    {
      name: "rosetta-stone.md",
      section: "shared/knowledge/ (symlinked)",
    },
    { name: "SERVICES-MAP.md", section: "shared/knowledge/" },
    {
      name: "statusbitacora-mapping.md",
      section: "shared/knowledge/",
    },
  ];

  var otherFiles = [
    { name: "MISSIONS.md", section: "shared/" },
    { name: "COMMUNICATION-PROTOCOL.md", section: "shared/" },
    { name: "notify.sh", section: "shared/" },
    { name: "config-agent.md", section: "shared/profiles/" },
    { name: "manual-agent.md", section: "shared/profiles/" },
    { name: "test-agent.md", section: "shared/profiles/" },
    { name: "observer-agent.md", section: "shared/profiles/" },
    { name: "USER-GUIDE.md", section: "(root)" },
  ];

  // ── Decisions ──────────────────────────────────────────────
  var decisions = [
    {
      date: "2026-02-26",
      what: "Observer Agent (Tracker) fully operational + PE E2E complete",
      why: "5th agent for Graylog monitoring, bot traceability, and log-driven debugging",
      impact: "5-agent hub: config, manual, test, observer + orchestrator. PE E2E nuevo+modificar passing.",
    },
    {
      date: "2026-02-25",
      what: "Reorganized to countries/ structure + Jamaica onboarded",
      why: "Multi-country support: Cuba + Jamaica with isolated data per country",
      impact: "countries/cuba/ and countries/jamaica/ with independent knowledge, missions, testing",
    },
    {
      date: "2026-02-22",
      what: "Created launch-all.sh + Launch Agents.command",
      why: "One-click agent launch for all agents + orchestrator",
      impact: "Operational efficiency, less manual startup",
    },
    {
      date: "2026-02-21",
      what: "Created MISSIONS.md with 5 missions prioritized",
      why: "Need structured tracking of parallel workstreams across agents",
      impact: "Clear priorities: M-001 critical, M-002 high, M-003/4 medium, M-005 low",
    },
    {
      date: "2026-02-21",
      what: "Launched Agent Orchestrator infrastructure",
      why: "4 agents need coordination: shared/, profiles, skills, hooks, rules",
      impact: "12 skills, 8 rules, 7 hooks deployed across 4 agents",
    },
    {
      date: "2026-02-21",
      what: "Bulk StatusBitacora for 7 services -- wrong target blocks",
      why: "Attempted batch creation but target blocks varied per service",
      impact: "8 behaviours need cleanup before retry with correct block IDs",
    },
    {
      date: "2026-02-14",
      what: "StatusBitacora Fito model completed",
      why: "First successful end-to-end Bitacora connection via REST API workaround",
      impact: "Reference model for replicating to remaining 17 services",
    },
  ];

  // ── Infrastructure Pipeline ────────────────────────────────
  var pipeline = [
    {
      step: 1,
      name: "Audit",
      desc: "Examine structure",
      done: true,
    },
    {
      step: 2,
      name: "Structure",
      desc: "CLAUDE.md x5 + shared/ + countries/",
      done: true,
    },
    {
      step: 3,
      name: "MCP Config",
      desc: "settings.json x5 + Graylog MCP",
      done: true,
    },
    {
      step: 4,
      name: "Skills",
      desc: "13 total across 5 agents",
      done: true,
    },
    {
      step: 5,
      name: "Hooks",
      desc: "SessionStart + PostToolUse + PreToolUse",
      done: true,
    },
  ];

  // ── Project Tree ───────────────────────────────────────────
  var projectTree =
    "~/Desktop/OCAgents/\n" +
    "|-- CLAUDE.md\n" +
    "|-- USER-GUIDE.md\n" +
    "|-- launch-all.sh\n" +
    "|-- .start-agent.sh\n" +
    "|-- .claude/\n" +
    "|   |-- rules/agent-protocol.md\n" +
    "|   |-- settings.local.json\n" +
    "|-- countries/\n" +
    "|   |-- cuba/\n" +
    "|   |   |-- knowledge/ (SERVICES-MAP, CHANGELOG, guides)\n" +
    "|   |   |-- missions/MISSIONS.md (M-001..M-005)\n" +
    "|   |   |-- testing/ (specs, pages, helpers)\n" +
    "|   |   |-- skills/ (fix-determinant-effects, e2e-service-test)\n" +
    "|   |   |-- analysis/ sitreps/\n" +
    "|   |-- jamaica/\n" +
    "|       |-- knowledge/ (SERVICES-MAP, CHANGELOG)\n" +
    "|       |-- missions/MISSIONS.md (M-J001..M-J003)\n" +
    "|       |-- testing/ (specs, pages, helpers)\n" +
    "|-- shared/\n" +
    "|   |-- profiles/ (config, manual, test, observer)\n" +
    "|   |-- requests/ responses/\n" +
    "|   |-- knowledge/ (symlinks -> countries/cuba/)\n" +
    "|   |-- dashboard.jsx\n" +
    "|-- config/   (.claude/skills, .claude/rules)\n" +
    "|-- manual/   (.claude/skills, .claude/rules)\n" +
    "|-- testing/  (.claude/skills, .claude/rules)\n" +
    "|-- observer/\n" +
    "|   |-- CLAUDE.md\n" +
    "|   |-- .claude/\n" +
    "|   |   |-- skills/ (health-check, trace-dossier,\n" +
    "|   |   |           bot-failure, correlate-logs)\n" +
    "|   |   |-- rules/ (evidence-first, query-patterns)\n" +
    "|   |-- dashboards/ (pe-dashboard.md)\n" +
    "|   |-- reports/ (pe-bot-map, pe-trace)\n" +
    "|   |-- queries/ (service-queries-template)\n" +
    "|-- playwright-bpa/ (18 spec.js files, legacy)";

  // ── Nelson Capabilities ────────────────────────────────────
  var nelsonBadges = [
    "BPA Architect",
    "MCP Expert",
    "Playwright",
    "REST API",
    "Agent Orchestrator",
  ];

  // ── Skill Descriptions ────────────────────────────────────
  var skillInfo = {
    "page-objects.md": {
      invoke: "/page-objects",
      desc: "Generate Page Object classes for Playwright from MCP structure",
    },
    "playwright-e2e.md": {
      invoke: "/playwright-e2e",
      desc: "Generate complete E2E specs with auth, navigation and assertions",
    },
    "change-detection.md": {
      invoke: "/change-detection",
      desc: "Detect changes between service versions by comparing exports",
    },
    "documentation.md": {
      invoke: "/documentation",
      desc: "Generate navigable HTML technical documentation for a service",
    },
    "bot-config.md": {
      invoke: "/bot-config",
      desc: "Configure bots (internal/GDB) with input/output mappings",
    },
    "determinant-config.md": {
      invoke: "/determinant-config",
      desc: "Create determinants + behaviours + effects in a service",
    },
    "playwright-workaround.md": {
      invoke: "/playwright-workaround",
      desc: "Use Playwright to create objects MCP cannot (radio/grid/date dets)",
    },
    "service-setup.md": {
      invoke: "/service-setup",
      desc: "Complete Bitacora connection setup: det + bot + panel + action",
    },
    "fix-determinant-effects/": {
      invoke: "/fix-determinant-effects",
      desc: "Create StatusBitacora determinant + effect via REST API workaround",
    },
    "service-health-check.md": {
      invoke: "/service-health-check",
      desc: "Quick health assessment of a service via Graylog log analysis",
    },
    "trace-dossier.md": {
      invoke: "/trace-dossier",
      desc: "Follow a dossier lifecycle through Graylog logs end-to-end",
    },
    "bot-failure-report.md": {
      invoke: "/bot-failure-report",
      desc: "Find and diagnose bot failures with log evidence",
    },
    "correlate-test-logs.md": {
      invoke: "/correlate-test-logs",
      desc: "Match E2E test executions with backend Graylog logs",
    },
  };

  // ── Hook Descriptions ────────────────────────────────────
  var hookInfo = {
    SessionStart:
      "On session start: reads profiles, CHANGELOG, pending requests, notifications",
    PostToolUse:
      "After write/edit: notifies target agent; after MCP write: logs to audit file",
    PreToolUse:
      "Before execution: blocks writes on read-only agents; creates backups before editing",
  };

  // ── Rule Descriptions ────────────────────────────────────
  var ruleInfo = {
    "shared-protocol.md": "Inter-agent communication protocol via shared/requests and shared/responses",
    "test-patterns.md": "Testing rules: ref-based selectors, async waits, spec structure",
    "multi-instance.md": "Rules for managing 4 MCP instances without mixing IDs across countries",
    "read-only.md": "Absolute rule: NEVER use create/update/delete tools",
    "always-changelog.md": "After EVERY MCP write operation, log in CHANGELOG.md",
    "backup-first.md": "Before modifying any component, read current state first",
    "agent-protocol.md": "Global rules: read profiles at start, request/response format",
    "evidence-first.md": "Every claim must be backed by log evidence with query, fields, counts",
    "query-patterns.md": "Standard Graylog query patterns for services, bots, errors, users",
  };

  // ── Knowledge Descriptions ───────────────────────────────
  var knowledgeInfo = {
    "acreditaciones-knowledge-for-tester.md": "Acreditaciones service structure for the Test Agent",
    "bitacora-knowledge-for-agent.md": "Complete Bitacora structure: blocks, fields, bots, actions",
    "bpa-rest-api.md": "REST API endpoints for workarounds when MCP fails (radio dets, etc.)",
    "CHANGELOG.md": "Log of ALL Config Agent changes with IDs and statuses",
    "guia-replicacion-servicio.md": "Step-by-step guide to connect a service to the Bitacora",
    "rosetta-stone.md": "Dictionary: Designer UI <-> AI naming <-> JSON keys <-> Java classes",
    "SERVICES-MAP.md": "Catalog of 18+ services with IDs, statuses and notes",
    "statusbitacora-mapping.md": "Target blocks per service for the StatusBitacora determinant",
    "MISSIONS.md": "Active missions with owner, support, deadline and progress",
    "COMMUNICATION-PROTOCOL.md": "Official request/response format between agents",
    "notify.sh": "Bash script for notification signals between agents",
    "config-agent.md": "Config Agent profile: identity, capabilities, protocol",
    "manual-agent.md": "Manual Agent profile: MCP instances, read-only rule",
    "test-agent.md": "Test Agent profile: Playwright, selectors, verification rule",
    "observer-agent.md": "Observer Agent profile: Graylog monitoring, log analysis, bot traceability",
    "USER-GUIDE.md": "Complete user guide for the Agent Hub",
  };

  // ── Feature Gap Analysis (from Claude Code guide) ────────
  var featureGaps = [
    {
      feature: "Custom Agents (.claude/agents/)",
      status: "not-started",
      desc: "Create custom agents with frontmatter: tools, model, memory, isolation",
      benefit: "Each agent could have its own .md in agents/ with declarative restrictions",
      ref: "PDF Topic 11",
    },
    {
      feature: "Path-scoped Rules",
      status: "not-started",
      desc: "Rules with YAML frontmatter 'paths:' to apply only to certain files",
      benefit: "Testing rules only apply to specs/, config rules only to configs/",
      ref: "PDF Topic 4",
    },
    {
      feature: "Sandbox + Network Allowlist",
      status: "not-started",
      desc: "Enable sandbox with allowedDomains for BPA servers",
      benefit: "OS-level isolation: agents can only access authorized domains",
      ref: "PDF Topic 7",
    },
    {
      feature: "$schema in settings.json",
      status: "not-started",
      desc: "Add $schema URL for VS Code autocompletion",
      benefit: "Validation and autocompletion when editing settings.json",
      ref: "PDF Topic 8",
    },
    {
      feature: "CLAUDE_CODE_SUBAGENT_MODEL",
      status: "not-started",
      desc: "Use cheaper model (Haiku) for exploration subagents",
      benefit: "Reduces cost without losing quality on delegated tasks",
      ref: "PDF Topic 8",
    },
    {
      feature: "Stop hook (post-response)",
      status: "not-started",
      desc: "Hook that executes when Claude finishes responding",
      benefit: "Auto-save SITREP or notify at the end of each turn",
      ref: "PDF Topic 3",
    },
    {
      feature: "UserPromptSubmit hook",
      status: "not-started",
      desc: "Hook that injects context when user submits a prompt",
      benefit: "Auto-load fresh MCP/filesystem state before each question",
      ref: "PDF Topic 3",
    },
    {
      feature: "!cmd in Skills (dynamic context)",
      status: "not-started",
      desc: "Use !`command` in SKILL.md to inject command output",
      benefit: "Skills that auto-load current state without using context window",
      ref: "PDF Topic 2",
    },
    {
      feature: "BMAD Method integration",
      status: "not-started",
      desc: "Agile development framework with 12+ specialized agents (PM, Architect, Dev, QA)",
      benefit: "Formal workflows: planning -> architecture -> implementation",
      ref: "PDF Topic 13",
    },
    {
      feature: "Ralphy CLI (batch execution)",
      status: "not-started",
      desc: "CLI orchestrator that executes tasks.md in parallel with isolated branches",
      benefit: "Process 18 services in parallel with 3-5 simultaneous agents",
      ref: "PDF Topic 14",
    },
  ];

  // ── File Path Helpers ──────────────────────────────────────
  var BASE_PATH = "/Users/nelsonperez/Desktop/OCAgents";

  function agentBasePath(agentDir) {
    if (agentDir.indexOf("(root)") === 0) return BASE_PATH;
    return BASE_PATH + "/" + agentDir.replace(/\/$/, "");
  }

  function skillFilePath(agentDir, skillName) {
    var base = agentBasePath(agentDir);
    var cleaned = skillName.replace(/\.md$/, "").replace(/\/$/, "");
    return base + "/.claude/skills/" + cleaned + "/SKILL.md";
  }

  function ruleFilePath(agentDir, ruleName) {
    var base = agentBasePath(agentDir);
    return base + "/.claude/rules/" + ruleName;
  }

  function knowledgeFilePath(name, section) {
    if (section === "(root)") return BASE_PATH + "/" + name;
    // Handle "(symlinked)" suffix
    var cleanSection = section.replace(/ \(symlinked\)/, "");
    return BASE_PATH + "/" + cleanSection + name;
  }

  function fileLink(text, filePath, linkStyle) {
    var baseStyle = {
      color: linkStyle && linkStyle.color ? linkStyle.color : theme.text,
      textDecoration: "none",
      cursor: "pointer",
      borderBottom: "1px dashed " + theme.dim,
      paddingBottom: "1px",
      transition: "border-color 0.2s",
    };
    if (linkStyle) {
      var keys = Object.keys(linkStyle);
      for (var k = 0; k < keys.length; k++) {
        baseStyle[keys[k]] = linkStyle[keys[k]];
      }
    }
    return React.createElement(
      "a",
      {
        href: "file://" + filePath,
        title: filePath,
        style: baseStyle,
      },
      text
    );
  }

  // ── Helper Functions ───────────────────────────────────────

  function getVal(obj, key, fallback) {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    if (obj[key] === null || obj[key] === undefined) {
      return fallback;
    }
    return obj[key];
  }

  function safeLen(arr) {
    if (arr === null || arr === undefined) {
      return 0;
    }
    return arr.length;
  }

  function priorityColor(p) {
    if (p === "critical") return COLORS.critical;
    if (p === "high") return COLORS.high;
    if (p === "medium") return COLORS.medium;
    return COLORS.low;
  }

  function statusDotColor(s) {
    if (s === "done") return COLORS.done;
    if (s === "progress") return COLORS.progress;
    if (s === "blocked") return COLORS.blocked;
    return COLORS.pending;
  }

  function statusLabel(s) {
    if (s === "done") return "DONE";
    if (s === "progress") return "IN PROGRESS";
    if (s === "blocked") return "BLOCKED";
    return "PENDING";
  }

  function progressPercent(num, total) {
    if (total === 0) return 0;
    return Math.round((num / total) * 100);
  }

  function missionStatusBadgeColor(s) {
    if (s === "ACTIVE") return COLORS.done;
    if (s === "BLOCKED") return COLORS.blocked;
    return COLORS.pending;
  }

  // ── Shared Style Helpers ───────────────────────────────────

  var fontMono = "'JetBrains Mono', monospace";

  function cardStyle() {
    return {
      background: theme.card,
      border: "1px solid " + theme.cardBorder,
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
    };
  }

  function badgeStyle(bgColor, textColor) {
    return {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: "700",
      fontFamily: fontMono,
      letterSpacing: "2px",
      textTransform: "uppercase",
      background: bgColor,
      color: textColor || "#000",
      marginRight: "6px",
      marginBottom: "4px",
    };
  }

  function dotStyle(color, size) {
    var s = size || 8;
    return {
      display: "inline-block",
      width: s + "px",
      height: s + "px",
      borderRadius: "50%",
      background: color,
      marginRight: "6px",
      flexShrink: 0,
    };
  }

  function sectionTitle(text) {
    return React.createElement(
      "div",
      {
        style: {
          fontSize: "11px",
          fontFamily: fontMono,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: theme.dim,
          marginBottom: "12px",
          marginTop: "24px",
        },
      },
      text
    );
  }

  // ── Icon Circle ────────────────────────────────────────────
  function iconCircle(letter, color, size) {
    var s = size || 40;
    return React.createElement(
      "div",
      {
        style: {
          width: s + "px",
          height: s + "px",
          borderRadius: "50%",
          background: color + "22",
          border: "2px solid " + color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(s * 0.4) + "px",
          fontWeight: "800",
          color: color,
          fontFamily: fontMono,
          flexShrink: 0,
        },
      },
      letter
    );
  }

  // ── Progress Bar ───────────────────────────────────────────
  function progressBar(num, total, color) {
    var pct = progressPercent(num, total);
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "8px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            height: "6px",
            background: theme.cardBorder,
            borderRadius: "3px",
            overflow: "hidden",
          },
        },
        React.createElement("div", {
          style: {
            width: pct + "%",
            height: "100%",
            background: color || COLORS.done,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          },
        })
      ),
      React.createElement(
        "span",
        {
          style: {
            fontSize: "12px",
            fontFamily: fontMono,
            color: theme.sub,
            minWidth: "50px",
            textAlign: "right",
          },
        },
        num + "/" + total
      )
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB 1: COMMAND CENTER
  // ══════════════════════════════════════════════════════════
  function renderCommandCenter() {
    // Nelson card
    var nelsonCard = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + COLORS.nelson,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }),
      },
      iconCircle("N", COLORS.nelson, 48),
      React.createElement(
        "div",
        { style: { flex: 1, minWidth: "200px" } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "18px",
              fontWeight: "700",
              color: theme.text,
              fontFamily: fontMono,
            },
          },
          "Nelson Perez"
        ),
        React.createElement(
          "div",
          {
            style: {
              fontSize: "12px",
              color: theme.sub,
              marginTop: "4px",
            },
          },
          "Project Lead / BPA Architect"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          },
        },
        nelsonBadges.map(function (b, i) {
          return React.createElement(
            "span",
            {
              key: i,
              style: badgeStyle(COLORS.nelson + "33", COLORS.nelson),
            },
            b
          );
        })
      )
    );

    // Stats grid
    var stats = [
      {
        label: "Review Queue",
        value: "0",
        sub: "All resolved",
        color: COLORS.done,
      },
      {
        label: "Missions",
        value: "5",
        sub: "active",
        color: COLORS.medium,
      },
      {
        label: "Maturity Avg",
        value: "93%",
        sub: "across 5 agents",
        color: COLORS.manual,
      },
      {
        label: "Critical Pending",
        value: "0",
        sub: "M-001 in progress",
        color: COLORS.done,
      },
    ];

    var statsGrid = React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        },
      },
      stats.map(function (s, i) {
        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              textAlign: "center",
              padding: "16px",
              marginBottom: "0",
            }),
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "11px",
                fontFamily: fontMono,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: theme.dim,
                marginBottom: "8px",
              },
            },
            s.label
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "32px",
                fontWeight: "800",
                color: s.color,
                fontFamily: fontMono,
              },
            },
            s.value
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                color: theme.sub,
                marginTop: "4px",
              },
            },
            s.sub
          )
        );
      })
    );

    // Agent cards
    var agentCards = React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        },
      },
      agents.map(function (a, i) {
        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              marginBottom: "0",
              borderLeft: "4px solid " + a.color,
            }),
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              },
            },
            iconCircle(a.letter, a.color, 36),
            React.createElement(
              "div",
              { style: { flex: 1 } },
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "14px",
                    fontWeight: "700",
                    color: theme.text,
                    fontFamily: fontMono,
                  },
                },
                a.name
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "11px",
                    color: theme.sub,
                    fontStyle: "italic",
                  },
                },
                a.alias
              )
            ),
            React.createElement(
              "span",
              {
                style: badgeStyle(
                  a.maturity === 100
                    ? COLORS.done + "33"
                    : COLORS.high + "33",
                  a.maturity === 100 ? COLORS.done : COLORS.high
                ),
              },
              a.maturity + "%"
            )
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "12px",
                color: theme.sub,
                padding: "8px 12px",
                background: theme.codeBg,
                borderRadius: "6px",
                borderLeft: "3px solid " + a.color,
              },
            },
            a.currentTask
          )
        );
      })
    );

    // Mission previews
    var missionPreviews = React.createElement(
      "div",
      null,
      sectionTitle("Mission Overview"),
      missions.map(function (m, i) {
        var pColor = priorityColor(m.priority);
        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 20px",
              flexWrap: "wrap",
            }),
          },
          React.createElement(
            "span",
            {
              style: {
                fontFamily: fontMono,
                fontWeight: "800",
                fontSize: "13px",
                color: pColor,
                minWidth: "50px",
              },
            },
            m.id
          ),
          React.createElement(
            "span",
            {
              style: {
                fontWeight: "600",
                color: theme.text,
                flex: 1,
                minWidth: "120px",
              },
            },
            m.name
          ),
          React.createElement(
            "span",
            { style: badgeStyle(pColor + "33", pColor) },
            m.priority
          ),
          React.createElement(
            "span",
            {
              style: badgeStyle(
                missionStatusBadgeColor(m.status) + "33",
                missionStatusBadgeColor(m.status)
              ),
            },
            m.status
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: "4px",
                alignItems: "center",
              },
            },
            m.tasks.map(function (t, j) {
              return React.createElement("span", {
                key: j,
                style: dotStyle(statusDotColor(t.status), 10),
                title: t.agent + ": " + statusLabel(t.status),
              });
            })
          )
        );
      })
    );

    // SITREP card (from Review Queue)
    var sitrepCard = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + COLORS.orchestrator,
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          },
        },
        React.createElement("span", {
          style: badgeStyle(COLORS.orchestrator + "33", COLORS.orchestrator),
        }, "SITREP"),
        React.createElement("span", {
          style: { fontSize: "12px", fontFamily: fontMono, color: theme.dim },
        }, "2026-02-21 23:00")
      ),
      React.createElement("div", {
        style: {
          fontSize: "13px",
          color: theme.sub,
          lineHeight: "1.6",
          padding: "12px",
          background: theme.codeBg,
          borderRadius: "8px",
        },
      },
        "M-001 StatusBitacora remains critical path. 8 behaviours with wrong target blocks need cleanup. ",
        "REST API workaround proven on Fito. Recommend: cleanup first, then sequential creation per service."
      )
    );

    // Recent decisions (compact)
    var recentDecisions = React.createElement(
      "div",
      null,
      sectionTitle("Recent Decisions"),
      decisions.slice(0, 3).map(function (d, i) {
        return React.createElement(
          "div",
          {
            key: i,
            style: {
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
              padding: "8px 0",
              borderBottom: i < 2 ? "1px solid " + theme.cardBorder : "none",
              fontSize: "12px",
            },
          },
          React.createElement("span", {
            style: { fontFamily: fontMono, color: COLORS.medium, minWidth: "90px", flexShrink: 0 },
          }, d.date),
          React.createElement("span", {
            style: { color: theme.text, flex: 1 },
          }, d.what),
          React.createElement("span", {
            style: { color: theme.dim, fontSize: "11px", maxWidth: "200px" },
          }, d.impact)
        );
      })
    );

    return React.createElement(
      "div",
      null,
      nelsonCard,
      React.createElement("div", { style: { height: "16px" } }),
      statsGrid,
      agentCards,
      sitrepCard,
      missionPreviews,
      recentDecisions
    );
  }

  // (Review Queue tab removed - SITREP merged into Command Center)
  function _removedReviewQueue() {
    var emptyCard = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          textAlign: "center",
          padding: "48px 20px",
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "48px",
            marginBottom: "16px",
            color: COLORS.done,
          },
        },
        "[OK]"
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "18px",
            fontWeight: "700",
            color: theme.text,
            fontFamily: fontMono,
            marginBottom: "8px",
          },
        },
        "No items pending review"
      ),
      React.createElement(
        "div",
        { style: { fontSize: "13px", color: theme.sub } },
        "All requests have corresponding responses"
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            flexWrap: "wrap",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              padding: "8px 16px",
              background: theme.codeBg,
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: fontMono,
              color: theme.sub,
            },
          },
          "Requests: test->manual_001.md"
        ),
        React.createElement(
          "div",
          {
            style: {
              padding: "8px 16px",
              background: theme.codeBg,
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: fontMono,
              color: COLORS.done,
            },
          },
          "Response: test-manual_001.md [MATCHED]"
        )
      )
    );

    var sitrepCard = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + COLORS.orchestrator,
          marginTop: "16px",
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          },
        },
        React.createElement(
          "span",
          { style: badgeStyle(COLORS.orchestrator + "33", COLORS.orchestrator) },
          "SITREP"
        ),
        React.createElement(
          "span",
          {
            style: {
              fontSize: "12px",
              fontFamily: fontMono,
              color: theme.dim,
            },
          },
          "2026-02-21 23:00"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "14px",
            fontWeight: "600",
            color: theme.text,
            marginBottom: "8px",
          },
        },
        "Latest SITREP Recommendation"
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "13px",
            color: theme.sub,
            lineHeight: "1.6",
            padding: "12px",
            background: theme.codeBg,
            borderRadius: "8px",
          },
        },
        "M-001 StatusBitacora remains critical path. 8 behaviours with wrong target blocks need cleanup before continuing bulk creation. ",
        "REST API workaround proven on Fito (reference model). ",
        "Recommend: Complete cleanup first, then sequential creation per service with verified block IDs from statusbitacora-mapping.md."
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: "12px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "11px",
              fontFamily: fontMono,
              color: theme.dim,
            },
          },
          "Files: LATEST.md | SITREP-2026-02-21-1730.md | SITREP-2026-02-21-1745.md | SITREP-2026-02-21-2300.md"
        )
      )
    );

    return React.createElement("div", null, emptyCard, sitrepCard);
  }

  // ══════════════════════════════════════════════════════════
  // TAB 2: MISSIONS
  // ══════════════════════════════════════════════════════════
  function renderMissions() {
    return React.createElement(
      "div",
      null,
      missions.map(function (m, i) {
        var isExpanded = expandedMission === i;
        var pColor = priorityColor(m.priority);

        var header = React.createElement(
          "div",
          {
            onClick: function () {
              setExpandedMission(isExpanded ? null : i);
            },
            style: {
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            },
          },
          React.createElement(
            "span",
            {
              style: {
                fontFamily: fontMono,
                fontWeight: "800",
                fontSize: "15px",
                color: pColor,
                minWidth: "55px",
              },
            },
            m.id
          ),
          React.createElement(
            "span",
            {
              style: {
                fontWeight: "700",
                fontSize: "15px",
                color: theme.text,
                flex: 1,
                minWidth: "140px",
              },
            },
            m.name
          ),
          React.createElement(
            "span",
            { style: badgeStyle(pColor + "33", pColor) },
            m.priority
          ),
          React.createElement(
            "span",
            {
              style: badgeStyle(
                missionStatusBadgeColor(m.status) + "33",
                missionStatusBadgeColor(m.status)
              ),
            },
            m.status
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "12px",
                fontFamily: fontMono,
                color: theme.dim,
              },
            },
            m.deadline
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "16px",
                color: theme.dim,
                marginLeft: "auto",
                transition: "transform 0.2s",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
              },
            },
            ">"
          )
        );

        var expanded = null;
        if (isExpanded) {
          expanded = React.createElement(
            "div",
            {
              style: {
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid " + theme.cardBorder,
              },
            },
            // Description
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "13px",
                  color: theme.sub,
                  marginBottom: "8px",
                },
              },
              m.desc
            ),
            // Owner / Support
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  gap: "24px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                },
              },
              React.createElement(
                "span",
                {
                  style: {
                    fontSize: "12px",
                    color: theme.dim,
                    fontFamily: fontMono,
                  },
                },
                "Owner: ",
                React.createElement(
                  "span",
                  { style: { color: theme.text } },
                  m.owner
                )
              ),
              m.support
                ? React.createElement(
                    "span",
                    {
                      style: {
                        fontSize: "12px",
                        color: theme.dim,
                        fontFamily: fontMono,
                      },
                    },
                    "Support: ",
                    React.createElement(
                      "span",
                      { style: { color: theme.text } },
                      m.support
                    )
                  )
                : null
            ),
            // Why
            React.createElement(
              "div",
              {
                style: {
                  padding: "12px",
                  background: theme.codeBg,
                  borderRadius: "8px",
                  marginBottom: "16px",
                  borderLeft: "3px solid " + pColor,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "11px",
                    fontFamily: fontMono,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: theme.dim,
                    marginBottom: "6px",
                  },
                },
                "WHY"
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "13px",
                    color: theme.text,
                    lineHeight: "1.5",
                  },
                },
                m.why
              )
            ),
            // Progress bar
            progressBar(m.progressNum, m.progressTotal, pColor),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  color: theme.sub,
                  marginTop: "4px",
                  marginBottom: "16px",
                  fontFamily: fontMono,
                },
              },
              m.progress
            ),
            // Tasks
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: theme.dim,
                  marginBottom: "8px",
                },
              },
              "TASKS"
            ),
            m.tasks.map(function (t, j) {
              var sColor = statusDotColor(t.status);
              return React.createElement(
                "div",
                {
                  key: j,
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    background: theme.codeBg,
                    borderRadius: "6px",
                    marginBottom: "6px",
                  },
                },
                React.createElement("span", { style: dotStyle(sColor, 10) }),
                React.createElement(
                  "span",
                  {
                    style: {
                      fontSize: "11px",
                      fontWeight: "700",
                      fontFamily: fontMono,
                      color: t.color,
                      minWidth: "60px",
                    },
                  },
                  t.agent
                ),
                React.createElement(
                  "span",
                  {
                    style: {
                      fontSize: "12px",
                      color: theme.text,
                      flex: 1,
                    },
                  },
                  t.text
                ),
                React.createElement(
                  "span",
                  {
                    style: badgeStyle(sColor + "33", sColor),
                  },
                  statusLabel(t.status)
                )
              );
            })
          );
        }

        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              borderLeft: "4px solid " + pColor,
            }),
          },
          header,
          expanded
        );
      })
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB 3: AGENTS
  // ══════════════════════════════════════════════════════════
  function renderAgents() {
    var agent = agents[selectedAgent];

    var agentButtons = React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        },
      },
      agents.map(function (a, i) {
        var isActive = selectedAgent === i;
        return React.createElement(
          "button",
          {
            key: i,
            onClick: function () {
              setSelectedAgent(i);
            },
            style: {
              padding: "10px 20px",
              borderRadius: "8px",
              border: isActive
                ? "2px solid " + a.color
                : "1px solid " + theme.cardBorder,
              background: isActive ? a.color + "22" : theme.card,
              color: isActive ? a.color : theme.sub,
              fontFamily: fontMono,
              fontSize: "13px",
              fontWeight: isActive ? "700" : "400",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            },
          },
          iconCircle(a.letter, a.color, 24),
          a.name
        );
      })
    );

    // Agent detail header
    var detailHeader = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + agent.color,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }),
      },
      iconCircle(agent.letter, agent.color, 56),
      React.createElement(
        "div",
        { style: { flex: 1, minWidth: "200px" } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "20px",
              fontWeight: "800",
              color: theme.text,
              fontFamily: fontMono,
            },
          },
          agent.name
        ),
        React.createElement(
          "div",
          {
            style: {
              fontSize: "14px",
              color: agent.color,
              fontStyle: "italic",
              marginTop: "2px",
            },
          },
          agent.alias
        ),
        React.createElement(
          "div",
          {
            style: {
              fontSize: "12px",
              fontFamily: fontMono,
              marginTop: "4px",
            },
          },
          fileLink(agent.dir, agentBasePath(agent.dir), {
            fontSize: "12px",
            fontFamily: fontMono,
            color: theme.dim,
          })
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "32px",
            fontWeight: "800",
            color: agent.maturity === 100 ? COLORS.done : COLORS.high,
            fontFamily: fontMono,
          },
        },
        agent.maturity + "%"
      )
    );

    // Current task
    var taskCard = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + agent.color,
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "11px",
            fontFamily: fontMono,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: theme.dim,
            marginBottom: "8px",
          },
        },
        "CURRENT TASK"
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "14px",
            color: theme.text,
            lineHeight: "1.5",
          },
        },
        agent.currentTask
      )
    );

    // Config grid: CLAUDE.md, Skills, Hooks, Rules
    var gridItems = [
      {
        label: "CLAUDE.md",
        value: agent.claudeMd ? "OK" : "MISSING",
        ok: agent.claudeMd,
      },
      {
        label: "Skills",
        value: safeLen(agent.skills).toString(),
        ok: safeLen(agent.skills) > 0,
      },
      {
        label: "Hooks",
        value: safeLen(agent.hooks).toString(),
        ok: safeLen(agent.hooks) > 0,
      },
      {
        label: "Rules",
        value: safeLen(agent.rules).toString(),
        ok: safeLen(agent.rules) > 0,
      },
    ];

    var configGrid = React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        },
      },
      gridItems.map(function (g, i) {
        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              textAlign: "center",
              padding: "14px",
              marginBottom: "0",
            }),
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "11px",
                fontFamily: fontMono,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: theme.dim,
                marginBottom: "6px",
              },
            },
            g.label
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "20px",
                fontWeight: "800",
                color: g.ok ? COLORS.done : COLORS.critical,
                fontFamily: fontMono,
              },
            },
            g.value
          )
        );
      })
    );

    // Detail lists with descriptions
    function detailListRich(title, items, color, infoMap, pathFn) {
      if (safeLen(items) === 0) return null;
      return React.createElement(
        "div",
        { style: { marginBottom: "16px" } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "11px",
              fontFamily: fontMono,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: theme.dim,
              marginBottom: "8px",
            },
          },
          title
        ),
        items.map(function (item, idx) {
          var info = infoMap ? infoMap[item] : null;
          var descText = null;
          if (info) {
            var infoStr = "";
            if (typeof info === "string") {
              infoStr = info;
            } else if (info.desc) {
              infoStr = info.desc;
              if (info.invoke) {
                infoStr = "[" + info.invoke + "] " + infoStr;
              }
            }
            descText = React.createElement(
              "div",
              {
                style: {
                  fontSize: "10px",
                  color: theme.dim,
                  marginTop: "3px",
                  lineHeight: "1.4",
                  paddingLeft: "14px",
                },
              },
              infoStr
            );
          }
          var itemDisplay = item;
          if (pathFn) {
            var fPath = pathFn(item);
            if (fPath) {
              itemDisplay = fileLink(item, fPath, {
                fontSize: "12px",
                fontFamily: fontMono,
                color: theme.text,
              });
            }
          }
          return React.createElement(
            "div",
            {
              key: idx,
              style: {
                padding: "8px 12px",
                background: theme.codeBg,
                borderRadius: "6px",
                marginBottom: "4px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  fontFamily: fontMono,
                  color: theme.text,
                },
              },
              React.createElement("span", {
                style: dotStyle(color || agent.color, 8),
              }),
              itemDisplay
            ),
            descText
          );
        })
      );
    }

    var agDir = agent.dir;
    var skillsList = detailListRich("Skills", agent.skills, agent.color, skillInfo, function (s) {
      return skillFilePath(agDir, s);
    });
    var rulesList = detailListRich("Rules", agent.rules, COLORS.medium, ruleInfo, function (r) {
      return ruleFilePath(agDir, r);
    });
    var hooksList = detailListRich("Hooks", agent.hooks, COLORS.high, hookInfo);
    var profileInfo = null;
    if (agent.hasProfile) {
      profileInfo = detailListRich(
        "Profile",
        [agent.profile],
        COLORS.done,
        null,
        function (p) {
          return BASE_PATH + "/shared/profiles/" + p;
        }
      );
    } else {
      profileInfo = React.createElement(
        "div",
        { style: { marginBottom: "16px" } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "11px",
              fontFamily: fontMono,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: theme.dim,
              marginBottom: "8px",
            },
          },
          "PROFILE"
        ),
        React.createElement(
          "div",
          {
            style: {
              padding: "6px 12px",
              background: theme.codeBg,
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: fontMono,
              color: COLORS.critical,
            },
          },
          "No profile in shared/profiles/"
        )
      );
    }

    var testSpecsList = null;
    if (safeLen(agent.testSpecs) > 0) {
      testSpecsList = detailListRich(
        "Test Specs",
        agent.testSpecs,
        COLORS.test,
        null,
        function (s) {
          return BASE_PATH + "/testing/tests/specs/" + s;
        }
      );
    }

    // MCP Servers section
    var mcpSection = null;
    if (agent.mcpServers && agent.mcpServers.length > 0) {
      mcpSection = React.createElement(
        "div",
        { style: { marginBottom: "16px" } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "11px",
              fontFamily: fontMono,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: theme.dim,
              marginBottom: "8px",
            },
          },
          "MCP SERVERS"
        ),
        agent.mcpServers.map(function (srv, idx) {
          var accessColor = COLORS.done;
          if (srv.access === "read/write") accessColor = COLORS.config;
          if (srv.access === "ad-hoc") accessColor = COLORS.dim;
          return React.createElement(
            "div",
            {
              key: idx,
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                background: theme.codeBg,
                borderRadius: "6px",
                marginBottom: "4px",
              },
            },
            React.createElement("span", {
              style: dotStyle(accessColor, 10),
            }),
            React.createElement(
              "span",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  fontWeight: "700",
                  color: theme.text,
                },
              },
              srv.name
            ),
            React.createElement(
              "span",
              {
                style: badgeStyle(
                  accessColor + "33",
                  accessColor
                ),
              },
              srv.access.toUpperCase()
            ),
            srv.tools > 0
              ? React.createElement(
                  "span",
                  {
                    style: {
                      fontSize: "10px",
                      fontFamily: fontMono,
                      color: theme.dim,
                    },
                  },
                  srv.tools + " tools"
                )
              : null
          );
        })
      );
    }

    return React.createElement(
      "div",
      null,
      agentButtons,
      detailHeader,
      taskCard,
      configGrid,
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          },
        },
        React.createElement("div", null, skillsList, hooksList, mcpSection),
        React.createElement("div", null, rulesList, profileInfo, testSpecsList)
      )
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB 6: BRAIN
  // ══════════════════════════════════════════════════════════
  function renderInstitutionalization() {
    // Pipeline
    var pipelineSection = React.createElement(
      "div",
      { style: { marginBottom: "32px" } },
      sectionTitle("Orchestrator Pipeline"),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: "0",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "8px",
          },
        },
        pipeline.map(function (p, i) {
          var items = [];
          items.push(
            React.createElement(
              "div",
              {
                key: "step-" + i,
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: COLORS.done + "22",
                    border: "2px solid " + COLORS.done,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "800",
                    color: COLORS.done,
                    fontFamily: fontMono,
                    marginBottom: "8px",
                  },
                },
                p.done ? "+" : p.step.toString()
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "12px",
                    fontWeight: "700",
                    color: theme.text,
                    fontFamily: fontMono,
                    textAlign: "center",
                  },
                },
                p.name
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "10px",
                    color: theme.dim,
                    textAlign: "center",
                    marginTop: "2px",
                  },
                },
                p.desc
              )
            )
          );
          // connector line
          if (i < pipeline.length - 1) {
            items.push(
              React.createElement("div", {
                key: "line-" + i,
                style: {
                  flex: 1,
                  height: "2px",
                  background: COLORS.done,
                  minWidth: "20px",
                  alignSelf: "flex-start",
                  marginTop: "18px",
                },
              })
            );
          }
          return items;
        })
      )
    );

    // Per agent cards
    var agentInfra = React.createElement(
      "div",
      null,
      sectionTitle("Per-Agent Infrastructure"),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "12px",
          },
        },
        agents.map(function (a, i) {
          var items = [
            {
              label: "CLAUDE.md",
              ok: a.claudeMd,
            },
            {
              label: "Skills",
              ok: safeLen(a.skills) > 0,
              count: safeLen(a.skills),
            },
            {
              label: "Hooks",
              ok: safeLen(a.hooks) > 0,
              count: safeLen(a.hooks),
            },
            {
              label: "Rules",
              ok: safeLen(a.rules) > 0,
              count: safeLen(a.rules),
            },
          ];

          return React.createElement(
            "div",
            {
              key: i,
              style: Object.assign({}, cardStyle(), {
                borderLeft: "4px solid " + a.color,
                marginBottom: "0",
              }),
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                },
              },
              iconCircle(a.letter, a.color, 32),
              React.createElement(
                "span",
                {
                  style: {
                    fontWeight: "700",
                    color: theme.text,
                    fontFamily: fontMono,
                    fontSize: "13px",
                  },
                },
                a.name
              )
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
                },
              },
              items.map(function (it, j) {
                return React.createElement(
                  "div",
                  {
                    key: j,
                    style: {
                      textAlign: "center",
                      padding: "10px 4px",
                      background: theme.codeBg,
                      borderRadius: "6px",
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        fontSize: "16px",
                        fontWeight: "800",
                        color: it.ok ? COLORS.done : COLORS.critical,
                        fontFamily: fontMono,
                        marginBottom: "4px",
                      },
                    },
                    it.ok ? "+" : "x"
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        fontSize: "10px",
                        fontFamily: fontMono,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: theme.dim,
                      },
                    },
                    it.label
                  ),
                  it.count !== undefined
                    ? React.createElement(
                        "div",
                        {
                          style: {
                            fontSize: "10px",
                            color: theme.sub,
                            marginTop: "2px",
                          },
                        },
                        "(" + it.count + ")"
                      )
                    : null
                );
              })
            ),
            // Profile status
            React.createElement(
              "div",
              {
                style: {
                  marginTop: "10px",
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: a.hasProfile ? COLORS.done : COLORS.critical,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                },
              },
              React.createElement("span", {
                style: dotStyle(
                  a.hasProfile ? COLORS.done : COLORS.critical,
                  8
                ),
              }),
              a.hasProfile
                ? "Profile: " + a.profile
                : "Profile: MISSING"
            ),
            // Settings
            React.createElement(
              "div",
              {
                style: {
                  marginTop: "4px",
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: a.settings ? COLORS.done : COLORS.critical,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                },
              },
              React.createElement("span", {
                style: dotStyle(
                  a.settings ? COLORS.done : COLORS.critical,
                  8
                ),
              }),
              a.settings
                ? "settings.json" +
                    (a.settingsLines > 0
                      ? " (" + a.settingsLines + " lines)"
                      : "")
                : "settings.json: MISSING"
            )
          );
        })
      )
    );

    // Summary
    var summary = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          marginTop: "20px",
          textAlign: "center",
          borderTop: "3px solid " + COLORS.done,
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "24px",
            fontWeight: "800",
            color: COLORS.done,
            fontFamily: fontMono,
            marginBottom: "4px",
          },
        },
        "5/5 STEPS COMPLETE"
      ),
      React.createElement(
        "div",
        { style: { fontSize: "13px", color: theme.sub } },
        "Agent orchestrator infrastructure fully deployed"
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: "12px",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "12px",
              fontFamily: fontMono,
              color: theme.dim,
            },
          },
          "9 skills"
        ),
        React.createElement("span", { style: { fontSize: "12px", color: theme.dim } }, "|"),
        React.createElement(
          "span",
          { style: { fontSize: "12px", fontFamily: fontMono, color: theme.dim } },
          "8 rules"
        ),
        React.createElement("span", { style: { fontSize: "12px", color: theme.dim } }, "|"),
        React.createElement(
          "span",
          { style: { fontSize: "12px", fontFamily: fontMono, color: theme.dim } },
          "7 hooks"
        ),
        React.createElement("span", { style: { fontSize: "12px", color: theme.dim } }, "|"),
        React.createElement(
          "span",
          { style: { fontSize: "12px", fontFamily: fontMono, color: theme.dim } },
          "3 profiles"
        )
      )
    );

    // What is Brain?
    var explainerSection = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          marginTop: "24px",
          borderLeft: "4px solid " + COLORS.orchestrator,
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "14px",
            fontWeight: "800",
            color: theme.text,
            fontFamily: fontMono,
            marginBottom: "12px",
          },
        },
        "Brain - How agents learn"
      ),
      React.createElement(
        "div",
        { style: { fontSize: "13px", color: theme.sub, lineHeight: "1.7" } },
        "The process of converting temporary knowledge (what an agent knows in a session) ",
        "into permanent knowledge (files that persist across sessions). ",
        "Each piece of the agent system has a purpose:"
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "10px",
            marginTop: "14px",
          },
        },
        [
          { name: "CLAUDE.md", role: "Rules that ALWAYS apply. Loaded automatically." },
          { name: "Skills", role: "On-demand tasks. Invoked with /skill-name." },
          { name: "Rules", role: "Modular instructions by topic. Can have path-scoping." },
          { name: "Hooks", role: "Lifecycle automation. Validate, block, notify." },
          { name: "Settings", role: "Permissions, model, hooks. 5 levels of precedence." },
          { name: "Memory", role: "Cross-session learning. Complements CLAUDE.md." },
        ].map(function (item, idx) {
          return React.createElement(
            "div",
            {
              key: idx,
              style: {
                padding: "10px",
                background: theme.codeBg,
                borderRadius: "6px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontWeight: "700",
                  color: COLORS.orchestrator,
                  fontFamily: fontMono,
                  marginBottom: "4px",
                },
              },
              item.name
            ),
            React.createElement(
              "div",
              { style: { fontSize: "11px", color: theme.sub, lineHeight: "1.4" } },
              item.role
            )
          );
        })
      )
    );

    // Feature Gaps from Claude Code guide
    var gapSection = React.createElement(
      "div",
      { style: { marginTop: "24px" } },
      sectionTitle("Next Steps - Feature Gap Analysis"),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "12px",
            color: theme.sub,
            marginBottom: "16px",
            lineHeight: "1.5",
          },
        },
        "Based on the Professional Claude Code Guide (Feb 2026), these features are not yet implemented:"
      ),
      featureGaps.map(function (gap, idx) {
        return React.createElement(
          "div",
          {
            key: idx,
            style: Object.assign({}, cardStyle(), {
              borderLeft: "3px solid " + COLORS.high,
              padding: "14px 16px",
              marginBottom: "8px",
            }),
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              },
            },
            React.createElement(
              "span",
              {
                style: badgeStyle(COLORS.high + "33", COLORS.high),
              },
              "PENDING"
            ),
            React.createElement(
              "span",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: "700",
                  color: theme.text,
                  fontFamily: fontMono,
                },
              },
              gap.feature
            ),
            React.createElement(
              "span",
              {
                style: {
                  fontSize: "10px",
                  color: theme.dim,
                  fontFamily: fontMono,
                  marginLeft: "auto",
                },
              },
              gap.ref
            )
          ),
          React.createElement(
            "div",
            { style: { fontSize: "12px", color: theme.sub, lineHeight: "1.5" } },
            gap.desc
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: "11px",
                color: COLORS.done,
                marginTop: "6px",
                fontStyle: "italic",
              },
            },
            "Benefit: " + gap.benefit
          )
        );
      })
    );

    return React.createElement("div", null, pipelineSection, agentInfra, summary, explainerSection, gapSection);
  }

  // ══════════════════════════════════════════════════════════
  // TAB 5: KNOWLEDGE
  // ══════════════════════════════════════════════════════════
  function renderKnowledge() {
    function fileRow(name, section, exists) {
      var desc = knowledgeInfo[name] || null;
      return React.createElement(
        "div",
        {
          key: name,
          style: {
            padding: "10px 14px",
            background: theme.codeBg,
            borderRadius: "6px",
            marginBottom: "4px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "10px",
            },
          },
          React.createElement("span", {
            style: dotStyle(exists ? COLORS.done : COLORS.critical, 8),
          }),
          React.createElement(
            "span",
            {
              style: {
                flex: 1,
              },
            },
            fileLink(name, knowledgeFilePath(name, section), {
              fontSize: "13px",
              fontFamily: fontMono,
              color: theme.text,
            })
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "11px",
                fontFamily: fontMono,
                color: theme.dim,
              },
            },
            section
          ),
          React.createElement(
            "span",
            {
              style: badgeStyle(
                exists ? COLORS.done + "33" : COLORS.critical + "33",
                exists ? COLORS.done : COLORS.critical
              ),
            },
            exists ? "EXISTS" : "MISSING"
          )
        ),
        desc
          ? React.createElement(
              "div",
              {
                style: {
                  fontSize: "10px",
                  color: theme.dim,
                  marginTop: "4px",
                  paddingLeft: "14px",
                  lineHeight: "1.4",
                },
              },
              desc
            )
          : null
      );
    }

    return React.createElement(
      "div",
      null,
      sectionTitle("Knowledge Base (shared/knowledge/)"),
      React.createElement(
        "div",
        { style: cardStyle() },
        knowledgeFiles.map(function (f) {
          return fileRow(f.name, f.section, true);
        })
      ),
      sectionTitle("Other Shared Files"),
      React.createElement(
        "div",
        { style: cardStyle() },
        otherFiles.map(function (f) {
          return fileRow(f.name, f.section, true);
        })
      ),
      React.createElement(
        "div",
        {
          style: Object.assign({}, cardStyle(), {
            textAlign: "center",
            marginTop: "8px",
          }),
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "28px",
              fontWeight: "800",
              color: COLORS.done,
              fontFamily: fontMono,
            },
          },
          "16"
        ),
        React.createElement(
          "span",
          {
            style: {
              fontSize: "14px",
              color: theme.sub,
              marginLeft: "8px",
            },
          },
          "files tracked, all verified"
        )
      ),
      sectionTitle("Project File Structure"),
      React.createElement(
        "div",
        { style: cardStyle() },
        React.createElement(
          "pre",
          {
            style: {
              fontFamily: fontMono,
              fontSize: "12px",
              lineHeight: "1.6",
              color: theme.text,
              background: theme.codeBg,
              padding: "20px",
              borderRadius: "8px",
              overflow: "auto",
              whiteSpace: "pre",
              margin: 0,
            },
          },
          React.createElement("code", null, projectTree)
        )
      )
    );
  }

  // (Decisions tab removed - content merged into Command Center)
  function _removedDecisions() {
    return React.createElement(
      "div",
      null,
      sectionTitle("Decision Log"),
      decisions.map(function (d, i) {
        return React.createElement(
          "div",
          {
            key: i,
            style: Object.assign({}, cardStyle(), {
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr",
              gap: "16px",
              alignItems: "start",
            }),
          },
          // Date
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: theme.dim,
                  marginBottom: "4px",
                },
              },
              "DATE"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "14px",
                  fontWeight: "700",
                  color: COLORS.medium,
                  fontFamily: fontMono,
                },
              },
              d.date
            )
          ),
          // What + Why
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: theme.dim,
                  marginBottom: "4px",
                },
              },
              "WHAT"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "14px",
                  fontWeight: "600",
                  color: theme.text,
                  marginBottom: "8px",
                },
              },
              d.what
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: theme.dim,
                  marginBottom: "4px",
                },
              },
              "WHY"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  color: theme.sub,
                  lineHeight: "1.5",
                },
              },
              d.why
            )
          ),
          // Impact
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: theme.dim,
                  marginBottom: "4px",
                },
              },
              "IMPACT"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  color: theme.text,
                  lineHeight: "1.5",
                  padding: "8px 12px",
                  background: theme.codeBg,
                  borderRadius: "6px",
                  borderLeft: "3px solid " + COLORS.medium,
                },
              },
              d.impact
            )
          )
        );
      })
    );
  }

  // (Protocolo tab removed - content merged into Knowledge)
  function _removedProtocolo() {
    return React.createElement(
      "div",
      null,
      sectionTitle("Project File Structure"),
      React.createElement(
        "div",
        { style: cardStyle() },
        React.createElement(
          "pre",
          {
            style: {
              fontFamily: fontMono,
              fontSize: "12px",
              lineHeight: "1.6",
              color: theme.text,
              background: theme.codeBg,
              padding: "20px",
              borderRadius: "8px",
              overflow: "auto",
              whiteSpace: "pre",
              margin: 0,
            },
          },
          React.createElement("code", null, projectTree)
        )
      ),
      sectionTitle("Communication Protocol"),
      React.createElement(
        "div",
        { style: cardStyle() },
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            },
          },
          // Requests
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
                borderLeft: "3px solid " + COLORS.test,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  fontWeight: "700",
                  color: COLORS.test,
                  marginBottom: "8px",
                },
              },
              "REQUESTS"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  color: theme.text,
                },
              },
              "Format: [from]->[to]_NNN.md"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: theme.dim,
                  marginTop: "4px",
                },
              },
              "Dir: shared/requests/"
            )
          ),
          // Responses
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
                borderLeft: "3px solid " + COLORS.manual,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  fontWeight: "700",
                  color: COLORS.manual,
                  marginBottom: "8px",
                },
              },
              "RESPONSES"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  color: theme.text,
                },
              },
              "Format: [to]-[from]_NNN.md"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: theme.dim,
                  marginTop: "4px",
                },
              },
              "Dir: shared/responses/"
            )
          ),
          // Knowledge
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
                borderLeft: "3px solid " + COLORS.config,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  fontWeight: "700",
                  color: COLORS.config,
                  marginBottom: "8px",
                },
              },
              "KNOWLEDGE"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  color: theme.text,
                },
              },
              "Shared docs + CHANGELOG"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: theme.dim,
                  marginTop: "4px",
                },
              },
              "Dir: shared/knowledge/"
            )
          ),
          // Profiles
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
                borderLeft: "3px solid " + COLORS.orchestrator,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  fontWeight: "700",
                  color: COLORS.orchestrator,
                  marginBottom: "8px",
                },
              },
              "PROFILES"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontFamily: fontMono,
                  color: theme.text,
                },
              },
              "Agent identity + capabilities"
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontFamily: fontMono,
                  color: theme.dim,
                  marginTop: "4px",
                },
              },
              "Dir: shared/profiles/"
            )
          )
        )
      ),
      sectionTitle("Agent Rules Summary"),
      React.createElement(
        "div",
        { style: cardStyle() },
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
            },
          },
          // Config Rules
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontWeight: "700",
                  fontFamily: fontMono,
                  color: COLORS.config,
                  marginBottom: "8px",
                },
              },
              "Config Agent Rules"
            ),
            ["ALWAYS log changes to CHANGELOG.md", "ALWAYS read current state before modifying", "ALWAYS verify field IDs (not labels)"].map(function (r, i) {
              return React.createElement(
                "div",
                {
                  key: i,
                  style: {
                    fontSize: "11px",
                    color: theme.sub,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  },
                },
                React.createElement("span", {
                  style: dotStyle(COLORS.config, 6),
                }),
                r
              );
            })
          ),
          // Manual Rules
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontWeight: "700",
                  fontFamily: fontMono,
                  color: COLORS.manual,
                  marginBottom: "8px",
                },
              },
              "Manual Agent Rules"
            ),
            ["NEVER use create/update/delete - READ-ONLY", "Always extract fresh data from MCP", "Structured output: JSON or markdown tables"].map(function (r, i) {
              return React.createElement(
                "div",
                {
                  key: i,
                  style: {
                    fontSize: "11px",
                    color: theme.sub,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  },
                },
                React.createElement("span", {
                  style: dotStyle(COLORS.manual, 6),
                }),
                r
              );
            })
          ),
          // Test Rules
          React.createElement(
            "div",
            {
              style: {
                padding: "14px",
                background: theme.codeBg,
                borderRadius: "8px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontWeight: "700",
                  fontFamily: fontMono,
                  color: COLORS.test,
                  marginBottom: "8px",
                },
              },
              "Test Agent Rules"
            ),
            ["ALWAYS read profiles + CHANGELOG first", "NEVER assume UI structure - verify first", "Tests in specs/, Page Objects in pages/"].map(function (r, i) {
              return React.createElement(
                "div",
                {
                  key: i,
                  style: {
                    fontSize: "11px",
                    color: theme.sub,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  },
                },
                React.createElement("span", {
                  style: dotStyle(COLORS.test, 6),
                }),
                r
              );
            })
          )
        )
      ),
      sectionTitle("Session Start Protocol"),
      React.createElement(
        "div",
        {
          style: Object.assign({}, cardStyle(), {
            padding: "16px",
          }),
        },
        [
          "1. Read all profiles in shared/profiles/",
          "2. Read shared/knowledge/CHANGELOG.md for recent changes",
          "3. Check shared/requests/ for pending requests",
          "4. Respond within the same session",
        ].map(function (step, i) {
          return React.createElement(
            "div",
            {
              key: i,
              style: {
                padding: "8px 12px",
                fontSize: "13px",
                fontFamily: fontMono,
                color: theme.text,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderBottom:
                  i < 3 ? "1px solid " + theme.cardBorder : "none",
              },
            },
            React.createElement("span", {
              style: dotStyle(COLORS.done, 8),
            }),
            step
          );
        })
      )
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB RENDERER
  // ══════════════════════════════════════════════════════════
  function renderActiveTab() {
    if (activeTab === 0) return renderCommandCenter();
    if (activeTab === 1) return renderMissions();
    if (activeTab === 2) return renderAgents();
    if (activeTab === 3) return renderCommsLog();
    if (activeTab === 4) return renderKnowledge();
    if (activeTab === 5) return renderInstitutionalization();
    if (activeTab === 6) return renderHowItWorks();
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // TAB 7: HOW IT WORKS
  // ══════════════════════════════════════════════════════════
  function renderHowItWorks() {
    var demoPrompt = 'Connect service CENASA Registro Zoosanitario to the Bitacora. ' +
      'Step 1: Have the Manual Agent extract the complete service structure (form, fields, blocks). ' +
      'Step 2: Have the Config Agent create the StatusBitacora determinant + effect + "Su empresa seleccionada" panel. ' +
      'Step 3: Have the Test Agent generate and execute E2E tests validating the complete flow.';

    // Intro
    var intro = React.createElement(
      "div",
      {
        style: Object.assign({}, cardStyle(), {
          borderLeft: "4px solid " + COLORS.orchestrator,
        }),
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "16px",
            fontWeight: "800",
            color: theme.text,
            fontFamily: fontMono,
            marginBottom: "12px",
          },
        },
        "Multi-Agent Orchestration Demo"
      ),
      React.createElement(
        "div",
        { style: { fontSize: "13px", color: theme.sub, lineHeight: "1.7", marginBottom: "16px" } },
        "This example shows how a single prompt to the Coordinator triggers coordinated actions ",
        "across all 3 agents, generating communication, knowledge and automatic validation."
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "11px",
            fontFamily: fontMono,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: theme.dim,
            marginBottom: "8px",
          },
        },
        "EXACT PROMPT TO COORDINATOR"
      ),
      React.createElement(
        "div",
        {
          style: {
            padding: "14px 16px",
            background: theme.codeBg,
            borderRadius: "8px",
            border: "1px solid " + COLORS.orchestrator + "44",
            fontSize: "13px",
            fontFamily: fontMono,
            color: COLORS.orchestrator,
            lineHeight: "1.6",
            cursor: "pointer",
          },
          title: "Click para copiar",
          onClick: function () {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(demoPrompt);
            }
          },
        },
        "> " + demoPrompt
      )
    );

    // Timeline steps
    var steps = [
      {
        num: "1",
        agent: "Orchestrator",
        color: COLORS.orchestrator,
        letter: "O",
        title: "Receives and decomposes the task",
        desc: "The coordinator analyzes the prompt, identifies 3 sub-tasks and launches agents in sequence.",
        produces: "Launches Manual Agent as subagent with specific prompt",
        files: [],
      },
      {
        num: "2",
        agent: "Manual Agent",
        color: COLORS.manual,
        letter: "M",
        title: "Extracts service structure via MCP",
        desc: "Connects to BPA-cuba, executes service_get + form_get + field_list + bot_list for CENASA. Writes structured response.",
        produces: "shared/responses/manual-config_NNN.md with complete form",
        files: [
          "shared/responses/manual-config_NNN.md",
          "shared/knowledge/cenasa-extraction.md",
        ],
      },
      {
        num: "3",
        agent: "Config Agent",
        color: COLORS.config,
        letter: "C",
        title: "Configures determinant + effect + panel",
        desc: "Reads the Manual extraction, identifies the target block, creates StatusBitacora via REST API, creates effect + mustache panel with NIT and Empresa.",
        produces: "Changes in BPA-cuba + updated CHANGELOG",
        files: [
          "shared/knowledge/CHANGELOG.md (new entry)",
          "BPA-cuba: determinant + behaviour + effect (via MCP)",
          "BPA-cuba: panel 'Su empresa seleccionada' (via MCP)",
        ],
      },
      {
        num: "4",
        agent: "Test Agent",
        color: COLORS.test,
        letter: "T",
        title: "Generates and runs E2E tests",
        desc: "Reads the Manual extraction + Config CHANGELOG. Generates Playwright spec that navigates Bitacora -> selects company -> enters CENASA -> verifies Block12 appears.",
        produces: "testing/tests/specs/cenasa.spec.ts + results",
        files: [
          "testing/tests/specs/cenasa.spec.ts",
          "testing/tests/pages/CenasaPage.ts",
          "test-results/ (screenshots)",
        ],
      },
      {
        num: "5",
        agent: "Orchestrator",
        color: COLORS.orchestrator,
        letter: "O",
        title: "Consolidates and reports",
        desc: "Receives results from all 3 agents. Updates MISSIONS.md, generates SITREP, refreshes dashboard.",
        produces: "SITREP + updated MISSIONS.md + dashboard refresh",
        files: [
          "shared/MISSIONS.md (progress +1)",
          "shared/sitreps/SITREP-YYYY-MM-DD.md",
          "dashboard.jsx (via /dashboard-update)",
        ],
      },
    ];

    var timeline = React.createElement(
      "div",
      { style: { marginTop: "24px" } },
      sectionTitle("Step by step flow"),
      steps.map(function (step, idx) {
        return React.createElement(
          "div",
          {
            key: idx,
            style: {
              display: "flex",
              gap: "16px",
              marginBottom: "0",
            },
          },
          // Left line
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "40px",
              },
            },
            iconCircle(step.letter, step.color, 36),
            idx < steps.length - 1
              ? React.createElement("div", {
                  style: {
                    width: "2px",
                    flex: 1,
                    background: step.color + "44",
                    minHeight: "20px",
                  },
                })
              : null
          ),
          // Right content
          React.createElement(
            "div",
            {
              style: Object.assign({}, cardStyle(), {
                flex: 1,
                borderLeft: "3px solid " + step.color,
                marginBottom: "12px",
              }),
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                },
              },
              React.createElement(
                "span",
                {
                  style: badgeStyle(step.color + "33", step.color),
                },
                "STEP " + step.num
              ),
              React.createElement(
                "span",
                {
                  style: {
                    fontSize: "13px",
                    fontWeight: "700",
                    color: theme.text,
                    fontFamily: fontMono,
                  },
                },
                step.agent
              )
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "14px",
                  fontWeight: "700",
                  color: theme.text,
                  marginBottom: "6px",
                },
              },
              step.title
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  color: theme.sub,
                  lineHeight: "1.6",
                  marginBottom: "8px",
                },
              },
              step.desc
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  color: COLORS.done,
                  fontFamily: fontMono,
                  marginBottom: "6px",
                },
              },
              "Produces: " + step.produces
            ),
            safeLen(step.files) > 0
              ? React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginTop: "4px",
                    },
                  },
                  step.files.map(function (f, fi) {
                    return React.createElement(
                      "span",
                      {
                        key: fi,
                        style: {
                          fontSize: "10px",
                          fontFamily: fontMono,
                          padding: "2px 8px",
                          background: theme.codeBg,
                          borderRadius: "4px",
                          color: theme.dim,
                        },
                      },
                      f
                    );
                  })
                )
              : null
          )
        );
      })
    );

    // What changes in the dashboard
    var dashboardImpact = React.createElement(
      "div",
      { style: { marginTop: "24px" } },
      sectionTitle("What changes in the Dashboard"),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "12px",
          },
        },
        [
          {
            tab: "Command Center",
            icon: "[CC]",
            change: "Agent cards show updated status. CENASA appears as connected service.",
          },
          {
            tab: "Missions",
            icon: "[MS]",
            change: "M-001 StatusBitacora: progress goes from 1/18 to 2/18. New subtask completed.",
          },
          {
            tab: "Knowledge",
            icon: "[KB]",
            change: "New file: cenasa-extraction.md. CHANGELOG with 3+ new entries.",
          },
          {
            tab: "Review Queue",
            icon: "[RQ]",
            change: "Requests/responses between Manual<->Config visible. Test results pending review.",
          },
          {
            tab: "Agents",
            icon: "[AG]",
            change: "Each agent shows its last completed task. Test Agent shows new spec.",
          },
          {
            tab: "Decisions",
            icon: "[DC]",
            change: "New decision: CENASA connected with target block X, NIT key Y.",
          },
        ].map(function (item, idx) {
          return React.createElement(
            "div",
            {
              key: idx,
              style: Object.assign({}, cardStyle(), {
                padding: "14px",
                marginBottom: "0",
              }),
            },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "12px",
                  fontWeight: "700",
                  color: COLORS.orchestrator,
                  fontFamily: fontMono,
                  marginBottom: "6px",
                },
              },
              item.icon + " " + item.tab
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: "11px",
                  color: theme.sub,
                  lineHeight: "1.5",
                },
              },
              item.change
            )
          );
        })
      )
    );

    // Example agent usage
    var usageExamples = React.createElement(
      "div",
      { style: { marginTop: "24px" } },
      sectionTitle("Usage examples per agent"),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "12px",
          },
        },
        [
          {
            agent: "Manual Agent",
            color: COLORS.manual,
            letter: "M",
            examples: [
              "Extract complete structure of a service",
              "Compare PE service between Cuba and Lesotho",
              "Generate navigable HTML manual for Zoosanitario",
              "List all GDB-type bots in Sanitario",
            ],
          },
          {
            agent: "Config Agent",
            color: COLORS.config,
            letter: "C",
            examples: [
              "Create determinant StatusBitacora + effect",
              "Configure internal bot with input/output mappings",
              "Create mustache panel 'Su empresa seleccionada'",
              "Create component action on Block22 button",
            ],
          },
          {
            agent: "Test Agent",
            color: COLORS.test,
            letter: "T",
            examples: [
              "Generate E2E tests for Zoosanitario service",
              "Execute block22 permisos tests",
              "Request structure from Manual before generating specs",
              "Validate that bot LISTAR returns results",
            ],
          },
        ].map(function (ag, idx) {
          return React.createElement(
            "div",
            {
              key: idx,
              style: Object.assign({}, cardStyle(), {
                borderLeft: "4px solid " + ag.color,
                marginBottom: "0",
              }),
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                },
              },
              iconCircle(ag.letter, ag.color, 28),
              React.createElement(
                "span",
                {
                  style: {
                    fontWeight: "700",
                    color: theme.text,
                    fontFamily: fontMono,
                    fontSize: "13px",
                  },
                },
                ag.agent
              )
            ),
            ag.examples.map(function (ex, ei) {
              return React.createElement(
                "div",
                {
                  key: ei,
                  style: {
                    padding: "6px 10px",
                    background: theme.codeBg,
                    borderRadius: "6px",
                    marginBottom: "4px",
                    fontSize: "11px",
                    fontFamily: fontMono,
                    color: theme.sub,
                    lineHeight: "1.4",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  },
                },
                React.createElement("span", {
                  style: dotStyle(ag.color, 6),
                }),
                ex
              );
            })
          );
        })
      )
    );

    return React.createElement("div", null, intro, timeline, dashboardImpact, usageExamples);
  }

  // ══════════════════════════════════════════════════════════
  // TAB 4: CHAT (Agent Communications)
  // ══════════════════════════════════════════════════════════

  var chatMessages = [
    // ── Day 1: Test Agent asks Manual Agent for structures ──
    {
      from: "Test Agent",
      fromLetter: "T",
      fromColor: COLORS.test,
      to: "Manual Agent",
      date: "2026-02-21",
      time: "16:17",
      subject: "Need form structures",
      body: "I have 34/34 tests passing for the Bitacora dashboard. Now I need to go deeper and test the flows that open when clicking dashboard buttons.",
      items: [
        "Form 'Acreditarse en otra empresa' - complete structure",
        "Form ONURE equipos - panels, fields, determinants",
        "Form Cert. Sanitario - complete structure",
        "Bitacora: what each Block22 button does"
      ],
      file: "test->manual_001.md",
      path: "/Users/nelsonperez/Desktop/OCAgents/shared/requests/test->manual_001.md",
    },
    {
      from: "Manual Agent",
      fromLetter: "M",
      fromColor: COLORS.manual,
      to: "Test Agent",
      date: "2026-02-21",
      time: "16:40",
      subject: "Structures extracted via MCP",
      body: "Here are the 3 complete structures extracted from BPA-Cuba plus the Component Actions mapping in Block22.",
      items: [
        "Acreditaciones: 45 components, 3 main panels",
        "ONURE Equipos: structure with tabs, energy fields",
        "Cert. Sanitario: multi-section with phytosanitary controls",
        "Block22: 8 buttons mapped to bots with their IDs"
      ],
      file: "test-manual_001.md",
      path: "/Users/nelsonperez/Desktop/OCAgents/shared/responses/test-manual_001.md",
    },
    // ── Day 2: Config Agent asks Manual Agent for CENASA structure ──
    {
      from: "Config Agent",
      fromLetter: "C",
      fromColor: COLORS.config,
      to: "Manual Agent",
      date: "2026-02-22",
      time: "14:30",
      subject: "Need CENASA structure for Bitacora connection",
      body: "I'm going to connect CENASA Registro Zoosanitario to the Bitacora. Need complete extraction: form, determinants, bots, receiver fields (NIT, Empresa, StatusBitacora).",
      items: [
        "Form hierarchy (panels, blocks, key fields)",
        "Existing determinants (StatusBitacora-related)",
        "10 bots (type, GDB target, category)",
        "Hidden receiver fields (NIT, Empresa, QueQuiereHacer)"
      ],
      file: "config->manual_001.md",
      path: "/Users/nelsonperez/Desktop/OCAgents/shared/requests/config->manual_001.md",
    },
    {
      from: "Manual Agent",
      fromLetter: "M",
      fromColor: COLORS.manual,
      to: "Config Agent",
      date: "2026-02-22",
      time: "14:35",
      subject: "CENASA extracted: 135 components, 455 fields, 20 dets",
      body: "Complete service extraction. Key finding: determinant 'status bitacora = TRUE' already exists (1f83b9f3) but has NO behaviour/effect linked to any component. Block11 has no behaviourId.",
      items: [
        "applicantNit (textfield) in hidden Block - RECEIVER NIT",
        "applicantNombreDeLaEmpresa11 (textfield) - RECEIVER Empresa",
        "applicantStatusLlegaDeLaBitacora (radio) in Block11",
        "Determinant 1f83b9f3 exists but WITHOUT effect",
        "10 bots: 3 list + 1 create + 1 update + 1 read + 3 doc + 1 null",
        "Recommendation: effect_create on applicantBlock6 with activate"
      ],
      file: "manual-config_001.md",
      path: "/Users/nelsonperez/Desktop/OCAgents/shared/responses/manual-config_001.md",
    },
    // ── Config Agent notifies Test Agent of changes ──
    {
      from: "Config Agent",
      fromLetter: "C",
      fromColor: COLORS.config,
      to: "Test Agent",
      date: "2026-02-22",
      time: "14:40",
      subject: "CENASA: StatusBitacora effect created - need E2E test",
      body: "Created the effect that activates applicantBlock6 ('Su empresa seleccionada') when StatusBitacora = TRUE. Behaviour 1ba2094f, effect 71820074. Verified via MCP. Need E2E test.",
      items: [
        "Service: CENASA (2c91809095d83aac0195de8f880f03cd)",
        "Effect: activate applicantBlock6 when StatusBitacora = true",
        "Selector Block6: [ref='applicantBlock6']",
        "Test: without Bitacora Block6 hidden, with Bitacora Block6 visible"
      ],
      file: "config->test_001.md",
      path: "/Users/nelsonperez/Desktop/OCAgents/shared/requests/config->test_001.md",
    }
  ];

  function renderCommsLog() {
    // Agent color lookup
    function agentColor(name) {
      if (name.indexOf("Test") >= 0) return COLORS.test;
      if (name.indexOf("Manual") >= 0) return COLORS.manual;
      if (name.indexOf("Config") >= 0) return COLORS.config;
      return COLORS.orchestrator;
    }
    function agentLetter(name) {
      if (name.indexOf("Test") >= 0) return "T";
      if (name.indexOf("Manual") >= 0) return "M";
      if (name.indexOf("Config") >= 0) return "C";
      return "O";
    }

    // Date separator
    function dateSeparator(dateStr) {
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "20px 0 16px 0",
          },
        },
        React.createElement("div", {
          style: { flex: 1, height: "1px", background: theme.cardBorder },
        }),
        React.createElement("span", {
          style: {
            fontSize: "11px",
            fontFamily: fontMono,
            letterSpacing: "2px",
            color: theme.dim,
            padding: "4px 16px",
            background: dark ? "rgba(10,14,26,0.9)" : "#e2e8f0",
            borderRadius: "12px",
            border: "1px solid " + theme.cardBorder,
          },
        }, dateStr),
        React.createElement("div", {
          style: { flex: 1, height: "1px", background: theme.cardBorder },
        })
      );
    }

    // Track first sender to determine sides
    var firstSender = chatMessages.length > 0 ? chatMessages[0].from : "";

    // Chat bubble
    function chatBubble(msg, idx) {
      var color = msg.fromColor;
      var letter = msg.fromLetter || agentLetter(msg.from);
      var isRight = msg.from !== firstSender;

      // Items as bullet list
      var itemEls = [];
      if (msg.items) {
        for (var k = 0; k < msg.items.length; k++) {
          itemEls.push(
            React.createElement("div", {
              key: "bi-" + k,
              style: {
                fontSize: "12px",
                color: dark ? "#cbd5e1" : "#475569",
                padding: "4px 0 4px 12px",
                borderLeft: "2px solid " + color + "55",
                marginBottom: "2px",
              },
            }, msg.items[k])
          );
        }
      }

      var bubbleRadius = isRight ? "12px 4px 12px 12px" : "4px 12px 12px 12px";

      // Avatar element
      var avatar = iconCircle(letter, color, 38);

      // Name + time + "to" row
      var nameRow = React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "5px",
            flexDirection: isRight ? "row-reverse" : "row",
          },
        },
        React.createElement("span", {
          style: {
            fontSize: "13px",
            fontWeight: "700",
            fontFamily: fontMono,
            color: color,
          },
        }, msg.from),
        React.createElement("span", {
          style: {
            fontSize: "10px",
            fontFamily: fontMono,
            color: theme.dim,
            padding: "1px 8px",
            background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderRadius: "4px",
          },
        }, "-> " + msg.to),
        React.createElement("span", {
          style: { fontSize: "11px", color: theme.dim, fontFamily: fontMono },
        }, msg.time)
      );

      // Bubble body
      var bubble = React.createElement(
        "div",
        {
          style: {
            background: dark ? color + "15" : color + "0c",
            border: "1px solid " + color + "30",
            borderRadius: bubbleRadius,
            padding: "14px 18px",
          },
        },
        // Subject
        React.createElement("div", {
          style: {
            fontSize: "14px",
            fontWeight: "700",
            color: theme.text,
            marginBottom: "8px",
          },
        }, msg.subject),
        // Body text
        React.createElement("div", {
          style: {
            fontSize: "13px",
            color: theme.sub,
            lineHeight: "1.7",
            marginBottom: itemEls.length > 0 ? "12px" : "0",
          },
        }, msg.body),
        // Items
        itemEls.length > 0 ? React.createElement("div", {
          style: { marginTop: "6px" },
        }, itemEls) : null
      );

      // File attachment
      var attachment = null;
      if (msg.file) {
        attachment = React.createElement(
          "div",
          {
            style: {
              marginTop: "8px",
              display: "flex",
              justifyContent: isRight ? "flex-end" : "flex-start",
            },
          },
          React.createElement("a", {
            href: "file://" + msg.path,
            style: {
              fontSize: "11px",
              fontFamily: fontMono,
              color: color,
              textDecoration: "none",
              padding: "5px 14px",
              borderRadius: "8px",
              background: dark ? color + "18" : color + "10",
              border: "1px solid " + color + "33",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            },
          }, "[f] " + msg.file)
        );
      }

      // Bubble content wrapper
      var bubbleWrapper = React.createElement(
        "div",
        {
          style: {
            flex: 1,
            maxWidth: "75%",
          },
        },
        nameRow,
        bubble,
        attachment
      );

      // Row: avatar + bubble, direction depends on side
      var rowChildren = isRight ? [bubbleWrapper, avatar] : [avatar, bubbleWrapper];

      return React.createElement(
        "div",
        {
          key: "chat-" + idx,
          style: {
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "flex-start",
            flexDirection: "row",
            justifyContent: isRight ? "flex-end" : "flex-start",
          },
        },
        rowChildren[0],
        rowChildren[1]
      );
    }

    // Build chat area
    var chatElements = [];
    var lastDate = "";
    for (var j = 0; j < chatMessages.length; j++) {
      if (chatMessages[j].date !== lastDate) {
        chatElements.push(dateSeparator(chatMessages[j].date));
        lastDate = chatMessages[j].date;
      }
      chatElements.push(chatBubble(chatMessages[j], j));
    }

    // Empty state
    if (chatMessages.length === 0) {
      chatElements.push(
        React.createElement(
          "div",
          {
            key: "empty",
            style: {
              textAlign: "center",
              padding: "60px 20px",
              color: theme.dim,
            },
          },
          React.createElement("div", {
            style: { fontSize: "36px", marginBottom: "12px" },
          }, "[...]"),
          React.createElement("div", {
            style: { fontSize: "14px", fontFamily: fontMono },
          }, "No agent messages yet"),
          React.createElement("div", {
            style: { fontSize: "12px", marginTop: "8px", color: theme.dim },
          }, "When agents communicate, their messages will appear here.")
        )
      );
    }

    // Chat container
    var chatArea = React.createElement(
      "div",
      {
        style: {
          background: dark ? "rgba(0,0,0,0.25)" : "#f1f5f9",
          borderRadius: "0 0 12px 12px",
          border: "1px solid " + theme.cardBorder,
          borderTop: "none",
          padding: "12px 24px 24px 24px",
          minHeight: "400px",
        },
      },
      chatElements
    );

    // Channel header (Slack-style)
    var participants = {};
    for (var p = 0; p < chatMessages.length; p++) {
      participants[chatMessages[p].from] = chatMessages[p].fromColor;
      var toColor = agentColor(chatMessages[p].to);
      participants[chatMessages[p].to] = toColor;
    }
    var participantBadges = [];
    var pNames = Object.keys(participants);
    for (var q = 0; q < pNames.length; q++) {
      participantBadges.push(
        React.createElement("span", {
          key: "p-" + q,
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontFamily: fontMono,
            color: participants[pNames[q]],
          },
        },
          React.createElement("span", {
            style: dotStyle(participants[pNames[q]], 8),
          }),
          pNames[q]
        )
      );
    }

    var chatHeader = React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "14px 24px",
          background: dark ? "rgba(255,255,255,0.03)" : "#ffffff",
          border: "1px solid " + theme.cardBorder,
          borderRadius: "12px 12px 0 0",
          flexWrap: "wrap",
        },
      },
      React.createElement("span", {
        style: {
          fontSize: "14px",
          fontWeight: "700",
          fontFamily: fontMono,
          color: theme.text,
        },
      }, "# agent-comms"),
      React.createElement("span", {
        style: {
          width: "1px",
          height: "16px",
          background: theme.cardBorder,
        },
      }),
      React.createElement(
        "div",
        {
          style: { display: "flex", gap: "14px", flex: 1, flexWrap: "wrap" },
        },
        participantBadges
      ),
      React.createElement("span", {
        style: {
          fontSize: "11px",
          fontFamily: fontMono,
          color: theme.dim,
          padding: "4px 12px",
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          borderRadius: "6px",
        },
      }, chatMessages.length + " msgs")
    );

    // Hint below
    var chatHint = React.createElement(
      "div",
      {
        style: {
          marginTop: "12px",
          fontSize: "11px",
          fontFamily: fontMono,
          color: theme.dim,
          textAlign: "center",
          fontStyle: "italic",
        },
      },
      "Source: shared/requests/ + shared/responses/"
    );

    return React.createElement("div", null, chatHeader, chatArea, chatHint);
  }

  // ══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "0",
      },
    },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: theme.headerBg,
          borderBottom: "1px solid " + theme.cardBorder,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "20px",
              fontWeight: "800",
              fontFamily: fontMono,
              letterSpacing: "2px",
              color: theme.bright,
            },
          },
          "eREG"
        ),
        React.createElement(
          "span",
          {
            style: {
              fontSize: "14px",
              color: theme.dim,
              fontFamily: fontMono,
            },
          },
          "Agent Hub"
        ),
        React.createElement(
          "span",
          {
            style: badgeStyle(COLORS.nelson + "33", COLORS.nelson),
          },
          "LIVE"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "12px",
              fontFamily: fontMono,
              color: theme.dim,
            },
          },
          "2026-02-24"
        ),
        React.createElement(
          "button",
          {
            onClick: function () {
              setDark(!dark);
            },
            style: {
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid " + theme.cardBorder,
              background: theme.card,
              color: theme.text,
              fontFamily: fontMono,
              fontSize: "12px",
              cursor: "pointer",
            },
          },
          dark ? "LIGHT" : "DARK"
        )
      )
    ),
    // Tab bar
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid " + theme.cardBorder,
          background: theme.headerBg,
          padding: "0 16px",
        },
      },
      TABS.map(function (tab, i) {
        var isActive = activeTab === i;
        return React.createElement(
          "button",
          {
            key: i,
            onClick: function () {
              setActiveTab(i);
            },
            style: {
              padding: "12px 16px",
              border: "none",
              borderBottom: isActive
                ? "2px solid " + COLORS.nelson
                : "2px solid transparent",
              background: "transparent",
              color: isActive ? theme.bright : theme.dim,
              fontFamily: fontMono,
              fontSize: "12px",
              fontWeight: isActive ? "700" : "400",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              letterSpacing: "1px",
            },
          },
          React.createElement(
            "span",
            {
              style: {
                marginRight: "6px",
                fontSize: "10px",
                opacity: 0.6,
              },
            },
            tab.icon
          ),
          tab.label
        );
      })
    ),
    // Content
    React.createElement(
      "div",
      {
        style: {
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px",
        },
      },
      renderActiveTab()
    ),
    // Footer
    React.createElement(
      "div",
      {
        style: {
          textAlign: "center",
          padding: "24px",
          fontSize: "11px",
          fontFamily: fontMono,
          color: theme.dim,
          borderTop: "1px solid " + theme.cardBorder,
        },
      },
      "eRegistrations Agent Hub | ",
      agents.length + " agents | ",
      missions.length + " missions | ",
      "Scan: 2026-02-24"
    )
  );
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = AgentDashboard;
}
if (typeof window !== "undefined") {
  window.AgentDashboard = AgentDashboard;
}
