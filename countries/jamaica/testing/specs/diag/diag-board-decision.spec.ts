import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';

/**
 * Diagnostic: Deep dive into Board role's Processing tab
 *
 * Board is currently pending. Previous diagnostics found:
 * - Processing tab has: "Request corrections" (modal), "Save", "Approve" buttons
 * - Processing tab has: textarea, Choices.js dropdown, "Board decision" input
 * - Data tab has boardSubmissionVoteChairman radio (rendered, but read-only Data tab)
 * - boardSubmissionselection = "filevalidated" (controls status transition)
 *
 * This diagnostic investigates:
 * 1. What type is the "Board decision" field? (text, select, Choices.js?)
 * 2. What options does the Choices.js dropdown have?
 * 3. What Formio components exist on the Processing tab specifically?
 * 4. Does changing "Board decision" reveal new buttons?
 * 5. What is boardSubmissionselection and how to change it?
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';

test('DIAG: Board decision mechanism', async ({ page }) => {
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

  // Find the board-related pending task
  const boardTask = pending.find(t =>
    t.camundaName.toLowerCase().includes('board')
  );
  if (!boardTask) {
    console.log('No Board task found — listing all pending:');
    for (const t of pending) console.log(`  ${t.camundaName} (${t.status})`);
    test.skip();
    return;
  }

  console.log(`\nTarget: ${boardTask.camundaName}`);
  await boHelpers.navigateToRole(page, SERVICE_ID, boardTask.camundaName, processId, FILE_ID);
  await page.waitForTimeout(6000);

  // ═══════════════════════════════════════════════════════
  // 1. Go to Processing tab and analyze ALL components
  // ═══════════════════════════════════════════════════════
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // Get ALL visible elements with their full details
  const procElements = await page.evaluate(() => {
    const results: any[] = [];
    const container = document.querySelector('.tab-pane.active, .tab-content');
    const scope = container || document;

    // All visible inputs, selects, textareas
    const formEls = scope.querySelectorAll('input:not([type="hidden"]), select, textarea');
    for (const el of formEls) {
      if ((el as any).offsetParent === null) continue;
      const comp = (el as any).closest('.formio-component');
      results.push({
        category: 'form-element',
        tag: el.tagName,
        type: (el as any).type || '',
        name: (el as any).name || '',
        id: (el as any).id || '',
        value: (el as any).value?.substring(0, 80) || '',
        placeholder: (el as any).placeholder || '',
        disabled: (el as any).disabled,
        readOnly: (el as any).readOnly,
        label: comp?.querySelector('label')?.textContent?.trim().substring(0, 80) || '',
        classes: el.className?.substring(0, 100) || '',
        formioKey: comp?.getAttribute('ref')?.replace('component-', '') || '',
      });
    }

    // All Choices.js instances
    const choicesEls = scope.querySelectorAll('.choices');
    for (const el of choicesEls) {
      if ((el as any).offsetParent === null) continue;
      const comp = (el as any).closest('.formio-component');
      const innerText = (el as any).querySelector('.choices__inner')?.textContent?.trim() || '';
      const selectEl = (el as any).querySelector('select');
      const options = selectEl ? Array.from(selectEl.options).map((o: any) => ({
        value: o.value,
        text: o.textContent?.trim().substring(0, 60),
        selected: o.selected,
      })) : [];

      results.push({
        category: 'choices-dropdown',
        innerText: innerText.substring(0, 80),
        label: comp?.querySelector('label')?.textContent?.trim().substring(0, 80) || '',
        formioKey: comp?.getAttribute('ref')?.replace('component-', '') || '',
        classes: el.className?.substring(0, 100) || '',
        options,
      });
    }

    // All visible buttons
    const btns = scope.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn as any).offsetParent === null) continue;
      const text = (btn as any).textContent?.trim();
      if (!text || ['NP', 'en', '×', 'NPNELSON PEREZ'].includes(text)) continue;
      results.push({
        category: 'button',
        text: text.substring(0, 100),
        disabled: (btn as any).disabled,
        type: (btn as any).type,
        classes: (btn as any).className?.substring(0, 100),
        id: (btn as any).id || '',
      });
    }

    return results;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  PROCESSING TAB ELEMENTS');
  console.log('='.repeat(60));
  for (const el of procElements) {
    if (el.category === 'form-element') {
      console.log(`\n  [FORM] <${el.tag}> type="${el.type}"`);
      console.log(`    name="${el.name}" id="${el.id}"`);
      console.log(`    label="${el.label}" formioKey="${el.formioKey}"`);
      console.log(`    value="${el.value}" placeholder="${el.placeholder}"`);
      console.log(`    disabled=${el.disabled} readOnly=${el.readOnly}`);
      console.log(`    classes="${el.classes}"`);
    } else if (el.category === 'choices-dropdown') {
      console.log(`\n  [CHOICES] label="${el.label}" formioKey="${el.formioKey}"`);
      console.log(`    innerText="${el.innerText}"`);
      console.log(`    options (${el.options?.length || 0}):`);
      for (const o of (el.options || [])) {
        console.log(`      ${o.selected ? '●' : '○'} value="${o.value}" text="${o.text}"`);
      }
    } else if (el.category === 'button') {
      console.log(`\n  [BTN] "${el.text}" type=${el.type} disabled=${el.disabled} id="${el.id}"`);
      console.log(`    classes="${el.classes}"`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 2. Formio component tree — focus on Processing tab panel
  // ═══════════════════════════════════════════════════════
  const formioTree = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any, depth: number = 0, parentKey: string = '') => {
        if (!comp) return;
        const cKey = comp.component?.key || comp.key || '';
        const cType = comp.component?.type || comp.type || '';
        const cLabel = comp.component?.label?.substring(0, 60) || '';
        const hidden = comp.component?.hidden || false;
        const visible = comp.visible;

        // Only show processing-tab related or selection/decision components
        const isInteresting = depth <= 2 ||
          cKey.toLowerCase().includes('selection') ||
          cKey.toLowerCase().includes('decision') ||
          cKey.toLowerCase().includes('board') ||
          cKey.toLowerCase().includes('vote') ||
          cType === 'radio' || cType === 'select' ||
          cKey.toLowerCase().includes('processing');

        if (isInteresting) {
          const entry: any = {
            depth,
            key: cKey,
            type: cType,
            label: cLabel,
            hidden,
            visible,
            parent: parentKey,
          };

          // For radio/select, include values
          if (cType === 'radio' || cType === 'select') {
            const vals = comp.component?.values || comp.component?.data?.values || [];
            entry.values = vals.map((v: any) => `${v.label}=${v.value}`).join(', ');
            entry.currentValue = comp.dataValue;
          }

          // For any component with conditional
          if (comp.component?.conditional?.show !== undefined ||
              comp.component?.customConditional) {
            entry.conditional = JSON.stringify(comp.component.conditional)?.substring(0, 150);
            entry.customConditional = comp.component.customConditional?.substring(0, 150);
          }

          results.push(entry);
        }

        if (comp.components) for (const c of comp.components) walk(c, depth + 1, cKey);
        if (comp.columns) for (const col of comp.columns) {
          if (col?.components) for (const c of col.components) walk(c, depth + 1, cKey);
        }
      };
      walk(form.root);
    }
    return results;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  FORMIO COMPONENT TREE (interesting nodes)');
  console.log('='.repeat(60));
  for (const c of formioTree) {
    const indent = '  '.repeat(c.depth + 1);
    console.log(`${indent}${c.type}:"${c.key}" label="${c.label}" hidden=${c.hidden} visible=${c.visible} parent="${c.parent}"`);
    if (c.values) console.log(`${indent}  values: ${c.values}`);
    if (c.currentValue !== undefined) console.log(`${indent}  currentValue: ${JSON.stringify(c.currentValue)?.substring(0, 80)}`);
    if (c.conditional) console.log(`${indent}  conditional: ${c.conditional}`);
    if (c.customConditional) console.log(`${indent}  customConditional: ${c.customConditional}`);
  }

  // ═══════════════════════════════════════════════════════
  // 3. Find ALL keys containing "selection" in form data
  // ═══════════════════════════════════════════════════════
  const selectionData = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return 'No roleForm';
    const data = roleForm.submission.data;
    return Object.keys(data)
      .filter(k => {
        const lk = k.toLowerCase();
        return lk.includes('selection') || lk.includes('decision') ||
          lk.includes('board') || lk.includes('vote') ||
          lk.includes('status') || lk.includes('reject') ||
          lk.includes('approve') || lk.includes('denied');
      })
      .map(k => `${k} = ${JSON.stringify(data[k])?.substring(0, 120)}`)
      .join('\n  ');
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  FORM DATA: Selection/Decision/Board keys');
  console.log('='.repeat(60));
  console.log(`  ${selectionData}`);

  // ═══════════════════════════════════════════════════════
  // 4. Specifically look for the "selection" Formio component
  //    that controls the workflow transition
  // ═══════════════════════════════════════════════════════
  const selectionComponent = await page.evaluate(() => {
    const results: any[] = [];
    const formio = (window as any).Formio;
    if (!formio?.forms) return results;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;
      const walk = (comp: any) => {
        if (!comp) return;
        const cKey = comp.component?.key || comp.key || '';
        if (cKey.toLowerCase().includes('selection') ||
            cKey.toLowerCase().includes('boarddecision') ||
            cKey === 'boardSubmissionselection' ||
            cKey === 'boardselection') {
          results.push({
            key: cKey,
            type: comp.component?.type || comp.type,
            label: comp.component?.label?.substring(0, 80),
            values: (comp.component?.values || comp.component?.data?.values || [])
              .map((v: any) => `${v.label}=${v.value}`).join(', '),
            hidden: comp.component?.hidden,
            visible: comp.visible,
            rendered: comp.element?.offsetParent !== null,
            dataValue: comp.dataValue,
            hasSetValue: typeof comp.setValue === 'function',
            conditional: comp.component?.conditional ? JSON.stringify(comp.component.conditional).substring(0, 200) : '',
            customConditional: comp.component?.customConditional?.substring(0, 200) || '',
            parentKey: comp.parent?.component?.key || '',
            parentType: comp.parent?.component?.type || '',
            parentLabel: comp.parent?.component?.label?.substring(0, 60) || '',
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
  console.log('  SELECTION COMPONENTS (workflow transition controls)');
  console.log('='.repeat(60));
  for (const c of selectionComponent) {
    console.log(`\n  key="${c.key}" type="${c.type}" label="${c.label}"`);
    console.log(`    values: ${c.values || 'none'}`);
    console.log(`    hidden=${c.hidden} visible=${c.visible} rendered=${c.rendered}`);
    console.log(`    dataValue: ${JSON.stringify(c.dataValue)?.substring(0, 80)}`);
    console.log(`    hasSetValue=${c.hasSetValue}`);
    console.log(`    parent: ${c.parentType}:"${c.parentLabel}" (key=${c.parentKey})`);
    if (c.conditional) console.log(`    conditional: ${c.conditional}`);
    if (c.customConditional) console.log(`    customConditional: ${c.customConditional}`);
  }

  // ═══════════════════════════════════════════════════════
  // 5. Check the "Request corrections" modal button
  //    — click it and see what's inside the modal
  // ═══════════════════════════════════════════════════════
  console.log(`\n${'='.repeat(60)}`);
  console.log('  MODAL BUTTON EXPLORATION');
  console.log('='.repeat(60));

  const modalBtn = page.locator('button.open-modal-button').first();
  if (await modalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const modalText = await modalBtn.textContent();
    console.log(`\n  Clicking modal button: "${modalText?.trim()}"`);
    await modalBtn.click();
    await page.waitForTimeout(3000);

    // Analyze modal content
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.formio-dialog, .modal-dialog, .formio-dialog-content, [class*="dialog"]');
      if (!modal) return { found: false, html: '' };

      const results: any = { found: true, elements: [] };

      // All inputs/selects/radios in modal
      const formEls = modal.querySelectorAll('input:not([type="hidden"]), select, textarea, .choices');
      for (const el of formEls) {
        const comp = (el as any).closest('.formio-component');
        results.elements.push({
          tag: el.tagName,
          type: (el as any).type || '',
          name: (el as any).name || '',
          value: (el as any).value?.substring(0, 80) || '',
          label: comp?.querySelector('label')?.textContent?.trim().substring(0, 80) || '',
          classes: el.className?.substring(0, 80) || '',
        });
      }

      // All buttons in modal
      const btns = modal.querySelectorAll('button');
      for (const btn of btns) {
        const text = (btn as any).textContent?.trim();
        if (text && text !== '×') {
          results.elements.push({
            tag: 'BUTTON',
            text: text.substring(0, 100),
            disabled: (btn as any).disabled,
            classes: (btn as any).className?.substring(0, 80),
          });
        }
      }

      // Any radio buttons with their labels
      const radios = modal.querySelectorAll('input[type="radio"]');
      for (const r of radios) {
        results.elements.push({
          tag: 'RADIO',
          name: (r as any).name,
          value: (r as any).value,
          checked: (r as any).checked,
          label: (r as any).closest('label')?.textContent?.trim().substring(0, 80) || '',
        });
      }

      // Full text content of modal
      results.fullText = (modal as any).textContent?.trim().substring(0, 500);

      return results;
    });

    console.log(`  Modal found: ${modalContent.found}`);
    if (modalContent.found) {
      console.log(`  Modal text: "${modalContent.fullText?.substring(0, 200)}"`);
      console.log(`  Modal elements (${modalContent.elements?.length || 0}):`);
      for (const el of (modalContent.elements || [])) {
        if (el.tag === 'BUTTON') {
          console.log(`    [BTN] "${el.text}" disabled=${el.disabled} classes="${el.classes}"`);
        } else if (el.tag === 'RADIO') {
          console.log(`    [RADIO] name="${el.name}" value="${el.value}" checked=${el.checked} label="${el.label}"`);
        } else {
          console.log(`    [${el.tag}] type="${el.type}" name="${el.name}" label="${el.label}" value="${el.value}"`);
        }
      }
    }

    // Take screenshot of modal
    await page.screenshot({ path: '/tmp/board-modal.png', fullPage: true });

    // Close modal
    const closeBtn = page.locator('.formio-dialog button.formio-dialog-close, .modal .close, button:has-text("×")').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('  No modal button found');
  }

  // ═══════════════════════════════════════════════════════
  // 6. Check ALL modal buttons (not just the first one)
  // ═══════════════════════════════════════════════════════
  const allModalBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button.open-modal-button, button[class*="modal"]'))
      .map((b: any) => ({
        text: b.textContent?.trim().substring(0, 100),
        visible: b.offsetParent !== null,
        classes: b.className?.substring(0, 100),
        disabled: b.disabled,
      }));
  });
  console.log(`\n  All modal buttons (${allModalBtns.length}):`);
  for (const mb of allModalBtns) {
    console.log(`    ${mb.visible ? '👁' : '🔒'} "${mb.text}" disabled=${mb.disabled} class="${mb.classes}"`);
  }

  // ═══════════════════════════════════════════════════════
  // 7. Look for hidden buttons or conditionally shown buttons
  // ═══════════════════════════════════════════════════════
  const allBtnsIncHidden = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map((b: any) => ({
        text: b.textContent?.trim().substring(0, 100),
        visible: b.offsetParent !== null,
        display: getComputedStyle(b).display,
        classes: b.className?.substring(0, 100),
        parentClasses: b.parentElement?.className?.substring(0, 80) || '',
      }))
      .filter((b: any) => b.text && !['NP', 'en', '×', 'NPNELSON PEREZ'].includes(b.text));
  });

  console.log(`\n  ALL buttons including hidden (${allBtnsIncHidden.length}):`);
  for (const b of allBtnsIncHidden) {
    console.log(`    ${b.visible ? '👁' : '🔒'} "${b.text}" display=${b.display} parent="${b.parentClasses?.substring(0, 40)}"`);
  }

  // ═══════════════════════════════════════════════════════
  // 8. Check the roleForm for "selection" type components
  //    that might control the action button behavior
  // ═══════════════════════════════════════════════════════
  const roleFormAnalysis = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return 'No roleForm';

    const results: any = {
      hasRoot: !!roleForm.root,
      submissionKeys: Object.keys(roleForm.submission?.data || {}).filter(k => {
        const lk = k.toLowerCase();
        return lk.includes('selection') || lk.includes('decision') ||
          lk.includes('board') || lk.includes('status') ||
          lk.includes('action') || lk.includes('approve') ||
          lk.includes('reject') || lk.includes('submit');
      }).map(k => `${k}=${JSON.stringify(roleForm.submission.data[k])?.substring(0, 60)}`),
    };

    // Walk roleForm components specifically
    if (roleForm.root?.components) {
      const comps: any[] = [];
      const walk = (comp: any, depth: number = 0) => {
        if (!comp) return;
        const k = comp.component?.key || '';
        const t = comp.component?.type || '';
        const lk = k.toLowerCase();
        // Show all non-container components
        if (t && t !== 'panel' && t !== 'columns' && t !== 'tabs' && t !== 'well' && t !== 'fieldset') {
          comps.push({
            key: k,
            type: t,
            label: comp.component?.label?.substring(0, 60) || '',
            hidden: comp.component?.hidden || false,
            visible: comp.visible,
            depth,
          });
        }
        if (comp.components) for (const c of comp.components) walk(c, depth + 1);
        if (comp.columns) for (const col of comp.columns) {
          if (col?.components) for (const c of col.components) walk(c, depth + 1);
        }
      };
      walk(roleForm.root);
      results.allComponents = comps;
    }

    return results;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  ROLEFORM ANALYSIS');
  console.log('='.repeat(60));
  if (typeof roleFormAnalysis === 'string') {
    console.log(`  ${roleFormAnalysis}`);
  } else {
    console.log(`  hasRoot: ${roleFormAnalysis.hasRoot}`);
    console.log(`  Relevant submission keys:`);
    for (const k of roleFormAnalysis.submissionKeys || []) {
      console.log(`    ${k}`);
    }
    console.log(`\n  All roleForm components (${roleFormAnalysis.allComponents?.length || 0}):`);
    for (const c of (roleFormAnalysis.allComponents || [])) {
      const indent = '  '.repeat(c.depth);
      console.log(`    ${indent}${c.type}:"${c.key}" label="${c.label}" hidden=${c.hidden} visible=${c.visible}`);
    }
  }

  console.log('\n\nDiagnostic complete.');
});
