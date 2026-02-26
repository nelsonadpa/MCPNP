# File Delegation Mechanism — Investigation & Implementation

## Executive Summary

The DS-Backend has a production-ready endpoint for email-based file sharing (`POST /api/v1/access-to-file/`). The listing filter already includes `allowed_users`. However, 9 permission checks across the codebase only looked at `file.user`, blocking delegates from full co-ownership. All 9 gaps have been patched.

---

## 1. The Endpoint

**URL**: `POST /api/v1/access-to-file/`
**Source**: `apps/api/views.py:291-317`

### Payload

```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "allowed_users": ["delegate@example.com"]
}
```

### Auth & Permissions

- JWT Bearer token required (`@login_required`)
- Caller must be: Staff **OR** Superuser **OR** File Owner
- Decorator: `@staff_or_superuser_or_file_owner_required` (`decorators.py:41-68`)

### Behavior

1. Validates payload via `PartAFileAccessSerializer` (`api/serializers.py:4-6`)
2. Looks up File by UUID — **404** if not found
3. Validates each email — **400** if malformed
4. **Auto-creates User accounts** for unknown emails (`serializers.py:330-332`)
5. Merges via **set union** — no duplicates (`views.py:311`)
6. Returns **200** with updated list

### Responses

| Status | Condition |
|--------|-----------|
| 200 | Success — `{"allowed_users": [...]}` |
| 400 | Bad JSON, invalid email, non-list |
| 403 | Not staff/superuser/owner |
| 404 | File not found |

### Idempotency

Safe. Repeated calls accumulate emails (set union). No removal mechanism exists.

---

## 2. Bot Authentication

Bots get JWT via **OAuth2 client credentials** (`utils/auth_service.py:347-351`). The JWT contains a `"bot"` role, which `sync_user_roles()` translates to `is_staff=True, is_superuser=True` (`profile/backends.py:139-141`).

A bot calling `POST /api/v1/access-to-file/` passes the `is_staff` check automatically. **No special integration needed.**

---

## 3. Recipient Access by File State

### 3a. Draft Files (state: NEW)

| Action | Works | Notes |
|--------|-------|-------|
| See in "My Applications" | Yes | `_build_base_file_filters` has no state filter |
| Open detail | Yes | `has_file_access()` doesn't check state |
| Edit form | Yes | No state restriction in `FileDataViewSet` |
| Upload documents | Yes | After gap fix in `DocumentViewSet.create` |
| Submit file | Yes | `start_camunda_processing` — ownership preserved after fix |

**Critical fix applied**: `start_camunda_processing` no longer overwrites `file.user` when a delegate submits. Only sets user on first-time submission (anonymous/demo mode).

### 3b. In-Process Files (state: IN_PROCESS)

| Action | Works | Notes |
|--------|-------|-------|
| See in dashboard | Yes | Listing filters include `allowed_users` |
| View form data | Yes | File is locked, but readable |
| View documents | Yes | All document ViewSets patched |
| View certificates | Yes | Permission classes + queryset filters |
| Upload docs (after sent-back) | Yes | `DocumentViewSet.create` patched |
| Receive WebSocket updates | **No** | Only `file.user` gets real-time updates (v2) |
| Receive email notifications | **No** | Only `file.user` gets emails (v2) |

### 3c. Completed Files

| Action | Works | Notes |
|--------|-------|-------|
| View certificates | Yes | `CertificateViewSet`, `UserCertificateViewSet` already had filters |
| Download certificates | Yes | `MyCertDocumentPermission` checks `allowed_users` |
| View documents | Yes | `DocumentViewSet` queryset already had filter |
| Combined docs+certs listing | Yes | `UserCertificateDocumentViewSet` patched |

---

## 4. Gaps Fixed (9 total)

### Critical (blocks delegation)

| # | Fix | File | Line |
|---|-----|------|------|
| 1 | Prevent ownership transfer on re-submission | `applicant_file/models.py` | 112 |
| 2 | `MyFilePermission`: check `allowed_users` for File objects | `applicant_file/views.py` | 68-71 |
| 3 | `FileViewSet.get_queryset`: add `allowed_users` | `applicant_file/views.py` | 206-208 |
| 4 | `UserFileViewSet.get_queryset`: add `allowed_users` (both branches) | `applicant_file/views.py` | 528-540 |
| 5 | `DocumentViewSet.create`: allow delegates to upload | `process/views.py` | 1015,1020 |

### Important (completeness)

| # | Fix | File | Line |
|---|-----|------|------|
| 6 | `UserDocumentViewSet.get_queryset`: add `allowed_users` | `process/views.py` | 1068 |
| 7 | `UserValidDocumentViewSet.get_queryset`: add `allowed_users` | `process/views.py` | 1108 |
| 8 | `UserCertificateDocumentViewSet.get_queryset`: add `allowed_users` | `process/views.py` | 1444 |

### Low priority

| # | Fix | File | Line |
|---|-----|------|------|
| 9 | `document_name` / `certificate_name`: add `allowed_users` | `process/views.py` | 821, 846 |

### Security hardening

| # | Fix | File | Scope |
|---|-----|------|-------|
| 10 | `icontains` → `contains` across all `allowed_users` queries | `api/views.py`, `applicant_file/views.py`, `process/views.py` | 13 occurrences (5 pre-existing + 8 from gaps 2-9) |

**Why**: `icontains` does substring matching on serialized JSON text, so `bob@example.com` in `allowed_users` would also match a user with email `ob@example.com`. `contains` uses PostgreSQL's `@>` operator for exact JSON array element matching. This is consistent with existing usage in `middleware.py`, `merge.py`, and `backends.py`.

---

## 5. Already Working (no changes needed)

| Component | Source |
|-----------|--------|
| `_build_base_file_filters` (API listing) | `api/views.py:76` |
| `allow_part_a_file_access` endpoint | `api/views.py:291-317` |
| `has_file_access()` utility | `utilities/has_file_access.py:34` |
| `MyCertDocumentPermission` | `applicant_file/views.py:151` |
| `ProcessDocumentUploadViewSet` queryset | `process/views.py:443` |
| `CertificateViewSet` queryset | `process/views.py:745` |
| `UserCertificateViewSet` queryset | `process/views.py:907` |
| `DocumentViewSet` queryset (listing) | `process/views.py:1001` |

---

## 6. CASCADE on File.user — Do Not Change

`models.py:62`: `on_delete=models.CASCADE` with `blank=True, null=True`.

**SET_NULL is unsafe** because:
- 15+ code paths access `file.user.email`/`.username` without null guards (payment providers, API serialization, certificate generation)
- `MyFilePermission:68` returns `True` for NULL user (grants access to everyone)
- `has_file_access:16` returns `False` for NULL user (inconsistency)

Keep CASCADE. File delegation via `allowed_users` eliminates the need for SET_NULL.

---

## 7. Known Limitations (v2)

| Gap | Impact |
|-----|--------|
| WebSocket notifications only go to `file.user` | Delegate must refresh manually to see status changes |
| Email notifications only go to `file.user` | Delegate won't know about "sent back for corrections" |
| No revocation endpoint | Once shared, can't unshare without DB update |
| No "Share" button in frontend | Delegation triggered via BPA service only |
| No granular permissions | Delegate gets full read/write, no "view only" mode |

---

## 8. BPA Service Specification

### Service: "Compartir expediente"

**Form fields:**
1. `delegateEmail` — email, required — "Correo del usuario delegado"
2. `fileId` — select from owner's in-process files — "Expediente a compartir"

**Bot: "Delegation Bot"**
- HTTP Connector, client credentials auth (bot JWT with `is_staff=True`)
- `POST {DS_BACKEND_URL}/api/v1/access-to-file/`
- Body: `{"file_id": "${fileId}", "allowed_users": ["${delegateEmail}"]}`

**Camunda process:** `[Start] → [Bot] → [End]` — single step, no Part B review.

Here's where we stand:                                                                            
                                                                                                  
  Done                                                                                              
                                                                                                    
  Investigation — file-delegation-mechanism.md documents everything: the endpoint, access chain, bot
   auth, gaps, and BPA service spec.                                                                

  Backend fixes — 9 gaps patched across 3 files (~25 lines total):

  ┌─────┬─────────────────────────────────────────────────────────┬───────────┐
  │  #  │                           Fix                           │  Status   │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 1   │ start_camunda_processing no longer overwrites file.user │ Tested    │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 2   │ MyFilePermission checks allowed_users for File objects  │ Tested    │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 3   │ FileViewSet.get_queryset includes allowed_users         │ Tested    │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 4   │ UserFileViewSet.get_queryset includes allowed_users     │ Tested    │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 5   │ DocumentViewSet.create allows delegates to upload       │ Tested    │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 6   │ UserDocumentViewSet queryset                            │ Code done │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 7   │ UserValidDocumentViewSet queryset                       │ Code done │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 8   │ UserCertificateDocumentViewSet queryset                 │ Code done │
  ├─────┼─────────────────────────────────────────────────────────┼───────────┤
  │ 9   │ document_name / certificate_name                        │ Code done │
  └─────┴─────────────────────────────────────────────────────────┴───────────┘

  Tests — 7 new tests, all passing. Full suite: 763 passed, 29 failed (all pre-existing infra
  issues, zero regressions).

  Not done

  BPA service config — The analyst needs to create "Compartir expediente" in BPA with:
  - Form: email field + file selector
  - Bot: HTTP call to POST /api/v1/access-to-file/
  - Process: single-step, no Part B review

  The spec is in the MD document, section 8.

  Not committed

  Nothing has been committed to git — waiting for your go-ahead.


