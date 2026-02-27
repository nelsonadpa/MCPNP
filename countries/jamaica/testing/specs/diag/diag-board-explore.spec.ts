import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Diagnostic: Deep exploration of the Board role
 *
 * The Board role is now pending (after CEO validation).
 * This explores EVERY aspect of the Board form to find the rejection mechanism.
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: Board role deep exploration', async ({ page }) => {
  test.setTimeout(300_000);

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

  const tasks = await boHelpers.getProcessTasks(page, processId);
  const pending = tasks.filter(t => !t.endTime);
  console.log(`Pending: ${pending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  const boardTask = pending.find(t => t.camundaName.toLowerCase().includes('board'));
  if (!boardTask) {
    console.log('No Board task found');
    test.skip();
    return;
  }

  console.log(`\nExploring: ${boardTask.camundaName}`);
  await boHelpers.navigateToRole(page, SERVICE_ID, boardTask.camundaName, processId, FILE_ID);
  await page.waitForTimeout(6000);

  // ── Screenshot initial state ──
  await page.screenshot({ path: `/tmp/board-initial.png`, fullPage: true });

  // ── List all tabs ──
  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.nav-link, .nav-item a'))
      .filter((el: any) => el.offsetParent !== null)
      .map((el: any) => el.textContent?.trim())
      .filter((t: any) => t && t.length < 50 && !['NP', 'en', 'NPNELSON PEREZ'].includes(t));
  });
  console.log(`\nTabs: ${JSON.stringify(tabs)}`);

  // ── Explore each tab ──
  for (const tabName of tabs) {
    const tab = page.locator('.nav-link').filter({ hasText: tabName }).first();
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(2000);
    }

    // Visible radios
    const radios = await page.evaluate((tn: string) => {
      return Array.from(document.querySelectorAll('input[type="radio"]'))
        .filter((r: any) => r.offsetParent !== null)
        .map((r: any) => ({
          name: r.name,
          value: r.value,
          checked: r.checked,
          label: r.closest('label')?.textContent?.trim().substring(0, 60) || '',
          tab: tn,
        }));
    }, tabName || '');

    if (radios.length > 0) {
      console.log(`\n[${tabName}] Visible radios (${radios.length}):`);
      for (const r of radios) {
        console.log(`  ${r.checked ? '●' : '○'} name="${r.name}" value="${r.value}" label="${r.label}"`);
      }
    }

    // Buttons
    if (tabName?.includes('Processing') || tabName?.includes('Form')) {
      const btns = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 100),
            disabled: b.disabled,
            type: b.type,
            classes: b.className?.substring(0, 80),
          }))
          .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP', '×'].includes(b.text));
      });
      console.log(`\n[${tabName}] Buttons (${btns.length}):`);
      for (const b of btns) {
        console.log(`  "${b.text}" type=${b.type} disabled=${b.disabled} class="${b.classes?.substring(0, 50)}"`);
      }

      // All visible form elements
      const formEls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, .choices'))
          .filter((el: any) => el.offsetParent !== null)
          .map((el: any) => ({
            tag: el.tagName,
            type: (el as any).type || '',
            name: (el as any).name || '',
            value: (el as any).value?.substring(0, 40) || '',
            label: el.closest('.form-group, .formio-component')?.querySelector('label')?.textContent?.trim().substring(0, 60) || '',
          }));
      });
      console.log(`\n[${tabName}] Form elements (${formEls.length}):`);
      for (const fe of formEls) {
        console.log(`  <${fe.tag}> type="${fe.type}" name="${fe.name}" label="${fe.label}" value="${fe.value}"`);
      }

      // Look for open-modal-button specifically
      const modalBtns = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button.open-modal-button, button[class*="modal"]'))
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 100),
            visible: b.offsetParent !== null,
            classes: b.className?.substring(0, 80),
          }));
      });
      if (modalBtns.length > 0) {
        console.log(`\n[${tabName}] Modal buttons (${modalBtns.length}):`);
        for (const mb of modalBtns) {
          console.log(`  ${mb.visible ? '👁' : '🔒'} "${mb.text}" class="${mb.classes}"`);
        }
      }
    }

    // Screenshot this tab
    await page.screenshot({ path: `/tmp/board-${tabName?.replace(/\s/g, '-')}.png`, fullPage: true });
  }

  // ── Full Formio component analysis for radios with reject values ──
  const rejectComps = await page.evaluate(() => {
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
        if (cType === 'radio') {
          const values = comp.component?.values || [];
          const hasReject = values.some((v: any) =>
            ['rejected', 'deferred', 'denied', 'denial'].includes(v.value)
          );
          if (hasReject) {
            // Trace parent chain
            let parentChain = '';
            let p = comp.parent;
            let chainDepth = 0;
            while (p && chainDepth < 5) {
              const pk = p.component?.key || '';
              const pt = p.component?.type || '';
              const pl = p.component?.label?.substring(0, 30) || '';
              const ph = p.component?.hidden;
              parentChain += ` → ${pt}:${pk}("${pl}", hidden=${ph})`;
              p = p.parent;
              chainDepth++;
            }

            results.push({
              key: cKey,
              label: comp.component?.label?.substring(0, 60),
              values: values.map((v: any) => `${v.label}=${v.value}`).join(', '),
              hidden: comp.component?.hidden,
              visible: comp.visible,
              rendered: comp.element?.offsetParent !== null,
              parentChain,
            });
          }
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

  console.log(`\n${'='.repeat(60)}`);
  console.log('  Formio reject-capable radios:');
  console.log('='.repeat(60));
  for (const c of rejectComps) {
    console.log(`\n  key="${c.key}" label="${c.label}"`);
    console.log(`    values: ${c.values}`);
    console.log(`    hidden=${c.hidden} visible=${c.visible} rendered=${c.rendered}`);
    console.log(`    parentChain: ${c.parentChain}`);
  }

  // ── Check roleForm data for board-related keys ──
  const boardData = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return 'No roleForm';
    const data = roleForm.submission.data;
    return Object.keys(data)
      .filter(k => {
        const lk = k.toLowerCase();
        return lk.includes('board') || lk.includes('vote') || lk.includes('resolution') ||
          lk.includes('chairman');
      })
      .map(k => `${k} = ${JSON.stringify(data[k])?.substring(0, 80)}`)
      .join('\n  ');
  });
  console.log(`\n  Board-related form data:\n  ${boardData}`);

  console.log('\n\nDiagnostic complete.');
});
