import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Properly click "Yes" on a document and track
 * both network requests and Formio data changes.
 *
 * Strategy: Navigate fresh, intercept network, click Yes label
 * via different methods, see which actually triggers a save.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Click Yes with network tracking', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture ALL network requests
  const requests: { method: string; url: string; body?: string }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (!url.includes('favicon') && !url.includes('.js') && !url.includes('.css') && !url.includes('.woff') && !url.includes('.png') && !url.includes('.svg')) {
      const body = req.postData()?.substring(0, 200);
      requests.push({ method: req.method(), url: url.substring(0, 150), body });
    }
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Clear captured requests
  requests.length = 0;

  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Clear requests again
  requests.length = 0;

  // Check initial state of doc 1 radio
  console.log('\n══ Initial state of doc 1 ══');
  const initState = await page.evaluate(() => {
    const yesRadio = document.getElementById('isdocvalid1-yes') as HTMLInputElement;
    const noRadio = document.getElementById('isdocvalid1-no') as HTMLInputElement;
    return {
      yesChecked: yesRadio?.checked,
      noChecked: noRadio?.checked,
      yesVisible: yesRadio ? yesRadio.offsetParent !== null : null,
    };
  });
  console.log(`  isdocvalid1-yes: checked=${initState.yesChecked}, visible=${initState.yesVisible}`);
  console.log(`  isdocvalid1-no: checked=${initState.noChecked}`);

  // Method 1: Click "No" first to uncheck "Yes", then click "Yes"
  console.log('\n══ Method 1: Click No, then Yes (labels via Playwright locator) ══');
  requests.length = 0;

  // Click "No" first to reset
  try {
    const noLabel = page.locator('label[for="isdocvalid1-no"]');
    if (await noLabel.isVisible({ timeout: 2000 })) {
      console.log('  Clicking "No" label...');
      await noLabel.click();
      await page.waitForTimeout(2000);

      const afterNo = await page.evaluate(() => {
        const y = document.getElementById('isdocvalid1-yes') as HTMLInputElement;
        const n = document.getElementById('isdocvalid1-no') as HTMLInputElement;
        return { yes: y?.checked, no: n?.checked };
      });
      console.log(`  After No: yes=${afterNo.yes}, no=${afterNo.no}`);
      console.log(`  Requests after No: ${requests.length}`);
      for (const r of requests) {
        console.log(`    ${r.method} ${r.url} ${r.body || ''}`);
      }
    } else {
      console.log('  No label not visible');
    }
  } catch (e: any) {
    console.log(`  Error clicking No: ${e.message?.substring(0, 60)}`);
  }

  // Now click "Yes"
  requests.length = 0;
  try {
    const yesLabel = page.locator('label[for="isdocvalid1-yes"]');
    if (await yesLabel.isVisible({ timeout: 2000 })) {
      console.log('\n  Clicking "Yes" label...');
      await yesLabel.click();
      await page.waitForTimeout(3000);

      const afterYes = await page.evaluate(() => {
        const y = document.getElementById('isdocvalid1-yes') as HTMLInputElement;
        const n = document.getElementById('isdocvalid1-no') as HTMLInputElement;
        return { yes: y?.checked, no: n?.checked };
      });
      console.log(`  After Yes: yes=${afterYes.yes}, no=${afterYes.no}`);
      console.log(`  Requests after Yes: ${requests.length}`);
      for (const r of requests) {
        console.log(`    ${r.method} ${r.url} ${r.body || ''}`);
      }
    } else {
      console.log('  Yes label not visible');
    }
  } catch (e: any) {
    console.log(`  Error clicking Yes: ${e.message?.substring(0, 60)}`);
  }

  // Check Formio after
  const formioState = await page.evaluate(() => {
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
  console.log(`  Formio: ${formioState}`);

  // Method 2: Try using page.check() on the radio input directly
  console.log('\n══ Method 2: page.check() on radio input ══');
  requests.length = 0;

  // Navigate to doc 2 via carousel
  await page.evaluate(() => {
    (window as any).$('.carousel').carousel(1);
  });
  await page.waitForTimeout(2000);

  try {
    // First uncheck by clicking No
    await page.locator('label[for="isdocvalid2-no"]').click({ force: true });
    await page.waitForTimeout(1000);
    requests.length = 0;

    // Use check() on the input
    await page.locator('#isdocvalid2-yes').check({ force: true });
    await page.waitForTimeout(3000);

    console.log(`  Requests after check(): ${requests.length}`);
    for (const r of requests) {
      console.log(`    ${r.method} ${r.url} ${r.body || ''}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Method 3: Try dispatching events that Angular Zone.js will catch
  console.log('\n══ Method 3: dispatchEvent with full event sequence ══');
  requests.length = 0;

  await page.evaluate(() => {
    (window as any).$('.carousel').carousel(2);
  });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const noRadio = document.getElementById('isdocvalid3-no') as HTMLInputElement;
    if (noRadio) {
      noRadio.checked = true;
      noRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);

  requests.length = 0;
  const method3Result = await page.evaluate(() => {
    const radio = document.getElementById('isdocvalid3-yes') as HTMLInputElement;
    const label = document.querySelector('label[for="isdocvalid3-yes"]') as HTMLElement;
    if (!radio || !label) return 'No radio/label found';

    // Full event sequence as a real browser click would produce
    radio.checked = true;

    // On the label
    label.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    label.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // On the input
    radio.dispatchEvent(new Event('input', { bubbles: true }));
    radio.dispatchEvent(new Event('change', { bubbles: true }));

    return 'Events dispatched';
  });
  console.log(`  Result: ${method3Result}`);
  await page.waitForTimeout(3000);

  console.log(`  Requests: ${requests.length}`);
  for (const r of requests) {
    console.log(`    ${r.method} ${r.url} ${r.body || ''}`);
  }

  // Method 4: Try clicking the label via mouse at exact coordinates (fresh carousel item)
  console.log('\n══ Method 4: page.mouse.click on fresh doc label ══');
  await page.evaluate(() => {
    (window as any).$('.carousel').carousel(3);
  });
  await page.waitForTimeout(2000);

  // First uncheck: click No
  const noCoords4 = await page.evaluate(() => {
    const label = document.querySelector('label[for="isdocvalid4-no"]') as HTMLElement;
    if (!label) return null;
    const rect = label.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (noCoords4) {
    await page.mouse.click(noCoords4.x, noCoords4.y);
    await page.waitForTimeout(1000);
  }

  requests.length = 0;
  const yesCoords4 = await page.evaluate(() => {
    const label = document.querySelector('label[for="isdocvalid4-yes"]') as HTMLElement;
    if (!label) return null;
    const rect = label.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (yesCoords4) {
    console.log(`  Clicking at (${Math.round(yesCoords4.x)}, ${Math.round(yesCoords4.y)})...`);
    await page.mouse.click(yesCoords4.x, yesCoords4.y);
    await page.waitForTimeout(3000);
  }

  console.log(`  Requests: ${requests.length}`);
  for (const r of requests) {
    console.log(`    ${r.method} ${r.url} ${r.body || ''}`);
  }

  // Dump ALL requests since page load for reference
  console.log('\n══ All non-static requests captured ══');
  console.log(`  Total: ${requests.length}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/77-click-yes-tracking.png` });
  console.log('\n══ DONE ══');
});
