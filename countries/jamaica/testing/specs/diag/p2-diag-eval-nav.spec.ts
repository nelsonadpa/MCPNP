import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — Navigate into evaluation roles for TEST-SEZ
 *
 * Focus: How to open each of the 5 parallel roles, what UI each shows,
 * and what button approves each role.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');

test('Navigate into evaluation roles', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Part B — click "File pending" for our TEST-SEZ app
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Click into TEST-SEZ from Part B ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Click the first "File pending" badge (our TEST-SEZ is first row)
  const badge = page.locator('span.status-badge:has-text("File pending")').first();
  await expect(badge).toBeVisible({ timeout: 10_000 });
  await badge.click();
  await page.waitForTimeout(5000);

  const url1 = page.url();
  console.log(`  URL after badge click: ${url1}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-01-badge-click.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // STEP 2: What role did we land on?
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Identify current role ══');

  const roleInfo = await page.evaluate(() => {
    const results: any = {};

    // Get page title / heading
    const h1 = document.querySelector('h1, h2, h3');
    results.heading = h1?.textContent?.trim().substring(0, 80);

    // Get all tabs
    const tabs = document.querySelectorAll('.nav-link, a[role="tab"]');
    results.tabs = Array.from(tabs).filter(t => (t as HTMLElement).offsetParent !== null).map(t => ({
      text: t.textContent?.trim(),
      active: t.classList.contains('active'),
    }));

    // Get all buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
        class: b.className.substring(0, 80),
      }));

    // Check for role name in page
    const roleLabels = ['Legal review', 'Technical review', 'Business review',
      'Compliance review', 'Organize NOC', 'Documents check'];
    const bodyText = document.body.textContent || '';
    results.foundRoles = roleLabels.filter(r => bodyText.includes(r));

    // Check breadcrumb or title
    const breadcrumb = document.querySelector('.breadcrumb, [class*="breadcrumb"]');
    results.breadcrumb = breadcrumb?.textContent?.trim().substring(0, 100);

    // Check for a role/step indicator
    const stepIndicators = document.querySelectorAll('[class*="step"], [class*="role"], [class*="stage"]');
    results.stepIndicators = Array.from(stepIndicators)
      .filter(s => (s as HTMLElement).offsetParent !== null)
      .map(s => s.textContent?.trim().substring(0, 60))
      .slice(0, 5);

    return results;
  });
  console.log('  Role info:', JSON.stringify(roleInfo, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 3: Click Processing tab to see role-specific buttons
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Processing tab ══');

  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-02-processing-tab.png`, fullPage: true });

    const procContent = await page.evaluate(() => {
      const results: any = {};

      // Get ALL buttons in the page
      const buttons = document.querySelectorAll('button');
      results.allButtons = Array.from(buttons)
        .filter(b => b.textContent?.trim())
        .map(b => ({
          text: b.textContent?.trim().substring(0, 80),
          disabled: (b as HTMLButtonElement).disabled,
          visible: (b as HTMLElement).offsetParent !== null,
          id: b.id,
          class: b.className.substring(0, 60),
        }));

      // Get the active tab pane content
      const activePane = document.querySelector('.tab-pane.active.show');
      if (activePane) {
        results.paneText = activePane.textContent?.trim().substring(0, 500);
      }

      // Get select elements (for role assignment)
      const selects = document.querySelectorAll('select');
      results.selects = Array.from(selects).map(s => ({
        id: s.id,
        name: s.name,
        options: Array.from(s.options).map(o => ({ text: o.text.trim(), value: o.value })).slice(0, 10),
      }));

      return results;
    });
    console.log('  Processing content:', JSON.stringify(procContent, null, 2));
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Check the URL pattern for role navigation
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: URL pattern analysis ══');

  // Parse the current URL
  const currentUrl = new URL(page.url());
  console.log(`  Path: ${currentUrl.pathname}`);
  console.log(`  Params: ${currentUrl.searchParams.toString()}`);

  // Try to extract the file/process ID from the URL
  const pathParts = currentUrl.pathname.split('/').filter(Boolean);
  console.log(`  Path parts: ${JSON.stringify(pathParts)}`);

  // ══════════════════════════════════════════════════════════
  // STEP 5: Go back and try clicking the "Legal Review" link directly
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Try clicking processing column links ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Look for links in the first row's processing column
  const procLinks = await page.evaluate(() => {
    // Find processing column links more precisely
    const results: any[] = [];
    // Get all anchor tags
    const allLinks = document.querySelectorAll('a');
    for (const a of allLinks) {
      const text = a.textContent?.trim() || '';
      const href = a.getAttribute('href') || '';
      // Only links in the table that relate to processing/roles
      if (text.includes('Legal') || text.includes('Technical') || text.includes('Business') ||
          text.includes('Compliance') || text.includes('Organize') || text.includes('Documents')) {
        results.push({
          text: text.substring(0, 60),
          href: href.substring(0, 100),
          visible: (a as HTMLElement).offsetParent !== null,
        });
      }
    }
    return results;
  });
  console.log('  Processing links:', JSON.stringify(procLinks, null, 2));

  // Try clicking the "Legal Review" link
  const legalLink = page.locator('a:has-text("Legal Review")').first();
  if (await legalLink.isVisible().catch(() => false)) {
    const legalHref = await legalLink.getAttribute('href');
    console.log(`  Legal Review link href: ${legalHref}`);
    await legalLink.click();
    await page.waitForTimeout(5000);
    console.log(`  After click URL: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-03-legal-review.png`, fullPage: true });
  } else {
    console.log('  Legal Review link not directly visible — checking for popover');

    // Maybe it's behind the "..." button or the "+4" badge
    const moreBtn = page.locator('text="+4"').first();
    if (await moreBtn.isVisible().catch(() => false)) {
      console.log('  Clicking +4 badge...');
      await moreBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-03b-more-roles.png`, fullPage: true });
    }

    // Also try the "..." button
    const dotsBtn = page.locator('button:has-text("...")').first();
    const dotsLink = page.locator('a:has-text("...")').first();
    if (await dotsBtn.isVisible().catch(() => false)) {
      console.log('  Clicking ... button');
      await dotsBtn.click();
      await page.waitForTimeout(2000);
    } else if (await dotsLink.isVisible().catch(() => false)) {
      console.log('  Clicking ... link');
      await dotsLink.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-03c-after-dots.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Try switching roles via the "My roles" dropdown
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Try "My roles" dropdown ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Click the "My roles" dropdown
  const myRolesDropdown = page.locator('text="My roles"').first();
  if (await myRolesDropdown.isVisible().catch(() => false)) {
    await myRolesDropdown.click();
    await page.waitForTimeout(2000);

    // Get dropdown options
    const dropdownOptions = await page.evaluate(() => {
      const items = document.querySelectorAll('.dropdown-menu a, .dropdown-item, [class*="dropdown"] a');
      return Array.from(items)
        .filter(i => (i as HTMLElement).offsetParent !== null)
        .map(i => ({
          text: i.textContent?.trim(),
          href: (i as HTMLAnchorElement).getAttribute('href'),
        }));
    });
    console.log('  Dropdown options:', JSON.stringify(dropdownOptions, null, 2));

    // Select "Review" role option
    const reviewOption = page.locator('.dropdown-item:has-text("Review"), .dropdown-menu a:has-text("Review")').first();
    if (await reviewOption.isVisible().catch(() => false)) {
      const optText = await reviewOption.textContent();
      console.log(`  Clicking: "${optText?.trim()}"`);
      await reviewOption.click();
      await page.waitForTimeout(5000);
      console.log(`  URL after selecting Review: ${page.url()}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-04-review-role.png`, fullPage: true });

      // Check what's visible now
      const reviewList = await page.evaluate(() => {
        const rows = document.querySelectorAll('.list-item, tr');
        const results: any[] = [];
        for (const row of rows) {
          const text = row.textContent || '';
          if (text.includes('TEST-SEZ')) {
            const badge = row.querySelector('.status-badge');
            const processing = row.querySelector('[class*="processing"], .active-task');
            results.push({
              status: badge?.textContent?.trim(),
              processing: processing?.textContent?.trim().substring(0, 100),
            });
          }
        }
        return results;
      });
      console.log('  TEST-SEZ in Review role:', JSON.stringify(reviewList, null, 2));
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Try clicking into the TEST-SEZ app from Review role
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 7: Click into TEST-SEZ from Review role ══');

  const badge2 = page.locator('span.status-badge:has-text("File pending")').first();
  if (await badge2.isVisible().catch(() => false)) {
    await badge2.click();
    await page.waitForTimeout(5000);
    const url2 = page.url();
    console.log(`  URL: ${url2}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-05-review-processing.png`, fullPage: true });

    // Check what role-specific content is shown
    const roleContent = await page.evaluate(() => {
      const results: any = {};

      // Buttons
      const buttons = document.querySelectorAll('button');
      results.buttons = Array.from(buttons)
        .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
        .map(b => ({
          text: b.textContent?.trim().substring(0, 80),
          disabled: (b as HTMLButtonElement).disabled,
        }));

      // Tabs
      const tabs = document.querySelectorAll('.nav-link, a[role="tab"]');
      results.tabs = Array.from(tabs)
        .filter(t => (t as HTMLElement).offsetParent !== null)
        .map(t => ({
          text: t.textContent?.trim(),
          active: t.classList.contains('active'),
        }));

      // Formio forms
      const formio = (window as any).Formio;
      if (formio?.forms) {
        const forms: any = {};
        for (const k of Object.keys(formio.forms)) {
          const form = formio.forms[k];
          const data = form?.submission?.data;
          if (data) {
            forms[k] = {
              keyCount: Object.keys(data).length,
              hasIsFormValid: 'isFormValid' in data,
              isFormValid: data.isFormValid,
              hasFORMDATAVALIDATIONSTATUS: 'FORMDATAVALIDATIONSTATUS' in data,
              FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
              // Look for role-specific keys
              roleKeys: Object.keys(data).filter(k =>
                k.toLowerCase().includes('review') ||
                k.toLowerCase().includes('approve') ||
                k.toLowerCase().includes('legal') ||
                k.toLowerCase().includes('technical') ||
                k.toLowerCase().includes('business') ||
                k.toLowerCase().includes('compliance')
              ).slice(0, 20),
            };
          }
        }
        results.formio = forms;
      }

      return results;
    });
    console.log('  Role content:', JSON.stringify(roleContent, null, 2));

    // Click Processing tab
    const procTab2 = page.locator('a:has-text("Processing")').first();
    if (await procTab2.isVisible().catch(() => false)) {
      await procTab2.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/nav-06-review-proc-tab.png`, fullPage: true });

      const procButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons)
          .filter(b => b.textContent?.trim())
          .map(b => ({
            text: b.textContent?.trim().substring(0, 80),
            disabled: (b as HTMLButtonElement).disabled,
            visible: (b as HTMLElement).offsetParent !== null,
          }));
      });
      console.log('  Processing buttons:', JSON.stringify(procButtons, null, 2));
    }
  }

  console.log('\n══ NAVIGATION DIAGNOSTIC COMPLETE ══');
});
