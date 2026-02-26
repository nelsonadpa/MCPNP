// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';

// Fito service ID (test target for radio determinant)
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';

function screenshot(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}

test.describe('BPA Exploration', () => {

  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Explore BPA admin UI for determinant creation', async ({ page }) => {
    // ── Step 1: Load saved auth or login manually ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
      console.log('✅ Loaded saved auth state');
    }

    await page.goto(`${BPA_URL}/services`);
    await page.waitForTimeout(3000);
    await screenshot(page, '01-landing');

    const url = page.url();
    console.log('Current URL:', url);

    // CAS login page is at /cback/v1.0/cas/ on same domain
    if (url.includes('/cback/') || url.includes('/cas/') || url.includes('login')) {
      console.log('\n🔑 ================================');
      console.log('   PLEASE LOG IN IN THE BROWSER');
      console.log('   Waiting up to 3 minutes...');
      console.log('   ================================\n');

      // Wait until URL goes to /services (after successful CAS login)
      await page.waitForURL(u => {
        const s = u.toString();
        return s.includes('/services') && !s.includes('/cas/') && !s.includes('/cback/');
      }, { timeout: 180_000 });

      console.log('✅ Logged in! Saving auth state...');
      const state = await page.context().storageState();
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state, null, 2));
    }

    await page.waitForTimeout(3000);
    await screenshot(page, '02-services-list');
    console.log('Services page URL:', page.url());

    // ── Step 2: Dump services page structure ──
    console.log('\n=== SERVICES PAGE ===');
    const allLinks = await page.$$eval('a[href]', els =>
      els.map(el => ({ text: el.textContent?.trim().substring(0, 80), href: el.getAttribute('href') }))
        .filter(l => l.text && l.text.length > 0)
    );
    console.log(`\nFound ${allLinks.length} links:`);
    allLinks.slice(0, 50).forEach(l => console.log(`  [${l.text}] → ${l.href}`));

    // ── Step 3: Navigate to Fito service ──
    console.log(`\nNavigating to Fito service...`);

    // Try clicking a Fito link or navigating directly
    const fitoLink = allLinks.find(l =>
      l.text?.toLowerCase().includes('fitosanitario') ||
      l.href?.includes(FITO_SERVICE_ID)
    );

    if (fitoLink) {
      console.log(`✅ Found Fito link: [${fitoLink.text}] → ${fitoLink.href}`);
      await page.click(`a:has-text("${fitoLink.text.substring(0, 30)}")`);
    } else {
      console.log('Trying direct URL...');
      await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}`);
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '03-fito-service');
    console.log('Fito page URL:', page.url());

    // ── Step 4: Find service page structure - tabs, menu, navigation ──
    console.log('\n=== FITO SERVICE PAGE ===');

    const allElements = await page.$$eval(
      'a, button, [role="tab"], [role="menuitem"], .nav-link, .tab-pane, li.nav-item',
      els => els.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        href: el.getAttribute('href'),
        class: el.className?.substring(0, 100),
        id: el.id
      })).filter(e => e.text && e.text.length > 1)
    );
    console.log(`\nAll clickable elements (${allElements.length}):`);
    allElements.slice(0, 60).forEach(e =>
      console.log(`  <${e.tag}${e.id ? '#'+e.id : ''}> [${e.text}] class="${e.class}" href="${e.href}"`)
    );

    // Look for determinant / conditions
    const detRelated = allElements.filter(e =>
      e.text?.toLowerCase().includes('determinant') ||
      e.text?.toLowerCase().includes('condition') ||
      e.text?.toLowerCase().includes('logic') ||
      e.text?.toLowerCase().includes('regla') ||
      e.text?.toLowerCase().includes('lógica')
    );
    console.log('\nDeterminant-related:', detRelated);

    // Look for "Form" or "Formulario" tab
    const formRelated = allElements.filter(e =>
      e.text?.toLowerCase().includes('form') ||
      e.text?.toLowerCase().includes('formulario') ||
      e.text?.toLowerCase().includes('editor')
    );
    console.log('Form-related:', formRelated);

    // ── Step 5: Try clicking on Form/Formulario if found ──
    if (formRelated.length > 0) {
      const formEl = formRelated[0];
      console.log(`\nClicking form element: [${formEl.text}]`);
      if (formEl.href) {
        await page.click(`a[href="${formEl.href}"]`);
      } else {
        await page.click(`text=${formEl.text.substring(0, 20)}`);
      }
      await page.waitForTimeout(5000);
      await screenshot(page, '04-form-editor');
      console.log('Form editor URL:', page.url());
    }

    // If we find determinant links, click them
    if (detRelated.length > 0) {
      const detEl = detRelated[0];
      console.log(`\nClicking determinant element: [${detEl.text}]`);
      await page.click(`text=${detEl.text.substring(0, 20)}`);
      await page.waitForTimeout(5000);
      await screenshot(page, '05-determinants');
      console.log('Determinants URL:', page.url());

      // Look for "Create" / "Add" / "New" button
      const createBtns = await page.$$eval('button, a', els =>
        els.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 60),
          class: el.className?.substring(0, 80)
        })).filter(e =>
          e.text?.toLowerCase().includes('create') ||
          e.text?.toLowerCase().includes('add') ||
          e.text?.toLowerCase().includes('new') ||
          e.text?.toLowerCase().includes('crear') ||
          e.text?.toLowerCase().includes('agregar') ||
          e.text?.toLowerCase().includes('nuevo') ||
          e.text?.includes('+')
        )
      );
      console.log('\nCreate/Add buttons:', createBtns);

      if (createBtns.length > 0) {
        console.log(`Clicking: [${createBtns[0].text}]`);
        await page.click(`text=${createBtns[0].text.substring(0, 15)}`);
        await page.waitForTimeout(3000);
        await screenshot(page, '06-create-determinant-dialog');

        // Dump the modal/dialog structure
        const modalContent = await page.$$eval(
          '.modal, [role="dialog"], .dialog, .popup, .overlay, form',
          els => els.map(el => ({
            tag: el.tagName,
            class: el.className?.substring(0, 80),
            html: el.innerHTML?.substring(0, 2000)
          }))
        );
        console.log('\nModal/Form content:', JSON.stringify(modalContent.slice(0, 3), null, 2));
      }
    }

    // ── Step 6: Save full DOM for analysis ──
    const fullHtml = await page.content();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'full-page.html'), fullHtml);
    console.log('\nFull HTML saved to screenshots/full-page.html');

    // ── Done ──
    console.log('\n========================================');
    console.log('  EXPLORATION COMPLETE');
    console.log('  Screenshots: ' + SCREENSHOTS_DIR);
    console.log('  Browser stays open 60s for manual check');
    console.log('========================================\n');

    await page.waitForTimeout(60_000);
  });
});
