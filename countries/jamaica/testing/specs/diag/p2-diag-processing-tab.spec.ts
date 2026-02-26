import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Processing Tab Discovery
 *
 * Navigate to Part B processing view, click the "Processing" tab,
 * and map all action buttons, form fields, and status transition UI.
 *
 * Run:
 *   npx playwright test specs/p2-diag-processing-tab.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

// Known URLs from diagnostic
const PART_B_PROCESSING_URL = '/part-b/d51d6c78-5ead-c948-0b82-0d9bc71cd712/my/84e53b18-12b2-11f1-899e-b6594fb67add?file_id=8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('P2-DIAG: Processing tab actions', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Navigate to processing view via Part B status badge
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 1: Navigate to processing view     ║');
  console.log('╚══════════════════════════════════════════╝');

  // Go to Part B and click status badge
  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const statusBadge = page.locator('span.status-badge:has-text("File pending")').first();
  await statusBadge.click();
  await page.waitForTimeout(5000);

  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/30-processing-default.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // STEP 2: Click "Processing" tab
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 2: Click Processing tab            ║');
  console.log('╚══════════════════════════════════════════╝');

  const processingTab = page.locator('a:has-text("Processing"), [role="tab"]:has-text("Processing")').first();
  if (await processingTab.isVisible({ timeout: 5000 })) {
    console.log('  Clicking "Processing" tab...');
    await processingTab.click();
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/31-processing-tab.png`, fullPage: true });

    // Map ALL visible elements after switching to Processing tab
    console.log('\n  === PROCESSING TAB UI ===');

    // Buttons
    const buttons = page.locator('button:visible');
    const btnCount = await buttons.count();
    console.log(`\n  Visible buttons: ${btnCount}`);
    for (let i = 0; i < Math.min(btnCount, 30); i++) {
      const text = (await buttons.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const cls = (await buttons.nth(i).getAttribute('class')) || '';
      const type = (await buttons.nth(i).getAttribute('type')) || '';
      if (text) console.log(`  [btn${i}] "${text}" class="${cls.substring(0, 70)}" type="${type}"`);
    }

    // Inputs
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const inputCount = await inputs.count();
    console.log(`\n  Visible inputs: ${inputCount}`);
    for (let i = 0; i < Math.min(inputCount, 30); i++) {
      const tag = await inputs.nth(i).evaluate((e: Element) => e.tagName);
      const type = (await inputs.nth(i).getAttribute('type')) || '';
      const name = (await inputs.nth(i).getAttribute('name')) || '';
      const placeholder = (await inputs.nth(i).getAttribute('placeholder')) || '';
      const id = (await inputs.nth(i).getAttribute('id')) || '';
      const value = await inputs.nth(i).inputValue().catch(() => '');
      console.log(`  [input${i}] <${tag}> type="${type}" name="${name}" id="${id}" placeholder="${placeholder}" value="${value.substring(0, 40)}"`);
    }

    // Labels
    const labels = page.locator('label:visible');
    const labelCount = await labels.count();
    console.log(`\n  Visible labels: ${labelCount}`);
    for (let i = 0; i < Math.min(labelCount, 20); i++) {
      const text = (await labels.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
      const forAttr = (await labels.nth(i).getAttribute('for')) || '';
      if (text) console.log(`  [label${i}] "${text}" for="${forAttr}"`);
    }

    // Formio components visible in Processing tab
    const formioComponents = page.locator('.formio-component:visible');
    const fcCount = await formioComponents.count();
    console.log(`\n  Visible formio components: ${fcCount}`);
    for (let i = 0; i < Math.min(fcCount, 30); i++) {
      const cls = (await formioComponents.nth(i).getAttribute('class')) || '';
      // Extract component key from class
      const keyMatch = cls.match(/formio-component-(\S+)/);
      const key = keyMatch ? keyMatch[1] : '';
      const text = (await formioComponents.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 100) || '';
      if (key) console.log(`  [fc${i}] key="${key}" text="${text.substring(0, 80)}"`);
    }

    // Dropdowns / Choices.js
    const choices = page.locator('.choices:visible');
    const choicesCount = await choices.count();
    if (choicesCount > 0) {
      console.log(`\n  Choices.js dropdowns: ${choicesCount}`);
      for (let i = 0; i < Math.min(choicesCount, 10); i++) {
        const text = (await choices.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
        console.log(`  [choices${i}] "${text}"`);
      }
    }

    // Radio buttons
    const radios = page.locator('input[type="radio"]:visible');
    const radioCount = await radios.count();
    if (radioCount > 0) {
      console.log(`\n  Radio buttons: ${radioCount}`);
      for (let i = 0; i < Math.min(radioCount, 20); i++) {
        const name = (await radios.nth(i).getAttribute('name')) || '';
        const value = (await radios.nth(i).getAttribute('value')) || '';
        const label = await radios.nth(i).evaluate((e: Element) => {
          const lbl = e.closest('label') || e.parentElement?.querySelector('label');
          return lbl?.textContent?.trim().substring(0, 40) || '';
        });
        console.log(`  [radio${i}] name="${name}" value="${value}" label="${label}"`);
      }
    }

    // Checkboxes
    const checkboxes = page.locator('input[type="checkbox"]:visible');
    const cbCount = await checkboxes.count();
    if (cbCount > 0) {
      console.log(`\n  Checkboxes: ${cbCount}`);
      for (let i = 0; i < Math.min(cbCount, 10); i++) {
        const name = (await checkboxes.nth(i).getAttribute('name')) || '';
        const label = await checkboxes.nth(i).evaluate((e: Element) => {
          const lbl = e.closest('label') || e.parentElement?.querySelector('label');
          return lbl?.textContent?.trim().substring(0, 60) || '';
        });
        console.log(`  [cb${i}] name="${name}" label="${label}"`);
      }
    }

    // Links
    const links = page.locator('a:visible');
    const linkCount = await links.count();
    console.log(`\n  Visible links: ${linkCount}`);
    for (let i = 0; i < Math.min(linkCount, 20); i++) {
      const text = (await links.nth(i).textContent())?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
      const href = (await links.nth(i).getAttribute('href')) || '';
      if (text || href) console.log(`  [a${i}] "${text}" → ${href}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Check "Advanced actions" link
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 3: Advanced actions link           ║');
  console.log('╚══════════════════════════════════════════╝');

  const advancedLink = page.locator('a:has-text("Advanced actions")');
  try {
    if (await advancedLink.isVisible({ timeout: 5000 })) {
      console.log('  Clicking "Advanced actions"...');
      await advancedLink.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/32-advanced-actions.png`, fullPage: true });

      // Check for dropdown/popover that appeared
      const dropdownItems = await page.evaluate(() => {
        const results: string[] = [];

        // Check visible dropdown menus
        document.querySelectorAll('.dropdown-menu, .popover, [role="menu"]').forEach((dd, i) => {
          const visible = (dd as HTMLElement).offsetParent !== null;
          const display = getComputedStyle(dd).display;
          if (visible || display !== 'none') {
            results.push(`Menu[${i}]: class="${dd.className?.toString().substring(0, 60)}" visible=${visible} display=${display}`);
            dd.querySelectorAll('a, button, [role="menuitem"]').forEach((item, j) => {
              results.push(`  [${j}] <${item.tagName}> "${item.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60)}" href="${(item as HTMLAnchorElement).href || ''}"`);
            });
          }
        });

        // CDK overlay
        const cdk = document.querySelector('.cdk-overlay-container');
        if (cdk) {
          for (let i = 0; i < cdk.children.length; i++) {
            const child = cdk.children[i] as HTMLElement;
            if (child.innerHTML.length > 10 && child.offsetParent !== null) {
              results.push(`CDK[${i}]: html="${child.innerHTML.substring(0, 300)}"`);
            }
          }
        }

        return results;
      });

      for (const r of dropdownItems) {
        console.log(`  ${r}`);
      }
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 4: Deep scan for ALL action buttons (visible and hidden)
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 4: Deep button scan                ║');
  console.log('╚══════════════════════════════════════════╝');

  const allButtons = await page.evaluate(() => {
    const results: string[] = [];

    document.querySelectorAll('button, input[type="submit"], [role="button"]').forEach((btn, i) => {
      const text = btn.textContent?.trim().replace(/\s+/g, ' ') || '';
      const cls = btn.className?.toString() || '';
      const visible = (btn as HTMLElement).offsetParent !== null;
      const display = getComputedStyle(btn).display;
      const type = btn.getAttribute('type') || '';

      // Get parent formio component if any
      const formioParent = btn.closest('[class*="formio-component"]');
      const formioKey = formioParent?.className?.toString().match(/formio-component-(\S+)/)?.[1] || '';

      results.push(`[${visible ? 'V' : 'H'}] "${text.substring(0, 60)}" class="${cls.substring(0, 60)}" type="${type}" display="${display}" formio="${formioKey}"`);
    });

    return results;
  });

  console.log(`  All buttons (${allButtons.length}):`);
  for (const btn of allButtons) {
    console.log(`  ${btn}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 5: Specifically look at the Processing tab pane content
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 5: Processing tab pane content     ║');
  console.log('╚══════════════════════════════════════════╝');

  const tabPaneContent = await page.evaluate(() => {
    const results: string[] = [];

    // Find the processing tab pane
    const panes = document.querySelectorAll('.tab-pane, [role="tabpanel"]');
    panes.forEach((pane, i) => {
      const id = pane.id || '';
      const cls = pane.className?.toString().substring(0, 80) || '';
      const isActive = cls.includes('active') || cls.includes('show');
      const html = pane.innerHTML.substring(0, 500);
      results.push(`Tab pane[${i}]: id="${id}" class="${cls}" active=${isActive}`);
      if (id.includes('tab1') || id.includes('review') || id.includes('process')) {
        results.push(`  HTML preview: ${html}`);
      }
    });

    // Also check for the formio processing form specifically
    const processingForm = document.querySelector('#tab1review, [id*="tab1"], [class*="processing"]');
    if (processingForm) {
      results.push(`\nProcessing form element: <${processingForm.tagName}> id="${processingForm.id}" class="${processingForm.className?.toString().substring(0, 80)}"`);

      // Dump all inputs, buttons, selects inside it
      processingForm.querySelectorAll('input, button, select, textarea, .formio-component').forEach((el, i) => {
        const tag = el.tagName;
        const type = el.getAttribute('type') || '';
        const name = el.getAttribute('name') || '';
        const cls = el.className?.toString().substring(0, 60) || '';
        const text = el.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60) || '';
        const visible = (el as HTMLElement).offsetParent !== null;
        results.push(`  [${visible ? 'V' : 'H'}] <${tag}> type="${type}" name="${name}" class="${cls}" text="${text}"`);
      });
    }

    return results;
  });

  for (const line of tabPaneContent) {
    console.log(`  ${line}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 6: Try to make the "Approve documents check" button visible
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  STEP 6: Make Approve button visible     ║');
  console.log('╚══════════════════════════════════════════╝');

  // The button is hidden - try unhiding it or scrolling to it
  const approveBtn = page.locator('button:has-text("Approve documents check")');
  const approveCount = await approveBtn.count();
  console.log(`  "Approve documents check" buttons: ${approveCount}`);

  if (approveCount > 0) {
    const isVisible = await approveBtn.first().isVisible();
    console.log(`  Is visible: ${isVisible}`);

    if (!isVisible) {
      // Try to make it visible by activating its parent tab-pane
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          b => b.textContent?.includes('Approve documents check')
        );
        if (btn) {
          // Walk up and activate all ancestors
          let el: HTMLElement | null = btn as HTMLElement;
          while (el && el !== document.body) {
            if (getComputedStyle(el).display === 'none') {
              el.style.display = 'block';
            }
            if (el.classList?.contains('tab-pane')) {
              el.classList.add('active', 'show');
            }
            el = el.parentElement;
          }
          // Also scroll to button
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      });
      await page.waitForTimeout(2000);

      const nowVisible = await approveBtn.first().isVisible();
      console.log(`  After unhiding → visible: ${nowVisible}`);

      if (nowVisible) {
        const btnText = (await approveBtn.first().textContent())?.trim();
        const btnClass = await approveBtn.first().getAttribute('class');
        console.log(`  Button: "${btnText}" class="${btnClass}"`);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/33-approve-button-visible.png`, fullPage: true });
      }
    }

    // Get full context of the approve button
    const btnContext = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent?.includes('Approve documents check')
      );
      if (!btn) return null;

      // Get sibling buttons (other actions)
      const parent = btn.parentElement;
      const siblings = parent ? Array.from(parent.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim().replace(/\s+/g, ' ').substring(0, 60),
        class: b.className.substring(0, 60),
        visible: b.offsetParent !== null,
      })) : [];

      // Get the form it belongs to
      const form = btn.closest('form, .formio-form, [class*="formio"]');
      const formCls = form?.className?.toString().substring(0, 80) || '';

      return {
        btnText: btn.textContent?.trim(),
        btnClass: btn.className,
        siblings,
        formClass: formCls,
        parentHTML: parent?.outerHTML.substring(0, 500),
      };
    });

    if (btnContext) {
      console.log(`\n  Button context:`);
      console.log(`    Text: "${btnContext.btnText}"`);
      console.log(`    Class: "${btnContext.btnClass}"`);
      console.log(`    Form: "${btnContext.formClass}"`);
      console.log(`    Sibling buttons: ${btnContext.siblings.length}`);
      for (const sib of btnContext.siblings) {
        console.log(`      [${sib.visible ? 'V' : 'H'}] "${sib.text}" class="${sib.class}"`);
      }
      console.log(`    Parent HTML: ${btnContext.parentHTML}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  SUMMARY                                 ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Final URL: ${page.url()}`);
  console.log('  Screenshots saved to: screenshots/p2/');
});
