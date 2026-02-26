# File Delegation — Complete Implementation Guide

**Project**: DS-Backend (eRegistrations CMS)
**Feature**: Email-based file sharing via `allowed_users`
**Date**: 2026-02-25
**Ticket**: TOBE-14528

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Architecture](#2-solution-architecture)
3. [Data Model](#3-data-model)
4. [The Sharing Endpoint](#4-the-sharing-endpoint)
5. [Permission Layer](#5-permission-layer)
6. [Queryset Filters (Visibility)](#6-queryset-filters-visibility)
7. [Document Upload Authorization](#7-document-upload-authorization)
8. [Ownership Protection on Resubmission](#8-ownership-protection-on-resubmission)
9. [Bot Authentication](#9-bot-authentication)
10. [BPA Service Configuration](#10-bpa-service-configuration)
11. [Tests](#11-tests)
12. [Known Bugs & Risks](#12-known-bugs--risks)
13. [What Was NOT Changed (and why)](#13-what-was-not-changed-and-why)
14. [Full Change Inventory](#14-full-change-inventory)

---

## 1. Problem Statement

Cuba eRegistrations users share login credentials so colleagues can manage government files on their behalf. This is a security risk (no audit trail, no revocation, credential reuse).

**Goal**: Replace credential sharing with proper email-based delegation. Owner shares a file with a colleague's email. The colleague sees the file in their own dashboard and can operate on it with their own credentials.

**Scope**: In-process files only. Full co-ownership (view, upload documents, resubmit after corrections, view certificates). Notifications deferred to v2.

---

## 2. Solution Architecture

The solution uses a field that already exists on the `File` model: `allowed_users` (added in migration `0036`, July 2024). The field stores a JSON array of email strings.

### Flow

```
1. Owner logs into eRegistrations
2. Owner opens "Compartir expediente" service (configured in BPA)
3. Owner enters delegate email + selects file
4. BPA bot calls POST /api/v1/access-to-file/ with bot JWT
5. Endpoint adds email to file.allowed_users (set union, no duplicates)
6. Delegate logs in → sees file in "My Applications" dashboard
7. Delegate can view, upload docs, resubmit — full co-ownership
```

### Components Involved

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENDPOINT LAYER                          │
│  apps/api/views.py         → allow_part_a_file_access          │
│  apps/api/serializers.py   → PartAFileAccessSerializer         │
│  apps/api/decorators.py    → staff_or_superuser_or_file_owner  │
│  apps/applicant_file/serializers.py → FileAllowedUsersSerializer│
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       PERMISSION LAYER                          │
│  apps/applicant_file/views.py  → MyFilePermission               │
│  apps/utilities/has_file_access.py → has_file_access()          │
│  apps/process/views.py        → DocumentViewSet.create          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      VISIBILITY LAYER                           │
│  apps/api/views.py             → _build_base_file_filters       │
│  apps/applicant_file/views.py  → FileViewSet.get_queryset       │
│  apps/applicant_file/views.py  → UserFileViewSet.get_queryset   │
│  apps/process/views.py         → 8 ViewSet querysets             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     OWNERSHIP PROTECTION                        │
│  apps/applicant_file/models.py → start_camunda_processing       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### File.allowed_users

**File**: `apps/applicant_file/models.py:75`

```python
# Email based access TOBE-14528
allowed_users = models.JSONField(blank=True, null=False, default=list)
```

**Why this works**:
- `JSONField` on PostgreSQL maps to `jsonb` column type
- Stores a plain JSON array: `["delegate@example.com", "other@example.com"]`
- `null=False, default=list` guarantees the field is always `[]` or a populated list, never NULL
- No migration needed — field already exists since migration `0036` (July 2024)
- No M2M table, no FK — just a simple array in the File row

**Query pattern used everywhere**:

```python
Q(allowed_users__contains=[user.email])
```

This translates to PostgreSQL's `@>` operator:

```sql
WHERE allowed_users @> '["delegate@example.com"]'::jsonb
```

**Why `__contains` and NOT `__icontains`**:
- `__icontains` does **text substring matching** on the serialized JSON string
- A file with `allowed_users = ["bob@example.com"]` would match a user with email `ob@example.com` because that substring exists in the JSON text `["bob@example.com"]`
- `__contains` does **exact JSON array element matching** via PostgreSQL's `@>` operator
- This is consistent with existing usage in `apps/users/middleware.py:528`, `apps/users/merge.py:204`, and `apps/profile/backends.py:362`

---

## 4. The Sharing Endpoint

### POST /api/v1/access-to-file/

**File**: `apps/api/views.py:291-317`

```python
@csrf_exempt
@api_view(http_method_names=[HTTPMethod.POST])
@login_required
@staff_or_superuser_or_file_owner_required      # ← Auth gate
def allow_part_a_file_access(request):
    # 1. Validate payload shape
    request_serializer = PartAFileAccessSerializer(data=data)
    request_serializer.is_valid(raise_exception=True)

    # 2. Look up file by UUID
    file = get_object_or_404(File, file_id=request_serializer.validated_data["file_id"])

    # 3. Merge emails via set union (accumulative, no duplicates)
    serializer = FileAllowedUsersSerializer(
        instance=file,
        data={"allowed_users": list(
            set(file.allowed_users) | set(request_serializer.validated_data["allowed_users"])
        )},
    )

    # 4. Validate emails + auto-create User accounts
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(data=serializer.data, status=status.HTTP_200_OK)
```

**Why it works**:
- `set union` means calling the endpoint twice with the same email is idempotent
- `FileAllowedUsersSerializer.validate_allowed_users` (line 310-334) validates each email format and auto-creates `User` accounts for unknown emails — this is critical because Django queries need real User objects for other parts of the system
- The `@staff_or_superuser_or_file_owner_required` decorator (line 41-68) ensures only staff, superusers, or the file owner can share

### Request Serializer

**File**: `apps/api/serializers.py:4-12`

```python
class PartAFileAccessSerializer(serializers.Serializer):
    file_id = serializers.CharField(required=True, allow_null=False)
    allowed_users = serializers.JSONField(required=True, allow_null=False)
```

Simple payload validation — ensures `file_id` and `allowed_users` are present.

### Email Validation + User Auto-Creation

**File**: `apps/applicant_file/serializers.py:307-338`

```python
class FileAllowedUsersSerializer(serializers.ModelSerializer):
    allowed_users = serializers.JSONField(required=True, allow_null=False)

    def validate_allowed_users(self, value):
        # 1. Must be a list of strings
        if not isinstance(value, list) or not all(isinstance(email, str) for email in value):
            raise ValidationError("allowed_users must be a list of emails!")

        # 2. Each email must be valid format
        validator = serializers.EmailField()
        for email in value:
            validator.run_validation(email)  # raises on invalid

        # 3. Auto-create User accounts for unknown emails
        for email in value:
            if not User.objects.filter(email=email).exists():
                User.objects.create(username=email, email=email)

        return value
```

**Why auto-create users**: When the delegate logs in later (via CAS/Keycloak), the system needs a matching User row. Creating it at share-time avoids "user not found" errors at login time.

### Authorization Decorator

**File**: `apps/api/decorators.py:41-68`

```python
def staff_or_superuser_or_file_owner_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if any([
            request.user.is_staff,
            request.user.is_superuser,
            File.objects.filter(file_id=data.get("file_id"), user=request.user).exists(),
        ]):
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden(...)
```

**Why it works**: Bots have `is_staff=True` (see section 9), so they pass this check automatically. Human owners pass via the `File.objects.filter(user=request.user)` check.

---

## 5. Permission Layer

### 5a. MyFilePermission (object-level)

**File**: `apps/applicant_file/views.py:57-83`

This is the central object-level permission class used by `FileViewSet`, `FileDataViewSet`, and indirectly by document/certificate views.

```python
class MyFilePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not obj:
            return False

        user = request.user
        if user.is_staff or user.is_superuser:
            return True

        # Owner always has access
        if not obj.user or obj.user == user:
            return True

        # DELEGATION FIX: Check allowed_users for File objects
        if isinstance(obj, File) and obj.allowed_users and user.email in obj.allowed_users:
            return True

        # Check allowed_users for Certificate/Document objects (access via parent file)
        if isinstance(obj, (Certificate, Document)) and user.email in obj.file.allowed_users:
            return True

        # External bot read access
        if request.method == "GET":
            with contextlib.suppress(Exception):
                if "external-bot" in user.data.get("current_roles"):
                    return True

        return False
```

**Why the File isinstance check was needed**: Before the fix, this permission only checked `allowed_users` for `Certificate` and `Document` objects (line 74). A delegate accessing a `File` object directly (e.g., via `FileViewSet.retrieve`) would be denied because the `File` branch didn't check `allowed_users`.

**How it flows**:
1. Staff/superuser → always allowed
2. No owner or user IS owner → allowed
3. User in `file.allowed_users` (for File objects) → allowed
4. User in `file.allowed_users` (for Certificate/Document via parent) → allowed
5. External bot GET → allowed
6. Everyone else → denied

### 5b. has_file_access() utility

**File**: `apps/utilities/has_file_access.py:15-50`

```python
def has_file_access(user, file):
    if file.user is None:
        return False
    if not user.is_authenticated:
        return False
    if file.user.id == user.id:
        return True
    # Inspector, all-permitted-files, all-files groups
    if any(item in (...) for item in user.groups.values_list("name", flat=True)):
        return True

    if file.allowed_users and user.email in file.allowed_users:
        return True

    # Business entity access
    # ...
    return False
```

**Already worked before our changes**. Line 34 checks `file.allowed_users`. This function is used by middleware and other components to verify access. No changes were needed here.

---

## 6. Queryset Filters (Visibility)

These filters determine which files/documents/certificates appear in list views. Without these, a delegate could have object-level permission but the object would never appear in their dashboard (queryset returns empty).

### 6a. _build_base_file_filters (API listing)

**File**: `apps/api/views.py:72-76`

```python
current_user_owns_filter = Q(user=request.user)
current_user_granted_access_via_business_entity_filter = Q(
    business_entity__users__businessentityusers__user=request.user
)
current_user_email_access_filter = Q(allowed_users__contains=[request.user.email])
```

**Already worked** — This is the main API listing filter used by the Part A dashboard ("My Applications"). It already included `allowed_users` before our changes.

### 6b. FileViewSet.get_queryset

**File**: `apps/applicant_file/views.py:205-218`

```python
def get_queryset(self):
    user = self.request.user
    if user.is_authenticated:
        q1 = Q(user=user)                                           # Owner
        q2 = Q(business_entity__users__businessentityusers__user=user)  # Business entity member
        q3 = Q(allowed_users__contains=[user.email])                 # DELEGATION FIX
        qs = File.objects.filter(q1 | q2 | q3).distinct()
        return qs
```

**Why this was needed**: `FileViewSet` is the REST endpoint at `/backend/files/`. Without `q3`, a delegate doing `GET /backend/files/{file_id}` would get 404 because the queryset didn't include files where they're a delegate.

**Why `.distinct()`**: The OR across multiple relationships could produce duplicate File rows (e.g., if a user is both owner and business entity member). `distinct()` eliminates them.

### 6c. UserFileViewSet.get_queryset

**File**: `apps/applicant_file/views.py:528-543`

```python
def get_queryset(self):
    q1 = Q(user=self.request.user)
    q2 = Q(business_entity__users__businessentityusers__user=self.request.user)
    q3 = Q(allowed_users__contains=[self.request.user.email])        # DELEGATION FIX
    be = self.request.GET.get("business_entity")
    domain_filter = (...)
    if be:
        qs = File.objects.filter((q1 | q2 | q3) & Q(business_entity=be))
    else:
        qs = File.objects.filter(q1 | q2 | q3)
    qs = qs.filter(domain_filter)
```

**Why this was needed**: `UserFileViewSet` is at `/backend/user-files/` — the "My Applications" dashboard for Part A. Without `q3`, delegates would not see shared files in their dashboard. Both branches (`if be` / `else`) needed the fix.

### 6d. Process ViewSet Querysets (8 locations)

All in **`apps/process/views.py`**:

| ViewSet | Line | Endpoint | Purpose |
|---------|------|----------|---------|
| `ProcessDocumentUploadViewSet` | 443 | `/backend/process-documents/` | Documents for a specific process |
| `ProcessViewSet` | 689 | `/backend/process/` | Process instances |
| `CertificateViewSet` | 745 | `/backend/certificates/` | Certificates |
| `document_name` | 821 | `/backend/documents/.../name` | Rename document |
| `certificate_name` | 846 | `/backend/process/.../certificate/.../name` | Rename certificate |
| `UserCertificateViewSet` | 907 | `/backend/certificates/user` | User's certificates |
| `DocumentViewSet` | 1001 | `/backend/documents/` | Documents listing |
| `UserDocumentViewSet` | 1068 | `/backend/documents/user` | User's documents |
| `UserValidDocumentViewSet` | 1109 | `/backend/documents/user/valid` | User's valid documents |
| `UserCertificateDocumentViewSet` | 1449 | `/backend/certificate-documents/user` | User's certificate documents |

All follow the same pattern:

```python
# BEFORE (example from CertificateViewSet, line 745)
return qs.filter(Q(user=user))

# AFTER
return qs.filter(Q(user=user) | Q(file__allowed_users__contains=[user.email]))
```

**Why `file__` prefix on some**: Documents and Certificates have a FK to File (`document.file`, `certificate.file`). The `__contains` traverses the FK to check the parent file's `allowed_users`.

---

## 7. Document Upload Authorization

**File**: `apps/process/views.py:1008-1023`

```python
def create(self, request, *args, **kwargs):
    file_id = request.data.get("file_id")
    process_id = request.data.get("process_id")
    user = request.user

    if file_id and not user.is_staff:
        file = File.objects.filter(file_id=file_id).first()
        if file and file.user != user and user.email not in (file.allowed_users or []):
            raise PermissionDenied(detail="Invalid file_id for this user")

    if process_id and not user.is_staff:
        file = File.objects.filter(process_instance_id=process_id).first()
        if file and file.user != user and user.email not in (file.allowed_users or []):
            raise PermissionDenied(detail="Invalid process_id for this user")

    return super().create(request, *args, **kwargs)
```

**Why this was needed**: `DocumentViewSet.create` is the endpoint for uploading documents to a file. Before the fix, the check was `file.user != user` which blocked delegates. Now it also checks `user.email not in (file.allowed_users or [])`.

**Why `(file.allowed_users or [])`**: Defensive null-check. Although the model defines `null=False, default=list`, old database records or direct DB updates could have NULL values. The `or []` prevents `TypeError: argument of type 'NoneType' is not iterable`.

---

## 8. Ownership Protection on Resubmission

**File**: `apps/applicant_file/models.py:93-126`

```python
def start_camunda_processing(self, user) -> bool:
    # Check if already submitted (deduplication)
    process_instance_id = self.__class__.objects.values_list(
        "process_instance_id", flat=True
    ).get(file_id=self.file_id)
    if process_instance_id:
        return False

    # Start Camunda process
    process_info = factories.get_camunda().start_process_instance(self, definition_id=definition_id)

    self.process_instance_id = process_info["id"]
    self.state = self.State.IN_PROCESS
    self.locked = True

    # DELEGATION FIX: Only set user on first-time submission
    if not self.user:
        self.user = user

    self.submitted_at = datetime.now()
    self.save()
    return True
```

**Why this was critical**: Before the fix, line 112 was unconditionally `self.user = user`. If a delegate submitted a file (e.g., after Part B sends it back for corrections), `file.user` would be silently overwritten to the delegate. The original owner would **permanently lose ownership** — they would no longer see the file in their dashboard, and the delegate would become the new owner.

**The fix**: `if not self.user:` ensures the user is only set for first-time submissions (anonymous/demo mode where `file.user` is NULL). When a real owner exists, the owner field is preserved regardless of who clicks "Submit".

---

## 9. Bot Authentication

**File**: `apps/profile/backends.py:139-141`

```python
# In sync_user_roles():
if "bot" in roles:
    user.is_staff = True
    user.is_superuser = True
```

**How it works**:
1. BPA creates a bot with OAuth2 client credentials
2. Bot calls the auth service to get a JWT token
3. JWT contains `"roles": ["bot"]`
4. `sync_user_roles()` in the OAuth2 backend translates `"bot"` role to `is_staff=True, is_superuser=True`
5. The `@staff_or_superuser_or_file_owner_required` decorator on the sharing endpoint passes for `is_staff`

**No special integration needed** — any bot JWT automatically has staff permissions.

---

## 10. BPA Service Configuration

This is analyst work, not code. The analyst creates a service in BPA for Cuba.

### Service: "Compartir expediente"

**Form fields**:
1. `delegateEmail` — email field, required. Label: "Correo del usuario delegado"
2. `fileId` — select dropdown populated from owner's in-process files. Label: "Expediente a compartir"

**Bot**: "Delegation Bot"
- Type: HTTP Connector
- Auth: Client credentials → bot JWT (gets `is_staff=True`)
- Method: POST
- URL: `{DS_BACKEND_URL}/api/v1/access-to-file/`
- Body: `{"file_id": "${fileId}", "allowed_users": ["${delegateEmail}"]}`

**Camunda process**: `[Start] → [Bot: call endpoint] → [End]`

Single-step, no Part B review needed.

---

## 11. Tests

**File**: `tests/test_file_delegation.py` (new file, 7 tests)

| Test | What It Verifies |
|------|-----------------|
| `test_delegate_can_retrieve_file` | GET `/backend/files/{id}` returns 200 for delegate |
| `test_non_delegate_cannot_retrieve_file` | GET returns 404 for user NOT in allowed_users |
| `test_my_file_permission_grants_access_for_delegate` | `has_object_permission()` returns True for delegate on File |
| `test_my_file_permission_denies_outsider` | `has_object_permission()` returns False for outsider |
| `test_delegate_can_upload_document` | POST to DocumentViewSet doesn't return 403 for delegate |
| `test_start_camunda_processing_preserves_owner` | After delegate submits, `file.user` is still original owner |
| `test_start_camunda_processing_sets_user_when_none` | For anonymous files, user IS set on submission |

**Results**: 7/7 pass. Full suite: 763 passed, 29 failed (all pre-existing infrastructure issues — MinIO, treepoem, locale).

---

## 12. Known Bugs & Risks

### BUG 1: Email Case Sensitivity (MEDIUM)

**Location**: `apps/applicant_file/serializers.py:310-334` and all `__contains` queries

**Problem**: The `FileAllowedUsersSerializer.validate_allowed_users` method does NOT normalize email case. If a delegate is added as `Delegate@EXAMPLE.COM` but logs in as `delegate@example.com`, the `__contains` query will fail because PostgreSQL `@>` on jsonb is case-sensitive.

**Impact**: Delegate won't see the file in their dashboard.

**Fix**: Normalize emails to lowercase in the serializer:

```python
def validate_allowed_users(self, value):
    value = [email.lower() for email in value]
    # ... rest of validation ...
    return value
```

### BUG 2: MyFilePermission Grants ALL Methods to Delegates (HIGH)

**Location**: `apps/applicant_file/views.py:71-72`

**Problem**: `MyFilePermission.has_object_permission` returns `True` for delegates on **all HTTP methods** — including DELETE and PATCH. A delegate could potentially:
- Delete a file via `FileViewSet.destroy` (mitigated by destroy's own check — see next point)
- PATCH sensitive fields on the File object

**Current mitigation**: `FileViewSet.destroy` (line 439-466) has its own ownership check that does NOT include `allowed_users`, so delegates can't actually delete. But this is an inconsistency — the permission layer says "yes" and the view layer says "no".

**Fix**: Restrict delegate permissions to safe methods + upload:

```python
if isinstance(obj, File) and obj.allowed_users and user.email in obj.allowed_users:
    if request.method in permissions.SAFE_METHODS or request.method == "POST":
        return True
    return False
```

### BUG 3: FileViewSet.destroy Does Not Check allowed_users (LOW - by design)

**Location**: `apps/applicant_file/views.py:439-466`

```python
def destroy(self, request, *args, **kwargs):
    instance = self.get_object()
    if instance.state == "NEW" and (
        request.user == instance.user  # Only owner
        or BusinessEntity.objects.filter(...)
    ):
        self.perform_destroy(instance)
```

**Current behavior**: Delegates CANNOT delete files. Only the owner or business entity members can.

**This is correct for our use case** (delegates should not delete). But if you later want delegates to delete draft files, you'd need to add `or request.user.email in (instance.allowed_users or [])` here.

### BUG 4: Payment Flow Blocks Delegates (HIGH for services with payments)

**Location**: `apps/payment/views.py:305-312`

```python
def _validate_user_can_pay(self, user, file):
    if file.user and file.user.id != user.id:
        return HttpResponse(status=status.HTTP_403_FORBIDDEN)  # ← No allowed_users check
```

**Problem**: If a delegated file requires payment, the delegate cannot pay — the payment view only checks `file.user`. This breaks the delegation workflow for services that require payment before submission.

**Impact**: For Cuba's use case (sharing in-process files), this is likely not an issue because payment happens before submission. But if the scope expands to sharing draft files that need payment, this becomes a blocker.

**Fix**:

```python
def _validate_user_can_pay(self, user, file):
    if file.user and file.user.id != user.id:
        if user.email not in (file.allowed_users or []):
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)
```

### BUG 5: Null-Safety Inconsistency (MEDIUM)

**Locations**: Multiple files

Some checks use defensive `(file.allowed_users or [])`, others assume it's always a list:

```python
# SAFE (process/views.py:1015)
user.email not in (file.allowed_users or [])

# RISKY (applicant_file/views.py:74)
user.email in obj.file.allowed_users  # TypeError if None
```

Although the model defines `null=False, default=list`, old records could have NULL. The line 71 check (`obj.allowed_users and user.email in obj.allowed_users`) is safe because Python short-circuits on falsy None. But line 74 (`user.email in obj.file.allowed_users`) is not safe — if `obj.file.allowed_users` is None, this raises `TypeError`.

**Fix**: Change line 74 to:

```python
if isinstance(obj, (Certificate, Document)) and user.email in (obj.file.allowed_users or []):
```

### BUG 6: Race Condition on Simultaneous Submit (LOW)

**Location**: `apps/applicant_file/models.py:93-103`

```python
def start_camunda_processing(self, user):
    # Re-queries DB without lock
    process_instance_id = self.__class__.objects.values_list(
        "process_instance_id", flat=True
    ).get(file_id=self.file_id)
    if process_instance_id:
        return False
```

**Problem**: The caller (`FileViewSet.start_process`) uses `SELECT FOR UPDATE` to lock the row, but `start_camunda_processing` does a **separate query** without the lock to check for duplicates. If two requests arrive simultaneously, both could pass the check.

**Mitigation**: The Camunda deduplication logic in Part B (`TOBE-11190`) catches duplicates post-hoc. But it's not preventive.

**Better fix**: Use `self.process_instance_id` (already loaded within the transaction) instead of re-querying:

```python
if self.process_instance_id:
    return False
```

### BUG 7: No Revocation Mechanism (by design, v2)

**Problem**: Once an email is added to `allowed_users`, there is no endpoint to remove it. Revocation requires a direct database update.

**v2 fix**: Add a `DELETE /api/v1/access-to-file/` endpoint or a `PATCH` variant that accepts a list of emails to remove.

### BUG 8: Orphaned Emails After User Deletion (LOW)

**Problem**: If a user is deleted, their email remains in `allowed_users` arrays across all files they were delegated to. No cleanup hook exists.

**Impact**: Minimal — the orphaned email won't match any user, so no unauthorized access. But it's data pollution.

**Fix**: Add a `post_delete` signal on User that cleans up `allowed_users`:

```python
@receiver(post_delete, sender=User)
def cleanup_allowed_users(sender, instance, **kwargs):
    for f in File.objects.filter(allowed_users__contains=[instance.email]):
        f.allowed_users.remove(instance.email)
        f.save(update_fields=["allowed_users"])
```

### BUG 9: WebSocket Notifications Only Go to Owner (v2)

**Location**: `apps/applicant_file/signals.py:22-29`

```python
if channel_layer and instance.user_id and relevant_change_happened:
    async_to_sync(channel_layer.group_send)(
        f"user_{instance.user_id}_updates",  # ← Only file owner
        {"type": "file_update", "data": instance.serialize()},
    )
```

**Impact**: Delegates don't get real-time WebSocket pushes when file state changes. They must refresh manually.

### BUG 10: Email Notifications Only Go to Owner (v2)

**Impact**: When Part B sends a file back for corrections, only the owner gets the email notification. The delegate doesn't know about it.

---

## 13. What Was NOT Changed (and why)

These components already worked correctly before the delegation fixes:

| Component | File:Line | Why It Already Worked |
|-----------|-----------|----------------------|
| `_build_base_file_filters` | `api/views.py:76` | Already included `allowed_users` filter |
| `has_file_access()` | `utilities/has_file_access.py:34` | Already checked `allowed_users` |
| `MyCertDocumentPermission` | `applicant_file/views.py:151` | Used `has_file_access()` which already worked |
| `ProcessDocumentUploadViewSet` queryset | `process/views.py:443` | Already had `allowed_users` filter |
| `CertificateViewSet` queryset | `process/views.py:745` | Already had `allowed_users` filter |
| `UserCertificateViewSet` queryset | `process/views.py:907` | Already had `allowed_users` filter |
| `DocumentViewSet` queryset (listing) | `process/views.py:1001` | Already had `allowed_users` filter |
| `File.allowed_users` field | `applicant_file/models.py:75` | Already existed since migration 0036 |
| `allow_part_a_file_access` endpoint | `api/views.py:291-317` | Already existed and functional |
| Bot auth (`sync_user_roles`) | `profile/backends.py:139-141` | Bot role → is_staff already handled |

### CASCADE on File.user — Do Not Change to SET_NULL

**File**: `apps/applicant_file/models.py:62`

```python
user = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
```

**Why SET_NULL is unsafe**:
- 15+ code paths access `file.user.email` / `file.user.username` without null guards (payment providers, API serialization, certificate generation)
- `MyFilePermission:68` returns `True` for NULL user → grants access to everyone
- `has_file_access:16` returns `False` for NULL user → inconsistency
- File delegation via `allowed_users` eliminates the need to change CASCADE

---

## 14. Full Change Inventory

### Files Modified (3 production files + 1 test file)

| File | Lines Changed | Change Type |
|------|:---:|------------|
| `apps/applicant_file/models.py` | 2 | Ownership protection |
| `apps/applicant_file/views.py` | 8 | Permission + querysets |
| `apps/process/views.py` | ~15 | Document/certificate querysets + upload auth |
| `tests/test_file_delegation.py` | 166 | New test file |

### Detailed Changes

**`apps/applicant_file/models.py`** (1 change):
- Line 112: `self.user = user` → `if not self.user: self.user = user`

**`apps/applicant_file/views.py`** (3 changes):
- Lines 71-72: Added `isinstance(obj, File) and obj.allowed_users and user.email in obj.allowed_users` check in `MyFilePermission`
- Line 211: Added `q3 = Q(allowed_users__contains=[user.email])` in `FileViewSet.get_queryset`
- Line 531: Added `q3 = Q(allowed_users__contains=[self.request.user.email])` in `UserFileViewSet.get_queryset`

**`apps/process/views.py`** (5 changes):
- Lines 1015, 1020: Added `and user.email not in (file.allowed_users or [])` in `DocumentViewSet.create`
- Line 1068: Added `| Q(file__allowed_users__contains=[user.email])` in `UserDocumentViewSet`
- Line 1109: Changed to Q-based filter with `allowed_users` in `UserValidDocumentViewSet`
- Line 1449: Added `| Q(file__allowed_users__contains=[user.email])` in `UserCertificateDocumentViewSet`
- Lines 821, 846: Added `| Q(file__allowed_users__contains=[request.user.email])` in `document_name` and `certificate_name`

**`apps/api/views.py`** + all pre-existing `icontains` (security hardening):
- All 13 occurrences of `allowed_users__icontains` changed to `allowed_users__contains=[email]` across `api/views.py`, `applicant_file/views.py`, `process/views.py`

### No Migrations Needed

The `allowed_users` field already exists in the database (migration `0036`, July 2024). All changes are in Python application code only.

### No Frontend Changes Needed

Delegation is triggered via BPA service (bot calls the endpoint). The Part A dashboard already uses `_build_base_file_filters` which includes `allowed_users`.

---

## Appendix: Quick Reference — Access Chain

```
User logs in
    ↓
Dashboard (GET /api/v1/files/)
    ↓ _build_base_file_filters includes Q(allowed_users__contains=[email])
    ↓
File appears in list
    ↓
User clicks file (GET /backend/files/{id})
    ↓ FileViewSet.get_queryset includes q3
    ↓ MyFilePermission.has_object_permission checks allowed_users
    ↓
File detail loaded
    ↓
User uploads document (POST /backend/documents/)
    ↓ DocumentViewSet.create checks allowed_users
    ↓
User resubmits file
    ↓ start_camunda_processing preserves file.user (if not self.user:)
    ↓
Owner still owns the file ✓
```
