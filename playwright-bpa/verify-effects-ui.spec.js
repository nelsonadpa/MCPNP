// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `verify-${name}.png`), fullPage: true });
}

test.describe('Verify Effects in BPA UI', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Check ExpiradoCertAprobacion effect in form builder', async ({ page }) => {
    // ── Auth ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    console.log('Going to services...');
    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }
    await page.waitForTimeout(3000);
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(await page.context().storageState(), null, 2));

    // Navigate to Bitacora form builder
    console.log('Navigating to Bitacora form builder...');
    await page.goto(`${BPA_URL}/services/${BITACORA_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(8000);
    console.log('At form builder:', page.url());

    // Check for page lock
    const lockDialog = page.locator('text=está usando esta página, text=is using this page, text=Solicitar acceso');
    if (await lockDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('⚠️ PAGE IS LOCKED by another user!');
      await ss(page, '00-page-locked');

      // Try requesting access
      const requestBtn = page.locator('button:has-text("Solicitar"), button:has-text("Request")');
      if (await requestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Clicking request access button...');
        await requestBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    await ss(page, '01-form-builder');

    // ── Step 1: Expand blocks ──
    console.log('\nExpanding blocks...');
    const toggleBlocks = page.locator('a:has-text("Abrir/Cerrar Bloques")');
    if (await toggleBlocks.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toggleBlocks.click();
      await page.waitForTimeout(3000);
      console.log('Blocks expanded');
    }

    // ── Step 2: Find CertAprobacion area and the Expirado button ──
    console.log('\nLooking for CertAprobacion...');

    // Scroll to find the CertAprobacion EditGrid
    const certLabel = page.locator('text=Cert. aprobación modelo ONN').first();
    if (await certLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await certLabel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    } else {
      // Scroll down to find it
      for (let i = 0; i < 30; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(200);
        if (await certLabel.isVisible().catch(() => false)) {
          console.log(`Found CertAprobacion after ${i + 1} scrolls`);
          await certLabel.scrollIntoViewIfNeeded();
          break;
        }
      }
    }
    await page.waitForTimeout(1000);
    await ss(page, '02-certaprobacion-area');

    // ── Step 3: Find the Expirado button component and click its settings gear ──
    console.log('\nLooking for ExpiradoCertAprobacion component...');

    // In the form builder, each component has a settings gear icon
    // Try finding by the component's key attribute or nearby text
    const expiradoComp = page.locator('[ref="applicantExpiradoCertAprobacion"], [data-key="applicantExpiradoCertAprobacion"]').first();

    if (await expiradoComp.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found ExpiradoCertAprobacion component!');
      await expiradoComp.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Hover to reveal the settings gear
      await expiradoComp.hover();
      await page.waitForTimeout(1000);
      await ss(page, '03-expirado-hover');

      // Click the gear/settings icon within this component
      const gear = expiradoComp.locator('.component-settings-button, [ref="editComponent"]').first();
      if (await gear.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Clicking settings gear...');
        await gear.click();
      } else {
        // Try clicking the component directly
        console.log('No gear found, clicking component directly...');
        await expiradoComp.click();
      }
    } else {
      // Use DOM search
      console.log('Component not visible by ref, using DOM search...');
      const found = await page.evaluate(() => {
        const all = document.querySelectorAll('[class*="formio-component"]');
        for (const el of all) {
          const ref = el.getAttribute('ref') || '';
          const key = el.getAttribute('data-key') || '';
          if (ref.includes('ExpiradoCertAprobacion') || key.includes('ExpiradoCertAprobacion')) {
            el.scrollIntoView({ block: 'center' });
            return { ref, key, visible: true };
          }
        }
        // Also search by examining inner elements
        for (const el of all) {
          const text = el.textContent || '';
          const html = el.innerHTML || '';
          if (html.includes('applicantExpiradoCertAprobacion') && text.includes('Expirado')) {
            el.scrollIntoView({ block: 'center' });
            return { text: text.substring(0, 50), found: 'by innerHTML' };
          }
        }
        return null;
      });
      console.log('DOM search result:', JSON.stringify(found));

      if (found) {
        await page.waitForTimeout(1000);
        await ss(page, '03-found-by-dom');

        // Try clicking the element
        const target = page.locator('[ref*="ExpiradoCertAprobacion"], [data-key*="ExpiradoCertAprobacion"]').first();
        if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
          await target.hover();
          await page.waitForTimeout(500);
          await target.click();
        }
      }
    }

    await page.waitForTimeout(3000);
    await ss(page, '04-after-click');

    // ── Step 4: Check if settings dialog/drawer opened ──
    console.log('\nChecking for settings dialog...');

    // Look for the edit dialog
    const dialog = page.locator('.component-edit-container, .drawer-layer-content, [class*="edit-form"]').first();
    if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Settings dialog opened!');
      await ss(page, '05-settings-dialog');

      // Look for Effects tab
      const effectsTab = page.locator('a:has-text("Effects"), li:has-text("Effects"), [class*="tab"]:has-text("Effects")').first();
      if (await effectsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Found Effects tab!');
        const tabText = await effectsTab.textContent();
        console.log('Tab text:', tabText);
        await effectsTab.click();
        await page.waitForTimeout(2000);
        await ss(page, '06-effects-tab');

        // Check if determinant is shown (not "SELECT A DETERMINANT")
        const selectDet = page.locator('text=SELECT A DETERMINANT, text=Please select a determinant');
        const hasDet = !(await selectDet.isVisible({ timeout: 2000 }).catch(() => false));
        console.log('\n========================================');
        console.log(hasDet ? '✅ DETERMINANT IS LINKED!' : '❌ Still shows SELECT A DETERMINANT');
        console.log('========================================\n');

        // Take a close-up screenshot of the effects area
        await ss(page, '07-effects-detail');

        // Look for the determinant name
        const detName = page.locator('text=CertAprobacion fecha');
        if (await detName.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Determinant name "CertAprobacion fecha" visible in UI!');
        }

        // Close the dialog
        const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), .btn-close').first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('Effects tab not found');
        // List tabs
        const tabs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('[role="tab"], .nav-link, [class*="tab"]'))
            .filter(el => el.offsetParent !== null)
            .map(el => el.textContent?.trim().substring(0, 40));
        });
        console.log('Available tabs:', tabs);
      }
    } else {
      console.log('No settings dialog detected');

      // Maybe we need to look at the current page state
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasDrawer: !!document.querySelector('.drawer-layer-content'),
          hasModal: !!document.querySelector('.modal-content'),
          hasEditForm: !!document.querySelector('[class*="edit-form"]')
        };
      });
      console.log('Page state:', JSON.stringify(pageContent));
    }

    // Wait for manual inspection
    console.log('\nBrowser open 60s for manual inspection...');
    await page.waitForTimeout(60_000);
  });
});
