# MCP Bot Input Mapping Bug Report



## Problem Summary

**Component:** `mcp-eregistrations-bpa` (tested on v0.17.3)

**Affected tools:** `bot_input_mapping_create`, `bot_input_mapping_save_all`

**Symptom:** Bot input mappings created via MCP look correct in the API (pass validation, show correct source/target fields) but fail silently at runtime. The bot executes returning `{"status": true}`, all source fields contain valid data in the request payload, but no mapped data arrives at the destination service form. In some cases, the server returns the error:

```
{
  "error": "Mapping failed! Details: Invalid input '}', expected ??? (line 8, column 1)",
  "status": false
}
```

**Root cause hypothesis:** The MCP tool creates mapping records with metadata that appears correct, but the BPA server-side compilation of these mappings into Freemarker templates produces malformed templates. The BPA UI uses a different code path to create mappings that generates correctly compiled templates.

**Fix:** Delete the MCP-created mappings and recreate them manually through the BPA UI. There is no MCP-side workaround.

---

## Full Conversation Transcript

### User (Nelson):

Look, in the service https://bpa.cuba.eregistrations.org/services/ffe746aac09241078bad48c9b95cdfe0/forms/applicant-form I implemented this bot https://bpa.cuba.eregistrations.org/services/ffe746aac09241078bad48c9b95cdfe0/bots/4b9c7521-79e0-4b6a-a764-03fd1fe54506 which points to this service https://bpa.cuba.eregistrations.org/services/2c91808893792e2b0193792f8e170001/forms/applicant-form?debug=true but I see there's a bug when sending the data -- the selected company data doesn't arrive:

```json
{
  "error": "Mapping failed! Details: Invalid input '}', expected ??? (line 8, column 1)",
  "status": false
}
```

It was only fixed by removing and re-adding the mappings manually.

### Claude:

Let me check the current mappings of that bot to understand what happened and verify if other bots have the same issue.

*(Re-registered BPA Cuba instance and authenticated as session had expired)*

Retrieved input mappings for bot `4b9c7521` (INTERNO certificado sanitario nuevo). Found **4 mappings** but according to records it should have **6**. Missing:
- `constant_true -> applicantStatusLlegaDeLaBitacora` (StatusBitacora flag)
- `constant_true -> certificadoMinsap` (service type checkbox)

Then proceeded to audit ALL INTERNO "nuevo" bots in the Bitacora service (`ffe746aac09241078bad48c9b95cdfe0`). Retrieved mappings for every bot.

#### Audit Results - Bots with missing mappings:

| Bot | Service | Actual | Expected | Missing |
|-----|---------|:------:|:--------:|---------|
| Sanitario nuevo (4b9c7521) | Cert. Sanitario | 4 | 6 | `constant_true->StatusBitacora`, `constant_true->certificadoMinsap` |
| Sustancias nuevo (5a162d6f) | Sustancias Permiso | 4 | 5 | `applicantRadio->applicantQueQuiereHacer*` |
| Sustancias modif (70a18f7d) | Sustancias Permiso | 5 | 6 | `applicantRadio2->applicantQueQuiereHacer*` (radio modif) |

#### Audit Results - Bots that looked complete:

| Bot | Service | Mappings | Status |
|-----|---------|:--------:|:------:|
| Fito nuevo (d98caa87) | Fitosanitario | 5 | OK |
| Zoo nuevo (c28bb4c1) | Zoosanitario | 5 | OK |
| INHEM nuevo (ebfdf3d2) | INHEM | 5 | OK |
| CENASA nuevo (e82f339e) | CENASA | 5 | OK |
| Reg Sustancias nuevo (deef4bf5) | Reg Sustancias | 5 | OK |
| Seg Ambiental nuevo (b870c684) | Seg Ambiental | 5 | OK |
| Homologacion nuevo (d078375c) | Homologacion | 5 | OK |
| CECMED nuevo (6b312042) | CECMED Licencia | 5 | OK |
| ONN nuevo (32390e16) | ONN Instrumentos | 5 | OK |
| ONURE nuevo (6c920ce1) | ONURE Equipos | 5 | OK |

### User:

Let's go one by one, fix this one please: https://bpa.cuba.eregistrations.org/services/ffe746aac09241078bad48c9b95cdfe0/bots/146e1b4f-0eae-4aa7-87d0-46d3d0df841e

### Claude:

Investigated bot `146e1b4f` (INTERNO autorizacion donaciones nuevo). This bot targets service `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa` ("Certificado de importacion para donativos medicos").

Retrieved the destination service field list to verify correct field keys. Found:

- `applicantStatusLlegaDeLaBitacora` - radio (exists)
- `applicantQueQuiereHacerRegistrarNuevo` - radio (exists)
- `applicantNit` - textfield (exists)
- `applicantNombreDeEmpre` - textfield (exists, NOT truncated -- this IS the actual key)
- `applicantContadorEnergia` - number (exists)
- `autorizacionDeImportacionParaDonacion11` - checkbox (exists)

Current bot had 4 mappings, missing Contador and checkbox tipo. Used `bot_input_mapping_save_all` to replace all 6 mappings with clean versions:

```json
[
  {"source_field": "constant_true", "source_type": "Boolean", "target_field": "applicantStatusLlegaDeLaBitacora", "target_type": "radio"},
  {"source_field": "applicantRadio", "source_type": "radio", "target_field": "applicantQueQuiereHacerRegistrarNuevo", "target_type": "radio"},
  {"source_field": "applicantNit5", "source_type": "textfield", "target_field": "applicantNit", "target_type": "textfield"},
  {"source_field": "applicantCompania7", "source_type": "textfield", "target_field": "applicantNombreDeEmpre", "target_type": "textfield"},
  {"source_field": "applicantContadorDonativos", "source_type": "number", "target_field": "applicantContadorEnergia", "target_type": "number"},
  {"source_field": "constant_true", "source_type": "Boolean", "target_field": "autorizacionDeImportacionParaDonacion11", "target_type": "checkbox"}
]
```

Verified: 6/6 mappings saved. `bot_validate` returned valid.

### User:

The data still isn't arriving. How do I search in Graylog or the console to understand what happened?

### Claude:

Suggested three debugging approaches:
1. **Browser DevTools Network tab** - Filter by XHR, look for the Mule API action call
2. **Graylog** - Search by bot ID or "Mapping failed"
3. **Browser Console** - Check for JavaScript errors

### User:

I see this (screenshot of Network tab showing 3 XHR requests, all 200 OK):
1. `adsAction...Mule3` - `/mule/api/action` - 200 OK
2. `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa/` - `/services-new/...` - 200 OK
3. `businessentity?ordering=...` - `/backend` - 200 OK

Which one do I open?

### Claude:

Open the first one (`adsAction...Mule3`) -- that's the bot execution call. Check the Response and Payload tabs.

### User:

Response:
```json
{
  "status": true
}
```

### Claude:

Bot executed successfully. Need to see the Payload to check if source fields had values. Asked user to search for `applicantNit5`, `applicantCompania7`, and `applicantContadorDonativos` in the payload.

### User:

Here is the complete payload:

```json
{
  "applicantCompania7": "EMPRESA IMPORTADORA-EXPORTADORA FARMACUBA",
  "applicantNit5": "01001846708",
  "applicantContadorDonativos": -1,
  "applicantRadio": "registrarNuevo",
  ...
}
```

*(Full payload included all source fields with valid data, plus the entire Bitacora form state)*

### Claude:

**Final diagnosis:** All source fields contain valid data. The bot returns `status: true`. But mapped data does not arrive at the destination service. This confirms the problem is identical to the Sanitario case: the MCP tool creates mapping records that appear correct in the API but have corrupted Freemarker templates on the server side.

The `bot_input_mapping_save_all` MCP tool is the source of the bug. Mappings created through it look correct when queried but fail silently at runtime. The only proven fix is to manually delete and recreate mappings through the BPA UI.

---

## Affected Bot for Manual Fix

**Bot:** INTERNO autorizacion donaciones nuevo (`146e1b4f-0eae-4aa7-87d0-46d3d0df841e`)
**In service:** Bitacora Hub (`ffe746aac09241078bad48c9b95cdfe0`)
**Targets:** Certificado de importacion para donativos medicos (`a5f936ea-96ae-4ed6-9ef4-84a02b4733aa`)

### Mappings to recreate manually in BPA UI:

| # | Source (Bitacora) | Target (Donativos) | Type |
|---|---|---|---|
| 1 | `constant_true` | `applicantStatusLlegaDeLaBitacora` | Boolean -> radio |
| 2 | `applicantRadio` | `applicantQueQuiereHacerRegistrarNuevo` | radio -> radio |
| 3 | `applicantNit5` | `applicantNit` | textfield -> textfield |
| 4 | `applicantCompania7` | `applicantNombreDeEmpre` | textfield -> textfield |
| 5 | `applicantContadorDonativos` | `applicantContadorEnergia` | number -> number |
| 6 | `constant_true` | `autorizacionDeImportacionParaDonacion11` | Boolean -> checkbox |

---

## Evidence: Source Data Present in Payload

Key fields from the bot execution payload confirming data was available:

```json
{
  "applicantCompania7": "EMPRESA IMPORTADORA-EXPORTADORA FARMACUBA",
  "applicantNit5": "01001846708",
  "applicantContadorDonativos": -1,
  "applicantRadio": "registrarNuevo",
  "applicantStatusEmpresaSeleccionada": true
}
```

Bot response: `{"status": true}` -- no error, but data did not arrive at destination form.

## Potentially Affected Bots

Any bot whose input mappings were created or modified via MCP tools (`bot_input_mapping_create`, `bot_input_mapping_save_all`) may have the same silent mapping failure. All mappings for these bots should be verified by testing the actual data flow, not just by checking the API metadata.
