# Skill: Create Determinants, Behaviours, and Effects

## When to use
When creating conditional logic in a service: a determinant that controls block visibility, or a badge that indicates status.

## Determinant types

| Type | MCP Tool | Status | Workaround |
|------|----------|--------|------------|
| Boolean | `booleandeterminant_create` | OK | — |
| Numeric | `numericdeterminant_create` | OK | — |
| Text | `textdeterminant_create` | OK | — |
| Select | `selectdeterminant_create` | BUGGY (radio) | REST `/radiodeterminant` |
| Radio | N/A | NOT AVAILABLE | REST `/radiodeterminant` |
| Grid | `griddeterminant_create` | BUGGY | REST `/griddeterminant` |
| Date | `datedeterminant_create` | BUGGY (inside grid) | REST inline in grid |

## Complete workflow (3 steps)

### Step 1: Create Determinant

**Via MCP** (only boolean, numeric, text):
```
booleandeterminant_create(service_id, name, target_form_field_key, operator, value, business_key)
```

**Via REST API** (radio, grid, date):
See `shared/knowledge/bpa-rest-api.md` and skill `fix-determinant-effects`.

### Step 2: Create Behaviour + Effect

**Via MCP** (`effect_create` — this works correctly):
```
effect_create(service_id, component_key, determinant_id, effect_type="activate")
```
Note: `effect_create` creates the behaviour automatically. Returns behaviour_id and effect_id.

**Via REST API** (if MCP fails):
```
POST /bparest/bpa/v2016/06/service/{serviceId}/behaviour
Body: { componentKey, effects: [{ jsonDeterminants, propertyEffects }] }
```

### Step 3: Link to component

**ALWAYS required** after creating the behaviour:
```
form_component_update(service_id, component_key, updates={
  "behaviourId": "{behaviourId}",
  "effectsIds": ["{effectId}"]
})
```

### Step 4: Verify
```
form_component_get(service_id, component_key) → verify behaviourId != null
componentbehaviour_get_by_component(service_id, component_key) → verify effects
```

## Common patterns

### StatusBitacora (radio = TRUE → activate block)
- Determinant: radio, target=`applicantStatusLlegaDeLaBitacora`, operator=EQUAL, value="true"
- Effect: activate the block containing the service form
- Target block varies per service — see `shared/knowledge/statusbitacora-mapping.md`

### Expirado Badge (grid + date < today → activate badge)
- Grid determinant on editGrid, with row determinant type date < currentDate
- Target: badge column of the editGrid
- See inventory in skill `fix-determinant-effects`

## Common mistakes
- DO NOT use `selectdeterminant_create` for radio fields — creates wrong Java class
- DO NOT create grid/date determinants via MCP — row_determinant_id ends up null
- ALWAYS call `form_component_update` after creating behaviour — without this it won't render
- ALWAYS verify with `form_component_get` that behaviourId is not empty
- ALWAYS log in shared/knowledge/CHANGELOG.md
