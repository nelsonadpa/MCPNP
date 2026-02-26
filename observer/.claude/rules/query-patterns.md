# Query Patterns — Observer Agent

## Standard queries

### All logs for a service
```
serviceId:"<service-uuid>"
```

### Bot executions by name
```
actionName:"<bot-name>"
```

### Failed bots (status false)
```
message:"\"status\":false"
```

### Empty input bots
```
message:"Input payload is empty"
```

### Errors only
```
level:ERROR OR level:CRITICAL OR level:FATAL
```

### User activity
```
user:"<username>"
```

### Specific dossier
```
message:"<dossier-number>"
```

## Time ranges
- Quick check: `1h`
- Daily review: `24h`
- Weekly trend: `7d`
- Deep investigation: `30d`

## Field selection for efficiency
- Overview: `["message", "level", "source", "actionName", "serviceId"]`
- Debug: `["message", "outputData", "actionName", "actionId", "user"]`
- Errors: `["message", "level", "source", "timestamp"]`
