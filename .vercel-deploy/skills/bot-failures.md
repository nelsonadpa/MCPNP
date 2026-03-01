# Bot Failure Report

Find all bot failures across services and generate a diagnostic report.

**Requires**: Graylog MCP connection.

## Input

Optionally provide a time range (default: 24h) and/or a specific service ID to narrow scope.

## Steps

1. Search for `"status":false` in messages
2. Search for `"Input payload is empty"` in messages
3. Search for `level:ERROR`
4. Group failures by `actionName` (which bot failed)
5. Group by `serviceId` (which service was affected)
6. Count occurrences per bot
7. Check if failures are intermittent or consistent

## Output format

```markdown
## Bot Failure Report — [date]
- **Period**: [time range]
- **Total failures**: [count]

### By bot (most failures first)
| Bot Name | Service | Failures | Type | Pattern |
|----------|---------|----------|------|---------|
| X LISTAR | Bitacora | 12 | empty payload | consistent |

### By service
| Service | Total Failures | Affected Bots |
|---------|---------------|---------------|
| Bitacora | 15 | 3 bots |

### Recommendations
- [actionable items]
```

$ARGUMENTS
