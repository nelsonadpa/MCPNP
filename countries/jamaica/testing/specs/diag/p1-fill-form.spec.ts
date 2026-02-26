import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 1 — Happy Path: Fill entire form with test data
 *
 * Fills all required fields + key optional fields across all 5 sub-tabs,
 * then Payment and Send tabs. Does NOT submit — saves as draft.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');

test.describe.serial('P1 — Happy Path: Fill Complete Form', () => {
  let formPage: any;

  test('P1-F1: Open form and fill Project Overview tab', async ({ page }) => {
    // Navigate to dashboard and open new application
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    const formUrl = page.url();
    console.log(`Working on form: ${formUrl}`);

    // Ensure Form tab > Project overview
    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('text=Project overview').first().click();
    await page.waitForTimeout(2000);

    // === ZONE IDENTITY ===
    // Proposed name (required)
    await page.locator('[name*="ProposedName"], [name*="proposedName"]').first()
      .fill('TEST-SEZ Kingston Innovation Park');

    // Zone type: Multi-occupant
    const multiOccupant = page.locator('text=Multi-occupant').first();
    if (await multiOccupant.isVisible()) await multiOccupant.click();

    // Zone focus: Multi-purpose
    const multiPurpose = page.locator('text=Multi-purpose').first();
    if (await multiPurpose.isVisible()) await multiPurpose.click();

    await page.waitForTimeout(500);

    // === SITE ===
    // Parish (required) - select dropdown
    const parishSelect = page.locator('select').filter({ hasText: /Kingston|Parish/ }).first();
    if (await parishSelect.isVisible()) {
      await parishSelect.selectOption({ index: 1 });
    } else {
      // Try clicking a different parish selector
      const parishInput = page.locator('[name*="Parish"], [name*="parish"], [name*="City"]').first();
      if (await parishInput.isVisible()) {
        await parishInput.click();
        await page.waitForTimeout(500);
        // Select first option
        const firstOption = page.locator('[role="option"], .choices__item--selectable').first();
        if (await firstOption.isVisible()) await firstOption.click();
      }
    }

    // Address (required)
    const addressField = page.locator('textarea[name*="Address"], textarea[name*="address"]').first();
    if (await addressField.isVisible()) {
      await addressField.fill('123 Test Industrial Road, Kingston 15, Jamaica');
    }

    // Total land area (required)
    const landArea = page.locator('input[name*="TotalLandArea"], input[name*="totalLandArea"]').first();
    if (await landArea.isVisible()) {
      await landArea.fill('50000');
    }

    // Unit (required)
    const unitSelect = page.locator('select[name*="Unit"], select[name*="unit"]').first();
    if (await unitSelect.isVisible()) {
      await unitSelect.selectOption({ index: 1 });
    } else {
      const unitRadio = page.locator('text=Square feet').first();
      if (await unitRadio.isVisible()) await unitRadio.click();
    }

    // Save progress
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F1-project-overview-filled.png'),
      fullPage: true,
    });

    console.log('Project overview — Zone identity + Site filled');
  });

  test('P1-F2: Fill Developer tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Navigate to Developer tab
    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('[role="tab"]:has-text("Developer"), .nav-link:has-text("Developer")').first().click();
    await page.waitForTimeout(2000);

    // Company name (required)
    const companyName = page.locator('input[name*="CompanyName"], input[name*="companyName"]').first();
    if (await companyName.isVisible()) {
      await companyName.fill('TEST-SEZ Development Corp Ltd');
    }

    // Company type (dropdown)
    const companyType = page.locator('select[name*="CompanyType"], select[name*="companyType"]').first();
    if (await companyType.isVisible()) {
      await companyType.selectOption({ index: 1 });
    }

    // Registration number at COJ (required)
    const regNum = page.locator('input[name*="RegistrationNumber"], input[name*="registrationNumber"]').first();
    if (await regNum.isVisible()) {
      await regNum.fill('TEST-12345');
    }

    // TRN (required)
    const trn = page.locator('input[name*="TaxRegistration"], input[name*="trn"], input[name*="Trn"]').first();
    if (await trn.isVisible()) {
      await trn.fill('000-000-000');
    }

    // Authorized Representative — Names (required)
    const firstName = page.locator('input[name*="Names"], input[name*="firstName"]').first();
    if (await firstName.isVisible()) {
      await firstName.fill('John');
    }

    // Last names (required)
    const lastName = page.locator('input[name*="LastName"], input[name*="lastName"]').first();
    if (await lastName.isVisible()) {
      await lastName.fill('Testerton');
    }

    // Phone (required)
    const phone = page.locator('input[name*="Phone"], input[name*="phone"], input[type="tel"]').first();
    if (await phone.isVisible()) {
      await phone.fill('+1-876-555-0100');
    }

    // Email (required)
    const email = page.locator('input[name*="Email"], input[name*="email"], input[type="email"]').first();
    if (await email.isVisible()) {
      await email.fill('test-sez@example.com');
    }

    // Save
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F2-developer-filled.png'),
      fullPage: true,
    });

    console.log('Developer tab filled');
  });

  test('P1-F3: Fill Master plan tab — upload documents', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('[role="tab"]:has-text("Master plan"), .nav-link:has-text("Master plan")').first().click();
    await page.waitForTimeout(2000);

    // Try to upload master plan document to first file upload area
    const fileInputs = page.locator('input[type="file"]');
    const fileCount = await fileInputs.count();
    console.log(`File upload inputs found: ${fileCount}`);

    // Upload to first available file input
    if (fileCount > 0) {
      try {
        await fileInputs.first().setInputFiles(path.join(DOCS_DIR, 'TEST-concept-master-plan.pdf'));
        await page.waitForTimeout(2000);
        console.log('Master plan file uploaded');
      } catch (e) {
        console.log(`File upload failed: ${e}`);
      }
    }

    // Save
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F3-masterplan-filled.png'),
      fullPage: true,
    });

    console.log('Master plan tab captured');
  });

  test('P1-F4: Fill Business plan tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('[role="tab"]:has-text("Business plan"), .nav-link:has-text("Business plan")').first().click();
    await page.waitForTimeout(2000);

    // Total investment
    const totalInvestment = page.locator('input[name*="TotalInvestment"], input[name*="totalInvestment"], input[name*="BuildingFactory"]').first();
    if (await totalInvestment.isVisible()) {
      await totalInvestment.fill('25000000');
    }

    // Fill numeric fields visible on this tab
    const numberInputs = page.locator('input[type="number"]:visible');
    const numCount = await numberInputs.count();
    console.log(`Numeric inputs visible on Business plan: ${numCount}`);

    for (let i = 0; i < Math.min(numCount, 10); i++) {
      const input = numberInputs.nth(i);
      const currentVal = await input.inputValue();
      if (!currentVal) {
        try {
          await input.fill('1000000');
        } catch (e) {
          // skip readonly fields
        }
      }
    }

    // Save
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F4-businessplan-filled.png'),
      fullPage: true,
    });

    console.log('Business plan tab filled');
  });

  test('P1-F5: Fill Compliance tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('[role="tab"]:has-text("Compliance"), .nav-link:has-text("Compliance")').first().click();
    await page.waitForTimeout(2000);

    // Try to answer radio buttons with "No" for risk questions
    const radioNos = page.locator('input[type="radio"][value="no"]:visible, label:has-text("No") input[type="radio"]:visible');
    const radioCount = await radioNos.count();
    console.log(`"No" radio buttons visible: ${radioCount}`);

    // Click first few "No" options for compliance questions
    for (let i = 0; i < Math.min(radioCount, 10); i++) {
      try {
        await radioNos.nth(i).click({ force: true });
        await page.waitForTimeout(200);
      } catch (e) {
        // skip
      }
    }

    // Save
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F5-compliance-filled.png'),
      fullPage: true,
    });

    console.log('Compliance tab filled');
  });

  test('P1-F6: Payment tab — upload proof of payment', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Click Payment tab
    await page.locator('text=Payment').first().click();
    await page.waitForTimeout(2000);

    // Verify fee amount
    const feeText = page.locator('text=US$ 3,000.00');
    if (await feeText.first().isVisible()) {
      console.log('Application fee confirmed: US$ 3,000.00');
    }

    // Upload proof of payment
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      try {
        await fileInput.setInputFiles(path.join(DOCS_DIR, 'TEST-bank-reference-letter.pdf'));
        await page.waitForTimeout(2000);
        console.log('Proof of payment uploaded');
      } catch (e) {
        console.log(`Payment upload failed: ${e}`);
      }
    }

    // Save
    const saveBtn = page.locator('[class*="save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F6-payment-filled.png'),
      fullPage: true,
    });
  });

  test('P1-F7: Send tab — check consents and review', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Click Send tab
    await page.locator('text=Send').first().click();
    await page.waitForTimeout(2000);

    // Check consent checkboxes
    const checkboxes = page.locator('input[type="checkbox"]:visible');
    const cbCount = await checkboxes.count();
    console.log(`Consent checkboxes found: ${cbCount}`);

    for (let i = 0; i < cbCount; i++) {
      try {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(300);
      } catch (e) {
        console.log(`Checkbox ${i} check failed`);
      }
    }

    await page.waitForTimeout(1000);

    // Look for submit/send button
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Send"), button:has-text("send")');
    const submitVisible = await submitBtn.first().isVisible().catch(() => false);
    console.log(`Submit button visible: ${submitVisible}`);
    if (submitVisible) {
      const btnText = await submitBtn.first().textContent();
      console.log(`Submit button text: ${btnText}`);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-F7-send-tab-consents.png'),
      fullPage: true,
    });

    // DO NOT click submit — we're just exploring
    console.log('Send tab captured with consents checked — NOT submitting');
  });

  test('P1-F8: Final validation check after filling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Go to Form > Project overview and click validate
    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
    await page.locator('text=Project overview').first().click();
    await page.waitForTimeout(1000);

    const validateBtn = page.locator('button:has-text("validate the form")');
    if (await validateBtn.isVisible()) {
      await validateBtn.click();
      await page.waitForTimeout(3000);

      // Count remaining errors
      const errorBadge = page.locator('.badge-danger, .alert-danger, [class*="error-count"]');
      const errors = page.locator('[class*="error"], .text-danger');
      const errorCount = await errors.count();
      console.log(`Remaining validation errors after filling: ${errorCount}`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'P1-F8-validation-after-fill.png'),
        fullPage: true,
      });
    }
  });
});
