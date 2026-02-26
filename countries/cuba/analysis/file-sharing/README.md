# File Sharing Feature — Cuba eRegistrations

## Problem
Citizens share login credentials so colleagues can manage their government procedures. No audit trail, no revocation, full account exposure.

## Solution
Email-based file delegation using the existing `allowed_users` JSONField on the File model. Owner enters an email → that user sees the file in their own dashboard with full co-ownership.

## Status: Backend DONE, Frontend NOT STARTED

### Backend (complete, uncommitted in DS-Backend)
- 9 permission/queryset gaps fixed across `models.py`, `applicant_file/views.py`, `process/views.py`
- 13 security fixes: `icontains` → `contains` (exact JSON array matching)
- 7/7 tests pass, no migrations needed
- Code changes in: `/Users/nelsonperez/Desktop/OCAgents/countries/cuba/analysis/file-sharing/workspace/DS-Backend/`

### Frontend (pending — 3 files)
- `apps/part_a/templates/parta_dashboard.html` — Share button per row
- `assets/js/user.applications.controller.js` — Email popover + API call
- `assets/js/backend.provider.js` — `shareFile()` method

### Key Endpoints
- `GET /api/v1/current-user-files/` — Dashboard listing (already shows shared files)
- `POST /api/v1/access-to-file/` — Share endpoint (already exists, tested)

## Documents
| File | Purpose |
|------|---------|
| `file-delegation-mechanism.md` | Original investigation & gap analysis |
| `file-delegation-implementation-guide.md` | Full technical guide (14 sections, 10 known bugs) |
| `api-solicitudes-reference.html` | API reference (formatted HTML, English) |
| `api-solicitudes-reference.md` | API reference (markdown) |

## Known Issues (unfixed)
- Email case sensitivity (no normalization)
- MyFilePermission grants DELETE to delegates
- Payment flow blocks delegates
- No revocation mechanism (v2)
- Notifications only go to owner (v2)

## Relevant to Agents
- **Config Agent**: May need to configure BPA service if we go the bot route
- **Test Agent**: Can write E2E tests for sharing flow once frontend is done
- **Manual Agent**: Can document the user-facing sharing workflow
- **Observer Agent**: Can monitor sharing endpoint calls in Graylog
