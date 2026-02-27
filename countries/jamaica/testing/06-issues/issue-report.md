# Issue Report — Establish a New Zone (Jamaica SEZ)

**Service:** Establish a new zone
**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Date:** 2026-02-27
**Tester:** Nelson Perez
**Platform:** Jamaica eRegistrations (https://jamaica.eregistrations.org)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 0 |
| Medium | 5 |
| Low | 3 |
| **Total** | **9** |

---

## ISSUE-001: Developer License certificate not generated (bot has 0 mappings)

**Severity:** Critical
**Phase:** Phase 3 — E2E (end-to-end)
**Component:** Bot "Developer license" (`02f73ee5-da36-4273-a235-04fe47c187b9`)
**Discovered:** 2026-02-26

### Description
The "Developer license" print document exists and is active (30 components configured), and the bot exists and is enabled, but no input or output mappings are configured. The bot cannot execute without mappings.

### Steps to Reproduce
1. Submit a complete "Establish a new zone" application
2. Process all 21 back-office roles through to approval
3. Check the applicant's front-office Certificates column
4. **Expected:** PDF certificate available for download
5. **Actual:** Certificates column is empty — no certificate generated

### Evidence

| Item | Status |
|------|--------|
| Print document "Developer license" (`d4a7bdb6`) | Active, 30 components |
| Bot "Developer license" (`02f73ee5`) | Enabled, type=document, category=document_generate_and_upload |
| BotRole (`83608914`) | Exists in workflow |
| Mule service | `generic-pdf-generator` — "DS - generate and upload license PDF to DS" (POST) |
| **Input mappings** | **0 of 1** — missing `certName` |
| **Output mappings** | **0 of 5** — missing `link`, `fileObject`, `status`, `message`, `error` |

### Required Fix
1. Create input mapping: `certName` → fixed value or form field reference for the certificate name
2. Create output mappings: at minimum `link` and `fileObject` to store the generated PDF in the document store

### Impact
Applicant completes the entire 21-step process and sees "Approved" status but receives no downloadable certificate. This is the final deliverable of the service — without it, the service is non-functional for its primary purpose.

---

## ISSUE-002: FORMDATAVALIDATIONSTATUS gate requires workaround on multiple roles

**Severity:** Medium
**Phase:** Phase 2 — Back-Office
**Component:** Role forms (Documents Check, evaluations, approvals)
**Discovered:** 2026-02-26

### Description
Several back-office roles have their action button disabled by a hidden `FORMDATAVALIDATIONSTATUS` field that must be set to `'true'` before the button becomes clickable. This requires either completing all validation steps correctly or manually setting the value via the Formio JavaScript API.

### Steps to Reproduce
1. Navigate to any evaluation or approval role's processing view
2. Observe that the action button may be disabled
3. The button does not enable until all required form fields are filled AND `FORMDATAVALIDATIONSTATUS` is set

### Impact
- Officers may not understand why the action button is disabled
- No visible error message explains what fields are missing
- Could block processing if officers don't complete all required fields

### Recommendation
Verify that the form validation provides clear error messages when fields are missing. Consider adding a visible validation summary near the action button.

---

## ISSUE-003: EditGrid rows must be explicitly saved before role action buttons work

**Severity:** Medium
**Phase:** Phase 2 — Back-Office
**Component:** ARC decision, Board submission
**Discovered:** 2026-02-26

### Description
Roles that contain EditGrid components (ARC decision, Board submission) require that all EditGrid rows be explicitly saved (state changed from 'new'/'editing' to 'saved') before the role's action button can be clicked. If a row is in editing state, the action button click may fail silently or trigger a validation error.

### Steps to Reproduce
1. Navigate to ARC decision or Board submission role
2. Add data to the EditGrid row
3. Attempt to click the action button WITHOUT clicking "Save" on the EditGrid row
4. **Expected:** Button works or shows clear error
5. **Actual:** Button may fail silently or show unclear validation error

### Impact
Officers may be confused when their action fails with no clear feedback.

### Recommendation
Either auto-save EditGrid rows when the action button is clicked, or display a clear warning message indicating unsaved rows.

---

## ISSUE-004: NOC consultation role requires file uploads with no guidance

**Severity:** Low
**Phase:** Phase 2 — Back-Office
**Component:** Organize NOC & Inspection role
**Discovered:** 2026-02-26

### Description
The "Organize NOC & Inspection" role requires uploading consultation documents before the "Send consultation documents" button can be used. There is no on-screen guidance about what documents to upload or which browse link corresponds to which agency.

### Steps to Reproduce
1. Navigate to the "Organize NOC & Inspection" role
2. Observe multiple browse links for file uploads
3. No labels or instructions indicate which files to upload

### Impact
Officers may upload incorrect documents or miss required uploads.

### Recommendation
Add labels or helper text near each upload field indicating the expected document type and target agency.

---

## ISSUE-005: Agency approval radio selection not clearly labeled

**Severity:** Low
**Phase:** Phase 2 — Back-Office
**Component:** JCA/TAJ/MOFPS Approval roles
**Discovered:** 2026-02-26

### Description
The agency approval roles (JCA, TAJ, MOFPS) require selecting "No objection" via a radio button before clicking "Send decision to SEZA". The radio options are present but the label text and layout could be clearer about the decision being made.

### Steps to Reproduce
1. Navigate to any agency approval role (e.g., TAJ Approval)
2. Observe the radio button options
3. Select "No objection" and click "Send decision to SEZA"

### Impact
Minor UX issue — officers can complete the action but the interface could be more intuitive.

### Recommendation
Ensure radio labels clearly state the decision options (e.g., "No objection — approve" vs "Objection — deny").

---

## ISSUE-006: 28 inactive roles with sort_order 299

**Severity:** Low
**Phase:** Phase 0 — Reconnaissance
**Component:** Service configuration
**Discovered:** 2026-02-26

### Description
The service has 49 total roles, of which 28 are inactive (sort_order = 299). These appear to be either placeholder, template, or decommissioned roles. While they don't affect the active workflow, their presence adds complexity to the configuration.

### Steps to Reproduce
1. Query the service roles via BPA MCP: `role_list` for service `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
2. Observe 49 roles, 28 with sort_order 299

### Impact
No functional impact. Configuration clutter only.

### Recommendation
Review and remove or archive inactive roles that are no longer needed.

---

## ISSUE-007: Negative numbers accepted in numeric fields

**Severity:** Medium
**Phase:** Phase 4 — Negative Testing (SEZ-049, SEZ-055)
**Component:** Front-office form — number fields (e.g., Total land area)
**Discovered:** 2026-02-27

### Description
Number fields such as "Total land area" accept negative values (e.g., `-100`). The input is rendered as `type="text"` by Form.io with auto-formatting, so there is no browser-native min/max validation. A negative zone area or negative parcel count is not a valid business value.

### Steps to Reproduce
1. Open a new "Establish a new zone" application
2. Navigate to Project Overview tab
3. Enter `-100` in the "Total land area" field
4. **Expected:** Field rejects negative value or shows validation error
5. **Actual:** Value accepted without error, formatted as "-100"

### Impact
Applicants could submit applications with nonsensical negative values for area, parcels, or other quantities.

### Recommendation
Add minimum value validation (≥0 or ≥1) to numeric fields that represent physical quantities.

---

## ISSUE-008: No phone number format validation

**Severity:** Medium
**Phase:** Phase 4 — Negative Testing (SEZ-049)
**Component:** Front-office form — phone fields (`applicantPhone`, `applicantPhone2`)
**Discovered:** 2026-02-27

### Description
Phone fields accept any arbitrary text input (e.g., "not-a-phone") without field-level validation. There is no format mask, pattern validation, or error message for invalid phone numbers.

### Steps to Reproduce
1. Navigate to Developer tab
2. Enter "not-a-phone" in the Phone field
3. Click elsewhere to trigger validation
4. **Expected:** Validation error for invalid phone format
5. **Actual:** No error shown, value accepted

### Impact
Data quality issue — invalid phone numbers may be submitted, making it impossible for officers to contact applicants.

### Recommendation
Add phone format validation (regex or mask) matching Jamaican phone number format (e.g., `(876) XXX-XXXX` or similar).

---

## ISSUE-009: No maximum length on text input fields

**Severity:** Medium
**Phase:** Phase 4 — Negative Testing
**Component:** Front-office form — text fields (e.g., `applicantCompanyName`)
**Discovered:** 2026-02-27

### Description
Text input fields have no maximum character length enforced. The Company Name field accepted 500 characters without truncation or error. This could cause display issues in back-office views, PDF certificates, and database storage.

### Steps to Reproduce
1. Navigate to Developer tab
2. Enter 500 characters in the "Company name" field
3. **Expected:** Field truncates input or shows max-length warning
4. **Actual:** All 500 characters accepted

### Impact
Potential display overflow in back-office dashboards, PDF certificates, and printed documents.

### Recommendation
Add `maxLength` validation to text fields with reasonable limits (e.g., 200 chars for names, 500 for addresses).

---

## Not Yet Tested

The following areas have not yet been tested and may contain additional issues:

| Area | Phase | Status |
|------|-------|--------|
| ~~Negative testing (empty fields, invalid formats, wrong file types)~~ | ~~Phase 1.4~~ | ✅ Done |
| ~~Corrections flow (officer sends back, applicant corrects, resubmit)~~ | ~~Phase 2.2~~ | ✅ Done |
| ~~Rejection flow (officer rejects, applicant sees rejection)~~ | ~~Phase 3.2~~ | ✅ Done |
| Email notifications at each stage | Phase 3.3 | Pending |
| Status consistency (dashboard vs email vs timeline) | Phase 3.3 | Pending |
| Multiple simultaneous applications | Phase 2.4 | Pending |
| Browser back/forward behavior during form fill | Phase 1.4 | Pending |
| Session timeout handling | Phase 1.4 | Pending |
