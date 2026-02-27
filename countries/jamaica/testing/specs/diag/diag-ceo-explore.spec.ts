import { test, expect } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Diagnostic: Explore CEO validation & remaining roles for rejection controls
 *
 * After boardSubmission was processed (unfortunately as filevalidated),
 * ceoValidation is now pending. Explore it for:
 * - Vote/rejection radios
 * - Panels that might contain hidden radios
 * - All buttons including any conditional ones
 * - Whether expanding panels reveals new controls
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: CEO + Board roles exploration', async ({ page }) => {
  test.setTimeout(600_000);

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

  // List tasks
  const tasks = await boHelpers.getProcessTasks(page, processId);
  const pending = tasks.filter(t => !t.endTime);
  console.log(`Pending: ${pending.map(t => `${t.camundaName}(${t.status})`).join(', ')}`);

  // Process pending roles one at a time, exploring each deeply
  for (const task of pending) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Exploring: ${task.camundaName}`);
    console.log('='.repeat(60));

    const loaded = await boHelpers.navigateToRole(page, SERVICE_ID, task.camundaName, processId, FILE_ID);
    if (!loaded) continue;
    await page.waitForTimeout(6000);

    // ── Full page HTML dump for vote-related elements ──
    const voteElements = await page.evaluate(() => {
      const results: any[] = [];
      // Search for ANY element with vote/reject/approve/defer in text or attributes
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = (el as any).textContent?.trim()?.toLowerCase() || '';
        const classes = (el as any).className?.toString().toLowerCase() || '';
        const id = (el as any).id?.toLowerCase() || '';

        // Only check small text elements (not containers)
        if (text.length > 200) continue;

        if (
          text.includes('rejected') || text.includes('deferred') ||
          text.includes('vote chairman') || text.includes('vote') ||
          classes.includes('vote') || id.includes('vote')
        ) {
          results.push({
            tag: (el as any).tagName,
            text: (el as any).textContent?.trim().substring(0, 80),
            visible: (el as any).offsetParent !== null,
            classes: classes.substring(0, 60),
            id: id,
            display: getComputedStyle(el).display,
            visibility: getComputedStyle(el).visibility,
          });
        }
      }
      return results.slice(0, 30);
    });

    if (voteElements.length > 0) {
      console.log(`\n  Vote-related elements (${voteElements.length}):`);
      for (const e of voteElements) {
        console.log(`    ${e.visible ? '👁' : '🔒'} <${e.tag}> "${e.text}" class="${e.classes}" display=${e.display}`);
      }
    } else {
      console.log('  No vote-related elements found in DOM');
    }

    // ── Check all panels (card/accordion) for hidden content ──
    const panels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.card, .panel, [class*="panel"], .accordion-item, .collapse'))
        .map((el: any) => ({
          tag: el.tagName,
          classes: el.className?.substring(0, 80),
          visible: el.offsetParent !== null,
          header: el.querySelector('.card-header, .panel-heading, .accordion-header, [class*="header"]')?.textContent?.trim().substring(0, 60) || '',
          collapsed: el.classList.contains('collapse') && !el.classList.contains('show'),
          childCount: el.children.length,
        }))
        .filter((p: any) => p.header || p.collapsed);
    });

    if (panels.length > 0) {
      console.log(`\n  Panels (${panels.length}):`);
      for (const p of panels) {
        console.log(`    ${p.visible ? '👁' : '🔒'} ${p.collapsed ? 'COLLAPSED' : 'open'} "${p.header}" children=${p.childCount}`);
      }
    }

    // ── Check Processing tab specifically ──
    const procTab = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(2000);

      // Get ALL visible form elements on Processing tab
      const formElements = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, .choices'))
          .filter((el: any) => el.offsetParent !== null)
          .map((el: any) => ({
            tag: el.tagName,
            type: (el as any).type || '',
            name: (el as any).name || '',
            value: (el as any).value?.substring(0, 40) || '',
            label: el.closest('.form-group, .formio-component')?.querySelector('label')?.textContent?.trim().substring(0, 60) || '',
            classes: el.className?.substring(0, 60),
          }));
      });

      console.log(`\n  Processing tab form elements (${formElements.length}):`);
      for (const fe of formElements) {
        console.log(`    <${fe.tag}> type="${fe.type}" name="${fe.name}" label="${fe.label}" value="${fe.value}"`);
      }

      // Get ALL buttons
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 100),
            disabled: b.disabled,
            classes: b.className?.substring(0, 80),
            type: b.type,
          }))
          .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP', '×'].includes(b.text));
      });

      console.log(`\n  Buttons (${buttons.length}):`);
      for (const b of buttons) {
        console.log(`    "${b.text}" type=${b.type} disabled=${b.disabled} class="${b.classes?.substring(0, 50)}"`);
      }
    }

    // ── Formio components with vote/reject values ──
    const formioComps = await page.evaluate(() => {
      const results: any[] = [];
      const formio = (window as any).Formio;
      if (!formio?.forms) return results;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (!form?.root) continue;
        const walk = (comp: any) => {
          if (!comp) return;
          const cKey = comp.component?.key || comp.key;
          const cType = comp.component?.type || comp.type;
          if (cType === 'radio') {
            const values = comp.component?.values || [];
            const hasRejectValue = values.some((v: any) =>
              v.value === 'rejected' || v.value === 'deferred' || v.value === 'denied'
            );
            if (hasRejectValue) {
              results.push({
                key: cKey,
                type: cType,
                label: comp.component?.label?.substring(0, 60),
                values: values.map((v: any) => `${v.label}=${v.value}`).join(', '),
                hidden: comp.component?.hidden,
                visible: comp.visible,
                element: comp.element?.offsetParent !== null,
                conditional: comp.component?.conditional ? JSON.stringify(comp.component.conditional).substring(0, 120) : '',
                customConditional: comp.component?.customConditional?.substring(0, 120) || '',
                parent: comp.parent?.component?.key || '',
                parentType: comp.parent?.component?.type || '',
                parentHidden: comp.parent?.component?.hidden,
                parentLabel: comp.parent?.component?.label?.substring(0, 60) || '',
              });
            }
          }
          if (comp.components) for (const c of comp.components) walk(c);
          if (comp.columns) for (const col of comp.columns) {
            if (col?.components) for (const c of col.components) walk(c);
          }
        };
        walk(form.root);
      }
      return results;
    });

    if (formioComps.length > 0) {
      console.log(`\n  Formio reject-capable radios:`);
      for (const c of formioComps) {
        console.log(`    key="${c.key}" label="${c.label}"`);
        console.log(`      values: ${c.values}`);
        console.log(`      hidden=${c.hidden} visible=${c.visible} element=${c.element}`);
        console.log(`      parent: ${c.parentType}:"${c.parentLabel}" (key=${c.parent}, hidden=${c.parentHidden})`);
        console.log(`      conditional: ${c.conditional || 'none'}`);
        console.log(`      customConditional: ${c.customConditional || 'none'}`);
      }
    }

    // ── Process the role (happy path) to continue ──
    console.log(`\n  Processing ${task.camundaName} (happy path)...`);
    const result = await boHelpers.processRole(page, {
      serviceId: SERVICE_ID,
      camundaName: task.camundaName,
      processId,
      fileId: FILE_ID,
    });
    console.log(`  Result: ${result}`);

    // Check what's next
    await page.waitForTimeout(5000);
    const nextTasks = await boHelpers.getProcessTasks(page, processId);
    const nextPending = nextTasks.filter(t => !t.endTime);
    console.log(`  Next pending: ${nextPending.map(t => t.camundaName).join(', ')}`);
  }

  console.log('\n\nDiagnostic complete.');
});
