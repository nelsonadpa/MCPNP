# ANALYSIS: Permiso Fitosanitario + Bitacora

**Date**: 2026-02-08 (updated 2026-02-09)
**Status**: READ-ONLY analysis - nothing was modified
**Destination service**: `2c91808893792e2b019379310a8003a9` (Permiso fitosanitario)
**Bitacora**: `ffe746aac09241078bad48c9b95cdfe0`
**Plan file**: `~/.claude/plans/harmonic-booping-glade.md`

---

## 1. CURRENT STATE: Receiver fields in Fito (destination)

### Comparison with the 4 standard fields from the PE model:

| # | Standard field | Key | Exists in Fito? | Detail |
|---|---|---|---|---|
| 1 | Status bitacora | `applicantStatusLlegaDeLaBitacora` | **YES** | radio, label OK |
| 2 | Que quiere hacer | `applicantQueQuiereHacer` | **NO** | Does not exist |
| 3 | NIT | `applicantNit3` | **NO** | Does not exist |
| 4 | Nombre empresa | `applicantNombreDeLaEmpresa4` | **NO** | Does not exist |

### Fito-specific fields already used in bots:

| Field | Key | Type | Purpose |
|---|---|---|---|
| Checkbox fito | `permisoFitosanitario` | checkbox | Marks service type (label=null) |
| Permission counter | `applicantcontadorPermisosExistentes` | number | Counts existing records |

### Determinants pointing to StatusBitacora:
- **NO determinants** in Fito evaluate `applicantStatusLlegaDeLaBitacora`
- The 37 determinants in Fito are all for internal service logic
- **GAP**: Without determinants, StatusBitacora is received but controls nothing

---

## 2. CURRENT STATE: Bots in the Bitacora for Fito

### Bot INTERNO nuevo (existing)
- **ID**: `d98caa87-08cf-4088-a809-f7e05ecaf233`
- **Name**: "INTERNO permisos fitosanitario - nuevo"
- **Destination**: `2c91808893792e2b019379310a8003a9` (Fito)
- **Enabled**: YES
- **Input mappings (3)**:

| # | Source (Bitacora) | Target (Fito) | Source Type | Target Type |
|---|---|---|---|---|
| 1 | `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean | radio |
| 2 | `applicantContadorFito` | `applicantcontadorPermisosExistentes` | Number | number |
| 3 | `constant_true` | `permisoFitosanitario` | Boolean | checkbox |

**NOTE**: Only 3 mappings vs 4 in PE. Does NOT map QueQuiereHacer, NIT, or NombreEmpresa.

### Bot INTERNO modificar
- **DOES NOT EXIST** - No "modificar" internal bot for Fito in the Bitacora
- **CRITICAL GAP**: The "Modificar" flow from the grid will not work without this bot

### Bot LISTAR (GDB)
- **ID**: `7248ea6d-3132-4637-9de4-e687a5f55c18`
- **Name**: "PERMISOS FITOSANITARIOS listar"
- **GDB Service**: `GDB.GDB-FITO2(1.1)-list`
- **Enabled**: YES

**Input mappings (1)**:
| Source | Target | Types |
|---|---|---|
| `applicantNit5` | `query_child_NIT` | textfield -> string |

**Output mappings (1)**:
| Source (Bitacora) | Target (GDB) | Types |
|---|---|---|
| `applicantContadorFito` | `count` | number -> integer |

**CRITICAL GAP**: LISTAR bot only maps the COUNTER. Missing:
- Permission number (should go to EditGrid column)
- Expiration date "hasta" (should go to EditGrid column)
- Bot status

---

## 3. CURRENT STATE: UI in the Bitacora

### Fito appears in TWO blocks:

#### Block22 - "Permisos importacion" (applicantdropdown5)
- **Button**: `applicantEventuales3` (label: "Fitosanitarios")
- **Component Action**: **NONE** (componentActionId empty)
- **EditGrid3**: Import grid
  - Columns: Tipo, Numero, Expiracion, Activo
  - Modificar button (`applicantModificar5`): **NO Component Action**
  - defaultValue of Tipo: "Clientes y proveedores" (INCORRECT - should be "Fitosanitario")
- **Block22 panel**: Has componentActionId `1cb59cb5` but **NO bots** linked

#### Block27 - "Permisos exportacion y transito" (applicantdropdown6)
- **Button**: `applicantEquiposUsoDeEnergia` (label: "Fitosanitario")
- **Component Action**: **YES** -> `a24c8ff8` -> bot "INTERNO permisos fitosanitario - nuevo"
- **EditGrid4**: Export/transit grid
- **FINDING**: Block27 is actually for **Certificado Sanitario** (service `2c91808893792e2b0193792f8e170001`), NOT Fitosanitario. The button label is misleading.
- **Conclusion**: We only work on Block22.

---

## 4. GDB FITO2 - Available fields

**Service**: `GDB.GDB-FITO2(1.1)-list`

### Useful outputs for EditGrid:
| GDB field | ID | Type |
|---|---|---|
| num permiso | `results_collection_content_child_Permiso_child_num permiso` | string |
| hasta (expiration) | `results_collection_content_child_Permiso_child_hasta` | date |
| desde | `results_collection_content_child_Permiso_child_desde` | date |
| num solicitud | `results_collection_content_child_Permiso_child_num solicitud` | string |
| tipo de operacion | `results_collection_content_child_Operacion_child_tipo de operacion` | catalog |
| status | `status` | boolean |
| count | `count` | integer |

---

## 5. SUMMARY OF GAPS vs PE MODEL

### Gaps in Fito destination service:
| # | Gap | Severity | Action required |
|---|---|---|---|
| G1 | Missing `applicantQueQuiereHacer` | MEDIUM | Create radio field |
| G2 | Missing `applicantNit3` | LOW | Create textfield |
| G3 | Missing `applicantNombreDeLaEmpresa4` | LOW | Create textfield |
| G4 | No determinants for StatusBitacora | MEDIUM | Create 4 determinants |
| G5 | Checkbox `permisoFitosanitario` has no label | COSMETIC | Add label |

### Gaps in Bitacora bots:
| # | Gap | Severity | Action required |
|---|---|---|---|
| G6 | No bot INTERNO modificar exists | **CRITICAL** | Create bot + mappings |
| G7 | Bot LISTAR only maps count | **CRITICAL** | Add output mappings for num permiso and date |
| G8 | Bot LISTAR doesn't map status | MEDIUM | Add status mapping |

### Gaps in Bitacora UI:
| # | Gap | Severity | Action required | MCP v0.15.0? |
|---|---|---|---|---|
| G9 | Block22: Fito button has no component action | **CRITICAL** | Link button to bot nuevo | **YES - componentaction_save** |
| G10 | Block22: Panel has no LISTAR bot | **CRITICAL** | Link LISTAR bot to panel | **YES - componentaction_save** |
| G11 | Block27: Panel has no LISTAR bot | **CRITICAL** | N/A - Block27 is not Fito | Skip |
| G12 | Modificar button has no action (both grids) | **CRITICAL** | Create bot modificar + link | **YES - componentaction_save** |
| G13 | Label "Tipo" says "Clientes y proveedores" | MEDIUM | Change to "Fitosanitario" | YES - form_component_update |
| G14 | Extra buttons (Compartir/Ver/Derechos) in grids | LOW | Remove per template | Not urgent |

---

## 6. EXECUTION PLAN

See full plan at: `~/.claude/plans/harmonic-booping-glade.md`

**7 steps, all automatable via MCP v0.15.0**:
1. Add 3 receiver fields in Fito
2. Create 4 determinants in Fito
3. Add 3 input mappings to existing bot INTERNO nuevo
4. Create bot INTERNO modificar + 6 input mappings
5. Complete output mappings for bot LISTAR
6. Create Component Actions (button->bot, panel->LISTAR, Modificar->bot)
7. Fix label "Tipo" from "Clientes y proveedores" to "Fitosanitario"

---

## 7. NOTE ON ARCHITECTURE: TWO BLOCKS

**Finding**: Block27 ("Permisos exportacion y transito") contains a button labeled "Fitosanitario" but it actually links to the same bot INTERNO fito nuevo. However, Block27 is for **Certificado Sanitario** (a different service). This appears to be a configuration error or legacy setup.

**Decision**: We only work on Block22. Block27 is out of scope for the Fito connection plan.
