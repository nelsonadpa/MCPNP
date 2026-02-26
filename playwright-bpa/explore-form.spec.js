// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `form-${name}.png`), fullPage: true });
}

test.describe('Explore Form Editor & Determinants', () => {

  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    // Load saved auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }
  });

  test('Navigate form editor and find determinant UI', async ({ page }) => {
    // ── Go directly to form editor ──
    console.log('Navigating directly to form editor...');
    await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant-form`);
    await page.waitForTimeout(5000);
    await ss(page, '01-form-editor');
    console.log('Form editor URL:', page.url());

    // Check if we got redirected (auth might have expired)
    if (page.url().includes('/cas/')) {
      console.log('Auth expired, need to login again...');
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => !u.toString().includes('/cas/'), { timeout: 180_000 });
      // Re-save auth
      const state = await page.context().storageState();
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state, null, 2));
      // Navigate again
      await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant-form`);
      await page.waitForTimeout(5000);
      await ss(page, '01-form-editor');
    }

    // ── Explore sidebar - click "Solicitud" to expand ──
    console.log('\nLooking for Solicitud sidebar item to expand...');
    const solicitudEl = page.locator('text=Solicitud').first();
    if (await solicitudEl.isVisible()) {
      await solicitudEl.click();
      await page.waitForTimeout(2000);
      await ss(page, '02-solicitud-expanded');
      console.log('Expanded Solicitud');
    }

    // ── Look for all sidebar/nav links now ──
    const sidebarLinks = await page.$$eval('a', els =>
      els.map(el => ({
        text: el.textContent?.trim().substring(0, 60),
        href: el.getAttribute('href'),
        visible: el.offsetParent !== null
      })).filter(l => l.text && l.visible)
    );
    console.log('\nVisible links:');
    sidebarLinks.forEach(l => console.log(`  [${l.text}] → ${l.href}`));

    // ── Dump the main content area structure ──
    console.log('\n=== FORM EDITOR CONTENT ===');

    // Find all interactive elements in the main content
    const mainContent = await page.$$eval(
      'button, [class*="determinant"], [class*="condition"], [class*="add"], [class*="create"], .fab, .mat-fab, [class*="plus"]',
      els => els.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        class: el.className?.substring(0, 100),
        title: el.getAttribute('title'),
        ariaLabel: el.getAttribute('aria-label')
      })).filter(e => e.text || e.title || e.ariaLabel)
    );
    console.log('\nButtons & interactive elements:');
    mainContent.forEach(e =>
      console.log(`  <${e.tag}> [${e.text}] title="${e.title}" aria="${e.ariaLabel}" class="${e.class}"`)
    );

    // ── Look for form.io builder elements ──
    const formioElements = await page.$$eval(
      '[class*="formio"], [class*="formbuilder"], [class*="form-builder"], [class*="builder"]',
      els => els.map(el => ({
        tag: el.tagName,
        class: el.className?.substring(0, 100),
        childCount: el.children.length
      }))
    );
    console.log('\nForm.io builder elements:', formioElements.slice(0, 10));

    // ── Look for any component in the form that we could right-click/configure ──
    const formComponents = await page.$$eval(
      '[class*="component"], [data-type], [ref], [class*="field"]',
      els => els.map(el => ({
        tag: el.tagName,
        class: el.className?.substring(0, 80),
        ref: el.getAttribute('ref'),
        dataType: el.getAttribute('data-type'),
        text: el.textContent?.trim().substring(0, 40)
      })).filter(e => e.ref || e.dataType || e.text)
    );
    console.log('\nForm components found:', formComponents.length);
    formComponents.slice(0, 20).forEach(c =>
      console.log(`  <${c.tag}> ref="${c.ref}" type="${c.dataType}" [${c.text}] class="${c.class}"`)
    );

    // ── Try navigating to the "applicant" form view ──
    console.log('\nTrying direct URL to applicant form...');
    await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant`);
    await page.waitForTimeout(5000);
    await ss(page, '03-applicant-form');
    console.log('URL:', page.url());

    // ── Dump what we see ──
    const pageText = await page.textContent('body');
    const words = pageText?.split(/\s+/).filter(w => w.length > 2).slice(0, 200);
    console.log('\nPage words:', words?.join(' '));

    // ── Look for "+" button, FAB, or add determinant ──
    const fabButtons = await page.$$('button.fab, .mat-fab, button[aria-label*="add"], button[aria-label*="Add"], [class*="fab"], [class*="float"]');
    console.log(`\nFAB/Add buttons: ${fabButtons.length}`);
    for (const btn of fabButtons) {
      const text = await btn.textContent();
      const cls = await btn.getAttribute('class');
      console.log(`  FAB: [${text?.trim()}] class="${cls}"`);
    }

    // ── Try right-clicking on a form component to see context menu ──
    const firstComponent = await page.$('[class*="component"]');
    if (firstComponent) {
      await firstComponent.click({ button: 'right' });
      await page.waitForTimeout(2000);
      await ss(page, '04-context-menu');
      console.log('Right-clicked on component, took screenshot');
    }

    // ── Final: dump body class structure (top 3 levels) ──
    const structure = await page.evaluate(() => {
      function walk(el, depth) {
        if (!el || depth > 4) return '';
        const tag = el.tagName?.toLowerCase() || '';
        const id = el.id ? `#${el.id}` : '';
        const cls = typeof el.className === 'string' && el.className
          ? `.${el.className.split(/\s+/).filter(c=>c).slice(0,3).join('.')}`
          : '';
        const indent = '  '.repeat(depth);
        let r = `${indent}<${tag}${id}${cls}>\n`;
        for (const c of el.children) r += walk(c, depth + 1);
        return r;
      }
      return walk(document.body, 0);
    });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'form-structure.txt'), structure);
    console.log('\nDOM structure saved to form-structure.txt');
    console.log(structure.substring(0, 3000));

    // ── Keep open ──
    console.log('\n✅ DONE. Browser open 60s for inspection.');
    await page.waitForTimeout(60_000);
  });
});
