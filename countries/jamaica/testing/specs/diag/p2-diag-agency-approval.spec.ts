import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — Explore agency approval forms (TAJ, MOFPS, JCA)
 * These roles need a "decision" field before "Send decision to SEZA"
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Explore TAJ approval form', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate to TAJ approval
  console.log('\n══ TAJ Approval Form ══');

  await page.goto(`/part-b/${SERVICE_ID}/tajApproval/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/agency-01-taj-initial.png`, fullPage: true });

  // Explore the form structure
  const formInfo = await page.evaluate(() => {
    const results: any = {};

    // Get all formio components
    const components = document.querySelectorAll('[class*="formio-component"]');
    results.components = Array.from(components)
      .filter(c => {
        const el = c as HTMLElement;
        return el.offsetParent !== null;
      })
      .map(c => {
        const label = c.querySelector('label')?.textContent?.trim();
        const key = c.className.match(/formio-component-(\S+)/)?.[1];
        const input = c.querySelector('input, textarea, select');
        const radios = c.querySelectorAll('input[type="radio"]');
        const radioValues = Array.from(radios).map(r => ({
          value: (r as HTMLInputElement).value,
          name: (r as HTMLInputElement).name,
          label: r.closest('label')?.textContent?.trim() || document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim(),
          checked: (r as HTMLInputElement).checked,
        }));

        return {
          key: key?.substring(0, 80),
          label: label?.substring(0, 80),
          type: input?.tagName || (radios.length > 0 ? 'RADIO' : 'other'),
          inputType: (input as HTMLInputElement)?.type,
          radios: radioValues.length > 0 ? radioValues : undefined,
          required: !!c.querySelector('.field-required'),
        };
      })
      .filter(c => c.label && c.key && !c.key.startsWith('panel') && !c.key.startsWith('columns'))
      .slice(0, 30);

    // Get roleForm data keys related to TAJ
    const roleForm = (window as any).roleForm;
    if (roleForm?.submission?.data) {
      const data = roleForm.submission.data;
      results.tajKeys = Object.keys(data).filter(k =>
        k.toLowerCase().includes('taj') ||
        k.toLowerCase().includes('decision') ||
        k.toLowerCase().includes('noobjection') ||
        k.toLowerCase().includes('no-objection') ||
        k.toLowerCase().includes('noObjection')
      ).map(k => ({
        key: k,
        value: typeof data[k] === 'object' ? JSON.stringify(data[k]).substring(0, 50) : String(data[k]).substring(0, 50),
      }));
    }

    // Check Formio forms for decision components
    const formio = (window as any).Formio;
    if (formio?.forms) {
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (!form?.root) continue;

        const decisionComps: any[] = [];
        const walk = (comp: any, depth = 0) => {
          if (!comp || depth > 10) return;
          const cKey = comp.component?.key || comp.key;
          const cLabel = comp.component?.label;
          const cType = comp.component?.type;

          if (cKey && (
            cKey.toLowerCase().includes('decision') ||
            cKey.toLowerCase().includes('taj') ||
            cKey.toLowerCase().includes('noobjection') ||
            cKey.toLowerCase().includes('approval')
          )) {
            decisionComps.push({
              key: cKey,
              label: cLabel,
              type: cType,
              values: comp.component?.values || comp.component?.data?.values,
              required: comp.component?.validate?.required,
              visible: comp.visible,
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
        results[`form_${fk}_decisionComps`] = decisionComps;
      }
    }

    return results;
  });
  console.log('  Components:', JSON.stringify(formInfo.components, null, 2));
  console.log('  TAJ keys:', JSON.stringify(formInfo.tajKeys, null, 2));

  // Log decision components from each form
  for (const [key, val] of Object.entries(formInfo)) {
    if (key.includes('decisionComps')) {
      console.log(`  ${key}:`, JSON.stringify(val, null, 2));
    }
  }

  // ══════════════════════════════════════════════════════════
  // Try to find and fill the decision field
  // ══════════════════════════════════════════════════════════
  console.log('\n══ Find visible radios/selects on page ══');

  const visibleInputs = await page.evaluate(() => {
    const results: any = {};

    // Get all visible radios
    const radios = document.querySelectorAll('input[type="radio"]');
    results.radios = Array.from(radios)
      .filter(r => (r as HTMLElement).offsetParent !== null || r.closest('[class*="formio-component"]'))
      .map(r => ({
        name: (r as HTMLInputElement).name,
        value: (r as HTMLInputElement).value,
        id: r.id,
        label: r.closest('label')?.textContent?.trim() || document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim(),
        checked: (r as HTMLInputElement).checked,
        parentKey: r.closest('[class*="formio-component"]')?.className.match(/formio-component-(\S+)/)?.[1],
      }));

    // Get all visible selects
    const selects = document.querySelectorAll('select');
    results.selects = Array.from(selects)
      .filter(s => (s as HTMLElement).offsetParent !== null)
      .map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ text: o.text.trim(), value: o.value })).slice(0, 10),
        parentKey: s.closest('[class*="formio-component"]')?.className.match(/formio-component-(\S+)/)?.[1],
      }));

    // Get all collapsible sections (they might hide the decision field)
    const panels = document.querySelectorAll('[class*="panel"], .card, [class*="accordion"]');
    results.panels = Array.from(panels)
      .filter(p => (p as HTMLElement).offsetParent !== null)
      .map(p => {
        const heading = p.querySelector('.card-header, .panel-heading, h4, h5, button[data-toggle]');
        const isCollapsed = p.querySelector('.collapse:not(.show)') !== null;
        return {
          heading: heading?.textContent?.trim().substring(0, 50),
          collapsed: isCollapsed,
        };
      })
      .filter(p => p.heading)
      .slice(0, 10);

    return results;
  });
  console.log('  Radios:', JSON.stringify(visibleInputs.radios, null, 2));
  console.log('  Selects:', JSON.stringify(visibleInputs.selects, null, 2));
  console.log('  Panels:', JSON.stringify(visibleInputs.panels, null, 2));

  // ══════════════════════════════════════════════════════════
  // Expand all collapsed sections and re-check
  // ══════════════════════════════════════════════════════════
  console.log('\n══ Expand all sections ══');

  // Click on all panel headings to expand
  const panelHeadings = page.locator('.card-header, [data-toggle="collapse"]');
  const headingCount = await panelHeadings.count();
  for (let i = 0; i < headingCount; i++) {
    try {
      await panelHeadings.nth(i).click();
      await page.waitForTimeout(500);
    } catch {}
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/agency-02-taj-expanded.png`, fullPage: true });

  // Re-check for inputs after expanding
  const afterExpand = await page.evaluate(() => {
    const radios = document.querySelectorAll('input[type="radio"]');
    const results: any[] = [];
    for (const r of radios) {
      const el = r as HTMLInputElement;
      results.push({
        name: el.name,
        value: el.value,
        id: el.id,
        label: r.closest('label')?.textContent?.trim() || document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim(),
        checked: el.checked,
        parentKey: r.closest('[class*="formio-component"]')?.className.match(/formio-component-(\S+)/)?.[1],
        visible: (r as HTMLElement).offsetParent !== null,
      });
    }
    return results;
  });
  console.log('  All radios after expand:', JSON.stringify(afterExpand, null, 2));

  // Also check for any choices.js dropdowns
  const choicesDropdowns = await page.evaluate(() => {
    const containers = document.querySelectorAll('[class*="choices"], .choices');
    return Array.from(containers)
      .filter(c => (c as HTMLElement).offsetParent !== null)
      .map(c => ({
        label: c.closest('[class*="formio-component"]')?.querySelector('label')?.textContent?.trim(),
        class: c.className.substring(0, 60),
        hasNoChoices: c.classList.contains('has-no-choices'),
        selectedText: c.querySelector('.choices__item--selectable')?.textContent?.trim(),
      }));
  });
  console.log('  Choices dropdowns:', JSON.stringify(choicesDropdowns, null, 2));

  console.log('\n══ AGENCY APPROVAL DIAGNOSTIC COMPLETE ══');
});
