# Lessons Learned

Patterns and mistakes to avoid. Review at session start.

---

## MCP Tool Gotchas

### Always follow up `componentaction_save` with `form_component_update`
- `componentaction_save` creates the action but does NOT set `componentActionId` on the component
- Without the follow-up, the action exists in the backend but won't render or fire
- **Checklist**: (1) save → get id, (2) update component → set componentActionId, (3) get component → verify

### Never use `selectdeterminant_create` for radio fields
- Creates wrong Java class (`SelectDeterminant` vs `RadioDeterminant`) → ClassCastException
- Use BPA REST API directly: `POST /bparest/bpa/v2016/06/service/{id}/radiodeterminant`
- See `bpa-rest-api.md` for full payload

### Never use `griddeterminant_create` or `datedeterminant_create` inside grids
- Grid: saves `row_determinant_id: null` → breaks service export with NullPointerException
- Date inside grid: leaves "where applied" empty → ghost object
- Use REST API with inline `rowDeterminant` (no separate id) — server creates both atomically

### Use `save_all` for collection field mappings
- `bot_input_mapping_create` and `bot_output_mapping_create` reject `_collection_` fields
- Use `bot_input_mapping_save_all` / `bot_output_mapping_save_all` instead

## Field Key Mistakes

### Every service has DIFFERENT NIT/Empresa keys
- Don't assume `applicantNit` — PE and Seg. ambiental use `applicantNit3`
- Don't assume `applicantNombreDeLaEmpresa` — 11 services use `applicantNombreDeLaEmpresa11`
- **Always** check actual field keys with `form_get` before creating mappings

### Bitacora source fields are FIXED — never modify
- `applicantNit5` (NIT), `applicantCompania7` (Empresa), `applicantRadio` (nuevo), `applicantRadio2` (modificar)

## EditGrid Visual Rules

### Wrong CSS classes produce broken rendering
- Expirado badge: `size: "xs"` NOT `"sm"` (sm renders full button, xs renders badge)
- Badge classes: `["light-color", "hover-feedback-off", "button-status", "btn-red"]` NOT `["btn-danger"]`
- Columns: `width: 2` NOT `3`, add 5th empty column for spacing
- Dropdown: needs `leftIcon: "fa-solid fa-ellipsis-vertical"` for the three-dot menu
- **When in doubt**: GET the Fito/PE equivalent component and copy ALL properties

## REST API Patterns

### JWT expires during bulk operations
- BPA auth sessions last ~4 minutes
- Plan for re-authentication in Playwright scripts
- Extract fresh JWT with `page.evaluate(() => localStorage.getItem('tokenJWT'))`

### Behaviour creation via REST — correct jsonDeterminants format
- Use `determinantId` references: `[{"type":"OR","items":[{"type":"OR","determinantId":"<uuid>"}]}]`
- NOT inline JSONLogic `{"==": [{"var": "data.field"}, "value"]}` (MCP's wrong format)
- After creating behaviour, update component with `behaviourId` + `effectsIds`

## Process Mistakes

### Always take baseline snapshots before modifying a service
- Before: `service_export_raw` or `analyze_service`
- After: compare to verify only intended changes were made
- Broken objects from failed MCP calls can block service export (NullPointerException)

### Service copies inherit all garbage
- Copied services don't validate referential integrity
- Expect phantom behaviourIds, orphaned determinants, broken formula refs
- Run `debug_scan` on any copied service before working on it

### Delete one mapping at a time
- Never bulk-delete bot mappings — duplicate field labels exist
- Always verify by field ID (not label) before deleting
