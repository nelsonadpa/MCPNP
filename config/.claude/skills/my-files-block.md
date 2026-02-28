# Skill: My Files Block — Query, View & Delegate User Files

## Overview

This skill configures a complete "My Files" block on any eRegistrations BPA service. It adds a panel to the applicant form that lets users:

1. **Query** all their files (dossiers/solicitudes) from the Document Service API
2. **View** any file by clicking a direct link that opens the file in a new tab
3. **Delegate** (share) a file with another user by entering their email

The block renders as a DataGrid table showing one row per file with columns for Service Name, Business Entity, Created Date, State, a View link, a Delegate button, and a Recipient Email field.

### How it works

- The **Query bot** (`DS.DS - Query user files`) forwards the logged-in user's JWT to the Document Service API and returns all their files — same data as "Mis solicitudes" / "My Applications" in the frontend.
- The **Delegate bot** (`DS.Share access to file`) takes a file_id from the selected row and an email address, then shares/delegates that file to the target user.
- The **View link** constructs a URL from the row's Service ID and File ID to open the file directly in the frontend.

### What the user sees

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ My Files                                                    [Get My Files] │
│                                                                             │
│ Service Name │ Business Entity │ Created At │ State │ View │ Delegate │ Email│
│──────────────┼─────────────────┼────────────┼───────┼──────┼──────────┼──────│
│ Permisos     │ EMPRESA INC     │ 2026-02-28 │ NEW   │ [🔗] │ [Delegate]│     │
│ RD catalogs  │ TEST CORP       │ 2026-02-27 │ SUBM  │ [🔗] │ [Delegate]│     │
│ ...          │ ...             │ ...        │ ...   │ ...  │ ...      │ ...  │
│                                                                             │
│ Total Files: 388                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Trigger

User says: "add my files block", "configure query user files", "set up my account file query", "add delegation", or references TOBE-17236.

## Inputs Required

- `SERVICE_ID`: Target BPA service UUID
- `INSTANCE`: BPA instance profile name (e.g., `elsalvador-dev`, `cuba`, `jamaica`)
- `FRONTEND_URL`: The frontend base URL for View links (e.g., `https://dev.els.eregistrations.org`)

---

## Prerequisites

### 1. Verify Mule services exist

```
muleservice_list(name_filter="Query user files", instance=INSTANCE)
muleservice_list(name_filter="Share access to file", instance=INSTANCE)
```

Required Mule services:
- `DS.DS - Query user files` — GET, returns paginated file list
- `DS.Share access to file` — POST, shares a file with another user

If either is missing → **STOP**. Tell the user to ask the infra team to deploy the missing Mule service(s) to the instance.

### 2. Verify Mule service structure

```
muleservice_get(service_id="DS.DS - Query user files", instance=INSTANCE)
```
Confirm inputs: `business_entity`, `company`, `ordering`, `page`, `page_size`, `service`, `state`
Confirm outputs: `count`, `next`, `previous`, `results_collection_*` fields, `status`, `message`, `error`

```
muleservice_get(service_id="DS.Share access to file", instance=INSTANCE)
```
Confirm inputs: `file_id` (required), `allowed_users_collection_item` (required)
Confirm outputs: `status`, `message`, `error`

---

## Part 1: Query Bot & DataGrid

### Step 1: Create the Query Bot

```
bot_create(
  service_id=SERVICE_ID,
  bot_type="data",
  name="Get my files",
  category="other",
  short_name="Get my files",
  instance=INSTANCE
)
```

Save the returned `QUERY_BOT_ID`.

### Step 2: Add the Panel Container

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantMyFilesBlock", "type": "panel", "label": "My Files", "title": "My Files"},
  position=0,
  instance=INSTANCE
)
```

### Step 3: Add the "Get My Files" Button

Wire this to the panel (it triggers the query bot):

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantGetMyFiles", "type": "button", "label": "Get My Files", "action": "custom"},
  parent_key="applicantMyFilesBlock",
  position=0,
  instance=INSTANCE
)
```

### Step 4: Add the DataGrid

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantFileResults", "type": "datagrid", "label": "File Results", "hideLabel": true},
  parent_key="applicantMyFilesBlock",
  position=1,
  instance=INSTANCE
)
```

### Step 5: Add DataGrid Columns

All columns use `parent_key="applicantFileResults"`. Add them in order.

**Data columns** (all `type: "textfield"`, `disabled: true` for read-only display):

| Position | Key | Label | Hidden | Disabled | Notes |
|----------|-----|-------|--------|----------|-------|
| 0 | `applicantFileId` | File ID | `true` | - | Hidden, used by View link and Delegate bot |
| 1 | `applicantServiceName` | Service Name | - | `true` | |
| 2 | `applicantBusinessEntity` | Business Entity | - | `true` | |
| 3 | `applicantCreatedAt` | Created At | - | `true` | type: `datetime`, format: `yyyy-MM-dd`, enableTime: false |
| 4 | `applicantSubmittedAt` | Submitted At | `true` | - | Hidden by default |
| 5 | `applicantFileState` | State | - | `true` | |
| 6 | `applicantFileUsername` | Username | `true` | - | Hidden by default |
| 7 | `applicantMetadata` | Metadata | `true` | - | Hidden by default |
| 8 | `applicantFileServiceId` | Service ID | `true` | - | Hidden, used by View link |
| 9 | `applicantProcessInstanceId` | Process Instance ID | `true` | - | Hidden by default |

Example for a visible column:
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantServiceName", "type": "textfield", "label": "Service Name", "disabled": true},
  parent_key="applicantFileResults",
  position=1,
  instance=INSTANCE
)
```

Example for the Created At datetime column:
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantCreatedAt", "type": "datetime", "label": "Created At", "disabled": true, "format": "yyyy-MM-dd", "enableTime": false, "enableDate": true},
  parent_key="applicantFileResults",
  position=3,
  instance=INSTANCE
)
```

Example for a hidden column:
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantFileId", "type": "textfield", "label": "File ID", "hidden": true},
  parent_key="applicantFileResults",
  position=0,
  instance=INSTANCE
)
```

### Step 6: Add the "View" Link

This is a `content` component that uses Form.io template syntax to build a dynamic URL per row:

```
form_component_add(
  service_id=SERVICE_ID,
  component={
    "key": "applicantOpenFile",
    "type": "content",
    "label": "View",
    "html": "<a href=\"FRONTEND_URL/services/{{ row.applicantFileServiceId }}?file_id={{ row.applicantFileId }}\" target=\"_blank\" class=\"btn btn-sm btn-primary\"><i class=\"fa fa-external-link\"></i> View</a>"
  },
  parent_key="applicantFileResults",
  position=10,
  instance=INSTANCE
)
```

**IMPORTANT**: Replace `FRONTEND_URL` with the actual frontend URL (e.g., `https://dev.els.eregistrations.org`). The template variables `{{ row.applicantFileServiceId }}` and `{{ row.applicantFileId }}` are resolved at runtime by Form.io from each DataGrid row.

### Step 7: Add the "Total Files" Field

Add a columns layout below the DataGrid with a Total Files field:

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantFileCount", "type": "textfield", "label": "Total Files"},
  parent_key="applicantMyFilesBlock",
  position=2,
  instance=INSTANCE
)
```

### Step 8: Wire Button to Query Bot

```
componentaction_save(
  service_id=SERVICE_ID,
  component_key="applicantGetMyFiles",
  actions=[{"bot_id": QUERY_BOT_ID, "sort_order": 1, "parallel": false, "mandatory": false}],
  instance=INSTANCE
)
```

### Step 9: Query Bot Input Mappings

BPA requires at least 1 input mapping to publish. Map pagination constants:

```
bot_input_mapping_create(
  bot_id=QUERY_BOT_ID,
  source_field="constant_1",
  source_type="string",
  target_field="page",
  instance=INSTANCE
)

bot_input_mapping_create(
  bot_id=QUERY_BOT_ID,
  source_field="constant_100",
  source_type="string",
  target_field="page_size",
  instance=INSTANCE
)
```

**WARNING**: Do NOT pass `input_param_type` or `service_id` parameters — they cause 400 errors.

If `constant_1` or `constant_100` don't exist in the service, find alternatives:
```
field_list(service_id=SERVICE_ID, type_filter="textfield", instance=INSTANCE)
```

### Step 10: Query Bot Output Mappings

**CRITICAL**: Use `bot_output_mapping_save_all` — individual `create` rejects compound DataGrid keys.

In BPA output mappings, `source_field` = form field (compound key), `target_field` = Mule service output field.

```
bot_output_mapping_save_all(
  bot_id=QUERY_BOT_ID,
  mappings=[
    {"source_field": "applicantFileResults_collection_applicantFileId",             "source_type": "textfield", "target_field": "results_collection_file_id",                  "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantServiceName",        "source_type": "textfield", "target_field": "results_collection_service_name",              "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantFileServiceId",      "source_type": "textfield", "target_field": "results_collection_service_id",                "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantFileState",          "source_type": "textfield", "target_field": "results_collection_state",                     "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantBusinessEntity",     "source_type": "textfield", "target_field": "results_collection_business_entity_name",      "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantCreatedAt",          "source_type": "textfield", "target_field": "results_collection_created_at",                "target_type": "date-time"},
    {"source_field": "applicantFileResults_collection_applicantSubmittedAt",        "source_type": "textfield", "target_field": "results_collection_submitted_at",              "target_type": "date-time"},
    {"source_field": "applicantFileResults_collection_applicantFileUsername",       "source_type": "textfield", "target_field": "results_collection_user_child_username",        "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantMetadata",           "source_type": "textfield", "target_field": "results_collection_metadata",                  "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantProcessInstanceId",  "source_type": "textfield", "target_field": "results_collection_process_instance_id",       "target_type": "string"},
    {"source_field": "applicantFileCount",                                          "source_type": "textfield", "target_field": "count",                                        "target_type": "integer"}
  ],
  instance=INSTANCE
)
```

---

## Part 2: Delegate Bot (Inside the DataGrid)

The delegation controls are added as columns inside the same DataGrid, so each row has its own Delegate button and Recipient Email field. The file_id is taken automatically from the row — no manual copy needed.

### Step 11: Create the Delegate Bot

```
bot_create(
  service_id=SERVICE_ID,
  bot_type="data",
  name="Delegar file",
  category="other",
  short_name="Delegar file",
  instance=INSTANCE
)
```

Save the returned `DELEGATE_BOT_ID`.

### Step 12: Add Delegation Columns to the DataGrid

All use `parent_key="applicantFileResults"`.

**12a. Delegate button** (after the View link):
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantTransferir", "type": "button", "label": "Delegate", "action": "custom"},
  parent_key="applicantFileResults",
  position=11,
  instance=INSTANCE
)
```

**12b. Recipient Email field**:
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantDelegateEmail", "type": "textfield", "label": "Recipient Email"},
  parent_key="applicantFileResults",
  position=12,
  instance=INSTANCE
)
```

**12c. Status field** (hidden, holds the API response for determinant evaluation):
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantDelegateStatus", "type": "textfield", "label": "Status", "hidden": true, "disabled": true},
  parent_key="applicantFileResults",
  position=13,
  instance=INSTANCE
)
```

**12d. Hidden panel** for Message and Error (hidden, for debugging):
```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantDelegateBlock", "type": "panel", "label": "Delegate File", "title": "Delegate File", "hidden": true},
  parent_key="applicantFileResults",
  position=14,
  instance=INSTANCE
)

form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantDelegateMessage", "type": "textfield", "label": "Message"},
  parent_key="applicantDelegateBlock",
  position=0,
  instance=INSTANCE
)

form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantDelegateError", "type": "textfield", "label": "Error"},
  parent_key="applicantDelegateBlock",
  position=1,
  instance=INSTANCE
)
```

### Step 13: Wire Delegate Button to Bot

```
componentaction_save(
  service_id=SERVICE_ID,
  component_key="applicantTransferir",
  actions=[{"bot_id": DELEGATE_BOT_ID, "sort_order": 1, "parallel": false, "mandatory": false}],
  instance=INSTANCE
)
```

### Step 14: Delegate Bot Input Mappings

The file_id comes from `applicantFileId` in the same row. Use compound keys and `bot_input_mapping_save_all` to bypass field validation:

```
bot_input_mapping_save_all(
  bot_id=DELEGATE_BOT_ID,
  mappings=[
    {"source_field": "applicantFileResults_collection_applicantFileId",            "source_type": "textfield", "target_field": "file_id",                        "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantDelegateEmail",     "source_type": "textfield", "target_field": "allowed_users_collection_item",   "target_type": "string"}
  ],
  instance=INSTANCE
)
```

**KEY INSIGHT**: The `applicantFileId` is populated by the Query bot. When the user clicks Delegate on a row, the bot automatically reads the file_id from that row — no manual input needed.

### Step 15: Delegate Bot Output Mappings

```
bot_output_mapping_save_all(
  bot_id=DELEGATE_BOT_ID,
  mappings=[
    {"source_field": "applicantFileResults_collection_applicantDelegateStatus",  "source_type": "textfield", "target_field": "status",  "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantDelegateMessage", "source_type": "textfield", "target_field": "message", "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantDelegateError",   "source_type": "textfield", "target_field": "error",   "target_type": "string"}
  ],
  instance=INSTANCE
)
```

---

## Part 3: Optional — "Delegated" Status Badge

Add a visual indicator (green badge with checkmark) that appears after successful delegation.

### Step 16: Add a Badge Button (hidden by default)

```
form_component_add(
  service_id=SERVICE_ID,
  component={
    "key": "applicantDelegatedIcon",
    "type": "button",
    "label": "Delegated",
    "action": "custom",
    "size": "xs",
    "hidden": true,
    "leftIcon": "fa-solid fa-circle-check",
    "customClass": "light-color hover-feedback-off button-status btn-green",
    "customClasses": ["light-color", "hover-feedback-off", "button-status", "btn-green"]
  },
  parent_key="applicantFileResults",
  position=14,
  instance=INSTANCE
)
```

### Step 17: Create a Text Determinant

Check if delegation status has a value (= delegation was performed):

```
textdeterminant_create(
  service_id=SERVICE_ID,
  name="Delegation completed",
  operator="NOT_EQUAL",
  target_form_field_key="applicantDelegateStatus",
  text_value="",
  instance=INSTANCE
)
```

Save the returned `DETERMINANT_ID`.

### Step 18: Create a Show Effect

Link the determinant to the badge so it appears when delegation succeeds:

```
effect_create(
  service_id=SERVICE_ID,
  component_key="applicantDelegatedIcon",
  determinant_ids=[DETERMINANT_ID],
  effect_type="show",
  effect_value=true,
  instance=INSTANCE
)
```

---

## Part 4: Debug, Publish & Test

### Step 19: Debug Scan

```
debug_scan(service_id=SERVICE_ID, instance=INSTANCE)
```

Common issues and fixes:
- **effects_determinant**: `effect_delete(behaviour_id=OBJECT_ID, service_id=SERVICE_ID)`
- **role_registration_missing**: `roleregistration_create(role_id=ROLE_ID, registration_id=REG_ID)` (get regId from `service_get`)
- **role_institution_missing**: `roleinstitution_create(role_id=ROLE_ID, institution_id=INST_ID)` (discover with `institution_discover`)
- **missing_component_in_mapping** for `constant_*`: Known false positive — constants are virtual fields, safe to ignore
- **missing_component_in_mapping** for `_collection_*`: Delete and recreate with `save_all`

Rescan until 0 blocking issues:
```
debug_scan(service_id=SERVICE_ID, instance=INSTANCE)
```

### Step 20: Publish

```
service_publish(service_id=SERVICE_ID, instance=INSTANCE)
```

If it fails with "Input data mappings are missing in bot" → input mappings didn't persist. Recreate them using `save_all`.

### Step 21: Test

1. Open the service in the frontend and create or open a file
2. Find the **"My Files"** panel with the **"Get My Files"** button
3. Click **"Get My Files"** → DataGrid fills with user's files
4. **Total Files** shows the count
5. Click **"View"** on any row → file opens in new tab
6. Enter an email in **"Recipient Email"** on any row and click **"Delegate"** → file is shared
7. The "Delegated" badge should appear on successful rows (if Part 3 was implemented)

---

## Complete Component Tree

```
applicantMyFilesBlock (panel, title="My Files")
├── applicantGetMyFiles (button, "Get My Files") → triggers Query Bot
├── applicantFileResults (datagrid, hideLabel=true)
│   ├── applicantFileId (textfield, hidden) ← file UUID
│   ├── applicantServiceName (textfield, disabled) ← visible
│   ├── applicantBusinessEntity (textfield, disabled) ← visible
│   ├── applicantCreatedAt (datetime, disabled, yyyy-MM-dd) ← visible
│   ├── applicantSubmittedAt (datetime, hidden)
│   ├── applicantFileState (textfield, disabled) ← visible
│   ├── applicantFileUsername (textfield, hidden)
│   ├── applicantMetadata (textfield, hidden)
│   ├── applicantFileServiceId (textfield, hidden) ← used by View link
│   ├── applicantProcessInstanceId (textfield, hidden)
│   ├── applicantOpenFile (content) ← "View" link, dynamic URL per row
│   ├── applicantTransferir (button, "Delegate") → triggers Delegate Bot
│   ├── applicantDelegateEmail (textfield, "Recipient Email")
│   ├── applicantDelegatedIcon (button, badge, hidden by default) ← shown by determinant
│   ├── applicantDelegateStatus (textfield, hidden, disabled) ← holds API response
│   └── applicantDelegateBlock (panel, hidden) ← Message + Error for debugging
│       ├── applicantDelegateMessage (textfield)
│       └── applicantDelegateError (textfield)
└── applicantFileCount (textfield, "Total Files")
```

## Complete Bot Architecture

```
┌─────────────────────────────────────────────┐
│ Query Bot: "Get my files"                   │
│ Mule: DS.DS - Query user files              │
│ Trigger: applicantGetMyFiles button         │
│                                             │
│ Inputs:                                     │
│   constant_1 → page                         │
│   constant_100 → page_size                  │
│                                             │
│ Outputs (compound keys):                    │
│   applicantFileResults_collection_* → results_collection_*  │
│   applicantFileCount → count                │
│                                             │
│ Auth: Auto-forwards user JWT                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Delegate Bot: "Delegar file"                │
│ Mule: DS.Share access to file               │
│ Trigger: applicantTransferir button (per row)│
│                                             │
│ Inputs (compound keys):                     │
│   ...collection_applicantFileId → file_id   │
│   ...collection_applicantDelegateEmail → allowed_users_collection_item │
│                                             │
│ Outputs (compound keys):                    │
│   ...collection_applicantDelegateStatus → status   │
│   ...collection_applicantDelegateMessage → message │
│   ...collection_applicantDelegateError → error     │
│                                             │
│ Auth: Auto-forwards user JWT                │
└─────────────────────────────────────────────┘
```

## Gotchas Learned the Hard Way

1. **`bot_output_mapping_create` rejects compound DataGrid keys** — always use `save_all` for `_collection_` mappings
2. **`bot_input_mapping_create` rejects compound keys too** — use `bot_input_mapping_save_all` when source fields are inside a DataGrid
3. **`bot_input_mapping_create` fails with `input_param_type` or `service_id`** — pass only bot_id, source_field, source_type, target_field
4. **Output mapping orientation is reversed**: `source_field` = form field, `target_field` = Mule output (opposite of what the MCP tool description says)
5. **Debug scan flags `_collection_` mappings** as "missing_component_in_mapping" — these are false positives when using `save_all`, safe to recreate
6. **Debug scan flags `constant_*` fields** — these are virtual fields, safe to ignore
7. **BPA requires >= 1 input mapping** to publish, even if all Mule inputs are optional
8. **The bot auto-forwards the user's JWT** — no auth mapping needed
9. **DataGrid `content` components support Form.io template syntax** — `{{ row.fieldKey }}` resolves to the row's value at runtime
10. **When changing EditGrid to DataGrid** (or vice versa), use `form_component_update` with `{"type": "datagrid"}` — children and mappings are preserved
11. **After fixing debug issues**, always rescan to confirm 0 issues before publishing
12. **Determinants inside DataGrids** work with simple field keys (not compound) for `target_form_field_key`

## View Link URL Pattern

The URL to open a file in the eRegistrations frontend follows this pattern:
```
{FRONTEND_URL}/services/{service_id}?file_id={file_id}
```

Each instance has its own frontend URL:
- El Salvador Dev: `https://dev.els.eregistrations.org`
- Cuba: `https://cuba.eregistrations.org`
- Jamaica: `https://jamaica.eregistrations.org`

Adjust the `html` in the `applicantOpenFile` content component accordingly.

## Reference Implementation

- **Instance**: elsalvador-dev
- **Service**: RD catalogs (`cd9c5078-8182-42fc-bb74-fc69a1312253`)
- **Query Bot**: Get my files (`849240d3-ed2c-4023-8708-e5ce302cb5c0`)
- **Delegate Bot**: Delegar file (`f4445f1d-b938-4311-bad9-d4d15fe27402`)
- **Query Mule service**: `DS.DS - Query user files`
- **Delegate Mule service**: `DS.Share access to file`
- **Determinant**: Delegation completed (`5b20d04e-06c8-4e2f-bee1-1850e6ae43f6`)
- **Jira**: TOBE-17236
- **Frontend**: https://dev.els.eregistrations.org/
