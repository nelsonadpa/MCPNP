import { test } from '@playwright/test';
import path from 'path';

/**
 * Phase 2 — Back-Office Diagnostic
 *
 * After a successful Phase 1 submission, this spec explores how to reach
 * the officer/inspector back-office view to find the submitted application
 * in the processing queue. It tries multiple approaches:
 *   1. Inspector toggle on the dashboard
 *   2. User dropdown menu for role switching
 *   3. Common back-office URL patterns
 *   4. Role-related elements anywhere on the page
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');

test('P2-DIAG: Back-office discovery', async ({ page }) => {
  test.setTimeout(300_000);

  // ── Helper: log all visible links/buttons ──
  async function logLinksAndButtons(label: string) {
    console.log(`\n══════ ${label}: Links & Buttons ══════`);

    const links = page.locator('a:visible');
    const linkCount = await links.count();
    console.log(`  Visible <a> tags: ${linkCount}`);
    for (let i = 0; i < Math.min(linkCount, 40); i++) {
      const text = (await links.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const href = (await links.nth(i).getAttribute('href')) || '';
      if (text || href) {
        console.log(`    [a ${i}] text="${text}" href="${href}"`);
      }
    }

    const buttons = page.locator('button:visible');
    const btnCount = await buttons.count();
    console.log(`  Visible <button> tags: ${btnCount}`);
    for (let i = 0; i < Math.min(btnCount, 20); i++) {
      const text = (await buttons.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const cls = (await buttons.nth(i).getAttribute('class')) || '';
      if (text) {
        console.log(`    [btn ${i}] text="${text}" class="${cls.substring(0, 60)}"`);
      }
    }
  }

  // ── Helper: log navigation structure ──
  async function logNavStructure(label: string) {
    console.log(`\n══════ ${label}: Navigation Structure ══════`);

    // Sidebar
    const sidebarItems = page.locator('nav:visible a, [class*="sidebar"] a:visible, [class*="side-nav"] a:visible, .list-group-item:visible');
    const sideCount = await sidebarItems.count();
    console.log(`  Sidebar/nav items: ${sideCount}`);
    for (let i = 0; i < Math.min(sideCount, 20); i++) {
      const text = (await sidebarItems.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      const href = (await sidebarItems.nth(i).getAttribute('href')) || '';
      if (text) {
        console.log(`    [nav ${i}] "${text}" → ${href}`);
      }
    }

    // Tabs
    const tabs = page.locator('[role="tab"]:visible, .nav-tabs .nav-link:visible');
    const tabCount = await tabs.count();
    console.log(`  Tabs: ${tabCount}`);
    for (let i = 0; i < Math.min(tabCount, 15); i++) {
      const text = (await tabs.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      console.log(`    [tab ${i}] "${text}"`);
    }
  }

  // ── Helper: log tables/lists (application queues) ──
  async function logTablesAndLists(label: string) {
    console.log(`\n══════ ${label}: Tables & Lists ══════`);

    const tables = page.locator('table:visible');
    const tableCount = await tables.count();
    console.log(`  Visible tables: ${tableCount}`);
    for (let t = 0; t < Math.min(tableCount, 5); t++) {
      const headers = await tables.nth(t).locator('th').allTextContents();
      console.log(`    Table ${t} headers: ${headers.map(h => h.trim()).join(' | ')}`);
      const rows = await tables.nth(t).locator('tbody tr').count();
      console.log(`    Table ${t} rows: ${rows}`);
      // Log first 5 rows
      for (let r = 0; r < Math.min(rows, 5); r++) {
        const cells = await tables.nth(t).locator('tbody tr').nth(r).locator('td').allTextContents();
        console.log(`      Row ${r}: ${cells.map(c => c.trim().substring(0, 40)).join(' | ')}`);
      }
    }

    // List groups (common in eRegistrations for file queues)
    const listItems = page.locator('.list-group-item:visible, [class*="file-item"]:visible, [class*="application-item"]:visible');
    const listCount = await listItems.count();
    if (listCount > 0) {
      console.log(`  List items: ${listCount}`);
      for (let i = 0; i < Math.min(listCount, 10); i++) {
        const text = (await listItems.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 100) || '';
        console.log(`    [list ${i}] "${text}"`);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to dashboard
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 1: Dashboard                       ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.waitForTimeout(3000);

  console.log(`  URL: ${page.url()}`);
  console.log(`  Title: ${await page.title()}`);

  await logLinksAndButtons('Dashboard');
  await logNavStructure('Dashboard');

  await page.screenshot({
    path: `${SCREENSHOT_DIR}/P2-DIAG-01-dashboard.png`,
    fullPage: true,
  });
  console.log('  Screenshot: P2-DIAG-01-dashboard.png');

  // ══════════════════════════════════════════════════════════
  // STEP 2: Check for inspector/officer toggle on dashboard
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 2: Inspector toggle search          ║');
  console.log('╚══════════════════════════════════════════╝');

  const toggleKeywords = [
    'Inspector', 'inspector',
    'Officer', 'officer',
    'Back office', 'back office', 'Backoffice',
    'Processing', 'processing',
    'My files', 'my files',
    'Pending', 'pending',
    'Part B', 'part b', 'partb',
    'Review', 'Revision',
    'Official', 'official',
    'Switch role', 'switch role',
    'View as', 'view as',
  ];

  for (const keyword of toggleKeywords) {
    const matches = page.locator(`text="${keyword}"`);
    const count = await matches.count();
    if (count > 0) {
      console.log(`  FOUND "${keyword}" — ${count} match(es)`);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const el = matches.nth(i);
        const tag = await el.evaluate((e: Element) => e.tagName);
        const cls = (await el.getAttribute('class')) || '';
        const href = (await el.getAttribute('href')) || '';
        const parent = await el.evaluate((e: Element) => {
          const p = e.closest('a, button, [role="button"]');
          return p ? { tag: p.tagName, href: (p as HTMLAnchorElement).href || '', class: p.className.substring(0, 60) } : null;
        });
        console.log(`    [${i}] <${tag}> class="${cls.substring(0, 60)}" href="${href}"`);
        if (parent) {
          console.log(`      Parent clickable: <${parent.tag}> href="${parent.href}" class="${parent.class}"`);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Open user dropdown menu
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 3: User dropdown menu               ║');
  console.log('╚══════════════════════════════════════════╝');

  // Try clicking the user name
  const userNameLocators = [
    page.locator('text=NELSON PEREZ').first(),
    page.locator('text=Nelson Perez').first(),
    page.locator('[class*="user"] >> visible=true').first(),
    page.locator('[class*="dropdown"] >> text=/NELSON|Nelson/').first(),
    page.locator('.navbar >> text=/NELSON|Nelson/').first(),
  ];

  let userMenuClicked = false;
  for (const locator of userNameLocators) {
    try {
      if (await locator.isVisible({ timeout: 3000 })) {
        const text = await locator.textContent();
        console.log(`  Clicking user element: "${text?.trim().substring(0, 40)}"`);
        await locator.click();
        await page.waitForTimeout(2000);
        userMenuClicked = true;
        break;
      }
    } catch {
      // Try next
    }
  }

  if (userMenuClicked) {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/P2-DIAG-02-user-menu.png`,
      fullPage: true,
    });
    console.log('  Screenshot: P2-DIAG-02-user-menu.png');

    // Log dropdown items
    const dropdownItems = page.locator('.dropdown-menu:visible a, .dropdown-menu:visible button, [class*="menu"]:visible a, [role="menu"]:visible [role="menuitem"]');
    const ddCount = await dropdownItems.count();
    console.log(`  Dropdown items visible: ${ddCount}`);
    for (let i = 0; i < Math.min(ddCount, 15); i++) {
      const text = (await dropdownItems.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      const href = (await dropdownItems.nth(i).getAttribute('href')) || '';
      console.log(`    [dd ${i}] "${text}" href="${href}"`);
    }

    // Also scan for any text containing role-like keywords in the dropdown
    const allVisibleText = await page.evaluate(() => {
      const menus = document.querySelectorAll('.dropdown-menu, [role="menu"], [class*="popover"], [class*="modal"]');
      return Array.from(menus).map(m => ({
        class: m.className.substring(0, 60),
        text: m.textContent?.trim().replace(/\s+/g, ' ').substring(0, 300) || '',
        visible: (m as HTMLElement).offsetParent !== null,
      }));
    });
    for (const menu of allVisibleText) {
      if (menu.visible || menu.text) {
        console.log(`  Menu element (class="${menu.class}"): "${menu.text}"`);
      }
    }

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('  WARNING: Could not find/click user name element');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/P2-DIAG-02-user-menu.png`,
      fullPage: true,
    });
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try common back-office URLs
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 4: Common back-office URLs          ║');
  console.log('╚══════════════════════════════════════════╝');

  const backOfficeUrls = [
    '/partb/',
    '/inspector/',
    '/processing/',
    '/officer/',
    '/official/',
    '/review/',
    '/revision/',
    '/back-office/',
    '/backoffice/',
    '/files/',
    '/pending/',
    '/queue/',
    '/desk/',
    '/my-files/',
  ];

  for (const urlPath of backOfficeUrls) {
    try {
      const response = await page.goto(urlPath, { timeout: 15_000, waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;
      const finalUrl = page.url();
      const title = await page.title();

      // Check if we got redirected back to root or got a 404
      const isRedirect = finalUrl.endsWith('/') && !finalUrl.includes(urlPath.replace(/\//g, ''));
      const bodyText = await page.locator('body').textContent().catch(() => '');
      const has404 = bodyText?.includes('404') || bodyText?.includes('Not Found') || bodyText?.includes('not found');

      if (status === 200 && !has404 && !isRedirect) {
        console.log(`  ✓ ${urlPath} → status=${status} url="${finalUrl}" title="${title}"`);
        // This one worked — document it thoroughly
        await page.waitForTimeout(3000);
        await logLinksAndButtons(`URL ${urlPath}`);
        await logNavStructure(`URL ${urlPath}`);
        await logTablesAndLists(`URL ${urlPath}`);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/P2-DIAG-03-inspector-view.png`,
          fullPage: true,
        });
        console.log(`  Screenshot: P2-DIAG-03-inspector-view.png`);
      } else {
        console.log(`  ✗ ${urlPath} → status=${status} redirect=${isRedirect} 404=${has404} url="${finalUrl}"`);
      }
    } catch (e: any) {
      console.log(`  ✗ ${urlPath} → ERROR: ${e.message?.substring(0, 80)}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Check for role-related elements on dashboard
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 5: Role-related elements            ║');
  console.log('╚══════════════════════════════════════════╝');

  // Go back to dashboard
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.waitForTimeout(3000);

  const roleKeywords = [
    'Documents check', 'Document check',
    'Legal evaluation', 'Legal review',
    'Technical evaluation', 'Technical review',
    'Front desk', 'Front Desk',
    'Social window', 'Social Window',
    'Director', 'director',
    'Supervisor', 'supervisor',
    'Approver', 'approver',
    'Registrar', 'registrar',
    'Clerk', 'clerk',
    'Certifier', 'certifier',
    'Dispatcher', 'dispatcher',
    'Assigned files', 'Assigned Files',
    'Pending files', 'Pending Files',
    'All files', 'All Files',
    'Queue', 'queue',
    'Inbox', 'inbox',
    'Tasks', 'tasks',
    'Workflow', 'workflow',
  ];

  for (const keyword of roleKeywords) {
    const matches = page.locator(`text="${keyword}"`);
    const count = await matches.count();
    if (count > 0) {
      console.log(`  FOUND role keyword "${keyword}" — ${count} match(es)`);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const el = matches.nth(i);
        try {
          const tag = await el.evaluate((e: Element) => e.tagName);
          const cls = (await el.getAttribute('class')) || '';
          const href = (await el.getAttribute('href')) || '';
          console.log(`    [${i}] <${tag}> class="${cls.substring(0, 60)}" href="${href}"`);
        } catch {
          console.log(`    [${i}] (could not read element details)`);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Deep DOM scan for back-office clues
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 6: Deep DOM scan                    ║');
  console.log('╚══════════════════════════════════════════╝');

  const domScan = await page.evaluate(() => {
    const results: Record<string, string[]> = {
      allHrefs: [],
      hiddenElements: [],
      iframes: [],
      dataAttributes: [],
    };

    // Collect all hrefs on the page (even hidden)
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const text = a.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      if (href && !href.startsWith('javascript:')) {
        results.allHrefs.push(`"${text}" → ${href}`);
      }
    });

    // Check for hidden elements with back-office keywords
    const allElements = document.querySelectorAll('*');
    const boKeywords = /inspector|officer|partb|back.?office|processing|pending|queue|review|desk|files/i;
    allElements.forEach((el) => {
      const text = el.textContent?.trim() || '';
      const id = el.id || '';
      const cls = el.className?.toString() || '';
      if (boKeywords.test(id) || boKeywords.test(cls)) {
        const visible = (el as HTMLElement).offsetParent !== null;
        results.hiddenElements.push(`<${el.tagName}> id="${id}" class="${cls.substring(0, 60)}" visible=${visible}`);
      }
    });

    // Check for iframes
    document.querySelectorAll('iframe').forEach((iframe) => {
      results.iframes.push(`src="${iframe.src}" visible=${iframe.offsetParent !== null}`);
    });

    // Check for data-* attributes with interesting values
    allElements.forEach((el) => {
      const attrs = el.attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name.startsWith('data-') && boKeywords.test(attr.value)) {
          results.dataAttributes.push(`<${el.tagName}> ${attr.name}="${attr.value.substring(0, 80)}"`);
        }
      }
    });

    return results;
  });

  console.log(`  All hrefs on page: ${domScan.allHrefs.length}`);
  for (const href of domScan.allHrefs.slice(0, 50)) {
    console.log(`    ${href}`);
  }

  if (domScan.hiddenElements.length > 0) {
    console.log(`  Elements with back-office keywords in id/class: ${domScan.hiddenElements.length}`);
    for (const el of domScan.hiddenElements.slice(0, 20)) {
      console.log(`    ${el}`);
    }
  }

  if (domScan.iframes.length > 0) {
    console.log(`  Iframes: ${domScan.iframes.length}`);
    for (const iframe of domScan.iframes) {
      console.log(`    ${iframe}`);
    }
  }

  if (domScan.dataAttributes.length > 0) {
    console.log(`  Data attributes with BO keywords: ${domScan.dataAttributes.length}`);
    for (const attr of domScan.dataAttributes.slice(0, 20)) {
      console.log(`    ${attr}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Check "My applications" for submitted app
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 7: My Applications (submitted app)  ║');
  console.log('╚══════════════════════════════════════════╝');

  // Try to find and expand "My applications"
  const myApps = page.locator('text=/[Mm]y [Aa]pplications?/').first();
  try {
    if (await myApps.isVisible({ timeout: 5000 })) {
      await myApps.scrollIntoViewIfNeeded();
      await myApps.click();
      await page.waitForTimeout(3000);

      // Look for submitted applications
      const appItems = page.locator('[class*="application"], [class*="file"], [class*="submission"], table tbody tr').first();
      if (await appItems.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logTablesAndLists('My Applications');
      }

      // Look specifically for status badges/labels
      const statusElements = page.locator('[class*="badge"]:visible, [class*="status"]:visible, [class*="label"]:visible');
      const statusCount = await statusElements.count();
      console.log(`  Status elements found: ${statusCount}`);
      for (let i = 0; i < Math.min(statusCount, 10); i++) {
        const text = (await statusElements.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        if (text) {
          console.log(`    [status ${i}] "${text}"`);
        }
      }

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/P2-DIAG-04-officer-queue.png`,
        fullPage: true,
      });
      console.log('  Screenshot: P2-DIAG-04-officer-queue.png');
    } else {
      console.log('  "My applications" not visible on dashboard');
    }
  } catch (e: any) {
    console.log(`  Error exploring My Applications: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 8: Try clicking any discovered inspector/officer link
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 8: Try clicking discovered links     ║');
  console.log('╚══════════════════════════════════════════╝');

  // Go back to dashboard fresh
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Try clicking links that might be inspector/officer toggles
  const candidateSelectors = [
    'a:has-text("Inspector")',
    'a:has-text("Officer")',
    'a:has-text("Processing")',
    'a:has-text("Back office")',
    'a:has-text("My files")',
    'a:has-text("Pending")',
    'a:has-text("Files")',
    'a:has-text("Queue")',
    'a:has-text("Desk")',
    'a:has-text("Part B")',
    'button:has-text("Inspector")',
    'button:has-text("Officer")',
    'button:has-text("Processing")',
    '[class*="toggle"]:has-text("Inspector")',
    '[class*="switch"]:has-text("role")',
  ];

  for (const selector of candidateSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 })) {
        const text = (await el.textContent())?.trim().substring(0, 40);
        console.log(`  CLICKING: "${text}" (${selector})`);
        await el.click();
        await page.waitForTimeout(5000);

        const newUrl = page.url();
        const newTitle = await page.title();
        console.log(`    After click → URL: ${newUrl} Title: ${newTitle}`);

        await logLinksAndButtons(`After clicking "${text}"`);
        await logNavStructure(`After clicking "${text}"`);
        await logTablesAndLists(`After clicking "${text}"`);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/P2-DIAG-03-inspector-view.png`,
          fullPage: true,
        });
        console.log(`    Screenshot: P2-DIAG-03-inspector-view.png`);

        // If we landed somewhere new, we're done searching
        if (newUrl !== page.url()) {
          console.log('  Found back-office entry point!');
        }
        break; // Stop after first successful click
      }
    } catch {
      // Selector not found, continue
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 9: Summary
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 9: Summary                          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('  Diagnostic complete. Review logs above for:');
  console.log('  - Inspector/officer toggle location');
  console.log('  - Working back-office URLs');
  console.log('  - Role-related UI elements');
  console.log('  - Submitted application status');
  console.log('  - Screenshots in 02-front-office-tests/screenshots/P2-DIAG-*.png');
});
