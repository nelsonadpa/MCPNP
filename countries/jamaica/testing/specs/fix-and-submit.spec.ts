import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const FILE_ID = '9b7143dc-4977-4d93-bccb-94c09e216d89';
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');

function ensureTestPdf() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const p = path.join(DOCS_DIR, 'test-doc.pdf');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF`);
  }
  return p;
}

test('Fix missing fields and submit MAIN file', async ({ page }) => {
  test.setTimeout(300_000);
  const testPdf = ensureTestPdf();
  
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(10000);
  
  // 1. Fix "Unit is required" — set via Formio API
  console.log('Setting Unit field...');
  await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return;
    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.key === 'applicantUnit') {
          // Set to "Acres" or first available option
          comp.setValue({ key: 'acres', value: 'Acres' });
          comp.triggerChange?.();
        }
      });
    }
  });
  await page.waitForTimeout(1000);
  
  // 2. Upload missing documents using Formio file API
  // Find all browse links that don't have files yet and upload to them
  console.log('Uploading to empty file fields...');
  
  // Make ALL file containers visible
  await page.evaluate(() => {
    document.querySelectorAll('[style*="display: none"], .tab-pane:not(.active)').forEach(el => {
      (el as HTMLElement).style.display = 'block';
      el.classList?.add('active', 'show');
    });
  });
  await page.waitForTimeout(2000);
  
  // Find browse links without uploaded files
  const emptyBrowse = await page.evaluate(() => {
    const results: number[] = [];
    const links = document.querySelectorAll('a.browse');
    links.forEach((link, i) => {
      const comp = link.closest('[class*="formio-component-"]');
      // Check if this component already has uploaded files
      const hasFiles = comp?.querySelector('.file-name, .formio-file-name, [ref="fileStatusRemove"]');
      if (!hasFiles) results.push(i);
    });
    return results;
  });
  console.log(`Empty file fields: ${emptyBrowse.length} / total browse links`);
  
  // Upload to each empty browse link
  for (const idx of emptyBrowse) {
    try {
      const link = page.locator('a.browse').nth(idx);
      await link.scrollIntoViewIfNeeded().catch(() => {});
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(testPdf);
      await page.waitForTimeout(2000);
      console.log(`  Uploaded to browse[${idx}] ✓`);
    } catch {
      // Try JS-level click fallback
      try {
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          page.evaluate((i: number) => {
            const links = document.querySelectorAll('a.browse');
            (links[i] as HTMLElement)?.click();
          }, idx),
        ]);
        await fc.setFiles(testPdf);
        await page.waitForTimeout(2000);
        console.log(`  Uploaded to browse[${idx}] via JS ✓`);
      } catch {
        console.log(`  browse[${idx}] failed`);
      }
    }
  }
  
  // 3. Save draft
  console.log('Saving...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(5000);
  
  // 4. Go to Send tab, check consents
  await page.locator('text=Send').first().click().catch(() => {});
  await page.waitForTimeout(3000);
  
  const cbs = page.locator('input[type="checkbox"]:visible');
  for (let i = 0; i < await cbs.count(); i++) {
    await cbs.nth(i).check().catch(() => {});
  }
  console.log(`Consents: ${await cbs.count()}`);
  
  // 5. Click Submit
  const submitBtn = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Clicking Submit...');
    await submitBtn.click();
    await page.waitForTimeout(15000);
    
    // Dismiss dialogs
    for (const label of ['OK', 'Confirm', 'Yes']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(3000);
      }
    }
  }
  
  await page.waitForTimeout(5000);
  
  // Check state
  const state = await page.evaluate(async (fid: string) => {
    const r = await fetch(`/backend/files/${fid}`);
    const d = await r.json();
    return { state: d.state, processId: d.process_instance_id };
  }, FILE_ID);
  console.log(`\n=== STATE: ${JSON.stringify(state)} ===`);
  
  if (state.processId) {
    const ids = { fileId: FILE_ID, processId: state.processId, serviceId: SERVICE_ID, timestamp: new Date().toISOString() };
    fs.writeFileSync(path.resolve(__dirname, '../test-data/main-submitted-file.json'), JSON.stringify(ids, null, 2));
    console.log('SUCCESS — IDs saved!');
  } else {
    // Log remaining errors
    const errors = await page.locator('.formio-error-wrapper:visible, .text-danger:visible').allTextContents();
    const unique = [...new Set(errors.map(e => e.trim().replace(/\s+/g, ' ').substring(0, 100)).filter(Boolean))];
    console.log(`Remaining errors (${unique.length}):`);
    unique.forEach(e => console.log(`  - ${e}`));
  }
});
