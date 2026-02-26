import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Acreditaciones form (2c918084887c7a8f01888b72010c7d6e)
 *
 * Covers: Radio operation selection, NIT search, empresa auto-fill,
 * new accreditation editgrid, extend accreditation datagrid.
 */
export class AcreditacionesPage {
  readonly page: Page;

  // ─── Top-level Panels ─────────────────────────────────────────────
  readonly block8Panel: Locator;      // Operation selection + hidden counters
  readonly block5Panel: Locator;      // Nuevas acreditaciones
  readonly block6Panel: Locator;      // Extender acreditaciones existentes
  readonly submitButton: Locator;     // Enviar

  // ─── Radio Options (inside Block8 > Block2 > Columns9) ───────────
  readonly radioNuevaAcreditacion: Locator;
  readonly radioExtenderExistente: Locator;
  readonly radioDelegarAcreditacion: Locator;

  // ─── Hidden Status Field ──────────────────────────────────────────
  readonly statusLlegaDeBitacora: Locator;

  // ─── Counter Fields (hidden/auto) ─────────────────────────────────
  readonly contadorExistentes: Locator;
  readonly extensionesSolicitadas: Locator;
  readonly nuevasSolicitadas: Locator;

  // ─── EditGrid: Nuevas Acreditaciones ──────────────────────────────
  readonly nuevasAcreditacionesGrid: Locator;

  // Row fields inside editgrid
  readonly nitField: Locator;
  readonly buscarButton: Locator;
  readonly empresaField: Locator;
  readonly confirmarCheckbox: Locator;

  // Result content areas (inside editgrid row)
  readonly contentAcreditada: Locator;
  readonly contentAcreditar: Locator;
  readonly contentNoEncontrada: Locator;

  // Hidden bot result fields (inside editgrid row)
  readonly statusDerechosIdExiste: Locator;
  readonly statusEmpresaEncontrada: Locator;

  // ─── DataGrid: Extender Acreditaciones ────────────────────────────
  readonly extenderGrid: Locator;

  // Datagrid columns
  readonly extenderEmpresa: Locator;
  readonly extenderNit: Locator;
  readonly extenderExpiracion: Locator;
  readonly extenderCheckbox: Locator;
  readonly extenderNuevaExpiracion: Locator;

  // ─── Instructions Content ─────────────────────────────────────────
  readonly topContent: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top-level panels
    this.block8Panel = page.locator('[ref="applicantBlock8"]');
    this.block5Panel = page.locator('[ref="applicantBlock5"]');
    this.block6Panel = page.locator('[ref="applicantBlock6"]');
    this.submitButton = page.locator('[ref="applicantValidateTheForm"] button, .formio-component-applicantValidateTheForm button');

    // Radio options
    this.radioNuevaAcreditacion = page.locator('[ref="applicantQuieroCrearUnaNuevaAcreditacion"]');
    this.radioExtenderExistente = page.locator('[ref="applicantQuieroExtenderOTerminarUnaAcreditacionExistente"]');
    this.radioDelegarAcreditacion = page.locator('[ref="applicantDelegarUnaAcreditacion"]');

    // Hidden status
    this.statusLlegaDeBitacora = page.locator('[ref="applicantStatusLlegaDeLaBitacora"]');

    // Counters
    this.contadorExistentes = page.locator('[ref="applicantcontador"]');
    this.extensionesSolicitadas = page.locator('[ref="applicantNumber2"]');
    this.nuevasSolicitadas = page.locator('[ref="applicantnuevasSolicitadas"]');

    // EditGrid: Nuevas acreditaciones
    this.nuevasAcreditacionesGrid = page.locator('[ref="applicantNuevasAcreditacionesSolicitadas"]');

    // Row fields (scoped to the editgrid when a row is open)
    this.nitField = page.locator('[ref="applicantNit"] input');
    this.buscarButton = page.locator('[ref="applicantBuscar2"] button, .formio-component-applicantBuscar2 button');
    this.empresaField = page.locator('[ref="applicantEmpresa"] input');
    this.confirmarCheckbox = page.locator('[ref="applicantConfirmar"]');

    // Content areas inside editgrid row
    this.contentAcreditada = page.locator('[ref="applicantEmpresaEncontradaPeroYaEstaRegistradaCon"]');
    this.contentAcreditar = page.locator('[ref="applicantDatosEncontradosExitosamente2"]');
    this.contentNoEncontrada = page.locator('[ref="applicantContent4"]');

    // Hidden bot fields inside row
    this.statusDerechosIdExiste = page.locator('[ref="applicantStatusClientesIdExiste"]');
    this.statusEmpresaEncontrada = page.locator('[ref="applicantStatusempresa1"]');

    // DataGrid: Extender acreditaciones
    this.extenderGrid = page.locator('[ref="applicantMiListaDeEmpresas"]');

    // Datagrid columns (inside rows)
    this.extenderEmpresa = page.locator('[ref="applicantNombre"]');
    this.extenderNit = page.locator('[ref="applicantNit2"]');
    this.extenderExpiracion = page.locator('[ref="expiracion"]');
    this.extenderCheckbox = page.locator('[ref="applicantModificar"]');
    this.extenderNuevaExpiracion = page.locator('[ref="applicantNuevaExpiracion"]');

    // Instructions
    this.topContent = page.locator('[ref="applicantContent"]');
  }

  // ─── Navigation ─────────────────────────────────────────────────

  /**
   * Navigate to the Acreditaciones form.
   * The user should already be on the Bitacora dashboard.
   * This clicks the "Agregar" dropdown then "Acreditarse en otra empresa".
   */
  async navigateFromBitacora() {
    // Click the Agregar dropdown in the top section
    const agregarBtn = this.page.locator('text=Agregar').first();
    await agregarBtn.click();
    await this.page.waitForSelector('text=Acreditarse en otra empresa', { timeout: 5000 });
    await this.page.locator('text=Acreditarse en otra empresa').click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Radio Selection ────────────────────────────────────────────

  async selectNuevaAcreditacion() {
    const radioInput = this.radioNuevaAcreditacion.locator('input[type="radio"]').first();
    await radioInput.click();
    // Wait for Block5 to become visible (determinant-driven)
    await this.block5Panel.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectExtenderExistente() {
    const radioInput = this.radioExtenderExistente.locator('input[type="radio"]').first();
    await radioInput.click();
    // Wait for Block6 to become visible
    await this.block6Panel.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectDelegarAcreditacion() {
    const radioInput = this.radioDelegarAcreditacion.locator('input[type="radio"]').first();
    await radioInput.click();
  }

  // ─── EditGrid Interactions ──────────────────────────────────────

  /**
   * Add a new row in the nuevas acreditaciones editgrid.
   * Clicks the "Add Another" / "Agregar" button.
   */
  async addNewAccreditationRow() {
    const addBtn = this.nuevasAcreditacionesGrid.locator('button:has-text("Agregar"), button:has-text("Add Another")');
    await addBtn.click();
    // Wait for the row fields to appear
    await this.nitField.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Search for a company by NIT inside the editgrid row.
   */
  async searchByNit(nit: string) {
    await this.nitField.fill(nit);
    await this.buscarButton.click();
    // Wait for bot response — empresa field auto-fills or content areas show
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Confirm the accreditation in the current row.
   */
  async confirmAccreditation() {
    const checkbox = this.confirmarCheckbox.locator('input[type="checkbox"]').first();
    await checkbox.check();
  }

  // ─── Submit ─────────────────────────────────────────────────────

  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Assertions ─────────────────────────────────────────────────

  async expectRadioOptionsVisible() {
    await expect(this.radioNuevaAcreditacion).toBeVisible();
    await expect(this.radioExtenderExistente).toBeVisible();
    await expect(this.radioDelegarAcreditacion).toBeVisible();
  }

  async expectBlock5Visible() {
    await expect(this.block5Panel).toBeVisible();
  }

  async expectBlock5Hidden() {
    await expect(this.block5Panel).toBeHidden();
  }

  async expectBlock6Visible() {
    await expect(this.block6Panel).toBeVisible();
  }

  async expectBlock6Hidden() {
    await expect(this.block6Panel).toBeHidden();
  }

  async expectSubmitButtonPresent() {
    await expect(this.submitButton).toBeVisible();
  }

  async screenshotWithLabel(label: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${label}.png`,
      fullPage: false,
    });
  }
}
