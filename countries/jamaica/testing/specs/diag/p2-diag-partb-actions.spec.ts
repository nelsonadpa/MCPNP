import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Part B Processing Actions Discovery
 *
 * Navigate to /part-b, find the TEST-SEZ application at "Documents Check" step,
 * click the "..." action menu, and discover all available processing actions.
 *
 * Run:
 *   npx playwright test specs/p2-diag-partb-actions.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Part B processing actions', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to Part B
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 1: Part B - Processing Queue       ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-partb-list.png`, fullPage: true });

  // Log all list items/rows
  const listStructure = await page.evaluate(() => {
    const results: string[] = [];

    // Find the main list container
    const listItems = document.querySelectorAll('[class*="list-item"], [class*="row"], tr');
    results.push(`List items/rows: ${listItems.length}`);

    // Find our application
    const allText = document.body.innerText;
    const testSezIdx = allText.indexOf('TEST-SEZ');
    if (testSezIdx >= 0) {
      results.push(`TEST-SEZ found at char ${testSezIdx}`);
      results.push(`Context: "${allText.substring(Math.max(0, testSezIdx - 30), testSezIdx + 150).replace(/\n/g, ' | ')}"`);
    }

    // Find all "..." or ellipsis menus
    const ellipsisElements = document.querySelectorAll('[class*="ellipsis"], [class*="more"], [class*="action"], [class*="menu"], [class*="dots"]');
    results.push(`\nEllipsis/action elements: ${ellipsisElements.length}`);
    ellipsisElements.forEach((el, i) => {
      const cls = el.className?.toString().substring(0, 80) || '';
      const tag = el.tagName;
      const visible = (el as HTMLElement).offsetParent !== null;
      const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 40) || '';
      results.push(`  [${i}] <${tag}> class="${cls}" visible=${visible} text="${text}"`);
    });

    return results;
  });

  for (const line of listStructure) {
    console.log(`  ${line}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Find the "..." action button near TEST-SEZ/Documents Check
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 2: Find action menu                ║');
  console.log('╚══════════════════════════════════════════╝');

  // Strategy 1: Look for "..." text or "⋯" or "···" buttons
  const dotButtons = page.locator('button:visible, a:visible').filter({ hasText: /^[\.\…·⋯]{2,3}$|^\s*$/ });
  const dotCount = await dotButtons.count();
  console.log(`  Dot/ellipsis buttons: ${dotCount}`);

  // Strategy 2: Look for the processing step "Documents Check" which is a link
  const docCheckLinks = page.locator('a:has-text("Documents Check"), a:has-text("Documentary check")');
  const dcCount = await docCheckLinks.count();
  console.log(`  "Documents Check" links: ${dcCount}`);
  for (let i = 0; i < Math.min(dcCount, 5); i++) {
    const text = (await docCheckLinks.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60);
    const href = await docCheckLinks.nth(i).getAttribute('href');
    console.log(`    [${i}] "${text}" → ${href}`);
  }

  // Strategy 3: Look for text "..." literally
  const threeDotsElements = page.locator('text="..."');
  const tdCount = await threeDotsElements.count();
  console.log(`  "..." text elements: ${tdCount}`);

  // Strategy 4: Find all buttons/links near the first row
  const allBtns = page.locator('button:visible');
  const btnCount = await allBtns.count();
  console.log(`\n  All visible buttons: ${btnCount}`);
  for (let i = 0; i < Math.min(btnCount, 20); i++) {
    const text = (await allBtns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const cls = (await allBtns.nth(i).getAttribute('class')) || '';
    console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 60)}"`);
  }

  // Strategy 5: Find all links
  const allLinks = page.locator('a:visible');
  const linkCount = await allLinks.count();
  console.log(`\n  All visible links: ${linkCount}`);
  for (let i = 0; i < Math.min(linkCount, 30); i++) {
    const text = (await allLinks.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const href = (await allLinks.nth(i).getAttribute('href')) || '';
    if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Click on "Documents Check" link for TEST-SEZ app
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 3: Click Documents Check link      ║');
  console.log('╚══════════════════════════════════════════╝');

  // The first "Documents Check" should be for our TEST-SEZ app (first row)
  let clickedDocCheck = false;
  try {
    const docCheck = page.locator('a:has-text("Documents Check")').first();
    if (await docCheck.isVisible({ timeout: 5000 })) {
      const href = await docCheck.getAttribute('href');
      console.log(`  Clicking "Documents Check" → ${href}`);
      await docCheck.click();
      await page.waitForTimeout(5000);
      console.log(`  After click → URL: ${page.url()}`);
      clickedDocCheck = true;

      await page.screenshot({ path: `${SCREENSHOT_DIR}/11-doc-check-view.png`, fullPage: true });

      // Map the entire processing view
      console.log('\n  === PROCESSING VIEW UI ===');

      // Buttons
      const viewBtns = page.locator('button:visible');
      const vbCount = await viewBtns.count();
      console.log(`\n  Buttons: ${vbCount}`);
      for (let i = 0; i < Math.min(vbCount, 25); i++) {
        const text = (await viewBtns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
        const cls = (await viewBtns.nth(i).getAttribute('class')) || '';
        const id = (await viewBtns.nth(i).getAttribute('id')) || '';
        if (text) console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 60)}" id="${id}"`);
      }

      // Links
      const viewLinks = page.locator('a:visible');
      const vlCount = await viewLinks.count();
      console.log(`\n  Links: ${vlCount}`);
      for (let i = 0; i < Math.min(vlCount, 30); i++) {
        const text = (await viewLinks.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
        const href = (await viewLinks.nth(i).getAttribute('href')) || '';
        if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
      }

      // Tabs
      const viewTabs = page.locator('[role="tab"]:visible, .nav-tabs .nav-link:visible, .nav-pills .nav-link:visible');
      const vtCount = await viewTabs.count();
      console.log(`\n  Tabs: ${vtCount}`);
      for (let i = 0; i < Math.min(vtCount, 15); i++) {
        const text = (await viewTabs.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const cls = (await viewTabs.nth(i).getAttribute('class')) || '';
        const isActive = cls.includes('active') ? ' [ACTIVE]' : '';
        console.log(`  [tab${i}] "${text}"${isActive}`);
      }

      // Selects/dropdowns
      const viewSels = page.locator('select:visible');
      const vsCount = await viewSels.count();
      console.log(`\n  Selects: ${vsCount}`);
      for (let i = 0; i < Math.min(vsCount, 10); i++) {
        const name = (await viewSels.nth(i).getAttribute('name')) || '';
        const id = (await viewSels.nth(i).getAttribute('id')) || '';
        const options = await viewSels.nth(i).locator('option').allTextContents();
        console.log(`  [sel${i}] name="${name}" id="${id}" options=[${options.map(o => o.trim()).join(', ')}]`);
      }

      // Badges
      const viewBadges = page.locator('.badge:visible, [class*="badge"]:visible, [class*="status"]:visible');
      const vbadgeCount = await viewBadges.count();
      console.log(`\n  Badges/Status: ${vbadgeCount}`);
      for (let i = 0; i < Math.min(vbadgeCount, 10); i++) {
        const text = (await viewBadges.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const cls = (await viewBadges.nth(i).getAttribute('class')) || '';
        if (text) console.log(`  [badge${i}] "${text}" class="${cls.substring(0, 60)}"`);
      }

      // Inputs
      const viewInputs = page.locator('input:visible, textarea:visible');
      const viCount = await viewInputs.count();
      console.log(`\n  Inputs: ${viCount}`);
      for (let i = 0; i < Math.min(viCount, 20); i++) {
        const type = (await viewInputs.nth(i).getAttribute('type')) || 'text';
        const name = (await viewInputs.nth(i).getAttribute('name')) || '';
        const placeholder = (await viewInputs.nth(i).getAttribute('placeholder')) || '';
        console.log(`  [input${i}] type="${type}" name="${name}" placeholder="${placeholder}"`);
      }

      // Formio
      const formioData = await page.evaluate(() => {
        const forms = (window as any).Formio?.forms;
        if (!forms) return null;
        const keys = Object.keys(forms);
        return keys.map(k => {
          const data = forms[k]?.submission?.data || {};
          const dataKeys = Object.keys(data);
          return { key: k, count: dataKeys.length, keys: dataKeys.slice(0, 30) };
        });
      });
      if (formioData) {
        console.log(`\n  Formio forms: ${formioData.length}`);
        for (const f of formioData) {
          console.log(`  Form ${f.key} (${f.count} keys): [${f.keys.join(', ')}]`);
        }
      }

      // Deep scan for any hidden action buttons/panels
      const deepScan = await page.evaluate(() => {
        const results: string[] = [];

        // All buttons including hidden
        document.querySelectorAll('button').forEach((btn, i) => {
          const text = btn.textContent?.trim().replace(/\s+/g, ' ') || '';
          const visible = btn.offsetParent !== null;
          if (text && !visible) {
            results.push(`Hidden button[${i}]: "${text.substring(0, 60)}" class="${btn.className.substring(0, 60)}"`);
          }
        });

        // Look for "validate", "reject", "approve" etc in ALL elements
        const actionWords = /validate|reject|approve|correction|process|assign|transfer|complete|send back|devolver/i;
        document.querySelectorAll('*').forEach(el => {
          if (el.childElementCount === 0) {
            const text = el.textContent?.trim() || '';
            if (actionWords.test(text)) {
              const visible = (el as HTMLElement).offsetParent !== null;
              results.push(`Action word element [${visible ? 'V' : 'H'}]: <${el.tagName}> "${text.substring(0, 60)}" class="${el.className?.toString().substring(0, 40)}"`);
            }
          }
        });

        // Check for Angular components with processing-related names
        document.querySelectorAll('*').forEach(el => {
          const tag = el.tagName.toLowerCase();
          if (tag.includes('process') || tag.includes('action') || tag.includes('status') || tag.includes('transition') || tag.includes('review')) {
            const visible = (el as HTMLElement).offsetParent !== null;
            results.push(`Angular component: <${tag}> visible=${visible} class="${el.className?.toString().substring(0, 40)}"`);
          }
        });

        return results;
      });

      console.log(`\n  Deep scan results: ${deepScan.length}`);
      for (const r of deepScan) {
        console.log(`  ${r}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 100)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Go back and try the "..." action menu
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 4: Try "..." action menu           ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Find the "..." buttons/elements - they appeared in the screenshot next to processing step names
  // The "..." might be rendered as a span or a button with specific class
  const actionMenuScan = await page.evaluate(() => {
    const results: string[] = [];

    // Look for elements with innerText of exactly "..." or "···" or "⋯"
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el, idx) => {
      if (el.childElementCount === 0) {
        const text = el.textContent?.trim() || '';
        if (text === '...' || text === '···' || text === '⋯' || text === '…' || text === '•••') {
          const visible = (el as HTMLElement).offsetParent !== null;
          const tag = el.tagName;
          const cls = el.className?.toString().substring(0, 60) || '';
          const parent = el.parentElement;
          const parentCls = parent?.className?.toString().substring(0, 60) || '';
          const parentTag = parent?.tagName || '';
          results.push(`[${visible ? 'V' : 'H'}] <${tag}> class="${cls}" text="${text}" parent=<${parentTag}> class="${parentCls}"`);

          // Check if parent or grandparent is clickable
          let clickable = el.closest('a, button, [role="button"], [onclick]');
          if (clickable) {
            results.push(`  Clickable ancestor: <${clickable.tagName}> class="${clickable.className?.toString().substring(0, 60)}" href="${(clickable as HTMLAnchorElement).href || ''}"`);
          }
        }
      }
    });

    // Also look for dropdown triggers near processing columns
    document.querySelectorAll('[class*="dropdown"], [class*="popover"], [class*="trigger"], [class*="toggle"]').forEach((el, i) => {
      const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      const cls = el.className?.toString().substring(0, 80) || '';
      const visible = (el as HTMLElement).offsetParent !== null;
      if (visible && (text.includes('...') || text.includes('Check') || text.includes('Review') || text === '')) {
        results.push(`Dropdown element[${i}]: <${el.tagName}> class="${cls}" text="${text.substring(0, 40)}"`);
      }
    });

    // Look for SVG icons (dots/more icons)
    document.querySelectorAll('svg, i[class*="dots"], i[class*="more"], i[class*="ellipsis"]').forEach((el, i) => {
      const visible = (el as HTMLElement).offsetParent !== null;
      const cls = el.className?.toString().substring(0, 60) || '';
      const parentTag = el.parentElement?.tagName || '';
      const parentCls = el.parentElement?.className?.toString().substring(0, 40) || '';
      if (visible) {
        results.push(`Icon[${i}]: <${el.tagName}> class="${cls}" parent=<${parentTag}> class="${parentCls}"`);
      }
    });

    return results;
  });

  console.log(`  Action menu scan results: ${actionMenuScan.length}`);
  for (const r of actionMenuScan) {
    console.log(`  ${r}`);
  }

  // Try to click the "..." near the first row's processing step
  // From the screenshot, it appears as "Documents Check ···"
  // Let's try clicking on text "..." near "Documents Check"
  try {
    // First, find the row container for TEST-SEZ
    const testSezRow = page.locator('.list-item:has-text("TEST-SEZ"), [class*="item"]:has-text("TEST-SEZ"), div:has-text("TEST-SEZ")').first();
    if (await testSezRow.isVisible({ timeout: 3000 })) {
      // Find any "..." or action trigger inside this row
      const dots = testSezRow.locator('text="..."').first();
      const dotsCount = await testSezRow.locator('text="..."').count();
      console.log(`\n  "..." elements in TEST-SEZ row: ${dotsCount}`);

      if (dotsCount > 0) {
        console.log('  Clicking "..." in TEST-SEZ row...');
        await dots.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/12-action-menu-open.png`, fullPage: true });

        // Log what appeared
        const dropdownItems = page.locator('.dropdown-menu:visible a, .dropdown-menu:visible button, [role="menu"]:visible [role="menuitem"], .popover:visible a, .popover:visible button, [class*="menu"]:visible a');
        const ddCount = await dropdownItems.count();
        console.log(`  Dropdown/menu items: ${ddCount}`);
        for (let i = 0; i < Math.min(ddCount, 20); i++) {
          const text = (await dropdownItems.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
          const href = (await dropdownItems.nth(i).getAttribute('href')) || '';
          const cls = (await dropdownItems.nth(i).getAttribute('class')) || '';
          console.log(`  [menu${i}] "${text}" href="${href}" class="${cls.substring(0, 60)}"`);
        }

        // Also check for any newly visible elements
        const newVisible = await page.evaluate(() => {
          const results: string[] = [];
          // Check for any newly appeared overlay/popup
          const overlays = document.querySelectorAll('.cdk-overlay-container *, .modal:not(.fade), .popover, [class*="overlay"]:not(style), [class*="popup"]');
          overlays.forEach((el, i) => {
            const visible = (el as HTMLElement).offsetParent !== null;
            if (visible) {
              const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100) || '';
              if (text) results.push(`Overlay[${i}]: <${el.tagName}> class="${el.className?.toString().substring(0, 60)}" text="${text}"`);
            }
          });

          // Angular CDK overlays
          const cdkOverlay = document.querySelector('.cdk-overlay-container');
          if (cdkOverlay) {
            results.push(`CDK overlay container: ${cdkOverlay.children.length} children`);
            for (let i = 0; i < cdkOverlay.children.length; i++) {
              const child = cdkOverlay.children[i] as HTMLElement;
              if (child.offsetParent !== null || child.innerHTML.length > 10) {
                results.push(`  CDK child[${i}]: class="${child.className?.toString().substring(0, 60)}" html="${child.innerHTML.substring(0, 200)}"`);
              }
            }
          }

          return results;
        });

        for (const r of newVisible) {
          console.log(`  ${r}`);
        }
      }
    }
  } catch (e: any) {
    console.log(`  Error clicking dots: ${e.message?.substring(0, 100)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Try clicking the +N indicators ("+6", "+4", "+3")
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 5: Explore role indicators         ║');
  console.log('╚══════════════════════════════════════════╝');

  // The Part B screenshot shows "+6", "+4", "+3" next to some processing steps
  // These might indicate additional roles/steps
  const plusIndicators = page.locator('text=/^\\+\\d+$/');
  const plusCount = await plusIndicators.count();
  console.log(`  "+N" indicators: ${plusCount}`);
  for (let i = 0; i < Math.min(plusCount, 10); i++) {
    const text = (await plusIndicators.nth(i).textContent())?.trim();
    console.log(`    [${i}] "${text}"`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Try the file_id URL pattern directly for Part B processing
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 6: Direct Part B URL with file_id  ║');
  console.log('╚══════════════════════════════════════════╝');

  // From the inspector URL we know:
  // service_id: d51d6c78-5ead-c948-0b82-0d9bc71cd712
  // role: Documentary%20check
  // some_id: 84e53b18-12b2-11f1-899e-b6594fb67add
  // file_id: 8681df73-af32-45d6-8af1-30d5a7b0b6a1

  const fileId = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
  const serviceId = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';

  const partBUrls = [
    `/part-b/${fileId}`,
    `/part-b/${serviceId}/${fileId}`,
    `/part-b?file_id=${fileId}`,
    `/part-b/Documentary%20check/${fileId}`,
  ];

  for (const url of partBUrls) {
    try {
      await page.goto(url, { timeout: 10_000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      const body = (await page.locator('body').textContent().catch(() => ''))?.substring(0, 200);
      const is404 = body?.includes('404') || body?.includes('Not Found');
      console.log(`  ${url} → ${finalUrl} 404=${is404}`);

      if (!is404 && finalUrl !== 'https://jamaica.eregistrations.org/part-b') {
        console.log('  SUCCESS — this URL pattern works!');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/13-partb-file.png`, fullPage: true });

        // Map buttons
        const btns = page.locator('button:visible');
        const bc = await btns.count();
        console.log(`  Buttons: ${bc}`);
        for (let i = 0; i < Math.min(bc, 20); i++) {
          const text = (await btns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80);
          if (text) console.log(`    [btn${i}] "${text}"`);
        }
        break;
      }
    } catch {}
  }

  // ══════════════════════════════════════════════════════════
  // STEP 7: Full page DOM dump of Part B list item structure
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 7: Part B list item DOM structure   ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const itemDom = await page.evaluate(() => {
    const results: string[] = [];

    // Find the first list item that contains "TEST-SEZ"
    const allDivs = document.querySelectorAll('div');
    let foundItem: Element | null = null;

    for (const div of allDivs) {
      // Check if this div directly contains "TEST-SEZ" text and is a list item
      const text = div.textContent || '';
      if (text.includes('TEST-SEZ') && div.className?.toString().includes('list-item')) {
        foundItem = div;
        break;
      }
    }

    if (!foundItem) {
      // Try broader search - find any div with class containing "item" that has TEST-SEZ
      for (const div of allDivs) {
        const text = div.textContent || '';
        const cls = div.className?.toString() || '';
        if (text.includes('TEST-SEZ') && (cls.includes('item') || cls.includes('row')) && div.childElementCount > 2) {
          foundItem = div;
          break;
        }
      }
    }

    if (foundItem) {
      results.push(`Found item container: <${foundItem.tagName}> class="${foundItem.className?.toString().substring(0, 100)}"`);
      results.push(`Full outerHTML (1000 chars):`);
      results.push(foundItem.outerHTML.substring(0, 1000));

      // List all children recursively (2 levels)
      const walkChildren = (el: Element, depth: number) => {
        if (depth > 3) return;
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const indent = '  '.repeat(depth);
          const text = child.childElementCount === 0 ? child.textContent?.trim().substring(0, 40) || '' : '';
          const cls = child.className?.toString().substring(0, 60) || '';
          results.push(`${indent}[${i}] <${child.tagName}> class="${cls}" ${text ? `text="${text}"` : `children=${child.childElementCount}`}`);
          walkChildren(child, depth + 1);
        }
      };
      walkChildren(foundItem, 1);
    } else {
      results.push('Could not find list item container for TEST-SEZ');

      // Fallback: dump the page structure around TEST-SEZ text
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.includes('TEST-SEZ')) {
          let parent = node.parentElement;
          for (let i = 0; i < 8 && parent; i++) {
            results.push(`${'  '.repeat(i)}<${parent.tagName}> class="${parent.className?.toString().substring(0, 80)}" children=${parent.childElementCount}`);
            parent = parent.parentElement;
          }
          break;
        }
      }
    }

    return results;
  });

  for (const line of itemDom) {
    console.log(`  ${line}`);
  }

  // Final screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/14-final-partb.png`, fullPage: true });

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIC COMPLETE                     ║');
  console.log('╚══════════════════════════════════════════╝');
});
