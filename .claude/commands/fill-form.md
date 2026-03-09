# /fill-form — eRegistrations Form Filler Generator

Generate intelligent form-fill presets for any eRegistrations service using BPA data via MCP.

## Usage

```
/fill-form                              # list services, pick one
/fill-form [serviceId]                  # generate for specific service
/fill-form [serviceId] --scenario=demo  # demo | test | edge
/fill-form [serviceId] --all-scenarios  # generate all 3
```

## Instructions for Claude

### Step 1 — Discover the service

If no serviceId given:
- Call `service_list` via MCP
- Display as numbered list with name + id
- Support fuzzy match (e.g. "jamaica" matches services in Jamaica instance)

If serviceId given directly, call `service_get` to confirm it exists.

### Step 2 — Read the form schema

Call these MCP tools (parallel where possible):
- `form_get` or `form_query` with the serviceId — get form structure
- `form_component_get` — get ALL components with their keys, types, validations
- `registration_list` with the serviceId — get registration UUIDs

For each `select` or `radio` component that references a catalog/classification:
- Call `classification_get` with the catalog UUID
- Store the valid option values

### Step 3 — Generate preset JSON

Based on --scenario (default: demo):

**demo** — realistic, complete, visually impressive:
- Real-sounding business names, addresses, people names
- Pick valid catalog values (from classification_get results)
- Fill optional fields too for a complete demo
- Match the country context (Jamaica=English, Cuba=Spanish, etc.)

**test** — minimum valid data to submit:
- Only required fields
- Shortest valid values
- Simplest path through the form

**edge** — stress test:
- Maximum length strings
- Boundary numeric values
- Multiple rows in every EditGrid (at least 3)

### Step 4 — Validate before saving

- All required fields have values
- Select/radio values exist in the actual catalog
- EditGrid fields are arrays of objects
- Boolean fields are actual booleans
- No invented classification values

### Step 5 — Save and output

Save to: `er-presets/[serviceId]/[scenario].json`

The JSON format:
```json
{
  "_meta": {
    "serviceId": "uuid",
    "serviceName": "...",
    "scenario": "demo",
    "generatedAt": "2026-...",
    "fieldCount": 42,
    "mcpServer": "BPA-jamaica"
  },
  "fieldKey1": "value1",
  "fieldKey2": "value2"
}
```

### Step 6 — Rebuild the bookmarklet

After saving the preset, ALWAYS run:
```bash
node bookmarklet/build-bookmarklet.js
```

This bakes the new preset into the bookmarklet. The user just needs to re-drag the bookmark (or if using the GitHub-hosted version, it auto-updates).

### Step 7 — Report

Print:
```
Preset ready: [serviceName] / [scenario]
Fields: [N]   Required filled: [N]/[N]

Bookmarklet rebuilt with [N] presets for [N] services.
Open bookmarklet/install.html to update your bookmark.
```

### Error handling

- MCP connection fails → explain setup requirements
- Service not found → show similar service names
- Classification fetch fails → use null, note it as warning
- Always save partial preset with warnings rather than failing completely
