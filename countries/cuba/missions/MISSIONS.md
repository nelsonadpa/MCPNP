# Misiones Activas — eRegistrations Agent Hub

## Formato
```
## M-NNN: Nombre (ESTADO)
- Owner: [agent principal]
- Support: [agentes de apoyo]
- Deadline: [fecha o "ongoing"]
- Dependencias: [M-NNN si aplica]
```
Estados: ACTIVA | BLOQUEADA | COMPLETADA | CANCELADA

---

## M-001: StatusBitacora — Conectar 18 servicios a Bitacora (ACTIVA)
- **Owner**: Config Agent
- **Support**: Manual Agent (baselines), Test Agent (validacion)
- **Deadline**: 2026-02-28
- **Ref**: `shared/knowledge/statusbitacora-mapping.md`

### Que es
Cada servicio destino necesita un radio determinant (StatusBitacora=TRUE) + behaviour + effect que active el bloque principal del formulario cuando el caso llega desde la Bitacora.

### Progreso
| Fase | Servicios | Estado |
|------|-----------|--------|
| DONE (modelo) | Fito | 1/18 OK |
| NEEDS_CLEANUP (behaviour incorrecto) | PE, Zoo, CertSanitario, INHEM, CENASA, RegSustancias, SegAmbiental | 7/18 — determinant OK, behaviour apunta a bloque equivocado |
| NEEDS_CLEANUP (behaviour duplicado) | Sustancias | 1/18 — det OK, beh viejo bloquea creacion |
| PENDIENTE (IDs corregidos) | ONURE, ONN, CECMED, Homologacion, CyP, Sucursales, Donativos, CertOrigen, CertAprobONN | 9/18 — no intentados aun |

### Proximos pasos
1. Config Agent: borrar 8 behaviours incorrectos (7 wrong block + 1 Sustancias duplicate)
2. Config Agent: recrear behaviours con bloques correctos (tabla en statusbitacora-mapping.md)
3. Config Agent: ejecutar REST API para los 9 servicios pendientes (IDs ya corregidos)
4. Test Agent: validar E2E que el bloque se activa al llegar desde Bitacora

### Preguntas abiertas
- PE: ¿que bloque activar? Form split across Block8/18/9. Preguntar a Nelson.
- CertOrigen: no tiene bloque de solicitud. ¿Que debe hacer el effect?

---

## M-002: Expirado Badges — Logica de vencimiento en EditGrids (BLOQUEADA)
- **Owner**: Config Agent (manual en BPA UI) + Nelson (bugs MCP impiden automatizar)
- **Support**: Manual Agent (referencia de PE modelo)
- **Deadline**: 2026-03-07
- **Dependencias**: Ninguna directa, pero conviene completar M-001 primero
- **Bloqueado por**: MCP bugs 4-5-6 (griddeterminant_create y datedeterminant_create rotos)

### Que es
14+ EditGrids en la Bitacora necesitan un grid+date determinant para mostrar badge rojo "Expirado" cuando un permiso/registro esta vencido. Requiere 3 objetos por EditGrid:
1. Row date determinant (fecha < hoy)
2. Grid determinant (wrapping el row det)
3. Effect en la columna Expirado

### Progreso
| EditGrid | Servicio | CSS (hide label + deactivated) | Logica (row det + grid det + effect) |
|----------|----------|-------------------------------|--------------------------------------|
| applicantEditGrid | PE | ✅ | ✅ Pre-existente (modelo) |
| applicantEditGridFito | Fito | ✅ | 🔴 Pendiente |
| applicantEditGridZoo | Zoo | ✅ | 🔴 Pendiente |
| applicantPermisoZoosanitario | ONURE | ✅ | 🔴 Pendiente |
| applicantEditGridSustancias | Sustancias | ✅ | 🔴 Pendiente |
| applicantEditGridSanitario | Sanitario | ✅ | 🔴 Pendiente |
| (Block4 EditGrids x8+) | Registros | 🔴 Pendiente | 🔴 Pendiente |

### Proximos pasos
1. Nelson crea manualmente en BPA UI: row date det + grid det para cada EditGrid
2. Config Agent enlaza effect via MCP (`effect_create` SI funciona)
3. Alternativa: esperar fix de MCP bugs 4-5-6 en version futura

---

## M-003: E2E Test Suite — Tests Playwright para Bitacora (ACTIVA)
- **Owner**: Test Agent
- **Support**: Manual Agent (extracciones MCP)
- **Deadline**: ongoing
- **Dependencias**: M-001 parcialmente (StatusBitacora tests necesitan config completa)

### Que es
Suite de tests E2E con Playwright contra `cuba.eregistrations.org` (produccion). Cubre dashboard Bitacora, formularios de servicios, y flujos completos.

### Progreso
| Componente | Estado |
|------------|--------|
| PRD bitacora-deep (5 stories, 36 tests) | ✅ Generado |
| Page Objects (Bitacora, Acreditaciones, PE) | ✅ Generados |
| Specs (acreditaciones, block22-permisos, permisos-eventuales) | ✅ Generados |
| playwright.config.ts | ✅ Generado |
| Ejecucion contra produccion | 🔴 Pendiente (necesita auth-state.json valido) |
| Dashboard tests anteriores (34/34 pass) | ✅ En `playwright-bpa/` (suite vieja) |

### Proximos pasos
1. Test Agent: generar auth-state.json con login CAS
2. Test Agent: ejecutar los 36 tests nuevos, ajustar selectores fallidos
3. Test Agent: pedir al Manual Agent estructura de servicios adicionales segun necesite

---

## M-004: Panel "Su empresa seleccionada" — Mustache en servicios destino (ACTIVA)
- **Owner**: Config Agent
- **Deadline**: 2026-03-07
- **Dependencias**: Ninguna

### Que es
Cada servicio destino debe mostrar un panel visual con nombre de empresa y NIT usando mustache templates.

### Progreso
| Servicio | Status |
|----------|--------|
| PE | ✅ Pre-existente |
| Sanitario | ✅ Pre-existente |
| Zoo | ✅ Pre-existente |
| ONURE | ✅ Pre-existente |
| Fito | ✅ Creado 2026-02-14 |
| Sustancias | ✅ Creado 2026-02-14 |
| 12 servicios restantes | 🔴 Pendiente |

### Proximos pasos
Config Agent: crear panel mustache en los 12 servicios restantes. Usar field keys de la tabla en MEMORY (NIT key + Empresa key varian por servicio).

---

## M-005: Documentacion — Manuales HTML de servicios (ACTIVA)
- **Owner**: Manual Agent
- **Deadline**: ongoing

### Que es
Generar manuales HTML navegables para cada servicio, publicados en gh-pages.

### Progreso
| Manual | Status |
|--------|--------|
| PE (via Bitacora) | ✅ Publicado en gh-pages |
| Fito (via Bitacora) | ✅ Generado |
| Zoo (via Bitacora) | ✅ Generado |
| 15 servicios restantes | 🔴 Pendiente |

---

## Prioridad sugerida
1. **M-001** StatusBitacora cleanup + 9 pendientes (Config Agent) — bloquea testing
2. **M-003** Ejecutar tests generados (Test Agent) — validacion inmediata
3. **M-004** Paneles mustache restantes (Config Agent) — rapido, bajo riesgo
4. **M-002** Expirado badges (manual BPA UI) — bloqueado por bugs MCP
5. **M-005** Manuales HTML (Manual Agent) — ongoing, no urgente
