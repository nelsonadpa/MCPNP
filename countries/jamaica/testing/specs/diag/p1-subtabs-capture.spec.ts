import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 1 — Capture all Form sub-tabs
 * Sub-tabs: Project overview | Developer | Master plan | Business plan | Compliance
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');

test.describe('P1 — Form Sub-tabs Capture', () => {

  async function openForm(page: any) {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);
    // Ensure Form tab is active
    await page.locator('text=Form').first().click();
    await page.waitForTimeout(1000);
  }

  test('P1-T1: Project overview sub-tab (full page)', async ({ page }) => {
    await openForm(page);

    // Project overview should be default
    await page.locator('text=Project overview').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T1-project-overview-full.png'),
      fullPage: true,
    });

    // Log sections visible
    const sections = page.locator('.card-header[role="button"]');
    const count = await sections.count();
    console.log(`Project overview sections: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      console.log(`  ${i}: ${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}`);
    }
  });

  test('P1-T2: Developer sub-tab', async ({ page }) => {
    await openForm(page);

    await page.locator('[role="tab"]:has-text("Developer"), .nav-link:has-text("Developer")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T2-developer-top.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T2-developer-full.png'),
      fullPage: true,
    });

    const sections = page.locator('.card-header[role="button"]');
    const count = await sections.count();
    console.log(`Developer sections: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      console.log(`  ${i}: ${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}`);
    }
  });

  test('P1-T3: Master plan sub-tab', async ({ page }) => {
    await openForm(page);

    await page.locator('[role="tab"]:has-text("Master plan"), .nav-link:has-text("Master plan")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T3-masterplan-top.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T3-masterplan-full.png'),
      fullPage: true,
    });

    const sections = page.locator('.card-header[role="button"]');
    const count = await sections.count();
    console.log(`Master plan sections: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      console.log(`  ${i}: ${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}`);
    }
  });

  test('P1-T4: Business plan sub-tab', async ({ page }) => {
    await openForm(page);

    await page.locator('[role="tab"]:has-text("Business plan"), .nav-link:has-text("Business plan")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T4-businessplan-top.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T4-businessplan-full.png'),
      fullPage: true,
    });

    const sections = page.locator('.card-header[role="button"]');
    const count = await sections.count();
    console.log(`Business plan sections: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      console.log(`  ${i}: ${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}`);
    }
  });

  test('P1-T5: Compliance sub-tab', async ({ page }) => {
    await openForm(page);

    await page.locator('[role="tab"]:has-text("Compliance"), .nav-link:has-text("Compliance")').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T5-compliance-top.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-T5-compliance-full.png'),
      fullPage: true,
    });

    const sections = page.locator('.card-header[role="button"]');
    const count = await sections.count();
    console.log(`Compliance sections: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      console.log(`  ${i}: ${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}`);
    }
  });

  test('P1-T6: Validate the form button — check validation errors', async ({ page }) => {
    await openForm(page);

    // Click "validate the form" button at bottom
    const validateBtn = page.locator('button:has-text("validate the form")');
    if (await validateBtn.isVisible()) {
      await validateBtn.click();
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'P1-T6-validation-result.png'),
        fullPage: true,
      });

      // Check for validation errors
      const errors = page.locator('.formio-error-wrapper, .alert-danger, .text-danger, .has-error, [class*="error"]');
      const errorCount = await errors.count();
      console.log(`Validation errors visible: ${errorCount}`);

      // Log error messages
      for (let i = 0; i < Math.min(errorCount, 20); i++) {
        const text = await errors.nth(i).textContent();
        const cleaned = text?.trim().replace(/\s+/g, ' ').substring(0, 80);
        if (cleaned) console.log(`  Error ${i}: ${cleaned}`);
      }
    } else {
      console.log('Validate button not visible on current tab');
    }
  });
});
