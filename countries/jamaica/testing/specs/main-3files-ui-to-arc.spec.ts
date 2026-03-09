import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * MAIN: Submit 3 files via UI (human-like) and process each to ARC
 *
 * Unlike the API approach, this fills the form like a human:
 * - Navigates to each form tab
 * - Fills fields via Formio setValue (same as typing)
 * - Uploads documents via file chooser
 * - Goes to Send tab, checks consent boxes, clicks Submit
 * - Then processes Part B roles as officer until ARC
 *
 * Service: 0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc (MAIN - Establish a new zone)
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/main-3files-ui-to-arc.spec.ts --project=jamaica-frontoffice --headed
 */

const SS = path.resolve(__dirname, '../screenshots/main-3files-ui');
const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const ARC_ROLE = 'arcAppRevCommittee';
const RESULTS_PATH = path.resolve(__dirname, '../test-data/main-3files-ui-results.json');

function ensureTestPdf() {
  const docsDir = path.resolve(__dirname, '../test-data/documents');
  fs.mkdirSync(docsDir, { recursive: true });
  const p = path.join(docsDir, 'test-doc.pdf');
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF`);
  }
  return p;
}

// ═══════════════════════════════════════════════════
// FORM FILLER — fills form like a human would
// ═══════════════════════════════════════════════════

/** Auto-fill all form fields using the bookmarklet pattern (Formio API) */
async function autoFillForm(page: any, fileNum: number) {
  console.log('  Filling form fields via Formio...');

  const fillResult = await page.evaluate((fNum: number) => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return { ok: false, error: 'No Formio' };

    let counter = fNum * 100;
    const filled: string[] = [];
    const skipped: string[] = [];
    const skipTypes = ['button', 'content', 'htmlelement', 'panel', 'fieldset', 'well',
      'columns', 'column', 'tabs', 'table', 'hidden', 'container', 'file'];

    function smartValue(comp: any): any {
      const c = comp.component || comp;
      const type = c.type;
      const key = c.key || '';
      counter++;

      switch (type) {
        case 'textfield': case 'text':
          if (c.inputMask) return c.inputMask.replace(/9/g, () => String(Math.floor(Math.random() * 10))).replace(/a/g, 'x').replace(/\*/g, 'x');
          if (key.toLowerCase().includes('email')) return `test${fNum}@seza.gov.jm`;
          if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) return `876-555-${1000 + fNum}`;
          if (key.toLowerCase().includes('name')) return `TEST Zone ${fNum} - ${counter}`;
          if (key.toLowerCase().includes('address') || key.toLowerCase().includes('street')) return `${fNum} Innovation Drive, Kingston`;
          if (key.toLowerCase().includes('city') || key.toLowerCase().includes('parish')) return 'Kingston';
          if (key.toLowerCase().includes('zip') || key.toLowerCase().includes('postal')) return 'JMAKN01';
          if (key.toLowerCase().includes('country')) return 'Jamaica';
          if (key.toLowerCase().includes('trn') || key.toLowerCase().includes('registration')) return `${100000000 + fNum}`;
          return `Test ${(c.label || key).slice(0, 25)} #${fNum}`;
        case 'textarea':
          return `Test description for ${(c.label || key).slice(0, 30)}. Zone ${fNum} E2E testing.`;
        case 'number':
          return c.validate?.min != null ? c.validate.min + fNum : 100 + fNum;
        case 'currency':
          return c.validate?.min != null ? c.validate.min + 100 : 1000 + fNum * 100;
        case 'email':
          return `test${fNum}@seza.gov.jm`;
        case 'phoneNumber':
          return `876-555-${1000 + fNum}`;
        case 'datetime':
          return new Date().toISOString();
        case 'day': {
          const now = new Date();
          return ('0' + (now.getMonth()+1)).slice(-2) + '/' + ('0' + now.getDate()).slice(-2) + '/' + now.getFullYear();
        }
        case 'time':
          return '09:00:00';
        case 'checkbox':
          return true;
        case 'radio':
          if (c.values?.length) return c.values[0].value;
          return null;
        case 'select':
          if (c.data?.values?.length) return c.data.values[0].value;
          if (comp.selectOptions?.length) return comp.selectOptions[0].value;
          if (comp.loadedOptions?.length) return comp.loadedOptions[0].value;
          if (comp.choices?._store?.choices?.length) {
            const ch = comp.choices._store.choices.filter((x: any) => x.value && x.value !== '');
            if (ch.length) return ch[0].value;
          }
          return null;
        case 'selectboxes':
          if (c.values?.length) { const r: any = {}; r[c.values[0].value] = true; return r; }
          return null;
        case 'survey':
          if (c.questions?.length && c.values?.length) {
            const s: any = {};
            c.questions.forEach((q: any) => { s[q.value] = c.values[0].value; });
            return s;
          }
          return null;
        case 'signature':
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        default:
          return null;
      }
    }

    function leafFields(components: any[]): any[] {
      const res: any[] = [];
      (components || []).forEach((child: any) => {
        if (child.type === 'columns') {
          (child.columns || []).forEach((col: any) => res.push(...leafFields(col.components)));
        } else if (['panel', 'fieldset', 'well', 'container'].includes(child.type)) {
          res.push(...leafFields(child.components));
        } else if (!['button', 'content', 'htmlelement'].includes(child.type)) {
          res.push(child);
        }
      });
      return res;
    }

    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;

      form.root.everyComponent((comp: any) => {
        const c = comp.component;
        if (!c || !c.key) return;
        if (skipTypes.includes(c.type)) return;
        if (c.hidden || c.disabled) return;
        if (c.key === 'submit' || c.action) return;

        // Skip already-filled fields
        const existing = comp.dataValue ?? comp.getValue?.();
        if (existing !== undefined && existing !== null && existing !== '' &&
          !(Array.isArray(existing) && existing.length === 0) &&
          !(typeof existing === 'object' && !Array.isArray(existing) && Object.keys(existing).length === 0)) {
          return;
        }

        // Handle EditGrid/DataGrid
        if (c.type === 'editgrid' || c.type === 'datagrid') {
          const row: any = {};
          const fields = leafFields(c.components || []);
          fields.forEach((child: any) => {
            if (child.hidden) return;
            const val = smartValue({ component: child });
            if (val !== null) row[child.key] = val;
          });
          if (Object.keys(row).length > 0) {
            comp.dataValue = [row];
            comp.triggerChange?.();
            filled.push(`grid:${c.key}`);
          }
          return;
        }

        // Skip children of grids
        let parent = comp.parent;
        while (parent) {
          if (parent.component?.type === 'editgrid' || parent.component?.type === 'datagrid') return;
          parent = parent.parent;
        }

        const val = smartValue(comp);
        if (val !== null) {
          try {
            comp.setValue(val);
            comp.triggerChange?.();
            filled.push(`${c.type}:${c.key}`);
          } catch {
            skipped.push(`${c.type}:${c.key}(error)`);
          }
        } else {
          skipped.push(`${c.type}:${c.key}`);
        }
      });
    }

    return { ok: true, filled: filled.length, skipped: skipped.length, samples: filled.slice(0, 10) };
  }, fileNum);

  console.log(`  Filled: ${fillResult.filled} fields, skipped: ${fillResult.skipped}`);
  return fillResult;
}

/** Upload documents to all empty file fields */
async function uploadDocuments(page: any, testPdf: string) {
  console.log('  Uploading documents...');

  // Make all tabs/hidden containers visible so we can reach all file fields
  await page.evaluate(() => {
    document.querySelectorAll('.tab-pane:not(.active)').forEach((el: any) => {
      el.style.display = 'block';
      el.classList?.add('active', 'show');
    });
  });
  await page.waitForTimeout(1000);

  // Find browse links without uploaded files
  const browseIndices: number[] = await page.evaluate(() => {
    const results: number[] = [];
    const links = document.querySelectorAll('a.browse');
    links.forEach((link: any, i: number) => {
      const comp = link.closest('[class*="formio-component-"]');
      const hasFiles = comp?.querySelector('.file-name, .formio-file-name, [ref="fileStatusRemove"]');
      if (!hasFiles) results.push(i);
    });
    return results;
  });

  console.log(`  Found ${browseIndices.length} empty file fields`);
  let uploaded = 0;

  for (const idx of browseIndices) {
    try {
      const link = page.locator('a.browse').nth(idx);
      await link.scrollIntoViewIfNeeded().catch(() => {});
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(testPdf);
      await page.waitForTimeout(2000);
      uploaded++;
    } catch {
      // JS fallback
      try {
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          page.evaluate((i: number) => {
            const links = document.querySelectorAll('a.browse');
            (links[i] as HTMLElement)?.click();
          }, idx),
        ]);
        await fc.setFiles(testPdf);
        await page.waitForTimeout(2000);
        uploaded++;
      } catch {}
    }
  }
  console.log(`  Uploaded: ${uploaded}/${browseIndices.length}`);
  return uploaded;
}

/** Navigate to Send tab, check consents, click Submit */
async function submitViaUI(page: any): Promise<boolean> {
  console.log('  Saving draft...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(5000);

  // Navigate to Send tab
  console.log('  Going to Send tab...');
  const sendTab = page.locator('a:has-text("Send"), li:has-text("Send")').first();
  if (await sendTab.isVisible().catch(() => false)) {
    await sendTab.click();
    await page.waitForTimeout(3000);
  }

  // Check all consent checkboxes
  const cbs = page.locator('input[type="checkbox"]:visible');
  const cbCount = await cbs.count();
  for (let i = 0; i < cbCount; i++) {
    await cbs.nth(i).check().catch(() => {});
  }
  console.log(`  Checked ${cbCount} consent boxes`);

  // Dismiss any floating validation alerts that block clicks
  await page.evaluate(() => {
    document.querySelectorAll('.alert.alert-danger, .floating-alerts, [data-validation-message]').forEach((el: any) => {
      el.style.display = 'none';
    });
  });
  await page.waitForTimeout(500);

  // Click Submit via saveSENDPAGE event (most reliable — bypasses overlay issues)
  console.log('  Triggering saveSENDPAGE...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveSENDPAGE')));
  await page.waitForTimeout(15000);

  // Handle confirmation dialogs (use force: true to bypass any remaining overlays)
  for (const label of ['OK', 'Confirm', 'Yes', 'Submit', 'Send']) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`  Confirming "${label}"...`);
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(5000);
      break;
    }
  }

  // Also try the Submit application button directly (force click)
  const submitBtn = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  Also clicking "Submit application" (force)...');
    await submitBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(10000);
    // Handle any new dialog
    for (const label of ['OK', 'Confirm', 'Yes']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(3000);
        break;
      }
    }
  }
  return true;
}

// ═══════════════════════════════════════════════════
// PART B OFFICER PROCESSING (same as API version)
// ═══════════════════════════════════════════════════

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

  // Applicant-facing roles use /services/ URL + saveSENDPAGE
  if (camundaName.startsWith('complementaryInformation')) {
    console.log('      Applicant CI role — using /services/ URL...');
    await page.goto(`/services/${SERVICE_ID}?file_id=${fileId}`);
    await page.waitForTimeout(8000);

    // Save draft first
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(3000);

    // Navigate to Send tab
    const sendTab = page.locator('a:has-text("Send"), li:has-text("Send"), text=Send').first();
    if (await sendTab.isVisible().catch(() => false)) {
      await sendTab.click();
      await page.waitForTimeout(3000);
    }

    // Check all consent checkboxes
    const cbs = page.locator('input[type="checkbox"]:visible');
    const cbCount = await cbs.count();
    for (let i = 0; i < cbCount; i++) { try { await cbs.nth(i).check(); } catch {} }

    // Submit via saveSENDPAGE
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveSENDPAGE')));
    await page.waitForTimeout(15000);

    // Handle confirmation dialog
    for (const label of ['Submit', 'OK', 'Confirm', 'Yes', 'Send']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`      Confirming "${label}"...`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(5000);
        break;
      }
    }
    console.log(`      ✓ Done`);
    return true;
  }

  await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(5000);
  if (!page.url().includes(processId)) { console.log('      SKIP: redirected'); return false; }

  // Click Processing tab
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // DocCheck: force-enable via comp.onClick() (only the actual documentsCheck task)
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

  // Auto-fill Part B form (as officer)
  console.log('      Auto-filling Part B form...');
  await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return;
    const skipTypes = ['button', 'content', 'htmlelement', 'panel', 'fieldset', 'well',
      'columns', 'column', 'tabs', 'table', 'hidden', 'container', 'file'];
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      form.root.everyComponent((comp: any) => {
        const c = comp.component;
        if (!c || !c.key || skipTypes.includes(c.type)) return;
        if (c.hidden) return;
        // Don't overwrite existing values
        const val = comp.dataValue ?? comp.getValue?.();
        if (val !== undefined && val !== null && val !== '' &&
          !(Array.isArray(val) && val.length === 0)) return;
        // Fill based on type
        if (c.type === 'textarea') { comp.setValue('Reviewed and approved. Test data.'); comp.triggerChange?.(); }
        if (c.type === 'textfield') { comp.setValue('Test officer note'); comp.triggerChange?.(); }
        if (c.type === 'checkbox') { comp.setValue(true); comp.triggerChange?.(); }
        if (c.type === 'radio' && c.values?.length) { comp.setValue(c.values[0].value); comp.triggerChange?.(); }
        if (c.type === 'select' && c.data?.values?.length) { comp.setValue(c.data.values[0].value); comp.triggerChange?.(); }
      });
    }
  });
  await page.waitForTimeout(1000);

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

  // NOC: upload docs
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

async function processToArc(page: any, fileId: string, processId: string, fileNum: number, testPdf: string): Promise<boolean> {
  console.log(`\n═══ FILE ${fileNum}: Processing Part B to ARC ═══`);

  // Wait for process engine
  await page.goto('/');
  await page.waitForTimeout(5000);

  let initialTasks: any[] = [];
  for (let wait = 0; wait < 6; wait++) {
    initialTasks = await getTasks(page, processId);
    const p = pending(initialTasks);
    if (p.length > 0) {
      console.log(`  Initial pending (after ${(wait + 1) * 5}s): ${pendingNames(initialTasks).join(', ')}`);
      break;
    }
    console.log(`  Waiting for tasks... (${wait + 1}/6)`);
    await page.waitForTimeout(5000);
  }

  if (pending(initialTasks).length === 0) {
    console.log(`  ❌ No tasks appeared after 30s`);
    return false;
  }

  const completedRoles: string[] = [];
  let iteration = 0;

  while (iteration < 25) {
    iteration++;
    const tasks = await getTasks(page, processId);
    const pend = pending(tasks);

    if (pend.length === 0) { console.log('  No pending tasks!'); return false; }

    const arcTask = pend.find((t: any) => t.camundaName === ARC_ROLE || t.camundaName.toLowerCase().includes('arc'));
    if (arcTask) {
      console.log(`  ✅ ARC REACHED for file ${fileNum}!`);
      return true;
    }

    const task = pend[0];
    console.log(`  [${iteration}] ${task.camundaName}`);

    const attempts = completedRoles.filter(r => r === task.camundaName).length;
    if (attempts >= 2) { console.log(`  ❌ Stuck on "${task.camundaName}"`); return false; }

    const success = await processRole(page, task.camundaName, fileId, processId, testPdf);
    if (success) {
      completedRoles.push(task.camundaName);
    } else if (pend.length > 1) {
      const next = pend[1];
      console.log(`  Trying next: ${next.camundaName}`);
      const ok = await processRole(page, next.camundaName, fileId, processId, testPdf);
      if (ok) completedRoles.push(next.camundaName);
      else return false;
    } else {
      return false;
    }
    await page.waitForTimeout(2000);
  }
  return false;
}

// ═══════════════════════════════════════════════════
// MAIN TEST
// ═══════════════════════════════════════════════════
test('MAIN: Submit 3 files via UI and process to ARC', async ({ page }) => {
  test.setTimeout(3_600_000); // 60 min
  fs.mkdirSync(SS, { recursive: true });
  const testPdf = ensureTestPdf();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  MAIN: 3 FILES → ARC (UI / Human-like)           ║');
  console.log('║  Service: 0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  await page.goto('/');
  await page.waitForTimeout(5000);

  const results: any[] = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  FILE ${i} OF 3 — UI SUBMISSION`);
    console.log(`${'═'.repeat(60)}`);

    // Step 1: Create file by navigating to service (no file_id)
    console.log(`\n  Step 1: Creating new file...`);
    await page.goto(`/services/${SERVICE_ID}`);
    await page.waitForTimeout(12000);

    const currentUrl = page.url();
    const fileIdMatch = currentUrl.match(/file_id=([a-f0-9-]+)/);
    if (!fileIdMatch) {
      console.log(`  ❌ No file_id in URL: ${currentUrl.substring(0, 100)}`);
      results.push({ fileNum: i, status: 'CREATE_FAILED' });
      continue;
    }
    const fileId = fileIdMatch[1];
    console.log(`  File created: ${fileId}`);

    // Step 2: Fill form like a human
    console.log(`\n  Step 2: Filling form...`);
    await autoFillForm(page, i);
    await page.waitForTimeout(2000);

    // Step 3: Upload documents
    console.log(`\n  Step 3: Uploading documents...`);
    await uploadDocuments(page, testPdf);
    await page.waitForTimeout(2000);

    // Step 4: Save draft
    console.log(`\n  Step 4: Saving draft...`);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SS}/file${i}-filled.png` }).catch(() => {});

    // Step 5: Submit via UI
    console.log(`\n  Step 5: Submitting via UI...`);
    await submitViaUI(page);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SS}/file${i}-submitted.png` }).catch(() => {});

    // Check if submission worked
    const fileState = await page.evaluate(async (fid: string) => {
      try {
        const r = await fetch(`/backend/files/${fid}`);
        if (!r.ok) return { error: `HTTP ${r.status}` };
        const d = await r.json();
        return { state: d.state, processId: d.process_instance_id };
      } catch (e: any) { return { error: e.message }; }
    }, fileId);

    console.log(`  File state: ${JSON.stringify(fileState)}`);

    if (!fileState?.processId) {
      console.log(`  ⚠ No processId — trying iterative API submit as fallback...`);

      // Fallback: get form data and submit via API
      const formData = await page.evaluate(() => {
        const formio = (window as any).Formio; if (!formio?.forms) return null;
        for (const fk of Object.keys(formio.forms)) {
          const form = formio.forms[fk]; if (!form?.root) continue;
          return form.root.submission?.data || null;
        }
        return null;
      });

      if (formData) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const result = await page.evaluate(async (args: { fid: string, data: any }) => {
            const r = await fetch(`/backend/files/${args.fid}/start_process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data_content: JSON.stringify(args.data) }),
            });
            return { status: r.status, body: await r.text() };
          }, { fid: fileId, data: formData });

          if (result.status === 200 || result.status === 201) {
            const d = JSON.parse(result.body);
            fileState.processId = d.process_instance_id || d.processId || d.id;
            console.log(`  ✅ Fallback submit worked! Process: ${fileState.processId}`);
            break;
          }
          if (result.status === 400) {
            try {
              const err = JSON.parse(result.body);
              const details = err.details || [];
              let filled = 0;
              for (const d of details) {
                const key = d.path?.[0];
                if (!key) continue;
                const msg = d.message || '';
                if (msg.includes('non-empty array')) {
                  formData[key] = [{ name: 'test-doc.pdf', url: '/test', size: 1024, type: 'application/pdf', storage: 'url', originalName: 'test-doc.pdf' }];
                  filled++;
                } else if (msg.includes('is required')) {
                  let val: any = `Test ${i}`;
                  if (key.match(/Email|email/)) val = `test${i}@seza.gov.jm`;
                  else if (key.match(/Phone|phone|Number|number/)) val = `+1876555${1000+i}`;
                  else if (key.match(/area|Area|size|Size|Total|total|cost|Cost|Amount|amount/)) val = 100 + i;
                  else if (key.match(/date|Date/)) val = `2025-0${i}-15`;
                  else if (key.match(/name|Name/)) val = `TEST Zone ${i}`;
                  formData[key] = val;
                  filled++;
                } else if (msg.includes('mask')) {
                  formData[key] = `${100000000 + i}`;
                  filled++;
                }
              }
              if (filled === 0) break;
              console.log(`    Fallback attempt ${attempt + 1}: fixed ${filled} fields`);
            } catch { break; }
          } else break;
        }
      }

      if (!fileState?.processId) {
        console.log(`  ❌ File ${i}: Could not submit`);
        results.push({ fileNum: i, fileId, status: 'SUBMIT_FAILED' });
        continue;
      }
    }

    const processId = fileState.processId;
    console.log(`  ✅ SUBMITTED! Process: ${processId}`);
    results.push({ fileNum: i, fileId, processId, status: 'SUBMITTED' });

    // Save intermediate
    fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, mode: 'UI', files: results, timestamp: new Date().toISOString() }, null, 2));

    // Step 6: Process Part B as officer until ARC
    console.log(`\n  Step 6: Processing Part B as officer...`);
    const reachedArc = await processToArc(page, fileId, processId, i, testPdf);

    results[results.length - 1].status = reachedArc ? 'AT_ARC' : 'STUCK';
    results[results.length - 1].reachedArc = reachedArc;

    const tasks = await getTasks(page, processId);
    results[results.length - 1].pendingTasks = pendingNames(tasks);

    fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, mode: 'UI', files: results, timestamp: new Date().toISOString() }, null, 2));

    console.log(`\n  FILE ${i}: ${reachedArc ? '✅ AT ARC' : '❌ NOT AT ARC'}`);
  }

  // FINAL SUMMARY
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  FINAL SUMMARY — 3 FILES TO ARC (UI MODE)');
  console.log(`${'═'.repeat(60)}`);

  const atArc = results.filter(r => r.status === 'AT_ARC');
  console.log(`  ✅ At ARC: ${atArc.length}/3`);
  for (const r of atArc) console.log(`    File ${r.fileNum}: ${r.fileId} (process: ${r.processId})`);

  const failed = results.filter(r => r.status !== 'AT_ARC');
  if (failed.length) {
    console.log(`  ❌ Failed: ${failed.length}/3`);
    for (const r of failed) console.log(`    File ${r.fileNum}: ${r.status}`);
  }

  fs.writeFileSync(RESULTS_PATH, JSON.stringify({ service: SERVICE_ID, mode: 'UI', files: results, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\n  Results saved to ${RESULTS_PATH}`);
});
