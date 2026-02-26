# Skill: Change Detection Between Service Versions

## When to use
When detecting what changed in a service between two points in time, or comparing a service across instances (e.g. Cuba vs Colombia vs Jamaica).

## Process

### 1. Get current snapshot
Extract the complete service structure via MCP.

### 2. Compare with previous snapshot
If a previous snapshot exists in `extractions/`:
- Diff components (added, removed, modified)
- Diff determinants (added, removed, value changes)
- Diff bots (added, removed, mapping changes)
- Diff roles (added, removed, order changes)

### 3. Compare across instances
```
# Instance A
service_get(service_id_A) via MCP BPA-instance-A
form_get(service_id_A) via MCP BPA-instance-A

# Instance B (if equivalent service exists)
service_get(service_id_B) via MCP BPA-instance-B
form_get(service_id_B) via MCP BPA-instance-B
```

### 4. Report format
```markdown
# Change Report: [Service]
## Period: [from] → [to] (or Instance A vs Instance B)

### Added
- [new component/determinant/bot]

### Removed
- [deleted component/determinant/bot]

### Modified
- [what changed and from what to what]

### Impact
- [which user flows are affected]
```

## Common mistakes
- Determinant changes may not reflect immediately if the service hasn't been republished
- Cross-instance comparison requires matching by name/type, not by ID (IDs differ)
- Some changes are cosmetic (label) vs functional (behaviourId, mappings)
