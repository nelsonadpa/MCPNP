import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Continue processing after Phase F: handle complementaryInformationSl
 * and any remaining roles.
 */

const SS = path.resolve(__dirname, '../screenshots/ci-new-pipeline');
const SERVICE_ID = '28bf8aca-6d59-45ce-b81f-5068ab5ae7e1';
const PROCESS_ID = '5cdfcc6a-188a-11f1-899e-b6594fb67add';
const FILE_ID = 'f16763e1-45df-4db8-a1b6-a5982279ac55';

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

async function processRolePartB(page: any, camundaName: string): Promise<boolean> {
  console.log(`  [part-b] Processing ${camundaName}...`);
  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  if (!page.url().includes(PROCESS_ID)) { console.log('    SKIP: redirected'); return false; }

  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // Save/cancel unsaved EditGrid rows (fix "Please save all rows" validation error)
  await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        if (comp.component?.type === 'editgrid' && comp.editRows) {
          for (let i = 0; i < comp.editRows.length; i++) {
            const state = comp.editRows[i]?.state;
            if (state === 'new' || state === 'editing') {
              try { comp.saveRow(i); } catch {
                try { comp.cancelRow(i); } catch {}
              }
            }
          }
        }
        // Also enable FORMDATAVALIDATIONSTATUS
        if (comp.component?.key === 'FORMDATAVALIDATIONSTATUS') {
          comp.setValue('true'); comp.triggerChange?.();
        }
      });
      form.root.checkConditions?.();
    }
  });
  await page.waitForTimeout(1000);

  // Save draft
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(3000);

  const btnSelectors = [
    'button:has-text("Approve documents check")',
    'button:has-text("Send evaluation")',
    'button:has-text("Send consultation")',
    'button:has-text("Send decision")',
    'button:has-text("Approve and send")',
    'button:has-text("Send to ARC")',
    'button:has-text("Issue status letter")',
    'button:has-text("Issue letter")',
    'button:has-text("Generate")',
    'button:has-text("Sign")',
    'button:has-text("Approve")',
    'button:has-text("Send to Board")',
    'button:has-text("Submit")',
  ];
  let actionBtn: any = null;
  for (const sel of btnSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) { actionBtn = btn; break; }
  }
  if (!actionBtn) { return false; }

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

async function processRoleApplicant(page: any, camundaName: string): Promise<boolean> {
  console.log(`  [applicant] Processing ${camundaName} via /services/...`);
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);

  // Check for "Validate send page" button
  const validateBtn = page.locator('button:has-text("Validate send page")').first();
  if (await validateBtn.isVisible().catch(() => false)) {
    console.log('    Found "Validate send page" — submitting...');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveSENDPAGE')));
    await page.waitForTimeout(10000);
    // Handle confirmation
    for (const label of ['OK', 'Confirm', 'Yes', 'Submit', 'Send']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`    Confirming "${label}"...`);
        await btn.click(); await page.waitForTimeout(5000); break;
      }
    }
    console.log(`    ✓ Done (URL: ${page.url().substring(0, 60)})`);
    return true;
  }

  // Also check for Submit button
  const submitBtn = page.locator('button:has-text("Submit")').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    console.log('    Found "Submit" — clicking...');
    await enableAndClick(page, submitBtn);
    console.log(`    ✓ Done`);
    return true;
  }

  // Check what buttons ARE visible
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null)
      .map(b => b.textContent?.trim().substring(0, 60))
      .filter(t => t && t.length > 2);
  });
  console.log(`    No submit button. Visible: ${btns.join(' | ')}`);
  return false;
}

test('Continue: complementaryInformationSl + remaining', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SS, { recursive: true });

  await page.goto('/');
  await page.waitForTimeout(3000);

  let tasks = await getTasks(page);
  let pNames = pendingNames(tasks);
  console.log(`\nStarting state: pending = ${pNames.join(', ')}`);

  // Known applicant-facing roles
  const applicantRoles = ['complementaryInformation', 'complementaryInformationSl'];

  let iteration = 0;
  while (iteration < 20) {
    iteration++;
    tasks = await getTasks(page); pNames = pendingNames(tasks);
    if (pNames.length === 0) { console.log('\n  🏁 No more pending tasks!'); break; }
    console.log(`\n  [${iteration}] Pending: ${pNames.join(', ')}`);

    let processed = false;
    for (const name of pNames) {
      if (applicantRoles.includes(name)) {
        processed = await processRoleApplicant(page, name);
      } else {
        processed = await processRolePartB(page, name);
      }
      if (processed) break;
    }
    if (!processed) {
      console.log('  ⚠ No role could be processed. Taking screenshot...');
      await page.screenshot({ path: `${SS}/g-stuck-${iteration}.png` });
      break;
    }
  }

  // FINAL
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
  fs.writeFileSync(path.resolve(__dirname, '../test-data/ci-phase-g-results.json'), JSON.stringify(results, null, 2));
});
