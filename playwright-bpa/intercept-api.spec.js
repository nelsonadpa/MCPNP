// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `api-${name}.png`), fullPage: true });
}

test.describe('Intercept BPA API - Determinant Exploration', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Capture determinant API responses and explore form', async ({ page }) => {
    // Load auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    // ── Intercept ALL API responses ──
    const apiResponses = {};
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/bparest/')) {
        const shortUrl = url.replace(BPA_URL, '');
        try {
          const body = await response.text();
          apiResponses[shortUrl] = {
            status: response.status(),
            size: body.length,
            contentType: response.headers()['content-type']
          };

          // Save interesting responses to files
          if (url.includes('determinant') || url.includes('behaviour') ||
              url.includes('applicant-form')) {
            const filename = shortUrl.replace(/[\/\?=&]/g, '_').substring(0, 100) + '.json';
            fs.writeFileSync(path.join(API_DIR, filename), body);
            console.log(`📦 Saved: ${shortUrl} (${body.length} bytes)`);
          }
        } catch (e) {
          // Some responses can't be read
        }
      }
    });

    // ── Step 1: Navigate to services first ──
    console.log('Going to services...');
    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });

    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }

    await page.waitForTimeout(3000);
    // Save fresh cookies
    const freshState = await page.context().storageState();
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(freshState, null, 2));
    console.log('✅ Fresh cookies saved');

    // ── Step 2: Navigate to PE form builder ──
    console.log('\nNavigating to PE form builder...');
    await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    await ss(page, '01-pe-form');

    // ── Step 3: List all captured API responses ──
    console.log('\n=== ALL API RESPONSES ===');
    for (const [url, info] of Object.entries(apiResponses)) {
      console.log(`  ${info.status} ${url} (${info.size} bytes)`);
    }

    // ── Step 4: Try to interact with the form builder ──
    // Click "Abrir/Cerrar Bloques" to show form blocks
    const toggleBlocks = page.locator('a:has-text("Abrir/Cerrar")');
    if (await toggleBlocks.isVisible({ timeout: 5000 })) {
      console.log('\nToggling blocks...');
      await toggleBlocks.click();
      await page.waitForTimeout(5000);
      await ss(page, '02-blocks-toggled');

      // Now look for form components in the builder
      const visibleText = await page.evaluate(() => {
        const el = document.querySelector('.service-content') || document.querySelector('#content');
        return el?.textContent?.trim().substring(0, 2000) || '';
      });
      console.log('\nVisible form content (first 1000 chars):');
      console.log(visibleText.substring(0, 1000));
    }

    // ── Step 5: Try to click on a form component ──
    // After toggling blocks, components should be visible
    // Look for panels/blocks in the form
    const components = page.locator('.formio-component, .builder-component, [class*="form-group"]');
    const compCount = await components.count();
    console.log(`\nForm components visible: ${compCount}`);

    if (compCount > 0) {
      // Click on the first substantive component
      const firstComp = components.first();
      console.log('Clicking first component...');
      await firstComp.click();
      await page.waitForTimeout(3000);
      await ss(page, '03-component-clicked');

      // Check if drawer/panel opened with component settings
      const drawerText = await page.locator('.drawer-layer-content').textContent().catch(() => null);
      if (drawerText) {
        console.log('\n=== COMPONENT SETTINGS (DRAWER) ===');
        console.log(drawerText.substring(0, 1500));

        // Look for "determinant" text in the drawer
        if (drawerText.toLowerCase().includes('determinant')) {
          console.log('\n✅ FOUND "determinant" in component settings!');
        }
      }
    }

    // ── Step 6: Also try direct API call for determinants ──
    console.log('\n=== DIRECT API CALL ===');
    const detResponse = await page.evaluate(async (serviceId) => {
      try {
        const resp = await fetch(`/bparest/bpa/v2016/06/service/${serviceId}/determinant`);
        if (resp.ok) {
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 5000) };
        }
        return { status: resp.status, error: 'Not OK' };
      } catch (e) {
        return { error: e.message };
      }
    }, PE_SERVICE_ID);
    console.log('Determinant API response:', JSON.stringify(detResponse, null, 2).substring(0, 3000));

    // Save full determinant response
    if (detResponse.body) {
      fs.writeFileSync(path.join(API_DIR, 'PE-determinants-full.json'), detResponse.body);
      console.log('Full determinant response saved to api-responses/PE-determinants-full.json');
    }

    // Also get determinant names
    const detNamesResponse = await page.evaluate(async (serviceId) => {
      try {
        const resp = await fetch(`/bparest/bpa/v2016/06/service/${serviceId}/determinantname`);
        if (resp.ok) {
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 3000) };
        }
        return { status: resp.status, error: 'Not OK' };
      } catch (e) {
        return { error: e.message };
      }
    }, PE_SERVICE_ID);
    console.log('\nDeterminant names:', JSON.stringify(detNamesResponse, null, 2).substring(0, 2000));

    if (detNamesResponse.body) {
      fs.writeFileSync(path.join(API_DIR, 'PE-determinantnames.json'), detNamesResponse.body);
    }

    // ── Step 7: Try to find the "create determinant" API endpoint ──
    // Check if there's a POST endpoint by looking at what happens in the form builder
    console.log('\n=== EXPLORING DETERMINANT CREATION ===');

    // Try to find a "create" or "add" button for determinants
    const addButtons = await page.$$eval('button, a', els =>
      els.filter(el => el.offsetParent !== null).map(el => ({
        text: el.textContent?.trim().substring(0, 60),
        class: el.className?.toString().substring(0, 60),
        title: el.getAttribute('title') || ''
      })).filter(e =>
        e.text?.match(/add|crear|agregar|nuevo|\+/i) ||
        e.title?.match(/add|crear|agregar|nuevo/i)
      )
    );
    console.log('Add/Create buttons:', addButtons);

    // ── Keep open ──
    console.log('\n✅ Browser open 60s.');
    await page.waitForTimeout(60_000);
  });
});
