# Connect a Service to Bitacora

Run the Bitacora connection pattern for a destination service. This creates the INTERNO bots, LISTAR bot, EditGrid, and component actions needed to link a service to the Bitacora hub.

## Pre-flight Checks
1. `connection_status` — verify MCP is connected
2. `service_get` on the destination service — confirm it exists and get its form
3. Check destination has receiver fields: `applicantStatusLlegaDeLaBitacora`, NIT field, Empresa field
4. Check field key mapping — each service uses DIFFERENT keys (see OCAgents memory)

## Execution Steps
1. **Baseline snapshot**: Export current state of both Bitacora and destination service
2. **Backend infrastructure** (Block5/Block8): Create counter, status, LISTAR panel fields
3. **Bot INTERNO nuevo**: Create with input mappings (constant_true→StatusBitacora, NIT, Empresa, Contador, QueQuiereHacer)
4. **Bot INTERNO modificar** (if service supports modification): Same + Solicitud mapping
5. **Bot LISTAR**: Create with GDB, input (NIT→query_child_NIT), output mappings (count, numero, fecha, status)
6. **Dropdown button**: Add to Block22 (Permisos) or Block4 (Registros) with component action
7. **EditGrid**: Create with dropdown menu, columns (Tipo, Numero, Fecha, Expirado), visual rules
8. **Component Actions**: Wire button→INTERNO, modificar→INTERNO modif, panel→LISTAR
9. **Verify**: `form_component_get` on all new components to confirm componentActionId is set
10. **Comparison snapshot**: Compare before/after

## Known Limitations
- StatusBitacora radio determinant: use REST API (MCP bug 1-3)
- Expirado badge (grid+date determinant): use REST API (MCP bugs 4-5-6)
- Collection field mappings: use `save_all` variants

## Important
- NEVER modify existing Bitacora components
- Use `bot_input_mapping_save_all` / `bot_output_mapping_save_all` for collection fields
- After `componentaction_save`, ALWAYS follow up with `form_component_update` to set `componentActionId`

Service to connect: $ARGUMENTS
