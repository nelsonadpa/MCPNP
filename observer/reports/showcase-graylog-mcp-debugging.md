# Showcase: Debugging a Production Bug with Graylog MCP + AI Agent

**Date**: 2026-03-03
**Service**: Permiso Fitosanitario (`2c91808893792e2b019379310a8003a9`)
**Instance**: Cuba (`graylog.cuba.eregistrations.org`)
**Agent**: Observer (Tracker) — Claude Code + mcp-graylog

---

## The Problem

A user reported that **two products were being copied to the certificate when only one was selected**. The service "Permiso Fitosanitario" has a product grid where reviewers select which products to include in the final certificate. Despite selecting only "Piña", both "Piña" and "Harinas" appeared in the generated certificate.

## How We Found It — Step by Step

### Step 1: Quick Health Check (30 seconds)

Queried Graylog for the service in the last 5 minutes:

```
Query: serviceId:"2c91808893792e2b019379310a8003a9"
Time range: 5m
Result: 58 logs, 0 errors, all level 6 (INFO)
```

No errors — the system thought everything was fine. The bug is **silent**: data flows without errors, but the wrong data gets through.

### Step 2: Targeted Error Search (1 minute)

Searched for known failure patterns:

```
Query: serviceId:"..." AND (message:"status\":false" OR message:"error" OR message:"empty")
Time range: 1h
Result: 12 matches — but all were unrelated (buscarNoticia 404s, PDF generation info)
```

Confirmed: the product duplication is NOT flagged as an error anywhere. It's a **logic bug in the bot configuration**, not a runtime error.

### Step 3: Deep Payload Trace (2 minutes)

Queried the specific bot's execution with full payload data:

```
Query: serviceId:"..." AND actionName:"copiar productos al certificado"
Fields: message, outputData, actionName, user, timestamp, actionId
Time range: 5m
```

This returned **28 log entries** for a single execution chain (actionId: `adsAction2c918083976cc50e01978...`). Reading them in chronological order revealed the full data flow:

| Step | Timestamp | What Happened | Products |
|------|-----------|---------------|----------|
| Input payload | 17:28:50.403 | Raw form data arrives | Piña + Harinas (2) |
| Temp grid mapping | 17:28:50.667 | `internalActualizarTempProductosFit` maps with selection flags | Piña (selected=true), Harinas (selected=false) |
| Bot filter | 17:28:50.747 | `copiarProductosAlCertificado` after mapping | **Piña only (1)** — correct! |
| DataWeave merge | 17:28:50.775 | "Payload after flows are merged" | **Piña + Harinas (2)** — bug! |

The bot did its job correctly. The DataWeave merge undid the filtering.

### Step 4: Root Cause via BPA MCP (3 minutes)

Used the BPA MCP tools to inspect bot mappings:

1. `bot_list` → Found 15 bots for this service
2. `bot_output_mapping_list` on `PERMISOS fito crear` → Found 3 output mappings writing to `templatefitosanitariorevisionFitosanitarioapplicantGridProductos`
3. `bot_input_mapping_list` on `copiar productos al certificado` → Found 4 input mappings writing to the **same field**

**Two bots writing to the same grid field:**

| Bot | Role | Writes to certificate grid | Products |
|-----|------|---------------------------|----------|
| `PERMISOS fito crear` | GDB create (output mapping) | ALL products from GDB response | 2 |
| `copiar productos al certificado` | Internal (input mapping with filter) | Only selected products | 1 |

The DataWeave merge combines both, resulting in duplicated products.

### Step 5: Fix Identified

Remove the 3 product-related output mappings from `PERMISOS fito crear`:
- `069c` — NombreCientifico
- `069d` — Productos2
- `069e` — Descripcion

That bot's purpose is to create the permit record in GDB and return the permit number. It doesn't need to echo the product grid back. `copiar productos al certificado` should be the **sole writer** to the certificate product grid.

## Time to Resolution

| Phase | Time | Tool Used |
|-------|------|-----------|
| Health check + error scan | ~1 min | `mcp-graylog: search_logs` |
| Payload trace + root cause in logs | ~2 min | `mcp-graylog: search_logs` (with outputData fields) |
| Bot mapping analysis + fix identification | ~3 min | `bpa-mcp: bot_list`, `bot_input_mapping_list`, `bot_output_mapping_list` |
| **Total** | **~6 min** | |

Without Graylog MCP, this would require:
- Manual Graylog UI navigation and query building
- Copy-pasting JSON payloads into a text editor to compare
- Manually checking BPA admin panel for each bot's mappings
- Estimated time: **30-60 minutes** for an experienced developer

## Key Takeaways

### 1. Silent bugs need payload tracing
The system reported 0 errors. The only way to find this was reading the actual JSON payloads at each step of the bot execution chain. Graylog MCP made this possible by pulling structured data with specific fields (`message`, `outputData`, `actionId`).

### 2. The actionId field is gold
Every log entry in a bot execution chain shares the same `actionId`. This lets you reconstruct the full execution timeline from "Starting action!" to "Payload after flows are merged" — a complete trace of data transformations.

### 3. Two MCP servers working together
- **Graylog MCP**: Showed what happened at runtime (the payloads, the merge, the duplication)
- **BPA MCP**: Showed why it happened (two bots with conflicting output targets)

Neither tool alone could have found this. The combination of log evidence + configuration inspection is what made the 6-minute diagnosis possible.

### 4. The merge step is a common trap
In eRegistrations, when multiple bots write to the same form field, the DataWeave merge step can produce unexpected results (concatenation instead of replacement). This is a pattern to watch for in any service with multiple bots touching grid/collection fields.

## Queries Used (reusable)

```bash
# Quick health check
serviceId:"<SERVICE_ID>"  (time_range: 5m)

# Error scan
serviceId:"<SERVICE_ID>" AND (message:"status\":false" OR message:"error" OR message:"empty")

# Full bot payload trace
serviceId:"<SERVICE_ID>" AND actionName:"<BOT_NAME>"
Fields: message, outputData, actionName, user, timestamp, actionId

# Compare pre/post merge
# Look for "after initial mapping" vs "after flows are merged" in message field
```

## Architecture Diagram

```
Form Grid (2 products: Piña ✓, Harinas ✗)
        │
        ├──► PERMISOS fito crear (GDB bot)
        │       Input: ALL products → GDB
        │       Output: GDB response → certificate grid (2 products) ← PROBLEM
        │
        ├──► copiar productos al certificado (internal bot)
        │       Input: filtered by revisionSeleccionar checkbox
        │       Output: certificate grid (1 product) ← CORRECT
        │
        └──► DataWeave Merge
                Combines both → certificate grid gets 2 products ← BUG
```

**Fix**: Remove output mappings from `PERMISOS fito crear` that echo products back to the certificate grid. Let `copiar productos al certificado` be the sole owner of that field.
