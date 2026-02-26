// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// Grid determinant we created via REST API
const GRID_DET_NAME = 'CertAprobacion fecha < hoy v2';

function ss(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOTS_DIR, `link-${name}.png`), fullPage: true });
}

test.describe('Link Determinant via BPA UI', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('Open ExpiradoCertAprobacion settings and link determinant', async ({ page }) => {
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
    await ss(page, '01-form-builder');

    // ── Step 1: Expand blocks to find our component ──
    console.log('\nExpanding blocks...');
    const toggleBlocks = page.locator('a:has-text("Abrir/Cerrar Bloques")');
    if (await toggleBlocks.isVisible({ timeout: 5000 })) {
      await toggleBlocks.click();
      await page.waitForTimeout(3000);
      console.log('Blocks expanded');
    }

    // ── Step 2: Find the CertAprobacion EditGrid section ──
    // Look for "Cert. aprobación modelo ONN" text
    console.log('\nLooking for CertAprobacion EditGrid...');

    // Scroll down to find it - the Bitacora form is very long
    // Let's use the search/find approach or scroll to the element
    const certAprobLabel = page.locator('text=Cert. aprobación modelo ONN').first();
    if (await certAprobLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found CertAprobacion label, scrolling to it...');
      await certAprobLabel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    } else {
      console.log('CertAprobacion not visible, scrolling down...');
      // Try to find it by scrolling
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(300);
        if (await certAprobLabel.isVisible().catch(() => false)) {
          console.log(`Found after ${i + 1} scrolls`);
          break;
        }
      }
    }

    await ss(page, '02-certaprobacion-area');

    // ── Step 3: Find and click the Expirado button component ──
    // The Expirado button should be visible in the editgrid
    console.log('\nLooking for Expirado button...');

    // Try to find the component by its key or the "Expirado" text within the CertAprobacion area
    const expiradoBtn = page.locator('[data-key="applicantExpiradoCertAprobacion"], [ref="applicantExpiradoCertAprobacion"]').first();
    let found = false;

    if (await expiradoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found Expirado component by data-key');
      await expiradoBtn.click();
      found = true;
    } else {
      // Try finding by looking for component-btn-group near "Expirado" text
      // In the form builder, components have settings icons
      console.log('Trying to find Expirado by nearby text...');

      // Look for all elements with "Expirado" text in the editgrid area
      const expiradoElements = page.locator('.formio-component:has-text("Expirado")');
      const count = await expiradoElements.count();
      console.log(`Found ${count} elements with "Expirado" text`);

      if (count > 0) {
        // Find the one near CertAprobacion
        for (let i = 0; i < count; i++) {
          const text = await expiradoElements.nth(i).textContent().catch(() => '');
          const html = await expiradoElements.nth(i).innerHTML().catch(() => '');
          console.log(`  [${i}] text: ${text?.trim().substring(0, 60)}`);
          if (html.includes('CertAprobacion') || html.includes('applicantExpiradoCertAprobacion')) {
            console.log(`  -> Clicking element ${i}`);
            await expiradoElements.nth(i).click();
            found = true;
            break;
          }
        }

        if (!found && count > 0) {
          // Try the last Expirado (CertAprobacion is likely one of the later ones)
          // Actually, let me try a different approach - find the component-btn-group
          // that contains the settings for our component
          console.log('\nTrying component btn groups near Expirado...');
          const btnGroups = page.locator('.component-btn-group');
          const bgCount = await btnGroups.count();
          console.log(`Total btn groups: ${bgCount}`);
        }
      }
    }

    if (!found) {
      // Alternative: search for the component in the form builder's working area
      // by evaluating the DOM directly
      console.log('\nUsing DOM search to find Expirado component...');

      const componentInfo = await page.evaluate(() => {
        // Find the element by searching for the key in formio's component tree
        const allComponents = document.querySelectorAll('[class*="formio-component"]');
        const results = [];
        allComponents.forEach(el => {
          const key = el.getAttribute('ref') || el.getAttribute('data-key') || '';
          const text = el.textContent?.trim().substring(0, 40) || '';
          if (key.includes('Expirado') || key.includes('expirado') ||
              (text.includes('Expirado') && key.includes('CertAprobacion'))) {
            results.push({
              tag: el.tagName,
              key,
              class: el.className?.substring(0, 80),
              text: text.substring(0, 40),
              rect: el.getBoundingClientRect()
            });
          }
        });
        return results;
      });

      console.log('DOM search results:', JSON.stringify(componentInfo, null, 2));

      if (componentInfo.length > 0) {
        // Click on the found element
        const target = componentInfo[0];
        console.log(`Clicking at (${target.rect.x + target.rect.width/2}, ${target.rect.y + target.rect.height/2})`);
        await page.mouse.click(target.rect.x + target.rect.width / 2, target.rect.y + target.rect.height / 2);
        found = true;
      }
    }

    await page.waitForTimeout(3000);
    await ss(page, '03-after-click');

    // ── Step 4: Check if drawer/dialog opened ──
    console.log('\nChecking for component settings dialog...');

    // The BPA form builder opens a drawer/dialog when clicking a component
    const drawer = page.locator('.drawer-layer-content, .modal-content, [class*="edit-form"]');
    if (await drawer.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Settings dialog opened!');

      // Look for "Effects" tab
      const effectsTab = page.locator('a:has-text("Effects"), button:has-text("Effects"), [class*="tab"]:has-text("Effects")');
      if (await effectsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Found Effects tab, clicking...');
        await effectsTab.click();
        await page.waitForTimeout(2000);
        await ss(page, '04-effects-tab');

        // Look for "SELECT A DETERMINANT" button
        const selectDetBtn = page.locator('button:has-text("SELECT A DETERMINANT"), a:has-text("SELECT A DETERMINANT")');
        if (await selectDetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('Found SELECT A DETERMINANT button');
          await selectDetBtn.click();
          await page.waitForTimeout(2000);
          await ss(page, '05-select-determinant');

          // A dropdown/modal should appear with determinant options
          // Look for our determinant by name
          const detOption = page.locator(`text=${GRID_DET_NAME}`).first();
          if (await detOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`Found determinant "${GRID_DET_NAME}", clicking...`);
            await detOption.click();
            await page.waitForTimeout(2000);
            await ss(page, '06-determinant-selected');

            // Click Save
            const saveBtn = page.locator('button:has-text("Save")').first();
            if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log('Clicking Save...');
              await saveBtn.click();
              await page.waitForTimeout(5000);
              await ss(page, '07-saved');
              console.log('SAVED! Check the UI to verify.');
            }
          } else {
            console.log('Determinant not found in dropdown. Taking screenshot...');
            await ss(page, '05b-determinant-dropdown');

            // List all visible options
            const allOptions = await page.evaluate(() => {
              const els = document.querySelectorAll('.dropdown-item, .list-item, option, [class*="determinant"]');
              return Array.from(els).filter(el => el.offsetParent !== null).map(el => ({
                text: el.textContent?.trim().substring(0, 80),
                class: el.className?.substring(0, 60)
              }));
            });
            console.log('Available options:', JSON.stringify(allOptions, null, 2));
          }
        } else {
          console.log('SELECT A DETERMINANT button not found');
          // Maybe we need to add an effect first
          const addEffectBtn = page.locator('text=Effect on field, text=Add effect, button:has-text("effect")');
          if (await addEffectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Found "Effect on field" link');
          }
          await ss(page, '04b-no-select-btn');
        }
      } else {
        console.log('Effects tab not found');
        // List all tabs
        const tabs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('[class*="tab"], [role="tab"]'))
            .filter(el => el.offsetParent !== null)
            .map(el => el.textContent?.trim().substring(0, 40));
        });
        console.log('Available tabs:', tabs);
      }
    } else {
      console.log('No settings dialog opened');
      // Take a screenshot to see what we're looking at
      await ss(page, '03b-no-dialog');
    }

    // Keep browser open for manual inspection
    console.log('\nBrowser open 120s for manual inspection...');
    await page.waitForTimeout(120_000);
  });
});
