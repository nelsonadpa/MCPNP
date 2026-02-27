import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Diagnostic: denialLetter role — failed with validation error
 * Has: "Download SEZ Denial letter" button + "Approve" button
 * Need to understand what validation is required
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: denialLetter role', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File: ${JSON.stringify(fileInfo)}`);
  const processId = fileInfo.processId;

  const tasks = await boHelpers.getProcessTasks(page, processId);
  const denialTask = tasks.find(t => t.camundaName === 'denialLetter' && !t.endTime);
  if (!denialTask) { console.log('No denialLetter task pending'); test.skip(); return; }

  await boHelpers.navigateToRole(page, SERVICE_ID, 'denialLetter', processId, FILE_ID);
  await page.waitForTimeout(6000);

  // Processing tab
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // List all visible buttons
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
      .map((b: any) => ({
        text: b.textContent?.trim().substring(0, 100),
        disabled: b.disabled,
        classes: b.className?.substring(0, 100),
        type: b.type,
      }))
      .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP', '×'].includes(b.text));
  });
  console.log('\nButtons:');
  for (const b of btns) {
    console.log(`  "${b.text}" disabled=${b.disabled} type=${b.type} class="${b.classes?.substring(0, 50)}"`);
  }

  // Check Formio component tree for required fields
  const requiredFields = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const c = comp.component;
        if (!c) { if (comp.components) for (const cc of comp.components) walk(cc); return; }
        const cKey = c.key || '';
        const cType = c.type || '';
        if (cType === 'button' || cType === 'panel' || cType === 'tabs' || cType === 'columns' ||
            cType === 'hidden' || cType === 'htmlelement') {
          if (comp.components) for (const cc of comp.components) walk(cc);
          if (comp.columns) for (const col of comp.columns) {
            if (col?.components) for (const cc of col.components) walk(cc);
          }
          return;
        }
        if (c.validate?.required || c.required) {
          results.push({
            key: cKey,
            type: cType,
            label: c.label?.substring(0, 60),
            required: true,
            hidden: c.hidden,
            visible: comp.visible,
            value: comp.dataValue !== undefined ? JSON.stringify(comp.dataValue)?.substring(0, 60) : 'undefined',
          });
        }
        if (comp.components) for (const cc of comp.components) walk(cc);
        if (comp.columns) for (const col of comp.columns) {
          if (col?.components) for (const cc of col.components) walk(cc);
        }
      };
      walk(form.root);
    }
    return results;
  });

  console.log(`\nRequired fields (${requiredFields.length}):`);
  for (const f of requiredFields) {
    console.log(`  ${f.visible ? '👁' : '🔒'} ${f.type}:"${f.key}" label="${f.label}" value=${f.value}`);
  }

  // Look for file upload components
  const uploadComponents = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const c = comp.component;
        if (c?.type === 'file') {
          results.push({
            key: c.key,
            label: c.label?.substring(0, 60),
            hidden: c.hidden,
            visible: comp.visible,
            required: c.validate?.required || false,
            value: comp.dataValue !== undefined ? JSON.stringify(comp.dataValue)?.substring(0, 60) : 'undefined',
          });
        }
        if (comp.components) for (const cc of comp.components) walk(cc);
        if (comp.columns) for (const col of comp.columns) {
          if (col?.components) for (const cc of col.components) walk(cc);
        }
      };
      walk(form.root);
    }
    return results;
  });

  console.log(`\nFile upload components (${uploadComponents.length}):`);
  for (const f of uploadComponents) {
    console.log(`  ${f.visible ? '👁' : '🔒'} "${f.key}" label="${f.label}" required=${f.required} value=${f.value}`);
  }

  // Click "Download SEZ Denial letter" and see what happens
  console.log('\n  Clicking "Download SEZ Denial letter"...');
  const downloadBtn = page.locator('button:has-text("Download SEZ Denial letter")').first();
  if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Set up download handler
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      downloadBtn.click(),
    ]);
    await page.waitForTimeout(5000);

    if (download) {
      console.log(`  Download triggered: ${download.suggestedFilename()}`);
    } else {
      console.log('  No download event — might generate inline');
    }

    // Check if a file was generated in the form data
    const postDownloadUploads = await page.evaluate(() => {
      const roleForm = (window as any).roleForm;
      if (!roleForm?.submission?.data) return {};
      const data = roleForm.submission.data;
      return Object.keys(data)
        .filter(k => {
          const lk = k.toLowerCase();
          return lk.includes('denial') || lk.includes('letter') || lk.includes('sez') ||
                 lk.includes('document') || lk.includes('file') || lk.includes('upload');
        })
        .reduce((acc: any, k: string) => {
          acc[k] = JSON.stringify(data[k])?.substring(0, 100);
          return acc;
        }, {});
    });
    console.log(`  Post-download form data:`, JSON.stringify(postDownloadUploads, null, 2)?.substring(0, 500));
  }

  // Try clicking Approve again after download
  console.log('\n  Trying Approve after download...');
  await formHelpers.enableFormValidation(page);
  await formHelpers.saveDraft(page);
  await page.waitForTimeout(3000);

  const approveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
  if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`  Approve disabled: ${await approveBtn.isDisabled()}`);
    await approveBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(5000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(10000);

    // Check for toast errors
    const toasts = await boHelpers.getToastMessages(page);
    console.log(`  Toasts: ${JSON.stringify(toasts)}`);
  }

  await page.screenshot({ path: '/tmp/denial-letter-post-approve.png', fullPage: true });

  // Check final task status
  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  const denialAfter = finalTasks.find(t => t.camundaName === 'denialLetter');
  console.log(`\n  denialLetter status: ${denialAfter?.status}, endTime: ${denialAfter?.endTime}`);

  const finalPending = finalTasks.filter(t => !t.endTime);
  console.log(`  Remaining pending: ${finalPending.map(t => t.camundaName).join(', ') || 'none'}`);

  const processStatus = await boHelpers.getProcessStatus(page, processId);
  console.log(`  Process: ended=${processStatus.ended} status=${processStatus.processStatus}`);

  console.log('\n\nDiagnostic complete.');
});
