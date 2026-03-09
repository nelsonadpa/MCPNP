import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * MAIN: Submit 3 files and process each to ARC
 *
 * Service: 0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc (MAIN - Establish a new zone)
 * Goal: 3 files sitting at ARC role
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/main-3files-to-arc.spec.ts --project=jamaica-frontoffice --headed
 */

const SS = path.resolve(__dirname, '../screenshots/main-3files-to-arc');
const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const ARC_ROLE = 'arcAppRevCommittee';
const RESULTS_PATH = path.resolve(__dirname, '../test-data/main-3files-arc-results.json');

function ensureTestPdf() {
  const docsDir = path.resolve(__dirname, '../test-data/documents');
  fs.mkdirSync(docsDir, { recursive: true });
  const p = path.join(docsDir, 'test-doc.pdf');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF`);
  }
  return p;
}

async function getTasks(page: any, processId: string): Promise<any[]> {
  const result = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    const text = await r.text();
    if (!r.ok) return { error: `HTTP ${r.status}`, body: text.substring(0, 200) };
    try {
      const d = JSON.parse(text);
      return { tasks: (d.tasks || []).map((t: any) => ({ id: t.id, camundaName: t.camundaName, shortname: t.shortname, endTime: t.endTime })) };
    } catch { return { error: 'JSON parse', body: text.substring(0, 200) }; }
  }, processId);
  if (result.error) { console.log(`  ⚠ getTasks: ${result.error}`); return []; }
  return result.tasks;
}

function pending(tasks: any[]) { return tasks.filter((t: any) => !t.endTime); }
function pendingNames(tasks: any[]) { return pending(tasks).map((t: any) => t.camundaName); }

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

async function handleUploads(page: any, testPdf: string) {
  const browseLinks = page.locator('a.browse:visible, a:has-text("Browse"):visible');
  const count = await browseLinks.count();
  for (let i = 0; i < count; i++) {
    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLinks.nth(i).click(),
      ]);
      await fc.setFiles(testPdf); await page.waitForTimeout(2000);
    } catch {}
  }
}

async function processRole(page: any, camundaName: string, fileId: string, processId: string, testPdf: string): Promise<boolean> {
  console.log(`    Processing ${camundaName}...`);

  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(5000);
  if (!page.url().includes(processId)) { console.log('      SKIP: redirected'); return false; }

  // Click Processing tab
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // DocCheck: force-enable via comp.onClick()
  if (camundaName === 'documentsCheck') {
    console.log('      DocCheck: triggering via comp.onClick()...');
    await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.key === 'filevalidated_fc02c5aa-7216-2eda-df2a-7ad9171a30ce') {
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
    console.log(`      ✓ Done`);
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
    'button.btn-block:has-text("Approve")',
  ];
  let actionBtn: any = null;
  for (const sel of btnSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) { actionBtn = btn; break; }
  }
  if (!actionBtn) { console.log('      No action button'); return false; }

  const txt = (await actionBtn.textContent())?.trim() || '';
  console.log(`      Button: "${txt}"`);

  // NOC uploads
  if (txt.toLowerCase().includes('consultation') || camundaName.includes('noc') || camundaName.includes('Noc') || camundaName.includes('inspection') || camundaName.includes('Inspection')) {
    await handleUploads(page, testPdf);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(3000);
  }

  // No objection for approvals
  if (txt.toLowerCase().includes('decision') || camundaName.toLowerCase().includes('approval')) {
    await setNoObjection(page);
  }

  await saveEditGridRows(page);
  await enableAndClick(page, actionBtn);
  console.log(`      ✓ Done`);
  return true;
}

// ═══════════════════════════════════════════════════
// Step 1: Create a file + fill + submit via API
// ═══════════════════════════════════════════════════
async function createAndSubmitFile(page: any, fileNum: number): Promise<{ fileId: string; processId: string } | null> {
  console.log(`\n╔══ FILE ${fileNum}: Creating... ══╗`);

  // Navigate to service WITHOUT file_id — eRegistrations creates a new file automatically
  await page.goto(`/services/${SERVICE_ID}`);
  await page.waitForTimeout(12000);

  // Extract file_id from the URL (system redirects to /services/{sid}?file_id={newId})
  const currentUrl = page.url();
  const fileIdMatch = currentUrl.match(/file_id=([a-f0-9-]+)/);
  if (!fileIdMatch) {
    console.log(`  ❌ No file_id in URL: ${currentUrl}`);
    return null;
  }
  const fileId = fileIdMatch[1];
  console.log(`  File created: ${fileId}`);

  // Get form data
  let formData = await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return null;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      return form.root.submission?.data || null;
    }
    return null;
  });

  if (!formData) {
    console.log(`  ❌ No form data loaded`);
    return null;
  }

  // Pre-fill known required fields to reduce iterations
  const prefill: Record<string, any> = {
    applicantUnit: { key: 'acres', value: 'Acres' },
  };
  // Apply any smart prefills we know about
  for (const [k, v] of Object.entries(prefill)) {
    formData[k] = v;
  }

  // Iterative submit
  for (let attempt = 0; attempt < 15; attempt++) {
    console.log(`  Submit attempt ${attempt + 1}...`);

    const result = await page.evaluate(async (args: { fid: string, data: any }) => {
      const r = await fetch(`/backend/files/${args.fid}/start_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_content: JSON.stringify(args.data) }),
      });
      const text = await r.text();
      return { status: r.status, body: text };
    }, { fid: fileId, data: formData });

    if (result.status === 200 || result.status === 201) {
      const d = JSON.parse(result.body);
      const processId = d.process_instance_id || d.processId || d.id;
      console.log(`  ✅ SUBMITTED! Process: ${processId}`);
      return { fileId, processId };
    }

    if (result.status === 500) {
      console.log(`  ❌ 500 error: ${result.body.substring(0, 200)}`);
      return null;
    }

    if (result.status === 400) {
      try {
        const err = JSON.parse(result.body);
        const details = err.details || [];
        if (details.length === 0) {
          console.log(`  ❌ 400 no details: ${result.body.substring(0, 300)}`);
          return null;
        }

        let filled = 0;
        for (const d of details) {
          const key = d.path?.[0];
          if (!key) continue;
          const msg = d.message || '';

          if (msg.includes('non-empty array')) {
            formData[key] = [{ name: 'test-doc.pdf', url: '/test', size: 1024, type: 'application/pdf', storage: 'url', originalName: 'test-doc.pdf' }];
            filled++; continue;
          }
          if (msg.includes('mask')) {
            formData[key] = key.match(/Trn|trn|TRN|Registration/) ? '123456789' : '000000000';
            filled++; continue;
          }

          let val: any = `Test Data ${fileNum}`;
          if (key.match(/Email|email/)) val = `test${fileNum}@seza.gov.jm`;
          else if (key.match(/Phone|phone|Number|number/)) val = `+1876555${1000 + fileNum}`;
          else if (key.match(/area|Area|sqfeet|Sqfeet|Acres|acres|Size|size|Total|total|cost|Cost|Amount|amount|Spaces|spaces/)) val = 100 + fileNum;
          else if (key.match(/date|Date/)) val = `2025-0${fileNum}-15`;
          else if (key.match(/Multi|multi|Type|type|Focus|focus|Single|Occupant|occupant/)) val = 'Multi-occupant';
          else if (key.match(/parish|Parish|city|City/)) val = 'Kingston';
          else if (key.match(/address|Address/)) val = `${fileNum} Main Street, Kingston`;
          else if (key.match(/name|Name/)) val = `TEST-SEZ Zone ${fileNum}`;
          else if (key.match(/description|Description/)) val = `Test zone ${fileNum} for E2E testing.`;
          else if (key.match(/country|Country/)) val = 'Jamaica';
          else if (key.match(/yes|Yes|no|No|true|True|false|False/)) val = true;
          else if (key.match(/select|Select|choose|Choose/)) val = 'yes';

          if (msg.includes('is required')) { formData[key] = val; filled++; }
        }

        console.log(`    Filled ${filled}/${details.length} fields`);
        if (filled === 0) {
          for (const d of details.slice(0, 10)) console.log(`    - ${d.path?.[0]}: ${d.message}`);
          return null;
        }
      } catch (e: any) {
        console.log(`  ❌ Parse error: ${e.message}`);
        return null;
      }
    } else {
      console.log(`  ❌ Unexpected ${result.status}: ${result.body.substring(0, 300)}`);
      return null;
    }
  }
  console.log(`  ❌ Max attempts reached`);
  return null;
}

// ═══════════════════════════════════════════════════
// Step 2: Process file through pipeline to ARC
// ═══════════════════════════════════════════════════
async function processToArc(page: any, fileId: string, processId: string, fileNum: number, testPdf: string): Promise<boolean> {
  console.log(`\n═══ FILE ${fileNum}: Processing to ARC ═══`);
  console.log(`  File: ${fileId}`);
  console.log(`  Process: ${processId}`);

  // Wait for process engine to create tasks (can take 10-20s after submission)
  await page.goto('/');
  await page.waitForTimeout(5000);

  // Retry until tasks appear (process engine needs time)
  let initialTasks: any[] = [];
  for (let wait = 0; wait < 6; wait++) {
    initialTasks = await getTasks(page, processId);
    const p = pending(initialTasks);
    if (p.length > 0) {
      console.log(`  Initial pending (after ${(wait + 1) * 5}s): ${pendingNames(initialTasks).join(', ')}`);
      break;
    }
    console.log(`  Waiting for tasks... (attempt ${wait + 1}/6)`);
    await page.waitForTimeout(5000);
  }

  if (pending(initialTasks).length === 0) {
    console.log(`  ❌ No tasks appeared after 30s`);
    return false;
  }

  const completedRoles: string[] = [];
  let iteration = 0;
  const MAX_ITERATIONS = 25;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    const tasks = await getTasks(page, processId);
    const pend = pending(tasks);
    const pNames = pend.map((t: any) => t.camundaName);

    if (pend.length === 0) { console.log('  No pending tasks!'); return false; }

    // Check if ARC is pending
    const arcTask = pend.find((t: any) =>
      t.camundaName === ARC_ROLE ||
      t.camundaName.toLowerCase().includes('arc')
    );
    if (arcTask) {
      console.log(`  ✅ ARC REACHED for file ${fileNum}! Task: ${arcTask.camundaName}`);
      return true;
    }

    const task = pend[0];
    console.log(`  [${iteration}] ${task.camundaName}`);

    // Guard: stuck detection
    const attempts = completedRoles.filter(r => r === task.camundaName).length;
    if (attempts >= 2) {
      console.log(`  ❌ Task "${task.camundaName}" stuck after ${attempts} attempts`);
      return false;
    }

    const success = await processRole(page, task.camundaName, fileId, processId, testPdf);
    if (success) {
      completedRoles.push(task.camundaName);
    } else {
      console.log(`  ⚠ Could not process ${task.camundaName}`);
      // Try next pending task
      if (pend.length > 1) {
        const next = pend[1];
        console.log(`  Trying next: ${next.camundaName}`);
        const ok = await processRole(page, next.camundaName, fileId, processId, testPdf);
        if (ok) completedRoles.push(next.camundaName);
        else return false;
      } else {
        return false;
      }
    }
    await page.waitForTimeout(2000);
  }

  console.log(`  ❌ Max iterations reached for file ${fileNum}`);
  return false;
}

// ═══════════════════════════════════════════════════
// MAIN TEST
// ═══════════════════════════════════════════════════
test('MAIN: Submit 3 files and process each to ARC', async ({ page }) => {
  test.setTimeout(3_600_000); // 60 min (3 files × ~20 min pipeline)
  fs.mkdirSync(SS, { recursive: true });
  const testPdf = ensureTestPdf();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  MAIN: 3 FILES → ARC                             ║');
  console.log('║  Service: 0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Login
  await page.goto('/');
  await page.waitForTimeout(5000);

  const results: any[] = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  FILE ${i} OF 3`);
    console.log(`${'═'.repeat(60)}`);

    const submitted = await createAndSubmitFile(page, i);
    if (!submitted) {
      console.log(`\n  ❌ FILE ${i}: Failed to create/submit`);
      results.push({ fileNum: i, status: 'SUBMIT_FAILED' });
      continue;
    }

    results.push({
      fileNum: i,
      fileId: submitted.fileId,
      processId: submitted.processId,
      status: 'SUBMITTED',
    });

    // Save intermediate results
    fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, files: results, timestamp: new Date().toISOString() }, null, 2));

    // Process to ARC
    const reachedArc = await processToArc(page, submitted.fileId, submitted.processId, i, testPdf);

    results[results.length - 1].status = reachedArc ? 'AT_ARC' : 'STUCK';
    results[results.length - 1].reachedArc = reachedArc;

    // Verify current pending tasks
    const tasks = await getTasks(page, submitted.processId);
    results[results.length - 1].pendingTasks = pendingNames(tasks);

    // Save after each file
    fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, files: results, timestamp: new Date().toISOString() }, null, 2));

    console.log(`\n  FILE ${i}: ${reachedArc ? '✅ AT ARC' : '❌ NOT AT ARC'}`);
    console.log(`  Pending: ${pendingNames(tasks).join(', ')}`);
  }

  // ═══════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  FINAL SUMMARY — 3 FILES TO ARC');
  console.log(`${'═'.repeat(60)}`);

  const atArc = results.filter(r => r.status === 'AT_ARC');
  const failed = results.filter(r => r.status !== 'AT_ARC');

  console.log(`  ✅ At ARC: ${atArc.length}/3`);
  for (const r of atArc) {
    console.log(`    File ${r.fileNum}: ${r.fileId} (process: ${r.processId})`);
  }
  if (failed.length) {
    console.log(`  ❌ Failed: ${failed.length}/3`);
    for (const r of failed) {
      console.log(`    File ${r.fileNum}: ${r.status} — pending: ${r.pendingTasks?.join(', ') || 'N/A'}`);
    }
  }

  fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, files: results, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\n  Results saved to ${RESULTS_PATH}`);
});
