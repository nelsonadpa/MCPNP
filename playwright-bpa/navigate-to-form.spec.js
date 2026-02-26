// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `nav-${name}.png`), fullPage: true });
}

test.describe('Navigate to Form Builder', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Navigate to PE form builder step by step', async ({ page }) => {
    // Load auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    // ── Step 1: Go to services list ──
    console.log('Going to services...');
    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });

    // If CAS login needed
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }

    await page.waitForTimeout(3000);
    console.log('URL after load:', page.url());

    // Save fresh cookies
    const freshState = await page.context().storageState();
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(freshState, null, 2));
    console.log('✅ Fresh cookies saved');

    // ── Step 2: Find and analyze the PE service row structure ──
    console.log('\nAnalyzing service list item structure...');

    // Get ALL <a> tags and their details within list items
    const listLinks = await page.$$eval('.list-item-container a, .cdk-drag a', els =>
      els.map(el => ({
        text: el.textContent?.trim().substring(0, 60),
        href: el.getAttribute('href'),
        class: el.className?.substring(0, 60),
        routerLink: el.getAttribute('ng-reflect-router-link'),
        parent: el.parentElement?.className?.substring(0, 40)
      }))
    );
    console.log('Links within service rows:');
    listLinks.slice(0, 20).forEach(l =>
      console.log(`  [${l.text}] href="${l.href}" routerLink="${l.routerLink}" class="${l.class}"`)
    );

    // Get the PE row specifically
    const peRow = page.locator('.list-item-container:has-text("Permisos eventuales")').first();
    if (await peRow.isVisible({ timeout: 5000 })) {
      // Get inner HTML of PE row
      const peHtml = await peRow.innerHTML();
      console.log('\nPE row HTML (first 800 chars):');
      console.log(peHtml.substring(0, 800));

      // Find all links within PE row
      const peLinks = await peRow.locator('a').all();
      console.log(`\nLinks inside PE row: ${peLinks.length}`);
      for (const link of peLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        const routerLink = await link.getAttribute('ng-reflect-router-link');
        console.log(`  [${text?.trim()}] href="${href}" routerLink="${routerLink}"`);
      }

      // Also check for click handlers
      const clickables = await peRow.locator('[class*="cursor"], [style*="cursor"], [role="button"]').all();
      console.log(`Clickable elements: ${clickables.length}`);

      // Try clicking the service name link
      const peNameLink = peRow.locator('a').first();
      if (await peNameLink.isVisible({ timeout: 3000 })) {
        const href = await peNameLink.getAttribute('href');
        console.log(`\n📍 Clicking PE name link (href=${href})...`);
        await peNameLink.click();
        await page.waitForTimeout(5000);
        await ss(page, '01-after-pe-click');
        console.log('URL after click:', page.url());
      } else {
        // Click the row itself
        console.log('\nNo link found, clicking PE row...');
        await peRow.click();
        await page.waitForTimeout(5000);
        await ss(page, '01-after-pe-click');
        console.log('URL after click:', page.url());
      }

      // Check if we navigated to the PE service
      const currentUrl = page.url();
      if (currentUrl.includes(PE_SERVICE_ID) || currentUrl.includes('applicant-form')) {
        console.log('✅ Successfully navigated to PE service!');

        // Look for Formulario tab
        const formularioTab = page.locator('a:has-text("Formulario")').first();
        if (await formularioTab.isVisible({ timeout: 5000 })) {
          console.log('Clicking Formulario tab...');
          await formularioTab.click();
          await page.waitForTimeout(8000);
          await ss(page, '02-formulario');
          console.log('URL:', page.url());
        }
      }
    }

    // ── Step 3: Alternative approach - use page.goto with fresh cookies ──
    console.log('\n--- Alternative: trying page.goto with fresh session ---');
    await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);
    const url3 = page.url();
    console.log('URL after goto:', url3);
    await ss(page, '03-goto-form');

    if (url3.includes('applicant-form') && !url3.includes('/cas/')) {
      console.log('✅ Direct navigation worked!');
    } else {
      // The goto might have triggered CAS again, wait for it
      if (url3.includes('/services') && url3.includes('code=')) {
        // We're back on services with a new code
        console.log('Got new CAS code, now trying goto again...');
        // Save new cookies
        const state2 = await page.context().storageState();
        fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state2, null, 2));

        await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}/forms/applicant-form`);
        await page.waitForTimeout(5000);
        console.log('Second attempt URL:', page.url());
        await ss(page, '04-second-attempt');
      }
    }

    // ── Step 4: Monitor network for API patterns ──
    console.log('\n--- Monitoring API requests ---');
    const apiRequests = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('/api/') || url.includes('/rest/') || url.includes('form') ||
          url.includes('determinant') || url.includes('behaviour')) {
        apiRequests.push({ method: req.method(), url: url.substring(0, 120) });
      }
    });

    // Try reloading current page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('\nAPI requests observed:');
    apiRequests.forEach(r => console.log(`  ${r.method} ${r.url}`));

    // ── Keep open ──
    console.log('\n✅ Browser open 120s.');
    await page.waitForTimeout(120_000);
  });
});
