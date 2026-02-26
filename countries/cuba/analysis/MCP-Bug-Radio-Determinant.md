# Bug Report: Determinant Creation and Effect Linking Issues in MCP

**Date**: 2026-02-10 (updated 2026-02-10)
**MCP Server**: `mcp-eregistrations-bpa` v0.15.0
**Severity**: High - Blocks automation of service configuration
**Bugs reported**: 5 (Bugs 1-3: radio determinant, Bugs 4-5: grid determinant)

---

## Bug 1: `selectdeterminant_create` saves wrong type for radio fields

### What was done

```python
selectdeterminant_create(
    service_id="2c91808893792e2b019379310a8003a9",
    name="status bitácora = TRUE",
    operator="EQUAL",
    target_form_field_key="applicantStatusLlegaDeLaBitacora",  # This is a RADIO field
    select_value="true"
)
```

### Result via API

```json
{
  "id": "b2e39908-f0bb-4a9c-9c81-d6ab8a83a649",
  "type": "selection",
  "select_value": "true"
}
```

### Problem

- The target field `applicantStatusLlegaDeLaBitacora` is a **radio** component
- The MCP created the determinant with `type: "selection"` instead of `type: "radio"`
- In the BPA admin UI, the Value dropdown appears **empty** (not showing "True")
- However, when editing the determinant manually in the UI, the Value dropdown DOES show "True" and "False" as options - it just wasn't saved
- **Critical**: When attempting to save the value "True" manually in the UI, the BPA backend throws a **Java ClassCastException**:

```
class org.unctad.ereg.bpa.model.determinant.RadioDeterminant cannot be cast to
class org.unctad.ereg.bpa.model.determinant.SelectDeterminant
```

This confirms:
1. The BPA backend has **separate Java classes** for `RadioDeterminant` and `SelectDeterminant`
2. The MCP's `selectdeterminant_create` instantiated a `SelectDeterminant` Java object
3. The field `applicantStatusLlegaDeLaBitacora` expects a `RadioDeterminant`
4. The cast fails at runtime - the determinant is **permanently corrupted** and cannot be fixed via the UI
5. The only resolution is to **delete** the broken determinant and recreate it with the correct type

### Expected behavior

The MCP should either:
- Detect the target field type and create the determinant with the correct type (`"radio"`)
- Or provide a `radiodeterminant_create` tool

### Available determinant types vs MCP tools

| BPA Type | MCP Tool | Status |
|---|---|---|
| `text` | `textdeterminant_create` | OK |
| `selection` | `selectdeterminant_create` | OK |
| `radio` | — | **Missing** |
| `boolean` | `booleandeterminant_create` | OK |
| `numeric` | `numericdeterminant_create` | OK |
| `date` | `datedeterminant_create` | OK |
| `classification` | `classificationdeterminant_create` | OK |
| `grid` | `griddeterminant_create` | OK |

---

## Bug 2: `effect_create` does not link the determinant to the component

### What was done

```python
effect_create(
    service_id="2c91808893792e2b019379310a8003a9",
    component_key="applicantBlock12",
    determinant_ids=["b2e39908-f0bb-4a9c-9c81-d6ab8a83a649"],
    effect_type="activate",
    effect_value=True
)
```

### Result via API

The MCP returned success:
```json
{
  "behaviour_id": "8e5523d2-41f9-43a6-b83b-a2b0c971bfc1",
  "effect_id": "cebc6104-24bc-4f5d-8b0d-e70f6efb4c88",
  "component_key": "applicantBlock12",
  "determinant_count": 1,
  "effect_type": "activate",
  "effect_value": true
}
```

### Result in BPA admin UI

The Effects tab on `applicantBlock12` shows:
- **Effects (1)** - The effect exists
- **Determinant**: "SELECT A DETERMINANT" - **Not linked**
- **Effect**: "Please select a determinant" - **Not configured**

### Result via `componentbehaviour_get_by_component`

```json
{
  "effects": [{
    "determinants": [{
      "field": "data.applicantStatusLlegaDeLaBitacora",
      "operator": "==",
      "value": ""
    }],
    "property_effects": [{"name": "activate", "value": "true"}]
  }]
}
```

The `value` is empty (`""`) and the UI shows the determinant is not selected.

### Expected behavior

After calling `effect_create` with a valid `determinant_id`, the BPA admin UI should show the determinant selected in the Effect configuration, and the behaviour should resolve the determinant's value correctly.

---

## Proposed Fix

### For Bug 1 (radio determinant type)

**Option A (Recommended)**: Add `radiodeterminant_create` tool that creates determinants with `type: "radio"`.

**Option B**: Make `selectdeterminant_create` auto-detect the target field type and use `"radio"` or `"selection"` accordingly.

**Option C**: Add an optional `determinant_type` parameter to `selectdeterminant_create`.

### For Bug 2 (effect not linking determinant)

Investigate why `effect_create` returns success but the determinant is not actually linked in the UI. Possible causes:
- The determinant type mismatch (Bug 1) may prevent the BPA from resolving the link
- Or the `effect_create` API call may not be sending the determinant reference in the correct format

**Test**: Create a radio determinant manually in the UI (correct type), then use `effect_create` to link it. If the effect works, Bug 2 is a consequence of Bug 1. If it still fails, Bug 2 is independent.

---

## Bug 3: Java ClassCastException when saving determinant value manually

### What was done

After Bug 1 created the determinant with wrong type (`selection` instead of `radio`), we attempted to fix it manually in the BPA admin UI by selecting "True" from the Value dropdown and clicking Save.

### Result

The BPA backend threw a Java exception:

```
class org.unctad.ereg.bpa.model.determinant.RadioDeterminant cannot be cast to
class org.unctad.ereg.bpa.model.determinant.SelectDeterminant
```

### Root cause

The determinant was persisted as a `SelectDeterminant` Java object in the database. When the UI sends a save request, the BPA backend tries to load it as a `RadioDeterminant` (because the target field is a radio component), and the Java cast fails.

### Impact

- The determinant created by Bug 1 is **permanently corrupted**
- It cannot be saved, updated, or fixed via the BPA admin UI
- It must be **deleted** (via MCP or API) and recreated manually as the correct type
- Any effects linked to this determinant are also broken

### Relationship between bugs

```
Bug 1 (wrong type created)
  → causes Bug 3 (ClassCastException on manual save)
  → causes Bug 2 (effect can't resolve determinant value)
```

Bug 2 and Bug 3 are **consequences of Bug 1**. Fixing Bug 1 (adding `radiodeterminant_create`) should resolve all three issues.

---

## Bug 4: `griddeterminant_create` does not link the row_determinant_id

### Context

While configuring the "Expirado" badge for the Fito EditGrid in the Bitácora, we needed to replicate the same grid determinant pattern used by Permiso Eventual.

**PE reference** (working, created via UI):
- Grid determinant `2b43313a` ("Vigencia permiso eventual < hoy") → targets `applicantEditGrid`
- Row determinant `73879ced` ("Row determinant in Vigencia permiso eventual < hoy") → targets `applicantEditGrid_collection_applicantExpiracion`, operator: `LESS_THAN`, `isCurrentDate: true`

### What was done

**Step 1**: Created the row date determinant (this worked correctly):

```python
datedeterminant_create(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    name="Row determinant in Vigencia fito < hoy",
    target_form_field_key="applicantEditGridFito_collection_applicantExpiracionFito",
    operator="LESS_THAN",
    is_current_date=True
)
# Result: id="fa1f7425-e539-47d0-a99b-62b45116eaf1" ✅ Created correctly
```

**Step 2**: Created the grid determinant referencing the row determinant:

```python
griddeterminant_create(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    name="Vigencia fito < hoy",
    target_form_field_key="applicantEditGridFito",
    row_determinant_id="fa1f7425-e539-47d0-a99b-62b45116eaf1"
)
```

### Result

```json
{
  "id": "6bacdc42-b314-469c-adf0-145450dab922",
  "name": "Vigencia fito < hoy",
  "type": "grid",
  "target_form_field_key": "applicantEditGridFito",
  "determinant_inside_grid": true,
  "row_determinant_id": null,   // ← BUG: should be "fa1f7425-..."
  "service_id": "ffe746aac09241078bad48c9b95cdfe0"
}
```

### Problem

- The `row_determinant_id` is `null` in the response — the link was NOT saved
- The PE reference grid determinant `2b43313a` has `rowDeterminantId: "73879ced..."` (confirmed via service export)
- Without the row determinant link, the grid determinant cannot evaluate per-row conditions
- The grid determinant is **broken** — it exists but has no evaluation logic

### Expected behavior

`griddeterminant_create` should persist the `row_determinant_id` so the grid determinant can evaluate its row-level condition for each row of the EditGrid.

---

## Bug 5: `effect_create` does not link determinant to component (grid determinant case)

### What was done

```python
effect_create(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    component_key="applicantExpiradoFito",
    determinant_ids=["6bacdc42-b314-469c-adf0-145450dab922"],
    effect_type="activate",
    effect_value=True
)
```

### Result

MCP returned success:
```json
{
  "behaviour_id": "bf72c10d-984b-4a17-8fc5-9771d347dbf6",
  "effect_id": "e73a1b38-f941-4e2c-a334-1f96727fe8d0",
  "component_key": "applicantExpiradoFito",
  "determinant_count": 1,
  "effect_type": "activate",
  "effect_value": true
}
```

### Verification via API

```python
componentbehaviour_get_by_component(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    component_key="applicantExpiradoFito"
)
```

Result:
```json
{
  "id": "bf72c10d-984b-4a17-8fc5-9771d347dbf6",
  "component_key": "applicantExpiradoFito",
  "effects": []   // ← BUG: empty, should contain the effect with determinant
}
```

### Problem

- Same pattern as Bug 2: `effect_create` returns success but the effect is not actually linked
- The behaviour exists (`bf72c10d`) but has **zero effects** inside
- This is likely caused by Bug 4 (broken grid determinant with null row_determinant_id)
- The BPA backend may reject the effect silently because the grid determinant is incomplete

### Relationship between Bug 4 and Bug 5

```
Bug 4 (griddeterminant_create doesn't save row_determinant_id)
  → Grid determinant is incomplete/broken
  → Bug 5 (effect_create can't link to broken determinant)
```

Bug 5 is likely a **consequence of Bug 4**. Fixing Bug 4 should resolve Bug 5.

### PE reference (working)

The PE `applicantExpirado` button has:
```json
{
  "effects": [{
    "determinants": [{"type": "OR", "determinantId": "2b43313a-..."}],
    "property_effects": [
      {"name": "disabled", "value": "false"},
      {"name": "show", "value": "true"},
      {"name": "activate", "value": "true"}
    ]
  }]
}
```

This works because the PE grid determinant `2b43313a` has its `rowDeterminantId` correctly linked.

---

## Summary of all bugs

| Bug | Tool | Problem | Root cause | Status |
|---|---|---|---|---|
| 1 | `selectdeterminant_create` | Creates `selection` type instead of `radio` | Missing `radiodeterminant_create` tool | Open |
| 2 | `effect_create` | Effect not linked (radio det case) | Consequence of Bug 1 | Open |
| 3 | BPA UI | ClassCastException on manual save | Consequence of Bug 1 | Open |
| 4 | `griddeterminant_create` | `row_determinant_id` saved as null | MCP doesn't persist the row reference | **NEW** |
| 5 | `effect_create` | Effect not linked (grid det case) | Consequence of Bug 4 | **NEW** |

---

## Temporary Workaround

1. **Delete** the broken determinant and effect via MCP (`determinant_delete` + `effect_delete`)
2. Create the radio determinant **manually in the BPA admin UI** (this creates the correct `RadioDeterminant` Java class)
3. Create the effect **manually in the BPA admin UI** (link determinant to block)
4. Use MCP to verify the result: `componentbehaviour_get_by_component(service_id, component_key)`

---

## Test Data

### Bugs 1-3 (Radio determinant — Fitosanitario service)

| Item | ID |
|---|---|
| Service (Fitosanitario) | `2c91808893792e2b019379310a8003a9` |
| Determinant created | `b2e39908-f0bb-4a9c-9c81-d6ab8a83a649` |
| Effect/Behaviour created | `8e5523d2-41f9-43a6-b83b-a2b0c971bfc1` |
| Target component | `applicantBlock12` |
| Target field | `applicantStatusLlegaDeLaBitacora` (radio) |

These objects were **corrupted** and have been **deleted** (cleanup done).

### Bugs 4-5 (Grid determinant — Bitácora service)

| Item | ID |
|---|---|
| Service (Bitácora) | `ffe746aac09241078bad48c9b95cdfe0` |
| Row date determinant (OK) | `fa1f7425-e539-47d0-a99b-62b45116eaf1` |
| Grid determinant (BROKEN, row_det=null) | `6bacdc42-b314-469c-adf0-145450dab922` |
| Effect/Behaviour (BROKEN, effects=[]) | `bf72c10d-984b-4a17-8fc5-9771d347dbf6` |
| Target component | `applicantExpiradoFito` (button badge) |
| Target EditGrid | `applicantEditGridFito` |
| Row target field | `applicantEditGridFito_collection_applicantExpiracionFito` |

These objects are **broken** and need cleanup before retesting.

### Cleanup required

**Bugs 1-3** (already cleaned up):
```python
# These were already deleted in a previous session
effect_delete(behaviour_id="8e5523d2-41f9-43a6-b83b-a2b0c971bfc1")  # ✅ Done
determinant_delete(service_id="2c91808893792e2b019379310a8003a9",
    determinant_id="b2e39908-f0bb-4a9c-9c81-d6ab8a83a649")  # ✅ Done
```

**Bugs 4-5** (pending cleanup):
```python
# Delete the broken effect first
effect_delete(behaviour_id="bf72c10d-984b-4a17-8fc5-9771d347dbf6")

# Delete the broken grid determinant
determinant_delete(
    service_id="ffe746aac09241078bad48c9b95cdfe0",
    determinant_id="6bacdc42-b314-469c-adf0-145450dab922"
)

# The row date determinant (fa1f7425) is valid and can be reused once grid det is fixed
# Do NOT delete: fa1f7425-e539-47d0-a99b-62b45116eaf1
```

---

*Discovered by: Nelson Perez & Claude (AI assistant)*
*Project: VUCE Cuba BPA - Fitosanitario/Bitácora service connection*
