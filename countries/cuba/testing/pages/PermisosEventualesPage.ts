import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Permisos Eventuales (PE) form (2c918084887c7a8f01887c99ed2a6fd5)
 *
 * 140 components, 16 bots, 30+ determinants.
 * Covers: auto-populated Bitacora fields, operation data, products,
 * modification tabs, fundamentacion, contact, and submission.
 */
export class PermisosEventualesPage {
  readonly page: Page;

  // ─── Top-level Panels ─────────────────────────────────────────────
  readonly block10Bitacora: Locator;      // Hidden Bitacora data
  readonly block7Empresa: Locator;        // Su empresa seleccionada (mustache panel)
  readonly block8Operacion: Locator;      // Datos de la operacion (nuevos)
  readonly block18Productos: Locator;     // Lista de productos (nuevos)
  readonly tabsFacultades: Locator;       // Tabs for modification flow
  readonly block9Fundamentacion: Locator; // Fundamentacion + docs
  readonly block3Contacto: Locator;       // Elaborado por
  readonly block15Confirmacion: Locator;  // Confirmation checkbox
  readonly submitButton: Locator;         // Enviar

  // ─── Block10: Bitacora Hidden Fields ──────────────────────────────
  readonly statusLlegaDeBitacora: Locator;
  readonly queQuiereHacer: Locator;
  readonly nombreEmpresa: Locator;
  readonly nitField: Locator;
  readonly empresaDelMariel: Locator;
  readonly contadorEventuales: Locator;
  readonly contadorProductosNuevos: Locator;
  readonly solicitudNumero: Locator;
  readonly servicioField: Locator;
  readonly fechaSolicitud: Locator;

  // ─── Block7: Empresa Panel ────────────────────────────────────────
  readonly empresasMustache: Locator;

  // ─── Block8: Operation Data (New Permit) ──────────────────────────
  readonly tipoDeOperacion: Locator;      // Import/Export select
  readonly regimenEspecial: Locator;      // Condicion de la operacion
  readonly observaciones: Locator;
  readonly fechaExpiracion: Locator;

  // Import fields (visible when operacion = import)
  readonly paisDeOrigen: Locator;
  readonly paisDeEmbarque: Locator;
  readonly proveedorExtranjero: Locator;
  readonly clienteNacional: Locator;
  readonly gestionNoEstatalImport: Locator;

  // Export fields (visible when operacion = export)
  readonly paisDeDestino: Locator;
  readonly clienteExtranjero: Locator;
  readonly proveedorNacional: Locator;
  readonly gestionNoEstatalExport: Locator;

  // ─── Block18: Products DataGrid (New Permit) ──────────────────────
  readonly productsGrid: Locator;         // applicantDataGridNuevonuevo
  readonly productCapitulo: Locator;
  readonly productSubpartida: Locator;
  readonly productDescripcion: Locator;
  readonly productUm: Locator;
  readonly productValor: Locator;
  readonly productCantidad: Locator;
  readonly valorTotal: Locator;

  // ─── TabsFacultades: Modification Flow ────────────────────────────
  readonly tabOperacionPrevia: Locator;     // Tab 1: Operacion previamente autorizada
  readonly tabModificaciones: Locator;      // Tab 2: Modificaciones solicitadas

  // Tab 1: Existing operation data
  readonly existingOperacion: Locator;
  readonly existingRegimenEspecial: Locator;
  readonly existingValidHasta: Locator;

  // Tab 1: Existing products datagrid
  readonly existingProductsGrid: Locator;   // applicantDataGridNuevonuevo3
  readonly existingValorTotal: Locator;

  // Tab 2: Modified products datagrid
  readonly modifiedProductsGrid: Locator;   // applicantDataGridNuevonuevo4

  // ─── Block9: Fundamentacion ───────────────────────────────────────
  readonly fundamentacion: Locator;
  readonly documentoFundamentacion: Locator;
  readonly descargarCartaBtn: Locator;
  readonly cartaMarielUpload: Locator;

  // ─── Block3: Contact ──────────────────────────────────────────────
  readonly elaboradoPor: Locator;
  readonly telefono: Locator;
  readonly email: Locator;

  // ─── Block15: Confirmation ────────────────────────────────────────
  readonly confirmCheckbox: Locator;

  // ─── Misc ─────────────────────────────────────────────────────────
  readonly retryProductListBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top-level panels
    this.block10Bitacora = page.locator('[ref="applicantBlock10"]');
    this.block7Empresa = page.locator('[ref="applicantBlock7"]');
    this.block8Operacion = page.locator('[ref="applicantBlock8"]');
    this.block18Productos = page.locator('[ref="applicantBlock18"]');
    this.tabsFacultades = page.locator('[ref="applicantTabsFacultades"]');
    this.block9Fundamentacion = page.locator('[ref="applicantBlock9"]');
    this.block3Contacto = page.locator('[ref="applicantBlock3"]');
    this.block15Confirmacion = page.locator('[ref="applicantBlock15"]');
    this.submitButton = page.locator('[ref="applicantValidateTheForm"] button, .formio-component-applicantValidateTheForm button');

    // Block10: Bitacora hidden fields
    this.statusLlegaDeBitacora = page.locator('[ref="applicantStatusLlegaDeLaBitacora"]');
    this.queQuiereHacer = page.locator('[ref="applicantQueQuiereHacer"]');
    this.nombreEmpresa = page.locator('[ref="applicantNombreDeLaEmpresa4"]');
    this.nitField = page.locator('[ref="applicantNit3"]');
    this.empresaDelMariel = page.locator('[ref="applicantPermisoEventual2"]');
    this.contadorEventuales = page.locator('[ref="applicantContadorEventuales"]');
    this.contadorProductosNuevos = page.locator('[ref="applicantContadorProductosNuevos"]');
    this.solicitudNumero = page.locator('[ref="applicantSolicitud"]');
    this.servicioField = page.locator('[ref="applicantServicio"]');
    this.fechaSolicitud = page.locator('[ref="applicantFechaDeLaSolicitud"]');

    // Block7: Empresa mustache panel
    this.empresasMustache = page.locator('[ref="applicantEmpresas"]');

    // Block8: New operation data
    this.tipoDeOperacion = page.locator('[ref="applicantTipoDeOperacion2"]');
    this.regimenEspecial = page.locator('[ref="applicantRegimenEspecial"]');
    this.observaciones = page.locator('[ref="applicantObservaciones"] input');
    this.fechaExpiracion = page.locator('[ref="applicantFechaDeExpiracion2"]');

    // Import fields
    this.paisDeOrigen = page.locator('[ref="applicantPaisDeOrigen"]');
    this.paisDeEmbarque = page.locator('[ref="applicantPaisDeEmbarque"]');
    this.proveedorExtranjero = page.locator('[ref="applicantProveedorExtranjero3"] input');
    this.clienteNacional = page.locator('[ref="applicantClienteNacional"] input');
    this.gestionNoEstatalImport = page.locator('[ref="applicantFormaDeGestionNoEstatal2"]');

    // Export fields
    this.paisDeDestino = page.locator('[ref="applicantPaisDeOrigen2"]'); // Key says Origen, is actually Destino!
    this.clienteExtranjero = page.locator('[ref="applicantClienteExtranjero"] input');
    this.proveedorNacional = page.locator('[ref="applicantProveedorNacional"] input');
    this.gestionNoEstatalExport = page.locator('[ref="applicantFormaDeGestionNoEstatal"]');

    // Block18: Products datagrid
    this.productsGrid = page.locator('[ref="applicantDataGridNuevonuevo"]');
    this.productCapitulo = page.locator('[ref="applicantSeccion"]');
    this.productSubpartida = page.locator('[ref="applicantProducto"]');
    this.productDescripcion = page.locator('[ref="applicantDescripcion5"] input');
    this.productUm = page.locator('[ref="applicantUm"] input');
    this.productValor = page.locator('[ref="applicantValor"] input');
    this.productCantidad = page.locator('[ref="applicantCantidad"] input');
    this.valorTotal = page.locator('[ref="applicantValorTotal"]');

    // TabsFacultades tabs
    this.tabOperacionPrevia = page.locator('[ref="applicantTabsFacultadesoperacionPreviamenteAutorizada"]');
    this.tabModificaciones = page.locator('[ref="applicantTabsFacultadesmodificacionesSolicitadas"]');

    // Tab 1: Existing operation data
    this.existingOperacion = page.locator('[ref="applicantOperacion"]');
    this.existingRegimenEspecial = page.locator('[ref="applicantRegimenEspecial2"]');
    this.existingValidHasta = page.locator('[ref="applicantValidHasta"]');

    // Tab 1: Existing products
    this.existingProductsGrid = page.locator('[ref="applicantDataGridNuevonuevo3"]');
    this.existingValorTotal = page.locator('[ref="applicantValotTotal"]'); // Note: typo "Valot" is in BPA

    // Tab 2: Modified products
    this.modifiedProductsGrid = page.locator('[ref="applicantDataGridNuevonuevo4"]');

    // Block9: Fundamentacion
    this.fundamentacion = page.locator('[ref="applicantFundamentacion"] textarea');
    this.documentoFundamentacion = page.locator('[ref="applicantDocumentoQueAvaleLaFundamentacion"]');
    this.descargarCartaBtn = page.locator('[ref="applicantDescargarCarta"] button, .formio-component-applicantDescargarCarta button');
    this.cartaMarielUpload = page.locator('[ref="applicantSubirLaCartaAvalDeLaZonaMariel"]');

    // Block3: Contact info
    this.elaboradoPor = page.locator('[ref="applicantElaboradoPor"] input');
    this.telefono = page.locator('[ref="applicantTelefono"] input');
    this.email = page.locator('[ref="applicantEmail"] input');

    // Block15: Confirmation
    this.confirmCheckbox = page.locator('[ref="applicantCheckbox2"]');

    // Misc
    this.retryProductListBtn = page.locator('[ref="applicantPorqueNoVienenDatos"] button, .formio-component-applicantPorqueNoVienenDatos button');
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
      '[ref="applicantBlock7"], [ref="applicantBlock8"]',
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

  async screenshotWithLabel(label: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${label}.png`,
      fullPage: false,
    });
  }
}
