// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';

test.describe('Create Radio Determinant - API Exploration', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Find the correct API endpoint for radio determinant creation', async ({ page }) => {
    // ── Auth ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    console.log('Establishing session...');
    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }
    await page.waitForTimeout(3000);
    const freshState = await page.context().storageState();
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(freshState, null, 2));

    // Navigate to form builder to get JWT
    await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);
    console.log('At form builder:', page.url());

    // Get JWT token
    const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));
    console.log('JWT token available:', !!jwt, 'length:', jwt?.length);

    // ── Test various POST endpoints for determinant creation ──
    const payload = {
      name: "status bitácora = TRUE",
      determinantType: "FORMFIELD",
      serviceId: FITO_SERVICE_ID,
      targetFormFieldKey: "applicantStatusLlegaDeLaBitacora",
      generated: false,
      determinantInsideGrid: false,
      businessKey: "PermisoFitosanitariostatusbitácora=TRUE",
      operator: "EQUAL",
      selectValue: "true",
      value: "true",
      type: "radio",
      operatorStringValue: "EQUAL",
      valueIsNullOrEmpty: false
    };

    const endpoints = [
      // Type-specific endpoints
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/radiodeterminant`,
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/selectdeterminant`,
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/formfielddeterminant`,
      // Without /service/ prefix
      `/bparest/bpa/v2016/06/radiodeterminant`,
      `/bparest/bpa/v2016/06/selectdeterminant`,
      `/bparest/bpa/v2016/06/determinant`,
      // Different path patterns
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/determinant/create`,
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/determinant/radio`,
    ];

    console.log('\n=== Testing POST endpoints ===');
    for (const endpoint of endpoints) {
      const result = await page.evaluate(async ({ endpoint, payload, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify(payload)
          });
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 300) };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, payload, jwt });

      const statusEmoji = result.status === 200 || result.status === 201 ? 'SUCCESS' :
                           result.status === 405 ? '405-NOT-ALLOWED' :
                           result.status === 404 ? '404' :
                           result.status === 401 ? '401-UNAUTH' : `${result.status}`;
      console.log(`  ${statusEmoji} POST ${endpoint.split(FITO_SERVICE_ID).pop() || endpoint.split('v2016/06').pop()}`);
      if (result.body && result.status !== 405 && result.status !== 401) {
        console.log(`    Body: ${result.body}`);
      }
    }

    // ── Also try PUT endpoints ──
    console.log('\n=== Testing PUT endpoints ===');
    const putEndpoints = [
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/radiodeterminant`,
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/selectdeterminant`,
      `/bparest/bpa/v2016/06/service/${FITO_SERVICE_ID}/determinant`,
    ];

    for (const endpoint of putEndpoints) {
      const result = await page.evaluate(async ({ endpoint, payload, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify(payload)
          });
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 300) };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, payload, jwt });

      const label = endpoint.split(FITO_SERVICE_ID).pop() || endpoint.split('v2016/06').pop();
      console.log(`  ${result.status} PUT ${label}`);
      if (result.body && result.status !== 405 && result.status !== 401) {
        console.log(`    Body: ${result.body}`);
      }
    }

    // ── Intercept ALL requests during UI interaction ──
    console.log('\n=== Intercepting ALL write requests ===');
    const writeRequests = [];
    page.on('request', req => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
        writeRequests.push({
          method: req.method(),
          url: req.url().replace(BPA_URL, ''),
          contentType: req.headers()['content-type'],
          postData: req.postData()?.substring(0, 500)
        });
      }
    });

    // Try to interact with form builder - open a component's settings
    console.log('\nTrying to open a component settings...');

    // Click "Abrir/Cerrar Bloques" if visible
    const toggleBlocks = page.locator('a:has-text("Abrir/Cerrar Bloques")');
    if (await toggleBlocks.isVisible({ timeout: 5000 })) {
      await toggleBlocks.click();
      await page.waitForTimeout(2000);
    }

    // Look for the component by searching for "applicantBlock12" or "Block12"
    // or look for any clickable form components
    const allComponents = page.locator('[class*="builder-component"], [class*="formio-component"]');
    const compCount = await allComponents.count();
    console.log(`Form builder components found: ${compCount}`);

    // Look for panels specifically
    const panels = page.locator('.component-btn-group');
    const panelCount = await panels.count();
    console.log(`Panel btn groups found: ${panelCount}`);

    if (panelCount > 0) {
      for (let i = 0; i < Math.min(panelCount, 3); i++) {
        const text = await panels.nth(i).textContent().catch(() => '');
        console.log(`  Panel ${i}: ${text?.trim().substring(0, 60)}`);
      }
    }

    // Try to find and click specifically on the statusLlegaDeLaBitacora component
    const statusComp = page.locator('[ref="applicantStatusLlegaDeLaBitacora"], [data-key="applicantStatusLlegaDeLaBitacora"]');
    if (await statusComp.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('\nFound StatusLlegaDeLaBitacora component!');
      await statusComp.click();
      await page.waitForTimeout(3000);
    }

    // Also try clicking on the gear/settings icon for the first visible component
    const gearIcons = page.locator('[class*="component-settings"], [class*="settings-button"], .fa-cog, .bi-gear, [title*="settings"], [title*="edit"], [title*="configurar"]');
    const gearCount = await gearIcons.count();
    console.log(`Gear/settings icons found: ${gearCount}`);

    // Log any write requests captured
    if (writeRequests.length > 0) {
      console.log('\n=== WRITE REQUESTS CAPTURED ===');
      writeRequests.forEach(r => {
        console.log(`  ${r.method} ${r.url}`);
        if (r.postData) console.log(`    Data: ${r.postData}`);
      });
    }

    // ── Try to discover API by scanning Angular routes ──
    console.log('\n=== Scanning Angular app for API patterns ===');
    const apiPatterns = await page.evaluate(() => {
      // Check Angular's HttpClient interceptors or service definitions
      const scripts = document.querySelectorAll('script[src]');
      const scriptSrcs = Array.from(scripts).map(s => s.getAttribute('src'));
      return { scripts: scriptSrcs };
    });
    console.log('App scripts:', apiPatterns.scripts);

    // Try to get the main app bundle content to search for API endpoints
    const mainScript = apiPatterns.scripts.find(s => s?.includes('main'));
    if (mainScript) {
      console.log(`\nFetching main bundle: ${mainScript}`);
      const bundleContent = await page.evaluate(async (url) => {
        try {
          const resp = await fetch(url);
          const text = await resp.text();
          // Search for determinant-related API patterns
          const patterns = text.match(/['"](\/bparest\/[^'"]*determinant[^'"]*)['"]/gi) || [];
          const patterns2 = text.match(/['"](\/bparest\/[^'"]*)['"]/gi) || [];
          // Also look for radio-specific patterns
          const radioPatterns = text.match(/['"](\/bparest\/[^'"]*radio[^'"]*)['"]/gi) || [];
          // Get unique API paths
          const allPaths = [...new Set([...patterns, ...patterns2.slice(0, 30), ...radioPatterns])];
          return { totalSize: text.length, apiPaths: allPaths };
        } catch (e) {
          return { error: e.message };
        }
      }, mainScript);

      console.log('Bundle analysis:', JSON.stringify(bundleContent, null, 2));
    }

    // Save all results
    fs.writeFileSync(
      path.join(API_DIR, 'api-exploration-results.json'),
      JSON.stringify({ writeRequests, apiPatterns }, null, 2)
    );

    console.log('\nDone.');
    await page.waitForTimeout(10_000);
  });
});
