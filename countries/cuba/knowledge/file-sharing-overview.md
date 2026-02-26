# File Sharing — Quick Reference for Agents

## What
Email-based file delegation for Cuba eRegistrations. Owner shares a file by email → delegate sees it in their dashboard with full co-ownership.

## Why
Citizens currently share login credentials to let colleagues manage procedures. No audit trail, no revocation, security risk.

## Key API
- `POST /api/v1/access-to-file/` — Share a file (owner or staff only)
  - Payload: `{"file_id": "uuid", "allowed_users": ["email@example.com"]}`
  - Accumulates emails (set union), auto-creates users, idempotent
- `GET /api/v1/current-user-files/` — Dashboard listing (already shows shared files)

## Data Model
- Field: `File.allowed_users` — JSONField, `jsonb` in PostgreSQL, default `[]`
- Query: `Q(allowed_users__contains=[email])` → PostgreSQL `@>` operator (exact match)

## Status
- **Backend**: DONE (uncommitted in DS-Backend)
- **Frontend**: NOT STARTED (3 files: template, controller, provider)
- **Tests**: 7/7 pass
- **Migrations**: None needed

## Full Documentation
See `countries/cuba/analysis/file-sharing/` for:
- Investigation report, implementation guide, API reference, screenshots

## Agent Relevance
- **Config**: No BPA changes needed (direct frontend sharing replaces BPA service approach)
- **Test**: E2E tests for sharing flow once frontend ships
- **Manual**: Document user-facing sharing workflow
- **Observer**: Monitor `POST /api/v1/access-to-file/` calls in Graylog
