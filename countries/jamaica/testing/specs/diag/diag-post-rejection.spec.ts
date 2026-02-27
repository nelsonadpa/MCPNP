import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Post-rejection: Process denialLetter + sezDocuments and verify final state
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('Post-rejection: process remaining tasks', async ({ page }) => {
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
  if (!fileInfo.processId) { test.skip(); return; }
  const processId = fileInfo.processId;

  let tasks = await boHelpers.getProcessTasks(page, processId);
  let pending = tasks.filter(t => !t.endTime);
  console.log(`Pending: ${pending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  // Process each pending task
  for (const task of pending) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  Processing: ${task.camundaName}`);
    console.log('='.repeat(50));

    await boHelpers.navigateToRole(page, SERVICE_ID, task.camundaName, processId, FILE_ID);
    await page.waitForTimeout(6000);

    // Screenshot initial state
    await page.screenshot({ path: `/tmp/post-rejection-${task.camundaName}.png`, fullPage: true });

    // List tabs
    const tabs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.nav-link'))
        .filter((el: any) => el.offsetParent !== null)
        .map((el: any) => el.textContent?.trim())
        .filter((t: any) => t && t.length < 40 && !['NP', 'en', 'NPNELSON PEREZ'].includes(t));
    });
    console.log(`  Tabs: ${JSON.stringify(tabs)}`);

    // Go to Processing tab
    const procTab = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(3000);
    }

    // List buttons on Processing tab
    const btns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
        .map((b: any) => ({
          text: b.textContent?.trim().substring(0, 100),
          disabled: b.disabled,
          classes: b.className?.substring(0, 80),
        }))
        .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP', '×'].includes(b.text));
    });
    console.log(`  Buttons: ${btns.map(b => `"${b.text}"(disabled=${b.disabled})`).join(', ')}`);

    // List form elements
    const formEls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, .choices'))
        .filter((el: any) => el.offsetParent !== null)
        .map((el: any) => ({
          tag: el.tagName,
          type: (el as any).type || '',
          name: (el as any).name || '',
          label: el.closest('.formio-component')?.querySelector('label')?.textContent?.trim().substring(0, 60) || '',
        }));
    });
    console.log(`  Form elements: ${formEls.length}`);
    for (const fe of formEls) {
      console.log(`    <${fe.tag}> type="${fe.type}" name="${fe.name}" label="${fe.label}"`);
    }

    // Try to process the role
    const result = await boHelpers.processRole(page, {
      serviceId: SERVICE_ID,
      camundaName: task.camundaName,
      processId,
      fileId: FILE_ID,
    });
    console.log(`  Result: ${result}`);

    await page.waitForTimeout(5000);
  }

  // Final state check
  console.log('\n' + '='.repeat(50));
  console.log('  FINAL STATE');
  console.log('='.repeat(50));

  tasks = await boHelpers.getProcessTasks(page, processId);
  pending = tasks.filter(t => !t.endTime);

  const processStatus = await boHelpers.getProcessStatus(page, processId);
  console.log(`  Process: ended=${processStatus.ended} status=${processStatus.processStatus}`);

  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`  File state: ${fileState.state}`);

  console.log(`\n  All tasks:`);
  for (const t of tasks) {
    console.log(`    ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} — ${t.status}`);
  }

  if (pending.length > 0) {
    console.log(`\n  Still pending: ${pending.map(t => t.camundaName).join(', ')}`);
  } else {
    console.log('\n  All tasks completed!');
  }

  // Check applicant view
  console.log('\n  Checking applicant view...');
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `/tmp/post-rejection-applicant.png`, fullPage: true });

  const pageTerms = await page.evaluate(() => {
    const body = document.body.textContent?.toLowerCase() || '';
    return ['rejected', 'denied', 'refused', 'closed', 'terminated', 'declined', 'denial', 'approved', 'pending']
      .filter(t => body.includes(t));
  });
  console.log(`  Page terms: ${JSON.stringify(pageTerms)}`);

  console.log('\n\nPost-rejection processing complete.');
});
