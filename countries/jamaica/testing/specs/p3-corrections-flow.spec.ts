import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import * as formHelpers from '../helpers/form-helpers';
import * as boHelpers from '../helpers/backoffice-helpers';

/**
 * Phase 3 — Corrections (Send-Back) Flow
 *
 * Tests the full corrections lifecycle:
 * 1. Back-office officer approves Documents Check (if pending)
 * 2. Back-office officer sends back to applicant from legalReview via modal dialog
 * 3. Front-office applicant sees correction alert → makes changes → resubmits
 * 4. Verifies workflow returns to Documents Check
 *
 * PREREQUISITE: Run p1-submit-complete.spec.ts first to create a submitted
 * application, then set FILE_ID below. The process ID is auto-discovered.
 *
 * Key discovery: Send-back uses a Formio modal dialog pattern:
 * - Click "Sent back to applicant" (open-modal-button) → modal opens
 * - Select reason from Choices.js dropdown
 * - Click "Sent back to applicant" button inside the modal
 * - Task changes to filedecline, new "applicant" task is created
 *
 * Run:
 *   npx playwright test specs/p3-corrections-flow.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p3-corrections');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';

// ═══════════════════════════════════════════════════════════════
// SET THIS — file_id of a submitted application (from P1 output)
// Process ID is auto-discovered from /backend/files/{fileId}
// ═══════════════════════════════════════════════════════════════
const FILE_ID = '873484d6-b472-4151-9801-c27bcbf7f2a2';

test('P3-CORRECTIONS: Send-back and resubmission flow', async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  if (!FILE_ID) {
    console.log('ERROR: FILE_ID is not set. Run p1-submit-complete.spec.ts first.');
    test.skip();
    return;
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 0: Discover process ID
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 0: Discover process ID');
  console.log('='.repeat(60));

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`  File: ${JSON.stringify(fileInfo)}`);
  if (fileInfo.error || !fileInfo.processId) {
    console.log('  ERROR: Could not fetch file info or no processId.');
    test.skip();
    return;
  }
  if (fileInfo.state === 'NEW') {
    console.log('  ERROR: Application not submitted (state=NEW).');
    test.skip();
    return;
  }

  const processId = fileInfo.processId;
  console.log(`  File ID: ${FILE_ID}`);
  console.log(`  Process ID: ${processId}`);
  console.log(`  State: ${fileInfo.state}`);

  // Get current tasks
  const initialTasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\n  Tasks (${initialTasks.length}):`);
  for (const t of initialTasks) {
    console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} (${t.shortname}) — ${t.status}`);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 1: Approve Documents Check (if pending)
  // ══════════════════════════════════════════════════════════════
  const reviewTask = initialTasks.find(t => t.camundaName === 'review' && !t.endTime);

  if (reviewTask) {
    console.log('\n' + '='.repeat(60));
    console.log('  STEP 1: Approve Documents Check');
    console.log('='.repeat(60));

    await boHelpers.navigateToRole(page, SERVICE_ID, 'review', processId, FILE_ID);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-doccheck.png`, fullPage: true });

    // Validate all documents
    const docsTab = page.locator('.nav-link:has-text("Documents")').first();
    if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(2000);
    }

    try {
      const valResult = await boHelpers.validateAllDocuments(page);
      console.log(`  Validated docs: ${JSON.stringify(valResult)}`);
    } catch (e) {
      console.log(`  Doc validation: ${e}`);
    }

    await formHelpers.enableFormValidation(page);
    await formHelpers.saveDraft(page);
    await page.waitForTimeout(2000);

    // Click Processing tab and approve
    const procTab = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(2000);
    }

    const approveBtn = page.locator('button:has-text("Approve documents check")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await approveBtn.isDisabled()) {
        await formHelpers.enableFormValidation(page);
        await formHelpers.saveDraft(page);
        await page.waitForTimeout(2000);
      }
      await approveBtn.click({ timeout: 10_000 });
      await page.waitForTimeout(5000);
      await boHelpers.handleConfirmation(page);
      await page.waitForTimeout(5000);
      console.log('  Documents Check approved');
    } else {
      // Fallback: use findActionButton
      const actionBtn = await boHelpers.findActionButton(page);
      if (actionBtn) {
        console.log(`  Using action button: "${actionBtn.text}"`);
        await actionBtn.locator.click({ timeout: 10_000 });
        await page.waitForTimeout(5000);
        await boHelpers.handleConfirmation(page);
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-doccheck-approved.png`, fullPage: true });
  } else {
    console.log('\n  Documents Check already completed — skipping Step 1');
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Send back from legalReview (modal dialog flow)
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 2: Send back from legalReview');
  console.log('='.repeat(60));

  // Verify legalReview is pending
  const tasksForSendback = await boHelpers.getProcessTasks(page, processId);
  const lrTask = tasksForSendback.find(t => t.camundaName === 'legalReview' && !t.endTime);

  if (!lrTask) {
    console.log('  legalReview not pending — checking if already sent back');
    const applicantTask = tasksForSendback.find(t => t.camundaName === 'applicant' && !t.endTime);
    if (applicantTask) {
      console.log('  Applicant task already exists — skipping to Step 3');
    } else {
      console.log('  No legalReview or applicant task — cannot proceed');
      // Try first pending evaluation role
      const pendingEvals = tasksForSendback.filter(t => !t.endTime && t.camundaName !== 'review');
      if (pendingEvals.length === 0) { test.skip(); return; }
      console.log(`  Using ${pendingEvals[0].camundaName} instead`);
    }
  }

  if (lrTask) {
    // Navigate to legalReview
    await boHelpers.navigateToRole(page, SERVICE_ID, 'legalReview', processId, FILE_ID);
    await page.waitForTimeout(6000);

    // Go to Processing tab
    const procTab = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-legalreview-processing.png`, fullPage: true });

    // Click "Sent back to applicant" (opens modal)
    const openModalBtn = page.locator('button.open-modal-button:has-text("Sent back to applicant")').first();
    const fallbackBtn = page.locator('button:has-text("Sent back to applicant")').first();

    const targetBtn = await openModalBtn.isVisible({ timeout: 3000 }).catch(() => false)
      ? openModalBtn : fallbackBtn;

    console.log('  Clicking "Sent back to applicant" to open modal...');
    await targetBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-sendback-modal.png`, fullPage: true });

    // Verify modal opened
    const dialog = page.locator('.formio-dialog-content');
    expect(await dialog.isVisible({ timeout: 5000 })).toBeTruthy();
    console.log('  Modal opened');

    // Select reason from Choices.js dropdown
    const choicesDropdown = dialog.locator('.choices, .choices__inner').first();
    if (await choicesDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await choicesDropdown.click();
      await page.waitForTimeout(1000);

      // Select "Data is invalid"
      const reasonOption = page.locator('.choices__list--dropdown .choices__item')
        .filter({ hasText: 'Data is invalid' }).first();
      if (await reasonOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reasonOption.click();
        console.log('  Selected reason: "Data is invalid"');
      } else {
        // Fallback: select first available option
        const firstOption = page.locator('.choices__list--dropdown .choices__item').first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          const optText = await firstOption.textContent();
          await firstOption.click();
          console.log(`  Selected reason: "${optText?.trim()}"`);
        }
      }
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-reason-selected.png`, fullPage: true });

    // Click "Sent back to applicant" button inside the modal
    const modalActionBtn = dialog.locator('button:has-text("Sent back to applicant")').first();
    expect(await modalActionBtn.isVisible({ timeout: 5000 })).toBeTruthy();
    console.log('  Clicking modal action button...');
    await modalActionBtn.click();
    await page.waitForTimeout(5000);

    // Handle any confirmation
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-sendback-executed.png`, fullPage: true });

    // Verify: legalReview should be DONE with filedecline, applicant task should exist
    const tasksAfterSendback = await boHelpers.getProcessTasks(page, processId);
    console.log('\n  Tasks after send-back:');
    for (const t of tasksAfterSendback) {
      console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} — ${t.status}`);
    }

    const lrAfter = tasksAfterSendback.find(t => t.camundaName === 'legalReview');
    expect(lrAfter?.endTime).toBeTruthy();
    expect(lrAfter?.status).toBe('filedecline');
    console.log('  legalReview: DONE (filedecline)');

    const applicantTask = tasksAfterSendback.find(t => t.camundaName === 'applicant' && !t.endTime);
    expect(applicantTask).toBeTruthy();
    console.log(`  Applicant task created: ${applicantTask!.id}`);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Front-office — Applicant sees corrections alert
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 3: Front-office — Corrections view');
  console.log('='.repeat(60));

  // Verify file state is filedecline
  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`  File state: ${fileState.state}`);
  expect(fileState.state).toBe('filedecline');

  // Navigate to applicant form
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-applicant-view.png`, fullPage: true });

  // Verify correction alert is visible
  const corrAlert = page.locator('.correction-alert-heading').first();
  if (await corrAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
    const alertText = await corrAlert.textContent();
    console.log(`  Correction alert: "${alertText?.trim()}"`);
  }

  const corrReason = page.locator('.correction-reason').first();
  if (await corrReason.isVisible({ timeout: 3000 }).catch(() => false)) {
    const reasonText = await corrReason.textContent();
    console.log(`  Correction reason: "${reasonText?.trim()}"`);
    expect(reasonText?.trim()).toContain('Data is invalid');
  }

  // Check editability
  const editableCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
      .filter((el: any) => el.offsetParent !== null && !el.disabled && !el.readOnly)
      .length;
  });
  console.log(`  Editable fields: ${editableCount}`);
  expect(editableCount).toBeGreaterThan(0);

  // ══════════════════════════════════════════════════════════════
  // STEP 4: Make correction and resubmit
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 4: Make correction and resubmit');
  console.log('='.repeat(60));

  // Navigate to "Project overview" tab to make a correction
  const projTab = page.locator('.nav-link:has-text("Project overview")').first();
  if (await projTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projTab.click();
    await page.waitForTimeout(3000);
  }

  // Modify the zone name field
  const zoneNameField = page.locator('input[name="data[applicantProposedNameOfZone]"]').first();
  if (await zoneNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    const currentVal = await zoneNameField.inputValue();
    const newVal = currentVal.replace(/\s*\(CORRECTED\)/, '') + ' (CORRECTED)';
    await zoneNameField.clear();
    await zoneNameField.fill(newVal);
    console.log(`  Zone name: "${currentVal}" → "${newVal}"`);
  } else {
    // Fallback: modify any editable text field
    const anyField = page.locator('input[type="text"]:visible:not([readonly]):not([disabled])').first();
    if (await anyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      const val = await anyField.inputValue();
      await anyField.clear();
      await anyField.fill(val + ' (CORRECTED)');
      console.log(`  Modified field: "${val}" → "${val} (CORRECTED)"`);
    }
  }

  // Save draft
  await formHelpers.saveDraft(page).catch(() => {});
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-correction-made.png`, fullPage: true });

  // Navigate to "Send" tab
  const sendTab = page.locator('.nav-link:has-text("Send"), .page-link:has-text("Send")').first();
  expect(await sendTab.isVisible({ timeout: 5000 })).toBeTruthy();
  await sendTab.click();
  await page.waitForTimeout(5000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/09-send-tab.png`, fullPage: true });

  // Check consent checkboxes
  const consents = page.locator('input[type="checkbox"]:visible');
  const cbCount = await consents.count();
  for (let i = 0; i < cbCount; i++) {
    const isChecked = await consents.nth(i).isChecked().catch(() => false);
    if (!isChecked) {
      await consents.nth(i).check({ force: true }).catch(() => {});
    }
  }
  console.log(`  Consent checkboxes: ${cbCount}`);

  // Click "Submit application"
  const submitBtn = page.locator('button:has-text("Submit application")').first();
  expect(await submitBtn.isVisible({ timeout: 5000 })).toBeTruthy();
  const submitDisabled = await submitBtn.isDisabled();
  console.log(`  Submit button disabled: ${submitDisabled}`);

  if (!submitDisabled) {
    console.log('  Clicking "Submit application"...');
    await submitBtn.click();
    await page.waitForTimeout(10000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(5000);
    console.log('  Application resubmitted!');
  } else {
    console.log('  Submit disabled — trying validation first');
    const validateBtn = page.locator('button:has-text("Validate the form")').first();
    if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await validateBtn.click();
      await page.waitForTimeout(8000);
    }
    await submitBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(10000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(5000);
    console.log('  Application resubmitted!');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-resubmitted.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════════
  // STEP 5: Verify final state
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 5: Verify final state');
  console.log('='.repeat(60));

  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\n  Final tasks (${finalTasks.length}):`);
  for (const t of finalTasks) {
    console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} (${t.shortname}) — ${t.status}`);
  }

  // Verify applicant task completed
  const applicantTaskFinal = finalTasks.find(t => t.camundaName === 'applicant');
  expect(applicantTaskFinal?.endTime).toBeTruthy();
  expect(applicantTaskFinal?.status).toBe('filevalidated');
  console.log('  Applicant task: DONE (filevalidated)');

  // Verify new Documents Check was created
  const newReview = finalTasks.filter(t => t.camundaName === 'review');
  expect(newReview.length).toBeGreaterThanOrEqual(2); // Original + new one
  const pendingReview = newReview.find(t => !t.endTime);
  expect(pendingReview).toBeTruthy();
  console.log('  New Documents Check: created (pending)');

  // Verify file state back to filepending
  const finalState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  expect(finalState.state).toBe('filepending');
  console.log(`  File state: ${finalState.state} (back to filepending)`);

  const finalPending = finalTasks.filter(t => !t.endTime);
  console.log(`  Pending tasks: ${finalPending.length}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/99-final.png`, fullPage: true });

  console.log('\n' + '='.repeat(60));
  console.log('  P3-CORRECTIONS FLOW COMPLETE');
  console.log('  Cycle: Submit → DocCheck → legalReview sendback → Applicant corrects → Resubmit → DocCheck');
  console.log('='.repeat(60));
});
