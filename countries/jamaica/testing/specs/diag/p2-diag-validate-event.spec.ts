import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Investigate and trigger the window-level "validate" and
 * "updateDocuments" events that Angular has registered via Zone.js.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('P2-DIAG: Validate event dispatch', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture network requests
  const networkRequests: { method: string; url: string; body?: string; time: number }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('.js') || url.includes('.css') || url.includes('.woff') ||
        url.includes('.png') || url.includes('.svg') || url.includes('.ico') || url.includes('.map')) return;
    networkRequests.push({ method: req.method(), url: url.substring(0, 200), body: req.postData()?.substring(0, 500), time: Date.now() });
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Go to Documents tab and open carousel
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // 1. Examine the validate and updateDocuments event handlers
  console.log('\n══ Zone.js event handlers on window ══');
  const zoneInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Check validate event
    const validateTasks = (window as any).__zone_symbol__validatefalse;
    if (validateTasks) {
      results.push(`__zone_symbol__validatefalse: ${Array.isArray(validateTasks) ? validateTasks.length + ' handlers' : typeof validateTasks}`);
      if (Array.isArray(validateTasks)) {
        for (const task of validateTasks) {
          results.push(`  type=${task.type} state=${task.state} source="${task.source?.substring(0, 80)}"`);
          if (task.callback) {
            results.push(`  callback: ${task.callback.toString().substring(0, 200)}`);
          }
          if (task.invoke) {
            results.push(`  invoke: ${task.invoke.toString().substring(0, 200)}`);
          }
        }
      }
    } else {
      results.push('No __zone_symbol__validatefalse');
    }

    // Check updateDocuments event
    const updateDocsTasks = (window as any).__zone_symbol__updateDocumentsfalse;
    if (updateDocsTasks) {
      results.push(`\n__zone_symbol__updateDocumentsfalse: ${Array.isArray(updateDocsTasks) ? updateDocsTasks.length + ' handlers' : typeof updateDocsTasks}`);
      if (Array.isArray(updateDocsTasks)) {
        for (const task of updateDocsTasks) {
          results.push(`  type=${task.type} state=${task.state} source="${task.source?.substring(0, 80)}"`);
          if (task.callback) {
            results.push(`  callback: ${task.callback.toString().substring(0, 200)}`);
          }
        }
      }
    }

    // Check ALL zone symbols on window that might be relevant
    const relevantSymbols = Object.getOwnPropertyNames(window)
      .filter(k => k.startsWith('__zone_symbol__') && !k.includes('Error') && !k.includes('Promise'))
      .filter(k => !k.includes('setTimeout') && !k.includes('setInterval') && !k.includes('request'));
    results.push(`\nAll relevant zone symbols on window: ${relevantSymbols.length}`);
    for (const sym of relevantSymbols) {
      const val = (window as any)[sym];
      if (Array.isArray(val)) {
        results.push(`  ${sym}: ${val.length} handlers`);
      } else {
        results.push(`  ${sym}: ${typeof val}`);
      }
    }

    return results;
  });
  for (const line of zoneInfo) {
    console.log(`  ${line}`);
  }

  // 2. Try dispatching "validate" event on window
  console.log('\n══ Dispatching "validate" event on window ══');
  networkRequests.length = 0;
  const startTime = Date.now();

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('validate'));
  });
  await page.waitForTimeout(5000);

  const afterValidate = networkRequests.filter(r => r.time > startTime);
  console.log(`  Network requests: ${afterValidate.length}`);
  for (const r of afterValidate) {
    console.log(`    ${r.method} ${r.url}`);
    if (r.body) console.log(`      BODY: ${r.body.substring(0, 200)}`);
  }

  // 3. Try dispatching "updateDocuments" event on window
  console.log('\n══ Dispatching "updateDocuments" event on window ══');
  networkRequests.length = 0;
  const startTime2 = Date.now();

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('updateDocuments'));
  });
  await page.waitForTimeout(5000);

  const afterUpdate = networkRequests.filter(r => r.time > startTime2);
  console.log(`  Network requests: ${afterUpdate.length}`);
  for (const r of afterUpdate) {
    console.log(`    ${r.method} ${r.url}`);
    if (r.body) console.log(`      BODY: ${r.body.substring(0, 200)}`);
  }

  // 4. Try dispatching "validate" with custom data
  console.log('\n══ Dispatching "validate" with detail data ══');
  networkRequests.length = 0;
  const startTime3 = Date.now();

  await page.evaluate(({ docId, processId, fileId }) => {
    // Try with document-specific detail
    window.dispatchEvent(new CustomEvent('validate', {
      detail: { documentId: docId, processId, fileId, is_valid: true }
    }));
  }, { docId: 1522, processId: PROCESS_ID, fileId: FILE_ID });
  await page.waitForTimeout(5000);

  const afterValidate2 = networkRequests.filter(r => r.time > startTime3);
  console.log(`  Network requests: ${afterValidate2.length}`);
  for (const r of afterValidate2) {
    console.log(`    ${r.method} ${r.url}`);
    if (r.body) console.log(`      BODY: ${r.body.substring(0, 200)}`);
  }

  // 5. Check the full isdocvalid checkbox DOM, maybe it dispatches a custom event
  console.log('\n══ Checkbox custom event analysis ══');
  const checkboxAnalysis = await page.evaluate(() => {
    const results: string[] = [];

    // Find the formio-component-checkbox that contains the Yes/No
    const checkbox = document.querySelector('.carousel-item.active .formio-component-checkbox, .item.active .formio-component-checkbox');
    if (!checkbox) {
      results.push('No checkbox found in active item');

      // Try broader search
      const allCheckboxes = document.querySelectorAll('.formio-component-checkbox.check-switch');
      results.push(`Total check-switch elements: ${allCheckboxes.length}`);
      if (allCheckboxes.length > 0) {
        const first = allCheckboxes[0];
        results.push(`First: ${first.className?.toString().substring(0, 80)}`);
        results.push(`  innerHTML: ${first.innerHTML.substring(0, 300)}`);

        // Check zone symbols
        const keys = Object.getOwnPropertyNames(first);
        for (const key of keys) {
          if (key.includes('zone') || key.includes('ng')) {
            results.push(`  ${key}: ${typeof (first as any)[key]}`);
          }
        }
      }
      return results;
    }

    results.push(`Checkbox: ${checkbox.className?.toString().substring(0, 80)}`);
    results.push(`  innerHTML: ${checkbox.innerHTML.substring(0, 300)}`);

    // Check ALL zone symbols on the checkbox
    const keys = Object.getOwnPropertyNames(checkbox);
    for (const key of keys) {
      if (key.includes('zone') || key.includes('ng')) {
        const val = (checkbox as any)[key];
        if (typeof val === 'function') {
          results.push(`  ${key}: function`);
        } else if (Array.isArray(val)) {
          results.push(`  ${key}: array(${val.length})`);
          for (const item of val) {
            if (item.source) results.push(`    source: ${item.source?.substring(0, 80)}`);
          }
        } else {
          results.push(`  ${key}: ${JSON.stringify(val)?.substring(0, 80)}`);
        }
      }
    }

    return results;
  });
  for (const line of checkboxAnalysis) {
    console.log(`  ${line}`);
  }

  // 6. Check Formio state
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

  // 7. Check document validation status from API
  const docStatus = await page.evaluate(async (processId) => {
    const resp = await fetch(`/backend/process/${processId}/document`);
    const docs = await resp.json();
    const summary = docs.slice(0, 5).map((d: any) =>
      `${d.id}: is_valid=${d.is_valid} validated_at=${d.validated_at}`
    );
    return summary;
  }, PROCESS_ID);
  console.log('\n  Document validation status:');
  for (const line of docStatus) {
    console.log(`    ${line}`);
  }

  console.log('\n══ DONE ══');
});
