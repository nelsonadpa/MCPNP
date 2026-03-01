# Skill: Trace Dossier

## Purpose
Follow a complete dossier lifecycle through Graylog logs — from creation to current state.

## Input
- Dossier number (e.g., "ER4087")
- Optional: user who created it

## Steps
1. Search all logs containing the dossier number in `message` or `outputData`
2. Sort by timestamp ascending (chronological order)
3. Extract the sequence of bot actions (`actionName`) executed
4. Note any errors or failures in the chain
5. Identify the service(s) involved (`serviceId`, `serviceName`)
6. Check the last known state

## Output format
```markdown
## Dossier Trace: [Dossier Number]
- **User**: [username]
- **Service**: [serviceName]
- **First seen**: [timestamp]
- **Last activity**: [timestamp]

### Execution chain
| # | Timestamp | Action | Status | Notes |
|---|-----------|--------|--------|-------|
| 1 | ... | Bot LISTAR | OK | ... |
| 2 | ... | Bot INTERNO | FAIL | empty payload |

### Issues found
- [list of anomalies]
```
