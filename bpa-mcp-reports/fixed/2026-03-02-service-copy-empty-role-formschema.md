# BPA MCP Issue: service_copy produces roles with empty formSchema

**Date:** 2026-03-02
**Reporter:** Nelson Perez (via Claude)
**Severity:** high

## Environment

- **MCP server version:** 0.21.1 (latest: 0.21.3)
- **Instance:** BPA-jamaica (https://bpa.jamaica.eregistrations.org)
- **Original service ID:** d51d6c78-5ead-c948-0b82-0d9bc71cd712 (Establish a new zone)
- **Copied service ID:** b45bb51e-7ab6-4a1e-84fd-408eff33410b (Establish a new zone 2026)

## Summary

`service_copy` creates a service copy where **9 out of 26 roles have empty `formSchema`** (`{"components":[]}`). The evaluation and approval roles are copied correctly with their form components and remapped registration IDs, but workflow roles (document check, letter preparation, board steps, certificate steps) lose all their form components. This means operators in those roles see an empty workspace instead of the panels, buttons, and fields they need to process files.

Additionally, **23 roles from Part B** of the original service (extended pipeline) were not included in the copy at all.

## Steps to Reproduce

1. Start with a service that has roles with populated `formSchema` (e.g., `d51d6c78-5ead-c948-0b82-0d9bc71cd712` in Jamaica)
2. Call `service_copy(service_id="d51d6c78-5ead-c948-0b82-0d9bc71cd712", name="Test Copy", instance="BPA-jamaica")`
3. Export both the original and copy using `service_export_raw`
4. Compare the `formSchema` field on each role

## Actual Behavior

9 roles in the copied service have `formSchema: '{"components":[]}'` (empty), while the original has real form components:

| Role | Original formSchema | Copy formSchema |
|------|-------------------|-----------------|
| Documents check | ~8 components (panels, buttons) | **EMPTY** |
| Status letter | ~7 components (panels, columns, Approve button) | **EMPTY** |
| Signature status letter | ~6 components | **EMPTY** |
| Board submission | ~110 components (tabs, panels, extensive form) | **EMPTY** |
| CEO validation | ~7 components | **EMPTY** |
| Board | ~37 components | **EMPTY** |
| SEZ Documents | ~6 components | **EMPTY** |
| Denial letter | ~12 components | **EMPTY** |
| Pre-approval letter | ~12 components | **EMPTY** |

Additionally, the `jsonDeterminants` property is missing on all 9 broken roles, while it exists on the working evaluation/approval roles.

The `componentActions` referenced by these roles' form buttons WERE copied correctly — only the `formSchema` that references them was lost.

## Expected Behavior

All roles in the copied service should have their `formSchema` populated with the same component structure as the original, with registration IDs remapped to the copy's new registration IDs.

The copy already does this correctly for evaluation and approval roles — the same logic should apply to all roles.

## BPA UI Comparison

In the BPA web UI:
- **Original service → Status letter role → Form tab**: Shows panels with columns, content blocks, and an "Approve" button linked to a componentAction
- **Copied service → Status letter role → Form tab**: Shows empty workspace with text "This is your working space, drag and drop elements here"

### Original Status letter formSchema (simplified)

```json
{
  "components": [
    {
      "type": "panel",
      "key": "statusLetterPanel1",
      "components": [
        {
          "type": "columns",
          "columns": [
            {"components": [{"type": "content", "key": "statusLetterContent1"}]},
            {"components": [
              {"type": "button", "key": "filevalidated_...", "label": "Approve",
               "componentActionId": "b7885ea1-..."}
            ]}
          ]
        }
      ],
      "registrations": {"685dfe8b-d470-ecbf-baf7-579d2711cd7f": true}
    },
    {
      "type": "panel",
      "key": "statusLetterPanel2",
      "registrations": {"685dfe8b-d470-ecbf-baf7-579d2711cd7f": true}
    }
  ]
}
```

### Copy Status letter formSchema

```json
{"components": []}
```

## Registration ID Mapping

The copy correctly created new registration IDs. Working roles have these remapped in their formSchema; broken roles have no formSchema at all.

| Original Registration ID | Copy Registration ID | Name |
|--------------------------|---------------------|------|
| `685dfe8b-d470-ecbf-baf7-579d2711cd7f` | `11f0a812-0354-4699-964d-2218c07ce0f6` | Approval SEZA |
| `f7b547f2-7a48-418c-9c64-eacb5da09fb6` | `8a29431d-4157-452b-81ed-de07db949bca` | No objection JCA |
| `2a70472b-53fa-461d-92aa-b945a8ede9e6` | `15689002-8387-41e1-9f93-1d84e945a20d` | No objection MOFPS |
| `e937c6d5-62aa-4074-844d-13789f7b69f6` | `1869df6f-2883-4104-9249-29330bd5ae53` | No objection TAJ |

## Server Logs

No errors found in server logs. The copy operation completed successfully — the empty formSchema is a silent data loss issue.

## Analysis

### Pattern

The 9 broken roles are all **non-evaluation, non-approval workflow roles**: document checking, letter preparation, board/CEO steps, and certificate generation. The evaluation roles (Business, Legal, Technical, Compliance) and approval roles that have complex formSchema with tabs and many blocks were copied correctly.

This suggests the copy logic may:
- Have a role type filter that skips certain roles
- Process formSchema differently based on some property that differs between eval/approval roles and workflow roles
- Have a size or complexity threshold that incorrectly excludes simpler formSchema structures

### Missing Part B roles

23 roles from the original service's "Part B" (extended pipeline starting at sort_order 299) were not included in the copy at all. These roles include Developer License, Operate Application, and other extended workflow steps. This may be a separate issue or the same selective-copy bug.

### Likely affected files

- `src/mcp_eregistrations_bpa/tools/service_copy.py` — or wherever the copy/export-import logic lives
- The BPA backend's service export/import endpoint if the copy uses that internally

## Suggested Fix

1. **Ensure all roles' `formSchema` is included in the copy**, not just evaluation/approval roles. The registration ID remapping that already works for eval/approval roles should be applied universally.

2. **Include all roles in the copy**, including Part B (extended pipeline) roles. The copy should replicate the full service structure.

3. **Copy `jsonDeterminants`** for all roles — currently missing on the 9 broken roles.

4. **Verification step**: After a copy, validate that no role has `formSchema: '{"components":[]}'` when the original had components.

## Impact

Without this fix, any service copy requires manual reconstruction of 9+ role forms in the BPA UI. For the "Board submission" role alone, this means manually recreating ~110 form components (tabs, panels, buttons, content blocks). Combined with the transition destination issue (separate report), `service_copy` produces a service that requires extensive manual work to make functional — negating the automation benefit.

## Related Issues

- `2026-03-02-rolestatus-destination-not-set.md` — rolestatus_create/update cannot wire workflow transition destinations
- Combined, these two issues mean `service_copy` produces a service with: (a) empty role forms, (b) no workflow transitions wired, and (c) missing Part B roles. The copy is essentially a skeleton that requires near-complete manual reconfiguration.
