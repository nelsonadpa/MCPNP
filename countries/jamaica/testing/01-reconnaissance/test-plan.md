# Test Plan — Establish a New Zone (Jamaica SEZ)

## Service Info
- **Service**: Establish a new zone
- **Service ID**: `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
- **URL**: https://jamaica.eregistrations.org
- **Date**: 2026-02-26

## Priority Levels
- **P0** — Critical: Blocks the entire workflow. Must pass.
- **P1** — High: Core functionality per role. Should pass for release.
- **P2** — Medium: Edge cases and negative testing. Important for quality.
- **P3** — Low: Nice-to-have, cosmetic, or exploratory.

---

## Test Matrix

### Phase 1 — Front Office (Applicant)

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-001 | Front Office | Application creation | Applicant creates a new "Establish a new zone" application from the service catalog | Application created, form displayed with all 5 sub-tabs (Project overview, Developer, Master plan, Business plan, Compliance) | P0 |
| SEZ-002 | Front Office | Fill required fields — Project Overview | Fill all required fields in the Project Overview tab (14 fields) | Fields accept valid input, validation passes, tab shows as complete | P0 |
| SEZ-003 | Front Office | Fill required fields — Developer | Fill all required fields in the Developer tab (39 fields) | Fields accept valid input, validation passes | P0 |
| SEZ-004 | Front Office | Fill required fields — Master Plan | Fill all required fields in the Master Plan tab (128 fields including numbers, radios, selects, textareas) | Fields accept valid input, form navigation works across large tab | P0 |
| SEZ-005 | Front Office | Fill required fields — Business Plan | Fill all required fields in the Business Plan tab (12 fields) | Fields accept valid input, validation passes | P0 |
| SEZ-006 | Front Office | Fill required fields — Compliance | Fill all required fields across all 6 Compliance side-nav sections (Ownership & financial integrity, H&S, Disaster mitigation, Security plan, Licensing & Permits, Customs) | All sub-sections complete, side-nav reflects completion | P0 |
| SEZ-007 | Front Office | Upload required documents | Upload all 33 required documents in valid formats | Documents upload successfully, appear in document list with correct labels | P0 |
| SEZ-008 | Front Office | Payment tab | Complete the payment step on the Payment tab | Payment processed or marked as exempt | P1 |
| SEZ-009 | Front Office | Submit application | Click Send on the Send tab to submit the completed application | Application status changes to submitted, confirmation shown, application appears in back-office queue | P0 |

### Phase 2 — Back Office: Documents Check

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-010 | Back Office | Documents Check — view application | Documents Check officer (Michelle Hewett / Britania Bryan) opens the submitted application | All applicant data and 33 documents are visible and accessible | P0 |
| SEZ-011 | Back Office | Documents Check — approve | Officer confirms documents are complete and routes to evaluations | Application moves to all 4 parallel evaluation steps simultaneously (Legal, Technical, Business, Compliance) | P0 |

### Phase 3 — Back Office: Parallel Evaluations

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-012 | Back Office | Legal Evaluation — complete | Legal officer (Joanna Mills / Branttany Oforkaja / Shaquille Douglas) reviews application and fills evaluation fields, clicks "Send evaluation to approval" | Evaluation data saved, step marked complete | P0 |
| SEZ-013 | Back Office | Technical Evaluation — complete | Technical officer (Krissan Meredith / Leondra Power / Alianne Barrows) reviews and fills evaluation fields, submits | Evaluation data saved, step marked complete | P0 |
| SEZ-014 | Back Office | Business Evaluation — complete | Business analyst (Brittany Johnson) fills evaluation, clicks "Send evaluation for approval" | Evaluation data saved, step marked complete | P0 |
| SEZ-015 | Back Office | Compliance Evaluation — complete | Compliance officer (Chevaughn Dacres / Cristena Smith / Abigail Johnston / Carleen Clacken-Reid) fills evaluation, clicks "Send evaluation for approval" | Evaluation data saved, step marked complete | P0 |
| SEZ-016 | Back Office | Evaluations gate — all complete | All 4 parallel evaluations finished | Workflow advances to Organize NOC & Inspection (step 6) | P0 |

### Phase 4 — Back Office: External Agency Consultations (NOC)

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-017 | Back Office | Organize NOC — send documents | Officer uploads consultation files for JCA, TAJ, MOFPS and clicks "Send consultation documents" | Documents sent to all 3 agencies, NOC roles activated in parallel | P0 |
| SEZ-018 | Back Office | JCA Approval — no objection | JCA officer selects "No objection" radio, clicks "Send decision to SEZA" | No-objection recorded on No objection JCA registration, step complete | P0 |
| SEZ-019 | Back Office | TAJ Approval — no objection | TAJ officer selects "No objection" radio, clicks "Send decision to SEZA" | No-objection recorded on No objection TAJ registration, step complete | P0 |
| SEZ-020 | Back Office | MOFPS Approval — no objection | MOFPS officer selects "No objection" radio, clicks "Send decision to SEZA" | No-objection recorded on No objection MOFPS registration, step complete | P0 |
| SEZ-021 | Back Office | External NOC gate — all complete | All 3 agency no-objections received | Workflow advances to internal approvals (Legal, Technical, Business, Compliance Approval) | P0 |

### Phase 5 — Back Office: Internal Approvals

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-022 | Back Office | Legal Approval — approve | Senior Director Legal Services (Janis Williams) clicks "Approve" | Legal approval recorded, step complete | P0 |
| SEZ-023 | Back Office | Technical Approval — approve | Director Technical Services & Infrastructure (Deborah Broomfield) clicks "Approve" | Technical approval recorded, step complete | P0 |
| SEZ-024 | Back Office | Business Approval — approve | Senior Director BPSS (Licia Grant Mullings) or Director SRM (Yeuniek Hinds) clicks "Approve" | Business approval recorded, step complete | P0 |
| SEZ-025 | Back Office | Compliance Approval — approve | COO (Ainsley Brown) clicks "Approve" | Compliance approval recorded, all internal approvals complete, advances to ARC | P0 |

### Phase 6 — Back Office: ARC, Decision, Board & Final

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-026 | Back Office | ARC — review consolidated data | ARC committee reviews consolidated evaluations, risks, conditions, and agency NOC recommendations (transferred by internal bots) | All consolidated data visible: conditions, risks, agency recommendations | P0 |
| SEZ-027 | Back Office | ARC — approve | ARC clicks "Approve" | Application approved at committee level, workflow advances to Status Letter | P0 |
| SEZ-028 | Back Office | Status Letter — draft | Officer (Michelle Hewett / Britannia Bryan) drafts the official status/decision letter | Letter content saved, advances to Signature | P1 |
| SEZ-029 | Back Office | Signature Status Letter — sign | Senior Director (Licia Grant Mullings / Yeuniek Hinds) signs status letter by clicking "Approve" | Signed letter recorded, advances to Board Submission | P1 |
| SEZ-030 | Back Office | Board Submission — prepare | Officer prepares and submits board package | Package compiled, advances to CEO Validation | P1 |
| SEZ-031 | Back Office | CEO Validation — validate | Corporate Secretary validates and clicks "Approve" | Validated, advances to Board | P1 |
| SEZ-032 | Back Office | Board — approve | Board issues final approval for zone establishment | Application approved at board level, advances to SEZ Documents | P0 |
| SEZ-033 | Back Office | SEZ Documents — upload final docs | Officer uploads licence, operating certificate, and other final documents | Documents stored, entire process marked complete | P1 |
| SEZ-034 | Back Office | End-to-end status consistency | Verify application status is correct at each stage transition from creation through completion | Status reflects current workflow step accurately at every point | P0 |

### Phase 7 — Corrections Flow

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-035 | Corrections | Documents Check — request corrections | Documents Check officer identifies missing/invalid documents and requests corrections from applicant | Application routed to Complementary Information (applicant-side role) | P0 |
| SEZ-036 | Corrections | Complementary Info — applicant receives request | Applicant sees correction request with clear instructions on what needs fixing | Correction instructions visible, relevant fields/uploads are editable | P0 |
| SEZ-037 | Corrections | Complementary Info — applicant resubmits | Applicant fixes identified issues and clicks "Validate send page" | Application re-enters back-office workflow at Documents Check step | P0 |
| SEZ-038 | Corrections | ARC — request corrections | ARC committee requests additional information from applicant | Application loops back to Complementary Information role | P1 |
| SEZ-039 | Corrections | Multiple correction rounds | Application goes through 2+ correction cycles (Documents Check returns twice) | Each cycle works correctly, no data loss, history of corrections preserved | P1 |
| SEZ-040 | Corrections | Corrections after partial evaluations | Corrections requested after some evaluations completed but before all finish | Evaluation data preserved, re-routing works correctly | P2 |
| SEZ-041 | Corrections | Applicant adds new documents during correction | Applicant uploads additional documents not originally submitted during correction cycle | New documents appear in document list, officer can verify them | P1 |

### Phase 8 — Rejection Flow

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-042 | Rejection | ARC — reject application | ARC committee rejects the application outright | Application marked as rejected, applicant notified, no further workflow steps available | P1 |
| SEZ-043 | Rejection | Board — reject application | Board denies zone establishment at final decision | Application marked as rejected, workflow terminates cleanly | P1 |
| SEZ-044 | Rejection | External agency objection — JCA | JCA issues an objection instead of "No objection" | Objection recorded, verify workflow behavior (blocks or flags for ARC?) | P1 |
| SEZ-045 | Rejection | External agency objection — TAJ | TAJ issues an objection | Objection recorded, verify workflow behavior | P1 |
| SEZ-046 | Rejection | External agency objection — MOFPS | MOFPS issues an objection | Objection recorded, verify workflow behavior | P1 |
| SEZ-047 | Rejection | Applicant view after rejection | Applicant checks dashboard after application is rejected | Status shows rejected, application is read-only, no resubmit option | P1 |

### Phase 9 — Negative Testing: Front Office

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-048 | Negative | Submit with empty required fields | Attempt to submit application with all 46 required fields left blank | Validation errors shown, submission blocked, missing fields highlighted per tab | P1 |
| SEZ-049 | Negative | Invalid number format | Enter text ("abc") in number fields (43 number fields across form) | Field rejects invalid input or shows validation error on submit | P2 |
| SEZ-050 | Negative | Invalid email format | Enter malformed email (e.g., "notanemail") in the 2 email fields | Validation error shown, field highlighted | P2 |
| SEZ-051 | Negative | Upload wrong file type | Upload .exe or other clearly invalid file type for document requirements | Upload rejected or error message displayed | P2 |
| SEZ-052 | Negative | Upload oversized file | Upload a file exceeding system size limits | Upload rejected with clear error message about size limit | P2 |
| SEZ-053 | Negative | Submit with zero documents | Attempt to submit application with none of the 33 required documents uploaded | Submission blocked, missing documents identified | P1 |
| SEZ-054 | Negative | Partial document upload | Upload only 15 of 33 required documents and attempt submit | Submission blocked, list of remaining required documents shown | P1 |
| SEZ-055 | Negative | Negative numbers in financial fields | Enter negative values in financial/quantity number fields | Rejected or flagged — negative zone area, negative capital not valid | P2 |
| SEZ-056 | Negative | Invalid date formats | Enter dates like "31/02/2026" or "00/00/0000" in datetime fields | Validation error, invalid date rejected | P2 |

### Phase 10 — Negative Testing: Back Office

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-057 | Negative | NOC without file uploads | Organize NOC officer clicks "Send consultation documents" without uploading required files for JCA, TAJ, MOFPS | Action blocked or error shown — files are required per agency | P1 |
| SEZ-058 | Negative | Agency decision without radio selection | JCA/TAJ/MOFPS officer clicks "Send decision to SEZA" without selecting the "No objection" radio | Action blocked, radio selection required before proceeding | P1 |
| SEZ-059 | Negative | ARC approve with EditGrid "new" rows | ARC tries to approve while EditGrid has rows stuck in "new" state | Submission blocked — known issue: EditGrid rows in "new" state block submission | P1 |
| SEZ-060 | Negative | Board Submission with EditGrid "new" rows | Board Submission step with EditGrid rows in "new" state | Submission blocked — known issue: verify exact error behavior | P1 |
| SEZ-061 | Negative | Evaluation submit without filling fields | Evaluator clicks action button without filling required evaluation fields | Action blocked or warning shown | P2 |

### Phase 11 — Edge Cases

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-062 | Edge Case | Browser back during form submission | Click browser back button while application submission is processing | No duplicate submission created, form state preserved or clear error | P2 |
| SEZ-063 | Edge Case | Browser forward after submit | Use browser forward navigation after submitting the application | No re-submission, shows appropriate post-submission state | P2 |
| SEZ-064 | Edge Case | Multiple tabs — same application | Open the same application in two browser tabs, edit different fields simultaneously | No data corruption; last save wins or conflict warning displayed | P2 |
| SEZ-065 | Edge Case | Session timeout during editing | Allow session to expire while applicant is filling the 469-component form | Save warning or graceful redirect to login, no silent data loss | P2 |
| SEZ-066 | Edge Case | Wrong role — direct URL access | Attempt to access a back-office step URL (e.g., Legal Evaluation) with an unauthorized user account | Access denied, user redirected or shown permission error | P1 |
| SEZ-067 | Edge Case | Access completed step | Officer tries to re-access a workflow step they already completed | Read-only view or access denied; no ability to re-process or duplicate action | P2 |
| SEZ-068 | Edge Case | Concurrent evaluation completion | Two evaluators (e.g., Legal and Business) complete their parallel steps at the exact same moment | Both saves succeed, no race condition on workflow advancement to NOC phase | P2 |
| SEZ-069 | Edge Case | Large Master Plan form performance | Fill all 128 fields in Master Plan tab and verify form responsiveness | Form remains responsive, no timeouts or UI freezing | P3 |
| SEZ-070 | Edge Case | Undo after approval action | Officer clicks "Approve" then attempts to undo or retract | Action is final (no undo) or undo mechanism works correctly | P2 |
| SEZ-071 | Edge Case | Simultaneous NOC responses | All 3 agencies (JCA, TAJ, MOFPS) submit their no-objection decisions at the same time | All 3 recorded correctly, workflow gate triggers properly | P2 |

### Phase 12 — Status Consistency Checks

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-072 | Status | Applicant view after submission | Applicant checks application status immediately after submitting | Status shows "In processing" or equivalent; form is read-only | P1 |
| SEZ-073 | Status | Status during parallel evaluations | Check application status while 4 evaluations are in progress | Status reflects evaluation phase (e.g., "Under review") | P2 |
| SEZ-074 | Status | Status during external NOC | Check status while waiting for JCA, TAJ, MOFPS no-objections | Status reflects awaiting external agency consultation | P2 |
| SEZ-075 | Status | Status after ARC approval | Check status after ARC committee approves | Status reflects post-committee approval stage | P2 |
| SEZ-076 | Status | Status after Board approval — final | Check status after Board gives final approval | Status reflects approved/completed | P1 |
| SEZ-077 | Status | Status after rejection | Check status after ARC or Board rejects | Status reflects rejected, no further actions available to applicant | P1 |
| SEZ-078 | Status | Status during corrections loop | Applicant checks status while in Complementary Information phase | Status reflects "Corrections requested" or equivalent | P2 |

### Phase 13 — Certificate & Document Generation

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-079 | Certificate | Developer license PDF generation | Complete full happy-path workflow and verify Developer license PDF is generated by the bot | **EXPECTED FAIL** — "Developer license" bot has 0 input and 0 output mappings; certificate will not generate | P0 |
| SEZ-080 | Certificate | Developer license PDF content | If/when bot mappings are configured: verify the generated PDF contains correct applicant data across all 30 print document components | All 30 components render with correct, populated data from the application | P1 |
| SEZ-081 | Certificate | DEVELOPERS GDB record creation | Verify "DEVELOPERS create" bot (GDB.GDB-ZONE ENTITIES(2.8)-create) creates the developer entity record in Global DB | GDB record created with correct zone entity data | P1 |

### Phase 14 — Bot Data Transfer Verification

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-082 | Bots | Conditions to ARC — consolidated | Verify "APPROVALS to ARC - conditions to consolidated" bot correctly transfers approval conditions | ARC review screen shows consolidated conditions from all 4 evaluation/approval domains | P1 |
| SEZ-083 | Bots | Risks to ARC — consolidated | Verify "APPROVALS to ARC - risks to consolidated" bot correctly transfers risk assessments | ARC review screen shows consolidated risks from all domains | P1 |
| SEZ-084 | Bots | NOC recommendations to ARC | Verify "NOC to ARC - recommendations agencies" bot transfers agency recommendations | ARC sees JCA, TAJ, MOFPS recommendations and no-objection statuses | P1 |
| SEZ-085 | Bots | Documents to LSU-R | Verify "DOCUMENTS to LSU-R" bot transfers documents to Legal Services Unit (Revision) | Legal evaluation/approval roles can access transferred documents | P2 |
| SEZ-086 | Bots | Docs and data to LSU | Verify "Docs and data to LSU" bot transfers full data package to LSU | LSU roles have complete document and data access | P2 |
| SEZ-087 | Bots | APPROVALS to ARC — risks (non-consolidated) | Verify "APPROVALS to ARC - risks" bot transfers risk data correctly | Risk data available at ARC step in expected format | P2 |

### Phase 15 — Cross-Cutting Concerns

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| SEZ-088 | Cross-cutting | Form save on tab switch | Switch between form sub-tabs (Project overview to Developer to Master plan, etc.) | Data preserved across tab switches, no silent data loss | P1 |
| SEZ-089 | Cross-cutting | Compliance side-nav navigation | Navigate between all 6 Compliance side-nav sections (Ownership, H&S, Disaster, Security, Licensing, Customs) | Each section loads correctly, previously entered data persists | P1 |
| SEZ-090 | Cross-cutting | Radio button groups — all 32 | Verify all 32 radio fields across the form render options and persist selection | Each radio group allows single selection, value persists after save | P2 |
| SEZ-091 | Cross-cutting | Select/dropdown fields — all 15 | Verify all 15 select fields load their options and save the selected value | Options load fully, selection persists, no blank/null option bugs | P2 |
| SEZ-092 | Cross-cutting | Datetime field validation — all 5 | Verify all 5 datetime fields accept valid dates and reject invalid inputs | Date picker functional, format consistent, invalid dates rejected | P2 |
| SEZ-093 | Cross-cutting | Survey field behavior | Interact with the single survey-type field on the form | Survey renders correctly, response captured and persisted | P3 |
| SEZ-094 | Cross-cutting | Checkbox fields — both 2 | Verify both checkbox fields allow multi-select and persist state | Check/uncheck works, state persists after save | P2 |
| SEZ-095 | Cross-cutting | File upload fields — all 16 | Verify all 16 file-type form fields (distinct from document requirements) accept uploads | Files upload, preview/download works, persist after save | P1 |

---

## Test Phase Execution Order

| Execution Order | Phase | Test IDs | Dependency | Estimated Effort |
|----------------|-------|----------|------------|-----------------|
| 1 | Front Office — Happy Path | SEZ-001 to SEZ-009 | None | High (469 components, 33 docs) |
| 2 | Back Office — Happy Path | SEZ-010 to SEZ-034 | Phase 1 complete | High (21 workflow steps) |
| 3 | Corrections Flow | SEZ-035 to SEZ-041 | Phase 2 at Documents Check | Medium |
| 4 | Rejection Flow | SEZ-042 to SEZ-047 | Phase 2 at ARC/Board | Medium |
| 5 | Negative Testing — Front | SEZ-048 to SEZ-056 | Phase 1 setup | Medium |
| 6 | Negative Testing — Back | SEZ-057 to SEZ-061 | Phase 2 setup | Medium |
| 7 | Edge Cases | SEZ-062 to SEZ-071 | Phase 1 setup | Low-Medium |
| 8 | Status Checks | SEZ-072 to SEZ-078 | Run alongside Phases 1-2 | Low |
| 9 | Certificate & Bots | SEZ-079 to SEZ-087 | Full workflow complete | Medium |
| 10 | Cross-cutting | SEZ-088 to SEZ-095 | Phase 1 setup | Low |

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 20 | Critical path — must pass for any release |
| P1 | 33 | Core functionality — should pass for release |
| P2 | 30 | Edge cases & negative testing — important for quality |
| P3 | 2 | Nice-to-have — exploratory |
| **Total** | **85** | |

## Known Blockers

| # | Blocker | Affected Tests | Severity |
|---|---------|---------------|----------|
| 1 | Developer License bot has 0 input/output mappings — certificate generation non-functional | SEZ-079, SEZ-080 | Critical |
| 2 | EditGrid rows in "new" state block submission | SEZ-059, SEZ-060 | High |
| 3 | Complementary Information is applicant-side (not back-office) — requires front-office test account | SEZ-036, SEZ-037 | Info |

## Prerequisites

1. **Test credentials** — Applicant account + officer accounts for each active role (minimum: Documents Check, 4 evaluators, Organize NOC, JCA/TAJ/MOFPS officers, 4 internal approvers, ARC, Status Letter, Signature, Board Submission, CEO, Board, SEZ Documents)
2. **Test documents** — 33 valid PDF/image files for document upload requirements + consultation files for NOC
3. **Jamaica Playwright config** — `playwright.config.ts` with Jamaica `baseURL` (https://jamaica.eregistrations.org) and auth state
4. **Test data set** — Realistic but clearly test data (prefix "TEST-SEZ-" for all entries)
5. **Bot mapping fix** — Developer License bot needs mappings configured before SEZ-079/SEZ-080 can pass
