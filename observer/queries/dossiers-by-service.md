# Dossiers Processed by Service

## Graylog Query
```
source:eregistrations AND message:/dossier.*creat|submit|process/i
```

## Time Range
Last 7 days (relative)

## Fields to Extract
- timestamp
- message
- facility (maps to service)
- source

## Usage
Run from Observer agent:
"Search Graylog for dossier processing activity in the last 7 days, group by service"

## Expected Output
Count of dossiers created/submitted/processed per service.
Useful for volume tracking and service health.
