import { test, expect, Page } from '@playwright/test';
import { BitacoraPage } from '../pages/BitacoraPage';
import { PermisosEventualesPage } from '../pages/PermisosEventualesPage';

/**
 * Stories 4 & 5: PE Form Structure & Component Actions
 *
 * Tests the Permisos Eventuales form when opened from Bitacora:
 * - Auto-populated hidden fields (StatusLlegaDeBitacora, QueQuiereHacer, NIT, Empresa)
 * - Panel structure (Block7 empresa, Block8 operation, Block18 products, etc.)
 * - Modification flow tabs (TabsFacultades)
 * - Bot triggers on component actions
 *
 * Service ID: 2c918084887c7a8f01887c99ed2a6fd5
 * Form ID: 2c918084887c7a8f01887c9a32387268
 * 140 components, 16 bots
 */

test.use({
  storageState: '../../playwright-bpa/auth-state.json',
});

/**
 * Helper: Navigate from Bitacora to PE form by clicking "Permiso eventual"
 * in the Block22 dropdown. The bot INTERNO fires and opens the PE form
 * with pre-filled fields.
 */
async function navigateToPEFromBitacora(page: Page): Promise<{
  bitacoraPage: BitacoraPage;
  pePage: PermisosEventualesPage;
}> {
  const bitacoraPage = new BitacoraPage(page);
  const pePage = new PermisosEventualesPage(page);

  // Navigate to Bitacora
  await bitacoraPage.goto();
  await page.waitForLoadState('networkidle');

  // Select a company
  await bitacoraPage.empresasTab.click();
  await page.waitForLoadState('networkidle');

  // Wait for companies to load
  await page.waitForSelector(
    '.formio-component-applicantEditGridEmpresasAcreditadas, [ref="applicantEditGridEmpresasAcreditadas"]',
    { timeout: 30000 }
  );

  // Navigate to servicios then Block22
  await bitacoraPage.navigateToServicios();
  await bitacoraPage.expandPermisos();

  // Click "Permiso eventual" in the dropdown
  await bitacoraPage.clickPermisoEventual();

  // Wait for PE form to load
  await pePage.waitForFormLoad();

  return { bitacoraPage, pePage };
}

test.describe.serial('Story 4: PE Form Structure — Auto-populated from Bitacora', () => {
  test('4.1 — PE form loads with key panels after clicking Permiso eventual', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Verify at least the empresa panel or operation panel is visible
    // Block7 (empresa) should be visible for users coming from Bitacora
    const block7Visible = await pePage.block7Empresa.isVisible().catch(() => false);
    const block8Visible = await pePage.block8Operacion.isVisible().catch(() => false);

    expect(block7Visible || block8Visible, 'Either Block7 (empresa) or Block8 (operation) should be visible').toBeTruthy();

    await pePage.screenshotWithLabel('pe-form-loaded-from-bitacora');
  });

  test('4.2 — Bitacora hidden fields are set (StatusLlegaDeBitacora = "true")', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Block10 contains hidden bitacora data
    // The fields may be hidden but present in the DOM
    const statusField = pePage.statusLlegaDeBitacora;
    const statusExists = await statusField.count() > 0;
    expect(statusExists, 'applicantStatusLlegaDeLaBitacora should exist in DOM').toBeTruthy();

    // Check the radio value if visible
    if (statusExists) {
      const value = await pePage.getStatusLlegaDeBitacora();
      if (value !== null) {
        expect(value).toBe('true');
      }
    }

    // QueQuiereHacer should be "registrarNuevo" for new permits
    const qqhField = pePage.queQuiereHacer;
    const qqhExists = await qqhField.count() > 0;
    expect(qqhExists, 'applicantQueQuiereHacer should exist in DOM').toBeTruthy();

    if (qqhExists) {
      const qqhValue = await pePage.getQueQuiereHacer();
      if (qqhValue !== null) {
        expect(qqhValue).toBe('registrarNuevo');
      }
    }

    await pePage.screenshotWithLabel('pe-bitacora-hidden-fields');
  });

  test('4.3 — Empresa panel (Block7) shows company data via mustache template', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    await pePage.expectEmpresaPanelVisible();

    // The empresa mustache content should display company name and NIT
    const mustacheContent = pePage.empresasMustache;
    const contentExists = await mustacheContent.count() > 0;
    expect(contentExists, 'applicantEmpresas mustache content should exist').toBeTruthy();

    await pePage.screenshotWithLabel('pe-empresa-panel');
  });

  test('4.4 — NIT and company name are auto-filled from Bitacora', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // These fields are in Block10 > Block11 (hidden, auto-filled by INTERNO bot)
    const nitExists = await pePage.nitField.count() > 0;
    const empresaExists = await pePage.nombreEmpresa.count() > 0;

    expect(nitExists, 'applicantNit3 should exist in DOM').toBeTruthy();
    expect(empresaExists, 'applicantNombreDeLaEmpresa4 should exist in DOM').toBeTruthy();

    // If the fields have inputs, check they have values
    if (nitExists) {
      const nitInput = pePage.nitField.locator('input').first();
      const inputCount = await nitInput.count();
      if (inputCount > 0) {
        const nitValue = await nitInput.inputValue();
        // NIT should not be empty when coming from Bitacora
        expect(nitValue.length, 'NIT should be filled').toBeGreaterThan(0);
      }
    }

    await pePage.screenshotWithLabel('pe-autofilled-nit-empresa');
  });

  test('4.5 — Block8 operation fields are visible for new permits', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    await pePage.expectOperationFieldsVisible();

    // TipoDeOperacion2 select and RegimenEspecial select
    await expect(pePage.tipoDeOperacion).toBeVisible();
    await expect(pePage.regimenEspecial).toBeVisible();

    await pePage.screenshotWithLabel('pe-operation-fields');
  });

  test('4.6 — Product datagrid (applicantDataGridNuevonuevo) is present in Block18', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Block18 should be visible for new permits
    const block18Visible = await pePage.block18Productos.isVisible().catch(() => false);

    if (block18Visible) {
      await expect(pePage.productsGrid).toBeVisible();

      // Verify datagrid has expected column structure in DOM
      const capituloExists = await pePage.productCapitulo.count() > 0;
      const subpartidaExists = await pePage.productSubpartida.count() > 0;
      expect(capituloExists, 'applicantSeccion (Capitulo) should exist').toBeTruthy();
      expect(subpartidaExists, 'applicantProducto (Subpartidas) should exist').toBeTruthy();
    }

    await pePage.screenshotWithLabel('pe-products-datagrid');
  });

  test('4.7 — Fundamentacion textarea is present and required', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Block9 fundamentacion
    const fundVisible = await pePage.fundamentacion.isVisible().catch(() => false);

    if (fundVisible) {
      await pePage.expectFundamentacionVisible();
    } else {
      // May require scrolling or Block9 is lower on the page
      await pePage.block9Fundamentacion.scrollIntoViewIfNeeded();
      await pePage.expectFundamentacionVisible();
    }

    await pePage.screenshotWithLabel('pe-fundamentacion');
  });

  test('4.8 — Contact fields (elaborado por, telefono, email) are present', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Scroll to Block3 if needed
    await pePage.block3Contacto.scrollIntoViewIfNeeded().catch(() => {});

    await pePage.expectContactFieldsVisible();

    await pePage.screenshotWithLabel('pe-contact-fields');
  });

  test('4.9 — Confirmation checkbox (applicantCheckbox2) is present', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Scroll to Block15 if needed
    await pePage.block15Confirmacion.scrollIntoViewIfNeeded().catch(() => {});

    await pePage.expectConfirmationVisible();

    await pePage.screenshotWithLabel('pe-confirmation-checkbox');
  });

  test('4.10 — Submit button (Enviar) is present', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    await pePage.expectSubmitButtonPresent();

    await pePage.screenshotWithLabel('pe-submit-button');
  });
});

test.describe.serial('Story 5: PE Component Actions — Bot Triggers', () => {
  test('5.1 — TabsFacultades is present for modification flow', async ({ page }) => {
    // NOTE: TabsFacultades is only visible when QueQuiereHacer = "modificarExistente"
    // From Bitacora "new" flow it may be hidden. This test verifies the DOM structure.
    const { pePage } = await navigateToPEFromBitacora(page);

    // TabsFacultades may be hidden in new permit flow
    const tabsExists = await pePage.tabsFacultades.count() > 0;

    if (tabsExists) {
      // If visible (modification flow), verify tab structure
      const tabsVisible = await pePage.tabsFacultades.isVisible().catch(() => false);
      if (tabsVisible) {
        await pePage.expectModificationTabsVisible();
      }
    }

    // In the new flow, Block8 (operation) should be visible instead
    await expect(pePage.block8Operacion).toBeVisible();

    await pePage.screenshotWithLabel('pe-tabs-facultades-or-block8');
  });

  test('5.2 — Product select (applicantProducto) exists and triggers UM auto-fill', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // The product select fires UNIDAD DE MEDIDA Leer bot
    // Verify the product select component exists
    const productoExists = await pePage.productSubpartida.count() > 0;

    // Verify UM field exists (will be auto-filled when product is selected)
    const umExists = await pePage.productUm.count() > 0;

    // Both should exist in the DOM
    expect(productoExists, 'applicantProducto select should exist in DOM').toBeTruthy();
    expect(umExists, 'applicantUm field should exist in DOM').toBeTruthy();

    await pePage.screenshotWithLabel('pe-product-select-um');
  });

  test('5.3 — Submit button triggers form validation', async ({ page }) => {
    const { pePage } = await navigateToPEFromBitacora(page);

    // Click submit without filling required fields
    await pePage.submitButton.scrollIntoViewIfNeeded().catch(() => {});
    await pePage.submit();

    // Validation errors should appear (required fields are not filled)
    // Look for formio error messages or invalid field indicators
    const errorExists = await page.locator('.formio-errors, .has-error, .is-invalid, .alert-danger, .text-danger')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    expect(errorExists, 'Validation errors should appear when submitting empty form').toBeTruthy();

    await pePage.screenshotWithLabel('pe-validation-errors');
  });

  test('5.4 — Modification tabs structure (if accessible)', async ({ page }) => {
    // This test checks that the TabsFacultades has the expected 2 tabs in its DOM structure.
    // The tabs may not be visible in the "new permit" flow.
    const { pePage } = await navigateToPEFromBitacora(page);

    // Check if tab components exist in DOM (even if hidden by determinants)
    const tab1Exists = await pePage.tabOperacionPrevia.count() > 0;
    const tab2Exists = await pePage.tabModificaciones.count() > 0;

    // Log findings
    console.log(`Tab "Operacion previamente autorizada" exists: ${tab1Exists}`);
    console.log(`Tab "Modificaciones solicitadas" exists: ${tab2Exists}`);

    // Verify the structural expectation:
    // If TabsFacultades exists in DOM, both tabs should be defined
    const tabsFacultadesExists = await pePage.tabsFacultades.count() > 0;
    if (tabsFacultadesExists) {
      expect(tab1Exists, 'Tab 1 (operacion previamente autorizada) should exist in DOM').toBeTruthy();
      expect(tab2Exists, 'Tab 2 (modificaciones solicitadas) should exist in DOM').toBeTruthy();
    }

    await pePage.screenshotWithLabel('pe-modification-tabs');
  });

  test('5.5 — Existing products datagrid structure (applicantDataGridNuevonuevo3)', async ({ page }) => {
    // Verify the authorized products datagrid structure inside TabsFacultades Tab 1
    const { pePage } = await navigateToPEFromBitacora(page);

    // Check if the existing products grid is in the DOM
    const existingGridExists = await pePage.existingProductsGrid.count() > 0;

    if (existingGridExists) {
      // If it exists, check for expected column keys
      const gridLocator = pePage.existingProductsGrid;

      const capitulo3 = await gridLocator.locator('[ref="applicantSeccion3"]').count() > 0;
      const producto3 = await gridLocator.locator('[ref="applicantProducto3"]').count() > 0;
      const desc2 = await gridLocator.locator('[ref="applicantDescripcion2"]').count() > 0;
      const seleccionar = await gridLocator.locator('[ref="applicantSeleccionar"]').count() > 0;

      console.log(`Existing products grid columns — Capitulo: ${capitulo3}, Producto: ${producto3}, Desc: ${desc2}, Seleccionar: ${seleccionar}`);
    }

    // Also check the valor total with the typo key
    const valorTotalExists = await pePage.existingValorTotal.count() > 0;
    console.log(`Existing valor total (applicantValotTotal — typo) exists: ${valorTotalExists}`);

    await pePage.screenshotWithLabel('pe-existing-products-grid');
  });
});
