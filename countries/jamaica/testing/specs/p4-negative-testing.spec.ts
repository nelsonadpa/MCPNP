import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 4 — Negative Testing (SEZ-048..SEZ-056)
 *
 * Tests form validation, invalid inputs, and submission guards.
 * Creates a SINGLE application and runs all negative checks within it.
 *
 * Coverage:
 *  - SEZ-048: Submit with empty required fields
 *  - SEZ-049: Invalid number format
 *  - SEZ-050: Invalid email format
 *  - SEZ-053: Submit with zero documents
 *  - SEZ-054: Partial data (some tabs filled, others empty)
 *  - SEZ-055: Negative numbers in financial fields
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots/negative');

// ── Helpers ──

/** Dismiss floating validation alerts that intercept button clicks */
async function dismissAlerts(page: any) {
  await page.evaluate(() => {
    document.querySelectorAll('.floating-alerts .alert').forEach(el => (el as HTMLElement).remove());
  });
  await page.waitForTimeout(300);
}

async function getValidationErrors(page: any): Promise<string[]> {
  const errors: string[] = [];
  const selectors = [
    '.formio-errors .formio-error-wrapper:visible',
    '.formio-errors .error:visible',
    '.help-block:visible',
    '.text-danger:visible',
    '.alert-danger:visible',
    '.formio-component-submit .formio-errors li',
  ];
  for (const sel of selectors) {
    const els = page.locator(sel);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      const text = await els.nth(i).textContent().catch(() => '');
      const clean = text?.trim().replace(/\s+/g, ' ').substring(0, 200);
      if (clean && !errors.includes(clean)) errors.push(clean);
    }
  }
  return errors;
}

async function getErrorItemCount(page: any): Promise<number> {
  // Error items on the Send tab validation panel
  const items = page.locator('.error-items li, .formio-errors li, .formio-component-submit .formio-errors .formio-error-wrapper');
  return await items.count().catch(() => 0);
}

async function clickTab(page: any, tabName: string) {
  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), .nav-link:has-text("${tabName}")`).first();
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await page.waitForTimeout(2000);
}

async function clickSideNav(page: any, name: string) {
  const link = page.locator(`.nav-link:has-text("${name}")`).last();
  if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
    await link.click();
    await page.waitForTimeout(2000);
  }
}

async function fillText(page: any, key: string, value: string) {
  const sel = `.formio-component-${key}`;
  const input = page.locator(`${sel} input[type="text"]:visible, ${sel} textarea:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch {}
  return false;
}

async function fillEmail(page: any, key: string, value: string) {
  const input = page.locator(`.formio-component-${key} input[type="email"]:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch {}
  return false;
}

async function fillNumber(page: any, key: string, value: string) {
  const input = page.locator(`.formio-component-${key} input:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch {}
  return false;
}

// ── Main Test ──

test('P4-NEGATIVE: Validate form guards and error handling', async ({ page }) => {
  test.setTimeout(600_000); // 10 min

  // ── Create new application ──
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Establish a new zone' }).click();
  await page.waitForTimeout(5000);
  const appUrl = page.url();
  console.log(`\n=== NEW APP: ${appUrl} ===\n`);

  // ════════════════════════════════════════════
  // TEST 1: SEZ-048 — Submit completely empty form
  // ════════════════════════════════════════════
  console.log('════ TEST 1: SEZ-048 — Submit with ALL fields empty ══════');

  // Go to Send tab → check consents → try submit
  await clickTab(page, 'Send');
  await page.waitForTimeout(2000);

  // Check all consent checkboxes
  const consentCbs = page.locator('input[type="checkbox"]:visible');
  const cbCount = await consentCbs.count();
  for (let i = 0; i < cbCount; i++) {
    await consentCbs.nth(i).check().catch(() => {});
    await page.waitForTimeout(200);
  }
  console.log(`  Consents checked: ${cbCount}`);

  // Try clicking Submit
  const submitBtn = page.locator('button:has-text("Submit application")').first();
  const submitVisible = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Submit button visible: ${submitVisible}`);

  if (submitVisible) {
    const submitDisabled = await submitBtn.isDisabled().catch(() => false);
    console.log(`  Submit button disabled: ${submitDisabled}`);

    if (!submitDisabled) {
      await dismissAlerts(page);
      await submitBtn.click({ force: true });
      await page.waitForTimeout(5000);

      // Check if submission was blocked
      const postUrl = page.url();
      const urlChanged = !postUrl.includes('file_id') && postUrl !== appUrl;
      console.log(`  URL changed after submit: ${urlChanged}`);

      if (urlChanged) {
        console.log('  ⚠️ ISSUE: Empty form was submitted successfully!');
      } else {
        console.log('  ✅ Submission blocked (still on form page)');
      }
    } else {
      console.log('  ✅ Submit button is disabled — form validation prevents submission');
    }
  } else {
    console.log('  ✅ Submit button not visible — form validation prevents submission');
  }

  // Capture validation errors on Send tab
  const sendErrors = await getValidationErrors(page);
  console.log(`  Validation errors on Send tab: ${sendErrors.length}`);
  for (const e of sendErrors.slice(0, 30)) {
    console.log(`    - ${e}`);
  }

  // Navigate to Form tab and trigger validation
  await clickTab(page, 'Form');
  await page.waitForTimeout(2000);

  await dismissAlerts(page);

  const validateBtn = page.locator('button:has-text("validate the form"), button:has-text("Validate")');
  if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await validateBtn.click({ force: true });
    await page.waitForTimeout(3000);

    const errorPanel = page.locator('.alert-danger:visible');
    if (await errorPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
      const errorText = await errorPanel.textContent();
      console.log(`  Validation alert: ${errorText?.trim().replace(/\s+/g, ' ').substring(0, 300)}`);
    }

    // Count error items
    const errorItems = page.locator('.formio-errors .formio-error-wrapper, .text-danger:visible, .formio-errors li');
    const errCount = await errorItems.count();
    console.log(`  Form validation error count: ${errCount}`);

    // Capture first 30 error messages
    const allErrors = await getValidationErrors(page);
    console.log(`  Unique error messages: ${allErrors.length}`);
    for (const e of allErrors.slice(0, 30)) {
      console.log(`    - ${e}`);
    }
  } else {
    console.log('  No validate button visible');
  }

  // Look for per-tab error indicators (badges, icons, red highlights)
  const tabErrors = page.locator('.nav-link .badge-danger, .nav-link .text-danger, .nav-link .error-indicator, .nav-item .badge');
  const tabErrCount = await tabErrors.count();
  console.log(`  Tab error indicators: ${tabErrCount}`);
  if (tabErrCount > 0) {
    for (let i = 0; i < Math.min(tabErrCount, 10); i++) {
      const txt = await tabErrors.nth(i).textContent().catch(() => '');
      console.log(`    tab-err[${i}]: "${txt?.trim()}"`);
    }
  }

  // Screenshot: empty form validation
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-01-empty-validation.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 2: SEZ-050 — Invalid email format
  // ════════════════════════════════════════════
  console.log('\n════ TEST 2: SEZ-050 — Invalid email format ══════');

  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Developer');
  await page.waitForTimeout(2000);

  // Fill email fields with invalid formats
  const emailTests = [
    { key: 'applicantEmail', value: 'not-an-email', label: 'Company email' },
    { key: 'applicantEmail2', value: '@missing-local', label: 'Representative email' },
  ];

  for (const t of emailTests) {
    const filled = await fillEmail(page, t.key, t.value);
    if (filled) {
      // Click away to trigger validation
      await page.locator('body').click();
      await page.waitForTimeout(1000);

      // Check for field-level error
      const fieldErr = page.locator(`.formio-component-${t.key} .formio-errors:visible, .formio-component-${t.key} .text-danger:visible, .formio-component-${t.key} .help-block:visible`).first();
      const hasErr = await fieldErr.isVisible({ timeout: 2000 }).catch(() => false);
      const errText = hasErr ? await fieldErr.textContent().catch(() => '') : '';
      console.log(`  ${t.label} ("${t.value}"): error=${hasErr} ${errText ? '→ ' + errText.trim().substring(0, 100) : ''}`);
    } else {
      console.log(`  ${t.label}: field not visible (may be on different sub-tab)`);
    }
  }

  // Also test: email field with spaces, special chars
  const moreEmailTests = [
    { key: 'applicantEmail', value: 'has spaces@test.com', label: 'Email with spaces' },
    { key: 'applicantEmail', value: '', label: 'Empty email' },
  ];
  for (const t of moreEmailTests) {
    const filled = await fillEmail(page, t.key, t.value);
    if (filled) {
      await page.locator('body').click();
      await page.waitForTimeout(1000);
      const fieldErr = page.locator(`.formio-component-${t.key} .formio-errors:visible, .formio-component-${t.key} .text-danger:visible`).first();
      const hasErr = await fieldErr.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  ${t.label}: error=${hasErr}`);
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-02-invalid-emails.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 3: SEZ-049 — Invalid number format
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 3: SEZ-049 — Invalid number format ══════');

  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Project overview');
  await page.waitForTimeout(2000);

  // Try entering text in number fields
  const numberTests = [
    { key: 'applicantTotalLandArea3', value: 'abc', label: 'Total land area (text)' },
    { key: 'applicantTotalLandArea3', value: '-100', label: 'Total land area (negative)' },
    { key: 'applicantTotalLandArea3', value: '0', label: 'Total land area (zero)' },
    { key: 'applicantTotalLandArea3', value: '99999999999', label: 'Total land area (very large)' },
  ];

  for (const t of numberTests) {
    const filled = await fillNumber(page, t.key, t.value);
    if (filled) {
      await page.locator('body').click();
      await page.waitForTimeout(1000);

      // Read back the value to see if it was accepted
      const input = page.locator(`.formio-component-${t.key} input:visible`).first();
      const actualVal = await input.inputValue().catch(() => '');
      const fieldErr = page.locator(`.formio-component-${t.key} .formio-errors:visible, .formio-component-${t.key} .text-danger:visible`).first();
      const hasErr = await fieldErr.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  ${t.label}: input="${t.value}" → actual="${actualVal}" error=${hasErr}`);
    } else {
      console.log(`  ${t.label}: field not visible`);
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-03-invalid-numbers.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 4: SEZ-055 — Negative numbers in financial fields
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 4: SEZ-055 — Negative numbers in financial fields ══════');

  // Switch to Master Plan tab where financial/quantity fields exist
  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Master plan');
  await page.waitForTimeout(3000);

  // Look for all visible number inputs on Master Plan and try negatives
  const numberInputs = page.locator('input[type="number"]:visible, input[type="text"][inputmode="numeric"]:visible');
  const numCount = await numberInputs.count();
  console.log(`  Visible number inputs on Master Plan: ${numCount}`);

  for (let i = 0; i < Math.min(numCount, 5); i++) {
    const input = numberInputs.nth(i);
    const name = await input.getAttribute('name').catch(() => '');
    await input.scrollIntoViewIfNeeded().catch(() => {});
    await input.fill('-999');
    await page.waitForTimeout(500);
    const actualVal = await input.inputValue().catch(() => '');

    // Find parent formio component for label
    const parentComp = input.locator('xpath=ancestor::*[contains(@class, "formio-component")]').first();
    const label = await parentComp.locator('label').first().textContent().catch(() => name || `input[${i}]`);

    console.log(`  [${i}] "${label?.trim().substring(0, 40)}": filled "-999" → actual="${actualVal}"`);
  }

  // Also check Developer tab for financial fields
  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Developer');
  await page.waitForTimeout(2000);

  const devNumInputs = page.locator('input[type="number"]:visible');
  const devNumCount = await devNumInputs.count();
  console.log(`  Visible number inputs on Developer: ${devNumCount}`);

  for (let i = 0; i < Math.min(devNumCount, 3); i++) {
    const input = devNumInputs.nth(i);
    await input.scrollIntoViewIfNeeded().catch(() => {});
    await input.fill('-500');
    const actual = await input.inputValue().catch(() => '');
    const parentComp = input.locator('xpath=ancestor::*[contains(@class, "formio-component")]').first();
    const label = await parentComp.locator('label').first().textContent().catch(() => `devNum[${i}]`);
    console.log(`  [${i}] "${label?.trim().substring(0, 40)}": filled "-500" → actual="${actual}"`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-04-negative-numbers.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 5: SEZ-053 — Submit with zero documents
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 5: SEZ-053 — Submit with zero documents ══════');

  // Check how many file uploads are present and empty
  const browseLinks = page.locator('a.browse');
  const totalBrowse = await browseLinks.count();
  const visibleBrowse = await page.locator('a.browse:visible').count();
  console.log(`  Total browse links: ${totalBrowse}, visible: ${visibleBrowse}`);

  // Check for file-related validation errors
  await clickTab(page, 'Send');
  await page.waitForTimeout(2000);

  // Re-check consents
  const cbs2 = page.locator('input[type="checkbox"]:visible');
  for (let i = 0; i < await cbs2.count(); i++) {
    await cbs2.nth(i).check().catch(() => {});
  }

  // Look at validation summary for document-related errors
  const docErrors: string[] = [];
  const allValidation = await getValidationErrors(page);
  for (const e of allValidation) {
    if (e.toLowerCase().includes('upload') || e.toLowerCase().includes('document') || e.toLowerCase().includes('file') || e.toLowerCase().includes('required')) {
      docErrors.push(e);
    }
  }
  console.log(`  Document-related validation errors: ${docErrors.length}`);
  for (const e of docErrors.slice(0, 20)) {
    console.log(`    - ${e}`);
  }

  // Try submit again to see if blocked
  const submitBtn2 = page.locator('button:has-text("Submit application")').first();
  const submit2Visible = await submitBtn2.isVisible({ timeout: 3000 }).catch(() => false);
  const submit2Disabled = submit2Visible ? await submitBtn2.isDisabled().catch(() => false) : true;
  console.log(`  Submit button: visible=${submit2Visible} disabled=${submit2Disabled}`);

  // ════════════════════════════════════════════
  // TEST 6: SEZ-054 — Partial data (fill one tab, leave others empty)
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 6: SEZ-054 — Fill only Project Overview, skip everything else ══════');

  // Fill Project Overview minimally
  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Project overview');
  await page.waitForTimeout(2000);

  await fillText(page, 'applicantProposedNameOfZone', 'TEST-NEGATIVE-PARTIAL');
  await fillNumber(page, 'applicantTotalLandArea3', '1000');
  console.log('  Filled: Zone name + land area only');

  // Go to Send tab and check validation
  await clickTab(page, 'Send');
  await page.waitForTimeout(2000);

  // Re-check consents
  const cbs3 = page.locator('input[type="checkbox"]:visible');
  for (let i = 0; i < await cbs3.count(); i++) {
    await cbs3.nth(i).check().catch(() => {});
  }

  const partialErrors = await getValidationErrors(page);
  console.log(`  Validation errors with partial data: ${partialErrors.length}`);

  // Count errors per category
  let fieldMissing = 0;
  let docMissing = 0;
  let other = 0;
  for (const e of partialErrors) {
    const lower = e.toLowerCase();
    if (lower.includes('upload') || lower.includes('document') || lower.includes('file')) {
      docMissing++;
    } else if (lower.includes('required') || lower.includes('must') || lower.includes('invalid')) {
      fieldMissing++;
    } else {
      other++;
    }
  }
  console.log(`  Breakdown: fields=${fieldMissing} docs=${docMissing} other=${other}`);

  // Try to submit with partial data
  const submitBtn3 = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn3.isVisible({ timeout: 3000 }).catch(() => false)) {
    const disabled3 = await submitBtn3.isDisabled().catch(() => false);
    if (!disabled3) {
      await dismissAlerts(page);
      await submitBtn3.click({ force: true });
      await page.waitForTimeout(5000);
      const postUrl = page.url();
      if (postUrl.includes('file_id') || postUrl === appUrl) {
        console.log('  ✅ Submission blocked with partial data');
      } else {
        console.log('  ⚠️ ISSUE: Partially filled form was submitted!');
      }
    } else {
      console.log('  ✅ Submit disabled — partial data correctly blocked');
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-05-partial-data.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 7: Additional field-level validations
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 7: Field-level validation checks ══════');

  // Check TRN field with invalid format
  await clickTab(page, 'Form');
  await page.waitForTimeout(1000);
  await clickTab(page, 'Developer');
  await page.waitForTimeout(2000);

  // TRN is a masked input — try invalid values
  const trnInput = page.locator(`.formio-component-applicantTaxRegistrationNumberTrn input:visible`).first();
  if (await trnInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Type too few digits
    await trnInput.scrollIntoViewIfNeeded();
    await trnInput.click();
    await trnInput.fill('');
    await page.waitForTimeout(200);
    await trnInput.type('123', { delay: 80 });
    await page.locator('body').click();
    await page.waitForTimeout(1000);

    const trnVal = await trnInput.inputValue().catch(() => '');
    const trnErr = page.locator('.formio-component-applicantTaxRegistrationNumberTrn .formio-errors:visible, .formio-component-applicantTaxRegistrationNumberTrn .text-danger:visible').first();
    const hasTrnErr = await trnErr.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  TRN ("123"): actual="${trnVal}" error=${hasTrnErr}`);
  } else {
    console.log(`  TRN field not visible`);
  }

  // Check phone field with text
  const phoneField = await fillText(page, 'applicantPhone', 'not-a-phone');
  if (phoneField) {
    await page.locator('body').click();
    await page.waitForTimeout(1000);
    const phoneErr = page.locator('.formio-component-applicantPhone .formio-errors:visible, .formio-component-applicantPhone .text-danger:visible').first();
    const hasPhoneErr = await phoneErr.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  Phone ("not-a-phone"): error=${hasPhoneErr}`);
  }

  // Check company name with extremely long value
  const longName = 'X'.repeat(500);
  const nameField = await fillText(page, 'applicantCompanyName', longName);
  if (nameField) {
    const input = page.locator('.formio-component-applicantCompanyName input:visible').first();
    const actualLen = (await input.inputValue().catch(() => '')).length;
    console.log(`  Company name (500 chars): accepted=${actualLen} chars`);
  }

  // Check Choices.js dropdown with invalid search term (no results)
  console.log('\n  Testing Choices.js with non-existent search term...');
  const choicesComp = page.locator('.formio-component-applicantCompanyType').first();
  const searchInput = choicesComp.locator('.choices__input--cloned:visible, input[name="search_terms"]:visible').first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.scrollIntoViewIfNeeded();
    await searchInput.click();
    await searchInput.fill('');
    await searchInput.type('ZZZZINVALID999', { delay: 100 });
    await page.waitForTimeout(3000);

    const options = page.locator('.choices__list--dropdown .choices__item--selectable:visible');
    const optCount = await options.count();
    const noResults = page.locator('.choices__list--dropdown .choices__item--disabled:visible, .choices__item.has-no-results:visible');
    const noResCount = await noResults.count();
    console.log(`  Choices.js ("ZZZZINVALID999"): options=${optCount} noResults=${noResCount}`);

    // Dismiss dropdown
    await page.locator('body').click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P4-06-field-level.png'), fullPage: true }).catch(() => {});

  // ════════════════════════════════════════════
  // TEST 8: Tab navigation — data persistence check
  // ════════════════════════════════════════════
  console.log('\n══════ TEST 8: SEZ-088 — Tab switching data persistence ══════');

  // Fill a field on Developer tab
  await fillText(page, 'applicantCompanyName', 'TEST-PERSISTENCE-CO');
  await page.waitForTimeout(500);

  // Switch to Master Plan and back
  await clickTab(page, 'Form');
  await page.waitForTimeout(500);
  await clickTab(page, 'Master plan');
  await page.waitForTimeout(2000);

  // Back to Developer
  await clickTab(page, 'Form');
  await page.waitForTimeout(500);
  await clickTab(page, 'Developer');
  await page.waitForTimeout(2000);

  const persistedVal = await page.locator('.formio-component-applicantCompanyName input:visible').first().inputValue().catch(() => '');
  const dataPersisted = persistedVal === 'TEST-PERSISTENCE-CO';
  console.log(`  Company name after tab switch: "${persistedVal}" persisted=${dataPersisted}`);
  if (!dataPersisted) {
    console.log('  ⚠️ ISSUE: Data lost after tab switch!');
  } else {
    console.log('  ✅ Data persists across tab switches');
  }

  // ════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════
  console.log('\n══════ P4 NEGATIVE TESTING SUMMARY ══════');
  console.log('  SEZ-048: Empty form submission → see error counts above');
  console.log('  SEZ-049: Invalid number format → see number test results');
  console.log('  SEZ-050: Invalid email format → see email test results');
  console.log('  SEZ-053: Zero documents → see doc validation errors');
  console.log('  SEZ-054: Partial data → see partial data results');
  console.log('  SEZ-055: Negative numbers → see negative number results');
  console.log('  SEZ-088: Tab persistence → data persisted=' + (dataPersisted ? 'YES' : 'NO'));
  console.log('\n=== DONE ===');
});
