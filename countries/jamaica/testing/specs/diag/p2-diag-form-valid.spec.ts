import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Set FORMDATAVALIDATIONSTATUS and trigger form validation
 * to enable the Approve button.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Set FORMDATAVALIDATIONSTATUS and validate', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture network requests
  const requests: { method: string; url: string; body?: string; status?: number }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/backend/') && !url.includes('.js') && !url.includes('.css')) {
      requests.push({ method: req.method(), url: url.substring(0, 150), body: req.postData()?.substring(0, 300) });
    }
  });
  page.on('response', resp => {
    const url = resp.url();
    const req = requests.find(r => r.url === url.substring(0, 150) && !r.status);
    if (req) req.status = resp.status();
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Check current FORMDATAVALIDATIONSTATUS value
  console.log('\n══ Current FORMDATAVALIDATIONSTATUS ══');
  const currentStatus = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return 'No roleForm';
    const data = roleForm.submission?.data || {};
    return {
      FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
      isFormValid: data.isFormValid,
      'Form is valid': data['Form is valid'],
    };
  });
  console.log(`  ${JSON.stringify(currentStatus)}`);

  // Check form validation errors
  console.log('\n══ Form validation check ══');
  const validationInfo = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return ['No Formio'];

    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      const data = form?.submission?.data;
      if (!data || data.isFormValid === undefined) continue; // Only the system form

      results.push(`Form ${k}:`);

      // Check all required fields
      if (form.root) {
        const checkRequired = (comp: any, path = ''): string[] => {
          const errors: string[] = [];
          if (!comp) return errors;

          const key = comp.key || '';
          const fullPath = path ? `${path}.${key}` : key;

          if (comp.validate?.required && key) {
            const value = data[key];
            const isEmpty = value === undefined || value === null || value === '' ||
              (Array.isArray(value) && value.length === 0);
            if (isEmpty) {
              errors.push(`  REQUIRED but empty: ${key} (type=${comp.type})`);
            }
          }

          if (comp.components) {
            for (const c of comp.components) {
              errors.push(...checkRequired(c, fullPath));
            }
          }
          if (comp.columns) {
            for (const col of comp.columns) {
              if (col.components) {
                for (const c of col.components) {
                  errors.push(...checkRequired(c, fullPath));
                }
              }
            }
          }
          return errors;
        };

        const errors = checkRequired(form.root);
        if (errors.length > 0) {
          results.push(`  ${errors.length} required fields empty:`);
          for (const e of errors) results.push(e);
        } else {
          results.push(`  All required fields filled!`);
        }
      }

      // Try calling checkValidity
      if (form.root?.checkValidity) {
        try {
          const valid = form.root.checkValidity(data, true);
          results.push(`  checkValidity(): ${valid}`);
        } catch (e: any) {
          results.push(`  checkValidity() error: ${e.message?.substring(0, 60)}`);
        }
      }

      break; // Only process the system form
    }

    return results;
  });
  for (const line of validationInfo) {
    console.log(`  ${line}`);
  }

  // Set FORMDATAVALIDATIONSTATUS to "true" (Yes)
  console.log('\n══ Setting FORMDATAVALIDATIONSTATUS = "true" ══');
  const setResult = await page.evaluate(() => {
    const results: string[] = [];

    const roleForm = (window as any).roleForm;
    if (!roleForm) return ['No roleForm'];

    // Set the value
    roleForm.submission.data.FORMDATAVALIDATIONSTATUS = 'true';
    results.push(`Set FORMDATAVALIDATIONSTATUS = "true"`);

    // Also try to find and set the component value
    const formio = (window as any).Formio;
    if (formio?.forms) {
      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k];
        const data = form?.submission?.data;
        if (!data || data.isFormValid === undefined) continue;

        data.FORMDATAVALIDATIONSTATUS = 'true';

        // Try to trigger the form change event
        if (form.root) {
          // Find the FORMDATAVALIDATIONSTATUS component and set its value
          const findComp = (comp: any): any => {
            if (!comp) return null;
            if (comp.key === 'FORMDATAVALIDATIONSTATUS') return comp;
            if (comp.components) {
              for (const c of comp.components) {
                const found = findComp(c);
                if (found) return found;
              }
            }
            if (comp.columns) {
              for (const col of comp.columns) {
                if (col.components) {
                  for (const c of col.components) {
                    const found = findComp(c);
                    if (found) return found;
                  }
                }
              }
            }
            return null;
          };

          const statusComp = findComp(form.root);
          if (statusComp) {
            results.push(`Found FORMDATAVALIDATIONSTATUS component`);
            if (statusComp.setValue) {
              statusComp.setValue('true');
              results.push(`Called setValue("true")`);
            }
            if (statusComp.triggerChange) {
              statusComp.triggerChange();
              results.push(`Called triggerChange()`);
            }
          }

          // Trigger form change
          if (form.root.triggerChange) {
            form.root.triggerChange();
            results.push(`Triggered root change`);
          }
          if (form.root.checkConditions) {
            form.root.checkConditions(data);
            results.push(`Checked conditions`);
          }

          // Check isFormValid after
          results.push(`\nAfter: isFormValid=${data.isFormValid}, Form is valid=${data['Form is valid']}`);
        }
      }
    }

    return results;
  });
  for (const line of setResult) {
    console.log(`  ${line}`);
  }

  await page.waitForTimeout(3000);

  // Check Approve button state
  console.log('\n══ Check Approve button after setting FORMDATAVALIDATIONSTATUS ══');
  const approveBtn = page.locator('button:has-text("Approve documents check")');

  // Go to Processing tab
  await page.locator('a:has-text("Processing")').first().click();
  await page.waitForTimeout(3000);

  const isVisible = await approveBtn.isVisible({ timeout: 5000 }).catch(() => false);
  const isDisabled = isVisible ? await approveBtn.isDisabled() : null;
  console.log(`  Visible: ${isVisible}, Disabled: ${isDisabled}`);

  // Check form state after tab switch
  const afterTabFormState = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return {};
    const data = roleForm.submission?.data || {};
    return {
      FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
      isFormValid: data.isFormValid,
      'Form is valid': data['Form is valid'],
    };
  });
  console.log(`  Form state: ${JSON.stringify(afterTabFormState)}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/83-after-validation-set.png`, fullPage: true });

  // Try saving first, then check again
  console.log('\n══ Save and check again ══');
  requests.length = 0;

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('saveDraft'));
  });
  await page.waitForTimeout(5000);

  console.log(`  Save requests: ${requests.filter(r => r.method === 'PUT').length}`);
  for (const r of requests.filter(r => r.method === 'PUT')) {
    console.log(`    ${r.method} ${r.status} ${r.url}`);
  }

  // Reload and check
  console.log('\n══ Reload and check ══');
  await page.reload();
  await page.waitForTimeout(8000);

  const afterReload = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return { error: 'No roleForm' };
    const data = roleForm.submission?.data || {};
    return {
      FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
      isFormValid: data.isFormValid,
      'Form is valid': data['Form is valid'],
    };
  });
  console.log(`  After reload: ${JSON.stringify(afterReload)}`);

  // Go to Processing tab and check button
  await page.locator('a:has-text("Processing")').first().click();
  await page.waitForTimeout(3000);

  const isDisabledAfterReload = await approveBtn.isDisabled().catch(() => null);
  console.log(`  Approve button disabled: ${isDisabledAfterReload}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/84-after-reload-check.png`, fullPage: true });

  // If still disabled, try to check what validates the form
  if (isDisabledAfterReload) {
    console.log('\n══ Still disabled — checking form validation errors ══');
    const errors = await page.evaluate(() => {
      const formio = (window as any).Formio;
      if (!formio?.forms) return ['No Formio'];
      const results: string[] = [];

      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k];
        const data = form?.submission?.data;
        if (!data || data.isFormValid === undefined) continue;

        // Check all required components
        const checkComp = (comp: any): string[] => {
          const errors: string[] = [];
          if (!comp) return errors;
          const key = comp.key || '';
          if (comp.validate?.required && key) {
            const val = data[key];
            if (val === undefined || val === null || val === '') {
              errors.push(`${key} (${comp.type}): EMPTY`);
            }
          }
          if (comp.components) for (const c of comp.components) errors.push(...checkComp(c));
          if (comp.columns) for (const col of comp.columns) {
            if (col?.components) for (const c of col.components) errors.push(...checkComp(c));
          }
          return errors;
        };

        if (form.form?.components) {
          for (const c of form.form.components) {
            results.push(...checkComp(c));
          }
        }
      }

      return results;
    });

    console.log(`  Empty required fields: ${errors.length}`);
    for (const e of errors) {
      console.log(`    ${e}`);
    }
  }

  console.log('\n══ DONE ══');
});
