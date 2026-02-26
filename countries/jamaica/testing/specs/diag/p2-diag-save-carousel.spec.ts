import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Click the floppy disk save button from WITHIN the carousel view
 * and track ALL network requests. Also try the "Choose" button if it exists.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Save from carousel + network tracking', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture ALL requests (even static ones at first)
  const allRequests: { method: string; url: string; body?: string; time: number }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('.js') || url.includes('.css') || url.includes('.woff') ||
        url.includes('.png') || url.includes('.svg') || url.includes('.ico') ||
        url.includes('.map')) return;
    allRequests.push({
      method: req.method(),
      url,
      body: req.postData()?.substring(0, 500),
      time: Date.now(),
    });
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Navigate to doc 5 (likely not validated server-side)
  await page.evaluate(() => (window as any).$('.carousel').carousel(4));
  await page.waitForTimeout(2000);

  // Check doc 5 state
  const doc5State = await page.evaluate(() => {
    const y = document.getElementById('isdocvalid5-yes') as HTMLInputElement;
    const n = document.getElementById('isdocvalid5-no') as HTMLInputElement;
    return { yes: y?.checked, no: n?.checked };
  });
  console.log(`\n══ Doc 5 state: yes=${doc5State.yes}, no=${doc5State.no} ══`);

  // Reset to No first, then click Yes — use force:true since jQuery-navigated carousel items
  // aren't "visible" to Playwright even though they render
  await page.locator('label[for="isdocvalid5-no"]').click({ force: true });
  await page.waitForTimeout(500);

  // Clear all requests
  allRequests.length = 0;
  const startTime = Date.now();

  // Click Yes via label
  console.log('\n══ Clicking Yes on doc 5 ══');
  await page.locator('label[for="isdocvalid5-yes"]').click({ force: true });
  await page.waitForTimeout(3000);

  const afterYesReqs = allRequests.filter(r => r.time > startTime);
  console.log(`  Requests after Yes click: ${afterYesReqs.length}`);
  for (const r of afterYesReqs) {
    console.log(`    ${r.method} ${r.url.substring(0, 150)}`);
    if (r.body) console.log(`      BODY: ${r.body.substring(0, 300)}`);
  }

  // Now click the save (floppy) button from within carousel
  console.log('\n══ Clicking floppy save button in carousel ══');
  allRequests.length = 0;
  const saveStart = Date.now();

  // The floppy icon was at (1248, 351) — click the parent button
  const floppyInfo = await page.evaluate(() => {
    const icon = document.querySelector('i.fas.fa-floppy-disk, i.fa-floppy-disk');
    if (!icon) return null;
    const button = icon.closest('button') as HTMLElement;
    if (!button) return { iconFound: true, buttonFound: false };
    const rect = button.getBoundingClientRect();
    return {
      iconFound: true,
      buttonFound: true,
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      class: button.className?.substring(0, 60),
      visible: button.offsetParent !== null,
      disabled: (button as HTMLButtonElement).disabled,
    };
  });
  console.log(`  Floppy button: ${JSON.stringify(floppyInfo)}`);

  if (floppyInfo?.buttonFound && floppyInfo.visible) {
    await page.mouse.click(floppyInfo.x, floppyInfo.y);
    await page.waitForTimeout(5000);

    const afterSaveReqs = allRequests.filter(r => r.time > saveStart);
    console.log(`  Requests after floppy click: ${afterSaveReqs.length}`);
    for (const r of afterSaveReqs) {
      console.log(`    ${r.method} ${r.url.substring(0, 150)}`);
      if (r.body) {
        const bodyStr = r.body;
        if (bodyStr.includes('isdoc') || bodyStr.includes('docvalid')) {
          console.log(`      BODY contains isdoc: YES`);
        }
        console.log(`      BODY (first 300): ${bodyStr.substring(0, 300)}`);
      }
    }
  }

  // Check Formio state
  const formState = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';
    const results: string[] = [];
    for (const k of Object.keys(formio.forms)) {
      const d = formio.forms[k]?.submission?.data;
      if (!d) continue;
      results.push(`${k}: isFormValid=${d.isFormValid}`);
    }
    return results.join(' | ');
  });
  console.log(`\n  Formio: ${formState}`);

  // Screenshot of carousel with floppy button visible
  await page.screenshot({ path: `${SCREENSHOT_DIR}/79-carousel-floppy.png` });

  // NOW: Check the Angular component that handles the carousel validation
  // Look at what "choose" does - the earlier diagnostic found "Is document valid?YesNoChoose"
  console.log('\n══ Examining the "Choose" option ══');
  const chooseInfo = await page.evaluate(() => {
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (!activeItem) return ['no active item'];
    const results: string[] = [];

    // Find ALL elements with text "Choose", "Select", or similar
    const allEls = activeItem.querySelectorAll('*');
    for (const el of allEls) {
      const text = el.textContent?.trim() || '';
      if (text.includes('Choose') || text.includes('Select') || text.includes('choose')) {
        const tag = el.tagName;
        const cls = (el.className?.toString() || '').substring(0, 60);
        const rect = el.getBoundingClientRect();
        const visible = (el as HTMLElement).offsetParent !== null;
        if (el.childElementCount === 0 || el.tagName === 'SELECT' || el.tagName === 'OPTION') {
          results.push(`<${tag}> text="${text.substring(0, 40)}" class="${cls}" visible=${visible} at (${Math.round(rect.x)},${Math.round(rect.y)})`);
        }
      }
    }

    // Also look for <select> elements (dropdown) in the active item
    const selects = activeItem.querySelectorAll('select');
    selects.forEach((sel, i) => {
      const visible = (sel as HTMLElement).offsetParent !== null;
      results.push(`SELECT[${i}]: id="${sel.id}" name="${sel.name}" visible=${visible} value="${sel.value}" options=${sel.options.length}`);
      for (let j = 0; j < sel.options.length; j++) {
        results.push(`  option[${j}]: value="${sel.options[j].value}" text="${sel.options[j].text}"`);
      }
    });

    return results;
  });
  for (const line of chooseInfo) {
    console.log(`  ${line}`);
  }

  // Final attempt: Check what Angular event handlers exist on the label
  console.log('\n══ Angular event handlers on Yes label ══');
  const handlerInfo = await page.evaluate(() => {
    const label = document.querySelector('label[for="isdocvalid5-yes"]') as HTMLElement;
    if (!label) return ['No label'];
    const results: string[] = [];

    // Zone.js stores event listeners
    const allProps = Object.getOwnPropertyNames(label);
    for (const prop of allProps) {
      if (prop.startsWith('__') || prop.includes('zone') || prop.includes('ng')) {
        try {
          const val = (label as any)[prop];
          if (typeof val === 'function') {
            results.push(`${prop}: function`);
          } else if (val && typeof val === 'object') {
            results.push(`${prop}: ${JSON.stringify(val)?.substring(0, 150)}`);
          } else {
            results.push(`${prop}: ${val}`);
          }
        } catch (e) {
          results.push(`${prop}: [error reading]`);
        }
      }
    }

    // Also check the parent checkbox container
    const checkSwitch = label.closest('.check-switch, .formio-component-checkbox');
    if (checkSwitch) {
      results.push(`\nParent check-switch:`);
      const parentProps = Object.getOwnPropertyNames(checkSwitch);
      for (const prop of parentProps) {
        if (prop.startsWith('__') || prop.includes('zone') || prop.includes('ng')) {
          try {
            const val = (checkSwitch as any)[prop];
            if (typeof val === 'function') {
              results.push(`  ${prop}: function`);
            } else if (val !== undefined && val !== null) {
              results.push(`  ${prop}: ${JSON.stringify(val)?.substring(0, 100)}`);
            }
          } catch (e) {
            results.push(`  ${prop}: [error]`);
          }
        }
      }
    }

    // Check the radio input
    const radio = document.getElementById('isdocvalid5-yes') as HTMLElement;
    if (radio) {
      results.push(`\nRadio input props:`);
      const radioProps = Object.getOwnPropertyNames(radio);
      for (const prop of radioProps) {
        if (prop.startsWith('__') || prop.includes('zone') || prop.includes('ng')) {
          try {
            const val = (radio as any)[prop];
            if (typeof val === 'function') {
              results.push(`  ${prop}: function`);
            } else if (val !== undefined && val !== null) {
              results.push(`  ${prop}: ${JSON.stringify(val)?.substring(0, 100)}`);
            }
          } catch (e) {}
        }
      }
    }

    return results;
  });
  for (const line of handlerInfo) {
    console.log(`  ${line}`);
  }

  console.log('\n══ DONE ══');
});
