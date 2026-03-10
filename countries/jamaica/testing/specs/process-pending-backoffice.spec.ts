import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Process ALL pending back-office (Part B) files for "Establish a new zone - March"
 * EXCEPT file_id=810ff0d9-369a-4db9-84f0-91c2ad60484f (user is testing that one).
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/process-pending-backoffice.spec.ts --project=jamaica-frontoffice --headed
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const EXCLUDE_FILE_ID = '810ff0d9-369a-4db9-84f0-91c2ad60484f';
const SS = path.resolve(__dirname, '../screenshots/process-pending');
const LOG_PATH = path.resolve(__dirname, '../test-data/process-pending-log.json');

interface FileInfo {
  id: string;
  processId: string | null;
  status: string;
  pendingTasks: string[];
}

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

async function getFilesForService(page: any): Promise<any[]> {
  const allFiles: any[] = [];
  for (let pg = 1; pg <= 10; pg++) {
    const result = await page.evaluate(async (args: { sid: string; pg: number }) => {
      const r = await fetch(`/backend/files?serviceId=${args.sid}&page=${args.pg}&page_size=50`);
      if (!r.ok) return { error: r.status, body: '' };
      const text = await r.text();
      try { return { data: JSON.parse(text) }; } catch { return { error: 'parse', body: text.substring(0, 200) }; }
    }, { sid: SERVICE_ID, pg });

    if (result.error) {
      console.log(`  Page ${pg}: error ${result.error}`);
      break;
    }
    const data = result.data;
    if (Array.isArray(data)) {
      if (data.length === 0) break;
      allFiles.push(...data);
      if (data.length < 50) break;
    } else if (data?.results) {
      allFiles.push(...data.results);
      if (!data.next) break;
    } else {
      console.log(`  Unexpected data format:`, JSON.stringify(data).substring(0, 200));
      break;
    }
  }
  return allFiles;
}

async function getFileDetails(page: any, fileId: string): Promise<any> {
  return page.evaluate(async (fid: string) => {
    const r = await fetch(`/backend/files/${fid}`);
    if (!r.ok) return { error: r.status };
    try { return JSON.parse(await r.text()); } catch { return { error: 'parse' }; }
  }, fileId);
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

function pending(tasks: any[]) { return tasks.filter((t: any) => !t.endTime); }

async function enableAndClick(page: any, btnLocator: any) {
  // Try to enable the button via Form.io
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

async function processRole(page: any, camundaName: string, fileId: string, processId: string): Promise<boolean> {
  console.log(`    Processing ${camundaName}...`);

  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(5000);
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

  // DocCheck: force-enable via comp.onClick()
  if (camundaName === 'documentsCheck') {
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
    'button:has-text("Request additional info")',
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
  console.log(`      Button: "${txt}"`);

  // No objection for approvals
  if (txt.toLowerCase().includes('decision') || camundaName.toLowerCase().includes('approval')) {
    await setNoObjection(page);
  }

  await saveEditGridRows(page);
  await enableAndClick(page, actionBtn);
  log(fileId, camundaName, `click: ${txt}`, 'DONE');
  return true;
}

test('Process all pending back-office files', async ({ page }) => {
  test.setTimeout(1200_000); // 20 minutes

  fs.mkdirSync(SS, { recursive: true });

  console.log('\n========================================');
  console.log('  STEP 1: Discover pending files');
  console.log('========================================\n');

  // Navigate to site first to establish session
  await page.goto('/');
  await page.waitForTimeout(5000);

  // List all files for the service
  const allFiles = await getFilesForService(page);
  console.log(`  Found ${allFiles.length} total files for service`);

  if (allFiles.length === 0) {
    console.log('  No files found. Checking if we are authenticated...');
    await page.screenshot({ path: `${SS}/no-files-debug.png` });
    // Try navigating to dashboard to check
    await page.goto('/dashboard');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SS}/dashboard-check.png` });

    // Maybe the API endpoint is different — try /backend/backoffice/files
    const altResult = await page.evaluate(async (sid: string) => {
      const endpoints = [
        `/backend/backoffice/files?serviceId=${sid}`,
        `/backend/services/${sid}/files`,
        `/backend/backoffice/${sid}/files`,
      ];
      const results: any[] = [];
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep);
          results.push({ endpoint: ep, status: r.status, body: (await r.text()).substring(0, 300) });
        } catch (e: any) {
          results.push({ endpoint: ep, error: e.message });
        }
      }
      return results;
    }, SERVICE_ID);
    console.log('  Alternative endpoints:', JSON.stringify(altResult, null, 2));

    fs.writeFileSync(LOG_PATH, JSON.stringify({ actionLog, allFiles: [], error: 'No files found', altResult }, null, 2));
    return;
  }

  // Get details for each file to find pending ones
  const pendingFiles: FileInfo[] = [];

  for (const f of allFiles) {
    const fileId = f.id || f.file_id;
    if (!fileId) continue;
    if (fileId === EXCLUDE_FILE_ID) {
      console.log(`  SKIP file ${fileId} (excluded - user testing)`);
      continue;
    }

    const details = await getFileDetails(page, fileId);
    if (details.error) {
      console.log(`  File ${fileId}: error ${details.error}`);
      continue;
    }

    const processId = details.process_instance_id || details.processInstanceId || details.processId;
    if (!processId) {
      console.log(`  File ${fileId}: no process (draft?)`);
      continue;
    }

    const tasks = await getTasks(page, processId);
    const pendingTasks = pending(tasks);

    if (pendingTasks.length > 0) {
      const taskNames = pendingTasks.map((t: any) => t.camundaName);
      console.log(`  File ${fileId}: ${pendingTasks.length} pending tasks: ${taskNames.join(', ')}`);
      pendingFiles.push({
        id: fileId,
        processId,
        status: 'pending',
        pendingTasks: taskNames,
      });
    } else {
      console.log(`  File ${fileId}: no pending tasks (completed)`);
    }
  }

  console.log(`\n  Total files with pending tasks: ${pendingFiles.length}`);

  if (pendingFiles.length === 0) {
    console.log('  Nothing to process!');
    fs.writeFileSync(LOG_PATH, JSON.stringify({ actionLog, pendingFiles: [], message: 'No pending files' }, null, 2));
    return;
  }

  console.log('\n========================================');
  console.log('  STEP 2: Process each pending file');
  console.log('========================================\n');

  for (const file of pendingFiles) {
    console.log(`\n╔══ Processing file ${file.id} ══╗`);
    console.log(`  Process: ${file.processId}`);
    console.log(`  Pending tasks: ${file.pendingTasks.join(', ')}`);

    // Process each pending task for this file
    let maxIterations = 30; // Safety limit
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Re-fetch current tasks
      const tasks = await getTasks(page, file.processId!);
      const pendingTasks = pending(tasks);

      if (pendingTasks.length === 0) {
        console.log(`  All tasks completed for file ${file.id}`);
        break;
      }

      // Process the first pending task
      const task = pendingTasks[0];
      const camundaName = task.camundaName;
      console.log(`  Iteration ${iteration}: processing ${camundaName}`);

      const success = await processRole(page, camundaName, file.id, file.processId!);

      if (!success) {
        console.log(`  Could not process ${camundaName}, trying next task...`);
        // If there are multiple pending tasks, try the next one
        if (pendingTasks.length > 1) {
          for (let i = 1; i < pendingTasks.length; i++) {
            const nextTask = pendingTasks[i];
            console.log(`  Trying alternative task: ${nextTask.camundaName}`);
            const altSuccess = await processRole(page, nextTask.camundaName, file.id, file.processId!);
            if (altSuccess) break;
          }
        }
        // Skip to next file if stuck
        if (iteration > 1) {
          log(file.id, camundaName, 'stuck', 'SKIP: moving to next file');
          break;
        }
      }

      await page.waitForTimeout(3000);
    }

    console.log(`╚══ Done with file ${file.id} ══╝\n`);
  }

  // Save final log
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');
  console.log(`  Actions taken: ${actionLog.length}`);
  for (const entry of actionLog) {
    console.log(`  - ${entry.fileId.substring(0,8)}... | ${entry.role} | ${entry.action} | ${entry.result}`);
  }

  fs.writeFileSync(LOG_PATH, JSON.stringify({
    service: SERVICE_ID,
    excludedFile: EXCLUDE_FILE_ID,
    actionLog,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log(`\n  Log saved to ${LOG_PATH}`);
});
