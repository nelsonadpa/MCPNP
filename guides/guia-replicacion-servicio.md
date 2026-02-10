# GUIDE: Connect a New Service to the Bitacora via MCP

**Last updated**: 2026-02-09
**MCP version**: v0.15.0 (full automation, including Component Actions)

---

## PREREQUISITES

### Fixed IDs (do not change)
- **Bitacora service_id**: `ffe746aac09241078bad48c9b95cdfe0`
- **Source fields in Bitacora** (already exist, do NOT create):
  - `applicantNit5` - NIT of selected company
  - `applicantCompania7` - Company name
  - `applicantRadio` - Hidden radio with value `"registrarNuevo"`
  - `applicantRadio2` - Hidden radio with value `"modificarExistente"`

### Data the analyst MUST provide
1. **service_id** of the destination service
2. **Service name** (for button labels)
3. **GDB service name** for the LISTAR bot (if applicable)
4. **Which block** in the Bitacora (Block4=Registros, Block22=Importacion, etc.)
5. **Extra fields** the modificar bot needs to send (e.g., solicitud number)

---

## PHASE 1: VALIDATE DESTINATION SERVICE

### Step 1.1: Verify mandatory receiver fields

The destination service MUST have these fields. If they don't exist, create them first.

| # | Expected key | Type | Label | Purpose |
|---|---|---|---|---|
| 1 | `applicantStatusLlegaDeLaBitacora` | radio | "Status llega de la bitacora" | Marks "came from Bitacora" |
| 2 | `applicantQueQuiereHacer` | radio | "Que quiere hacer?" | registrarNuevo / modificarExistente |
| 3 | `applicantNit3` | textfield | "NIT" | Receives company NIT |
| 4 | `applicantNombreDeLaEmpresa4` | textfield | "Nombre de la empresa" | Receives company name |

**MCP verification:**
```
field_get(service_id=DEST_ID, field_key="applicantStatusLlegaDeLaBitacora")
field_get(service_id=DEST_ID, field_key="applicantQueQuiereHacer")
field_get(service_id=DEST_ID, field_key="applicantNit3")
field_get(service_id=DEST_ID, field_key="applicantNombreDeLaEmpresa4")
```

### Step 1.2: Verify receiver determinants

| # | Name | Field | Operator | Value |
|---|---|---|---|---|
| 1 | "status bitacora = TRUE" | applicantStatusLlegaDeLaBitacora | EQUAL | "true" |
| 2 | "status bitacora = NOT TRUE" | applicantStatusLlegaDeLaBitacora | NOT_EQUAL | "true" |
| 3 | "Que necesita = nuevo" | applicantQueQuiereHacer | EQUAL | "registrarNuevo" |
| 4 | "Que necesita = modificar" | applicantQueQuiereHacer | EQUAL | "modificarExistente" |

**Create if missing:**
```
selectdeterminant_create(service_id=DEST_ID, name="status bitacora = TRUE", operator="EQUAL", target_form_field_key="applicantStatusLlegaDeLaBitacora", select_value="true")
selectdeterminant_create(service_id=DEST_ID, name="status bitacora = NOT TRUE", operator="NOT_EQUAL", target_form_field_key="applicantStatusLlegaDeLaBitacora", select_value="true")
selectdeterminant_create(service_id=DEST_ID, name="Que necesita = nuevo", operator="EQUAL", target_form_field_key="applicantQueQuiereHacer", select_value="registrarNuevo")
selectdeterminant_create(service_id=DEST_ID, name="Que necesita = modificar existente", operator="EQUAL", target_form_field_key="applicantQueQuiereHacer", select_value="modificarExistente")
```

---

## PHASE 2: CREATE BOTS IN THE BITACORA

### GOLDEN RULE: NEVER modify/delete anything existing in the Bitacora

### Step 2.1: Create Bot INTERNO - Nuevo

```
bot_create(service_id="ffe746aac09241078bad48c9b95cdfe0", bot_type="internal", name="INTERNO {service_name} - nuevo", short_name="INTERNO {abbrev}", enabled=True)
```

Link to destination service:
```
bot_update(bot_id=NEW_BOT_ID, bot_service_id=DEST_SERVICE_ID)
```

Input mappings (4 base):
```
bot_input_mapping_create(bot_id=ID, source_field="constant_true", source_type="string", target_field="applicantStatusLlegaDeLaBitacora", target_type="radio")
bot_input_mapping_create(bot_id=ID, source_field="applicantRadio", source_type="radio", target_field="applicantQueQuiereHacer", target_type="radio")
bot_input_mapping_create(bot_id=ID, source_field="applicantNit5", source_type="string", target_field="applicantNit3", target_type="textfield")
bot_input_mapping_create(bot_id=ID, source_field="applicantCompania7", source_type="string", target_field="applicantNombreDeLaEmpresa4", target_type="textfield")
```

### Step 2.2: Create Bot INTERNO - Modificar

```
bot_create(service_id="ffe746aac09241078bad48c9b95cdfe0", bot_type="internal", name="INTERNO {service_name} - modificar", short_name="INTERNO {abbrev} mod", enabled=True)
bot_update(bot_id=MOD_BOT_ID, bot_service_id=DEST_SERVICE_ID)
```

Input mappings (4 base + extras per service):
```
bot_input_mapping_create(bot_id=ID, source_field="constant_true", source_type="Boolean", target_field="applicantStatusLlegaDeLaBitacora", target_type="radio")
bot_input_mapping_create(bot_id=ID, source_field="applicantRadio2", source_type="radio", target_field="applicantQueQuiereHacer", target_type="radio")
bot_input_mapping_create(bot_id=ID, source_field="applicantNit5", source_type="string", target_field="applicantNit3", target_type="textfield")
bot_input_mapping_create(bot_id=ID, source_field="applicantCompania7", source_type="string", target_field="applicantNombreDeLaEmpresa4", target_type="textfield")
```

Additional mappings for modificar (service-dependent):
```
# Solicitud number from EditGrid
bot_input_mapping_create(bot_id=ID, source_field="applicantEditGrid_collection_applicantNumero5", source_type="string", target_field="applicantSolicitud", target_type="textfield")
# Counter
bot_input_mapping_create(bot_id=ID, source_field="applicantContador{Service}", source_type="Number", target_field="applicantContador{Service}", target_type="number")
```

### Step 2.3: Create Bot LISTAR (GDB) - If applicable

```
bot_create(service_id="ffe746aac09241078bad48c9b95cdfe0", bot_type="data", name="{service_name} LISTAR", short_name="{abbrev} listar", category="list", enabled=True)
bot_update(bot_id=LIST_BOT_ID, bot_service_id="GDB.GDB-{NAME}({VERSION})-list")
```

Input mapping (always the same):
```
bot_input_mapping_create(bot_id=ID, source_field="applicantNit5", source_type="textfield", target_field="query_child_NIT", target_type="string")
```

Output mappings (depend on GDB, typical pattern):
```
bot_output_mapping_create(bot_id=ID, source_field="applicantEditGrid_collection_applicantExpiracion", source_type="datetime", target_field="results_collection_content_child_{name}_child_hasta", target_type="date")
bot_output_mapping_create(bot_id=ID, source_field="applicantEditGrid_collection_applicantNumero5", source_type="textfield", target_field="results_collection_content_child_{name}_child_num aprobacion", target_type="string")
bot_output_mapping_create(bot_id=ID, source_field="applicantStatusFuncionoElBot", source_type="radio", target_field="status", target_type="boolean")
bot_output_mapping_create(bot_id=ID, source_field="applicantContador{Service}", source_type="number", target_field="count", target_type="integer")
```

---

## PHASE 3: UI AND COMPONENT ACTIONS IN THE BITACORA

### Step 3.1: Add button in "Agregar" dropdown

The dropdown is inside a Block panel. Use `form_component_update` on the dropdown (since `form_component_add` doesn't support dropdown as container):

```
# First read existing dropdown components, then update with new button added
form_component_get(service_id=BITACORA, component_key="applicantdropdown5")
form_component_update(service_id=BITACORA, component_key="applicantdropdown5", updates={"components": [... existing + new button ...]})
```

### Step 3.2: Link button to bot INTERNO nuevo (MCP v0.15.0)

```
componentaction_save(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    component_key="applicant{ButtonKey}",
    actions=[{
        "bot_id": "NEW_BOT_ID",
        "sort_order": 1,
        "parallel": false,
        "mandatory": false
    }]
)
```

### Step 3.3: Link Modificar button to bot INTERNO modificar

```
componentaction_save(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    component_key="applicant{ModificarKey}",
    actions=[{
        "bot_id": "MOD_BOT_ID",
        "sort_order": 1,
        "parallel": false,
        "mandatory": false
    }]
)
```

### Step 3.4: Link Block panel to LISTAR bot

```
componentaction_save(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    component_key="applicant{BlockKey}",
    actions=[{
        "bot_id": "LIST_BOT_ID",
        "sort_order": 1,
        "parallel": false,
        "mandatory": false
    }]
)
```

---

## PHASE 4: VERIFICATION

### Checklist
- [ ] Destination service has 4 mandatory receiver fields
- [ ] Destination service has 4 determinants
- [ ] Bot INTERNO nuevo created with 4+ input mappings
- [ ] Bot INTERNO modificar created with 4+ input mappings
- [ ] Bot LISTAR created with input/output mappings
- [ ] Component Action: button "Agregar" linked to bot nuevo
- [ ] Component Action: button "Modificar" linked to bot modificar
- [ ] Component Action: Block panel linked to LISTAR bot
- [ ] LISTAR bot populates EditGrid correctly
- [ ] E2E test: Agregar flow opens destination with correct data
- [ ] E2E test: Modificar flow opens destination with correct data

---

## REFERENCE: PE Model (Permiso Eventual)

### Bot INTERNO nuevo (ID: 6603eb75-2f6d-40d4-b4e3-6c52b5657776)
| Source (Bitacora) | Target (PE) | Types |
|---|---|---|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | string -> radio |
| `applicantRadio` | `applicantQueQuiereHacer` | radio -> radio |
| `applicantNit5` | `applicantNit3` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | string -> textfield |

### Bot INTERNO modificar (ID: c88be29b-3703-4b7a-9a38-2c56b3d9a834)
| Source (Bitacora) | Target (PE) | Types |
|---|---|---|
| `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| `applicantRadio2` | `applicantQueQuiereHacer` | radio -> radio |
| `applicantNit5` | `applicantNit3` | string -> textfield |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | string -> textfield |
| `applicantEditGrid_collection_applicantNumero5` | `applicantSolicitud` | string -> textfield |
| `constant_true` | `permisoEventual` | Boolean -> checkbox |
| `applicantContadorPermiso` | `applicantContadorEventuales` | Number -> number |

### Bot LISTAR GDB (ID: b94c62ab-9ba0-4bfc-b9ce-e982e2bde9cd)
**Input:** `applicantNit5` -> `query_child_NIT`
**Outputs:**
| Source (Bitacora) | Target (GDB) |
|---|---|
| `applicantEditGrid_collection_applicantExpiracion` | `results_collection_content_child_Permiso eventual_child_hasta` |
| `applicantEditGrid_collection_applicantNumero5` | `results_collection_content_child_Permiso eventual_child_num aprobacion` |
| `applicantStatusFuncionoElBot` | `status` |
| `applicantContadorPermiso` | `count` |

### Determinants in PE destination service
| Determinant | Field | Operator | Value |
|---|---|---|---|
| status bitacora = TRUE | applicantStatusLlegaDeLaBitacora | EQUAL | "true" |
| status bitacora = NOT TRUE | applicantStatusLlegaDeLaBitacora | NOT_EQUAL | "true" |
| Que necesita = nuevo | applicantQueQuiereHacer | EQUAL | "registrarNuevo" |
| Que necesita = modificar | applicantQueQuiereHacer | EQUAL | "modificarExistente" |

### Component Actions in PE (reference)
| Component Key | Bot | Action ID |
|---|---|---|
| `applicantPermisoEventual` (button) | INTERNO PE - nuevo | `b1139de3` |
| `applicantModificar` (grid button) | INTERNO PE - modificar | (check via MCP) |
| `applicantBlock4` (panel) | PE LISTAR | (check via MCP) |
