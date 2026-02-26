import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — ARC decision form: explore EditGrid rows and recommendation fields
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('ARC decision form exploration', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto(`/part-b/${SERVICE_ID}/applicationReviewingCommitteeArcDecision/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);

  // Get form structure
  const formData = await page.evaluate(() => {
    const results: any = {};

    // Find EditGrid components
    const editGrids = document.querySelectorAll('[class*="editgrid"], [ref*="editgrid"], .formio-component-editgrid');
    results.editGridCount = editGrids.length;
    results.editGrids = Array.from(editGrids).map((eg, i) => {
      const key = eg.className.match(/formio-component-(\S+)/)?.[1];
      const rows = eg.querySelectorAll('[class*="editgrid-row"], [ref="editgrid-editgrid-row"]');
      const saveButtons = eg.querySelectorAll('button:not([style*="display: none"])');
      return {
        key: key?.substring(0, 60),
        rowCount: rows.length,
        saveButtons: Array.from(saveButtons).map(b => b.textContent?.trim().substring(0, 40)),
      };
    }).slice(0, 10);

    // Find all "Save" buttons in the page
    const allSaveButtons = document.querySelectorAll('button');
    results.saveButtons = Array.from(allSaveButtons)
      .filter(b => {
        const text = b.textContent?.trim().toLowerCase() || '';
        return text === 'save' || text.includes('save row') || text.includes('save edit');
      })
      .map(b => ({
        text: b.textContent?.trim(),
        visible: (b as HTMLElement).offsetParent !== null,
        disabled: (b as HTMLButtonElement).disabled,
        class: b.className.substring(0, 60),
      }));

    // Check roleForm for recommendation/condition data
    const roleForm = (window as any).roleForm;
    if (roleForm?.submission?.data) {
      const data = roleForm.submission.data;
      results.arcKeys = Object.keys(data).filter(k =>
        k.toLowerCase().includes('arc') ||
        k.toLowerCase().includes('recommendation') ||
        k.toLowerCase().includes('condition') ||
        k.toLowerCase().includes('decision')
      ).map(k => ({
        key: k,
        value: typeof data[k] === 'object' ? JSON.stringify(data[k]).substring(0, 80) : String(data[k]).substring(0, 80),
      }));
    }

    // Get all visible radio buttons with their parent component info
    const radios = document.querySelectorAll('input[type="radio"]');
    results.visibleRadios = Array.from(radios)
      .filter(r => {
        const parentComp = r.closest('[class*="formio-component"]');
        return parentComp && (parentComp as HTMLElement).offsetParent !== null;
      })
      .map(r => ({
        name: (r as HTMLInputElement).name,
        value: (r as HTMLInputElement).value,
        label: r.closest('label')?.textContent?.trim() || document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim(),
        checked: (r as HTMLInputElement).checked,
        parentKey: r.closest('[class*="formio-component-radio"], [class*="formio-component-selectboxes"]')?.className.match(/formio-component-(\S+)/)?.[1],
      }))
      .filter(r => r.label && (
        r.label.includes('Ministerial') ||
        r.label.includes('Pre-approved') ||
        r.label.includes('Deferred') ||
        r.label.includes('approved') ||
        r.label.includes('Approve')
      ))
      .slice(0, 30);

    // Check Formio for editGrid components with unsaved rows
    const formio = (window as any).Formio;
    if (formio?.forms) {
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (!form?.root) continue;

        const editGridComps: any[] = [];
        const walk = (comp: any, depth = 0) => {
          if (!comp || depth > 8) return;
          const cKey = comp.component?.key || comp.key;
          const cType = comp.component?.type;

          if (cType === 'editgrid') {
            editGridComps.push({
              key: cKey,
              label: comp.component?.label,
              editRows: comp.editRows?.length,
              dataValue: comp.dataValue?.length,
              hasOpenRows: comp.editRows?.some((r: any) => r.state === 'new' || r.state === 'editing'),
            });
          }

          if (comp.components) {
            for (const c of comp.components) walk(c, depth + 1);
          }
          if (comp.columns) {
            for (const col of comp.columns) {
              if (col?.components) {
                for (const c of col.components) walk(c, depth + 1);
              }
            }
          }
        };
        walk(form.root);
        if (editGridComps.length > 0) {
          results[`form_${fk}_editGrids`] = editGridComps;
        }
      }
    }

    return results;
  });

  console.log('EditGrid count:', formData.editGridCount);
  console.log('EditGrids:', JSON.stringify(formData.editGrids, null, 2));
  console.log('Save buttons:', JSON.stringify(formData.saveButtons, null, 2));
  console.log('ARC keys:', JSON.stringify(formData.arcKeys, null, 2));
  console.log('Visible radios:', JSON.stringify(formData.visibleRadios, null, 2));

  for (const [key, val] of Object.entries(formData)) {
    if (key.includes('editGrids') && key.includes('form_')) {
      console.log(`${key}:`, JSON.stringify(val, null, 2));
    }
  }

  // Try to find and save EditGrid rows via Formio
  console.log('\n══ Trying to save EditGrid rows ══');

  const saveResult = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';

    const results: string[] = [];

    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk];
      if (!form?.root) continue;

      const walk = (comp: any) => {
        if (!comp) return;
        const cType = comp.component?.type;
        const cKey = comp.component?.key || comp.key;

        if (cType === 'editgrid' && comp.editRows) {
          for (let i = 0; i < comp.editRows.length; i++) {
            const row = comp.editRows[i];
            if (row.state === 'new' || row.state === 'editing') {
              results.push(`  EditGrid ${cKey} row ${i}: state=${row.state}`);
              // Try to save the row
              if (comp.saveRow) {
                try {
                  comp.saveRow(i);
                  results.push(`    → saved via saveRow(${i})`);
                } catch (e: any) {
                  results.push(`    → saveRow error: ${e.message?.substring(0, 50)}`);
                }
              }
              // Try cancelRow for new empty rows
              if (row.state === 'new' && comp.cancelRow) {
                try {
                  comp.cancelRow(i);
                  results.push(`    → cancelled via cancelRow(${i})`);
                } catch (e: any) {
                  results.push(`    → cancelRow error: ${e.message?.substring(0, 50)}`);
                }
              }
            } else {
              results.push(`  EditGrid ${cKey} row ${i}: state=${row.state} (already saved)`);
            }
          }
        }

        if (comp.components) {
          for (const c of comp.components) walk(c);
        }
        if (comp.columns) {
          for (const col of comp.columns) {
            if (col?.components) {
              for (const c of col.components) walk(c);
            }
          }
        }
      };
      walk(form.root);
    }

    return results.length > 0 ? results.join('\n') : 'No EditGrid rows found';
  });
  console.log(saveResult);

  // Now try clicking "Send to Board submission" again
  console.log('\n══ Retry Send to Board submission ══');
  await page.waitForTimeout(2000);

  const sendBtn = page.locator('button:has-text("Send to Board submission")');
  if (await sendBtn.isVisible().catch(() => false)) {
    const beforeUrl = page.url();
    await sendBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(10_000);

    // Check for toasts
    const toasts = page.locator('.toast:visible, [class*="toast"]:visible');
    const count = await toasts.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = (await toasts.nth(i).textContent())?.trim();
      if (text) console.log(`  Toast: "${text.substring(0, 80)}"`);
    }

    console.log(`  URL after: ${page.url()}`);
    if (page.url() !== beforeUrl) {
      console.log('  ✓ ARC decision completed!');
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/arc-01-after-attempt.png`, fullPage: true });
  console.log('\n══ ARC DIAGNOSTIC COMPLETE ══');
});
