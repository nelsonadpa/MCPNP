import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Bitacora Hub (ffe746aac09241078bad48c9b95cdfe0)
 *
 * Covers: Tab navigation, company selection, Block22 Permisos section,
 * "Agregar" dropdown buttons, and EditGrid structures.
 */
export class BitacoraPage {
  readonly page: Page;

  // ─── Dashboard Tabs ───────────────────────────────────────────────
  readonly empresasTab: Locator;
  readonly serviciosTab: Locator;
  readonly solicitudesTab: Locator;

  // ─── Company Selection ────────────────────────────────────────────
  readonly confirmButton: Locator;

  // ─── Block22 Panel (Permisos) ─────────────────────────────────────
  readonly block22Panel: Locator;
  readonly block22Header: Locator;
  readonly agregarDropdownPermisos: Locator;

  // ─── Block22 "Agregar" Dropdown Buttons (9 total) ─────────────────
  readonly btnPermisoEventual: Locator;
  readonly btnFitosanitario: Locator;
  readonly btnZoosanitario: Locator;
  readonly btnEquiposEnergia: Locator;
  readonly btnCertificadoSanitario: Locator;
  readonly btnInstrumentosMedicion: Locator;
  readonly btnDonativosMedicos: Locator;
  readonly btnSustanciasControladas: Locator;
  readonly btnCertAprobacionModelo: Locator;

  // ─── EditGrids in Block22 ────────────────────────────────────────
  readonly editGridPE: Locator;
  readonly editGridFito: Locator;
  readonly editGridZoo: Locator;
  readonly editGridONURE: Locator;
  readonly editGridSustancias: Locator;
  readonly editGridSanitario: Locator;
  readonly editGridOnn: Locator;
  readonly editGridCertAprobacion: Locator;
  readonly editGridDonativos: Locator;

  // ─── EditGrid Parent Panels ──────────────────────────────────────
  readonly blockPE: Locator;
  readonly blockFito: Locator;
  readonly blockZoo: Locator;
  readonly blockONURE: Locator;
  readonly blockSustancias: Locator;
  readonly blockSanitario: Locator;
  readonly blockOnn: Locator;
  readonly blockCertAprobacion: Locator;
  readonly blockDonativos: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dashboard tabs (sidebar)
    this.empresasTab = page.locator('a:not(.dropdown-item):has-text("Empresas")');
    this.serviciosTab = page.locator('a:not(.dropdown-item):has-text("Servicios")');
    this.solicitudesTab = page.locator('a:not(.dropdown-item):has-text("Mis solicitudes")');

    // Company selection
    this.confirmButton = page.locator('text=Confirmar y continuar');

    // Block22 (Permisos)
    this.block22Panel = page.locator('[ref="applicantBlock22"]');
    this.block22Header = page.locator('[ref="applicantcolumns14"]');
    this.agregarDropdownPermisos = page.locator('[ref="applicantdropdown5"]');

    // 9 dropdown buttons (using component keys)
    this.btnPermisoEventual = page.locator('[ref="applicantPermisoEventual"]');
    this.btnFitosanitario = page.locator('[ref="applicantEventuales3"]');
    this.btnZoosanitario = page.locator('[ref="applicantEquiposUsoDeEnergia2"]');
    this.btnEquiposEnergia = page.locator('[ref="applicantEventuales"]');
    this.btnCertificadoSanitario = page.locator('[ref="applicantSanitarioBtn"]');
    this.btnInstrumentosMedicion = page.locator('[ref="applicantCertificadoSanitario3"]');
    this.btnDonativosMedicos = page.locator('[ref="applicantCertificadoSanitario2"]');
    this.btnSustanciasControladas = page.locator('[ref="applicantSustanciasBtn"]');
    this.btnCertAprobacionModelo = page.locator('[ref="applicantCertAprobacionBtn"]');

    // EditGrids
    this.editGridPE = page.locator('[ref="applicantEditGrid"]');
    this.editGridFito = page.locator('[ref="applicantEditGridFito"]');
    this.editGridZoo = page.locator('[ref="applicantEditGridZoo"]');
    this.editGridONURE = page.locator('[ref="applicantPermisoZoosanitario"]');
    this.editGridSustancias = page.locator('[ref="applicantEditGridSustancias"]');
    this.editGridSanitario = page.locator('[ref="applicantEditGridSanitario"]');
    this.editGridOnn = page.locator('[ref="applicantEditGridOnn"]');
    this.editGridCertAprobacion = page.locator('[ref="applicantEditGridCertAprobacion"]');
    this.editGridDonativos = page.locator('[ref="applicantEditGridDonativos"]');

    // EditGrid parent panels
    this.blockPE = page.locator('[ref="applicantBlock10"]');
    this.blockFito = page.locator('[ref="applicantBlock12"]');
    this.blockZoo = page.locator('[ref="applicantBlock14"]');
    this.blockONURE = page.locator('[ref="applicantBlock16"]');
    this.blockSustancias = page.locator('[ref="applicantBlock17"]');
    this.blockSanitario = page.locator('[ref="applicantBlock19"]');
    this.blockOnn = page.locator('[ref="applicantBlock20"]');
    this.blockCertAprobacion = page.locator('[ref="applicantBlock24"]');
    this.blockDonativos = page.locator('[ref="applicantBlock23"]');
  }

  // ─── Navigation ─────────────────────────────────────────────────

  async goto() {
    await this.page.goto('https://cuba.eregistrations.org');
    await this.page.waitForLoadState('networkidle');
  }

  async selectCompany(companyName: string) {
    await this.empresasTab.click();
    await this.page.waitForLoadState('networkidle');
    // Wait for companies to load (async — avoid the "-1" counter state)
    await this.page.waitForSelector(`text=${companyName}`, { timeout: 30000 });
    await this.page.locator(`text=${companyName}`).click();
    await this.confirmButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToServicios() {
    await this.serviciosTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Block22 Interactions ───────────────────────────────────────

  async expandPermisos() {
    // The Permisos section may need a click to expand
    // Block22 loads LISTAR bots on panel show
    await this.block22Panel.waitFor({ state: 'visible', timeout: 30000 });
  }

  async openAgregarDropdown() {
    // Open the "Agregar" dropdown in Block22 header
    const dropdownToggle = this.agregarDropdownPermisos.locator('.dropdown-toggle, button, a').first();
    await dropdownToggle.click();
    // Wait for dropdown menu to appear
    await this.page.waitForSelector('.dropdown-menu.show, .dropdown-menu[style*="display: block"]', {
      timeout: 5000,
    });
  }

  async clickPermisoEventual() {
    await this.openAgregarDropdown();
    await this.btnPermisoEventual.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickFitosanitario() {
    await this.openAgregarDropdown();
    await this.btnFitosanitario.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Assertions Helpers ─────────────────────────────────────────

  async screenshotWithLabel(label: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${label}.png`,
      fullPage: false,
    });
  }

  /**
   * Get all visible dropdown button labels from Block22 "Agregar" dropdown
   */
  async getDropdownButtonLabels(): Promise<string[]> {
    await this.openAgregarDropdown();
    const buttons = this.agregarDropdownPermisos.locator('.dropdown-menu button, .dropdown-menu a.dropdown-item');
    const count = await buttons.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text && text.trim()) {
        labels.push(text.trim());
      }
    }
    return labels;
  }

  /**
   * Check if an EditGrid has the expected column keys by looking for
   * form.io component refs inside the grid.
   */
  async editGridHasColumn(editGridLocator: Locator, columnKey: string): Promise<boolean> {
    const col = editGridLocator.locator(`[ref="${columnKey}"]`);
    return (await col.count()) > 0;
  }

  /**
   * Get the row count of an EditGrid.
   */
  async getEditGridRowCount(editGridLocator: Locator): Promise<number> {
    const rows = editGridLocator.locator('.editgrid-row, tbody tr');
    return await rows.count();
  }
}
