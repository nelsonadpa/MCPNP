# Service Health Check

Quick health assessment of an eRegistrations service by analyzing its recent Graylog logs.

**Requires**: Graylog MCP connection.

## Input

Provide a service ID or service name. Optionally specify a time range (default: 24h).

## Steps

1. Search logs by `serviceId` or `serviceName` for the given time range
2. Count total log entries (volume)
3. Search for errors (`level:ERROR` within the service)
4. Search for failed bots (`"status":false`)
5. Search for empty payloads (`"Input payload is empty"`)
6. List unique `actionName` values seen (which bots ran)
7. List unique `user` values (who used it)

## Output format

```markdown
## Service Health: [Service Name]
- **Period**: [time range]
- **Total logs**: [count]
- **Errors**: [count] ([percentage])
- **Failed bots**: [count]
- **Empty payloads**: [count]
- **Active bots**: [list of actionName]
- **Active users**: [list of users]
- **Status**: HEALTHY / WARNING / CRITICAL
```

## Status criteria

- **HEALTHY**: 0 errors, 0 failed bots
- **WARNING**: <5% error rate OR any empty payloads
- **CRITICAL**: >5% error rate OR >10 failed bots

$ARGUMENTS
