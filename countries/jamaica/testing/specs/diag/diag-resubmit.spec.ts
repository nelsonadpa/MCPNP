import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Diagnostic: Make a correction and resubmit via the "Send" tab
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '873484d6-b472-4151-9801-c27bcbf7f2a2';
const SCREENSHOT_DIR = '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback';

test('DIAG: Resubmit after corrections', async ({ page }) => {
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

  // Navigate to the form
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);

  // Confirm the correction alert is visible
  const corrAlert = page.locator('.correction-alert-heading, .correction-reason').first();
  if (await corrAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
    const alertText = await corrAlert.textContent();
    console.log(`Correction alert: "${alertText?.trim()}"`);
  } else {
    console.log('No correction alert visible');
  }

  // ══════════════════════════════════════════════════════
  // STEP 1: Make a small correction on the form
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 1: Make correction ===');

  // Click "Project overview" tab (first form tab with editable content)
  const projTab = page.locator('.nav-link:has-text("Project overview")').first();
  if (await projTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projTab.click();
    await page.waitForTimeout(3000);
  }

  // Try to find and modify an editable text field
  const textField = page.locator('input[name="data[applicantProposedNameOfZone]"]').first();
  if (await textField.isVisible({ timeout: 3000 }).catch(() => false)) {
    const currentVal = await textField.inputValue();
    console.log(`Current zone name: "${currentVal}"`);
    // Small modification
    await textField.clear();
    await textField.fill(currentVal.replace(/\s*\(CORRECTED\)/, '') + ' (CORRECTED)');
    const newVal = await textField.inputValue();
    console.log(`New zone name: "${newVal}"`);
    await page.waitForTimeout(1000);
  } else {
    console.log('Zone name field not found, trying any editable field...');
    const anyInput = page.locator('input[type="text"]:visible:not([readonly]):not([disabled])').first();
    if (await anyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const val = await anyInput.inputValue();
      await anyInput.clear();
      await anyInput.fill(val + ' CORRECTED');
      console.log(`Modified field: "${val}" → "${val} CORRECTED"`);
    }
  }

  // Save the form
  await formHelpers.saveDraft(page).catch(() => console.log('saveDraft not available'));
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-01-correction-made.png`, fullPage: true });

  // ══════════════════════════════════════════════════════
  // STEP 2: Navigate to "Send" tab
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 2: Navigate to Send tab ===');

  const sendTab = page.locator('.nav-link:has-text("Send"), .page-link:has-text("Send")').first();
  if (await sendTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sendTab.click();
    await page.waitForTimeout(5000);
    console.log('Navigated to Send tab');
  } else {
    console.log('Send tab not found');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-02-send-tab.png`, fullPage: true });

  // Catalog everything on the Send tab
  const sendTabContent = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
      .map((b: any) => ({
        text: b.textContent?.trim().substring(0, 100),
        disabled: b.disabled,
        classes: b.className?.substring(0, 80),
        type: b.type,
      }))
      .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(b.text));

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
      .filter((c: any) => c.offsetParent !== null)
      .map((c: any) => ({
        name: c.name,
        id: c.id,
        checked: c.checked,
        label: c.closest('label')?.textContent?.trim().substring(0, 80) ||
          document.querySelector(`label[for="${c.id}"]`)?.textContent?.trim().substring(0, 80) || '',
      }));

    const text = document.querySelector('.formio-component')?.textContent?.trim().substring(0, 500);

    return { buttons, checkboxes, text };
  });

  console.log(`\nSend tab buttons (${sendTabContent.buttons.length}):`);
  for (const b of sendTabContent.buttons) {
    console.log(`  "${b.text}" disabled=${b.disabled} type="${b.type}" class="${b.classes?.substring(0, 40)}"`);
  }
  console.log(`\nCheckboxes (${sendTabContent.checkboxes.length}):`);
  for (const c of sendTabContent.checkboxes) {
    console.log(`  ${c.checked ? '☑' : '☐'} "${c.label}" name="${c.name}"`);
  }
  console.log(`\nPage text: "${sendTabContent.text?.substring(0, 300)}"`);

  // ══════════════════════════════════════════════════════
  // STEP 3: Handle consents and validate
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 3: Handle consents + validate ===');

  // Check all consent checkboxes
  const checkboxes = page.locator('input[type="checkbox"]:visible');
  const cbCount = await checkboxes.count();
  for (let i = 0; i < cbCount; i++) {
    const isChecked = await checkboxes.nth(i).isChecked().catch(() => false);
    if (!isChecked) {
      await checkboxes.nth(i).check({ force: true }).catch(() => {});
    }
  }
  console.log(`Handled ${cbCount} checkboxes`);

  // Try "Validate the form" button
  const validateBtn = page.locator('button:has-text("Validate the form")').first();
  if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking "Validate the form"...');
    await validateBtn.click();
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-03-validated.png`, fullPage: true });
  }

  // Try "Validate send page" button
  const validateSendBtn = page.locator('button:has-text("Validate send page")').first();
  if (await validateSendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking "Validate send page"...');
    await validateSendBtn.click();
    await page.waitForTimeout(10000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-04-validate-send.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════
  // STEP 4: Submit / Resubmit
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 4: Submit ===');

  // Check buttons again after validation
  const postValidateButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
      .map((b: any) => ({
        text: b.textContent?.trim().substring(0, 100),
        disabled: b.disabled,
      }))
      .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(b.text));
  });
  console.log('Post-validation buttons:');
  for (const b of postValidateButtons) {
    console.log(`  "${b.text}" disabled=${b.disabled}`);
  }

  // Look for submit
  const submitSelectors = [
    'button:has-text("Submit application")',
    'button:has-text("Resubmit application")',
    'button:has-text("Resubmit")',
    'button:has-text("Submit corrections")',
    'button:has-text("Submit")',
  ];

  let submitted = false;
  for (const sel of submitSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const txt = (await btn.textContent())?.trim();
      const dis = await btn.isDisabled();
      console.log(`Found submit: "${txt}" disabled=${dis}`);
      if (!dis) {
        // Check consents one more time
        const allCb = page.locator('input[type="checkbox"]:visible');
        const acCount = await allCb.count();
        for (let i = 0; i < acCount; i++) {
          await allCb.nth(i).check({ force: true }).catch(() => {});
        }

        console.log(`Clicking "${txt}"...`);
        await btn.click();
        await page.waitForTimeout(10000);

        // Handle confirmation dialog
        const confirmed = await boHelpers.handleConfirmation(page);
        console.log(`Confirmation handled: ${confirmed}`);
        await page.waitForTimeout(5000);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-05-submitted.png`, fullPage: true });
        submitted = true;
        break;
      }
    }
  }

  if (!submitted) {
    console.log('No submit button found or all disabled');
    // Screenshot for debugging
    await page.screenshot({ path: `${SCREENSHOT_DIR}/resub-05-no-submit.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════
  // STEP 5: Verify final state
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 5: Verify final state ===');

  await page.waitForTimeout(3000);

  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nFinal tasks (${finalTasks.length}):`);
  for (const t of finalTasks) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  const finalState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: 'fetch failed' };
    const data = await resp.json();
    return { state: data.state, processStatus: data.process_status };
  }, FILE_ID);
  console.log(`\nFinal file state: ${JSON.stringify(finalState)}`);

  const applicantTask = finalTasks.find(t => t.camundaName === 'applicant');
  if (applicantTask?.endTime) {
    console.log('\n*** SUCCESS: Applicant task completed — corrections resubmitted! ***');
  } else {
    console.log('\n*** Applicant task still pending ***');
  }

  // Check if legalReview was recreated (new instance)
  const lrTasks = finalTasks.filter(t => t.camundaName === 'legalReview');
  console.log(`legalReview instances: ${lrTasks.length}`);
  for (const lr of lrTasks) {
    console.log(`  ${lr.endTime ? 'DONE' : 'PEND'} — ${lr.status} — id=${lr.id}`);
  }

  console.log('\n=== RESUBMIT DIAGNOSTIC COMPLETE ===');
});
