import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Process pending back-office (Part B) files - V3 (smart skip logic).
 *
 * EXCLUDES file_id=810ff0d9-369a-4db9-84f0-91c2ad60484f
 *
 * V3 improvements:
 * - Skips roles known to require file uploads or applicant action
 * - Detects stuck roles (task count unchanged after click)
 * - Max 3 attempts per role before marking stuck
 * - Extended timeout
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/process-backoffice-v3.spec.ts --project=jamaica-frontoffice --headed --timeout=1200000
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const EXCLUDE_FILE_ID = '810ff0d9-369a-4db9-84f0-91c2ad60484f';
const SS = path.resolve(__dirname, '../screenshots/process-pending-v3');
const LOG_PATH = path.resolve(__dirname, '../test-data/process-pending-log-v3.json');

// Files already processed in previous runs — skip to save time
const ALREADY_PROCESSED = new Set([
  '16e54bbf-0325-4aa2-b057-0060f57596cc',
  '25207593-8762-4c0a-9118-4cbfe251dfd9',
  '0d7f3299-2744-4beb-8f80-d7e60c2d7995',
  'bf0dbb03-5e0b-406f-9005-3b16a8cb8974',
  '90587796-c1c9-4a5a-b87f-a5fdc04660c0',
  '29cd149d-fe94-4236-85de-451862a59c1a',
  '89a4f996-f129-4bdb-8dd2-043b0d5b66bc',
  '923add71-a47f-41ed-9575-f2b55c244d4c',
  '9026e7bf-972b-4566-9db4-ed8ecbb2df59',
  'b79f5d3e-2e05-487d-bfe4-618aa166a849',
  '3154e8fc-4983-4e26-9a35-8b7b60b6ce33',
  '258af4d7-c098-4677-998a-8911168e348c',
  '95d10fb1-10d1-4ec0-8a1b-4b81b461b18d',
  '92484f2f-510a-401c-9af6-bcbda17a5b51',
  'a5b3c66a-893e-4a22-b582-1edd9cafb6d2',
  '4018e9c4-e981-4c83-ba8f-061082c9f81d',
  '12308d03-36f6-4d56-88c8-225217d02013',
  '7c77d7a7-3b12-463d-aa64-e2752bc58243',
  'd618e57d-bfc2-4599-99cb-4e6dc91bc825',
  '0704b528-706a-4a68-b89e-982b3288cfd7',
  '7152d7aa-95a0-4c89-b9a3-d01ff021154b',
  '87c33c8e-2b82-4745-b9be-3b78d881d96a',
  'e7bde0ab-e117-4302-99a3-bb4fe43045a1',
  'eed1f1c6-c55b-479f-94ed-3561c439c24c',
  'c76618f5-d6ef-4b01-b59c-1b9a5d8c80ae',
  '0543d834-29d9-425c-a7a6-c055bcfd5573',
  // v2 run
  '83559b7d-bfbd-4100-bdc3-0420c60fb37e',
]);

// Roles that cannot be processed automatically (require uploads, applicant action, etc.)
const SKIP_ROLES = new Set([
  'applicant',                  // Requires applicant to submit corrections
  'complementaryInformation',   // Requires applicant to provide additional info
  'organizeNocAndInspection',   // Requires document uploads
  'technicalInspection',        // Requires inspection reports
  'processing',                 // Generic — needs investigation
]);

interface ActionLog {
  fileId: string;
  role: string;
  action: string;
  result: string;
  timestamp: string;
}

const actionLog: ActionLog[] = [];
const skippedFiles: any[] = [];

function log(fileId: string, role: string, action: string, result: string) {
  const entry = { fileId, role, action, result, timestamp: new Date().toISOString() };
  actionLog.push(entry);
  console.log(`  [LOG] ${fileId.substring(0,8)}... | ${role} | ${action} | ${result}`);
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
  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(6000);

  if (!page.url().includes(processId)) {
    log(fileId, camundaName, 'navigate', 'SKIP: redirected');
    return false;
  }

  // Click Processing tab
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // DocCheck / DocumentSreview: force-enable via comp.onClick()
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
    'button:has-text("Send decision to SEZA")',
    'button:has-text("Approve and send to ARC")',
    'button:has-text("Approve and send")',
    'button:has-text("Send to ARC")',
    'button:has-text("Send to Board")',
    'button:has-text("Send to Status letter")',
    'button:has-text("Send to CEO")',
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
    log(fileId, camundaName, 'find button', 'SKIP: no action button');
    return false;
  }

  const txt = (await actionBtn.textContent())?.trim() || '';

  // No objection for approvals
  if (txt.toLowerCase().includes('decision') || camundaName.toLowerCase().includes('approval')) {
    await setNoObjection(page);
  }

  await saveEditGridRows(page);
  await enableAndClick(page, actionBtn);
  log(fileId, camundaName, `click: ${txt}`, 'DONE');
  return true;
}

test('Process pending back-office files (v3 - smart)', async ({ page }) => {
  test.setTimeout(1200_000); // 20 minutes

  fs.mkdirSync(SS, { recursive: true });

  await page.goto('/');
  await page.waitForTimeout(5000);

  console.log('\n=== STEP 1: Discover pending files ===\n');

  const allFiles: any[] = await page.evaluate(async (sid: string) => {
    const r = await fetch(`/backend/files?serviceId=${sid}&page=1&page_size=500`);
    if (!r.ok) return [];
    try { return JSON.parse(await r.text()); } catch { return []; }
  }, SERVICE_ID);

  console.log(`Total files: ${allFiles.length}`);

  // Filter to pending files
  const pendingFiles: any[] = [];

  for (const f of allFiles) {
    const fileId = f.file_id;
    if (!fileId || !f.process_instance_id) continue;
    if (fileId === EXCLUDE_FILE_ID) {
      console.log(`  EXCLUDED: ${fileId}`);
      continue;
    }
    if (ALREADY_PROCESSED.has(fileId)) {
      continue; // silently skip
    }

    const tasks = f.tasks || [];
    const pending = tasks.filter((t: any) => !t.endTime);
    if (pending.length === 0) continue;

    const taskNames = pending.map((t: any) => t.camundaName);

    // Check if ALL pending tasks are in skip list
    const processable = taskNames.filter((n: string) => !SKIP_ROLES.has(n));
    if (processable.length === 0) {
      skippedFiles.push({ fileId, tasks: taskNames, reason: 'all tasks in skip list' });
      console.log(`  SKIP-ALL: ${fileId} | tasks: ${taskNames.join(', ')}`);
      continue;
    }

    console.log(`  PENDING: ${fileId} | processable: ${processable.join(', ')} | skip: ${taskNames.filter((n: string) => SKIP_ROLES.has(n)).join(', ') || 'none'}`);
    pendingFiles.push({
      fileId,
      processId: f.process_instance_id,
      state: f.state,
      taskNames,
      processableTaskNames: processable,
    });
  }

  console.log(`\nProcessable files: ${pendingFiles.length}`);
  console.log(`Skipped files (all tasks unprocessable): ${skippedFiles.length}`);

  if (pendingFiles.length === 0) {
    console.log('Nothing to process!');
    fs.writeFileSync(LOG_PATH, JSON.stringify({ actionLog, skippedFiles, message: 'No processable files' }, null, 2));
    return;
  }

  console.log('\n=== STEP 2: Process each file ===\n');

  let filesProcessed = 0;
  let filesStuck = 0;

  for (const file of pendingFiles) {
    console.log(`\n--- [${filesProcessed+1}/${pendingFiles.length}] File ${file.fileId} ---`);
    console.log(`  Processable tasks: ${file.processableTaskNames.join(', ')}`);

    let prevPendingCount = -1;
    let sameCountRetries = 0;
    let maxSameCount = 2; // If pending count doesn't change after 2 tries, skip

    for (let iter = 0; iter < 15; iter++) {
      const tasks = await getTasks(page, file.processId);
      const pending = pendingTasks(tasks);
      const currentPendingCount = pending.length;

      if (currentPendingCount === 0) {
        console.log(`  ALL DONE!`);
        log(file.fileId, '-', 'complete', 'ALL TASKS DONE');
        break;
      }

      // Stuck detection
      if (currentPendingCount === prevPendingCount) {
        sameCountRetries++;
        if (sameCountRetries >= maxSameCount) {
          console.log(`  STUCK: pending count unchanged (${currentPendingCount}) after ${sameCountRetries} tries`);
          log(file.fileId, pending[0].camundaName, 'stuck-detect', `STUCK after ${sameCountRetries} retries`);
          filesStuck++;
          break;
        }
      } else {
        sameCountRetries = 0;
      }
      prevPendingCount = currentPendingCount;

      // Find first processable task
      let processed = false;
      for (const task of pending) {
        if (SKIP_ROLES.has(task.camundaName)) continue;
        console.log(`  [${iter+1}] ${task.camundaName} (${currentPendingCount} pending)`);
        processed = await processRole(page, task.camundaName, file.fileId, file.processId);
        if (processed) break;
      }

      if (!processed) {
        // All remaining tasks are in skip list or no button found
        console.log(`  No more processable tasks`);
        log(file.fileId, '-', 'no-processable', 'remaining tasks need manual action');
        break;
      }

      await page.waitForTimeout(2000);
    }

    filesProcessed++;
  }

  // Summary
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');
  console.log(`  Files attempted: ${filesProcessed}`);
  console.log(`  Files stuck: ${filesStuck}`);
  console.log(`  Files skipped (all unprocessable): ${skippedFiles.length}`);
  console.log(`  Total actions: ${actionLog.length}`);
  console.log('\n  Action log:');
  for (const e of actionLog) {
    console.log(`    ${e.fileId.substring(0,8)}... | ${e.role} | ${e.action} | ${e.result}`);
  }

  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify({
    service: SERVICE_ID,
    excludedFile: EXCLUDE_FILE_ID,
    totalFiles: allFiles.length,
    pendingFilesProcessed: filesProcessed,
    filesStuck,
    skippedFiles,
    actionLog,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log(`\n  Log saved to ${LOG_PATH}`);
});
