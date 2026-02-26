# Always Changelog Rule — Config Agent

## RULE
After EVERY create, update, or delete operation via MCP or REST API, immediately add an entry to:
`~/Desktop/OCAgents/shared/knowledge/CHANGELOG.md`

## Format
```
### YYYY-MM-DD | [Service] ([service_id]) | [Change]
- What was changed
- Why
- IDs created/modified/deleted
- Status: OK / NEEDS_CLEANUP / NEEDS_RETEST
```

## State values
- **OK**: Change applied successfully, verified
- **NEEDS_CLEANUP**: Something went wrong, needs manual fix or deletion
- **NEEDS_RETEST**: Change applied but not verified via E2E test yet

## When to skip
Never. Even failed operations should be logged with what happened and why.
