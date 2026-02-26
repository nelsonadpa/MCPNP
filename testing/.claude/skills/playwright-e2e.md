# Skill: Playwright E2E Test Generation for BPA Services

## When to use
When generating a complete E2E test for an eRegistrations service. Applies to any service connected to the Bitacora hub or standalone.

## Process

### 1. Extract service structure
Via direct MCP or by requesting from the Manual Agent.

### 2. Generate PRD
Create `prds/[service]-PRD.md` with:
- User stories (5-8 per service)
- Acceptance criteria per story
- Test cases (3-6 per story)
- Expected selectors (based on component keys)

### 3. Create Page Object
```typescript
// tests/pages/[Service]Page.ts
export class ServicePage {
  readonly page: Page;
  readonly nitField = '[ref="applicantNit"] input';
  readonly submitButton = 'button:has-text("Enviar")';
  constructor(page: Page) { this.page = page; }
  async fillForm(data: TestData) { /* ... */ }
  async submit() { /* ... */ }
}
```

### 4. Write Spec
```typescript
// tests/specs/[service].spec.ts
import { test, expect } from '@playwright/test';
import { ServicePage } from '../pages/ServicePage';
test.describe('Service: [name]', () => {
  test.beforeEach(async ({ page }) => { /* login + navigate */ });
  test('Story 1: [description]', async ({ page }) => { /* steps */ });
});
```

### 5. Run and iterate
```bash
cd ~/Desktop/OCAgents/playwright-bpa
npx playwright test tests/specs/[service].spec.ts --headed --reporter=line
```
Iterate until 100% pass rate. Failure screenshots go in `reports/`.

## Selector Patterns (eRegistrations)

| Element | Pattern |
|---------|---------|
| Form field | `[ref="componentKey"] input` |
| Panel/Block | `[ref="componentKey"]` |
| Sidebar tab | `a:not(.dropdown-item):has-text("TabName")` |
| Dropdown button | `text=ButtonLabel` |
| EditGrid row | `[ref="editGridKey"] .formio-component-editgrid tbody tr` |
| Submit button | `button:has-text("Enviar")` |
| CAS login | URL contains `eid.cuba.eregistrations.org` |

## eRegistrations Platform Patterns (discovered via Jamaica testing)

### Choices.js dropdowns are SEARCH-BASED
ALL eRegistrations dropdowns use Choices.js with API-loaded options. Standard `selectOption()` will NOT work.
```typescript
// Click search input → type term → wait for API → select
async function searchAndSelect(page, componentKey, searchTerm) {
  const component = page.locator(`.formio-component-${componentKey}`).first();
  const searchInput = component.locator('.choices__input--cloned:visible').first();
  await searchInput.click();
  await searchInput.type(searchTerm, { delay: 100 });
  await page.waitForTimeout(2000); // Wait for API
  // Try scoped first, then global (dropdown may render outside component)
  let options = component.locator('.choices__list--dropdown .choices__item--selectable:visible');
  if (await options.count() === 0) {
    options = page.locator('.choices__list--dropdown.is-active .choices__item--selectable:visible');
  }
  await options.first().click();
}
```

### File uploads use `a.browse` + filechooser
No visible `<input type="file">` — it's created dynamically on browse click.
```typescript
const [fc] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 5000 }),
  page.locator('a.browse:visible').first().click(),
]);
await fc.setFiles(filePath);
```

### Form.io JS API for hidden required fields
```typescript
const form = (window as any).Formio.forms[Object.keys((window as any).Formio.forms)[0]];
form.submission = { data: { ...form.submission.data, hiddenFieldKey: value } };
```

### CSS unhiding for hidden tab-pane sections
Walk ancestors of target elements, set `display:block`, add `active`/`show` to `tab-pane` classes. After unhiding, elements may render at negative coordinates — use JS `.click()` fallback.

### Long component keys truncated in CSS
`.formio-component-applicantVeryLongKeyName` may not match. Use `[name*="partialKey"]` or generic selectors.

### Masked inputs (TRN, etc.)
Use `.type(value, { delay: 80 })` not `.fill()`.

## Common mistakes
- DO NOT assume CSS selectors — always verify with MCP or Manual Agent
- DO NOT use `page.waitForTimeout()` — use `page.waitForSelector()` or `expect().toBeVisible()`
- Remember async loads (companies, EditGrid data) — wait for indicators
- CAS login in production uses `eid.cuba.eregistrations.org`, not the main domain
- Some fields have duplicate labels — use component key, not label text
- `button:has-text("Send")` may match tab links — use specific button text like "Submit application"
- Compliance side-nav links: use `.last()` to avoid matching main tab links
- Each "new service" click creates a NEW application — navigate by `file_id` to reuse drafts
- Set test timeout to 20min+ for forms with 30+ file uploads
