# M-J003: Comprehensive Service Testing — Plan

**Service:** Establish a new zone (Jamaica SEZ)
**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Started:** 2026-02-25
**Last updated:** 2026-02-27

---

## What We Accomplished (Cycle 1)

### Executed
- [x] Phase 1.3 — Happy path form fill + submit (13 iterations to stabilize)
- [x] Phase 2 — All 21 back-office tasks approved (happy path)
- [x] Phase 3.1 — Full E2E happy path (submit → 21 tasks → "Approved")
- [x] Found Issue #1: Developer License bot has 0 mappings (no certificate generated)

### Artifacts Produced
- `specs/p1-submit-complete.spec.ts` — Phase 1 automation (1100 lines)
- `specs/p2-documents-check.spec.ts` — Documents Check
- `specs/p2-eval-process-all.spec.ts` — All back-office tasks loop
- `specs/p2-comp-submit.spec.ts` — Complementary info (applicant-side)
- `specs/diag/` — 45 diagnostic specs (exploration artifacts)
- `analysis/e2e-establish-new-zone-report.md` — Basic results report
- `01-reconnaissance/bpa-analysis.md` + `service-architecture.mermaid`
- `02-front-office-tests/test-results.md`
- Screenshots (unorganized)

### Key Knowledge Gained
- Full 21-task workflow map with role-specific button patterns
- eRegistrations UI patterns: Choices.js, file uploads, EditGrid, Form.io API, ng-select
- Back-office URL pattern: `/part-b/{serviceId}/{camundaName}/{processId}?file_id={fileId}`
- Process API: `/backend/process/{processId}` as source of truth for task status
- 17 hard-won lessons (see `jamaica-testing.md`)

---

## What's Missing (Gap Analysis vs Master Prompt)

### Phase 0 — Reconnaissance (COMPLETE)
- [x] Complete service architecture via MCP → `01-reconnaissance/service-architecture.md`
- [x] Field inventory CSV (328 fields) → `01-reconnaissance/field-inventory.csv`
- [x] Role matrix (21 active roles + 28 inactive) → `01-reconnaissance/role-matrix.md`
- [x] Complete test plan (95 test cases SEZ-001..SEZ-095) → `01-reconnaissance/test-plan.md`

### Phase 1 — Front-Office (~50% done)
- [ ] 1.2 Service discovery documentation (how service is presented to user)
- [ ] 1.4 Negative testing (required fields empty, invalid formats, boundary values, wrong file types, browser back/forward, multiple tabs)
- [ ] 1.5 Post-submission experience (email notifications, corrections flow from applicant side)

### Phase 2 — Back-Office (~40% done)
- [ ] 2.2 Request corrections flow ("Sent back to applicant" → applicant corrects → resubmit)
- [ ] 2.2 Rejection flow (officer rejects → applicant sees rejection + reason)
- [ ] 2.2 Internal notes/comments (verify visible to officers, NOT to applicant)
- [ ] 2.1 Formal dashboard documentation per role
- [ ] 2.4 Edge cases (wrong role access, simultaneous actions, undo)

### Phase 3 — E2E (~40% done)
- [ ] 3.2 Complete rejection path
- [ ] 3.3 Status consistency check (dashboard status vs email vs timeline/history)

### Phase 4 — Documentation (~70% done)
- [x] 4.1 Applicant manual (827 lines) → `05-manuals/applicant-manual.md`
- [x] 4.2 Officer manual (727 lines) → `05-manuals/officer-manual.md`
- [ ] 4.3 Video/screen recordings (happy path, processing path, corrections loop)
- [x] 4.4 Architecture docs → `01-reconnaissance/service-architecture.md`, `role-matrix.md`, `field-inventory.csv`

### Phase 5 — Issue Report (COMPLETE)
- [x] Format all issues per template → `06-issues/issue-report.md` (6 issues, full template)
- [x] Summary report → `06-issues/summary-report.md` (production readiness assessment, deliverables table)

---

## Improvement Plan for Cycle 2

### Priority 1: Reconnaissance via MCP (Phase 0 completion)
**Why first:** Everything else depends on having a complete map of the service.
**How:** Use BPA MCP tools (not browser) to extract:
- All roles with descriptions, order, assigned_to
- All form fields (applicant form + each role form) with types, validation, conditionals
- All bots with mapping status
- All print documents with components
- All registrations and institutions
**Output:** `field-inventory.csv`, `role-matrix.md`, `service-architecture.md` (updated), `test-plan.md` (complete)

### Priority 2: Reusable helpers + page objects (COMPLETE)
**Why:** Eliminate the 13-iteration discovery phase for future services.
**How:** Extracted from p1-submit-complete.spec.ts and p2-eval-process-all.spec.ts into:
- `helpers/form-helpers.ts` — 16 functions: fillText, fillEmail, typeText, fillNumber, searchAndSelect, clickRadioLabel, checkBox, fillSurveyYes, clickSubTab, clickSideNav, uploadFile, uploadGenericBrowse, uploadBrowseByIndex, save, saveDraft, setFormioData, enableFormValidation, saveEditGridRows
- `helpers/backoffice-helpers.ts` — 13 functions: getProcessTasks, getPendingTasks, getProcessStatus, navigateToRole, findActionButton, handleNocUploads, handleAgencyApproval, validateAllDocuments, handleConfirmation, getToastMessages, hasValidationError, processRole (composite)
- `pages/ApplicationFormPage.ts` — front-office page object: startNewApplication, openExisting, tabs, form filling, validate, submit, complementary info, dashboard status
- `pages/BackOfficeProcessingPage.ts` — back-office page object: goToPartB, goToRole, getAllTasks, getPendingTasks, validateDocuments, processSingleRole, processAllPendingRoles, requestCorrections, rejectApplication
**Output:** Reusable code, parameterized by service ID and test data

### Priority 3: Structured data capture during execution (COMPLETE)
**Why:** Raw screenshots aren't useful for manuals. Need structured data.
**How:** Created `helpers/execution-logger.ts`:
- `ExecutionLogger` class — captures fields, buttons, state changes, screenshots, navigation, errors
- `LoggedFormFiller` class — wraps form-helpers to both perform actions AND log them
- Screenshot naming: `P{phase}-S{step}-{description}.png`
- Export to JSON with metadata and summary statistics
**Output:** `execution-log.json` generation framework ready for Phase 4

### Priority 4: Manual generation (Phase 4) (COMPLETE)
**Why:** The main deliverable the prompt asks for.
**How:** Generated from reconnaissance data (field inventory, architecture, role matrix) + test specs:
- Applicant manual: 827 lines — overview, prerequisites, step-by-step form filling (all 5 tabs + sub-sections), post-submission workflow, 41-document checklist, glossary
- Officer manual: 727 lines — 7-phase workflow, step-by-step for all 21 roles, corrections/rejection flows, troubleshooting, quick reference table
**Output:** `05-manuals/applicant-manual.md`, `05-manuals/officer-manual.md`

### Priority 5: Corrections + rejection flows (Phase 2.2 + 3.2)
**Why:** Only tested happy path. Corrections are critical for real usage.
**How:**
- New test application → officer requests corrections → verify applicant sees it → applicant corrects → resubmit → approve
- New test application → officer rejects → verify applicant sees rejection + reason
**Output:** Test results, screenshots, added to issue report

### Priority 6: Negative testing (Phase 1.4)
**Why:** Validates form robustness.
**How:** Systematic spec that tests each field for empty/invalid/boundary values
**Output:** Test results, issues found

### Priority 7: Issue report + summary (Phase 5) (COMPLETE)
**Why:** Final deliverable consolidating all findings.
**How:** Compiled all issues from all phases into formal report with severity, evidence, recommendations
**Output:**
- `06-issues/issue-report.md` — 6 issues (1 critical, 2 medium, 3 low), severity/steps/evidence/recommendation per issue, untested areas list
- `06-issues/summary-report.md` — Executive summary, scope, results, production readiness assessment, 11 deliverables table, next steps

---

## Execution Order

```
Cycle 2:
  ✓ 1. Phase 0 completion (MCP reconnaissance)     → field-inventory, role-matrix, test-plan
  ✓ 2. Helpers + page objects extraction            → reusable code (helpers/, pages/)
  ✓ 3. Structured data capture framework            → execution-logger.ts
  ✓ 4. Generate applicant + officer manuals          → 05-manuals/ (1554 lines total)
  ✓ 5. Compile issue report + summary               → 06-issues/ (6 issues, production readiness)
  ✓ 6. Corrections flow test                        → Phase 2.2 + 3.3 — PASSING (~2 min)
  ✓ 7. Rejection flow test                          → Phase 3.2 — PASSING (~9.1 min) — Board "Denied" + denialLetter upload
  ✓ 8. Negative testing                             → Phase 1.4 — PASSING (~2.5 min) — 46 validation errors, 3 findings
  ✓ 9. Re-run happy path with structured capture    → PASSING (~6 min) — 21 screenshots, 82 fields, execution-log.json
```

---

## Known Issues (from Cycle 1)

### ISSUE-001: Developer License certificate not generated
- **Severity:** 🔴 Critical
- **Phase:** Phase 3 — E2E
- **Description:** Bot "Developer license" has 0 input and 0 output mappings. Certificate PDF is never generated.
- **Fix required:** Configure `certName` input mapping + `link`/`fileObject` output mappings
- **Details:** See `analysis/e2e-establish-new-zone-report.md`

---

## Reference IDs
| Item | ID |
|------|----|
| Service | `d51d6c78-5ead-c948-0b82-0d9bc71cd712` |
| File (test app) | `8681df73-af32-45d6-8af1-30d5a7b0b6a1` |
| Process (test app) | `84e53b18-12b2-11f1-899e-b6594fb67add` |
| Print document | `d4a7bdb6-d813-11bd-fdfa-7b51a25dbf2c` |
| Bot (Developer license) | `02f73ee5-da36-4273-a235-04fe47c187b9` |
| BotRole (Developer license) | `83608914-61d3-c001-8aae-dde29bf85d38` |
| Mule service | `generic-pdf-generator` |
