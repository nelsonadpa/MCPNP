# eR Rosetta Stone - Designer↔AI Communication Guide

**Generated**: 2025-01-23 | **Updated**: 2025-01-23 | **Version**: 1.2

**Purpose**: Four-way mapping between Designer Language ↔ BPA UI ↔ JSON ↔ Java

---

## Related Documentation

This document is part of the eR AI Guide series. For detailed technical documentation, see:

| Guide | Purpose | Use When |
|-------|---------|----------|
| [ai-guide-index.md](ai-guide-index.md) | Master index, quick reference | Looking up any concept |
| [ai-guide-core-entities.md](ai-guide-core-entities.md) | Service, Registration, Role, Form | Understanding structure |
| [ai-guide-dynamic-logic.md](ai-guide-dynamic-logic.md) | Determinants, Effects, JsonLogic | Implementing conditions |
| [ai-guide-automation-integration.md](ai-guide-automation-integration.md) | BOTs, Classifications, Mule | Building integrations |
| [ai-guide-workflow-publishing.md](ai-guide-workflow-publishing.md) | Status, BPMN, Messages | Configuring workflows |
| [ai-guide-ui-form-builder.md](ai-guide-ui-form-builder.md) | BPA UI screenshots | Understanding UI elements |

**Dependency**: This Rosetta Stone should be updated when AI guides change. Last verified against AI guides: 2025-01-23.

---

## Quick Reference Card

> **Key Distinction**: A **Service** is the process to obtain one or more **Registrations**. Example: "Register a business" service produces Business Name Registration + Tax Registration.

| Designer Says | Technical Term | JSON | Java |
|---------------|---------------|------|------|
| block/section | Panel | `{type:"panel"}` | Form.io |
| dropdown | Select | `{type:"select"}` | Form.io |
| grid/table | EditGrid | `{type:"editgrid"}` | Form.io |
| show/hide rule | ComponentBehaviour | `determinantIds` | ComponentBehaviour.java |
| validation | Validation | `validate:{}` | ComponentValidation.java |
| bot/API call | Bot + ComponentAction | `bots[]` | Bot.java |
| catalog/lookup | Classification | `classificationType` | ClassificationType.java |

---

## Section A: Designer Vocabulary → Technical Mapping

### A.1 Form Structure Terms

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| block | section, panel, group | Gray collapsible header | `{type:"panel"}` | Form.io native |
| columns | two columns, side by side | Split layout | `{type:"columns"}` | Form.io native |
| grid | table, repeating rows | +/- row table | `{type:"editgrid"}` | Form.io native |
| tabs | wizard, steps | Step indicators | `{type:"tabs"}` | Form.io native |
| fieldset | field group | Bordered group | `{type:"fieldset"}` | Form.io native |

### A.2 Input Field Terms

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| text field | input, text box | Single line input | `{type:"textfield"}` | Form.io native |
| dropdown | select, picker, list | Arrow dropdown | `{type:"select"}` | Form.io native |
| radio | options, choice | Radio buttons | `{type:"radio"}` | Form.io native |
| checkbox | tick box, boolean | Square checkbox | `{type:"checkbox"}` | Form.io native |
| date field | date picker, calendar | Calendar icon | `{type:"datetime"}` | Form.io native |
| file upload | attachment, document | Drop zone | `{type:"file"}` | Form.io native |
| number field | numeric, amount | Number input | `{type:"number"}` | Form.io native |
| text area | long text, multiline | Multi-line box | `{type:"textarea"}` | Form.io native |

### A.3 Logic & Behaviour Terms

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| show/hide rule | condition, logic | Yellow dot ● | `determinantIds:[...]` | ComponentBehaviour.java |
| validation | required, check | Blue dot ● | `validate:{...}` | ComponentValidation.java |
| formula | calculation, computed | Formula icon | `formulaRowIds:[...]` | ComponentFormula.java |
| effect | action, result | Inside behaviour | `effects:[...]` | Effect.java |
| determinant | trigger, condition | Determinant editor | `determinant` | Determinant.java (abstract) |

#### Determinant Types (Complete List)

| Designer Says | Type in JSON | Java Class | Operator | Example |
|---------------|--------------|------------|----------|---------|
| radio condition | `type: "radio"` | RadioDeterminant | EQUAL | "Business is company" |
| checkbox condition | `type: "boolean"` | BooleanDeterminant | - | "Form is valid" |
| number condition | `type: "numeric"` | NumericDeterminant | GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, LESS_THAN_OR_EQUAL, GREATER_THAN_OR_EQUAL | "Annual turnover >5000000" |
| text condition | `type: "text"` | TextDeterminant | EQUAL, NOT_EQUAL | "Company name = empty" |
| catalog condition | `type: "classification"` | ClassificationDeterminant | EQUAL, IN | "Marital status =married" |
| dropdown condition | `type: "select"` | SelectDeterminant | EQUAL | "Selected option equals X" |
| multi-select condition | `type: "selectBoxes"` | SelectBoxesDeterminant | EQUAL | "Options A and B selected" |
| grid condition | `type: "grid"` | GridDeterminant | (JSONLogic) | "Individual shareholder" (most common!) |
| date condition | `type: "date"` | DateDeterminant | GREATER_THAN, LESS_THAN, EQUAL | "Date after 2020-01-01" |
| button condition | `type: "button"` | ButtonDeterminant | - | "Button was clicked" |
| file condition | `type: "file"` | FileDeterminant | - | "File is uploaded" |
| file upload condition | `type: "fileUpload"` | FileUploadDeterminant | - | "Document attached" |
| money condition | `type: "money"` | MoneyDeterminant | GREATER_THAN, LESS_THAN, EQUAL | "Amount > 1000" |

> **Note**: `SelectDeterminant` (type: "select") is for inline dropdown values. `ClassificationDeterminant` (type: "classification") is for catalog-backed dropdowns. Grid determinants are the most common type (used for conditional logic within EditGrids).
>
> **See also**: [ai-guide-dynamic-logic.md](ai-guide-dynamic-logic.md) Section 2 for detailed determinant documentation.

### A.4 Automation Terms

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| bot | API call, integration | Actions menu | `bots:[...]` | Bot.java |
| action | button action, trigger | Gear icon ⚙ | `componentActionId` | FormComponentActions.java, ActionRow.java |
| catalog | lookup table, list | Tables menu | `classificationType` | ClassificationType.java |
| mapping | field mapping, transform | Bot config | `inputMappings/outputMappings` | InputMapping.java |

#### Bot Types and Categories

**BotType** (what the bot does):

| Designer Says | `botType` | Java Enum | Example |
|---------------|-----------|-----------|---------|
| data bot | `"data"` | BotType.data | "Verify TIN", "NATURAL PERSONS update" |
| document bot | `"document"` | BotType.document | "Trade license upload", "BUSINESS ID display" |
| internal bot | `"internal"` | BotType.internal | "INTERNAL copy directors from shareholders" |
| message bot | `"message"` | BotType.message | "MESSAGE Annual reminder" |
| system bot | `"system"` | BotType.system | System-level operations |
| external bot | `"external"` | BotType.external | External redirect/link |
| link bot | `"link"` | BotType.link | Open external URL |

**BotCategoryType** (operation performed):

| Designer Says | `category` | Java Enum | Purpose |
|---------------|------------|-----------|---------|
| create record | `"create"` | BotCategoryType.create | Create new record in external system |
| read/fetch | `"read"` | BotCategoryType.read | Fetch data from external system |
| update record | `"update"` | BotCategoryType.update | Update existing record |
| check exists | `"exist"` | BotCategoryType.exist | Verify record exists (e.g., TIN lookup) |
| list records | `"list"` | BotCategoryType.list | Fetch list of records |
| generate doc | `"document_generate"` | BotCategoryType.document_generate | Generate PDF |
| upload doc | `"document_upload"` | BotCategoryType.document_upload | Upload document to storage |
| display doc | `"document_display"` | BotCategoryType.document_display | Show generated document |
| generate+display | `"document_generate_and_display"` | BotCategoryType.document_generate_and_display | Generate and show |
| generate+upload | `"document_generate_and_upload"` | BotCategoryType.document_generate_and_upload | Generate and save |
| full doc flow | `"document_generate_upload_display"` | BotCategoryType.document_generate_upload_display | Generate, save, show |
| listener | `"listener"` | BotCategoryType.listener | Wait for external callback |
| log/audit | `"log"` | BotCategoryType.log | Record workflow step |
| pull data | `"pull"` | BotCategoryType.pull | Pull data periodically |
| send message | `"message"` | BotCategoryType.message | Send notification |
| other | `"other"` | BotCategoryType.other | Custom operations |

> **Note**: A bot has BOTH a `botType` AND a `category`. Example: A TIN verification bot has `botType: "data"` and `category: "exist"`.
>
> **See also**: [ai-guide-automation-integration.md](ai-guide-automation-integration.md) for complete bot documentation.

### A.5 Workflow Terms (Part B)

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| role | reviewer, approver | Processing roles | `roles:[...]` | Role.java (abstract), UserRole.java, BotRole.java |
| status | decision, outcome | Role statuses | `statuses:[...]` | RoleStatusBase.java (abstract) |
| approve | validate, accept | Green button | `roleStatusType: 1` | FileValidatedStatus.java |
| reject | refuse, deny | Red button | `roleStatusType: 3` | FileRejectStatus.java |
| send back | return, request changes | Orange button | `roleStatusType: 2` | FileDeclineStatus.java |
| pending | waiting, in progress | Default state | `roleStatusType: 0` | FilePendingStatus.java |
| custom status | user-defined | Custom outcome | `roleStatusType: 4` | UserDefinedStatus.java |
| message | notification, email | Templates menu | `messages:[...]` | Message.java |
| certificate | document, output | Templates menu | `printDocuments:[...]` | PrintDocument.java |

### A.6 Core Entity Terms

| Designer Says | Also Called | BPA UI Location | JSON | Java Class |
|---------------|-------------|-----------------|------|------------|
| service | procedure, process | Service list | `service` | Service.java |
| registration | permit, license, output | Registrations tab | `registrations:[...]` | Registration.java |
| form | application, questionnaire | Form builder | `formSchema` | Form.java |
| applicant | user, citizen | - | `applicant` | - |
| institution | agency, ministry | Institutions | `institutions:[...]` | Institution.java |

---

## Section B: Visual Indicators Reference

### B.1 Component Status Indicators (verified from screenshots)

| Visual | Color | Screenshot | Meaning | JSON Property | How to Add |
|--------|-------|------------|---------|---------------|------------|
| ● | Yellow | [screen05.png](screenshots/screen05.png) (on "Proprietorship or Company" panel, shows "11") | Has show/hide logic | `determinantIds: [uuid,...]` | Add ComponentBehaviour with Effect |
| ● | Blue | [screen08.png](screenshots/screen08.png) (on First name, Surname, Date of birth, Nationality, National ID fields) | Has validation rule | `validationRowIds: [uuid,...]` | Add ComponentValidation |
| ⚙ | Gray | [screen05.png](screenshots/screen05.png) (right side icons) | Has action/bot attached | `componentActionId: uuid` | Add ComponentAction |
| 🔢 | - | (not visible in current screenshots) | Has formula | `formulaRowIds: [uuid,...]` | Add ComponentFormula |

> **Screenshots location**: `2 - eR/current/screenshots/` - All screenshots verified to exist (s1.png, screen01-22.png).

> **Note**: The number next to the yellow dot (e.g., "11") indicates how many determinants/effects are attached to that component.

### B.2 Panel/Section Indicators (verified from screenshots)

| Visual | Screenshot | Meaning | JSON Property |
|--------|------------|---------|---------------|
| Striped background | screen12.png ("Hidden - to be reviewed", "Check business/company names") | Hidden from applicant, visible only in BPA | `hidden: true` |
| Eye icon 👁 | screen05.png (left sidebar) | Registration-specific visibility | `registrations: {uuid: true/false}` |
| Collapse arrow ▼ | screen05.png ("Local representative", "Local address") | Collapsible panel | `collapsible: true` |
| Gray header bar | screen05.png, screen08.png ("Business Owner") | Panel title | `title: "..."` |
| Yellow info box | screen05.png ("Why is the local representative needed?") | Informational content | `type: "content"` with `customClasses` |

### B.3 Button Styles (verified from screenshots)

| Style | Color | Screenshot | Purpose | CSS Class |
|-------|-------|------------|---------|-----------|
| Primary | Dark blue filled | screen04.png ("Start application"), screen08.png ("Verify") | Main action (Next, Start, Verify) | - |
| Approve | Green outline | (Part B roles only) | Approval actions | `btn-green` |
| Warning | Orange outline | (Part B roles only) | Send back, request corrections | `btn-orange` |
| Secondary | Gray outline | screen04.png | Back, Cancel, Previous | `outline-button` |

> **Note**: In Part A (applicant forms), action buttons like "Verify" use the primary blue style. Green/orange styles are primarily used in Part B reviewer forms for approve/reject/send back actions.

### B.4 Component Action Icons (verified from screen05.png - right side of each field)

| Position | Icon | Action | Notes |
|----------|------|--------|-------|
| 1st | − (minus) | Remove/delete component | Red on hover |
| 2nd | ⧉ (copy) | Copy/duplicate component | - |
| 3rd | ⚙ (gear) | Settings/properties panel | Opens component config |
| 4th | ◉ (circle) | Add behaviour/determinant | Creates ComponentBehaviour |
| Drag handle | ⋮⋮ (dots) | Drag to reorder | Left side of component |

> **Note**: Icons appear on hover over any component in the form builder canvas.

### B.5 Missing Screenshots (for future capture)

- ~~Blue validation dot close-up~~ ✅ Found in [screen08.png](screenshots/screen08.png)
- Formula indicator (🔢)
- Determinant editor panel (click yellow dot)
- Component properties panel (click gear icon)
- Part B role form with approve/reject/send back buttons
- Eye icon for registration-specific visibility (close-up)

> **See also**: [ai-guide-ui-form-builder.md](ai-guide-ui-form-builder.md) Section 9-10 for full screenshot reference and pending capture list.

---

## Section C: Common Phrases Translation

### C.1 Visibility & Conditional Logic

> **Verified Effect Structure** (from Lesotho live data):
> Effects use `property_effects` array with `{name: "show", value: "true"}`, NOT `propertyKey:"hidden"`.
> Common effect properties: `show`, `activate`, `disabled`

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Show this only for companies" | 1. Create `RadioDeterminant` on `businessIs` field (`type: "radio"`, `operator: "EQUAL"`, `select_value: "company"`)<br>2. Create `Effect` via `effect_create` with `effect_type: "show"`<br>3. Effect produces `property_effects: [{name:"show", value:"true"}, {name:"activate", value:"true"}]` |
| "Hide this section for sole proprietors" | 1. Create `RadioDeterminant` checking `businessIs == "soleProprietor"`<br>2. Create Effect with `effect_type: "hide"` OR don't create effect (default hidden, effect shows for company) |
| "Only show spouse details if married" | 1. Create `ClassificationDeterminant` on `maritalStatus` (`type: "classification"`, `operator: "EQUAL"`)<br>2. Effect with `show:true` targets spouse panel<br>3. ✅ Live example: `applicantSpouseOrHusbandDetails` uses determinant "Marital status =married" |
| "Show local representative panel for foreigners" | 1. `BooleanDeterminant` on citizenship field (`type: "boolean"`)<br>2. When `false`, effect shows local representative panel |

### C.2 Validation

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Make this field required" | Add `validate: { required: true }` to component JSON |
| "This field is required only for companies" | 1. Add `validate: { required: false }` (base)<br>2. Create `ComponentValidation` with determinant checking `businessIs == "company"` |
| "Maximum 100 characters" | Add `validate: { maxLength: 100 }` |
| "Shares must total 100%" | `ComponentValidation` with custom formula checking sum |
| "Email format required" | Use `type: "email"` or add `validate: { pattern: "..." }` |

### C.3 Repeating Data

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Add a repeating section for shareholders" | 1. Create `EditGrid` component<br>2. Add nested `Panel` inside<br>3. Add fields inside panel |
| "Allow multiple branches" | `EditGrid` with columns: Name, Address, Phone |
| "User can add rows to the activity list" | `EditGrid` with `inlineEdit: true`, `modal: false` |

### C.4 Calculations & Formulas

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Calculate the total fee" | 1. Create `FormulaCost`<br>2. Add `FormulaCostItems` for each fee component<br>3. Link to payment form |
| "Auto-fill full name from first + last" | `ComponentFormula` with concatenation formula |
| "Count the number of shareholders" | `ComponentFormula` using grid length |

### C.5 API Integration

> **Verified from Lesotho**: `applicantVerify` button → ComponentAction → "Verify TIN sole" bot (`bot_type: "data"`)

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Call the tax API when user clicks verify" | 1. Create `Bot` with `bot_type: "data"`, API endpoint, mappings<br>2. Create `ComponentAction` on button component<br>3. Action links to bot with `InputMapping` (form→API) and `OutputMapping` (API→form)<br>4. ✅ Live: "Verify TIN sole" bot on `applicantVerify` button |
| "Populate dropdown from external system" | `Bot` with `bot_type: "data"`, trigger on form load, outputs to select component |
| "Validate TIN against government database" | Button → ComponentAction → Bot (data type) → OutputMapping to response field |
| "Generate a document when button clicked" | Button → ComponentAction → Bot with `bot_type: "document"` (e.g., "Trade license upload") |
| "Copy data between form sections" | Bot with `bot_type: "internal"` (e.g., "INTERNAL copy directors from shareholders to managers") |

### C.6 Workflow (Part B)

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "Reviewer can approve or reject" | 1. Create `Role` with type "reviewer"<br>2. Add `RoleStatus` for approve (→ next role)<br>3. Add `RoleStatus` for reject (→ end) |
| "Send back to applicant for corrections" | `RoleStatus` with `sendBack: true`, destination = applicant |
| "Notify applicant when approved" | `Message` linked to approve `RoleStatus` |
| "Generate certificate on final approval" | `PrintDocument` linked to final `RoleStatus` |
| "Require manager approval for high values" | Conditional role routing based on `NumericDeterminant` |

### C.7 Registration-Specific

| Designer Says | Implementation Steps |
|---------------|---------------------|
| "This panel only applies to tax registration" | Set `registrations: { "tax-reg-uuid": true, "other-uuid": false }` on panel |
| "Different forms for different registration types" | Use `registrations` property on panels/fields |

### C.8 Determinant Operators Quick Reference (verified from Lesotho 174 determinants)

| Condition Type | JSON `type` | Available Operators | Example |
|----------------|-------------|--------------------|---------|
| Radio equals value | `"radio"` | `EQUAL` | "Business is company" → `guideTypeOfBusiness2 == "company"` |
| Checkbox is checked | `"boolean"` | (none - just true/false) | "Form is valid" → `isFormValid == true` |
| Number comparison | `"numeric"` | `GREATER_THAN`, `LESS_THAN`, `LESS_THAN_OR_EQUAL`, `EQUAL`, `NOT_EQUAL` | "Annual turnover >5000000" |
| Text matches | `"text"` | `EQUAL`, `NOT_EQUAL` | "Company name = empty" → `applicantBusinessName == ""` |
| Catalog selection | `"classification"` | `EQUAL`, `IN` | "Marital status =married", "Nationality IN [list]" |
| Grid row condition | `"grid"` | (complex JSONLogic) | "Individual shareholder", "Activity is selected" |

> **Most Common**: Grid determinants (~80 of 174) are used for conditional logic within EditGrids.
> **Naming Convention**: Determinant names are human-readable descriptions, e.g., "Business is company", "Marital status =married"

### C.9 Live Examples from Lesotho (verified 2025-01-23)

#### Radio Determinant Examples
| Determinant Name | Field Key | Value | Used For |
|------------------|-----------|-------|----------|
| "Business is company" | `guideTypeOfBusiness2` | `"company"` | Show company-only panels |
| "Business is sole proprietor" | `guideTypeOfBusiness2` | `"soleProprietor"` | Show sole prop panels |
| "Application for myself SP" | `applicantWillYouBeTheOwner` | `"yesIWillBeTheOwner"` | Owner vs representative |
| "Residential address is in Lesotho" | `applicantIsTheResidentialAddressInLesotho` | `"yes"` | Show Lesotho address fields |
| "Electronic signature" | `applicantElectronicOrManualSignature` | `"electronically"` | Show e-signature flow |
| "Will pay at Cashier" | `paymentProviderSelected` | `"frontdesk"` | Show cashier payment |

#### Classification (Catalog) Determinant Examples
| Determinant Name | Field Key | Catalog | Used For |
|------------------|-----------|---------|----------|
| "Marital status =married" | `applicantMaritalStatus` | Marital status | Show spouse details |
| "Business owner gender = Female" | `applicantGender` | Gender | Statistics |
| "Sole proprietor is from Lesotho" | `applicantNationality` | Nationality | Local vs foreigner rules |
| "Private company" | `applicantTypeOfCompany` | Company types | Company-type specific fields |

#### Numeric Determinant Examples
| Determinant Name | Field Key | Operator | Value | Used For |
|------------------|-----------|----------|-------|----------|
| "Annual turnover >5000000" | `applicantTurnover` | GREATER_THAN | 5000000 | Large business rules |
| "Number of employees > 50" | `applicantNumberOfEmployees` | GREATER_THAN | 50 | Enterprise size |
| "Applying for at least 1 trade license" | `applicantNumberOfTradeLicense` | GREATER_THAN | 0 | Show trade license section |
| "Total shareholders>1" | `applicantShareholdersTot` | GREATER_THAN | 1 | Multiple shareholder rules |

#### Boolean Determinant Examples
| Determinant Name | Field Key | Value | Used For |
|------------------|-----------|-------|----------|
| "Form is valid" | `isFormValid` | `true` | Enable submit button |
| "Declaration filled" | `sendPageISolemnlyDeclare...` | `true` | Enable send |
| "Fees paid" | `cashierIDeclareThatTheFeesHaveBeenDulyPaid` | `true` | Cashier confirmation |
| "Owner applies for TIN" | `applicantIDontHaveTinNumberIWouldLikeToCreateIt` | `true` | Show TIN creation flow |

#### Grid Determinant Examples (most common type)
| Determinant Name | Grid Field | Checks | Used For |
|------------------|------------|--------|----------|
| "Individual shareholder" | `applicantListOfShareholders2` | Type = individual | Show individual fields |
| "Company shareholder" | `applicantListOfShareholders2` | Type = company | Show company fields |
| "Activity is selected" | `applicantListOfActivities2` | Row selected | Enable activity fields |
| "Needs a trading licence" | `applicantListOfActivities2` | Activity requires TL | Show TL fee |
| "Shareholder is director" | `applicantListOfShareholders2` | isDirector = true | Show director consent |

---

## Section D: Component Library

### D.1 Container Components

#### Panel (Block/Section)
**Designer names**: block, section, group, collapsible
**Screenshot**: screen05.png (gray header bars)

```json
{
  "type": "panel",
  "key": "businessOwner",
  "title": "Business Owner",
  "collapsible": true,
  "collapsed": false,
  "hidden": false,
  "components": [...]
}
```

**Common properties**: `title`, `collapsible`, `collapsed`, `hidden`, `customClass`

#### Columns (Side by Side)
**Designer names**: two columns, split, side by side
**Screenshot**: screen09.png (Village | Street layout)

```json
{
  "type": "columns",
  "columns": [
    { "width": 6, "components": [...] },
    { "width": 6, "components": [...] }
  ]
}
```

**Note**: Width uses Bootstrap grid (12 total). Common: 6+6, 4+8, 3+3+3+3

#### EditGrid (Repeating Table)
**Designer names**: grid, table, repeating rows, list
**Screenshot**: screen19.png (activities grid)

```json
{
  "type": "editgrid",
  "key": "applicantListOfShareholders2",
  "label": "List of shareholders and directors",
  "components": [...],
  "modal": false,
  "inlineEdit": false,
  "openWhenEmpty": true,
  "templates": { "header": "...", "row": "...", "footer": "..." }
}
```

**Key properties** (verified from Lesotho):
- `modal: false` - edit inline (not in popup)
- `inlineEdit: false` - standard row editing (not inline cell edit)
- `openWhenEmpty: true` - show add row when no data
- `templates` - custom HTML for header/row/footer rendering

#### Tabs (Wizard)
**Designer names**: tabs, wizard, steps
**Screenshot**: screen04.png (step indicators)

```json
{
  "type": "tabs",
  "key": "wizard",
  "components": [
    { "label": "Step 1", "key": "step1", "components": [...] },
    { "label": "Step 2", "key": "step2", "components": [...] }
  ]
}
```

### D.2 Input Components

#### TextField
**Designer names**: text field, input, text box
**Screenshot**: screen07.png (First name, Last name)

```json
{
  "type": "textfield",
  "key": "firstName",
  "label": "First name",
  "validate": { "required": true, "maxLength": 100 }
}
```

#### Select (Dropdown)
**Designer names**: dropdown, select, picker, list
**Screenshot**: screen09.png (District, Town)

```json
{
  "type": "select",
  "key": "applicantMaritalStatus",
  "label": "Marital Status",
  "dataSrc": "catalog",
  "catalog": "d4e1edeb-3348-44d7-ae0c-ca1de558e327",
  "dataSrcCatalog": "bpa",
  "widget": "choicesjs",
  "searchEnabled": true,
  "registrations": { "uuid1": true, "uuid2": true }
}
```

**Data sources** (verified):
- `dataSrc: "catalog"` + `catalog: "uuid"` - BPA classification table (most common)
- `dataSrc: "values"` + `data.values: [...]` - inline options
- `dataSrc: "resource"` - external API

#### Radio
**Designer names**: radio, options, choice
**Screenshot**: screen04.png (Business type), screen06.png (For myself/Someone else)

```json
{
  "type": "radio",
  "key": "businessIs",
  "label": "Business is",
  "values": [
    { "label": "Sole proprietorship", "value": "soleProprietorship" },
    { "label": "Company", "value": "company" }
  ],
  "inline": true
}
```

#### Checkbox
**Designer names**: checkbox, tick box, boolean
**Screenshot**: screen08.png (I don't have TIN...)

```json
{
  "type": "checkbox",
  "key": "noTin",
  "label": "I don't have a TIN number"
}
```

#### DateTime
**Designer names**: date, date picker, calendar
**Screenshot**: screen07.png (Date of birth)

```json
{
  "type": "datetime",
  "key": "dateOfBirth",
  "label": "Date of birth",
  "format": "dd-MM-yyyy",
  "enableTime": false
}
```

#### File
**Designer names**: file upload, attachment, document
**Screenshot**: screen14.png (ID Document upload)

```json
{
  "type": "file",
  "key": "idDocument",
  "label": "ID Document",
  "storage": "url",
  "multiple": false,
  "fileTypes": [
    { "label": "PDF", "value": "application/pdf" }
  ]
}
```

#### Number
**Designer names**: number, numeric, amount
**Screenshot**: screen14.png (Percentage of shares)

```json
{
  "type": "number",
  "key": "sharePercentage",
  "label": "Percentage of shares",
  "validate": { "min": 0, "max": 100 }
}
```

### D.3 Display Components

#### Button
**Designer names**: button, action button
**Screenshot**: screen04.png (Start), screen08.png (Verify)

```json
{
  "type": "button",
  "key": "applicantVerify",
  "label": "Verify",
  "action": "custom",
  "componentActionId": "8fcff9ec-8c09-40fb-92ee-976ee0670e49",
  "actionRowIds": ["50fb7cee-de51-4e47-bda7-b9dff0335cbc"]
}
```

**Key properties** (verified from Lesotho):
- `componentActionId` - links to ComponentAction (which links to Bot)
- `actionRowIds` - array of action row IDs for the bot chain
- `action: "custom"` - triggers custom action (bot call)

**Button styles**: Part A uses default blue; Part B uses `btn-green` (approve), `btn-orange` (warning)

#### Content (Static HTML)
**Designer names**: info box, text, instructions
**Screenshot**: screen06.png (info boxes)

```json
{
  "type": "content",
  "key": "applicantSpouseOrHusbandDetails",
  "label": "Spouse or husband details",
  "html": "<p>Spouse or husband details</p>",
  "behaviourId": "1888cf45-a1e8-4a74-9ac6-529ad5f132c1",
  "effectsIds": ["7563dc34-5983-4d07-8b99-e01103ae88f7"],
  "activate": false,
  "customClasses": ["deactivated"]
}
```

**Key properties** (verified from Lesotho):
- `behaviourId` - links to ComponentBehaviour for show/hide logic
- `effectsIds` - array of effect IDs applied to this component
- `activate: false` - default state (hidden until condition met)
- `customClasses: ["deactivated"]` - CSS class for hidden state

### D.4 Component Statistics

For detailed component statistics from example services, see [ai-guide-ui-form-builder.md](ai-guide-ui-form-builder.md) Section 7.2.

**Common component types by frequency**: columns > textfield > number > select > content > panel > radio > button > datetime > file > editgrid

### D.5 Component Linking Properties (verified from Lesotho)

Components link to behaviours, actions, and registrations via these properties:

| Property | Purpose | Found On | Example |
|----------|---------|----------|---------|
| `behaviourId` | Links to ComponentBehaviour (show/hide logic) | content, panel | `"1888cf45-a1e8-4a74-9ac6-529ad5f132c1"` |
| `effectsIds` | Array of Effect IDs applied to component | content, panel | `["7563dc34-5983-..."]` |
| `componentActionId` | Links to ComponentAction (bot trigger) | button | `"8fcff9ec-8c09-..."` |
| `actionRowIds` | Array of action row IDs in bot chain | button | `["50fb7cee-de51-..."]` |
| `registrations` | Which registrations show this component | all | `{"uuid1": true, "uuid2": true}` |
| `activate` | Default activation state | content, panel | `false` (hidden by default) |
| `customClasses` | CSS classes including state | all | `["deactivated"]` |
| `catalog` | Classification UUID for dropdowns | select | `"d4e1edeb-3348-..."` |
| `dataSrc` | Data source type | select | `"catalog"`, `"values"`, `"resource"` |

> **Pattern**: Components with conditional visibility have `behaviourId` + `effectsIds` + `activate: false` + `customClasses: ["deactivated"]`

---

## Section E: Reverse Lookup

### E.1: JSON → Designer Language

| JSON Property/Value | Designer Term | Context |
|---------------------|---------------|---------|
| `type: "panel"` | block, section | Container |
| `type: "editgrid"` | grid, table | Repeating rows |
| `type: "select"` | dropdown | Single selection |
| `type: "radio"` | radio buttons, options | Choice |
| `type: "textfield"` | text field, input | Single line |
| `type: "textarea"` | long text, multiline | Paragraph |
| `type: "datetime"` | date field, calendar | Date picker |
| `type: "file"` | file upload, attachment | Document |
| `type: "columns"` | columns, side by side | Layout |
| `type: "tabs"` | wizard, steps | Multi-step |
| `type: "button"` | button | Action |
| `type: "content"` | info box, instructions | Static text |
| `hidden: true` | hidden panel | Not shown to user |
| `collapsible: true` | collapsible section | Can expand/collapse |
| `validate.required: true` | required field | Must fill |
| `behaviourId` | has show/hide rule | Yellow dot (links to ComponentBehaviour) |
| `effectsIds: [...]` | effects applied | Part of behaviour system |
| `validationRowIds: [...]` | has validation | Blue dot |
| `componentActionId` | has action/bot | Gear icon (links to ComponentAction) |
| `actionRowIds: [...]` | bot action chain | Linked to componentActionId |
| `formulaRowIds: [...]` | has formula | Calculated |
| `registrations: {...}` | registration-specific | Eye icon, `{uuid: true/false}` |
| `activate: false` | default hidden | Shown when effect activates |
| `dataSrc: "catalog"` | catalog-backed dropdown | BPA classification |
| `catalog: "uuid"` | classification ID | Links to ClassificationType |
| `data.values` | dropdown options | Inline list (rare) |

### E.2: Java → Designer Language

| Java Class | Designer Term | Where Used |
|------------|---------------|------------|
| `Service.java` | service, procedure | Top-level process |
| `Registration.java` | registration, permit | Output document |
| `Role.java` | role, reviewer | Workflow step |
| `RoleStatus.java` | status, decision | Approve/reject/send back |
| `Form.java` | form, application | Data entry |
| `Bot.java` | bot, API integration | External call |
| `ComponentAction.java` | action, button action | Triggers bot |
| `ComponentBehaviour.java` | show/hide rule | Conditional display |
| `ComponentValidation.java` | validation rule | Field validation |
| `ComponentFormula.java` | formula, calculation | Computed value |
| `Effect.java` | effect, result | What happens when condition met |
| `Determinant.java` | determinant, condition | Trigger for effect |
| `RadioDeterminant.java` | radio condition | Based on radio selection (`type: "radio"`) |
| `ClassificationDeterminant.java` | catalog/dropdown condition | Based on catalog value (`type: "classification"`) |
| `BooleanDeterminant.java` | checkbox condition | Based on true/false (`type: "boolean"`) |
| `NumericDeterminant.java` | number condition | Based on numeric value (`type: "numeric"`) |
| `TextDeterminant.java` | text condition | Based on string value (`type: "text"`) |
| `GridDeterminant.java` | grid condition | Based on grid row data (`type: "grid"`) - **most common** |
| `ClassificationType.java` | catalog, lookup table | Reference data |
| `Message.java` | notification, email | User communication |
| `PrintDocument.java` | certificate, document | Output PDF |
| `Institution.java` | agency, ministry | Government body |
| `InputMapping.java` | input mapping | Bot request data |
| `OutputMapping.java` | output mapping | Bot response data |

### E.3: Quick Pattern Recognition (verified from Lesotho)

When you see this JSON pattern, it means:

| Pattern | Meaning |
|---------|---------|
| `"components": [...]` inside panel | Nested fields in section |
| `"columns": [{"width": 6, ...}]` | Two-column layout (Bootstrap 12-grid) |
| `"values": [{"label":..., "value":...}]` | Radio options (inline) |
| `"dataSrc": "catalog", "catalog": "uuid"` | Catalog-backed dropdown (most common for selects) |
| `"validate": {"required": true}` | Mandatory field |
| `"behaviourId": "uuid", "activate": false` | Component with show/hide rule (yellow dot) |
| `"componentActionId": "uuid"` | Button triggers bot action (gear icon) |
| `"customClasses": ["deactivated"]` | Hidden by default, shown by effect |
| `"registrations": {"uuid": true}` | Shows only for specific registration (eye icon) |
| `"modal": false, "openWhenEmpty": true` | Inline editable grid |
| `"templates": {"header":..., "row":...}` | Custom grid rendering |

### E.4: Bot Type Recognition

| `bot_type` Value | Designer Term | Purpose |
|------------------|---------------|---------|
| `"data"` | data bot, API bot | Call external API, read/write data (~50 in Lesotho) |
| `"document"` | document bot | Generate PDF documents (~12 in Lesotho) |
| `"internal"` | internal bot, copy bot | Copy/transform data within form (~10 in Lesotho) |
| `"message"` | message bot, notification | Send email/SMS notifications (2 in Lesotho) |
| `null` | unconfigured | Bot type not set yet |

### E.5: Determinant Type Recognition

See **Section A.3 Determinant Types** for the complete list of all 13 determinant types.

For detailed determinant documentation including operators and JSONLogic structure, see [ai-guide-dynamic-logic.md](ai-guide-dynamic-logic.md).

---

## Section F: Worked Examples

### F.1 Example Request: Shareholders Section with Conditional Visibility

**Designer request**:
> "Create a shareholders section with a grid. Each row should have: person type (individual/company), full name, percentage of shares, and ID document upload. Only show this section when business type is Company, not Sole Proprietorship."

**Step-by-step trace**:

| Designer Term | → | Technical Implementation |
|---------------|---|--------------------------|
| "shareholders section" | → | `Panel` with `title: "Shareholders"` |
| "with a grid" | → | `EditGrid` inside panel |
| "person type (individual/company)" | → | `Radio` with values `individual`, `company` |
| "full name" | → | `TextField` with `key: "fullName"` |
| "percentage of shares" | → | `Number` with `validate: {min:0, max:100}` |
| "ID document upload" | → | `File` component |
| "only show when Company" | → | `RadioDeterminant` + `ComponentBehaviour` + `Effect` |

**JSON structure**:

```json
{
  "type": "panel",
  "key": "shareholdersPanel",
  "title": "Shareholders",
  "hidden": true,
  "components": [{
    "type": "editgrid",
    "key": "shareholders",
    "components": [
      {"type": "radio", "key": "personType", "values": [
        {"label": "Individual", "value": "individual"},
        {"label": "Company", "value": "company"}
      ]},
      {"type": "textfield", "key": "fullName", "label": "Full name"},
      {"type": "number", "key": "sharePercentage", "label": "% of shares"},
      {"type": "file", "key": "idDocument", "label": "ID Document"}
    ]
  }]
}
```

**Visibility logic** (verified structure from Lesotho):

1. **RadioDeterminant**: `{type: "radio", operator: "EQUAL", target_form_field_key: "guideTypeOfBusiness2", select_value: "company"}`
2. **Effect** via `effect_create`: `{effect_type: "show", determinant_ids: ["det-uuid"]}`
3. **Result on component**: `behaviourId: "uuid"`, `effectsIds: ["effect-uuid"]`, `activate: false`, `customClasses: ["deactivated"]`
4. **When condition met**: `property_effects: [{name: "show", value: "true"}, {name: "activate", value: "true"}]`

> ✅ **Live example**: Lesotho `applicantListOfShareholders2` uses determinant "Business is company" (`773d1a8a-ac7f-b0a6-47fd-8f184e681f15`)

---

### F.2 Example Request: TIN Verification with API Call

**Designer request**:
> "Add a TIN field with a Verify button. When clicked, call the tax API to validate. Show success/error message."

**Trace** (verified from Lesotho `applicantVerify` button):

| Step | Component/Entity | Actual Values from Lesotho |
|------|------------------|---------------------------|
| 1 | `TextField` | `key: "applicantTinNumber"`, `label: "TIN"` |
| 2 | `Button` | `key: "applicantVerify"`, `label: "Verify"`, `action: "custom"` |
| 3 | `TextField` | Response field for verification result |
| 4 | `Bot` | `name: "Verify TIN sole"`, `bot_type: "data"`, `id: "5ed8c4ef-6448-428c-b93e-2665f84d91b4"` |
| 5 | `ComponentAction` | `id: "8fcff9ec-8c09-40fb-92ee-976ee0670e49"` |
| 6 | Button linking | `componentActionId: "8fcff9ec-..."`, `actionRowIds: ["50fb7cee-..."]` |

**Button JSON** (actual from Lesotho):
```json
{
  "type": "button",
  "key": "applicantVerify",
  "label": "Verify",
  "action": "custom",
  "componentActionId": "8fcff9ec-8c09-40fb-92ee-976ee0670e49",
  "actionRowIds": ["50fb7cee-de51-4e47-bda7-b9dff0335cbc"]
}
```

---

### F.3 Example Request: Conditional Required Field

**Designer request**:
> "Make spouse details required only if marital status is Married."

**Trace** (verified pattern from Lesotho):

| Step | What | Actual Lesotho Implementation |
|------|------|------------------------------|
| 1 | Determinant | `"Marital status =married"` (id: `792ec2ba-3ad9-4408-8ae7-90b2b1684650`), `type: "classification"`, `operator: "EQUAL"`, `target_form_field_key: "applicantMaritalStatus"` |
| 2 | Target component | `applicantSpouseOrHusbandDetails` |
| 3 | ComponentBehaviour | `id: "1888cf45-a1e8-4a74-9ac6-529ad5f132c1"` |
| 4 | Effect | `property_effects: [{name: "show", value: "true"}, {name: "activate", value: "true"}, {name: "disabled", value: "false"}]` |

> ✅ **Live example**: This exact pattern exists in Lesotho - spouse details panel shows only when marital status = married

---

### F.4 Example Request: Reviewer Workflow

**Designer request**:
> "After applicant submits, a tax officer reviews. They can approve, reject, or send back for corrections. Send email notification on each decision."

**Trace**:

| Entity | Configuration |
|--------|---------------|
| `Role` | `name: "Tax Officer"`, `type: "reviewer"` |
| `RoleStatus` (approve) | `name: "Approve"`, `destination: nextRole or end` |
| `RoleStatus` (reject) | `name: "Reject"`, `destination: end`, `isRejection: true` |
| `RoleStatus` (send back) | `name: "Request Corrections"`, `sendBack: true` |
| `Message` (approve) | Linked to approve status, template: "Your application approved..." |
| `Message` (reject) | Linked to reject status, template: "Your application rejected..." |
| `Message` (send back) | Linked to send back status, template: "Please correct..." |

---

### F.5 Example Request: Document Generation (verified from Lesotho)

**Designer request**:
> "Generate a trade license document when the license is approved."

**Trace** (actual bots from Lesotho):

| Bot Name | `bot_type` | Purpose |
|----------|-----------|---------|
| "Trade license upload" | `"document"` | Generate trade license PDF |
| "Industrial license upload" | `"document"` | Generate industrial license PDF |
| "Business permit upload" | `"document"` | Generate business permit PDF |
| "Trade license display" | `"document"` | Display generated license |
| "BUSINESS ID display" | `"document"` | Display business ID document |

**Pattern**: Document bots are triggered by:
1. Button click (via ComponentAction)
2. Role status change (linked to RoleStatus)
3. Workflow completion

---

### F.6 Example Request: Internal Data Copy (verified from Lesotho)

**Designer request**:
> "Copy shareholder details to the managers list when they are also directors."

**Trace** (actual internal bot from Lesotho):

| Bot | Details |
|-----|---------|
| Name | "INTERNAL copy directors from shareholders to managers" |
| `bot_type` | `"internal"` |
| Determinant | "Shareholder is director" (grid determinant on `applicantListOfShareholders2`) |
| Action | Copy matching rows from shareholders EditGrid to managers EditGrid |

**Other internal bots in Lesotho**:
- "INTERNAL bring data to memorandum of association"
- "INTERNAL sent back from BR review"
- "INTERNAL to incorporation documents"

---

## Section G: Error States & Edge Cases

### G.1 Validation Errors

| Designer Says | Technical State | User Sees |
|---------------|-----------------|-----------|
| "Field is required" | `validate.required: true` + empty value | Red border, "This field is required" |
| "Invalid format" | `validate.pattern` mismatch | Red border, custom message |
| "Value too high/low" | `validate.min/max` exceeded | Red border, range message |
| "Form won't submit" | Any validation error exists | Submit button disabled or error list |

### G.2 Bot/API Errors

| Scenario | What Happens | Designer Term |
|----------|--------------|---------------|
| API timeout | Bot returns error | "Verification failed" |
| Invalid response | OutputMapping fails | "Could not process response" |
| Network error | Connection refused | "Service unavailable" |
| Authentication fail | 401/403 response | "Access denied" |

**Handling**: Bot configuration includes error handling - can show error message or set field to error state.

### G.3 Workflow Errors

| Scenario | Technical State | Resolution |
|----------|-----------------|------------|
| No reviewer assigned | Role has no users | Admin assigns user to role |
| Stuck in status | No outgoing transition | Configure RoleStatus destination |
| Circular workflow | Role A → B → A | Review role configuration |
| Missing form | RoleStatus without form | Link form to role |

### G.4 Data Integrity Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Orphaned determinant | Component deleted, determinant remains | Delete determinant manually |
| Broken behaviour | Target component key changed | Update ComponentBehaviour target |
| Missing mapping | Bot output field doesn't exist | Update OutputMapping target |
| Invalid registration link | Registration UUID changed | Re-link component to registration |

### G.5 Common Designer Mistakes (verified patterns)

| Mistake | Symptom | Solution |
|---------|---------|----------|
| "Panel not showing" | `activate: false` with no behaviour | Add ComponentBehaviour with effect `show: true` |
| "Panel shows when it shouldn't" | Missing `customClasses: ["deactivated"]` | Add deactivated class to default-hidden components |
| "Grid columns misaligned" | Wrong column count | Match EditGrid components to `templates` header |
| "Dropdown empty" | Missing `dataSrc: "catalog"` | Add catalog binding: `dataSrc: "catalog"`, `catalog: "uuid"` |
| "Button does nothing" | No `componentActionId` | Link button to ComponentAction via `componentActionId` |
| "Bot not triggering" | Missing `actionRowIds` | Add `actionRowIds: ["uuid"]` to button |
| "Changes not visible" | Service not published | Publish service via `service_publish` |
| "Condition not working" | Wrong determinant type | Check: radio needs `type: "radio"`, catalog needs `type: "classification"` |
| "Effect not applied" | Effect not linked | Verify `effectsIds` array on target component |

### G.6 Debugging Checklist (verified workflow)

When something doesn't work:

1. **Check publish status** - Is the service published? Use `service_get` to verify `active: true`
2. **Check component key** - Is the key unique? Use `form_component_get` to inspect
3. **Check determinant** - Use `determinant_list` to verify condition exists and targets correct field
4. **Check behaviour** - Use `componentbehaviour_get_by_component` to see linked effects
5. **Check effect** - Verify `property_effects` has `{name: "show", value: "true"}`
6. **Check registration filter** - Verify `registrations: {"uuid": true}` includes current registration
7. **Check bot** - Use `bot_get` to verify `enabled: true` and correct `bot_type`
8. **Check action** - Use `componentaction_get_by_component` to verify button→bot link
9. **Check browser console** - Any JavaScript errors in DS?
10. **Check network tab** - Did API calls succeed (for data bots)?

### G.7 MCP Tools for Debugging

| Issue | MCP Tool | Required Parameters | What to Check |
|-------|----------|---------------------|---------------|
| Component not showing | `componentbehaviour_get_by_component` | `service_id`, `component_key` | `effects` array, `property_effects` |
| Determinant not working | `determinant_get` | `determinant_id` | `type`, `operator`, `target_form_field_key` |
| Bot not triggering | `componentaction_get_by_component` | `service_id`, `component_key` | `bots` array, `bot_type` |
| Form structure | `form_component_get` | `service_id`, `component_key` | `behaviourId`, `componentActionId`, `registrations` |
| Service state | `service_get` | `service_id` | `active`, `publish_date` |
| All determinants | `determinant_list` | `service_id` | Count, types, target fields |
| All behaviours | `componentbehaviour_list` | `service_id` | Component keys, effect counts |
| All bots | `bot_list` | `service_id` | Names, types, enabled status |
| Search determinants | `determinant_search` | `service_id`, `query` (optional) | Find by name or field |
| Effect details | `effect_create` / delete | `behaviour_id`, `determinant_ids`, `effect_type` | Create/remove effects |

**Common Parameter Patterns**:
- `service_id`: UUID of the service (get from `service_list`)
- `component_key`: The `key` property of a form component (e.g., `"applicantFirstName"`)
- `determinant_id`: UUID of the determinant (get from `determinant_list`)
- `behaviour_id`: UUID of the ComponentBehaviour (get from `componentbehaviour_list`)

### G.8 Reference Data

For detailed entity counts and feature comparisons between example services (Kenya, Lesotho), see:
- [ai-guide-index.md](ai-guide-index.md) - Quick reference table with counts
- [ai-guide-automation-integration.md](ai-guide-automation-integration.md) - Bot type distribution
- [ai-guide-workflow-publishing.md](ai-guide-workflow-publishing.md) - Status distribution

---

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-23 | Initial release |
| 1.1 | 2025-01-23 | Session B verification |
| 1.2 | 2025-01-23 | Adversarial review fixes: corrected class names (RoleStatusBase, FileValidatedStatus, etc.), added complete determinant types (13 total), added bot categories, added AI guide cross-references, verified screenshots, added MCP tool parameters |

*Rosetta Stone v1.2 | Verified against AI guides and Lesotho BPA 2025-01-23*
