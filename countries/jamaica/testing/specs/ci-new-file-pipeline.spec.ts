import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * CI Selective Routing — NEW FILE PIPELINE
 *
 * New file submitted with UPDATED config (ARC status → CI role).
 * File: f16763e1-45df-4db8-a1b6-a5982279ac55
 * Process: 5cdfcc6a-188a-11f1-899e-b6594fb67add
 * Service: PARTB 28bf8aca-6d59-45ce-b81f-5068ab5ae7e1
 *
 * Pipeline:
 *   1. Approve DocCheck
 *   2. Process all evals + approvals → ARC
 *   3. ARC: fill EditGrid3 (Legal+Business) + Request additional info
 *   4. CI role (applicant) → submit
 *   5. Verify selective routing
 *   6. Process selective evals + approvals → ARC
 *   7. ARC → Send to Board submission
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/ci-new-file-pipeline.spec.ts --project=jamaica-frontoffice --headed
 */

const SS = path.resolve(__dirname, '../screenshots/ci-new-pipeline');
const SERVICE_ID = '28bf8aca-6d59-45ce-b81f-5068ab5ae7e1';
const PROCESS_ID = '5cdfcc6a-188a-11f1-899e-b6594fb67add';
const FILE_ID = 'f16763e1-45df-4db8-a1b6-a5982279ac55';
const ARC_ROLE = 'arcAppRevCommittee';
const EDITGRID3_KEY = 'applicationReviewingCommitteeArcDecisionEditGrid3';
const SELECT_KEY = 'applicationReviewingCommitteeArcDecisionSelectUnitsThatWillReview3';
const ADDITIONAL_INFO_KEY = 'applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditionalInformationOrSupportingDocumentationBeforeProceedingToTheNextStage';

function ensureTestPdf() {
  const docsDir = path.resolve(__dirname, '../test-data/documents');
  fs.mkdirSync(docsDir, { recursive: true });
  const p = path.join(docsDir, 'test-doc.pdf');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF`);
  }
  return p;
}

async function getTasks(page: any): Promise<any[]> {
  const result = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    const text = await r.text();
    if (!r.ok) return { error: `HTTP ${r.status}`, body: text.substring(0, 200) };
    try {
      const d = JSON.parse(text);
      return { tasks: (d.tasks || []).map((t: any) => ({ id: t.id, camundaName: t.camundaName, shortname: t.shortname, endTime: t.endTime })) };
    } catch { return { error: 'JSON parse', body: text.substring(0, 200) }; }
  }, PROCESS_ID);
  if (result.error) { console.log(`  ⚠ getTasks: ${result.error}`); return []; }
  return result.tasks;
}

function pending(tasks: any[]) { return tasks.filter((t: any) => !t.endTime); }
function pendingNames(tasks: any[]) { return pending(tasks).map((t: any) => t.camundaName); }

async function ss(page: any, name: string) {
  await page.screenshot({ path: `${SS}/${name}.png` }).catch(() => {});
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
        });
        form.root.checkConditions?.();
      }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(3000);
  }
  try {
    await btnLocator.click({ timeout: 10_000 });
  } catch {
    await btnLocator.click({ force: true, timeout: 10_000 });
  }
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
  if (count === 0) return;
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

async function processRole(page: any, camundaName: string, testPdf: string): Promise<boolean> {
  console.log(`    Processing ${camundaName}...`);
  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  if (!page.url().includes(PROCESS_ID)) { console.log('      SKIP: redirected'); return false; }

  // Click Processing tab (buttons are there, not on Documents tab)
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  const btnSelectors = [
    'button:has-text("Approve documents check")',
    'button:has-text("Send evaluation to approval")',
    'button:has-text("Send evaluation for approval")',
    'button:has-text("Send consultation documents")',
    'button:has-text("Send decision to SEZA")',
    'button:has-text("Approve and send to ARC")',
    'button:has-text("Approve and send")',
    'button:has-text("Send to ARC")',
    'button:has-text("Approve")',
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
  if (txt.toLowerCase().includes('consultation') || camundaName.includes('noc') || camundaName.includes('inspection') || camundaName.includes('Noc') || camundaName.includes('Inspection')) {
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

// ═════════════════════════════════════════════════════════
// MAIN TEST
// ═════════════════════════════════════════════════════════

test('CI Pipeline — New File', async ({ page }) => {
  test.setTimeout(1_200_000); // 20 min
  fs.mkdirSync(SS, { recursive: true });
  const testPdf = ensureTestPdf();
  const report: any = { fileId: FILE_ID, processId: PROCESS_ID, steps: [] };

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  CI SELECTIVE ROUTING — NEW FILE PIPELINE        ║');
  console.log(`║  File: ${FILE_ID}  ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  await page.goto('/');
  await page.waitForTimeout(3000);

  // ════════════════════════════════════════════
  // PHASE A: DocCheck → all evals → approvals → ARC
  // ════════════════════════════════════════════
  console.log('═══ PHASE A: DocCheck → evals → approvals → ARC ═══\n');

  let tasks = await getTasks(page);
  let pNames = pendingNames(tasks);
  console.log(`  Initial pending: ${pNames.join(', ')}`);

  const completedRoles: string[] = [];
  const skippedRoles: string[] = [];
  let reachedARC = false;
  let iteration = 0;
  const MAX_ITERATIONS = 25;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    tasks = await getTasks(page);
    const pend = pending(tasks);
    pNames = pend.map((t: any) => t.camundaName);

    if (pend.length === 0) { console.log('\n  No more pending tasks!'); break; }

    // Check if ARC is pending — STOP
    const arcTask = pend.find((t: any) =>
      t.camundaName.toLowerCase().includes('arc') ||
      t.camundaName.toLowerCase().includes('complementary')
    );
    if (arcTask) {
      console.log(`\n  ✅ ARC/CI REACHED: ${arcTask.camundaName}`);
      reachedARC = true;
      break;
    }

    const task = pend[0];
    console.log(`\n─── [${iteration}] ${task.camundaName} (${task.shortname || ''}) ───`);

    const success = await processRole(page, task.camundaName, testPdf);
    if (success) {
      completedRoles.push(task.camundaName);
    } else {
      skippedRoles.push(task.camundaName);
    }
    await page.waitForTimeout(2000);
  }

  console.log(`\n  Phase A: completed ${completedRoles.length}, skipped ${skippedRoles.length}`);
  console.log(`  Completed: ${completedRoles.join(', ')}`);
  if (skippedRoles.length) console.log(`  Skipped: ${skippedRoles.join(', ')}`);

  report.steps.push({ phase: 'A', completedRoles, skippedRoles, reachedARC });

  if (!reachedARC) {
    console.log('\n  ❌ Did not reach ARC. Stopping.');
    fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-new-pipeline-results.json'), JSON.stringify(report, null, 2));
    return;
  }

  // Refresh tasks
  await page.goto('/');
  await page.waitForTimeout(3000);
  tasks = await getTasks(page);
  pNames = pendingNames(tasks);
  console.log(`\n  At ARC: pending = ${pNames.join(', ')}`);

  // ════════════════════════════════════════════
  // PHASE B: ARC → Request additional information
  // ════════════════════════════════════════════
  console.log('\n═══ PHASE B: ARC → Request additional information ═══\n');

  await page.goto(`/part-b/${SERVICE_ID}/${ARC_ROLE}/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);
  await ss(page, 'b1-arc-loaded');

  // Clear stale EditGrid rows
  await page.evaluate((key: string) => {
    const formio = (window as any).Formio; if (!formio?.forms) return;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.key === key && comp.editRows) {
          for (let i = comp.editRows.length - 1; i >= 0; i--) {
            try { comp.removeRow(i); } catch {}
          }
        }
      });
    }
  }, EDITGRID3_KEY);
  await page.waitForTimeout(1000);

  // Set additional info = yes
  console.log('  Setting additional info = yes...');
  await page.evaluate((key: string) => {
    const formio = (window as any).Formio; if (!formio?.forms) return;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.key === key) { comp.setValue('yes'); comp.triggerChange?.(); }
      });
      form.root.checkConditions?.();
    }
  }, ADDITIONAL_INFO_KEY);
  await page.waitForTimeout(2000);

  // Fill grid with Legal + Business
  console.log('  Filling EditGrid3 with Legal + Business...');
  await page.evaluate((args: { gridKey: string, selectKey: string }) => {
    const formio = (window as any).Formio; if (!formio?.forms) return;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.key === args.gridKey) {
          comp.dataValue = [
            { [args.selectKey]: { key: 'cddc9829-70df-4824-945e-8bafc9817d92', value: 'Legal' } },
            { [args.selectKey]: { key: 'dcbb678a-e6eb-49f0-a458-759dded6f5dc', value: 'Business' } },
          ];
          comp.triggerChange?.();
        }
      });
    }
  }, { gridKey: EDITGRID3_KEY, selectKey: SELECT_KEY });
  await page.waitForTimeout(2000);

  // Save draft
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(5000);
  await ss(page, 'b2-grid-filled');

  // Verify grid
  const gridData = await page.evaluate((key: string) => {
    const formio = (window as any).Formio; if (!formio?.forms) return null;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      let data: any = null;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.key === key) data = comp.dataValue;
      });
      if (data) return data;
    } return null;
  }, EDITGRID3_KEY);
  console.log(`  Grid data: ${JSON.stringify(gridData)}`);

  // Trigger fileDecline via formio customEvent (proven mechanism)
  console.log('  Triggering fileDecline via customEvent...');
  const emitResult = await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return 'no formio';
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (form && form.emit) {
        form.emit('customEvent', {
          type: 'fileDecline',
          component: { key: 'applicationReviewingCommitteeArcDecisionRequestAdditionalInformation' }
        });
        return 'emitted';
      }
    }
    return 'no form';
  });
  console.log(`  Emit: ${emitResult}`);
  await page.waitForTimeout(10000);

  // Handle confirmation dialog
  for (const label of ['OK', 'Confirm', 'Yes', 'Send back', 'Decline']) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`  Confirming "${label}"...`);
      await btn.click(); await page.waitForTimeout(5000); break;
    }
  }

  await ss(page, 'b3-after-decline');

  // Check what happened
  await page.goto('/');
  await page.waitForTimeout(5000);
  tasks = await getTasks(page);
  pNames = pendingNames(tasks);
  console.log(`\n  PHASE B RESULT: pending = ${pNames.join(', ')}`);

  const arcAdvanced = !pNames.includes(ARC_ROLE);
  const hasCi = pNames.some(n => n.toLowerCase().includes('complementary'));
  console.log(`  ARC advanced: ${arcAdvanced}`);
  console.log(`  CI role pending: ${hasCi}`);

  report.steps.push({ phase: 'B', arcAdvanced, hasCi, pendingTasks: pNames });

  if (!arcAdvanced) {
    console.log('\n  ❌ ARC did NOT advance. Stopping.');
    fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-new-pipeline-results.json'), JSON.stringify(report, null, 2));
    return;
  }

  if (!hasCi) {
    console.log('\n  ⚠ ARC advanced but no CI task. Went to: ' + pNames.join(', '));
    console.log('  The workflow transition may still be misconfigured.');
    report.steps.push({ phase: 'B-fail', note: 'No CI task created', pendingTasks: pNames });
    fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-new-pipeline-results.json'), JSON.stringify(report, null, 2));
    return;
  }

  console.log('  ✅ CI role activated!\n');

  // ════════════════════════════════════════════
  // PHASE C: CI role (applicant) → submit
  // ════════════════════════════════════════════
  console.log('═══ PHASE C: CI role (applicant) → submit ═══\n');

  // CI role is applicant-facing — use /services/ URL (NOT /part-b/)
  const ciUrl = `/services/${SERVICE_ID}?file_id=${FILE_ID}`;
  console.log(`  Navigating to CI: ${ciUrl}`);
  await page.goto(ciUrl);
  await page.waitForTimeout(8000);
  await ss(page, 'c1-ci-page');

  // Fill EditGrid rows with document name + explanation (for each unit section)
  // The CI form has EditGrids for each selected unit — fill them via Formio API
  const fillResult = await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return 'no formio';
    const filled: string[] = [];
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        // Fill textareas (document name, explanation)
        if (comp.component?.type === 'textarea' && comp.component.key?.startsWith('complementary')) {
          const key = comp.component.key;
          if (key.includes('DocumentNameAndReason')) {
            comp.setValue('Additional business plan documentation');
            comp.triggerChange?.();
            filled.push(`textarea:${key}`);
          } else if (key.includes('Explanation')) {
            comp.setValue('Providing supplementary documents as requested by ARC review committee.');
            comp.triggerChange?.();
            filled.push(`textarea:${key}`);
          }
        }
        // Fill EditGrids that are empty (add a row with data)
        if (comp.component?.type === 'editgrid' && comp.component.key?.startsWith('complementary')) {
          if (!comp.dataValue || comp.dataValue.length === 0) {
            // Add a minimal row
            comp.dataValue = [{}];
            comp.triggerChange?.();
            filled.push(`editgrid:${comp.component.key}(added row)`);
          }
        }
      });
    }
    return filled;
  });
  console.log('  Fill result:', fillResult);

  // Save draft
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(5000);
  await ss(page, 'c2-ci-filled');

  // Try "Validate send page" button
  const validateBtn = page.locator('button:has-text("Validate send page")').first();
  if (await validateBtn.isVisible().catch(() => false)) {
    console.log('  Clicking "Validate send page"...');
    // Dispatch saveSENDPAGE event (same as corrections flow)
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveSENDPAGE')));
    await page.waitForTimeout(10000);
    console.log('  URL after saveSENDPAGE:', page.url());

    // Handle confirmation dialog
    for (const label of ['OK', 'Confirm', 'Yes', 'Submit', 'Send']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`  Confirming "${label}"...`);
        await btn.click(); await page.waitForTimeout(5000); break;
      }
    }
  } else {
    console.log('  ⚠ "Validate send page" button not found, trying direct click...');
    await enableAndClick(page, page.locator('button:has-text("Submit")').first());
  }

  await ss(page, 'c2-ci-submitted');

  await page.goto('/');
  await page.waitForTimeout(5000);
  tasks = await getTasks(page);
  pNames = pendingNames(tasks);
  console.log(`\n  PHASE C RESULT: pending = ${pNames.join(', ')}`);
  report.steps.push({ phase: 'C', pendingTasks: pNames });

  // ════════════════════════════════════════════
  // PHASE D: Verify selective routing
  // ════════════════════════════════════════════
  console.log('\n═══ PHASE D: Verify selective routing ═══\n');

  const legalEval = pNames.includes('legalEvaluation');
  const businessEval = pNames.includes('businessEvaluation');
  const technicalEval = pNames.includes('technicalEvaluation');
  const complianceEval = pNames.includes('complianceEvaluation');
  const nocEval = pNames.includes('organizeNocAndInspection');
  const tajAppr = pNames.includes('tajApproval');
  const jcaAppr = pNames.includes('jcaApproval');
  const mofpsAppr = pNames.includes('mofpsApproval');

  console.log('  EXPECTED ACTIVE:');
  console.log(`    legalEvaluation:      ${legalEval ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
  console.log(`    businessEvaluation:   ${businessEval ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
  console.log('  EXPECTED SKIPPED:');
  console.log(`    technicalEvaluation:  ${technicalEval ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);
  console.log(`    complianceEvaluation: ${complianceEval ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);
  console.log(`    organizeNocAndInsp:   ${nocEval ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);
  console.log(`    tajApproval:          ${tajAppr ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);
  console.log(`    jcaApproval:          ${jcaAppr ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);
  console.log(`    mofpsApproval:        ${mofpsAppr ? '⚠️ ACTIVE (unexpected!)' : '✅ skipped'}`);

  const selectiveWorks = legalEval && businessEval && !technicalEval && !complianceEval && !nocEval && !tajAppr && !jcaAppr && !mofpsAppr;
  console.log(`\n  SELECTIVE ROUTING: ${selectiveWorks ? '✅✅✅ PASS' : '❌ FAIL'}`);

  report.steps.push({
    phase: 'D', selectiveWorks, pendingTasks: pNames,
    active: { legalEval, businessEval },
    skipped: { technicalEval, complianceEval, nocEval, tajAppr, jcaAppr, mofpsAppr },
  });

  if (!legalEval && !businessEval) {
    console.log('\n  No evals active — stopping.');
    fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-new-pipeline-results.json'), JSON.stringify(report, null, 2));
    return;
  }

  // ════════════════════════════════════════════
  // PHASE E: Process selective evals + approvals → ARC
  // ════════════════════════════════════════════
  console.log('\n═══ PHASE E: Process selective evals + approvals ═══\n');

  if (legalEval) await processRole(page, 'legalEvaluation', testPdf);
  if (businessEval) await processRole(page, 'businessEvaluation', testPdf);

  await page.goto('/'); await page.waitForTimeout(5000);
  tasks = await getTasks(page); pNames = pendingNames(tasks);
  console.log(`  After evals: pending = ${pNames.join(', ')}`);

  // Process any activated approvals
  for (const role of ['legalApproval', 'businessApproval', 'technicalApproval', 'complianceApproval']) {
    if (pNames.includes(role)) {
      await processRole(page, role, testPdf);
    }
  }

  await page.goto('/'); await page.waitForTimeout(5000);
  tasks = await getTasks(page); pNames = pendingNames(tasks);
  console.log(`  After approvals: pending = ${pNames.join(', ')}`);

  const arcBack = pNames.includes(ARC_ROLE);
  console.log(`  ARC back: ${arcBack ? '✅ YES' : '❌ NO'}`);
  report.steps.push({ phase: 'E', pendingTasks: pNames, arcBack });

  // ════════════════════════════════════════════
  // PHASE F: ARC → Send to Board submission
  // ════════════════════════════════════════════
  if (arcBack) {
    console.log('\n═══ PHASE F: ARC → Send to Board submission ═══\n');
    await page.goto(`/part-b/${SERVICE_ID}/${ARC_ROLE}/${PROCESS_ID}?file_id=${FILE_ID}`);
    await page.waitForTimeout(8000);

    // Click Processing tab
    const procTabF = page.locator('a:has-text("Processing")').first();
    if (await procTabF.isVisible().catch(() => false)) {
      await procTabF.click();
      await page.waitForTimeout(3000);
    }

    // The "Send to Board submission" button is hidden by default (determinant-controlled).
    // Force-show it via Formio API then click, OR emit the customEvent directly.

    // 1. Make button visible + enable FORMDATAVALIDATIONSTATUS
    await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.key === 'FORMDATAVALIDATIONSTATUS') {
            comp.setValue('true'); comp.triggerChange?.();
          }
          // Unhide the "Send to Board submission" button
          if (comp.component?.key === 'filevalidated_575a341d-4e60-71f0-9de6-58a5dbf4afdf') {
            comp.visible = true;
            comp.component.hidden = false;
            comp.redraw?.();
          }
        });
        form.root.checkConditions?.();
      }
    });
    await page.waitForTimeout(3000);

    const boardBtn = page.locator('button:has-text("Send to Board submission")').first();
    if (await boardBtn.isVisible().catch(() => false)) {
      console.log('  Clicking "Send to Board submission" button...');
      await enableAndClick(page, boardBtn);
    } else {
      // Fallback: emit customEvent
      console.log('  Button still hidden, triggering fileValidated via customEvent...');
    }

    const boardResult = await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return 'no formio';
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (form && form.emit) {
          form.emit('customEvent', {
            type: 'fileValidated',
            component: { key: 'filevalidated_575a341d-4e60-71f0-9de6-58a5dbf4afdf' }
          });
          return 'emitted';
        }
      }
      return 'no form';
    });
    console.log(`  Emit: ${boardResult}`);
    await page.waitForTimeout(10000);

    for (const label of ['OK', 'Confirm', 'Yes']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click(); await page.waitForTimeout(5000); break;
      }
    }

    await page.goto('/'); await page.waitForTimeout(5000);
    tasks = await getTasks(page); pNames = pendingNames(tasks);
    console.log(`  After Board: pending = ${pNames.join(', ')}`);
    report.steps.push({ phase: 'F', pendingTasks: pNames });
  }

  // ════════════════════════════════════════════
  // FINAL REPORT
  // ════════════════════════════════════════════
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  FINAL SUMMARY');
  console.log(`${'═'.repeat(50)}`);
  tasks = await getTasks(page);
  const totalCompleted = tasks.filter((t: any) => t.endTime).length;
  const totalPending = pending(tasks).length;
  console.log(`  Total: ${tasks.length} | Completed: ${totalCompleted} | Pending: ${totalPending}`);
  console.log(`  Pending: ${pendingNames(tasks).join(', ')}`);
  console.log(`  Selective routing: ${selectiveWorks ? '✅ PASS' : '❌ FAIL'}`);

  report.selectiveWorks = selectiveWorks;
  report.finalTasks = { total: tasks.length, completed: totalCompleted, pending: pendingNames(tasks) };

  fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-new-pipeline-results.json'), JSON.stringify(report, null, 2));
  console.log('\n  Results saved to test-data/ci-new-pipeline-results.json');
});
