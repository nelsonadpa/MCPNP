import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — Switch between roles using the Roles ng-select dropdown
 * and process the review roles that don't need file uploads
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Switch roles and process reviews', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to the processing view
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Navigate to processing view ══');

  await page.goto(`/part-b/${SERVICE_ID}/my/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  // ══════════════════════════════════════════════════════════
  // STEP 2: Explore the Roles dropdown (ng-select)
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Explore Roles dropdown ══');

  // Get all ng-selects on the page
  const ngSelectInfo = await page.evaluate(() => {
    const selects = document.querySelectorAll('ng-select');
    return Array.from(selects).map((s, i) => ({
      index: i,
      class: s.className.substring(0, 60),
      selectedText: s.querySelector('.ng-value-label')?.textContent?.trim(),
      placeholder: s.querySelector('.ng-placeholder')?.textContent?.trim(),
      arrowVisible: !!s.querySelector('.ng-arrow-wrapper'),
      inputVisible: !!(s.querySelector('input') as HTMLElement)?.offsetParent,
    }));
  });
  console.log('  ng-selects:', JSON.stringify(ngSelectInfo, null, 2));

  // The Roles dropdown should be the 2nd ng-select
  // Try clicking the arrow wrapper to open it
  const rolesNgSelect = page.locator('ng-select').nth(1);
  const arrowWrapper = rolesNgSelect.locator('.ng-arrow-wrapper');

  if (await arrowWrapper.isVisible().catch(() => false)) {
    console.log('  Clicking arrow wrapper...');
    await arrowWrapper.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/switch-01-dropdown-open.png`, fullPage: true });

    // Get dropdown options
    const options = await page.evaluate(() => {
      const items = document.querySelectorAll('.ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-option');
      return Array.from(items).map(item => ({
        text: item.textContent?.trim(),
        selected: item.classList.contains('ng-option-selected'),
        marked: item.classList.contains('ng-option-marked'),
        disabled: item.classList.contains('ng-option-disabled'),
      }));
    });
    console.log('  Dropdown options:', JSON.stringify(options, null, 2));

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('  Arrow wrapper not visible, trying input click...');
    const ngInput = rolesNgSelect.locator('input');
    if (await ngInput.isVisible().catch(() => false)) {
      await ngInput.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/switch-01b-input-click.png`, fullPage: true });

      const options = await page.evaluate(() => {
        const items = document.querySelectorAll('.ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-option');
        return Array.from(items).map(item => item.textContent?.trim());
      });
      console.log('  Options:', JSON.stringify(options));
      await page.keyboard.press('Escape');
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Try switching to different roles using the API
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Get role IDs from backend API ══');

  const rolesApiData = await page.evaluate(async () => {
    const serviceId = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
    const processId = '84e53b18-12b2-11f1-899e-b6594fb67add';

    const endpoints = [
      `/backend/services/${serviceId}/roles`,
      `/backend/services/${serviceId}/roles?status=pending`,
      `/en/backend/services/${serviceId}/roles`,
      `/en/backend/services/${serviceId}/roles?status=active`,
      `/backend/process/${processId}`,
    ];

    const results: any = {};
    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep);
        if (resp.ok) {
          const data = await resp.json();
          results[ep] = JSON.stringify(data).substring(0, 500);
        } else {
          results[ep] = `${resp.status}`;
        }
      } catch (e: any) {
        results[ep] = `Error: ${e.message?.substring(0, 40)}`;
      }
    }
    return results;
  });

  for (const [ep, data] of Object.entries(rolesApiData)) {
    console.log(`  ${ep}: ${String(data).substring(0, 200)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try switching roles by selecting from ng-select
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Select a review role from dropdown ══');

  // Approach: Click the ng-select, then click a specific option
  await arrowWrapper.click();
  await page.waitForTimeout(2000);

  // Find and click "Review" or a specific evaluation role
  const reviewOption = page.locator('.ng-dropdown-panel .ng-option').filter({ hasText: /review|Review/i }).first();
  if (await reviewOption.isVisible().catch(() => false)) {
    const optText = await reviewOption.textContent();
    console.log(`  Selecting: "${optText?.trim()}"`);
    await reviewOption.click();
    await page.waitForTimeout(5000);
    console.log(`  URL after switch: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/switch-02-after-review-select.png`, fullPage: true });

    // Check what role we're on now
    const currentRole = await page.evaluate(() => {
      const ngValue = document.querySelectorAll('.ng-value-label');
      for (const v of ngValue) {
        const text = v.textContent?.trim();
        if (text && !text.includes('Establish') && text.length > 3) return text;
      }
      return 'unknown';
    });
    console.log(`  Current role: ${currentRole}`);
  } else {
    console.log('  No "Review" option found');

    // List all available options
    const allOptions = await page.locator('.ng-dropdown-panel .ng-option').allTextContents();
    console.log(`  Available options: ${JSON.stringify(allOptions)}`);

    // Try the first non-selected option
    const firstOption = page.locator('.ng-dropdown-panel .ng-option:not(.ng-option-selected)').first();
    if (await firstOption.isVisible().catch(() => false)) {
      const text = await firstOption.textContent();
      console.log(`  Trying first available: "${text?.trim()}"`);
      await firstOption.click();
      await page.waitForTimeout(5000);
      console.log(`  URL after switch: ${page.url()}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Check what's now on the page
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Check page after role switch ══');

  const pageContent = await page.evaluate(() => {
    const results: any = {};

    // Current role
    const ngValues = document.querySelectorAll('.ng-value-label');
    for (const v of ngValues) {
      const text = v.textContent?.trim();
      if (text && !text.includes('Establish') && text.length > 3) {
        results.currentRole = text;
        break;
      }
    }

    // Heading/workspace
    const paras = document.querySelectorAll('p');
    for (const p of paras) {
      const text = p.textContent?.trim() || '';
      if (text.includes('workspace') || text.includes('evaluation') || text.includes('consultation')) {
        results.workspace = text.substring(0, 150);
        break;
      }
    }

    // Buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
      }))
      .filter(b =>
        b.text.toLowerCase().includes('send') ||
        b.text.toLowerCase().includes('approve') ||
        b.text.toLowerCase().includes('back')
      );

    return results;
  });
  console.log('  Page content:', JSON.stringify(pageContent, null, 2));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/switch-03-page-content.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // STEP 6: Try different part-b URL patterns with role IDs
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Try URL pattern with different role IDs ══');

  // The URL is /part-b/{serviceId}/{roleId}/{processId}?file_id={fileId}
  // "my" shows the first assigned role. Let's try known role name patterns.
  // From the process API, we might get actual role IDs

  // First check the process API for role info
  const processData = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return `${resp.status}`;
    const data = await resp.json();
    // Extract role-related fields
    return {
      currentSteps: data.currentSteps,
      roles: data.roles,
      steps: data.steps,
      // Full keys for exploration
      topKeys: Object.keys(data).slice(0, 30),
      fullJson: JSON.stringify(data).substring(0, 2000),
    };
  });
  console.log('  Process data:', JSON.stringify(processData, null, 2));

  console.log('\n══ ROLE SWITCH DIAGNOSTIC COMPLETE ══');
});
