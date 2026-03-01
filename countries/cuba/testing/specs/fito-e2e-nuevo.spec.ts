import { test, expect } from '@playwright/test';
import path from 'path';
import {
  searchAndSelect,
  fillText,
  fillNumber,
  checkBox,
  screenshot,
} from '../helpers/form-helpers';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/fito-nuevo');

// ═══════════════════════════════════════════════════════════════════════════════
// FITO CONFIG — from MCP form_get + bot_input_mapping_list
// ═══════════════════════════════════════════════════════════════════════════════
const FITO_SERVICE_ID = '2c91808893792e2b019379310a8003a9';
const COMPANY_NAME = 'EMPRESA DE SERVICIOS INGENIEROS';

// Hidden fields sent by INTERNO bot (5 mappings):
// constant_true → applicantStatusLlegaDeLaBitacora (radio)
// applicantNit5 → applicantNit (textfield)
// applicantCompania7 → applicantNombreDeLaEmpresa (textfield)
// applicantContadorFito → applicantcontadorPermisosExistentes (number)
// constant_true → permisoFitosanitario (checkbox)
const HIDDEN_FIELDS: Record<string, any> = {
  applicantStatusLlegaDeLaBitacora: 'true',
  applicantNit: '01000348911',
  applicantNombreDeLaEmpresa: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',
  applicantcontadorPermisosExistentes: -1,
  permisoFitosanitario: true,
};

// First visible block after hidden fields set (operation form)
const FIRST_VISIBLE_BLOCK = 'applicantBlock12';

test.describe('Fito E2E — Nuevo Permiso Fitosanitario', () => {

  test('Full flow: Bitácora → Fito form → Fill → Submit', async ({ page }) => {
    test.setTimeout(600_000); // 10 min

    // ──── Helper: visible blocks ────────────────────────────────────
    async function logBlocks(label: string) {
      const blocks = await page.evaluate(() => {
        const els = document.querySelectorAll('[class*="formio-component-applicantBlock"]');
        return Array.from(els)
          .map(el => ({
            key: Array.from(el.classList).find(c => c.includes('applicantBlock'))?.replace('formio-component-', ''),
            vis: (el as HTMLElement).offsetParent !== null,
            h: (el as HTMLElement).offsetHeight,
          }))
          .filter(b => b.vis);
      });
      console.log(`[${label}] Visible blocks:`, JSON.stringify(blocks.map(b => `${b.key}(${b.h}px)`)));
      return blocks;
    }

    // ──── Helper: dump all visible applicant components ──────────────
    async function dumpVisibleComponents() {
      return page.evaluate(() => {
        const els = document.querySelectorAll('.formio-component[class*="applicant"]');
        return Array.from(els)
          .filter(el => (el as HTMLElement).offsetParent !== null && (el as HTMLElement).offsetHeight > 0)
          .map(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('formio-component-applicant'));
            const key = cls?.replace('formio-component-', '');
            const hasSelect = el.querySelector('.choices, select') !== null;
            const hasTextarea = el.querySelector('textarea') !== null;
            const hasCheckbox = el.querySelector('input[type="checkbox"]') !== null;
            const hasNumber = el.querySelector('input[type="number"]') !== null;
            const hasFile = el.querySelector('.browse, input[type="file"]') !== null;
            const hasDatetime = el.querySelector('.flatpickr-input') !== null;
            const hasInput = el.querySelector('input') !== null;
            const hasRadio = el.querySelector('input[type="radio"]') !== null;
            const type = hasSelect ? 'select' : hasTextarea ? 'textarea' : hasFile ? 'file' :
              hasDatetime ? 'datetime' : hasRadio ? 'radio' : hasCheckbox ? 'checkbox' :
              hasNumber ? 'number' : hasInput ? 'input' : 'other';
            const input = el.querySelector('input, textarea, select') as HTMLInputElement | null;
            const value = input?.value || '';
            const required = el.classList.contains('required') || el.querySelector('.field-required') !== null;
            return { key, type, value: value.substring(0, 50), required };
          })
          .filter(c => c.key && !c.key.includes('columns') && !c.key.includes('Block'));
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // Step 1: Navigate to Bitácora
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 1: Navigating to Bitácora...');
    await page.goto('/');

    // ══════════════════════════════════════════════════════════════════
    // Step 2: Select company
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 2: Selecting company...');
    // Wait for company list — accept (-1) counter since it may not update
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Mis empresas') || text.includes('Seleccione una empresa');
    }, { timeout: 30_000 });
    // Extra wait for company cards to render
    await page.waitForTimeout(3000);

    await page.locator(`text=${COMPANY_NAME}`).first().click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Confirmar y continuar")').click();
    await page.waitForTimeout(3000);
    console.log('✓ Company confirmed');

    // ══════════════════════════════════════════════════════════════════
    // Step 3: Navigate to Fito form
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 3: Navigating to Fito form...');
    await page.goto(`/services/${FITO_SERVICE_ID}`);
    await page.waitForTimeout(10000);
    await page.waitForSelector('.formio-form', { timeout: 30_000 });
    await page.waitForTimeout(3000);
    console.log('✓ Formio form loaded. URL:', page.url());
    await screenshot(page, SCREENSHOT_DIR, '01-form-loaded');

    // ══════════════════════════════════════════════════════════════════
    // Step 4: Discovery — dump initial state BEFORE hidden fields
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 4: Initial form discovery...');
    const initialBlocks = await logBlocks('initial');
    const initialComps = await dumpVisibleComponents();
    console.log('Initial visible components:', JSON.stringify(initialComps, null, 2));
    await screenshot(page, SCREENSHOT_DIR, '02-initial-state');

    // ══════════════════════════════════════════════════════════════════
    // Step 5: Handle "Porque no vienen datos" + Set hidden fields
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 5: Setting hidden Bitácora fields...');

    const retryBtn = page.locator('button:has-text("Porque no vienen datos")');
    if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }

    const setResult = await page.evaluate((fields) => {
      try {
        const forms = (window as any).Formio?.forms;
        const formKey = Object.keys(forms || {})[0];
        const form = forms?.[formKey];
        if (!form) return 'no form';

        for (const [key, value] of Object.entries(fields)) {
          const comp = form.getComponent(key);
          if (comp) {
            comp.setValue(value, { noUpdateEvent: false });
          } else {
            console.log(`Component ${key} not found`);
          }
        }

        const current = form.submission?.data || {};
        form.submission = { data: { ...current, ...fields } };
        form.checkConditions(form.submission.data);

        return 'OK';
      } catch (e: any) {
        return `ERR: ${e.message}`;
      }
    }, HIDDEN_FIELDS);
    console.log('Hidden fields result:', setResult);
    await page.waitForTimeout(5000);

    // Check what changed
    await logBlocks('after-hidden-fields');
    await screenshot(page, SCREENSHOT_DIR, '03-after-hidden-fields');

    // Verify expected block appeared
    const blockOk = await page.locator(`.formio-component-${FIRST_VISIBLE_BLOCK}`)
      .isVisible({ timeout: 5000 }).catch(() => false);
    if (!blockOk) {
      console.log(`⚠ ${FIRST_VISIBLE_BLOCK} not visible — trying without it...`);
      // Don't abort — discover what IS visible instead
    } else {
      console.log(`✓ ${FIRST_VISIBLE_BLOCK} visible`);
    }

    // Discovery after hidden fields
    const afterHiddenComps = await dumpVisibleComponents();
    console.log('After hidden fields — visible components:', JSON.stringify(afterHiddenComps, null, 2));
    await screenshot(page, SCREENSHOT_DIR, '04-after-hidden-discovery');

    // ══════════════════════════════════════════════════════════════════
    // Step 6: Fill Block12 — Operation Data
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 6: Filling operation data (Block12)...');

    // 6a: Tipo de operación (Importación/Exportación/Tránsito)
    const tipoOk = await searchAndSelect(page, 'applicantTipoDeOperacion', 'Import');
    console.log('Tipo de operación:', tipoOk ? '✓' : 'FAILED');
    await page.waitForTimeout(3000);
    await logBlocks('after-tipo');

    // 6b: Medio de Transporte (options: Avión, Barco)
    const transportOk = await searchAndSelect(page, 'applicantMedioDeTransporte2', 'Avión');
    if (!transportOk) {
      const alt = await searchAndSelect(page, 'applicantMedioDeTransporte2', 'Barco');
      console.log('Medio de Transporte:', alt ? '✓ (Barco)' : 'FAILED');
    } else {
      console.log('Medio de Transporte: ✓');
    }
    await page.waitForTimeout(2000);

    // 6c: Countries/ports — these may appear conditionally based on operation type
    const conditionalSelects: [string, string[]][] = [
      ['applicantPaisDeOrigen', ['Alemania', 'Cuba', 'México']],
      ['applicantPaisDeEmbarque', ['Alemania', 'Cuba', 'México']],
      ['applicantPuertoDeEmbarque', ['La Habana', 'Mariel', 'Habana']],
      ['applicantPaisDeDestino', ['Cuba', 'Alemania']],
      ['applicantProvincia', ['La Habana', 'Habana', 'Matanzas']],
      // Export/transit conditionals (columns10, columns12)
      ['applicantPaisDeOrigen3', ['Cuba', 'Alemania']],
      ['applicantPaisDeOrigen2', ['Cuba', 'Alemania']],
      ['applicantPaisDeEmbarque3', ['La Habana', 'Habana']],
      ['applicantPuertoDeEmbarque3', ['La Habana', 'Mariel', 'Habana']],
      ['applicantPaisDeDestino3', ['Alemania', 'México', 'Cuba']],
    ];

    for (const [key, terms] of conditionalSelects) {
      const comp = page.locator(`.formio-component-${key}`);
      if (await comp.isVisible({ timeout: 2000 }).catch(() => false)) {
        let filled = false;
        for (const term of terms) {
          const ok = await searchAndSelect(page, key, term);
          if (ok) {
            console.log(`${key}: ✓ (${term})`);
            filled = true;
            await page.waitForTimeout(1500);
            break;
          }
        }
        if (!filled) console.log(`${key}: FAILED (tried all terms)`);
      } else {
        console.log(`${key}: not visible (conditional)`);
      }
    }

    // 6d: Text fields in Block12
    const textFieldsBlock12: [string, string][] = [
      ['applicantClienteNacional', 'Empresa Nacional de Prueba'],
      ['applicantClienteNacional2', 'Proveedor Nacional Test'],
      ['applicantAgenteDeCarga', 'Agente Test E2E'],
    ];

    for (const [key, value] of textFieldsBlock12) {
      const inp = page.locator(`.formio-component-${key} input, .formio-component-${key} textarea`).first();
      if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
        await fillText(page, key, value);
        console.log(`${key}: ✓`);
      } else {
        console.log(`${key}: not visible`);
      }
    }

    // 6e: Months requested (number, required)
    const monthsComp = page.locator('.formio-component-applicantCantidadDeMesesSolicitadosNumero input').first();
    if (await monthsComp.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fillNumber(page, 'applicantCantidadDeMesesSolicitadosNumero', '6');
      console.log('CantidadDeMesesSolicitados: ✓');
    } else {
      console.log('CantidadDeMesesSolicitados: not visible');
    }

    // 6f: Checkboxes in Block12
    for (const key of ['applicantFormaDeGestionNoEstatalt', 'applicantFormaDeGestionNoEstatal']) {
      const cb = page.locator(`.formio-component-${key}`);
      if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Don't check — these are optional "forma de gestión no estatal"
        console.log(`${key}: visible (skipping — optional)`);
      }
    }

    // 6g: TipoDeEntidad radio (in Block19 inside Block11)
    const entidadRadio = page.locator('.formio-component-applicantTipoDeEntidad');
    if (await entidadRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try clicking first radio option
      const firstLabel = entidadRadio.locator('label').first();
      if (await firstLabel.isVisible()) {
        const labelText = await firstLabel.textContent();
        await firstLabel.click();
        await page.waitForTimeout(1000);
        console.log(`TipoDeEntidad: ✓ (selected: "${labelText?.trim()}")`);
      }
    } else {
      console.log('TipoDeEntidad: not visible');
    }

    await screenshot(page, SCREENSHOT_DIR, '05-operation-data');
    await logBlocks('after-operation');

    // ══════════════════════════════════════════════════════════════════
    // Step 7: Fill Block9 — Products + Usage
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 7: Products & usage (Block9)...');

    // 7a: Uso (select, required)
    const usoComp = page.locator('.formio-component-applicantUso');
    if (await usoComp.isVisible({ timeout: 3000 }).catch(() => false)) {
      const usoOk = await searchAndSelect(page, 'applicantUso', 'Consumo');
      if (!usoOk) {
        // Try alternatives
        for (const term of ['Industrial', 'Animal', 'Humano', 'Comercial']) {
          const ok = await searchAndSelect(page, 'applicantUso', term);
          if (ok) { console.log(`Uso: ✓ (${term})`); break; }
        }
      } else {
        console.log('Uso: ✓');
      }
      await page.waitForTimeout(2000);
    } else {
      console.log('Uso: not visible');
    }

    // 7b: Products EditGrid (applicantGridProductos)
    const productsGrid = page.locator('.formio-component-applicantGridProductos');
    if (await productsGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Products grid visible');

      // Check for existing rows
      const existingRows = await productsGrid.locator('tr, .datagrid-row, .eg-row').count();
      console.log(`Products grid: ${existingRows} existing elements`);

      // If no rows, try to add one
      const addBtn = productsGrid.locator('button:has-text("Agregar"), button:has-text("Añadir"), .formio-button-add-row').first();
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Product row added');
      }

      // Fill product fields — scroll into view first (editgrid viewport issue)
      // applicantrevisionFitosanitarioProductos2 = select (Productos)
      const prodSelect = page.locator('.formio-component-applicantrevisionFitosanitarioProductos2').first();
      if (await prodSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Scroll the product select component into center of viewport
        await prodSelect.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Use evaluate to scroll the container further to make sure Choices dropdown is in viewport
        await page.evaluate(() => {
          const el = document.querySelector('.formio-component-applicantrevisionFitosanitarioProductos2');
          if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
        await page.waitForTimeout(500);

        let prodFilled = false;
        for (const term of ['Arroz', 'Frutas', 'Vegetales', 'Carne', 'Maíz', 'Café', 'Tabaco']) {
          const ok = await searchAndSelect(page, 'applicantrevisionFitosanitarioProductos2', term);
          if (ok) {
            console.log(`Productos: ✓ (${term})`);
            prodFilled = true;
            await page.waitForTimeout(2000);
            break;
          }
        }
        if (!prodFilled) console.log('Productos: FAILED (tried all terms)');
      }

      // applicantNombreCientifico = text
      const cientComp = page.locator('.formio-component-applicantNombreCientifico input').first();
      if (await cientComp.isVisible({ timeout: 1500 }).catch(() => false)) {
        await fillText(page, 'applicantNombreCientifico', 'Oryza sativa');
        console.log('NombreCientifico: ✓');
      }

      // applicantDescripcion = text
      const descComp = page.locator('.formio-component-applicantDescripcion input').first();
      if (await descComp.isVisible({ timeout: 1500 }).catch(() => false)) {
        await fillText(page, 'applicantDescripcion', 'Producto de prueba E2E');
        console.log('Descripcion: ✓');
      }

      // Save the editgrid row if there's a save button
      const saveRowBtn = productsGrid.locator('button:has-text("Guardar"), button:has-text("Save"), .editgrid-actions button').first();
      if (await saveRowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveRowBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Product row saved');
      }

      await screenshot(page, SCREENSHOT_DIR, '06-products');
    } else {
      console.log('Products grid: not visible');
    }

    // 7c: Semillas DataGrid (applicantMaterialDePropagacion) — may be conditional
    const semillasGrid = page.locator('.formio-component-applicantMaterialDePropagacion');
    if (await semillasGrid.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Semillas grid visible — skipping (conditional, not always needed)');
    } else {
      console.log('Semillas grid: not visible (expected for non-propagation)');
    }

    // 7d: File uploads — just detect, don't upload
    const fileFields = [
      'applicantLicenciaDeLaOficinaDeRegulacionYSeguridadAmbiental2',
      'applicantLicenciaDeLaOficinaDeRegulacionYSeguridadAmbiental',
      'applicantRequerimientosFitosanitarios',
      'applicantAnexo3',
    ];
    for (const key of fileFields) {
      const fileComp = page.locator(`.formio-component-${key}`);
      if (await fileComp.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`FILE ${key}: visible (not uploading in test)`);
      }
    }

    await logBlocks('after-products');

    // ══════════════════════════════════════════════════════════════════
    // Step 8: Contact Info (Block10 inside Block9)
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 8: Contact info...');

    const contactFields: [string, string][] = [
      ['applicantElaboradoPor', 'Test Agent E2E'],
      ['applicantTelefono', '73985278'],
      ['applicantEmail', 'test-e2e@eregistrations.org'],
    ];

    for (const [key, value] of contactFields) {
      const inp = page.locator(`.formio-component-${key} input`).first();
      if (await inp.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inp.scrollIntoViewIfNeeded();
        await inp.fill(value);
        console.log(`Contact ${key}: ✓`);
      } else {
        console.log(`Contact ${key}: not visible`);
      }
    }
    await screenshot(page, SCREENSHOT_DIR, '07-contact');

    // ══════════════════════════════════════════════════════════════════
    // Step 9: Confirmation + Submit
    // ══════════════════════════════════════════════════════════════════
    console.log('Step 9: Final check + submit...');

    await logBlocks('final');

    // Confirmation checkbox
    try {
      await checkBox(page, 'applicantConfirmoLaExactitudDeLaInformacionDeclarada');
      console.log('Confirmation checkbox: ✓');
    } catch {
      console.log('applicantConfirmoLaExactitudDeLaInformacionDeclarada not found, trying alternatives...');
      for (const key of ['applicantCheckbox2', 'applicantConfirmo', 'applicantAcepto']) {
        try {
          await checkBox(page, key);
          console.log(`${key}: ✓`);
          break;
        } catch { /* skip */ }
      }
    }

    // Submit button
    const submitBtn = page.locator('button:has-text("Enviar"), button:has-text("Registrar"), button[type="submit"]').first();
    const canSubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Submit button visible:', canSubmit);

    await screenshot(page, SCREENSHOT_DIR, '08-before-submit');

    if (canSubmit) {
      console.log('Attempting submit...');
      await submitBtn.click();
      await page.waitForTimeout(10_000);
      await screenshot(page, SCREENSHOT_DIR, '09-after-submit');

      const url = page.url();
      const redirectedToDashboard = !url.includes('/services/');
      const hasSolicitudes = await page.locator('text=Mis solicitudes').isVisible({ timeout: 10_000 }).catch(() => false);
      const hasPendiente = await page.locator('text=Pendiente').first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasSuccess = await page.locator('.alert-success, .toast-success').first().isVisible({ timeout: 3_000 }).catch(() => false);

      if (redirectedToDashboard && (hasSolicitudes || hasPendiente)) {
        console.log('✓✓✓ SUBMISSION SUCCESSFUL! Redirected to Bitácora dashboard.');
      } else if (hasSuccess) {
        console.log('✓✓✓ SUBMISSION SUCCESSFUL! (success message)');
      } else {
        console.log('Submission result unclear — check screenshot');
        console.log('URL:', url, '| Solicitudes:', hasSolicitudes, '| Pendiente:', hasPendiente);
      }
    } else {
      console.log('Cannot submit — running diagnostic...');

      // Dump form state
      const appData = await page.evaluate(() => {
        const forms = (window as any).Formio?.forms;
        const key = Object.keys(forms || {})[0];
        const data = forms?.[key]?.submission?.data || {};
        const filtered: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('applicant') || k === 'permisoFitosanitario') filtered[k] = v;
        }
        return filtered;
      });
      console.log('Form data:', JSON.stringify(appData));

      const visComps = await dumpVisibleComponents();
      console.log('Final visible components:', JSON.stringify(visComps, null, 2));

      const emptyRequired = visComps.filter(c => c.required && !c.value);
      if (emptyRequired.length > 0) {
        console.log('EMPTY REQUIRED FIELDS:', JSON.stringify(emptyRequired.map(f => `${f.key} (${f.type})`)));
      }

      // Validation errors
      const validationErrors = await page.evaluate(() => {
        const errors = document.querySelectorAll('.formio-errors .error, .has-error .help-block, .formio-error-wrapper');
        return Array.from(errors).map(el => (el as HTMLElement).innerText).filter(Boolean);
      });
      if (validationErrors.length > 0) {
        console.log('Validation errors:', JSON.stringify(validationErrors));
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '10-final');
    console.log('Fito E2E test complete.');
  });
});
