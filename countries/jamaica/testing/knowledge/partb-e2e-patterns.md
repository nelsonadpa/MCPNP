# Part B E2E Testing Patterns — Jamaica

> Conocimiento extraído del CI Selective Routing test (2026-03-05).
> Aplica a CUALQUIER servicio Part B en eRegistrations Jamaica.

## Quick Start

```bash
cd countries/jamaica/testing
npx playwright test specs/[spec-name].spec.ts --project=jamaica-frontoffice --headed
```

Auth refresh (si falla con tareas vacías):
```bash
npx playwright test specs/auth-setup.spec.ts --project=auth-setup
```

---

## 1. Navegación a roles Part B

```typescript
// Back-office (processing roles)
await page.goto(`/part-b/${SERVICE_ID}/${camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`);

// Applicant roles (complementaryInformation, complementaryInformationSl, etc.)
await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
```

**Regla**: Si el role tiene `assigned_to: applicant` → usa `/services/`. Si no → usa `/part-b/`.

---

## 2. Processing Tab (CRÍTICO)

Los botones de acción están en el tab "Processing", NO en "Documents" ni "Data".

```typescript
const procTab = page.locator('a:has-text("Processing")').first();
if (await procTab.isVisible().catch(() => false)) {
  await procTab.click();
  await page.waitForTimeout(3000);
}
```

**Aplica a**: documentsCheck, todas las evaluaciones, todas las approvals, ARC, statusLetter, boardSubmission, etc.

---

## 3. Guardar EditGrid rows (CRÍTICO — fix universal)

Muchas páginas Part B cargan con EditGrid rows en estado `editing`. Esto causa **"Please save all rows before proceeding"** — validation error SILENCIOSA (el botón parece clickearse pero no hay network request).

```typescript
// SIEMPRE ejecutar ANTES de hacer click en cualquier botón de acción
await page.evaluate(() => {
  const formio = (window as any).Formio; if (!formio?.forms) return;
  for (const fk of Object.keys(formio.forms)) {
    const form = formio.forms[fk]; if (!form?.root) continue;
    form.root.everyComponent((comp: any) => {
      if (comp.component?.type === 'editgrid' && comp.editRows) {
        for (let i = 0; i < comp.editRows.length; i++) {
          const state = comp.editRows[i]?.state;
          if (state === 'new' || state === 'editing') {
            try { comp.saveRow(i); } catch {
              try { comp.cancelRow(i); } catch {}
            }
          }
        }
      }
    });
  }
});
```

---

## 4. FORMDATAVALIDATIONSTATUS

Algunos botones están deshabilitados hasta que este campo se ponga en `'true'`.

```typescript
await page.evaluate(() => {
  const formio = (window as any).Formio; if (!formio?.forms) return;
  for (const k of Object.keys(formio.forms)) {
    const form = formio.forms[k]; if (!form?.root) continue;
    form.root.everyComponent((comp: any) => {
      if (comp.component?.key === 'FORMDATAVALIDATIONSTATUS') {
        comp.setValue('true'); comp.triggerChange?.();
      }
    });
    form.root.checkConditions?.();
  }
});
```

---

## 5. Obtener tareas pendientes

```typescript
async function getTasks(page: any, processId: string): Promise<any[]> {
  const result = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    const text = await r.text();
    if (!r.ok) return { error: `HTTP ${r.status}` };
    try {
      const d = JSON.parse(text);
      return { tasks: (d.tasks || []).map((t: any) => ({
        id: t.id, camundaName: t.camundaName, shortname: t.shortname, endTime: t.endTime
      })) };
    } catch { return { error: 'JSON parse' }; }
  }, processId);
  if (result.error) { console.log(`⚠ getTasks: ${result.error}`); return []; }
  return result.tasks;
}

function pending(tasks: any[]) { return tasks.filter((t: any) => !t.endTime); }
function pendingNames(tasks: any[]) { return pending(tasks).map((t: any) => t.camundaName); }
```

Si `getTasks` devuelve vacío → auth expirada. Refresh con `auth-setup.spec.ts`.

---

## 6. processRole() — Función universal

```typescript
async function processRole(page, serviceId, processId, fileId, camundaName) {
  // 1. Navegar
  await page.goto(`/part-b/${serviceId}/${camundaName}/${processId}?file_id=${fileId}`);
  await page.waitForTimeout(5000);

  // 2. Processing tab
  const procTab = page.locator('a:has-text("Processing")').first();
  if (await procTab.isVisible().catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // 3. Guardar EditGrid rows
  await page.evaluate(() => { /* ... código del paso 3 ... */ });
  await page.waitForTimeout(1000);

  // 4. FORMDATAVALIDATIONSTATUS
  await page.evaluate(() => { /* ... código del paso 4 ... */ });
  await page.waitForTimeout(1000);

  // 5. Save draft
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveDraft')));
  await page.waitForTimeout(3000);

  // 6. Buscar y click botón de acción
  const btnSelectors = [
    'button:has-text("Approve documents check")',
    'button:has-text("Send evaluation to approval")',
    'button:has-text("Send evaluation for approval")',
    'button:has-text("Send consultation documents")',
    'button:has-text("Send decision to SEZA")',
    'button:has-text("Approve and send to ARC")',
    'button:has-text("Approve and send")',
    'button:has-text("Send to ARC")',
    'button:has-text("Send to Board")',
    'button:has-text("Issue status letter")',
    'button:has-text("Generate")',
    'button:has-text("Sign")',
    'button:has-text("Approve")',
  ];
  // ... buscar primer botón visible, click, confirmar diálogo
}
```

---

## 7. Submit de roles applicant

```typescript
await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
await page.waitForTimeout(8000);

// Dispatch saveSENDPAGE (igual que corrections flow)
await page.evaluate(() => window.dispatchEvent(new CustomEvent('saveSENDPAGE')));
await page.waitForTimeout(10000);

// Confirmar diálogo si aparece
for (const label of ['OK', 'Confirm', 'Yes', 'Submit', 'Send']) {
  const btn = page.locator(`button:has-text("${label}")`).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click(); await page.waitForTimeout(5000); break;
  }
}
```

---

## 8. Formio customEvent — Trigger de transiciones

Cuando un botón tiene `action: "custom"` (vacío) o está oculto, se puede emitir el evento directamente:

```typescript
// fileDecline (Request additional information / Send back)
await page.evaluate(() => {
  const formio = (window as any).Formio; if (!formio?.forms) return;
  for (const fk of Object.keys(formio.forms)) {
    const form = formio.forms[fk];
    if (form && form.emit) {
      form.emit('customEvent', {
        type: 'fileDecline',
        component: { key: 'THE_BUTTON_KEY' }
      });
    }
  }
});

// fileValidated (Approve / Send to Board)
// Mismo patrón con type: 'fileValidated'
```

**Cadena de eventos Angular**:
```
form.emit('customEvent', {type})
  → Angular @angular/formio: this.formio.on("customEvent", ...)
  → fireCustomEvent(s)
  → s.type includes "decline" → declineFile()
  → s.type includes "validated" → validateFile()
  → s.type includes "reject" → rejectFile()
```

---

## 9. EditGrid fill directo (bypass Choices.js)

Choices.js dropdowns son frágiles en Playwright. Usar dataValue directo:

```typescript
await page.evaluate((args) => {
  const formio = (window as any).Formio; if (!formio?.forms) return;
  for (const fk of Object.keys(formio.forms)) {
    const form = formio.forms[fk]; if (!form?.root) continue;
    form.root.everyComponent((comp: any) => {
      if (comp.component?.key === args.gridKey) {
        comp.dataValue = [
          { [args.selectKey]: { key: 'uuid-1', value: 'Option A' } },
          { [args.selectKey]: { key: 'uuid-2', value: 'Option B' } },
        ];
        comp.triggerChange?.();
      }
    });
  }
}, { gridKey: 'editGridKey', selectKey: 'selectFieldKey' });
```

---

## 10. Radio/Select set directo

```typescript
await page.evaluate((key: string) => {
  const formio = (window as any).Formio; if (!formio?.forms) return;
  for (const fk of Object.keys(formio.forms)) {
    const form = formio.forms[fk]; if (!form?.root) continue;
    form.root.everyComponent((comp: any) => {
      if (comp.component?.key === key) {
        comp.setValue('yes'); // o 'no', o el valor que necesites
        comp.triggerChange?.();
      }
    });
    form.root.checkConditions?.(); // re-evalúa determinantes
  }
}, 'theFieldKey');
```

---

## 11. Diálogos de confirmación

Después de click en botón de acción, esperar y confirmar:

```typescript
await page.waitForTimeout(8000);
for (const label of ['OK', 'Confirm', 'Yes', 'Send']) {
  const btn = page.locator(`button:has-text("${label}")`).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(5000);
    break;
  }
}
```

---

## 12. Gotchas

| Problema | Causa | Fix |
|----------|-------|-----|
| getTasks devuelve vacío | Auth expirada | `npx playwright test specs/auth-setup.spec.ts --project=auth-setup` |
| Botón click sin network request | EditGrid rows sin guardar | Paso 3: saveRow/cancelRow |
| Botón deshabilitado | FORMDATAVALIDATIONSTATUS no set | Paso 4 |
| Botón oculto (hidden) | Determinante controla visibilidad | Cambiar el campo que controla el determinante |
| Choices.js "outside viewport" | Dropdown no scrollea | Usar dataValue directo (Paso 9) |
| Role applicant sin form | Usando /part-b/ URL | Usar /services/ URL (Paso 7) |
| File usa config vieja | Workflow se fija al crear file | Crear file nuevo después del cambio |
| EditGrid con filas stale | Datos de sesiones anteriores | `comp.removeRow(i)` de último a primero |

---

## Workflow Jamaica "Establish a new zone"

```
documentsCheck
  → businessEvaluation, complianceEvaluation, technicalEvaluation,
    legalEvaluation, organizeNocAndInspection (paralelo)
  → businessApproval, complianceApproval, technicalApproval,
    legalApproval, tajApproval, mofpsApproval, jcaApproval
  → arcAppRevCommittee
    → [radio=yes] complementaryInformation (applicant)
      → selective evals + approvals → arcAppRevCommittee
    → [radio=no] statusLetter → signatureStatusLetter
      → complementaryInformationSl (applicant)
      → boardSubmission → ceoValidation → board → sezDocuments
```

Roles applicant: `complementaryInformation`, `complementaryInformationSl`
Todo lo demás: Part B processing (back-office).
