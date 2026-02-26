# Phase 1 — Front-Office Test Results

**Service:** Establish a new zone (Jamaica SEZ)
**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Date:** 2026-02-26
**Tester:** Automated (Playwright) + Claude Code + Nelson Perez
**Final spec:** `specs/p1-submit-complete.spec.ts` (v13, 1109 lines)
**Result:** **SUBMITTED SUCCESSFULLY**

---

## Summary

| Metric | Value |
|--------|-------|
| Submission status | **File submitted successfully!** (green toast on dashboard) |
| Validation errors at submit | **0** |
| Total file uploads | **28** (4 Developer + 17 Master Plan + 1 Business Plan + 5 Compliance + 1 Payment) |
| Spec iterations to success | 13 (v1–v13) |
| Final run time | 7.1 minutes |
| Test timeout | 20 minutes (1,200,000 ms) |
| Post-submit redirect | `https://jamaica.eregistrations.org/` (dashboard) |
| Screenshots captured | 10 (P1-SUB-01 through P1-SUB-10) |

---

## UI Architecture

### Top-level tabs
```
Form | Payment | Send
```

### Form sub-tabs (5)
```
Project overview | Developer | Master plan | Business plan | Compliance
```

### Compliance sub-navigation (left sidebar, 6 sections)
```
Ownership & financial integrity | Health & Safety | Disaster mitigation & Recovery | Security plan | Licensing & Permits | Customs
```

### Master Plan internal structure
- 2 checkboxes control conditional content display
- 30 total `a.browse` upload links in DOM (most hidden in `tab-pane` containers)
- Internal sub-sections: Land rights, Supporting maps, Land use, Density, Infrastructure, External connectivity, Design drawings, Site context, Existing approvals

### Collapsible sections
- 62 total across all tabs
- 59/62 start **already expanded** (contrary to initial assumption)
- Only 2-3 collapsed per tab, usually from other hidden tabs

---

## Fields Successfully Filled

### Project Overview

| Field | Component Key | Value | Method |
|-------|--------------|-------|--------|
| Proposed name | `applicantProposedNameOfZone` | TEST-SEZ Kingston Innovation Park | `fillText` |
| Zone type | `applicantMultiOrSingleOccupant` | Multi-occupant | `clickRadioLabel` |
| Zone focus | `applicantMultiOrSingleOccupant2` | Multi-purpose | `clickRadioLabel` |
| Parish | `applicantCity3` | Kingston | `searchAndSelect` (Choices.js API search) |
| Address | `applicantAddress3` | 123 Test Industrial Road, Kingston 15, Jamaica | `fillText` |
| Total land area | `applicantTotalLandArea3` | 50000 | `fillNumber` |
| Unit | `applicantUnit3` | Square feet | `searchAndSelect` (Choices.js API search) |
| Activities | `applicantAuthorizedActivities` | Manufacturing | `searchAndSelect` |
| Number of parcels | `applicantNumberOfPlotsBlocksParcels` | 1 | Form.io JS API |
| Total land area (hidden) | `applicantTotalLandArea` | 50000 | Form.io JS API |
| Unit (hidden) | `applicantUnit` | sqft | Form.io JS API |

### Developer

| Field | Component Key | Value | Method |
|-------|--------------|-------|--------|
| Company name | `applicantCompanyName` | TEST-SEZ Development Corp Ltd | `fillText` |
| Company type | `applicantCompanyType` | Limited | `searchAndSelect` |
| Registration # (COJ) | `applicantTaxRegistrationNumberTrn2` | TEST-REG-12345 | `fillText` |
| TRN | `applicantTaxRegistrationNumberTrn` | 123456789 | `typeText` (masked input) |
| Parish | `applicantCity` | Kingston | `searchAndSelect` |
| Address | `applicantAddress` | 456 Corporate Drive, Kingston 10 | `fillText` |
| Phone | `applicantPhone` | +18765550100 | `fillText` |
| Email | `applicantEmail` | test-sez@example.com | `fillEmail` |
| Representative first name | `applicantNames` | John | `fillText` |
| Representative last name | `applicantLastName` | Testerton | `fillText` |
| Representative phone | `applicantPhone2` | +18765550200 | `fillText` |
| Representative email | `applicantEmail2` | john.testerton@example.com | `fillEmail` |
| Shareholder name | EditGrid row | Test Shareholder Holdings Ltd | Direct locator |
| Shareholder nationality | EditGrid row | Jamaica | Choices.js inside EditGrid |
| Shares % | EditGrid row | 100 | Direct locator |
| Beneficial owner | EditGrid row | Yes | Radio click |
| Joint venture | `applicant...JointVenture...` | No | `clickRadioLabel` |
| Paid-up capital | `applicant...PaidUpCapital...` | 2000000 | `fillNumber` |

**Developer uploads (4 files):**

| Document | Component Key | File |
|----------|--------------|------|
| Certificate of Incorporation | `applicantCertificateOfIncorporation` | TEST-certificate-of-incorporation.pdf |
| Articles of Incorporation | `applicantArticlesOfIncorporation` | TEST-articles-of-incorporation.pdf |
| Tax Compliance Certificate | `applicantTaxComplianceCertificate` | TEST-tax-compliance-certificate.pdf |
| Proof of Share Capital | `applicantProofOfIssued...` | TEST-financial-statements.pdf |

### Master Plan

| Field | Value | Method |
|-------|-------|--------|
| Final master plan checkbox | Checked | `checkBox` |
| Concept master plan checkbox | Checked | `checkBox` |
| Terrain requires grading | No | Form.io JS API |

**Master Plan uploads (17 files via CSS unhiding + JS click fallback):**

| Browse Index | Section | Document | Method |
|-------------|---------|----------|--------|
| [4] | Upload your master plan | TEST-concept-master-plan.pdf | Visible browse |
| [5] | Upload your master plan | TEST-final-master-plan.pdf | Visible browse |
| [6] | Land rights documents | TEST-certificate-of-title.pdf | **JS click fallback** (y:-884 off-screen) |
| [7] | Land rights documents | TEST-landlords-affidavit.pdf | CSS unhide + filechooser |
| [8] | Land rights documents | TEST-affidavit-no-land-dispute.pdf | CSS unhide + filechooser |
| [9] | Supporting maps and plans | TEST-site-plan.pdf | CSS unhide + filechooser |
| [10] | Supporting maps and plans | TEST-survey-plan.pdf | CSS unhide + filechooser |
| [11] | Supporting maps and plans | TEST-survey-plan.pdf | CSS unhide + filechooser |
| [12] | Land use plan | TEST-drainage-plan.pdf | CSS unhide + filechooser |
| [13] | Land use plan | TEST-drainage-plan.pdf | CSS unhide + filechooser |
| [14] | Land use plan | TEST-building-plans.pdf | CSS unhide + filechooser |
| [15] | Density & building parameters | TEST-building-plans.pdf | CSS unhide + filechooser |
| [16] | Infrastructure layout | TEST-infrastructure-layout.pdf | Already visible |
| [17] | External connectivity | TEST-infrastructure-layout.pdf | Already visible |
| [18] | Design drawings & visuals | TEST-building-plans.pdf | CSS unhide + filechooser |
| [19] | Design drawings & visuals | TEST-building-plans.pdf | CSS unhide + filechooser |
| [20] | Design drawings & visuals | TEST-building-plans.pdf | CSS unhide + filechooser |
| [21] | Site context & access | TEST-environmental-assessment.pdf | CSS unhide + filechooser |
| [22] | Existing approvals | TEST-building-plans.pdf | CSS unhide + filechooser |

### Business Plan

| Field | Value | Method |
|-------|-------|--------|
| Business plan document | TEST-business-plan.pdf | `uploadGenericBrowse` |

### Compliance (6 sub-sections)

**Ownership & financial integrity:**

| Field | Value | Method |
|-------|-------|--------|
| Financial source checkboxes | First option checked | Name-based `input[type="checkbox"]` |
| Funding description | Equity + bank financing text | Textarea `[name*="applicantProvideAShortDescription"]` |
| Risk questions (15 total) | All answered "No" | Label-based click (`label:has-text("No")`) |
| Due diligence report | TEST-due-diligence-report.pdf | `uploadGenericBrowse` |

**Health & Safety:**

| Field | Value | Method |
|-------|-------|--------|
| H&S plan document | TEST-health-safety-plan.pdf | `uploadGenericBrowse` |

**Disaster mitigation & Recovery:**

| Field | Value | Method |
|-------|-------|--------|
| Disaster plan document | TEST-disaster-mitigation-plan.pdf | `uploadGenericBrowse` |
| Survey questions (11) | All "Yes" | `fillSurveyYes` (`input[type="radio"][value="yes"]`) |

**Security plan:**

| Field | Value | Method |
|-------|-------|--------|
| Security plan document | TEST-security-plan.pdf | `uploadGenericBrowse` |
| Survey questions (13) | All "Yes" | `fillSurveyYes` |

**Licensing & Permits:**

| Field | Value | Method |
|-------|-------|--------|
| No survey questions visible | — | — |

**Customs:**

| Field | Value | Method |
|-------|-------|--------|
| Survey questions (4) | All "Yes" | `fillSurveyYes` |
| Excise goods | No | `clickRadioLabel` |

### Payment

| Field | Value | Method |
|-------|-------|--------|
| Application fee | US$ 3,000.00 (display only) | Verified |
| Proof of payment | TEST-bank-reference-letter.pdf | `uploadGenericBrowse` |

### Send

| Field | Value | Method |
|-------|-------|--------|
| Data protection consent | Checked | Generic `input[type="checkbox"]:visible` |
| Authorized to submit | Checked | Generic `input[type="checkbox"]:visible` |
| Declarations undertaking | Checked | Generic `input[type="checkbox"]:visible` |
| Submit button | "Submit application" clicked | `button:has-text("Submit application")` |

---

## Technical Challenges & Solutions

### SOLVED: Choices.js dropdowns are search-based (not click-to-select)
- **Problem:** All `<select>` elements hidden (`visible=false`, `opts=0`). Choices.js wrappers have `has-no-choices` class. Options load from API when you type.
- **Solution:** `searchAndSelect()` helper — clicks `.choices__input--cloned`, types search term, waits 2s for API, selects from `.choices__list--dropdown`.

### SOLVED: Hidden required fields not in visible DOM
- **Problem:** `applicantNumberOfPlotsBlocksParcels`, `applicantTotalLandArea`, `applicantUnit` are required but not visible on any tab.
- **Solution:** Form.io JS API — `window.Formio.forms[key].submission = { data: { ...current, ...updates } }`.

### SOLVED: 30 browse links mostly hidden in tab-panes
- **Problem:** Only 2-4 browse links visible at a time. The rest are in `card-body tab-pane` containers with `display: none`.
- **Solution:** CSS unhiding — walk ancestors of each `a.browse`, set `display: block` on hidden ones, add `active`/`show` classes to `tab-pane` elements.

### SOLVED: browse[6] at negative Y position after CSS unhiding
- **Problem:** After CSS unhiding, `applicantCertifiedCopyOfTheCertificateOfTitle` browse link rendered at `y:-884` (off-screen above viewport). Playwright click at coordinates fails to trigger filechooser.
- **Solution:** JavaScript-level `.click()` fallback — `page.evaluate(() => links[6].click())` bypasses coordinate dependency. DOM click triggers the handler regardless of position.

### SOLVED: Submit button selector matched tab link instead of actual button
- **Problem:** `button:has-text("Send")` matched the Send tab link, not the "Submit application" button.
- **Solution:** Changed to `button:has-text("Submit application")`.

### SOLVED: TRN masked input
- **Problem:** TRN field has input mask (`_________`). `.fill()` doesn't work with masked inputs.
- **Solution:** `typeText()` helper — uses `.type(value, { delay: 80 })` for char-by-char input.

### SOLVED: Long formio component keys truncated in CSS classes
- **Problem:** Component keys like `applicantIsTheProjectBeingFinancedFromASingleOrMultipleSources` are truncated in the generated CSS class name, so `.formio-component-${key}` doesn't match.
- **Solution:** Use name-based selectors (`[name*="applicantProvide"]`) or generic selectors (`input[type="checkbox"]:visible`).

---

## Issues Catalog (for platform feedback)

### ISSUE-001: Each "Establish a new zone" click creates a NEW application
- **Severity:** Low (behavioral)
- **Description:** Clicking "Establish a new zone" always creates a new `file_id`. No way to continue an existing draft from the dashboard button.
- **Impact on testing:** Each test run creates a new application (252+ drafts accumulated).

### ISSUE-002: Hidden required fields with no visible UI
- **Severity:** Medium
- **Description:** Fields like "Number of parcels" and "Total land area" are required for submission but have no visible input element on any tab. They can only be set via the Form.io JS API.
- **Impact:** Users may not know these fields exist or how to fill them.

### ISSUE-003: Master Plan upload sections hidden in inactive tab-panes
- **Severity:** Medium
- **Description:** 17 of 19 Master Plan upload areas are in `tab-pane` containers that are not active. There's no visible tab navigation to reach them. The sub-sections (Land rights, Supporting maps, etc.) may need specific nav links that aren't rendered.
- **Impact:** Users may not find all required upload fields.

### ISSUE-004: browse[6] renders at negative Y position
- **Severity:** Low
- **Description:** The "Copy certificate(s) of title" upload (`applicantCertifiedCopyOfTheCertificateOfTitle`) renders at `y:-884` when its container is made visible. This is a CSS layout issue in the `col-md-6` column within the Land rights section.
- **Impact:** Automation-only issue; manual users navigate via tabs.

---

## Screenshots Inventory

| File | Description |
|------|-------------|
| P1-SUB-01-overview.png | Project Overview tab filled |
| P1-SUB-02-developer.png | Developer tab filled with uploads |
| P1-SUB-03-masterplan.png | Master Plan with all uploads complete |
| P1-SUB-04-businessplan.png | Business Plan with document uploaded |
| P1-SUB-05-compliance.png | Compliance (Customs sub-section) |
| P1-SUB-06-payment.png | Payment tab with proof uploaded |
| P1-SUB-07-send.png | Send tab with 3 consents checked |
| P1-SUB-08-validation.png | Validation: 0 errors |
| P1-SUB-09-after-submit.png | **Dashboard with "File submitted successfully!" toast** |
| P1-SUB-10-dashboard-after.png | Dashboard after toast faded (252 applications) |

---

## Spec Architecture

### Helper Functions

| Function | Purpose |
|----------|---------|
| `fillText(page, key, value)` | Fill visible text input/textarea by formio component key |
| `fillEmail(page, key, value)` | Fill email input by component key |
| `typeText(page, key, value)` | Char-by-char typing for masked inputs |
| `fillNumber(page, key, value)` | Fill number input by component key |
| `searchAndSelect(page, key, term)` | Choices.js search-based dropdown: type → wait for API → select |
| `clickRadioLabel(page, key, label)` | Click radio button by its label text |
| `checkBox(page, key)` | Check checkbox by component key |
| `clickSubTab(page, name)` | Navigate form sub-tabs |
| `clickComplianceNav(page, name)` | Navigate compliance side-nav (uses `.last()`) |
| `uploadFile(page, key, path)` | Upload via `a.browse` filechooser by component key |
| `uploadGenericBrowse(page, path)` | Upload to first visible `a.browse` link |
| `fillSurveyYes(page)` | Click all visible `input[type="radio"][value="yes"]` |
| `save(page)` | Click save button |

### Test Flow
```
1. Open form (click "Establish a new zone")
2. PROJECT OVERVIEW: Zone identity + Site + Activities
3. DEVELOPER: Company + Address + Representative + Shareholders + 4 uploads
4. MASTER PLAN: Checkboxes → Form.io API → CSS unhide → 17 uploads (JS click fallback for browse[6])
5. BUSINESS PLAN: 1 upload
6. COMPLIANCE: 6 sub-sections (radios + surveys + 5 uploads)
7. PAYMENT: 1 upload
8. SEND: 3 consent checkboxes
9. VALIDATE: 0 errors confirmed
10. SUBMIT: Click "Submit application" → redirect to dashboard → "File submitted successfully!"
```

---

## Next Steps

1. **Phase 2 — Back-office:** Switch to officer/inspector view and process the submitted application
2. **Phase 3 — E2E validation:** Verify the application appears in the review queue with correct data
3. **Cleanup:** Delete accumulated test applications (252+ drafts)
4. **Optimization:** Reduce file upload wait times, parallelize where possible
