# Trace Dossier Lifecycle

Follow a complete dossier (expediente/solicitud) through its lifecycle using Graylog logs — from creation to current state.

**Requires**: Graylog MCP connection.

## Input

Provide a dossier number (e.g., "ER4087"). Optionally specify the user who created it.

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

$ARGUMENTS
