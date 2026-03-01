# Bitacora & Services - Technical Knowledge for Testing Agent

## Architecture Overview

### The Bitacora (Hub Service)
- **Service ID**: `ffe746aac09241078bad48c9b95cdfe0`
- The Bitacora is the central hub where companies manage ALL their permits and registrations
- Users select a company first, then can add new permits/registrations or manage existing ones
- The Bitacora form uses **form.io** components (panels, editgrids, buttons, dropdowns)

### How it works end-to-end:
1. User selects a company (from company list)
2. Bitacora shows two sections:
   - **Block22 "Permisos"**: PE, Fito, Zoo, ONURE, Sustancias, Sanitario (6 permit types)
   - **Block4 "Registros"**: CyP, Homologacion, CECMED, Sucursales, INHEM, CENASA, Reg Sustancias, Seg Ambiental, Donativos, Cert Origen, Cert Aprobacion (11 registry types)
3. Each section has an "Agregar" dropdown with buttons to create new permits/registrations
4. Clicking a button fires a **Bot INTERNO** that opens the destination service pre-filled with company data
5. Each section has **EditGrids** showing existing permits (fetched by **Bot LISTAR** using NIT)
6. EditGrid rows show: Tipo, Numero, Fecha vigencia, Expirado badge

### Bot Types:
- **INTERNO**: Links Bitacora to a destination service. Sends data (NIT, company name, StatusBitacora=true, QueQuiereHacer, Contador) to pre-fill the destination form
- **LISTAR (GDB)**: Queries a Global Database for existing permits by NIT. Returns count, permit numbers, expiration dates, status
- **Component Actions**: Tie bots to UI components (buttons fire INTERNO bots, panels fire LISTAR bots on load)

### Key Hidden Fields in Bitacora:
- `applicantNit5` - NIT of selected company
- `applicantCompania7` - Company name
- `applicantRadio` - Hidden radio="registrarNuevo" (for nuevo flow)
- `applicantRadio2` - Hidden radio="modificarExistente" (for modif flow)

## All 18 Destination Services

| # | Service | Service ID | Type |
|---|---------|-----------|------|
| 1 | Permiso Eventual (PE) | `2c918084887c7a8f01887c99ed2a6fd5` | Permit |
| 2 | Permiso Fitosanitario | `2c91808893792e2b019379310a8003a9` | Permit |
| 3 | Permiso Zoosanitario | `2c91808893792e2b01938d3fd5800ceb` | Permit |
| 4 | Sustancias Controladas | `8393ad98-a16d-4a2d-80d0-23fbbd69b9e7` | Permit |
| 5 | Certificado Sanitario | `2c91808893792e2b0193792f8e170001` | Permit |
| 6 | ONURE Equipos energia | `2c91808893792e2b01944713789f1c89` | Permit |
| 7 | ONN Instrumentos medicion | `d69e921e-62e2-4b39-9d7e-bc8f6e36a426` | Registry |
| 8 | CECMED Licencia sanitaria | `2c9180879656ae1901965aa932f60348` | Registry |
| 9 | Homologacion ONURE | `bf77b220-6643-4f1e-bab0-69cf808b4e42` | Registry |
| 10 | CyP Clientes y Proveedores | `2c918090909800d60190c16b80292f3a` | Registry |
| 11 | Sucursales CCRC | `2c91809196d796900196d9b69f9f0cf7` | Registry |
| 12 | Donativos CECMED | `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa` | Registry |
| 13 | Cert. Origen exportacion | `8a2b5457-9656-424e-9e34-f09c27bed997` | Registry |
| 14 | Cert. aprobacion modelo ONN | `2c918088948ec322019499d518660007` | Registry |
| 15 | INHEM Reg. sanitario | `2c91809094f110ae0195435c8fb209b6` | Registry |
| 16 | CENASA Reg. zoosanitario | `2c91809095d83aac0195de8f880f03cd` | Registry |
| 17 | Reg. Sustancias fiscalizacion | `2ef97d8e-a5c7-47e8-81de-1856675139e5` | Registry |
| 18 | Seg. ambiental/nuclear (ORSA) | `2c918083976cc50e01977dd5a5a90061` | Registry |

## Destination Service Form Structure (common pattern)

Each destination service form typically has:
1. **Hidden Bitacora block** (varies by service) containing:
   - `applicantStatusLlegaDeLaBitacora` (radio) - set to "true" when arriving from Bitacora
   - `applicantQueQuiereHacer` (radio) - "registrarNuevo" or "modificarExistente"
   - `applicantNit` or `applicantNit3` (textfield) - company NIT
   - `applicantNombreDeLaEmpresa*` (textfield) - company name
   - `applicantContador*` (number) - counter
   - `applicantNumeroDeSolicitud` (textfield) - request number
   - `applicantServicio` (textfield) - service name
   - `applicantFechaDeLaSolicitud` (datetime)

2. **"Su empresa seleccionada" panel** - Displays company name + NIT using mustache templates

3. **Main form block** - Service-specific fields (varies greatly per service)

4. **Submit section** - "Elaborado por", "Confirmo" checkbox, "Enviar" button

### Field Keys Vary Per Service!
| Service | NIT Key | Empresa Key |
|---------|---------|-------------|
| PE | `applicantNit3` | `applicantNombreDeLaEmpresa4` |
| Fito | `applicantNit` | `applicantNombreDeLaEmpresa` |
| Zoo | `applicantNit` | `applicantNombreDeLaEmpresa` |
| Sustancias | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Cert. Sanitario | `applicantNit3` | `applicantNombreDeLaEmpresa` |
| ONURE | `applicantNit` | `applicantNombreEmpresa` |
| Most others | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Seg. ambiental | `applicantNit3` | `applicantNombreDeLaEmpresa11` |

## Bitacora UI Structure (Block22 + Block4)

### Block22 - Permisos (6 EditGrids)
"Agregar" dropdown buttons:
- `applicantPermisoEventual` → PE
- `applicantEventuales3` → Fito
- `applicantEquiposUsoDeEnergia2` → Zoo (misleading key name!)
- `applicantEventuales` → ONURE
- `applicantSustanciasBtn` → Sustancias
- `applicantSanitarioBtn` → Sanitario

EditGrid keys: `applicantEditGrid` (PE), `applicantEditGridFito`, `applicantEditGridZoo`, `applicantPermisoZoosanitario` (=ONURE, misleading!), `applicantEditGridSustancias`, `applicantEditGridSanitario`

### Block4 - Registros (11 EditGrids)
"Agregar" dropdown buttons for: CyP, Homologacion, CECMED, Sucursales, INHEM, CENASA, Reg Sustancias, Seg Ambiental, Donativos, Cert Origen, Cert Aprobacion

EditGrid keys: `applicantEditGridHomologacion`, `applicantEditGridCyp`, `applicantEditGridCecmed`, `applicantEditGridSucursales`, `applicantEditGridInhem`, `applicantEditGridCenasa`, `applicantEditGridRegSust`, `applicantEditGridSegAmb`, `applicantEditGridDonativos`, `applicantEditGridOnn`, `applicantEditGridCertAprobacion`

## Key Naming Gotchas
- `applicantPermisoZoosanitario` = ONURE EditGrid (NOT Zoo!)
- `applicantEquiposUsoDeEnergia2` = Zoo button (NOT ONURE!)
- Block27 does NOT exist - all permits are in Block22
- `applicantEventuales4` = "Donativos medicos" button
- `applicantDonativosMedicos` = "Instrumentos de medicion" button (swapped labels!)

## Playwright Testing Notes
- **Base URL**: `https://bpa.cuba.eregistrations.org`
- **Auth**: CAS SSO → cookies stored in `auth-state.json`
- **JWT**: Extracted from `localStorage.getItem('tokenJWT')` after navigating to form builder
- **Form builder URL**: `/services/{serviceId}/forms/applicant-form`
- **Frontend (user-facing)**: `/services` → sidebar with Empresas, Servicios, Mis solicitudes
- The form builder (admin) is different from the user-facing form
- **Selectors**: form.io uses `[ref="componentKey"]` for components
- **Solicitudes table**: Shows all cases with status (Borrador, etc.)

## StatusBitacora Determinant (work in progress)
- Each service needs a "radio determinant" that checks `applicantStatusLlegaDeLaBitacora == true`
- When true, a specific block activates (shows) in the destination service form
- This is being fixed via REST API (MCP has bugs for radio determinants)
- The target block varies per service - see `statusbitacora-mapping.md` for full inventory

## Cadena de Trigger: Bot LISTAR (verificada 2026-02-27)

Los bots LISTAR no se disparan directamente desde un botón. La cadena es:

```
1. Usuario selecciona empresa en applicantEditGridEmpresasAcreditadas
   → Determinant "EVENT empresa selected" (09be76c6, tipo grid) se activa
   → (O si solo hay 1 empresa: determinant "Contador acreditadas = 1" (bbc34872) auto-activa)

2. applicantBlock8 se muestra (behaviour: show + activate, lógica OR entre ambos determinants)
   → Título: "Bots para listar trámites por servicio"
   → Contiene 14 sub-paneles, uno por servicio

3. Cada sub-panel tiene un panel hijo con componentAction que dispara el bot LISTAR
   → Ejemplo PE: applicantBlock8 > applicantcolumns7 > applicantBlock
     - componentActionId: faefcc8a-d7ff-4f98-93cf-3aca95b2aaa5
     - Bot: b94c62ab "Permiso eventual LISTAR" (tipo data, GDB-PE 1.6)
   → El panel al renderizarse ejecuta el bot automáticamente

4. Bot consulta GDB con NIT (input: applicantNit5 → query_child_NIT)
   → Output: applicantEditGrid (filas), applicantContadorPermiso (count),
     applicantStatusFuncionoElBot ("true"/"false")
```

### Notas importantes
- **applicantCambiarEmpresa3** solo hace `goToNextTab` — NO es el trigger del LISTAR
- **applicantBlock22** tiene registro de acciones pero está VACÍO (actions: [])
- El trigger real es la **visibilidad de Block8** controlada por determinants de selección de empresa
- En tests E2E que bypasean Bitácora, los LISTAR nunca se disparan (no hay selección de empresa)
- En producción vía Bitácora: 459 ejecuciones/7d, 0% error rate (Graylog 2026-02-26)

## Expirado Badge Pattern
Each EditGrid in the Bitacora has an "Expirado" badge button that turns red when the permit's expiration date < today. This requires:
1. A grid+date determinant checking the date column < current date
2. A behaviour linking the determinant to the badge button
3. The badge is hidden by default (`activate: false`, CSS class `deactivated`)
