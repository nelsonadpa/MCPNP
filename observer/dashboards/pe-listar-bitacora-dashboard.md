# Permiso Eventual LISTAR — Bitácora Bot Dashboard

**Bot**: `Permiso eventual LISTAR` (runs from Bitácora service)
**Service context**: Bitácora (`serviceName: "Bitácora"`)
**Action ID prefix**: `adsActionfaefcc8ad7ff4f9893cf3aca95b2aaa5`
**Last updated**: 2026-02-26
**Baseline period**: 7 days

---

## Counters (7d)

| Metric | Count | Query |
|--------|-------|-------|
| Total log entries | 2,857 | `actionName:"Permiso eventual LISTAR" AND app_name:Mule` |
| Bot executions (Starting action) | 459 | `actionName:"Permiso eventual LISTAR" AND message:"Starting action"` |
| Completed (Payload merged) | 239 | `actionName:"Permiso eventual LISTAR" AND message:"Payload after flows are merged"` |
| Success (`status:true`) | 478 | `actionName:"Permiso eventual LISTAR" AND message:"status\":true"` |
| Failures (`status:false`) | 0 | `actionName:"Permiso eventual LISTAR" AND message:"status\":false"` |
| Error rate | **0%** | No failures detected |

---

## Health: HEALTHY

- Zero failures in 7 days
- All executions return `applicantStatusFuncionoElBot: "true"`
- Bot correctly filters by `ID usuario eR` per logged-in user

---

## Bot Behavior

### Query
The bot queries GDB with the logged-in user's eR ID:
```json
{"query": {"ID usuario eR": "<userid>"}}
```

### Output mapping
```
applicantEditGrid       → PE records (array)
applicantContadorPermiso → count of records
applicantStatusFuncionoElBot → "true" on success
```

### Execution flow
1. `Starting action!` → bot triggered
2. `Input permisoEventualListar payload` → receives Bitácora context (userid, dossier, etc.)
3. `Payload permisoEventualListar after mapping` → builds query with user ID
4. `toQueryMap output` → serializes query for GDB
5. `Reading data from external service 1` → GDB response (PE records)
6. `Reading data from external service after mapping` → mapped to form fields
7. `Payload after flows are merged` → final result merged into Bitácora form

---

## User Activity

### Filter by user (Nelson, ID 106)
```
actionName:"Permiso eventual LISTAR" AND message:"\"ID usuario eR\":\"106\""
```

### Filter by user (Alina, ID 15)
```
actionName:"Permiso eventual LISTAR" AND message:"\"ID usuario eR\":\"15\""
```

---

## Monitoring Queries

### All PE LISTAR bot logs
```
actionName:"Permiso eventual LISTAR"
```

### Only final results
```
actionName:"Permiso eventual LISTAR" AND message:"Payload after flows are merged"
```

### Executions with results (non-empty grid)
```
actionName:"Permiso eventual LISTAR" AND message:"applicantContadorPermiso" AND NOT message:"applicantContadorPermiso\":0"
```

### Executions with empty results
```
actionName:"Permiso eventual LISTAR" AND message:"applicantContadorPermiso\":0"
```

### Errors / failures
```
actionName:"Permiso eventual LISTAR" AND message:"status\":false"
```

### GDB raw response
```
actionName:"Permiso eventual LISTAR" AND message:"Reading data from external service 1"
```

---

## Alert Thresholds

| Condition | Query | Threshold | Action |
|-----------|-------|-----------|--------|
| First failure ever | `PE LISTAR AND status:false` | >0 in 1h | Investigate immediately |
| Zero activity | `PE LISTAR` | 0 in 24h | Verify Bitácora is accessible |
| Slow response | Gap between "Starting action" and "Payload merged" | >10s | Check GDB connectivity |

---

## Recent Executions (2026-02-26)

| Time (UTC) | User | User ID | Results | Status |
|------------|------|---------|---------|--------|
| 17:41:31 | nelson | 106 | 0 PE records | SUCCESS |
| 17:43:35 | alina | 15 | 2 PE records (S123, P235) | SUCCESS |
| 17:44:48 | alina | 15 | 2 PE records (S123, P235) | SUCCESS |

---

## Related Bitácora LISTAR Bots

These bots fire alongside PE LISTAR when a user selects a company in Bitácora:

| Bot | Action Name | Query |
|-----|-------------|-------|
| Derechos LISTAR | `Derechos LISTAR` | `actionName:"Derechos LISTAR"` |
| PERMISOS ONN listar | `PERMISOS ONN listar` | `actionName:"PERMISOS ONN listar"` |
| CENASA LISTAR | `CENASA LISTAR` | `actionName:"CENASA LISTAR"` |
| Seg Ambiental LISTAR | `Seg Ambiental LISTAR` | `actionName:"Seg Ambiental LISTAR"` |
| LISTAR sustancias | `LISTAR sustancias` | `actionName:"LISTAR sustancias"` |
| Permiso ONURE LISTAR | `Permiso equipos de energía eléctrica (ONURE) LISTAR` | `actionName:"Permiso equipos de energía eléctrica (ONURE) LISTAR"` |
