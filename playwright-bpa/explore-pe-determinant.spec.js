// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';

// PE service - has working StatusBitacora determinant
const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';
// Fito service - needs the determinant
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `pe-${name}.png`), fullPage: true });
}

test.describe('Explore PE Determinant - Reference Model', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Navigate PE form and explore determinant settings', async ({ page }) => {
    // Load auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    // Go to PE form builder
    console.log('Navigating to PE form builder...');
    await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(3000);

    // Handle CAS redirect
    if (page.url().includes('/cas/') || page.url().includes('/cback/')) {
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => {
        const s = u.toString();
        return s.includes('/services/') && !s.includes('/cas/') && !s.includes('/cback/');
      }, { timeout: 180_000 });
      const state = await page.context().storageState();
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state, null, 2));
      await page.goto(`${BPA_URL}/services/${PE_SERVICE_ID}/forms/applicant-form`, {
        waitUntil: 'networkidle'
      });
      await page.waitForTimeout(3000);
    }

    await ss(page, '01-pe-form');
    console.log('PE form URL:', page.url());

    // ── Click "Abrir/Cerrar Bloques" to show form blocks ──
    console.log('\nClicking "Abrir/Cerrar Bloques"...');
    const toggleBlocksLink = page.locator('a:has-text("Abrir/Cerrar Bloques")');
    if (await toggleBlocksLink.isVisible({ timeout: 5000 })) {
      await toggleBlocksLink.click();
      await page.waitForTimeout(3000);
      await ss(page, '02-blocks-toggled');
      console.log('Blocks toggled');
    } else {
      console.log('Toggle blocks link not visible');
    }

    // ── Look for form components/blocks on the page ──
    console.log('\n=== FORM COMPONENTS ===');

    // The form builder should now show blocks
    // Look for draggable components, blocks, panels
    const formElements = await page.$$eval(
      '[class*="builder-component"], [class*="form-component"], [class*="drag"], [data-key], [data-type]',
      els => els.map(el => ({
        tag: el.tagName,
        class: el.className?.toString().substring(0, 80),
        key: el.getAttribute('data-key') || el.getAttribute('ref'),
        type: el.getAttribute('data-type'),
        text: el.textContent?.trim().substring(0, 60)
      })).filter(e => e.key || e.type || (e.text && e.text.length > 1))
    );
    console.log(`Found ${formElements.length} form elements`);
    formElements.slice(0, 30).forEach(e =>
      console.log(`  <${e.tag}> key="${e.key}" type="${e.type}" [${e.text}] class="${e.class}"`)
    );

    // ── Look for form builder component items ──
    const builderItems = await page.$$eval(
      '.formbuilder-component, .builder-component, [class*="formio-component"], .form-builder-component',
      els => els.map(el => ({
        class: el.className?.toString().substring(0, 80),
        key: el.getAttribute('data-key'),
        text: el.textContent?.trim().substring(0, 60),
        childCount: el.children.length
      }))
    );
    console.log(`\nBuilder items: ${builderItems.length}`);
    builderItems.slice(0, 20).forEach(e =>
      console.log(`  key="${e.key}" [${e.text}] (${e.childCount} children)`)
    );

    // ── Try to find a component by clicking on the form area ──
    // First look for any clickable component in the workspace
    const workspace = page.locator('#content, .service-content, .builder-drop-area').first();
    if (await workspace.isVisible({ timeout: 3000 })) {
      console.log('\nWorkspace found, looking for clickable components...');

      // Look for any element with "Block" or component name
      const blockElements = await page.$$eval(
        '[class*="block"], [class*="panel"], [class*="component"], label, .formio-component',
        els => els.filter(el => el.offsetParent !== null).map(el => ({
          tag: el.tagName,
          class: el.className?.toString().substring(0, 80),
          text: el.textContent?.trim().substring(0, 80),
          rect: el.getBoundingClientRect(),
        })).filter(e => e.text && e.rect.width > 50 && e.rect.height > 10)
      );
      console.log(`\nBlock/panel elements: ${blockElements.length}`);
      blockElements.slice(0, 20).forEach(e =>
        console.log(`  [${e.text}] at (${Math.round(e.rect.x)},${Math.round(e.rect.y)}) size ${Math.round(e.rect.width)}x${Math.round(e.rect.height)}`)
      );
    }

    // ── Try the "Formularios de servicio" tab mentioned earlier ──
    const serviceForms = page.locator('a:has-text("Formularios de servicio")');
    if (await serviceForms.isVisible({ timeout: 3000 })) {
      console.log('\nFound "Formularios de servicio" tab');
    }

    // ── Try clicking on the workspace to select a component ──
    // In the PE form, the workspace should have the form builder with all components
    // Try single-clicking on the first non-empty element
    const firstBlock = page.locator('.builder-component, [class*="formio-component"]').first();
    if (await firstBlock.isVisible({ timeout: 3000 })) {
      console.log('\nClicking first form component...');
      await firstBlock.click();
      await page.waitForTimeout(3000);
      await ss(page, '03-component-selected');

      // Check if the drawer opened
      const drawer = page.locator('.drawer-layer-content, drawer');
      const drawerVisible = await drawer.isVisible({ timeout: 3000 });
      console.log(`Drawer visible: ${drawerVisible}`);

      if (drawerVisible) {
        // Dump drawer content
        const drawerContent = await page.$$eval('.drawer-layer-content *, drawer *', els =>
          els.filter(el => el.offsetParent !== null).map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 80),
            class: el.className?.toString().substring(0, 60)
          })).filter(e => e.text && e.text.length > 1)
        );
        console.log('\nDrawer content:');
        const uniqueDrawer = [...new Map(drawerContent.map(d => [d.text, d])).values()];
        uniqueDrawer.slice(0, 30).forEach(d =>
          console.log(`  <${d.tag}> [${d.text}] class="${d.class}"`)
        );
      }
    }

    // ── Explore the right-side panel more ──
    // The tutorial-layer might have determinant info
    const tutorialBtns = await page.$$eval('.tutorial-layer a, .tutorial-layer button', els =>
      els.map(el => ({
        text: el.textContent?.trim(),
        class: el.className?.toString().substring(0, 60),
        title: el.getAttribute('title'),
        ariaLabel: el.getAttribute('aria-label')
      }))
    );
    console.log('\nTutorial layer buttons:', tutorialBtns);

    // Try clicking the tutorial layer tabs/icons
    const tutorialLinks = page.locator('.tutorial-layer-header a');
    const tutorialCount = await tutorialLinks.count();
    console.log(`\nTutorial header links: ${tutorialCount}`);
    for (let i = 0; i < tutorialCount; i++) {
      const linkText = await tutorialLinks.nth(i).textContent();
      const linkClass = await tutorialLinks.nth(i).getAttribute('class');
      console.log(`  [${i}] text="${linkText?.trim()}" class="${linkClass}"`);
    }

    // Click each tutorial layer button to see if one shows determinants
    for (let i = 0; i < Math.min(tutorialCount, 5); i++) {
      const link = tutorialLinks.nth(i);
      if (await link.isVisible()) {
        console.log(`\nClicking tutorial button ${i}...`);
        await link.click();
        await page.waitForTimeout(2000);
        await ss(page, `04-tutorial-btn-${i}`);

        // Check what appeared
        const layerContent = await page.$$eval('.tutorial-layer-content *', els =>
          els.filter(el => el.offsetParent !== null).map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 60),
          })).filter(e => e.text && e.text.length > 2)
        );
        const uniqueContent = [...new Set(layerContent.map(c => c.text))];
        console.log(`  Content: ${uniqueContent.slice(0, 15).join(', ')}`);
      }
    }

    // ── Keep open ──
    console.log('\n✅ DONE. Browser open 90s.');
    await page.waitForTimeout(90_000);
  });
});
