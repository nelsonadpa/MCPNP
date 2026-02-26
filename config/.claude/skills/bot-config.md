# Skill: Configure Bots and Mappings

## When to use
When creating or modifying bots (data, internal, document) and their input/output mappings.

## Bot types

| Type | Purpose | bot_service_id |
|------|---------|----------------|
| data | Query GDB | GDB service ID |
| internal | Create case in another BPA service | Destination service ID |
| document | Generate documents | N/A |

## Key workarounds

- **`_collection_` fields** are rejected by `bot_input_mapping_create` and `bot_output_mapping_create`. Use `bot_input_mapping_save_all` / `bot_output_mapping_save_all` instead.
- **Component Actions checklist** (ALWAYS verify after creation):
  1. `componentaction_save` → creates action, returns `id`
  2. `form_component_update` → set `componentActionId` to that `id`
  3. `form_component_get` → verify `componentActionId` is NOT empty

## Standard mappings (Bitacora → destination service)

### Bot INTERNO (create new case)
| Source (Bitacora) | Target (service) | Notes |
|-------------------|-------------------|-------|
| `applicantNit5` | `applicantNit` / `applicantNit3` | Key varies per service |
| `applicantCompania7` | `applicantNombreDeLaEmpresa*` | Key varies per service |
| `applicantRadio` | `applicantQueQuiereHacer` | Only for COMPLETO level |
| constant "true" | `applicantStatusLlegaDeLaBitacora` | Always |
| Contador[X] | contador[X] | Service-specific |
| constant "true" | permiso[X] | Checkbox tipo |

### Bot LISTAR (query existing registrations)
| Input | Output |
|-------|--------|
| `applicantNit5` → `query_child_NIT` | count, num_permiso, fecha_hasta, status_bot |

## Common mistakes
- ALWAYS verify field IDs with `field_list` — labels can be duplicated
- ALWAYS do `form_component_update` after `componentaction_save`
- Validate with `bot_validate` before considering done
