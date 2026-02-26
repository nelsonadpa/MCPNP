import { test, expect } from '@playwright/test';
import path from 'path';
import {
  searchAndSelect,
  fillText,
  fillNumber,
  checkBox,
  screenshot,
} from '../helpers/form-helpers';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/pe-nuevo');

test.describe('PE E2E — Nuevo Permiso Eventual', () => {

  test('Full flow: Bitácora → PE form → Fill → Submit', async ({ page }) => {
    test.setTimeout(600_000); // 10 min — full flow

    // ──── Helper: get Form.io form instance ────────────────────────
    function getForm() {
      return page.evaluate(() => {
        const forms = (window as any).Formio?.forms;
        const key = Object.keys(forms || {})[0];
        return forms?.[key] ? true : false;
      });
    }

    // Helper: check which blocks are visible in DOM
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

    // ──── Step 1: Navigate to Bitácora ────────────────────────────────
    console.log('Step 1: Navigating to Bitácora...');
    await page.goto('/');

    // ──── Step 2: Select company ──────────────────────────────────────
    console.log('Step 2: Selecting company...');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Mis empresas') && !text.includes('(-1)');
    }, { timeout: 30_000 });

    await page.locator('text=EMPRESA DE SERVICIOS INGENIEROS').first().click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Confirmar y continuar")').click();
    await page.waitForTimeout(3000);
    console.log('✓ Company confirmed');

    // ──── Step 3: Navigate directly to PE form ───────────────────────
    console.log('Step 3: Navigating to PE form...');
    const PE_SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5';
    await page.goto(`/services/${PE_SERVICE_ID}`);
    await page.waitForTimeout(10000);
    await page.waitForSelector('.formio-form', { timeout: 30_000 });
    await page.waitForTimeout(3000);
    console.log('✓ Formio form loaded. URL:', page.url());
    await screenshot(page, SCREENSHOT_DIR, '01-form-loaded');

    // ──── Step 4: Set hidden Bitácora fields ─────────────────────────
    console.log('Step 4: Setting hidden Bitácora fields...');

    // Try "Porque no vienen datos" button first
    const retryBtn = page.locator('button:has-text("Porque no vienen datos")');
    if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }

    // Set hidden fields via Form.io API (no onChange — can trigger page navigation)
    const setResult = await page.evaluate(() => {
      try {
        const forms = (window as any).Formio?.forms;
        const formKey = Object.keys(forms || {})[0];
        const form = forms?.[formKey];
        if (!form) return 'no form';

        const keysToSet: Record<string, string> = {
          applicantStatusLlegaDeLaBitacora: 'true',
          applicantQueQuiereHacer: 'registrarNuevo',
          applicantNit3: '01000348911',
          applicantNombreDeLaEmpresa4: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',
          applicantContadorEventuales: '-1',
        };

        // Set via component API
        for (const [key, value] of Object.entries(keysToSet)) {
          const comp = form.getComponent(key);
          if (comp) comp.setValue(value, { noUpdateEvent: false });
        }

        // Update submission data
        const current = form.submission?.data || {};
        form.submission = { data: { ...current, ...keysToSet } };

        // Only safe method: checkConditions (re-evaluates visibility)
        form.checkConditions(form.submission.data);

        return 'OK';
      } catch (e: any) {
        return `ERR: ${e.message}`;
      }
    });
    console.log('Hidden fields:', setResult);
    await page.waitForTimeout(5000);

    // Verify Block8 appeared
    const block8Ok = await page.locator('.formio-component-applicantBlock8').isVisible({ timeout: 5000 }).catch(() => false);
    if (!block8Ok) {
      console.log('BLOCKED — Block8 not visible after setting hidden fields');
      await screenshot(page, SCREENSHOT_DIR, '04-BLOCKED');
      return;
    }
    console.log('✓ Hidden fields set, Block8 visible');
    await logBlocks('after-hidden-fields');
    await screenshot(page, SCREENSHOT_DIR, '02-hidden-fields-set');

    // ──── Step 5: Fill Block8 — Operation Data ───────────────────────
    console.log('Step 5: Filling operation data...');

    // 5a: Tipo de operación
    const tipoOk = await searchAndSelect(page, 'applicantTipoDeOperacion2', 'Import');
    console.log('Tipo de operación:', tipoOk ? '✓' : 'FAILED');
    await page.waitForTimeout(3000);
    await logBlocks('after-tipo');

    // 5b: Régimen especial (try several search terms)
    const regimenComp = page.locator('.formio-component-applicantRegimenEspecial');
    if (await regimenComp.isVisible({ timeout: 3000 }).catch(() => false)) {
      const regimenOk = await searchAndSelect(page, 'applicantRegimenEspecial', 'Ninguno');
      if (!regimenOk) {
        // Try alternative search terms
        const alt = await searchAndSelect(page, 'applicantRegimenEspecial', 'Normal');
        console.log('Régimen especial:', alt ? '✓ (Normal)' : 'FAILED');
      } else {
        console.log('Régimen especial: ✓');
      }
      await page.waitForTimeout(2000);
    }

    // 5c: Check what new fields appeared after tipo + regimen
    await logBlocks('after-regimen');

    // 5d: Fill other selects that may have appeared
    const conditionalSelects: [string, string][] = [
      ['applicantCondicionDeLaOperacion', 'Normal'],
      ['applicantPaisDeOrigen', 'Alemania'],
      ['applicantPaisDeEmbarque', 'Alemania'],
      ['applicantPaisDeDestino', 'Cuba'],
    ];

    for (const [key, term] of conditionalSelects) {
      const comp = page.locator(`.formio-component-${key}`);
      if (await comp.isVisible({ timeout: 2000 }).catch(() => false)) {
        const ok = await searchAndSelect(page, key, term);
        console.log(`${key}: ${ok ? '✓' : 'FAILED'}`);
        await page.waitForTimeout(1500);
      }
    }

    // 5e: Fill text fields in Block8
    const textFields: [string, string][] = [
      ['applicantProveedorExtranjero3', 'Test Supplier GmbH'],
      ['applicantProveedorExtranjero', 'Test Supplier GmbH'],
      ['applicantClienteNacional', 'Empresa Nacional de Prueba'],
      ['applicantObservaciones', 'Prueba E2E automatizada'],
    ];

    for (const [key, value] of textFields) {
      const inp = page.locator(`.formio-component-${key} input, .formio-component-${key} textarea`).first();
      if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
        await fillText(page, key, value);
        console.log(`${key}: ✓`);
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '03-operation-data');
    await logBlocks('after-block8');

    // ──── Step 6: Fill Products DataGrid (Block18) ───────────────────
    console.log('Step 6: Products DataGrid...');

    const dgComp = page.locator('.formio-component-applicantDataGridNuevonuevo');
    if (await dgComp.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check how many rows already exist
      const existingRows = await dgComp.locator('tr, .datagrid-row, .formio-component-applicantSubpartida').count();
      console.log(`DataGrid: ${existingRows} existing row elements`);

      // If no rows, add one
      if (existingRows === 0) {
        const addBtn = dgComp.locator('button:has-text("Agregar"), button:has-text("Añadir"), .formio-button-add-row').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(2000);
          console.log('✓ DataGrid row added');
        }
      }

      // Fill first row — use .first() to target only the first instance
      // Selects: Capitulo (=Seccion), Subpartida (may be search-based)
      const selectDgFields: [string, string[]][] = [
        ['applicantSeccion', ['01', 'Animal', 'Carne', 'I']],
        ['applicantProducto', ['Carne', 'Animal', 'product']],
        ['applicantSubpartida', ['0201', '0202', 'Carne']],
      ];

      for (const [key, searchTerms] of selectDgFields) {
        const firstComp = page.locator(`.formio-component-${key}`).first();
        if (await firstComp.isVisible({ timeout: 2000 }).catch(() => false)) {
          let filled = false;
          for (const term of searchTerms) {
            const ok = await searchAndSelect(page, key, term);
            if (ok) {
              console.log(`DG ${key}: ✓ (term: "${term}")`);
              filled = true;
              await page.waitForTimeout(2000);
              break;
            }
          }
          if (!filled) console.log(`DG ${key}: FAILED (tried all terms)`);
        } else {
          console.log(`DG ${key}: not visible`);
        }
      }

      // Text & number fields
      const dgTextFields: [string, string, 'text' | 'number'][] = [
        ['applicantDescripcion5', 'Producto de prueba E2E', 'text'],
        ['applicantValor', '5000', 'number'],
        ['applicantCantidad', '100', 'number'],
      ];

      for (const [key, val, type] of dgTextFields) {
        const firstComp = page.locator(`.formio-component-${key}`).first();
        if (await firstComp.isVisible({ timeout: 1500 }).catch(() => false)) {
          if (type === 'number') {
            await fillNumber(page, key, val);
          } else {
            await fillText(page, key, val);
          }
          console.log(`DG ${key}: ✓`);
        } else {
          console.log(`DG ${key}: not visible`);
        }
      }

      await screenshot(page, SCREENSHOT_DIR, '04-products');
    } else {
      console.log('DataGrid not visible');
    }

    await logBlocks('after-products');

    // ──── Step 7: Fill Fundamentación (Block9) ───────────────────────
    console.log('Step 7: Fundamentación...');

    const block9 = page.locator('.formio-component-applicantBlock9');
    if (await block9.isVisible({ timeout: 3000 }).catch(() => false)) {
      const fundInput = block9.locator('textarea, input').first();
      if (await fundInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fundInput.scrollIntoViewIfNeeded();
        await fundInput.fill('Prueba E2E automatizada - Test trazabilidad Observer Agent');
        console.log('Fundamentación: ✓');
      }
    } else {
      console.log('Block9 not visible — trying to find fundamentación field anywhere...');
      const fundAnywhere = page.locator('.formio-component-applicantFundamentacion textarea, .formio-component-applicantJustificacion textarea').first();
      if (await fundAnywhere.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fundAnywhere.scrollIntoViewIfNeeded();
        await fundAnywhere.fill('Prueba E2E automatizada');
        console.log('Fundamentación (found elsewhere): ✓');
      }
    }
    await screenshot(page, SCREENSHOT_DIR, '05-fundamentacion');

    // ──── Step 8: Fill Contact Info (Block3) ─────────────────────────
    console.log('Step 8: Contact info...');

    const block3 = page.locator('.formio-component-applicantBlock3');
    if (await block3.isVisible({ timeout: 3000 }).catch(() => false)) {
      const contactFields: [string, string][] = [
        ['applicantElaboradoPor', 'Test Agent E2E'],
        ['applicantTelefono', '73985278'],
        ['applicantCorreoElectronico', 'test-e2e@eregistrations.org'],
        ['applicantEmail', 'test-e2e@eregistrations.org'],
      ];

      for (const [key, value] of contactFields) {
        const inp = page.locator(`.formio-component-${key} input`).first();
        if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
          await inp.scrollIntoViewIfNeeded();
          await inp.fill(value);
          console.log(`Contact ${key}: ✓`);
        }
      }
    } else {
      console.log('Block3 not visible');
    }
    await screenshot(page, SCREENSHOT_DIR, '06-contact');

    // ──── Step 9: Final status + attempt submit ──────────────────────
    console.log('Step 9: Final check...');

    const visibleBlocks = await logBlocks('final');

    // Check confirmation checkbox (applicantCheckbox2 = "Confirmo la exactitud...")
    try {
      await checkBox(page, 'applicantCheckbox2');
      console.log('Confirmation checkbox: ✓');
    } catch {
      console.log('applicantCheckbox2 not found, trying alternatives...');
      for (const key of ['applicantConfirmo', 'applicantAcepto', 'applicantDeclaro']) {
        try {
          await checkBox(page, key);
          console.log(`${key}: ✓`);
          break;
        } catch { /* skip */ }
      }
    }

    // Find submit button
    const submitBtn = page.locator('button:has-text("Enviar"), button:has-text("Registrar"), button[type="submit"]').first();
    const canSubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Submit button visible:', canSubmit);

    await screenshot(page, SCREENSHOT_DIR, '07-before-submit');

    if (canSubmit) {
      console.log('Submitting...');
      await submitBtn.click();
      await page.waitForTimeout(10_000);
      await screenshot(page, SCREENSHOT_DIR, '08-after-submit');

      // Check result
      const success = await page.locator('.alert-success, .toast-success').first().isVisible({ timeout: 15_000 }).catch(() => false);
      if (success) {
        console.log('✓✓✓ SUBMISSION SUCCESSFUL!');
      } else {
        console.log('Submission result unclear — check screenshot');
      }
    } else {
      console.log('Cannot submit yet — dumping form state...');

      // Dump applicant data
      const appData = await page.evaluate(() => {
        const forms = (window as any).Formio?.forms;
        const key = Object.keys(forms || {})[0];
        const data = forms?.[key]?.submission?.data || {};
        const filtered: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('applicant')) filtered[k] = v;
        }
        return filtered;
      });
      console.log('Applicant data:', JSON.stringify(appData));

      // List all visible components with their types
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
      console.log('Visible applicant components:', JSON.stringify(visComps));
    }

    await screenshot(page, SCREENSHOT_DIR, '09-final');
    console.log('PE E2E test complete.');
  });
});
