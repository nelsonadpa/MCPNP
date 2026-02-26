# E2E Test Report: Establish a new zone

**Service:** Establish a new zone (Jamaica SEZ)
**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Date:** 2026-02-26
**Tester:** Nelson Perez (automated via Playwright)

## Test Application

| Field | Value |
|-------|-------|
| File ID | `8681df73-af32-45d6-8af1-30d5a7b0b6a1` |
| Process ID | `84e53b18-12b2-11f1-899e-b6594fb67add` |
| Business | TEST-SEZ Development Corp Ltd |
| Created | 2026-02-26T01:22:34Z |
| Process started | 2026-02-26T01:28:56Z |
| Process ended | 2026-02-26T13:47:44Z |

## Results Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Form fill + submit | PASS | All fields filled, 30+ documents uploaded, submitted successfully |
| Phase 2 — Documents Check | PASS | 27 documents validated, approved |
| Phase 2 — Evaluations (5 parallel) | PASS | Legal, Technical, Business, Compliance, NOC |
| Phase 2 — Agency approvals (3) | PASS | TAJ, MOFPS, JCA — all "No objection" |
| Phase 2 — Internal approvals (4) | PASS | Legal, Technical, Compliance, Business |
| Phase 2 — ARC decision | PASS | Required EditGrid row save before submit |
| Phase 2 — Complementary Info | PASS | Applicant-side, "Validate send page" |
| Phase 2 — Status Letter + Signature | PASS | |
| Phase 2 — Board Submission | PASS | Required EditGrid row save before submit |
| Phase 2 — CEO Validation | PASS | |
| Phase 2 — Board | PASS | |
| Phase 2 — SEZ Documents | PASS | |
| **Certificate generation** | **FAIL** | See issue #1 below |

**Final process status:** `filevalidated`, `ended: true`
**Front-office status:** "Approved" (green badge)
**Certificates column:** Empty

## All 21 Tasks (final state)

```
 ✓ review (Documentary check) — filevalidated [revision]
 ✓ legalReview (LSU evaluation) — filevalidated [processing]
 ✓ organizeNocAndInspection (Organize NOC and ins) — filevalidated [processing]
 ✓ complianceReview (CAS evaluation) — filevalidated [processing]
 ✓ businessReview (BPSS evaluation) — filevalidated [processing]
 ✓ technicalReview (TSI review) — filevalidated [processing]
 ✓ legalApproval (Legal approval) — filevalidated [processing]
 ✓ tajApproval (TAJ approval) — filevalidated [processing]
 ✓ mofpsApproval (MOFPS approval) — filevalidated [processing]
 ✓ jcaApproval (JCA approval) — filevalidated [processing]
 ✓ technicalApproval (Technical approval) — filevalidated [processing]
 ✓ complianceApproval (Compliance approval) — filevalidated [processing]
 ✓ businessApproval (Business approval) — filevalidated [processing]
 ✓ applicationReviewingCommitteeArcDecision (ARC decision) — filevalidated [processing]
 ✓ complementaryInformation (Complementary Inform) — filevalidated [applicant]
 ✓ preparationOfStatusLetter (Preparation SL) — filevalidated [processing]
 ✓ signatureOfStatusLetter (Signature of Status) — filevalidated [processing]
 ✓ boardSubmission (Board submission) — filevalidated [processing]
 ✓ ceoValidation (CEO validation) — filevalidated [processing]
 ✓ board (Board) — filevalidated [processing]
 ✓ sezDocuments (SEZ Documents) — filevalidated [processing]
```

---

## Issues Found

### Issue #1: Developer License certificate not generated — bot has 0 mappings

**Severity:** High
**Component:** Bot "Developer license" (`02f73ee5-da36-4273-a235-04fe47c187b9`)

**Description:**
The "Developer license" print document exists and is active (30 components configured), and the bot exists and is enabled, but **no input or output mappings are configured**. The bot cannot execute without mappings.

**Details:**

| Item | Status |
|------|--------|
| Print document "Developer license" (`d4a7bdb6-d813-11bd-fdfa-7b51a25dbf2c`) | Active, 30 components |
| Bot "Developer license" (`02f73ee5-da36-4273-a235-04fe47c187b9`) | Enabled, type=document, category=document_generate_and_upload |
| BotRole "Developer license" (`83608914-61d3-c001-8aae-dde29bf85d38`) | Exists in workflow |
| Mule service `generic-pdf-generator` | "DS - generate and upload license PDF to DS" (POST) |
| **Input mappings** | **0 of 1** — missing `certName` (Certificate name) |
| **Output mappings** | **0 of 5** — missing `link`, `fileObject`, `status`, `message`, `error` |

**Required fix:**
1. Create input mapping: `certName` → fixed value or form field reference
2. Create output mappings: at minimum `link` and `fileObject` to store the generated PDF

**Impact:** Applicant completes the entire process and sees "Approved" status but receives no downloadable certificate in the Certificates column.

---

## Test Artifacts

- **Specs:** `countries/jamaica/testing/specs/`
  - `p1-submit-complete.spec.ts` — Phase 1 form fill + submit
  - `p2-documents-check.spec.ts` — Phase 2 documents validation
  - `p2-eval-process-all.spec.ts` — Phase 2 all back-office roles
  - `p2-comp-submit.spec.ts` — Complementary info (applicant-side)
- **Screenshots:** `countries/jamaica/testing/screenshots/`
- **Diagnostics:** `countries/jamaica/testing/specs/diag/` (45 diagnostic specs)
