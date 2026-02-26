# MCP Component Update Instructions

After running the Playwright scripts, use this guide to apply MCP updates.

## Workflow

1. Run `fix-statusbitacora-all.spec.js` → creates radio dets + behaviours
2. Run `fix-expirado-all.spec.js` → creates grid dets + behaviours
3. Read results from `api-responses/statusbitacora/results.json` and `api-responses/expirado/results.json`
4. Execute MCP commands below (substitute actual IDs from results)

## StatusBitacora: form_component_update on applicantBlock12

For each service in `statusbitacora/results.json`, run:
```
form_component_update(service_id="{serviceId}", component_key="applicantBlock12", updates={"behaviourId": "{behaviourId}", "effectsIds": ["{effectId}"]})
```

### Special: Sustancias - delete wrong behaviour first
```
effect_delete(service_id="8393ad98-a16d-4a2d-80d0-23fbbd69b9e7", behaviour_id="{oldBehaviourId}")
```
Then run the Sustancias section of the Playwright script again (or manually create det+behaviour).

## Expirado Badges: form_component_update in Bitacora

### Step 1: Delete wrong behaviours (Zoo, ONURE, Sustancias, Sanitario)
For each in `expirado/results.json` with `type: "effect_delete"`:
```
effect_delete(service_id="ffe746aac09241078bad48c9b95cdfe0", behaviour_id="{oldBehaviourId}")
```

### Step 2: Link new behaviours
For each in `expirado/results.json` with `type: "form_component_update"`:
```
form_component_update(service_id="ffe746aac09241078bad48c9b95cdfe0", component_key="{badgeKey}", updates={"behaviourId": "{behaviourId}", "effectsIds": ["{effectId}"]})
```

### Step 3: CSS fixes
For ONN badge (if missing deactivated class):
```
form_component_update(service_id="ffe746aac09241078bad48c9b95cdfe0", component_key="applicantExpiradoOnn", updates={"customClass": "datagrid-hide-column-label deactivated"})
```

## Verification

After all updates, verify each component:
```
componentbehaviour_get_by_component(service_id="{serviceId}", component_key="{componentKey}")
```
Should show `jsonDeterminants` with `determinantId` (not inline JSONLogic).
