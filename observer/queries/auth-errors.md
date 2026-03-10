# Authentication & CAS Errors

## Graylog Query
```
source:eregistrations AND (message:/CAS|authentication|login.*fail|unauthorized/i) AND level:<=4
```

## Time Range
Last 24 hours (relative)

## Fields to Extract
- timestamp
- message
- source
- remote_addr (if available)

## Usage
Run from Observer agent:
"Search Graylog for authentication failures in the last 24 hours"

## Expected Output
List of failed login attempts and CAS errors.
Useful for security monitoring and user access issues.
