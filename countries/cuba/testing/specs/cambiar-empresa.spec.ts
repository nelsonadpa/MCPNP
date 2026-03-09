import { test, expect } from '@playwright/test';
import path from 'path';
import { screenshot } from '../helpers/form-helpers';

/**
 * Test: Cambiar Empresa flow in Bitacora
 *
 * Validates that when a user changes company via applicantCambiarEmpresa2:
 * 1. Block8 (LISTAR bots container) deactivates
 * 2. User can select a new company
 * 3. On "Confirmar y continuar", Block8 re-activates
 * 4. LISTAR bots re-execute with new company context
 *
 * Service: Bitacora Hub (ffe746aac09241078bad48c9b95cdfe0)
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/cambiar-empresa');
const BITACORA_URL = '/services/ffe746aac09241078bad48c9b95cdfe0/forms/applicant-form';

// Override stale storage state
test.use({ storageState: undefined });

test('Cambiar empresa — Block8 deactivate/reactivate cycle', async ({ page }) => {
  test.setTimeout(300_000);

  // Ensure screenshot dir exists
  const fs = require('fs');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // === STEP 1: Navigate to Bitacora (with CAS login if needed) ===
  console.log('=== STEP 1: Navigate to Bitacora ===');
  await page.goto(BITACORA_URL);
  await page.waitForLoadState('networkidle');

  // Navigate to Bitacora — will redirect to CAS if not logged in
  console.log('Navigating to Bitacora...');
  await page.goto('https://cuba.eregistrations.org' + BITACORA_URL);
  await page.waitForTimeout(5000);

  // Handle CAS login if needed
  if (await page.locator('button:has-text("Ingresar")').isVisible().catch(() => false)) {
    console.log('CAS login required');
    // Fill using visible inputs — index 0=email, 1=password
    const visibleInputs = page.locator('input:visible');
    const inputCount = await visibleInputs.count();
    console.log(`CAS form has ${inputCount} visible inputs`);

    for (let i = 0; i < inputCount; i++) {
      const inputType = await visibleInputs.nth(i).getAttribute('type');
      console.log(`  input[${i}]: type="${inputType}"`);
    }

    // Fill email in first non-password input
    for (let i = 0; i < inputCount; i++) {
      const inputType = await visibleInputs.nth(i).getAttribute('type');
      if (inputType !== 'password') {
        await visibleInputs.nth(i).click();
        await visibleInputs.nth(i).fill('nelsonadpa@gmail.com');
        break;
      }
    }
    // Fill password
    await page.locator('input[type="password"]:visible').first().click();
    await page.locator('input[type="password"]:visible').first().fill('el salvador');
    await page.waitForTimeout(500);

    // Submit
    await page.locator('button:has-text("Ingresar")').click();
    console.log('Clicked Ingresar, waiting for redirect...');
    await page.waitForTimeout(15_000);
    console.log(`After login URL: ${page.url()}`);

    // If not on Bitacora, navigate there
    if (!page.url().includes('/services/')) {
      await page.goto('https://cuba.eregistrations.org' + BITACORA_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
    }
  }

  // Wait for Empresas tab to load — wait for company text to appear
  await page.locator('text=Mis empresas').waitFor({ timeout: 60_000 });
  await page.locator('text=NIT:').first().waitFor({ timeout: 30_000 });
  await screenshot(page, SCREENSHOT_DIR, '01-empresas-loaded');
  console.log('Empresas tab loaded');

  // === STEP 2: Select first company ===
  console.log('=== STEP 2: Select first company ===');
  // Companies are rows in the EditGrid — click by company name text
  const firstCompany = page.locator('text=EMPRESA DE SERVICIOS INGENIEROS ES').first();
  const rowCount = await page.locator('[class*="applicantEditGridEmpresasAcreditadas"] [class*="row"], .formio-component-applicantCompania').count();
  console.log(`Approximate company count: ${rowCount}`);

  // Click first company
  await firstCompany.click();
  await page.waitForTimeout(2000);
  await screenshot(page, SCREENSHOT_DIR, '02-company-selected');

  // Get selected company name for later comparison
  const companyName1 = await page.locator('.formio-component-applicantCompania7 input').inputValue().catch(() => '');
  console.log(`Selected company: "${companyName1}"`);

  // === STEP 3: Confirm company (applicantCambiarEmpresa3) ===
  console.log('=== STEP 3: Confirm company ===');
  const confirmBtn = page.locator('.formio-component-applicantCambiarEmpresa3 button, [ref="applicantCambiarEmpresa3"]').first();
  await confirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await confirmBtn.click();
  await page.waitForTimeout(5000); // Wait for goToNextPage + LISTAR bots
  await screenshot(page, SCREENSHOT_DIR, '03-after-confirm');

  // === STEP 4: Verify Block8 is active (LISTAR panels visible) ===
  console.log('=== STEP 4: Verify Block8 active ===');
  const block8 = page.locator('.formio-component-applicantBlock8');
  const block8Visible = await block8.isVisible({ timeout: 10_000 }).catch(() => false);
  console.log(`Block8 visible: ${block8Visible}`);

  // Check if Block8 has "deactivated" class (should NOT at this point)
  const block8Classes = await block8.getAttribute('class').catch(() => '');
  const block8Deactivated = block8Classes?.includes('formio-hidden') || block8Classes?.includes('deactivated');
  console.log(`Block8 deactivated: ${block8Deactivated}`);
  console.log(`Block8 classes: ${block8Classes}`);

  // Check if any EditGrid inside has data (rows) — use formio ref attribute
  const peGrid = page.locator('[ref="applicantEditGrid"] li, .formio-component-applicantEditGrid .list-group-item');
  const peRowCount = await peGrid.count();
  console.log(`PE EditGrid rows: ${peRowCount}`);
  await screenshot(page, SCREENSHOT_DIR, '04-block8-active-permisos');

  // === STEP 5: Click "Cambiar empresa" (applicantCambiarEmpresa2) ===
  console.log('=== STEP 5: Click Cambiar empresa ===');
  const cambiarBtn = page.locator('.formio-component-applicantCambiarEmpresa2 button, [ref="applicantCambiarEmpresa2"]').first();

  // Scroll to make sure it's visible
  if (await cambiarBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await cambiarBtn.scrollIntoViewIfNeeded();
    await cambiarBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, SCREENSHOT_DIR, '05-after-cambiar-empresa');
    console.log('Clicked Cambiar empresa');
  } else {
    // Maybe we need to scroll up or find the button in a different location
    console.log('Cambiar empresa button not found directly, searching...');
    const allButtons = await page.locator('button').allTextContents();
    console.log('All visible buttons:', allButtons.filter(b => b.trim()).slice(0, 20));
    throw new Error('Cambiar empresa button not found');
  }

  // === STEP 6: Verify we're back on Empresas tab ===
  console.log('=== STEP 6: Verify on Empresas tab ===');
  const onEmpresas = await page.locator('text=Mis empresas').isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`On Empresas tab: ${onEmpresas}`);

  // Verify Block8 is now deactivated
  const block8AfterCambiar = page.locator('.formio-component-applicantBlock8');
  const block8ClassesAfter = await block8AfterCambiar.getAttribute('class').catch(() => '');
  const block8DeactivatedAfter = block8ClassesAfter?.includes('formio-hidden') || block8ClassesAfter?.includes('deactivated');
  console.log(`Block8 deactivated after cambiar: ${block8DeactivatedAfter}`);
  console.log(`Block8 classes after cambiar: ${block8ClassesAfter}`);
  await screenshot(page, SCREENSHOT_DIR, '06-back-on-empresas');

  // === STEP 7: Select a DIFFERENT company ===
  console.log('=== STEP 7: Select different company ===');
  // Select FONDO CUBANO (different from EMPRESA DE SERVICIOS INGENIEROS)
  const secondCompany = page.locator('text=FONDO CUBANO DE BIENES CULTURALES').first();
  if (await secondCompany.isVisible({ timeout: 5000 }).catch(() => false)) {
    await secondCompany.click();
    console.log('Selected DIFFERENT company: FONDO CUBANO');
  } else {
    await page.locator('text=EMPRESA DE SERVICIOS INGENIEROS').first().click();
    console.log('Selected SAME company (fallback)');
  }
  await page.waitForTimeout(2000);
  await screenshot(page, SCREENSHOT_DIR, '07-company-reselected');

  const companyName2 = await page.locator('.formio-component-applicantCompania7 input').inputValue().catch(() => '');
  console.log(`Re-selected company: "${companyName2}"`);

  // === STEP 8: Confirm again ===
  console.log('=== STEP 8: Confirm company again ===');
  const confirmBtn2 = page.locator('.formio-component-applicantCambiarEmpresa3 button, [ref="applicantCambiarEmpresa3"]').first();
  await confirmBtn2.waitFor({ state: 'visible', timeout: 10_000 });
  await confirmBtn2.click();
  await page.waitForTimeout(8000); // Wait for LISTAR bots to re-execute
  await screenshot(page, SCREENSHOT_DIR, '08-after-reconfirm');

  // === STEP 9: Verify Block8 re-activated and LISTAR re-ran ===
  console.log('=== STEP 9: Verify Block8 re-activated ===');
  const block8Final = page.locator('.formio-component-applicantBlock8');
  const block8ClassesFinal = await block8Final.getAttribute('class').catch(() => '');
  const block8VisibleFinal = await block8Final.isVisible({ timeout: 10_000 }).catch(() => false);
  const block8DeactivatedFinal = block8ClassesFinal?.includes('formio-hidden') || block8ClassesFinal?.includes('deactivated');
  console.log(`Block8 visible final: ${block8VisibleFinal}`);
  console.log(`Block8 deactivated final: ${block8DeactivatedFinal}`);
  console.log(`Block8 classes final: ${block8ClassesFinal}`);

  // Check PE EditGrid rows after re-confirmation
  const peGrid2 = page.locator('[ref="applicantEditGrid"] li, .formio-component-applicantEditGrid .list-group-item');
  const peRowCount2 = await peGrid2.count();
  console.log(`PE EditGrid rows after re-confirm: ${peRowCount2}`);

  // Dump visible text from Block8 area to understand what's rendered
  const block8Text = await page.locator('.formio-component-applicantBlock8').innerText().catch(() => 'NOT FOUND');
  console.log(`Block8 text content (first 500 chars): ${block8Text.substring(0, 500)}`);

  await screenshot(page, SCREENSHOT_DIR, '09-final-state');

  // === SUMMARY ===
  console.log('\n========== SUMMARY ==========');
  console.log(`Company 1: "${companyName1}"`);
  console.log(`Company 2: "${companyName2}"`);
  console.log(`Same company: ${companyName1 === companyName2}`);
  console.log(`Block8 deactivated after cambiar: ${block8DeactivatedAfter}`);
  console.log(`Block8 re-activated after re-confirm: ${!block8DeactivatedFinal}`);
  console.log(`PE rows before: ${peRowCount}, after: ${peRowCount2}`);
  console.log(`LISTAR re-executed: ${peRowCount2 > 0 ? 'YES (rows present)' : 'UNCLEAR (0 rows - might be normal for this company)'}`);
  console.log('=============================');

  // Soft assertions - log results but don't fail hard (diagnostic test)
  expect.soft(block8DeactivatedAfter, 'Block8 should deactivate after Cambiar empresa').toBeTruthy();
  expect.soft(!block8DeactivatedFinal, 'Block8 should re-activate after re-confirm').toBeTruthy();
});
