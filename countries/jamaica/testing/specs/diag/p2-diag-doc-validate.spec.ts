import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Document Validation Discovery
 *
 * Navigate to the processing view Documents tab and map out
 * how each document can be validated (VALIDATE/VALID/INVALID buttons).
 *
 * Run:
 *   npx playwright test specs/p2-diag-doc-validate.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Document validation UI', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate to Part B → click status badge
  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  // We should be on the Documents tab by default
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Documents Tab Structure                  ║');
  console.log('╚══════════════════════════════════════════╝');

  // Check which tab is active
  const tabs = page.locator('[role="tab"]:visible, .nav-tabs .nav-link:visible, a[href*="tab"]');
  const tabCount = await tabs.count();
  for (let i = 0; i < tabCount; i++) {
    const text = (await tabs.nth(i).textContent())?.trim();
    const cls = (await tabs.nth(i).getAttribute('class')) || '';
    const isActive = cls.includes('active');
    console.log(`  Tab: "${text}" active=${isActive}`);
  }

  // Click Documents tab explicitly
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/40-documents-tab.png`, fullPage: true });

  // Map the document list and their validation buttons
  const docStructure = await page.evaluate(() => {
    const results: string[] = [];

    // The Documents tab content - look for formio components with validation buttons
    const tab2 = document.querySelector('#tab2review, .part-b-document-tab');
    if (tab2) {
      results.push(`Documents tab found: class="${tab2.className?.toString().substring(0, 80)}"`);

      // Look for all clickable elements in the Documents tab
      const buttons = tab2.querySelectorAll('button');
      results.push(`\nButtons in Documents tab: ${buttons.length}`);
      buttons.forEach((btn, i) => {
        const text = btn.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const cls = btn.className?.substring(0, 60) || '';
        const visible = btn.offsetParent !== null;
        if (text) {
          results.push(`  [${visible ? 'V' : 'H'}] btn[${i}] "${text}" class="${cls}"`);
        }
      });
    }

    // Look for VALIDATE buttons specifically
    const allBtns = document.querySelectorAll('button');
    let validateBtns = 0;
    let validBtns = 0;
    let invalidBtns = 0;
    allBtns.forEach(btn => {
      const text = btn.textContent?.trim().toUpperCase() || '';
      if (text === 'VALIDATE') validateBtns++;
      if (text === 'VALID') validBtns++;
      if (text === 'INVALID') invalidBtns++;
    });
    results.push(`\nVALIDATE buttons: ${validateBtns}`);
    results.push(`VALID buttons: ${validBtns}`);
    results.push(`INVALID buttons: ${invalidBtns}`);

    // Look for document items with validation state
    const docItems = document.querySelectorAll('[class*="document"], [class*="formio-component-btnValidate"], [class*="document-item"], [class*="file-item"]');
    results.push(`\nDocument-related elements: ${docItems.length}`);
    docItems.forEach((el, i) => {
      if (i < 20) {
        const cls = el.className?.toString().substring(0, 80) || '';
        const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100) || '';
        results.push(`  [${i}] class="${cls}" text="${text}"`);
      }
    });

    // Look for the specific validation button pattern
    // In the formio output we saw: "1Upload your concept master planVALIDATEVALIDINVALID"
    // So each document has: number, name, and three buttons (VALIDATE, VALID, INVALID)
    const validateActions = document.querySelectorAll('[class*="btnValidate"], [class*="validate"]');
    results.push(`\nbtnValidate elements: ${validateActions.length}`);
    validateActions.forEach((el, i) => {
      if (i < 30) {
        const cls = el.className?.toString().substring(0, 80) || '';
        const tag = el.tagName;
        const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const visible = (el as HTMLElement).offsetParent !== null;
        results.push(`  [${visible ? 'V' : 'H'}] <${tag}> class="${cls}" text="${text}"`);
      }
    });

    // Check for document validation state in formio data
    const forms = (window as any).Formio?.forms;
    if (forms) {
      const keys = Object.keys(forms);
      for (const k of keys) {
        const data = forms[k]?.submission?.data || {};
        // Look for validation-related keys
        const validationKeys = Object.keys(data).filter(key =>
          key.includes('validat') || key.includes('btnValidate') || key.includes('filevalidated') || key.includes('approved')
        );
        if (validationKeys.length > 0) {
          results.push(`\nForm ${k} validation keys (${validationKeys.length}):`);
          validationKeys.forEach(key => {
            const val = data[key];
            results.push(`  ${key}: ${JSON.stringify(val)?.substring(0, 100)}`);
          });
        }
      }
    }

    return results;
  });

  for (const line of docStructure) {
    console.log(`  ${line}`);
  }

  // ══════════════════════════════════════════════════════════
  // Now look at the visible document items more carefully
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Document Validation Buttons              ║');
  console.log('╚══════════════════════════════════════════╝');

  // Get all visible buttons that look like document validation controls
  const visibleBtns = page.locator('button:visible');
  const vbCount = await visibleBtns.count();
  console.log(`  Total visible buttons: ${vbCount}`);
  for (let i = 0; i < Math.min(vbCount, 40); i++) {
    const text = (await visibleBtns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const cls = (await visibleBtns.nth(i).getAttribute('class')) || '';
    if (text) console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 70)}"`);
  }

  // Look for the document name + VALIDATE/VALID/INVALID pattern
  // Try to find elements with text "VALIDATE"
  const validateBtns = page.locator('button:has-text("VALIDATE"), button:has-text("Validate")');
  const valCount = await validateBtns.count();
  console.log(`\n  VALIDATE buttons: ${valCount}`);

  // Try other text patterns
  const validBtns = page.locator('button:has-text("VALID"):not(:has-text("VALIDATE")):not(:has-text("INVALID"))');
  const vCount = await validBtns.count();
  console.log(`  VALID buttons: ${vCount}`);

  const invalidBtns = page.locator('button:has-text("INVALID")');
  const invCount = await invalidBtns.count();
  console.log(`  INVALID buttons: ${invCount}`);

  // Look for document list items (the green circles in screenshot)
  const listItems = page.locator('.list-item:visible, [class*="document-item"]:visible, [class*="doc-row"]:visible');
  const liCount = await listItems.count();
  console.log(`\n  Document list items: ${liCount}`);

  // Try clicking the first visible document button to see what happens
  const firstDocBtn = page.locator('button.btn-link:visible').first();
  try {
    if (await firstDocBtn.isVisible({ timeout: 3000 })) {
      const text = (await firstDocBtn.textContent())?.trim();
      console.log(`\n  Clicking first document button: "${text}"`);
      await firstDocBtn.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/41-document-clicked.png`, fullPage: true });

      // Check what appeared
      const afterClick = await page.evaluate(() => {
        const results: string[] = [];

        // Check for modals/popups
        document.querySelectorAll('.modal, [role="dialog"], .popover, .tooltip').forEach((m, i) => {
          const display = getComputedStyle(m).display;
          if (display !== 'none') {
            results.push(`Modal[${i}]: display=${display} text="${m.textContent?.trim().replace(/\s+/g, ' ').substring(0, 200)}"`);
          }
        });

        // CDK overlays (Angular)
        const cdk = document.querySelector('.cdk-overlay-container');
        if (cdk) {
          for (let i = 0; i < cdk.children.length; i++) {
            const child = cdk.children[i] as HTMLElement;
            if (child.innerHTML.length > 10 && child.offsetHeight > 0) {
              results.push(`CDK[${i}]: height=${child.offsetHeight} html="${child.innerHTML.substring(0, 400)}"`);
            }
          }
        }

        // Check for newly visible elements
        const newBtns = document.querySelectorAll('.dropdown-menu:not([style*="display: none"]) button, .dropdown-menu:not([style*="display: none"]) a');
        if (newBtns.length > 0) {
          results.push(`Dropdown menu items: ${newBtns.length}`);
          newBtns.forEach((btn, i) => {
            results.push(`  [${i}] "${btn.textContent?.trim().substring(0, 40)}"`);
          });
        }

        return results;
      });

      for (const r of afterClick) {
        console.log(`    ${r}`);
      }

      // Check for visible buttons after click
      const newBtns = page.locator('button:visible');
      const nbCount = await newBtns.count();
      console.log(`    Visible buttons after click: ${nbCount}`);
      for (let i = 0; i < Math.min(nbCount, 20); i++) {
        const text = (await newBtns.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const cls = (await newBtns.nth(i).getAttribute('class')) || '';
        if (text) console.log(`    [btn${i}] "${text}" class="${cls.substring(0, 60)}"`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // Check "Approve" button disabled state
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Approve Button State                     ║');
  console.log('╚══════════════════════════════════════════╝');

  const approveBtn = page.locator('button:has-text("Approve documents check")');
  const isDisabled = await approveBtn.first().isDisabled().catch(() => null);
  console.log(`  Approve button disabled: ${isDisabled}`);

  // Check why it's disabled - look for formio validation state
  const validationState = await page.evaluate(() => {
    const forms = (window as any).Formio?.forms;
    if (!forms) return 'No Formio forms';
    const keys = Object.keys(forms);
    const results: string[] = [];
    for (const k of keys) {
      const form = forms[k];
      const data = form?.submission?.data || {};

      // Look for document validation fields
      const docFields = Object.entries(data).filter(([key]) =>
        key.includes('valid') || key.includes('check') || key.includes('approved') || key.includes('btn')
      );
      if (docFields.length > 0) {
        results.push(`Form ${k} doc-related fields:`);
        docFields.forEach(([key, val]) => {
          results.push(`  ${key}: ${JSON.stringify(val)?.substring(0, 80)}`);
        });
      }
    }
    return results.join('\n');
  });
  console.log(`\n  ${validationState}`);

  // Final screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/42-final-doc-state.png`, fullPage: true });

  console.log('\n  DIAGNOSTIC COMPLETE');
});
