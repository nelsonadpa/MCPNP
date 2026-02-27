# PE Bot Map — Permiso Eventual

**Service**: Permisos Eventuales
**Service ID**: `2c918084887c7a8f01887c99ed2a6fd5`
**Bitacora Service ID**: `ffe746aac09241078bad48c9b95cdfe0`
**Date**: 2026-02-26
**Source**: Graylog 7-day analysis + BPA MCP configuration data
**Evidence base**: `pe-baseline-001.md`, `pe-nuevo-trace-001.md`

---

## Overview

The PE service relies on **10 bots** split across three domains:

| Domain | Bots | Where they live |
|--------|------|-----------------|
| Front-office (citizen) | 3 | PE service + Bitacora |
| Cross-service (Bitacora) | 3 | Bitacora service |
| Back-office (camunda) | 4 | PE service |

```
                          BITACORA (ffe746aa...)
                         +-----------------------+
                         | INTERNO PE Nuevo      |
                         | INTERNO PE Modificar  |
                         | LISTAR (GDB)          |
                         +----------+------------+
                                    |
                          launches PE form
                                    |
                                    v
                     PE SERVICE (2c918084...6fd5)
    +---------------------------------------------------+
    |                                                   |
    |  FRONT-OFFICE (fires on form interaction)         |
    |  +---------------------------------------------+  |
    |  | UNIDAD DE MEDIDA Leer                        |  |
    |  | PERMISO EVENTUAL Listar productos            |  |
    |  +---------------------------------------------+  |
    |                                                   |
    |  BACK-OFFICE (fires on workflow steps)            |
    |  +---------------------------------------------+  |
    |  | VerDatossolicitud                            |  |
    |  | Mostrar certificado de permiso eventual      |  |
    |  | PERMISO EVENTUAL Crear                       |  |
    |  | mincexDbCrearEjecucion                       |  |
    |  +---------------------------------------------+  |
    |                                                   |
    |  DOCUMENT GENERATION (fires on revision)          |
    |  +---------------------------------------------+  |
    |  | MINCEX XLS nuevos                            |  |
    |  +---------------------------------------------+  |
    |                                                   |
    +---------------------------------------------------+
```

---

## Bot Inventory

### 1. UNIDAD DE MEDIDA Leer

| Field | Value |
|-------|-------|
| **Domain** | Front-office |
| **Lives in** | PE service |
| **Logs (7d)** | 134 |
| **Status** | Always `true` |
| **Health** | HEALTHY |

**Purpose**: Looks up the unit of measure for a product by tariff code (subpartida) in the NOMENCLATURA FLAT7 GDB table.

**Data flow**:
```
Trigger:  Product selected in DataGrid
Input:    applicantSubpartida (e.g., "01023100")
Mapped:   query.content.Codigo = "01023100"
GDB:      NOMENCLATURA FLAT7
Output:   applicantUm = "U", status = true
          (also returns Descripcion, e.g., "--Reproductores de raza pura")
```

**Known behavior**: The message `"Payload is null, can't create json!"` appears at action start. This is a harmless initial state message, not an error. It fires before the actual payload arrives.

**Monitoring note**: If this bot starts returning `status: false`, the product DataGrid will not populate units of measure, causing form validation issues.

---

### 2. PERMISO EVENTUAL Listar productos (permisoEventualListarProductos)

| Field | Value |
|-------|-------|
| **Domain** | Front-office |
| **Lives in** | PE service |
| **Logs (7d)** | 157 |
| **Status** | Always `false` in E2E tests (expected) |
| **Health** | OK (context-dependent) |

**Purpose**: Lists existing products for a permit. Used in the **modification flow** to pre-populate the products grid with data from a previous permit.

**Data flow**:
```
Trigger:  Auto-fires on PE form open
Input:    NIT (from Bitacora input mappings)
GDB:      PE 1.6
Output:   applicantDataGridNuevonuevo3 (existing products array)
          applicantDataGridNuevonuevo3_nrOfRows
          status: true/false
```

**Why it fails in E2E tests**: The bot fires automatically when the PE form opens. It expects the company NIT to be passed via Bitacora input mappings. E2E tests navigate directly to `/services/{PE_ID}`, bypassing Bitacora, so the NIT is never set.

**Error pattern**:
```
"Input payload is empty in bot permisoEventualListarProductos"
--> applicantDataGridNuevonuevo3: [], status: false
```

**Modification flow behavior**: When triggered with a valid permit number, sends `"num aprobacion":"<permit-number>"` to GDB PE 1.6. With a synthetic/invalid permit number, returns 404 `"no record found"`.

**Payload fields**:
- `applicantDataGridNuevonuevo3` — array of existing products
- `applicantDataGridNuevonuevo3_nrOfRows` — count of products

**Monitoring note**: `status: false` is expected for new permits (no existing products). Only investigate if `status: false` appears for modification flows where a valid permit number was provided.

---

### 3. MINCEX XLS nuevos

| Field | Value |
|-------|-------|
| **Domain** | Document generation |
| **Lives in** | PE service |
| **Logs (7d)** | 83 |
| **Status** | Mixed (first fail, retry success) |
| **Health** | WARNING — activation race condition |

**Purpose**: Generates the XLS document for MINCEX review. This is a back-office bot that fires when an officer triggers the revision step.

**Race condition pattern**:
```
Flow 1 (fails):
  productos: [] --> "Input payload is empty" --> status: false

Flow 2 (succeeds, ~seconds later):
  Full data with products --> generates PE_<COMPANY>.xls --> status: true
```

**Root cause**: ActionId `adsAction2c918084887c7a8f01887c9a916a7352`. Mule activation race condition: the action gets called before it is fully initialized, fails with `"was probably just in activation, please try again!"`, then succeeds on the automatic retry.

**Triggered by**: Typically `camunda` (back-office workflow), sometimes directly by officers.

**Impact**: The retry always succeeds in observed cases. No workflow blockage, but the double-fire wastes resources and produces noisy error logs.

**Monitoring note**: If the second flow also fails (`status: false` with full product data), that indicates a real problem with XLS generation, not just the activation race.

---

### 4. INTERNO PE Nuevo

| Field | Value |
|-------|-------|
| **Domain** | Cross-service (Bitacora) |
| **Lives in** | Bitacora service (`ffe746aac09241078bad48c9b95cdfe0`) |
| **Bot ID** | `6603eb75` |
| **ComponentAction** | `b1139de3` |
| **Logs (7d)** | 0 in PE service (logs appear under Bitacora serviceId) |
| **Health** | N/A — not triggered by E2E tests |

**Purpose**: Creates a new PE dossier from Bitacora. This is the production entry point for citizens starting a new Permiso Eventual.

**Input mappings**:
| Source (Bitacora) | Target (PE) | Value |
|-------------------|-------------|-------|
| `constant_true` | `StatusLlegaDeBitacora` | `true` |
| `applicantRadio` | `QueQuiereHacer` | Radio selection |
| `applicantNit5` | `Nit3` | Company NIT |
| `applicantCompania7` | `NombreDeLaEmpresa4` | Company name |

**Trigger**: Button `applicantPermisoEventual` in Bitacora Block22 (PE panel).

**Key behavior**: Sets `is_submit_allowed: false` for new permits. The sysadmin role bypasses this validation, but regular citizens face it.

**E2E implication**: E2E tests navigate directly to the PE form and set hidden fields via Form.io API, which is functionally equivalent to what this bot does. However, the `is_submit_allowed` flag difference means E2E tests may not catch real citizen-facing validation issues.

---

### 5. INTERNO PE Modificar

| Field | Value |
|-------|-------|
| **Domain** | Cross-service (Bitacora) |
| **Lives in** | Bitacora service (`ffe746aac09241078bad48c9b95cdfe0`) |
| **Bot ID** | `c88be29b` |
| **ComponentAction** | `6230a2b0` |
| **Logs (7d)** | 0 in PE service (logs appear under Bitacora serviceId) |
| **Health** | N/A — not triggered by E2E tests |

**Purpose**: Opens the PE form in modification mode, pre-populating it with data from an existing permit.

**Input mappings**:
| Source (Bitacora) | Target (PE) | Value |
|-------------------|-------------|-------|
| `constant_true` | `StatusLlegaDeBitacora` | `true` |
| `applicantRadio` | `QueQuiereHacer` | Radio selection |
| `applicantNit5` | `Nit3` | Company NIT |
| `applicantCompania7` | `NombreDeLaEmpresa4` | Company name |
| `applicantRadio2` | `QueQuiereHacer` | Overrides with "modificar" |
| `EditGrid_collection_Numero5` | `Solicitud` | Permit number |
| `constant_true` | `permisoEventual` | Flag |

**Trigger**: "Modificar" option in the PE EditGrid 3-dot dropdown menu (Block22).

**Key behavior**: Sets `is_submit_allowed: true` for modifications (unlike nuevo which sets `false`).

**Difference from Nuevo**: Has 3 additional mappings — `applicantRadio2` (overrides QueQuiereHacer), `EditGrid_collection_Numero5` (permit number), and `permisoEventual` flag.

---

### 6. LISTAR (GDB)

| Field | Value |
|-------|-------|
| **Domain** | Cross-service (Bitacora) |
| **Lives in** | Bitacora service (`ffe746aac09241078bad48c9b95cdfe0`) |
| **Bot ID** | `b94c62ab` |
| **GDB Service** | `GDB.GDB-PE(1.5)-list` |
| **Logs (7d)** | 0 in PE service (logs appear under Bitacora serviceId) |
| **Health** | N/A — not triggered by E2E tests |

**Purpose**: Lists all PE permits for a company in the Bitacora EditGrid. This is what populates the PE panel in Block22 before the user decides to create a new permit or modify an existing one.

**Data flow**:
```
Trigger:  Auto-fires on Block22 panel show
Input:    applicantNit5 --> query_child_NIT
GDB:      GDB.GDB-PE(1.5)-list
Output:   count --> ContadorPermiso
          numero --> EditGrid column (permit number)
          hasta --> EditGrid column (expiry date)
          status --> StatusFuncionoElBot
```

**Monitoring note**: To monitor this bot, query by Bitacora serviceId, not PE serviceId:
```
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"LISTAR"
```

---

### 7. VerDatossolicitud

| Field | Value |
|-------|-------|
| **Domain** | Back-office |
| **Lives in** | PE service |
| **Logs (7d)** | ~50 |
| **Status** | Always `true` |
| **Health** | HEALTHY |

**Purpose**: Retrieves and displays the application data for back-office review. Officers use this to see the full dossier content during the approval workflow.

**Triggered by**: `camunda` (automated workflow step) and directly by officers.

**Monitoring note**: Low volume is normal. Each dossier triggers this 1-2 times during the review process.

---

### 8. Mostrar certificado de permiso eventual

| Field | Value |
|-------|-------|
| **Domain** | Back-office |
| **Lives in** | PE service |
| **Logs (7d)** | ~30 |
| **Status** | Always `true` |
| **Health** | HEALTHY |

**Purpose**: Displays the PE certificate to the officer or user. This is the final step in the workflow, showing the generated certificate document.

**Triggered by**: `camunda` (after certificate generation) and officers viewing the completed dossier.

**Depends on**: `PERMISO EVENTUAL Crear` must have completed successfully (the certificate must exist).

---

### 9. PERMISO EVENTUAL Crear

| Field | Value |
|-------|-------|
| **Domain** | Back-office |
| **Lives in** | PE service |
| **Logs (7d)** | ~20 |
| **Status** | Always `true` |
| **Health** | HEALTHY |

**Purpose**: Creates the PE record in the GDB (Global Database). This is the official creation of the permit after back-office approval.

**Triggered by**: `camunda` (automated workflow, post-approval).

**Note**: The baseline report also mentions `PERMISO EVENTUAL Crear entries` as a separate action that creates the detailed product entries. Both fire in sequence.

---

### 10. mincexDbCrearEjecucion

| Field | Value |
|-------|-------|
| **Domain** | Back-office |
| **Lives in** | PE service |
| **Logs (7d)** | ~15 |
| **Status** | Always `true` |
| **Health** | HEALTHY |

**Purpose**: Creates the MINCEX execution record in the database. This logs the permit approval for MINCEX tracking purposes.

**Triggered by**: `camunda` (automated workflow, post-approval).

---

## Execution Timeline (Full Lifecycle)

The complete PE lifecycle as observed in production (user `claudia`, dossier ER4044):

```
FRONT-OFFICE (citizen/sysadmin)
  |
  | 1. Open PE form (via Bitacora or direct URL)
  |    --> PERMISO EVENTUAL Listar productos fires (auto)
  |        [status: false for new, true for modify]
  |
  | 2. Select product in DataGrid
  |    --> UNIDAD DE MEDIDA Leer fires
  |        [status: true, returns unit of measure]
  |
  | 3. Submit form
  |
  v
BACK-OFFICE (officers + camunda)
  |
  | 4. Officer opens revision
  |    --> MINCEX XLS nuevos fires
  |        [first: status:false (race), retry: status:true]
  |
  | 5. Officer reviews application
  |    --> VerDatossolicitud fires
  |        [status: true]
  |
  | 6. Officer approves --> camunda takes over
  |    --> mincexDbCrearEjecucion fires
  |        [status: true, creates execution record]
  |
  | 7. System creates permit
  |    --> PERMISO EVENTUAL Crear fires
  |    --> PERMISO EVENTUAL Crear entries fires
  |        [status: true, writes to GDB]
  |
  | 8. System generates certificate
  |    --> Cargar el certificado fires (camunda)
  |
  | 9. Officer/user views certificate
  |    --> Mostrar certificado de permiso eventual fires
  |        [status: true]
  |
  v
DONE
```

---

## Health Summary

| Bot | Status | Action Required |
|-----|--------|-----------------|
| UNIDAD DE MEDIDA Leer | HEALTHY | None |
| PERMISO EVENTUAL Listar productos | OK | `status:false` expected for nuevo flow |
| MINCEX XLS nuevos | WARNING | Activation race condition. Monitor for double-fail. |
| INTERNO PE Nuevo | NOT OBSERVED | Lives in Bitacora. Add Bitacora trace for coverage. |
| INTERNO PE Modificar | NOT OBSERVED | Lives in Bitacora. Add Bitacora trace for coverage. |
| LISTAR (GDB) | NOT OBSERVED | Lives in Bitacora. Add Bitacora trace for coverage. |
| VerDatossolicitud | HEALTHY | None |
| Mostrar certificado | HEALTHY | None |
| PERMISO EVENTUAL Crear | HEALTHY | None |
| mincexDbCrearEjecucion | HEALTHY | None |

---

## Key Observations

1. **`is_submit_allowed: false`** is set for PE Nuevo; **`is_submit_allowed: true`** for PE Modificar. The sysadmin role bypasses this check, so E2E tests using sysadmin do not exercise real citizen validation.

2. **`Form is valid: false`** appears in nuevo submissions but sysadmin bypasses this too. A non-sysadmin user with an incomplete form would be blocked.

3. **INTERNO bots live in Bitacora** (serviceId: `ffe746aac09241078bad48c9b95cdfe0`), NOT in the PE service. Querying only by PE serviceId will miss them entirely.

4. **Back-office bots** (VerDatos, Mostrar, Crear, mincexDb) are all triggered by the `camunda` user as part of the automated workflow pipeline.

5. **The MINCEX XLS race condition** is the only active issue. It self-heals on retry but produces noisy error logs. Root cause is Mule activation timing on ActionId `adsAction2c918084887c7a8f01887c9a916a7352`.

6. **Cargar el certificado** appears in baseline logs but was not deeply traced. It fires as part of the camunda workflow between Crear and Mostrar.

---

## Graylog Monitoring Queries

### Service-level queries

```graylog
# All PE logs
serviceId:"2c918084887c7a8f01887c99ed2a6fd5"

# All PE failures (status:false)
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false"

# All PE empty payloads
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"Input payload is empty"

# PE activation errors
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"was probably just in activation"
```

### Per-bot queries

```graylog
# UNIDAD DE MEDIDA Leer
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"UNIDAD DE MEDIDA Leer"

# PERMISO EVENTUAL Listar productos
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Listar productos"

# MINCEX XLS nuevos
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX XLS nuevos"

# VerDatossolicitud
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"VerDatossolicitud"

# Mostrar certificado de permiso eventual
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"Mostrar certificado de permiso eventual"

# PERMISO EVENTUAL Crear
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Crear"

# PERMISO EVENTUAL Crear entries
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Crear entries"

# mincexDbCrearEjecucion
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX DB Crear ejecución"

# Cargar el certificado
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"Cargar el certificado"
```

### Bitacora cross-service queries (for INTERNO and LISTAR bots)

```graylog
# INTERNO PE Nuevo
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"INTERNO PE Nuevo"

# INTERNO PE Modificar
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"INTERNO PE Modificar"

# LISTAR (GDB) — PE permits list
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"LISTAR"
```

### User activity queries

```graylog
# By user
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"claudia"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"alina"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"nelson"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"camunda"
```

### Dossier tracing

```graylog
# By dossier number (replace ERXXXX)
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"ERXXXX"
```

### Dashboard alert queries

```graylog
# MINCEX XLS double-fail (real problem, not just race condition)
# Look for status:false WITHOUT a subsequent status:true for same dossier
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX XLS nuevos" AND message:"status\":false"

# Unexpected bot failures (exclude known Listar productos noise)
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false" AND NOT actionName:"PERMISO EVENTUAL Listar productos"

# PE logs with errors at system level
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND (level:ERROR OR level:CRITICAL OR level:FATAL)
```

---

## IDs Quick Reference

| Entity | ID |
|--------|----|
| PE Service | `2c918084887c7a8f01887c99ed2a6fd5` |
| Bitacora Service | `ffe746aac09241078bad48c9b95cdfe0` |
| INTERNO PE Nuevo (bot) | `6603eb75` |
| INTERNO PE Modificar (bot) | `c88be29b` |
| LISTAR GDB (bot) | `b94c62ab` |
| INTERNO Nuevo ComponentAction | `b1139de3` |
| INTERNO Modificar ComponentAction | `6230a2b0` |
| MINCEX XLS ActionId | `adsAction2c918084887c7a8f01887c9a916a7352` |

---

*Generated by Observer Agent (Tracker) -- 2026-02-26*
*Evidence: pe-baseline-001.md, pe-nuevo-trace-001.md, pe-queries.md*
