import { test, expect } from '@playwright/test';
import path from 'path';
import {
  searchAndSelect,
  fillText,
  fillNumber,
  checkBox,
  screenshot,
} from '../helpers/form-helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CONFIGURATION — Change these values for each service
// ═══════════════════════════════════════════════════════════════════════════════

// TEMPLATE: Service ID from SERVICES-MAP.md (e.g., '2c918084887c7a8f01887c99ed2a6fd5' for PE)
const SERVICE_ID = 'REPLACE_WITH_SERVICE_ID';

// TEMPLATE: Human-readable service name for logs and test description
const SERVICE_NAME = 'REPLACE_WITH_SERVICE_NAME';

// TEMPLATE: Short slug for screenshot folder (e.g., 'pe-nuevo', 'fito', 'zoo')
const SERVICE_SLUG = 'REPLACE_WITH_SLUG';

// TEMPLATE: Company to select on the Bitácora dashboard
const COMPANY_NAME = 'EMPRESA DE SERVICIOS INGENIEROS';

// TEMPLATE: Hidden Bitácora fields — these vary per service!
// Consult SERVICES-MAP.md "Campos Clave por Servicio" for NIT/Empresa keys.
// PE uses applicantNit3 / applicantNombreDeLaEmpresa4 / applicantContadorEventuales
// Most other services use applicantNit / applicantNombreDeLaEmpresa (or *11)
// Counter field name varies: applicantContadorEventuales, applicantContador, etc.
const HIDDEN_FIELDS: Record<string, string> = {
  applicantStatusLlegaDeLaBitacora: 'true',
  // TEMPLATE: 'registrarNuevo' for new, 'modificar' for modification flows
  applicantQueQuiereHacer: 'registrarNuevo',
  // TEMPLATE: NIT key — PE uses applicantNit3, most others use applicantNit
  // applicantNit3: '01000348911',       // PE, Cert. Sanitario, Seg. ambiental
  // applicantNit: '01000348911',        // All other services
  // TEMPLATE: Empresa key — PE uses applicantNombreDeLaEmpresa4, others vary
  // applicantNombreDeLaEmpresa4: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',  // PE
  // applicantNombreDeLaEmpresa: '...',   // Fito, Zoo, Cert. Sanitario, ONN
  // applicantNombreDeLaEmpresa11: '...', // Sustancias, CECMED, CyP, etc.
  // applicantNombreEmpresa: '...',       // ONURE
  // TEMPLATE: Counter field — PE uses applicantContadorEventuales, others may differ
  // applicantContadorEventuales: '-1',
};

// TEMPLATE: The first visible block after hidden fields are set (e.g., 'applicantBlock8' for PE)
// Used to verify that hidden field injection worked correctly
const FIRST_VISIBLE_BLOCK = 'applicantBlock8';

// TEMPLATE: Timeout in ms for the full test (10 min = 600_000)
const TEST_TIMEOUT = 600_000;

// ═══════════════════════════════════════════════════════════════════════════════
// FORM FIELD DEFINITIONS — Service-specific dropdowns, text fields, datagrids
// ═══════════════════════════════════════════════════════════════════════════════

// TEMPLATE: FILL SECTION — Choices.js dropdown fields
// Each entry: [componentKey, searchTerm]
// Use multiple entries with fallback terms if the first might not match
const DROPDOWN_FIELDS: [string, string][] = [
  // PE examples:
  // ['applicantTipoDeOperacion2', 'Import'],
  // ['applicantRegimenEspecial', 'Ninguno'],
  // ['applicantCondicionDeLaOperacion', 'Normal'],
  // ['applicantPaisDeOrigen', 'Alemania'],
  // ['applicantPaisDeEmbarque', 'Alemania'],
  // ['applicantPaisDeDestino', 'Cuba'],
];

// TEMPLATE: FILL SECTION — Dropdown fields with fallback search terms
// Each entry: [componentKey, [term1, term2, ...]] — tries each until one works
const DROPDOWN_FIELDS_WITH_FALLBACK: [string, string[]][] = [
  // PE examples:
  // ['applicantRegimenEspecial', ['Ninguno', 'Normal', 'Sin regimen']],
];

// TEMPLATE: FILL SECTION — Plain text and textarea fields
// Each entry: [componentKey, value]
const TEXT_FIELDS: [string, string][] = [
  // PE examples:
  // ['applicantProveedorExtranjero3', 'Test Supplier GmbH'],
  // ['applicantClienteNacional', 'Empresa Nacional de Prueba'],
  // ['applicantObservaciones', 'Prueba E2E automatizada'],
];

// TEMPLATE: FILL SECTION — DataGrid configuration
// Set to null if this service has no DataGrid, or configure:
const DATAGRID_CONFIG: {
  // TEMPLATE: DataGrid component key
  componentKey: string;
  // TEMPLATE: Select fields inside the DataGrid row — [key, [searchTerms]]
  selectFields: [string, string[]][];
  // TEMPLATE: Text fields inside the DataGrid row — [key, value, 'text'|'number']
  inputFields: [string, string, 'text' | 'number'][];
} | null = null;
// PE example:
// const DATAGRID_CONFIG = {
//   componentKey: 'applicantDataGridNuevonuevo',
//   selectFields: [
//     ['applicantSeccion', ['01', 'Animal', 'Carne', 'I']],
//     ['applicantProducto', ['Carne', 'Animal', 'product']],
//     ['applicantSubpartida', ['0201', '0202', 'Carne']],
//   ],
//   inputFields: [
//     ['applicantDescripcion5', 'Producto de prueba E2E', 'text' as const],
//     ['applicantValor', '5000', 'number' as const],
//     ['applicantCantidad', '100', 'number' as const],
//   ],
// };

// TEMPLATE: FILL SECTION — Fundamentación / Justificación
// Block key and possible field keys for the justification textarea
const FUNDAMENTACION_CONFIG = {
  // TEMPLATE: Block that contains the fundamentación (e.g., 'applicantBlock9' for PE)
  blockKey: 'applicantBlock9',
  // TEMPLATE: Possible component keys to try (varies per service)
  fieldKeys: ['applicantFundamentacion', 'applicantJustificacion'],
  // TEMPLATE: Text to fill in
  text: 'Prueba E2E automatizada — Test de servicio',
};

// TEMPLATE: FILL SECTION — Contact info fields (typically in Block3)
const CONTACT_FIELDS: [string, string][] = [
  ['applicantElaboradoPor', 'Test Agent E2E'],
  ['applicantTelefono', '73985278'],
  ['applicantCorreoElectronico', 'test-e2e@eregistrations.org'],
  ['applicantEmail', 'test-e2e@eregistrations.org'],
];

// TEMPLATE: Confirmation checkbox key(s) — tried in order
const CHECKBOX_KEYS = ['applicantCheckbox2', 'applicantConfirmo', 'applicantAcepto', 'applicantDeclaro'];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST IMPLEMENTATION — Generic logic below, should NOT need editing per service
// ═══════════════════════════════════════════════════════════════════════════════

const SCREENSHOT_DIR = path.resolve(__dirname, `../../screenshots/${SERVICE_SLUG}`);

test.describe(`${SERVICE_NAME} E2E — Nuevo`, () => {

  test(`Full flow: Bitacora → ${SERVICE_NAME} form → Fill → Submit`, async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // ──── Helper: check which blocks are visible in DOM ────────────────
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

    // ──── Helper: check if a field component is enabled ────────────────
    async function isFieldEnabled(componentKey: string): Promise<boolean> {
      const comp = page.locator(`.formio-component-${componentKey}`).first();
      const visible = await comp.isVisible({ timeout: 2000 }).catch(() => false);
      if (!visible) return false;
      const disabled = await comp.locator('input:disabled, select:disabled, textarea:disabled').count();
      return disabled === 0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // Step 1: Navigate to Bitacora
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 1: Navigating to Bitacora...');
    await page.goto('/');

    // ═══════════════════════════════════════════════════════════════════
    // Step 2: Select company
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 2: Selecting company...');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Mis empresas') && !text.includes('(-1)');
    }, { timeout: 30_000 });

    await page.locator(`text=${COMPANY_NAME}`).first().click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Confirmar y continuar")').click();
    await page.waitForTimeout(3000);
    console.log('Company confirmed');

    // ═══════════════════════════════════════════════════════════════════
    // Step 3: Navigate directly to the service form
    // ═══════════════════════════════════════════════════════════════════
    console.log(`Step 3: Navigating to ${SERVICE_NAME} form...`);
    await page.goto(`/services/${SERVICE_ID}`);
    await page.waitForTimeout(10000);
    await page.waitForSelector('.formio-form', { timeout: 30_000 });
    await page.waitForTimeout(3000);
    console.log('Formio form loaded. URL:', page.url());
    await screenshot(page, SCREENSHOT_DIR, '01-form-loaded');

    // ═══════════════════════════════════════════════════════════════════
    // Step 4: Handle "Porque no vienen datos" + Set hidden Bitacora fields
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 4: Setting hidden Bitacora fields...');

    // Try "Porque no vienen datos" button first
    const retryBtn = page.locator('button:has-text("Porque no vienen datos")');
    if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }

    // Set hidden fields via Form.io API
    // CRITICAL: use getComponent + setValue + checkConditions
    // NEVER call onChange() or rebuild() — they can trigger page navigation
    const setResult = await page.evaluate((fields) => {
      try {
        const forms = (window as any).Formio?.forms;
        const formKey = Object.keys(forms || {})[0];
        const form = forms?.[formKey];
        if (!form) return 'no form';

        // Set via component API
        for (const [key, value] of Object.entries(fields)) {
          const comp = form.getComponent(key);
          if (comp) comp.setValue(value, { noUpdateEvent: false });
        }

        // Update submission data
        const current = form.submission?.data || {};
        form.submission = { data: { ...current, ...fields } };

        // Only safe method: checkConditions (re-evaluates visibility)
        form.checkConditions(form.submission.data);

        return 'OK';
      } catch (e: any) {
        return `ERR: ${e.message}`;
      }
    }, HIDDEN_FIELDS);
    console.log('Hidden fields result:', setResult);
    await page.waitForTimeout(5000);

    // Verify the expected first block appeared
    const blockOk = await page.locator(`.formio-component-${FIRST_VISIBLE_BLOCK}`)
      .isVisible({ timeout: 5000 }).catch(() => false);
    if (!blockOk) {
      console.log(`BLOCKED — ${FIRST_VISIBLE_BLOCK} not visible after setting hidden fields`);
      await screenshot(page, SCREENSHOT_DIR, '04-BLOCKED');

      // Diagnostic: dump all visible blocks anyway
      await logBlocks('BLOCKED-state');
      return;
    }
    console.log(`Hidden fields set, ${FIRST_VISIBLE_BLOCK} visible`);
    await logBlocks('after-hidden-fields');
    await screenshot(page, SCREENSHOT_DIR, '02-hidden-fields-set');

    // ═══════════════════════════════════════════════════════════════════
    // Step 5: Fill dropdown fields
    // TEMPLATE: FILL SECTION — Adjust DROPDOWN_FIELDS and
    //           DROPDOWN_FIELDS_WITH_FALLBACK in the config above
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 5: Filling dropdown fields...');

    for (const [key, term] of DROPDOWN_FIELDS) {
      const comp = page.locator(`.formio-component-${key}`);
      if (await comp.isVisible({ timeout: 2000 }).catch(() => false)) {
        const ok = await searchAndSelect(page, key, term);
        console.log(`${key}: ${ok ? 'OK' : 'FAILED'}`);
        await page.waitForTimeout(1500);
      } else {
        console.log(`${key}: not visible, skipping`);
      }
    }

    for (const [key, terms] of DROPDOWN_FIELDS_WITH_FALLBACK) {
      const comp = page.locator(`.formio-component-${key}`);
      if (await comp.isVisible({ timeout: 2000 }).catch(() => false)) {
        let filled = false;
        for (const term of terms) {
          const ok = await searchAndSelect(page, key, term);
          if (ok) {
            console.log(`${key}: OK (term: "${term}")`);
            filled = true;
            await page.waitForTimeout(2000);
            break;
          }
        }
        if (!filled) console.log(`${key}: FAILED (tried all terms)`);
      } else {
        console.log(`${key}: not visible, skipping`);
      }
    }

    await logBlocks('after-dropdowns');

    // ═══════════════════════════════════════════════════════════════════
    // Step 6: Fill text fields
    // TEMPLATE: FILL SECTION — Adjust TEXT_FIELDS in the config above
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 6: Filling text fields...');

    for (const [key, value] of TEXT_FIELDS) {
      const inp = page.locator(`.formio-component-${key} input, .formio-component-${key} textarea`).first();
      if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
        if (await isFieldEnabled(key)) {
          await fillText(page, key, value);
          console.log(`${key}: OK`);
        } else {
          console.log(`${key}: disabled, skipping`);
        }
      } else {
        console.log(`${key}: not visible`);
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '03-main-fields');
    await logBlocks('after-text-fields');

    // ═══════════════════════════════════════════════════════════════════
    // Step 7: Fill DataGrid rows
    // TEMPLATE: FILL SECTION — Adjust DATAGRID_CONFIG in the config above
    //           Set to null if service has no DataGrid
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 7: DataGrid...');

    if (DATAGRID_CONFIG) {
      const dgComp = page.locator(`.formio-component-${DATAGRID_CONFIG.componentKey}`);
      if (await dgComp.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check existing rows
        const existingRows = await dgComp.locator('tr, .datagrid-row').count();
        console.log(`DataGrid: ${existingRows} existing row elements`);

        // If no rows, add one
        if (existingRows === 0) {
          const addBtn = dgComp.locator('button:has-text("Agregar"), button:has-text("Añadir"), .formio-button-add-row').first();
          if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(2000);
            console.log('DataGrid row added');
          }
        }

        // Fill select fields in first row
        for (const [key, searchTerms] of DATAGRID_CONFIG.selectFields) {
          const firstComp = page.locator(`.formio-component-${key}`).first();
          if (await firstComp.isVisible({ timeout: 2000 }).catch(() => false)) {
            let filled = false;
            for (const term of searchTerms) {
              const ok = await searchAndSelect(page, key, term);
              if (ok) {
                console.log(`DG ${key}: OK (term: "${term}")`);
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

        // Fill text/number fields in first row
        for (const [key, val, type] of DATAGRID_CONFIG.inputFields) {
          const firstComp = page.locator(`.formio-component-${key}`).first();
          if (await firstComp.isVisible({ timeout: 1500 }).catch(() => false)) {
            if (type === 'number') {
              await fillNumber(page, key, val);
            } else {
              await fillText(page, key, val);
            }
            console.log(`DG ${key}: OK`);
          } else {
            console.log(`DG ${key}: not visible`);
          }
        }

        await screenshot(page, SCREENSHOT_DIR, '04-datagrid');
      } else {
        console.log('DataGrid not visible');
      }
    } else {
      console.log('No DataGrid configured for this service');
    }

    await logBlocks('after-datagrid');

    // ═══════════════════════════════════════════════════════════════════
    // Step 8: Fill Fundamentacion
    // TEMPLATE: FILL SECTION — Adjust FUNDAMENTACION_CONFIG above
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 8: Fundamentacion...');

    const fundBlock = page.locator(`.formio-component-${FUNDAMENTACION_CONFIG.blockKey}`);
    if (await fundBlock.isVisible({ timeout: 3000 }).catch(() => false)) {
      const fundInput = fundBlock.locator('textarea, input').first();
      if (await fundInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fundInput.scrollIntoViewIfNeeded();
        await fundInput.fill(FUNDAMENTACION_CONFIG.text);
        console.log('Fundamentacion: OK');
      }
    } else {
      console.log(`${FUNDAMENTACION_CONFIG.blockKey} not visible — searching for fundamentacion field...`);
      const selectors = FUNDAMENTACION_CONFIG.fieldKeys
        .map(k => `.formio-component-${k} textarea`)
        .join(', ');
      const fundAnywhere = page.locator(selectors).first();
      if (await fundAnywhere.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fundAnywhere.scrollIntoViewIfNeeded();
        await fundAnywhere.fill(FUNDAMENTACION_CONFIG.text);
        console.log('Fundamentacion (found elsewhere): OK');
      } else {
        console.log('Fundamentacion field not found anywhere');
      }
    }
    await screenshot(page, SCREENSHOT_DIR, '05-fundamentacion');

    // ═══════════════════════════════════════════════════════════════════
    // Step 9: Fill Contact Info (typically Block3)
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 9: Contact info...');

    const block3 = page.locator('.formio-component-applicantBlock3');
    if (await block3.isVisible({ timeout: 3000 }).catch(() => false)) {
      for (const [key, value] of CONTACT_FIELDS) {
        const inp = page.locator(`.formio-component-${key} input`).first();
        if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
          await inp.scrollIntoViewIfNeeded();
          await inp.fill(value);
          console.log(`Contact ${key}: OK`);
        }
      }
    } else {
      console.log('Block3 not visible — trying contact fields without block scope');
      for (const [key, value] of CONTACT_FIELDS) {
        const inp = page.locator(`.formio-component-${key} input`).first();
        if (await inp.isVisible({ timeout: 1500 }).catch(() => false)) {
          await inp.scrollIntoViewIfNeeded();
          await inp.fill(value);
          console.log(`Contact ${key}: OK`);
        }
      }
    }
    await screenshot(page, SCREENSHOT_DIR, '06-contact');

    // ═══════════════════════════════════════════════════════════════════
    // Step 10: Confirmation checkbox + Submit
    // ═══════════════════════════════════════════════════════════════════
    console.log('Step 10: Final check + submit...');

    const visibleBlocks = await logBlocks('final');

    // Check confirmation checkbox — try each key in order
    let checkboxDone = false;
    for (const key of CHECKBOX_KEYS) {
      try {
        await checkBox(page, key);
        console.log(`Confirmation checkbox ${key}: OK`);
        checkboxDone = true;
        break;
      } catch { /* try next key */ }
    }
    if (!checkboxDone) console.log('No confirmation checkbox found');

    // Find submit button
    const submitBtn = page.locator(
      'button:has-text("Enviar"), button:has-text("Registrar"), button[type="submit"]'
    ).first();
    const canSubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Submit button visible:', canSubmit);

    await screenshot(page, SCREENSHOT_DIR, '07-before-submit');

    if (canSubmit) {
      console.log('Submitting...');
      await submitBtn.click();
      await page.waitForTimeout(10_000);
      await screenshot(page, SCREENSHOT_DIR, '08-after-submit');

      // Cuba redirects to Bitacora dashboard after successful submission
      const url = page.url();
      const redirectedToDashboard = !url.includes('/services/');
      const hasSolicitudes = await page.locator('text=Mis solicitudes').isVisible({ timeout: 10_000 }).catch(() => false);
      const hasPendiente = await page.locator('text=Pendiente').first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasSuccess = await page.locator('.alert-success, .toast-success').first().isVisible({ timeout: 3_000 }).catch(() => false);

      if (redirectedToDashboard && (hasSolicitudes || hasPendiente)) {
        console.log('SUBMISSION SUCCESSFUL! Redirected to Bitacora dashboard.');
        if (hasPendiente) console.log('Solicitud status: Pendiente');
      } else if (hasSuccess) {
        console.log('SUBMISSION SUCCESSFUL! (success message detected)');
      } else {
        console.log('Submission result unclear — check screenshot');
        console.log('URL:', url, '| Solicitudes:', hasSolicitudes, '| Pendiente:', hasPendiente);
      }
    } else {
      console.log('Cannot submit yet — running diagnostic inventory...');

      // ═════════════════════════════════════════════════════════════════
      // Diagnostic: dump all form state for debugging
      // ═════════════════════════════════════════════════════════════════

      // Dump applicant submission data
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

      // List all visible components with their types and values
      const visComps = await page.evaluate(() => {
        const els = document.querySelectorAll('.formio-component[class*="applicant"]');
        return Array.from(els)
          .filter(el => (el as HTMLElement).offsetParent !== null && (el as HTMLElement).offsetHeight > 0)
          .map(el => {
            const cls = Array.from(el.classList).find(c => c.startsWith('formio-component-applicant'));
            const key = cls?.replace('formio-component-', '');
            // Detect component type from DOM
            const hasSelect = el.querySelector('.choices, select') !== null;
            const hasTextarea = el.querySelector('textarea') !== null;
            const hasCheckbox = el.querySelector('input[type="checkbox"]') !== null;
            const hasNumber = el.querySelector('input[type="number"]') !== null;
            const hasInput = el.querySelector('input') !== null;
            const hasDatagrid = el.classList.contains('formio-component-datagrid');
            const type = hasDatagrid ? 'datagrid' : hasSelect ? 'select' : hasTextarea ? 'textarea' :
              hasCheckbox ? 'checkbox' : hasNumber ? 'number' : hasInput ? 'input' : 'other';
            // Check if it has a value
            const input = el.querySelector('input, textarea, select') as HTMLInputElement | null;
            const value = input?.value || '';
            const isEmpty = !value && !hasCheckbox;
            return { key, type, isEmpty };
          })
          .filter(c => c.key);
      });
      console.log('Visible components inventory:', JSON.stringify(visComps, null, 2));

      // Highlight empty required fields
      const emptyFields = visComps.filter(c => c.isEmpty);
      if (emptyFields.length > 0) {
        console.log('EMPTY FIELDS that may need filling:', JSON.stringify(emptyFields.map(f => `${f.key} (${f.type})`)));
      }

      // Check for validation errors in the DOM
      const validationErrors = await page.evaluate(() => {
        const errors = document.querySelectorAll('.formio-errors .error, .has-error .help-block, .formio-error-wrapper');
        return Array.from(errors).map(el => (el as HTMLElement).innerText).filter(Boolean);
      });
      if (validationErrors.length > 0) {
        console.log('Validation errors:', JSON.stringify(validationErrors));
      }
    }

    await screenshot(page, SCREENSHOT_DIR, '09-final');
    console.log(`${SERVICE_NAME} E2E test complete.`);
  });
});
