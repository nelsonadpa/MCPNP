# Setup: My Files Block — Query, View & Delegate User Files

You are configuring a complete "My Files" block on an eRegistrations BPA service. This block lets users:
- **Query** all their files (dossiers) from the Document Service API
- **View** any file by clicking a direct link
- **Delegate** (share) a file with another user by email

## First: Ask the user

Ask the user for:
1. **The BPA service URL** where they want to add this block (e.g., `https://bpa.dev.els.eregistrations.org/services/XXXXX/forms/applicant-form`)
2. **Their BPA credentials** (username and password)
3. **The frontend URL** for their instance (e.g., `https://dev.els.eregistrations.org`)

Extract `SERVICE_ID` and `INSTANCE` from the URL they provide.

## Setup: Connect to BPA

Use the BPA MCP tools. If not installed, run:
```
/bpa-mcp:install
```

Then login:
```
auth_login(username=USER, password=PASS, instance=INSTANCE)
```

## Step 1: Verify Mule services exist

```
muleservice_list(name_filter="Query user files", instance=INSTANCE)
muleservice_list(name_filter="Share access to file", instance=INSTANCE)
```

You must find both:
- `DS.DS - Query user files` — if missing, STOP and tell the user
- `DS.Share access to file` — if missing, STOP and tell the user

Both need to be deployed by the infra team before this block can work.

## Step 2: Create the Query Bot

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

Save `QUERY_BOT_ID`.

## Step 3: Create the Delegate Bot

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

Save `DELEGATE_BOT_ID`.

## Step 4: Add the Panel

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantMyFilesBlock", "type": "panel", "label": "My Files", "title": "My Files"},
  position=0,
  instance=INSTANCE
)
```

## Step 5: Add the "Get My Files" button

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantGetMyFiles", "type": "button", "label": "Get My Files", "action": "custom"},
  parent_key="applicantMyFilesBlock",
  position=0,
  instance=INSTANCE
)
```

## Step 6: Add the DataGrid

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantFileResults", "type": "datagrid", "label": "File Results", "hideLabel": true},
  parent_key="applicantMyFilesBlock",
  position=1,
  instance=INSTANCE
)
```

## Step 7: Add all DataGrid columns

All use `parent_key="applicantFileResults"`, `instance=INSTANCE`. Execute in order.

**Hidden data columns** (position 0, 4, 6, 7, 8, 9):
```
component={"key": "applicantFileId",            "type": "textfield", "label": "File ID",             "hidden": true},  position=0
component={"key": "applicantSubmittedAt",        "type": "textfield", "label": "Submitted At",        "hidden": true},  position=4
component={"key": "applicantFileUsername",       "type": "textfield", "label": "Username",            "hidden": true},  position=6
component={"key": "applicantMetadata",           "type": "textfield", "label": "Metadata",            "hidden": true},  position=7
component={"key": "applicantFileServiceId",      "type": "textfield", "label": "Service ID",          "hidden": true},  position=8
component={"key": "applicantProcessInstanceId",  "type": "textfield", "label": "Process Instance ID", "hidden": true},  position=9
```

**Visible data columns** (position 1, 2, 3, 5):
```
component={"key": "applicantServiceName",    "type": "textfield", "label": "Service Name",    "disabled": true},  position=1
component={"key": "applicantBusinessEntity", "type": "textfield", "label": "Business Entity", "disabled": true},  position=2
component={"key": "applicantCreatedAt",      "type": "datetime",  "label": "Created At",      "disabled": true, "format": "yyyy-MM-dd", "enableTime": false, "enableDate": true},  position=3
component={"key": "applicantFileState",      "type": "textfield", "label": "State",            "disabled": true},  position=5
```

**View link** (position 10):
```
component={"key": "applicantOpenFile", "type": "content", "label": "View", "html": "<a href=\"FRONTEND_URL/services/{{ row.applicantFileServiceId }}?file_id={{ row.applicantFileId }}\" target=\"_blank\" class=\"btn btn-sm btn-primary\"><i class=\"fa fa-external-link\"></i> View</a>"},  position=10
```
**IMPORTANT**: Replace `FRONTEND_URL` with the actual frontend URL the user provided.

**Delegate button** (position 11):
```
component={"key": "applicantTransferir", "type": "button", "label": "Delegate", "action": "custom"},  position=11
```

**Recipient Email** (position 12):
```
component={"key": "applicantDelegateEmail", "type": "textfield", "label": "Recipient Email"},  position=12
```

**Status field** (hidden, position 13):
```
component={"key": "applicantDelegateStatus", "type": "textfield", "label": "Status", "hidden": true, "disabled": true},  position=13
```

**Hidden panel for Message/Error** (position 14):
```
component={"key": "applicantDelegateBlock", "type": "panel", "label": "Delegate File", "title": "Delegate File", "hidden": true},  position=14
```
Then inside the panel (`parent_key="applicantDelegateBlock"`):
```
component={"key": "applicantDelegateMessage", "type": "textfield", "label": "Message"},  position=0
component={"key": "applicantDelegateError",   "type": "textfield", "label": "Error"},    position=1
```

## Step 8: Add Total Files field

```
form_component_add(
  service_id=SERVICE_ID,
  component={"key": "applicantFileCount", "type": "textfield", "label": "Total Files"},
  parent_key="applicantMyFilesBlock",
  position=2,
  instance=INSTANCE
)
```

## Step 9: Wire buttons to bots

```
componentaction_save(
  service_id=SERVICE_ID,
  component_key="applicantGetMyFiles",
  actions=[{"bot_id": QUERY_BOT_ID, "sort_order": 1, "parallel": false, "mandatory": false}],
  instance=INSTANCE
)

componentaction_save(
  service_id=SERVICE_ID,
  component_key="applicantTransferir",
  actions=[{"bot_id": DELEGATE_BOT_ID, "sort_order": 1, "parallel": false, "mandatory": false}],
  instance=INSTANCE
)
```

## Step 10: Query Bot input mappings

```
bot_input_mapping_create(bot_id=QUERY_BOT_ID, source_field="constant_1",   source_type="string", target_field="page",      instance=INSTANCE)
bot_input_mapping_create(bot_id=QUERY_BOT_ID, source_field="constant_100", source_type="string", target_field="page_size", instance=INSTANCE)
```

**WARNING**: Do NOT pass `input_param_type` or `service_id` — they cause 400 errors.

If `constant_1` or `constant_100` don't exist, find alternatives:
```
field_list(service_id=SERVICE_ID, type_filter="textfield", instance=INSTANCE)
```

## Step 11: Query Bot output mappings

**CRITICAL**: Use `bot_output_mapping_save_all` — individual `create` rejects compound DataGrid keys.

Note: `source_field` = form field (compound key), `target_field` = Mule output.

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

## Step 12: Delegate Bot input mappings

Use `bot_input_mapping_save_all` — compound keys inside DataGrid need it.

```
bot_input_mapping_save_all(
  bot_id=DELEGATE_BOT_ID,
  mappings=[
    {"source_field": "applicantFileResults_collection_applicantFileId",        "source_type": "textfield", "target_field": "file_id",                      "target_type": "string"},
    {"source_field": "applicantFileResults_collection_applicantDelegateEmail", "source_type": "textfield", "target_field": "allowed_users_collection_item", "target_type": "string"}
  ],
  instance=INSTANCE
)
```

The file_id is taken automatically from the row — the user only needs to type the email.

## Step 13: Delegate Bot output mappings

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

## Step 14: Fix debug issues

```
debug_scan(service_id=SERVICE_ID, instance=INSTANCE)
```

Fix each issue type:
- **effects_determinant** → `effect_delete(behaviour_id=<objectId>, service_id=SERVICE_ID)`
- **role_registration_missing** → `roleregistration_create(role_id=<roleId>, registration_id=<regId>)` (get regId from `service_get`)
- **role_institution_missing** → `roleinstitution_create(role_id=<roleId>, institution_id=<instId>)` (discover with `institution_discover`)
- **missing_component_in_mapping** for `constant_*` → false positive, ignore
- **missing_component_in_mapping** for `_collection_*` → delete and recreate with `save_all`

Rescan until 0 blocking issues:
```
debug_scan(service_id=SERVICE_ID, instance=INSTANCE)
```

## Step 15: Publish

```
service_publish(service_id=SERVICE_ID, instance=INSTANCE)
```

If it fails with "Input data mappings are missing" → input mappings didn't persist. Recreate them using `save_all`.

## Step 16: Test

Tell the user to:
1. Open the service in the frontend
2. Create a new file or open an existing one
3. Find the **"My Files"** panel with the **"Get My Files"** button
4. Click **"Get My Files"** → DataGrid fills with all their files
5. **"Total Files"** shows the count
6. Click **"View"** on any row → file opens in a new browser tab
7. Enter an email in **"Recipient Email"** on any row and click **"Delegate"** → file is shared with that user

## What the block looks like

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ My Files                                                      [Get My Files]   │
│                                                                                 │
│ Service Name │ Business Entity │ Created At │ State │ View │ Delegate │ Email   │
│──────────────┼─────────────────┼────────────┼───────┼──────┼──────────┼─────────│
│ Permisos     │ EMPRESA INC     │ 2026-02-28 │ NEW   │ [🔗] │ [Delegate]│        │
│ RD catalogs  │ TEST CORP       │ 2026-02-27 │ SUBM  │ [🔗] │ [Delegate]│        │
│                                                                                 │
│ Total Files: 388                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Warnings

- Do NOT pass `input_param_type` or `service_id` to `bot_input_mapping_create` — causes 400 errors
- Always use `save_all` for DataGrid compound key mappings (`_collection_` keys) — individual `create` rejects them
- Output mapping field orientation is reversed: `source_field` = form field, `target_field` = Mule output
- BPA requires at least 1 input mapping per bot to publish
- The bots auto-forward the user's JWT — no auth mapping needed
- After fixing debug issues, always rescan before publishing
