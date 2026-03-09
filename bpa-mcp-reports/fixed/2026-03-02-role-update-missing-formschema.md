# BPA MCP Issue: role_update does not support formSchema parameter

**Date:** 2026-03-02
**Reporter:** Nelson Perez (via Claude)
**Severity:** high

## Environment

- **MCP server version:** 0.21.1 (latest: 0.21.3)
- **Instance:** BPA-jamaica (https://bpa.jamaica.eregistrations.org)
- **Service ID:** b45bb51e-7ab6-4a1e-84fd-408eff33410b (Establish a new zone 2026)

## Summary

`role_update` only exposes basic properties (name, description, sort_order, etc.) but does not accept `formSchema` as an updatable parameter. The BPA REST API **does** support updating `formSchema` via `PUT /role` — the MCP tool simply doesn't expose it.

This prevents programmatic configuration of role processing forms: adding panels, buttons, EditGrids, or any form component to a role's workspace. Combined with the `service_copy` bug that produces empty formSchema on some roles (see related issue), this makes it impossible to fully configure a service via MCP.

## Current role_update Parameters

```
role_update(
    role_id,          # required
    name,             # optional
    short_name,       # optional
    assigned_to,      # optional
    description,      # optional
    start_role,       # optional
    visible_for_applicant,  # optional
    sort_order_number,      # optional
    allow_to_confirm_payments,          # optional
    allow_access_to_financial_reports,  # optional
    instance          # optional
)
```

**Missing:** `formSchema`, `jsonDeterminants`

## BPA REST API — Already Supports It

The underlying BPA API accepts `formSchema` in the role PUT request:

```
PUT /bparest/bpa/v2016/06/role
Authorization: Bearer {token}
Content-Type: application/json

{
    "id": "role-uuid",
    "name": "Status letter",
    "type": "UserRole",
    "assignedTo": "processing",
    "serviceId": "service-uuid",
    "formSchema": {
        "components": [
            {
                "type": "panel",
                "key": "statusLetterPanel1",
                "title": "Status letter workspace",
                "components": [...],
                "registrations": {"registration-uuid": true}
            }
        ]
    },
    ...other fields...
}
```

The MCP tool already implements a GET → merge → PUT pattern for role updates. Adding `formSchema` to the merge would require minimal changes.

### Verified via direct API call

We confirmed the API accepts role reads with formSchema:

```bash
# GET role returns formSchema as a dict
curl -s "https://bpa.jamaica.eregistrations.org/bparest/bpa/v2016/06/role/{role_id}" \
  -H "Authorization: Bearer {token}" | jq '.formSchema.components | length'
# Returns: 4 (for Business evaluation role)
```

## Use Cases

### 1. Copy form components between roles

After creating new processing roles (e.g., CI evaluation roles), populate them with form components from existing roles:

```python
# Desired MCP usage:
source = role_get(role_id="business-eval-id")
target_schema = modify(source.formSchema)  # remove buttons, add panels
role_update(role_id="business-eval-ci-id", formSchema=target_schema)
```

### 2. Fix service_copy empty formSchema bug

When `service_copy` produces roles with empty `formSchema`, repair them by copying from the original:

```python
original = role_get(role_id="original-status-letter")
role_update(role_id="copied-status-letter", formSchema=original.formSchema)
```

### 3. Add new form panels with copyValueFrom

Add panels that reference data from other roles (e.g., showing Complementary Information uploads in evaluation roles):

```python
ci_panel = {
    "type": "panel",
    "key": "businessCiAdditionalDocs",
    "title": "Business - Additional documents and information",
    "components": [{
        "type": "editgrid",
        "key": "businessCiEditGrid",
        "copyValueFrom": ["complementaryInformationEditGrid2"],
        "components": [...]
    }]
}
current = role_get(role_id="business-eval-ci-id")
current.formSchema.components.append(ci_panel)
role_update(role_id="business-eval-ci-id", formSchema=current.formSchema)
```

## Suggested Implementation

In `src/mcp_eregistrations_bpa/tools/roles.py`, the `role_update` function builds the PUT body from explicit parameters. Adding formSchema support:

```python
# Current pattern (simplified):
async def role_update(role_id, name=None, description=None, ...):
    current = await api.get(f"/role/{role_id}")
    if name: current["name"] = name
    if description: current["description"] = description
    # ... other fields ...
    await api.put("/role", json=current)

# Proposed addition:
async def role_update(role_id, ..., form_schema=None, json_determinants=None):
    current = await api.get(f"/role/{role_id}")
    # ... existing fields ...
    if form_schema is not None:
        current["formSchema"] = form_schema
    if json_determinants is not None:
        current["jsonDeterminants"] = json_determinants
    await api.put("/role", json=current)
```

The parameter should accept a dict (the formSchema object) and pass it through to the API. No transformation needed — the BPA API already accepts the exact format returned by `role_get`.

## Impact

Without `formSchema` support in `role_update`, any workflow that requires:
- Creating new roles and populating their forms
- Fixing roles with empty formSchema after `service_copy`
- Adding CI (complementary information) panels to roles
- Programmatic role form configuration of any kind

...must be done manually in the BPA web UI, one role at a time. For a service with 26+ roles, this eliminates the automation benefit of the MCP server for service setup tasks.

## Related Issues

- `2026-03-02-rolestatus-destination-not-set.md` — cannot wire workflow transitions
- `2026-03-02-service-copy-empty-role-formschema.md` — service_copy drops formSchema on 9 roles

Together, these three issues mean that after `service_copy` + role creation, the entire role form configuration and workflow wiring must be done manually in the UI.
