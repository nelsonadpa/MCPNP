# Skill: Jamaica SEZ — Form Fill & Submit Automation

## When to use
When automating the "Establish a new zone" form on Jamaica eRegistrations, or adapting the approach for similar multi-tab eRegistrations forms. This skill covers the complete front-office happy path: fill all tabs, upload all documents, validate, and submit.

## Prerequisites
- Auth state saved: `countries/jamaica/testing/auth-state-jamaica.json`
- Test documents: `countries/jamaica/testing/test-data/documents/` (35 PDFs)
- Playwright config: `countries/jamaica/testing/playwright.config.ts`
- Run command: `npx playwright test specs/<file> --project=jamaica-frontoffice --headed`

## Reference Spec
`countries/jamaica/testing/specs/p1-submit-complete.spec.ts` (v13, ~1100 lines)

---

## Process

### 1. Discover form structure first (diagnostic phase)
Before writing the fill spec, run diagnostic specs to discover:
- What tabs and sub-tabs exist
- Which sections are expanded/collapsed
- What input types are present (text, radio, Choices.js, file upload, survey)
- What the actual DOM field names are (NOT assumed from labels)

```bash
npx playwright test specs/p1-diag-fields.spec.ts --project=jamaica-frontoffice --headed
npx playwright test specs/p1-diag-sections.spec.ts --project=jamaica-frontoffice --headed
```

### 2. Write helper functions
Every eRegistrations form fill needs these helpers. Copy from the reference spec.

| Helper | Purpose | When to use |
|--------|---------|-------------|
| `searchAndSelect(page, key, term)` | Choices.js API-search dropdown | ANY dropdown — they're all search-based |
| `fillText(page, key, value)` | Text/textarea by component key | Standard text fields |
| `typeText(page, key, value)` | Char-by-char masked input | TRN, phone masks |
| `fillEmail(page, key, value)` | Email input | `input[type="email"]` fields |
| `fillNumber(page, key, value)` | Number input | Numeric fields |
| `clickRadioLabel(page, key, label)` | Radio by label text | Radio button groups |
| `checkBox(page, key)` | Checkbox | Consent checkboxes |
| `clickSubTab(page, name)` | Navigate form sub-tabs | Tab switching |
| `clickComplianceNav(page, name)` | Side-nav link (uses `.last()`) | Compliance sub-sections |
| `uploadGenericBrowse(page, path)` | First visible `a.browse` | Simple file uploads |
| `fillSurveyYes(page)` | All visible yes radios | Survey components |
| `save(page)` | Click save | After each section |

### 3. Fill form tab by tab
Follow this order (matches the form's tab sequence):

```
PROJECT OVERVIEW → DEVELOPER → MASTER PLAN → BUSINESS PLAN → COMPLIANCE (6 sub-sections) → PAYMENT → SEND
```

### 4. Handle hidden required fields via Form.io JS API
Some fields are required but have NO visible UI element. Set them via JavaScript:

```typescript
await page.evaluate(() => {
  const instances = (window as any).Formio?.forms || {};
  const form = instances[Object.keys(instances)[0]];
  const currentData = form?.submission?.data || {};
  form.submission = { data: { ...currentData,
    applicantNumberOfPlotsBlocksParcels: 1,
    applicantTotalLandArea: 50000,
    applicantUnit: 'sqft',
    applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation: 'No',
  }};
});
```

### 5. Handle hidden file uploads (CSS unhiding)
Master Plan has 30 browse links, most hidden in `tab-pane` containers:

```typescript
// Make all file upload containers visible + activate tab-panes
await page.evaluate(() => {
  document.querySelectorAll('a.browse').forEach(el => {
    let ancestor = el.parentElement;
    while (ancestor && ancestor !== document.body) {
      if (getComputedStyle(ancestor).display === 'none') {
        (ancestor as HTMLElement).style.display = 'block';
      }
      if (ancestor.classList?.contains('tab-pane')) {
        ancestor.classList.add('active', 'show');
      }
      ancestor = ancestor.parentElement;
    }
  });
});
```

### 6. Upload files with filechooser pattern + JS click fallback

```typescript
// Primary: filechooser approach
const [fc] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 5000 }),
  browseLink.click(),
]);
await fc.setFiles(filePath);

// Fallback for off-screen elements (negative Y position):
const [fc2] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 5000 }),
  page.evaluate((idx) => {
    const links = document.querySelectorAll('a.browse');
    (links[idx] as HTMLElement).click(); // DOM click bypasses coordinates
  }, browseIndex),
]);
await fc2.setFiles(filePath);
```

### 7. Validate before submit
```typescript
await page.locator('button:has-text("validate the form")').click();
await page.waitForTimeout(3000);
const errCount = await page.locator('.formio-errors .formio-error-wrapper, .text-danger:visible').count();
// Must be 0 before proceeding
```

### 8. Submit
```typescript
// CRITICAL: Use "Submit application", NOT "Send" (matches tab link)
await page.locator('button:has-text("Submit application")').click();
await page.waitForTimeout(15000);
// Success = redirect to dashboard + "File submitted successfully!" toast
```

---

## Jamaica "Establish a new zone" — Component Keys

### Project Overview
| Key | Type | Notes |
|-----|------|-------|
| `applicantProposedNameOfZone` | text | Zone name |
| `applicantMultiOrSingleOccupant` | radio | Multi-occupant / Single-occupant |
| `applicantMultiOrSingleOccupant2` | radio | Multi-purpose / Single-purpose |
| `applicantCity3` | Choices.js | Parish (search "Kingston") |
| `applicantAddress3` | textarea | Site address |
| `applicantTotalLandArea3` | number | Visible land area field |
| `applicantUnit3` | Choices.js | Unit (search "Square") |
| `applicantAuthorizedActivities` | Choices.js | Activities (search "Manufacturing") |
| `applicantParcelsDescriptionGrid` | EditGrid | Land parcels |

### Developer
| Key | Type | Notes |
|-----|------|-------|
| `applicantCompanyName` | text | |
| `applicantCompanyType` | Choices.js | Search "Limited" |
| `applicantTaxRegistrationNumberTrn2` | text | Registration # at COJ (NOT TRN!) |
| `applicantTaxRegistrationNumberTrn` | masked text | Actual TRN — use `typeText` |
| `applicantCity` | Choices.js | Parish |
| `applicantAddress` | text | |
| `applicantPhone` | text | |
| `applicantEmail` | email | |
| `applicantNames` | text | First name (NOT `applicantName`) |
| `applicantLastName` | text | |
| `applicantPhone2` / `applicantEmail2` | text/email | Representative |
| `applicantEditGrid` | EditGrid | Shareholders |
| `applicantCertificateOfIncorporation` | file | |
| `applicantArticlesOfIncorporation` | file | |
| `applicantTaxComplianceCertificate` | file | |
| `applicantProofOfIssuedAndPaidUpShareCapitalUs1500000` | file | Long key — truncated in CSS |

### Master Plan
| Key | Type | Notes |
|-----|------|-------|
| `applicantYesIWillUploadAFinalMasterPlan` | checkbox | Triggers conditional upload sections |
| `applicantCheckbox` | checkbox | |
| `applicantCertifiedCopyOfTheCertificateOfTitle` | file | browse[6] — needs JS click fallback (y:-884 bug) |
| `applicantOwnersAffidavit` | file | browse[7] |
| `applicantAffidavitOfNoLandDispute` | file | browse[8] |
| `applicantUploadYourMasterPlan` | file | Concept + final (browse[4-5]) |

### Hidden Required (Form.io API only — no visible UI)
| Key | Value |
|-----|-------|
| `applicantNumberOfPlotsBlocksParcels` | 1 |
| `applicantTotalLandArea` | 50000 |
| `applicantUnit` | 'sqft' |
| `applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation` | 'No' |

### DOM Browse Link Map (30 total)
```
[0-3]   Developer uploads
[4-5]   Master plan concept + final
[6-8]   Land rights (certificate, affidavit, no dispute)
[9-11]  Supporting maps
[12-14] Land use plan
[15]    Density
[16]    Infrastructure (visible)
[17]    External connectivity (visible)
[18-20] Design drawings
[21]    Site context
[22]    Existing approvals
[23]    Business plan
[24-29] Compliance sub-section uploads
```

---

## Patterns Reusable Across Countries

These patterns apply to ANY eRegistrations instance, not just Jamaica:

### Choices.js dropdowns
ALL eRegistrations dropdowns use Choices.js with API search. Never use `selectOption()`. Always:
1. Click `.choices__input--cloned`
2. Type search term
3. Wait 2s for API response
4. Select from `.choices__list--dropdown`
5. If options not found in component scope, try global selector (dropdown renders outside)

### Form.io JS API
Access via `window.Formio.forms` — returns all form instances. Use to:
- Read current data: `form.submission.data`
- Set hidden fields: `form.submission = { data: { ...current, key: value } }`
- Get component count: `Object.keys(form.submission.data).length`

### File upload pattern
eRegistrations NEVER has visible `<input type="file">`. Always use:
1. `a.browse` click → `page.waitForEvent('filechooser')` → `fc.setFiles(path)`
2. The `<input type="file">` is created dynamically on browse click

### CSS unhiding for hidden tab-panes
Walk ancestors of target elements, set `display:block`, add `active`/`show` to `tab-pane` classes. Essential for Master Plan multi-section uploads.

### JS click fallback
After CSS unhiding, some elements render at negative coordinates (layout bug). Use `page.evaluate(() => element.click())` which bypasses Playwright's coordinate-based clicking.

---

## Common Mistakes

1. **`button:has-text("Send")` matches tab links** — always use the specific button text like "Submit application"
2. **`.formio-component-{longKey}` won't match** — long keys get truncated in CSS classes; use `[name*="partial"]` instead
3. **Sections are already expanded** — don't waste time on expand logic; 59/62 start open
4. **Each test run creates a new application** — 252+ drafts accumulated; navigate by `file_id` to reuse
5. **Compliance side-nav: use `.last()`** — `.first()` matches the main tab link
6. **Upload wait times add up** — 30 uploads × 3s = 90s minimum; set test timeout to 20 min
7. **Never `.fill()` a masked input** — use `.type(value, { delay: 80 })` for TRN-like fields
8. **Don't check "final master plan" checkbox unless you're uploading** — it creates required upload fields
