# Request: PE Baseline + Query Setup

**From**: Orchestrator
**To**: Observer Agent (Tracker)
**Date**: 2026-02-26
**Mission**: PE E2E (Fase 0)
**Priority**: HIGH

## What I need

### 0.5 — PE Log Baseline
Run these queries against Graylog and document the results:

1. **Volume check (24h)**:
   - `serviceId:"2c918084887c7a8f01887c99ed2a6fd5"` — how many PE logs in last 24h?
   - `serviceName:"Bitácora" AND actionName:*eventual*` — Bitácora-side PE activity?

2. **Error check (7d)**:
   - `serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false"` — any failed bots?
   - `message:"Input payload is empty" AND actionName:*PE*` — empty payloads?

3. **Bot inventory**:
   - List all unique `actionName` values seen for PE in last 7 days
   - Note which bots are active vs silent

4. **User activity**:
   - Who has used PE recently? List unique `user` values.

### 0.6 — Save Queries
Document all queries in `observer/queries/pe-queries.md` so they're reusable.

## Context
- PE Service ID: `2c918084887c7a8f01887c99ed2a6fd5`
- Bitácora Service ID: `ffe746aac09241078bad48c9b95cdfe0`
- Known bots: INTERNO Nuevo (`6603eb75`), INTERNO Modificar (`c88be29b`), LISTAR GDB (`b94c62ab`)
- Graylog fields: serviceId, serviceName, actionName, user, message, level

## When done
Respond in `shared/responses/observer-orchestrator_001.md` with the baseline report.
