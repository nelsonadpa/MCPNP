import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Click Part B row & Map Processing UI
 *
 * Go to /part-b, click the TEST-SEZ list item, and discover the
 * processing view (action buttons, status transitions, form fields).
 *
 * Also try: clicking the "Documents check" span and the ellipsis icon.
 *
 * Run:
 *   npx playwright test specs/p2-diag-click-row.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Click Part B row', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to Part B and click TEST-SEZ row
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 1: Click TEST-SEZ row in Part B    ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  console.log(`  Part B URL: ${page.url()}`);

  // Click the first list-item (which is TEST-SEZ)
  const listItem = page.locator('div.list-item').first();
  const isVisible = await listItem.isVisible({ timeout: 5000 });
  console.log(`  First .list-item visible: ${isVisible}`);

  if (isVisible) {
    const itemText = (await listItem.textContent())?.trim().replace(/\s+/g, ' ').substring(0, 100);
    console.log(`  Item text: "${itemText}"`);

    // Click the list item itself
    console.log('  Clicking list item...');
    await listItem.click();
    await page.waitForTimeout(5000);

    const newUrl = page.url();
    console.log(`  After click → URL: ${newUrl}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/20-partb-row-click.png`, fullPage: true });

    // Check if we navigated to a new page
    if (newUrl !== 'https://jamaica.eregistrations.org/part-b') {
      console.log('  Navigated to a new page!');
      await mapUI(page, 'After row click');
    } else {
      console.log('  Still on /part-b — row click did not navigate');

      // Check if something expanded or appeared
      const expandedContent = await page.evaluate(() => {
        const items = document.querySelectorAll('.list-item');
        const first = items[0];
        if (!first) return null;
        return {
          height: (first as HTMLElement).offsetHeight,
          hasExpanded: first.querySelector('.expanded, .detail, .collapse.show, [class*="expand"]') !== null,
          children: first.childElementCount,
          nextSibling: first.nextElementSibling?.className?.toString().substring(0, 80) || '',
          nextSiblingText: first.nextElementSibling?.textContent?.trim().replace(/\s+/g, ' ').substring(0, 200) || '',
        };
      });
      console.log(`  List item state: ${JSON.stringify(expandedContent, null, 2)}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Go back and click the "Documents check" span
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 2: Click "Documents check" span    ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const docCheckSpan = page.locator('span.active-task').first();
  try {
    if (await docCheckSpan.isVisible({ timeout: 5000 })) {
      const text = (await docCheckSpan.textContent())?.trim();
      console.log(`  Clicking active-task span: "${text}"`);
      await docCheckSpan.click();
      await page.waitForTimeout(5000);

      const newUrl = page.url();
      console.log(`  After click → URL: ${newUrl}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/21-active-task-click.png`, fullPage: true });

      if (newUrl !== 'https://jamaica.eregistrations.org/part-b') {
        console.log('  Navigated to processing view!');
        await mapUI(page, 'After Documents check click');
      } else {
        console.log('  Still on /part-b');
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Go back and click the ellipsis icon
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 3: Click ellipsis icon              ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const ellipsisIcon = page.locator('i.fa-regular.fa-ellipsis').first();
  try {
    if (await ellipsisIcon.isVisible({ timeout: 5000 })) {
      console.log('  Clicking ellipsis icon...');
      await ellipsisIcon.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/22-ellipsis-click.png`, fullPage: true });

      // Check what appeared
      const appeared = await page.evaluate(() => {
        const results: string[] = [];

        // Check for past-tasks list becoming visible
        const pastTasks = document.querySelectorAll('.past-tasks');
        pastTasks.forEach((pt, i) => {
          const visible = (pt as HTMLElement).offsetParent !== null;
          const display = getComputedStyle(pt).display;
          const height = (pt as HTMLElement).offsetHeight;
          results.push(`past-tasks[${i}]: visible=${visible} display=${display} height=${height}`);
          if (height > 0) {
            const items = pt.querySelectorAll('li');
            items.forEach((li, j) => {
              results.push(`  li[${j}]: "${li.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80)}"`);
            });
          }
        });

        // Check for any newly visible overlays/popups
        const overlays = document.querySelectorAll('.cdk-overlay-container *, .popover, .tooltip, [class*="overlay"]');
        overlays.forEach((el, i) => {
          const visible = (el as HTMLElement).offsetParent !== null;
          if (visible) {
            results.push(`Overlay[${i}]: <${el.tagName}> class="${el.className?.toString().substring(0, 60)}" text="${el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100)}"`);
          }
        });

        return results;
      });

      for (const r of appeared) {
        console.log(`  ${r}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try clicking the status badge "File pending"
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 4: Click "File pending" badge      ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const filePendingBadge = page.locator('span.status-badge:has-text("File pending")').first();
  try {
    if (await filePendingBadge.isVisible({ timeout: 5000 })) {
      console.log('  Clicking "File pending" badge...');
      await filePendingBadge.click();
      await page.waitForTimeout(5000);

      const newUrl = page.url();
      console.log(`  After click → URL: ${newUrl}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/23-status-badge-click.png`, fullPage: true });

      if (newUrl !== 'https://jamaica.eregistrations.org/part-b') {
        console.log('  Navigated!');
        await mapUI(page, 'After status badge click');
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Try keyboard navigation (Enter on focused row)
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 5: Keyboard navigation             ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Focus the first list item and press Enter
  const firstItem = page.locator('div.list-item').first();
  try {
    await firstItem.focus();
    await page.waitForTimeout(1000);
    console.log('  Focused first list item');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    const newUrl = page.url();
    console.log(`  After Enter → URL: ${newUrl}`);

    if (newUrl !== 'https://jamaica.eregistrations.org/part-b') {
      console.log('  Enter key navigated!');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/24-enter-key.png`, fullPage: true });
      await mapUI(page, 'After Enter key');
    } else {
      console.log('  Enter did not navigate');

      // Try double-click
      await page.goto('/part-b');
      await page.waitForTimeout(5000);
      console.log('  Trying double-click...');
      await page.locator('div.list-item').first().dblclick();
      await page.waitForTimeout(5000);
      const dblUrl = page.url();
      console.log(`  After double-click → URL: ${dblUrl}`);

      if (dblUrl !== 'https://jamaica.eregistrations.org/part-b') {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/24-dblclick.png`, fullPage: true });
        await mapUI(page, 'After double-click');
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Check the sidebar nav - click "Part B" when on inspector
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 6: Inspector → navigate to file    ║');
  console.log('╚══════════════════════════════════════════╝');

  // Navigate to the inspector application detail view (which we know works)
  const inspectorUrl = '/inspector/d51d6c78-5ead-c948-0b82-0d9bc71cd712/Documentary%20check/84e53b18-12b2-11f1-899e-b6594fb67add?file_id=8681df73-af32-45d6-8af1-30d5a7b0b6a1';
  await page.goto(inspectorUrl);
  await page.waitForTimeout(5000);
  console.log(`  Inspector view URL: ${page.url()}`);

  // Now look at the sidebar — from the previous diagnostic we know there's:
  // Dashboard, All applications, Applicant's view (part A), Part B, User rights, Admin (BPA), Statistics
  // Try clicking "Part B" link FROM the inspector view (maybe it shows the processing form for this file)
  const sidebarPartB = page.locator('a:has-text("Part B")');
  const pbCount = await sidebarPartB.count();
  console.log(`  "Part B" links: ${pbCount}`);

  // The sidebar links might be in a dropdown that needs to be opened first
  // Let's check the user dropdown
  const userDropdown = page.locator('button:has-text("NELSON PEREZ")').first();
  try {
    if (await userDropdown.isVisible({ timeout: 3000 })) {
      console.log('  Opening user dropdown...');
      await userDropdown.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/25-user-dropdown-inspector.png`, fullPage: true });

      // Log all items in dropdown
      const ddItems = page.locator('.dropdown-menu:visible a');
      const ddCount = await ddItems.count();
      console.log(`  Dropdown items: ${ddCount}`);
      for (let i = 0; i < Math.min(ddCount, 15); i++) {
        const text = (await ddItems.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60);
        const href = (await ddItems.nth(i).getAttribute('href')) || '';
        console.log(`    [${i}] "${text}" → ${href}`);
      }

      // Click "Part B" from dropdown
      const partBItem = page.locator('.dropdown-menu:visible a:has-text("Part B")');
      if (await partBItem.isVisible({ timeout: 2000 })) {
        console.log('  Clicking "Part B" from dropdown...');
        await partBItem.click();
        await page.waitForTimeout(5000);
        console.log(`  After Part B click → URL: ${page.url()}`);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/26-partb-from-inspector.png`, fullPage: true });
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Check the "Application history" button from inspector
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 7: Application history button      ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto(inspectorUrl);
  await page.waitForTimeout(5000);

  const historyBtn = page.locator('button:has-text("Application history")');
  try {
    if (await historyBtn.isVisible({ timeout: 5000 })) {
      console.log('  Clicking "Application history"...');
      await historyBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/27-app-history.png`, fullPage: true });

      // Check what appeared (modal? sidebar? new section?)
      const historyContent = await page.evaluate(() => {
        const results: string[] = [];

        // Check modals
        document.querySelectorAll('.modal, [role="dialog"]').forEach((m, i) => {
          const visible = (m as HTMLElement).offsetParent !== null;
          const display = getComputedStyle(m).display;
          if (display !== 'none') {
            results.push(`Modal[${i}]: visible=${visible} display=${display} text="${m.textContent?.trim().replace(/\s+/g, ' ').substring(0, 300)}"`);
          }
        });

        // Check CDK overlays (Angular)
        const cdk = document.querySelector('.cdk-overlay-container');
        if (cdk && cdk.children.length > 0) {
          results.push(`CDK overlay: ${cdk.children.length} children`);
          for (let i = 0; i < cdk.children.length; i++) {
            const child = cdk.children[i] as HTMLElement;
            if (child.innerHTML.length > 10) {
              results.push(`  CDK[${i}]: class="${child.className?.toString().substring(0, 60)}" html="${child.innerHTML.substring(0, 300)}"`);
            }
          }
        }

        // Check for any new sections that appeared
        const sidePanels = document.querySelectorAll('[class*="sidebar"]:not(nav), [class*="side-panel"], [class*="drawer"], [class*="offcanvas"]');
        sidePanels.forEach((panel, i) => {
          const visible = (panel as HTMLElement).offsetParent !== null;
          if (visible) {
            results.push(`Side panel[${i}]: class="${panel.className?.toString().substring(0, 80)}" text="${panel.textContent?.trim().replace(/\s+/g, ' ').substring(0, 200)}"`);
          }
        });

        return results;
      });

      for (const r of historyContent) {
        console.log(`  ${r}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 8: Try the "Roles" tab on Part B
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 8: Part B "Roles" tab              ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // From the screenshot, Part B had "Services" and "Roles" tabs at top
  const rolesTab = page.locator('text="Roles"').first();
  try {
    if (await rolesTab.isVisible({ timeout: 5000 })) {
      console.log('  Clicking "Roles" tab...');
      await rolesTab.click();
      await page.waitForTimeout(5000);
      console.log(`  After Roles click → URL: ${page.url()}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/28-roles-tab.png`, fullPage: true });

      // Map the roles view
      const rolesContent = await page.evaluate(() => {
        const results: string[] = [];
        // Look for role-related elements
        const items = document.querySelectorAll('.list-item:not(.header)');
        results.push(`List items: ${items.length}`);
        items.forEach((item, i) => {
          if (i < 5) {
            results.push(`  Item[${i}]: "${(item as HTMLElement).textContent?.trim().replace(/\s+/g, ' ').substring(0, 150)}"`);
          }
        });
        return results;
      });
      for (const r of rolesContent) {
        console.log(`  ${r}`);
      }
    }
  } catch (e: any) {
    console.log(`  Roles tab error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 9: Click on a list-item from Roles view
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 9: Click Roles list item           ║');
  console.log('╚══════════════════════════════════════════╝');

  // The Roles view should show grouped by role. Click the first item
  const rolesListItem = page.locator('div.list-item').first();
  try {
    if (await rolesListItem.isVisible({ timeout: 5000 })) {
      const text = (await rolesListItem.textContent())?.trim().replace(/\s+/g, ' ').substring(0, 100);
      console.log(`  Clicking first roles list item: "${text}"`);
      await rolesListItem.click();
      await page.waitForTimeout(5000);

      const newUrl = page.url();
      console.log(`  After click → URL: ${newUrl}`);

      if (newUrl !== 'https://jamaica.eregistrations.org/part-b') {
        console.log('  NAVIGATED TO PROCESSING VIEW!');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/29-processing-view.png`, fullPage: true });
        await mapUI(page, 'Processing view');
      } else {
        console.log('  Did not navigate');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/29-no-navigate.png`, fullPage: true });
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIC COMPLETE                     ║');
  console.log('╚══════════════════════════════════════════╝');
});

// ══════════════════════════════════════════════════════════
// Helper: map full UI of current page
// ══════════════════════════════════════════════════════════
async function mapUI(page: any, label: string) {
  console.log(`\n  ╔══ ${label} ══╗`);

  // URL
  console.log(`  URL: ${page.url()}`);

  // Buttons
  const buttons = page.locator('button:visible');
  const btnCount = await buttons.count();
  console.log(`\n  Buttons: ${btnCount}`);
  for (let i = 0; i < Math.min(btnCount, 25); i++) {
    const text = (await buttons.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const cls = (await buttons.nth(i).getAttribute('class')) || '';
    if (text) console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 60)}"`);
  }

  // Links
  const links = page.locator('a:visible');
  const linkCount = await links.count();
  console.log(`\n  Links: ${linkCount}`);
  for (let i = 0; i < Math.min(linkCount, 30); i++) {
    const text = (await links.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const href = (await links.nth(i).getAttribute('href')) || '';
    if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
  }

  // Tabs
  const tabs = page.locator('[role="tab"]:visible, .nav-tabs .nav-link:visible, .nav-pills .nav-link:visible');
  const tabCount = await tabs.count();
  if (tabCount > 0) {
    console.log(`\n  Tabs: ${tabCount}`);
    for (let i = 0; i < Math.min(tabCount, 15); i++) {
      const text = (await tabs.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      console.log(`  [tab${i}] "${text}"`);
    }
  }

  // Badges
  const badges = page.locator('.badge:visible, [class*="badge"]:visible');
  const badgeCount = await badges.count();
  if (badgeCount > 0) {
    console.log(`\n  Badges: ${badgeCount}`);
    for (let i = 0; i < Math.min(badgeCount, 10); i++) {
      const text = (await badges.nth(i).textContent())?.trim().substring(0, 40) || '';
      if (text) console.log(`  [badge${i}] "${text}"`);
    }
  }

  // Inputs
  const inputs = page.locator('input:visible, textarea:visible, select:visible');
  const inputCount = await inputs.count();
  if (inputCount > 0) {
    console.log(`\n  Inputs: ${inputCount}`);
    for (let i = 0; i < Math.min(inputCount, 20); i++) {
      const tag = await inputs.nth(i).evaluate((e: Element) => e.tagName);
      const type = (await inputs.nth(i).getAttribute('type')) || '';
      const name = (await inputs.nth(i).getAttribute('name')) || '';
      const placeholder = (await inputs.nth(i).getAttribute('placeholder')) || '';
      console.log(`  [input${i}] <${tag}> type="${type}" name="${name}" placeholder="${placeholder}"`);
    }
  }

  // Formio
  const formioData = await page.evaluate(() => {
    const forms = (window as any).Formio?.forms;
    if (!forms) return null;
    const keys = Object.keys(forms);
    return keys.map((k: string) => {
      const data = forms[k]?.submission?.data || {};
      return { key: k, count: Object.keys(data).length, keys: Object.keys(data).slice(0, 20) };
    });
  });
  if (formioData) {
    console.log(`\n  Formio forms: ${formioData.length}`);
    for (const f of formioData) {
      console.log(`  Form ${f.key} (${f.count} keys): [${f.keys.join(', ')}]`);
    }
  }

  // Deep scan for action words
  const actionScan = await page.evaluate(() => {
    const actionWords = /validate|reject|approve|correction|assign|transfer|complete|send back|devolver|change status|update status|file validated|file reject/i;
    const results: string[] = [];
    document.querySelectorAll('button, a, [role="button"], select option, .dropdown-menu a, .dropdown-menu button').forEach(el => {
      const text = el.textContent?.trim() || '';
      if (actionWords.test(text)) {
        const visible = (el as HTMLElement).offsetParent !== null;
        results.push(`[${visible ? 'VISIBLE' : 'HIDDEN'}] <${el.tagName}> "${text.substring(0, 60)}" class="${el.className?.toString().substring(0, 40)}"`);
      }
    });
    return results;
  });
  if (actionScan.length > 0) {
    console.log(`\n  ACTION ELEMENTS FOUND: ${actionScan.length}`);
    for (const r of actionScan) {
      console.log(`  ${r}`);
    }
  }
}
