# Skill: Bot Failure Report

## Purpose
Find all bot failures across services and generate a diagnostic report.

## Input
- Time range (default: 24h)
- Optional: specific service ID to narrow scope

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
| X LISTAR | Bitácora | 12 | empty payload | consistent |

### By service
| Service | Total Failures | Affected Bots |
|---------|---------------|---------------|
| Bitácora | 15 | 3 bots |

### Recommendations
- [actionable items]
```
