import { test } from '@playwright/test';
import path from 'path';
import { screenshot } from '../helpers/form-helpers';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/diag');

test('Diagnose PE entry from Permisos', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');

  // Wait for companies
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Mis empresas') &&
           !document.body.innerText.includes('(-1)');
  }, { timeout: 30_000 });

  // Select company + confirm
  await page.locator('text=EMPRESA DE SERVICIOS INGENIEROS').first().click();
  await page.waitForTimeout(2000);
  await page.locator('text=Confirmar y continuar').click();
  await page.waitForTimeout(3000);

  // Servicios tab
  await page.locator('text=Servicios').first().click();
  await page.waitForTimeout(3000);

  // Expand Permisos
  await page.locator('text=Permisos').first().click();
  await page.waitForTimeout(3000);

  // ========= TEST A: Click "Agregar" button at top =========
  console.log('=== TEST A: Click top "Agregar" button ===');
  const agregarBtn = page.locator('button:has-text("Agregar"), a:has-text("Agregar")').first();
  if (await agregarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await agregarBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, SCREENSHOT_DIR, '30-agregar-clicked');

    const textAfter = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log('After Agregar:\n', textAfter);

    // Check if a dropdown appeared
    const dropdownItems = await page.locator('.dropdown-menu.show .dropdown-item, .dropdown-menu[style*="block"] .dropdown-item, .dropdown-menu:visible .dropdown-item').allTextContents();
    console.log('DROPDOWN ITEMS:', JSON.stringify(dropdownItems.map(d => d.trim())));

    // Check if navigated to a form
    console.log('URL after Agregar:', page.url());

    // Close dropdown if open (press Escape)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } else {
    console.log('Agregar button not visible');
  }

  // ========= TEST B: Click "Permiso eventual" accordion =========
  console.log('\n=== TEST B: Click "Permiso eventual" accordion ===');
  // Scroll up to see the Permisos section
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const peItem = page.locator('text=Permiso eventual').first();
  if (await peItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Found "Permiso eventual", clicking...');
    await peItem.click();
    await page.waitForTimeout(5000);
    await screenshot(page, SCREENSHOT_DIR, '31-pe-accordion-expanded');

    const textAfterPE = await page.evaluate(() => document.body.innerText.substring(0, 4000));
    console.log('After PE expand:\n', textAfterPE);

    console.log('URL after PE click:', page.url());

    // Check if we navigated to the PE form
    const hasFormio = await page.locator('.formio-form, [ref^="applicant"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Has formio form:', hasFormio);

    // Check for an Agregar/Nuevo button inside the expanded section
    const innerButtons = await page.locator('button:visible').allTextContents();
    console.log('BUTTONS after PE:', JSON.stringify(innerButtons.map(b => b.trim()).filter(Boolean)));
  } else {
    console.log('"Permiso eventual" text NOT visible. Trying broader search...');
    const allText = await page.locator('body').innerText();
    const peIndex = allText.indexOf('eventual');
    if (peIndex > 0) {
      console.log('Found "eventual" at index:', peIndex, 'context:', allText.substring(Math.max(0, peIndex - 50), peIndex + 50));
    }
  }

  await screenshot(page, SCREENSHOT_DIR, '32-final');
});
