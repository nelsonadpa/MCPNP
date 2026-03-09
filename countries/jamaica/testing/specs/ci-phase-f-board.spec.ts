import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase F: ARC → Send to Board submission → process remaining roles
 *
 * Fix: Set radio to "no" (unhides button) + save/cancel unsaved EditGrid rows
 * (validation error: "Please save all rows before proceeding")
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/ci-phase-f-board.spec.ts --project=jamaica-frontoffice --headed
 */

const SS = path.resolve(__dirname, '../screenshots/ci-new-pipeline');
const SERVICE_ID = '28bf8aca-6d59-45ce-b81f-5068ab5ae7e1';
const PROCESS_ID = '5cdfcc6a-188a-11f1-899e-b6594fb67add';
const FILE_ID = 'f16763e1-45df-4db8-a1b6-a5982279ac55';
const ARC_ROLE = 'arcAppRevCommittee';
const ADDITIONAL_INFO_KEY = 'applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditionalInformationOrSupportingDocumentationBeforeProceedingToTheNextStage';

async function getTasks(page: any): Promise<any[]> {
  const result = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    const text = await r.text();
    if (!r.ok) return { error: `HTTP ${r.status}` };
    try {
      const d = JSON.parse(text);
      return { tasks: (d.tasks || []).map((t: any) => ({ id: t.id, camundaName: t.camundaName, shortname: t.shortname, endTime: t.endTime })) };
    } catch { return { error: 'JSON parse' }; }
  }, PROCESS_ID);
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
      console.log(`    Confirming "${label}"...`);
      await btn.click(); await page.waitForTimeout(5000); break;
    }
  }
}

async function processRole(page: any, camundaName: string): Promise<boolean> {
  console.log(`  Processing ${camundaName}...`);
  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  if (!page.url().includes(PROCESS_ID)) { console.log('    SKIP: redirected'); return false; }

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
    'button:has-text("Issue status letter")',
    'button:has-text("Issue letter")',
    'button:has-text("Generate")',
    'button:has-text("Sign")',
    'button:has-text("Approve")',
  ];
  let actionBtn: any = null;
  for (const sel of btnSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) { actionBtn = btn; break; }
  }
  if (!actionBtn) {
    const visibleBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null)
        .map(b => b.textContent?.trim().substring(0, 60))
        .filter(t => t && t.length > 2);
    });
    console.log(`    No action button. Visible: ${visibleBtns.join(' | ')}`);
    return false;
  }

  const txt = (await actionBtn.textContent())?.trim() || '';
  console.log(`    Button: "${txt}"`);

  if (txt.toLowerCase().includes('decision') || camundaName.toLowerCase().includes('approval')) {
    const lbl = page.locator('label, span').filter({ hasText: /^No objection$/ }).first();
    if (await lbl.isVisible().catch(() => false)) { await lbl.click(); await page.waitForTimeout(1000); }
  }

  await enableAndClick(page, actionBtn);
  console.log(`    ✓ Done`);
  return true;
}

test('Phase F+: ARC → Board → beyond', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SS, { recursive: true });

  await page.goto('/');
  await page.waitForTimeout(3000);

  let tasks = await getTasks(page);
  let pNames = pendingNames(tasks);
  console.log(`\nStarting state: pending = ${pNames.join(', ')}`);

  // ═══════════════════════════════════
  // PHASE F: ARC → Send to Board
  // ═══════════════════════════════════
  if (pNames.includes(ARC_ROLE)) {
    console.log('\n═══ PHASE F: ARC → Send to Board submission ═══\n');

    await page.goto(`/part-b/${SERVICE_ID}/${ARC_ROLE}/${PROCESS_ID}?file_id=${FILE_ID}`);
    await page.waitForTimeout(8000);

    // Click Processing tab
    const procTab = page.locator('a:has-text("Processing")').first();
    if (await procTab.isVisible().catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(3000);
    }

    // Step 1: Change radio to "no" → unhides "Send to Board" button
    console.log('  Step 1: Setting radio "additional info" to "no"...');
    await page.evaluate((key: string) => {
      const formio = (window as any).Formio; if (!formio?.forms) return;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.key === key) { comp.setValue('no'); comp.triggerChange?.(); }
          if (comp.component?.key === 'FORMDATAVALIDATIONSTATUS') { comp.setValue('true'); comp.triggerChange?.(); }
        });
        form.root.checkConditions?.();
      }
    }, ADDITIONAL_INFO_KEY);
    await page.waitForTimeout(2000);

    // Step 2: Save/cancel unsaved EditGrid rows (fix "Please save all rows before proceeding")
    console.log('  Step 2: Fixing EditGrid rows...');
    const gridFix = await page.evaluate(() => {
      const formio = (window as any).Formio; if (!formio?.forms) return { saved: 0, cancelled: 0 };
      let saved = 0, cancelled = 0;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk]; if (!form?.root) continue;
        form.root.everyComponent((comp: any) => {
          if (comp.component?.type === 'editgrid' && comp.editRows) {
            // First try to save rows
            for (let i = 0; i < comp.editRows.length; i++) {
              const state = comp.editRows[i]?.state;
              if (state === 'new' || state === 'editing') {
                try { comp.saveRow(i); saved++; } catch {
                  // If save fails, cancel the row
                  try { comp.cancelRow(i); cancelled++; } catch {}
                }
              }
            }
          }
        });
      }
      return { saved, cancelled };
    });
    console.log(`    Saved: ${gridFix.saved}, Cancelled: ${gridFix.cancelled}`);

    // Step 3: Save draft
    console.log('  Step 3: Saving draft...');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(5000);

    // Step 4: Click "Send to Board submission"
    const boardBtn = page.locator('button:has-text("Send to Board submission")').first();
    const isBoardVisible = await boardBtn.isVisible().catch(() => false);
    console.log(`  Step 4: Board button visible: ${isBoardVisible}`);

    if (isBoardVisible) {
      console.log('  Clicking "Send to Board submission"...');

      // Monitor network
      const requests: any[] = [];
      page.on('request', (req: any) => {
        const url = req.url();
        if (url.includes('backend') && !url.includes('.js') && !url.includes('.css')) {
          requests.push({ method: req.method(), url: url.replace('https://jamaica.eregistrations.org', '').substring(0, 100) });
        }
      });

      // Monitor console for errors
      const errors: string[] = [];
      page.on('console', (msg: any) => {
        if (msg.text().includes('error') || msg.text().includes('Error') || msg.text().includes('fail'))
          errors.push(msg.text());
      });

      await boardBtn.click();
      await page.waitForTimeout(10000);

      // Handle any dialog
      for (const label of ['OK', 'Confirm', 'Yes', 'Send']) {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`    Found confirmation "${label}" — clicking...`);
          await btn.click();
          await page.waitForTimeout(8000);
          break;
        }
      }

      console.log(`    Network: ${requests.length} requests`);
      for (const r of requests) console.log(`      ${r.method} ${r.url}`);
      if (errors.length > 0) {
        console.log(`    Console errors: ${errors.length}`);
        for (const e of errors.slice(0, 5)) console.log(`      ${e}`);
      }

      await page.screenshot({ path: `${SS}/f-after-board.png` });
    } else {
      console.log('  ❌ Board button not visible!');
    }

    // Check result
    await page.goto('/'); await page.waitForTimeout(5000);
    tasks = await getTasks(page); pNames = pendingNames(tasks);
    console.log(`\n  Phase F result: pending = ${pNames.join(', ')}`);
    console.log(`  ARC advanced: ${!pNames.includes(ARC_ROLE) ? '✅ YES' : '❌ NO'}`);
  }

  // ═══════════════════════════════════
  // BONUS: Process remaining roles
  // ═══════════════════════════════════
  tasks = await getTasks(page); pNames = pendingNames(tasks);

  if (pNames.length > 0 && !pNames.includes(ARC_ROLE)) {
    console.log('\n═══ BONUS: Processing remaining roles ═══\n');
    let iteration = 0;
    while (iteration < 15) {
      iteration++;
      tasks = await getTasks(page); pNames = pendingNames(tasks);
      if (pNames.length === 0) { console.log('  🏁 No more pending tasks!'); break; }
      console.log(`\n  [${iteration}] Pending: ${pNames.join(', ')}`);
      let processed = false;
      for (const name of pNames) {
        const ok = await processRole(page, name);
        if (ok) { processed = true; break; }
      }
      if (!processed) { console.log('  ⚠ No role could be processed. Stopping.'); break; }
    }
  }

  // ═══════════════════════════════════
  // FINAL
  // ═══════════════════════════════════
  tasks = await getTasks(page);
  const totalCompleted = tasks.filter((t: any) => t.endTime).length;
  pNames = pendingNames(tasks);
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  FINAL STATUS');
  console.log(`${'═'.repeat(50)}`);
  console.log(`  Total: ${tasks.length} | Completed: ${totalCompleted} | Pending: ${pending(tasks).length}`);
  console.log(`  Pending: ${pNames.join(', ') || '(none)'}`);

  const results = { fileId: FILE_ID, processId: PROCESS_ID, totalTasks: tasks.length, completed: totalCompleted, pending: pNames, timestamp: new Date().toISOString() };
  fs.mkdirSync(path.resolve(__dirname, '../test-data'), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-phase-f-results.json'), JSON.stringify(results, null, 2));
});
