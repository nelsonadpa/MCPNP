import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Find what enables the "Approve documents check" button.
 * Check its Formio component conditional, the form schema, and roleForm.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Approve button conditional', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Go to Processing tab
  await page.locator('a:has-text("Processing")').first().click();
  await page.waitForTimeout(3000);

  // 1. Get the Formio component definition for the Approve button
  console.log('\n══ Approve button Formio component ══');
  const btnComponent = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';

    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];

      // Search for the button component
      const findBtn = (comp: any, path = ''): any => {
        if (!comp) return null;
        const key = comp.key || '';
        if (key.includes('filevalidated') || key.includes('btnValidate') || key.includes('Approve')) {
          return comp;
        }
        if (comp.components) {
          for (const c of comp.components) {
            const found = findBtn(c, path + '.' + key);
            if (found) return found;
          }
        }
        if (comp.columns) {
          for (const col of comp.columns) {
            if (col.components) {
              for (const c of col.components) {
                const found = findBtn(c, path + '.' + key);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };

      // Search in the form schema
      if (form.form?.components) {
        for (const comp of form.form.components) {
          const btn = findBtn(comp);
          if (btn) {
            results.push(`\nForm ${k}: Found button component`);
            results.push(`  key: ${btn.key}`);
            results.push(`  type: ${btn.type}`);
            results.push(`  label: ${btn.label}`);
            results.push(`  disabled: ${btn.disabled}`);
            results.push(`  disableOnInvalid: ${btn.disableOnInvalid}`);
            results.push(`  conditional: ${JSON.stringify(btn.conditional)?.substring(0, 200)}`);
            results.push(`  customConditional: ${btn.customConditional?.substring(0, 300)}`);
            results.push(`  logic: ${JSON.stringify(btn.logic)?.substring(0, 300)}`);
            results.push(`  properties: ${JSON.stringify(btn.properties)?.substring(0, 200)}`);
            results.push(`  validate: ${JSON.stringify(btn.validate)?.substring(0, 200)}`);

            // Full button JSON (truncated)
            const fullJson = JSON.stringify(btn);
            results.push(`\n  Full component (${fullJson.length} chars):`);
            results.push(`  ${fullJson.substring(0, 500)}`);
            if (fullJson.length > 500) {
              results.push(`  ${fullJson.substring(500, 1000)}`);
            }
          }
        }
      }

      // Also check the runtime component instance
      if (form.root) {
        const findRuntime = (comp: any): any => {
          if (!comp) return null;
          if (comp.key?.includes('filevalidated') || comp.key?.includes('btnValidate')) return comp;
          if (comp.components) {
            for (const c of comp.components) {
              const found = findRuntime(c);
              if (found) return found;
            }
          }
          return null;
        };

        const runtimeBtn = findRuntime(form.root);
        if (runtimeBtn) {
          results.push(`\n  Runtime component:`);
          results.push(`    disabled: ${runtimeBtn.disabled}`);
          results.push(`    visible: ${runtimeBtn.visible}`);
          results.push(`    _disabled: ${runtimeBtn._disabled}`);
          results.push(`    _visible: ${runtimeBtn._visible}`);
          // Check if it has a checkCondition method
          if (runtimeBtn.checkConditions) {
            results.push(`    Has checkConditions method`);
          }
          // Check the conditional result
          if (runtimeBtn.conditionallyVisible) {
            try {
              const vis = runtimeBtn.conditionallyVisible();
              results.push(`    conditionallyVisible(): ${vis}`);
            } catch (e: any) {
              results.push(`    conditionallyVisible() error: ${e.message?.substring(0, 60)}`);
            }
          }
        }
      }
    }

    return results;
  });

  if (Array.isArray(btnComponent)) {
    for (const line of btnComponent) {
      console.log(`  ${line}`);
    }
  } else {
    console.log(`  ${btnComponent}`);
  }

  // 2. Check the isFormValid calculation
  console.log('\n══ isFormValid calculation ══');
  const validCalc = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return ['No Formio'];

    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];

      // Find the isFormValid component
      const findComp = (comp: any, target: string): any => {
        if (!comp) return null;
        if (comp.key === target) return comp;
        if (comp.components) {
          for (const c of comp.components) {
            const found = findComp(c, target);
            if (found) return found;
          }
        }
        if (comp.columns) {
          for (const col of comp.columns) {
            if (col.components) {
              for (const c of col.components) {
                const found = findComp(c, target);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };

      if (form.form?.components) {
        for (const comp of form.form.components) {
          const isValid = findComp(comp, 'isFormValid');
          if (isValid) {
            results.push(`Form ${k}: isFormValid component`);
            results.push(`  type: ${isValid.type}`);
            results.push(`  customConditional: ${isValid.customConditional?.substring(0, 300)}`);
            results.push(`  calculateValue: ${isValid.calculateValue?.substring(0, 300)}`);
            results.push(`  conditional: ${JSON.stringify(isValid.conditional)?.substring(0, 200)}`);
            results.push(`  defaultValue: ${isValid.defaultValue}`);
            results.push(`  Full: ${JSON.stringify(isValid).substring(0, 500)}`);
          }

          // Also find FORMDATAVALIDATIONSTATUS
          const validStatus = findComp(comp, 'FORMDATAVALIDATIONSTATUS');
          if (validStatus) {
            results.push(`\nForm ${k}: FORMDATAVALIDATIONSTATUS component`);
            results.push(`  type: ${validStatus.type}`);
            results.push(`  values: ${JSON.stringify(validStatus.values)?.substring(0, 200)}`);
            results.push(`  customConditional: ${validStatus.customConditional?.substring(0, 300)}`);
            results.push(`  calculateValue: ${validStatus.calculateValue?.substring(0, 300)}`);
            results.push(`  Full: ${JSON.stringify(validStatus).substring(0, 500)}`);
          }
        }
      }
    }

    return results;
  });

  for (const line of validCalc) {
    console.log(`  ${line}`);
  }

  // 3. Check roleForm filestatus state vs actual document status
  console.log('\n══ roleForm filestatus state ══');
  const fileStatusState = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return ['No roleForm'];
    const data = roleForm.submission?.data || {};
    const fkeys = Object.keys(data).filter(k => k.startsWith('filestatus'));
    const trueCount = fkeys.filter(k => data[k] === true).length;
    return [`${trueCount}/${fkeys.length} filestatus keys are true`];
  });
  for (const line of fileStatusState) {
    console.log(`  ${line}`);
  }

  console.log('\n══ DONE ══');
});
