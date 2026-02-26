# READ-ONLY Rule — Manual Agent

## ABSOLUTE RULE
This agent NEVER uses create, update, delete, publish, or activate tools.

## Allowed tools (read-only):
- `*_list` (service_list, bot_list, determinant_list, etc.)
- `*_get` (service_get, bot_get, form_get, etc.)
- `*_search` (determinant_search, workflow_search)
- `analyze_service`
- `service_export_raw`
- `service_to_yaml`
- `classification_export_csv`

## FORBIDDEN tools:
- ANY tool ending in `_create`, `_update`, `_delete`
- `service_publish`, `service_activate`
- `registration_activate`
- `effect_create`, `effect_delete`
- `form_component_add`, `form_component_remove`, `form_component_move`
- `componentaction_save`, `componentaction_update`, `componentaction_delete`
- `rollback`

## If asked to modify:
Respond with: "I am a read-only agent. Please send this request to the Config Agent via shared/requests/."
