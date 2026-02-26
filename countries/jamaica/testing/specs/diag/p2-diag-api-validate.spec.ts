import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Direct API approach to validate documents
 * 1. Capture the full Formio form data
 * 2. Set isFormValid=true
 * 3. PUT via the backend API
 * 4. Reload and check if Approve button is enabled
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: API-based document validation', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture network requests
  const requests: { method: string; url: string; body?: string; status?: number; responseBody?: string }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('.js') || url.includes('.css') || url.includes('.woff') ||
        url.includes('.png') || url.includes('.svg') || url.includes('.ico') || url.includes('.map')) return;
    requests.push({ method: req.method(), url, body: req.postData() });
  });
  page.on('response', async resp => {
    const url = resp.url();
    const req = requests.find(r => r.url === url && !r.status);
    if (req) {
      req.status = resp.status();
      try {
        if (resp.headers()['content-type']?.includes('json')) {
          req.responseBody = (await resp.text()).substring(0, 500);
        }
      } catch {}
    }
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Ensure we're on the Documents tab
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);

  // Step 1: Capture the full save payload by clicking save
  console.log('\n══ Step 1: Capture full save payload ══');
  requests.length = 0;

  const saveBtn = page.locator('.save-draft-btn, button.save-draft-btn').first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await saveBtn.click();
    await page.waitForTimeout(5000);
  } else {
    // Try clicking at known position or force-click
    await page.evaluate(() => {
      const btn = document.querySelector('.save-draft-btn') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
  }

  const saveReq = requests.find(r => r.method === 'PUT' && r.url.includes('/data/WIZARD'));
  if (saveReq) {
    console.log(`  Save URL: ${saveReq.url.substring(0, 150)}`);
    console.log(`  Status: ${saveReq.status}`);
    console.log(`  Body length: ${saveReq.body?.length}`);

    // Parse the body and check for isFormValid
    try {
      const body = JSON.parse(saveReq.body || '{}');
      const dataContent = JSON.parse(body.data_content || '{}');
      console.log(`  data_content keys: ${Object.keys(dataContent).length}`);
      console.log(`  isFormValid: ${dataContent.isFormValid}`);
      console.log(`  Form is valid: ${dataContent['Form is valid']}`);

      // Check if isdocvalid* keys exist in the saved data
      const isdocKeys = Object.keys(dataContent).filter(k => k.includes('isdocvalid'));
      console.log(`  isdocvalid keys in data: ${isdocKeys.length}`);
      if (isdocKeys.length > 0) {
        for (const k of isdocKeys.slice(0, 5)) {
          console.log(`    ${k}: ${dataContent[k]}`);
        }
      }

      // Check for document validation items
      if (dataContent.documentsTabDocuments) {
        const docs = typeof dataContent.documentsTabDocuments === 'string'
          ? JSON.parse(dataContent.documentsTabDocuments)
          : dataContent.documentsTabDocuments;
        if (Array.isArray(docs) && docs.length > 0) {
          console.log(`\n  documentsTabDocuments[0] full structure:`);
          console.log(`    ${JSON.stringify(docs[0]).substring(0, 500)}`);
          // Check if docs have validation fields
          const doc0 = docs[0];
          const validationKeys = Object.keys(doc0).filter(k =>
            k.toLowerCase().includes('valid') || k.toLowerCase().includes('status') ||
            k.toLowerCase().includes('check') || k.toLowerCase().includes('approved')
          );
          console.log(`    Validation-related keys: ${validationKeys.join(', ') || 'none'}`);
        }
      }

      // Step 2: Modify the data and PUT back
      console.log('\n══ Step 2: Modify isFormValid and PUT ══');

      dataContent.isFormValid = true;
      dataContent['Form is valid'] = true;

      const newBody = { data_content: JSON.stringify(dataContent) };

      requests.length = 0;

      // Use page.evaluate to make the PUT request with auth cookies
      const putResult = await page.evaluate(async (payload) => {
        try {
          const resp = await fetch(
            `/backend/files/8681df73-af32-45d6-8af1-30d5a7b0b6a1/data/WIZARD?ignore_formio_validation=1`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          );
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 300) };
        } catch (e: any) {
          return { status: -1, body: e.message };
        }
      }, newBody);

      console.log(`  PUT result: ${putResult.status}`);
      console.log(`  Response: ${putResult.body}`);

      if (putResult.status === 200) {
        // Step 3: Reload and check
        console.log('\n══ Step 3: Reload and check Approve button ══');
        await page.reload();
        await page.waitForTimeout(8000);

        // Navigate to Processing tab
        const procTab = page.locator('a:has-text("Processing")').first();
        await procTab.click();
        await page.waitForTimeout(3000);

        const approveBtn = page.locator('button:has-text("Approve documents check")');
        const isVisible = await approveBtn.isVisible({ timeout: 5000 }).catch(() => false);
        const isDisabled = isVisible ? await approveBtn.isDisabled() : null;

        console.log(`  Approve button visible: ${isVisible}`);
        console.log(`  Approve button disabled: ${isDisabled}`);

        // Check Formio state after reload
        const reloadFormio = await page.evaluate(() => {
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
        console.log(`  Formio after reload: ${reloadFormio}`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/80-after-api-validate.png`, fullPage: true });

        // If enabled, try clicking
        if (isVisible && !isDisabled) {
          console.log('\n══ Step 4: Click Approve! ══');
          await approveBtn.click();
          await page.waitForTimeout(10000);

          const afterUrl = page.url();
          console.log(`  After approve → URL: ${afterUrl}`);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/81-after-approve-click.png`, fullPage: true });
        } else if (isDisabled) {
          console.log('\n  Still disabled. Trying to check what gates the button...');

          // Check the FORMDATAVALIDATIONSTATUS component
          const validationStatus = await page.evaluate(() => {
            const formio = (window as any).Formio;
            if (!formio?.forms) return null;
            for (const k of Object.keys(formio.forms)) {
              const d = formio.forms[k]?.submission?.data;
              if (!d) continue;
              if (d.FORMDATAVALIDATIONSTATUS !== undefined) {
                return { form: k, value: d.FORMDATAVALIDATIONSTATUS };
              }
            }
            return null;
          });
          console.log(`  FORMDATAVALIDATIONSTATUS: ${JSON.stringify(validationStatus)}`);
        }
      }
    } catch (e: any) {
      console.log(`  Error parsing body: ${e.message?.substring(0, 80)}`);
    }
  } else {
    console.log('  No PUT request captured');

    // Try a direct API call approach without the save capture
    console.log('\n  Trying direct API approach...');

    // Get the current form data from Formio
    const formData = await page.evaluate(() => {
      const formio = (window as any).Formio;
      if (!formio?.forms) return null;
      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k];
        const d = form?.submission?.data;
        if (d && d.isFormValid !== undefined && d.isFormValid === false) {
          return { formId: k, data: d };
        }
      }
      return null;
    });

    if (formData) {
      console.log(`  Found system form: ${formData.formId} with ${Object.keys(formData.data).length} keys`);

      // Modify and PUT
      formData.data.isFormValid = true;
      formData.data['Form is valid'] = true;

      const putResult = await page.evaluate(async (data) => {
        try {
          const resp = await fetch(
            `/backend/files/8681df73-af32-45d6-8af1-30d5a7b0b6a1/data/WIZARD?ignore_formio_validation=1`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data_content: JSON.stringify(data) }),
            }
          );
          return { status: resp.status, body: (await resp.text()).substring(0, 300) };
        } catch (e: any) {
          return { status: -1, body: e.message };
        }
      }, formData.data);

      console.log(`  PUT result: ${putResult.status}`);
      console.log(`  Response: ${putResult.body}`);
    }
  }

  console.log('\n══ DONE ══');
});
