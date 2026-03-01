# Setup: My Files Block — Query, View & Delegate User Files

Add a complete "My Files" panel to any eRegistrations service. Users can query their files, view them, and delegate access by email.

**Requires**: BPA MCP with write access, target service ID, instance name, frontend URL.

## Inputs

- `SERVICE_ID`: Target BPA service UUID
- `INSTANCE`: BPA instance profile (e.g., `elsalvador-dev`, `cuba`, `jamaica`)
- `FRONTEND_URL`: Frontend base URL for View links (e.g., `https://dev.els.eregistrations.org`)

## Prerequisites

### 1. Verify Mule services exist
```
muleservice_list(name_filter="Query user files", instance=INSTANCE)
muleservice_list(name_filter="Share access to file", instance=INSTANCE)
```
Required:
- `DS.DS - Query user files` — GET, returns paginated file list
- `DS.Share access to file` — POST, shares a file with another user

If either is missing → STOP. Infra team needs to deploy the missing Mule service(s).

### 2. Verify Mule service structure
Confirm inputs/outputs match expected schema (see full skill for details).

---

## Part 1: Query Bot & DataGrid (Steps 1-10)

1. **Create Query Bot**: `bot_create(service_id, bot_type="data", name="Get my files", category="other")`
2. **Add Panel**: `form_component_add(key="applicantMyFilesBlock", type="panel", title="My Files")`
3. **Add Button**: `form_component_add(key="applicantGetMyFiles", type="button", label="Get My Files", parent_key="applicantMyFilesBlock")`
4. **Add DataGrid**: `form_component_add(key="applicantFileResults", type="datagrid", parent_key="applicantMyFilesBlock")`
5. **Add DataGrid Columns**: 10 columns (FileId[hidden], ServiceName, BusinessEntity, CreatedAt, SubmittedAt[hidden], State, Username[hidden], Metadata[hidden], ServiceId[hidden], ProcessInstanceId[hidden])
6. **Add View Link**: `content` component with `{{ row.applicantFileServiceId }}` and `{{ row.applicantFileId }}` template
7. **Add Total Files field**: `textfield` below the DataGrid
8. **Wire Button to Bot**: `componentaction_save(component_key="applicantGetMyFiles", actions=[{bot_id}])`
9. **Input Mappings**: `constant_1 → page`, `constant_100 → page_size`
10. **Output Mappings**: Use `bot_output_mapping_save_all` with compound `_collection_` keys

## Part 2: Delegate Bot (Steps 11-15)

11. **Create Delegate Bot**: `bot_create(bot_type="data", name="Delegar file")`
12. **Add Delegate columns**: button + email field + status field + hidden debug panel inside DataGrid
13. **Wire Delegate Button**: `componentaction_save(component_key="applicantTransferir")`
14. **Input Mappings**: `bot_input_mapping_save_all` with compound keys (fileId + email)
15. **Output Mappings**: `bot_output_mapping_save_all` (status + message + error)

## Part 3: Optional — "Delegated" Badge (Steps 16-18)

16. **Badge Button**: hidden button with green checkmark style
17. **Text Determinant**: `applicantDelegateStatus NOT_EQUAL ""`
18. **Show Effect**: link determinant to badge

## Part 4: Debug, Publish & Test (Steps 19-21)

19. **Debug Scan**: `debug_scan(service_id)` — fix issues until 0 blocking
20. **Publish**: `service_publish(service_id)`
21. **Test**: Click "Get My Files" → verify DataGrid fills → test View link → test Delegate

## Critical Gotchas

1. `bot_output_mapping_create` rejects compound DataGrid keys — always use `save_all`
2. `bot_input_mapping_create` rejects compound keys too — use `save_all`
3. Output mapping orientation is reversed: `source_field` = form field, `target_field` = Mule output
4. BPA requires >= 1 input mapping to publish
5. DataGrid `content` components support `{{ row.fieldKey }}` template syntax
6. Determinants inside DataGrids use simple field keys (not compound) for `target_form_field_key`

## Reference Implementation

- **Instance**: elsalvador-dev | **Service**: RD catalogs (`cd9c5078-8182-42fc-bb74-fc69a1312253`)
- **Full 21-step playbook**: `config/.claude/skills/my-files-block.md`

$ARGUMENTS
