# Fix Determinant + Effect Linkages via REST API

This skill creates/fixes determinants, behaviours, and effects across BPA services using the REST API bypass (avoids MCP bugs 1-6).

## Prerequisites
- Playwright installed in `/Users/nelsonperez/Desktop/OCAgents/playwright-bpa/`
- Auth state saved in `playwright-bpa/auth-state.json` (run any spec to login first)
- MCP BPA-cuba server connected (for `form_component_update` step)

## Quick Reference

### REST API Base
```
https://bpa.cuba.eregistrations.org/bparest/bpa/v2016/06/
```

### Authentication
1. Load cookies from `auth-state.json`
2. Navigate to form builder to load Angular app
3. Extract JWT: `localStorage.getItem('tokenJWT')`
4. Use header: `Authorization: Bearer {jwt}`

---

## 3-Step Workflow

### Step 1: Create Determinant (REST API)

**Radio determinant** (for StatusBitacora):
```
POST /bparest/bpa/v2016/06/service/{serviceId}/radiodeterminant
```
```json
{
  "name": "status bitacora = TRUE",
  "determinantType": "FORMFIELD",
  "serviceId": "{serviceId}",
  "targetFormFieldKey": "applicantStatusLlegaDeLaBitacora",
  "generated": false,
  "determinantInsideGrid": false,
  "businessKey": "{ServiceShortName}statusbitacora=TRUE",
  "operator": "EQUAL",
  "selectValue": "true",
  "value": "true",
  "type": "radio",
  "operatorStringValue": "EQUAL",
  "valueIsNullOrEmpty": false
}
```

**Grid+date determinant** (for Expirado badges):
```
POST /bparest/bpa/v2016/06/service/{serviceId}/griddeterminant
```
```json
{
  "name": "{badgeName} fecha < hoy",
  "determinantType": "FORMFIELD",
  "serviceId": "{serviceId}",
  "targetFormFieldKey": "{editGridKey}",
  "generated": false,
  "determinantInsideGrid": true,
  "businessKey": "MyAccountPage{badgeName}fecha<hoy",
  "rowDeterminant": {
    "name": "Row det {badgeName}",
    "determinantType": "FORMFIELD",
    "serviceId": "{serviceId}",
    "targetFormFieldKey": "{editGridKey}_collection_{dateColumnKey}",
    "generated": false,
    "determinantInsideGrid": false,
    "businessKey": "MyAccountPageRowdet{badgeName}",
    "operator": "LESS_THAN",
    "isCurrentDate": true,
    "type": "date",
    "operatorStringValue": "LESS_THAN",
    "valueIsNullOrEmpty": true
  },
  "type": "grid",
  "valueIsNullOrEmpty": true
}
```
CRITICAL: `rowDeterminant` must be inline (no `id`). Server creates both atomically.

### Step 2: Create Behaviour (REST API)
```
POST /bparest/bpa/v2016/06/service/{serviceId}/behaviour
```
```json
{
  "componentKey": "{targetComponentKey}",
  "effects": [{
    "sortOrderNumber": 0,
    "jsonDeterminants": "[{\"type\":\"OR\",\"items\":[{\"type\":\"OR\",\"determinantId\":\"{detId}\"}]}]",
    "propertyEffects": [
      { "name": "activate", "type": "boolean", "value": "true" },
      { "name": "disabled", "type": "boolean", "value": "false" },
      { "name": "show", "type": "boolean", "value": "true" }
    ]
  }]
}
```
CRITICAL: `jsonDeterminants` is a JSON STRING containing `determinantId` reference.

### Step 3: Update Component (MCP)
```
form_component_update(service_id, component_key, updates={
  "behaviourId": "{behaviourId}",
  "effectsIds": ["{effectId}"]
})
```

---

## Known MCP Bugs (why REST API is needed)

| Bug | MCP Tool | Problem | REST Workaround |
|-----|----------|---------|-----------------|
| 1-3 | `selectdeterminant_create` | Creates wrong Java class for radio fields | Use `/radiodeterminant` endpoint |
| 4-5 | `griddeterminant_create` | `row_determinant_id: null` | Use `/griddeterminant` with inline `rowDeterminant` |
| 6 | `datedeterminant_create` | Empty "where applied" field | Nest inside grid's `rowDeterminant` |

Note: `effect_create` via MCP WORKS correctly — creates behaviour + effect and auto-links behaviourId. Use MCP for effects, REST only for determinants.

DELETE `/behaviour/{id}` returns 405. Use MCP `effect_delete` instead.
PUT `/behaviour` returns 405. To fix: delete + recreate.

---

## Inventory: StatusBitacora (18 destination services)

All services have `applicantStatusLlegaDeLaBitacora` (radio field) and `applicantBlock12` (panel).

| # | Service | Service ID | Has Det? | Has Behaviour? | Action |
|---|---------|-----------|----------|----------------|--------|
| 1 | PE | `2c918084887c7a8f01887c99ed2a6fd5` | YES `7383e917` | NO | Create behaviour only |
| 2 | Fito | `2c91808893792e2b019379310a8003a9` | YES `daf38ab6` | YES `cd9c2714` | DONE |
| 3 | Zoo | `2c91808893792e2b01938d3fd5800ceb` | NO | NO | Create both |
| 4 | Sustancias | `8393ad98-a16d-4a2d-80d0-23fbbd69b9e7` | NO | YES (wrong) | Delete old + create both |
| 5 | Cert. Sanitario | `2c91808893792e2b0193792f8e170001` | NO | NO | Create both |
| 6 | ONURE | `2c91808893792e2b01944713789f1c89` | NO | NO | Create both |
| 7 | ONN Instrumentos | `d69e921e-62e2-4b39-9d7e-bc8f6e36a426` | NO | NO | Create both |
| 8 | CECMED Licencia | `2c9180879656ae1901965aa932f60348` | NO | NO | Create both |
| 9 | Homologacion | `bf77b220-6643-4f1e-bab0-69cf808b4e42` | NO | NO | Create both |
| 10 | CyP | `2c918090909800d60190c16b80292f3a` | NO | NO | Create both |
| 11 | Sucursales | `2c91809196d796900196d9b69f9f0cf7` | NO | NO | Create both |
| 12 | Donativos | `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa` | NO | NO | Create both |
| 13 | Cert. Origen | `8a2b5457-9656-424e-9e34-f09c27bed997` | NO | NO | Create both |
| 14 | Cert. aprobacion ONN | `2c918088948ec322019499d518660007` | NO | NO | Create both |
| 15 | INHEM | `2c91809094f110ae0195435c8fb209b6` | NO | NO | Create both |
| 16 | CENASA | `2c91809095d83aac0195de8f880f03cd` | NO | NO | Create both |
| 17 | Reg. Sustancias fisc. | `2ef97d8e-a5c7-47e8-81de-1856675139e5` | NO | NO | Create both |
| 18 | Seg. ambiental | `2c918083976cc50e01977dd5a5a90061` | NO | NO | Create both |

---

## Inventory: Expirado Badges (Bitacora service `ffe746aac09241078bad48c9b95cdfe0`)

All badges need grid+date determinant in the Bitacora service.

| # | Badge Key | EditGrid Key | Date Column Key | Status |
|---|-----------|-------------|-----------------|--------|
| 1 | `applicantExpirado` | `applicantEditGrid` | `applicantExpiracion` | CORRECT |
| 2 | `applicantExpiradoFito` | `applicantEditGridFito` | `applicantExpiracionFito` | Link behaviourId `f2394e29` |
| 3 | `applicantExpiradoZoo` | `applicantEditGridZoo` | `applicantExpiracionZoo` | Wrong det - recreate |
| 4 | `applicantExpirado2` | `applicantPermisoZoosanitario` | `applicantVigenteHasta2` | Wrong det - recreate |
| 5 | `applicantExpiradoSustancias` | `applicantEditGridSustancias` | `applicantExpiracionSustancias` | Wrong det - recreate |
| 6 | `applicantExpiradoSanitario` | `applicantEditGridSanitario` | `applicantFechaSanitario` | Wrong det - recreate |
| 7 | `applicantExpiradoCertAprobacion` | `applicantEditGridCertAprobacion` | `applicantFechaCertAprobacion` | CORRECT |
| 8 | `applicantExpiradoOnn` | `applicantEditGridOnn` | `applicantFechaOnn` | MISSING + needs CSS |
| 9 | `applicantExpiradoDonativos` | `applicantEditGridDonativos` | `applicantFechaDonativos` | MISSING |
| 10 | `applicantExpiradoHomologacion` | `applicantEditGridHomologacion` | `applicantFechaHomologacion` | MISSING |
| 11 | `applicantExpiradoCyp` | `applicantEditGridCyp` | `applicantFechaCyp` | MISSING |
| 12 | `applicantExpiradoCecmed` | `applicantEditGridCecmed` | `applicantFechaCecmed` | MISSING |
| 13 | `applicantExpiradoSucursales` | `applicantEditGridSucursales` | `applicantHastaSucursales` | MISSING |
| 14 | `applicantExpiradoInhem` | `applicantEditGridInhem` | `applicantVigenciaInhem` | MISSING |
| 15 | `applicantExpiradoCenasa` | `applicantEditGridCenasa` | `applicantHastaCenasa` | MISSING |
| 16 | `applicantExpiradoRegSust` | `applicantEditGridRegSust` | `applicantHastaRegSust` | MISSING |
| 17 | `applicantExpiradoSegAmb` | `applicantEditGridSegAmb` | `applicantHastaSegAmb` | MISSING |

---

## Playwright Scripts

| Script | Purpose |
|--------|---------|
| `fix-statusbitacora-all.spec.js` | Create radio dets + behaviours for all 17 services |
| `fix-expirado-all.spec.js` | Create grid dets + behaviours for all 14 Expirado badges |

Run with: `cd playwright-bpa && npx playwright test {script} --headed`

## Post-Playwright MCP Updates

After each Playwright run, use MCP `form_component_update` to link behaviourId + effectsIds on each component. The Playwright scripts output the exact MCP commands needed.

## Special Cases

- **PE**: Already has determinant `7383e917`. Skip determinant creation, only create behaviour.
- **Sustancias**: Has wrong behaviour. Delete via `effect_delete` first, then create correct one.
- **Fito Expirado**: Only needs `form_component_update` to link existing `behaviourId: f2394e29`.
- **Zoo/ONURE/Sustancias/Sanitario Expirado**: Have wrong dets pointing to PE's grid. Delete old behaviours, create new grid dets + behaviours.
- **ONN**: Missing `deactivated` CSS class on badge. Add via `form_component_update`.
- **Cert. Origen**: No EditGrid exists. Skip or create EditGrid first.
