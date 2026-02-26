# Mission: PE E2E — Full Permiso Eventual + Observability

**Status**: IN PROGRESS (Fase 0)
**Created**: 2026-02-26
**Agents**: Orchestrator, Tester, Observer, Config, Manual

## Objetivo
Probar el proceso completo de Permiso Eventual desde la Bitácora hasta el submit, usando todos los agentes en coordinación. Esto genera la base de conocimiento replicable para los otros 17 servicios.

## Agentes involucrados
| Agente | Rol en esta misión |
|--------|-------------------|
| **Orchestrator** | Coordina fases, gestiona requests entre agentes |
| **Tester (Verifier)** | Ejecuta E2E con Playwright, crea skills reutilizables |
| **Observer (Tracker)** | Traza logs en Graylog, correlaciona con tests |
| **Config (Configurator)** | Valida configuración de bots/mappings si hay fallas |
| **Manual (Extractor)** | Extrae estructura fresca del form si hace falta |

---

## Fase 0: Preparación
- [x] 0.1 — **Tester**: Crear `countries/cuba/testing/playwright.config.ts` ✓
- [x] 0.2 — **Tester**: Crear `auth-setup.spec.ts` para Cuba ✓
- [x] 0.3 — **Tester**: Helpers creados en `countries/cuba/testing/helpers/form-helpers.ts` (13 funciones) ✓
- [x] 0.4 — **Tester**: Page Objects verificados (PE: 140 components, Bitacora: 9 buttons + 9 grids) ✓
- [x] 0.5 — **Observer**: Ejecutar baseline de logs PE en Graylog → `observer/reports/pe-baseline-001.md`
- [x] 0.6 — **Observer**: Documentar queries base → `observer/queries/pe-queries.md`

## Fase 1: Front-Office — Nuevo Permiso Eventual
- [x] 1.1-1.7 — **Tester**: Spec `pe-e2e-nuevo.spec.ts` creado (10 steps, 10min timeout) ✓
  - Bitácora → Company → Dropdown → PE form → Operation → Products → Fundamentación → Contact → Submit
- [ ] 1.8 — **Observer**: Monitorear Graylog DURANTE el test — trazar cada bot
- [ ] 1.9 — **Observer**: Generar reporte: `observer/reports/pe-nuevo-trace-001.md`
- [ ] 1.10 — **Tester**: Crear skill `countries/cuba/skills/pe-e2e/SKILL.md`

## Fase 2: Validación de Bots
- [ ] 2.1 — **Observer**: Verificar LISTAR bot (GDB.GDB-PE list)
- [ ] 2.2 — **Observer**: Verificar INTERNO PE Nuevo ejecutó correctamente
- [ ] 2.3 — **Observer**: Buscar `"status":false` o `"Input payload is empty"` en logs PE
- [ ] 2.4 — **Config/Human**: MINCEX XLS nuevos falla con "activation error" (33 fallos en 7d). Dejado para revisión humana
- [ ] 2.5 — **Observer**: Crear dashboard PE: `observer/dashboards/pe-dashboard.md`

## Fase 3: Front-Office — Modificar PE Existente
- [ ] 3.1 — **Tester**: Spec `pe-e2e-modificar.spec.ts` — Bitácora → Ver PE existentes → Modificar
- [ ] 3.2 — **Tester**: Verificar TabsFacultades (tabs de modificación)
- [ ] 3.3 — **Tester**: Verificar campos pre-llenados (solicitud, permisoEventual checkbox)
- [ ] 3.4 — **Observer**: Trazar bot INTERNO PE Modificar en logs
- [ ] 3.5 — **Observer**: Comparar trace nuevo vs modificar

## Fase 4: Knowledge Building
- [ ] 4.1 — **Tester**: Actualizar `PermisosEventualesPage.ts` con selectores verificados
- [ ] 4.2 — **Observer**: Documentar mapa completo de bots PE con tiempos y payloads
- [ ] 4.3 — **Config**: Actualizar SERVICES-MAP con estado verificado de PE
- [ ] 4.4 — **Manual**: Extraer estructura fresca del form PE si hubo cambios
- [ ] 4.5 — **Orchestrator**: Crear template replicable para los otros 17 servicios
- [ ] 4.6 — **Orchestrator**: Actualizar memoria con lecciones aprendidas

## Fase 5: Template para Próximo Servicio
- [ ] 5.1 — Generalizar spec → `service-e2e-template.spec.ts`
- [ ] 5.2 — Generalizar queries observer → `service-queries-template.md`
- [ ] 5.3 — Documentar: "Para agregar un nuevo servicio, seguir estos pasos..."
- [ ] 5.4 — Elegir siguiente servicio (Fito, Zoo, Cert Sanitario, etc.)

---

## IDs de Referencia
| Recurso | ID |
|---------|-----|
| Permiso Eventual (service) | `2c918084887c7a8f01887c99ed2a6fd5` |
| Bitácora (hub) | `ffe746aac09241078bad48c9b95cdfe0` |
| PE Form (applicant) | `2c918084887c7a8f01887c9a32387268` |
| PE Registration | `2c91808d973b9d7a01975ecc39050772` |
| Bot INTERNO Nuevo | `6603eb75` |
| Bot INTERNO Modificar | `c88be29b` |
| Bot LISTAR (GDB) | `b94c62ab` |
| Button PE (Bitácora) | `applicantPermisoEventual` |
| ComponentAction (Nuevo) | `b1139de3` |
| ComponentAction (Modificar) | `6230a2b0` |

## Key Fields PE
| Field Key | Purpose |
|-----------|---------|
| `applicantStatusLlegaDeLaBitacora` | Flag: arrived from Bitácora |
| `applicantQueQuiereHacer` | registrarNuevo / modificarExistente |
| `applicantNit3` | Company NIT (PE uses `3`, not base) |
| `applicantNombreDeLaEmpresa4` | Company name (PE uses `4`) |
| `applicantContadorEventuales` | Counter (-1 triggers LISTAR) |
| `applicantSolicitud` | Permit number (modification only) |
| `permisoEventual` | Checkbox flag (modification only) |
| `applicantTipoDeOperacion2` | Import/Export selection |
| `applicantRegimenEspecial` | Special regime |
| `applicantDataGridNuevonuevo` | Products grid |
| `applicantFundamentacion` | Justification text |
| `applicantCheckbox2` | Confirmation checkbox |
| `applicantValidateTheForm` | Submit button container |

## Graylog Queries
```
# Todos los logs PE
serviceId:"2c918084887c7a8f01887c99ed2a6fd5"

# Bots PE desde Bitácora
serviceName:"Bitácora" AND (actionName:*PE* OR actionName:*eventual*)

# Bots fallidos
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false"

# Payloads vacíos
message:"Input payload is empty" AND actionName:*PE*

# Actividad por usuario
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"nelson"
```
