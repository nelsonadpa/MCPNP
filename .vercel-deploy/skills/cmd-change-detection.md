# Change Detection Between Service Versions

Detect what changed in a service between two points in time, or compare a service across instances.

**Requires**: BPA MCP connection (read-only access is sufficient).

## Input

Provide one of:
- A service ID + two dates/snapshots to compare over time
- Two service IDs on different instances to compare cross-instance

## Process

### 1. Get current snapshot
Extract the complete service structure via MCP:
```
service_get(service_id, instance=INSTANCE)
form_get(service_id, instance=INSTANCE)
determinant_list(service_id, instance=INSTANCE)
bot_list(service_id, instance=INSTANCE)
role_list(service_id, instance=INSTANCE)
```

### 2. Compare with previous snapshot
If a previous snapshot exists in the knowledge base:
- Diff components (added, removed, modified)
- Diff determinants (added, removed, value changes)
- Diff bots (added, removed, mapping changes)
- Diff roles (added, removed, order changes)

### 3. Compare across instances
Match by service NAME, not ID (IDs differ between instances).

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

## Notes
- Determinant changes may not reflect immediately if the service hasn't been republished
- Some changes are cosmetic (label) vs functional (behaviourId, mappings)

$ARGUMENTS
