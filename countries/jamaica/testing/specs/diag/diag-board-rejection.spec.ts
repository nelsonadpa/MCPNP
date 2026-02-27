import { test, expect } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';

/**
 * Diagnostic: Explore Board submission / Board for rejection controls
 *
 * The rejection vote (Approved/Rejected/Deferred) is likely on the Board
 * submission or Board role, not ARC. This diagnostic:
 * 1. Checks current process state
 * 2. If Board submission or Board is pending, explores form for radios/buttons
 * 3. Dumps all form components, panels, radios, buttons
 *
 * Uses the process from p3-rejection-flow (already past ARC).
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: Board rejection controls', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  // ── Get process ID ──
  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File: ${JSON.stringify(fileInfo)}`);
  if (!fileInfo.processId) { test.skip(); return; }

  const processId = fileInfo.processId;

  // ── List all tasks ──
  const tasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nAll tasks (${tasks.length}):`);
  for (const t of tasks) {
    console.log(`  ${t.endTime ? 'DONE' : 'PEND'} ${t.camundaName} — ${t.status}`);
  }

  const pending = tasks.filter(t => !t.endTime);
  console.log(`\nPending tasks: ${pending.map(t => t.camundaName).join(', ')}`);

  // ── Process any simple pending roles to reach Board ──
  // If complementaryInformation is pending, handle it first
  const compInfo = pending.find(t => t.camundaName === 'complementaryInformation');
  if (compInfo) {
    console.log('\n── Handling complementary information ──');
    await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
    await page.waitForTimeout(8000);

    // Navigate to Send tab
    const sendTab = page.locator('.page-link:has-text("Send"), .nav-link:has-text("Send")').first();
    if (await sendTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendTab.click();
      await page.waitForTimeout(3000);
    }

    // Click "Validate send page"
    const vsBtn = page.locator('button:has-text("Validate send page")').first();
    if (await vsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vsBtn.click();
      await page.waitForTimeout(10000);
    }

    // Check consents
    const consents = page.locator('input[type="checkbox"]:visible');
    const cbCount = await consents.count();
    for (let i = 0; i < cbCount; i++) {
      await consents.nth(i).check({ force: true }).catch(() => {});
    }

    // Submit
    const submitBtn = page.locator('button:has-text("Submit application")').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(10000);
      await boHelpers.handleConfirmation(page);
      await page.waitForTimeout(5000);
      console.log('  Complementary info submitted');
    }

    // Re-check tasks
    const tasks2 = await boHelpers.getProcessTasks(page, processId);
    const pending2 = tasks2.filter(t => !t.endTime);
    console.log(`\nPending after comp info: ${pending2.map(t => t.camundaName).join(', ')}`);
  }

  // ── Explore each pending role for rejection controls ──
  const refreshedTasks = await boHelpers.getProcessTasks(page, processId);
  const refreshedPending = refreshedTasks.filter(t => !t.endTime);

  for (const task of refreshedPending) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Exploring: ${task.camundaName} (${task.shortname})`);
    console.log('='.repeat(60));

    const loaded = await boHelpers.navigateToRole(page, SERVICE_ID, task.camundaName, processId, FILE_ID);
    if (!loaded) {
      console.log('  Could not load role page');
      continue;
    }

    await page.waitForTimeout(5000);

    // ── List all tabs ──
    const tabs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.nav-link, .nav-item a'))
        .filter((el: any) => el.offsetParent !== null)
        .map((el: any) => el.textContent?.trim())
        .filter((t: any) => t && t.length < 60);
    });
    console.log(`  Tabs: ${JSON.stringify(tabs)}`);

    // ── Check each tab ──
    for (const tabName of tabs) {
      if (!tabName || ['NP', 'en', 'NPNELSON PEREZ'].includes(tabName)) continue;

      const tabLink = page.locator('.nav-link, .nav-item a').filter({ hasText: tabName }).first();
      if (await tabLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabLink.click();
        await page.waitForTimeout(2000);
      }

      // ── Find all radios on this tab ──
      const radios = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input[type="radio"]'))
          .map((r: any) => ({
            name: r.name,
            value: r.value,
            visible: r.offsetParent !== null,
            checked: r.checked,
            id: r.id,
            label: r.closest('label')?.textContent?.trim().substring(0, 60) ||
              document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim().substring(0, 60) || '',
            parentPanel: r.closest('.card, .panel, [class*="panel"]')?.querySelector('.card-header, .card-title, [class*="header"]')?.textContent?.trim().substring(0, 60) || '',
          }));
      });

      const visibleRadios = radios.filter(r => r.visible);
      const hiddenRadios = radios.filter(r => !r.visible);

      if (radios.length > 0) {
        console.log(`\n  [${tabName}] Radios: ${visibleRadios.length} visible, ${hiddenRadios.length} hidden`);
        for (const r of radios) {
          console.log(`    ${r.visible ? '👁' : '🔒'} ${r.checked ? '●' : '○'} name="${r.name}" value="${r.value}" label="${r.label}" panel="${r.parentPanel}"`);
        }
      }

      // ── Find all buttons ──
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 100),
            disabled: b.disabled,
            classes: b.className?.substring(0, 100),
            type: b.type,
          }))
          .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP', '×'].includes(b.text));
      });

      if (buttons.length > 0 && tabName === 'Processing') {
        console.log(`\n  [${tabName}] Buttons (${buttons.length}):`);
        for (const b of buttons) {
          console.log(`    "${b.text}" type=${b.type} disabled=${b.disabled} class="${b.classes?.substring(0, 60)}"`);
        }
      }

      // ── Find select/dropdown ──
      const selects = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('select:not([style*="display:none"]):not([hidden])'))
          .filter((s: any) => s.offsetParent !== null)
          .map((s: any) => ({
            name: s.name,
            options: Array.from(s.options).map((o: any) => o.text?.trim()).join(', '),
          }));
      });
      if (selects.length > 0) {
        console.log(`\n  [${tabName}] Selects:`);
        for (const s of selects) {
          console.log(`    name="${s.name}" options=[${s.options}]`);
        }
      }
    }

    // ── Also check Formio form data for decision/vote keys ──
    const formData = await page.evaluate(() => {
      const roleForm = (window as any).roleForm;
      if (!roleForm?.submission?.data) return 'No roleForm';
      const data = roleForm.submission.data;
      const relevant = Object.keys(data)
        .filter(k => !k.startsWith('_'))
        .filter(k => {
          const lk = k.toLowerCase();
          return lk.includes('vote') || lk.includes('decision') || lk.includes('reject') ||
            lk.includes('approve') || lk.includes('defer') || lk.includes('board') ||
            lk.includes('selection') || lk.includes('chairman') || lk.includes('resolution');
        })
        .map(k => `${k} = ${JSON.stringify(data[k])?.substring(0, 120)}`);
      return relevant.length > 0 ? relevant.join('\n    ') : 'No relevant keys';
    });
    console.log(`\n  Formio data:\n    ${formData}`);

    // ── Check Formio components tree for all radio/select components ──
    const formComponents = await page.evaluate(() => {
      const results: any[] = [];
      const formio = (window as any).Formio;
      if (!formio?.forms) return results;

      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (!form?.root) continue;
        const walk = (comp: any, depth = 0) => {
          if (!comp) return;
          const cKey = comp.component?.key || comp.key;
          const cType = comp.component?.type || comp.type;
          const cLabel = comp.component?.label || comp.label;

          if (cType === 'radio' || cType === 'select') {
            const values = comp.component?.values || comp.component?.data?.values || [];
            results.push({
              key: cKey,
              type: cType,
              label: cLabel?.substring(0, 60),
              values: values.map((v: any) => `${v.label}=${v.value}`).join(', '),
              hidden: comp.component?.hidden || false,
              conditional: comp.component?.conditional ? JSON.stringify(comp.component.conditional).substring(0, 100) : '',
            });
          }

          // Also capture panels with conditionals
          if (cType === 'panel' && comp.component?.conditional?.json) {
            results.push({
              key: cKey,
              type: 'panel(conditional)',
              label: cLabel?.substring(0, 60),
              conditional: JSON.stringify(comp.component.conditional).substring(0, 100),
            });
          }

          if (comp.components) for (const c of comp.components) walk(c, depth + 1);
          if (comp.columns) for (const col of comp.columns) {
            if (col?.components) for (const c of col.components) walk(c, depth + 1);
          }
        };
        walk(form.root);
      }
      return results;
    });

    if (formComponents.length > 0) {
      console.log(`\n  Formio radio/select/panel components:`);
      for (const c of formComponents) {
        console.log(`    ${c.type}: key="${c.key}" label="${c.label}" values="${c.values || ''}" hidden=${c.hidden || false} cond="${c.conditional || ''}"`);
      }
    }
  }

  console.log('\n\nDiagnostic complete.');
});
