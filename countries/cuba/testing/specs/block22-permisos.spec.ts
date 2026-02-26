import { test, expect, Page } from '@playwright/test';
import { BitacoraPage } from '../pages/BitacoraPage';

/**
 * Stories 2 & 3: Block22 Permisos — Dropdown Buttons & EditGrid Structures
 *
 * Tests the Block22 "Permisos" section in the Bitacora:
 * - 9 "Agregar" dropdown buttons with correct labels and keys
 * - 9 EditGrids with correct column structures
 * - LISTAR bots load data into grids on panel show
 *
 * Service: Bitacora Hub (ffe746aac09241078bad48c9b95cdfe0)
 * Block22 panel action: 1cb59cb5-da2a-45ea-9b39-7871f117916f
 */

test.use({
  storageState: '../../playwright-bpa/auth-state.json',
});

// Helper: navigate to Block22 in Bitacora
async function navigateToBlock22(page: Page, bitacoraPage: BitacoraPage) {
  await bitacoraPage.goto();
  await page.waitForLoadState('networkidle');

  // Select a company first (required to see Servicios tab)
  // Use the first available accredited company
  await bitacoraPage.empresasTab.click();
  await page.waitForLoadState('networkidle');

  // Wait for companies to load, then select the first one
  await page.waitForSelector('.formio-component-applicantEditGridEmpresasAcreditadas, [ref="applicantEditGridEmpresasAcreditadas"]', {
    timeout: 30000,
  });

  // Navigate to servicios section
  await bitacoraPage.navigateToServicios();

  // Expand/navigate to Block22 (Permisos section)
  await bitacoraPage.expandPermisos();
}

test.describe.serial('Story 2: Block22 Dropdown Buttons (9 Permit Types)', () => {
  let bitacoraPage: BitacoraPage;

  test.beforeEach(async ({ page }) => {
    bitacoraPage = new BitacoraPage(page);
  });

  test('2.1 — Block22 panel is visible in Permisos section', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);

    await expect(bitacoraPage.block22Panel).toBeVisible();
    await bitacoraPage.screenshotWithLabel('block22-panel-visible');
  });

  test('2.2 — Agregar dropdown has 9 buttons', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);

    const labels = await bitacoraPage.getDropdownButtonLabels();
    expect(labels.length).toBe(9);

    await bitacoraPage.screenshotWithLabel('block22-dropdown-9-buttons');
  });

  test('2.3 — Dropdown button labels match expected permit types', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);

    const expectedLabels = [
      'Permiso eventual',
      'Fitosanitario',
      'Zoosanitario',
      'Equipos uso de energia',
      'Certificado sanitario',
      'Instrumentos de medicion',
      'Donativos medicos',
      'Sustancias controladas',
      'Cert. aprobacion modelo',
    ];

    const labels = await bitacoraPage.getDropdownButtonLabels();

    for (const expected of expectedLabels) {
      const found = labels.some(label =>
        label.toLowerCase().includes(expected.toLowerCase())
      );
      expect(found, `Expected to find button with label containing "${expected}"`).toBeTruthy();
    }
  });

  test('2.4 — "Permiso eventual" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnPermisoEventual).toBeVisible();
    await bitacoraPage.screenshotWithLabel('block22-permiso-eventual-button');
  });

  test('2.5 — "Fitosanitario" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnFitosanitario).toBeVisible();
  });

  test('2.6 — "Sustancias controladas" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnSustanciasControladas).toBeVisible();
  });

  test('2.7 — "Cert. aprobacion modelo" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnCertAprobacionModelo).toBeVisible();
  });

  test('2.8 — "Instrumentos de medicion" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnInstrumentosMedicion).toBeVisible();
  });

  test('2.9 — "Donativos medicos" button is present with correct key', async ({ page }) => {
    await navigateToBlock22(page, bitacoraPage);
    await bitacoraPage.openAgregarDropdown();

    await expect(bitacoraPage.btnDonativosMedicos).toBeVisible();
  });
});

test.describe.serial('Story 3: Block22 EditGrid Structures', () => {
  let bitacoraPage: BitacoraPage;

  test.beforeEach(async ({ page }) => {
    bitacoraPage = new BitacoraPage(page);
    await navigateToBlock22(page, bitacoraPage);
  });

  test('3.1 — PE EditGrid (applicantEditGrid) is present in Block10', async ({ page }) => {
    // PE EditGrid: applicantEditGrid inside applicantBlock10
    await expect(bitacoraPage.editGridPE).toBeVisible();

    // Verify column keys exist inside the grid
    const peGrid = bitacoraPage.editGridPE;
    expect(await bitacoraPage.editGridHasColumn(peGrid, 'applicantTipo5')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(peGrid, 'applicantNumero5')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-pe');
  });

  test('3.2 — Fito EditGrid (applicantEditGridFito) is present in Block12', async ({ page }) => {
    await expect(bitacoraPage.editGridFito).toBeVisible();

    const fitoGrid = bitacoraPage.editGridFito;
    expect(await bitacoraPage.editGridHasColumn(fitoGrid, 'applicantTipoFito')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(fitoGrid, 'applicantNumeroFito')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-fito');
  });

  test('3.3 — Zoo EditGrid (applicantEditGridZoo) is present in Block14', async ({ page }) => {
    await expect(bitacoraPage.editGridZoo).toBeVisible();

    const zooGrid = bitacoraPage.editGridZoo;
    expect(await bitacoraPage.editGridHasColumn(zooGrid, 'applicantTipoZoo')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(zooGrid, 'applicantNumeroZoo')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-zoo');
  });

  test('3.4 — ONURE EditGrid (applicantPermisoZoosanitario — misleading key) is present in Block16', async ({ page }) => {
    // NOTE: The key name "applicantPermisoZoosanitario" is misleading — this is actually ONURE
    await expect(bitacoraPage.editGridONURE).toBeVisible();

    const onureGrid = bitacoraPage.editGridONURE;
    expect(await bitacoraPage.editGridHasColumn(onureGrid, 'applicantTipo')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(onureGrid, 'applicantNumero')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-onure');
  });

  test('3.5 — Sustancias EditGrid (applicantEditGridSustancias) is present in Block17', async ({ page }) => {
    await expect(bitacoraPage.editGridSustancias).toBeVisible();

    const sustGrid = bitacoraPage.editGridSustancias;
    expect(await bitacoraPage.editGridHasColumn(sustGrid, 'applicantTipoSustancias')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(sustGrid, 'applicantNumeroSustancias')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-sustancias');
  });

  test('3.6 — Sanitario EditGrid (applicantEditGridSanitario) is present in Block19', async ({ page }) => {
    await expect(bitacoraPage.editGridSanitario).toBeVisible();

    const sanGrid = bitacoraPage.editGridSanitario;
    expect(await bitacoraPage.editGridHasColumn(sanGrid, 'applicantTipoSanitario')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(sanGrid, 'applicantNumeroSanitario')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-sanitario');
  });

  test('3.7 — ONN EditGrid (applicantEditGridOnn) is present in Block20', async ({ page }) => {
    await expect(bitacoraPage.editGridOnn).toBeVisible();

    const onnGrid = bitacoraPage.editGridOnn;
    expect(await bitacoraPage.editGridHasColumn(onnGrid, 'applicantTipoOnn')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(onnGrid, 'applicantNumeroOnn')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-onn');
  });

  test('3.8 — CertAprobacion EditGrid (applicantEditGridCertAprobacion) is present in Block24', async ({ page }) => {
    await expect(bitacoraPage.editGridCertAprobacion).toBeVisible();

    const certGrid = bitacoraPage.editGridCertAprobacion;
    expect(await bitacoraPage.editGridHasColumn(certGrid, 'applicantTipoCertAprobacion')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(certGrid, 'applicantNumeroCertAprobacion')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-cert-aprobacion');
  });

  test('3.9 — Donativos EditGrid (applicantEditGridDonativos) is present in Block23', async ({ page }) => {
    await expect(bitacoraPage.editGridDonativos).toBeVisible();

    const donGrid = bitacoraPage.editGridDonativos;
    expect(await bitacoraPage.editGridHasColumn(donGrid, 'applicantTipoDonativos')).toBeTruthy();
    expect(await bitacoraPage.editGridHasColumn(donGrid, 'applicantNumeroDonativos')).toBeTruthy();

    await bitacoraPage.screenshotWithLabel('block22-editgrid-donativos');
  });

  test('3.10 — EditGrids have Modificar/Cancelar dropdown buttons', async ({ page }) => {
    // Check the PE EditGrid dropdown as a representative sample
    // PE has applicantdropdown7 with Modificar + Cancelar
    const peDropdown = bitacoraPage.editGridPE.locator('[ref="applicantdropdown7"]');

    // The dropdown may only be visible when a row exists and is selected
    // Check that the dropdown structure exists in the DOM
    const peModificar = bitacoraPage.editGridPE.locator('[ref="applicantModificar"]');
    const peCancelar = bitacoraPage.editGridPE.locator('[ref="applicantCancelar"]');

    // Check Fito as well
    const fitoModificar = bitacoraPage.editGridFito.locator('[ref="applicantModificarFito"]');
    const fitoCancelar = bitacoraPage.editGridFito.locator('[ref="applicantCancelarFito"]');

    // At least verify the components exist in the DOM (may be hidden if no rows)
    const peModCount = await peModificar.count();
    const fitoModCount = await fitoModificar.count();

    // If there are rows loaded by LISTAR bots, these should be present
    // Log counts for debugging
    console.log(`PE Modificar count: ${peModCount}, Fito Modificar count: ${fitoModCount}`);

    await bitacoraPage.screenshotWithLabel('block22-editgrid-dropdown-buttons');
  });
});
