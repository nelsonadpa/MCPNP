# Test Plan — Establish a new zone (Jamaica SEZ)

**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Date:** 2026-02-25
**Priority:** Critical path first, then edge cases

---

## Test Matrix

### Phase 1 — Front-Office (Applicant)

| Test ID | Scenario | Description | Expected Result | Priority |
|---------|----------|-------------|-----------------|----------|
| T-001 | Happy path — Full submission | Fill all 63 panels with valid data, upload docs, sign consents, pay, submit | Application accepted, reference number generated, status visible in dashboard | Critical |
| T-002 | Empty submission | Attempt to submit with no fields filled | Submission blocked or warning shown (NOTE: all fields optional — verify behavior) | Critical |
| T-003 | Partial submission | Fill only core sections (company, zone identity, land) | Verify which validations trigger, if any | High |
| T-004 | Consent gates | Attempt submission without signing consents/undertaking | Blocked by boolean determinants (Consent 1, Consent 2, Undertaking) | Critical |
| T-005 | Document uploads — valid | Upload valid PDFs/images for all 33 document slots | Files accepted, previews shown | Critical |
| T-006 | Document uploads — invalid | Upload wrong formats, oversized files, empty files | Error messages, upload rejected | High |
| T-007 | Document uploads — special chars | Upload files with accents, spaces, special chars in names | File accepted or clear error | Medium |
| T-008 | EditGrid — Shareholders | Add multiple shareholders with beneficial ownership info | Grid rows added, data persists | High |
| T-009 | EditGrid — Parcels | Add multiple land parcels with area calculations | Grid rows added, totals calculate | High |
| T-010 | Select/Radio fields | Test all 124 select + 110 radio fields for option availability | All options render, selections persist | High |
| T-011 | Numeric validation | Enter negative numbers, decimals, extremely large values in number fields | Appropriate validation or acceptance | Medium |
| T-012 | Date fields | Test 29 datetime fields with valid/invalid dates | Valid dates accepted, invalid rejected | Medium |
| T-013 | Navigation buttons | Test all 11 navigation buttons (Go to Business Plan, Compliance, Master Plan) | Correct tab/section navigation | High |
| T-014 | Tab navigation | Test 4 tab groups (Business Plan, Compliance) for correct panel switching | Tabs switch correctly, data persists | High |
| T-015 | Form persistence | Fill partial form, close browser, return | Data saved as draft or lost (document behavior) | High |
| T-016 | Browser back/forward | Navigate forward then use browser back button | Form state preserved or graceful handling | Medium |
| T-017 | Conditional fields | Trigger classification determinants (company type, activity type) | Conditional panels show/hide correctly | High |
| T-018 | Capital threshold | Enter paid-up capital < $1.5M USD | Determinant triggers, verify behavior change | High |
| T-019 | Survey fields | Complete 9 survey checklists (hazard, plan, security assessments) | Responses saved correctly | Medium |
| T-020 | Email validation | Enter invalid emails in 2 email fields | Validation error shown | Medium |
| T-021 | Phased development path | Select "yes" for phased development | Phasing/annexation conditional sections appear | High |
| T-022 | Displacement path | Select "yes" for displacement | Resettlement plan section appears | High |
| T-023 | Excise goods path | Select "yes" for excise goods handling | Excise declaration section appears | High |
| T-024 | External company path | Select company type = external | External company-specific fields appear | High |
| T-025 | Land rights — in process | Select "in process of acquiring rights" | Additional documentation requirements appear | High |
| T-026 | Digital payment | Test digital payment flow (isPayedDigitally) | Payment processed or simulated correctly | Critical |

### Phase 2 — Back-Office (Officers)

| Test ID | Scenario | Description | Expected Result | Priority |
|---------|----------|-------------|-----------------|----------|
| T-100 | Documents check — approve | Officer reviews submission, approves | File moves to parallel evaluation (Order 1) | Critical |
| T-101 | Documents check — return | Officer returns for missing documents | File returns to applicant with comments | Critical |
| T-102 | Legal evaluation — review | Legal officer reviews and adds conditions/risks | Conditions/risks flagged, comments recorded | Critical |
| T-103 | Technical evaluation — review | Technical officer reviews | Recommendations recorded | Critical |
| T-104 | Business evaluation — review | Business officer reviews | Recommendations recorded | Critical |
| T-105 | Compliance evaluation — review | Compliance officer reviews | Recommendations recorded | Critical |
| T-106 | NOC coordination | Organize NOC and inspection role | NOC process initiated | High |
| T-107 | JCA due diligence | JCA officer completes due diligence | Clearance recorded | Critical |
| T-108 | TAJ due diligence | TAJ officer completes due diligence | Clearance recorded | Critical |
| T-109 | MOFPS due diligence | MOFPS officer completes due diligence | Clearance recorded | Critical |
| T-110 | JCA approval | JCA approves no objection | ARC determinant updated | Critical |
| T-111 | TAJ approval | TAJ approves no objection | ARC determinant updated | Critical |
| T-112 | MOFPS approval | MOFPS approves no objection | ARC determinant updated | Critical |
| T-113 | Business approval — pre-approval | BPSS recommends pre-approval | Recommendation recorded | Critical |
| T-114 | Business approval — ministerial | BPSS recommends ministerial approval | Ministerial path triggered | High |
| T-115 | Technical approval — denial | TSI recommends denial | Denial path available | High |
| T-116 | Compliance approval — conditions | CAS approves with conditions | Conditions timeline grid appears | High |
| T-117 | Legal approval — risks | LSU flags risks | Risk documentation required | High |
| T-118 | ARC consolidation | ARC reviews all agency inputs | Consolidated view of conditions/risks/recommendations | Critical |
| T-119 | ARC — request info | ARC requests complementary information | File returns to applicant | Critical |
| T-120 | Status letter | Prepare and sign status letter | Letter generated and signed | High |
| T-121 | Board submission | File submitted to board | Board receives file | Critical |
| T-122 | CEO validation | CEO validates before board | Validation recorded | Critical |
| T-123 | Board — approve | Board approves (BOD = Approved) | Pre-approval letter generated | Critical |
| T-124 | Board — deny | Board denies (BOD = denied) | Denial letter generated | Critical |
| T-125 | License agreement drafting | Legal officers draft license | Draft created | High |
| T-126 | Issue license agreement | CEO issues license | License document generated (PDF bot) | Critical |
| T-127 | Ministerial order chain | Full ministerial process | Order drafted → reviewed → approved → gazetted | High |
| T-128 | Inspection workflow | Invite → Technical → General inspection | Inspection completed | High |
| T-129 | Operating certificate | Certificate prepared and dispatched | Certificate issued | High |
| T-130 | Billing workflow | Billing info → approval → invoice → approval | Invoice issued | High |
| T-131 | Approver comments validation | Approver tries to proceed without comments | Blocked by text determinants (NOT_EQUAL "") | High |
| T-132 | Timeline grids | Conditions trigger timeline grid entry | Grid renders, milestones editable | Medium |

### Phase 3 — End-to-End

| Test ID | Scenario | Description | Expected Result | Priority |
|---------|----------|-------------|-----------------|----------|
| T-200 | Full happy path | Applicant → All evaluations → All approvals → ARC → Board approve → License → Certificate | Complete cycle, all outputs generated | Critical |
| T-201 | Correction loop | Applicant → Documents check → Return → Applicant corrects → Resubmit → Approve | Correction flow works end-to-end | Critical |
| T-202 | Denial path | Applicant → Evaluations → Board deny | Denial letter generated, applicant notified | Critical |
| T-203 | Ministerial path | Approval triggers ministerial bundle through gazette | Full ministerial chain completes | High |
| T-204 | Conditions path | Evaluation with conditions → ARC consolidation → Conditional approval | Conditions tracked through all stages | High |
| T-205 | Status consistency | Verify applicant dashboard status matches actual processing stage at every step | Status labels accurate throughout | Critical |

### Phase 4 — Edge Cases

| Test ID | Scenario | Description | Expected Result | Priority |
|---------|----------|-------------|-----------------|----------|
| T-300 | Unlinked bots | Trigger internal bots with unlinked services | No runtime errors, graceful handling | High |
| T-301 | Concurrent officer access | Two officers open same file | No data corruption, clear locking or warning | Medium |
| T-302 | Large file uploads | Upload maximum-size documents across all 33 slots | System handles without timeout | Medium |
| T-303 | Land area mismatch | Total surface ≠ total land area (numeric determinant) | Validation error or warning | High |
| T-304 | Session timeout | Leave form idle until session expires | Graceful recovery, no data loss | Medium |
| T-305 | Mobile responsive | Access applicant form from mobile device | Form usable or clear mobile disclaimer | Low |

---

## Test Priorities Summary

| Priority | Count | Phase |
|----------|-------|-------|
| Critical | 22 | Across all phases |
| High | 28 | Across all phases |
| Medium | 11 | Front-office + edge cases |
| Low | 1 | Edge cases |

**Total test cases: 62**

---

## Prerequisites

1. **Test credentials** — Applicant account + officer accounts for each of the 49 roles (at minimum: Documents check, Legal/Technical/Business/Compliance evaluators, JCA/TAJ/MOFPS officers, ARC, Board, CEO)
2. **Test documents** — Valid PDFs for 33 document upload slots
3. **Jamaica Playwright config** — Update playwright.config.ts with Jamaica baseURL and auth state
4. **Test data set** — Realistic but clearly test data (prefix "TEST-SEZ-")
