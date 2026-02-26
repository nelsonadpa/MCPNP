import { test, expect } from '@playwright/test';

/**
 * Phase 1 — Front-Office Testing
 * T-001: Form structure exploration
 *
 * Opens "Establish a new zone" and captures every section/panel.
 * Does NOT submit — exploration only.
 */

const SCREENSHOTS = '../02-front-office-tests/screenshots';

test.describe('P1 — Form Exploration: Establish a new zone', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  });

  test('P1-S5: Open service form — initial state', async ({ page }) => {
    // Click "Establish a new zone"
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(3000);

    // Screenshot the initial form state
    await page.screenshot({
      path: `${SCREENSHOTS}/P1-S5-form-initial-state.png`,
      fullPage: true,
    });

    // Log the current URL
    console.log(`Form URL: ${page.url()}`);

    // Check for any visible tabs, sections, or navigation
    const pageContent = await page.content();

    // Look for tab navigation
    const tabs = page.locator('[role="tab"], .nav-tabs a, .tab-link, [class*="tab"]');
    const tabCount = await tabs.count();
    console.log(`Tabs found: ${tabCount}`);

    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 20); i++) {
        const tabText = await tabs.nth(i).textContent();
        console.log(`  Tab ${i}: ${tabText?.trim()}`);
      }
    }

    // Look for panel/section headers
    const panels = page.locator('[class*="panel-heading"], [class*="card-header"], h3, h4');
    const panelCount = await panels.count();
    console.log(`Section headers found: ${panelCount}`);
  });

  test('P1-S6: Explore form — capture all visible sections', async ({ page }) => {
    // Open the service
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(3000);

    // Take a full-page screenshot to see everything
    await page.screenshot({
      path: `${SCREENSHOTS}/P1-S6-form-full-page.png`,
      fullPage: true,
    });

    // Try to find and document all form fields visible on first load
    const inputs = page.locator('input:visible, select:visible, textarea:visible');
    const inputCount = await inputs.count();
    console.log(`Visible form inputs: ${inputCount}`);

    // Document field types
    const textFields = page.locator('input[type="text"]:visible');
    const selectFields = page.locator('select:visible');
    const radioFields = page.locator('input[type="radio"]:visible');
    const fileFields = page.locator('input[type="file"]:visible');
    const checkboxFields = page.locator('input[type="checkbox"]:visible');

    console.log(`  Text fields: ${await textFields.count()}`);
    console.log(`  Selects: ${await selectFields.count()}`);
    console.log(`  Radio buttons: ${await radioFields.count()}`);
    console.log(`  File uploads: ${await fileFields.count()}`);
    console.log(`  Checkboxes: ${await checkboxFields.count()}`);

    // Look for navigation buttons (Next, Previous, etc.)
    const navButtons = page.locator('button:visible, [type="submit"]:visible');
    const navCount = await navButtons.count();
    console.log(`Buttons found: ${navCount}`);
    for (let i = 0; i < Math.min(navCount, 15); i++) {
      const btnText = await navButtons.nth(i).textContent();
      if (btnText?.trim()) {
        console.log(`  Button ${i}: ${btnText.trim()}`);
      }
    }
  });

  test('P1-S7: Navigate through form tabs/sections', async ({ page }) => {
    // Open the service
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(3000);

    // Try clicking through tabs if they exist
    const tabs = page.locator('[role="tab"], .nav-tabs a, .tab-link, [class*="Tab"]:not([class*="table"])');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabText = await tab.textContent();
        const label = tabText?.trim() || `tab-${i}`;

        try {
          await tab.click();
          await page.waitForTimeout(1500);

          // Screenshot each tab
          const safeName = label.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40);
          await page.screenshot({
            path: `${SCREENSHOTS}/P1-S7-tab-${i}-${safeName}.png`,
            fullPage: true,
          });
          console.log(`Tab ${i} captured: ${label}`);
        } catch (e) {
          console.log(`Tab ${i} click failed: ${label}`);
        }
      }
    } else {
      console.log('No tabs found — form may be single-page or use different navigation');

      // Look for "Next" button to navigate sections
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("next"), [class*="next"]');
      let sectionIndex = 0;

      while (await nextBtn.first().isVisible() && sectionIndex < 20) {
        await page.screenshot({
          path: `${SCREENSHOTS}/P1-S7-section-${sectionIndex}.png`,
          fullPage: true,
        });
        console.log(`Section ${sectionIndex} captured`);

        await nextBtn.first().click();
        await page.waitForTimeout(2000);
        sectionIndex++;
      }

      if (sectionIndex === 0) {
        // Try "Go to" buttons from BPA recon (applicantGoToBusinessPlan, etc.)
        const goToButtons = page.locator('button:visible');
        const btnCount = await goToButtons.count();
        for (let i = 0; i < btnCount; i++) {
          const text = await goToButtons.nth(i).textContent();
          if (text?.toLowerCase().includes('go to') || text?.toLowerCase().includes('next')) {
            console.log(`Navigation button found: "${text.trim()}"`);
          }
        }
      }
    }
  });

  test('P1-S8: Capture form field inventory from DOM', async ({ page }) => {
    // Open the service
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(3000);

    // Extract all form components with ref attributes (eRegistrations pattern)
    const fieldInventory = await page.evaluate(() => {
      const fields: { ref: string; tag: string; type: string; label: string; visible: boolean }[] = [];

      // Look for elements with ref or name attributes
      document.querySelectorAll('[ref], [name], [data-key]').forEach((el) => {
        const ref = el.getAttribute('ref') || el.getAttribute('name') || el.getAttribute('data-key') || '';
        if (ref && !ref.startsWith('_') && ref.length > 2) {
          const tag = el.tagName.toLowerCase();
          const type = el.getAttribute('type') || tag;
          const labelEl = el.closest('.form-group')?.querySelector('label');
          const label = labelEl?.textContent?.trim() || '';
          const visible = (el as HTMLElement).offsetParent !== null;

          fields.push({ ref, tag, type, label, visible });
        }
      });

      // Deduplicate by ref
      const seen = new Set<string>();
      return fields.filter(f => {
        if (seen.has(f.ref)) return false;
        seen.add(f.ref);
        return true;
      });
    });

    console.log(`\nField inventory from DOM: ${fieldInventory.length} unique fields`);
    console.log('---');
    for (const f of fieldInventory.slice(0, 50)) {
      console.log(`  [${f.visible ? 'V' : 'H'}] ${f.ref} (${f.type}) ${f.label ? '— ' + f.label : ''}`);
    }
    if (fieldInventory.length > 50) {
      console.log(`  ... and ${fieldInventory.length - 50} more fields`);
    }
  });
});
