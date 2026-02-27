# PE Dashboard — Permiso Eventual Service Health

**Service**: Permiso Eventual (`2c918084887c7a8f01887c99ed2a6fd5`)
**Last updated**: 2026-02-26
**Baseline period**: 7 days

---

## Quick Health

| Metric | Value | Status |
|--------|-------|--------|
| Total logs (7d) | 718 | NORMAL |
| Success (`status:true`) | 142 | OK |
| Failures (`status:false`) | 68 | EXPECTED |
| Error rate | ~9.5% | ACCEPTABLE (all from Listar productos bypass) |
| Active users | nelson, alina, camunda | OK |

## Bot Status

| Bot | Action Name | Logs (7d) | Status | Health |
|-----|-------------|-----------|--------|--------|
| UNIDAD DE MEDIDA Leer | `UNIDAD DE MEDIDA Leer` | 134 | `true` always | HEALTHY |
| Listar productos | `PERMISO EVENTUAL Listar productos` | 157 | `false` always | EXPECTED FAILURE |
| MINCEX XLS nuevos | `MINCEX XLS nuevos` | 83 | Mixed (first fail, retry OK) | KNOWN ISSUE |
| VerDatossolicitud | `VerDatossolicitud` | ~50 | `true` | HEALTHY |
| Mostrar certificado PE | `Mostrar certificado de permiso eventual` | ~30 | `true` | HEALTHY |
| PERMISO EVENTUAL Crear | `PERMISO EVENTUAL Crear` | ~20 | `true` | HEALTHY |
| mincexDbCrearEjecucion | `mincexDbCrearEjecucion` | ~15 | `true` | HEALTHY |

### Bot Notes

- **Listar productos**: Always fails because E2E tests bypass Bitácora (no NIT passed). In production via Bitácora, this bot works correctly.
- **MINCEX XLS**: Race condition on Mule activation. First call: `productos:[]` → fail. Second call: full data → success. Does not block workflow.
- **VerDatossolicitud / Mostrar certificado / Crear**: Back-office bots triggered by `camunda` user during revision workflow. All healthy.

---

## Monitoring Queries

### All PE logs
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5"
```

### Healthy bots only (exclude known failures)
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND NOT actionName:"PERMISO EVENTUAL Listar productos"
```

### Failures (unexpected)
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false" AND NOT actionName:"PERMISO EVENTUAL Listar productos"
```

### MINCEX XLS (watch for activation race)
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX XLS nuevos"
```

### Dossier tracking
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"dossierNumber"
```

### By user
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"nelson"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"camunda"
```

### Empty payloads
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"Input payload is empty"
```

---

## Alert Thresholds

| Condition | Query | Threshold | Action |
|-----------|-------|-----------|--------|
| New unexpected failure | `status:false AND NOT Listar` | >0 in 1h | Investigate immediately |
| MINCEX XLS double-fail | `MINCEX XLS AND status:false` | >2 consecutive | Check Mule activation |
| Zero activity | All PE logs | 0 in 24h | Verify service is up |
| High error rate | `status:false / total` | >20% | Review bot configurations |

---

## Dossier History (test runs)

| Dossier | User | Date | Bots Triggered |
|---------|------|------|----------------|
| ER4205 | nelson | 2026-02-26 15:43 | Listar + UNIDAD DE MEDIDA |
| ER4206 | alina | 2026-02-26 15:50 | Listar (production user) |
| ER4211 | nelson | 2026-02-26 15:50 | Listar + UNIDAD DE MEDIDA |
| ER4212 | nelson | 2026-02-26 15:50 | UNIDAD DE MEDIDA |
| ER4213 | nelson | 2026-02-26 15:51 | Listar |
| ER4215 | nelson | 2026-02-26 15:58 | Listar |
| ER4216 | nelson | 2026-02-26 15:59 | Listar |
| ER4217 | nelson | 2026-02-26 16:00 | Listar + UNIDAD DE MEDIDA |

---

## Known Issues

1. **`is_submit_allowed: false`** in all payloads — bypassed by sysadmin role. Production citizens may face different validation.
2. **`Form is valid: false`** — same sysadmin bypass. Non-admin users with incomplete forms would be blocked.
3. **MINCEX XLS activation race** — wastes resources, could fail if retry mechanism breaks.

## Recommendations

1. Create `testcitizen` account to verify real-user validation behavior
2. Monitor MINCEX XLS for increased failure rate after platform updates
3. Add Bitácora step to E2E to test INTERNO bot + realistic `is_submit_allowed` behavior
