# Skill: Cuba E2E Service Test — Form Fill & Submit Automation

## When to use
When automating any Cuba eRegistrations service form end-to-end. This skill covers the complete front-office flow: authenticate → select company → navigate to service → set hidden Bitácora fields → fill all form blocks → submit → verify status. Proven on Permiso Eventual (PE); designed to replicate across all 18 Cuba services.

## Prerequisites
- Auth state saved: `countries/cuba/testing/auth-state-cuba.json`
- Playwright config: `countries/cuba/testing/playwright.config.ts`
- Helpers: `countries/cuba/testing/helpers/form-helpers.ts` (13 functions)
- Run command: `npx playwright test specs/<file> --project=cuba-frontoffice --headed`

## Reference Spec
`countries/cuba/testing/specs/pe-e2e-nuevo.spec.ts` (~390 lines, 9 steps)

---

## Process Overview

```
Step 1: Navigate to Bitácora (/)
Step 2: Select company → "Confirmar y continuar"
Step 3: Navigate to service form (/services/{serviceId})
Step 4: Set hidden Bitácora fields via Form.io API
Step 5: Fill visible form blocks (dropdowns, text, selects)
Step 6: Fill DataGrid rows (if applicable)
Step 7: Fill remaining blocks (textarea, contact info)
Step 8: Check confirmation checkbox → Submit
Step 9: Verify redirect + "Pendiente" status
```

---

## Step-by-Step

### 1. Authentication & Company Selection

```typescript
// Auth state is pre-loaded via storageState in playwright.config.ts
await page.goto('/');

// Wait for company list to fully load (counter must not show -1)
await page.waitForFunction(() => {
  const text = document.body.innerText;
  return text.includes('Mis empresas') && !text.includes('(-1)');
}, { timeout: 30_000 });

// Select company and confirm
await page.locator('text=EMPRESA DE SERVICIOS INGENIEROS').first().click();
await page.waitForTimeout(2000);
await page.locator('button:has-text("Confirmar y continuar")').click();
await page.waitForTimeout(3000);
```

### 2. Navigate to Service Form

```typescript
const SERVICE_ID = '2c918084887c7a8f01887c99ed2a6fd5'; // PE — replace per service
await page.goto(`/services/${SERVICE_ID}`);
await page.waitForTimeout(10000); // Critical: form takes time to fully render
await page.waitForSelector('.formio-form', { timeout: 30_000 });
await page.waitForTimeout(3000);
```

### 3. Set Hidden Bitácora Fields (CRITICAL)

Cuba services receive pre-filled data from the Bitácora via internal bots. When testing directly, these fields must be set manually via the Form.io JS API.

```typescript
const setResult = await page.evaluate(() => {
  try {
    const forms = (window as any).Formio?.forms;
    const formKey = Object.keys(forms || {})[0];
    const form = forms?.[formKey];
    if (!form) return 'no form';

    // These keys are service-specific — discovered via form analysis
    const keysToSet: Record<string, string> = {
      applicantStatusLlegaDeLaBitacora: 'true',
      applicantQueQuiereHacer: 'registrarNuevo',
      applicantNit3: '01000348911',
      applicantNombreDeLaEmpresa4: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',
      applicantContadorEventuales: '-1',
    };

    // Set via component API (triggers internal validation)
    for (const [key, value] of Object.entries(keysToSet)) {
      const comp = form.getComponent(key);
      if (comp) comp.setValue(value, { noUpdateEvent: false });
    }

    // Update submission data object
    const current = form.submission?.data || {};
    form.submission = { data: { ...current, ...keysToSet } };

    // ONLY safe re-evaluation method:
    form.checkConditions(form.submission.data);

    return 'OK';
  } catch (e: any) {
    return `ERR: ${e.message}`;
  }
});
```

**NEVER call these methods:**
- `form.onChange()` — triggers Angular navigation/save, crashes the page
- `form.rebuild()` — destroys all setValue data, re-initializes Choices.js dropdowns

### 4. Fill Dropdowns (Choices.js)

Cuba Choices.js dropdowns start **CLOSED** (unlike Jamaica where they start open). The `searchAndSelect` helper handles both:

```typescript
import { searchAndSelect } from '../helpers/form-helpers';

const tipoOk = await searchAndSelect(page, 'applicantTipoDeOperacion2', 'Import');
```

**How `searchAndSelect` works:**
1. Locate `.formio-component-{key}` by class selector
2. Check if search input is visible (Jamaica = yes, Cuba = no)
3. If not visible → click `.choices` wrapper to open dropdown
4. Type search term with `delay: 100` (triggers API search)
5. Wait 2000ms for API response
6. Try `click({ force: true })` on first option
7. If click fails (viewport issue) → fall back to `searchInput.press('Enter')`

**Select values are objects**, not strings:
```javascript
// Stored as: { key: "Importar", value: "Importación" }
// Search for the display text, e.g., "Import"
```

### 5. Fill Text Fields

```typescript
import { fillText, fillNumber } from '../helpers/form-helpers';

await fillText(page, 'applicantProveedorExtranjero3', 'Test Supplier GmbH');
await fillNumber(page, 'applicantValor', '5000');
```

### 6. Fill DataGrid

```typescript
const dgComp = page.locator('.formio-component-applicantDataGridNuevonuevo');

// Check existing rows BEFORE adding (DataGrid may have default row)
const existingRows = await dgComp.locator('tr, .datagrid-row').count();
if (existingRows === 0) {
  await dgComp.locator('button:has-text("Agregar"), .formio-button-add-row').first().click();
  await page.waitForTimeout(2000);
}

// Fill row fields — use .first() for multi-row grids
await searchAndSelect(page, 'applicantSeccion', '01');
await fillText(page, 'applicantDescripcion5', 'Producto de prueba');
await fillNumber(page, 'applicantCantidad', '100');
```

### 7. Confirm & Submit

```typescript
import { checkBox } from '../helpers/form-helpers';

// Check confirmation checkbox
await checkBox(page, 'applicantCheckbox2');

// Submit
const submitBtn = page.locator('button:has-text("Enviar"), button:has-text("Registrar")').first();
await submitBtn.click();
await page.waitForTimeout(10_000);

// Verify: Cuba redirects to dashboard (no .alert-success)
const url = page.url();
const redirected = !url.includes('/services/');
const hasPendiente = await page.locator('text=Pendiente').first()
  .isVisible({ timeout: 5_000 }).catch(() => false);

if (redirected && hasPendiente) {
  console.log('✓✓✓ SUBMISSION SUCCESSFUL');
}
```

---

## Cuba-Specific Patterns (vs Jamaica)

| Pattern | Cuba | Jamaica |
|---------|------|---------|
| **Selectors** | `.formio-component-{key}` class | `[ref="{key}"]` attribute |
| **Choices.js** | Starts CLOSED — click wrapper first | Starts OPEN — input visible |
| **Viewport clicks** | Enter key fallback needed | `force: true` sufficient |
| **form.onChange()** | CRASHES the page | Safe to call |
| **form.rebuild()** | Destroys state — NEVER use | Sometimes needed |
| **Submit detection** | URL redirect + "Pendiente" text | `.alert-success` toast |
| **File uploads** | `a.browse` + filechooser | Same pattern |
| **Hidden fields** | `getComponent().setValue()` + `checkConditions()` | `form.submission = { data }` |
| **Table rows** | DIV-based DataGrid | Standard TR-based |
| **Angular events** | Need `dispatchEvent(new MouseEvent(...))` for programmatic clicks | Playwright `.click()` works |

---

## Adapting for a New Service

To create an E2E test for a different Cuba service:

### Phase 1: Discovery (diagnostic spec)
```typescript
// Run a diagnostic spec that inventories the form
const inventory = await page.evaluate(() => {
  const forms = (window as any).Formio?.forms;
  const form = forms?.[Object.keys(forms)[0]];
  const components: any[] = [];
  form?.everyComponent((c: any) => {
    components.push({
      key: c.key,
      type: c.type,
      label: c.label?.substring(0, 50),
      visible: c.visible !== false,
      hidden: c.component?.hidden || false,
    });
  });
  return components;
});
```

This tells you:
- All field keys (for selectors)
- Which fields are hidden (need Form.io API)
- Which are selects vs text vs checkbox
- Which blocks exist

### Phase 2: Identify hidden Bitácora fields
Look for fields with `hidden: true` that have keys like:
- `applicantStatusLlegaDeLaBitacora` — arrival flag
- `applicantQueQuiereHacer` — operation type (registrarNuevo/modificarExistente)
- `applicantNit*` — company NIT (suffix varies per service!)
- `applicantNombreDeLaEmpresa*` — company name (suffix varies!)
- `applicantContador*` — counter (-1 triggers LISTAR bot)

**IMPORTANT**: PE uses `applicantNit3` and `applicantNombreDeLaEmpresa4`. Other services use different suffixes. Always verify via bot input mappings or form analysis.

### Phase 3: Map bot connections
From the Bitácora, each service is launched via an INTERNO bot. Check:
1. Which ComponentAction triggers the service
2. What input mappings exist (Bitácora field → Service field)
3. What the expected hidden field values are

Use MCP tools:
```
bot_get → input_mapping_list → service form analysis
```

### Phase 4: Write the spec
Copy `pe-e2e-nuevo.spec.ts` as template, then:
1. Replace `SERVICE_ID`
2. Replace hidden field keys + values
3. Replace visible field keys
4. Adjust DataGrid fields if present
5. Adjust submit button text if different
6. Run with `--headed` to debug visually

### Phase 5: Verify
- Check for "Pendiente" in Bitácora after submit
- Cross-reference with Graylog (Observer) for bot execution logs
- Verify no `"status":false` or `"Input payload is empty"` errors

---

## Helper Functions Reference

All in `countries/cuba/testing/helpers/form-helpers.ts`:

| Function | Purpose |
|----------|---------|
| `fillText(page, key, value)` | Text/textarea by component key |
| `fillEmail(page, key, value)` | Email input |
| `typeText(page, key, value)` | Char-by-char for masked inputs |
| `fillNumber(page, key, value)` | Number input |
| `searchAndSelect(page, key, term)` | Choices.js dropdown (handles closed + Enter fallback) |
| `clickRadioLabel(page, key, label)` | Radio button by label text |
| `checkBox(page, key)` | Checkbox (clicks label if not checked) |
| `uploadFile(page, key, path)` | File upload via browse link + filechooser |
| `clickSubTab(page, name)` | Navigate form sub-tabs |
| `setHiddenFields(page, fields)` | Bulk set hidden fields (simple version) |
| `screenshot(page, dir, name)` | Take labeled screenshot |

---

## Debugging Checklist

When a test fails, check in order:

1. **Blocks not visible?** → Hidden fields not set correctly. Log `form.submission.data` and verify all trigger keys are present.
2. **Dropdown returns 0 options?** → Try different search terms. API may use abbreviations or codes. Log the API URL from network tab.
3. **Click fails with "outside viewport"?** → Add `scrollIntoViewIfNeeded()` before click, or use Enter key fallback.
4. **Page crashes/navigates unexpectedly?** → You called `form.onChange()` or `form.rebuild()`. Remove immediately.
5. **Submit button not visible?** → Required field(s) not filled. Run `form.checkValidity()` to find which.
6. **Submit succeeds but no redirect?** → Check for validation errors in DOM: `.has-error`, `.formio-errors`.
7. **Angular doesn't respond to JS clicks?** → Use `dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))`.

---

## Cleanup: Deleting Test Borradores

After testing creates draft entries, clean them up:

```typescript
// Delete buttons in "Mis solicitudes" DataGrid
// IMPORTANT: It's a Form.io DataGrid with DIV rows, not standard HTML table
const deleteButtons = page.locator('button[name*="myApplicationsDelete"]');
const count = await deleteButtons.count();

for (let i = count - 1; i >= 0; i--) {
  const btn = deleteButtons.nth(i);
  await btn.evaluate(el => el.scrollIntoView());
  await btn.evaluate(el => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(2000);
}
```

---

## Known Gaps (PE-specific)
- `applicantSubpartida` (tariff code) — search terms "0201", "Carne" don't match API options
- País de Origen/Embarque — use Enter key fallback (click fails due to viewport)
- `applicantValotTotal` — has typo "Valot" in the key (existing platform bug)
