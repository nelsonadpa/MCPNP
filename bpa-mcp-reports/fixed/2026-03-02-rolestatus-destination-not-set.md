# BPA MCP Issue: rolestatus_create and rolestatus_update cannot set transition destinations

**Date:** 2026-03-02
**Reporter:** Nelson Perez (via Claude)
**Severity:** high

## Environment

- **MCP server version:** 0.21.1 (latest: 0.21.3)
- **Instance:** BPA-jamaica (https://bpa.jamaica.eregistrations.org)
- **Service ID:** b45bb51e-7ab6-4a1e-84fd-408eff33410b (Establish a new zone 2026)

## Summary

Two related issues prevent automating workflow transition wiring via MCP:

1. **`rolestatus_update`** rejects updates to system statuses (FILE VALIDATED, FILE PENDING, FILE REJECT, SEND BACK TO CORRECTIONS) with error: `"expected type was userdefined, but was filevalidated"`. This means FILE VALIDATED destinations — which define the entire workflow routing — cannot be modified via MCP.

2. **`rolestatus_create`** accepts a `destination_role_id` parameter but returns `destination_id: null` in the response. The created status has no destination wired, making user-defined statuses non-functional for workflow transitions.

Combined, these issues make it **impossible to configure workflow transitions programmatically**. All transition destinations must be configured manually in the BPA web UI.

## Steps to Reproduce

### Issue 1: rolestatus_update rejects system statuses

1. Get a role with a FILE VALIDATED status (e.g., via `role_create` or `role_update` which returns full status details)
2. Copy the FILE VALIDATED status ID (e.g., `d44faaff-7ad1-4e6f-8f34-a897ef0bd97a`)
3. Call `rolestatus_update(role_status_id="d44faaff-7ad1-4e6f-8f34-a897ef0bd97a", destination_role_id="40c6d1ae-54b1-4f01-8be6-952d9d814fe0")`
4. **Error:** `Invalid request: expected type was userdefined, but was filevalidated`

### Issue 2: rolestatus_create ignores destination_role_id

1. Create a role via `role_create`
2. Call `rolestatus_create(role_id="40c6d1ae-...", name="APPROVED", destination_role_id="2a559ea2-...", role_status_type=1)`
3. Status is created but response shows `destination_id: null`

## Actual Behavior

### Issue 1 — rolestatus_update

```
Tool: rolestatus_update(
    role_status_id="d44faaff-7ad1-4e6f-8f34-a897ef0bd97a",
    destination_role_id="40c6d1ae-54b1-4f01-8be6-952d9d814fe0",
    instance="BPA-jamaica"
)
Error: Invalid request for role_status (ID: d44faaff-...):
       {"message":"expected type was userdefined, but was filevalidated","status":"Bad Request"}
```

### Issue 2 — rolestatus_create

```
Tool: rolestatus_create(
    role_id="40c6d1ae-54b1-4f01-8be6-952d9d814fe0",
    name="APPROVED",
    destination_role_id="2a559ea2-776b-4b2b-9f2d-7f872f7686dd",
    role_status_type=1,
    instance="BPA-jamaica"
)
Response: {
    "id": "afd3462b-edf1-4e21-863b-781d5a98b23c",
    "name": "APPROVED",
    "role_status_type": "FileValidatedStatus",
    "destination_id": null,          ← should be "2a559ea2-..."
    "role_id": "40c6d1ae-...",
    "role_status_message": null
}
```

## Expected Behavior

### Issue 1
`rolestatus_update` should be able to modify destination(s) on system statuses (FILE VALIDATED, etc.), OR a separate tool should exist to manage system status destinations. The BPA web UI allows drag-and-drop configuration of FILE VALIDATED destinations — the MCP should provide equivalent capability.

### Issue 2
`rolestatus_create` should wire the `destination_role_id` to the created status so it functions as a real workflow transition. The response should show the destination_id populated.

## BPA UI Comparison

In the BPA web UI:
- Users can click on a role's FILE VALIDATED status and add/remove destination roles via a visual editor
- Multiple destinations are supported (e.g., Documents check → 5 parallel evaluation roles)
- The API stores these as a `destinations` array on the status object:

```json
{
    "name": "FILE VALIDATED",
    "roleStatusType": "FileValidatedStatus",
    "destinations": [
        {"id": "59396b8c-...", "destinationId": "0fbb9bab-..."},
        {"id": "ccb48e71-...", "destinationId": "96d82ef7-..."},
        {"id": "9df88395-...", "destinationId": "d49b002c-..."}
    ]
}
```

This data structure is visible in `role_update` responses but cannot be modified via any MCP tool.

## Server Logs

No errors related to this issue in server logs. The BPA server returns a clear 400 error for Issue 1. Issue 2 succeeds silently without wiring the destination.

## Analysis

### Issue 1 — rolestatus_update
The BPA backend has separate API endpoints or validation for system vs user-defined statuses. The MCP `rolestatus_update` tool likely uses a user-defined status endpoint that rejects system status types. A separate API call (or a different endpoint) is needed to modify system status destinations.

The BPA REST API likely has an endpoint like:
- `PUT /api/role-statuses/{id}/destinations` or
- `POST /api/role-statuses/{id}/destinations` with body `{"destinationId": "..."}`

### Issue 2 — rolestatus_create
The tool appears to create the status entity but doesn't make a follow-up API call to wire the destination. The `destination_role_id` parameter is accepted but not used in the actual API request to BPA.

### Likely affected files

- `src/mcp_eregistrations_bpa/tools/role_status.py` — both create and update handlers
- Possibly a missing destinations management module

## Suggested Fix

1. **For Issue 1:** Add a new tool `rolestatus_add_destination(role_status_id, destination_role_id)` that calls the BPA API to add a destination to ANY status type (system or user-defined). Also add `rolestatus_remove_destination(role_status_id, destination_role_id)` for completeness.

2. **For Issue 2:** In `rolestatus_create`, after creating the status, make a follow-up API call to wire the destination. Or combine it into the creation payload if the BPA API supports it.

3. **Alternative:** Extend `rolestatus_update` to detect system status types and use the appropriate BPA API endpoint for modifications.

## Impact

Without this fix, any workflow that requires programmatic role creation (service copy + customization, bulk role configuration, automated service setup) requires manual UI intervention to wire the transitions. This breaks the automation promise of the MCP server for complex workflows.

In the current session, 8 roles were created with all metadata correct, but 13 transition destinations need manual configuration in the BPA UI.
