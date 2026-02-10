# Bug Report: Two Issues with Radio Determinants and Effects in MCP

**Date**: 2026-02-10
**MCP Server**: `mcp-eregistrations-bpa` v0.15.0
**Severity**: High - Blocks automation of service configuration

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

## Temporary Workaround

1. **Delete** the broken determinant and effect via MCP (`determinant_delete` + `effect_delete`)
2. Create the radio determinant **manually in the BPA admin UI** (this creates the correct `RadioDeterminant` Java class)
3. Create the effect **manually in the BPA admin UI** (link determinant to block)
4. Use MCP to verify the result: `componentbehaviour_get_by_component(service_id, component_key)`

---

## Test Data

| Item | ID |
|---|---|
| Service (Fitosanitario) | `2c91808893792e2b019379310a8003a9` |
| Determinant created | `b2e39908-f0bb-4a9c-9c81-d6ab8a83a649` |
| Effect/Behaviour created | `8e5523d2-41f9-43a6-b83b-a2b0c971bfc1` |
| Target component | `applicantBlock12` |
| Target field | `applicantStatusLlegaDeLaBitacora` (radio) |

These objects are **corrupted** and should be deleted before retesting.

### Cleanup required

```python
# Delete the broken effect first (depends on determinant)
effect_delete(behaviour_id="8e5523d2-41f9-43a6-b83b-a2b0c971bfc1")

# Then delete the broken determinant
determinant_delete(
    service_id="2c91808893792e2b019379310a8003a9",
    determinant_id="b2e39908-f0bb-4a9c-9c81-d6ab8a83a649"
)
```

---

*Discovered by: Nelson Perez & Claude (AI assistant)*
*Project: VUCE Cuba BPA - Fitosanitario service connection*
