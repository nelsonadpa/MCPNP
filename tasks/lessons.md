# Lessons Learned

Patterns and mistakes to avoid. Review at session start.

---

## MCP Tool Gotchas

### NEVER delete system role statuses — breaks BPA UI completely
- System statuses: FILE VALIDATED, FILE PENDING, SEND BACK TO CORRECTIONS, FILE REJECT
- Types: `FileValidatedStatus`, `FilePendingStatus`, `FileDeclineStatus`, `FileRejectStatus`
- `rolestatus_delete` accepts them without warning, BPA API returns 200 OK
- **But the BPA UI breaks**: all roles disappear from Processing Roles section
- Data is intact in API (`role_list` still returns all roles), but UI is unusable
- Only delete `UserDefinedStatus` (type 4+) statuses
- To change system status destinations, use `rolestatus_update` — never delete + recreate
- **Bug report**: `~/Desktop/bpa-mcp-reports/2026-03-04-rolestatus-delete-breaks-ui-roles.md`

### `role_get` strips status IDs — use Python workaround to find them
- The MCP `role_get` tool returns statuses with only `name` and `type` — no `id` field
- To get status IDs, use the UV Python directly:
  ```
  /Users/nelsonperez/.cache/uv/archive-v0/<archive>/bin/python -c "
  import asyncio, json
  from mcp_eregistrations_bpa.bpa_client import BPAClient
  async def main():
      async with BPAClient.for_instance('jamaica') as client:
          data = await client.get('/role/{role_id}', path_params={'role_id': '<ROLE_ID>'}, resource_type='role', resource_id='x')
          for s in data.get('statuses', []):
              print(json.dumps({k: s.get(k) for k in ['id', 'name', 'roleStatusType']}))
  asyncio.run(main())
  ```
- Find the correct archive: `ps aux | grep mcp-eregistrations-bpa` → check path

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

### bot_create does NOT link Mule service — must bot_update immediately
- `bot_create` creates bots with `bot_service_id: null` — there's no param to set it at creation time
- A failed `service_publish` due to "External service is not configured" **reverts ALL form component changes**
- All `form_component_add` calls succeed, but after the failed publish, every component vanishes
- **Fix**: Always call `bot_update(bot_id, bot_service_id="DS.xxx")` BEFORE adding form components
- **Correct order**: bot_create → bot_update (link Mule) → form_component_add → componentaction_save → publish

### componentaction_save response may show "bots":[] but data is correct
- The save response sometimes returns empty bots array — a display bug in the MCP tool
- Use `componentaction_get_by_component` to verify — it shows the actual linked bots
- Don't re-create based on the save response alone

## Process Mistakes

### Always take baseline snapshots before modifying a service
- Before: `service_export_raw` or `analyze_service`
- After: compare to verify only intended changes were made
- Broken objects from failed MCP calls can block service export (NullPointerException)

### NEVER create roles with empty "Unit in charge"
- When assigning an institution to a role, ALWAYS also assign a valid unit
- BPA UI allows saving empty unit but it creates a null `unit_id` in the database
- This breaks `service_copy` → Keycloak "Group name is missing" error (500)
- The error is opaque — doesn't tell you WHICH role has the bad unit
- **Pre-copy checklist**: audit all roles with `roleunit_list` → verify no null `unit_id`
- **Bug report**: `countries/jamaica/analysis/mcp-issue-service-copy-keycloak.md`

### Service copies inherit all garbage
- Copied services don't validate referential integrity
- Expect phantom behaviourIds, orphaned determinants, broken formula refs
- Run `debug_scan` on any copied service before working on it

### Delete one mapping at a time
- Never bulk-delete bot mappings — duplicate field labels exist
- Always verify by field ID (not label) before deleting

---

## PE E2E Mission (2026-02-26)

### Cuba Form Patterns

#### Selectors: use `.formio-component-{key}`, NOT `[ref="{key}"]`
- Cuba forms use `.formio-component-{key}` class selectors
- `[ref]` selectors exist but are less reliable
- Jamaica uses `[ref]` — the two countries differ here

#### Choices.js dropdowns start CLOSED in Cuba
- Must click `.choices` wrapper first, then search input appears
- Jamaica dropdowns start open — don't assume same behavior across countries

#### `form.onChange()` CRASHES the page — never call it
- Only use `checkConditions()` for re-evaluation after setting values programmatically

#### `form.rebuild()` destroys state — never call it
- Causes loss of filled data and component state

#### Enter key fallback for dropdowns
- When dropdown items are outside viewport, `click({ force: true })` fails silently
- Use `searchInput.press('Enter')` to select the highlighted item instead

#### Submit detection in Cuba
- Cuba redirects to `/` on success — there is no `.alert-success` banner
- Detect successful submission via URL change + "Pendiente" text on the dashboard

### Modification Flow

#### Tab 2 uses different field keys than Tab 1
- PE Modificar Tab 2 uses suffixed keys: `Operacion2`, `RegimenEspecial3`, `DataGridNuevonuevo4`, `Seccion4`, etc.
- Completely different from PE Nuevo keys — always verify with `form_get`

#### Disabled fields with synthetic data
- Without a real approved permit, some Tab 2 fields are disabled (`Operacion2`, `Contrato`, `Factura`)
- Always check `isFieldEnabled()` before `fillText()` to avoid test failures

#### `is_submit_allowed` differs per operation type
- `false` for PE Nuevo, `true` for PE Modificar
- Sysadmin role bypasses both — tests using sysadmin won't catch this difference

#### INTERNO bots live in Bitacora and never fire on direct navigation
- Navigating to `/services/{id}` does not trigger INTERNO bots
- E2E tests must set hidden fields manually instead of relying on bot execution

### Graylog / Observability

#### Graylog 500 errors with special characters
- Queries containing `Bitácora` (accented á) or wildcards like `actionName:*PE*` fail with 500
- Use exact matches or `serviceId` filters to avoid this

#### MINCEX XLS activation race condition
- First Mule flow sends empty data and fails
- Retry with full data succeeds — known issue, does not block workflow

#### 36K+ logs/day is normal baseline for Cuba
- Zero errors in 24h is healthy — don't alarm on volume alone

### Testing Patterns

#### Wait 10+ seconds after form navigation
- Cuba forms take time to render all components
- `waitForTimeout(10000)` + `waitForSelector('.formio-form')` is the proven pattern
- Shorter waits cause flaky tests

#### DataGrid may have default rows
- Always check `existingRows` count before clicking "Agregar"
- Blindly adding rows creates duplicates

#### No approved permits for test company
- LISTAR bot returns `contador=-1`, EditGrid is empty
- Test modification flow with synthetic permit number — still validates the form structure

#### Select values are objects, not plain strings
- Format: `{ key: "Importar", value: "Importación" }`
- Search for the display text (value), not the key

---

## Fito E2E Discovery (2026-02-28)

### Transport dropdown uses Avión/Barco — NOT standard transport terms
- "Marítimo", "Aéreo", "Terrestre", "Mar", "Aire" all FAIL
- Actual options are **"Avión"** and **"Barco"** — discovered by clicking dropdown and dumping items
- Lesson: always dump dropdown items on first attempt; don't guess from field labels

### EditGrid selects require scrollIntoView before interaction
- Choices.js inputs inside editgrid rows are "outside of the viewport" after adding a row
- Must call `scrollIntoViewIfNeeded()` + `scrollIntoView({ block: 'center' })` before searchAndSelect
- Without this, Playwright times out with "element is outside of the viewport" (29 retries)

### Not all services need QueQuiereHacer
- PE requires `applicantQueQuiereHacer: 'registrarNuevo'` for form logic
- Fito has NO QueQuiereHacer field — form shows all blocks without it
- Don't assume PE patterns apply to other services

### Contact info auto-populates from user account
- Fito pre-fills ElaboradoPor, Telefono, Email from logged-in user
- PE does NOT pre-fill these — behavior varies per service
- Test should verify auto-fill is present, not blindly overwrite

### Some forms show main block immediately (no hidden field dependency)
- PE: Block8 only appears after StatusBitacora is set
- Fito: Block12 is visible immediately on form load
- Hidden fields still help (company panel renders) but aren't blocking

### Auth state expires frequently — always check first
- Auth state files become stale after ~24h
- First test failure on "Mis empresas" timeout → check screenshot → if login page, re-auth
- Add auth check to test pipeline startup
