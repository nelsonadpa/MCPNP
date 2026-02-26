import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Find & click carousel arrows v2', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Find the bullet element and then look at its surroundings
  const arrowInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Find the bullet span
    const bullet = document.querySelector('.carousel-selected-index.bullet');
    if (!bullet) {
      results.push('No .bullet element found');
      return results;
    }

    const bulletRect = bullet.getBoundingClientRect();
    results.push(`Bullet at (${Math.round(bulletRect.x)}, ${Math.round(bulletRect.y)})`);

    // Get the parent container that has the arrows
    let container = bullet.parentElement;
    for (let i = 0; i < 5 && container; i++) {
      results.push(`Level ${i}: <${container.tagName}> class="${container.className?.toString().substring(0, 80)}" children=${container.childElementCount}`);

      // List ALL children at this level
      for (let j = 0; j < container.children.length; j++) {
        const child = container.children[j] as HTMLElement;
        const rect = child.getBoundingClientRect();
        const visible = child.offsetParent !== null;
        const tag = child.tagName.toLowerCase();
        const cls = child.className?.toString().substring(0, 50) || '';
        const text = child.textContent?.trim().substring(0, 30) || '';

        results.push(`  [${j}] <${tag}> class="${cls}" text="${text}" visible=${visible} at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)}`);

        // Check for click listeners (Angular event bindings show up as __zone_symbol__)
        const keys = Object.keys(child);
        const hasListeners = keys.some(k => k.includes('click') || k.includes('zone'));
        if (hasListeners) {
          results.push(`    Has event listeners!`);
        }
      }

      container = container.parentElement;
    }

    // Also look for ALL visible elements near the bullet (same y, within 500px x range)
    results.push('\n=== All visible elements near bullet row ===');
    const allEls = document.querySelectorAll('*');
    allEls.forEach(el => {
      const visible = (el as HTMLElement).offsetParent !== null;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      // Same row as bullet (within 20px vertically)
      if (Math.abs(rect.y - bulletRect.y) < 30 && rect.height > 5) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className?.toString().substring(0, 50) || '';
        const text = el.textContent?.trim().substring(0, 40) || '';
        const children = el.childElementCount;
        if (children === 0 || rect.width < 60) { // Only leaf elements or small containers
          results.push(`  <${tag}> at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)} text="${text}" class="${cls}"`);
        }
      }
    });

    return results;
  });

  for (const line of arrowInfo) {
    console.log(`  ${line}`);
  }

  // Now try clicking using various strategies
  console.log('\n══ Click strategies ══');

  // Strategy 1: Click the element to the right of the document title
  try {
    const nextEl = await page.evaluate(() => {
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      if (!bullet) return null;

      // Walk up to find the navigation container
      let nav = bullet.parentElement;
      while (nav && nav !== document.body) {
        // Check if this container has arrow-like children
        for (let i = 0; i < nav.children.length; i++) {
          const child = nav.children[i] as HTMLElement;
          const rect = child.getBoundingClientRect();
          const bulletRect = bullet.getBoundingClientRect();
          // Arrow to the right of the title
          if (rect.x > bulletRect.x + 200 && Math.abs(rect.y - bulletRect.y) < 20 && rect.width > 10 && rect.width < 60) {
            return {
              tag: child.tagName,
              class: child.className?.toString().substring(0, 60),
              x: Math.round(rect.x + rect.width / 2),
              y: Math.round(rect.y + rect.height / 2),
              text: child.textContent?.trim().substring(0, 10),
            };
          }
        }
        nav = nav.parentElement;
      }
      return null;
    });

    if (nextEl) {
      console.log(`  Found next arrow: <${nextEl.tag}> class="${nextEl.class}" text="${nextEl.text}" at (${nextEl.x}, ${nextEl.y})`);
      console.log(`  Clicking at (${nextEl.x}, ${nextEl.y})...`);
      await page.mouse.click(nextEl.x, nextEl.y);
      await page.waitForTimeout(3000);

      // Check if document changed
      const newBullet = await page.evaluate(() => {
        const b = document.querySelector('.carousel-selected-index.bullet');
        return b?.textContent?.trim();
      });
      console.log(`  After click → bullet text: "${newBullet}"`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/62-after-arrow-click.png` });
    } else {
      console.log('  No arrow element found');
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 2: Click by coordinates (from screenshot, > arrow is at ~541, 369)
  // The viewport is 1440x900 based on playwright config
  console.log('\n  Strategy 2: Click by approximate coordinates...');
  try {
    // Find the bullet position first, then click to the right of the title
    const bulletPos = await page.evaluate(() => {
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      if (!bullet) return null;
      const rect = bullet.getBoundingClientRect();
      return { x: rect.x, y: rect.y + rect.height / 2 };
    });

    if (bulletPos) {
      // The ">" arrow should be after the document title text
      // From the screenshot, the title is about 350px wide, so the > is at about bullet.x + 400
      const arrowX = bulletPos.x + 400;
      const arrowY = bulletPos.y;
      console.log(`  Clicking at (${Math.round(arrowX)}, ${Math.round(arrowY)})...`);
      await page.mouse.click(arrowX, arrowY);
      await page.waitForTimeout(3000);

      const newBullet2 = await page.evaluate(() => {
        const b = document.querySelector('.carousel-selected-index.bullet');
        return b?.textContent?.trim();
      });
      console.log(`  After click → bullet: "${newBullet2}"`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/63-coord-click.png` });
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  console.log('\n══ DONE ══');
});
