# MCP Issue: Cannot Create CI Routing Determinants for Jamaica PARTB

**Date**: 2026-03-04
**MCP Server**: `mcp-eregistrations-bpa` v0.17.3
**Instance**: BPA-jamaica
**Service**: Establish a new zone (`28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`)
**Severity**: High — Blocks CI Selective Routing automation
**Related**: `bugs/MCP-Bug-Radio-Determinant.md` (Bugs 1, 4)

---

## Context

Implementing CI (Complementary Information) selective routing for the PARTB workflow. When ARC sends a file back for additional information, only the evaluation units selected by ARC should re-activate (not all). This requires 4 new determinants.

## Blocked by 2 Known MCP Bugs

### 1. Grid determinant with catalog value match not persisted (Bug 4 variant)

**Need**: 3 grid determinants that check if SOME row in ARC's EditGrid3 has a specific **catalog value** (classification) in the "Select units that will review" column.

**Proof BPA UI works**: `a4885fdb` "CI review by business" was created via UI and works correctly:
- **Field path**: Role ARC...Block.Additional documents and information.Edit Grid.Select units that will review1
- **Where applied**: outside the grid
- **For which rows**: SOME
- **Predicate**: = (equals)
- **Value in parent catalog**: Business

```json
{
  "id": "a4885fdb-7c5f-4e74-aec9-dbc5be17d706",
  "name": "CI review by business",
  "type": "grid",
  "target_form_field_key": "applicationReviewingCommitteeArcDecisionEditGrid3"
}
```

**MCP limitation**: `griddeterminant_create` creates the grid structure but does NOT persist the catalog value match (`select_value` / "Value in parent catalog"). This was originally reported as Bug 4 (for `row_determinant_id`), but the same tool also fails to persist the catalog predicate when the grid column is a classification field.

**Determinants needed** (must create in BPA UI, same pattern as "CI review by business"):

| Name | Field | Where applied | For which rows | Predicate | Value in parent catalog |
|------|-------|---------------|----------------|-----------|------------------------|
| CI review by legal | ...EditGrid3.Select units that will review1 | outside the grid | SOME | = | Legal |
| CI review by technical | ...EditGrid3.Select units that will review1 | outside the grid | SOME | = | Technical |
| CI review by compliance | ...EditGrid3.Select units that will review1 | outside the grid | SOME | = | Compliance |

### 2. No `radiodeterminant_create` tool (Bug 1)

**Need**: 1 radio determinant that evaluates to TRUE when the ARC "additional information" field is NOT "yes" (i.e., first pass through the workflow).

**Proof BPA UI works**: `5ca586dd` "additional information = yes" was created via UI and works:
```json
{
  "id": "5ca586dd-9b45-4103-a69a-70dd2efd07c5",
  "name": "additional information = yes",
  "type": "radio",
  "operator": "EQUAL",
  "target_form_field_key": "applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditionalInformationOrSupportingDocumentationBeforeProceedingToTheNextStage",
  "select_value": "yes"
}
```

**MCP limitation**: No `radiodeterminant_create` tool exists. Using `selectdeterminant_create` on a radio field creates a `SelectDeterminant` Java object instead of `RadioDeterminant`, causing permanent corruption (ClassCastException).

**Determinant needed** (must create in BPA UI):

| Name | Type | Field | Operator | Value |
|------|------|-------|----------|-------|
| Not CI flow | radio | ARC "Does the application require additional information..." | NOT_EQUAL | yes |

**Behavior**: First pass (field empty) → empty ≠ "yes" → TRUE. CI pass (field = "yes") → FALSE.

---

## Impact

Without these 4 determinants, the 12 `role_update` calls for CI selective routing cannot be executed. The determinants must be created manually in the BPA UI, then the `role_update` calls can proceed via MCP (Step 3 of the plan).

## Not a BPA Issue

Both determinant types are fully supported by the BPA platform:
- Grid determinants with `select_value`: proven by `a4885fdb` (created via UI, works)
- Radio determinants with NOT_EQUAL: proven by `5ca586dd` and other radio dets in this service
- The BPA UI creates them correctly with proper Java class types

The limitation is exclusively in the MCP tool layer.

---

*Project: Jamaica PARTB — CI Selective Routing*
*Discovered by: Nelson Perez & Claude (Config Agent)*
