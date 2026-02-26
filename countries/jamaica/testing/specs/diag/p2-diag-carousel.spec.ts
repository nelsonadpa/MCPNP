import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Quick diagnostic: Map the document carousel navigation buttons
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Carousel navigation', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate to processing view
  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Open first document
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  console.log('\n══ CAROUSEL DOM STRUCTURE ══');

  // Map the document carousel controls
  const carouselDom = await page.evaluate(() => {
    const results: string[] = [];

    // Find all visible buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      const visible = btn.offsetParent !== null;
      if (visible) {
        const text = btn.textContent?.trim().replace(/\s+/g, ' ').substring(0, 40) || '';
        const cls = btn.className?.substring(0, 60) || '';
        const disabled = btn.disabled;
        const tag = btn.tagName;
        const ariaLabel = btn.getAttribute('aria-label') || '';
        results.push(`[V] btn[${i}] text="${text}" class="${cls}" disabled=${disabled} aria="${ariaLabel}"`);
      }
    });

    // Find any element with arrow characters
    const arrowChars = ['>', '<', '«', '»', '›', '‹', '→', '←', '▶', '◀'];
    document.querySelectorAll('*').forEach(el => {
      if (el.childElementCount === 0) {
        const text = el.textContent?.trim() || '';
        if (arrowChars.includes(text) && (el as HTMLElement).offsetParent !== null) {
          const parent = el.parentElement;
          const parentCls = parent?.className?.toString().substring(0, 60) || '';
          const parentTag = parent?.tagName || '';
          results.push(`Arrow: <${el.tagName}> text="${text}" parent=<${parentTag}> class="${parentCls}" parentDisabled=${(parent as HTMLButtonElement)?.disabled}`);
        }
      }
    });

    // Find carousel container
    const carousel = document.querySelector('[class*="carousel"], [class*="navigation"], [class*="pagination"]');
    if (carousel) {
      results.push(`\nCarousel container: <${carousel.tagName}> class="${carousel.className?.toString().substring(0, 80)}"`);
      // Dump children
      for (let i = 0; i < carousel.children.length; i++) {
        const child = carousel.children[i] as HTMLElement;
        results.push(`  [${i}] <${child.tagName}> class="${child.className?.toString().substring(0, 60)}" text="${child.textContent?.trim().substring(0, 40)}"`);
      }
    }

    // Find the "Is document valid?" section
    const validQuestion = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent?.includes('Is document valid') && el.childElementCount < 5
    );
    if (validQuestion) {
      results.push(`\n"Is document valid?" container: <${validQuestion.tagName}> class="${validQuestion.className?.toString().substring(0, 60)}"`);
      validQuestion.querySelectorAll('button, input, label, a').forEach((el, i) => {
        results.push(`  [${i}] <${el.tagName}> text="${el.textContent?.trim().substring(0, 20)}" class="${el.className?.toString().substring(0, 40)}" type="${el.getAttribute('type') || ''}"`);
      });
    }

    // Find the document-carousel-section
    const section = document.querySelector('.document-carousel-section');
    if (section) {
      results.push(`\ndocument-carousel-section: `);
      // First 3 levels of children
      const walk = (el: Element, depth: number) => {
        if (depth > 2) return;
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const indent = '  '.repeat(depth);
          const text = child.childElementCount === 0 ? child.textContent?.trim().substring(0, 30) || '' : '';
          const cls = child.className?.toString().substring(0, 50) || '';
          const visible = child.offsetParent !== null;
          const disabled = (child as HTMLButtonElement).disabled;
          if (visible) {
            results.push(`${indent}[${i}] <${child.tagName}> class="${cls}" ${text ? `text="${text}"` : ''} ${disabled ? 'DISABLED' : ''}`);
            walk(child, depth + 1);
          }
        }
      };
      walk(section, 1);
    }

    return results;
  });

  for (const line of carouselDom) {
    console.log(`  ${line}`);
  }

  // Try clicking the "Yes" button first, then check arrows again
  console.log('\n══ After clicking Yes ══');
  const yesBtn = page.locator('text="Yes"').first();
  if (await yesBtn.isVisible({ timeout: 3000 })) {
    await yesBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/50-after-yes.png`, fullPage: true });

    // Check arrows again
    const afterYes = await page.evaluate(() => {
      const results: string[] = [];
      document.querySelectorAll('button').forEach((btn, i) => {
        const visible = btn.offsetParent !== null;
        if (visible) {
          const text = btn.textContent?.trim().substring(0, 40) || '';
          const disabled = btn.disabled;
          const cls = btn.className?.substring(0, 60) || '';
          results.push(`btn[${i}] text="${text}" disabled=${disabled} class="${cls}"`);
        }
      });
      return results;
    });

    for (const line of afterYes) {
      console.log(`  ${line}`);
    }
  }

  console.log('\n══ DONE ══');
});
