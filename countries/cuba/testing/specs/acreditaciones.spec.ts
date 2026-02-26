import { test, expect, Page } from '@playwright/test';
import { AcreditacionesPage } from '../pages/AcreditacionesPage';
import { BitacoraPage } from '../pages/BitacoraPage';

/**
 * Story 1: Acreditaciones — Form Structure
 *
 * Tests the "Acreditarse en otra empresa" form:
 * - 3 radio operation options
 * - Conditional panel visibility (Block5 for new, Block6 for extend)
 * - EditGrid with NIT search, Buscar button, Empresa auto-fill
 * - DataGrid for extending existing accreditations
 * - Submit button
 *
 * Service ID: 2c918084887c7a8f01888b72010c7d6e
 * Form ID: 2c918084887c7a8f01888b720c097e0b
 */

test.use({
  storageState: '../../playwright-bpa/auth-state.json',
});

test.describe.serial('Story 1: Acreditaciones Form Structure', () => {
  let bitacoraPage: BitacoraPage;
  let acreditacionesPage: AcreditacionesPage;

  test.beforeEach(async ({ page }) => {
    bitacoraPage = new BitacoraPage(page);
    acreditacionesPage = new AcreditacionesPage(page);
  });

  test('1.1 — Navigate to Acreditaciones form and verify radio options are visible', async ({ page }) => {
    // Navigate to Bitacora dashboard
    await bitacoraPage.goto();
    await page.waitForLoadState('networkidle');

    // Open Acreditaciones from the Bitacora
    await acreditacionesPage.navigateFromBitacora();

    // Wait for form to load
    await page.waitForSelector('[ref="applicantBlock8"]', { timeout: 30000 });

    // Verify all 3 radio options are visible
    await acreditacionesPage.expectRadioOptionsVisible();

    // Verify labels
    await expect(acreditacionesPage.radioNuevaAcreditacion).toContainText('nueva acreditacion', { ignoreCase: true });
    await expect(acreditacionesPage.radioExtenderExistente).toContainText('Extender', { ignoreCase: true });
    await expect(acreditacionesPage.radioDelegarAcreditacion).toContainText('Delegar', { ignoreCase: true });

    await acreditacionesPage.screenshotWithLabel('acreditaciones-form-loaded');
  });

  test('1.2 — Selecting "Nueva acreditacion" shows Block5 with editgrid', async ({ page }) => {
    await bitacoraPage.goto();
    await acreditacionesPage.navigateFromBitacora();
    await page.waitForSelector('[ref="applicantBlock8"]', { timeout: 30000 });

    // Block5 should be hidden initially (no radio selected)
    // Select "Nueva acreditacion"
    await acreditacionesPage.selectNuevaAcreditacion();

    // Verify Block5 is visible
    await acreditacionesPage.expectBlock5Visible();

    // Verify the editgrid is present inside Block5
    await expect(acreditacionesPage.nuevasAcreditacionesGrid).toBeVisible();

    await acreditacionesPage.screenshotWithLabel('acreditaciones-nueva-block5-visible');
  });

  test('1.3 — Selecting "Extender existente" shows Block6 with datagrid', async ({ page }) => {
    await bitacoraPage.goto();
    await acreditacionesPage.navigateFromBitacora();
    await page.waitForSelector('[ref="applicantBlock8"]', { timeout: 30000 });

    // Select "Extender existente"
    await acreditacionesPage.selectExtenderExistente();

    // Verify Block6 is visible
    await acreditacionesPage.expectBlock6Visible();

    // Verify the datagrid is present inside Block6
    await expect(acreditacionesPage.extenderGrid).toBeVisible();

    await acreditacionesPage.screenshotWithLabel('acreditaciones-extender-block6-visible');
  });

  test('1.4 — EditGrid row has NIT search, Buscar, Empresa, and Confirmar fields', async ({ page }) => {
    await bitacoraPage.goto();
    await acreditacionesPage.navigateFromBitacora();
    await page.waitForSelector('[ref="applicantBlock8"]', { timeout: 30000 });

    // Select nueva acreditacion to show the editgrid
    await acreditacionesPage.selectNuevaAcreditacion();

    // Add a new row
    await acreditacionesPage.addNewAccreditationRow();

    // Verify the row fields
    await expect(acreditacionesPage.nitField).toBeVisible();
    await expect(acreditacionesPage.buscarButton).toBeVisible();
    await expect(acreditacionesPage.empresaField).toBeVisible();
    await expect(acreditacionesPage.confirmarCheckbox).toBeVisible();

    await acreditacionesPage.screenshotWithLabel('acreditaciones-editgrid-row-fields');
  });

  test('1.5 — Submit button (Enviar) is present', async ({ page }) => {
    await bitacoraPage.goto();
    await acreditacionesPage.navigateFromBitacora();
    await page.waitForSelector('[ref="applicantBlock8"]', { timeout: 30000 });

    // Verify submit button exists
    await acreditacionesPage.expectSubmitButtonPresent();

    await acreditacionesPage.screenshotWithLabel('acreditaciones-submit-button');
  });
});
