import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Extract all inline onclick handlers from isdocvalid radios
 * and execute them to properly validate documents.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Extract and execute onclick handlers', async ({ page }) => {
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

  // 1. Extract all onclick handlers for "yes" radios
  console.log('\n══ All isdocvalid-yes onclick handlers ══');
  const handlers = await page.evaluate(() => {
    const results: { id: string; onclick: string }[] = [];
    for (let i = 1; i <= 30; i++) {
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLElement;
      if (!radio) break;
      const onclick = radio.getAttribute('onclick') || '';
      results.push({ id: `isdocvalid${i}-yes`, onclick });
    }
    return results;
  });

  console.log(`  Found ${handlers.length} handlers`);
  for (const h of handlers.slice(0, 5)) {
    console.log(`  ${h.id}: ${h.onclick.substring(0, 200)}`);
  }

  // 2. Check if roleForm exists globally
  console.log('\n══ roleForm global ══');
  const roleFormInfo = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return 'No roleForm';

    const results: string[] = [];
    results.push(`typeof: ${typeof roleForm}`);
    results.push(`submission exists: ${!!roleForm.submission}`);
    results.push(`submission.data keys: ${Object.keys(roleForm.submission?.data || {}).length}`);

    // Find filestatus* keys
    const data = roleForm.submission?.data || {};
    const fileStatusKeys = Object.keys(data).filter(k => k.startsWith('filestatus'));
    results.push(`\nfilestatus keys: ${fileStatusKeys.length}`);
    for (const k of fileStatusKeys) {
      results.push(`  ${k}: ${data[k]}`);
    }

    return results;
  });

  if (Array.isArray(roleFormInfo)) {
    for (const line of roleFormInfo) {
      console.log(`  ${line}`);
    }
  } else {
    console.log(`  ${roleFormInfo}`);
  }

  // 3. Execute ALL "yes" onclick handlers
  console.log('\n══ Executing all Yes onclick handlers ══');
  const execResult = await page.evaluate(() => {
    const results: string[] = [];
    const roleForm = (window as any).roleForm;

    if (!roleForm) {
      results.push('No roleForm — trying to find it');
      // Maybe it's a different name
      const candidates = ['roleForm', 'formScope', 'scope', 'formInstance'];
      for (const c of candidates) {
        if ((window as any)[c]) {
          results.push(`  Found: window.${c}`);
        }
      }
      return results;
    }

    // Before state
    const data = roleForm.submission?.data || {};
    const fileStatusBefore = Object.keys(data).filter(k => k.startsWith('filestatus'));
    results.push(`Before: ${fileStatusBefore.length} filestatus keys`);
    const trueBefore = fileStatusBefore.filter(k => data[k] === true).length;
    results.push(`  ${trueBefore} true, ${fileStatusBefore.length - trueBefore} false/other`);

    // Execute each handler
    for (let i = 1; i <= 30; i++) {
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLElement;
      if (!radio) break;

      const onclick = radio.getAttribute('onclick');
      if (onclick) {
        try {
          // Execute the onclick code in the same context
          const fn = new Function(onclick);
          fn.call(radio);
          results.push(`  [${i}] Executed OK`);
        } catch (e: any) {
          results.push(`  [${i}] Error: ${e.message?.substring(0, 60)}`);
        }
      }
    }

    // After state
    const dataAfter = roleForm.submission?.data || {};
    const fileStatusAfter = Object.keys(dataAfter).filter(k => k.startsWith('filestatus'));
    const trueAfter = fileStatusAfter.filter(k => dataAfter[k] === true).length;
    results.push(`\nAfter: ${fileStatusAfter.length} filestatus keys, ${trueAfter} true`);

    // Check isFormValid
    results.push(`isFormValid: ${dataAfter.isFormValid}`);
    results.push(`Form is valid: ${dataAfter['Form is valid']}`);

    return results;
  });

  for (const line of execResult) {
    console.log(`  ${line}`);
  }

  // 4. Now trigger saveDraft to save the validated state
  console.log('\n══ Triggering saveDraft event ══');

  // Capture network requests
  const requests: { method: string; url: string; body?: string }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/backend/') && !url.includes('.js') && !url.includes('.css')) {
      requests.push({ method: req.method(), url: url.substring(0, 150), body: req.postData()?.substring(0, 200) });
    }
  });

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('saveDraft'));
  });
  await page.waitForTimeout(5000);

  console.log(`  Requests: ${requests.length}`);
  for (const r of requests) {
    console.log(`    ${r.method} ${r.url}`);
    if (r.body) console.log(`      BODY: ${r.body.substring(0, 150)}`);
  }

  // 5. Check form state after save
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

  // 6. Now also try updateDocuments to refresh the document data
  console.log('\n══ Triggering updateDocuments event ══');
  requests.length = 0;
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('updateDocuments'));
  });
  await page.waitForTimeout(5000);

  console.log(`  Requests: ${requests.length}`);
  for (const r of requests) {
    console.log(`    ${r.method} ${r.url}`);
  }

  // 7. Check document validation status from API
  const docStatus = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add/document');
    const docs = await resp.json();
    const summary = docs.slice(0, 5).map((d: any) =>
      `${d.id}: is_valid=${d.is_valid} validated_at=${d.validated_at}`
    );
    return { count: docs.length, validCount: docs.filter((d: any) => d.is_valid).length, samples: summary };
  });
  console.log(`\n  Documents: ${docStatus.validCount}/${docStatus.count} valid`);
  for (const s of docStatus.samples) {
    console.log(`    ${s}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/82-after-onclick-handlers.png`, fullPage: true });
  console.log('\n══ DONE ══');
});
