import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic — Explore evaluation form contents (LSU evaluation + recommendation)
 * and check what's needed to click "Send evaluation to approval"
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Explore evaluation form and process all roles', async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate into the file processing view
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Navigate to processing view ══');

  // Use the known URL pattern: /part-b/{serviceId}/my/{processId}?file_id={fileId}
  await page.goto(`/part-b/${SERVICE_ID}/my/${PROCESS_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/form-01-initial.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // STEP 2: Get all available roles from the Roles dropdown
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Get available roles ══');

  // The Roles dropdown is an ng-select component
  const rolesData = await page.evaluate(() => {
    const results: any = {};

    // Find the ng-select for roles
    const ngSelects = document.querySelectorAll('ng-select, [class*="ng-select"]');
    results.ngSelectCount = ngSelects.length;

    for (let i = 0; i < ngSelects.length; i++) {
      const el = ngSelects[i] as HTMLElement;
      const labelText = el.closest('.form-group, [class*="form"]')?.querySelector('label')?.textContent?.trim();
      const selectedText = el.querySelector('.ng-value-label, .ng-value')?.textContent?.trim();
      results[`ngSelect_${i}`] = {
        label: labelText,
        selected: selectedText,
        class: el.className.substring(0, 60),
      };
    }

    // Look for role-related dropdowns at the top
    const roleSelector = document.querySelector('[class*="role"] select, [class*="role"] ng-select');
    if (roleSelector) {
      results.roleSelector = roleSelector.textContent?.trim().substring(0, 100);
    }

    // Check for clickable role labels at top
    const topBar = document.querySelector('.top-bar, header, [class*="header"], [class*="nav"]');
    if (topBar) {
      const roleText = topBar.textContent || '';
      if (roleText.includes('Roles') || roleText.includes('evaluation')) {
        results.topBarRoles = roleText.substring(0, 200).trim().replace(/\s+/g, ' ');
      }
    }

    return results;
  });
  console.log('  Roles data:', JSON.stringify(rolesData, null, 2));

  // Click on the Roles dropdown to see options
  // It's an ng-select, so click on the container or the dropdown arrow
  const rolesDropdownContainer = page.locator('ng-select').nth(1); // Second ng-select (first is Services)
  const rolesDropdownExists = await rolesDropdownContainer.isVisible().catch(() => false);

  if (rolesDropdownExists) {
    console.log('  Found ng-select for roles, clicking...');
    await rolesDropdownContainer.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/form-02-roles-dropdown.png`, fullPage: true });

    const roleOptions = await page.evaluate(() => {
      const items = document.querySelectorAll('.ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-option');
      return Array.from(items).map(item => ({
        text: item.textContent?.trim(),
        class: (item as HTMLElement).className,
        selected: (item as HTMLElement).classList.contains('ng-option-selected'),
      }));
    });
    console.log('  Role options:', JSON.stringify(roleOptions, null, 2));

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Expand and explore LSU evaluation section
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Explore LSU evaluation section ══');

  // Click on "LSU evaluation" to expand it
  const lsuEval = page.locator('text="LSU evaluation"').first();
  if (await lsuEval.isVisible().catch(() => false)) {
    await lsuEval.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/form-03-lsu-eval-expanded.png`, fullPage: true });

    // Get the form contents inside LSU evaluation
    const evalContent = await page.evaluate(() => {
      const results: any = {};

      // Get all visible form components
      const components = document.querySelectorAll('[class*="formio-component"]');
      results.components = Array.from(components)
        .filter(c => (c as HTMLElement).offsetParent !== null)
        .map(c => {
          const label = c.querySelector('label')?.textContent?.trim();
          const input = c.querySelector('input, textarea, select');
          const classes = c.className;
          const key = classes.match(/formio-component-(\S+)/)?.[1];
          return {
            key: key?.substring(0, 60),
            label: label?.substring(0, 60),
            type: input?.tagName || 'other',
            inputType: (input as HTMLInputElement)?.type,
            required: !!c.querySelector('.field-required'),
            visible: (c as HTMLElement).offsetParent !== null,
          };
        })
        .filter(c => c.label) // Only labeled components
        .slice(0, 30);

      // Get file upload areas (browse links)
      const browseLinks = document.querySelectorAll('a.browse');
      results.browseLinks = Array.from(browseLinks)
        .filter(b => (b as HTMLElement).offsetParent !== null)
        .map((b, i) => ({
          index: i,
          text: b.textContent?.trim(),
          parentLabel: b.closest('[class*="formio-component"]')?.querySelector('label')?.textContent?.trim(),
        }));

      // Get radio buttons
      const radios = document.querySelectorAll('input[type="radio"]');
      results.radios = Array.from(radios)
        .filter(r => (r as HTMLElement).offsetParent !== null)
        .map(r => ({
          name: (r as HTMLInputElement).name,
          value: (r as HTMLInputElement).value,
          label: r.closest('label')?.textContent?.trim() || document.querySelector(`label[for="${r.id}"]`)?.textContent?.trim(),
          checked: (r as HTMLInputElement).checked,
        }))
        .slice(0, 20);

      // Get checkboxes
      const checks = document.querySelectorAll('input[type="checkbox"]');
      results.checkboxes = Array.from(checks)
        .filter(c => (c as HTMLElement).offsetParent !== null)
        .map(c => ({
          name: (c as HTMLInputElement).name,
          label: c.closest('label')?.textContent?.trim(),
          checked: (c as HTMLInputElement).checked,
        }))
        .slice(0, 10);

      return results;
    });
    console.log('  LSU evaluation content:', JSON.stringify(evalContent, null, 2));
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Expand and explore LSU recommendation section
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Explore LSU recommendation section ══');

  const lsuRec = page.locator('text="LSU recommendation"').first();
  if (await lsuRec.isVisible().catch(() => false)) {
    await lsuRec.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/form-04-lsu-rec-expanded.png`, fullPage: true });

    const recContent = await page.evaluate(() => {
      const results: any = {};

      // Get all form components in the recommendation section
      const sections = document.querySelectorAll('[class*="panel"], [class*="card"]');
      for (const section of sections) {
        const heading = section.querySelector('h4, h3, .card-header, .panel-heading');
        if (heading?.textContent?.includes('recommendation')) {
          const components = section.querySelectorAll('[class*="formio-component"]');
          results.recComponents = Array.from(components)
            .filter(c => (c as HTMLElement).offsetParent !== null)
            .map(c => {
              const label = c.querySelector('label')?.textContent?.trim();
              const key = c.className.match(/formio-component-(\S+)/)?.[1];
              const input = c.querySelector('input, textarea, select');
              return {
                key: key?.substring(0, 60),
                label: label?.substring(0, 60),
                type: input?.tagName || 'other',
                inputType: (input as HTMLInputElement)?.type,
              };
            })
            .filter(c => c.label)
            .slice(0, 20);
        }
      }

      // Get any textarea (for comments/recommendations)
      const textareas = document.querySelectorAll('textarea');
      results.textareas = Array.from(textareas)
        .filter(t => (t as HTMLElement).offsetParent !== null)
        .map(t => ({
          name: t.name,
          placeholder: t.placeholder,
          parentLabel: t.closest('[class*="formio-component"]')?.querySelector('label')?.textContent?.trim(),
          value: t.value.substring(0, 50),
        }));

      return results;
    });
    console.log('  LSU recommendation content:', JSON.stringify(recContent, null, 2));
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Check the "Send evaluation to approval" button state
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Check Send evaluation button ══');

  const sendBtn = page.locator('button:has-text("Send evaluation to approval")');
  const sentBackBtn = page.locator('button:has-text("Sent back to applicant")');

  const sendBtnState = {
    visible: await sendBtn.isVisible().catch(() => false),
    disabled: await sendBtn.isDisabled().catch(() => 'N/A'),
  };
  const sentBackState = {
    visible: await sentBackBtn.isVisible().catch(() => false),
    disabled: await sentBackBtn.isDisabled().catch(() => 'N/A'),
  };
  console.log(`  Send evaluation button: visible=${sendBtnState.visible}, disabled=${sendBtnState.disabled}`);
  console.log(`  Sent back button: visible=${sentBackState.visible}, disabled=${sentBackState.disabled}`);

  // ══════════════════════════════════════════════════════════
  // STEP 6: Check Formio form data for required fields
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Check Formio form data ══');

  const formioData = await page.evaluate(() => {
    const results: any = {};
    const formio = (window as any).Formio;
    if (!formio?.forms) return { error: 'No Formio' };

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      const data = form?.submission?.data;
      if (!data) continue;

      const keyCount = Object.keys(data).length;
      results[`form_${k}`] = {
        keyCount,
        isFormValid: data.isFormValid,
        FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
        // Find evaluation-related keys
        evalKeys: Object.keys(data).filter(key =>
          key.toLowerCase().includes('eval') ||
          key.toLowerCase().includes('recommend') ||
          key.toLowerCase().includes('lsu') ||
          key.toLowerCase().includes('report') ||
          key.toLowerCase().includes('comment') ||
          key.toLowerCase().includes('condition') ||
          key.toLowerCase().includes('risk') ||
          key.toLowerCase().includes('approve') ||
          key.toLowerCase().includes('review')
        ).map(key => ({ key, value: typeof data[key] === 'object' ? JSON.stringify(data[key]).substring(0, 50) : String(data[key]).substring(0, 50) })),
      };

      // Find required components that are empty
      if (form.root) {
        const required: any[] = [];
        const walk = (comp: any) => {
          if (!comp) return;
          if (comp.component?.validate?.required && comp.visible !== false) {
            const key = comp.component.key;
            const val = data[key];
            const isEmpty = val === undefined || val === null || val === '' ||
              (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              required.push({
                key,
                label: comp.component.label?.substring(0, 50),
                type: comp.component.type,
              });
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
        results[`form_${k}`].requiredEmpty = required.slice(0, 20);
      }
    }

    return results;
  });
  console.log('  Formio data:', JSON.stringify(formioData, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 7: Check roleForm global variable
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 7: Check roleForm ══');

  const roleFormData = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return { error: 'No roleForm' };

    const data = roleForm.submission?.data;
    if (!data) return { error: 'No roleForm data' };

    return {
      keyCount: Object.keys(data).length,
      isFormValid: data.isFormValid,
      FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
      evalKeys: Object.keys(data).filter(key =>
        key.toLowerCase().includes('eval') ||
        key.toLowerCase().includes('recommend') ||
        key.toLowerCase().includes('lsu') ||
        key.toLowerCase().includes('report') ||
        key.toLowerCase().includes('comment') ||
        key.toLowerCase().includes('condition')
      ).map(key => ({
        key,
        value: typeof data[key] === 'object' ? JSON.stringify(data[key]).substring(0, 80) : String(data[key]).substring(0, 80),
      })),
      allKeys: Object.keys(data).slice(0, 50),
    };
  });
  console.log('  roleForm data:', JSON.stringify(roleFormData, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 8: Check the Zone.js event handlers (like Documents Check)
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 8: Check Zone.js events ══');

  const zoneEvents = await page.evaluate(() => {
    const events: string[] = [];
    const eventNames = ['saveDraft', 'validate', 'updateDocuments', 'goToNextPage',
      'reject', 'correction', 'sendToApproval', 'sendBack', 'approve'];
    for (const name of eventNames) {
      const key = `__zone_symbol__${name}false`;
      if ((window as any)[key]) {
        events.push(`${name}: found`);
      }
    }
    // Also check for all zone symbol keys on window
    const allZone = Object.keys(window).filter(k => k.startsWith('__zone_symbol__') && k.endsWith('false'));
    events.push(`All zone events: ${allZone.join(', ')}`);
    return events;
  });
  console.log('  Zone events:', JSON.stringify(zoneEvents, null, 2));

  // ══════════════════════════════════════════════════════════
  // STEP 9: Try clicking "Send evaluation to approval"
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 9: Try Send evaluation to approval ══');

  if (sendBtnState.visible && !sendBtnState.disabled) {
    console.log('  Button is enabled! Clicking...');

    // Track network requests
    const requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/backend/') || req.url().includes('/api/')) {
        requests.push(`${req.method()} ${req.url().substring(0, 100)}`);
      }
    });

    await sendBtn.click();
    await page.waitForTimeout(10_000);

    console.log(`  Network requests after click: ${requests.length}`);
    for (const r of requests) console.log(`    ${r}`);

    const afterUrl = page.url();
    console.log(`  URL after: ${afterUrl}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/form-05-after-send.png`, fullPage: true });

    // Check for confirmation dialog
    const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
    try {
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        console.log('  Confirmation dialog found — clicking...');
        await confirmBtn.click();
        await page.waitForTimeout(10_000);
        console.log(`  URL after confirm: ${page.url()}`);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/form-06-after-confirm.png`, fullPage: true });
      }
    } catch {}

    // Check for toast/notification
    const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible');
    const toastCount = await toasts.count();
    for (let i = 0; i < Math.min(toastCount, 5); i++) {
      const text = (await toasts.nth(i).textContent())?.trim();
      if (text) console.log(`  Toast: "${text.substring(0, 80)}"`);
    }
  } else {
    console.log('  Button is disabled or not visible — need to fill required fields first');

    // Check what validation errors exist
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.formio-errors, .has-error, .is-invalid, [class*="error"]');
      return Array.from(errorElements)
        .filter(e => (e as HTMLElement).offsetParent !== null)
        .map(e => e.textContent?.trim().substring(0, 60))
        .filter(Boolean)
        .slice(0, 10);
    });
    console.log('  Validation errors:', JSON.stringify(errors));
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/form-07-final.png`, fullPage: true });
  console.log('\n══ EVALUATION FORM DIAGNOSTIC COMPLETE ══');
});
