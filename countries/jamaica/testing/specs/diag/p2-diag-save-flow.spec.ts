import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Track what the Save button does
 * - What network requests does it send?
 * - Does it include isdocvalid* radio states?
 * - Does isFormValid change after save?
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Save button network flow', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture ALL network traffic
  const allRequests: { method: string; url: string; body?: string; status?: number }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('.js') || url.includes('.css') || url.includes('.woff') ||
        url.includes('.png') || url.includes('.svg') || url.includes('.ico') ||
        url.includes('.map') || url.includes('favicon')) return;
    allRequests.push({
      method: req.method(),
      url: url.substring(0, 200),
      body: req.postData()?.substring(0, 500),
    });
  });

  page.on('response', resp => {
    const url = resp.url();
    const req = allRequests.find(r => r.url === url.substring(0, 200) && !r.status);
    if (req) req.status = resp.status();
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Ensure we're on Documents tab with carousel open
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Check doc 1 state — if already "Yes", switch to "No" first
  const doc1State = await page.evaluate(() => {
    const y = document.getElementById('isdocvalid1-yes') as HTMLInputElement;
    return y?.checked;
  });
  console.log(`\n══ Doc 1 "Yes" checked: ${doc1State} ══`);

  // Click "No" on doc 1 to reset, then "Yes" to make a change
  await page.locator('label[for="isdocvalid1-no"]').click();
  await page.waitForTimeout(500);
  await page.locator('label[for="isdocvalid1-yes"]').click();
  await page.waitForTimeout(500);

  // Clear request log
  allRequests.length = 0;

  // Find and describe the save button(s)
  console.log('\n══ Save buttons on page ══');
  const saveButtons = await page.evaluate(() => {
    const results: string[] = [];
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      const visible = btn.offsetParent !== null;
      const text = btn.textContent?.trim().substring(0, 40) || '';
      const cls = btn.className?.substring(0, 80) || '';
      if (visible && (cls.includes('save') || text.toLowerCase().includes('save') ||
          cls.includes('floppy') || cls.includes('fa-floppy'))) {
        const rect = btn.getBoundingClientRect();
        results.push(`[${i}] text="${text}" class="${cls}" at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    });

    // Also look for any element with save-related icon
    const icons = document.querySelectorAll('[class*="floppy"], [class*="save"], .fa-save');
    icons.forEach((icon, i) => {
      const visible = (icon as HTMLElement).offsetParent !== null;
      if (visible) {
        const rect = icon.getBoundingClientRect();
        const parent = icon.closest('button, a, div[role="button"]');
        results.push(`Icon[${i}]: <${icon.tagName}> class="${icon.className?.toString().substring(0, 60)}" parent=<${parent?.tagName}> at (${Math.round(rect.x)},${Math.round(rect.y)})`);
      }
    });

    return results;
  });
  for (const line of saveButtons) {
    console.log(`  ${line}`);
  }

  // Look for the green floppy button (usually fixed position on right side)
  const greenBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('button, a, div[role="button"]');
    const results: string[] = [];
    all.forEach(el => {
      const visible = (el as HTMLElement).offsetParent !== null;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      // Fixed position on right side
      if (rect.x > 1300 || (rect.width < 80 && rect.height < 80 && rect.x > 1000)) {
        const cls = el.className?.toString().substring(0, 80) || '';
        const text = el.textContent?.trim().substring(0, 20) || '';
        const icon = el.querySelector('i, span')?.className?.toString().substring(0, 60) || '';
        results.push(`<${el.tagName}> text="${text}" class="${cls}" icon="${icon}" at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    });
    return results;
  });
  console.log('\n  Fixed-position buttons (right side):');
  for (const line of greenBtn) {
    console.log(`    ${line}`);
  }

  // Try clicking the save-draft button
  console.log('\n══ Clicking save button ══');
  allRequests.length = 0;

  const saveClicked = await page.evaluate(() => {
    // Try multiple selectors
    const selectors = [
      'button.save-draft-btn',
      '.save-draft-btn',
      'button[class*="save"]',
      'button:has(i.fa-floppy-disk)',
      'button:has(i.fa-save)',
      'button:has(i[class*="floppy"])',
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel) as HTMLElement;
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return `Clicked: ${sel} — class="${btn.className?.substring(0, 60)}"`;
      }
    }

    // Last resort: find any green/save-looking button
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      if (btn.offsetParent === null) continue;
      const style = getComputedStyle(btn);
      const bgColor = style.backgroundColor;
      const cls = btn.className || '';
      // Green buttons or buttons with save icons
      if (bgColor.includes('0, 128') || bgColor.includes('40, 167') || bgColor.includes('76, 175') ||
          cls.includes('green') || cls.includes('success')) {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 80 && rect.height < 80) {
          return `Found green btn: class="${cls.substring(0, 60)}" bg=${bgColor} at (${Math.round(rect.x)},${Math.round(rect.y)})`;
        }
      }
    }

    return 'No save button found';
  });
  console.log(`  ${saveClicked}`);
  await page.waitForTimeout(5000);

  console.log(`\n  Requests after save: ${allRequests.length}`);
  for (const r of allRequests) {
    console.log(`    ${r.method} ${r.status || '?'} ${r.url}`);
    if (r.body) {
      // Check if body contains isdocvalid
      if (r.body.includes('isdoc') || r.body.includes('valid') || r.body.includes('document')) {
        console.log(`      BODY (relevant): ${r.body}`);
      } else {
        console.log(`      BODY: ${r.body.substring(0, 100)}...`);
      }
    }
  }

  // Check formio state after save
  const afterSave = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';
    const results: string[] = [];
    for (const k of Object.keys(formio.forms)) {
      const d = formio.forms[k]?.submission?.data;
      if (!d) continue;
      results.push(`${k}: isFormValid=${d.isFormValid}, Form is valid=${d['Form is valid']}`);
    }
    return results.join(' | ');
  });
  console.log(`\n  Formio after save: ${afterSave}`);

  // Now try: go back to Documents tab (closes carousel), then check if save works differently
  console.log('\n══ Try: Documents tab → Save ══');
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);

  allRequests.length = 0;

  // Look for a save button in list view
  const saveInList = page.locator('button.save-draft-btn, .save-draft-btn, button:has-text("Save")').first();
  try {
    if (await saveInList.isVisible({ timeout: 3000 })) {
      console.log('  Found save button in list view — clicking...');
      await saveInList.click();
      await page.waitForTimeout(5000);

      console.log(`  Requests: ${allRequests.length}`);
      for (const r of allRequests) {
        console.log(`    ${r.method} ${r.status || '?'} ${r.url}`);
        if (r.body) console.log(`      BODY: ${r.body.substring(0, 200)}`);
      }
    } else {
      console.log('  No save button visible in list view');

      // Try finding it in fixed position
      const fixedSave = page.locator('[class*="save-draft"], [class*="floating-btn"]');
      if (await fixedSave.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await fixedSave.first().click();
        await page.waitForTimeout(5000);
        console.log(`  Requests from fixed save: ${allRequests.length}`);
        for (const r of allRequests) {
          console.log(`    ${r.method} ${r.status || '?'} ${r.url}`);
        }
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 60)}`);
  }

  // Check Formio one more time
  const finalState = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';
    const results: string[] = [];
    for (const k of Object.keys(formio.forms)) {
      const d = formio.forms[k]?.submission?.data;
      if (!d) continue;
      results.push(`${k}: isFormValid=${d.isFormValid}, Form is valid=${d['Form is valid']}`);
    }
    return results.join(' | ');
  });
  console.log(`\n  Final Formio: ${finalState}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/78-save-flow.png` });
  console.log('\n══ DONE ══');
});
