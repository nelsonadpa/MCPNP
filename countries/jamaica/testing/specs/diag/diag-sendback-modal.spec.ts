import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';

/**
 * Diagnostic: Complete the send-back modal flow on legalReview
 *
 * 1. Navigate to legalReview Processing tab
 * 2. Click "Sent back to applicant" (opens modal)
 * 3. Select reason from dropdown
 * 4. Click "Sent back to applicant" inside modal
 * 5. Click Save if needed
 * 6. Verify task status change
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '873484d6-b472-4151-9801-c27bcbf7f2a2';
const SCREENSHOT_DIR = '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback';

test('DIAG: Complete send-back modal flow', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File: ${JSON.stringify(fileInfo)}`);
  if (fileInfo.error || !fileInfo.processId) { test.skip(); return; }
  const processId = fileInfo.processId;

  // Verify legalReview is still pending
  const tasks = await boHelpers.getProcessTasks(page, processId);
  const lr = tasks.find(t => t.camundaName === 'legalReview');
  console.log(`legalReview: ${lr ? (lr.endTime ? 'DONE' : 'PENDING') : 'NOT FOUND'}`);
  if (!lr || lr.endTime) {
    console.log('legalReview not available');
    test.skip();
    return;
  }

  // Navigate to legalReview
  const roleUrl = `/part-b/${SERVICE_ID}/legalReview/${processId}?file_id=${FILE_ID}`;
  await page.goto(roleUrl);
  await page.waitForTimeout(6000);

  // Go to Processing tab
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-01-before.png`, fullPage: true });

  // ══════════════════════════════════════════════════════
  // STEP 1: Click the "Sent back to applicant" button (opens modal)
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 1: Click open-modal button ===');

  // The first button has class "open-modal-button" — this is the one that opens the modal
  const openModalBtn = page.locator('button.open-modal-button:has-text("Sent back to applicant")').first();
  if (!await openModalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Fallback to any "Sent back to applicant" button
    const fallback = page.locator('button:has-text("Sent back to applicant")').first();
    await fallback.click();
  } else {
    await openModalBtn.click();
  }
  console.log('Clicked! Waiting for modal...');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-02-opened.png`, fullPage: true });

  // ══════════════════════════════════════════════════════
  // STEP 2: Explore modal contents
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 2: Explore modal contents ===');

  // Check what's inside the formio-dialog-content
  const dialogContent = await page.evaluate(() => {
    const dialog = document.querySelector('.formio-dialog-content');
    if (!dialog) return { found: false };

    return {
      found: true,
      html: dialog.innerHTML?.substring(0, 2000),
      // Find all interactive elements
      selects: Array.from(dialog.querySelectorAll('select')).map((s: any) => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map((o: any) => ({ value: o.value, text: o.text })),
      })),
      inputs: Array.from(dialog.querySelectorAll('input:not([type="hidden"])')).map((i: any) => ({
        type: i.type,
        name: i.name,
        id: i.id,
        visible: i.offsetParent !== null,
        value: i.value?.substring(0, 50),
        placeholder: i.placeholder?.substring(0, 50),
        classes: i.className?.substring(0, 80),
      })),
      textareas: Array.from(dialog.querySelectorAll('textarea')).map((t: any) => ({
        name: t.name,
        id: t.id,
        visible: t.offsetParent !== null,
        value: t.value?.substring(0, 50),
      })),
      buttons: Array.from(dialog.querySelectorAll('button')).map((b: any) => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: b.disabled,
        classes: b.className?.substring(0, 80),
        type: b.type,
      })),
      // Choices.js containers (custom selects)
      choicesContainers: Array.from(dialog.querySelectorAll('.choices, .choices__inner, [class*="choices"]')).map((c: any) => ({
        classes: c.className?.substring(0, 80),
        text: c.textContent?.trim().substring(0, 100),
      })),
      // Form.io select components
      formioSelects: Array.from(dialog.querySelectorAll('[class*="formio-component-select"]')).map((s: any) => ({
        classes: s.className?.substring(0, 80),
        text: s.textContent?.trim().substring(0, 100),
      })),
      // Labels
      labels: Array.from(dialog.querySelectorAll('label')).map((l: any) => ({
        text: l.textContent?.trim().substring(0, 60),
        for: l.htmlFor || '',
      })),
    };
  });

  console.log(`Dialog found: ${dialogContent.found}`);
  if (dialogContent.found) {
    console.log(`  Selects: ${JSON.stringify(dialogContent.selects)}`);
    console.log(`  Inputs: ${JSON.stringify(dialogContent.inputs)}`);
    console.log(`  Textareas: ${JSON.stringify(dialogContent.textareas)}`);
    console.log(`  Buttons: ${JSON.stringify(dialogContent.buttons)}`);
    console.log(`  Choices.js: ${JSON.stringify(dialogContent.choicesContainers)}`);
    console.log(`  Formio selects: ${JSON.stringify(dialogContent.formioSelects)}`);
    console.log(`  Labels: ${JSON.stringify(dialogContent.labels)}`);
    console.log(`  HTML (first 1500): ${dialogContent.html?.substring(0, 1500)}`);
  }

  // ══════════════════════════════════════════════════════
  // STEP 3: Select a reason from the dropdown
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 3: Select reason ===');

  // The dropdown is likely a Choices.js select within the dialog
  // Try clicking the Choices.js container to open it
  const dialogEl = page.locator('.formio-dialog-content');

  // Method 1: Click the Choices.js dropdown within the dialog
  const choicesDropdown = dialogEl.locator('.choices, .choices__inner').first();
  if (await choicesDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Found Choices.js dropdown — clicking to open...');
    await choicesDropdown.click();
    await page.waitForTimeout(1000);

    // Look at dropdown options
    const options = await page.evaluate(() => {
      const items = document.querySelectorAll('.choices__list--dropdown .choices__item');
      return Array.from(items).map((i: any) => ({
        text: i.textContent?.trim(),
        value: i.getAttribute('data-value'),
        visible: i.offsetParent !== null,
      }));
    });
    console.log(`Choices options: ${JSON.stringify(options)}`);

    // Select first non-empty option (e.g., "Data is invalid")
    const firstOption = options.find(o => o.text && o.text !== '');
    if (firstOption) {
      console.log(`Selecting: "${firstOption.text}"`);
      const optionEl = page.locator(`.choices__list--dropdown .choices__item`).filter({ hasText: firstOption.text }).first();
      await optionEl.click();
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('No Choices.js — trying native select or Formio API...');

    // Method 2: Try native <select> within dialog
    const nativeSelect = dialogEl.locator('select').first();
    if (await nativeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Found native select');
      await nativeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    } else {
      // Method 3: Set via Formio API
      console.log('Trying Formio API to set rejection reason...');
      const apiResult = await page.evaluate(() => {
        const roleForm = (window as any).roleForm;
        if (!roleForm?.submission?.data) return 'No roleForm';

        // Look for reject/reason keys in the data
        const data = roleForm.submission.data;
        const reasonKeys = Object.keys(data).filter(k => {
          const lk = k.toLowerCase();
          return lk.includes('reject') && lk.includes('reason') ||
            lk.includes('sendback') || lk.includes('sentback');
        });

        const results: string[] = [];
        // Also try to set via Formio components
        const formio = (window as any).Formio;
        if (formio?.forms) {
          for (const fk of Object.keys(formio.forms)) {
            const form = formio.forms[fk];
            if (!form?.root) continue;
            const walk = (comp: any) => {
              if (!comp) return;
              const cKey = comp.component?.key || comp.key || '';
              if (cKey.toLowerCase().includes('reason') || cKey.toLowerCase().includes('reject')) {
                results.push(`Found: ${cKey} (${comp.component?.type || 'unknown'})`);
                if (comp.setValue) {
                  comp.setValue('Data is invalid');
                  if (comp.triggerChange) comp.triggerChange();
                  results.push(`Set ${cKey} = "Data is invalid"`);
                }
              }
              if (comp.components) for (const c of comp.components) walk(c);
              if (comp.columns) for (const col of comp.columns) {
                if (col?.components) for (const c of col.components) walk(c);
              }
            };
            walk(form.root);
          }
        }
        return results.join(', ') || 'No reason fields found';
      });
      console.log(`Formio API: ${apiResult}`);
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-03-reason-selected.png`, fullPage: true });

  // ══════════════════════════════════════════════════════
  // STEP 4: Click "Sent back to applicant" inside the modal
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 4: Click action button inside modal ===');

  // The modal has its own "Sent back to applicant" button
  const modalActionBtn = dialogEl.locator('button:has-text("Sent back to applicant")').first();
  if (await modalActionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const btnText = await modalActionBtn.textContent();
    const btnDisabled = await modalActionBtn.isDisabled();
    console.log(`Modal action button: "${btnText?.trim()}" disabled=${btnDisabled}`);

    if (btnDisabled) {
      console.log('Button disabled — trying to enable...');
      // Maybe need to save first
      const saveBtn = dialogEl.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    await modalActionBtn.click();
    console.log('Clicked modal action button!');
    await page.waitForTimeout(5000);
  } else {
    console.log('No action button in modal — clicking Save...');
    const saveBtn = dialogEl.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-04-after-action.png`, fullPage: true });

  // Handle any confirmation
  await boHelpers.handleConfirmation(page);
  await page.waitForTimeout(3000);

  // ══════════════════════════════════════════════════════
  // STEP 5: Click Save if dialog is still open
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 5: Check if dialog still open, save ===');

  const dialogStillOpen = await page.locator('.formio-dialog-content').isVisible().catch(() => false);
  console.log(`Dialog still open: ${dialogStillOpen}`);

  if (dialogStillOpen) {
    const saveBtn = page.locator('.formio-dialog-content button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Save in dialog...');
      await saveBtn.click();
      await page.waitForTimeout(5000);
    }
    // Handle any confirmation after save
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(3000);
  }

  // Also try the outer Save button
  const outerSave = page.locator('button.formio-dialog-button:has-text("Save")').first();
  if (await outerSave.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Clicking outer Save button...');
    await outerSave.click();
    await page.waitForTimeout(5000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-05-saved.png`, fullPage: true });

  // ══════════════════════════════════════════════════════
  // STEP 6: Verify task status
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 6: Verify task status ===');

  const tasksAfter = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nTasks after send-back:`);
  for (const t of tasksAfter) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  const lrAfter = tasksAfter.find(t => t.camundaName === 'legalReview');
  const compInfo = tasksAfter.find(t =>
    t.camundaName.includes('complement') || t.camundaName.includes('Complement') ||
    t.camundaName.includes('correction') || t.camundaName.includes('Correction')
  );
  const newTasks = tasksAfter.filter(t => !tasks.some(ot => ot.id === t.id));

  console.log(`\nlegalReview status: ${lrAfter?.endTime ? 'DONE' : 'PENDING'}`);
  console.log(`Complementary info: ${compInfo ? JSON.stringify(compInfo) : 'NOT FOUND'}`);
  console.log(`New tasks: ${newTasks.length > 0 ? JSON.stringify(newTasks) : 'NONE'}`);

  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return 'error';
    const data = await resp.json();
    return { state: data.state, processStatus: data.process_status };
  }, FILE_ID);
  console.log(`File state: ${JSON.stringify(fileState)}`);

  if (lrAfter?.endTime) {
    console.log('\n*** SUCCESS: legalReview task completed after send-back! ***');
  } else {
    console.log('\n*** legalReview still pending — send-back may not have fully executed ***');
    console.log('Check screenshots for any remaining dialogs or errors.');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-06-final.png`, fullPage: true });

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
});
