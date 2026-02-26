# PRD: Bitacora Deep E2E Tests

**Service**: Bitacora Hub (`ffe746aac09241078bad48c9b95cdfe0`)
**Related**: Acreditaciones (`2c918084887c7a8f01888b72010c7d6e`), Permisos Eventuales (`2c918084887c7a8f01887c99ed2a6fd5`)
**Date**: 2026-02-21
**Source**: Manual Agent response `test-manual_001`

---

## Story 1: Acreditaciones — Form Structure

**As** a registered user,
**I want** to open "Acreditarse en otra empresa" and see the correct form structure,
**So that** I can request new company accreditations or extend existing ones.

### Acceptance Criteria

1. The form has 3 top-level panels: `applicantBlock8`, `applicantBlock5`, `applicantBlock6`, plus submit button `applicantValidateTheForm`
2. Inside `applicantBlock8 > applicantBlock2 > applicantColumns9` there are 3 radio options:
   - `applicantQuieroCrearUnaNuevaAcreditacion` (label: "Solicitar una nueva acreditacion")
   - `applicantQuieroExtenderOTerminarUnaAcreditacionExistente` (label: "Extender una acreditacion existente")
   - `applicantDelegarUnaAcreditacion` (label: "Delegar una acreditacion")
3. Selecting "Solicitar una nueva acreditacion" shows `applicantBlock5` (Nuevas Acreditaciones) with editgrid `applicantNuevasAcreditacionesSolicitadas`
4. Selecting "Extender una acreditacion existente" shows `applicantBlock6` (Extender Acreditaciones) with datagrid `applicantMiListaDeEmpresas`
5. Inside the editgrid row, there is:
   - `applicantNit` (NIT textfield, required)
   - `applicantBuscar2` (Buscar button, triggers bot search)
   - `applicantEmpresa` (Empresa textfield, auto-filled by bot)
   - `applicantConfirmar` (Confirmar checkbox, required)
6. The "Enviar" button (`applicantValidateTheForm`) is present

### Test Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Form loads with radio options | Navigate to Acreditaciones form | 3 radio fields visible inside `applicantBlock8` |
| 1.2 | "Nueva acreditacion" shows Block5 | Click `applicantQuieroCrearUnaNuevaAcreditacion` | `applicantBlock5` becomes visible, `applicantBlock6` stays hidden |
| 1.3 | "Extender existente" shows Block6 | Click `applicantQuieroExtenderOTerminarUnaAcreditacionExistente` | `applicantBlock6` becomes visible with datagrid `applicantMiListaDeEmpresas` |
| 1.4 | EditGrid row has NIT search | Add row in `applicantNuevasAcreditacionesSolicitadas` | Row contains NIT field, Buscar button, Empresa field, Confirmar checkbox |
| 1.5 | Submit button exists | Load form | `applicantValidateTheForm` button is present |

---

## Story 2: Block22 Permisos — Dropdown Buttons

**As** an accredited user viewing the Bitacora,
**I want** to see all 9 permit types in the Block22 "Agregar" dropdown,
**So that** I can initiate any permit from the Bitacora hub.

### Acceptance Criteria

1. Block22 (`applicantBlock22`) is a panel inside the Servicios/Permisos section
2. Inside `applicantcolumns14` header, there is a dropdown `applicantdropdown5` with exactly 9 buttons
3. The 9 buttons are (in order):
   - `applicantPermisoEventual` — "Permiso eventual"
   - `applicantEventuales3` — "Fitosanitario"
   - `applicantEquiposUsoDeEnergia2` — "Zoosanitario"
   - `applicantEventuales` — "Equipos uso de energia"
   - `applicantSanitarioBtn` — "Certificado sanitario"
   - `applicantCertificadoSanitario3` — "Instrumentos de medicion"
   - `applicantCertificadoSanitario2` — "Donativos medicos"
   - `applicantSustanciasBtn` — "Sustancias controladas"
   - `applicantCertAprobacionBtn` — "Cert. aprobacion modelo"
4. Each button has a component action linked to an INTERNO bot

### Test Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 2.1 | Block22 panel is visible | Navigate to Servicios tab, expand Permisos | `applicantBlock22` panel is visible |
| 2.2 | Dropdown has 9 buttons | Click "Agregar" dropdown in Block22 | Dropdown shows exactly 9 buttons |
| 2.3 | Button labels are correct | Open dropdown | Each button has its expected label text |
| 2.4 | "Permiso eventual" button is clickable | Click `applicantPermisoEventual` | Navigation starts (bot fires) |
| 2.5 | "Fitosanitario" button exists | Open dropdown | `applicantEventuales3` with label "Fitosanitario" is visible |
| 2.6 | "Sustancias controladas" button exists | Open dropdown | `applicantSustanciasBtn` with label "Sustancias controladas" is visible |

---

## Story 3: Block22 EditGrids — Structure and Columns

**As** a user with active permits,
**I want** to see all 9 EditGrids in Block22 with correct column structures,
**So that** I can view and manage each permit type's data.

### Acceptance Criteria

1. Block22 contains 9 EditGrids, each inside a parent panel:
   - `applicantEditGrid` (PE) in `applicantBlock10` — cols: Tipo, Numero, Operacion, Vigente hasta, Expirado
   - `applicantEditGridFito` in `applicantBlock12` — cols: Tipo, Numero, Operacion, Vigente hasta, Expirado
   - `applicantEditGridZoo` in `applicantBlock14` — cols: Tipo, Numero, Operacion, Vigente hasta, Expirado
   - `applicantPermisoZoosanitario` (ONURE) in `applicantBlock16` — cols: Tipo, Numero, Operacion, Vigente hasta, Expirado
   - `applicantEditGridSustancias` in `applicantBlock17` — cols: Tipo, Numero, Operacion, Vigente hasta, Expirado
   - `applicantEditGridSanitario` in `applicantBlock19` — cols: Tipo, Numero, Operacion, Fecha solicitud, Expirado
   - `applicantEditGridOnn` in `applicantBlock20` — cols: Tipo, Numero, Fecha solicitud, Operacion, Expirado
   - `applicantEditGridCertAprobacion` in `applicantBlock24` — cols: Tipo, Numero, Fecha solicitud, Operacion, Expirado
   - `applicantEditGridDonativos` in `applicantBlock23` — cols: Tipo, Numero, Vigente hasta, Operacion, Expirado
2. Each EditGrid has a dropdown with "Modificar" and "Cancelar" buttons
3. 8 LISTAR bots fire on Block22 panel load to populate grid data

### Test Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | PE EditGrid structure | Navigate to Block22 | `applicantEditGrid` is present with columns `applicantTipo5`, `applicantNumero5`, `applicantTipoDeOperacion`, `applicantExpiracion`, `applicantExpirado` |
| 3.2 | Fito EditGrid structure | Navigate to Block22 | `applicantEditGridFito` is present with columns `applicantTipoFito`, `applicantNumeroFito`, `applicantTipoDeOperacion2`, `applicantExpiracionFito`, `applicantExpiradoFito` |
| 3.3 | Zoo EditGrid structure | Navigate to Block22 | `applicantEditGridZoo` is present with `applicantTipoZoo`, `applicantNumeroZoo`, `applicantTipoDeOperacion3`, `applicantExpiracionZoo`, `applicantExpiradoZoo` |
| 3.4 | ONURE EditGrid (misleading key) | Navigate to Block22 | `applicantPermisoZoosanitario` is present (key says Zoo but it is ONURE "Permiso equipos de energia electrica") |
| 3.5 | Sustancias EditGrid structure | Navigate to Block22 | `applicantEditGridSustancias` is present with `applicantTipoSustancias`, `applicantNumeroSustancias`, `applicantOperacion`, `applicantExpiracionSustancias`, `applicantExpiradoSustancias` |
| 3.6 | Sanitario EditGrid structure | Navigate to Block22 | `applicantEditGridSanitario` is present with `applicantTipoSanitario`, `applicantNumeroSanitario`, `applicantOperacion2`, `applicantFechaSanitario`, `applicantExpiradoSanitario` |
| 3.7 | ONN EditGrid structure | Navigate to Block22 | `applicantEditGridOnn` has `applicantTipoOnn`, `applicantNumeroOnn`, `applicantFechaOnn`, `applicantOperacionOnn`, `applicantExpiradoOnn` |
| 3.8 | CertAprobacion EditGrid structure | Navigate to Block22 | `applicantEditGridCertAprobacion` has `applicantTipoCertAprobacion`, `applicantNumeroCertAprobacion`, `applicantFechaCertAprobacion`, `applicantTipoDeOperacionCertAprobacion`, `applicantExpiradoCertAprobacion` |
| 3.9 | Donativos EditGrid structure | Navigate to Block22 | `applicantEditGridDonativos` has `applicantTipoDonativos`, `applicantNumeroDonativos`, `applicantFechaDonativos`, `applicantOperacionDonativos`, `applicantExpiradoDonativos` |
| 3.10 | EditGrids have Modificar/Cancelar dropdowns | Check any EditGrid | Dropdown with "Modificar" and "Cancelar" buttons is present |

---

## Story 4: PE Form Structure — Auto-populated Fields from Bitacora

**As** a user who clicks "Permiso eventual" from the Bitacora,
**I want** the PE form to open with company data pre-filled and correct panel structure,
**So that** I can create a new permit without re-entering company information.

### Acceptance Criteria

1. PE form has these panels:
   - `applicantBlock10` (hidden Bitacora data)
   - `applicantBlock7` (empresa panel, mustache template)
   - `applicantBlock8` (operation data for new permits)
   - `applicantBlock18` (product list for new permits)
   - `applicantTabsFacultades` (tabs for existing permit modifications)
   - `applicantBlock9` (fundamentacion + documents)
   - `applicantBlock3` (contact info: elaborado por)
   - `applicantBlock15` (confirmation checkbox)
   - `applicantValidateTheForm` (submit)
2. When arriving from Bitacora:
   - `applicantStatusLlegaDeLaBitacora` = "true"
   - `applicantQueQuiereHacer` = "registrarNuevo"
   - `applicantNombreDeLaEmpresa4` is filled with company name
   - `applicantNit3` is filled with NIT
3. `applicantBlock7` shows "Su empresa seleccionada" with company name and NIT via mustache template
4. Block8 has operation type select (`applicantTipoDeOperacion2`), regimen especial (`applicantRegimenEspecial`), and conditional import/export fields
5. Block18 has product datagrid `applicantDataGridNuevonuevo` with: Capitulo, Subpartidas, Descripcion, UM, Valor, Cantidad
6. Block9 has `applicantFundamentacion` (textarea, required) and document upload
7. Block3 has `applicantElaboradoPor`, `applicantTelefono`, `applicantEmail` (all required)
8. Block15 has `applicantCheckbox2` ("Confirmo la exactitud...")

### Test Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | PE form loads from Bitacora | Click "Permiso eventual" in Block22 | PE form opens with panels visible |
| 4.2 | Bitacora hidden fields are set | Check `applicantBlock10` | `applicantStatusLlegaDeLaBitacora` = "true", `applicantQueQuiereHacer` = "registrarNuevo" |
| 4.3 | Empresa panel shows company data | Check `applicantBlock7` | `applicantEmpresas` content shows company name and NIT |
| 4.4 | NIT and company auto-filled | Check hidden fields | `applicantNit3` and `applicantNombreDeLaEmpresa4` have values |
| 4.5 | Block8 operation fields visible | View Block8 | `applicantTipoDeOperacion2` (select), `applicantRegimenEspecial` (select) are visible |
| 4.6 | Product datagrid structure | View Block18 | `applicantDataGridNuevonuevo` present with Capitulo, Subpartidas, Descripcion, UM, Valor, Cantidad columns |
| 4.7 | Fundamentacion required | View Block9 | `applicantFundamentacion` textarea is present and required |
| 4.8 | Contact fields present | View Block3 | `applicantElaboradoPor`, `applicantTelefono`, `applicantEmail` all visible and required |
| 4.9 | Confirmation checkbox | View Block15 | `applicantCheckbox2` ("Confirmo la exactitud...") is present |
| 4.10 | Submit button exists | View form | `applicantValidateTheForm` button is present |

---

## Story 5: PE Component Actions — Bot Triggers

**As** a user filling out the PE form,
**I want** bots to fire on the correct component interactions,
**So that** data is automatically loaded and validated.

### Acceptance Criteria

1. `applicantTabsFacultades` fires 2 bots when opened:
   - "PERMISO EVENTUAL Leer" (`2c918084887c7a8f01887c99eedc70a3`) — reads existing PE data
   - "PERMISO EVENTUAL Listar productos" (`2c918084887c7a8f01887c99eeda708e`) — lists existing products
2. `applicantProducto` (subpartida select) fires "UNIDAD DE MEDIDA Leer" (`2c9180909113b63e0191224fba170002`) — auto-fills UM field
3. `applicantDescargarCarta` fires "Carta ZEDmariel" (`2c91808c97153c2801971cd91fc5003e`) — generates Mariel zone letter
4. `applicantPorqueNoVienenDatos` fires product listing bot as retry
5. `applicantValidateTheForm` fires system validation (`saveA5`)
6. Modification flow: `applicantTabsFacultades` has 2 tabs:
   - "Operacion previamente autorizada" (`applicantTabsFacultadesoperacionPreviamenteAutorizada`)
   - "Modificaciones solicitadas" (`applicantTabsFacultadesmodificacionesSolicitadas`)

### Test Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1 | TabsFacultades loads existing data | Open PE with modification flow | `applicantTabsFacultades` panel loads and fires read + list bots |
| 5.2 | Product select triggers UM bot | Select a product in `applicantProducto` | `applicantUm` auto-fills with unit of measure |
| 5.3 | Submit button validates form | Click `applicantValidateTheForm` without filling required fields | Validation errors appear |
| 5.4 | Modification tabs structure | Open modification flow | 2 tabs visible: "Operacion previamente autorizada" and "Modificaciones solicitadas" |
| 5.5 | Existing products datagrid | Open first modification tab | `applicantDataGridNuevonuevo3` ("Productos autorizados") is present with: Capitulo, Producto, Descripcion, UM, Valor, Cantidad, Seleccionar |

---

## Appendix: Key Component References

### Acreditaciones Form (`2c918084887c7a8f01888b720c097e0b`)
- 45 components total
- 2 bots on `applicantBuscar2`: DERECHOS leer + CLIENTES leer
- 24 determinants controlling visibility

### Bitacora Block22
- 9 dropdown buttons in `applicantdropdown5`
- 9 EditGrids with Modificar/Cancelar sub-dropdowns
- 8 LISTAR bots fire on panel load
- Block22 panel action: `1cb59cb5-da2a-45ea-9b39-7871f117916f`

### PE Form (`2c918084887c7a8f01887c9a32387268`)
- 140 components total
- 16 bots (data, internal, document)
- 30+ determinants for visibility (Bitacora flow, operation type, Mariel zone, validation)
