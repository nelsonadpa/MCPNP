# Acreditaciones Service - Technical Knowledge for Testing Agent

## Service Overview
- **Service ID**: `2c918084887c7a8f01888b72010c7d6e`
- **Name**: Acreditaciones (user accreditation to companies)
- **Purpose**: Allows a user to request accreditation to act on behalf of a company in BPA (VUCE Cuba)
- **Registration**: `2c918084887c7a8f01888b7207d07e01` ("Usuario acreditado")
- **Base URL**: `https://bpa.cuba.eregistrations.org`
- **Form builder**: `/services/2c918084887c7a8f01888b72010c7d6e/forms/applicant-form`
- **User-facing form**: accessed via `/services` sidebar

---

## Form Structure (45 components)

### Top-Level Layout

```
applicantContent          (content)  - Top-level intro text
applicantBlock5           (panel)    - "Nuevas acreditaciones" section
applicantBlock6           (panel)    - "Extender acreditaciones existentes" section
applicantBlock8           (panel)    - Hidden data/status block (not visible to user)
applicantValidateTheForm  (button)   - "Enviar" submit button
```

### Block5 - "Nuevas acreditaciones" (request new accreditation)

```
applicantBlock5 (panel)
  applicantContent7               (content)  - Instructions text
  applicantNuevasAcreditacionesSolicitadas (editgrid) - "Nuevas acreditaciones solicitadas"
    applicantcolumns5 (columns)
      applicantNit              (textfield, required) - User enters NIT
      applicantBuscar2          (button) - "Buscar" - fires 2 bots in sequence
      applicantEmpresa          (textfield, required) - Company name (auto-filled by bot)
      applicantConfirmar        (checkbox, required) - User confirms the accreditation request
    applicantcolumns6 (columns) - Status messages (shown/hidden by behaviours)
      applicantEmpresaEncontradaPeroYaEstaRegistradaCon (content) - "Already accredited" message
      applicantDatosEncontradosExitosamente2            (content) - "Ready to accredit" message
      applicantContent4                                  (content) - "Not found" message
    applicantBlock3 (panel) - Hidden bot status
      applicantNuevasAcreditaciones (columns, label: "Bots")
        applicantStatusClientesIdExiste (radio) - "DERECHOS ID existe" status
        applicantStatusempresa1         (radio) - "CLIENTES empresa encontrada" status
```

### Block6 - "Extender acreditaciones existentes" (extend existing accreditation)

```
applicantBlock6 (panel) - has componentActionId (loads data on open)
  applicantContent5               (content) - Instructions text
  applicantMiListaDeEmpresas      (datagrid) - "Extender acreditaciones existentes"
    applicantNombre             (textfield) - Company name (label: "Empresa1")
    applicantNit2               (textfield) - NIT
    expiracion                  (datetime)  - Current expiration date
    applicantModificar          (checkbox)  - "Extender" toggle
    applicantNuevaExpiracion    (datetime)  - New expiration date (user picks)
    applicantHoy                (datetime)  - Today (hidden, auto-filled)
    applicanthoy30Dias          (datetime)  - Today + 30 days (hidden, auto-filled)
```

### Block8 - Hidden Status/Data Block (not visible to user)

```
applicantBlock8 (panel)
  applicantBlock2 (panel)
    applicantColumns9 (columns)
      applicantQuieroCrearUnaNuevaAcreditacion                   (radio) - "nueva"
      applicantQuieroExtenderOTerminarUnaAcreditacionExistente    (radio) - "extender"
      applicantDelegarUnaAcreditacion                             (radio) - "delegar"
  applicantBlock (panel)
    applicantcolumns (columns)
      applicantStatusLlegaDeLaBitacora (radio) - Bitacora integration flag
  applicantColumns6 (columns, label: "Existentes, extensiones, nuevas")
    applicantcontador                      (number)   - "Contador existentes part A"
    applicantNumber2                       (number)   - "Extensiones solicitadas"
    applicantExtensionesSolicitadasContador (editgrid) - Extension counter details
      applicantTextField                   (textfield) - "Nombre"
    applicantnuevasSolicitadas             (number)   - "Nuevas acreditaciones solicitadas"
    applicantNuevasSolicitadasContador     (editgrid) - New request counter details
      applicantNombre2                     (textfield) - "NIT"
```

---

## Component Actions (Bots that fire on UI interaction)

### 1. `applicantBuscar2` (Button - "Buscar")
- **componentActionId**: `2c918084887c7a8f01888b721afd7e51`
- **Fires 2 bots in sequence** when user clicks "Buscar" after entering NIT:

#### Bot 1: "DERECHOS leer si existe" (always fires)
- **Bot ID**: `2c918084887c7a8f01888b7201357da5`
- **Type**: GDB data bot (`GDB.GDB-DERECHOS(1.4)-exists`)
- **Category**: `exist` (checks if record exists)
- **Input mappings** (3):
  | Source Field | Target Field |
  |---|---|
  | `applicantuserid` (textfield) | `query > content > Usuario > ID usuario eR` |
  | `dateNow` (datetime) | `query > content > Usuario > hasta` (operator: gt = greater than) |
  | `applicantNuevasAcreditacionesSolicitadas_collection_applicantNit` | `query > content > Entidad > NIT` |
- **Output mapping** (1):
  | Source Field | Target Field |
  |---|---|
  | `applicantNuevasAcreditacionesSolicitadas_collection_applicantStatusClientesIdExiste` (radio) | `status` (boolean) |
- **Logic**: Queries DERECHOS GDB with the user's ID + entered NIT + current date. Sets `applicantStatusClientesIdExiste` to true/false based on whether accreditation already exists.

#### Bot 2: "CLIENTES leer empresa" (conditional - only fires if "Ya acreditado = NO")
- **Bot ID**: `2c918084887c7a8f01888b7201317d93`
- **Type**: GDB data bot (`GDB.GDB-CLIENTES(1.4)-read`)
- **Category**: `read`
- **Determinant condition**: `jsonDeterminants: [{"type":"OR","items":[{"type":"OR","determinantId":"34c40601-d7e8-4fdd-8211-2f1bb615124c"}]}]`
  - Determinant `34c40601` = "Ya acreditado para esta empresa = NO" (grid determinant on `applicantNuevasAcreditacionesSolicitadas`)
- **Sort order**: 3 (fires after Bot 1)
- **Mandatory**: true
- **Input mapping** (1):
  | Source Field | Target Field |
  |---|---|
  | `applicantNuevasAcreditacionesSolicitadas_collection_applicantNit` | `query > content > NIT` |
- **Output mappings** (2):
  | Source Field | Target Field |
  |---|---|
  | `applicantNuevasAcreditacionesSolicitadas_collection_applicantStatusempresa1` (radio) | `status` (boolean) |
  | `applicantNuevasAcreditacionesSolicitadas_collection_applicantEmpresa` (textfield) | `receive > content > Entidad > nombre` |
- **Logic**: If user is NOT already accredited, queries CLIENTES GDB with NIT. Sets `applicantStatusempresa1` (found/not found) and fills `applicantEmpresa` with company name.

### 2. `applicantBlock6` (Panel - "Extender acreditaciones")
- **componentActionId**: `2c918084887c7a8f01888b721d177e61`
- **Actions**: EMPTY (no bots fire on panel load)
- **Note**: The DataGrid `applicantMiListaDeEmpresas` is populated by some other mechanism (likely server-side on form load)

### 3. `applicantValidateTheForm` (Button - "Enviar")
- **componentActionId**: `2c918084887c7a8f01888b7219d97e46`
- **Bot**: `saveA5` (system bot "Validate applicant form")
- **Type**: system - standard form validation + submission

---

## Determinants (25 total)

### Key Determinants for UI Flow

| Determinant | Type | Target Field | Condition |
|---|---|---|---|
| `2c91...7d8b` "Quiere solicitar nueva acreditacion" | radio | `applicantQuieroCrearUnaNuevaAcreditacion` | EQUAL "true" |
| `b4ba8388` "quiere extender acreditacion existente" | radio | `applicantQuieroExtenderOTerminarUnaAcreditacionExistente` | EQUAL "true" |
| `2c91...7d7c` "Contador = 0 (sin acreditacion todavia)" | numeric | `applicantcontador` | EQUAL 0 |
| `2c91...7d7f` "Contador existentes > 0 (ya acreditado)" | numeric | `applicantcontador` | GREATER_THAN 0 |
| `f3d9fc65` "Confirma solicitud nueva acreditacion" | grid | `applicantNuevasAcreditacionesSolicitadas` | (grid row condition) |
| `7507ffec` "Empresa encontrada" | grid | `applicantNuevasAcreditacionesSolicitadas` | (grid row condition) |
| `97b7fbe8` "Empresa no encontrada" | grid | `applicantNuevasAcreditacionesSolicitadas` | (grid row condition) |
| `34c40601` "Ya acreditado para esta empresa = NO" | grid | `applicantNuevasAcreditacionesSolicitadas` | (grid row condition) |
| `6b603121` "Ya acreditado para esta empresa = SI" | grid | `applicantNuevasAcreditacionesSolicitadas` | (grid row condition) |
| `2c91...7d83` "Extender = SI" | grid | `applicantMiListaDeEmpresas` | (grid row condition) |
| `2c91...7d87` "Fecha expiracion < hoy mas 30 dias" | grid | `applicantMiListaDeEmpresas` | (grid row condition) |
| `2c91...7d81` "Fecha expiracion > hoy" | grid | `applicantMiListaDeEmpresas` | (grid row condition) |

### Part B (Verification) Determinants
| Determinant | Type | Target Field | Condition |
|---|---|---|---|
| `8a2ab778` "nueva solicitud aprobada = SI" | grid | `verificarUsuarioDataGridEmpresasParteB2` | (grid row) |
| `2c91...7d76` "nueva solicitud aprobada = NO" | grid | `verificarUsuarioDataGridEmpresasParteB2` | (grid row) |
| `b1990d95` "Extender aprobada = SI" | grid | `verificarUsuarioAcreditacionesAExtenderPartb2` | (grid row) |
| `2c91...36b7` "Extension=rechazada2" | grid | `verificarUsuarioAcreditacionesAExtenderPartb2` | (grid row) |
| `2c91...7d75` "nuevas solicitadas > 0" | numeric | `applicantnuevasSolicitadas` | GREATER_THAN 0 |
| `2c91...7d7b` "extensiones solicitadas parte A > 0" | numeric | `applicantNumber2` | GREATER_THAN 0 |

---

## Behaviours (37 total)

### Key Behaviours Linked to Named Components

| Behaviour ID | Component Key | Purpose |
|---|---|---|
| `66e4f450` | `applicantBlock6` | Controls "Extender" section visibility |
| `4eb635b9` | `applicantEmpresaEncontradaPeroYaEstaRegistradaCon` | Shows "Already accredited" message |
| `e63b5948` | `applicantContent4` | Shows "Not found" message |
| `ed48b240` | `applicantEmpresa` | Controls Empresa field visibility/state |
| `e41c384e` | `applicantDatosEncontradosExitosamente2` | Shows "Ready to accredit" success message |
| `2cfc19bf` | `applicantConfirmar` | Controls Confirmar checkbox visibility |
| `4e76e6c3` | `applicantContent` | Controls top intro text |
| `6f8ebc05` | `applicantValidateTheForm` | Controls Enviar button state |
| `51eb8cbc` | `aprobacionAprobada2` | Part B approval |
| `4fad9aad` | `aprobacionExtensionAprobadaCounter` | Extension approval counter |
| `ae32506b` | `acreditacionFieldSet6` | Part B fieldset |
| `365cac10` | `acreditacionFieldSet2` | Part B fieldset |

Note: 25 behaviours have `component_key: null` — these are older behaviours linked differently (by effectsIds on the component rather than behaviourId on the behaviour).

---

## User Flow: "Acreditarse en otra empresa"

### Flow 1: Nueva Acreditacion (Request new accreditation)

1. User opens the Acreditaciones service form
2. **Block5** is visible: "Nuevas acreditaciones solicitadas" section
3. User sees the EditGrid `applicantNuevasAcreditacionesSolicitadas`
4. User enters a **NIT** in `applicantNit` field
5. User clicks **"Buscar"** button (`applicantBuscar2`)
6. **Bot 1** fires: "DERECHOS leer si existe"
   - Sends: user ID + NIT + current date to GDB-DERECHOS
   - Returns: `applicantStatusClientesIdExiste` = true/false (is user already accredited for this company?)
7. **If NOT already accredited** (determinant `34c40601`), **Bot 2** fires: "CLIENTES leer empresa"
   - Sends: NIT to GDB-CLIENTES
   - Returns: `applicantStatusempresa1` = true/false + `applicantEmpresa` = company name
8. **UI reacts based on bot results**:
   - If empresa found + not already accredited → Shows `applicantDatosEncontradosExitosamente2` ("Ready to accredit") + `applicantEmpresa` auto-filled + `applicantConfirmar` checkbox enabled
   - If already accredited → Shows `applicantEmpresaEncontradaPeroYaEstaRegistradaCon` ("Already accredited")
   - If empresa not found → Shows `applicantContent4` ("Not found")
9. User checks **"Confirmar"** checkbox
10. User can add more rows to the EditGrid (multiple accreditations in one request)
11. User clicks **"Enviar"** (`applicantValidateTheForm`) → system bot validates + submits

### Flow 2: Extender Acreditacion existente (Extend existing accreditation)

1. **Block6** activates based on `applicantcontador > 0` (user has existing accreditations)
2. DataGrid `applicantMiListaDeEmpresas` shows existing accredited companies:
   - Empresa name (`applicantNombre`)
   - NIT (`applicantNit2`)
   - Expiration date (`expiracion`)
   - "Extender" checkbox (`applicantModificar`)
   - New expiration date (`applicantNuevaExpiracion`)
3. User checks **"Extender"** checkbox on row(s) they want to extend
4. The checkbox enables `applicantNuevaExpiracion` field
5. Visibility rules: Expiration must be within 30 days (`applicanthoy30Dias`) and still valid (`> hoy`)
6. User clicks **"Enviar"** to submit extension request

### Flow 3: From Bitacora (hidden flow, not directly visible)

- If arriving from Bitacora hub, `applicantStatusLlegaDeLaBitacora` is set to "true"
- The hidden radios in Block8 (`applicantQuieroCrearUnaNuevaAcreditacion` etc.) control which section is active
- Block8 tracks counters: existing accreditations, extensions requested, new ones requested

---

## HTML Selectors for Playwright Testing

form.io components use `[ref="componentKey"]` pattern. Key selectors:

```javascript
// Block5 - Nueva acreditacion
page.locator('[ref="applicantBlock5"]')          // Main panel
page.locator('[ref="applicantNit"]')              // NIT input inside EditGrid row
page.locator('[ref="applicantBuscar2"]')          // "Buscar" button
page.locator('[ref="applicantEmpresa"]')          // Empresa field (auto-filled)
page.locator('[ref="applicantConfirmar"]')        // Confirmar checkbox

// Status messages (shown/hidden by behaviours)
page.locator('[ref="applicantDatosEncontradosExitosamente2"]')           // Success
page.locator('[ref="applicantEmpresaEncontradaPeroYaEstaRegistradaCon"]') // Already accredited
page.locator('[ref="applicantContent4"]')                                 // Not found

// Block6 - Extender acreditacion
page.locator('[ref="applicantBlock6"]')            // Extend panel
page.locator('[ref="applicantMiListaDeEmpresas"]') // DataGrid with existing companies
page.locator('[ref="applicantModificar"]')         // "Extender" checkbox per row
page.locator('[ref="applicantNuevaExpiracion"]')   // New expiration date picker

// Submit
page.locator('[ref="applicantValidateTheForm"]')   // "Enviar" button

// Hidden status radios (in Block8, not visible)
page.locator('[ref="applicantStatusClientesIdExiste"]')
page.locator('[ref="applicantStatusempresa1"]')
```

### Important: EditGrid Row Context
Components inside EditGrids are rendered per-row. When testing, you need to scope to the specific row:
```javascript
// Example: fill NIT in the first row of the EditGrid
const editGrid = page.locator('[ref="applicantNuevasAcreditacionesSolicitadas"]');
const firstRow = editGrid.locator('.list-group-item').first();
await firstRow.locator('[ref="applicantNit"] input').fill('12345678');
await firstRow.locator('[ref="applicantBuscar2"]').click();
```

---

## GDB (Global Database) Services Referenced

| GDB Service | Purpose | Queried by |
|---|---|---|
| `GDB.GDB-DERECHOS(1.4)-exists` | Check if user-company accreditation exists | Bot "DERECHOS leer si existe" |
| `GDB.GDB-CLIENTES(1.4)-read` | Read company info by NIT | Bot "CLIENTES leer empresa" |

---

## Relationship with Bitacora

The Acreditaciones service is **NOT** one of the 18 destination services listed in the Bitacora's Block22/Block4. It is a **separate standalone service** that manages user permissions. However:

- It has `applicantStatusLlegaDeLaBitacora` radio (in Block8), meaning it CAN receive navigation from Bitacora
- The hidden radios in Block8 suggest 3 entry modes: nueva, extender, delegar
- When a user needs to "Acreditarse en otra empresa", they go directly to this service
- After accreditation is granted, the user can then see that company in the Bitacora and manage its permits/registrations
