import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Process ALL pending back-office (Part B) files for "Establish a new zone - March"
 * EXCEPT file_id=810ff0d9-369a-4db9-84f0-91c2ad60484f.
 *
 * V2: Uses file listing with embedded tasks to avoid per-file API calls.
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/process-backoffice-v2.spec.ts --project=jamaica-frontoffice --headed
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const EXCLUDE_FILE_ID = '810ff0d9-369a-4db9-84f0-91c2ad60484f';
const SS = path.resolve(__dirname, '../screenshots/process-pending-v2');
const LOG_PATH = path.resolve(__dirname, '../test-data/process-pending-log.json');

interface ActionLog {
  fileId: string;
  role: string;
  action: string;
  result: string;
  timestamp: string;
}

const actionLog: ActionLog[] = [];

function log(fileId: string, role: string, action: string, result: string) {
  const entry = { fileId, role, action, result, timestamp: new Date().toISOString() };
  actionLog.push(entry);
  console.log(`  [LOG] file=${fileId.substring(0,8)}... role=${role} action=${action} result=${result}`);
}

async function enableAndClick(page: any, btnLocator: any) {
  if (await btnLocator.isDisabled().catch(() => true)) {
    await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return;
      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.key === 'FORMDATAVALIDATIONSTATUS') {
            comp.setValue('true'); comp.triggerChange?.();
          }
          if (['noObjectionJca4', 'approvalSeza4', 'noObjectionTaj4', 'noObjectionMofps4'].includes(comp.component?.key)) {
            comp.setValue(true); comp.triggerChange?.();
          }
        });
        form.root.checkConditions?.();
      }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(3000);
  }
  try { await btnLocator.click({ timeout: 10_000 }); }
  catch { await btnLocator.click({ force: true, timeout: 10_000 }); }
  await page.waitForTimeout(8000);
  for (const label of ['OK', 'Confirm', 'Yes']) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click(); await page.waitForTimeout(5000); break;
    }
  }
}

async function setNoObjection(page: any) {
  const lbl = page.locator('label, span').filter({ hasText: /^No objection$/ }).first();
  if (await lbl.isVisible().catch(() => false)) { await lbl.click(); await page.waitForTimeout(1000); }
}

async function saveEditGridRows(page: any) {
  return page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return 0; let saved = 0;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.type === 'editgrid' && comp.editRows) {
          for (let i = 0; i < comp.editRows.length; i++) {
            if (comp.editRows[i].state === 'new' || comp.editRows[i].state === 'editing') {
              try { comp.saveRow(i); saved++; } catch {} } } } }); } return saved;
  });
}

async function getTasks(page: any, processId: string): Promise<any[]> {
  const result = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    if (!r.ok) return { error: r.status };
    try {
      const d = JSON.parse(await r.text());
      return { tasks: (d.tasks || []).map((t: any) => ({ id: t.id, camundaName: t.camundaName, shortname: t.shortname, endTime: t.endTime })) };
    } catch { return { error: 'parse' }; }
  }, processId);
  if (result.error) return [];
  return result.tasks || [];
}

function pendingTasks(tasks: any[]) { return tasks.filter((t: any) => !t.endTime); }

async function processRole(page: any, camundaName: string, fileId: string, processId: string): Promise<boolean> {
  console.log(`    Processing role: ${camundaName}...`);

  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(6000);

  if (!page.url().includes(processId)) {
    log(fileId, camundaName, 'navigate', 'SKIP: redirected away');
    return false;
  }

  // Click Processing tab
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // DocCheck: force-enable via comp.onClick()
  if (camundaName === 'documentsCheck' || camundaName === 'documentSreview') {
    await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.key?.startsWith('filevalidated_')) {
            comp.component.hidden = false;
            comp.component.conditional = {};
            comp.component.disabled = false;
            comp.visible = true;
            comp.disabled = false;
            if (comp.refs?.button) comp.refs.button.disabled = false;
            comp.onClick(new Event('click'));
          }
        });
      }
    });
    await page.waitForTimeout(15000);
    for (const label of ['OK', 'Confirm', 'Yes']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click(); await page.waitForTimeout(5000); break;
      }
    }
    log(fileId, camundaName, 'fileValidated click', 'DONE');
    return true;
  }

  // Find action button
  const btnSelectors = [
    'button:has-text("Send evaluation to approval")',
    'button:has-text("Send evaluation for approval")',
    'button:has-text("Send consultation documents")',
    'button:has-text("Send decision to SEZA")',
    'button:has-text("Approve and send to ARC")',
    'button:has-text("Approve and send")',
    'button:has-text("Send to ARC")',
    'button:has-text("Send to Board")',
    'button:has-text("Approve")',
    'button:has-text("Validate")',
    'button.btn-block:has-text("Approve")',
  ];
  let actionBtn: any = null;
  for (const sel of btnSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) { actionBtn = btn; break; }
  }
  if (!actionBtn) {
    log(fileId, camundaName, 'find button', 'SKIP: no action button found');
    return false;
  }

  const txt = (await actionBtn.textContent())?.trim() || '';
  console.log(`      Button found: "${txt}"`);

  // No objection for approvals
  if (txt.toLowerCase().includes('decision') || camundaName.toLowerCase().includes('approval')) {
    await setNoObjection(page);
  }

  await saveEditGridRows(page);
  await enableAndClick(page, actionBtn);
  log(fileId, camundaName, `click: ${txt}`, 'DONE');
  return true;
}

test('Process all pending back-office files (v2)', async ({ page }) => {
  test.setTimeout(600_000); // 10 minutes

  fs.mkdirSync(SS, { recursive: true });

  // Navigate to establish session
  await page.goto('/');
  await page.waitForTimeout(5000);

  console.log('\n========================================');
  console.log('  STEP 1: Get all files with embedded task info');
  console.log('========================================\n');

  // Get all files - the API returns ALL files regardless of pagination params
  const allFiles: any[] = await page.evaluate(async (sid: string) => {
    const r = await fetch(`/backend/files?serviceId=${sid}&page=1&page_size=500`);
    if (!r.ok) return [];
    try { return JSON.parse(await r.text()); } catch { return []; }
  }, SERVICE_ID);

  console.log(`  Total files returned: ${allFiles.length}`);

  // Filter: only files with process_instance_id AND pending tasks
  const pendingFiles: any[] = [];
  let skippedExcluded = false;

  for (const f of allFiles) {
    const fileId = f.file_id;
    if (!fileId || !f.process_instance_id) continue;

    if (fileId === EXCLUDE_FILE_ID) {
      console.log(`  EXCLUDED: ${fileId} (user testing - DO NOT TOUCH)`);
      skippedExcluded = true;
      continue;
    }

    // Check if file has pending tasks in the embedded tasks array
    const tasks = f.tasks || [];
    const pending = tasks.filter((t: any) => !t.endTime);
    if (pending.length > 0) {
      const taskNames = pending.map((t: any) => t.camundaName || t.shortname || t.id);
      console.log(`  PENDING: ${fileId} | state=${f.state} | tasks: ${taskNames.join(', ')}`);
      pendingFiles.push({
        fileId,
        processId: f.process_instance_id,
        state: f.state,
        pendingTaskNames: taskNames,
        pendingTasks: pending,
      });
    }
  }

  console.log(`\n  Files with pending tasks: ${pendingFiles.length}`);
  console.log(`  Excluded file found: ${skippedExcluded}`);

  if (pendingFiles.length === 0) {
    console.log('  Nothing to process!');
    fs.writeFileSync(LOG_PATH, JSON.stringify({ actionLog, pendingFiles: [], message: 'No pending files found' }, null, 2));
    return;
  }

  console.log('\n========================================');
  console.log('  STEP 2: Process each pending file');
  console.log('========================================\n');

  for (const file of pendingFiles) {
    console.log(`\n--- File ${file.fileId} ---`);
    console.log(`  Process: ${file.processId}`);
    console.log(`  State: ${file.state}`);
    console.log(`  Tasks: ${file.pendingTaskNames.join(', ')}`);

    let maxIterations = 25;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Re-fetch tasks from process endpoint for current state
      const tasks = await getTasks(page, file.processId);
      const pending = pendingTasks(tasks);

      if (pending.length === 0) {
        console.log(`  All tasks completed for this file!`);
        log(file.fileId, '-', 'check', 'ALL TASKS COMPLETE');
        break;
      }

      const task = pending[0];
      const camundaName = task.camundaName;
      console.log(`  [${iteration}/${maxIterations}] Processing: ${camundaName} (${pending.length} pending)`);

      const success = await processRole(page, camundaName, file.fileId, file.processId);

      if (!success) {
        // Try next pending task if this one failed
        let foundAlt = false;
        for (let i = 1; i < pending.length && !foundAlt; i++) {
          const alt = pending[i];
          console.log(`    Trying alternative: ${alt.camundaName}`);
          foundAlt = await processRole(page, alt.camundaName, file.fileId, file.processId);
        }
        if (!foundAlt) {
          log(file.fileId, camundaName, 'all-attempts', 'STUCK: skipping file');
          break;
        }
      }

      await page.waitForTimeout(2000);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');

  console.log(`  Total actions: ${actionLog.length}`);
  for (const entry of actionLog) {
    console.log(`  ${entry.fileId.substring(0,8)}... | ${entry.role} | ${entry.action} | ${entry.result}`);
  }

  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify({
    service: SERVICE_ID,
    excludedFile: EXCLUDE_FILE_ID,
    totalFilesScanned: allFiles.length,
    pendingFilesFound: pendingFiles.length,
    actionLog,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log(`\n  Log saved to ${LOG_PATH}`);
});
