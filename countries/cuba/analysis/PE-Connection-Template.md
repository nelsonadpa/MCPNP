# Permiso Eventual (PE) Connection Template
## Gold Standard Pattern for Connecting Services to the Bitacora Hub

**Generated**: 2026-02-12
**Source Service (Hub)**: Bitacora `ffe746aac09241078bad48c9b95cdfe0`
**Destination Service (PE)**: Permisos Eventuales `2c918084887c7a8f01887c99ed2a6fd5`

---

## 1. Service Profile

### What Makes PE the "COMPLETO" Pattern

PE is the most fully-featured connection model because it supports:

| Feature | PE Has? | Simpler Services |
|---------|---------|-----------------|
| New case creation | Yes | Yes (all) |
| Modification of existing cases | Yes | Some (Zoo, Sustancias) |
| QueQuiereHacer radio (nuevo/modificar) | Yes | Only if modification flow exists |
| NIT passthrough | Yes | Yes (all) |
| Empresa passthrough | Yes | Yes (all) |
| Counter field | Yes | Yes (all) |
| Solicitud (case number for modify) | Yes | Only if modification flow exists |
| Tipo de Operacion column (import/export) | Yes | Some services (Sanitario, etc.) — added in TipoOperacion iteration |
| Expirado badge | Yes | Yes (all) |
| GDB LISTAR integration | Yes | Yes (all) |

### PE-Specific Characteristics
- **Has modification flow**: Users can modify existing PE cases from the Bitacora
- **Has Tipo de Operacion**: Extra select column showing import/export type (unique to PE)
- **Checkbox "permisoEventual"**: The modificar bot sends `constant_true` to a `permisoEventual` checkbox in the PE service
- **Counter default**: `-1` (not `0`) -- triggers initial LISTAR on first load

---

## 2. Bot Architecture

### 2.1 Bot INTERNO PE Nuevo

Creates a new PE case when user clicks "Permiso eventual" in the Agregar dropdown.

| Property | Value |
|----------|-------|
| **Bot ID** | `6603eb75-2f6d-40d4-b4e3-6c52b5657776` |
| **Name** | INTERNO permisos eventuales - nuevo |
| **Type** | internal |
| **bot_service_id** | `2c918084887c7a8f01887c99ed2a6fd5` (PE service) |
| **short_name** | (null) |

#### Input Mappings (4 total)

| # | Source Field (Bitacora) | Source Type | Target Field (PE) | Target Type | Purpose |
|---|------------------------|-------------|-------------------|-------------|---------|
| 1 | `constant_true` | string | `applicantStatusLlegaDeLaBitacora` | radio | Flags case as coming from Bitacora |
| 2 | `applicantRadio` | radio | `applicantQueQuiereHacer` | radio | Sends "registrarNuevo" value |
| 3 | `applicantNit5` | string | `applicantNit3` | textfield | Passes selected company NIT |
| 4 | `applicantCompania7` | string | `applicantNombreDeLaEmpresa4` | textfield | Passes selected company name |

#### Output Mappings: None

---

### 2.2 Bot INTERNO PE Modificar

Modifies an existing PE case when user clicks "Modificar" in the EditGrid dropdown.

| Property | Value |
|----------|-------|
| **Bot ID** | `c88be29b-3703-4b7a-9a38-2c56b3d9a834` |
| **Name** | INTERNO permisos eventuales - modificar |
| **Type** | internal |
| **bot_service_id** | `2c918084887c7a8f01887c99ed2a6fd5` (PE service) |
| **short_name** | INTERNO permisos eve |

#### Input Mappings (7 total)

| # | Source Field (Bitacora) | Source Type | Target Field (PE) | Target Type | Purpose |
|---|------------------------|-------------|-------------------|-------------|---------|
| 1 | `constant_true` | Boolean | `applicantStatusLlegaDeLaBitacora` | radio | Flags case as coming from Bitacora |
| 2 | `applicantRadio2` | radio | `applicantQueQuiereHacer` | radio | Sends "modificarExistente" value |
| 3 | `applicantNit5` | string | `applicantNit3` | textfield | Passes selected company NIT |
| 4 | `applicantCompania7` | string | `applicantNombreDeLaEmpresa4` | textfield | Passes selected company name |
| 5 | `applicantEditGrid_collection_applicantNumero5` | string | `applicantSolicitud` | textfield | Passes the PE case number to modify |
| 6 | `constant_true` | Boolean | `permisoEventual` | checkbox | PE-specific: flags as permiso eventual |
| 7 | `applicantContadorPermiso` | Number | `applicantContadorEventuales` | number | Passes the current counter value |

#### Output Mappings: None

**Key differences from "nuevo":**
- Uses `applicantRadio2` (defaultValue: "modificarExistente") instead of `applicantRadio` (defaultValue: "registrarNuevo")
- Includes Solicitud mapping (case number from EditGrid row)
- Includes Counter mapping
- Includes PE-specific checkbox mapping

---

### 2.3 Bot LISTAR PE

Reads PE data from GDB to populate the EditGrid with existing permits.

| Property | Value |
|----------|-------|
| **Bot ID** | `b94c62ab-9ba0-4bfc-b9ce-e982e2bde9cd` |
| **Name** | Permiso eventual LISTAR |
| **Type** | data |
| **bot_service_id** | `GDB.GDB-PE(1.5)-list` |
| **short_name** | PE listar |
| **category** | list |

#### Input Mappings (1 total)

| # | Source Field (Bitacora) | Source Type | Target Field (GDB) | Target Type | Purpose |
|---|------------------------|-------------|-------------------|-------------|---------|
| 1 | `applicantNit5` | textfield | `query_child_NIT` | string | Queries GDB by company NIT |

#### Output Mappings (5 total)

| # | Source Field (Bitacora) | Source Type | Target Field (GDB) | Target Type | Purpose |
|---|------------------------|-------------|-------------------|-------------|---------|
| 1 | `applicantEditGrid_collection_applicantExpiracion` | datetime | `results_collection_content_child_Permiso eventual_child_hasta` | date | Expiration date per row |
| 2 | `applicantEditGrid_collection_applicantNumero5` | textfield | `results_collection_content_child_Permiso eventual_child_num aprobacion` | string | Permit number per row |
| 3 | `applicantStatusFuncionoElBot` | radio | `status` | boolean | Bot execution status |
| 4 | `applicantEditGrid_collection_applicantTipoDeOperacion` | select | `results_collection_content_child_Operacion_child_tipo de operacion` | catalog | Operation type per row |
| 5 | `applicantContadorPermiso` | number | `count` | integer | Total count of permits |

**IMPORTANT pattern for LISTAR output mappings:**
- Collection fields use the pattern: `{editGridKey}_collection_{fieldKey}` on the source (Bitacora) side
- GDB fields use: `results_collection_content_child_{GDB entity}_child_{field name}` on the target side
- `status` and `count` are top-level fields (not collection)

---

## 3. Form Components in the Bitacora

### 3.1 EditGrid Structure (applicantEditGrid)

The EditGrid is the visible table in Block22 that shows the user's PE permits.

**Location**: `applicantBitacoraV2 > applicantBitacoraV2servicios > applicantcolumns19 > applicantBlock22 > applicantEditGrid`

#### EditGrid Properties
```json
{
  "key": "applicantEditGrid",
  "type": "editgrid",
  "label": "Permiso eventual",
  "hideLabel": true,
  "disableAddingRows": true,
  "disableRemovingRows": true,
  "disableEditingRows": true,
  "virtualScroll": true,
  "openWhenEmpty": false,
  "modalEdit": false,
  "emptyRowFeedbackMessage": "No encontramos registros<br>\nHaga clic en agregar para iniciar uno nuevo",
  "fieldsShownInGrid": [
    "applicantTipo5",
    "applicantNumero5",
    "applicantTipoDeOperacion",
    "applicantExpiracion",
    "applicantExpirado",
    "applicantdropdown7"
  ]
}
```

#### EditGrid Children (2 top-level children)

**Child 1: Dropdown (applicantdropdown7)** -- the three-dot menu
```json
{
  "key": "applicantdropdown7",
  "type": "dropdown",
  "title": "Dropdown",
  "hideLabel": true,
  "leftIcon": "fa-solid fa-ellipsis-vertical",
  "customClasses": ["light-color", "datagrid-hide-column-label", "horizontal-align-right"],
  "direction": "left",
  "size": "sm",
  "collapsed": true,
  "block": false
}
```

Dropdown contains:
| Button Key | Label | Size | Classes | Component Action | Purpose |
|-----------|-------|------|---------|-----------------|---------|
| `applicantModificar` | Modificar | sm | `dropdown-menu-item` | `6230a2b0` (INTERNO modificar) | Opens modify flow |
| `applicantCancelar` | Cancelar | sm | `dropdown-menu-item` | (none) | Disabled cancel button |

**Child 2: Columns (applicantcolumns6)** -- the data columns
```
label: "" (empty string)
5 columns, each width: 2
```

| Column # | Field Key | Type | Label | Default Value | Disabled | Special Properties |
|----------|-----------|------|-------|---------------|----------|--------------------|
| 1 | `applicantTipo5` | textfield | Tipo | "Eventual" | true | Static label |
| 2 | `applicantNumero5` | textfield | Numero | "" | true | Populated by LISTAR |
| 3 | `applicantTipoDeOperacion` | select | Operacion | "" | true | Catalog: `2c92808b7676257d01767686423f0003`, PE-specific |
| 4 | `applicantExpiracion` | datetime | Vigente hasta | "" | true | `format: "dd-MM-yyyy"`, `suffix: true` |
| 5 | `applicantExpirado` | button | Expirado | (n/a) | (n/a) | Badge button, see section 6 |

---

### 3.2 "Agregar" Dropdown Button (applicantPermisoEventual)

**Location**: `Block22 > applicantcolumns14 > applicantdropdown5 > applicantPermisoEventual`

```json
{
  "key": "applicantPermisoEventual",
  "type": "button",
  "label": "Permiso eventual",
  "size": "xs",
  "customClasses": ["dropdown-menu-item"],
  "componentActionId": "b1139de3-603e-48ec-9f4c-aa86fd575ae1"
}
```

---

### 3.3 Backend Fields in Block5

All PE-related hidden fields live inside `applicantBlock5 > applicantBlock8 > applicantcolumns7` (labeled "Permiso eventual").

**applicantcolumns7** contains 3 columns:

| Column | Field Key | Type | Label | Default Value | Purpose |
|--------|-----------|------|-------|---------------|---------|
| 1 | `applicantBlock` | panel | Block | - | LISTAR trigger panel (componentActionId: `faefcc8a`) |
| 2 | `applicantStatusFuncionoElBot` | radio | Status funciono el bot? | "" | LISTAR success status (values: true/false) |
| 3 | `applicantContadorPermiso` | number | Contador permisos eventuales | -1 | PE permit count |

**QueQuiereHacer Radios** live in `applicantBlock5 > applicantBlock9 > applicantcolumns16`:

| Field Key | Type | Label | Default Value | Values |
|-----------|------|-------|---------------|--------|
| `applicantRadio` | radio | Que quiere hacer? Registrar nuevo | "registrarNuevo" | registrarNuevo, modificarExistente, renovarExistente, consultar, cancelar |
| `applicantRadio2` | radio | Que quiere hacer? Modificar | "modificarExistente" | (same values) |

**Note on Radio Fields**: These are pre-set with default values. The INTERNO nuevo bot uses `applicantRadio` (which defaults to "registrarNuevo"), and the INTERNO modificar bot uses `applicantRadio2` (which defaults to "modificarExistente"). They are not user-facing -- they exist purely to pass the correct value to the destination service.

**Source Fields (shared across all services)** in `applicantBlock5 > applicantBlock6 > applicantcolumns2`:

| Field Key | Type | Label | Purpose |
|-----------|------|-------|---------|
| `applicantNit5` | textfield | NIT | Selected company's NIT |
| `applicantCompania7` | textfield | Empresa | Selected company name |

---

## 4. Component Actions

### 4.1 "Agregar" Button -> INTERNO Nuevo

| Property | Value |
|----------|-------|
| **Component Action ID** | `b1139de3-603e-48ec-9f4c-aa86fd575ae1` |
| **Component Key** | `applicantPermisoEventual` |
| **Bot** | `6603eb75` (INTERNO PE nuevo) |
| **sort_order** | 1 |
| **parallel** | false |
| **mandatory** | false |

**Trigger**: User clicks "Permiso eventual" in the Agregar dropdown menu.

### 4.2 "Modificar" Button -> INTERNO Modificar

| Property | Value |
|----------|-------|
| **Component Action ID** | `6230a2b0-f52b-4e2f-8ae3-68f1bfcede7a` |
| **Component Key** | `applicantModificar` |
| **Bot** | `c88be29b` (INTERNO PE modificar) |
| **sort_order** | 1 |
| **parallel** | false |
| **mandatory** | false |

**Trigger**: User clicks "Modificar" in a specific EditGrid row's three-dot menu.

### 4.3 LISTAR Panel -> PE LISTAR

| Property | Value |
|----------|-------|
| **Component Action ID** | `faefcc8a-d7ff-4f98-93cf-3aca95b2aaa5` |
| **Component Key** | `applicantBlock` (inside Block5 > Block8 > applicantcolumns7) |
| **Bot** | `b94c62ab` (PE LISTAR) |
| **sort_order** | 1 |
| **parallel** | false |
| **mandatory** | false |

**Trigger**: Block22 panel renders, triggering the hidden panel which fires the LISTAR bot.

**IMPORTANT**: PE uses a **different LISTAR trigger pattern** than Fito/Zoo/Sustancias:
- **PE**: LISTAR is attached to a dedicated hidden panel (`applicantBlock`) inside Block5 > Block8
- **Fito/Zoo/Sustancias**: LISTAR is attached directly to Block22 panel (`applicantBlock22`, action ID `1cb59cb5`)

The Block22 panel action (`1cb59cb5`) currently contains 3 bots (Fito LISTAR, Zoo LISTAR, Sustancias LISTAR) but NOT the PE LISTAR. PE LISTAR runs independently from its own hidden panel.

### 4.4 Component Action Creation Checklist

When creating a new component action via MCP, you MUST complete 3 steps:

1. **Create the action**: `componentaction_save(service_id, component_key, actions=[{bot_id: "...", sort_order: 1}])`
2. **Link to component**: `form_component_update(service_id, component_key, updates={"componentActionId": "<returned_id>"})`
3. **Verify**: `form_component_get(service_id, component_key)` -- confirm `componentActionId` is NOT empty

Without step 2, the action exists in the backend but will not render the green "A" icon or fire on click.

---

## 5. Receiver Fields in the Destination Service

The PE destination service (`2c918084887c7a8f01887c99ed2a6fd5`) must have these fields to receive data from the Bitacora:

| Field Key | Type | Label | Mapped From (INTERNO nuevo) | Mapped From (INTERNO modif) |
|-----------|------|-------|----------------------------|----------------------------|
| `applicantStatusLlegaDeLaBitacora` | radio | Status llega de la bitacora | `constant_true` | `constant_true` |
| `applicantQueQuiereHacer` | radio | Que quiere hacer? | `applicantRadio` ("registrarNuevo") | `applicantRadio2` ("modificarExistente") |
| `applicantNit3` | textfield | NIT | `applicantNit5` | `applicantNit5` |
| `applicantNombreDeLaEmpresa4` | textfield | Nombre de la empresa | `applicantCompania7` | `applicantCompania7` |
| `applicantContadorEventuales` | number | Contador eventuales | (not mapped) | `applicantContadorPermiso` |
| `applicantSolicitud` | textfield | Numero de solicitud | (not mapped) | `applicantEditGrid_collection_applicantNumero5` |
| `permisoEventual` | checkbox | (PE-specific flag) | (not mapped) | `constant_true` |

**CRITICAL**: Field keys vary by service! PE uses `applicantNit3` and `applicantNombreDeLaEmpresa4`, but:
- Fito uses `applicantNit` and `applicantNombreDeLaEmpresa`
- Zoo uses `applicantNit` and `applicantNombreDeLaEmpresa`
- Sustancias uses `applicantNit` and `applicantNombreDeLaEmpresa11`

Always verify actual field keys in the destination service before creating bot mappings.

---

## 6. Determinants & Effects

### 6.1 In the PE Destination Service

Two determinants control the Bitacora connection behavior:

| Determinant ID | Name | Type | Operator | Target Field | Value |
|---------------|------|------|----------|-------------|-------|
| `7383e917` | status bitacora = TRUE | radio | EQUAL | `applicantStatusLlegaDeLaBitacora` | "true" |
| `edbcb535` | status bitacora = NOT TRUE | radio | NOT_EQUAL | `applicantStatusLlegaDeLaBitacora` | "true" |

**Effects**: These determinants control which blocks are shown/hidden when a case arrives from the Bitacora vs. when a user creates a case directly.

- `status bitacora = TRUE` activates blocks that should only appear for Bitacora-originated cases (e.g., pre-filled company data)
- `status bitacora = NOT TRUE` activates blocks for direct-creation flow (e.g., company selection)

### 6.2 In the Bitacora (Expirado Badge)

The "Expirado" badge on PE requires a 3-object chain:

| Object | ID | Type | Name | Target | Details |
|--------|------|------|------|--------|---------|
| Row determinant | (inside grid det) | date | (date < today) | `applicantEditGrid_collection_applicantExpiracion` | Evaluates each row's expiration date against today |
| Grid determinant | `2b43313a` | grid | Vigencia permiso eventual < hoy | `applicantEditGrid` | Wraps the row determinant, targets the EditGrid |
| Effect | `f2271f0a` | activate | (on behaviour `448beb4f`) | `applicantExpirado` | Activates the Expirado badge button |

**Expirado Button Properties**:
```json
{
  "key": "applicantExpirado",
  "type": "button",
  "label": "Expirado",
  "size": "xs",
  "activate": false,
  "behaviourId": "448beb4f-86ce-43f7-998d-68c26ee1ec6d",
  "effectsIds": ["f2271f0a-38fd-4974-90e4-ee80b1a17097"],
  "customClasses": [
    "light-color",
    "hover-feedback-off",
    "button-status",
    "btn-red",
    "datagrid-hide-column-label",
    "deactivated"
  ]
}
```

**Key properties**:
- `activate: false` -- hidden by default; only shown when the effect fires (expiration date < today)
- `size: "xs"` -- renders as a small badge, NOT a full button
- `"deactivated"` class -- ensures the button column header is hidden
- `"datagrid-hide-column-label"` class -- hides the column label in the grid

---

## 7. GDB Integration

### GDB Service: GDB-PE(1.5)-list

| Property | Value |
|----------|-------|
| **Service ID** | `GDB.GDB-PE(1.5)-list` |
| **Name** | GDB-PE(1.5)-list |
| **DB Name** | Permisos eventuales |
| **Base URL** | `http://gdb:8080/` |
| **Method** | GET |

#### Key Input Fields

| ID | Name | Type | Required |
|----|------|------|----------|
| `query_child_NIT` | NIT | string | No |
| `query_child_Permiso eventual_child_num aprobacion` | num aprobacion | string | No |
| `query_child_Permiso eventual_child_hasta` | hasta | date | No |
| `page` | page | integer | No |
| `page_size` | page_size | integer | No |

#### Key Output Fields

| ID | Name | Type | Mapped To |
|----|------|------|-----------|
| `count` | count | integer | `applicantContadorPermiso` |
| `status` | status | boolean | `applicantStatusFuncionoElBot` |
| `results_collection_content_child_Permiso eventual_child_num aprobacion` | num aprobacion | string | `applicantEditGrid_collection_applicantNumero5` |
| `results_collection_content_child_Permiso eventual_child_hasta` | hasta | date | `applicantEditGrid_collection_applicantExpiracion` |
| `results_collection_content_child_Operacion_child_tipo de operacion` | tipo de operacion | catalog | `applicantEditGrid_collection_applicantTipoDeOperacion` |

---

## 8. Complete Object Inventory

### All PE Objects in the Bitacora

| Category | Key/ID | Name/Label | Location |
|----------|--------|------------|----------|
| **Bot** | `6603eb75` | INTERNO PE nuevo | Bitacora bots |
| **Bot** | `c88be29b` | INTERNO PE modificar | Bitacora bots |
| **Bot** | `b94c62ab` | PE LISTAR | Bitacora bots |
| **EditGrid** | `applicantEditGrid` | Permiso eventual | Block22 |
| **Dropdown** | `applicantdropdown7` | (three-dot menu) | Inside EditGrid |
| **Columns** | `applicantcolumns6` | (data columns) | Inside EditGrid |
| **Button** | `applicantPermisoEventual` | Permiso eventual | Agregar dropdown |
| **Button** | `applicantModificar` | Modificar | EditGrid dropdown |
| **Button** | `applicantCancelar` | Cancelar | EditGrid dropdown |
| **Textfield** | `applicantTipo5` | Tipo (default: "Eventual") | EditGrid col 1 |
| **Textfield** | `applicantNumero5` | Numero | EditGrid col 2 |
| **Select** | `applicantTipoDeOperacion` | Operacion | EditGrid col 3 |
| **Datetime** | `applicantExpiracion` | Vigente hasta | EditGrid col 4 |
| **Button** | `applicantExpirado` | Expirado | EditGrid col 5 |
| **Panel** | `applicantBlock` | LISTAR panel | Block5>Block8>col7 |
| **Radio** | `applicantStatusFuncionoElBot` | Status funciono? | Block5>Block8>col7 |
| **Number** | `applicantContadorPermiso` | Contador PE | Block5>Block8>col7 |
| **Radio** | `applicantRadio` | QueQuiereHacer nuevo | Block5>Block9>col16 |
| **Radio** | `applicantRadio2` | QueQuiereHacer modif | Block5>Block9>col16 |
| **ComponentAction** | `b1139de3` | Agregar->INTERNO nuevo | On applicantPermisoEventual |
| **ComponentAction** | `6230a2b0` | Modificar->INTERNO modif | On applicantModificar |
| **ComponentAction** | `faefcc8a` | Block->PE LISTAR | On applicantBlock |
| **Grid Determinant** | `2b43313a` | Vigencia PE < hoy | On applicantEditGrid |
| **Behaviour** | `448beb4f` | Expirado effect | On applicantExpirado |

---

## 9. Replication Checklist

To connect a NEW service to the Bitacora, provide Cubot with:
- **Required**: `service_id` of the destination service
- **Required**: Service display name (e.g., "Certificado Sanitario")
- **Required**: Abbreviation for naming (e.g., "Sanitario")
- **Optional**: Known GDB service name (if not provided, Cubot discovers it)

Cubot executes all phases autonomously, pausing only for manual steps (flagged with MANUAL).

---

### Phase 0: Discovery & Planning (Autonomous)

**Goal**: Understand the destination service and generate the full execution plan before touching anything.

- [ ] **0.1** Query destination service receiver fields:
  ```
  field_list(service_id, type_filter="radio")   → find applicantStatusLlegaDeLaBitacora, applicantQueQuiereHacer
  field_list(service_id, type_filter="textfield") → find NIT, Empresa, Solicitud fields
  field_list(service_id, type_filter="number")   → find Counter field
  ```

- [ ] **0.2** Determine service capabilities:
  | Question | How to detect | Impact |
  |---|---|---|
  | Has modification flow? | `applicantQueQuiereHacer` radio exists with "modificarExistente" value | Creates INTERNO modificar bot + Modificar button action |
  | Has which NIT key? | Search textfields for "NIT" in label | Determines INTERNO input mapping target |
  | Has which Empresa key? | Search textfields for "empresa" in label | Determines INTERNO input mapping target |
  | Has counter? | Search number fields for "Contador" in label | Determines counter mapping target |
  | Has solicitud? | Search textfields for "solicitud" in label | Only relevant if modification flow exists |

- [ ] **0.3** Discover GDB service:
  ```
  muleservice_discover(bot_category="list", name_filter="{service keyword}")
  muleservice_get(service_id) → get all input/output fields
  ```

- [ ] **0.4** Check existing Bitacora bots for this service:
  ```
  bot_list(service_id=Bitacora) → filter by name containing service keyword
  ```
  If bots already exist, skip creation and only fix/complete mappings.

- [ ] **0.5** Check if an Agregar dropdown button already exists for this service:
  ```
  form_component_get(Bitacora, "applicantdropdown5") → scan children
  ```

- [ ] **0.6** Generate Naming Map (see Section 10):
  Given abbreviation "{Abbrev}", generate all field keys before creating anything.

- [ ] **0.7** Take pre-execution snapshot:
  ```json
  // Save to /tmp/bpa-{abbrev}-pre-snapshot.json
  {
    "timestamp": "ISO-8601",
    "service_id": "...",
    "service_name": "...",
    "abbreviation": "...",
    "existing_bots": [...],
    "existing_dropdown_buttons": [...],
    "existing_editgrids_in_block22": [...],
    "block22_action_bots": [...],
    "discovery": {
      "has_modification_flow": true/false,
      "receiver_fields": {
        "statusBitacora": "applicantStatusLlegaDeLaBitacora",
        "queQuiereHacer": "applicantQueQuiereHacer" or null,
        "nit": "applicantNit{X}",
        "empresa": "applicantNombreDeLaEmpresa{X}",
        "contador": "applicantContador{X}",
        "solicitud": "applicantNumeroDeSolicitud{X}" or null
      },
      "gdb_service_id": "GDB.GDB-...",
      "gdb_output_fields": [...]
    },
    "naming_map": { ... }
  }
  ```

- [ ] **0.8** Present execution plan to user for approval before proceeding:
  ```
  Service: {name} ({service_id})
  Type: COMPLETO / BASIC (has modification: yes/no)
  GDB: {gdb_service_id}
  Receiver fields: {list}
  Objects to create: {count} bots, {count} form components, {count} component actions
  Manual steps required: {count}
  ```

**EXIT GATE**: User approves the plan. If any receiver field is missing, STOP and report.

---

### Phase 1: Destination Service Setup (MANUAL in BPA UI)

- [ ] **1.1** Verify receiver fields exist in ServiceX (from Phase 0 discovery)
  - If any field is missing, user must create it in BPA UI before proceeding

- [ ] **1.2** Create determinant "StatusBitacora = TRUE" (MANUAL -- MCP Bug 1-3):
  - Type: radio, operator: EQUAL
  - Target: `{discovered StatusBitacora field key}`
  - Value: "true"

- [ ] **1.3** Create effect linking the determinant to the appropriate block in ServiceX (MANUAL)

**EXIT GATE**: User confirms determinant and effect are created in BPA UI.

---

### Phase 2: Backend Fields in Bitacora (Autonomous)

- [ ] **2.1** Create backend columns in Block5 > Block8:
  ```
  form_component_add(Bitacora, parent_key="applicantBlock8", component={
    key: "applicant{Abbrev}Columns",
    type: "columns",
    label: "{Service Name}",
    columns: [
      { LISTAR panel: key="applicantBlock{Abbrev}" },
      { Status radio: key="applicantStatusFuncionoElBot{N}" },
      { Counter number: key="applicantContador{Abbrev}", defaultValue=-1 }
    ]
  })
  ```

- [ ] **2.2** Create QueQuiereHacer radio fields in Block5 > Block9 (if modification flow):
  ```
  form_component_add(Bitacora, parent_key="applicantBlock9", component={
    key: "applicant{Abbrev}Radios",
    type: "columns",
    columns: [
      { Radio nuevo: key="applicantQueQuiereHacerNuevo{Abbrev}", defaultValue="nuevoPermisoEventual" },
      { Radio modif: key="applicantQueQuiereHacerModif{Abbrev}", defaultValue="modificarPermisoExistente" }
    ]
  })
  ```

- [ ] **2.3** **VALIDATE**: `form_component_get` each created component, confirm keys match naming map.

---

### Phase 3: Bots + Mappings in Bitacora (Autonomous)

- [ ] **3.1** Create Bot INTERNO nuevo:
  ```
  bot_create(Bitacora, bot_type="internal", name="INTERNO {service} nuevo", short_name="Int{Abbrev}Nvo")
  bot_update(bot_id, bot_service_id="{destination_service_id}")
  ```

- [ ] **3.2** Create Bot INTERNO modificar (if modification flow):
  ```
  bot_create(Bitacora, bot_type="internal", name="INTERNO {service} modificar", short_name="Int{Abbrev}Mod")
  bot_update(bot_id, bot_service_id="{destination_service_id}")
  ```

- [ ] **3.3** Create Bot LISTAR:
  ```
  bot_create(Bitacora, bot_type="data", name="LISTAR {service}", short_name="List{Abbrev}", category="list")
  bot_update(bot_id, bot_service_id="{gdb_service_id}")
  ```

- [ ] **3.4** Configure INTERNO nuevo input mappings:
  ```
  bot_input_mapping_save_all(bot_id, mappings=[
    { constant_true → {StatusBitacora field} },
    { constant_true → {service checkbox field} },             // e.g. permisoEventual, certificadoMinsap
    { applicantNit5 → {NIT field} },
    { applicantCompania7 → {Empresa field} },
    { {radio_nuevo source} → {QueQuiereHacer field} },       // if mod flow exists
    { applicantContador{Abbrev} → {Counter field} }
  ])
  ```
  **Note**: PE nuevo only has 4 mappings (StatusBitacora + QueQuiereHacer + NIT + Empresa).
  Most other services include 5-6 mappings (adding checkbox tipo + counter).

- [ ] **3.5** Configure INTERNO modificar input mappings (if modification flow):
  ```
  bot_input_mapping_save_all(bot_id, mappings=[
    // Same as nuevo PLUS:
    { applicantQueQuiereHacerModif{Abbrev} → {QueQuiereHacer field} },  // modif value
    { applicantEditGrid{Abbrev}_collection_applicantNumero{Abbrev} → {Solicitud field} },
    // Counter mapped here too
  ])
  ```

- [ ] **3.6** Configure LISTAR input mappings:
  ```
  bot_input_mapping_save_all(bot_id, mappings=[
    { applicantNit5 → query_child_NIT }
  ])
  ```

- [ ] **3.7** Configure LISTAR output mappings:
  ```
  bot_output_mapping_save_all(bot_id, mappings=[
    { count → applicantContador{Abbrev} },
    { status → applicantStatusFuncionoElBot{N} },
    { {gdb_permit_number_field} → applicantEditGrid{Abbrev}_collection_applicantNumero{Abbrev} },
    { {gdb_expiration_field} → applicantEditGrid{Abbrev}_collection_applicantExpiracion{Abbrev} },
    // OPTIONAL: If service has TipoOperacion (added in TipoOperacion iteration):
    { {gdb_operacion_field} → applicantEditGrid{Abbrev}_collection_applicantTipoDeOperacion{Abbrev} }
  ])
  ```

- [ ] **3.8** **VALIDATE** each bot:
  ```
  bot_mapping_summary(bot_id) → check:
    - input_mappings.total matches expected count
    - output_mappings.total matches expected count
    - health_checks: no ghost mappings, no mismatches
  ```
  If any mapping is wrong: delete ONLY that one mapping and recreate. Never bulk-delete.

---

### Phase 4: EditGrid in Block22 (Autonomous)

- [ ] **4.1** Create complete EditGrid component (single `form_component_add` call):
  - EditGrid with `hideLabel:true`, `disableAddingRows/Removing/Editing:true`, `virtualScroll:true`
  - Dropdown (three-dot menu) with Modificar + Cancelar buttons
  - Columns: Tipo | Numero | Operación (OPTIONAL) | Vigente hasta | Expirado
  - Note: Operación column only added for services with TipoOperacion (see TipoOperacion iteration)
  - All field keys follow naming map from Phase 0.6

- [ ] **4.2** Create "Agregar" dropdown button:
  ```
  form_component_add(Bitacora, parent_key="applicantdropdown5", component={
    key: "applicant{Abbrev}Btn",
    type: "button", label: "{Service Name}",
    size: "xs", customClasses: ["dropdown-menu-item"]
  })
  ```

- [ ] **4.3** **VALIDATE**: `form_component_get` the EditGrid, confirm all children exist with correct keys.

---

### Phase 5: Component Actions (Autonomous)

- [ ] **5.1** Create + link action: Agregar button -> INTERNO nuevo
  ```
  componentaction_save(Bitacora, "applicant{Abbrev}Btn", actions=[{bot_id: INTERNO_nuevo_id}])
  → returns action record, extract ID
  form_component_update(Bitacora, "applicant{Abbrev}Btn", updates={"componentActionId": "{id}"})
  ```

- [ ] **5.2** Create + link action: Modificar button -> INTERNO modificar (if mod flow)
  ```
  componentaction_save(Bitacora, "applicantModificar{Abbrev}", actions=[{bot_id: INTERNO_mod_id}])
  form_component_update(Bitacora, "applicantModificar{Abbrev}", updates={"componentActionId": "{id}"})
  ```

- [ ] **5.3** Create + link action: LISTAR panel in Block5 → LISTAR bot
  ```
  componentaction_save(Bitacora, "applicantBlock{Abbrev}", actions=[{bot_id: LISTAR_id}])
  form_component_update(Bitacora, "applicantBlock{Abbrev}", updates={"componentActionId": "{id}"})
  ```

- [ ] **5.4** Add LISTAR bot to Block22 panel action (for multi-service trigger):
  ```
  componentaction_get("1cb59cb5-da2a-45ea-9b39-7871f117916f")  → get current bots
  componentaction_update(id, actions=[...existing..., {bot_id: LISTAR_id, sort_order: N+1}])
  ```
  **Note**: PE uses only the hidden panel trigger (5.3). All new services use BOTH the hidden panel AND Block22 trigger.

- [ ] **5.5** **VALIDATE** all component actions:
  ```
  For each component_key:
    form_component_get → confirm componentActionId is NOT empty
    componentaction_get_by_component → confirm correct bot is linked
  ```

---

### Phase 6: Expirado Badge (Partially Manual)

- [ ] **6.1** Expirado CSS already set in Phase 4 (included in EditGrid creation):
  - `size: "xs"`, `activate: false`
  - Classes: `light-color hover-feedback-off button-status btn-red datagrid-hide-column-label deactivated`

- [ ] **6.2** Create row date determinant (MANUAL -- MCP bugs 4-5-6):
  - In BPA UI → Bitacora service → Determinants
  - Type: date, **inside the same grid**
  - Target: `applicantEditGrid{Abbrev}_collection_applicantExpiracion{Abbrev}`
  - Operator: LESS_THAN, compare to: current date

- [ ] **6.3** Create grid determinant (MANUAL -- MCP bugs 4-5):
  - In BPA UI → wraps the row determinant from 6.2
  - Target: `applicantEditGrid{Abbrev}`

- [ ] **6.4** Create effect via MCP (autonomous after manual determinants exist):
  ```
  effect_create(Bitacora, component_key="applicantExpirado{Abbrev}",
    determinant_ids=["{grid_determinant_id}"], effect_type="activate", effect_value=true)
  ```

- [ ] **6.5** **VALIDATE**: `form_component_get("applicantExpirado{Abbrev}")` → confirm `behaviourId` and `effectsIds` are populated.

---

### Phase 7: Final Validation Report (Autonomous)

- [ ] **7.1** Take post-execution snapshot: `/tmp/bpa-{abbrev}-post-snapshot.json`

- [ ] **7.2** Generate comparison report:
  ```
  ┌─────────────────────────────────────────────────────┐
  │  SERVICE CONNECTION REPORT: {Service Name}          │
  ├─────────────────────────────────────────────────────┤
  │  Service ID:    {id}                                │
  │  Abbreviation:  {Abbrev}                            │
  │  Type:          COMPLETO / BASIC                    │
  │  GDB:           {gdb_service_id}                    │
  ├─────────────────────────────────────────────────────┤
  │  OBJECTS CREATED:                                   │
  │  Bots:              {N} (expected {N})    ✅/❌     │
  │  Input mappings:    {N} (expected {N})    ✅/❌     │
  │  Output mappings:   {N} (expected {N})    ✅/❌     │
  │  Form components:   {N} (expected {N})    ✅/❌     │
  │  Component actions: {N} (expected {N})    ✅/❌     │
  ├─────────────────────────────────────────────────────┤
  │  VALIDATION:                                        │
  │  Bot mapping health:  {pass/fail per bot}           │
  │  componentActionIds:  {all set / missing list}      │
  │  EditGrid structure:  {all children present}        │
  ├─────────────────────────────────────────────────────┤
  │  MANUAL STEPS PENDING:                              │
  │  [ ] StatusBitacora determinant in destination      │
  │  [ ] Expirado row det + grid det in Bitacora        │
  │  [ ] effect_create after manual determinants         │
  ├─────────────────────────────────────────────────────┤
  │  ROLLBACK: /tmp/bpa-{abbrev}-pre-snapshot.json      │
  └─────────────────────────────────────────────────────┘
  ```

- [ ] **7.3** Validate each bot with `bot_mapping_summary`:
  - No ghost mappings (fields that don't exist in source/target)
  - No duplicate mappings
  - Coverage: all expected fields mapped

- [ ] **7.4** Update MEMORY.md with:
  - New service entry in Key Service IDs table
  - Bot IDs and mapping counts
  - Objects created with field keys
  - Step status (what's done vs manual pending)

### Phase 8: User Testing (After Manual Steps)

- [ ] **8.1** Verify EditGrid renders correctly (visual consistency)
- [ ] **8.2** Test "Agregar" button creates new case in ServiceX
- [ ] **8.3** Test LISTAR populates EditGrid with existing permits
- [ ] **8.4** Test "Modificar" button opens existing case (if applicable)
- [ ] **8.5** Test Expirado badge appears for expired permits
- [ ] **8.6** Run Playwright DOM testing for automated verification

---

## 10. Naming Engine

Given two inputs — **service_name** (e.g., "Certificado Sanitario") and **Abbrev** (e.g., "Sanitario") — Cubot auto-generates all field keys:

### Naming Map Generator

```
Input: service_name = "Certificado Sanitario", Abbrev = "Sanitario"

Output:
{
  // Bots
  bot_interno_nuevo_name:   "INTERNO sanitario nuevo",
  bot_interno_mod_name:     "INTERNO sanitario modificar",
  bot_listar_name:          "LISTAR sanitario",
  bot_interno_nuevo_short:  "IntSanitNvo",
  bot_interno_mod_short:    "IntSanitMod",
  bot_listar_short:         "ListSanit",

  // EditGrid (Block22 - visible)
  editgrid:        "applicantEditGridSanitario",
  dropdown:        "applicantDropdownSanitario",
  columns:         "applicantColumnsSanitario",
  tipo:            "applicantTipoSanitario",
  numero:          "applicantNumeroSanitario",
  operacion:       "applicantTipoDeOperacionSanitario",  // OPTIONAL: only if TipoOperacion applies
  expiracion:      "applicantExpiracionSanitario",
  expirado:        "applicantExpiradoSanitario",
  modificar_btn:   "applicantModificarSanitario",
  cancelar_btn:    "applicantCancelarSanitario",
  agregar_btn:     "applicantSanitarioBtn",

  // Backend (Block5 - hidden)
  backend_columns: "applicantSanitarioColumns",       // Block8 container
  listar_panel:    "applicantBlockSanitario",          // Block8 > col1
  status_radio:    "applicantStatusFuncionoElBot{N}",  // Block8 > col2 (N = next available)
  counter:         "applicantContadorSanitario",       // Block8 > col3
  radio_nuevo:     "applicantQueQuiereHacerNuevoSanitario",   // Block9
  radio_modif:     "applicantQueQuiereHacerModifSanitario",   // Block9
  radio_container: "applicantSanitarioRadios",         // Block9 container

  // Default values
  tipo_default:    "Certificado Sanitario",            // Visible label in grid
  counter_default: -1,
  radio_nuevo_default: "nuevoPermisoEventual",
  radio_modif_default: "modificarPermisoExistente"
}
```

### Verified naming from completed services:

| Object | PE | Fito | Zoo | Sustancias | Sanitario | Pattern |
|--------|------|------|-----|------------|-----------|---------|
| EditGrid | `applicantEditGrid` | `applicantEditGridFito` | `applicantEditGridZoo` | `applicantEditGridSustancias` | `applicantEditGridSanitario` | `applicantEditGrid{Abbrev}` |
| Numero | `applicantNumero5` | `applicantNumeroFito` | `applicantNumeroZoo` | `applicantNumeroSustancias` | `applicantNumeroSanitario` | `applicantNumero{Abbrev}` |
| Operación | `applicantTipoDeOperacion` | — | — | — | — | `applicantTipoDeOperacion{Abbrev}` (OPTIONAL) |
| Expiracion | `applicantExpiracion` | `applicantExpiracionFito` | `applicantExpiracionZoo` | `applicantExpiracionSustancias` | `applicantFechaSanitario` | `applicantExpiracion{Abbrev}` |
| Expirado | `applicantExpirado` | `applicantExpiradoFito` | `applicantExpiradoZoo` | `applicantExpiradoSustancias` | `applicantExpiradoSanitario` | `applicantExpirado{Abbrev}` |
| Agregar btn | `applicantPermisoEventual` | `applicantEventuales3` | `applicantEquiposUsoDeEnergia2` | `applicantSustanciasBtn` | `applicantSanitarioBtn` | `applicant{Abbrev}Btn` |
| Counter | `applicantContadorPermiso` | `applicantContadorFito` | `applicantContadorZoo` | `applicantContadorSustancias` | `applicantContadorSanitario` | `applicantContador{Abbrev}` |

**Note**: PE and some early services have irregular naming (e.g., `applicantNumero5`, `applicantPermisoEventual`). New services always follow the `{Abbrev}` convention.

---

## 11. MCP Automation Coverage

| Phase | Step | Autonomous? | Tool(s) | Notes |
|-------|------|-------------|---------|-------|
| 0 | Discovery & planning | ✅ Yes | `field_list`, `muleservice_discover`, `bot_list`, `form_component_get` | No writes, read-only |
| 0 | Pre-snapshot | ✅ Yes | Multiple reads → JSON file | Saved to /tmp/ |
| 1 | StatusBitacora determinant | ❌ MANUAL | BPA UI | MCP Bug 1-3 (radio) |
| 1 | Effect on destination block | ❌ MANUAL | BPA UI | Depends on determinant |
| 2 | Backend fields Block5 | ✅ Yes | `form_component_add` | Block8 + Block9 |
| 3 | Create bots | ✅ Yes | `bot_create` + `bot_update` | Internal + data |
| 3 | Bot input mappings | ✅ Yes | `bot_input_mapping_save_all` | Handles `_collection_` fields |
| 3 | Bot output mappings | ✅ Yes | `bot_output_mapping_save_all` | Handles `_collection_` fields |
| 3 | Validate mappings | ✅ Yes | `bot_mapping_summary` | Ghost/mismatch check |
| 4 | EditGrid + dropdown button | ✅ Yes | `form_component_add` | Must include ALL visual props |
| 5 | Component actions | ✅ Yes | `componentaction_save` + `form_component_update` | 3-step checklist |
| 5 | Validate componentActionIds | ✅ Yes | `form_component_get` | Confirm not empty |
| 6 | Expirado CSS | ✅ Yes | Included in Phase 4 | Already set during creation |
| 6 | Row date determinant | ❌ MANUAL | BPA UI | MCP Bug 4-5-6 |
| 6 | Grid determinant | ❌ MANUAL | BPA UI | MCP Bug 4-5 |
| 6 | Link effect | ✅ Yes | `effect_create` | After manual dets exist |
| 7 | Validation report | ✅ Yes | Multiple reads + comparison | Automated report |
| 7 | Update MEMORY.md | ✅ Yes | `Edit` tool | Track new service |
| 8 | User testing | ❌ MANUAL | Browser / Playwright | User verifies |

### Summary

| Category | Count | Autonomous | Manual |
|----------|-------|------------|--------|
| Discovery & planning | 2 steps | 2 | 0 |
| Destination setup | 2 steps | 0 | 2 |
| Backend fields | 1 step | 1 | 0 |
| Bots + mappings | 5 steps | 5 | 0 |
| EditGrid + UI | 1 step | 1 | 0 |
| Component actions | 2 steps | 2 | 0 |
| Expirado badge | 3 steps | 1 | 2 |
| Validation | 2 steps | 2 | 0 |
| User testing | 1 step | 0 | 1 |
| **Total** | **19 steps** | **14 (74%)** | **5 (26%)** |

**Current automation rate**: 74% of steps are fully autonomous. The 5 manual steps are all blocked by MCP v0.15.0 bugs (determinant creation for radio and grid-internal fields).

---

## 12. Rollback Protocol

If anything goes wrong during execution, Cubot can roll back using the pre-snapshot:

### Automatic rollback (via MCP audit system)
Every write operation returns an `audit_id`. To undo:
```
rollback(audit_id) → restores previous state
```

### Manual rollback checklist
If audit rollback fails:
1. Delete created bots: `bot_delete(bot_id)` for each
2. Remove form components: `form_component_remove(service_id, component_key)` for each
3. Remove component actions: `componentaction_delete(service_id, component_key)` for each
4. Restore Block22 panel action to previous bot list
5. Clear any stale behaviourIds: `form_component_update(key, {"behaviourId": "", "effectsIds": []})`

### Safety rules
- **NEVER** bulk-delete mappings — delete one at a time
- **NEVER** delete without first reading current state
- **ALWAYS** compare expected vs actual before deleting
- **LOG** every destructive operation to `/tmp/bpa-{abbrev}-rollback-log.json`

---

## 13. Complete Service Landscape (22 services)

As of 2026-02-13, the VUCE Cuba platform has 22 services organized in 5 categories:

### Connection Status Overview

| Status | Count | Services |
|--------|-------|----------|
| ✅ Connected (EditGrid in Block22) | 6 | PE, Fito, Zoo, ONURE, Sustancias, Sanitario |
| ⚠️ Has bots, not connected | 7 | Acreditación, Homologación, ONN/Cert.Origen, CECMED, CyP, Donativos, Autorizaciones Comercio |
| ❌ No bots | 7 | Sucursales, INHEM, CENASA, Reg.Sustancias, Seg.Nuclear, Cert.Aprobación, Aut.Imp/Exp Servicios |

### All 22 Services

| # | Category | Service | ID | INTERNO bots | LISTAR | Status |
|---|----------|---------|-----|-------------|--------|--------|
| 1 | Autorizaciones | Acreditación de usuario | `2c918084...8b72010c7d6e` | nuevo, renovar | ❌ | ⚠️ |
| 2 | Autorizaciones | Importar/exportar (bienes) | `2c918088...46e905af1747` | ❌ | shared `36144777` | ⚠️ |
| 3 | Autorizaciones | Importar/exportar (servicios) | `2c918090...ea40b31a3f99` | ❌ | shared `36144777` | ❌ |
| 4 | Permisos | **Permiso eventual** | `2c918084...7c99ed2a6fd5` | nuevo, modif | `b94c62ab` | ✅ |
| 5 | Permisos | **Permiso fitosanitario** | `2c918088...79310a8003a9` | nuevo | `7248ea6d` | ✅ |
| 6 | Permisos | **Permiso zoosanitario** | `2c918088...8d3fd5800ceb` | nuevo, modif | `3f66f6b7` | ✅ |
| 7 | Permisos | **Equipos energía (ONURE)** | `2c918088...4713789f1c89` | nuevo, modif | `66f01374` | ✅ |
| 8 | Permisos | **Sustancias controladas** | `8393ad98...23fbbd69b9e7` | nuevo, modif | `78a17ce3` | ✅ |
| 9 | Permisos | Homologación equipos | `bf77b220...9cf808b4e42` | 2 INTERNOs | `5160ccd0` | ⚠️ |
| 10 | Autorizaciones | Instrumentos medición (ONN) | `2c918088...99d518660007` | nuevo | `6cf6bd6c` | ⚠️ |
| 11 | Registros | Sucursales | `2c918091...d9b69f9f0cf7` | ❌ | ❌ | ❌ |
| 12 | Registros | Clientes y proveedores | `2c918090...c16b80292f3a` | nuevo | `ea04ea53` | ⚠️ |
| 13 | Registros | Sanitario INHEM | `2c918090...435c8fb209b6` | ❌ | ❌ | ❌ |
| 14 | Registros | CENASA | `2c918090...de8f880f03cd` | ❌ | ❌ | ❌ |
| 15 | Registros | Reg. sustancias | `2ef97d8e...1856675139e5` | ❌ | ❌ | ❌ |
| 16 | Licencias | **CECMED** | `2c918087...5aa932f60348` | nuevo, modif, renovar | `07a58130` | ⚠️ |
| 17 | Licencias | Seguridad nuclear | `2c918083...7dd5a5a90061` | ❌ | ❌ | ❌ |
| 18 | Certificados | **Cert. sanitario** | `2c918088...792f8e170001` | nuevo, modif | `abc4681d` | ✅ |
| 19 | Certificados | Cert. origen (=ONN) | `2c918088...99d518660007` | shared #10 | shared #10 | ⚠️ |
| 20 | Certificados | Donativos médicos | `a5f936ea...84a02b4733aa` | nuevo | `b25e4906` | ⚠️ |
| 21 | Certificados | Cert. aprobación medición | `d69e921e...bc8f6e36a426` | ❌ | ❌ | ❌ |
| 22 | Permisos | Homologación (=9) | `bf77b220...9cf808b4e42` | shared #9 | shared #9 | ⚠️ |

### Duplicate Service IDs
- `2c918088948ec322019499d518660007`: shared by #10 (ONN) and #19 (Cert. origen)
- `bf77b220-6643-4f1e-bab0-69cf808b4e42`: shared by #9 and #22 (Homologación)

### Future Iteration: TipoOperacion
- **Scope**: Add Operación (importación/exportación/tránsito) column to EditGrids for services that support it
- **PE already has it**: `applicantTipoDeOperacion` select column + LISTAR output mapping
- **Sanitario GDB has it**: `query_child_Operación_child_Tipo de Operación`
- **Deferred**: Will be added to ALL applicable services in a single iteration
