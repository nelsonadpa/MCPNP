# BPA Configuration Changelog

Registro de todos los cambios aplicados por el Config Agent. El Test Agent usa esto para saber que re-testear.

## Formato
```
### YYYY-MM-DD | Servicio | Cambio
- Que se cambio
- Por que
- IDs creados/modificados
- Estado: OK / NEEDS_CLEANUP / NEEDS_RETEST
```

---

### 2026-03-07 | Bitacora (ffe746aac09241078bad48c9b95cdfe0) | Cambiar Empresa — Page Reload
- **Problem**: EditGrid permissions don't refresh when user changes company (LISTAR bots only fire once on panel activation)
- **Fix**: Set `custom: "window.location.reload();"` on button `applicantCambiarEmpresa2` ("Cambiar empresa", Tab 1)
- When user clicks "Cambiar empresa", page reloads → lands on Tab 0 (default) → selects new company → "Confirmar" → Tab 1+ panels activate fresh → LISTAR bots re-execute with new NIT
- **Component modified**: `applicantCambiarEmpresa2` (button) — `custom` field changed from `""` to `"window.location.reload();"`
- **ComponentAction preserved**: `goToPreviousPage` still linked (reload overrides it)
- **Audit ID**: `27767ac9-acd1-4640-b453-1ca31e9f42c5`
- **Estado**: NEEDS_RETEST — verify in browser with two different companies

---

### 2026-03-03 | Bitacora (ffe746aac09241078bad48c9b95cdfe0) | My Files Block — Query, View & Delegate
- Added complete "My Files" panel inside `applicantBlock37` (existing panel titled "Delegar")
- **Query Bot**: "Get my files" (`d1aebd6f-652e-467d-8756-c33ec95eadb1`) → `DS.DS - Query user files`
  - Input: constant_1→page, constant_100→page_size
  - Output: 11 mappings (10 DataGrid columns + count) via save_all
- **Delegate Bot**: "Delegar file" (`139054c7-13cc-4120-a779-b03046ecd298`) → `DS.Share access to file`
  - Input: 2 compound mappings (fileId + email) via save_all
  - Output: 3 compound mappings (status + message + error) via save_all
- **Components added** (20 total):
  - Button: applicantGetMyFiles (triggers Query Bot)
  - DataGrid: applicantFileResults (10 data columns + View link + Delegate button + email + badge + status + debug panel)
  - TextField: applicantFileCount (Total Files)
- **Delegated badge**: applicantDelegatedIcon (hidden button, shown by determinant `d3665760` when status != "")
- **Determinant**: "Delegation completed" (`d3665760-2a0c-4b19-a7ca-3fece52dfb7b`) — text NOT_EQUAL ""
- **Effect**: show (`82f6d37f`) on applicantDelegatedIcon, behaviour `a86e8a5f`
- **Debug scan**: 10 issues (2 known false positives for constant_*, 8 pre-existing in other bots), 0 blocking
- **Published**: OK (audit `c46ba08f`)
- Estado: **OK — NEEDS_RETEST**

### 2026-02-14 | Fito (2c91808893792e2b019379310a8003a9) | StatusBitacora determinante + effect
- Creado radio determinant `daf38ab6` (StatusBitacora = TRUE)
- Creado behaviour `cd9c2714` con effect activando `applicantBlock12`
- Estado: OK — modelo completo

### 2026-02-14 | Fito | Panel "Su empresa seleccionada"
- Creado panel `applicantBlockEmpresa` con content mostrando mustache templates
- `{{data.applicantNombreDeLaEmpresa}}` + `{{data.applicantNit}}`
- Estado: OK

### 2026-02-14 | Sustancias (8393ad98-a16d-4a2d-80d0-23fbbd69b9e7) | Panel "Su empresa seleccionada"
- Creado panel `applicantBlockEmpresa` con content mostrando mustache templates
- `{{data.applicantNombreDeLaEmpresa11}}` + `{{data.applicantNit}}`
- Estado: OK

### 2026-02-21 | 7 servicios | StatusBitacora determinantes + behaviours (PARCIAL)
- Creados radio determinants via REST API para: PE, Zoo, CertSanitario, INHEM, CENASA, RegSustancias, SegAmbiental
- Creados behaviours para los mismos 7 servicios
- PROBLEMA: Todos los behaviours apuntan a `applicantBlock12` que es INCORRECTO para la mayoria
- Servicios afectados y su bloque correcto:
  - PE: bloque TBD (no tiene Block12)
  - Zoo: `applicantBlock24`
  - CertSanitario: `applicantBlock24`
  - INHEM: `applicantBlock11`
  - CENASA: `applicantBlock14`
  - RegSustancias: `applicantBlock10`
  - SegAmbiental: `applicantBlock5`
- Estado: **NEEDS_CLEANUP** — borrar behaviours incorrectos y recrear con bloques correctos

### 2026-02-21 | Sustancias | StatusBitacora determinante creado, behaviour fallido
- Determinant `8b8278a5` creado OK
- Behaviour fallo: duplicate key (ya existia behaviour `36cbb012` en `applicantBlock12`)
- Bloque correcto: `applicantBlock`
- Estado: **NEEDS_CLEANUP** — borrar behaviour viejo `36cbb012`, crear nuevo apuntando a `applicantBlock`

### 2026-02-21 | 9 servicios | StatusBitacora FALLIDO (IDs incorrectos)
- ONURE, ONN, CECMED, Homologacion, CyP, Sucursales, Donativos, CertOrigen, CertAprobONN
- Fallaron con "Database object not found" — los Service IDs en memoria eran stale
- IDs corregidos, guardados en `statusbitacora-mapping.md`
- Estado: **PENDIENTE** — necesitan re-run con IDs correctos

### 2026-02-22 | CENASA (2c91809095d83aac0195de8f880f03cd) | StatusBitacora effect creado (DEMO)
- Determinante existente: `1f83b9f3` (status bitacora = TRUE, radio)
- Creado behaviour `1ba2094f` con effect `71820074` en `applicantBlock6` ("Su empresa seleccionada")
- Effect type: activate (Block6 se muestra cuando StatusBitacora = TRUE)
- Creado como parte del ejercicio demo multi-agente
- Comunicacion: config->manual_001.md (request) + manual-config_001.md (response)
- Estado: OK — verificado via componentbehaviour_get_by_component

### 2026-02-25 | Platform-wide | File Sharing / Delegation Feature (DS-Backend)
- Feature: Email-based file delegation using `File.allowed_users` JSONField
- Backend: 9 permission/queryset gaps fixed, 13 `icontains`→`contains` security fixes
- Tests: 7/7 pass, no migrations needed (field exists since migration 0036, Jul 2024)
- Frontend: NOT STARTED — needs Share button in dashboard (3 files)
- Full analysis: `countries/cuba/analysis/file-sharing/`
- Code changes: `/Users/nelsonperez/Desktop/OCAgents/countries/cuba/analysis/file-sharing/workspace/DS-Backend/` (uncommitted)
- Estado: **BACKEND DONE — FRONTEND PENDING**
