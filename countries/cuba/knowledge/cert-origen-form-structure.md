# Certificado de Origen -- Applicant Form Structure (Figma Reference)

**Service**: Certificado de Origen de exportacion
**Service ID**: `8a2b5457-9656-424e-9e34-f09c27bed997`
**Form ID**: `5ef9dbc1-12bf-47e2-86fc-9a682e778c31`
**Form type**: `applicant`
**Total components**: 117
**Registration**: Certificado de Origen(2)
**Date extracted**: 2026-02-24

---

## How to Read This Document

- Sections marked **[HIDDEN]** are invisible by default; they appear via server-side effects (determinants/actions).
- Sections with CSS class `deactivated` appear grayed-out until a user action activates them.
- `(collapsible, collapsed)` means the section shows as a clickable header; user must expand it.
- **REQUIRED** fields are marked explicitly.
- All `select` dropdowns in this form are dynamically populated (no static option lists).
- Column widths are expressed as X/12 grid units (Bootstrap-style).

---

## User Flow Overview

1. User arrives; sees their selected company info (collapsible header)
2. System auto-lists related companies (hidden mechanism)
3. User selects their exporting company from a list
4. Company details display (confirmed)
5. User selects destination country and searches for importer
6. User selects the importing company from results
7. User selects the product to export (tariff code search)
8. System finds applicable trade agreements
9. User fills invoice/shipping data
10. User fills contact info
11. User submits

---

## Section 1: Su empresa seleccionada

| Property | Value |
|----------|-------|
| Key | `applicantBlockEmpresaCertOrigen` |
| Type | Panel |
| Collapsible | Yes, collapsed by default |
| Visibility | Visible |

**Content**: A styled info card showing the selected company:
- Blue left-border card (background #f8f9fa, border-left #0d6efd)
- Building icon (fa fa-building)
- Company name in bold: `{{data.applicantNombre4}}`
- NIT below in gray (#6c757d): `{{data.applicantNit2}}`

---

## Section 2: Instruction Text (top-level content)

| Property | Value |
|----------|-------|
| Key | `applicantContent3` |
| Type | Content |
| Visibility | Visible |

**Text**: "**Complete los datos necesarios para generar su certificado. El sistema identificara automaticamente los acuerdos comerciales aplicables.**"

---

## Section 3: Lista de empresas relacionadas [HIDDEN -- system use]

| Property | Value |
|----------|-------|
| Key | `applicantcolumns` |
| Type | Columns (5/12 + 5/12) |
| Visibility | HIDDEN |

Contains internal mechanism panels: "Listar empresas" and "Leer si solo una empresa". Includes `applicantContador` (number, default -1). **Skip in Figma.**

---

## Section 4: Seleccione su empresa exportadora

| Property | Value |
|----------|-------|
| Key | `applicantBlock5` |
| Type | Panel |
| Collapsible | Yes, expanded by default |
| Has component action | `5c9066a1-0d03-410e-8abc-483fb2503638` |

### Layout

```
+----------------------------------------------+
| EditGrid: empresa list (clickable rows)      |
| +--Exportador (6/12)--+--NIT (3/12)--+--()--+|
| | Company Name         | 12345        |      ||
| +---------------------+-------------+-------+|
+----------------------------------------------+
```

### Components

| Key | Type | Label | Notes |
|-----|------|-------|-------|
| `applicantEditGridHagaClicSobreLaEmpresaANombreDeLaCualQuiereSolicitarAutorizaciones` | editgrid | (label hidden) | Single row selection, disabled (read-only list), CSS: `search-result-list` |

**Row template** (columns 6/12 + 3/12 + 2/12):

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantNombre3` | textfield | "Exportador" | 6/12 | Label hidden |
| `applicantNit` | textfield | "Nit" | 3/12 | |

---

## Section 5: Datos de la empresa seleccionada

| Property | Value |
|----------|-------|
| Key | `applicantBlock8` |
| Type | Panel |
| Collapsible | Yes, expanded by default |
| CSS | `deactivated` (grayed out until company selected) |
| Effects | `72b86495-e3e0-426e-90d2-74873a409d10` |

### Layout (columns 6/12 + 3/12 + 2/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantNombre4` | textfield | "Exportador seleccionado" | 6/12 | Shows selected company name |
| `applicantConfirmar` | button | "Confirmar" | 3/12 | CSS: `outline-button`, Action: custom |
| `applicantNit2` | textfield | "Nit" | 2/12 | **HIDDEN** |

---

## Section 6: Exportador seleccionado

| Property | Value |
|----------|-------|
| Key | `applicantBlock4` |
| Type | Panel |
| Collapsible | Yes, collapsed by default |

### Row 1 (columns 3/12 + 3/12 + 3/12 + 3/12)

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantPaisDeOrigen` | select | "Pais de origen" | 3/12 |
| `applicantNombre` | textfield | "Nombre" | 3/12 |
| (empty) | - | - | 3/12 |
| (empty) | - | - | 3/12 |

### Row 2 (columns 3/12 + 3/12 + 3/12 + 3/12)

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantDireccion` | textfield | "Direccion" | 3/12 |
| `applicantProvincia` | select | "Provincia" | 3/12 |
| `applicantMunicipio` | select | "Municipio" | 3/12 |
| `applicantEmail` | textfield | "Email" | 3/12 |

---

## Section 7: Seleccione el pais donde enviara la mercancia

| Property | Value |
|----------|-------|
| Key | `applicantBlock6` |
| Type | Panel |
| Collapsible | Yes, expanded by default |

### Layout (columns 4/12 + 3/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantPaisDestino` | select | "Pais destino" | 4/12 | |
| `applicantBuscarEmpresa2` | button | "Buscar cliente" | 3/12 | CSS: `outline-button top-label-space`, Action: event |

---

## Section 8: Seleccione la empresa que recibira la mercancia

| Property | Value |
|----------|-------|
| Key | `applicantBlock16` |
| Type | Panel |
| Collapsible | Yes, expanded by default |
| CSS | `deactivated` (grayed out until country selected) |
| Effects | `78249a60-cb9b-4690-ba3f-246fd5e123d4` |

### EditGrid: Lista de clientes por pais

| Property | Value |
|----------|-------|
| Key | `applicantListaDeEmpresasPorPais` |
| CSS | `Search results list` |
| Single row selection | Yes |
| Adding/removing rows | Disabled |
| Label | Hidden |

**Row template** (columns 3/12 + 3/12 + 3/12 + 3/12):

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantEmpresa` | textfield | "Importador1" | 3/12 | Read-only, label hidden, CSS: `value-label-style` |
| `applicantCodigo` | textfield | "Codigo" | 3/12 | Read-only, CSS: `value-label-style` |
| (empty) | - | - | 3/12 | |
| (empty) | - | - | 3/12 | |

**Below the grid**:
- Content: "No encuentra su cliente? Registrar uno [nuevo](https://test.cuba.eregistrations.org/services/2c9180858e08cd93018e104a38581898)"

---

## Section 9: Importador seleccionado

| Property | Value |
|----------|-------|
| Key | `applicantBlock18` |
| Type | Panel |
| Collapsible | Yes, expanded by default |
| CSS | `deactivated` |
| Effects | `bd31ea46-b535-48a0-97ab-3fe525512101` |

### Layout (columns 3/12 + 3/12 + 3/12 + 3/12)

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantImportadorSeleccionado` | textfield | "Importador seleccionado" | 3/12 |
| `applicantDireccion2` | textfield | "Direccion" | 3/12 |
| (empty) | - | - | 3/12 |
| (empty) | - | - | 3/12 |

---

## Section 10: Producto a exportar (LARGEST SECTION)

| Property | Value |
|----------|-------|
| Key | `applicantBlock12` |
| Type | Panel |
| Collapsible | Yes, expanded by default |
| Children | 8 sub-panels |

### 10a. Product Search (columns 6/12 + 6/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantSubpartidaSearch` | textfield | "Busque por codigo arancelario o descripcion del producto" | 6/12 | **HIDDEN** (search input) |
| `applicantSubpartida3` | select | "Seleccione el producto" | 6/12 | Dynamic dropdown |

### 10b. Sub-panel: Detalles del producto

| Property | Value |
|----------|-------|
| Key | `applicantBlock14` |
| CSS | `deactivated` |
| Effects | `630119e5-0cf1-41ab-a95e-c7ead71d9e42` |

| Key | Type | Label | Notes |
|-----|------|-------|-------|
| `applicantContent4` | content | "Complete la informacion comercial del producto, seleccionelo" | |
| `applicantDescripcion` | textfield | "Descripcion" | |

### 10c. Sub-panel: Origen del producto

| Property | Value |
|----------|-------|
| Key | `applicantBlock11` |
| CSS | `deactivated` |
| Effects | `b2ec1d50-8a6e-41c1-aefe-a481fb14003f` |

Content: "Como se produjo su producto?"

**Layout** (columns 10/12 + 2/12):

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantCriterioDeOrigen` | select | "Seleccione la opcion que mejor describe el origen" | 10/12 |
| `applicantObservaciones` | textarea | "Informacion adicional" | 10/12 |

### 10d. Sub-panel: Acuerdos Comerciales por subpartida [HIDDEN]

| Property | Value |
|----------|-------|
| Key | `applicantBlock7` |
| Visibility | HIDDEN (shown by system after product search) |

Contains:
- Button "Buscar" (hidden, auto-triggered)
- Content: "El sistema encontro estos acuerdos para su producto, seleccione uno."
- EditGrid `applicantAcuerdosAplicables2`: "Acuerdos aplicables" (read-only, single-select disabled)
  - Row: Acuerdo (3/12, CSS `width40`) | Preferencia % (3/12, CSS `width10`) | Observaciones (3/12, CSS `width40`)

### 10e. Button: Buscar acuerdos comerciales

| Key | Type | Label | Notes |
|-----|------|-------|-------|
| `applicantBuscarAcuerdos` | button | "Buscar acuerdos comerciales" | CSS: `outline-button`, Action: custom |

### 10f. Sub-panel: Acuerdos comerciales

| Property | Value |
|----------|-------|
| Key | `applicantBlock17` |

EditGrid `applicantAcuerdosAplicables`: "Acuerdos disponibles v2" (single row selection, no add/remove, label hidden)

**Row template** (columns 3/12 x 4):

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantAcuerdo1` | textfield | "Acuerdo4" | 3/12 | Read-only, CSS: `width40` |
| `applicantUrl` | url | "Url" | 3/12 | |
| `applicantUrlAcuerdo` | textfield | "URL acuerdo" | 3/12 | |
| `applicantModelo` | textfield | "Modelo" | 3/12 | |
| `applicantContent10` | content | "{{row.applicantUrl}} test" | 3/12 | |

### 10g. Sub-panel: Acuerdo seleccionado por subpartida [HIDDEN]

| Property | Value |
|----------|-------|
| Key | `applicantBlock19` |
| Visibility | HIDDEN |

Columns 3/12 x 4:

| Key | Type | Label | Notes |
|-----|------|-------|-------|
| `applicantAcuerdo2` | textfield | "Acuerdo2" | Read-only, CSS: `width40` |
| `applicantPreferencia3` | number | "Preferencia (%)" | Read-only, CSS: `width10` |
| `applicantObservaciones4` | textfield | "Observaciones" | Read-only, CSS: `width40` |

### 10h. Sub-panel: Acuerdo seleccionado

| Property | Value |
|----------|-------|
| Key | `applicantBlock20` |
| CSS | `deactivated` |
| Effects | `d477bfd0-1b0a-4513-aca6-da884d69d477` |

Columns 6/12 + 6/12:

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantAcuerdo3` | textfield | "Acuerdo" | 6/12 | Read-only, CSS: `width40` |
| `applicantModelo2` | textfield | "Modelo" | 6/12 | |

---

## Section 11: Factura comercial

| Property | Value |
|----------|-------|
| Key | `applicantBlock10` |
| Type | Panel |
| Collapsible | Yes, expanded by default |

### Row 1 -- File & Invoice Number (columns 4/12 + 4/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantFactura` | file | "Adjunte la factura que respalda esta operacion" | 4/12 | Pattern: `*`, Max: 1GB |
| `applicantNumeroDeFactura` | textfield | "Numero de factura1" | 4/12 | Label hidden |

### Content: "Datos de factura:"

### Row 2 -- Measurements (columns 3/12 x 4)

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantUm3` | select | "Unidad de medida" | 3/12 |
| `applicantPesoBruto2` | number | "Peso bruto" | 3/12 |
| `applicantPesoNeto2` | number | "Peso neto" | 3/12 |
| `applicantMoneda` | select | "Moneda" | 3/12 |

### Row 3 -- Values (columns 3/12 x 3)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantValor` | number | "Valor total" | 3/12 | Label hidden, default 0 |
| `applicantTarifaForRa` | number | "Tarifa (Rangos)" | 3/12 | **HIDDEN**, read-only |
| `applicantTarifaAplicable` | number | "Tarifa aplicable" | 3/12 | Read-only, label hidden |

---

## Section 12: Operacion [HIDDEN]

| Property | Value |
|----------|-------|
| Key | `applicantBlock9` |
| Visibility | HIDDEN (revealed by system later in process) |
| Collapsible | Yes, collapsed by default |

### Layout (columns 4/12 x 3)

| Key | Type | Label | Width |
|-----|------|-------|-------|
| `applicantBuque2` | textfield | "Buque" | 4/12 |
| `applicantPuertoDeEmbarque` | select | "Puerto de embarque" | 4/12 |
| `applicantPuertoDestino2` | select | "Puerto destino" | 4/12 |

---

## Section 13: Generar certificado [HIDDEN]

| Property | Value |
|----------|-------|
| Key | `applicantBlock13` |
| Visibility | HIDDEN (revealed after form completion) |
| Collapsible | Yes, collapsed by default |

### Layout (columns 6/12 + 6/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantContent5` | content | "Su certificado esta listo. Descarguelo, imprimalo y firmelo" | 6/12 | |
| `applicantCertificadoAladi` | button | "Descargar" | 6/12 | CSS: `outline-button`, Action: custom |

---

## Section 14: Enviar certificado [HIDDEN]

| Property | Value |
|----------|-------|
| Key | `applicantBlock15` |
| Visibility | HIDDEN (revealed after download) |
| Collapsible | Yes, expanded by default |

**Content**: "Suba el certificado firmado en formato PDF. Recibira la solicitud de pago para obtener la version final validada."

### Layout (columns 6/12 + 6/12)

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantSubaSuCertificadoFirmado` | file | "Suba su certificado firmado" | 6/12 | Pattern: `*`, Max: 1GB |
| `applicantContent9` | content | "Tarifa / Costo: $CUP **{{data.applicantTarifaAplicable}}** / Recibira el enlace de pago al enviar su certificado" | 6/12 | |

---

## Section 15: Datos de contacto

| Property | Value |
|----------|-------|
| Key | `applicantBlock21` |
| Type | Panel |
| Collapsible | Yes, expanded by default |

### Layout (columns 3/12 x 4)

| Key | Type | Label | Width | Required |
|-----|------|-------|-------|----------|
| `applicantElaboradoPor` | textfield | "Elaborado por" | 3/12 | **YES** |
| `applicantTelefono` | textfield | "Telefono" | 3/12 | **YES** |
| `applicantEmail2` | textfield | "Email" | 3/12 | **YES** |
| (empty) | - | - | 3/12 | - |

---

## Section 16: Submit Button Area

| Property | Value |
|----------|-------|
| Key | `applicantcolumns6` |
| Type | Columns (4/12 + 4/12 + 4/12) |

| Key | Type | Label | Width | Notes |
|-----|------|-------|-------|-------|
| `applicantValidateTheForm` | button | "Enviar" | 4/12 (rightmost) | CSS: `outline-button horizontal-align-right`, Action: custom |

---

## Hidden System Sections (DO NOT include in Figma)

### applicantBlock -- "Hidden fields"
- Empty panel, completely hidden

### applicantBlockBitacora -- "Hidden Bitacora fields"
- CSS: `deactivated`, hidden
- `applicantStatusLlegaDeLaBitacora` (radio) -- hidden, label hidden
- `applicantNombreDeLaEmpresaBit` (textfield) -- hidden, label hidden

### applicantcolumns -- "Lista de empresas relacionadas"
- Hidden columns with internal counter mechanism

---

## Select Fields Reference (All Dynamically Populated)

All select dropdowns in this form have empty static option lists. Options are populated at runtime by the BPA platform (classifications, country lists, etc.).

| Key | Label | Section |
|-----|-------|---------|
| `applicantPaisDeOrigen` | Pais de origen | Exportador seleccionado |
| `applicantProvincia` | Provincia | Exportador seleccionado |
| `applicantMunicipio` | Municipio | Exportador seleccionado |
| `applicantPaisDestino` | Pais destino | Seleccione el pais... |
| `applicantSubpartida3` | Seleccione el producto | Producto a exportar |
| `applicantCriterioDeOrigen` | Seleccione la opcion que mejor describe el origen | Origen del producto |
| `applicantUm3` | Unidad de medida | Factura comercial |
| `applicantMoneda` | Moneda | Factura comercial |
| `applicantPuertoDeEmbarque` | Puerto de embarque | Operacion [HIDDEN] |
| `applicantPuertoDestino2` | Puerto destino | Operacion [HIDDEN] |

---

## Required Fields Summary

Only 3 fields are required:

| Key | Label | Section |
|-----|-------|---------|
| `applicantElaboradoPor` | Elaborado por | Datos de contacto |
| `applicantTelefono` | Telefono | Datos de contacto |
| `applicantEmail2` | Email | Datos de contacto |

---

## CSS Classes Reference

| Class | Usage | Likely Behavior |
|-------|-------|-----------------|
| `deactivated` | Multiple panels/grids | Grayed-out appearance, becomes active via effects |
| `outline-button` | All buttons | Outlined/secondary button style |
| `top-label-space` | "Buscar cliente" button | Adds top margin to align with labeled fields |
| `search-result-list` | Empresa selection grid | Styled as clickable search results |
| `Search results list` | Client list grid | Same as above (space-separated variant) |
| `value-label-style` | Read-only text in grids | Display as plain text, not input field |
| `width40` | Agreement text fields | 40% width within grid column |
| `width10` | Preference fields | 10% width within grid column |
| `horizontal-align-right` | Submit button | Right-aligned in column |

---

## Effects IDs (Dynamic Visibility via Server)

These components change visibility/state based on server-side determinant effects:

| Component | Effect ID | Likely Trigger |
|-----------|-----------|----------------|
| Block8 (empresa seleccionada) | `72b86495-...` | After company selection |
| Block16 (lista clientes) | `78249a60-...` | After country selection |
| Block18 (importador seleccionado) | `bd31ea46-...` | After client selection |
| Block14 (detalles producto) | `630119e5-...` | After product selection |
| Block11 (origen producto) | `b2ec1d50-...` | After product details filled |
| Content6 (acuerdos text) | `01bc524f-...` | After agreement search |
| AcuerdosAplicables2 (grid) | `539fe9cc-...` | After agreement search results |
| Block20 (acuerdo seleccionado) | `d477bfd0-...` | After agreement selection |

---

## Figma Prototype Screens Suggestion

Based on the form's progressive disclosure pattern, design these states:

1. **Initial state**: Sections 1 (collapsed), instruction text, Section 4 (company list), everything below grayed out
2. **Company selected**: Section 5 activates with name + Confirmar button
3. **Company confirmed**: Section 6 (exporter details) expands, Section 7 (destination) active
4. **Country selected + search**: Section 8 activates with client list
5. **Client selected**: Section 9 shows importer info
6. **Product flow**: Section 10 with progressive sub-panels activating
7. **Invoice**: Section 11 with file upload and measurements
8. **Contact + Submit**: Section 15 with required fields, submit button
9. **Certificate download** (later state): Section 13 appears with download button
10. **Certificate upload** (final state): Section 14 appears with upload + payment info
