# Feature Request: Granular Role Form Component API

**Date:** 2026-03-09
**Requested by:** Nelson Perez (UNCTAD Jamaica SEZ project)
**Priority:** High — blocks automated configuration of processing role forms
**Service context:** Establish a New Zone (Jamaica SEZ) — 51 roles, 1,718 fields

---

## Problem Statement

The BPA API exposes granular CRUD endpoints for **service-level forms** (applicant, guide, payment) but only a bulk PUT for **role-level forms**. This means:

- Changing a single label inside a processing role requires replacing the entire form schema
- Any serialization error, truncation, or malformed JSON during the round-trip destroys the entire role form
- Automated tools (MCP, CI/CD, migration scripts) cannot safely make surgical edits to role forms

## Current API Comparison

### Service-Level Forms (granular - works well)

```
GET    /forms/{formId}/components/{componentKey}
PATCH  /forms/{formId}/components/{componentKey}    ← surgical update
POST   /forms/{formId}/components                   ← add one component
DELETE /forms/{formId}/components/{componentKey}     ← remove one component
```

**MCP tools available:**
```
form_component_get(service_id, component_key)
form_component_update(service_id, component_key, updates={...})
form_component_add(service_id, component={...})
form_component_remove(service_id, component_key)
```

### Role-Level Forms (bulk only - the gap)

```
PUT    /roles/{roleId}    ← replaces entire role including form_schema
```

**MCP tools available:**
```
role_update(role_id, form_schema={...})    ← full schema replacement only
```

**Missing endpoints:**
```
GET    /roles/{roleId}/components/{componentKey}       ← does not exist
PATCH  /roles/{roleId}/components/{componentKey}       ← does not exist
POST   /roles/{roleId}/components                      ← does not exist
DELETE /roles/{roleId}/components/{componentKey}        ← does not exist
```

## Real-World Impact

### Scenario: Standardizing 8 evaluation roles

The Jamaica SEZ service has 4 evaluation + 4 approval roles that must have identical component structures. During standardization, we needed to make these changes across 8 roles:

| Change | Example | Risk with current API |
|--------|---------|----------------------|
| Rename a label | "Entity" → "Milestone" | Must send ~50KB of JSON to change 6 characters |
| Add a radio option | Add "Denial" to recommendation | Must reconstruct entire radio component with all existing values |
| Toggle hideLabel | Set `hideLabel: true` on an editgrid | Must send full schema including all nested grid components |
| Reorder panels | Move CI panel after Risks panel | Must restructure entire components array |
| Fix a typo | "Timeline1" → "Timeline" | Must send full schema to fix 1 character |

**What actually happened:** All 40+ changes were made manually in the UI because the API risk was too high. Each change required navigating to the role, finding the component, editing, and saving — approximately 3-5 minutes per change across 8 roles.

**What should have happened:** A script or MCP command like:
```python
# Change "Entity" to "Milestone" across all 8 roles in seconds
for role_id in evaluation_roles + approval_roles:
    role_component_update(role_id, "entityFieldKey", {"label": "Milestone"})
```

### Scenario: Copying a role template to new roles

When creating a new service based on an existing one, role forms need minor adjustments (different prefixes, labels). Currently this requires either:

1. Manual UI editing of every component in every role (hours of work)
2. Risky full-schema replacement via `role_update` (potential data loss)

With granular endpoints, a migration script could safely update individual components.

## Proposed API Endpoints

### Minimum viable (highest impact)

```
GET   /roles/{roleId}/form/components/{componentKey}
PATCH /roles/{roleId}/form/components/{componentKey}
```

**PATCH body example:**
```json
{
  "label": "Milestone",
  "hideLabel": true
}
```

Only the provided properties are merged; everything else preserved.

### Full parity with service-level forms

```
GET    /roles/{roleId}/form/components/{componentKey}
PATCH  /roles/{roleId}/form/components/{componentKey}
POST   /roles/{roleId}/form/components
DELETE /roles/{roleId}/form/components/{componentKey}
GET    /roles/{roleId}/form/components?type=editgrid    (list/filter)
```

### Corresponding MCP tools

Once the API endpoints exist, the MCP plugin would expose:

```python
role_component_get(role_id, component_key, instance=None)
role_component_update(role_id, component_key, updates={...}, instance=None)
role_component_add(role_id, component={...}, parent_key=None, position=None, instance=None)
role_component_remove(role_id, component_key, instance=None)
```

## Workaround Currently Used

1. Read full role schema via `role_list` (includes form_schema per role)
2. Analyze and compare roles programmatically (audit, diff, report)
3. Make all actual changes manually in the BPA UI
4. Re-read via `role_list` to verify changes

This works for auditing but does not scale for:
- Bulk standardization across many roles
- Automated service migration/copying
- CI/CD pipelines for service configuration
- Template-based role creation

## Estimated Effort

Based on the existing service-level form component endpoints, the role-level equivalents should follow the same pattern:

- The form schema is already stored as a JSON structure in the role object
- Component lookup by key uses the same recursive traversal logic
- The PATCH merge logic is identical to what exists for service forms
- Authentication and audit logging follow existing patterns

The main work is exposing the existing internal logic through new REST endpoints.

---

*Generated from analysis of Jamaica SEZ service (0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc) during March 2026 sprint.*
