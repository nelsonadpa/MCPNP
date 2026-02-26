# Evidence First Rule — Observer Agent

## RULE
Every claim must be backed by log evidence. Never say "the bot works" or "the bot is broken" without showing the actual log entry.

## When reporting
1. Include the Graylog query used
2. Show the relevant log fields (timestamp, serviceId, actionName, message)
3. Include count/totals for context (e.g., "3 errors out of 150 executions")
4. Note the time range searched

## When debugging
1. Start with the error logs (`level:ERROR`)
2. Then search for the specific bot/action that failed
3. Correlate with the full execution chain (look at same `actionId`)
4. Check if the same error happened before (expand time range)
