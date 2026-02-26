import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Find carousel arrows', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Open first document
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Screenshot for reference
  await page.screenshot({ path: `${SCREENSHOT_DIR}/60-carousel-arrows.png` });

  // TARGETED SCAN: Find all small visible elements near the document title
  // The arrows are at y ~ 290 (near the document title bar) based on the screenshot
  const arrowScan = await page.evaluate(() => {
    const results: string[] = [];

    // Strategy 1: Find ALL visible leaf elements and filter by likely arrow content/size
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.childElementCount > 0) return; // Only leaf elements
      const visible = (el as HTMLElement).offsetParent !== null;
      if (!visible) return;

      const rect = el.getBoundingClientRect();
      const text = el.textContent?.trim() || '';
      const width = rect.width;
      const height = rect.height;

      // Small clickable elements that might be arrows
      if (width > 15 && width < 60 && height > 15 && height < 60) {
        const tag = el.tagName;
        const cls = el.className?.toString().substring(0, 60) || '';
        const parentTag = el.parentElement?.tagName || '';
        const parentCls = el.parentElement?.className?.toString().substring(0, 60) || '';

        // Check if near the document title (y between 250-350 based on viewport)
        if (rect.y > 200 && rect.y < 400) {
          results.push(`Small el at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(width)}x${Math.round(height)}: <${tag}> text="${text}" class="${cls}" parent=<${parentTag}> class="${parentCls}"`);
        }
      }
    });

    // Strategy 2: Find all elements in the navigation bar area of the carousel
    // Look for elements between the "Documents" tab and the "Is document valid?" text
    const docTab = document.querySelector('a.nav-link.active');
    const validText = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent?.includes('Is document valid') && el.childElementCount < 3
    );

    if (docTab && validText) {
      const tabRect = docTab.getBoundingClientRect();
      const validRect = validText.getBoundingClientRect();
      const minY = tabRect.bottom;
      const maxY = validRect.top;

      results.push(`\nBetween "Documents" tab (y=${Math.round(tabRect.bottom)}) and "Is valid?" (y=${Math.round(validRect.top)}):`);

      allElements.forEach(el => {
        const visible = (el as HTMLElement).offsetParent !== null;
        if (!visible) return;
        const rect = el.getBoundingClientRect();
        if (rect.y >= minY && rect.y <= maxY && rect.height > 10) {
          const tag = el.tagName;
          const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 40) || '';
          const cls = el.className?.toString().substring(0, 50) || '';
          const hasClick = el.hasAttribute('onclick') || el.hasAttribute('ng-click') || (el as any).__zone_symbol__clickfalse !== undefined;
          results.push(`  <${tag}> at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)} text="${text}" class="${cls}" children=${el.childElementCount}`);
        }
      });
    }

    // Strategy 3: Look for Angular components with nav-like names
    allElements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (tag.startsWith('app-') || tag.startsWith('ng-') || tag.startsWith('mat-')) {
        const visible = (el as HTMLElement).offsetParent !== null;
        if (visible) {
          const rect = el.getBoundingClientRect();
          if (rect.y > 200 && rect.y < 400) {
            results.push(`\nAngular: <${tag}> at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)} class="${el.className?.toString().substring(0, 50)}"`);
          }
        }
      }
    });

    // Strategy 4: Direct DOM walk from the "Is document valid" area
    results.push(`\n=== Looking for arrow siblings near "Upload your concept master plan" ===`);
    const titleEl = Array.from(document.querySelectorAll('*')).find(
      el => el.childElementCount === 0 && el.textContent?.includes('Upload your concept master plan')
    );
    if (titleEl) {
      // Walk siblings and parent siblings
      const parent = titleEl.parentElement;
      if (parent) {
        results.push(`Title parent: <${parent.tagName}> class="${parent.className?.toString().substring(0, 60)}" children=${parent.childElementCount}`);
        for (let i = 0; i < parent.children.length; i++) {
          const sib = parent.children[i] as HTMLElement;
          const rect = sib.getBoundingClientRect();
          results.push(`  Sibling[${i}]: <${sib.tagName}> class="${sib.className?.toString().substring(0, 50)}" text="${sib.textContent?.trim().substring(0, 30)}" at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }

        // Also check grandparent
        const grandparent = parent.parentElement;
        if (grandparent) {
          results.push(`\nGrandparent: <${grandparent.tagName}> class="${grandparent.className?.toString().substring(0, 60)}" children=${grandparent.childElementCount}`);
          for (let i = 0; i < grandparent.children.length; i++) {
            const sib = grandparent.children[i] as HTMLElement;
            const rect = sib.getBoundingClientRect();
            results.push(`  Sibling[${i}]: <${sib.tagName}> class="${sib.className?.toString().substring(0, 50)}" text="${sib.textContent?.trim().substring(0, 30)}" at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)} children=${sib.childElementCount}`);
          }
        }
      }
    }

    return results;
  });

  for (const line of arrowScan) {
    console.log(`  ${line}`);
  }

  // Try clicking ">" using getByText
  console.log('\n══ Trying to click ">" ══');
  try {
    const rightArrow = page.getByText('>', { exact: true }).first();
    if (await rightArrow.isVisible({ timeout: 2000 })) {
      console.log('  Found ">" — clicking...');
      await rightArrow.click();
      await page.waitForTimeout(3000);
      console.log(`  After click — checking current doc title...`);
      const newTitle = await page.evaluate(() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
          if (el.childElementCount === 0 && (el as HTMLElement).offsetParent !== null) {
            const text = el.textContent?.trim() || '';
            if (text.includes('Upload your') || text.includes('master plan') || text.includes('Articles') || text.includes('Business')) {
              return text;
            }
          }
        }
        return 'unknown';
      });
      console.log(`  Current doc: "${newTitle}"`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/61-after-arrow.png` });
    } else {
      console.log('  ">" not visible via getByText');
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  console.log('\n══ DONE ══');
});
