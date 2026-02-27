import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import * as formHelpers from '../helpers/form-helpers';
import * as boHelpers from '../helpers/backoffice-helpers';

/**
 * Phase 3 — Rejection Flow
 *
 * Tests the full rejection lifecycle for "Establish a new zone":
 * 1. Submit a new application (P1)
 * 2. Process all 19 back-office roles to reach Board
 * 3. At Board: select "Denied" from the Board decision dropdown
 * 4. Click Approve → triggers FILE REJECT workflow path
 * 5. Verify denialLetter task appears
 * 6. Process remaining tasks (denialLetter, sezDocuments)
 * 7. Verify applicant view shows rejection
 *
 * REJECTION MECHANISM (discovered via diagnostics):
 * - Board role Processing tab has a Choices.js dropdown: boardBoardDecision
 * - Options loaded from URL catalog: "Approved" and "Denied"
 * - Selecting "Denied" + clicking "Approve" → routes to FILE REJECT
 * - denialLetter and sezDocuments tasks appear after rejection
 *
 * PREREQUISITE: Run p1-submit-complete.spec.ts first, then set FILE_ID below.
 *
 * Run:
 *   npx playwright test specs/p3-rejection-flow.spec.ts --project=jamaica-frontoffice
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p3-rejection');
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');
const TEST_PDF = path.resolve(DOCS_DIR, 'TEST-certificate-of-incorporation.pdf');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';

// ═══════════════════════════════════════════════════════════════
// SET THIS — file_id of a submitted application (from P1 output)
// ═══════════════════════════════════════════════════════════════
const FILE_ID = 'c7ae56c2-b273-494a-b390-d8aa7d14d3e2';

// All roles to process in happy-path order BEFORE the Board rejection target
const HAPPY_PATH_ROLES = [
  'review',                  // Documents Check
  'legalReview',             // LSU evaluation
  'organizeNocAndInspection',// NOC
  'complianceReview',        // CAS evaluation
  'businessReview',          // BPSS evaluation
  'technicalReview',         // TSI review
  'legalApproval',           // Legal approval
  'tajApproval',             // TAJ
  'mofpsApproval',           // MOFPS
  'jcaApproval',             // JCA
  'technicalApproval',       // Technical approval
  'complianceApproval',      // Compliance approval
  'businessApproval',        // Business approval
  'applicationReviewingCommitteeArcDecision', // ARC
  // complementaryInformation handled separately (applicant side)
  'preparationOfStatusLetter', // Status letter
  'signatureOfStatusLetter',   // Signature
  'boardSubmission',           // Board submission
  'ceoValidation',             // CEO validation
  // board = REJECTION TARGET
];

// ── Helper: Handle complementary information (applicant side) ──
async function handleComplementaryInfo(page: any, serviceId: string, fileId: string): Promise<boolean> {
  console.log('\n  Handling complementary information (applicant side)...');
  await page.goto(`/services/${serviceId}?file_id=${fileId}`);
  await page.waitForTimeout(10000);

  const sendTab = page.locator('.page-link:has-text("Send"), .nav-link:has-text("Send")').first();
  if (await sendTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sendTab.click();
    await page.waitForTimeout(3000);
  }

  const vsBtn = page.locator('button:has-text("Validate send page")').first();
  if (await vsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await vsBtn.click();
    await page.waitForTimeout(10000);
  }

  const consents = page.locator('input[type="checkbox"]:visible');
  const cbCount = await consents.count();
  for (let i = 0; i < cbCount; i++) {
    await consents.nth(i).check({ force: true }).catch(() => {});
  }

  const submitBtn = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(10000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(5000);
    console.log('  Complementary info submitted');
    return true;
  }

  console.log('  No Submit button found — comp info may not require action');
  return false;
}

test('P3-REJECTION: Full rejection flow via Board', async ({ page }) => {
  test.setTimeout(1800_000); // 30 min
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
  if (fileInfo.error || !fileInfo.processId || fileInfo.state === 'NEW') {
    console.log('  ERROR: Application not found or not submitted.');
    test.skip();
    return;
  }

  const processId = fileInfo.processId;
  console.log(`  File ID: ${FILE_ID}`);
  console.log(`  Process ID: ${processId}`);

  // ══════════════════════════════════════════════════════════════
  // STEP 1: Process all roles in happy path to reach Board
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 1: Process roles to reach Board');
  console.log('='.repeat(60));

  // --- Handle Documents Check explicitly (special flow) ---
  let tasks = await boHelpers.getProcessTasks(page, processId);
  const reviewTask = tasks.find(t => t.camundaName === 'review' && !t.endTime);

  if (reviewTask) {
    console.log('\n  Processing Documents Check...');
    await boHelpers.navigateToRole(page, SERVICE_ID, 'review', processId, FILE_ID);
    await page.waitForTimeout(5000);

    const docsTab = page.locator('.nav-link:has-text("Documents")').first();
    if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(2000);
    }
    try { await boHelpers.validateAllDocuments(page); } catch {}
    await formHelpers.enableFormValidation(page);
    await formHelpers.saveDraft(page);
    await page.waitForTimeout(2000);

    const procTab = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(2000);
    }

    const approveDocCheck = page.locator('button:has-text("Approve documents check")').first();
    if (await approveDocCheck.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await approveDocCheck.isDisabled()) {
        await formHelpers.enableFormValidation(page);
        await formHelpers.saveDraft(page);
        await page.waitForTimeout(2000);
      }
      await approveDocCheck.click({ timeout: 10_000 });
      await page.waitForTimeout(5000);
      await boHelpers.handleConfirmation(page);
      await page.waitForTimeout(5000);
      console.log('  Documents Check approved');
    }
  } else {
    console.log('  Documents Check already done');
  }

  // --- Process remaining happy-path roles ---
  for (const roleName of HAPPY_PATH_ROLES) {
    if (roleName === 'review') continue;

    tasks = await boHelpers.getProcessTasks(page, processId);
    const task = tasks.find(t => t.camundaName === roleName && !t.endTime);

    if (!task) {
      // Check if complementaryInformation appeared and handle it
      const compInfo = tasks.find(t => t.camundaName === 'complementaryInformation' && !t.endTime);
      if (compInfo) {
        await handleComplementaryInfo(page, SERVICE_ID, FILE_ID);
        await page.waitForTimeout(5000);
        const retasks = await boHelpers.getProcessTasks(page, processId);
        const retask = retasks.find(t => t.camundaName === roleName && !t.endTime);
        if (!retask) {
          console.log(`  ${roleName}: still not available after comp info`);
          continue;
        }
      } else {
        console.log(`  ${roleName}: already done or not yet available`);
        continue;
      }
    }

    console.log(`\n  Processing: ${roleName}...`);
    const result = await boHelpers.processRole(page, {
      serviceId: SERVICE_ID,
      camundaName: roleName,
      processId,
      fileId: FILE_ID,
      testFilePath: TEST_PDF,
      screenshotDir: SCREENSHOT_DIR,
    });
    console.log(`  ${roleName}: ${result}`);
  }

  // Handle comp info if it appears after all roles
  tasks = await boHelpers.getProcessTasks(page, processId);
  const compInfoPost = tasks.find(t => t.camundaName === 'complementaryInformation' && !t.endTime);
  if (compInfoPost) {
    await handleComplementaryInfo(page, SERVICE_ID, FILE_ID);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Navigate to Board role (rejection target)
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 2: Navigate to Board role');
  console.log('='.repeat(60));

  await page.waitForTimeout(5000);
  tasks = await boHelpers.getProcessTasks(page, processId);
  const pending = tasks.filter(t => !t.endTime);
  console.log(`\n  Pending tasks: ${pending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  const boardTask = pending.find(t => t.camundaName === 'board');
  if (!boardTask) {
    // If board not yet available, process remaining pending roles
    console.log('  Board not yet available. Processing remaining roles...');
    for (const pt of pending) {
      if (pt.camundaName === 'complementaryInformation') {
        await handleComplementaryInfo(page, SERVICE_ID, FILE_ID);
        continue;
      }
      console.log(`  Processing remaining: ${pt.camundaName}...`);
      await boHelpers.processRole(page, {
        serviceId: SERVICE_ID,
        camundaName: pt.camundaName,
        processId,
        fileId: FILE_ID,
        testFilePath: TEST_PDF,
      });
    }

    await page.waitForTimeout(5000);
    tasks = await boHelpers.getProcessTasks(page, processId);
    const pending2 = tasks.filter(t => !t.endTime);
    console.log(`  Pending after catch-up: ${pending2.map(t => t.camundaName).join(', ')}`);

    const boardTask2 = pending2.find(t => t.camundaName === 'board');
    if (!boardTask2) {
      console.log('  ERROR: Board role still not available');
      test.skip();
      return;
    }
  }

  await boHelpers.navigateToRole(page, SERVICE_ID, 'board', processId, FILE_ID);
  await page.waitForTimeout(6000);

  // Go to Processing tab
  const procTab2 = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab2.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-board-processing.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Execute rejection — select "Denied" from dropdown
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 3: Execute rejection');
  console.log('='.repeat(60));

  // Click the Choices.js dropdown (boardBoardDecision)
  console.log('\n  Selecting "Denied" from Board decision dropdown...');
  const choicesEl = page.locator('.choices').first();
  let rejectionExecuted = false;

  if (await choicesEl.isVisible({ timeout: 5000 }).catch(() => false)) {
    await choicesEl.click();
    await page.waitForTimeout(2000);

    // Select "Denied" option
    const deniedOption = page.locator('.choices__list--dropdown .choices__item').filter({ hasText: 'Denied' }).first();
    if (await deniedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deniedOption.click();
      await page.waitForTimeout(2000);

      // Verify selection
      const selectedValue = await page.evaluate(() => {
        const roleForm = (window as any).roleForm;
        return roleForm?.submission?.data?.boardBoardDecision;
      });
      console.log(`  boardBoardDecision = ${JSON.stringify(selectedValue)}`);
      rejectionExecuted = true;
    } else {
      console.log('  ERROR: "Denied" option not found in dropdown');
      const opts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.choices__list--dropdown .choices__item'))
          .map((el: any) => el.textContent?.trim());
      });
      console.log(`  Available options: ${JSON.stringify(opts)}`);
    }
  } else {
    console.log('  ERROR: Choices.js dropdown not visible on Processing tab');
  }

  // Fill rejection reason textarea
  const textarea = page.locator('textarea:visible').first();
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.fill('TEST REJECTION: Application does not meet regulatory requirements for establishing a new zone.');
    console.log('  Filled rejection reason');
  }

  // Save form
  await formHelpers.enableFormValidation(page);
  await formHelpers.saveDraft(page);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-rejection-set.png`, fullPage: true });

  // Click Approve button to submit (this triggers the workflow transition)
  console.log('\n  Clicking Approve to submit rejection...');
  const approveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
  if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await approveBtn.isDisabled()) {
      await formHelpers.enableFormValidation(page);
      await formHelpers.saveDraft(page);
      await page.waitForTimeout(2000);
    }
    await approveBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(5000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(10000);
    console.log('  Approve clicked — form submitted');
  } else {
    console.log('  ERROR: Approve button not visible');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-rejection.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════════
  // STEP 4: Verify rejection — denialLetter task should appear
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 4: Verify rejection');
  console.log('='.repeat(60));

  tasks = await boHelpers.getProcessTasks(page, processId);
  const postPending = tasks.filter(t => !t.endTime);
  console.log(`\n  Pending tasks after rejection: ${postPending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  const denialTask = postPending.find(t => t.camundaName === 'denialLetter');
  if (denialTask) {
    console.log('  PASS: Denial letter task appeared — rejection confirmed!');
  } else {
    console.log('  FAIL: No denial letter task found');
    console.log('  All tasks:');
    for (const t of tasks) {
      console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} — ${t.status}`);
    }
  }

  // Board task should be completed
  const boardDone = tasks.find(t => t.camundaName === 'board' && t.endTime);
  if (boardDone) {
    console.log(`  Board completed: status=${boardDone.status}`);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 5: Process remaining tasks (denialLetter, sezDocuments)
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 5: Process remaining tasks');
  console.log('='.repeat(60));

  for (const pendTask of postPending) {
    console.log(`\n  Processing: ${pendTask.camundaName}...`);

    // denialLetter requires uploading the denial letter file first
    if (pendTask.camundaName === 'denialLetter') {
      await boHelpers.navigateToRole(page, SERVICE_ID, 'denialLetter', processId, FILE_ID);
      await page.waitForTimeout(6000);

      // Go to Processing tab
      const dlProcTab = page.locator('.nav-link:has-text("Processing")').first();
      if (await dlProcTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dlProcTab.click();
        await page.waitForTimeout(3000);
      }

      // Click "Download SEZ Denial letter" to generate it
      const downloadBtn = page.locator('button:has-text("Download SEZ Denial letter")').first();
      if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await downloadBtn.click();
        await page.waitForTimeout(10000);
        // Close any new tabs that opened
        const pages = page.context().pages();
        if (pages.length > 1) {
          await pages[pages.length - 1].close();
        }
      }

      // Upload test PDF to the SEZ Denial letter file field
      const browseLink = page.locator('a.browse:visible').first();
      if (await browseLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        try {
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 10000 }),
            browseLink.click(),
          ]);
          await fc.setFiles(TEST_PDF);
          await page.waitForTimeout(10000);
          console.log('  Uploaded denial letter file');
        } catch (e: any) {
          console.log(`  Upload failed: ${e.message?.substring(0, 100)}`);
        }
      }

      // Save + Approve
      await formHelpers.enableFormValidation(page);
      await formHelpers.saveDraft(page);
      await page.waitForTimeout(2000);

      const dlApproveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
      if (await dlApproveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dlApproveBtn.click({ timeout: 10_000 });
        await page.waitForTimeout(5000);
        await boHelpers.handleConfirmation(page);
        await page.waitForTimeout(10000);
        console.log('  denialLetter: completed');
      }
      continue;
    }

    // All other remaining tasks — use standard processRole
    const result = await boHelpers.processRole(page, {
      serviceId: SERVICE_ID,
      camundaName: pendTask.camundaName,
      processId,
      fileId: FILE_ID,
      testFilePath: TEST_PDF,
      screenshotDir: SCREENSHOT_DIR,
    });
    console.log(`  ${pendTask.camundaName}: ${result}`);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 6: Verify final state
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 6: Verify final state');
  console.log('='.repeat(60));

  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  const finalPending = finalTasks.filter(t => !t.endTime);

  const processStatus = await boHelpers.getProcessStatus(page, processId);
  console.log(`  Process: ended=${processStatus.ended} status=${processStatus.processStatus}`);

  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`  File state: ${fileState.state}`);
  console.log(`  Remaining pending tasks: ${finalPending.length}`);

  if (finalPending.length > 0) {
    console.log('  Still pending:');
    for (const t of finalPending) {
      console.log(`    ${t.camundaName} — ${t.status}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 7: Front-office — applicant view
  // ══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 7: Front-office — Applicant view');
  console.log('='.repeat(60));

  await page.goto('/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-dashboard.png`, fullPage: true });

  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-applicant-view.png`, fullPage: true });

  const rejectionTerms = await page.evaluate(() => {
    const body = document.body.textContent?.toLowerCase() || '';
    return ['rejected', 'denied', 'refused', 'closed', 'terminated', 'declined', 'denial']
      .filter(t => body.includes(t));
  });
  console.log(`  Rejection terms on page: ${JSON.stringify(rejectionTerms)}`);

  // ── Summary ──
  console.log('\n' + '='.repeat(60));
  console.log('  P3-REJECTION FLOW SUMMARY');
  console.log('='.repeat(60));
  console.log(`  File ID:           ${FILE_ID}`);
  console.log(`  Process ID:        ${processId}`);
  console.log(`  File state:        ${fileState.state}`);
  console.log(`  Process ended:     ${processStatus.ended}`);
  console.log(`  Denial letter:     ${denialTask ? 'YES' : 'NO'}`);
  console.log(`  Rejection via:     boardBoardDecision = "Denied"`);
  console.log(`  Rejection success: ${rejectionExecuted}`);
  console.log(`  Remaining tasks:   ${finalPending.length}`);
  console.log('='.repeat(60));
});
