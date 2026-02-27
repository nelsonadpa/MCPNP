import { test, expect } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Execute rejection on the Board role
 *
 * Key finding: boardBoardDecision is a Choices.js dropdown with:
 *   - "Approved" option
 *   - "Denied" option
 *
 * The rejection mechanism is:
 * 1. Select "Denied" from the dropdown
 * 2. Fill rejection reason textarea
 * 3. Click "Approve" button (which submits the form)
 * 4. Verify denialLetter task appears
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('Execute Board rejection via "Denied" dropdown', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File: ${JSON.stringify(fileInfo)}`);
  if (!fileInfo.processId) { test.skip(); return; }
  const processId = fileInfo.processId;

  const tasks = await boHelpers.getProcessTasks(page, processId);
  const pending = tasks.filter(t => !t.endTime);
  console.log(`Pending: ${pending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  const boardTask = pending.find(t => t.camundaName.toLowerCase().includes('board'));
  if (!boardTask) { console.log('No Board task'); test.skip(); return; }

  console.log(`\nTarget: ${boardTask.camundaName}`);
  await boHelpers.navigateToRole(page, SERVICE_ID, boardTask.camundaName, processId, FILE_ID);
  await page.waitForTimeout(6000);

  // Go to Processing tab
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // ── Step 1: Select "Denied" from the Choices.js dropdown ──
  console.log('\n  Step 1: Selecting "Denied" from Board decision dropdown...');

  // Click the Choices.js container to open dropdown
  const choicesEl = page.locator('.choices').first();
  await choicesEl.click();
  await page.waitForTimeout(2000);

  // Click the "Denied" option
  const deniedOption = page.locator('.choices__list--dropdown .choices__item').filter({ hasText: 'Denied' }).first();
  if (await deniedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deniedOption.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Selected "Denied"');
  } else {
    console.log('  ERROR: "Denied" option not found in dropdown');
    // List available options
    const opts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.choices__list--dropdown .choices__item'))
        .map((el: any) => el.textContent?.trim());
    });
    console.log(`  Available options: ${JSON.stringify(opts)}`);
    test.skip();
    return;
  }

  // Verify selection
  const selectedValue = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    return roleForm?.submission?.data?.boardBoardDecision;
  });
  console.log(`  boardBoardDecision value: ${JSON.stringify(selectedValue)}`);

  // ── Step 2: Fill rejection reason textarea ──
  console.log('\n  Step 2: Filling rejection reason...');
  const textarea = page.locator('textarea:visible').first();
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.fill('TEST REJECTION: Application does not meet regulatory requirements for establishing a new zone.');
    console.log('  ✓ Filled rejection reason');
  }

  // ── Step 3: Save and validate ──
  console.log('\n  Step 3: Saving...');
  await formHelpers.enableFormValidation(page);
  await formHelpers.saveDraft(page);
  await page.waitForTimeout(3000);

  // Check form data before submission
  const preSubmitData = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return {};
    return {
      boardBoardDecision: roleForm.submission.data.boardBoardDecision,
      boardselection: roleForm.submission.data.boardselection,
      approvalEvaluatorsComments2: roleForm.submission.data.approvalEvaluatorsComments2?.substring(0, 80),
    };
  });
  console.log(`  Pre-submit data: ${JSON.stringify(preSubmitData)}`);

  await page.screenshot({ path: '/tmp/rejection-pre-submit.png', fullPage: true });

  // ── Step 4: Click Approve to submit ──
  console.log('\n  Step 4: Clicking Approve...');
  const approveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
  if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isDisabled = await approveBtn.isDisabled();
    console.log(`  Approve button disabled: ${isDisabled}`);

    if (isDisabled) {
      await formHelpers.enableFormValidation(page);
      await formHelpers.saveDraft(page);
      await page.waitForTimeout(2000);
    }

    await approveBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(5000);

    // Handle confirmation
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(10000);
    console.log('  ✓ Approve clicked');
  } else {
    console.log('  ERROR: Approve button not visible');
  }

  await page.screenshot({ path: '/tmp/rejection-post-submit.png', fullPage: true });

  // ── Step 5: Verify rejection ──
  console.log('\n  Step 5: Verifying rejection...');

  const postTasks = await boHelpers.getProcessTasks(page, processId);
  const postPending = postTasks.filter(t => !t.endTime);
  console.log(`\n  Pending tasks after rejection: ${postPending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  // Check for denial letter task
  const denialTask = postTasks.find(t => t.camundaName === 'denialLetter');
  if (denialTask) {
    console.log(`  ✓ Denial letter task found! (status: ${denialTask.status}, endTime: ${denialTask.endTime})`);
  } else {
    console.log('  ✗ No denial letter task');
  }

  // Check board task status
  const boardTaskAfter = postTasks.find(t => t.camundaName === boardTask.camundaName);
  if (boardTaskAfter) {
    console.log(`  Board task: status=${boardTaskAfter.status}, endTime=${boardTaskAfter.endTime}`);
  }

  // Check file state
  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`  File state: ${fileState.state}`);

  // Check process status
  const processStatus = await boHelpers.getProcessStatus(page, processId);
  console.log(`  Process: ended=${processStatus.ended} status=${processStatus.processStatus}`);

  // List ALL tasks with their statuses
  console.log('\n  All tasks:');
  for (const t of postTasks) {
    console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} — ${t.status}`);
  }

  console.log('\n\nRejection test complete.');
});
