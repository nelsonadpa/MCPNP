import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — Complementary Information (applicant side)
 * Access via front-office "My applications" to submit additional info
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Process Complementary Information', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to front-office dashboard
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Front-office dashboard ══');

  await page.goto('/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-01-dashboard.png`, fullPage: true });

  // Look for "My applications" section
  const myApps = page.locator('text="My applications"').first();
  if (await myApps.isVisible().catch(() => false)) {
    console.log('  Found "My applications" — clicking...');
    await myApps.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-02-my-apps.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Find our TEST-SEZ application
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Find TEST-SEZ application ══');

  // Check if there's a notification/badge for complementary info
  const appInfo = await page.evaluate(() => {
    const results: any = {};

    // Get all list items or application cards
    const items = document.querySelectorAll('[class*="list-item"], [class*="application"], tr');
    results.items = Array.from(items)
      .filter(i => i.textContent?.includes('TEST-SEZ'))
      .map(i => ({
        text: i.textContent?.trim().substring(0, 200).replace(/\s+/g, ' '),
        links: Array.from(i.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: (a as HTMLAnchorElement).href.substring(0, 100),
        })),
      }));

    // Check for notification badges
    const notifications = document.querySelectorAll('[class*="notification"], .badge');
    results.notifications = Array.from(notifications)
      .filter(n => (n as HTMLElement).offsetParent !== null)
      .map(n => n.textContent?.trim())
      .slice(0, 5);

    return results;
  });
  console.log('  App info:', JSON.stringify(appInfo, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 3: Try direct navigation to the file in front-office
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Direct navigation to file ══');

  // Try various URL patterns for the front-office view
  const frontOfficeUrls = [
    `/my-applications/${FILE_ID}`,
    `/applications/${FILE_ID}`,
    `/form/${FILE_ID}`,
    `/file/${FILE_ID}`,
  ];

  for (const url of frontOfficeUrls) {
    await page.goto(url);
    await page.waitForTimeout(3000);
    const actualUrl = page.url();
    if (!actualUrl.includes('404') && !actualUrl.endsWith('/')) {
      console.log(`  ${url} → ${actualUrl}`);
      const title = await page.title();
      console.log(`    Title: ${title}`);
      break;
    } else {
      console.log(`  ${url} → redirected (${actualUrl})`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try the inspector view
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Inspector view ══');

  await page.goto('/inspector/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-03-inspector.png`, fullPage: true });

  const inspectorInfo = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="list-item"], tr');
    const results: any[] = [];
    for (const item of items) {
      if (item.textContent?.includes('TEST-SEZ')) {
        results.push({
          text: item.textContent?.trim().substring(0, 200).replace(/\s+/g, ' '),
          links: Array.from(item.querySelectorAll('a')).map(a => ({
            text: a.textContent?.trim(),
            href: (a as HTMLAnchorElement).href.substring(0, 100),
          })),
        });
      }
    }
    return results;
  });
  console.log('  Inspector items:', JSON.stringify(inspectorInfo, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 5: Try the Part B complementary info URL directly
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Try complementary-info URL ══');

  // The complementary info step might be accessed from the applicant's side
  // through their notifications or the "My applications" section
  // Let's check the notifications bell icon
  await page.goto('/');
  await page.waitForTimeout(3000);

  // Click the notification bell
  const bellIcon = page.locator('[class*="notification-bell"], [class*="fa-bell"], .notification-icon, [class*="bell"]').first();
  if (await bellIcon.isVisible().catch(() => false)) {
    console.log('  Found notification bell — clicking...');
    await bellIcon.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-04-notifications.png`, fullPage: true });

    const notifItems = await page.evaluate(() => {
      const items = document.querySelectorAll('[class*="notification-item"], [class*="dropdown-item"], .notification a');
      return Array.from(items)
        .filter(i => (i as HTMLElement).offsetParent !== null)
        .map(i => ({
          text: i.textContent?.trim().substring(0, 80),
          href: (i as HTMLAnchorElement).href?.substring(0, 100),
        }))
        .slice(0, 10);
    });
    console.log('  Notifications:', JSON.stringify(notifItems, null, 2));
  } else {
    console.log('  No notification bell found');
    // Try the number badge near the bell
    const badge14 = page.locator('sup, .badge').filter({ hasText: '14' }).first();
    if (await badge14.isVisible().catch(() => false)) {
      console.log('  Found badge with 14 — clicking parent...');
      await badge14.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-04b-badge.png`, fullPage: true });
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Check if the front office has a "submit complementary info" button
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Check front-office file view ══');

  // Navigate using the file_id to the front-office view
  // Try: /form?file_id=...
  await page.goto(`/?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-05-file-view.png`, fullPage: true });

  // Also try /complementary-information or similar
  const compUrls = [
    `/complementary-information/${FILE_ID}`,
    `/part-a/${FILE_ID}`,
  ];

  for (const url of compUrls) {
    await page.goto(url);
    await page.waitForTimeout(3000);
    const actualUrl = page.url();
    console.log(`  ${url} → ${actualUrl}`);
    if (actualUrl.includes(FILE_ID) || actualUrl.includes('complementary')) {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-06-found.png`, fullPage: true });

      // Check for buttons
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
          .map(b => b.textContent?.trim().substring(0, 60));
      });
      console.log(`  Buttons: ${JSON.stringify(buttons)}`);
      break;
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Process via API — try to submit the step directly
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 7: Check process API for complementary info ══');

  await page.goto('/part-b');
  await page.waitForTimeout(3000);

  const processInfo = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return 'Error';
    const data = await resp.json();

    // Find the complementary info task
    const compTask = data.tasks?.find((t: any) => t.camundaName === 'complementaryInformation');
    if (!compTask) return 'No complementaryInformation task found';

    return {
      id: compTask.id,
      name: compTask.name,
      shortname: compTask.shortname,
      status: compTask.status,
      assignee: compTask.assignee,
      formProperties: compTask.formProperties,
    };
  });
  console.log('  Task info:', JSON.stringify(processInfo, null, 2));

  console.log('\n══ COMPLEMENTARY INFO DIAGNOSTIC COMPLETE ══');
});
