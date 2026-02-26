import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 Diagnostic — Explore evaluation roles after Documents Check
 *
 * Goals:
 * 1. Find all active roles for our TEST-SEZ application
 * 2. Click into each role to see its UI structure
 * 3. Identify what fields/buttons each role needs
 *
 * Run:
 *   npx playwright test specs/p2-diag-eval-roles.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Explore evaluation roles for TEST-SEZ application', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to Part B and find our application
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Navigate to Part B ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-part-b-list.png`, fullPage: true });

  // Find our TEST-SEZ application row
  const testSezRow = page.locator('tr, .list-item, [class*="row"]').filter({ hasText: 'TEST-SEZ' }).first();
  const rowVisible = await testSezRow.isVisible().catch(() => false);
  console.log(`  TEST-SEZ row visible: ${rowVisible}`);

  if (!rowVisible) {
    // Try filtering by application name
    const filterInput = page.locator('input[placeholder*="Filter applications"]').first();
    if (await filterInput.isVisible().catch(() => false)) {
      await filterInput.fill('TEST-SEZ');
      await page.waitForTimeout(3000);
      console.log('  Filtered by TEST-SEZ');
    }
  }

  // Get all visible processing info for TEST-SEZ
  const processingInfo = await page.evaluate(() => {
    const results: any[] = [];
    // Get all rows/items
    const rows = document.querySelectorAll('.list-item, tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('TEST-SEZ')) {
        // Get status badge
        const badge = row.querySelector('.status-badge');
        const processing = row.querySelector('.active-task, [class*="processing"]');
        const links = row.querySelectorAll('a[href]');
        const linkHrefs: string[] = [];
        links.forEach(l => linkHrefs.push((l as HTMLAnchorElement).href));

        results.push({
          status: badge?.textContent?.trim(),
          processing: processing?.textContent?.trim(),
          fullText: text.substring(0, 200).trim(),
          links: linkHrefs.slice(0, 5),
        });
        break;
      }
    }
    return results;
  });
  console.log('  TEST-SEZ info:', JSON.stringify(processingInfo, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 2: Click on the processing link to see all roles
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Click into processing to see roles ══');

  // Click the "Documents Check ..." or processing link
  const processingLink = page.locator('a').filter({ hasText: /Documents Check|Legal|Evaluation/ }).first();
  const procLinkVisible = await processingLink.isVisible().catch(() => false);
  console.log(`  Processing link visible: ${procLinkVisible}`);

  if (procLinkVisible) {
    const linkText = await processingLink.textContent();
    console.log(`  Clicking: "${linkText?.trim()}"`);
    await processingLink.click();
    await page.waitForTimeout(5000);
    console.log(`  URL: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-processing-click.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Try the "..." button to see all active roles
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Check for role expansion ══');

  // Go back to part-b
  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Look for the "..." or expand button near TEST-SEZ
  const expandBtns = await page.evaluate(() => {
    const results: any[] = [];
    const rows = document.querySelectorAll('.list-item, tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('TEST-SEZ')) {
        // Find any clickable elements that might expand roles
        const btns = row.querySelectorAll('button, a, [role="button"], .expand, [class*="more"], [class*="expand"]');
        btns.forEach(b => {
          results.push({
            tag: b.tagName,
            text: b.textContent?.trim().substring(0, 50),
            class: (b as HTMLElement).className?.substring(0, 80),
            href: (b as HTMLAnchorElement).href || '',
          });
        });
        break;
      }
    }
    return results;
  });
  console.log('  Buttons in TEST-SEZ row:', JSON.stringify(expandBtns, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try direct navigation to the file to see all roles
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Direct navigation to file ══');

  // Try navigating directly to the file processing view
  await page.goto(`/part-b/${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-direct-file.png`, fullPage: true });

  // Check what's on this page
  const pageContent = await page.evaluate(() => {
    const results: any = {};

    // Get all tabs
    const tabs = document.querySelectorAll('a[role="tab"], .nav-link, .nav-item a');
    results.tabs = Array.from(tabs).map(t => ({
      text: t.textContent?.trim(),
      active: (t as HTMLElement).classList.contains('active'),
      href: (t as HTMLAnchorElement).getAttribute('href'),
    }));

    // Get all buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons).filter(b => {
      const el = b as HTMLElement;
      return el.offsetParent !== null && el.textContent?.trim();
    }).map(b => ({
      text: b.textContent?.trim().substring(0, 60),
      disabled: (b as HTMLButtonElement).disabled,
      class: b.className.substring(0, 60),
    }));

    // Get all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
    results.headings = Array.from(headings).filter(h => (h as HTMLElement).offsetParent !== null).map(h => h.textContent?.trim().substring(0, 60));

    // Get status badges
    const badges = document.querySelectorAll('.badge, .status-badge, [class*="badge"]');
    results.badges = Array.from(badges).filter(b => (b as HTMLElement).offsetParent !== null).map(b => b.textContent?.trim());

    return results;
  });
  console.log('  Page content:', JSON.stringify(pageContent, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 5: Check the Processing tab for role details
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Check Processing tab ══');

  const processingTab = page.locator('a:has-text("Processing")').first();
  if (await processingTab.isVisible().catch(() => false)) {
    await processingTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-processing-tab.png`, fullPage: true });

    const processingContent = await page.evaluate(() => {
      const results: any = {};

      // Get all visible text blocks in the processing tab
      const activePane = document.querySelector('.tab-pane.active, .tab-content > .active');
      if (activePane) {
        results.text = activePane.textContent?.trim().substring(0, 500);
      }

      // Get all buttons in processing
      const buttons = document.querySelectorAll('button:not([style*="display: none"])');
      results.buttons = Array.from(buttons).filter(b => (b as HTMLElement).offsetParent !== null).map(b => ({
        text: b.textContent?.trim().substring(0, 60),
        disabled: (b as HTMLButtonElement).disabled,
      }));

      // Get any role lists
      const roleItems = document.querySelectorAll('[class*="role"], [class*="step"], [class*="workflow"]');
      results.roleItems = Array.from(roleItems).filter(r => (r as HTMLElement).offsetParent !== null).map(r => ({
        text: r.textContent?.trim().substring(0, 80),
        class: (r as HTMLElement).className.substring(0, 50),
      }));

      return results;
    });
    console.log('  Processing content:', JSON.stringify(processingContent, null, 2));
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Check the workflow via API
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Check workflow via API ══');

  const workflowData = await page.evaluate(async () => {
    const results: any = {};
    const fileId = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
    const processId = '84e53b18-12b2-11f1-899e-b6594fb67add';

    // Try to get process/workflow info
    const endpoints = [
      `/backend/files/${fileId}`,
      `/backend/process/${processId}`,
      `/backend/process/${processId}/roles`,
      `/backend/process/${processId}/steps`,
    ];

    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep);
        if (resp.ok) {
          const data = await resp.json();
          results[ep] = typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : data;
        } else {
          results[ep] = `${resp.status} ${resp.statusText}`;
        }
      } catch (e: any) {
        results[ep] = `Error: ${e.message?.substring(0, 50)}`;
      }
    }

    return results;
  });
  console.log('  API data:');
  for (const [ep, data] of Object.entries(workflowData)) {
    console.log(`    ${ep}: ${String(data).substring(0, 200)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Check available roles via "My roles" dropdown
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 7: Check "My roles" and available assignments ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Look for role dropdown/selector
  const roleSelector = page.locator('select, [class*="role-select"], [class*="dropdown"]').filter({ hasText: /role|My roles/i }).first();
  if (await roleSelector.isVisible().catch(() => false)) {
    console.log('  Found role selector');
    await roleSelector.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-role-selector.png`, fullPage: true });
  }

  // Check what roles are shown in the list
  const rolesInList = await page.evaluate(() => {
    const results: any[] = [];
    // Look for processing column entries
    const items = document.querySelectorAll('.list-item, tr');
    for (const item of items) {
      const text = item.textContent || '';
      if (text.includes('TEST-SEZ') || text.includes('NELSON PEREZ')) {
        const processing = item.querySelector('[class*="processing"], .active-task, td:nth-child(5), [class*="column"]:nth-child(5)');
        results.push({
          text: text.substring(0, 150).trim().replace(/\s+/g, ' '),
          processing: processing?.textContent?.trim(),
        });
      }
    }
    return results;
  });
  console.log('  Roles in list:', JSON.stringify(rolesInList, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 8: Try switching to specific roles
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 8: Try role-specific URLs ══');

  // The part-b URL pattern seems to include roleId
  // Let's try navigating with different role query params
  const roleUrls = [
    '/part-b?serviceId=d51d6c78-5ead-c948-0b82-0d9bc71cd712&roleId=my',
    '/part-b?serviceId=d51d6c78-5ead-c948-0b82-0d9bc71cd712',
  ];

  for (const url of roleUrls) {
    await page.goto(url);
    await page.waitForTimeout(3000);
    const title = await page.title();
    const badges = await page.locator('.status-badge:visible').allTextContents();
    console.log(`  ${url}: title="${title}", badges=[${badges.slice(0, 5).join(', ')}]`);
  }

  // Now click on "Documents Check ..." link for our application
  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Look for the "..." or "+N" near our application's processing column
  const moreRoles = await page.evaluate(() => {
    const results: any[] = [];
    const rows = document.querySelectorAll('.list-item, tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('TEST-SEZ')) {
        // Get ALL links in the processing column
        const allLinks = row.querySelectorAll('a');
        allLinks.forEach(a => {
          const aText = a.textContent?.trim();
          const href = a.getAttribute('href') || (a as HTMLAnchorElement).href;
          if (aText && aText.length > 0) {
            results.push({ text: aText.substring(0, 60), href: href?.substring(0, 100) });
          }
        });
        break;
      }
    }
    return results;
  });
  console.log('  Links in TEST-SEZ row:', JSON.stringify(moreRoles, null, 2));

  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-final.png`, fullPage: true });

  console.log('\n══ DIAGNOSTIC COMPLETE ══');
});
