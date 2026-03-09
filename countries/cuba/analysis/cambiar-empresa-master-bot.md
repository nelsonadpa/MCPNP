# Cambiar Empresa — Master Bot Test Results

## Date: 2026-03-05

## Context
When a user changes company in the Bitacora, EditGrid permissions don't refresh because panel componentActions (LISTAR bots) only execute once on activation.

## Key Question
**Can ONE BPA bot map outputs from nested collections to DIFFERENT EditGrids?**

## Answer: NO

### Test Setup (Service: Delegar `05b934d8-32a5-49ee-bd20-489bacd00123`)

**Components added:**
- `applicantEditGridFito` (editgrid) — 3 children: TipoFito, NumeroFito, ExpiracionFito
- `applicantListarMasterBtn` (button) — "Listar MASTER (VIEW)"

**Bot created:**
- `6a54a69c-9017-48de-a991-d42709135c85` — "TEST MASTER LISTAR"
- Service: `GDB.GDB-VIEW-Permisos y registros de la empresa(3.0)-list`
- Input: `applicantNitTest` -> `query_child_NIT`
- Output mappings (8 total):
  - PE (Eventual): tipo operacion, Numero PE, hasta -> applicantEditGridTest children
  - Fito: tipo operacion, num permiso, hasta -> applicantEditGridFito children
  - count -> applicantContadorTest
  - status -> applicantStatusTest

### Error
```
Data mapping error! Unable to resolve reference of: `item`.
```

The Mule DataWeave auto-generator creates separate code blocks for each EditGrid target. When generating the block for `applicantEditGridFito`, the `item` variable (from the `results map` iterator) is out of scope. The generator can't handle mapping from TWO nested collections within the same response to DIFFERENT EditGrids.

### Root Cause
BPA DataWeave generator limitation: each EditGrid mapping block is generated independently. The `item` scope from `results map ((item, index) -> ...)` doesn't carry across blocks.

## Plan B: Parallel Individual Bots

### Strategy
- 17 individual bots (one per permission type), each using their own GDB list endpoint
- All linked to ONE button via `parallel: true` componentAction
- Button: `applicantCambiarEmpresa3` on the Bitacora form

### Next Steps
1. **CLEANUP**: Remove master bot + Fito EditGrid from Delegar test service
2. **TEST Plan B**: In Delegar, create 2 individual bots (PE + Fito) with `parallel: true` on one button
3. **VERIFY**: Both grids populate when button is clicked
4. **SCALE**: If works, replicate to Bitacora with all 17 types

### IDs for Cleanup
| What | ID | Action |
|------|-----|--------|
| Master Bot | `6a54a69c-9017-48de-a991-d42709135c85` | Delete |
| EditGrid Fito | `applicantEditGridFito` | Remove from form |
| Button Master | `applicantListarMasterBtn` | Remove from form |
| Component Action | `c57f07b2-3868-4324-b05d-56f7edaab991` | Auto-deleted with button |

### Existing Bot (keep)
- PE bot: `4ba3b726-c765-46f7-ad54-752bd0d83f2b` — "TEST PE LISTAR" using `GDB.GDB-PE(1.6)-list`

### GDB VIEW Info (for reference)
- `GDB.GDB-VIEW-Permisos y registros de la empresa(3.0)-list`
- Input: `query_child_NIT`
- Output nested collections under `results_collection_Permisos_child_`:
  - Eventual, Fitosanitario, Autorizaciones, Zoosanitario, Sanitario
  - Seguridad ambiental (ORSA), Instrumentos de medicion (ONN)
  - Equipos energia electrica (ONURE), Sustancias controladas (MINSAP)
- Output nested collections under `results_collection_Registros_child_`:
  - Zoosanitarios (CENASA), Sanitario (INHEM), Contrato (INHEM)
  - Medicamentos (CECMED), MINSAP

### Individual GDB Endpoints (for Plan B)
Each permission type has its own GDB list endpoint, e.g.:
- PE: `GDB.GDB-PE(1.6)-list`
- Fito: need to discover via `muleservice_list(name_filter="Fitosanitario")`
- etc.
