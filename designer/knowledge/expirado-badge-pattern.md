# Design Pattern: Expirado Badge (Expiration Visual Indicator)

**Status**: Proven — implemented in PE, replicable across services
**Origin**: Cuba Bitacora services
**Date**: 2026-02-10

---

## Problem Statement

In services that display a list of permits/registrations in an EditGrid, each row has an expiration date. Users need a visual indicator (badge) to quickly identify expired items without checking dates manually.

---

## Pattern: 3-Object Determinant Chain

The badge requires exactly 3 objects chained together:

```
Row Date Determinant → Grid Determinant → Effect on Badge Component
```

### 1. Row Date Determinant (type: date)
- Lives **inside the same EditGrid** as the expiration date field
- Operator: `LESS_THAN` current date
- Target: the expiration date field key (e.g., `applicantExpiracion`, `applicantHasta`)
- Evaluates per-row: TRUE when that specific row's date is in the past

### 2. Grid Determinant (type: grid)
- Wraps the row determinant
- Target: the EditGrid component itself
- Condition: uses the row determinant's result
- Bridges per-row evaluation to component-level activation

### 3. Effect (activate: true)
- Links the grid determinant to the badge component (e.g., `applicantExpirado`)
- Badge component default: `activate: false` (hidden by default)
- When effect fires: badge becomes visible on expired rows only

---

## Design Decisions

### Why 3 objects instead of 1?
BPA's determinant system doesn't support "per-row conditional visibility" directly. The chain solves this:
- Row determinant handles the per-row date comparison
- Grid determinant aggregates to the component level
- Effect applies the visual change

### Why `activate: false` default?
The badge should only appear when expired. Setting default to hidden means the effect only needs to show it (activate=true), not hide it. Simpler logic, fewer edge cases.

---

## Variants by Service

| Service | Date Field Key | Notes |
|---------|---------------|-------|
| PE (reference) | `applicantExpiracion` | Standard pattern |
| Fitosanitario | `applicantHasta` | Same pattern, different key |
| Zoosanitario | `applicantHasta` | Same as Fito |
| Sanitario | `fecha solicitud` | Uses request date, not expiration |
| Donativos | `fecha` | Simplified key |

> **Design note**: The field key inconsistency across services is a known technical debt. The pattern is identical — only the target field key varies.

---

## Anti-Pattern: Skipping the Grid Determinant

If you try to link a row determinant directly to an effect, BPA will either:
- Apply it to ALL rows (not per-row)
- Fail silently

The grid determinant wrapper is **mandatory** for per-row behavior.

---

## Known Limitations

- All 3 objects must be created manually in BPA UI (MCP bugs prevent automation)
- After manual creation, the effect CAN be linked via `effect_create` MCP tool
- See Config Agent's execution guides for step-by-step procedures

---

## Related Patterns
- `bitacora-connection-model.md` — EditGrid configuration for service lists
- `rosetta-stone.md` — Component type terminology mapping
