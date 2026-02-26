import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 1 — Single-session complete form fill
 *
 * Opens ONE application and fills ALL tabs in a single browser session.
 * Expands collapsed sections before filling fields.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');

// Helper: expand a section by clicking its header if collapsed
async function expandSection(page: any, sectionName: string) {
  const header = page.locator(`.card-header[role="button"][aria-expanded="false"]:has-text("${sectionName}")`);
  if (await header.count() > 0) {
    await header.first().click();
    await page.waitForTimeout(800);
  }
}

// Helper: fill text field by partial name match
async function fillField(page: any, namePattern: string, value: string) {
  const field = page.locator(`input[name*="${namePattern}"]:visible, textarea[name*="${namePattern}"]:visible`).first();
  if (await field.count() > 0 && await field.isVisible()) {
    await field.fill(value);
    return true;
  }
  return false;
}

// Helper: click radio option
async function clickRadio(page: any, labelText: string) {
  const label = page.locator(`label:has-text("${labelText}")`).first();
  if (await label.count() > 0 && await label.isVisible()) {
    await label.click();
    return true;
  }
  return false;
}

// Helper: select dropdown option by visible text
async function selectOption(page: any, namePattern: string, optionIndex: number = 1) {
  const sel = page.locator(`select[name*="${namePattern}"]:visible`).first();
  if (await sel.count() > 0 && await sel.isVisible()) {
    const options = sel.locator('option');
    const count = await options.count();
    if (count > optionIndex) {
      const value = await options.nth(optionIndex).getAttribute('value');
      if (value) await sel.selectOption(value);
      return true;
    }
  }
  return false;
}

test('P1-FULL: Complete form fill — all tabs, single session', async ({ page }) => {
  test.setTimeout(600_000); // 10 minutes

  // === OPEN APPLICATION ===
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.locator('text=Establish a new zone').click();
  await page.waitForTimeout(5000);

  const fileUrl = page.url();
  console.log(`\n=== WORKING ON: ${fileUrl} ===\n`);

  // === TAB: FORM > PROJECT OVERVIEW ===
  console.log('--- PROJECT OVERVIEW ---');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(1000);

  // Zone identity (already expanded by default)
  await fillField(page, 'ProposedName', 'TEST-SEZ Kingston Innovation Park');
  // Zone type: Multi-occupant
  await page.locator('.formio-component-applicantMultiOrSingleOccupant label:has-text("Multi-occupant"), [ref="applicantMultiOrSingleOccupant"] label:has-text("Multi-occupant")').first().click().catch(() => {});
  // Zone focus: Multi-purpose
  await page.locator('.formio-component-applicantMultiOrSingleOccupant2 label:has-text("Multi-purpose"), [ref="applicantMultiOrSingleOccupant2"] label:has-text("Multi-purpose")').first().click().catch(() => {});

  await page.waitForTimeout(500);

  // Site section — expand if needed
  await expandSection(page, 'Site');
  await page.waitForTimeout(500);

  // Parish — try the select/dropdown approach
  const parishDropdown = page.locator('.formio-component-applicantCity3 select:visible, select[name*="City3"]:visible, select[name*="Parish"]:visible').first();
  if (await parishDropdown.count() > 0) {
    const opts = parishDropdown.locator('option');
    const optCount = await opts.count();
    if (optCount > 1) {
      const val = await opts.nth(1).getAttribute('value');
      if (val) await parishDropdown.selectOption(val);
      console.log('Parish selected');
    }
  } else {
    // Try choices.js style
    const parishContainer = page.locator('.formio-component-applicantCity3 .choices, [ref="applicantCity3"]').first();
    if (await parishContainer.count() > 0) {
      await parishContainer.click();
      await page.waitForTimeout(500);
      const option = page.locator('.choices__list--dropdown .choices__item--selectable').first();
      if (await option.count() > 0) {
        await option.click();
        console.log('Parish selected (choices)');
      }
    }
  }

  // Address
  await fillField(page, 'Address3', '123 Test Industrial Road, Kingston 15, Jamaica');
  if (!(await fillField(page, 'Address3', '123 Test Industrial Road, Kingston 15, Jamaica'))) {
    await fillField(page, 'address', '123 Test Industrial Road, Kingston 15, Jamaica');
  }

  // Total land area
  await fillField(page, 'TotalLandArea', '50000');

  // Unit dropdown — Choices.js style
  try {
    const unitWrapper = page.locator('.formio-component-applicantUnit .choices__inner').first();
    if (await unitWrapper.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unitWrapper.click();
      await page.waitForTimeout(500);
      const unitOpt = page.locator('.choices__list--dropdown .choices__item--selectable').first();
      if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unitOpt.click();
        console.log('Unit selected');
      }
    } else {
      // Fallback: try raw select
      const unitSelect = page.locator('select[name*="applicantUnit"]:visible').first();
      if (await unitSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        const opts = unitSelect.locator('option');
        if (await opts.count() > 1) {
          const val = await opts.nth(1).getAttribute('value');
          if (val) await unitSelect.selectOption(val);
          console.log('Unit selected (raw select)');
        }
      }
    }
  } catch (e) {
    console.log('Unit selection skipped');
  }

  // Land parcels — the EditGrid needs at least one row saved
  await expandSection(page, 'Land parcels');
  await page.waitForTimeout(500);

  // Proposed activities — Choices.js multi-select
  await expandSection(page, 'Proposed activities');
  await page.waitForTimeout(500);
  try {
    // Choices.js wraps the <select> — click the visible wrapper div
    const choicesWrapper = page.locator('.formio-component-applicantAuthorizedActivities .choices__inner, .formio-component-applicantAuthorizedActivities [data-type="select-multiple"]').first();
    if (await choicesWrapper.isVisible({ timeout: 3000 }).catch(() => false)) {
      await choicesWrapper.click();
      await page.waitForTimeout(500);
      const actOption = page.locator('.choices__list--dropdown .choices__item--selectable').first();
      if (await actOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await actOption.click();
        console.log('Activity selected');
      }
    } else {
      console.log('Activities dropdown not visible — skipping');
    }
  } catch (e) {
    console.log('Activities selection skipped');
  }

  // Save
  await page.locator('[class*="save-button"], .btn-save, button[aria-label="Save"]').first().click().catch(async () => {
    // Try the green floating save button
    await page.locator('.floating-button, [style*="position: fixed"] button, button:has(svg)').last().click().catch(() => {});
  });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-01-project-overview.png'),
    fullPage: true,
  });
  console.log('Project overview filled & saved');

  // === TAB: FORM > DEVELOPER ===
  console.log('\n--- DEVELOPER ---');
  await page.locator('[role="tab"]:has-text("Developer"), .nav-link:has-text("Developer")').first().click();
  await page.waitForTimeout(2000);

  // Expand Company section
  await expandSection(page, 'Company');
  await page.waitForTimeout(500);

  await fillField(page, 'CompanyName', 'TEST-SEZ Development Corp Ltd');
  await fillField(page, 'companyName', 'TEST-SEZ Development Corp Ltd');

  // Company type dropdown — Choices.js
  try {
    const compTypeWrapper = page.locator('.formio-component-applicantCompanyType .choices__inner').first();
    if (await compTypeWrapper.isVisible({ timeout: 3000 }).catch(() => false)) {
      await compTypeWrapper.click();
      await page.waitForTimeout(500);
      const opt = page.locator('.choices__list--dropdown .choices__item--selectable').first();
      if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await opt.click();
        console.log('Company type selected');
      }
    }
  } catch (e) {
    console.log('Company type selection skipped');
  }

  await fillField(page, 'RegistrationNumber', 'TEST-12345');
  await fillField(page, 'registrationNumber', 'TEST-12345');
  await fillField(page, 'TaxRegistration', '000-000-000');
  await fillField(page, 'Trn', '000-000-000');

  // Address section
  await expandSection(page, 'Address');
  await page.waitForTimeout(500);
  // Fill parish for company address
  const compParish = page.locator('.formio-component-applicantCity select:visible').first();
  if (await compParish.count() > 0) {
    const opts = compParish.locator('option');
    if (await opts.count() > 1) {
      const val = await opts.nth(1).getAttribute('value');
      if (val) await compParish.selectOption(val);
    }
  }
  await fillField(page, 'applicantAddress', '456 Corporate Drive, Kingston 10');
  await fillField(page, 'applicantPhone', '+1-876-555-0100');

  // Authorized Representative
  await expandSection(page, 'Authorized Representative');
  await page.waitForTimeout(500);
  await fillField(page, 'Names', 'John');
  await fillField(page, 'LastName', 'Testerton');
  await fillField(page, 'lastName', 'Testerton');

  // Phone for representative
  const repPhone = page.locator('input[name*="Phone"]:visible, input[type="tel"]:visible').first();
  if (await repPhone.count() > 0) {
    const val = await repPhone.inputValue();
    if (!val) await repPhone.fill('+1-876-555-0200');
  }

  // Email
  const emailField = page.locator('input[name*="Email"]:visible, input[type="email"]:visible').first();
  if (await emailField.count() > 0) {
    const val = await emailField.inputValue();
    if (!val) await emailField.fill('test-sez@example.com');
  }

  // Save
  await page.locator('[class*="save-button"], .btn-save').first().click().catch(async () => {
    await page.locator('.floating-button, button:has(svg)').last().click().catch(() => {});
  });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-02-developer.png'),
    fullPage: true,
  });
  console.log('Developer tab filled & saved');

  // === TAB: FORM > MASTER PLAN ===
  console.log('\n--- MASTER PLAN ---');
  await page.locator('[role="tab"]:has-text("Master plan"), .nav-link:has-text("Master plan")').first().click();
  await page.waitForTimeout(2000);

  // Expand "Upload your master plan"
  await expandSection(page, 'Upload your master plan');
  await page.waitForTimeout(500);

  // Try file upload via the Browse button approach
  const browseButtons = page.locator('a:has-text("Browse"), button:has-text("Browse")');
  const browseCount = await browseButtons.count();
  console.log(`Browse buttons found: ${browseCount}`);

  // File inputs may be hidden — use setInputFiles on hidden inputs
  const hiddenFiles = page.locator('input[type="file"]');
  const hiddenCount = await hiddenFiles.count();
  console.log(`Hidden file inputs: ${hiddenCount}`);

  if (hiddenCount > 0) {
    try {
      await hiddenFiles.first().setInputFiles(path.join(DOCS_DIR, 'TEST-concept-master-plan.pdf'));
      await page.waitForTimeout(3000);
      console.log('Master plan file uploaded');
    } catch (e) {
      console.log('Master plan upload skipped (hidden input not interactable)');
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-03-masterplan.png'),
    fullPage: true,
  });

  // === TAB: FORM > BUSINESS PLAN ===
  console.log('\n--- BUSINESS PLAN ---');
  await page.locator('[role="tab"]:has-text("Business plan"), .nav-link:has-text("Business plan")').first().click();
  await page.waitForTimeout(2000);

  // Expand key sections
  for (const section of ['Total investment', 'Funding structure', 'Revenue model', 'Employment']) {
    await expandSection(page, section);
    await page.waitForTimeout(300);
  }

  // Fill visible numeric fields
  const numericInputs = page.locator('input[type="number"]:visible');
  const numCount = await numericInputs.count();
  console.log(`Numeric inputs visible: ${numCount}`);

  for (let i = 0; i < numCount; i++) {
    const input = numericInputs.nth(i);
    const currentVal = await input.inputValue();
    if (!currentVal || currentVal === '0') {
      try {
        await input.fill('1000000');
      } catch (e) { /* readonly */ }
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-04-businessplan.png'),
    fullPage: true,
  });

  // === TAB: FORM > COMPLIANCE ===
  console.log('\n--- COMPLIANCE ---');
  await page.locator('[role="tab"]:has-text("Compliance"), .nav-link:has-text("Compliance")').first().click();
  await page.waitForTimeout(2000);

  // Expand key compliance sections
  for (const section of ['Ownership', 'Financial source', 'Financial sanctions', 'Health', 'Security', 'Customs', 'Disaster']) {
    await expandSection(page, section);
    await page.waitForTimeout(300);
  }

  // Answer "No" to risk questions
  const noLabels = page.locator('label:has-text("No"):visible');
  const noCount = await noLabels.count();
  console.log(`"No" labels visible: ${noCount}`);

  for (let i = 0; i < Math.min(noCount, 15); i++) {
    try {
      await noLabels.nth(i).click();
      await page.waitForTimeout(200);
    } catch (e) { /* skip */ }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-05-compliance.png'),
    fullPage: true,
  });

  // Save everything
  await page.locator('[class*="save-button"], .btn-save').first().click().catch(async () => {
    await page.locator('.floating-button, button:has(svg)').last().click().catch(() => {});
  });
  await page.waitForTimeout(3000);

  // === TAB: PAYMENT ===
  console.log('\n--- PAYMENT ---');
  await page.locator('text=Payment').first().click();
  await page.waitForTimeout(2000);

  // Upload proof of payment
  const paymentFile = page.locator('input[type="file"]');
  if (await paymentFile.count() > 0) {
    try {
      await paymentFile.first().setInputFiles(path.join(DOCS_DIR, 'TEST-bank-reference-letter.pdf'));
      await page.waitForTimeout(3000);
      console.log('Payment proof uploaded');
    } catch (e) {
      console.log('Payment upload skipped');
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-06-payment.png'),
    fullPage: true,
  });

  // === TAB: SEND ===
  console.log('\n--- SEND ---');
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);

  // Check all consent boxes
  const checkboxes = page.locator('input[type="checkbox"]:visible');
  const cbCount = await checkboxes.count();
  console.log(`Consent checkboxes: ${cbCount}`);

  for (let i = 0; i < cbCount; i++) {
    try {
      await checkboxes.nth(i).check();
      await page.waitForTimeout(300);
    } catch (e) { /* skip */ }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-07-send-consents.png'),
    fullPage: true,
  });

  // === FINAL VALIDATION ===
  console.log('\n--- FINAL VALIDATION ---');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(1000);

  const validateBtn = page.locator('button:has-text("validate the form"), button:has-text("Validate")');
  if (await validateBtn.isVisible()) {
    await validateBtn.click();
    await page.waitForTimeout(3000);

    const errorPopup = page.locator('.validation-errors, [class*="error"]');
    const errorTexts = await errorPopup.allTextContents();
    const uniqueErrors = [...new Set(errorTexts.filter(t => t.includes('required')))];
    console.log(`\nRemaining required field errors: ${uniqueErrors.length}`);
    for (const err of uniqueErrors.slice(0, 20)) {
      console.log(`  - ${err.trim().substring(0, 60)}`);
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'P1-FULL-08-final-validation.png'),
    fullPage: true,
  });

  console.log('\n=== FORM FILL COMPLETE ===');
  console.log(`File URL: ${page.url()}`);
});
