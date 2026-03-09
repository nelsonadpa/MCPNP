# eRegistrations Agent Hub

## Vision
Five specialized agents working in coordination to configure, document, test, monitor, and design digital government services on the eRegistrations platform. Supports multiple country instances.

## Project Structure
```
OCAgents/
├── countries/              # Country-specific data (knowledge, tests, missions)
│   ├── cuba/               # Cuba instance (BPA-cuba)
│   └── jamaica/            # Jamaica instance (BPA-jamaica)
├── shared/                 # Inter-agent communication (profiles, requests, responses)
├── config/                 # Config Agent (generic skills + rules)
├── manual/                 # Manual Agent (generic skills + rules)
├── testing/                # Test Agent (generic skills + rules + playwright config)
├── observer/               # Observer Agent (Graylog log analysis + dashboards)
├── designer/               # Designer Agent (service design patterns + knowledge engine)
└── launch-all.sh           # Multi-window launcher
```

## Agents
- **testing/** — Test Agent: Playwright E2E against production
- **manual/** — Manual Agent: Read-only MCP across multiple instances, knowledge provider
- **config/** — Config Agent: Read/Write MCP, configures services
- **observer/** — Observer Agent: Graylog log analysis, bot traceability, service health dashboards
- **designer/** — Designer Agent: Service design patterns, architecture knowledge, best practices advisor

## Country Data (`countries/<country>/`)
Each country has its own isolated data:
- `knowledge/` — SERVICES-MAP, CHANGELOG, field keys, guides
- `missions/` — Active missions and progress
- `testing/` — PRDs, specs, page objects
- `skills/` — Country-specific skills (e.g., fix-determinant-effects)
- `analysis/` — Architecture analysis, templates, bug reports
- `sitreps/` — Situation reports

## Communication Protocol
Agents communicate via `shared/` with markdown files:
- `shared/profiles/` — Who I am, what I know, what I need
- `shared/requests/` — Requests: `[from]→[to]_NNN.md`
- `shared/responses/` — Responses: `[from]-[to]_NNN.md`
- `shared/knowledge/` — Symlinks to active country's knowledge (currently Cuba)

## Workflow
1. Config Agent configures → writes to `countries/<country>/knowledge/CHANGELOG.md`
2. Manual Agent extracts structure → shares in responses/
3. Test Agent generates and runs tests → reports results
4. Observer Agent monitors Graylog → correlates test results with bot logs
5. If tests fail → Observer provides log evidence → request to Config Agent with diagnosis

## Global Rules
- Config Agent ALWAYS logs changes in the active country's CHANGELOG
- Manual Agent NEVER modifies servers (read-only)
- Test Agent ALWAYS reads profiles and knowledge before generating tests
- Observer Agent ALWAYS backs claims with log evidence (queries + timestamps)
- Designer Agent NEVER modifies servers (read-only), always consults knowledge base first
- All agents read shared/profiles/ at the start of each session
- Country-specific data lives ONLY in `countries/<country>/`, never in agent dirs or shared/

## General Behavior
When the user asks to execute a script or command directly, do it immediately unless it poses a clear security risk. Do not pause to review scripts the user has already decided to run.

## Code Changes
When making changes to working code (especially dashboards/UIs), use a minimal-change approach. Never rewrite entire files - make surgical edits only. Create a backup copy before modifying any working file.

## BPA / eRegistrations
When working with BPA MCP mappings, always verify field IDs (not just labels) before creating or deleting mappings. Duplicate field labels exist - use unique field keys. Never bulk-delete mappings; delete one at a time with confirmation.

## Interactive Menus — PROACTIVE
Always organize work through interactive shell menus. When starting a complex task, multi-step workflow, or new project area, **proactively create or update a menu** so the user can navigate options instead of remembering commands. Don't wait to be asked — if there are 3+ related actions, offer a menu.
- Format: bash scripts with `read` + `case`, colored output, clear categories
- Desktop shortcuts: `.command` files for quick Finder access
- **Main menu**: `menu.sh` — countries, agents, skills, quick actions
- **Desktop shortcut**: `~/Desktop/OCAgents Menu.command` — double-click to open
- When adding new features, countries, skills, or workflows → add menu entries
- When a workflow has multiple steps → propose a submenu

## Troubleshooting
If the prompt is too long or context is hitting limits, immediately suggest reducing loaded MCP servers or trimming context. Do not retry the same approach. Current known issue: having 10+ MCP servers configured can cause 'Prompt is too long' errors.
