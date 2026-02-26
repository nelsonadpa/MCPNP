import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 1 — Form Structure Capture
 *
 * Navigates "Establish a new zone" form and captures every major section.
 * Uses absolute paths for screenshots to avoid working directory issues.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');
const SERVICE_URL = '/services/d51d6c78-5ead-c948-0b82-0d9bc71cd712';

test.describe.serial('P1 — Form Capture: Establish a new zone', () => {

  test('P1-C1: Dashboard and start new application', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C1-dashboard.png'),
      fullPage: true,
    });

    // Click "Establish a new zone" to start/open application
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Capture the URL — it tells us if a new file or existing was opened
    const formUrl = page.url();
    console.log(`Form URL: ${formUrl}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C1-form-landed.png'),
      fullPage: true,
    });
  });

  test('P1-C2: Form tab — capture visible sections', async ({ page }) => {
    // Go directly to the service form
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Click "Form" tab
    const formTab = page.locator('text=Form').first();
    await formTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C2-form-tab-top.png'),
      fullPage: false,
    });

    // Capture FULL page (may be very long)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C2-form-tab-full.png'),
      fullPage: true,
    });

    // Log all visible section headers
    const headers = page.locator('.card-header, [class*="panel-heading"], h3, h4, h5');
    const headerCount = await headers.count();
    console.log(`\nVisible section headers: ${headerCount}`);
    for (let i = 0; i < headerCount; i++) {
      const text = await headers.nth(i).textContent();
      const cleaned = text?.trim().replace(/\s+/g, ' ').substring(0, 80);
      if (cleaned && cleaned.length > 2) {
        console.log(`  [${i}] ${cleaned}`);
      }
    }

    // Count form fields
    const allInputs = page.locator('input:visible, select:visible, textarea:visible');
    console.log(`\nTotal visible inputs: ${await allInputs.count()}`);
  });

  test('P1-C3: Form tab — scroll and capture sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Ensure we're on Form tab
    const formTab = page.locator('text=Form').first();
    await formTab.click();
    await page.waitForTimeout(2000);

    // Find all card/panel headers to identify collapsible sections
    const cards = page.locator('.card-header[role="button"]');
    const cardCount = await cards.count();
    console.log(`Collapsible sections found: ${cardCount}`);

    // Capture first 10 sections by scrolling to each
    for (let i = 0; i < Math.min(cardCount, 15); i++) {
      const card = cards.nth(i);
      const cardText = await card.textContent();
      const label = cardText?.trim().replace(/\s+/g, ' ').substring(0, 60) || `section-${i}`;

      try {
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        const safeName = label.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').substring(0, 40);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `P1-C3-section-${String(i).padStart(2, '0')}-${safeName}.png`),
          fullPage: false,
        });
        console.log(`  Section ${i}: ${label}`);
      } catch (e) {
        console.log(`  Section ${i} failed: ${label}`);
      }
    }
  });

  test('P1-C4: Payment tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Click Payment tab
    const paymentTab = page.locator('text=Payment').first();
    await paymentTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C4-payment-tab.png'),
      fullPage: true,
    });

    console.log('Payment tab captured');

    // Document what's visible
    const paymentContent = await page.locator('main, .tab-content, [role="tabpanel"]').first().textContent();
    console.log(`Payment content preview: ${paymentContent?.trim().substring(0, 200)}`);
  });

  test('P1-C5: Send tab — consents and declarations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Click Send tab
    const sendTab = page.locator('text=Send').first();
    await sendTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'P1-C5-send-tab.png'),
      fullPage: true,
    });

    console.log('Send tab captured');

    // Check for consent checkboxes
    const checkboxes = page.locator('input[type="checkbox"]:visible');
    const cbCount = await checkboxes.count();
    console.log(`Consent checkboxes: ${cbCount}`);

    // Check for submit button
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Send"), button[type="submit"]');
    const submitVisible = await submitBtn.first().isVisible().catch(() => false);
    console.log(`Submit button visible: ${submitVisible}`);
  });

  test('P1-C6: Extract all form field refs from DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await page.locator('text=Establish a new zone').click();
    await page.waitForTimeout(5000);

    // Make sure Form tab is active
    const formTab = page.locator('text=Form').first();
    await formTab.click();
    await page.waitForTimeout(3000);

    // Extract comprehensive field inventory from DOM
    const inventory = await page.evaluate(() => {
      const results: {
        sections: { name: string; expanded: boolean; fieldCount: number }[];
        fields: { key: string; type: string; label: string; required: boolean }[];
        buttons: string[];
      } = { sections: [], fields: [], buttons: [] };

      // Find all collapsible sections
      document.querySelectorAll('.card-header[role="button"]').forEach(header => {
        const name = header.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80) || '';
        const expanded = header.getAttribute('aria-expanded') === 'true';
        const panel = header.nextElementSibling;
        const fieldCount = panel?.querySelectorAll('input, select, textarea').length || 0;
        if (name) results.sections.push({ name, expanded, fieldCount });
      });

      // Find all form fields with useful attributes
      document.querySelectorAll('input, select, textarea').forEach(el => {
        const input = el as HTMLInputElement;
        const key = input.name || input.getAttribute('ref') || input.id || '';
        const type = input.type || el.tagName.toLowerCase();
        const labelEl = el.closest('.form-group, .formio-component')?.querySelector('label');
        const label = labelEl?.textContent?.trim().substring(0, 80) || '';
        const required = input.required || el.closest('.formio-component')?.classList.contains('required') || false;

        if (key && !key.startsWith('_')) {
          results.fields.push({ key, type, label, required });
        }
      });

      // Find all buttons
      document.querySelectorAll('button:not([disabled])').forEach(btn => {
        const text = btn.textContent?.trim();
        if (text && text.length > 1 && text.length < 50) {
          results.buttons.push(text);
        }
      });

      return results;
    });

    console.log(`\n=== FORM INVENTORY ===`);
    console.log(`Sections: ${inventory.sections.length}`);
    for (const s of inventory.sections) {
      console.log(`  [${s.expanded ? 'OPEN' : 'CLOSED'}] ${s.name} (${s.fieldCount} fields)`);
    }

    console.log(`\nFields: ${inventory.fields.length}`);
    for (const f of inventory.fields.slice(0, 30)) {
      console.log(`  ${f.required ? '*' : ' '} ${f.key} (${f.type}) ${f.label ? '— ' + f.label : ''}`);
    }
    if (inventory.fields.length > 30) {
      console.log(`  ... and ${inventory.fields.length - 30} more`);
    }

    console.log(`\nButtons: ${inventory.buttons.join(' | ')}`);
  });
});
