import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Understand what Formio data changes when "Yes" is clicked
 * via proper Playwright click vs. DOM click
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Yes button data tracking', async ({ page }) => {
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

  // BEFORE: snapshot all Formio data
  console.log('\n══ BEFORE clicking Yes ══');
  const beforeData = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return {};
    const result: Record<string, any> = {};
    for (const k of Object.keys(formio.forms)) {
      const data = formio.forms[k]?.submission?.data;
      if (data) result[k] = JSON.parse(JSON.stringify(data));
    }
    return result;
  });

  // Get form keys for comparison
  const formKeys = Object.keys(beforeData);
  console.log(`  Forms: ${formKeys.join(', ')}`);
  for (const fk of formKeys) {
    console.log(`  Form ${fk}: ${Object.keys(beforeData[fk]).length} keys, isFormValid=${beforeData[fk].isFormValid}, Form is valid=${beforeData[fk]['Form is valid']}`);
  }

  // Check the Yes/No button structure in detail
  const btnStructure = await page.evaluate(() => {
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (!activeItem) return 'no active item';

    const results: string[] = [];

    // Find the "Is document valid?" section
    const allEls = activeItem.querySelectorAll('*');
    for (const el of allEls) {
      const text = el.textContent?.trim() || '';
      if (text === 'Yes' || text === 'No' || text.includes('Is document valid')) {
        const tag = el.tagName;
        const cls = (el.className?.toString() || '').substring(0, 80);
        const type = el.getAttribute('type') || '';
        const name = el.getAttribute('name') || '';
        const value = el.getAttribute('value') || '';
        const forAttr = el.getAttribute('for') || '';
        const inputId = el.getAttribute('id') || '';
        const role = el.getAttribute('role') || '';
        const ariaChecked = el.getAttribute('aria-checked') || '';
        const checked = (el as HTMLInputElement).checked;

        // Formio component key
        const formioParent = el.closest('[class*="formio-component-"]');
        const formioClass = formioParent?.className?.toString().match(/formio-component-(\S+)/)?.[1] || '';

        results.push(`<${tag}> text="${text.substring(0, 30)}" class="${cls}" type="${type}" name="${name}" value="${value}" for="${forAttr}" id="${inputId}" role="${role}" ariaChecked="${ariaChecked}" checked=${checked} formio="${formioClass}"`);
      }
    }

    return results;
  });

  console.log('\n  Yes/No button structure:');
  if (Array.isArray(btnStructure)) {
    for (const line of btnStructure) {
      console.log(`    ${line}`);
    }
  } else {
    console.log(`    ${btnStructure}`);
  }

  // NOW: Click Yes via proper Playwright click (not evaluate)
  console.log('\n══ Clicking Yes via Playwright ══');

  // Find visible "Yes" text and click it
  const yesBtn = page.locator('.carousel-item.active text="Yes", .item.active text="Yes"').first();
  const yesVisible = await yesBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (!yesVisible) {
    // Try broader selector
    console.log('  Trying broader selector...');
    const allYes = page.locator('text="Yes"');
    const count = await allYes.count();
    console.log(`  Found ${count} "Yes" elements`);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const vis = await allYes.nth(i).isVisible().catch(() => false);
      if (vis) {
        const box = await allYes.nth(i).boundingBox();
        console.log(`    [${i}] visible at (${box?.x}, ${box?.y}) ${box?.width}x${box?.height}`);
      }
    }

    // Click the first visible "Yes"
    const visibleYes = page.locator('text="Yes":visible').first();
    if (await visibleYes.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Clicking visible "Yes"...');
      await visibleYes.click();
    } else {
      console.log('  No visible "Yes" found via Playwright — trying evaluate click + Angular trigger');

      // Click via evaluate but also trigger Angular change detection
      await page.evaluate(() => {
        const activeItem = document.querySelector('.carousel-item.active, .item.active');
        if (!activeItem) return;

        // Find Yes button/label/input
        const elements = activeItem.querySelectorAll('label, button, input');
        for (const el of elements) {
          if (el.textContent?.trim() === 'Yes') {
            // Trigger events that Angular listens for
            const htmlEl = el as HTMLElement;
            htmlEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            htmlEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            htmlEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            // If it's a label for a radio, also check the radio
            const input = htmlEl.querySelector('input') || document.getElementById(htmlEl.getAttribute('for') || '');
            if (input) {
              (input as HTMLInputElement).checked = true;
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            break;
          }
        }

        // Force Angular change detection
        const ng = (window as any).ng;
        if (ng?.applyChanges) {
          const appRef = document.querySelector('app-root');
          if (appRef) ng.applyChanges(appRef);
        }
      });
    }
  } else {
    console.log('  Found Yes in active item — clicking...');
    await yesBtn.click();
  }

  await page.waitForTimeout(3000);

  // AFTER: compare Formio data
  console.log('\n══ AFTER clicking Yes ══');
  const afterData = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return {};
    const result: Record<string, any> = {};
    for (const k of Object.keys(formio.forms)) {
      const data = formio.forms[k]?.submission?.data;
      if (data) result[k] = JSON.parse(JSON.stringify(data));
    }
    return result;
  });

  // Diff the data
  console.log('\n  Changes:');
  for (const fk of formKeys) {
    const before = beforeData[fk];
    const after = afterData[fk];
    if (!after) continue;

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    let changes = 0;
    for (const key of allKeys) {
      const bVal = JSON.stringify(before[key]);
      const aVal = JSON.stringify(after[key]);
      if (bVal !== aVal) {
        console.log(`    Form ${fk}: ${key}: ${bVal?.substring(0, 60)} → ${aVal?.substring(0, 60)}`);
        changes++;
      }
    }
    if (changes === 0) {
      console.log(`    Form ${fk}: no changes detected`);
    }
  }

  // Also check: what's the Yes/No state now?
  const afterBtnState = await page.evaluate(() => {
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (!activeItem) return 'no active item';

    const results: string[] = [];
    const elements = activeItem.querySelectorAll('label, button, input');
    for (const el of elements) {
      const text = el.textContent?.trim() || '';
      if (text === 'Yes' || text === 'No') {
        const cls = (el.className?.toString() || '').substring(0, 60);
        const checked = (el as HTMLInputElement).checked;
        const style = getComputedStyle(el as HTMLElement);
        results.push(`${text}: class="${cls}" checked=${checked} bg=${style.backgroundColor}`);
      }
    }
    return results;
  });
  console.log('\n  Button states after click:');
  if (Array.isArray(afterBtnState)) {
    for (const line of afterBtnState) {
      console.log(`    ${line}`);
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/75-after-yes-data.png` });
  console.log('\n══ DONE ══');
});
