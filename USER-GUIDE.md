# User Guide — eRegistrations Agent Hub

## What is this

Three Claude Code agents that work together to configure, document, and test digital government services on the eRegistrations/VUCE platform.

```
~/Desktop/OCAgents/
├── testing/    → Test Agent "Verifier" (Playwright E2E)
├── manual/     → Manual Agent "Extractor" (read-only, 4 MCP instances)
├── config/     → Config Agent "Configurator" (read/write BPA)
└── shared/     → Shared workspace (profiles, requests, responses, knowledge)
```

---

## Quick commands

### SITREP (situation report)
From the coordinator (the root terminal at `~/Desktop/OCAgents/`):
```
> status
```
or
```
> sitrep
```
Generates a complete report of mission status, inter-agent communication, and recommendations. Saved to `shared/sitreps/`.

### Launch ALL agents
**Option 1 — Double-click from Finder:**
Double-click `Launch Agents.command` on the Desktop.

**Option 2 — From terminal:**
```bash
cd ~/Desktop/OCAgents
./launch-all.sh                    # Launch all 4 (coordinator + 3 agents)
./launch-all.sh config             # Config Agent only
./launch-all.sh test man           # Test + Manual only
./launch-all.sh orq config test    # Coordinator + Config + Test
```
Opens 4 Terminal.app windows. Each shows a colored banner identifying the agent and starts `claude` with auto-presentation (who I am, pending requests, active missions).

Shortcuts: `o`/`orq`=coordinator, `c`=config, `m`/`man`=manual, `t`/`test`=testing

### Launch an individual agent
```bash
cd ~/Desktop/OCAgents/testing && claude   # Test Agent
cd ~/Desktop/OCAgents/manual && claude    # Manual Agent
cd ~/Desktop/OCAgents/config && claude    # Config Agent
```

On startup (via `launch-all.sh` or individually), each agent automatically:
1. Shows visual banner with name and role
2. Reads all 3 profiles in `shared/profiles/`
3. Reads CHANGELOG and active missions
4. Checks pending requests and responses
5. Reports status: "Ready for instructions"

### From the coordinator (this terminal)
You can launch agents as sub-agents without opening another terminal:
```
> have the manual agent extract the structure of service X
> have the config agent delete the incorrect behaviours from M-001
> have the test agent run the block22 tests
```
The coordinator delegates via Task tool and reports results.

---

## The 3 agents

### Test Agent — "Verifier"
**What it does**: Generates and runs Playwright E2E tests against production
**Permissions**: BPA read-only + Playwright
**Produces**: PRDs, Page Objects, spec files, test reports
**Test location**: `testing/tests/specs/` and `testing/tests/pages/`

Usage examples:
```
> have the test agent generate tests for the Zoosanitario service
> have the test agent run the acreditaciones tests
> have the test agent ask the manual agent for ONURE's structure
```

### Manual Agent — "Extractor"
**What it does**: Extracts data via MCP (read-only) from up to 4 instances
**Permissions**: READ-ONLY strict (3 protection layers: allow-list, deny-list, hook blocker)
**Produces**: Form extractions, HTML manuals, cross-instance comparisons

Usage examples:
```
> have the manual agent extract the complete CECMED form
> have the manual agent compare the PE service between Cuba and Lesotho
> have the manual agent generate the HTML manual for Zoosanitario
```

### Config Agent — "Configurator"
**What it does**: Configures services in BPA via MCP (read/write) and Playwright workarounds
**Permissions**: BPA full + Playwright + REST API
**Produces**: Determinants, behaviours, effects, bots, mappings, component actions
**Logs**: ALL changes in `shared/knowledge/CHANGELOG.md` (automatic via hook)

Usage examples:
```
> have the config agent create the mustache panel for CECMED
> have the config agent delete the incorrect Zoo behaviour and recreate it
> have the config agent configure the ONURE bot mappings
```

---

## Inter-agent communication

### Requests and Responses
Agents communicate via markdown files:
```
shared/requests/test→manual_001.md    # Test requests data from Manual
shared/responses/manual-test_001.md   # Manual responds
```

### From the coordinator
No need to create requests manually. Just say:
```
> have the manual agent respond to the test agent with the structure of X
```
The coordinator coordinates.

### Notification system (notify.sh)
Notifications are automatic:
- When an agent writes a response → a signal is created for the recipient
- When an agent starts → it checks for pending signals

To check manually:
```bash
~/Desktop/OCAgents/shared/notify.sh check test     # Does the test agent have messages?
~/Desktop/OCAgents/shared/notify.sh check manual    # And the manual agent?
~/Desktop/OCAgents/shared/notify.sh check config    # And the config agent?
```

---

## MISSIONS.md

Central file defining the team's active missions: `shared/MISSIONS.md`

Each mission has: owner, support, deadline, progress, next steps.

To view missions:
```
> status
```

To create a new mission, edit MISSIONS.md or say:
```
> add mission M-006: [description]
```

---

## Common workflows

### 1. Connect a new service to the Bitacora
```
Step 1: > have the manual agent extract the structure of [service name]
Step 2: Review the extraction, identify field keys (NIT, Empresa, StatusBitacora)
Step 3: > have the config agent create the StatusBitacora determinant + effect
Step 4: > have the config agent create the INTERNO bot with mappings
Step 5: > have the config agent create the "Su empresa seleccionada" mustache panel
Step 6: > have the config agent create the component action on the Block22 button
Step 7: > have the test agent validate the E2E flow
```

### 2. Generate tests for a service
```
Step 1: > have the test agent ask the manual agent for the structure of [service]
Step 2: (wait for manual agent's response)
Step 3: > have the test agent read the response and generate PRD + Page Objects + specs
Step 4: > have the test agent run the tests
```

### 3. Cleanup broken configuration
```
Step 1: > status (check CHANGELOG for NEEDS_CLEANUP items)
Step 2: > have the config agent delete [object] from service [name]
Step 3: > have the config agent recreate with the correct parameters
Step 4: Verify in CHANGELOG that status changed to OK
```

### 4. Generate documentation
```
> have the manual agent generate the HTML manual for [service] via Bitacora
```
To publish: the manual goes to `nelsonadpa/eregistrations-manual` (gh-pages).

---

## Key files

| File | Purpose |
|------|---------|
| `shared/MISSIONS.md` | Active missions with progress |
| `shared/knowledge/CHANGELOG.md` | Config Agent change log |
| `shared/knowledge/SERVICES-MAP.md` | Catalog of 18 services with IDs |
| `shared/knowledge/statusbitacora-mapping.md` | Target blocks per service |
| `shared/knowledge/bpa-rest-api.md` | REST endpoints for workarounds |
| `shared/COMMUNICATION-PROTOCOL.md` | Request/response format |
| `shared/sitreps/LATEST.md` | Latest SITREP |
| `shared/notify.sh` | Notification system |
| `launch-all.sh` | Launches all 4 agents in separate windows |
| `~/Desktop/Launch Agents.command` | Double-click to launch from Finder |
| `.start-agent.sh` | Internal helper (banner + auto-presentation) |
| `dashboard.html` | Visual dashboard — double-click to open in browser |
| `dashboard.jsx` | React component with real system data |

---

## Tips

- **"status" is your friend** — use it frequently to see the global state
- **You don't need 3 terminals** — the coordinator can launch agents as sub-agents
- **The Config Agent logs everything** — if something goes wrong, check CHANGELOG
- **The Manual Agent never modifies** — it's safe to request any extraction
- **Tests don't run themselves** — they need auth-state.json (previous CAS login)
- **Known MCP bugs** — radio/grid/date determinants require REST API workaround or manual BPA UI
