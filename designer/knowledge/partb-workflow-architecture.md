# PARTB Testing — Workflow Replication Analysis

**Source service**: "Establish a new zone" (`d51d6c78-5ead-c948-0b82-0d9bc71cd712`)
**Target service**: "PARTB testing" (`415a8a8e-4ab1-4628-8c12-3e1e5bb3db8e`)
**Date**: 2026-03-04

---

## Workflow Architecture (from image + MCP data)

The workflow has **two tracks**: a main flow and a complementary information (CI) loop.

### Track 1: Main Flow (First Submission)

```
Applicant submits →
  1. Documents check (JSEZA, start_role)
  2. Complementary Information (applicant role, determinant-gated)
  3. PARALLEL evaluations (all JSEZA):
     - Legal evaluation
     - Technical evaluation
     - Business evaluation
     - Compliance evaluation
     - Organize NOC and inspection
  4. PARALLEL approvals:
     - Legal approval (JSEZA)
     - Technical approval (JSEZA)
     - Business approval (JSEZA)
     - Compliance approval (JSEZA)
     - TAJ approval (TAJ)
     - JCA approval (Customs Agency)
     - MOFPS approval (MOFPS)
  5. ARC - App Rev Committee (JSEZA)
```

### Track 2: CI Loop (Send-back from ARC)

When ARC needs more information:

```
ARC officer marks "additional info = yes" + specifies which units need to review
  → Complementary Information role ACTIVATES (determinant: "additional information = yes")
  → Applicant uploads requested docs + explanations
  → FILE VALIDATED sends to CI-specific evaluation roles:
     - Legal evaluation CI → Legal approval CI
     - Technical evaluation CI → Technical approval CI
     - Business evaluation CI → Business approval CI
     - Compliance evaluation CI → Compliance approval CI
  → ARC - App Rev Committee CI
```

---

## Key Components to Replicate

### 1. Roles (20 roles minimum for this pattern)

| # | Role Name | Type | Assigned To | Sort | Notes |
|---|-----------|------|-------------|------|-------|
| 1 | Applicant | UserRole | applicant | 130 | Submit form |
| 2 | Documents check | UserRole | revision | 0 | Start role, JSEZA |
| 3 | Complementary Information | UserRole | **applicant** | 1 | Determinant-gated |
| 4 | Legal evaluation | UserRole | processing | 2 | Parallel |
| 5 | Technical evaluation | UserRole | processing | 2 | Parallel |
| 6 | Business evaluation | UserRole | processing | 2 | Parallel |
| 7 | Compliance evaluation | UserRole | processing | 2 | Parallel |
| 8 | Organize NOC and inspection | UserRole | processing | 2 | Parallel |
| 9 | Legal approval | UserRole | processing | 3 | |
| 10 | Technical approval | UserRole | processing | 3 | |
| 11 | Business approval | UserRole | processing | 3 | |
| 12 | Compliance approval | UserRole | processing | 3 | |
| 13 | TAJ approval | UserRole | processing | 3 | External: TAJ |
| 14 | JCA approval | UserRole | processing | 3 | External: Customs |
| 15 | MOFPS approval | UserRole | processing | 3 | External: MOFPS |
| 16 | ARC - App Rev Committee | UserRole | processing | 4 | Main decision |
| 17 | Legal evaluation CI | UserRole | processing | 299 | CI loop |
| 18 | Technical evaluation CI | UserRole | processing | 299 | CI loop |
| 19 | Business evaluation CI | UserRole | processing | 299 | CI loop |
| 20 | Compliance evaluation CI | UserRole | processing | 299 | CI loop |
| 21 | Legal approval CI | UserRole | processing | 299 | CI loop |
| 22 | Technical approval CI | UserRole | processing | 299 | CI loop |
| 23 | Business approval CI | UserRole | processing | 299 | CI loop |
| 24 | Compliance approval CI | UserRole | processing | 299 | CI loop |
| 25 | ARC - App Rev Committee CI | UserRole | processing | 299 | CI loop |

### 2. Role Statuses (transitions)

Each evaluation/approval role has these statuses:
- **FILE VALIDATED** → next role
- **FILE PENDING** → wait
- **SEND BACK TO CORRECTIONS** → back to applicant
- **FILE REJECT** → reject flow

Special cases:
- **CI evaluation roles** also have **APPROVED** status
- **ARC** has SEND BACK TO CORRECTIONS → triggers Complementary Information

### 3. Key Determinant: "additional information = yes"

```
Name: "additional information = yes"
Type: radio
Field: applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditional...
Value: "yes"
```

This determinant:
- **Activates** the "Complementary Information" role (json_determinants on the role)
- **Shows/hides** specific blocks in the CI role form

### 4. Complementary Information Role — Form Design

The CI role (assigned to applicant) contains:
- **Block: "Additional documents and information"** — always active, with EditGrid:
  - Column 1: "Document name and reason" (textarea, copyValueFrom ARC)
  - Column 2: "Upload" (file upload)
  - Column 3: "Explanation" (textarea) + "Select units that will review" (select, copyValueFrom ARC)
- **Block: "Business - Additional documents"** — determinant-gated (CI review by business)
- **Block: "Legal - Additional documents"** — always active
- **Validate send page** button → FILE VALIDATED

Key: The `copyValueFrom` links pull data FROM the ARC role's form where the officer specified what documents/info are needed.

### 5. Determinant: "CI review by business"

```
Name: "CI review by business"
Type: grid
Field: applicationReviewingCommitteeArcDecisionEditGrid3
```

This controls which unit-specific blocks are shown to the applicant in the CI role.

### 6. Institutions (Unit assignments)

| Role | Institution |
|------|-------------|
| Documents check - Compliance eval | JSEZA |
| TAJ approval | TAJ |
| JCA approval | Customs Agency |
| MOFPS approval | MOFPS |

### 7. Registrations

All roles are linked to the same registration (e.g., "Approval SEZA" = `685dfe8b-d470-ecbf-baf7-579d2711cd7f`).

---

## What "PARTB testing" Currently Has

- **1 role**: Applicant (blank)
- **1 registration**: "HItest" (`54fc2876-a7a1-4545-91da-bc1b82510849`)
- **No evaluations, no approvals, no ARC, no CI loop**

---

## Replication Strategy

### Option A: Copy Service (Recommended)
Use `service_copy` to clone "Establish a new zone" and strip unnecessary roles. This preserves:
- All role statuses and transitions
- All determinants and form configurations
- All copyValueFrom links
- All behaviours and effects

### Option B: Manual Build
Create each role, determinant, status, and form component manually. This is:
- More precise (only what's needed)
- Much more time-consuming
- Higher risk of missing connections

### Option C: Hybrid
Copy the service, then adapt the form (applicant form) and remove roles not needed for PARTB.

---

## Next Steps

1. **User shares the "partially configured" service** for comparison
2. **Decide strategy**: copy vs. manual build
3. **Identify which roles/evaluations are needed** for PARTB specifically (maybe not all 4 evaluation units?)
4. **Map institutions**: Which agencies participate in PARTB?
5. **Design the applicant form**: What fields does PARTB need?

---

## Reference IDs (from "Establish a new zone")

| Component | ID |
|-----------|-----|
| Service | `d51d6c78-5ead-c948-0b82-0d9bc71cd712` |
| Registration | `685dfe8b-d470-ecbf-baf7-579d2711cd7f` |
| Documents check | `758ad740-d181-5887-a210-004e09e6ebd8` |
| Complementary Info | `c586cee8-9d9f-4f6f-a2e7-7414ca1e172d` |
| ARC | `80cb494e-9431-b915-1194-8b20dfa9697f` |
| ARC CI | `5bc50bc7-cbe5-49d3-b83a-b445d9c8ca29` |
| Det: "additional info = yes" | `d1ef5f18-d852-4590-9b34-0ca9fa701f71` |
| Det: "CI review by business" | `5345e285-6f81-45dd-8666-c631cf164f70` |
