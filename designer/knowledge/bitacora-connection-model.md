# VUCE Cuba BPA: Bitacora Connection Model - Complete Analysis

**Date**: 2026-02-10
**Author**: Claude (AI Assistant) + Nelson Perez
**MCP Version**: v0.15.0
**Bitacora Service ID**: `ffe746aac09241078bad48c9b95cdfe0`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Connection Primitives](#2-the-connection-primitives)
3. [Detailed Comparison: PE vs Fito vs Zoo](#3-detailed-comparison)
4. [The Replication Pattern (Step-by-Step)](#4-the-replication-pattern)
5. [MCP Limitations History](#5-mcp-limitations-history)
6. [Harmonization Analysis](#6-harmonization-analysis)
7. [Next Services to Connect](#7-next-services-to-connect)
8. [Recommendations & Next Steps](#8-recommendations-and-next-steps)

---

## 1. Architecture Overview

### 1.1 What is the Bitacora?

The Bitacora (Logbook) is a **hub service** that acts as the central entry point for all VUCE Cuba operations. Instead of users navigating directly to individual permit services, they:

1. Select their company from a list of accredited companies
2. See a dashboard of all available permits and their status
3. Launch new permits or modify existing ones from the Bitacora
4. The Bitacora pre-fills data in the destination service automatically

### 1.2 Form Structure (202 components)

```
ROOT
|
+-- applicantBlock7 (panel) - Initial component, has component_action_id
|
+-- applicantBitacoraV2 (tabs) - MAIN UI - 5 tabs:
|   |
|   +-- Tab 1: "Empresas" (applicantBitacoraV2empresas)
|   |   +-- Company selection grid + accreditation info
|   |
|   +-- Tab 2: "Servicios" (applicantBitacoraV2servicios)
|   |   +-- applicantcolumns19 (2-col layout: 11 + 1)
|   |       |
|   |       +-- applicantBlock3: "Su empresa seleccionada" (shows NIT + name)
|   |       |
|   |       +-- applicantBlock4: "Registros" (non-permit services dropdown)
|   |       |   +-- 9 buttons: CyP, Homologacion, CECMED, INHEM, Template, etc.
|   |       |
|   |       +-- applicantBlock22: "Permisos" (THE permit hub)
|   |           +-- Header + "Agregar" dropdown (6 buttons)
|   |           +-- applicantEditGrid (PE grid)
|   |           +-- applicantEditGridFito (Fito grid)
|   |           +-- applicantEditGridZoo (Zoo grid)
|   |           +-- applicantPermisoZoosanitario (ONURE/Energia grid)
|   |
|   +-- Tab 3: "Mis solicitudes" (myApplications)
|   +-- Tab 4: "Mis productos" (empty)
|   +-- Tab 5: "Clientes y proveedores" (empty)
|
+-- applicantBlock5 (panel) - HIDDEN BACKEND DATA
    |
    +-- applicantBlock11: Counters (acreditaciones)
    +-- applicantBlock6: Selected company data (NIT, name, expiration, status)
    +-- applicantBlock8: 14 service-specific panels (counters, statuses, bot triggers)
    |   +-- applicantcolumns7: "Permiso eventual" (PE backend)
    |   +-- applicantPermisoFitosanitario: "Permiso fitosanitario" (Fito backend)
    |   +-- applicantcolumns9: "Permiso zoosanitario" (Zoo backend)
    |   +-- applicantPermisoZoosanitario2: "Equipos energia" (ONURE backend)
    |   +-- ... (10 more service panels)
    +-- applicantBlock9: Radio fields (QueQuiereHacer, TipoOperacion, etc.)
```

### 1.3 Bot Inventory (38 bots)

| Type | Count | Purpose |
|------|-------|---------|
| **internal** | 21 | Navigate to destination service with pre-filled data |
| **data** | 14 | Query GDB to list existing permits/registrations |
| **null** | 3 | Legacy/broken bots (DERECHOS, ONN, ONURE counters) |

### 1.4 Services Connected to Bitacora

| # | Service | Internal Bots | Data/LISTAR Bots | EditGrid in Block22 | Status |
|---|---------|--------------|------------------|---------------------|--------|
| 1 | **Permiso Eventual (PE)** | nuevo + modificar | PE LISTAR | `applicantEditGrid` | **COMPLETE** (reference model) |
| 2 | **Permiso Fitosanitario** | nuevo | Fito LISTAR | `applicantEditGridFito` | **~85% complete** |
| 3 | **Permiso Zoosanitario** | nuevo + modificar | Zoo LISTAR | `applicantEditGridZoo` | **~85% complete** |
| 4 | **Equipos Energia (ONURE)** | nuevo + modificar | ONURE LISTAR x2 | `applicantPermisoZoosanitario` | Existing (pre-Claude) |
| 5 | **Certificado Sanitario** | nuevo | Sanitario LISTAR | NO grid yet | Bots only, no UI |
| 6 | **Permiso ONN** | nuevo | ONN LISTAR x2 | NO grid yet | Bots only, no UI |
| 7 | **Clientes y Proveedores** | nuevo | CyP LISTAR | NO grid yet | Bots only, no UI |
| 8 | **Licencia CECMED** | nuevo + modif + renovar | CECMED LISTAR x2 | NO grid yet | Bots only, no UI |
| 9 | **Autorizacion Donaciones** | nuevo | (none) | NO grid yet | Partial |
| 10 | **Acreditacion** | nueva + renovar | (none) | NO grid yet | Partial |
| 11 | **Homologar Equipos** | nuevo + ONURE | (none) | NO grid yet | Partial |
| 12 | **Template** | nuevo + modificar | (none) | NO grid yet | Partial |

---

## 2. The Connection Primitives

### 2.1 What is a "Connection"?

A connection between the Bitacora and a destination service consists of **6 primitives** that work together:

```
PRIMITIVE 1: Receiver Fields (in destination service)
    Fields that accept data from the Bitacora

PRIMITIVE 2: Bot INTERNO (in Bitacora)
    Internal bot that navigates to destination service, carrying data

PRIMITIVE 3: Bot LISTAR / GDB (in Bitacora)
    Data bot that queries the GDB database to list existing permits

PRIMITIVE 4: Component Action (in Bitacora)
    Links a UI element (button or panel) to a bot

PRIMITIVE 5: EditGrid (in Bitacora Block22)
    Visual grid showing existing permits for the selected company

PRIMITIVE 6: Determinants + Effects (in destination service)
    Conditional logic that shows/hides form sections based on Bitacora data
```

### 2.2 Primitive 1: Receiver Fields

Every destination service needs these fields to receive data from the Bitacora:

| Field | Type | Purpose | Level |
|-------|------|---------|-------|
| `applicantStatusLlegaDeLaBitacora` | radio | Flag: "this request comes from the Bitacora" | BASIC |
| checkbox tipo (varies by service) | checkbox | Flag: identifies the service type | BASIC |
| `applicantNit` (or variant) | textfield | Pre-filled NIT from selected company | COMPLETO |
| `applicantNombreDeLaEmpresa` (or variant) | textfield | Pre-filled company name | COMPLETO |
| `applicantQueQuiereHacer` (or variants) | radio | What the user wants to do (nuevo/modificar) | COMPLETO |
| `applicantSolicitud` (if modification flow) | textfield | Permit number being modified | COMPLETO |
| contador (varies) | number | Count of existing permits | COMPLETO |

**CRITICAL**: Field keys are NOT standardized across services:

| Field | PE | Fito | Zoo |
|-------|-----|------|-----|
| NIT | `applicantNit3` | `applicantNit` | `applicantNit` |
| Empresa | `applicantNombreDeLaEmpresa4` | `applicantNombreDeLaEmpresa` | `applicantNombreDeLaEmpresa` |
| Checkbox tipo | `permisoEventual` | `permisoFitosanitario` | `permisoZoosanitarios1` |
| QueQuiereHacer | `applicantQueQuiereHacer` | N/A (no modif flow) | 5 separate radios |
| Contador | `contadorPermisosExistentes` | `contadorPermisosExistentes` | `ContadorEnergia` (!) |

### 2.3 Primitive 2: Bot INTERNO

An internal bot carries data from the Bitacora to a destination service. Each service needs:

- **Bot "nuevo"**: For creating new permits (always required)
- **Bot "modificar"**: For modifying existing permits (optional, not all services need it)

**Standard input mappings for Bot INTERNO nuevo:**

| # | Source (Bitacora) | Target (Destination) | Purpose |
|---|-------------------|---------------------|---------|
| 1 | `constant_true` | `applicantStatusLlegaDeLaBitacora` | Tell destination "this comes from Bitacora" |
| 2 | `constant_true` | checkbox tipo field | Identify the service type |
| 3 | `applicantNit5` | NIT field | Pre-fill company NIT |
| 4 | `applicantCompania7` | Empresa field | Pre-fill company name |
| 5 | QueQuiereHacer radio | QueQuiereHacer field | What user wants to do |
| 6 | Contador field | Contador field | Number of existing permits |

**Output mappings**: Always 0 (internal bots navigate, they don't return data).

### 2.4 Primitive 3: Bot LISTAR (GDB)

A GDB data bot queries the external database to list existing permits for the selected company.

**Standard configuration:**

| Aspect | Standard |
|--------|----------|
| Input | 1 mapping: `applicantNit5` -> `query_child_NIT` |
| Output | 4 mappings: count, permit number, expiration date, status |
| Category | `list` |
| GDB service | `GDB.GDB-{SERVICE_NAME}({version})-list` |

**Output mapping pattern:**

| # | GDB Field | Bitacora Field | Purpose |
|---|-----------|---------------|---------|
| 1 | `count` | `applicant{Contador}` | Total permits for this company |
| 2 | `results_collection_...num permiso` | `applicant{EditGrid}_collection_{Numero}` | Permit number in grid |
| 3 | `results_collection_...hasta` | `applicant{EditGrid}_collection_{Expiracion}` | Expiration date in grid |
| 4 | `status` | `applicantStatusFuncionoElBot` | Bot execution status flag |

### 2.5 Primitive 4: Component Action

Links UI elements to bots. Three types are needed:

| # | UI Element | Bot | Trigger |
|---|-----------|-----|---------|
| 1 | "Agregar" dropdown button | Bot INTERNO nuevo | User clicks to create new permit |
| 2 | "Modificar" button in grid | Bot INTERNO modificar | User clicks to modify existing |
| 3 | Block22 panel | Bot LISTAR | Panel loads = auto-query GDB |

**CRITICAL two-step process:**
1. `componentaction_save(service_id, component_key, actions)` -> creates backend action, returns `id`
2. `form_component_update(component_key, updates={"componentActionId": id})` -> links action to component
3. Without step 2, the action exists in DB but won't render the green "A" icon or fire on click

### 2.6 Primitive 5: EditGrid

A read-only grid in Block22 showing existing permits. Structure:

```
EditGrid ({key})
  +-- Dropdown (menu icon "...")
  |   +-- Button "Modificar" (triggers Bot INTERNO modificar)
  |   +-- Button "Cancelar" (triggers Bot INTERNO cancelar, if exists)
  |
  +-- Columns (4 data columns + 1 empty spacer)
      +-- Col 1: Tipo (textfield, defaultValue = service name)
      +-- Col 2: Numero (textfield, from GDB)
      +-- Col 3: Vigente hasta (datetime, from GDB)
      +-- Col 4: Expirado (badge button, red when expired)
      +-- Col 5: (empty, for spacing)
```

**Visual consistency rules (CRITICAL):**
- EditGrid: `hideLabel: true`, `disableAddingRows/Removing/Editing: true`, `virtualScroll: true`
- Dropdown: `leftIcon: "fa-solid fa-ellipsis-vertical"`, `collapsed: true`, `direction: "left"`, `size: "sm"`
- Columns: `label: ""` (empty), each `width: 2`, 5th column empty
- Badge "Expirado": `size: "xs"`, classes `["light-color", "hover-feedback-off", "button-status", "btn-red"]`

### 2.7 Primitive 6: Determinants + Effects

In the destination service, conditional logic controls form behavior:

| # | Determinant | Effect | Purpose |
|---|------------|--------|---------|
| 1 | StatusBitacora = "true" | Activate main form block | Show form when arriving from Bitacora |
| 2 | StatusBitacora != "true" | Activate initial selection | Show normal entry when direct access |
| 3 | QueQuiereHacer = "registrarNuevo" | Show "new" form sections | Branch for new permits |
| 4 | QueQuiereHacer = "modificarExistente" | Show "modify" form sections | Branch for modifications |
| 5 | Grid date < today | Activate "Expirado" badge | Mark expired permits in Bitacora grid |

---

## 3. Detailed Comparison: PE vs Fito vs Zoo

### 3.1 Service Overview

| Aspect | PE (reference) | Fito | Zoo |
|--------|---------------|------|-----|
| **Service ID** | `2c918084887c7a8f01887c99ed2a6fd5` | `2c91808893792e2b019379310a8003a9` | `2c91808893792e2b01938d3fd5800ceb` |
| **Full name** | Permiso eventual | Permiso fitosanitario | Permiso Zoosanitario de importacion |
| **Determinants** | 40 | 37 | 37 |
| **Roles** | 10 | 10 | 9 |
| **Bots** | (in PE service) | 20 | 9 |
| **Fields** | ~80 | 86 | 86 |
| **Behaviours** | ~60 | 69 | 93 |
| **Has modification flow** | YES | NO (always new) | YES (5 QueQuiereHacer options) |
| **Export size** | ~800KB | 1.54 MB | 0.59 MB |

### 3.2 Connection Completeness Matrix

| Primitive | PE | Fito | Zoo |
|-----------|-----|------|-----|
| **Receiver: StatusBitacora** | `applicantStatusLlegaDeLaBitacora` | Same key | Same key |
| **Receiver: NIT** | `applicantNit3` | `applicantNit` | `applicantNit` |
| **Receiver: Empresa** | `applicantNombreDeLaEmpresa4` | `applicantNombreDeLaEmpresa` | `applicantNombreDeLaEmpresa` |
| **Receiver: QueQuiereHacer** | `applicantQueQuiereHacer` | N/A | 5 separate radios |
| **Receiver: Checkbox tipo** | `permisoEventual` | `permisoFitosanitario` | `permisoZoosanitarios1` |
| **Bot INTERNO nuevo** | `6603eb75` (4 mappings) | `d98caa87` (5 mappings) | `c28bb4c1` (6 mappings) |
| **Bot INTERNO modificar** | `c88be29b` (7 mappings) | N/A (no modif) | `f6d16dc7` (6 mappings) |
| **Bot LISTAR** | `b94c62ab` (GDB-PE 1.5) | `7248ea6d` (GDB-FITO2 1.1) | `3f66f6b7` (GDB-ZOO 1.0) |
| **LISTAR output mappings** | 4 | 4 | 4 |
| **LISTAR attachment** | `applicantBlock` (hidden) | Block22 panel | Block22 panel |
| **Component Action: button** | `applicantPermisoEventual` | `applicantEventuales3` | `applicantEquiposUsoDeEnergia2` |
| **Component Action: modificar** | `applicantModificar` | `applicantModificarFito` (no action) | `applicantModificarZoo` |
| **Component Action: Block22** | NOT on Block22 | On Block22 | On Block22 |
| **EditGrid** | `applicantEditGrid` | `applicantEditGridFito` | `applicantEditGridZoo` |
| **Determinant: StatusBitacora=true** | `7383e917` | MISSING (MCP bug) | MISSING (MCP bug) |
| **Effect: activate form block** | EXISTS | MISSING (MCP bug) | MISSING (MCP bug) |
| **Expirado badge logic** | EXISTS (manual) | MISSING (MCP bug) | MISSING (MCP bug) |
| **Expirado CSS classes** | Complete | Missing 2 classes | Missing 2 classes |

### 3.3 Key Differences

**PE LISTAR is attached differently:**
- PE LISTAR is on `applicantBlock` inside hidden Block5 > Block8 > applicantcolumns7
- Fito/Zoo LISTAR are on Block22 (the visible permits panel)
- This means PE LISTAR triggers when its backend panel loads, not when Block22 loads
- This is likely the original pattern; Fito/Zoo use a newer pattern

**Fito has NO modification flow:**
- Users always create new permits
- No QueQuiereHacer field needed
- No Bot INTERNO modificar needed
- The "Modificar" button in the Fito grid exists but has no component action

**Zoo has 5 operation types:**
- RegistrarNuevo, Modificar, Renovar, Consultar, Cancelar
- Each is a separate radio field in the Zoo service
- The Bitacora maps to the appropriate radio using hidden source fields

**Zoo bot roles still say "fito":**
- Roles like "PERMISOS fito crear", "Crear productos fito" exist in Zoo
- This is because Zoo was copied from Fito and the role names weren't updated

---

## 4. The Replication Pattern (Step-by-Step)

### 4.1 Prerequisites

Before connecting a new service to the Bitacora, verify:

1. The service exists and has a valid registration
2. A GDB LISTAR endpoint exists for the service
3. The service has (or can have) the receiver fields
4. You know the field keys in the destination service (NEVER assume!)

### 4.2 The 8-Step Process

```
Step 1: Create receiver fields (if missing)
    - applicantStatusLlegaDeLaBitacora (radio)
    - Checkbox tipo field (checkbox)
    - NIT, Empresa, QueQuiereHacer (if COMPLETO level)
    Tool: form_component_add (destination service)

Step 2: Create determinant + effect for StatusBitacora
    - Determinant: StatusBitacora EQUAL "true"
    - Effect: activate main form block
    BLOCKED: MCP Bug 1-3 (radio determinant)
    Workaround: Manual in BPA UI

Step 3: Create/update Bot INTERNO nuevo mappings
    Tool: bot_input_mapping_create (Bitacora service)

Step 4: Create Bot INTERNO modificar (if needed)
    Tool: bot_create + bot_update + bot_input_mapping_create
    (Skip if service has no modification flow)

Step 5: Complete Bot LISTAR output mappings
    Tool: bot_output_mapping_save_all (workaround for _collection_ bug)

Step 6: Create Component Actions
    Tool: componentaction_save + form_component_update
    CRITICAL: Must set componentActionId on the component!

Step 7: Create EditGrid in Block22
    Tool: form_component_add (multiple nested components)
    Follow visual consistency rules exactly

Step 8: Create Expirado badge logic
    - Date row determinant (date < today)
    - Grid determinant wrapping the date determinant
    - Effect on badge component (activate when expired)
    BLOCKED: MCP Bug 4-5 (grid determinant)
    Workaround: Manual in BPA UI
```

### 4.3 Automation Rate

| Step | Automatable via MCP? | Notes |
|------|---------------------|-------|
| 1 | YES | `form_component_add` |
| 2 | NO | MCP Bug 1-3 (radio determinant) |
| 3 | YES | `bot_input_mapping_create` |
| 4 | YES | `bot_create` + `bot_update` + `bot_input_mapping_create` |
| 5 | YES* | Must use `bot_output_mapping_save_all` (workaround) |
| 6 | YES | `componentaction_save` + `form_component_update` (v0.15.0) |
| 7 | YES | `form_component_add` (multiple calls) |
| 8 | NO | MCP Bug 4-5 (grid determinant row_determinant_id null) |

**Current automation rate: 6 of 8 steps = 75%**

---

## 5. MCP Limitations History

### 5.1 Bug 1-3: Radio Determinant (BLOCKING)

**Discovered**: During Fito connection (2026-02-09)
**Symptom**: `selectdeterminant_create` creates a `SelectDeterminant` Java object, but radio fields need a `RadioDeterminant`. BPA backend throws `ClassCastException` when trying to evaluate the determinant at runtime.
**Impact**: Cannot create StatusBitacora=TRUE determinant via MCP for any service
**Workaround**: Create manually in BPA UI
**Fix needed**: New `radiodeterminant_create` tool in MCP
**Bug report**: `bugs/MCP-Bug-Radio-Determinant.md` in MCPNP repo

### 5.2 Bug 4-5: Grid Determinant (BLOCKING)

**Discovered**: During Fito connection (2026-02-09)
**Symptom**: `griddeterminant_create` creates the determinant but `row_determinant_id` is saved as `null`. Without the row determinant link, the grid determinant is broken and causes cascading failures.
**Impact**:
- Cannot create Expirado badge logic via MCP
- Broken determinant `6bacdc42` blocks `componentbehaviour_list` for entire Bitacora (server NullPointerException)
**Workaround**: Create manually in BPA UI
**Fix needed**: Fix `griddeterminant_create` to persist `row_determinant_id`

### 5.3 Bot Output Mapping _collection_ Rejection (WORKAROUND FOUND)

**Discovered**: During Fito LISTAR output mapping creation
**Symptom**: `bot_output_mapping_create` validates field keys and rejects fields containing `_collection_` (e.g., `applicantEditGridFito_collection_applicantNumeroFito`)
**Impact**: Cannot create individual output mappings for EditGrid collection fields
**Workaround**: Use `bot_output_mapping_save_all` which bypasses per-field validation
**Status**: RESOLVED via workaround

### 5.4 Component Action Two-Step (DOCUMENTED)

**Discovered**: During Zoo connection (2026-02-10)
**Symptom**: `componentaction_save` creates the action record in the backend but does NOT update the component's `componentActionId` field in the form. Without this update, the green "A" icon doesn't appear and the action doesn't fire on click.
**Impact**: Every component action creation requires a follow-up `form_component_update`
**Status**: DOCUMENTED as standard procedure (not a bug per se, but a non-obvious requirement)

### 5.5 Component Actions Not Available (RESOLVED in v0.15.0)

**Discovered**: Early in the project (2026-02-08)
**Symptom**: MCP v0.14.1 had no tools to create/manage component actions
**Impact**: All button-to-bot linking had to be done manually in BPA UI
**Resolution**: MCP v0.15.0 added `componentaction_save`, `componentaction_update`, `componentaction_delete`, `componentaction_get_system_actions`

### 5.6 Permission Issues on Background Agents

**Discovered**: During comprehensive analysis (2026-02-10)
**Symptom**: Background agents running `role_list` on PE service get "Permission denied"
**Impact**: Cannot directly query roles for some services
**Workaround**: Use `service_export_raw` and parse with Python/jq

### 5.7 Large Response Handling

**Discovered**: Throughout the project
**Symptom**: Responses > 50KB are saved to files; responses > 100KB require chunked reading
**Impact**: Analysis workflows require file I/O and parsing instead of direct tool responses
**Status**: Working as designed (not a bug)

### 5.8 Broken Determinant Blocks API

**Discovered**: During Bitacora analysis (2026-02-10)
**Symptom**: Broken grid determinant `6bacdc42` (null row_determinant_id) causes NullPointerException when `componentbehaviour_list` tries to serialize it
**Impact**: Cannot list ANY behaviours for the entire Bitacora service
**Fix needed**: Delete broken determinant `6bacdc42` OR fix MCP Bug 4-5

---

## 6. Harmonization Analysis

### 6.1 Field Key Inconsistency

The biggest harmonization issue is that **each service uses different field keys** for the same logical fields:

| Logical Field | PE | Fito | Zoo | Ideal |
|---------------|-----|------|-----|-------|
| NIT | `applicantNit3` | `applicantNit` | `applicantNit` | `applicantNit` |
| Empresa | `applicantNombreDeLaEmpresa4` | `applicantNombreDeLaEmpresa` | `applicantNombreDeLaEmpresa` | `applicantNombreDeLaEmpresa` |
| Checkbox tipo | `permisoEventual` | `permisoFitosanitario` | `permisoZoosanitarios1` | `permiso{ServiceName}` |
| Contador | `contadorPermisosExistentes` | `contadorPermisosExistentes` | `ContadorEnergia` | `contadorPermisosExistentes` |
| QueQuiereHacer | 1 radio | N/A | 5 separate radios | 1 radio with options |

**Impact**: Every new service connection requires discovering the actual field keys. No template can be reused without modification.

**Recommendation**: For new services, standardize field keys:
- `applicantStatusLlegaDeLaBitacora` (already standardized)
- `applicantNit` for NIT
- `applicantNombreDeLaEmpresa` for company name
- `permiso{ServiceShortName}` for the checkbox tipo
- `contadorPermisosExistentes` for the counter
- `applicantQueQuiereHacer` for QueQuiereHacer (single radio with value options)

### 6.2 Naming Inconsistencies in Bitacora

| Key | Expected | Actual |
|-----|----------|--------|
| `applicantPermisoZoosanitario` | Zoo grid | ONURE/Energia grid (label: "Equipos de energia electrica") |
| `applicantEquiposUsoDeEnergia2` | ONURE button | Zoo "Zoosanitarios" button |
| Zoo bot roles | "PERMISOS zoo crear" | "PERMISOS fito crear" (copied from Fito) |
| `ContadorEnergia` (Zoo) | Zoo counter | Named like ONURE counter |

### 6.3 Structural Differences

**PE LISTAR attachment:**
- PE uses the old pattern: LISTAR on hidden backend panel in Block5 > Block8
- Fito/Zoo use the new pattern: LISTAR on Block22 panel
- Both work, but the new pattern is cleaner (auto-loads when user sees the permits tab)

**QueQuiereHacer architecture:**
- PE: Single radio field with 2 options
- Fito: No radio (always "new")
- Zoo: 5 separate radio fields (each with its own QueQuiereHacer variant)
- Ideal: Single radio field with option values

### 6.4 Visual Consistency

After corrections, all three EditGrids (PE, Fito, Zoo) now share consistent visual properties. However, two CSS classes are still missing on Fito and Zoo Expirado badges:
- `datagrid-hide-column-label`
- `deactivated`

These can be fixed via `form_component_update`.

---

## 7. Next Services to Connect

### 7.1 Services with Existing Bots (Quick Wins)

These services already have INTERNO and LISTAR bots in the Bitacora. They only need:
- EditGrid in Block22
- Component Actions
- Possibly receiver fields in destination

| Service | INTERNO Bots | LISTAR Bot | GDB | Priority |
|---------|-------------|------------|-----|----------|
| **Certificado Sanitario** | nuevo | `abc4681d` (GDB-SANITARIO 1.1) | YES | HIGH |
| **Permiso ONN** | nuevo | `6cf6bd6c` + `1bbfb070` (GDB-ONN 1.2) | YES | HIGH |
| **Clientes y Proveedores** | nuevo | `ea04ea53` (GDB-CyP 1.4) | YES | MEDIUM |
| **Licencia CECMED** | nuevo + modif + renovar | `07a58130` + `b25e4906` (GDB-CECMED 1.4) | YES | HIGH |

### 7.2 Services with Partial Setup

| Service | Has | Missing | Priority |
|---------|-----|---------|----------|
| **ONURE/Energia** | All bots + EditGrid | Needs verification | LOW (already working?) |
| **Homologar Equipos** | 2 INTERNO bots | LISTAR bot, EditGrid | MEDIUM |
| **Autorizacion Donaciones** | INTERNO nuevo | LISTAR bot, EditGrid | MEDIUM |
| **Acreditacion** | nueva + renovar | LISTAR bot, EditGrid | LOW |
| **Template** | nuevo + modificar | LISTAR bot, EditGrid | LOW (testing only) |

### 7.3 Buttons Without Actions

Two buttons in Block22's "Agregar" dropdown have no component actions:
- **"Donativos medicos"** (`applicantEventuales4`) - no action
- **"Instrumentos de medicion"** (`applicantDonativosMedicos`) - no action

These need INTERNO bots created and linked.

---

## 8. Recommendations and Next Steps

### 8.1 Immediate Actions (can do now)

| # | Action | Tool | Effort |
|---|--------|------|--------|
| 1 | Fix Expirado badge CSS on Fito | `form_component_update` | 5 min |
| 2 | Fix Expirado badge CSS on Zoo | `form_component_update` | 5 min |
| 3 | Add Solicitud mapping to Zoo Bot INTERNO modificar | `bot_input_mapping_create` | 5 min |
| 4 | Fix Zoo bot role names (still say "fito") | Manual in BPA UI | 15 min |

### 8.2 Blocked by MCP Bugs (manual or wait for fix)

| # | Action | Bug | Services Affected |
|---|--------|-----|-------------------|
| 1 | Create StatusBitacora=TRUE determinant + effect | Bug 1-3 | Fito, Zoo |
| 2 | Create Expirado badge grid determinant + effect | Bug 4-5 | Fito, Zoo |
| 3 | Clean up broken determinant `6bacdc42` | Bug 4-5 | Bitacora |

### 8.3 MCP Improvements Needed

| # | Improvement | Impact | Priority |
|---|-------------|--------|----------|
| 1 | Add `radiodeterminant_create` tool | Unblock StatusBitacora automation | CRITICAL |
| 2 | Fix `griddeterminant_create` persistence | Unblock Expirado badge automation | CRITICAL |
| 3 | Fix `bot_output_mapping_create` for `_collection_` fields | Eliminate need for `save_all` workaround | HIGH |
| 4 | Auto-set `componentActionId` in `componentaction_save` | Eliminate manual two-step process | MEDIUM |
| 5 | Add `radiodeterminant_update` tool | Support updating radio determinants | MEDIUM |

### 8.4 Process Improvements for Adding New Services

1. **Create a field mapping template**: Before starting, document all receiver field keys in the destination service
2. **Verify GDB availability**: Use `muleservice_discover` to check if GDB endpoint exists
3. **Use `bot_output_mapping_save_all`**: Always use this instead of individual creates for LISTAR outputs
4. **Component Action checklist**: Always verify `componentActionId` is set after `componentaction_save`
5. **Take baseline snapshots**: Before making changes, document current state
6. **Visual consistency**: Copy properties from Fito/PE EditGrid, don't rely on minimal defaults

### 8.5 Harmonization Roadmap

| Phase | Actions |
|-------|---------|
| **Phase 1** | Fix Fito/Zoo remaining gaps (CSS, determinants, Solicitud mapping) |
| **Phase 2** | Connect Cert. Sanitario + ONN + CECMED (bots already exist) |
| **Phase 3** | Standardize field keys for new services going forward |
| **Phase 4** | Clean up Bitacora naming inconsistencies |
| **Phase 5** | Create reusable Arazzo workflow for service connection |

### 8.6 Automation Vision

With the two MCP bug fixes (radio determinant + grid determinant), the replication process would be **100% automatable**. A single Arazzo workflow could:

1. Accept: service_id, field_key_map, has_modification_flow, gdb_service_id
2. Verify receiver fields exist (create if missing)
3. Create determinant + effect for StatusBitacora
4. Create/configure Bot INTERNO (nuevo + optionally modificar)
5. Configure Bot LISTAR output mappings
6. Create Component Actions (button + panel + optionally modificar)
7. Create EditGrid with all visual components
8. Create Expirado badge logic

**Estimated time per service**: 2-3 minutes (fully automated) vs 2-4 hours (manual)

---

## Appendix A: Complete Bot Mapping Reference

### PE Bot INTERNO nuevo (`6603eb75`)
| Source | Target | Types |
|--------|--------|-------|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `applicantRadio` | `applicantQueQuiereHacer` | radio -> radio |
| `applicantNit5` | `applicantNit3` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | string -> textfield |

### PE Bot INTERNO modificar (`c88be29b`)
| Source | Target | Types |
|--------|--------|-------|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `applicantRadio2` | `applicantQueQuiereHacer` | radio -> radio |
| `applicantNit5` | `applicantNit3` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | string -> textfield |
| `EditGrid_collection_Numero5` | `applicantSolicitud` | textfield -> textfield |
| `constant_true` | `permisoEventual` | Boolean -> checkbox |
| Contador | `contadorPermisosExistentes` | Number -> number |

### Fito Bot INTERNO nuevo (`d98caa87`)
| Source | Target | Types |
|--------|--------|-------|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `constant_true` | `permisoFitosanitario` | Boolean -> checkbox |
| `applicantNit5` | `applicantNit` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa` | string -> textfield |
| `applicantContadorFito` | `contadorPermisosExistentes` | Number -> number |

### Zoo Bot INTERNO nuevo (`c28bb4c1`)
| Source | Target | Types |
|--------|--------|-------|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `constant_true` | `permisoZoosanitarios1` | Boolean -> checkbox |
| `applicantNit5` | `applicantNit` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa` | string -> textfield |
| `applicantQueQuiereHacerNuevo4` | `applicantQueQuiereHacerRegistrarNuevo` | radio -> radio |
| `applicantContadorZoo` | `ContadorEnergia` | Number -> number |

### Zoo Bot INTERNO modificar (`f6d16dc7`)
| Source | Target | Types |
|--------|--------|-------|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `constant_true` | `permisoZoosanitarios1` | Boolean -> checkbox |
| `applicantNit5` | `applicantNit` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa` | string -> textfield |
| `applicantQueQuiereHacerModif3` | `applicantQueQuiereHacerModificar` | radio -> radio |
| `applicantContadorZoo` | `ContadorEnergia` | Number -> number |

---

## Appendix B: Bitacora Determinants Reference

| ID | Name | Type | Target Field | Value |
|----|------|------|-------------|-------|
| `97f29765` | Status Empresa seleccionada = True | radio | applicantStatusEmpresaSeleccionada | "true" |
| `22ea0e4b` | Empresa seleccionada distinto de vacio | text | applicantNit5 | NOT_EQUAL "" |
| `3d9e9f92` | Contador acreditaciones = 0 | numeric | applicantAcreditaciones | 0 |
| `90c70457` | Contador acreditaciones > 0 | numeric | applicantAcreditaciones | >0 |
| `b7cf470b` | Contador acreditaciones > 1 | numeric | applicantAcreditaciones | >1 |
| `bbc34872` | Contador acreditadas = 1 | numeric | applicantContadorAcreditaciones | 1 |
| `52788760` | Contador relacionadas > 1 | numeric | applicantContadorAcreditaciones | >1 |
| `b71c3f32` | Current PartA tab is valid | boolean | isCurrentPartATabValid | true |
| `03075ca2` | Form is valid | boolean | isFormValid | true |
| `df36011b` | User is logged in | boolean | is_submit_allowed | true |
| `0f2f1b53` | EVENT empresa confirmada | button | applicantCambiarEmpresa3 | - |
| `09be76c6` | EVENT empresa selected | grid | applicantEditGridEmpresasAcreditadas | - |
| `681c7f35` | Vigencia < hoy (inside grid) | grid | applicantEditGridEmpresasAcreditadas | - |
| `31a2e6f7` | Vigencia > hoy (inside grid) | grid | applicantEditGridEmpresasAcreditadas | - |
| `a748d6fb` | Vigencia > hoy (empresa seleccionada) | date | applicantExpiracion4 | > current |
| `1c1fdf15` | Vigente hasta not empty | grid | applicantEditGridEmpresasAcreditadas | - |
| `2226d3b9` | Acreditacion = expirada | grid | applicantEditGridEmpresasAcreditadas | - |
| `2b43313a` | Vigencia permiso eventual < hoy | grid | applicantEditGrid | - |
| **`6bacdc42`** | **Vigencia fito < hoy** | **grid** | applicantEditGridFito | **BROKEN** |

---

## Appendix C: Execution History Summary

### What Was Accomplished (by Claude + Nelson)

| Service | Objects Created | Steps Automated | Steps Manual | MCP Bugs Hit |
|---------|----------------|-----------------|--------------|-------------|
| **Fito** | ~20 objects | 5 of 7 (71%) | 2 blocked | Bug 1-3, 4-5 |
| **Zoo** | ~26 objects | 6 of 8 (75%) | 2 blocked | Bug 1-3, 4-5 |
| **Total** | ~46 objects | 11 of 15 (73%) | 4 blocked | 2 unique bugs |

### Timeline

| Date | Milestone |
|------|-----------|
| 2026-02-08 | Project start, PE model analysis, Component Actions limitation discovered |
| 2026-02-09 | Fito connection started, MCP bugs 1-3 and 4-5 discovered, most Fito steps completed |
| 2026-02-09 | MCP v0.15.0 released (Component Actions tools added) |
| 2026-02-10 | Zoo connection completed (autonomous execution), visual consistency fixes, comprehensive analysis |

---

*Generated by: Claude (AI assistant) with Nelson Perez*
*Project: VUCE Cuba BPA - Bitacora Hub*
*MCP Package: mcp-eregistrations-bpa v0.15.0*
