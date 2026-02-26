import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Officer UI Discovery (v2)
 *
 * Navigate to /inspector/, discover the DOM structure of application items,
 * click into the submitted app, and map the officer processing UI.
 *
 * Run:
 *   npx playwright test specs/p2-diag-officer-ui.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Officer UI discovery v2', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to /inspector/ and map DOM structure
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 1: Inspector DOM structure          ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/inspector/');
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-inspector-list.png`, fullPage: true });

  // Discover the actual DOM structure of the application list
  const listStructure = await page.evaluate(() => {
    const results: string[] = [];

    // Look for the main content area — skip nav
    const mainContent = document.querySelector('main, .content, [class*="content"], [role="main"]') || document.body;
    results.push(`Main container: <${mainContent.tagName}> class="${mainContent.className?.toString().substring(0, 80)}"`);

    // Look for any repeated structures (cards, rows, list items)
    const repeatingPatterns = [
      '.card', '.list-group-item', '.row', '.item', '.file-item',
      '.application', '[class*="file"]', '[class*="application"]',
      '[class*="record"]', '[class*="entry"]', '[class*="item"]',
      'article', '.media', '.panel', '.tile',
    ];

    for (const pattern of repeatingPatterns) {
      const items = document.querySelectorAll(pattern);
      if (items.length > 2) {
        results.push(`\nPattern "${pattern}": ${items.length} items`);
        // Show first item's structure
        const first = items[0] as HTMLElement;
        results.push(`  First item outer HTML (200 chars): ${first.outerHTML.substring(0, 200)}`);
        results.push(`  First item text: "${first.textContent?.trim().replace(/\s+/g, ' ').substring(0, 150)}"`);

        // Show links inside
        const innerLinks = first.querySelectorAll('a');
        innerLinks.forEach((a, i) => {
          results.push(`  Link[${i}]: "${a.textContent?.trim().substring(0, 60)}" href="${(a as HTMLAnchorElement).href}"`);
        });

        // Show buttons inside
        const innerBtns = first.querySelectorAll('button');
        innerBtns.forEach((b, i) => {
          results.push(`  Btn[${i}]: "${b.textContent?.trim().substring(0, 60)}"`);
        });
      }
    }

    // Also scan direct children of main content for repeated divs
    const children = mainContent.children;
    results.push(`\nDirect children of main content: ${children.length}`);
    for (let i = 0; i < Math.min(children.length as number, 10); i++) {
      const child = children[i] as HTMLElement;
      results.push(`  Child[${i}]: <${child.tagName}> class="${child.className?.toString().substring(0, 80)}" text="${child.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100)}"`);
    }

    // Look for text "File pending" and trace up to find the clickable container
    const pendingEls = document.querySelectorAll('*');
    let foundContainer = false;
    pendingEls.forEach(el => {
      if (foundContainer) return;
      const text = el.textContent?.trim() || '';
      if (el.childElementCount === 0 && text === 'File pending') {
        results.push(`\n"File pending" leaf element:`);
        let node: Element | null = el;
        for (let depth = 0; depth < 8 && node; depth++) {
          const visible = (node as HTMLElement).offsetParent !== null;
          results.push(`  [${'  '.repeat(depth)}] <${node.tagName}> class="${node.className?.toString().substring(0, 60)}" id="${node.id}" visible=${visible}`);
          const links = node.querySelectorAll(':scope > a');
          if (links.length > 0) {
            links.forEach((a, li) => {
              results.push(`    Link: "${a.textContent?.trim().substring(0, 60)}" href="${(a as HTMLAnchorElement).href}"`);
            });
          }
          node = node.parentElement;
        }
        foundContainer = true;
      }
    });

    // Specifically look for text containing "TEST-SEZ" or "Establish"
    const allText = document.body.innerText;
    const testSezIdx = allText.indexOf('TEST-SEZ');
    if (testSezIdx !== -1) {
      results.push(`\n"TEST-SEZ" found at character ${testSezIdx}`);
      results.push(`  Context: "...${allText.substring(Math.max(0, testSezIdx - 50), testSezIdx + 100)}..."`);
    } else {
      results.push(`\n"TEST-SEZ" NOT found in page text`);
    }

    return results;
  });

  for (const line of listStructure) {
    console.log(`  ${line}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Specifically map the application list items
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 2: Map application list items      ║');
  console.log('╚══════════════════════════════════════════╝');

  // From the previous diagnostic we know there's pagination (7 pages)
  // and "File pending" x8 and "Establish a new zone" x8 matches
  // The list items are likely divs or some non-table structure

  // Let's find all elements that contain "File pending" and are visible
  const appItems = await page.evaluate(() => {
    const results: string[] = [];

    // Find all elements containing "Establish a new zone"
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: (node) => node.textContent?.includes('Establish') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );

    const textNodes: Node[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    results.push(`Text nodes containing "Establish": ${textNodes.length}`);

    // For the first few, trace up to find the application item container
    for (let i = 0; i < Math.min(textNodes.length, 3); i++) {
      const textNode = textNodes[i];
      let parent: Element | null = textNode.parentElement;
      results.push(`\n  TextNode[${i}]: "${textNode.textContent?.trim().substring(0, 80)}"`);

      // Walk up to find a meaningful container
      while (parent && parent !== document.body) {
        const tag = parent.tagName;
        const cls = parent.className?.toString() || '';
        const id = parent.id || '';
        const children = parent.childElementCount;
        const hasLink = parent.querySelector('a') !== null;
        const style = getComputedStyle(parent);
        const display = style.display;

        results.push(`    <${tag}> class="${cls.substring(0, 80)}" id="${id}" children=${children} hasLink=${hasLink} display="${display}"`);

        // If this container has a sibling with similar structure, it's likely the item
        if (parent.parentElement) {
          const siblings = parent.parentElement.children;
          let sameClassCount = 0;
          for (let j = 0; j < siblings.length; j++) {
            if (siblings[j].className === parent.className) sameClassCount++;
          }
          if (sameClassCount > 2) {
            results.push(`    ^^^ LIKELY ITEM CONTAINER (${sameClassCount} siblings with same class) ^^^`);
            // Get the full HTML of this item (truncated)
            results.push(`    outerHTML: ${parent.outerHTML.substring(0, 300)}`);

            // Get all clickable elements inside
            const clickables = parent.querySelectorAll('a, button, [onclick], [role="button"]');
            clickables.forEach((c, ci) => {
              results.push(`    Clickable[${ci}]: <${c.tagName}> text="${c.textContent?.trim().substring(0, 60)}" href="${(c as HTMLAnchorElement).href || ''}" class="${c.className?.toString().substring(0, 40)}"`);
            });

            break;
          }
        }

        parent = parent.parentElement;
      }
    }

    return results;
  });

  for (const line of appItems) {
    console.log(`  ${line}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Try to click into the application
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 3: Click into application          ║');
  console.log('╚══════════════════════════════════════════╝');

  let clicked = false;

  // Strategy 1: Look for any <a> inside an element containing "File pending"
  try {
    // First try the text "File pending" that's also a link
    const pendingLinks = page.locator('a:visible').filter({ hasText: /pending/i });
    const pCount = await pendingLinks.count();
    console.log(`  Links containing "pending": ${pCount}`);
    if (pCount > 0) {
      for (let i = 0; i < Math.min(pCount, 3); i++) {
        const text = (await pendingLinks.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80);
        const href = await pendingLinks.nth(i).getAttribute('href');
        console.log(`    [${i}] "${text}" → ${href}`);
      }
    }
  } catch {}

  // Strategy 2: Click on the Establish text itself
  try {
    const establishEl = page.locator('text="Establish a new zone"').first();
    if (await establishEl.isVisible({ timeout: 3000 })) {
      // Check if it or a parent is clickable
      const isLink = await establishEl.evaluate((e: Element) => {
        let el: Element | null = e;
        while (el && el !== document.body) {
          if (el.tagName === 'A') return (el as HTMLAnchorElement).href;
          if (el.tagName === 'BUTTON') return 'button';
          if (el.getAttribute('onclick')) return 'onclick';
          if (el.getAttribute('role') === 'button') return 'role-button';
          el = el.parentElement;
        }
        return null;
      });
      console.log(`  "Establish a new zone" clickable ancestor: ${isLink}`);

      if (isLink) {
        console.log('  Clicking "Establish a new zone"...');
        await establishEl.click();
        await page.waitForTimeout(5000);
        console.log(`  After click → URL: ${page.url()}`);
        clicked = true;
      }
    }
  } catch {}

  // Strategy 3: Use the DOM to find all links on the page and look for one with a file_id
  if (!clicked) {
    const allLinks = await page.evaluate(() => {
      const links: string[] = [];
      document.querySelectorAll('a').forEach(a => {
        const href = a.href;
        const text = a.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const visible = (a as HTMLElement).offsetParent !== null;
        if (href && (href.includes('/file') || href.includes('/view') || href.includes('/application') || href.includes('/inspector/'))) {
          links.push(`[${visible ? 'V' : 'H'}] "${text}" → ${href}`);
        }
      });
      return links;
    });
    console.log(`  Links with file/view/application/inspector paths: ${allLinks.length}`);
    for (const link of allLinks.slice(0, 15)) {
      console.log(`    ${link}`);
    }
  }

  // Strategy 4: Click on a card/panel that contains application info
  if (!clicked) {
    try {
      // Try clicking any visible element with "Establish a new zone" text
      const container = page.locator(':visible:has(> :text("Establish a new zone"))').first();
      if (await container.isVisible({ timeout: 3000 })) {
        console.log('  Strategy 4: Clicking container with "Establish a new zone"');
        await container.click();
        await page.waitForTimeout(5000);
        console.log(`  After click → URL: ${page.url()}`);
        if (page.url() !== 'https://jamaica.eregistrations.org/inspector/' && page.url() !== 'https://jamaica.eregistrations.org/inspector') {
          clicked = true;
        }
      }
    } catch {}
  }

  // Strategy 5: Look for the actual rendered markup structure
  if (!clicked) {
    console.log('\n  Strategy 5: Detailed element scan around "File pending"');
    const detailedScan = await page.evaluate(() => {
      const results: string[] = [];
      // Get ALL visible text that is near "File pending" — check sibling/cousin elements
      const allEls = document.querySelectorAll('*');
      let foundIdx = -1;

      allEls.forEach((el, idx) => {
        if (foundIdx >= 0) return;
        if (el.childElementCount === 0 && el.textContent?.trim() === 'File pending') {
          foundIdx = idx;
        }
      });

      if (foundIdx >= 0) {
        // Get the surrounding context (nearby elements)
        const pending = allEls[foundIdx];
        // Go up 4 levels
        let container = pending;
        for (let i = 0; i < 4; i++) {
          if (container.parentElement) container = container.parentElement;
        }
        // Dump the container's HTML
        results.push(`Container (4 levels up):`);
        results.push(`  tag: <${container.tagName}>`);
        results.push(`  class: ${container.className?.toString().substring(0, 100)}`);
        results.push(`  outerHTML (500 chars): ${container.outerHTML.substring(0, 500)}`);

        // Also go 6 levels up
        let bigContainer = pending;
        for (let i = 0; i < 6; i++) {
          if (bigContainer.parentElement) bigContainer = bigContainer.parentElement;
        }
        results.push(`\nBigger container (6 levels up):`);
        results.push(`  tag: <${bigContainer.tagName}>`);
        results.push(`  class: ${bigContainer.className?.toString().substring(0, 100)}`);
        results.push(`  children count: ${bigContainer.childElementCount}`);
        // List the children with classes
        for (let i = 0; i < Math.min(bigContainer.childElementCount, 5); i++) {
          const child = bigContainer.children[i] as HTMLElement;
          results.push(`  child[${i}]: <${child.tagName}> class="${child.className?.toString().substring(0, 80)}" text="${child.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80)}"`);
        }
      } else {
        results.push('No leaf "File pending" element found');
      }

      return results;
    });

    for (const line of detailedScan) {
      console.log(`    ${line}`);
    }
  }

  // Strategy 6: Just navigate all visible links and check which ones lead to individual apps
  if (!clicked) {
    console.log('\n  Strategy 6: Navigate all visible links');
    const allVisibleLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => (a as HTMLElement).offsetParent !== null)
        .map(a => ({
          text: a.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '',
          href: a.href,
        }))
        .filter(l => l.href && l.href !== '#' && !l.href.includes('javascript:'));
    });

    console.log(`  Total navigable links: ${allVisibleLinks.length}`);
    for (const link of allVisibleLinks) {
      console.log(`    "${link.text}" → ${link.href}`);
    }

    // Try clicking on "File pending" text directly
    try {
      console.log('\n  Trying to click "File pending" text directly...');
      const filePending = page.locator('text="File pending"').first();
      if (await filePending.isVisible({ timeout: 3000 })) {
        await filePending.click();
        await page.waitForTimeout(5000);
        const newUrl = page.url();
        console.log(`  After clicking "File pending" → URL: ${newUrl}`);
        if (newUrl !== 'https://jamaica.eregistrations.org/inspector/' && newUrl !== 'https://jamaica.eregistrations.org/inspector') {
          clicked = true;
        }
      }
    } catch {}
  }

  if (!clicked) {
    // Last resort: try clicking the first pagination page to see all entries
    console.log('\n  Last resort: Trying page number "13" link');
    try {
      const numLink = page.locator('a:has-text("13")');
      if (await numLink.isVisible({ timeout: 3000 })) {
        const href = await numLink.getAttribute('href');
        console.log(`    Found "13" link → ${href}`);
        // This might be a file_id link, not a pagination link
        await numLink.click();
        await page.waitForTimeout(5000);
        console.log(`    After click → URL: ${page.url()}`);
        clicked = page.url() !== 'https://jamaica.eregistrations.org/inspector/';
      }
    } catch {}
  }

  if (clicked) {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-application-detail.png`, fullPage: true });
    console.log(`\n  NAVIGATED TO APPLICATION. URL: ${page.url()}`);

    // Now map the entire UI
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  APPLICATION DETAIL UI                   ║');
    console.log('╚══════════════════════════════════════════╝');

    // All visible links
    const links = page.locator('a:visible');
    const linkCount = await links.count();
    console.log(`\n  Links: ${linkCount}`);
    for (let i = 0; i < Math.min(linkCount, 40); i++) {
      const text = (await links.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const href = (await links.nth(i).getAttribute('href')) || '';
      if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
    }

    // All visible buttons
    const buttons = page.locator('button:visible');
    const btnCount = await buttons.count();
    console.log(`\n  Buttons: ${btnCount}`);
    for (let i = 0; i < Math.min(btnCount, 30); i++) {
      const text = (await buttons.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const cls = (await buttons.nth(i).getAttribute('class')) || '';
      if (text) console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 60)}"`);
    }

    // All visible selects
    const selects = page.locator('select:visible');
    const selCount = await selects.count();
    console.log(`\n  Selects: ${selCount}`);
    for (let i = 0; i < Math.min(selCount, 10); i++) {
      const name = (await selects.nth(i).getAttribute('name')) || '';
      const options = await selects.nth(i).locator('option').allTextContents();
      console.log(`  [sel${i}] name="${name}" options=[${options.map(o => o.trim()).join(', ')}]`);
    }

    // Tabs
    const tabs = page.locator('[role="tab"]:visible, .nav-tabs .nav-link:visible, .nav-pills .nav-link:visible');
    const tabCount = await tabs.count();
    console.log(`\n  Tabs: ${tabCount}`);
    for (let i = 0; i < Math.min(tabCount, 15); i++) {
      const text = (await tabs.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      console.log(`  [tab${i}] "${text}"`);
    }

    // Badges/status
    const badges = page.locator('.badge:visible, [class*="badge"]:visible');
    const badgeCount = await badges.count();
    console.log(`\n  Badges: ${badgeCount}`);
    for (let i = 0; i < Math.min(badgeCount, 10); i++) {
      const text = (await badges.nth(i).textContent())?.trim().substring(0, 40) || '';
      if (text) console.log(`  [badge${i}] "${text}"`);
    }

    // Formio
    const formioData = await page.evaluate(() => {
      const forms = (window as any).Formio?.forms;
      if (!forms) return null;
      const keys = Object.keys(forms);
      return keys.map(k => {
        const data = forms[k]?.submission?.data || {};
        return { key: k, dataKeys: Object.keys(data).slice(0, 30) };
      });
    });
    if (formioData) {
      console.log(`\n  Formio forms: ${formioData.length}`);
      for (const f of formioData) {
        console.log(`  Form ${f.key}: keys=[${f.dataKeys.join(', ')}]`);
      }
    }
  } else {
    console.log('\n  COULD NOT NAVIGATE TO APPLICATION DETAIL');
    console.log('  The inspector list uses a non-standard layout.');
    console.log('  Need to inspect the page manually or try Part B URL directly.');
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Try Part B URL directly
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 4: Try Part B URL directly         ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/part-b/');
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-part-b-direct.png`, fullPage: true });

  // Map Part B UI
  const partBLinks = page.locator('a:visible');
  const partBLinkCount = await partBLinks.count();
  console.log(`\n  Links: ${partBLinkCount}`);
  for (let i = 0; i < Math.min(partBLinkCount, 30); i++) {
    const text = (await partBLinks.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const href = (await partBLinks.nth(i).getAttribute('href')) || '';
    if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
  }

  const partBButtons = page.locator('button:visible');
  const partBBtnCount = await partBButtons.count();
  console.log(`\n  Buttons: ${partBBtnCount}`);
  for (let i = 0; i < Math.min(partBBtnCount, 20); i++) {
    const text = (await partBButtons.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    if (text) console.log(`  [btn${i}] "${text}"`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Explore /inspector/ with direct file_id URL patterns
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 5: Inspector URL patterns          ║');
  console.log('╚══════════════════════════════════════════╝');

  // eRegistrations usually uses /inspector/<file_id> or /view/<file_id>
  // We need to discover the URL pattern. Check the page source for JS routes
  const routeInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Check for Next.js or React Router
    const nextData = (window as any).__NEXT_DATA__;
    if (nextData) results.push(`Next.js data: ${JSON.stringify(nextData.page)}`);

    // Check for Angular
    const ngVersion = document.querySelector('[ng-version]');
    if (ngVersion) results.push(`Angular: v${ngVersion.getAttribute('ng-version')}`);

    // Check for Vue
    if ((window as any).__vue_app__) results.push('Vue.js detected');

    // Check window location hash
    results.push(`Hash: ${window.location.hash}`);

    // Check for any global config
    const config = (window as any).eRegistrations || (window as any).APP_CONFIG || (window as any).config;
    if (config) results.push(`App config: ${JSON.stringify(config).substring(0, 200)}`);

    // Check script tags for routing info
    document.querySelectorAll('script').forEach((s, i) => {
      const src = s.src;
      if (src && (src.includes('app') || src.includes('main') || src.includes('bundle'))) {
        results.push(`Script: ${src}`);
      }
    });

    return results;
  });

  for (const info of routeInfo) {
    console.log(`  ${info}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Check the dashboard "My applications" for file_id in links
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 6: Dashboard My Applications       ║');
  console.log('╚══════════════════════════════════════════╝');

  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Find all links on the dashboard
  const dashLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => a.href && !a.href.endsWith('#') && !a.href.includes('javascript:'))
      .map(a => ({
        text: a.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80) || '',
        href: a.href,
        visible: (a as HTMLElement).offsetParent !== null,
      }))
      .filter(l => l.visible);
  });

  console.log(`  Dashboard visible links: ${dashLinks.length}`);
  for (const link of dashLinks) {
    console.log(`    "${link.text}" → ${link.href}`);
  }

  // Look for links with numeric IDs or file IDs
  const fileIdLinks = dashLinks.filter(l =>
    l.href.match(/\/\d+/) || l.href.includes('file_id') || l.href.includes('/view/') ||
    l.href.includes('/application/') || l.href.includes('/part-a/')
  );

  if (fileIdLinks.length > 0) {
    console.log(`\n  Links with IDs/file paths: ${fileIdLinks.length}`);
    for (const link of fileIdLinks) {
      console.log(`    "${link.text}" → ${link.href}`);
    }

    // Try clicking the first one that looks like a submitted application
    const pendingLink = fileIdLinks.find(l => l.text.includes('Pending') || l.text.includes('pending') || l.text.includes('TEST-SEZ'));
    if (pendingLink) {
      console.log(`\n  Navigating to submitted app: "${pendingLink.text}" → ${pendingLink.href}`);
      await page.goto(pendingLink.href);
      await page.waitForTimeout(5000);
      console.log(`  URL: ${page.url()}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-submitted-app-from-dashboard.png`, fullPage: true });

      // Map UI
      const allBtns = page.locator('button:visible');
      const allBtnCount = await allBtns.count();
      console.log(`\n  Buttons: ${allBtnCount}`);
      for (let i = 0; i < Math.min(allBtnCount, 20); i++) {
        const text = (await allBtns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
        if (text) console.log(`  [btn${i}] "${text}"`);
      }
    }
  }

  // Final screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-final.png`, fullPage: true });

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIC COMPLETE                     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Final URL: ${page.url()}`);
  console.log('  Screenshots saved to: screenshots/p2/');
});
