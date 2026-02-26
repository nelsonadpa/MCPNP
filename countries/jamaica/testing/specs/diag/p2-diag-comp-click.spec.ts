import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');

test('Click into complementary info from dashboard', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/');
  await page.waitForTimeout(5000);

  // Expand "My applications" if collapsed
  const myApps = page.locator('h2:has-text("My applications"), h3:has-text("My applications")').first();
  if (await myApps.isVisible().catch(() => false)) {
    await myApps.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-click-01.png`, fullPage: true });

  // Find the "Action required" row and get all clickable elements in it
  console.log('\n══ Find clickable elements in Action required row ══');

  const rowInfo = await page.evaluate(() => {
    // Find all rows/cards in the applications list
    const rows = document.querySelectorAll('tr, [class*="list-item"], [class*="row"]');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('Action required') && text.includes('TEST-SEZ')) {
        // Get all clickable elements
        const links = row.querySelectorAll('a, button, [role="button"], [onclick]');
        const clickables = Array.from(links).map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 40),
          href: (el as HTMLAnchorElement).href || (el as HTMLAnchorElement).getAttribute('href') || '',
          class: (el as HTMLElement).className.substring(0, 60),
          onclick: el.getAttribute('onclick')?.substring(0, 60),
        }));

        // Also check for icons that might be links
        const icons = row.querySelectorAll('i, svg, [class*="icon"], [class*="fa-"]');
        const iconInfo = Array.from(icons).map(i => ({
          tag: i.tagName,
          class: (i as HTMLElement).className.substring(0, 40),
          parentTag: i.parentElement?.tagName,
          parentHref: (i.parentElement as HTMLAnchorElement)?.href || '',
        }));

        return { clickables, iconInfo, html: (row as HTMLElement).innerHTML.substring(0, 500) };
      }
    }
    return { error: 'Row not found' };
  });
  console.log('  Clickables:', JSON.stringify(rowInfo.clickables, null, 2));
  console.log('  Icons:', JSON.stringify(rowInfo.iconInfo, null, 2));
  console.log('  HTML:', rowInfo.html?.substring(0, 300));

  // Try clicking the edit/pen icon next to "Action required"
  console.log('\n══ Click edit icon ══');

  // The edit icon is likely an <a> with a pen/edit icon class
  const editLinks = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr, [class*="list-item"], [class*="application"]');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('Action required') && text.includes('TEST-SEZ')) {
        const allAnchors = row.querySelectorAll('a[href]');
        return Array.from(allAnchors).map(a => ({
          href: (a as HTMLAnchorElement).href,
          text: a.textContent?.trim().substring(0, 40),
          children: a.innerHTML.substring(0, 60),
        }));
      }
    }
    return [];
  });
  console.log('  All anchors in row:', JSON.stringify(editLinks, null, 2));

  // Click the first link that has a href (probably the edit icon)
  if (editLinks.length > 0) {
    for (const link of editLinks) {
      if (link.href && !link.href.endsWith('/') && link.href !== 'https://jamaica.eregistrations.org/') {
        console.log(`  Navigating to: ${link.href}`);
        await page.goto(link.href);
        await page.waitForTimeout(5000);
        console.log(`  URL: ${page.url()}`);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-click-02-edit.png`, fullPage: true });

        // Check what loaded
        const content = await page.evaluate(() => {
          const tabs = document.querySelectorAll('.nav-link');
          const buttons = document.querySelectorAll('button');
          const headings = document.querySelectorAll('h1,h2,h3,h4');
          return {
            tabs: Array.from(tabs).filter(t => (t as HTMLElement).offsetParent !== null).map(t => t.textContent?.trim()),
            buttons: Array.from(buttons).filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim()).map(b => b.textContent?.trim().substring(0, 60)).filter(t => !['NPNELSON PEREZ', 'en'].includes(t!)),
            headings: Array.from(headings).filter(h => (h as HTMLElement).offsetParent !== null).map(h => h.textContent?.trim().substring(0, 60)),
          };
        });
        console.log('  Tabs:', JSON.stringify(content.tabs));
        console.log('  Buttons:', JSON.stringify(content.buttons));
        console.log('  Headings:', JSON.stringify(content.headings));
        break;
      }
    }
  }

  // If no link found, try clicking the row text itself
  if (editLinks.length === 0 || editLinks.every(l => !l.href || l.href.endsWith('/'))) {
    console.log('\n  No link found — trying to click the row text...');
    const actionBadge = page.locator('text="Action required"').first();
    // Try clicking the parent row
    const row = page.locator('tr, [class*="list-item"]').filter({ hasText: 'Action required' }).filter({ hasText: 'TEST-SEZ' }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(5000);
      console.log(`  URL after row click: ${page.url()}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-click-03-row.png`, fullPage: true });
    }
  }

  console.log('\n══ DONE ══');
});
