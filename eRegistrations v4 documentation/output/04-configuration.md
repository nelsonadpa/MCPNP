# eRegistrations v4 Configuration Reference

**Version**: 4.0
**Audience**: Technical administrators, service analysts, project managers
**Prerequisites**: Platform deployed and operational (see [03 - Deployment](03-deployment.md))

---

## 1. Configuration Overview

Service configuration in eRegistrations follows a no-code approach. Administrators define every aspect of a public service — forms, workflow, business rules, requirements, costs, and integrations — through the Business Process Analyzer (BPA). When the configuration is complete, the platform publishes it to the Display System where citizens can access it.

This document covers the full configuration lifecycle:

| Phase | Section | What Happens |
|-------|---------|--------------|
| **Define** | Sections 2–10 | Create service, registrations, roles, forms, rules, bots, requirements, costs, translations |
| **Publish** | Section 11 | Generate artifacts and deploy to runtime engines |
| **Export/Import** | Section 12 | Move service configurations between environments |
| **GDB Setup** | Sections 13–17 | Configure the Government Database (schemas, views, permissions, APIs) |
| **Tune** | Section 18 | Adjust environment variables across subsystems |

---

## 2. Services

A **Service** is the central container for a business process. It bundles forms, workflows, business rules, roles, requirements, costs, and translations into a single configurable unit.

### 2.1 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display name of the service |
| `description` | String | Human-readable description |
| `active` | Boolean | Whether the service is currently available to applicants |
| `version` | Integer | Incremented on each publish |
| `registrations` | ManyToMany | Linked registrations (licenses/permits) |
| `lastPublishDate` | Timestamp | Date and time of the most recent publication |

### 2.2 REST API

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List all services | `GET` | `/service` |
| Create a service | `POST` | `/service` |
| Publish a service | `POST` | `/service/{id}/publish` |

### 2.3 Default Artifacts

When a new service is created, the platform automatically generates:

- A **guide page** form (informational landing page for the applicant)
- A **payment form** (fee collection, if applicable)

These can be customized after creation.

---

## 3. Registrations

A **Registration** represents a specific license, permit, or certificate type linked to a Service. A single Service can involve multiple Registrations — for example, a "Start a Business" service might include a business license registration, a tax registration, and a social security registration.

### 3.1 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name of the registration |
| `shortName` | String | Abbreviated name used in compact views |
| `active` | Boolean | Whether this registration is currently enabled |

### 3.2 Relationship

Services and Registrations are linked through a **ManyToMany** relationship:

- One Service can include many Registrations
- One Registration can belong to multiple Services (reuse across services)

---

## 4. Roles and Workflow

Roles define the participants in a service workflow. The platform uses role definitions and their status transitions to automatically generate executable BPMN process definitions.

### 4.1 Role Types

| Type | Purpose | Example |
|------|---------|---------|
| **UserRole** | Human task — requires manual action from an officer | Reviewer, Approver, Inspector |
| **BotRole** | Automated task — executed by the system without human intervention | API call, document generation |

### 4.2 Role Data Model

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display name of the role |
| `shortName` | String | Abbreviated identifier |
| `startRole` | Boolean | If `true`, this is the first role after the applicant submits the form |
| `statuses` | List | Possible outcomes for this role (e.g., "Approved", "Rejected", "Correction Needed") |

Each **status** includes a `destinationRole` — the role that receives the application next when that status is selected.

### 4.3 Building a Workflow

Follow these steps to define a complete workflow:

1. **Create Roles** — Add all human and automated participants
2. **Define Statuses** — For each Role, define the possible decision outcomes
3. **Set Destinations** — For each Status, select the destination Role

**Example: Simple approval workflow**

```
Applicant → [submits] → Reviewer (startRole=true)
  Reviewer status "Approved"       → Approver
  Reviewer status "Correction"     → Applicant (back to applicant)
  Approver status "Final Approved" → [end]
  Approver status "Rejected"       → [end]
```

### 4.4 BPMN Generation

The **ProcessBuilder** automatically generates BPMN XML from role and status definitions. Administrators do not need to write BPMN directly — the platform handles all process definition generation during the publish step.

---

## 5. Forms (Form.io Integration)

Forms in eRegistrations are JSON schemas rendered by the Form.io engine. The platform generates forms automatically based on the service configuration, with each role receiving a customized view.

### 5.1 Form.io Schema Structure

```json
{
  "type": "form",
  "display": "form",
  "components": [
    {
      "label": "Your Full Name",
      "type": "textfield",
      "key": "fullName",
      "input": true
    },
    {
      "label": "Date of Birth",
      "type": "datetime",
      "key": "dateOfBirth",
      "input": true
    },
    {
      "label": "Business Type",
      "type": "select",
      "key": "businessType",
      "input": true,
      "data": {
        "values": [
          { "label": "Sole Proprietorship", "value": "sole" },
          { "label": "Corporation", "value": "corp" },
          { "label": "Partnership", "value": "partnership" }
        ]
      }
    }
  ]
}
```

### 5.2 Common Component Types

| Type | Description |
|------|-------------|
| `textfield` | Single-line text input |
| `textarea` | Multi-line text input |
| `number` | Numeric input |
| `select` | Dropdown selection |
| `selectboxes` | Checkbox group |
| `radio` | Radio button group |
| `datetime` | Date and/or time picker |
| `checkbox` | Single boolean checkbox |
| `file` | File upload |
| `email` | Email address input |
| `phoneNumber` | Phone number input |
| `signature` | Signature capture |
| `datagrid` | Repeatable row grid |
| `editgrid` | Editable grid (inline editing) |
| `panel` | Grouping container |
| `columns` | Multi-column layout |
| `htmlelement` | Static HTML content |

### 5.3 Form Generation per Role

The **RoleFormGeneratorFactory** delegates to specialized generators that produce role-specific views:

| Generator | Role | Behavior |
|-----------|------|----------|
| `ApplicantFormGenerator` | Applicant | Full editable form with all input fields |
| `ReviewerFormGenerator` | Reviewer | Read-only view of applicant data with review decision fields |
| Custom generators | Other roles | Configurable views based on role permissions |

Each role's form is generated automatically during publish. Administrators configure *what* data the form collects; the platform determines *how* each role sees it.

---

## 6. Determinants (Business Rules)

Determinants are conditions that control dynamic form behavior — showing or hiding fields, enabling or disabling inputs, and setting required validations based on user selections.

### 6.1 Determinant Types

| Type | Use Case | Example |
|------|----------|---------|
| `TextDeterminant` | Match against text values | Business name contains "Ltd" |
| `NumericDeterminant` | Compare numeric values | Revenue greater than 50,000 |
| `BooleanDeterminant` | True/false conditions | "Is foreign investor" is checked |
| `DateDeterminant` | Date comparisons | Registration date is before 2025-01-01 |
| `SelectDeterminant` | Match dropdown selection | Business type equals "Corporation" |
| `ClassificationDeterminant` | Match catalog/classification values | Country equals a specific classification entry |
| `GridDeterminant` | Conditions on grid/repeatable data | At least one row in the shareholders grid |

### 6.2 JsonLogic Format

Determinants are translated into **JsonLogic** expressions for client-side evaluation. The platform generates these automatically from the determinant configuration.

**Simple equality:**

```json
{
  "==": [
    { "var": "data.businessType" },
    "Corporation"
  ]
}
```

**Numeric comparison:**

```json
{
  ">": [
    { "var": "data.annualRevenue" },
    50000
  ]
}
```

**Boolean check:**

```json
{
  "==": [
    { "var": "data.isForeignInvestor" },
    true
  ]
}
```

**Combined conditions (AND):**

```json
{
  "and": [
    { "==": [{ "var": "data.businessType" }, "Corporation"] },
    { ">": [{ "var": "data.annualRevenue" }, 50000] }
  ]
}
```

### 6.3 Supported Operators

| Operator | Description |
|----------|-------------|
| `==` | Equal to |
| `!=` | Not equal to |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal to |
| `<=` | Less than or equal to |
| `and` | Logical AND (all conditions must be true) |
| `or` | Logical OR (at least one condition must be true) |
| `!` | Logical NOT |

### 6.4 Effect Types

Determinants can trigger the following effects on form components:

| Effect | Behavior |
|--------|----------|
| **Show/Hide** | Conditionally display or hide a field |
| **Enable/Disable** | Make a field editable or read-only |
| **Required/Optional** | Toggle whether a field is mandatory |

---

## 7. Classifications (Catalogs)

Classifications are dynamic lookup tables that provide structured reference data for forms — such as country lists, business types, industry codes, or any other categorized data.

### 7.1 Data Model

| Entity | Purpose |
|--------|---------|
| `ClassificationType` | Container for a category (e.g., "Country", "Business Type", "Industry Code") |
| `ClassificationField` | Individual option within a type (e.g., "Agriculture", "Manufacturing") |
| `ClassificationGroup` | Optional grouping of fields within a type (e.g., group countries by continent) |

### 7.2 Hierarchical Classifications

Classifications support hierarchical relationships through the `childClassificationType` field on `ClassificationField`. This enables cascading dropdowns — for example:

```
ClassificationType: "Region"
  └── ClassificationField: "North America"
        └── childClassificationType: "Country (North America)"
              ├── ClassificationField: "Canada"
              ├── ClassificationField: "Mexico"
              └── ClassificationField: "United States"
```

When a user selects "North America" in the first dropdown, the second dropdown automatically populates with the child classification entries.

### 7.3 Publishing

During the publish step, classifications are bulk-inserted into **RestHeart** (MongoDB REST API) so they can be queried at runtime by the Display System forms.

---

## 8. Bots (Automated Tasks)

Bots execute automated tasks within the workflow — calling external APIs, generating documents, or performing internal data operations without human intervention.

### 8.1 Bot Types

| Type | Purpose | Example |
|------|---------|---------|
| `data` | External API calls (REST/SOAP) | Query a tax authority API to validate a tax ID |
| `document` | PDF or document generation | Generate a registration certificate |
| `internal` | Internal platform operations | Copy data between form fields, trigger notifications |

### 8.2 Bot Data Model

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display name |
| `botType` | Enum | `data`, `document`, or `internal` |
| `botServiceId` | String | Reference to the external service definition |
| `inputFieldsMapping` | List | Maps form fields to external service input parameters |
| `outputFieldsMapping` | List | Maps external service response fields back to form fields |

### 8.3 External Service Discovery

Bots that call external APIs use **Swagger/OpenAPI** definitions to discover available operations:

1. An administrator registers an external service URL (Swagger/OpenAPI endpoint)
2. The platform parses the API definition and lists available operations
3. The administrator selects an operation and maps input/output fields

### 8.4 Field Mapping

Input and output mappings connect form data to external service parameters:

**Input mapping** (form → external service):

| Form Field | External Service Parameter |
|------------|---------------------------|
| `data.taxId` | `request.taxpayerNumber` |
| `data.businessName` | `request.entityName` |

**Output mapping** (external service → form):

| External Service Response | Form Field |
|---------------------------|------------|
| `response.status` | `data.verificationStatus` |
| `response.registrationDate` | `data.taxRegistrationDate` |

### 8.5 Deployment

Bot instructions are generated as **Mule Flow XML** during the publish step. The platform supports both Mule 3 and Mule 4 runtimes. Generated flows are deployed to the Mule ESB platform automatically.

---

## 9. Document Requirements

Document requirements specify which supporting documents an applicant must upload as part of a registration.

### 9.1 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `tooltip` | String | Help text displayed to the applicant (e.g., "Upload a scanned copy of your ID card") |
| `documentCode` | String | Internal code for the document type |
| `registration` | FK | The Registration this requirement belongs to |

### 9.2 Configuration

Each requirement is linked to a specific Registration, not to the Service directly. This allows different registrations within the same service to have different document requirements.

---

## 10. Costs

Costs represent fees that applicants must pay as part of a registration process.

### 10.1 Cost Types

| Type | Description | Example |
|------|-------------|---------|
| **Fixed** | A static amount | Registration fee: 100.00 |
| **Formula** | Calculated dynamically based on form data | Fee = capital amount × 0.01 |

### 10.2 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `registration` | FK | The Registration this cost belongs to |
| `currency` | FK | Currency for the amount |
| `amount` | Decimal | Fixed amount (for fixed costs) |
| `formula` | String | Calculation expression (for formula costs) |

### 10.3 Configuration

Like document requirements, costs are linked to individual Registrations. A service with multiple registrations can have different fee structures for each.

---

## 11. Translations

The platform supports full internationalization through two mechanisms:

### 11.1 Entity and Label Translations

The BPA manages translations for all configurable text — field labels, help text, status names, role names, and service descriptions. Administrators enter translations directly in the BPA interface for each supported language.

### 11.2 Global Translation Service

An optional centralized translation service synchronizes shared translations (common UI labels, system messages) across multiple eRegistrations instances. This service communicates with the platform via **ActiveMQ** messaging.

### 11.3 Language Configuration

Languages are configured per instance in the BPA:

1. Navigate to the language settings in the BPA administration panel
2. Add the required languages (e.g., English, French, Spanish)
3. Set the default language
4. Enter translations for all service content in each language

The `DEFAULT_LANGUAGE` environment variable (see Section 18) controls which language is used when no translation is available.

---

## 12. Publishing Pipeline

Publishing is the process of converting BPA configuration into runtime artifacts and deploying them to the execution engines. This is the critical step that makes a configured service available to the public.

### 12.1 Publish Sequence

When an administrator publishes a service, the platform executes the following steps in order:

| Step | Action | Target System |
|------|--------|---------------|
| 1 | Create a Publish audit record | BPA database |
| 2 | Generate Form.io JSON schemas via `RoleFormGeneratorFactory` | — |
| 3 | Publish form schemas to Form.io server (`POST /form`) | Form.io |
| 4 | Generate BPMN XML via `ProcessBuilder` | — |
| 5 | Deploy BPMN process definition to Camunda | Camunda |
| 6 | Generate Mule Flow XML via `ActionSchemaGenerator` for each Bot | — |
| 7 | Deploy Mule flows to the integration platform | Mule ESB |
| 8 | Publish classifications/catalogs to RestHeart (bulk insert) | MongoDB/RestHeart |
| 9 | Send ActiveMQ message announcing new version | ActiveMQ |
| 10 | Mark Service `active=true` and update version number | BPA database |

### 12.2 Versioning

Publishing is **versioned** — each publish creates a new version. Multiple versions can coexist in the runtime, allowing in-progress applications to complete under their original version while new applications use the latest version.

### 12.3 Publish Verification

After publishing, verify the following:

| Check | How to Verify |
|-------|---------------|
| Forms published | Open the service in the Display System and confirm forms render correctly |
| Workflow deployed | Submit a test application and confirm it routes through all roles |
| Bots operational | Trigger an automated step and confirm external APIs are called |
| Catalogs available | Open dropdown fields and confirm classification data loads |

> **Troubleshooting**: If publishing fails partway through, check the BPA backend logs for the specific step that failed. Common causes include network connectivity issues to Form.io, Camunda, or Mule, and schema validation errors in form definitions.

---

## 13. Service Export and Import

The platform supports exporting a complete service configuration as a single JSON file and importing it into another environment. This is the primary mechanism for promoting configurations from development to staging to production.

### 13.1 Export

**API**: `POST /download_service/{service_id}`

The export includes all service artifacts:

| Component | Included |
|-----------|----------|
| Service definition | Always |
| Roles and workflow | Configurable (`rolesSelected`) |
| Guide form | Configurable (`guideFormSelected`) |
| Applicant form | Configurable (`applicantFormSelected`) |
| Bots and mappings | Configurable (`botsSelected`) |
| Determinants | Always (when forms are included) |
| Classifications | Always |

### 13.2 Import

**API**: `POST /upload_service`

The import process:

1. Validates the JSON structure
2. Recreates all objects in the target environment
3. Resolves internal references (field IDs, role IDs)
4. Does **not** automatically publish — the administrator must publish after import

### 13.3 Configuration Flags

| Flag | Description |
|------|-------------|
| `serviceSelected` | Include the base service definition |
| `rolesSelected` | Include roles, statuses, and workflow structure |
| `guideFormSelected` | Include the guide page form |
| `applicantFormSelected` | Include the applicant form |
| `botsSelected` | Include bot definitions and field mappings |

> **Tip**: When importing into a new environment, import the full configuration first, then review and adjust any environment-specific settings (such as external API URLs in bot configurations) before publishing.

---

## 14. GDB: Database Catalog and Schema

The Government Database (GDB) provides a no-code interface for defining structured data repositories. Each database is defined by a JSON Schema that controls what data can be stored and how it is validated.

### 14.1 Data Model

| Entity | Purpose |
|--------|---------|
| `DatabaseCatalog` | Named container for a data type (e.g., "Businesses", "Persons", "Licenses") |
| `Database` | Versioned instance of a catalog, with a JSON Schema definition |

A `DatabaseCatalog` has a `name` and a `code` (unique identifier). Each `Database` record belongs to a catalog and has a `version` number and a `schema` field containing the JSON Schema.

### 14.2 Schema Definition

Database schemas use the **JSON Schema** standard. Supported field types:

| Type | JSON Schema Type | Description |
|------|-----------------|-------------|
| Text | `string` | Free-text field |
| Number | `integer` | Whole number |
| Date | `date` | Calendar date |
| Boolean | `boolean` | True/false flag |
| File | `file` | Uploaded file reference |
| Catalog reference | `catalog` | Link to a classification/lookup table |

**Example schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "businessName": {
      "type": "string",
      "title": "Business Name"
    },
    "registrationNumber": {
      "type": "string",
      "title": "Registration Number"
    },
    "incorporationDate": {
      "type": "date",
      "title": "Date of Incorporation"
    },
    "isActive": {
      "type": "boolean",
      "title": "Active Status"
    },
    "annualRevenue": {
      "type": "integer",
      "title": "Annual Revenue"
    },
    "certificate": {
      "type": "file",
      "title": "Registration Certificate"
    },
    "businessType": {
      "type": "catalog",
      "title": "Business Type"
    }
  },
  "required": ["businessName", "registrationNumber"]
}
```

### 14.3 Schema API

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create or modify a database | `POST` | `/api/v1/database/modify` |

---

## 15. GDB: Data Entry and Validation

### 15.1 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `content` | JSONB | The actual data, stored as a JSON document |
| `database` | FK | Reference to the Database definition |
| `registry_number` | String | Auto-generated unique identifier |
| `created_at` | Timestamp | Creation timestamp |
| `updated_at` | Timestamp | Last modification timestamp |
| `created_by` | String | User ID of the creator |
| `updated_by` | String | User ID of the last modifier |

### 15.2 Data API

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create a data entry | `POST` | `/api/v1/data` |

### 15.3 Validation

All data submitted through the API is validated against the database's JSON Schema before saving. If validation fails, the API returns an error with details about which fields failed and why.

---

## 16. GDB: Data Views

Data Views provide configurable query interfaces for reading and aggregating stored data.

### 16.1 Data Model

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Unique view identifier |
| `fields` | List | Which fields to include in the output |
| `filters` | List | Conditions to filter results |
| `group_by` | List | Fields to group results by |
| `aggregates` | List | Aggregate functions to apply |

### 16.2 Supported Aggregations

| Function | Description |
|----------|-------------|
| `SUM` | Sum of numeric values |
| `COUNT` | Count of records |
| `AVG` | Average of numeric values |

### 16.3 Data View API

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Query a data view | `GET` | `/api/v1/data-view/{view-name}` |

---

## 17. GDB: Permissions and Dynamic APIs

### 17.1 Role-Based Access Control

The GDB uses RBAC with optional per-database scoping:

| Role | Scope | Description |
|------|-------|-------------|
| `super-admin` | Global | Full access to all databases and configuration |
| `database-create` | Global | Can create new database catalogs and schemas |
| `data-create` | Global or scoped | Can create data entries (optionally limited to specific catalogs) |
| `data-read` | Global or scoped | Can read data entries (optionally limited to specific catalogs) |

Permissions can be:

- **Global**: Apply to all databases in the GDB instance
- **Scoped**: Restricted to a specific `DatabaseCatalog`, limiting access to only that data type

### 17.2 Dynamic API Generation

When a database is published, the GDB automatically generates REST API endpoints with **OpenAPI/Swagger** documentation:

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Read data | `GET` | `/data/{code}/{version}/read` |
| Create data | `POST` | `/data/{code}/{version}/create` |

The `{code}` parameter corresponds to the `DatabaseCatalog.code` and `{version}` to the `Database.version`. These endpoints are consumed by BPA bots during workflow execution (e.g., writing registration data to the GDB after approval).

---

## 18. Environment Variables

This section documents the key environment variables for each subsystem. These are typically set in the `.env` file or managed through Docker Secrets in production.

### 18.1 BPA (Business Process Analyzer)

| Variable | Default | Description |
|----------|---------|-------------|
| `FORMIO_URL` | `http://formio:3001` | URL of the Form.io server for form schema publishing |
| `CAMUNDA_URL` | `http://camunda:8090` | URL of the Camunda workflow engine for BPMN deployment |
| `DEFAULT_LANGUAGE` | `en` | Default language code used when no translation is available |

### 18.2 DS (Display System)

| Variable | Default | Description |
|----------|---------|-------------|
| `EREG_CAMUNDA_PATH` | — | URL path to the Camunda REST API |
| `EREG_BPMN_LOCATION` | — | Filesystem path where BPMN files are stored |
| `CACHE_FORMS` | — | Enable Redis caching for form definitions (`true`/`false`) |
| `DS_POSTGRES_DB_NAME` | — | PostgreSQL database name for the Display System |
| `DS_POSTGRES_DB_USER` | — | PostgreSQL username |
| `DS_POSTGRES_DB_PASSWORD` | — | PostgreSQL password |
| `PARTB_ITEMS_PER_PAGE` | — | Number of items per page in back-office listing views |

### 18.3 GDB (Government Database)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_DEBUG` | `false` | Enable debug mode (never enable in production) |
| `APP_TITLE` | — | Display title for the GDB instance |
| `DATABASE_NAME` | — | PostgreSQL database name |
| `DATABASE_HOST` | — | PostgreSQL host address |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USERNAME` | — | PostgreSQL username |
| `DATABASE_PASSWORD` | — | PostgreSQL password |

#### GDB Authentication Services

The GDB supports multiple authentication services, configured using numbered variables:

| Variable Pattern | Description |
|-----------------|-------------|
| `AUTH_SERVICE_PUBLIC_URL_N` | Public URL of the Nth authentication service (e.g., Keycloak realm) |
| `AUTH_SERVICE_TYPE_N` | Type of the Nth authentication service (e.g., `keycloak`) |
| `AUTH_SERVICE_ID_N` | Client ID for the Nth authentication service |

Replace `N` with a sequential number starting from `1`:

```env
AUTH_SERVICE_PUBLIC_URL_1=https://login.example.gov/realms/ereg
AUTH_SERVICE_TYPE_1=keycloak
AUTH_SERVICE_ID_1=gdb-client

AUTH_SERVICE_PUBLIC_URL_2=https://login.example.gov/realms/external
AUTH_SERVICE_TYPE_2=keycloak
AUTH_SERVICE_ID_2=gdb-external-client
```

This pattern allows the GDB to accept tokens from multiple Keycloak realms or identity providers simultaneously.

---

## 19. Configuration Workflow Summary

The following is the recommended sequence for configuring a new service from scratch:

| Step | Action | Section |
|------|--------|---------|
| 1 | Create the Service | [Section 2](#2-services) |
| 2 | Create Registrations and link them to the Service | [Section 3](#3-registrations) |
| 3 | Define Roles (human and automated) | [Section 4](#4-roles-and-workflow) |
| 4 | Define Statuses for each Role and set destination Roles | [Section 4](#4-roles-and-workflow) |
| 5 | Configure the applicant form (add fields, layout, validation) | [Section 5](#5-forms-formio-integration) |
| 6 | Add Determinants for conditional logic | [Section 6](#6-determinants-business-rules) |
| 7 | Create Classifications for dropdown/catalog fields | [Section 7](#7-classifications-catalogs) |
| 8 | Configure Bots for automated tasks and external integrations | [Section 8](#8-bots-automated-tasks) |
| 9 | Define Document Requirements per Registration | [Section 9](#9-document-requirements) |
| 10 | Define Costs per Registration | [Section 10](#10-costs) |
| 11 | Enter Translations for all supported languages | [Section 11](#11-translations) |
| 12 | Publish the Service | [Section 12](#12-publishing-pipeline) |
| 13 | Verify in the Display System | [Section 12](#12-publishing-pipeline) |

> **Tip**: After initial configuration, iterate by making changes in the BPA and re-publishing. Each publish creates a new version, so in-progress applications are not affected by configuration changes.

---

## 20. Quick Reference

### Service Configuration API Endpoints

| Resource | List | Create | Publish/Special |
|----------|------|--------|-----------------|
| Service | `GET /service` | `POST /service` | `POST /service/{id}/publish` |
| Export | — | — | `POST /download_service/{id}` |
| Import | — | — | `POST /upload_service` |

### GDB API Endpoints

| Resource | Endpoint |
|----------|----------|
| Database schema | `POST /api/v1/database/modify` |
| Data entry | `POST /api/v1/data` |
| Data view | `GET /api/v1/data-view/{view-name}` |
| Dynamic read | `GET /data/{code}/{version}/read` |
| Dynamic create | `POST /data/{code}/{version}/create` |

### Publish Artifact Summary

| Artifact | Generated By | Deployed To |
|----------|-------------|-------------|
| Form.io JSON schemas | `RoleFormGeneratorFactory` | Form.io server |
| BPMN XML | `ProcessBuilder` | Camunda |
| Mule Flow XML | `ActionSchemaGenerator` | Mule ESB |
| Classification data | BPA export | RestHeart (MongoDB) |

---

## 21. Next Steps

- **Secure the platform**: See [05 - Security](05-security.md) for security hardening, access control policies, and TLS configuration.
- **Set up maintenance routines**: See [06 - Maintenance](06-maintenance.md) for backup schedules, log management, and monitoring.
- **Integrate external systems**: See [08 - Integration](08-integration.md) for GDB API usage, bot configuration patterns, and interoperability.
- **Adapt for your country**: See [09 - Localization](09-localization.md) for multi-language setup and country-specific customization.

---

*Previous: [03 - Deployment](03-deployment.md) | Next: [05 - Security](05-security.md)*
