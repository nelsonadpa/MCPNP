# Graylog Queries Template — {SERVICE_NAME}

> Generalized query template for any eRegistrations service.
> Replace placeholders before use:
> - `{SERVICE_ID}` — UUID from BPA (e.g., `2c918084887c7a8f01887c99ed2a6fd5`)
> - `{SERVICE_NAME}` — Human-readable name (for documentation only, never in queries)
> - `{BOT_NAME}` — The `actionName` value for each bot

## Important: Query Syntax Notes

- All queries use **Elasticsearch query string syntax** (Graylog's backend).
- **Always filter by `serviceId`**, never by `serviceName`. Service names with accents or special characters (e.g., "Bitacora", "Permiso") cause HTTP 500 errors in Graylog.
- String values must be quoted: `serviceId:"abc123"`.
- Boolean operators are uppercase: `AND`, `OR`, `NOT`.
- Escape literal quotes inside `message` searches: `message:"\"status\":false"`.

---

## Time Range Recommendations

| Purpose | Range | When to use |
|---------|-------|-------------|
| Quick health check | `1h` | Spot-check after a deploy or config change |
| Daily review | `24h` | Morning routine, post-test-run review |
| Trend analysis | `7d` | Baseline comparison, weekly report |
| Deep investigation | `30d` | Historical patterns, intermittent bugs |

## Field Selection for Efficiency

Always specify `fields` to reduce payload size and speed up queries.

| Context | Recommended fields |
|---------|--------------------|
| Overview | `["message", "level", "source", "actionName", "serviceId"]` |
| Bot debug | `["message", "outputData", "actionName", "actionId", "user"]` |
| Error triage | `["message", "level", "source", "timestamp"]` |
| User audit | `["message", "actionName", "user", "timestamp"]` |
| Dossier trace | `["message", "actionName", "user", "timestamp", "outputData"]` |

---

## 1. Service Overview

### All logs for {SERVICE_NAME}
```
serviceId:"{SERVICE_ID}"
```

### Healthy bots only (exclude known-failure bots)
Add `AND NOT actionName:"..."` for each bot with expected failures.
```
serviceId:"{SERVICE_ID}" AND NOT actionName:"{BOT_NAME_WITH_KNOWN_FAILURE}"
```

### All failures
```
serviceId:"{SERVICE_ID}" AND message:"\"status\":false"
```

### Unexpected failures (exclude known issues)
```
serviceId:"{SERVICE_ID}" AND message:"\"status\":false" AND NOT actionName:"{BOT_NAME_WITH_KNOWN_FAILURE}"
```

---

## 2. Per-Bot Queries

### Single bot by actionName
```
serviceId:"{SERVICE_ID}" AND actionName:"{BOT_NAME}"
```

### Single bot — failures only
```
serviceId:"{SERVICE_ID}" AND actionName:"{BOT_NAME}" AND message:"\"status\":false"
```

### Single bot — successes only
```
serviceId:"{SERVICE_ID}" AND actionName:"{BOT_NAME}" AND message:"\"status\":true"
```

### Bot inventory (list all distinct actionNames)
Run each known bot query individually and compare counts. There is no `DISTINCT` in Graylog query syntax — use the MCP `search_logs` tool with `fields:["actionName"]` and manually aggregate, or check via the Graylog UI's field statistics.

---

## 3. Error Detection

### status:false (bot-level failure)
```
serviceId:"{SERVICE_ID}" AND message:"\"status\":false"
```

### Input payload empty (bot received no data)
```
serviceId:"{SERVICE_ID}" AND message:"Input payload is empty"
```

### Graylog level errors (system-level)
```
serviceId:"{SERVICE_ID}" AND (level:ERROR OR level:CRITICAL OR level:FATAL)
```

### Activation race condition (Mule cold start)
```
serviceId:"{SERVICE_ID}" AND message:"was probably just in activation"
```

### Combined error sweep
```
serviceId:"{SERVICE_ID}" AND (message:"\"status\":false" OR message:"Input payload is empty" OR level:ERROR)
```

---

## 4. User Activity

### Logs by specific user
```
serviceId:"{SERVICE_ID}" AND user:"{USERNAME}"
```

### System user (Camunda/workflow engine)
```
serviceId:"{SERVICE_ID}" AND user:"camunda"
```

### All non-system users
```
serviceId:"{SERVICE_ID}" AND NOT user:"camunda"
```

---

## 5. Dossier Tracking

### By dossier number (searches inside message body)
```
serviceId:"{SERVICE_ID}" AND message:"{DOSSIER_NUMBER}"
```

### All dossier-related logs (any dossier)
```
serviceId:"{SERVICE_ID}" AND message:"dossierNumber"
```

---

## 6. Cross-Service: Bitacora

The Bitacora service handles the initial entry point for many Cuban services. When a user submits via Bitacora, bots like INTERNO and LISTAR fire to initialize the target service's dossier.

**Bitacora Service ID**: `ffe746aac09241078bad48c9b95cdfe0`

> Never query by `serviceName:"Bitacora"` — the actual name contains an accent ("Bitacora") and will cause a 500 error. Always use `serviceId`.

### All Bitacora logs
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0"
```

### INTERNO bot (creates internal dossier in target service)
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"INTERNO {BOT_NAME_SUFFIX}"
```

### LISTAR bot (reads/lists data from target service)
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"LISTAR {BOT_NAME_SUFFIX}"
```

### Bitacora failures
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND message:"\"status\":false"
```

### Bitacora + target service correlation (same dossier)
Run both queries for the same dossier number:
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND message:"{DOSSIER_NUMBER}"
serviceId:"{SERVICE_ID}" AND message:"{DOSSIER_NUMBER}"
```
Compare timestamps to trace the full submission chain: Bitacora entry -> INTERNO bot -> target service bots.

---

## 7. Alert Thresholds

| Condition | Query | Threshold | Action |
|-----------|-------|-----------|--------|
| Unexpected failure | `serviceId:"{SERVICE_ID}" AND message:"\"status\":false" AND NOT actionName:"{KNOWN_FAILURE}"` | >0 in 1h | Investigate immediately |
| Repeated bot failure | `serviceId:"{SERVICE_ID}" AND actionName:"{BOT_NAME}" AND message:"\"status\":false"` | >2 consecutive | Check Mule service, input data |
| Zero activity | `serviceId:"{SERVICE_ID}"` | 0 results in 24h | Verify service is up, check Mule |
| High error rate | `status:false count / total count` | >20% | Review bot configurations |
| Empty payloads spike | `serviceId:"{SERVICE_ID}" AND message:"Input payload is empty"` | >5 in 1h | Check input mappings |
| Activation storm | `serviceId:"{SERVICE_ID}" AND message:"was probably just in activation"` | >10 in 1h | Mule may be restarting |

---

## Usage Checklist

1. **Replace placeholders**: Fill in `{SERVICE_ID}` from `SERVICES-MAP.md`, bot names from BPA MCP (`bot_list` tool).
2. **Identify known failures**: Some bots fail by design (e.g., bypass scenarios in E2E tests). Exclude them from unexpected-failure queries.
3. **Set baseline**: Run all overview queries with `7d` range first to establish normal volumes.
4. **Document bot health**: Create a service-specific dashboard in `observer/dashboards/` using the results.
5. **Save service-specific queries**: Copy this template to `observer/queries/{service-slug}-queries.md` with placeholders filled in.

---

## Example: Filling the Template

For Permiso Eventual:
- `{SERVICE_ID}` = `2c918084887c7a8f01887c99ed2a6fd5`
- `{SERVICE_NAME}` = `Permiso Eventual`
- Bot names: `MINCEX XLS nuevos`, `PERMISO EVENTUAL Listar productos`, `UNIDAD DE MEDIDA Leer`, `Cargar el certificado`, `PERMISO EVENTUAL Crear`, etc.
- Known failure: `PERMISO EVENTUAL Listar productos` (expected false in E2E without Bitacora)

See `observer/queries/pe-queries.md` and `observer/dashboards/pe-dashboard.md` for the filled-in version.
