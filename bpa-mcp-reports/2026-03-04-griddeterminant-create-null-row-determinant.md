# BPA MCP Issue: `griddeterminant_create` saves `row_determinant_id` as null

**Date:** 2026-03-04
**Reporter:** Nelson Perez (via Claude)
**Severity:** high

## Environment

- **MCP server version:** 0.22.0 (latest: 0.22.0)
- **Instances tested:** BPA-cuba (`bpa.cuba.eregistrations.org`), BPA-jamaica (`bpa.jamaica.eregistrations.org`)
- **Service IDs:** Multiple (Cuba PE service, Jamaica Test service)

## Summary

`griddeterminant_create` creates a grid determinant object but saves `row_determinant_id: null` instead of creating and linking the nested row determinant. The resulting object is a non-functional shell that:

1. Has no actual condition to evaluate (no row determinant linked)
2. Creates "ghost" objects visible in the API but not functional in the BPA UI
3. Causes `NullPointerException` on service export due to the null reference

## Steps to Reproduce

1. Have a service with an EditGrid component (e.g., key `applicantEditGrid`) containing a child field (e.g., `expiryDate` of type datetime)
2. Call:
   ```
   griddeterminant_create(
     service_id="<service_id>",
     name="Test grid det",
     target_form_field_key="applicantEditGrid",
     row_determinant_type="date",
     row_field_key="expiryDate",
     operator="LESS_THAN",
     is_current_date=true,
     subject="SOME",
     instance="BPA-cuba"
   )
   ```
3. Observe the response — `row_determinant_id` is `null`
4. Check determinant in BPA UI — it appears but has no condition configured
5. Attempt to export the service — `NullPointerException`

## Actual Behavior

The tool returns a response like:

```json
{
  "id": "<new-uuid>",
  "name": "Test grid det",
  "type": "grid",
  "target_form_field_key": "applicantEditGrid",
  "determinant_inside_grid": true,
  "subject": "SOME",
  "row_determinant": null,
  "service_id": "<service_id>"
}
```

The `row_determinant` field is `null`. The backend does NOT create the nested row determinant object. The grid determinant is saved as an empty wrapper with no condition.

Subsequent service export via BPA UI fails with `NullPointerException` because the system tries to evaluate a grid determinant whose row determinant doesn't exist.

## Expected Behavior

The tool should atomically create:

1. A **row determinant** (e.g., date determinant with `LESS_THAN` + `is_current_date=true`) targeting the collection path `applicantEditGrid_collection_expiryDate`
2. A **grid determinant** wrapping that row determinant, with `row_determinant_id` pointing to the newly created row determinant

The response should include the fully populated `row_determinant` object with its own `id`, `type`, `operator`, and condition values.

## BPA UI Comparison

When creating the same grid determinant in the BPA web UI:

1. Navigate to Service → Determinants → New → Grid
2. Select the EditGrid field
3. Select the row field and configure the condition
4. Save

The UI correctly creates both the row determinant and the wrapping grid determinant in a single operation. The `row_determinant_id` is properly populated, and the determinant functions correctly in the workflow.

### Expected API payload (based on UI behavior)

The BPA backend expects a POST to the determinant endpoint with the row determinant nested inside the grid determinant payload. The MCP tool appears to construct this payload but the row determinant portion is either:
- Not included in the request body, or
- Included but rejected/ignored by the backend due to a serialization issue

## Server Logs

No specific errors found in server.log for this tool. The tool returns a 200 OK response — the issue is that the saved data is incomplete, not that the request fails.

## Analysis

The tool description says: "Backend creates the row determinant atomically as a nested object." This suggests the MCP server sends the row determinant data as a nested object in the grid determinant creation payload, expecting the BPA backend to create both atomically.

**Likely root cause:** The BPA Java backend may not be deserializing the nested row determinant correctly from the MCP server's payload format. Alternatively, the MCP tool may be constructing the nested payload incorrectly (wrong field names, missing required fields, or wrong nesting structure).

The tool auto-constructs the collection path as `{target_form_field_key}_collection_{row_field_key}`, which is correct. But the row determinant object itself isn't being persisted.

### Tested row determinant types

| row_determinant_type | Result |
|---------------------|--------|
| `date` (with is_current_date) | `row_determinant: null` |
| `text` (with text_value) | `row_determinant: null` |
| `radio` (with select_value) | `row_determinant: null` |

All types produce the same null result — this is not type-specific.

### Likely affected files

- `src/mcp_eregistrations_bpa/tools/determinants.py` (grid determinant creation logic)
- Possibly the payload construction for the nested row determinant object

## Suggested Fix

1. **Inspect the actual HTTP request** the MCP tool sends to the BPA backend when creating a grid determinant. Compare it byte-for-byte with the request the BPA web UI sends for the same operation (use browser DevTools Network tab).

2. The difference will likely be in how the row determinant is nested in the JSON payload. Common issues:
   - Missing `rowDeterminant` wrapper key
   - Wrong field names (e.g., `row_determinant_type` vs `type`)
   - Row determinant condition fields not included in the nested object

3. Match the MCP payload format to what the BPA UI sends, and the backend should create both objects atomically.

## Impact

This bug blocks any workflow that needs to evaluate conditions inside EditGrid rows, including:
- **Expiration badges** (date determinant inside grid → show "Expired" badge)
- **Conditional routing** (check grid row values to activate/skip workflow roles)
- **Grid-based business rules** (e.g., "if any row has category X, require additional review")

### Current workarounds
- Create grid determinants manually in BPA web UI (works but not automatable)
- Use REST API directly to replicate the UI's request format
- Redesign to avoid EditGrid (use individual fields + boolean/text determinants instead)

## Version History

| MCP Version | Status |
|------------|--------|
| v0.16.4 | Claimed fix — still broken |
| v0.17.1 | Claimed correct payload — still broken |
| v0.22.0 | Still broken (current) |
