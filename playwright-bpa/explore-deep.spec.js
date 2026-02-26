// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `deep-${name}.png`), fullPage: true });
}

test.describe('Deep Exploration - Form Builder + Determinants', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Navigate to PE form builder from services list', async ({ page }) => {
    // Load auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    // ── Step 1: Go to services list first (handles CAS redirect) ──
    console.log('Going to services list...');
    await page.goto(`${BPA_URL}/services`);
    await page.waitForTimeout(3000);

    // If CAS login needed
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
      const state = await page.context().storageState();
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state, null, 2));
    }

    // Wait for services page to fully load
    await page.waitForSelector('.list-item-container, .cdk-drag', { timeout: 15000 });
    console.log('✅ Services page loaded');
    await ss(page, '01-services');

    // ── Step 2: Navigate to PE service page ──
    console.log('\nNavigating to PE service...');
    // Click on "Permisos eventuales" in the service list
    const peLink = page.locator('.list-item-container:has-text("Permisos eventuales")').first();
    if (await peLink.isVisible({ timeout: 5000 })) {
      await peLink.click();
      await page.waitForTimeout(5000);
      console.log('Clicked PE service. URL:', page.url());
    } else {
      // Try direct navigation
      console.log('PE not found in list, trying direct URL...');
      await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}`);
      await page.waitForTimeout(5000);
    }

    await ss(page, '02-pe-service');
    console.log('PE service URL:', page.url());

    // ── Step 3: Click Solicitud sidebar item ──
    console.log('\nClicking Solicitud...');
    const solicitud = page.locator('a.sidenav-item:has-text("Solicitud")').first();
    if (await solicitud.isVisible({ timeout: 5000 })) {
      await solicitud.click();
      await page.waitForTimeout(5000);
      await ss(page, '03-solicitud');
      console.log('Solicitud URL:', page.url());
    }

    // ── Step 4: Click Formulario tab ──
    console.log('\nClicking Formulario tab...');
    const formularioTab = page.locator('a.page-tab-link:has-text("Formulario")').first();
    if (await formularioTab.isVisible({ timeout: 5000 })) {
      await formularioTab.click();
      await page.waitForTimeout(8000); // Form builder takes time to load
      await ss(page, '04-formulario');
      console.log('Formulario URL:', page.url());
    }

    // ── Step 5: Explore form builder ──
    console.log('\n=== FORM BUILDER ===');

    // Click "Abrir/Cerrar Bloques"
    const toggleBlocks = page.locator('a:has-text("Abrir/Cerrar Bloques")');
    if (await toggleBlocks.isVisible({ timeout: 5000 })) {
      console.log('Clicking Abrir/Cerrar Bloques...');
      await toggleBlocks.click();
      await page.waitForTimeout(3000);
      await ss(page, '05-blocks-expanded');
    }

    // Get ALL visible elements in the form area
    const formArea = await page.$$eval('section#content *, .service-content *', els =>
      els.filter(el => el.offsetParent !== null).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        class: el.className?.toString().substring(0, 60),
        key: el.getAttribute('data-key') || el.getAttribute('ref'),
      })).filter(e => (e.text && e.text.length > 1 && e.text.length < 70) || e.key)
    );

    // Unique text items
    const seen = new Set();
    const unique = formArea.filter(e => {
      const k = e.text || e.key;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log('\nForm area elements:');
    unique.slice(0, 50).forEach(e =>
      console.log(`  <${e.tag}> key="${e.key}" [${e.text}] class="${e.class}"`)
    );

    // ── Step 6: Try to click on a form component ──
    // Look for blocks/panels in the form builder
    const blocks = page.locator('[class*="builder-component"], [class*="formio-component-panel"], .component-btn-group');
    const blockCount = await blocks.count();
    console.log(`\nBuilder components found: ${blockCount}`);

    if (blockCount > 0) {
      for (let i = 0; i < Math.min(blockCount, 5); i++) {
        const text = await blocks.nth(i).textContent();
        console.log(`  [${i}] ${text?.trim().substring(0, 60)}`);
      }

      // Click the first one
      console.log('\nClicking first builder component...');
      await blocks.first().click();
      await page.waitForTimeout(3000);
      await ss(page, '06-component-clicked');

      // Check drawer
      const drawerContent = await page.locator('.drawer-layer-content').textContent().catch(() => '');
      if (drawerContent && drawerContent.length > 10) {
        console.log('\nDrawer content (first 500 chars):');
        console.log(drawerContent.trim().substring(0, 500));
        await ss(page, '07-drawer-open');
      }
    }

    // ── Step 7: Look for any determinant-related text ANYWHERE on the page ──
    const allPageText = await page.textContent('body');
    const determinantMatch = allPageText?.match(/.{0,50}determinant.{0,50}/gi);
    console.log('\nDeterminant mentions:', determinantMatch);

    const conditionMatch = allPageText?.match(/.{0,50}condition.{0,50}/gi);
    console.log('Condition mentions:', conditionMatch);

    // ── Step 8: Look for ng-reflect bindings that might reveal routes ──
    const ngReflects = await page.$$eval('[ng-reflect-router-link]', els =>
      els.map(el => ({
        link: el.getAttribute('ng-reflect-router-link'),
        text: el.textContent?.trim().substring(0, 40)
      }))
    );
    console.log('\nAngular routes:', ngReflects);

    // ── Step 9: Check if there are network requests for determinants ──
    // Enable request logging
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('determinant') || req.url().includes('condition') || req.url().includes('behaviour')) {
        requests.push({ method: req.method(), url: req.url() });
      }
    });

    // Reload to capture requests
    console.log('\nReloading to capture API requests...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    console.log('Determinant-related requests:', requests);

    // ── Keep open ──
    console.log('\n✅ Browser open 90s for manual inspection.');
    await page.waitForTimeout(90_000);
  });
});
