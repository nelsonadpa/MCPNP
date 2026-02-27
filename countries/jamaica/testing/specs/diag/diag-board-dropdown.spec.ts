import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';

/**
 * Diagnostic: Investigate the Board decision Choices.js dropdown
 *
 * Previous diagnostic found:
 * - boardBoardDecision (select) has values: = (empty), dataValue: undefined
 * - boardselection (hidden) = undefined
 * - filedecline button = "Request corrections"
 * - filevalidated button = "Approve"
 * - No filereject button exists!
 *
 * This investigates:
 * 1. Full Formio component config for boardBoardDecision (data source)
 * 2. Click the dropdown to trigger dynamic option loading
 * 3. Whether selecting an option changes available buttons or boardselection
 * 4. The Approve button's action — what customConditional/action does it have?
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: Board dropdown & button actions', async ({ page }) => {
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
  if (!boardTask) { console.log('No Board task'); test.skip(); return; }

  console.log(`\nTarget: ${boardTask.camundaName}`);
  await boHelpers.navigateToRole(page, SERVICE_ID, boardTask.camundaName, processId, FILE_ID);
  await page.waitForTimeout(6000);

  // Go to Processing tab
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // ═══════════════════════════════════════════════════════
  // 1. Full Formio config for boardBoardDecision
  // ═══════════════════════════════════════════════════════
  const selectConfig = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const cKey = comp.component?.key || '';
        if (cKey === 'boardBoardDecision') {
          const c = comp.component;
          results.push({
            key: cKey,
            type: c?.type,
            label: c?.label,
            // Data source configuration
            dataSrc: c?.dataSrc,
            data: c?.data ? {
              values: c.data.values?.map((v: any) => ({label: v.label, value: v.value})),
              url: c.data.url,
              resource: c.data.resource,
              custom: c.data.custom?.substring(0, 300),
              json: typeof c.data.json === 'string' ? c.data.json.substring(0, 300) : c.data.json,
            } : null,
            values: c?.values?.map((v: any) => ({label: v.label, value: v.value})),
            valueProperty: c?.valueProperty,
            template: c?.template?.substring(0, 200),
            // Conditional
            conditional: c?.conditional ? JSON.stringify(c.conditional).substring(0, 300) : null,
            customConditional: c?.customConditional?.substring(0, 300),
            // Full component props
            selectValues: c?.selectValues,
            widget: c?.widget,
            uniqueOptions: c?.uniqueOptions,
            searchEnabled: c?.searchEnabled,
            minSearch: c?.minSearch,
            idPath: c?.idPath,
            // Current state
            dataValue: comp.dataValue,
            options: comp.selectOptions?.map((o: any) => ({label: o.label, value: o.value})),
            // Properties
            properties: c?.properties,
            // Action on change
            action: c?.action,
            customDefaultValue: c?.customDefaultValue?.substring(0, 300),
            calculateValue: c?.calculateValue?.substring(0, 300),
          });
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

  console.log(`\n${'='.repeat(60)}`);
  console.log('  boardBoardDecision FULL CONFIG');
  console.log('='.repeat(60));
  for (const c of selectConfig) {
    console.log(`\n  key="${c.key}" type="${c.type}" label="${c.label}"`);
    console.log(`  dataSrc="${c.dataSrc}"`);
    console.log(`  data:`, JSON.stringify(c.data, null, 2)?.substring(0, 500));
    console.log(`  values:`, JSON.stringify(c.values));
    console.log(`  valueProperty="${c.valueProperty}"`);
    console.log(`  template="${c.template}"`);
    console.log(`  dataValue:`, JSON.stringify(c.dataValue));
    console.log(`  selectOptions:`, JSON.stringify(c.options)?.substring(0, 300));
    console.log(`  conditional:`, c.conditional);
    console.log(`  customConditional:`, c.customConditional);
    console.log(`  properties:`, JSON.stringify(c.properties));
    console.log(`  action:`, c.action);
    console.log(`  customDefaultValue:`, c.customDefaultValue);
    console.log(`  calculateValue:`, c.calculateValue);
    console.log(`  widget:`, JSON.stringify(c.widget));
    console.log(`  searchEnabled:`, c.searchEnabled);
  }

  // ═══════════════════════════════════════════════════════
  // 2. Full config for the Approve and Request corrections buttons
  // ═══════════════════════════════════════════════════════
  const buttonConfigs = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const cKey = comp.component?.key || '';
        const cType = comp.component?.type || '';
        if (cType === 'button' && (
          cKey.includes('filevalidated') || cKey.includes('filedecline') ||
          cKey.includes('filereject') || cKey.includes('reject') ||
          cKey.includes('deny') || cKey.includes('decline')
        )) {
          const c = comp.component;
          results.push({
            key: cKey,
            type: cType,
            label: c?.label,
            action: c?.action,
            event: c?.event,
            customConditional: c?.customConditional?.substring(0, 300),
            conditional: c?.conditional ? JSON.stringify(c.conditional).substring(0, 300) : null,
            hidden: c?.hidden,
            visible: comp.visible,
            rendered: comp.element?.offsetParent !== null,
            properties: c?.properties,
            custom: c?.custom?.substring(0, 300),
            url: c?.url,
            disableOnInvalid: c?.disableOnInvalid,
            theme: c?.theme,
            block: c?.block,
            size: c?.size,
          });
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

  console.log(`\n${'='.repeat(60)}`);
  console.log('  BUTTON CONFIGS (action buttons)');
  console.log('='.repeat(60));
  for (const b of buttonConfigs) {
    console.log(`\n  key="${b.key}" label="${b.label}"`);
    console.log(`  action="${b.action}" event="${b.event}"`);
    console.log(`  hidden=${b.hidden} visible=${b.visible} rendered=${b.rendered}`);
    console.log(`  conditional:`, b.conditional);
    console.log(`  customConditional:`, b.customConditional);
    console.log(`  properties:`, JSON.stringify(b.properties));
    console.log(`  custom:`, b.custom);
    console.log(`  theme="${b.theme}" disableOnInvalid=${b.disableOnInvalid}`);
  }

  // ═══════════════════════════════════════════════════════
  // 3. Click the Choices.js dropdown to trigger option loading
  // ═══════════════════════════════════════════════════════
  console.log(`\n${'='.repeat(60)}`);
  console.log('  CLICKING CHOICES.JS DROPDOWN');
  console.log('='.repeat(60));

  const choicesEl = page.locator('.choices').first();
  if (await choicesEl.isVisible({ timeout: 3000 }).catch(() => false)) {
    await choicesEl.click();
    await page.waitForTimeout(3000);

    // Check what options appeared
    const dropdownItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.choices__list--dropdown .choices__item');
      return Array.from(items).map((item: any) => ({
        text: item.textContent?.trim().substring(0, 100),
        value: item.getAttribute('data-value') || '',
        id: item.getAttribute('data-id') || '',
        selected: item.classList.contains('is-selected'),
        active: item.classList.contains('is-active'),
        classes: item.className?.substring(0, 80),
      }));
    });

    console.log(`\n  Dropdown items after click (${dropdownItems.length}):`);
    for (const item of dropdownItems) {
      console.log(`    ${item.selected ? '●' : '○'} "${item.text}" value="${item.value}" id="${item.id}"`);
    }

    // Also check the <select> element options
    const selectOptions = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const results: any[] = [];
      for (const sel of selects) {
        if ((sel as any).offsetParent === null && !sel.closest('.choices')) continue;
        const opts = Array.from(sel.options).map((o: any) => ({
          value: o.value,
          text: o.textContent?.trim().substring(0, 80),
          selected: o.selected,
        }));
        if (opts.length > 0 || sel.closest('.choices')) {
          results.push({
            name: sel.name,
            id: sel.id,
            options: opts,
            isChoices: !!sel.closest('.choices'),
          });
        }
      }
      return results;
    });

    console.log(`\n  <select> elements:`);
    for (const sel of selectOptions) {
      console.log(`    name="${sel.name}" id="${sel.id}" isChoices=${sel.isChoices}`);
      for (const o of sel.options) {
        console.log(`      ${o.selected ? '●' : '○'} value="${o.value}" text="${o.text}"`);
      }
    }

    // Close the dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } else {
    console.log('  No Choices.js dropdown visible');
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/board-dropdown-options.png', fullPage: true });

  // ═══════════════════════════════════════════════════════
  // 4. Check ALL button-type Formio components (not just specific names)
  // ═══════════════════════════════════════════════════════
  const allButtons = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const cKey = comp.component?.key || '';
        const cType = comp.component?.type || '';
        if (cType === 'button') {
          results.push({
            key: cKey,
            label: comp.component?.label?.substring(0, 80),
            action: comp.component?.action,
            event: comp.component?.event,
            hidden: comp.component?.hidden,
            visible: comp.visible,
            rendered: comp.element?.offsetParent !== null,
            theme: comp.component?.theme,
            parentKey: comp.parent?.component?.key || '',
          });
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

  console.log(`\n${'='.repeat(60)}`);
  console.log('  ALL FORMIO BUTTON COMPONENTS');
  console.log('='.repeat(60));
  for (const b of allButtons) {
    console.log(`  ${b.visible ? '👁' : '🔒'} ${b.rendered ? 'R' : '-'} key="${b.key}" label="${b.label}" action="${b.action}" event="${b.event}" theme="${b.theme}" parent="${b.parentKey}"`);
  }

  // ═══════════════════════════════════════════════════════
  // 5. Check if the Approve button has custom action that reads boardBoardDecision
  // ═══════════════════════════════════════════════════════
  const approveAction = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return null;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any): any => {
        if (!comp) return null;
        const cKey = comp.component?.key || '';
        if (cKey.includes('filevalidated')) {
          return {
            key: cKey,
            fullComponent: JSON.stringify(comp.component, null, 2).substring(0, 2000),
          };
        }
        if (comp.components) {
          for (const c of comp.components) {
            const r = walk(c);
            if (r) return r;
          }
        }
        if (comp.columns) {
          for (const col of comp.columns) {
            if (col?.components) {
              for (const c of col.components) {
                const r = walk(c);
                if (r) return r;
              }
            }
          }
        }
        return null;
      };
      const result = walk(form.root);
      if (result) return result;
    }
    return null;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  APPROVE BUTTON FULL CONFIG');
  console.log('='.repeat(60));
  if (approveAction) {
    console.log(approveAction.fullComponent);
  } else {
    console.log('  Not found');
  }

  // ═══════════════════════════════════════════════════════
  // 6. Get filedecline (Request corrections) button full config
  // ═══════════════════════════════════════════════════════
  const declineAction = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return null;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any): any => {
        if (!comp) return null;
        const cKey = comp.component?.key || '';
        if (cKey.includes('filedecline')) {
          return {
            key: cKey,
            fullComponent: JSON.stringify(comp.component, null, 2).substring(0, 2000),
          };
        }
        if (comp.components) {
          for (const c of comp.components) {
            const r = walk(c);
            if (r) return r;
          }
        }
        if (comp.columns) {
          for (const col of comp.columns) {
            if (col?.components) {
              for (const c of col.components) {
                const r = walk(c);
                if (r) return r;
              }
            }
          }
        }
        return null;
      };
      const result = walk(form.root);
      if (result) return result;
    }
    return null;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  FILEDECLINE BUTTON FULL CONFIG');
  console.log('='.repeat(60));
  if (declineAction) {
    console.log(declineAction.fullComponent);
  } else {
    console.log('  Not found');
  }

  // ═══════════════════════════════════════════════════════
  // 7. Search for ANY component containing "reject" or "deny"
  //    in its key, action, event, or custom code
  // ═══════════════════════════════════════════════════════
  const rejectSearch = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const c = comp.component;
        if (!c) { if (comp.components) for (const cc of comp.components) walk(cc); return; }

        const fullStr = JSON.stringify(c).toLowerCase();
        if (fullStr.includes('reject') || fullStr.includes('deny') ||
            fullStr.includes('denial') || fullStr.includes('filereject')) {
          results.push({
            key: c.key,
            type: c.type,
            label: c.label?.substring(0, 60),
            match: (() => {
              const matches: string[] = [];
              if (c.key?.toLowerCase().includes('reject')) matches.push('key');
              if (c.key?.toLowerCase().includes('deny')) matches.push('key-deny');
              if (c.key?.toLowerCase().includes('denial')) matches.push('key-denial');
              if (c.action?.toLowerCase().includes('reject')) matches.push('action');
              if (c.event?.toLowerCase().includes('reject')) matches.push('event');
              if (c.custom?.toLowerCase().includes('reject')) matches.push('custom');
              if (c.customConditional?.toLowerCase().includes('reject')) matches.push('customConditional');
              if (JSON.stringify(c.conditional)?.toLowerCase().includes('reject')) matches.push('conditional');
              if (JSON.stringify(c.values)?.toLowerCase().includes('reject')) matches.push('values');
              if (JSON.stringify(c.data)?.toLowerCase().includes('reject')) matches.push('data');
              return matches.join(', ');
            })(),
            hidden: c.hidden,
            visible: comp.visible,
          });
        }
        if (comp.components) for (const cc of comp.components) walk(cc);
        if (comp.columns) for (const col of comp.columns) {
          if (col?.components) for (const cc of col.components) walk(cc);
        }
      };
      walk(form.root);
    }
    return results;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  COMPONENTS WITH "reject/deny/denial" IN CONFIG');
  console.log('='.repeat(60));
  for (const r of rejectSearch) {
    console.log(`  ${r.visible ? '👁' : '🔒'} ${r.type}:"${r.key}" label="${r.label}" match=[${r.match}] hidden=${r.hidden}`);
  }

  // ═══════════════════════════════════════════════════════
  // 8. Check the boardSubmission role data tab for the vote
  //    — what happens when we set boardBoardDecision?
  // ═══════════════════════════════════════════════════════
  const boardFormioStatus = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return 'No roleForm';
    const data = roleForm.submission.data;
    return {
      boardBoardDecision: data.boardBoardDecision,
      boardselection: data.boardselection,
      boardSubmissionselection: data.boardSubmissionselection,
      boardSubmissionVoteChairman: data.boardSubmissionVoteChairman,
      approvalSeza: data.approvalSeza,
    };
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  CRITICAL FORM DATA VALUES');
  console.log('='.repeat(60));
  console.log(JSON.stringify(boardFormioStatus, null, 2));

  console.log('\n\nDiagnostic complete.');
});
