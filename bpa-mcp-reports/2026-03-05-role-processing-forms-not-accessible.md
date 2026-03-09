# BPA MCP Issue: Role processing forms not accessible via form tools

**Date:** 2026-03-05
**Reporter:** Nelson Perez (via Claude)
**Severity:** high

## Environment

- **MCP server version:** 0.22.0 (latest: 0.22.0)
- **Instance:** BPA-jamaica (bpa.jamaica.eregistrations.org)
- **Service ID:** `28bf8aca-6d59-45ce-b81f-5068ab5ae7e1` (Establish a new zone — PARTB)

## Summary

The form tools (`form_component_get`, `form_query`, `form_component_add`, `form_component_update`, `form_component_remove`) only support `form_type` values of `applicant`, `guide`, `send_file`, and `payment`. **Role processing forms** (the forms officers see when processing a task in Part B) are not accessible. This means any configuration that involves adding, reading, or modifying components on role processing forms must be done manually in the BPA UI.

## Steps to Reproduce

1. Call `form_query(service_id="28bf8aca-...", search_label="Select units", form_type="guide", instance="BPA-jamaica")` — returns 0 results
2. Call `form_query(service_id="28bf8aca-...", search_label="Select units", form_type="applicant", instance="BPA-jamaica")` — returns 0 results
3. Call `form_component_get(service_id="28bf8aca-...", component_key="applicationReviewingCommitteeArcDecisionEditGrid3", form_type="guide", instance="BPA-jamaica")` — error: component not found
4. The component exists — it's visible in the ARC role processing form in the BPA UI and was confirmed via DOM inspection in Playwright tests

There is no `form_type` value to target role processing forms (e.g., `form_type="processing"` or `form_type="role"`).

## Actual Behavior

```
Tool: form_query(service_id="28bf8aca-...", search_label="Select units", form_type="guide")
Response: {"components": [], "total": 0}

Tool: form_component_get(service_id="28bf8aca-...", component_key="applicationReviewingCommitteeArcDecisionEditGrid3", form_type="guide")
Response: [FORM_003] Component not found. Available keys include: ... Use form_get to see all 0 components.
```

All four supported `form_type` values were tried — none contain role processing form components.

## Expected Behavior

A `form_type` option (e.g., `"processing"` or `"role:<role_id>"`) should allow accessing the form schema of any role's processing form. This would enable:

1. **Reading** role form components (currently impossible — must use DOM inspection via Playwright)
2. **Adding** components to role forms (e.g., CI data panels with copyValueFrom)
3. **Updating** component properties on role forms (e.g., changing button `action` from "custom" to "event")
4. **Querying** role form components by label, key, type, etc.

## BPA UI Comparison

In the BPA UI, role processing forms are fully editable:
- Navigate to: `Services > [service] > Roles > [role name] > Form`
- All components are visible and editable (panels, fields, buttons, EditGrids, etc.)
- The form has its own schema separate from the applicant/guide/send_file/payment forms

The BPA REST API exposes role forms via `/services/{service_id}/roles/{role_id}` — the `formSchema` field contains the full form definition. The `role_get` MCP tool returns this data but it's read-only and comes as a massive JSON blob (325K+ chars for ARC role) with no way to query or modify individual components.

## Server Logs

No errors found in logs — the tools work correctly for their supported form types. This is a missing capability, not a bug.

## Analysis

The form tools are built around the BPA form endpoints for applicant-facing forms. Role processing forms use a different data path — they're stored in the role's `formSchema` property rather than in the service's form endpoints.

### What this blocks in practice

During CI Selective Routing implementation for Jamaica PARTB, we needed to:

1. **Add CI data panels** to 8 role processing forms (4 evals + 4 approvals) — panels showing ARC's document request and applicant's CI uploads, gated by unit determinants. **BLOCKED** — must be done manually in BPA UI for each role.

2. **Fix button action type** on ARC role — the "Request additional information" button had `action: "custom"` with empty JS instead of `action: "event"`. **BLOCKED** — had to use a Playwright workaround (`form.emit('customEvent', ...)`) instead of fixing the config.

3. **Read ARC form structure** to understand EditGrid3, radio fields, and button configurations. **BLOCKED** — had to use Playwright DOM inspection and `role_get` raw JSON parsing instead of `form_query`/`form_component_get`.

### Likely affected files

- `src/mcp_eregistrations_bpa/tools/form_tools.py` — form_type parameter validation and API routing
- `src/mcp_eregistrations_bpa/tools/role_tools.py` — role_get returns formSchema but no component-level access

## Suggested Fix

### Option A: Extend existing form tools
Add a new `form_type` value like `"role"` or `"processing"` that accepts an additional `role_id` parameter. Route these calls to the role's formSchema instead of the service's form endpoints.

```python
# Example API:
form_query(service_id="...", form_type="role", role_id="f904ea5e-...", search_label="EditGrid")
form_component_get(service_id="...", form_type="role", role_id="f904ea5e-...", component_key="...")
form_component_add(service_id="...", form_type="role", role_id="f904ea5e-...", ...)
```

### Option B: Separate role form tools
Create dedicated tools: `role_form_get`, `role_form_query`, `role_form_component_add`, `role_form_component_update`, `role_form_component_remove`.

### Option C: Minimum viable — role_form_query + role_form_component_get
Even read-only access would be a significant improvement. The `role_get` response is 325K+ chars — too large to parse efficiently. A `role_form_query` that filters components by key/label/type would solve the most common use case.
