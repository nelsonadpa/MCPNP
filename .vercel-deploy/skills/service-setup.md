# Skill: Full Service Setup (Connect to Bitacora)

## When to use
When connecting a new service to the Bitacora hub. This skill is the complete workflow combining determinant-config + bot-config.

## Prerequisites
1. Destination service must exist and have `applicantStatusLlegaDeLaBitacora` (radio field)
2. Verify the destination service's component keys: NIT, Empresa, QueQuiereHacer
3. Verify which block should activate when StatusBitacora = TRUE
4. Check `shared/knowledge/SERVICES-MAP.md` for correct IDs

## Complete workflow (8 steps)

### Step 1: StatusBitacora determinant + behaviour
In the **destination service**:
- Create radio determinant: StatusBitacora = TRUE
- Create behaviour: activate the correct block
- Link behaviourId to the component
- See skill `determinant-config.md`

### Step 2: "Su empresa seleccionada" panel
In the **destination service**:
- Create panel with content showing mustache templates
- `{{data.[empresaKey]}}` and `{{data.[nitKey]}}`
- Verify keys with `shared/knowledge/SERVICES-MAP.md`

### Step 3: Bot INTERNO (Bitacora → service)
In the **Bitacora**:
- Create internal bot pointing to destination service
- Input mappings: NIT, Empresa, StatusBitacora, checkbox tipo, counter
- See skill `bot-config.md`

### Step 4: Bot LISTAR (query registrations)
In the **Bitacora**:
- Create data bot pointing to the service's GDB
- Input: applicantNit5 → query_child_NIT
- Output: count, number, date, status

### Step 5: Component Actions
In the **Bitacora**:
- "Agregar [service]" button → Bot INTERNO
- EditGrid panel → Bot LISTAR
- See skill `bot-config.md` for the componentActionId checklist

### Step 6: EditGrid in Block22/Block4
In the **Bitacora**:
- Create EditGrid with dropdown (Modificar, Cancelar) and columns (Tipo, Numero, Expiracion, Expirado)
- CSS: `datagrid-hide-column-label deactivated` on badge column

### Step 7: Expirado Badge
In the **Bitacora**:
- Create grid+date determinant (date < today)
- Create behaviour activating badge column
- **MANUAL in BPA UI** — MCP bugs 4-5-6

### Step 8: Verify everything
```
form_component_get → behaviourId, componentActionId
bot_validate → correct mappings
componentbehaviour_get_by_component → correct effects
```

## CHANGELOG
ALWAYS log each step in `shared/knowledge/CHANGELOG.md` with format:
```
### YYYY-MM-DD | [Service] | [Change]
- What was changed
- IDs created
- Status: OK / NEEDS_CLEANUP / NEEDS_RETEST
```

## Common mistakes
- DO NOT copy IDs from memory — always verify with `service_list` or `SERVICES-MAP.md`
- The StatusBitacora target block is DIFFERENT per service — never assume Block12
- NIT/Empresa field keys are DIFFERENT per service — see the field key mapping table
- Expirado badges CANNOT be created via MCP — use BPA UI or REST API
