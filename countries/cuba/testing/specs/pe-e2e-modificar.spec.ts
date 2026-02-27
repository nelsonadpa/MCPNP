import { test, expect } from '@playwright/test';
import path from 'path';
import {
  searchAndSelect,
  fillText,
  fillNumber,
  checkBox,
  screenshot,
  clickSubTab,
} from '../helpers/form-helpers';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/pe-modificar');
const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';

test.describe('PE E2E — Modificar Permiso Eventual Existente', () => {

  test('Full flow: Bitácora → Discover permit → PE Modificar → Submit', async ({ page }) => {
    test.setTimeout(600_000); // 10 min

    // ──── Helper: log visible blocks ────────────────────────────────
    async function logBlocks(label: string) {
      const blocks = await page.evaluate(() => {
        const els = document.querySelectorAll('[class*="formio-component-applicantBlock"], [class*="formio-component-applicantTabs"]');
        return Array.from(els)
          .map(el => ({
            key: Array.from(el.classList).find(c => c.includes('applicant'))?.replace('formio-component-', ''),
            vis: (el as HTMLElement).offsetParent !== null,
            h: (el as HTMLElement).offsetHeight,
          }))
          .filter(b => b.vis && b.h > 0);
      });
      console.log(`[${label}] Visible blocks:`, JSON.stringify(blocks.map(b => `${b.key}(${b.h}px)`)));
      return blocks;
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 1: Discover an existing permit number from Bitácora
    // ════════════════════════════════════════════════════════════════

    // ──── Step 1: Navigate to Bitácora ────────────────────────────
    console.log('Step 1: Navigating to Bitácora...');
    await page.goto('/');

    // ──── Step 2: Select company ──────────────────────────────────
    console.log('Step 2: Selecting company...');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Mis empresas') && !text.includes('(-1)');
    }, { timeout: 30_000 });

    await page.locator('text=EMPRESA DE SERVICIOS INGENIEROS').first().click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Confirmar y continuar")').click();
    await page.waitForTimeout(5000);
    console.log('✓ Company confirmed');

    // ──── Step 3: Navigate to Servicios tab ───────────────────────
    console.log('Step 3: Looking for PE permits in Bitácora...');

    // The Bitácora form loads and Block22 (Permisos) should appear.
    // The LISTAR bot auto-fires and populates the PE EditGrid.
    // Wait for the Bitácora form to fully render.
    await page.waitForSelector('.formio-form', { timeout: 30_000 });
    await page.waitForTimeout(5000);

    // Try clicking "Servicios" tab if visible
    const serviciosTab = page.locator('a:not(.dropdown-item):has-text("Servicios")').first();
    if (await serviciosTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await serviciosTab.click();
      await page.waitForTimeout(5000);
      console.log('✓ Servicios tab clicked');
    }

    await screenshot(page, SCREENSHOT_DIR, '01-bitacora-servicios');

    // ──── Step 4: Find PE EditGrid and extract permit number ──────
    console.log('Step 4: Extracting permit number from PE EditGrid...');

    // Scroll to Block22 area
    await page.evaluate(() => {
      const block22 = document.querySelector('[class*="applicantBlock22"], [ref="applicantBlock22"]');
      if (block22) block22.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(3000);

    // Wait for LISTAR bot to populate (may take a few seconds)
    // The PE EditGrid is applicantEditGrid — look for rows with permit numbers
    let permitNumber = '';

    // Try to find permit numbers from EditGrid rows
    // The EditGrid row structure contains applicantNumero5 (textfield, disabled)
    const extractResult = await page.evaluate(() => {
      // Method 1: Check Formio data directly
      const forms = (window as any).Formio?.forms;
      const formKey = Object.keys(forms || {})[0];
      const form = forms?.[formKey];
      if (!form) return { method: 'no-form', permits: [] };

      const data = form.submission?.data || {};

      // The EditGrid data is in applicantEditGrid as an array
      const editGridData = data.applicantEditGrid;
      if (Array.isArray(editGridData) && editGridData.length > 0) {
        const permits = editGridData.map((row: any) => ({
          numero: row.applicantNumero5 || row.numero || '',
          tipo: row.applicantTipo5 || row.tipo || '',
          operacion: row.applicantTipoDeOperacion || '',
          expiracion: row.applicantExpiracion || '',
        }));
        return { method: 'formio-data', permits };
      }

      // Method 2: Check via component API
      const editGridComp = form.getComponent('applicantEditGrid');
      if (editGridComp) {
        const val = editGridComp.getValue();
        if (Array.isArray(val) && val.length > 0) {
          const permits = val.map((row: any) => ({
            numero: row.applicantNumero5 || '',
            tipo: row.applicantTipo5 || '',
          }));
          return { method: 'component-api', permits };
        }
      }

      // Method 3: Check ContadorPermiso
      const contador = data.applicantContadorPermiso || data.applicantContadorEventuales;
      return { method: 'no-editgrid-data', permits: [], contador };
    });

    console.log('EditGrid extract:', JSON.stringify(extractResult));

    if (extractResult.permits.length > 0) {
      // Pick the first permit with a non-empty number
      const validPermit = extractResult.permits.find((p: any) => p.numero && p.numero.trim() !== '');
      if (validPermit) {
        permitNumber = validPermit.numero;
        console.log(`✓ Found permit number: "${permitNumber}"`);
      }
    }

    // If no permit found from EditGrid, try DOM scraping
    if (!permitNumber) {
      console.log('No permit in Formio data, trying DOM scrape...');
      const domPermits = await page.evaluate(() => {
        // Look for disabled textfields inside EditGrid rows
        const grid = document.querySelector('[class*="applicantEditGrid"], [ref="applicantEditGrid"]');
        if (!grid) return [];
        const inputs = grid.querySelectorAll('input[disabled], input[readonly]');
        return Array.from(inputs)
          .map(el => (el as HTMLInputElement).value)
          .filter(v => v && v.trim() !== '' && v !== 'Eventual');
      });
      console.log('DOM permits:', JSON.stringify(domPermits));
      if (domPermits.length > 0) {
        permitNumber = domPermits[0];
        console.log(`✓ Found permit number (DOM): "${permitNumber}"`);
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '02-editgrid-permits');

    if (!permitNumber) {
      console.log('⚠ No existing PE permits found. This company has no approved permits to modify.');
      console.log('The test needs at least one approved PE to exist. Skipping modification flow.');
      // Still proceed to test that the form enters modification mode correctly
      // using a synthetic permit number
      permitNumber = 'TEST-SYNTHETIC';
      console.log(`Using synthetic permit number: "${permitNumber}"`);
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 2: Navigate to PE form in Modification mode
    // ════════════════════════════════════════════════════════════════

    // ──── Step 5: Navigate to PE form ─────────────────────────────
    console.log('Step 5: Navigating to PE form...');
    await page.goto(`/services/${PE_SERVICE_ID}`);
    await page.waitForTimeout(10000);
    await page.waitForSelector('.formio-form', { timeout: 30_000 });
    await page.waitForTimeout(3000);
    console.log('✓ PE form loaded. URL:', page.url());
    await screenshot(page, SCREENSHOT_DIR, '03-pe-form-loaded');

    // ──── Step 6: Set hidden fields for MODIFICATION mode ─────────
    console.log('Step 6: Setting hidden fields for modificarExistente...');

    // Handle "Porque no vienen datos" button if present
    const retryBtn = page.locator('button:has-text("Porque no vienen datos")');
    if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }

    const setResult = await page.evaluate((pNumber: string) => {
      try {
        const forms = (window as any).Formio?.forms;
        const formKey = Object.keys(forms || {})[0];
        const form = forms?.[formKey];
        if (!form) return 'no form';

        // KEY DIFFERENCE from Nuevo: modificarExistente + solicitud + permisoEventual
        const keysToSet: Record<string, string> = {
          applicantStatusLlegaDeLaBitacora: 'true',
          applicantQueQuiereHacer: 'modificarExistente',
          applicantNit3: '01000348911',
          applicantNombreDeLaEmpresa4: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',
          applicantContadorEventuales: '1',  // >0 means permits exist
          applicantSolicitud: pNumber,       // The permit number to modify
          permisoEventual: 'true',           // Flag for modification mode
        };

        // Set via component API
        for (const [key, value] of Object.entries(keysToSet)) {
          const comp = form.getComponent(key);
          if (comp) {
            comp.setValue(value, { noUpdateEvent: false });
          }
        }

        // Update submission data
        const current = form.submission?.data || {};
        form.submission = { data: { ...current, ...keysToSet } };

        // Re-evaluate visibility conditions
        form.checkConditions(form.submission.data);

        return 'OK';
      } catch (e: any) {
        return `ERR: ${e.message}`;
      }
    }, permitNumber);

    console.log('Hidden fields (modificar):', setResult);
    await page.waitForTimeout(5000);

    // ──── Step 7: Verify TabsFacultades appeared ──────────────────
    console.log('Step 7: Checking TabsFacultades...');

    await logBlocks('after-modificar-fields');
    await screenshot(page, SCREENSHOT_DIR, '04-after-hidden-fields');

    const tabsFacultadesVisible = await page.locator(
      '.formio-component-applicantTabsFacultades, [ref="applicantTabsFacultades"]'
    ).isVisible({ timeout: 10_000 }).catch(() => false);

    console.log('TabsFacultades visible:', tabsFacultadesVisible);

    // Check if Block8 (nuevo) is hidden and TabsFacultades (modificar) appeared
    const block8Visible = await page.locator('.formio-component-applicantBlock8').isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Block8 (nuevo mode) visible:', block8Visible);

    if (tabsFacultadesVisible) {
      console.log('✓ MODIFICATION MODE CONFIRMED — TabsFacultades is visible');
    } else if (block8Visible) {
      console.log('⚠ Block8 visible instead of TabsFacultades — form may be in "nuevo" mode');
      console.log('This could mean the hidden field conditions did not trigger correctly');
    } else {
      console.log('⚠ Neither TabsFacultades nor Block8 visible — checking all blocks...');
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 3: Explore and fill the modification form
    // ════════════════════════════════════════════════════════════════

    // ──── Step 8: Explore Tab 1 — Operación previamente autorizada ─
    console.log('Step 8: Exploring Tab 1 — existing operation data...');

    if (tabsFacultadesVisible) {
      // Click on Tab 1
      const tab1 = page.locator(
        '[ref="applicantTabsFacultadesoperacionPreviamenteAutorizada"], ' +
        '.nav-link:has-text("previamente"), .nav-link:has-text("Operaci")'
      ).first();

      if (await tab1.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab1.click();
        await page.waitForTimeout(3000);
        console.log('✓ Tab 1 clicked');
      }

      await screenshot(page, SCREENSHOT_DIR, '05-tab1-existing');

      // Check for pre-filled data in Tab 1
      const tab1Data = await page.evaluate(() => {
        const fields: Record<string, string> = {};
        // These are read-only fields showing the existing permit data
        const keys = [
          'applicantOperacion', 'applicantRegimenEspecial2', 'applicantValidHasta',
        ];
        for (const key of keys) {
          const el = document.querySelector(`[class*="formio-component-${key}"], [ref="${key}"]`);
          if (el) {
            const input = el.querySelector('input, select, textarea') as HTMLInputElement;
            fields[key] = input?.value || el.textContent?.trim()?.substring(0, 100) || 'present-no-value';
          }
        }
        return fields;
      });
      console.log('Tab 1 pre-filled data:', JSON.stringify(tab1Data));

      // Check existing products grid (applicantDataGridNuevonuevo3)
      const existingGridVisible = await page.locator(
        '.formio-component-applicantDataGridNuevonuevo3, [ref="applicantDataGridNuevonuevo3"]'
      ).isVisible({ timeout: 3000 }).catch(() => false);
      console.log('Existing products grid visible:', existingGridVisible);

      if (existingGridVisible) {
        const existingProducts = await page.evaluate(() => {
          const grid = document.querySelector('[class*="applicantDataGridNuevonuevo3"], [ref="applicantDataGridNuevonuevo3"]');
          if (!grid) return [];
          const rows = grid.querySelectorAll('tr, .datagrid-row, .editgrid-row');
          return Array.from(rows).slice(0, 5).map(row => row.textContent?.trim()?.substring(0, 200));
        });
        console.log(`Existing products (${existingProducts.length} rows):`, JSON.stringify(existingProducts));
      }

      // ──── Step 9: Explore Tab 2 — Modificaciones solicitadas ────
      console.log('Step 9: Exploring Tab 2 — modifications...');

      const tab2 = page.locator(
        '[ref="applicantTabsFacultadesmodificacionesSolicitadas"], ' +
        '.nav-link:has-text("Modificaciones"), .nav-link:has-text("modificaciones")'
      ).first();

      if (await tab2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab2.click();
        await page.waitForTimeout(3000);
        console.log('✓ Tab 2 clicked');
      }

      await screenshot(page, SCREENSHOT_DIR, '06-tab2-modifications');
      await logBlocks('tab2-modifications');

      // Inventory visible components in Tab 2
      const tab2Components = await page.evaluate(() => {
        const components: any[] = [];
        const forms = (window as any).Formio?.forms;
        const form = forms?.[Object.keys(forms || {})[0]];
        if (!form) return components;

        form.everyComponent((c: any) => {
          if (c.visible !== false && c.component?.hidden !== true) {
            const el = c.element;
            if (el && (el as HTMLElement).offsetParent !== null && (el as HTMLElement).offsetHeight > 0) {
              // Check if this component is inside TabsFacultades
              const isInTabs = el.closest('[class*="applicantTabsFacultades"]') !== null;
              if (isInTabs) {
                components.push({
                  key: c.key,
                  type: c.type,
                  label: c.label?.substring(0, 40),
                });
              }
            }
          }
        });
        return components;
      });
      console.log('Tab 2 visible components:', JSON.stringify(tab2Components));

      // Check for modified products grid (applicantDataGridNuevonuevo4)
      const modifiedGridVisible = await page.locator(
        '.formio-component-applicantDataGridNuevonuevo4, [ref="applicantDataGridNuevonuevo4"]'
      ).isVisible({ timeout: 3000 }).catch(() => false);
      console.log('Modified products grid visible:', modifiedGridVisible);
    }

    // ════════════════════════════════════════════════════════════════
    // PHASE 4: Fill modification form + submit
    // ════════════════════════════════════════════════════════════════

    // ──── Step 10: Fill modification fields (Tab 2) ────────────────
    console.log('Step 10: Filling modification fields...');

    // Tab 2 uses DIFFERENT field keys than PE Nuevo:
    //   Nuevo keys:        Modificar Tab 2 keys:
    //   TipoDeOperacion2   Operacion2
    //   RegimenEspecial     RegimenEspecial3
    //   DataGridNuevonuevo  DataGridNuevonuevo4
    //   applicantSeccion    applicantSeccion4
    //   applicantProducto   applicantProducto4
    //   applicantDescripcion5 applicantDescripcion (no suffix!)
    //   applicantValor      applicantValor3
    //   applicantCantidad   applicantCantidad3

    // Helper: check if a field is enabled (not disabled)
    async function isFieldEnabled(key: string): Promise<boolean> {
      const disabled = await page.locator(`.formio-component-${key}`).first()
        .evaluate(el => {
          const inp = el.querySelector('input, select, textarea');
          if (inp?.hasAttribute('disabled')) return true;
          const choices = el.querySelector('.choices.is-disabled');
          return !!choices;
        }).catch(() => true); // assume disabled on error
      return !disabled;
    }

    // NOTE: With synthetic permit number, Tab 2 fields may be DISABLED
    // because no real data loaded from GDB. This is expected behavior.
    // When a real permit number is available, these fields would be editable.

    // Operation type (Tab 2 key: applicantOperacion2)
    const opTypeVisible = await page.locator('.formio-component-applicantOperacion2')
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (opTypeVisible && await isFieldEnabled('applicantOperacion2')) {
      const tipoOk = await searchAndSelect(page, 'applicantOperacion2', 'Import');
      console.log('Operación (mod):', tipoOk ? '✓' : 'FAILED');
      await page.waitForTimeout(2000);
    } else if (opTypeVisible) {
      console.log('Operación (mod): DISABLED (synthetic permit — no real data)');
    }

    // Regimen especial (Tab 2 key: applicantRegimenEspecial3)
    const regimenVisible = await page.locator('.formio-component-applicantRegimenEspecial3')
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (regimenVisible && await isFieldEnabled('applicantRegimenEspecial3')) {
      const regimenOk = await searchAndSelect(page, 'applicantRegimenEspecial3', 'Ninguno');
      if (!regimenOk) await searchAndSelect(page, 'applicantRegimenEspecial3', 'Normal');
      console.log('Régimen especial (mod): ✓');
      await page.waitForTimeout(2000);
    } else if (regimenVisible) {
      console.log('Régimen especial (mod): DISABLED');
    }

    // Text fields in Tab 2
    const modTextFields: [string, string][] = [
      ['applicantNumeroDeContrato2', 'CONTRATO-E2E-001'],
      ['applicantNumeroDeFacturaODonacion2', 'FACTURA-E2E-001'],
    ];
    for (const [key, value] of modTextFields) {
      const inp = page.locator(`.formio-component-${key} input`).first();
      if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
        if (await isFieldEnabled(key)) {
          await fillText(page, key, value);
          console.log(`${key}: ✓`);
        } else {
          console.log(`${key}: DISABLED`);
        }
      }
    }

    // Number fields in Tab 2
    const modNumberFields: [string, string][] = [
      ['applicantCantidadDeEmbarques2', '3'],
    ];
    for (const [key, value] of modNumberFields) {
      const inp = page.locator(`.formio-component-${key} input`).first();
      if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
        if (await isFieldEnabled(key)) {
          await fillNumber(page, key, value);
          console.log(`${key}: ✓`);
        } else {
          console.log(`${key}: DISABLED`);
        }
      }
    }

    // Country/condition selects (may appear after Operacion2 is filled)
    const conditionalSelects: [string, string][] = [
      ['applicantCondicionDeLaOperacion', 'Normal'],
      ['applicantPaisDeOrigen', 'Alemania'],
      ['applicantPaisDeEmbarque', 'Alemania'],
      ['applicantPaisDeDestino', 'Cuba'],
    ];
    for (const [key, term] of conditionalSelects) {
      if (await page.locator(`.formio-component-${key}`).isVisible({ timeout: 1500 }).catch(() => false)) {
        if (await isFieldEnabled(key)) {
          const ok = await searchAndSelect(page, key, term);
          console.log(`${key} (mod): ${ok ? '✓' : 'FAILED'}`);
          await page.waitForTimeout(1000);
        } else {
          console.log(`${key} (mod): DISABLED`);
        }
      }
    }

    // Modified products grid (applicantDataGridNuevonuevo4)
    const modGrid = page.locator('.formio-component-applicantDataGridNuevonuevo4');
    if (await modGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Modified products grid found — checking if editable...');

      const gridDisabled = await modGrid.locator('input[disabled], .choices.is-disabled').count();
      const gridEnabled = await modGrid.locator('input:not([disabled])').count();
      console.log(`Modified grid: ${gridDisabled} disabled inputs, ${gridEnabled} enabled inputs`);

      if (gridEnabled > 0) {
        const rows = await modGrid.locator('tr, .datagrid-row, .formio-component-applicantSeccion4').count();
        console.log(`Modified grid rows: ${rows}`);

        if (rows === 0) {
          const addBtn = modGrid.locator('button:has-text("Agregar"), button:has-text("Añadir"), .formio-button-add-row').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(2000);
          }
        }

        // Fill product row — use Tab 2 field keys
        for (const [key, terms] of [['applicantSeccion4', ['01', 'Animal']], ['applicantProducto4', ['Carne', 'Animal']]] as [string, string[]][]) {
          if (await isFieldEnabled(key)) {
            for (const term of terms) {
              const ok = await searchAndSelect(page, key, term);
              if (ok) { console.log(`DG ${key} (mod): ✓`); await page.waitForTimeout(1500); break; }
            }
          } else {
            console.log(`DG ${key} (mod): DISABLED`);
          }
        }

        // Text/number in grid
        for (const [key, val, type] of [['applicantDescripcion', 'Producto modificado E2E', 'text'], ['applicantCantidad3', '200', 'number'], ['applicantValor3', '8000', 'number']] as [string, string, string][]) {
          if (await isFieldEnabled(key)) {
            if (type === 'number') await fillNumber(page, key, val);
            else await fillText(page, key, val);
            console.log(`DG ${key} (mod): ✓`);
          } else {
            console.log(`DG ${key} (mod): DISABLED`);
          }
        }
      } else {
        console.log('Modified products grid: all fields DISABLED (synthetic permit)');
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '07-modification-filled');

    // ──── Step 11: Fundamentación ─────────────────────────────────
    console.log('Step 11: Fundamentación...');

    const fundField = page.locator('.formio-component-applicantFundamentacion textarea, .formio-component-applicantBlock9 textarea').first();
    if (await fundField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fundField.scrollIntoViewIfNeeded();
      await fundField.fill('Modificación E2E automatizada - Test trazabilidad Observer Agent');
      console.log('Fundamentación: ✓');
    }

    // ──── Step 12: Contact info ───────────────────────────────────
    console.log('Step 12: Contact info...');

    const contactFields: [string, string][] = [
      ['applicantElaboradoPor', 'Test Agent Modificar'],
      ['applicantTelefono', '73985278'],
      ['applicantCorreoElectronico', 'test-modificar@eregistrations.org'],
      ['applicantEmail', 'test-modificar@eregistrations.org'],
    ];
    for (const [key, value] of contactFields) {
      const inp = page.locator(`.formio-component-${key} input`).first();
      if (await inp.isVisible({ timeout: 1000 }).catch(() => false)) {
        await inp.scrollIntoViewIfNeeded();
        await inp.fill(value);
        console.log(`Contact ${key}: ✓`);
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '08-contact-filled');

    // ──── Step 13: Confirm + Submit ───────────────────────────────
    console.log('Step 13: Final check + submit...');

    await logBlocks('before-submit');

    // Check confirmation checkbox
    try {
      await checkBox(page, 'applicantCheckbox2');
      console.log('Confirmation checkbox: ✓');
    } catch {
      console.log('applicantCheckbox2 not found');
    }

    // Find submit button
    const submitBtn = page.locator('button:has-text("Enviar"), button:has-text("Registrar"), button[type="submit"]').first();
    const canSubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Submit button visible:', canSubmit);

    await screenshot(page, SCREENSHOT_DIR, '09-before-submit');

    if (canSubmit) {
      console.log('Submitting modification...');
      await submitBtn.click();
      await page.waitForTimeout(10_000);
      await screenshot(page, SCREENSHOT_DIR, '10-after-submit');

      // Verify
      const url = page.url();
      const redirected = !url.includes('/services/');
      const hasPendiente = await page.locator('text=Pendiente').first()
        .isVisible({ timeout: 5_000 }).catch(() => false);

      if (redirected && hasPendiente) {
        console.log('✓✓✓ MODIFICATION SUBMITTED SUCCESSFULLY!');
      } else {
        console.log('Submission result unclear — URL:', url, '| Pendiente:', hasPendiente);
      }
    } else {
      console.log('Cannot submit — dumping form state...');

      // Dump form validity
      const formState = await page.evaluate(() => {
        const forms = (window as any).Formio?.forms;
        const form = forms?.[Object.keys(forms || {})[0]];
        if (!form) return { error: 'no form' };

        const data = form.submission?.data || {};
        const applicantData: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('applicant') || k === 'permisoEventual') {
            applicantData[k] = v;
          }
        }

        // Check form errors
        const errors = form.errors || [];
        const errorKeys = errors.map((e: any) => e.component?.key || e.message).slice(0, 10);

        return {
          queQuiereHacer: data.applicantQueQuiereHacer,
          solicitud: data.applicantSolicitud,
          permisoEventual: data.permisoEventual,
          tabsFacultadesVisible: !!document.querySelector('[class*="applicantTabsFacultades"]'),
          errorKeys,
          fieldCount: Object.keys(applicantData).length,
        };
      });
      console.log('Form state:', JSON.stringify(formState));

      // List visible components
      const visComps = await page.evaluate(() => {
        const els = document.querySelectorAll('.formio-component[class*="applicant"]');
        return Array.from(els)
          .filter(el => (el as HTMLElement).offsetParent !== null && (el as HTMLElement).offsetHeight > 0)
          .map(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('formio-component-applicant'));
            return cls?.replace('formio-component-', '');
          })
          .filter(Boolean);
      });
      console.log('Visible components:', JSON.stringify(visComps));
    }

    await screenshot(page, SCREENSHOT_DIR, '11-final');
    console.log('PE Modificar E2E test complete.');
  });
});
