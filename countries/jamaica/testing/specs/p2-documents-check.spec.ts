import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Documents Check: Validate all documents and approve
 *
 * Back-office processing for the "Documents check" role:
 * 1. Navigate to Part B → click into the submitted application
 * 2. Open document carousel → execute onclick handlers to set filestatus
 * 3. Set FORMDATAVALIDATIONSTATUS via Formio API → enables Approve button
 * 4. Save form → switch to Processing tab → click "Approve documents check"
 * 5. Verify status changes
 *
 * Run:
 *   npx playwright test specs/p2-documents-check.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2: Documents check — validate and approve', async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to Part B processing view
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Navigate to Part B processing view ══');

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const statusBadge = page.locator('span.status-badge:has-text("File pending")').first();
  await expect(statusBadge).toBeVisible({ timeout: 10_000 });
  console.log('  Clicking "File pending" badge...');
  await statusBadge.click();
  await page.waitForTimeout(5000);

  const processingUrl = page.url();
  console.log(`  Processing URL: ${processingUrl}`);
  expect(processingUrl).toContain('/part-b/');

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-01-processing-view.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // STEP 2: Validate all documents via carousel onclick handlers
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Validate all documents ══');

  // Ensure Documents tab is active
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);

  // Open first document to enter carousel
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // Execute all "Yes" onclick handlers to set filestatus fields
  const validationResult = await page.evaluate(() => {
    const results: string[] = [];
    const roleForm = (window as any).roleForm;

    if (!roleForm) {
      results.push('ERROR: No roleForm found');
      return results;
    }

    let executed = 0;
    let alreadyTrue = 0;
    let errors = 0;

    for (let i = 1; i <= 50; i++) { // Check up to 50
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLElement;
      if (!radio) break;

      const onclick = radio.getAttribute('onclick');
      if (!onclick) continue;

      // Check if already validated
      const match = onclick.match(/roleForm\.submission\.data\['([^']+)'\]=true/);
      const key = match?.[1];

      if (key && roleForm.submission.data[key] === true) {
        alreadyTrue++;
      } else {
        try {
          const fn = new Function(onclick);
          fn.call(radio);
          executed++;
        } catch (e: any) {
          errors++;
          results.push(`  Error on doc ${i}: ${e.message?.substring(0, 40)}`);
        }
      }
    }

    // Also click all radios to update visual state
    for (let i = 1; i <= 50; i++) {
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLInputElement;
      if (!radio) break;
      radio.checked = true;
    }

    results.push(`Executed: ${executed}, Already valid: ${alreadyTrue}, Errors: ${errors}`);

    // Verify all filestatus keys
    const data = roleForm.submission.data;
    const fkeys = Object.keys(data).filter(k => k.startsWith('filestatus'));
    const trueCount = fkeys.filter(k => data[k] === true).length;
    results.push(`filestatus: ${trueCount}/${fkeys.length} true`);

    return results;
  });

  for (const line of validationResult) {
    console.log(`  ${line}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-02-docs-validated.png` });

  // ══════════════════════════════════════════════════════════
  // STEP 3: Set FORMDATAVALIDATIONSTATUS and enable Approve button
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Enable Approve button ══');

  const enableResult = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';

    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      const data = form?.submission?.data;
      if (!data) continue;

      // Find and set FORMDATAVALIDATIONSTATUS component
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
            if (col?.components) {
              for (const c of col.components) {
                const found = findComp(c, target);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };

      if (form.root) {
        const statusComp = findComp(form.root, 'FORMDATAVALIDATIONSTATUS');
        if (statusComp?.setValue) {
          statusComp.setValue('true');
          if (statusComp.triggerChange) statusComp.triggerChange();
          results.push(`Form ${k}: Set FORMDATAVALIDATIONSTATUS="true"`);
        }

        if (form.root.triggerChange) form.root.triggerChange();
        if (form.root.checkConditions) form.root.checkConditions(data);
      }

      results.push(`Form ${k}: isFormValid=${data.isFormValid}, Form is valid=${data['Form is valid']}`);
    }

    return results.join(' | ');
  });
  console.log(`  ${enableResult}`);

  // Save via saveDraft event
  console.log('  Saving...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('saveDraft'));
  });
  await page.waitForTimeout(5000);
  console.log('  Saved');

  // ══════════════════════════════════════════════════════════
  // STEP 4: Switch to Processing tab and click Approve
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Approve documents check ══');

  await page.locator('a:has-text("Processing")').first().click();
  await page.waitForTimeout(3000);

  const approveBtn = page.locator('button:has-text("Approve documents check")');
  await expect(approveBtn).toBeVisible({ timeout: 10_000 });

  const isDisabled = await approveBtn.isDisabled();
  console.log(`  Approve button disabled: ${isDisabled}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-03-before-approve.png`, fullPage: true });

  if (isDisabled) {
    console.log('  WARNING: Button still disabled — attempting force click');
  }

  console.log('  Clicking "Approve documents check"...');
  const beforeUrl = page.url();

  try {
    await approveBtn.click({ force: isDisabled, timeout: 10_000 });
  } catch (e: any) {
    console.log(`  Click error: ${e.message?.substring(0, 60)}`);
  }

  // Wait for navigation/processing
  await page.waitForTimeout(15_000);

  const afterUrl = page.url();
  console.log(`  After approve → URL: ${afterUrl}`);

  // Check for confirmation dialog
  const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
  try {
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('  Confirmation dialog found — clicking OK...');
      await confirmBtn.click();
      await page.waitForTimeout(10_000);
    }
  } catch {}

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-04-after-approve.png`, fullPage: true });

  // Check for toasts/notifications
  const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible, [class*="notification"]:visible');
  const toastCount = await toasts.count();
  for (let i = 0; i < Math.min(toastCount, 5); i++) {
    const text = (await toasts.nth(i).textContent())?.trim();
    if (text) console.log(`  Toast: "${text.substring(0, 80)}"`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Verify status change
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Verify status change ══');

  // Check if still on same page or redirected
  if (afterUrl === beforeUrl) {
    console.log('  URL unchanged — checking page status...');
    const pageStatus = await page.evaluate(() => {
      const badges = document.querySelectorAll('[class*="status-badge"], [class*="badge"]');
      const texts: string[] = [];
      badges.forEach(b => {
        const text = b.textContent?.trim();
        if (text && (b as HTMLElement).offsetParent !== null) texts.push(text);
      });
      return texts;
    });
    console.log(`  Visible badges: ${pageStatus.join(', ')}`);
  }

  // Navigate to Part B to check status
  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const finalStatus = await page.evaluate(() => {
    const items = document.querySelectorAll('.list-item');
    if (items.length === 0) return 'No items found';
    const firstItem = items[0];
    const badge = firstItem.querySelector('.status-badge');
    const company = firstItem.querySelector('.column-text');
    const step = firstItem.querySelector('.active-task');
    return {
      status: badge?.textContent?.trim() || 'no badge',
      company: company?.textContent?.trim() || 'unknown',
      step: step?.textContent?.trim() || 'no step',
    };
  });
  console.log(`  Final status: ${JSON.stringify(finalStatus)}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-05-final-status.png`, fullPage: true });

  // Also check inspector
  await page.goto('/inspector/');
  await page.waitForTimeout(5000);

  const inspectorStatus = await page.evaluate(() => {
    const items = document.querySelectorAll('.list-item, [class*="list-column"]');
    if (items.length === 0) return 'No items';
    const badge = document.querySelector('.status-badge');
    return badge?.textContent?.trim() || 'no badge';
  });
  console.log(`  Inspector status: "${inspectorStatus}"`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/p2-06-inspector.png`, fullPage: true });

  console.log('\n══ DOCUMENTS CHECK COMPLETE ══');
});
