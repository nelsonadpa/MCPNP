import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Permisos Eventuales (PE) form (2c918084887c7a8f01887c99ed2a6fd5)
 *
 * 140 components, 16 bots, 30+ determinants.
 * Covers: auto-populated Bitacora fields, operation data, products,
 * modification tabs, fundamentacion, contact, and submission.
 *
 * SELECTOR STRATEGY:
 * Cuba forms use `.formio-component-{key}` class selectors on wrapper divs.
 * The `[ref="{key}"]` attribute selectors exist but are less reliable.
 * We use `.formio-component-{key}` as primary, `[ref="{key}"]` as fallback.
 *
 * VERIFICATION STATUS:
 * - [VERIFIED] = confirmed working in PE E2E tests (Nuevo + Modificar)
 * - [UNVERIFIED] = from BPA component list, not yet tested in E2E
 */

/** Helper: build a locator preferring .formio-component-{key}, falling back to [ref="{key}"] */
function fc(page: Page, key: string, suffix = ''): Locator {
  return page.locator(`.formio-component-${key}${suffix}, [ref="${key}"]${suffix}`);
}

export class PermisosEventualesPage {
  readonly page: Page;

  // ─── Top-level Panels ─────────────────────────────────────────────
  readonly block10Bitacora: Locator;      // Hidden Bitacora data [VERIFIED]
  readonly block7Empresa: Locator;        // Su empresa seleccionada (mustache panel) [VERIFIED]
  readonly block8Operacion: Locator;      // Datos de la operacion (nuevos) [VERIFIED]
  readonly block18Productos: Locator;     // Lista de productos (nuevos) [VERIFIED]
  readonly tabsFacultades: Locator;       // Tabs for modification flow [VERIFIED]
  readonly block9Fundamentacion: Locator; // Fundamentacion + docs [VERIFIED]
  readonly block3Contacto: Locator;       // Elaborado por [VERIFIED]
  readonly block15Confirmacion: Locator;  // Confirmation checkbox [VERIFIED]
  readonly submitButton: Locator;         // Enviar [VERIFIED]

  // ─── Block10: Bitacora Hidden Fields ──────────────────────────────
  readonly statusLlegaDeBitacora: Locator;     // [VERIFIED]
  readonly queQuiereHacer: Locator;            // [VERIFIED]
  readonly nombreEmpresa: Locator;             // [UNVERIFIED]
  readonly nitField: Locator;                  // [UNVERIFIED]
  readonly empresaDelMariel: Locator;          // [UNVERIFIED]
  readonly contadorEventuales: Locator;        // [UNVERIFIED]
  readonly contadorProductosNuevos: Locator;   // [UNVERIFIED]
  readonly solicitudNumero: Locator;           // [UNVERIFIED]
  readonly servicioField: Locator;             // [UNVERIFIED]
  readonly fechaSolicitud: Locator;            // [UNVERIFIED]

  // ─── Block7: Empresa Panel ────────────────────────────────────────
  readonly empresasMustache: Locator;          // [VERIFIED]

  // ─── Block8: Operation Data (New Permit — PE Nuevo) ───────────────
  readonly tipoDeOperacion: Locator;      // Import/Export select [VERIFIED]
  readonly regimenEspecial: Locator;      // Condicion de la operacion [VERIFIED]
  readonly observaciones: Locator;        // [VERIFIED]
  readonly fechaExpiracion: Locator;      // [VERIFIED]

  // Import fields (visible when operacion = import) [VERIFIED]
  readonly paisDeOrigen: Locator;
  readonly paisDeEmbarque: Locator;
  readonly proveedorExtranjero: Locator;
  readonly clienteNacional: Locator;
  readonly gestionNoEstatalImport: Locator;

  // Export fields (visible when operacion = export) [VERIFIED]
  readonly paisDeDestino: Locator;
  readonly clienteExtranjero: Locator;
  readonly proveedorNacional: Locator;
  readonly gestionNoEstatalExport: Locator;

  // ─── Block18: Products DataGrid (New Permit) ──────────────────────
  readonly productsGrid: Locator;         // applicantDataGridNuevonuevo [VERIFIED]
  readonly productCapitulo: Locator;      // applicantSeccion [VERIFIED]
  readonly productSubpartida: Locator;    // applicantProducto [VERIFIED]
  readonly productDescripcion: Locator;   // applicantDescripcion5 [VERIFIED]
  readonly productUm: Locator;            // applicantUm [VERIFIED]
  readonly productValor: Locator;         // applicantValor [VERIFIED]
  readonly productCantidad: Locator;      // applicantCantidad [VERIFIED]
  readonly valorTotal: Locator;           // [VERIFIED]

  // ─── TabsFacultades: Modification Flow ────────────────────────────
  readonly tabOperacionPrevia: Locator;     // Tab 1: Operacion previamente autorizada [VERIFIED]
  readonly tabModificaciones: Locator;      // Tab 2: Modificaciones solicitadas [VERIFIED]

  // Tab 1: Existing operation data (read-only, populated from permit)
  readonly existingOperacion: Locator;         // applicantOperacion [VERIFIED]
  readonly existingRegimenEspecial: Locator;   // applicantRegimenEspecial2 [VERIFIED]
  readonly existingValidHasta: Locator;        // applicantValidHasta [VERIFIED]

  // Tab 1: Existing products datagrid
  readonly existingProductsGrid: Locator;   // applicantDataGridNuevonuevo3 [VERIFIED]
  readonly existingValorTotal: Locator;     // applicantValotTotal (typo is in BPA) [UNVERIFIED]

  // Tab 2: Modified operation fields
  // NOTE: Some of these are DISABLED with synthetic permit data but editable with real permits
  readonly modOperacion: Locator;              // applicantOperacion2 (select) [VERIFIED]
  readonly modRegimenEspecial: Locator;        // applicantRegimenEspecial3 (select) [VERIFIED]
  readonly modValidoHasta: Locator;            // applicantValidoHasta (datetime) [VERIFIED]
  readonly modNumeroDeContrato: Locator;       // applicantNumeroDeContrato2 (textfield) [VERIFIED]
  readonly modNumeroDeFactura: Locator;        // applicantNumeroDeFacturaODonacion2 (textfield) [VERIFIED]
  readonly modCantidadDeEmbarques: Locator;    // applicantCantidadDeEmbarques2 (number) [VERIFIED]
  readonly modFechaUltimoEmbarque: Locator;    // applicantFechaDelUltimoEmbarque2 (datetime) [VERIFIED]

  // Tab 2: Modified products datagrid
  readonly modifiedProductsGrid: Locator;      // applicantDataGridNuevonuevo4 [VERIFIED]
  readonly modProductSeccion: Locator;         // applicantSeccion4 [VERIFIED]
  readonly modProductProducto: Locator;        // applicantProducto4 [VERIFIED]
  readonly modProductDescripcion: Locator;     // applicantDescripcion [VERIFIED]
  readonly modProductUm: Locator;              // applicantUm3 [VERIFIED]
  readonly modProductValor: Locator;           // applicantValor3 [VERIFIED]
  readonly modProductCantidad: Locator;        // applicantCantidad3 [VERIFIED]

  // ─── Block9: Fundamentacion ───────────────────────────────────────
  readonly fundamentacion: Locator;            // [VERIFIED]
  readonly documentoFundamentacion: Locator;   // [UNVERIFIED]
  readonly descargarCartaBtn: Locator;         // [UNVERIFIED]
  readonly cartaMarielUpload: Locator;         // [UNVERIFIED]

  // ─── Block3: Contact ──────────────────────────────────────────────
  readonly elaboradoPor: Locator;   // [VERIFIED]
  readonly telefono: Locator;       // [VERIFIED]
  readonly email: Locator;          // [VERIFIED]

  // ─── Block15: Confirmation ────────────────────────────────────────
  readonly confirmCheckbox: Locator; // [VERIFIED]

  // ─── Misc ─────────────────────────────────────────────────────────
  readonly retryProductListBtn: Locator; // [UNVERIFIED]

  constructor(page: Page) {
    this.page = page;

    // Top-level panels
    this.block10Bitacora = fc(page, 'applicantBlock10');
    this.block7Empresa = fc(page, 'applicantBlock7');
    this.block8Operacion = fc(page, 'applicantBlock8');
    this.block18Productos = fc(page, 'applicantBlock18');
    this.tabsFacultades = fc(page, 'applicantTabsFacultades');
    this.block9Fundamentacion = fc(page, 'applicantBlock9');
    this.block3Contacto = fc(page, 'applicantBlock3');
    this.block15Confirmacion = fc(page, 'applicantBlock15');
    this.submitButton = page.locator('.formio-component-applicantValidateTheForm button, [ref="applicantValidateTheForm"] button');

    // Block10: Bitacora hidden fields
    this.statusLlegaDeBitacora = fc(page, 'applicantStatusLlegaDeLaBitacora');
    this.queQuiereHacer = fc(page, 'applicantQueQuiereHacer');
    this.nombreEmpresa = fc(page, 'applicantNombreDeLaEmpresa4');
    this.nitField = fc(page, 'applicantNit3');
    this.empresaDelMariel = fc(page, 'applicantPermisoEventual2');
    this.contadorEventuales = fc(page, 'applicantContadorEventuales');
    this.contadorProductosNuevos = fc(page, 'applicantContadorProductosNuevos');
    this.solicitudNumero = fc(page, 'applicantSolicitud');
    this.servicioField = fc(page, 'applicantServicio');
    this.fechaSolicitud = fc(page, 'applicantFechaDeLaSolicitud');

    // Block7: Empresa mustache panel
    this.empresasMustache = fc(page, 'applicantEmpresas');

    // Block8: New operation data
    this.tipoDeOperacion = fc(page, 'applicantTipoDeOperacion2');
    this.regimenEspecial = fc(page, 'applicantRegimenEspecial');
    this.observaciones = fc(page, 'applicantObservaciones', ' input');
    this.fechaExpiracion = fc(page, 'applicantFechaDeExpiracion2');

    // Import fields
    this.paisDeOrigen = fc(page, 'applicantPaisDeOrigen');
    this.paisDeEmbarque = fc(page, 'applicantPaisDeEmbarque');
    this.proveedorExtranjero = fc(page, 'applicantProveedorExtranjero3', ' input');
    this.clienteNacional = fc(page, 'applicantClienteNacional', ' input');
    this.gestionNoEstatalImport = fc(page, 'applicantFormaDeGestionNoEstatal2');

    // Export fields
    this.paisDeDestino = fc(page, 'applicantPaisDeOrigen2'); // Key says Origen, is actually Destino!
    this.clienteExtranjero = fc(page, 'applicantClienteExtranjero', ' input');
    this.proveedorNacional = fc(page, 'applicantProveedorNacional', ' input');
    this.gestionNoEstatalExport = fc(page, 'applicantFormaDeGestionNoEstatal');

    // Block18: Products datagrid (PE Nuevo)
    this.productsGrid = fc(page, 'applicantDataGridNuevonuevo');
    this.productCapitulo = fc(page, 'applicantSeccion');
    this.productSubpartida = fc(page, 'applicantProducto');
    this.productDescripcion = fc(page, 'applicantDescripcion5', ' input');
    this.productUm = fc(page, 'applicantUm', ' input');
    this.productValor = fc(page, 'applicantValor', ' input');
    this.productCantidad = fc(page, 'applicantCantidad', ' input');
    this.valorTotal = fc(page, 'applicantValorTotal');

    // TabsFacultades tab headers
    this.tabOperacionPrevia = fc(page, 'applicantTabsFacultadesoperacionPreviamenteAutorizada');
    this.tabModificaciones = fc(page, 'applicantTabsFacultadesmodificacionesSolicitadas');

    // Tab 1: Existing operation data (read-only)
    this.existingOperacion = fc(page, 'applicantOperacion');
    this.existingRegimenEspecial = fc(page, 'applicantRegimenEspecial2');
    this.existingValidHasta = fc(page, 'applicantValidHasta');

    // Tab 1: Existing products
    this.existingProductsGrid = fc(page, 'applicantDataGridNuevonuevo3');
    this.existingValorTotal = fc(page, 'applicantValotTotal'); // Note: typo "Valot" is in BPA

    // Tab 2: Modified operation fields
    // NOTE: Operacion2, Contrato, Factura, Embarques are DISABLED with synthetic permit but editable with real permit
    this.modOperacion = fc(page, 'applicantOperacion2');
    this.modRegimenEspecial = fc(page, 'applicantRegimenEspecial3');
    this.modValidoHasta = fc(page, 'applicantValidoHasta');
    this.modNumeroDeContrato = fc(page, 'applicantNumeroDeContrato2', ' input');
    this.modNumeroDeFactura = fc(page, 'applicantNumeroDeFacturaODonacion2', ' input');
    this.modCantidadDeEmbarques = fc(page, 'applicantCantidadDeEmbarques2', ' input');
    this.modFechaUltimoEmbarque = fc(page, 'applicantFechaDelUltimoEmbarque2');

    // Tab 2: Modified products datagrid + columns
    this.modifiedProductsGrid = fc(page, 'applicantDataGridNuevonuevo4');
    this.modProductSeccion = fc(page, 'applicantSeccion4');
    this.modProductProducto = fc(page, 'applicantProducto4');
    this.modProductDescripcion = fc(page, 'applicantDescripcion', ' input');
    this.modProductUm = fc(page, 'applicantUm3', ' input');
    this.modProductValor = fc(page, 'applicantValor3', ' input');
    this.modProductCantidad = fc(page, 'applicantCantidad3', ' input');

    // Block9: Fundamentacion
    this.fundamentacion = fc(page, 'applicantFundamentacion', ' textarea');
    this.documentoFundamentacion = fc(page, 'applicantDocumentoQueAvaleLaFundamentacion');
    this.descargarCartaBtn = page.locator('.formio-component-applicantDescargarCarta button, [ref="applicantDescargarCarta"] button');
    this.cartaMarielUpload = fc(page, 'applicantSubirLaCartaAvalDeLaZonaMariel');

    // Block3: Contact info
    this.elaboradoPor = fc(page, 'applicantElaboradoPor', ' input');
    this.telefono = fc(page, 'applicantTelefono', ' input');
    this.email = fc(page, 'applicantEmail', ' input');

    // Block15: Confirmation
    this.confirmCheckbox = fc(page, 'applicantCheckbox2');

    // Misc
    this.retryProductListBtn = page.locator('.formio-component-applicantPorqueNoVienenDatos button, [ref="applicantPorqueNoVienenDatos"] button');
  }

  // ─── Navigation ─────────────────────────────────────────────────

  /**
   * Wait for PE form to fully load after being opened from Bitacora.
   * Checks that the key panels are present.
   */
  async waitForFormLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for the empresa panel or the operation panel to be visible
    await this.page.waitForSelector(
      '.formio-component-applicantBlock7, .formio-component-applicantBlock8, [ref="applicantBlock7"], [ref="applicantBlock8"]',
      { timeout: 30000 }
    );
  }

  // ─── Hidden Field Value Extraction ──────────────────────────────

  /**
   * Get the value of a hidden radio field via its input.
   * Radio fields in formio store the value in a checked radio input.
   */
  async getRadioValue(locator: Locator): Promise<string | null> {
    const checkedInput = locator.locator('input[type="radio"]:checked');
    if (await checkedInput.count() > 0) {
      return await checkedInput.getAttribute('value');
    }
    return null;
  }

  /**
   * Get the value of a hidden text input.
   */
  async getTextFieldValue(locator: Locator): Promise<string> {
    const input = locator.locator('input').first();
    return await input.inputValue();
  }

  async getStatusLlegaDeBitacora(): Promise<string | null> {
    return this.getRadioValue(this.statusLlegaDeBitacora);
  }

  async getQueQuiereHacer(): Promise<string | null> {
    return this.getRadioValue(this.queQuiereHacer);
  }

  async getNombreEmpresa(): Promise<string> {
    return this.getTextFieldValue(this.nombreEmpresa);
  }

  async getNit(): Promise<string> {
    return this.getTextFieldValue(this.nitField);
  }

  // ─── Form Filling ───────────────────────────────────────────────

  async fillFundamentacion(text: string) {
    await this.fundamentacion.fill(text);
  }

  async fillContactInfo(data: { elaboradoPor: string; telefono: string; email: string }) {
    await this.elaboradoPor.fill(data.elaboradoPor);
    await this.telefono.fill(data.telefono);
    await this.email.fill(data.email);
  }

  async checkConfirmation() {
    const checkbox = this.confirmCheckbox.locator('input[type="checkbox"]').first();
    await checkbox.check();
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Tab Navigation (Modification Flow) ─────────────────────────

  async clickTabOperacionPrevia() {
    await this.tabOperacionPrevia.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickTabModificaciones() {
    await this.tabModificaciones.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Assertions ─────────────────────────────────────────────────

  async expectEmpresaPanelVisible() {
    await expect(this.block7Empresa).toBeVisible();
  }

  async expectOperationFieldsVisible() {
    await expect(this.tipoDeOperacion).toBeVisible();
    await expect(this.regimenEspecial).toBeVisible();
  }

  async expectFundamentacionVisible() {
    await expect(this.fundamentacion).toBeVisible();
  }

  async expectContactFieldsVisible() {
    await expect(this.elaboradoPor).toBeVisible();
    await expect(this.telefono).toBeVisible();
    await expect(this.email).toBeVisible();
  }

  async expectConfirmationVisible() {
    await expect(this.confirmCheckbox).toBeVisible();
  }

  async expectSubmitButtonPresent() {
    await expect(this.submitButton).toBeVisible();
  }

  async expectModificationTabsVisible() {
    await expect(this.tabsFacultades).toBeVisible();
  }

  /** Assert Tab 2 modification fields are visible (may be disabled) */
  async expectModificationFieldsVisible() {
    await expect(this.modOperacion).toBeVisible();
    await expect(this.modRegimenEspecial).toBeVisible();
    await expect(this.modValidoHasta).toBeVisible();
    await expect(this.modifiedProductsGrid).toBeVisible();
  }

  async screenshotWithLabel(label: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${label}.png`,
      fullPage: false,
    });
  }
}
