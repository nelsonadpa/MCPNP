// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `formulario-${name}.png`), fullPage: true });
}

test.describe('Explore Formulario Tab', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Navigate to Formulario and find determinants', async ({ page }) => {
    // Load auth
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    // Navigate to the service Solicitud page
    console.log('Navigating to Fito service Solicitud...');
    await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant`);
    await page.waitForTimeout(5000);

    // Check for CAS redirect
    if (page.url().includes('/cas/') || page.url().includes('/cback/')) {
      console.log('🔑 PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => !u.toString().includes('/cas/') && !u.toString().includes('/cback/'), { timeout: 180_000 });
      const state = await page.context().storageState();
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(state, null, 2));
      await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant`);
      await page.waitForTimeout(5000);
    }

    await ss(page, '01-solicitud');
    console.log('Current URL:', page.url());

    // ── Click "Formulario" tab ──
    console.log('\nClicking Formulario tab...');

    // Try clicking the tab directly - it should have the text "Formulario"
    // The tab appears as: Guía | Formulario | Documentos | PAGOS | ENVIAR
    const formularioTab = page.locator('text=Formulario').first();
    if (await formularioTab.isVisible({ timeout: 5000 })) {
      await formularioTab.click();
      await page.waitForTimeout(5000);
      await ss(page, '02-formulario-tab');
      console.log('Clicked Formulario tab. URL:', page.url());
    } else {
      // Try the direct URL
      console.log('Tab not visible, trying direct URL...');
      await page.goto(`${BPA_URL}/services/${FITO_SERVICE_ID}/forms/applicant-form`);
      await page.waitForTimeout(5000);
      await ss(page, '02-formulario-direct');
      console.log('Direct URL result:', page.url());
    }

    // ── Explore form builder ──
    console.log('\n=== FORM BUILDER PAGE ===');

    // Take a viewport screenshot (not full page, just what's visible)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'formulario-03-viewport.png') });

    // Get all visible text elements
    const allText = await page.$$eval('*', els =>
      els.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      }).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 60),
        class: el.className?.toString().substring(0, 60)
      })).filter(e => e.text && e.text.length > 1 && e.text.length < 50 && !e.tag.match(/^(SCRIPT|STYLE|LINK|META)$/))
    );

    // Remove duplicates
    const uniqueTexts = [...new Set(allText.map(t => t.text))];
    console.log('\nVisible text on page (unique):');
    uniqueTexts.slice(0, 100).forEach(t => console.log(`  ${t}`));

    // ── Look for the form builder with component tree ──
    console.log('\n=== COMPONENT TREE ===');

    // BPA form builder typically shows a tree of form components
    // Look for various possible selectors
    const treeItems = await page.$$eval(
      '[class*="tree"], [class*="component-list"], [class*="panel"], [class*="block"], [class*="accordion"], [class*="collapse"]',
      els => els.map(el => ({
        tag: el.tagName,
        class: el.className?.toString().substring(0, 80),
        text: el.textContent?.trim().substring(0, 100),
        childCount: el.children.length
      })).filter(e => e.childCount > 0 && e.childCount < 50)
    );
    console.log('\nTree/panel elements:');
    treeItems.slice(0, 20).forEach(t =>
      console.log(`  <${t.tag}> (${t.childCount} children) class="${t.class}" text="${t.text?.substring(0, 50)}"`)
    );

    // ── Look for a component and try clicking to see options ──
    // In BPA, components typically have edit/settings buttons
    const componentRows = await page.$$eval(
      '[class*="field-item"], [class*="component-row"], [class*="form-group"], [class*="setting"], [class*="config"]',
      els => els.map(el => ({
        tag: el.tagName,
        class: el.className?.toString().substring(0, 80),
        text: el.textContent?.trim().substring(0, 60),
      }))
    );
    console.log('\nComponent rows:', componentRows.slice(0, 15));

    // ── Look specifically for determinant/condition buttons or links ──
    const allButtons = await page.$$eval('button, a, [role="button"]', els =>
      els.filter(el => el.offsetParent !== null).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 60),
        class: el.className?.toString().substring(0, 80),
        title: el.getAttribute('title') || '',
        href: el.getAttribute('href') || ''
      })).filter(e => e.text && e.text.length > 0)
    );
    console.log('\nAll visible buttons/links:');
    allButtons.forEach(b =>
      console.log(`  <${b.tag}> [${b.text}] title="${b.title}" href="${b.href}" class="${b.class}"`)
    );

    // ── Check for icons that might indicate determinant/condition ──
    const icons = await page.$$eval('i, mat-icon, [class*="icon"], svg', els =>
      els.filter(el => el.offsetParent !== null).map(el => ({
        tag: el.tagName,
        class: el.className?.toString().substring(0, 60),
        text: el.textContent?.trim(),
        title: el.getAttribute('title') || '',
        parent: el.parentElement?.textContent?.trim().substring(0, 40)
      })).filter(e => e.text || e.title || e.class?.includes('determinant') || e.class?.includes('condition'))
    );
    console.log('\nIcons:', icons.slice(0, 20));

    // ── Scroll down to see more of the form ──
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'formulario-04-scrolled.png') });

    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'formulario-05-scrolled-more.png') });

    // ── Save DOM structure ──
    const structure = await page.evaluate(() => {
      function walk(el, depth) {
        if (!el || depth > 5) return '';
        const tag = el.tagName?.toLowerCase() || '';
        const id = el.id ? `#${el.id}` : '';
        const cls = typeof el.className === 'string' && el.className
          ? `.${el.className.split(/\s+/).filter(c=>c).slice(0,3).join('.')}`
          : '';
        const indent = '  '.repeat(depth);
        let r = `${indent}<${tag}${id}${cls}>\n`;
        if (el.children.length === 0 && el.textContent?.trim()) {
          r = `${indent}<${tag}${id}${cls}> "${el.textContent.trim().substring(0, 40)}"\n`;
        }
        for (const c of Array.from(el.children).slice(0, 20)) r += walk(c, depth + 1);
        if (el.children.length > 20) r += `${indent}  ... (${el.children.length - 20} more)\n`;
        return r;
      }
      // Focus on the main content area
      const main = document.querySelector('app-formscontainer') || document.querySelector('main') || document.body;
      return walk(main, 0);
    });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'formulario-structure.txt'), structure);
    console.log('\nStructure saved to formulario-structure.txt');
    console.log(structure.substring(0, 4000));

    // ── Keep open ──
    console.log('\n✅ DONE. Browser open 90s.');
    await page.waitForTimeout(90_000);
  });
});
