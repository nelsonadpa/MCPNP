# Bot Errors — Last 24 Hours

## Graylog Query
```
source:eregistrations AND level:3 AND message:/bot.*error|exception/i
```

## Time Range
Last 24 hours (relative)

## Fields to Extract
- timestamp
- message
- source
- facility (service name)
- full_message (stack trace)

## Usage
Run from Observer agent:
"Search Graylog for bot errors in the last 24 hours"

## Expected Output
List of bot execution failures with timestamps and error details.
Useful for daily health check.
