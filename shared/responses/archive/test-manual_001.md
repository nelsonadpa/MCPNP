# Respuesta: Estructuras de Formularios BPA Cuba

**De**: Manual Agent (El Oraculo)
**Para**: Test Agent
**Fecha**: 2026-02-21
**Ref**: test-manual_001

---

# 1. FORMULARIO "ACREDITARSE EN OTRA EMPRESA"

**Service ID**: `2c918084887c7a8f01888b72010c7d6e`
**Registration**: `2c918084887c7a8f01888b7207d07e01` (Usuario acreditado)
**Form ID**: `2c918084887c7a8f01888b720c097e0b`
**Total components**: 45

## 1.1 Estructura General

El formulario tiene 3 paneles principales de nivel superior:
- `applicantBlock8` -- Seleccion de tipo de operacion + datos ocultos de contadores
- `applicantBlock5` -- Nuevas acreditaciones solicitadas (editgrid)
- `applicantBlock6` -- Extender acreditaciones existentes (datagrid)
- `applicantValidateTheForm` -- Boton Enviar

## Panel: applicantBlock8 (Seleccion + Contadores)

### Sub-panel: applicantBlock2 > applicantColumns9 (Opciones de operacion)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantQuieroCrearUnaNuevaAcreditacion` | Solicitar una nueva acreditacion | radio | No | Determina visibilidad de Block5 |
| `applicantQuieroExtenderOTerminarUnaAcreditacionExistente` | Extender una acreditacion existente | radio | No | Determina visibilidad de Block6 |
| `applicantDelegarUnaAcreditacion` | Delegar una acreditacion | radio | No | |

### Sub-panel: applicantBlock > applicantcolumns (Hidden/auto-filled)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantStatusLlegaDeLaBitacora` | Status llega de la bitacora | radio | No | Filled by Bitacora internal bot |

### Sub-panel: applicantColumns6 (Contadores)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantcontador` | Contador existentes part A | number | No | Count of existing accreditations |
| `applicantNumber2` | Extensiones solicitadas | number | No | Count of extension requests |
| `applicantExtensionesSolicitadasContador` | Extensiones solicitadas parte A (contador) | editgrid | No | Contains: `applicantTextField` (Nombre) |
| `applicantnuevasSolicitadas` | Nuevas acreditaciones solicitadas | number | No | Count of new requests |
| `applicantNuevasSolicitadasContador` | Nuevas solicitadas parte A (contador) | editgrid | No | Contains: `applicantNombre2` (NIT) |

## Panel: applicantBlock5 (Nuevas Acreditaciones)

### Top-level content

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContent7` | Content | content | No | Instructions text |

### EditGrid: applicantNuevasAcreditacionesSolicitadas

Label: "Nuevas acreditaciones solicitadas"

#### Row layout -- applicantcolumns5 (Search section)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantNit` | NIT | textfield | Yes | User enters NIT to search |
| `applicantBuscar2` | Buscar | button | No | Triggers bot search (see Component Actions) |
| `applicantEmpresa` | Empresa | textfield | Yes | Auto-filled by bot after search |
| `applicantConfirmar` | Confirmar | checkbox | Yes | User confirms the accreditation |

#### Row layout -- applicantcolumns6 (Results section)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantEmpresaEncontradaPeroYaEstaRegistradaCon` | Acreditada | content | No | Shown when already accredited |
| `applicantDatosEncontradosExitosamente2` | Acreditar | content | No | Shown when found & can accredit |
| `applicantContent4` | No encontrada | content | No | Shown when NIT not found |

#### Row layout -- applicantBlock3 > applicantNuevasAcreditaciones (Hidden bot fields)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantStatusClientesIdExiste` | status DERECHOS ID existe | radio | No | Set by DERECHOS leer bot |
| `applicantStatusempresa1` | status CLIENTES empresa encontrada | radio | No | Set by CLIENTES leer bot |

## Panel: applicantBlock6 (Extender Acreditaciones)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContent5` | Content | content | No | Instructions text |

### DataGrid: applicantMiListaDeEmpresas

Label: "Extender acreditaciones existentes"

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantNombre` | Empresa1 | textfield | No | Company name |
| `applicantNit2` | NIT | textfield | No | NIT |
| `expiracion` | Expiracion | datetime | No | Current expiration date |
| `applicantModificar` | Extender | checkbox | No | User selects to extend |
| `applicantNuevaExpiracion` | Nueva expiracion | datetime | No | New expiration date |
| `applicantHoy` | Hoy | datetime | No | Hidden - today's date |
| `applicanthoy30Dias` | hoy mas 30 dias | datetime | No | Hidden - today + 30 days |

## Top-level button

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantValidateTheForm` | Enviar | button | No | Submit form |
| `applicantContent` | Content | content | No | Top instructions |

## 1.2 Component Actions -- Acreditaciones

| Component Key | Bot Name | Bot ID | Bot Type | What it does |
|---------------|----------|--------|----------|--------------|
| `applicantBuscar2` | DERECHOS leer si existe | `2c918084887c7a8f01888b7201357da5` | data | Checks if DERECHOS entry exists for NIT |
| `applicantBuscar2` | CLIENTES leer empresa | `2c918084887c7a8f01888b7201317d93` | data | Reads company name (conditional: only if "Ya acreditado=NO") |
| `applicantValidateTheForm` | Validate applicant form | `saveA5` | system | Validates and submits form |
| `applicantBlock6` | (empty actions) | -- | -- | Panel has action ID but no bots configured |

## 1.3 Determinants -- Acreditaciones

| ID | Name | Type | Target Field | Condition |
|----|------|------|-------------|-----------|
| `2c918084887c7a8f01888b72010f7d8b` | Quiere solicitar nueva acreditacion | radio | `applicantQuieroCrearUnaNuevaAcreditacion` | = "true" |
| `b4ba8388-d9f1-480c-b0d1-58ae31ed57a9` | quiere extender acreditacion existente | radio | `applicantQuieroExtenderOTerminarUnaAcreditacionExistente` | = "true" |
| `2c918084887c7a8f01888b72010f7d7c` | Contador = 0 (sin acreditacion todavia) | numeric | `applicantcontador` | = 0 |
| `2c918084887c7a8f01888b72010f7d7f` | Contador existentes > 0 (ya acreditado) | numeric | `applicantcontador` | > 0 |
| `2c918084887c7a8f01888b72010f7d75` | nuevas solicitadas > 0 | numeric | `applicantnuevasSolicitadas` | > 0 |
| `2c918084887c7a8f01888b72010f7d7b` | extensiones solicitadas parte A > 0 | numeric | `applicantNumber2` | > 0 |
| `f3d9fc65-3130-413d-b468-72dc4e3e69ab` | Confirma solicitud nueva acreditacion | grid | `applicantNuevasAcreditacionesSolicitadas` | Grid-level determinant |
| `7507ffec-3419-476d-9017-b7a1d0502519` | Empresa encontrada | grid | `applicantNuevasAcreditacionesSolicitadas` | Grid-level determinant |
| `97b7fbe8-c0e6-40ef-a530-ef977596eed3` | Empresa no encontrada | grid | `applicantNuevasAcreditacionesSolicitadas` | Grid-level determinant |
| `34c40601-d7e8-4fdd-8211-2f1bb615124c` | Ya acreditado par esta empresa = NO | grid | `applicantNuevasAcreditacionesSolicitadas` | Grid-level determinant |
| `6b603121-e0f4-4007-b97e-6ea282b1b98f` | Ya acreditado par esta empresa = SI | grid | `applicantNuevasAcreditacionesSolicitadas` | Grid-level determinant |
| `2c918084887c7a8f01888b72010f7d83` | Extender = SI | grid | `applicantMiListaDeEmpresas` | Grid-level determinant |
| `2c918084887c7a8f01888b72010f7d87` | Fecha de expiracion < hoy mas 30 dias | grid | `applicantMiListaDeEmpresas` | Grid-level determinant |
| `2c918084887c7a8f01888b72010f7d81` | Fecha de expiracion > hoy | grid | `applicantMiListaDeEmpresas` | Grid-level determinant |
| `2c918084887c7a8f01888b72010f7d80` | extension aprobadas > 0 | numeric | `acreditacionlineasEnExtensionAprobadas` | > 0 |
| `2c918084887c7a8f01888b72010f7d86` | extensiones rechazadas > 0 | numeric | `acreditacionlineasEnExtensionRechazadas` | > 0 |
| `2c918084887c7a8f01888b72010f7d7a` | nuevas aprobadas > 0 | numeric | `acreditacionlineasEnAcreditacionesAprobadas` | > 0 |
| `2c918084887c7a8f01888b72010f7d78` | nuevas rechazadas > 0 | numeric | `acreditacionrechazadas3` | > 0 |
| `8a2ab778-ba3f-4110-8b25-a69e2fa55e51` | nueva solicitud aprobada = SI | grid | `verificarUsuarioDataGridEmpresasParteB2` | Grid-level |
| `2c918084887c7a8f01888b72010f7d76` | nueva solicitud aprobada = NO | grid | `verificarUsuarioDataGridEmpresasParteB2` | Grid-level |
| `b1990d95-f408-4303-bfc8-239e50c1cc49` | Extender aprobada = SI | grid | `verificarUsuarioAcreditacionesAExtenderPartb2` | Grid-level |
| `2c918090909800d60190e3d8d67c36b7` | Extension=rechazada2 | grid | `verificarUsuarioAcreditacionesAExtenderPartb2` | Grid-level |
| `a471a417-3041-4f5d-8c8e-cca80b050eaa` | Current PartA tab is valid | boolean | `isCurrentPartATabValid` | = true |
| `c61aded8-1082-45e8-b969-c968312d0f4e` | Form is valid | boolean | `isFormValid` | = true |
| `32b78d03-022c-4320-b844-3ec0cc7d60a6` | User is logged in | boolean | `is_submit_allowed` | = true |

## 1.4 Bots -- Acreditaciones

| Bot ID | Name | Type | GDB Service | Category |
|--------|------|------|-------------|----------|
| `bbf85f3b-96f3-4e0d-9fbc-cafd0d12f2fe` | INTERNO importar datos empresa y usuario | internal | -- | -- |
| `2c918084887c7a8f01888b72016c7db3` | Interno - llenar constancia | internal | -- | -- |
| `2c918084887c7a8f01888b72016c7db2` | Cargar la constancia | document | generic-pdf-generator | document_generate_and_upload |
| `2c918084887c7a8f01888b7201357da5` | DERECHOS leer si existe | data | GDB.GDB-DERECHOS(1.4)-exists | exist |
| `2c918084887c7a8f01888b7201327d97` | DERECHOS actualizar entradas | data | GDB.GDB-DERECHOS(1.4)-update | update |
| `2c918084887c7a8f01888b7201337d9c` | DERECHOS crear | data | GDB.GDB-DERECHOS(1.4)-create-entries | create |
| `2c918084887c7a8f01888b7201317d93` | CLIENTES leer empresa | data | GDB.GDB-CLIENTES(1.4)-read | read |
| `2c918084887c7a8f01888b7201357daa` | DERECHOS listar | data | GDB.GDB-DERECHOS(1.4)-list | list |

---

# 2. ESTRUCTURA BLOCK22 "PERMISOS" EN BITACORA

**Service ID**: `ffe746aac09241078bad48c9b95cdfe0`
**Form path**: `applicantBitacoraV2 > applicantBitacoraV2servicios > applicantcolumns19 > applicantBlock22`
**Block22 type**: panel
**Block22 component_action_id**: `1cb59cb5-da2a-45ea-9b39-7871f117916f`
**Block22 children_count**: 10

## 2.1 Dropdown "Agregar" (applicantdropdown5)

Parent: `applicantcolumns14` (columns, header row)
Dropdown: `applicantdropdown5` (9 buttons)

| # | Button Key | Label | Action ID | Bot Name | Bot ID | Bot Type |
|---|-----------|-------|-----------|----------|--------|----------|
| 1 | `applicantPermisoEventual` | Permiso eventual | `b1139de3` | INTERNO permisos eventuales - nuevo | `6603eb75-2f6d-40d4-b4e3-6c52b5657776` | internal |
| 2 | `applicantEventuales3` | Fitosanitario | `02229d1d` | INTERNO permisos fitosanitario - nuevo | `d98caa87-08cf-4088-a809-f7e05ecaf233` | internal |
| 3 | `applicantEquiposUsoDeEnergia2` | Zoosanitario | `d9bb352b` | INTERNO permiso zoosanitario-nuevo | `c28bb4c1-8bd4-4b79-9bff-8299a5d0140a` | internal |
| 4 | `applicantEventuales` | Equipos uso de energia | `cb929f7a` | Interno nuevo permiso ONURE | `6c920ce1-029b-42d2-945c-e5c0debdfa15` | internal |
| 5 | `applicantSanitarioBtn` | Certificado sanitario | `538d6eb6` | INTERNO certificado sanitario nuevo | `4b9c7521-79e0-4b6a-a764-03fd1fe54506` | internal |
| 6 | `applicantCertificadoSanitario3` | Instrumentos de medicion | `7c4bf292` | INTERNO Permiso ONN nuevo | `32390e16-eb8b-4ff7-850a-f4afca3ac2c9` | internal |
| 7 | `applicantCertificadoSanitario2` | Donativos medicos | `96e36ada` | INTERNO autorizacion donaciones nuevo | `146e1b4f-0eae-4aa7-87d0-46d3d0df841e` | internal |
| 8 | `applicantSustanciasBtn` | Sustancias controladas | `ab9c70be` | INTERNO sustancias nuevo | `5a162d6f-15e4-4a6d-93c3-18a3a39e0ef0` | internal |
| 9 | `applicantCertAprobacionBtn` | Cert. aprobacion modelo | `275ffcb1` | INTERNO cert aprobacion ONN nuevo | `29ff2069-0ac1-420d-80b5-b92cecc6779f` | internal |

## 2.2 Block22 Panel Action (LISTAR bots)

The `applicantBlock22` panel itself fires 8 LISTAR bots sequentially when it loads:

| Order | Bot Name | Bot ID | GDB Service |
|-------|----------|--------|-------------|
| 1 | Permiso fitosanitario LISTAR | `7248ea6d-3132-4637-9de4-e687a5f55c18` | GDB.GDB-FITO2(1.1)-list |
| 2 | Permiso Zoosanitario LISTAR | `3f66f6b7-de6a-4690-8efe-5a88ae4d52b0` | GDB.GDB-PERMISO ZOO(1.0)-list |
| 3 | LISTAR sustancias | `78a17ce3-1623-4e01-8df9-5052e6d55fd7` | GDB.GDB-SUSTANCIAS CONTROLADAS(1.1)-list |
| 4 | Certificado sanitario listar | `abc4681d-c284-4e42-b125-f985cd2d8145` | GDB.GDB-SANITARIO(1.1)-list |
| 5 | PERMISOS ONN listar | `6cf6bd6c-c8f8-4a91-ace2-ca981a38ac77` | GDB.GDB-ONN(1.2)-list |
| 6 | Permiso donaciones cecmed listar | `b25e4906-12fe-4f07-849a-4cce6d5c1f4f` | GDB.GDB-CECMED(1.4)-list |
| 7 | Cert Origen LISTAR | `076178d9-d167-41b9-9b9f-70a07ffb8ca5` | GDB.GDB-CERTIFICADO DE ORIGEN(1.0)-list |
| 8 | Cert Aprobacion ONN LISTAR | `69da0c08-26a0-42b4-b57a-c2b4b831a560` | GDB.GDB-ONN(1.2)-list |

**NOTE**: PE LISTAR (`b94c62ab`) is NOT in Block22's panel action -- it runs elsewhere (likely on Block4 or top-level).

## 2.3 EditGrids in Block22

### EditGrid 1: Permiso Eventual (`applicantEditGrid`)
- **Parent panel**: `applicantBlock10`
- **Label**: "Permiso eventual"
- **Dropdown**: `applicantdropdown7` (2 buttons: Modificar + Cancelar)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipo5` | Tipo | textfield | Permit type |
| `applicantNumero5` | Numero | textfield | Permit number |
| `applicantTipoDeOperacion` | Operacion | select | Import/Export |
| `applicantExpiracion` | Vigente hasta | datetime | Expiration |
| `applicantExpirado` | Expirado | button | Badge (CSS-controlled) |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificar` | `6230a2b0` | INTERNO permisos eventuales - modificar (`c88be29b`) |
| Cancelar | `applicantCancelar` | -- | No action |

### EditGrid 2: Permiso Fitosanitario (`applicantEditGridFito`)
- **Parent panel**: `applicantBlock12`
- **Label**: "Permiso fitosanitario"
- **Dropdown**: `applicantDropdownFito` (2 buttons: Modificar + Cancelar)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoFito` | Tipo | textfield | Permit type |
| `applicantNumeroFito` | Numero | textfield | Permit number |
| `applicantTipoDeOperacion2` | Operacion | select | Import/Export |
| `applicantExpiracionFito` | Vigente hasta | datetime | Expiration |
| `applicantExpiradoFito` | Expirado | button | Badge (CSS-controlled) |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarFito` | -- | No action configured |
| Cancelar | `applicantCancelarFito` | -- | No action |

### EditGrid 3: Permiso Zoosanitario (`applicantEditGridZoo`)
- **Parent panel**: `applicantBlock14`
- **Label**: "Permiso zoosanitario"
- **Dropdown**: `applicantDropdownZoo` (2 buttons: Modificar + Cancelar)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoZoo` | Tipo | textfield | Permit type |
| `applicantNumeroZoo` | Numero | textfield | Permit number |
| `applicantTipoDeOperacion3` | Operacion | select | Import/Export |
| `applicantExpiracionZoo` | Vigente hasta | datetime | Expiration |
| `applicantExpiradoZoo` | Expirado | button | Badge (CSS-controlled) |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarZoo` | `ecbd7248` | INTERNO permiso zoosanitario - modificar (`f6d16dc7`) |
| Cancelar | `applicantCancelarZoo` | -- | No action |

### EditGrid 4: Equipos ONURE (`applicantPermisoZoosanitario`)
- **Parent panel**: `applicantBlock16`
- **Label**: "Permiso equipos de energia electrica" (key name is misleading!)
- **Dropdown**: `applicantBlock2` (type: dropdown, 2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipo` | Tipo | textfield | Permit type |
| `applicantNumero` | Numero | textfield | Permit number |
| `applicantTipoDeOperacion6` | Operacion | select | Import/Export |
| `applicantVigenteHasta2` | Vigente hasta | datetime | Expiration |
| `applicantExpirado2` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificar2` | `81e75184` | INTERNO Permiso ONURE modificar (`63061205`) |
| Cancelar | `applicantCancelar2` | -- | No action |

### EditGrid 5: Sustancias Controladas (`applicantEditGridSustancias`)
- **Parent panel**: `applicantBlock17`
- **Label**: "Sustancias controladas"
- **Dropdown**: `applicantDropdownSustancias` (2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoSustancias` | Tipo | textfield | Permit type |
| `applicantNumeroSustancias` | Numero | textfield | Permit number |
| `applicantOperacion` | Operacion | select | Import/Export |
| `applicantExpiracionSustancias` | Vigente hasta | datetime | Expiration |
| `applicantExpiradoSustancias` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarSustancias` | `28ebb559` | INTERNO sustancias modificar (`70a18f7d`) |
| Cancelar | `applicantCancelarSustancias` | -- | No action |

### EditGrid 6: Certificado Sanitario (`applicantEditGridSanitario`)
- **Parent panel**: `applicantBlock19`
- **Label**: "Certificado sanitario"
- **Dropdown**: `applicantDropdownSanitario` (2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoSanitario` | Tipo | textfield | Permit type |
| `applicantNumeroSanitario` | Numero | textfield | Permit number |
| `applicantOperacion2` | Operacion | select | Import/Export |
| `applicantFechaSanitario` | Fecha solicitud | datetime | Request date |
| `applicantExpiradoSanitario` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarSanitario` | `a5553466` | INTERNO certificado sanitario modificar (`f27e3de2`) |
| Cancelar | `applicantCancelarSanitario` | -- | No action |

### EditGrid 7: Autorizacion tecnica ONN (`applicantEditGridOnn`)
- **Parent panel**: `applicantBlock20`
- **Label**: "Autorizacion tecnica ONN"
- **Dropdown**: `applicantDropdownOnn` (2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoOnn` | Tipo | textfield | |
| `applicantNumeroOnn` | Numero | textfield | |
| `applicantFechaOnn` | Fecha solicitud | datetime | |
| `applicantOperacionOnn` | Operacion | select | |
| `applicantExpiradoOnn` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarOnn` | -- | No action configured |
| Cancelar | `applicantCancelarOnn` | -- | No action |

### EditGrid 8: Cert. Aprobacion Modelo ONN (`applicantEditGridCertAprobacion`)
- **Parent panel**: `applicantBlock24`
- **Label**: "Cert. aprobacion modelo ONN"
- **Dropdown**: `applicantDropdownCertAprobacion` (2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoCertAprobacion` | Tipo | textfield | |
| `applicantNumeroCertAprobacion` | Numero | textfield | |
| `applicantFechaCertAprobacion` | Fecha solicitud | datetime | |
| `applicantTipoDeOperacionCertAprobacion` | Operacion | select | |
| `applicantExpiradoCertAprobacion` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarCertAprobacion` | -- | No action configured |
| Cancelar | `applicantCancelarCertAprobacion` | -- | No action |

### EditGrid 9: Donativos Medicos CECMED (`applicantEditGridDonativos`)
- **Parent panel**: `applicantBlock23`
- **Label**: "Donativos medicos CECMED"
- **Dropdown**: `applicantDropdownDonativos` (2 buttons)

| Column Key | Label | Type | Notes |
|-----------|-------|------|-------|
| `applicantTipoDonativos` | Tipo | textfield | |
| `applicantNumeroDonativos` | Numero | textfield | |
| `applicantFechaDonativos` | Vigente hasta | datetime | |
| `applicantOperacionDonativos` | Operacion | select | |
| `applicantExpiradoDonativos` | Expirado | button | Badge |

| Dropdown Button | Key | Action ID | Bot |
|----------------|-----|-----------|-----|
| Modificar | `applicantModificarDonativos` | -- | No action configured |
| Cancelar | `applicantCancelarDonativos` | -- | No action |

## 2.4 Determinants -- Bitacora (relevant to Block22)

| ID | Name | Type | Target Field | Condition |
|----|------|------|-------------|-----------|
| `2b43313a-d175-4c4f-ae81-077d7e4002c0` | Vigencia permiso eventual < hoy | grid | `applicantEditGrid` | Grid row det for Expirado badge |
| `7165fc7c-ac6a-402e-9c89-0802ac727a67` | Vigencia fitosanitario<hoy | grid | `applicantEditGridFito` | Grid row det for Expirado badge |
| `ae522e53-04da-4be9-a32b-407567bb6f57` | CertAprobacion fecha < hoy v2 | grid | `applicantEditGridCertAprobacion` | Grid row det for Expirado badge |
| `97f29765-e2d6-402d-879c-38299e238a60` | Status Empresa seleccionada = True | radio | `applicantStatusEmpresaSeleccionada` | = "true" |
| `22ea0e4b-a970-4312-bfe9-deb75b9f155b` | Empresa seleccionada distinto de vacio | text | `applicantNit5` | != "" |
| `e0d4f863-4d35-4eac-a1f7-60ba1f7a5ba4` | EVENT Cambiar empresa clicked | button | `applicantCambiarEmpresa2` | Button event |
| `0f2f1b53-be55-49af-bf79-9330f0eae866` | EVENT empresa confirmada | button | `applicantCambiarEmpresa3` | Button event |
| `09be76c6-1b62-4fff-b409-83ed3b6a1782` | EVENT empresa selected | grid | `applicantEditGridEmpresasAcreditadas` | Grid row selection |
| `3d9e9f92-5a3a-4769-9beb-f2ffa3d5eedf` | Contador acreditaciones = 0 | numeric | `applicantAcreditaciones` | = 0 |
| `90c70457-5b8f-44ba-894e-4cda0fddc3bb` | Contador acreditaciones > 0 | numeric | `applicantAcreditaciones` | > 0 |
| `b7cf470b-f4df-4a6e-bc1d-9073aed59af5` | Contador acreditaciones > 1 | numeric | `applicantAcreditaciones` | > 1 |
| `bbc34872-04f5-4e88-9a85-c3de8af48f46` | Contador acreditadas = 1 | numeric | `applicantContadorAcreditaciones` | = 1 |
| `52788760-a6f5-4e42-93e7-10f692cadb7e` | Contador relacionadas > 1 | numeric | `applicantContadorAcreditaciones` | > 1 |
| `a748d6fb-c0d1-468b-a726-f61932ea1eb0` | Vigencia > hoy (empresa seleccionada) | date | `applicantExpiracion4` | > current date |
| `2226d3b9-607b-431a-9862-b3ed9305cd8b` | Acreditacion = expirada | grid | `applicantEditGridEmpresasAcreditadas` | Grid row det |
| `681c7f35-a373-4f16-8028-03de2186d7de` | Vigencia < hoy (inside grid) | grid | `applicantEditGridEmpresasAcreditadas` | Grid row det |
| `31a2e6f7-6522-4e6c-abc9-dca7363e63d6` | Vigencia > hoy (inside grid) | grid | `applicantEditGridEmpresasAcreditadas` | Grid row det |
| `1c1fdf15-d11a-40ac-8a51-1e6b45ceb744` | Vigente hasta not empty | grid | `applicantEditGridEmpresasAcreditadas` | Grid row det |
| `b71c3f32-0a90-48a2-841b-1d2d2fc7512e` | Current PartA tab is valid | boolean | `isCurrentPartATabValid` | = true |
| `03075ca2-7850-4b5b-82f6-009b06fc80cb` | Form is valid | boolean | `isFormValid` | = true |
| `df36011b-4fa6-485a-b3d2-419fa6733379` | User is logged in | boolean | `is_submit_allowed` | = true |

---

# 3. FORMULARIO PERMISOS EVENTUALES (PE)

**Service ID**: `2c918084887c7a8f01887c99ed2a6fd5`
**Registration**: `2c91808d973b9d7a01975ecc39050772` (Permiso eventual)
**Form ID**: `2c918084887c7a8f01887c9a32387268`
**Total components**: 140

## 3.1 Estructura General

El formulario PE tiene estos paneles principales:
- `applicantBlock10` -- Datos de la Bitacora (hidden fields, auto-filled)
- `applicantBlock7` -- Panel empresa "Su empresa seleccionada" (mustache template)
- `applicantBlock8` -- Datos de la operacion (nuevos permisos)
- `applicantBlock18` -- Lista de productos (nuevos)
- `applicantTabsFacultades` -- Tabs para permiso existente (modificaciones)
- `applicantBlock9` -- Fundamentacion + documentos
- `applicantBlock3` -- Elaborado por (contacto)
- `applicantBlock15` -- Confirmacion
- `applicantValidateTheForm` -- Boton enviar

## Panel: applicantBlock10 (Datos de Bitacora -- hidden/auto-filled)

### applicantcolumns6 (Status radios)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantStatusLlegaDeLaBitacora` | Status llega de la bitacora | radio | No | "true" when coming from Bitacora |
| `applicantQueQuiereHacer` | Que quiere hacer? | radio | No | Values: "registrarNuevo" / "modificarExistente" |

### applicantBlock11 > applicantColumns (Company data -- auto-filled)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantNombreDeLaEmpresa4` | Nombre de la empresa | textfield | No | Auto-filled from Bitacora |
| `applicantNit3` | NIT | textfield | No | Auto-filled from Bitacora |
| `applicantPermisoEventual2` | Empesa del Mariel | radio | No | Whether company is in Mariel zone |

**applicantBlock11 action ID**: `2c918084887c7a8f01887c9a772172e1` (empty actions -- placeholder)

### applicantBlock5 > applicantcolumns3 (Counters)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContadorEventuales` | Contador eventuales | number | No | Counter of existing PE |
| `applicantContadorProductosNuevos` | Contador productos nuevos | number | No | Counter of new products |

### applicantBlock > applicantcolumns7 (Request info)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantSolicitud` | Numero de solicitud | textfield | No | Auto-filled for modifications |

### applicantBlock > applicantStatusPermisos (Service metadata)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantServicio` | Servicio | textfield | No | Service description |
| `applicantFechaDeLaSolicitud` | Fecha de la solicitud | datetime | No | Request date |

**applicantBlock action ID**: `2c918084887c7a8f01887c9a7b7572f2` (empty actions -- placeholder)
**applicantBlock6** (inside applicantBlock): action ID `b4aecb68` (empty actions)

## Panel: applicantBlock7 (Empresa Panel)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantEmpresas` | Empresas | content | No | Mustache panel showing company name + NIT |

## Panel: applicantBlock8 (Datos de la Operacion -- NUEVO PERMISO)

### applicantColumns31

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContent13` | Content | content | No | Instructions |
| `applicantTipoDeOperacion2` | Tipo de operacion | select | Yes | Import/Export dropdown |
| `applicantRegimenEspecial` | Condicion de la operacion | select | Yes | Special regime |
| `applicantObservaciones` | Observaciones | textfield | No | |
| `applicantFechaDeExpiracion2` | Fecha de expiracion | datetime | No | |

### applicantColumns10 (Origin/Shipping for IMPORTS)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeOrigen` | Pais de origen | select | Yes | |
| `applicantPaisDeEmbarque` | Pais de embarque | select | Yes | |
| `applicantProveedorExtranjero3` | Proveedor extranjero | textfield | Yes | |

### applicantcolumns2 (National client for IMPORTS)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantClienteNacional` | Cliente nacional | textfield | Yes | |
| `applicantFormaDeGestionNoEstatal2` | Forma de gestion no estatal | checkbox | No | |

### applicantColumns9 (Destination/Client for EXPORTS)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeOrigen2` | Pais de destino | select | Yes | (key says Origen, label says Destino!) |
| `applicantClienteExtranjero` | Cliente extranjero | textfield | Yes | |
| `applicantProveedorNacional` | Proveedor nacional | textfield | Yes | |
| `applicantFormaDeGestionNoEstatal` | Forma de gestion no Estatal | checkbox | No | |

## Panel: applicantBlock18 (Productos -- NUEVO PERMISO)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContent12` | Content | content | No | Instructions |

### DataGrid: applicantDataGridNuevonuevo ("Lista de productos nuevos")

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantSeccion` | Capitulo | select | Yes | Chapter dropdown |
| `applicantProducto` | Subpartidas | select | Yes | Sub-item (triggers UM bot) |
| `applicantDescripcion5` | Descripcion | textfield | Yes | |
| `applicantUm` | UM | textfield | No | Auto-filled by UNIDAD DE MEDIDA Leer bot |
| `applicantValor` | Valor | number | Yes | Value |
| `applicantCantidad` | Cantidad | number | Yes | Quantity |
| `applicantSubpartida` | Codigo | textfield | No | Hidden - auto-filled code |
| `applicantDescripcionSubpartida` | Subpartida value | textfield | No | Hidden - auto-filled |

### applicantColumns24

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantValorTotal` | Valor total | number | No | Calculated total |

## Tabs: applicantTabsFacultades ("Permiso existente")

**action_id**: `b579481e-a985-4449-8961-b1cbd82dd918`
Fires 2 bots when opened:
1. PERMISO EVENTUAL Leer (`2c918084887c7a8f01887c99eedc70a3`) -- reads existing PE data
2. PERMISO EVENTUAL Listar productos (`2c918084887c7a8f01887c99eeda708e`) -- lists existing products

### Tab 1: applicantTabsFacultadesoperacionPreviamenteAutorizada ("Operacion previamente autorizada")

#### FieldSet: applicantFieldSet2 ("Datos de la operacion")

##### applicantColumns6 (Operation data)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantOperacion` | Operacion | select | No | Import/Export |
| `applicantRegimenEspecial2` | Regimen especial? | select | No | |
| `applicantValidHasta` | Permiso valido hasta | datetime | No | |

##### applicantColumns12

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeDestino` | Pais de destino | select | No | |
| `applicantProveedorNacional2` | Proveedor nacional | textfield | No | |
| `applicantClienteExtranjero2` | Cliente extranjero | textfield | No | |

##### applicantColumns11

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeOrigen3` | Pais de origen | select | No | |
| `applicantPaisDeEmbarque2` | Pais de embarque | select | No | |
| `applicantProveedorExtranjero` | Proveedor extranjero | textfield | No | |
| `applicantClienteNacional2` | Cliente nacional | textfield | No | |

##### applicantColumns13

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantNumeroDeContrato` | Numero de contrato | textfield | No | |
| `applicantNumeroDeFacturaODonacion` | Numero de factura o donacion | textfield | No | |
| `applicantCantidadDeEmbarques` | Cantidad de embarques | number | No | |
| `applicantFechaDelUltimoEmbarque` | Fecha del ultimo embarque | datetime | No | |

#### FieldSet: applicantFieldSet3 (Existing products)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContent7` | Content | content | No | Instructions |

##### DataGrid: applicantDataGridNuevonuevo3 ("Productos autorizados")

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantSeccion3` | Capitulo | select | No | |
| `applicantProducto3` | Producto | select | No | |
| `applicantDescripcion2` | Descripcion | textfield | No | |
| `applicantUm4` | UM | textfield | No | |
| `applicantValor2` | Valor | number | No | |
| `applicantCantidad2` | Cantidad | number | No | |
| `applicantSeleccionar` | Seleccionar | checkbox | No | User selects products to modify |

##### applicantColumns25

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantValotTotal` | Valor total | number | No | (typo in key: "Valot") |

### Tab 2: applicantTabsFacultadesmodificacionesSolicitadas ("Modificaciones solicitadas")

#### FieldSet: applicantFieldSet4 (Modified operation data)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantContentModificacionesSolicitadas` | Autorizaciones modificaciones parte A | content | No | |

##### applicantColumns8

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantOperacion2` | Operacion | select | No | |
| `applicantRegimenEspecial3` | Regimen especial? | select | No | |
| `applicantValidoHasta` | Valido hasta | datetime | No | |

##### applicantColumns14

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeEmbarque4` | Pais de Origen | select | No | (key says Embarque, label says Origen!) |
| `applicantPaisDeEmbarque3` | Pais de embarque | select | No | |
| `applicantProveedorExtranjero2` | Proveedor extranjero | textfield | No | |
| `applicantClienteNacional3` | Cliente nacional | textfield | No | |

##### applicantColumns22

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPaisDeDestino2` | Pais de destino | select | No | |
| `applicantProveedorNacional3` | Proveedor nacional | textfield | No | |
| `applicantClienteExtranjero3` | Cliente extranjero | textfield | No | |

##### applicantColumns18

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantNumeroDeContrato2` | Numero de contrato | textfield | No | |
| `applicantNumeroDeFacturaODonacion2` | Numero de factura o donacion | textfield | No | |
| `applicantCantidadDeEmbarques2` | Cantidad de embarques | number | No | |
| `applicantFechaDelUltimoEmbarque2` | Fecha del ultimo embarque | datetime | No | |

##### applicantColumns27

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantValorTotalModificadosYAdicionales` | Valor total (modificados) | number | No | |

#### FieldSet: applicantFieldSet6 (Modified products)

##### DataGrid: applicantDataGridNuevonuevo4 ("Productos modificados")

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantSeccion4` | Capitulo | select | No | |
| `applicantProducto4` | Producto | select | No | |
| `applicantDescripcion` | Descripcion | textfield | No | |
| `applicantUm3` | UM | textfield | No | |
| `applicantValor3` | Valor | number | No | |
| `applicantCantidad3` | Cantidad | number | No | |

##### applicantcolumns

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantValorTotal2` | Valor total | number | No | |

## Panel: applicantBlock9 (Fundamentacion)

### applicantcolumns4

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantFundamentacion` | Fundamentacion | textarea | Yes | Justification text |
| `applicantDocumentoQueAvaleLaFundamentacion` | Documento que avale la fundamentacion | file | No | Supporting document |

### applicantcolumns5 (Mariel zone)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantDescargarCarta` | Descargar carta | button | No | Downloads Mariel zone letter |
| `applicantSubirLaCartaAvalDeLaZonaMariel` | Subir la Carta emitida por la Oficina de la ZED Mariel | file | Yes | Only for Mariel zone companies |

## Panel: applicantBlock3 (Contacto)

### applicantColumns4

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantElaboradoPor` | Elaborado por | textfield | Yes | |
| `applicantTelefono` | Telefono | textfield | Yes | |
| `applicantEmail` | Email | textfield | Yes | |

## Panel: applicantBlock15 (Confirmacion)

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantCheckbox2` | Confirmo la exactitud de la informacion declarada | checkbox | No | |

## Misc

| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| `applicantPorqueNoVienenDatos` | Porque no vienen datos | button | No | Retries product listing |
| `applicantValidateTheForm` | Enviar | button | No | Submit form |

## 3.2 Component Actions -- PE

| Component Key | Bot Name | Bot ID | Bot Type | What it does |
|---------------|----------|--------|----------|--------------|
| `applicantValidateTheForm` | Validate applicant form | `saveA5` | system | Validates and submits |
| `applicantTabsFacultades` | PERMISO EVENTUAL Leer | `2c918084887c7a8f01887c99eedc70a3` | data | Reads existing PE data |
| `applicantTabsFacultades` | PERMISO EVENTUAL Listar productos | `2c918084887c7a8f01887c99eeda708e` | data | Lists existing products |
| `applicantProducto` | UNIDAD DE MEDIDA Leer | `2c9180909113b63e0191224fba170002` | data | Auto-fills UM field |
| `applicantPorqueNoVienenDatos` | PERMISO EVENTUAL Listar productos | `2c918084887c7a8f01887c99eeda708e` | data | Retries product listing |
| `applicantDescargarCarta` | Carta ZEDmariel | `2c91808c97153c2801971cd91fc5003e` | document | Generates Mariel zone letter |
| `applicantBlock11` | (empty) | -- | -- | Action exists but no bots |
| `applicantBlock` | (empty) | -- | -- | Action exists but no bots |
| `applicantBlock6` | (empty) | -- | -- | Action exists but no bots |
| `applicantUm` | (empty) | -- | -- | Action exists but no bots |

## 3.3 Determinants -- PE (Key ones for E2E testing)

### Bitacora Flow Determinants

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `7383e917-9fc7-492e-bee1-89d5cbb4c031` | status bitacora = TRUE | radio | `applicantStatusLlegaDeLaBitacora` | = "true" |
| `edbcb535-d5b7-4f05-ac29-bbedd48524d1` | status bitacora = NOT TRUE | radio | `applicantStatusLlegaDeLaBitacora` | != "true" |
| `2c918084887c7a8f01887c99ed947018` | Que necesita = nuevo permiso | radio | `applicantQueQuiereHacer` | = "registrarNuevo" |
| `2c918084887c7a8f01887c99ed947027` | Que necesita = modificar permiso existente | radio | `applicantQueQuiereHacer` | = "modificarExistente" |

### Operation Type Determinants

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `2c918084887c7a8f01887c99ed8e6fec` | Operacion = importar (nuevos - parte A) | classification | `applicantTipoDeOperacion2` | = import |
| `2c918084887c7a8f01887c99ed4e6fe0` | operacion = exportar (nuevos - parte A) | classification | `applicantTipoDeOperacion2` | = export |
| `2c918084887c7a8f01887c99ed4e6fe3` | Operacion = importar (a modificar - parte A) | classification | `applicantOperacion` | = import |
| `2c918084887c7a8f01887c99ed4d6fde` | operacion = exportar (a modificar - parte A) | classification | `applicantOperacion` | = export |
| `2c918084887c7a8f01887c99ed8e6fee` | Operacion = importar (modificados - parte A) | classification | `applicantOperacion2` | = import |
| `2c918084887c7a8f01887c99ed4d6fda` | operacion = exportar (modificados - parte A) | classification | `applicantOperacion2` | = export |

### Mariel Zone

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `2c9180899610867501962192ca4901f9` | EMPRESA pertenece Zona Mariel | radio | `applicantPermisoEventual2` | = "true" |

### Product/Form Validation

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `6c55e084-1003-4c04-8561-3cbe5d4103c2` | Contador productos nuevos > 0 | numeric | `applicantContadorProductosNuevos` | > 0 |
| `2c918084887c7a8f01887c99ed947023` | Confirmo la exactitud = SI (formulario parte A) | boolean | `applicantCheckbox2` | = true |
| `2c918084887c7a8f01887c99ed94700b` | Fundamentacion != empty | text | `applicantFundamentacion` | != "" |
| `8fa3fabe-5800-43f1-b1dc-6012652b2810` | Current PartA tab is valid | boolean | `isCurrentPartATabValid` | = true |
| `4b9bcd32-313f-4e07-b102-e12adb26ef9b` | Form is valid | boolean | `isFormValid` | = true |
| `5415b8fd-1d44-4c8e-a580-b148d0c3fb2f` | User is logged in | boolean | `is_submit_allowed` | = true |

### Existing Product Selection

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `2c918084887c7a8f01887c99ed947002` | Selecionar = SI (Parte A - existentes) | grid | `applicantDataGridNuevonuevo3` | Grid row det |

### Client Field Visibility

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `2c918084887c7a8f01887c99ed947003` | cliente nacional != empty (nuevo permiso) | text | `applicantClienteNacional` | != "" |
| `2c918084887c7a8f01887c99ed947026` | cliente extranjero != empty (nuevo permiso) | text | `applicantClienteExtranjero` | != "" |

### Part B (Review phase) Determinants

| ID | Name | Type | Target | Condition |
|----|------|------|--------|-----------|
| `2c918084887c7a8f01887c99ed947011` | Aprobado nuevo | grid | `revisionDataGridNuevosParteB` | Grid row det |
| `2c918084887c7a8f01887c99ed94701d` | Cantidad de productos modificados > 0 | numeric | `revisionCantidadProductosModificadosAprobados` | > 0 |
| `384fad52-1bbe-468f-8545-8e2adf2f7ca5` | Comunicacion con MINCEX PE = false | radio | `permisoFirmadoaprobarComunicacionConMincexPe` | = "false" |
| `4e868dd9-c0a3-47dd-9aa0-30f3bb56dd21` | Comunicacion con MINCEX PE = true | radio | `permisoFirmadoaprobarComunicacionConMincexPe` | = "true" |
| `088276d9-441c-4724-b369-0151d003108e` | Que quiere hacer con esta solicitud = Continuar | radio | `datosComplementariosRadio` | = "Realizar Operacion" |
| `2c91808f8eaf3797018ec8b47412009a` | Quiere=CancelarOperacion | radio | `datosComplementariosRadio` | = "Cancelar Operacion" |
| `2c91808f8eaf3797018ec8b51767009c` | Quiere=realizarOperacion | radio | `datosComplementariosRadio` | = "Realizar Operacion" |

## 3.4 Bots -- PE

| Bot ID | Name | Type | GDB Service | Category |
|--------|------|------|-------------|----------|
| `2c918084887c7a8f01887c99eedc70a3` | PERMISO EVENTUAL Leer | data | GDB.GDB-PE(1.5)-read | read |
| `2c918084887c7a8f01887c99eeda708e` | PERMISO EVENTUAL Listar productos | data | GDB.GDB-PERMISOS(1.5)-list | list |
| `2c9180869666288f01967df516790119` | PERMISO EVENTUAL Listar | data | GDB.GDB-PE(1.5)-list | list |
| `2c918084887c7a8f01887c99eee370f6` | PERMISO EVENTUAL Crear | data | GDB.GDB-PE(1.5)-create | create |
| `2c918084887c7a8f01887c99eef0716d` | PERMISO EVENTUAL Actualizar | data | GDB.GDB-PE(1.5)-update | update |
| `8b0b5bb0-c1c6-4f7f-9ed3-2928466e2f88` | PERMISO EVENTUAL Actualizar entries | data | GDB.GDB-PERMISOS(1.5)-update-entries | update |
| `23ba6abc-78e8-4858-ba12-b592d0a0ad8b` | PERMISO EVENTUAL Crear entries | data | GDB.GDB-PERMISOS(1.5)-create-entries | create |
| `2c918084887c7a8f01887c99eebb7078` | Cargar el certificado | document | generic-pdf-generator | document_generate_upload_display |
| `2c918084887c7a8f01887c99eed9708d` | Mostrar certificado de permiso eventual | document | generic-pdf-display | document_generate_and_display |
| `2c91808c97153c2801971cd91fc5003e` | Carta ZEDmariel | document | generic-pdf-display | document_generate_and_display |
| `2c918084887c7a8f01887c99ee1c7053` | Interno - Certificado de NUEVO permiso eventual | internal | -- | -- |
| `2c918084887c7a8f01887c99ee1a7031` | Interno - certificado permiso modificado | internal | -- | -- |
| `2c91808f8eaf3797018ec8b79ae8009d` | VerDatossolicitud | internal | -- | -- |
| `2c9180909113b63e0191224fba170002` | UNIDAD DE MEDIDA Leer | data | GDB.GDB-FLAT UM 2(1.0)-read | read |
| `2c918084887c7a8f01887c99eee87127` | MINCEX DB Crear ejecucion | data | mincex-actualizar-eventual | other |
| `2c918084887c7a8f01887c99eeee7152` | MINCEX XLS modificaciones | data | mincex-excel-pe | other |
| `2c918084887c7a8f01887c99eee6710d` | MINCEX XLS nuevos | data | mincex-excel-pe | other |

## 3.5 Fields Auto-populated from Bitacora

When a user clicks "Permiso eventual" in the Bitacora Block22 dropdown, the bot `INTERNO permisos eventuales - nuevo` (`6603eb75`) sends these fields to the PE form:

| Bitacora Source | PE Destination | What |
|----------------|----------------|------|
| `applicantNit5` | `applicantNit3` | NIT of selected company |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | Company name |
| `applicantRadio` | `applicantStatusLlegaDeLaBitacora` | constant "true" |
| `applicantRadio` | `applicantQueQuiereHacer` | "registrarNuevo" |
| Counter value | `applicantContadorEventuales` | Number of existing PE |

For MODIFICATIONS (bot `INTERNO permisos eventuales - modificar`, `c88be29b`):

| Bitacora Source | PE Destination | What |
|----------------|----------------|------|
| `applicantNit5` | `applicantNit3` | NIT |
| `applicantCompania7` | `applicantNombreDeLaEmpresa4` | Company name |
| constant | `applicantStatusLlegaDeLaBitacora` | "true" |
| constant | `applicantQueQuiereHacer` | "modificarExistente" |
| Solicitud number | `applicantSolicitud` | Request number to modify |

---

# NOTAS PARA E2E TESTING

## Flujo Nuevo PE desde Bitacora
1. Login
2. Navigate to Bitacora
3. Select an accredited company (in `applicantEditGridEmpresasAcreditadas`)
4. Go to Block22 "Permisos" section
5. Click dropdown `applicantdropdown5` -> "Permiso eventual" (`applicantPermisoEventual`)
6. Bot fires -> opens PE form with pre-filled fields
7. Verify `applicantStatusLlegaDeLaBitacora` = "true"
8. Verify `applicantNombreDeLaEmpresa4` and `applicantNit3` are filled
9. Fill Block8 (operation data), Block18 (products), Block9 (fundamentacion), Block3 (contacto)
10. Check `applicantCheckbox2`, click `applicantValidateTheForm`

## Flujo Acreditarse en otra empresa
1. Login
2. Navigate to Bitacora
3. Click dropdown `applicantdropdown3` -> "Acreditarse en otra empresa" (`applicantAcreditarmeAOtraEmpresa`)
4. Bot fires -> opens Acreditaciones form
5. Select `applicantQuieroCrearUnaNuevaAcreditacion` = true (radio)
6. In `applicantNuevasAcreditacionesSolicitadas` editgrid, enter NIT, click `applicantBuscar2`
7. Verify bot results in `applicantEmpresa`, `applicantStatusClientesIdExiste`, etc.
8. Check `applicantConfirmar`
9. Click `applicantValidateTheForm`

## Key CSS Selectors (eRegistrations pattern)
- Fields: `[name="data[{key}]"]` or `[ref="{key}"]`
- Panels: `.formio-component-{key}`
- Buttons: `.formio-component-{key} button`
- EditGrid rows: `.formio-component-{editgridKey} .editgrid-row`
- Dropdown menus: `.formio-component-{dropdownKey} .dropdown-menu`

---

*Respuesta generada el 2026-02-21 por Manual Agent (El Oraculo) usando BPA-cuba MCP v0.18.0*
