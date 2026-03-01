# Fito E2E Testing Report — Permiso Fitosanitario

**Date**: 2026-02-28
**Status**: PASSING (nuevo flow) — 2.5 min
**Spec**: `specs/fito-e2e-nuevo.spec.ts`
**Service ID**: `2c91808893792e2b019379310a8003a9`

---

## Test Results

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Company select | EMPRESA DE SERVICIOS INGENIEROS | PASS | |
| Form load | `/services/{id}` | PASS | Block12 visible immediately |
| Hidden fields | StatusBitacora + NIT + Empresa + Counter | PASS | Set via Form.io API |
| Tipo de operación | `applicantTipoDeOperacion` | PASS | "Importación" |
| Medio de Transporte | `applicantMedioDeTransporte2` | PASS | Options: **Avión, Barco** |
| País de origen | `applicantPaisDeOrigen` | PASS | "Alemania" |
| País de embarque | `applicantPaisDeEmbarque` | PASS | "Alemania" |
| Punto de embarque | `applicantPuertoDeEmbarque` | PASS | "Terminal de Contenedores Mariel" |
| Cliente nacional | `applicantClienteNacional` | PASS | Text field |
| Meses solicitados | `applicantCantidadDeMesesSolicitadosNumero` | PASS | 6 months |
| Periodo desde/hasta | auto-filled | PASS | Calculates automatically from months |
| Uso | `applicantUso` | PASS | "Consumo Humano" |
| Productos (EditGrid) | `applicantGridProductos` | PASS | "Arroz" (need scroll fix) |
| Nombre científico | `applicantNombreCientifico` | PASS | "Oryza sativa" |
| Descripción | `applicantDescripcion` | PASS | |
| Contact info | ElaboradoPor, Telefono, Email | PASS | Auto-populated from user account |
| Checkbox | `applicantConfirmoLaExactitudDeLaInformacionDeclarada` | PASS | |
| Submit | "Enviar" | **PASS** | Redirects to Bitácora dashboard |

---

## Key Differences from PE

| Aspect | PE | Fito |
|--------|-----|------|
| NIT key | `applicantNit3` | `applicantNit` |
| Empresa key | `applicantNombreDeLaEmpresa4` | `applicantNombreDeLaEmpresa` |
| Counter key | `applicantContadorEventuales` | `applicantcontadorPermisosExistentes` |
| QueQuiereHacer | Required (`registrarNuevo`) | **Does not exist** |
| First block | Block8 (hidden until StatusBitacora set) | Block12 (visible immediately) |
| Products grid | `applicantDataGridNuevonuevo` (datagrid) | `applicantGridProductos` (editgrid) |
| Products save | No save button | **Has "Guardar fila" button** |
| Transport | N/A | `applicantMedioDeTransporte2` (Avión/Barco) |
| Dates | N/A | Auto-calculated from months |
| Fundamentación | Block9 textarea | N/A (not present) |
| Contact block | Block3 | Block10 (inside Block9) |
| Contact pre-fill | Manual fill needed | **Auto-populated from user account** |
| Checkbox key | `applicantCheckbox2` | `applicantConfirmoLaExactitudDeLaInformacionDeclarada` |
| Regime/Condition selects | 2 conditionals | N/A |
| File uploads | None | 4 optional file fields (not required) |

---

## Form Structure (discovered)

### Blocks visible at each stage:
1. **Initial**: `BlockEmpresa(168px)` + `Block12(164px)` — only 3 components
2. **After Tipo operación**: `Block12` expands to 478px — country/port/date fields appear
3. **After products**: `Block9(495px)` + `Block10(138px)` + `Block27(208px)` appear

### Hidden fields (from INTERNO bot):
```typescript
{
  applicantStatusLlegaDeLaBitacora: 'true',
  applicantNit: '01000348911',
  applicantNombreDeLaEmpresa: 'EMPRESA DE SERVICIOS INGENIEROS ESPECIALIZADOS',
  applicantcontadorPermisosExistentes: -1,
  permisoFitosanitario: true,
}
```

### Required fields:
- `applicantTipoDeOperacion` (select) — Importación
- `applicantMedioDeTransporte2` (select) — Avión/Barco
- `applicantPaisDeOrigen` (select)
- `applicantPaisDeEmbarque` (select)
- `applicantPuertoDeEmbarque` (select)
- `applicantCantidadDeMesesSolicitadosNumero` (number)
- `applicantUso` (select)
- `applicantGridProductos` → `applicantrevisionFitosanitarioProductos2` (select, in editgrid)
- `applicantElaboradoPor` (text)
- `applicantTelefono` (text)
- `applicantEmail` (text)
- `applicantConfirmoLaExactitudDeLaInformacionDeclarada` (checkbox)

### Conditional fields (not visible for Import):
- `applicantPaisDeDestino`, `applicantProvincia` — Export only
- `applicantPaisDeOrigen2/3`, `applicantPaisDeEmbarque3`, `applicantPuertoDeEmbarque3`, `applicantPaisDeDestino3` — Transit only
- `applicantClienteNacional2` (Proveedor nacional) — Export only
- `applicantAgenteDeCarga` — Not shown for Import
- `applicantMaterialDePropagacion` (Semillas datagrid) — Conditional on Uso
- `applicantTipoDeEntidad` — Not visible in this flow

### Optional file uploads (not required for submission):
- `applicantLicenciaDeLaOficinaDeRegulacionYSeguridadAmbiental2` (Notificación oficial)
- `applicantLicenciaDeLaOficinaDeRegulacionYSeguridadAmbiental` (Licencia ORSA)
- `applicantRequerimientosFitosanitarios` (Requisitos fitosanitarios)
- `applicantAnexo3` (Anexo 3 resolución 441)

---

## Gotchas & Lessons

1. **Transport dropdown uses Avión/Barco** — NOT Marítimo/Aéreo/Terrestre. The options are loaded lazily (empty values array, populated only when clicked).
2. **Products editgrid requires scrollIntoView** before interacting with the Choices.js select — otherwise "element is outside viewport" error.
3. **No QueQuiereHacer field** — Fito form doesn't distinguish between nuevo/modificar. The form flow is simpler.
4. **Contact info is auto-populated** from the logged-in user's account data — filling it manually overwrites the auto-values.
5. **Block12 is visible immediately** — no dependency on hidden fields for initial visibility (unlike PE which needs StatusBitacora).
6. **Periodo dates auto-calculate** — just set CantidadDeMesesSolicitados and both dates fill in.
7. **EditGrid has "Guardar fila" button** — must click it to save the row (unlike PE's datagrid).

---

## Old Gap Analysis Status (from 2026-02-08)

| Gap | Description | Status 2026-02-28 |
|-----|-------------|-------------------|
| G1 | Missing `applicantQueQuiereHacer` | **NOT NEEDED** — form works without it |
| G2 | Missing `applicantNit3` | **FIXED** — uses `applicantNit` (mapped in bot) |
| G3 | Missing `applicantNombreDeLaEmpresa4` | **FIXED** — uses `applicantNombreDeLaEmpresa` (mapped in bot) |
| G4 | No determinants for StatusBitacora | **NOT BLOCKING** — form loads without determinants |
| G5 | Checkbox permisoFitosanitario no label | Cosmetic, not blocking |
| G6 | No bot INTERNO modificar | **STILL MISSING** — modification flow untested |
| G7 | LISTAR only maps count | **STILL INCOMPLETE** — no EditGrid data |
| G8 | LISTAR doesn't map status | **STILL INCOMPLETE** |
| G9 | Block22 button no component action | Untested (E2E bypasses Bitácora button) |
| G10-G14 | UI gaps | Various — see original analysis |

---

## What's Pending

### Must-have for full verification:
1. **Modificar flow** — No INTERNO modificar bot exists (G6). Can't test modification.
2. **Bitácora button integration** — E2E bypasses the button. Need to test clicking "Fitosanitarios" in Block22.
3. **LISTAR bot completeness** — Only maps count, not permit numbers/dates for EditGrid.

### Nice-to-have:
4. **Export flow** — Test with TipoDeOperacion = "Exportación" to cover conditional fields
5. **Transit flow** — Test "Tránsito" operation type
6. **File uploads** — Optional but should be tested
7. **Semillas datagrid** — Appears conditionally based on Uso selection

---

## Bots (Fito service — 20 total)

| Bot | Type | Purpose |
|-----|------|---------|
| Copiar datos al rol revisión | internal | Copy to review role |
| copiar productos al certificado | internal | Copy products to cert |
| Copiar datos para Generar Permisos | internal | For permit generation |
| PERMISOS listar autorizados | data/list | List authorized permits |
| Generar Certificado | document | PDF generation |
| PERMISOS listar vigentes | data/list | List active permits |
| DOCUMENT Fitosanitario | document | Fito PDF |
| DERECHOS leer empresa | data/read | Company rights |
| EXONERADAS listar | data/list | Exempted entities |
| PRODUCTOS QUE REQUIEREN PERMISOS | data/list | Products requiring permits |
| PRODUCTOS fito crear | data/create | Create product in GDB |
| DERECHOS listar empresas | data/list | List companies |
| INTERNO permisos generados para firma | internal | For signature |
| PERMISOS FITO read | data/read | Mark as used |
| TEMP Permisos actualizar | data/create | Temp update |
| PERMISOS fito crear | data/create | Create in GDB |
| buscar noticia | data/read | Search news |
| + 3 more | various | |
