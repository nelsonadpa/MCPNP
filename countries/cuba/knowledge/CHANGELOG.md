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
