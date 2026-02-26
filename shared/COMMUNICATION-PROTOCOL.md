# Inter-Agent Communication Protocol

## Directory
~/Desktop/OCAgents/shared/

## Structure
- profiles/    — Agent profiles (what I do, what I know, what I need)
- requests/    — Active inter-agent requests
- requests/archive/ — Completed requests
- responses/   — Active responses
- responses/archive/ — Consumed responses
- knowledge/   — Shared documents

## Request Format
File: `requests/[from]→[to]_NNN.md`

```
# Request: config→manual_001
## Date: 2026-02-22
## Service: CENASA (ID: 2c91809095d83aac0195de8f880f03cd)
## Need: Complete form structure with component keys and paths
## Expected format: markdown
## Priority: high
```

## Response Format
File: `responses/[from]-[to]_NNN.md`

```
# Response: manual-config_001
## Date: 2026-02-22
## Re: request config→manual_001
## Data:
[structured content — JSON or markdown]
## Notes: [additional context]
```

## Archiving
When a request has been answered and the response consumed:
- Move request to `requests/archive/`
- Move response to `responses/archive/`
- Numbering continues from the last number (e.g. next is `_002`)
- This prevents agents from re-processing completed requests at session start

## Changelog Format
File: `knowledge/CHANGELOG.md`

```
### YYYY-MM-DD | Service | Change
- What was changed
- Why
- IDs created/modified
- Status: OK / NEEDS_CLEANUP / NEEDS_RETEST
```

## Notification System (notify.sh)

Script: `shared/notify.sh` — file-based signal system for inter-agent notifications.

### Commands
```bash
# Check pending messages for an agent
shared/notify.sh check <agent-name>

# Signal that a response is ready (PostToolUse hook does this automatically)
shared/notify.sh signal <target-agent> <from-agent> <filename> [RESPONSE|REQUEST]

# Wait until a response exists (polling, configurable timeout)
shared/notify.sh wait <agent-name> <request-id> [timeout-seconds]

# Mark messages as read
shared/notify.sh clean <agent-name>
```

### Automated flow
1. **SessionStart**: Each agent runs `notify.sh check <my-name>` + `clean` at startup
2. **PostToolUse**: When an agent writes to `shared/responses/`, the hook automatically signals the target agent
3. **Polling (optional)**: An agent can use `notify.sh wait test 001 300` to wait up to 5 min for a response

### Complete cycle example
```
Test Agent writes → shared/requests/test→manual_002.md
Test Agent runs   → notify.sh signal manual test "test→manual_002" REQUEST
Manual Agent starts → notify.sh check manual → sees pending REQUEST
Manual Agent responds → shared/responses/manual-test_002.md
  (PostToolUse hook automatically runs notify.sh signal test manual ...)
Test Agent starts → notify.sh check test → sees RESPONSE ready
Test Agent reads the response and generates tests
When completed → both files are moved to archive/
```

## Rules
1. Sequential numbering: _001, _002, _003...
2. One request per file
3. Respond within 1 session (don't leave requests unanswered)
4. If you can't respond, write a response explaining why
5. All agents read CHANGELOG.md at the start of each session
6. PostToolUse hooks send automatic signals when writing to responses/
7. Completed requests are archived in `archive/` to avoid re-processing
