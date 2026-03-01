# Correlate E2E Tests with Backend Logs

After running an E2E test, find the corresponding Graylog logs to verify backend behavior or diagnose failures.

**Requires**: Graylog MCP connection.

## Input

Provide:
- Test execution timestamp (approximate)
- Service being tested (ID or name)
- Username used in test (e.g., "nelson")
- Optional: specific bot/action expected

## Steps

1. Search logs around the test timestamp (±5 minutes)
2. Filter by `user` and `serviceId`
3. Reconstruct the bot execution chain triggered by the test
4. Check for any errors or unexpected behavior
5. Compare expected bot sequence vs actual

## Output format

```markdown
## Test-Log Correlation
- **Test**: [test name]
- **Time window**: [start] — [end]
- **User**: [username]
- **Service**: [serviceName]

### Bot executions during test
| Timestamp | Action | Status | Duration |
|-----------|--------|--------|----------|
| ... | ... | OK/FAIL | ... |

### Verdict
- [MATCH: all expected bots ran successfully]
- [MISMATCH: bot X didn't execute / failed]
```

$ARGUMENTS
