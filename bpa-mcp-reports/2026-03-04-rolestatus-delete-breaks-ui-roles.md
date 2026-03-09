# BPA MCP Issue: `rolestatus_delete` on system statuses breaks UI roles rendering

**Date:** 2026-03-04
**Reporter:** Nelson Perez (via Claude)
**Severity:** critical

## Environment

- **MCP server version:** 0.22.0 (latest: 0.22.0)
- **Instance:** jamaica (https://bpa.jamaica.eregistrations.org)
- **Service ID:** `5680ebfc-e9a3-4246-8351-f4bdcf2a0301` (Test)

## Summary

Deleting system role statuses (SEND BACK TO CORRECTIONS / FileDeclineStatus) via `rolestatus_delete` causes the BPA web UI to show an **empty Processing Roles section** — all 16 roles disappear from the UI. The API (`role_list`) still returns all 16 roles, so the data is intact, but the UI is broken and unusable.

## Steps to Reproduce

1. Have a service with 16 configured processing roles (Test service on Jamaica)
2. Call `rolestatus_delete` on a **system status** (FileDeclineStatus / SEND BACK TO CORRECTIONS):
   ```
   rolestatus_delete(role_status_id="31025baa-f89d-4646-9da3-4fc1ab6980f7", instance="jamaica")
   ```
3. Call `rolestatus_delete` on a **user-defined status** (REQUEST ADDITIONAL INFORMATION):
   ```
   rolestatus_delete(role_status_id="49de1446-079a-43ee-811d-d42e8317fd95", instance="jamaica")
   ```
4. Visit `https://bpa.jamaica.eregistrations.org/services/5680ebfc-e9a3-4246-8351-f4bdcf2a0301/roles`
5. **Result:** Roles section is completely empty — shows only "Other roles" with search box

## Actual Behavior

- Both `rolestatus_delete` calls returned `200 OK` with `"deleted": true`
- The BPA API via MCP `role_list` still returns all 16 roles
- But the BPA **web UI** shows zero roles in the Processing Roles section
- The service is essentially unmanageable from the UI

```
Tool: mcp__BPA__rolestatus_delete(role_status_id="31025baa-f89d-4646-9da3-4fc1ab6980f7", instance="jamaica")
Response: {"deleted": true, "role_status_id": "31025baa-...", "deleted_status": {"name": "SEND BACK TO CORRECTIONS", "role_status_type": "FileDeclineStatus", ...}}

Tool: mcp__BPA__rolestatus_delete(role_status_id="49de1446-079a-43ee-811d-d42e8317fd95", instance="jamaica")
Response: {"deleted": true, "role_status_id": "49de1446-...", "deleted_status": {"name": "REQUEST ADDITIONAL INFORMATION", "role_status_type": "UserDefinedStatus", ...}}
```

## Expected Behavior

- Deleting a status should NOT break the UI rendering of all roles
- If system statuses (FileDeclineStatus, FileValidatedStatus, etc.) cannot be safely deleted, the `rolestatus_delete` tool should **refuse** with a clear error message
- The BPA UI should gracefully handle roles with missing system statuses

## BPA UI Comparison

- **Before delete:** All 16 roles visible in the Processing Roles section with workflow diagram
- **After delete:** Empty section — only "Other roles" header with search box visible
- **API check after delete:** `role_list(service_id="5680ebfc-...")` returns all 16 roles (data intact)

The BPA web UI likely requires all 4 system statuses (FILE PENDING, FILE VALIDATED, SEND BACK TO CORRECTIONS, FILE REJECT) to be present on each role to render the roles list. Deleting one corrupts the UI renderer.

## Server Logs

No errors found in server logs. All DELETE operations returned 200 OK:

```
2026-03-04 13:47:31 | DELETE /role_status/31025baa-f89d-4646-9da3-4fc1ab6980f7 → 200 OK
2026-03-04 13:47:32 | DELETE /role_status/49de1446-079a-43ee-811d-d42e8317fd95 → 200 OK
```

## Analysis

Two separate issues:

### Issue 1 — MCP: `rolestatus_delete` should guard against deleting system statuses

The `rolestatus_delete` tool (`tools/role_status.py`) does no validation on the status type before deleting. It should check `roleStatusType` and refuse to delete system statuses:

- `FileValidatedStatus` (type 1)
- `FilePendingStatus` (type 0)
- `FileDeclineStatus` (type 2)
- `FileRejectStatus` (type 3)

Only `UserDefinedStatus` (type 4+) should be deletable.

### Issue 2 — BPA Platform: UI breaks when a role is missing system statuses

The BPA web application fails to render the roles list when any role is missing a system status. This is a platform-level issue — the UI should degrade gracefully, not hide all roles.

### Likely affected files

- `src/mcp_eregistrations_bpa/tools/role_status.py` — `rolestatus_delete` function (add type guard)

### Additional context

- The `role_get` tool also **strips status IDs** from its output (see `_resolve_destination_role_names` in `tools/roles.py`). This made it extremely difficult to find the FILE VALIDATED status ID. The `role_get` enhanced status objects should include the `id` field.

## Suggested Fix

### For `rolestatus_delete`:

```python
async def rolestatus_delete(role_status_id, instance=None):
    # ... existing code to fetch previous_state ...

    # Guard: prevent deletion of system statuses
    status_type = previous_state.get("roleStatusType", "")
    SYSTEM_STATUS_TYPES = {
        "FileValidatedStatus", "FilePendingStatus",
        "FileDeclineStatus", "FileRejectStatus"
    }
    if status_type in SYSTEM_STATUS_TYPES:
        raise ToolError(
            f"Cannot delete system status '{previous_state.get('name')}' "
            f"(type: {status_type}). Only user-defined statuses can be deleted. "
            "To modify system status destinations, use rolestatus_update instead."
        )

    # ... proceed with delete for UserDefinedStatus only ...
```

### For `role_get` (separate enhancement):

Include the status `id` in the enhanced status output at line ~211:
```python
enhanced = {
    "id": status.get("id"),  # ADD THIS
    "name": status.get("name"),
    "type": status.get("type"),
}
```

## Recovery

The service needs its system statuses restored. Options:
1. Manually re-add SEND BACK TO CORRECTIONS via the BPA UI (if accessible)
2. Use `rolestatus_create` to recreate the missing status (if it supports system types)
3. Platform-level database intervention by sysadmin
