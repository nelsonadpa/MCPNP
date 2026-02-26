# eRegistrations v4 Integration and GDB API Guide

**Version**: 4.0
**Audience**: Developers, system integrators, technical administrators
**Prerequisites**: Running eRegistrations deployment (see [03 - Deployment](03-deployment.md)), Keycloak admin access

---

## 1. Integration Overview

The eRegistrations platform provides three integration pathways for connecting with external systems:

| Pathway | Protocol | Use Case |
|---------|----------|----------|
| **GDB API** | REST (JWT-secured) | Query and manage government register data programmatically |
| **Direct API Integration** | REST or SOAP | Connect external APIs to BPA workflow steps via Bots |
| **Service Bus (Mule ESB)** | REST, SOAP, custom | Complex transformations, bidirectional data flows, multi-system orchestration |

All three pathways use **Keycloak** (OAuth 2.0 / OpenID Connect) for authentication. External clients obtain JWT tokens via the Client Credentials grant and include them in API requests.

---

## 2. GDB (Government Database) API

### 2.1 What Is the GDB?

The GDB (Generic Database Builder / Digital Registries System) is a no-code platform for creating and administering structured government databases. Each register (database) created in the GDB automatically receives:

- A web-based UI for creating, reading, updating, deleting, and searching records
- An API connector with auto-generated OpenAPI/Swagger documentation
- Operation logs with a tamper-evident audit trail

### 2.2 GDB Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | ReactJS |
| Backend | Django (Python) |
| Database | PostgreSQL with JSONB fields |
| Authentication | Keycloak (OAuth 2.0 + OpenID Connect) |
| Task queue | Celery with Redis broker |
| Antivirus | ClamAV (file upload scanning) |
| Real-time messaging | ActiveMQ (STOMP protocol) |

The GDB backend accepts multiple OpenID Connect providers through Keycloak, allowing federated authentication across government agencies.

### 2.3 Core API Endpoints

The GDB exposes two categories of endpoints: **static** (fixed routes) and **dynamic** (auto-generated per database).

#### Static Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/database/modify` | Create or modify a database schema |
| POST | `/api/v1/data` | Create a data entry |
| GET | `/api/v1/data-view/{view-name}` | Query data views with aggregation |

#### Dynamic Endpoints (Auto-Generated)

For each published database, the GDB generates dedicated endpoints based on the database code and version:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/data/{code}/{version}/read` | Read data entries |
| POST | `/data/{code}/{version}/create` | Create data entries |

The `{code}` and `{version}` values correspond to the database's unique identifier and schema version.

### 2.4 Dynamic OpenAPI Generation

The GDB uses a `CustomSchemaGenerator` (built on drf-spectacular) to automatically produce Swagger documentation. The generation process:

1. Scans for generic URL patterns in the application router
2. Fetches all published (non-draft) databases from the registry
3. Generates concrete endpoints for each database
4. Injects the user-defined JSON schema into request and response documentation

Access the auto-generated Swagger UI at:

```
https://gdb.YOUR_DOMAIN/api/docs/
```

---

## 3. Authenticating with the GDB API

All GDB API calls require a valid JWT access token obtained from Keycloak. The following steps describe the complete setup process from creating the integration account to making authenticated requests.

### Step 1: Create an Integration Client in Keycloak

1. Log into the Keycloak admin console:

   ```
   https://login.YOUR_DOMAIN/auth/admin
   ```

2. Select the appropriate **realm** from the dropdown in the top-left corner.

3. Navigate to **Clients** and click **Create**.

4. Configure the new client:

   | Setting | Value |
   |---------|-------|
   | Client ID | A unique identifier (e.g., `my-service-account-client`) |
   | Client Protocol | `openid-connect` |

5. After creation, configure the client settings:

   | Setting | Value | Reason |
   |---------|-------|--------|
   | Access Type | `confidential` | Enables client secret authentication |
   | Standard Flow Enabled | OFF | Not needed for machine-to-machine |
   | Direct Access Grants Enabled | OFF | Not needed for machine-to-machine |
   | Service Accounts Enabled | ON | Enables the Client Credentials grant |
   | Authorization Enabled | OFF | Not needed unless using fine-grained authorization |

6. Save the configuration.

7. Go to the **Credentials** tab and copy the **Client Secret**. Store it securely.

You now have a `Client ID` and `Client Secret` pair for API authentication.

### Step 2: Obtain a JWT Access Token

Use the OAuth 2.0 **Client Credentials** grant to obtain an access token:

```bash
curl --location \
  'https://login.YOUR_DOMAIN/auth/realms/REALM_NAME/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic BASE64_ENCODED_CREDENTIALS' \
  --data-urlencode 'grant_type=client_credentials'
```

Where `BASE64_ENCODED_CREDENTIALS` is the Base64-encoded string `ClientID:ClientSecret`.

To generate the Base64 value:

```bash
echo -n 'my-service-account-client:YOUR_CLIENT_SECRET' | base64
```

**Successful response** (HTTP 200):

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "scope": "profile email"
}
```

Key fields:

| Field | Description |
|-------|-------------|
| `access_token` | The JWT to include in API requests |
| `expires_in` | Token validity in seconds (typically 300) |
| `token_type` | Always `Bearer` |

> **Note**: The Client Credentials grant does not return a `refresh_token`. Your application must request a new token before the current one expires. See [Section 3.5](#step-5-token-management-best-practices) for handling strategies.

### Step 3: Make an API Request

Include the access token in the `Authorization` header:

```bash
curl --location \
  'https://gdb.YOUR_DOMAIN/data-view/CATALOG_CODE/VERSION/VIEW_ID' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Replace the placeholders:

| Placeholder | Description |
|-------------|-------------|
| `CATALOG_CODE` | The database code (visible in the GDB admin panel) |
| `VERSION` | The database schema version (e.g., `1`) |
| `VIEW_ID` | The data view identifier |

> **Note**: The first request with a new client may return **HTTP 403 Forbidden**. This is expected — the client has valid authentication but no GDB permissions yet. Proceed to Step 4.

### Step 4: Assign GDB Permissions

Contact the GDB administrator to grant permissions for your integration client. Provide:

1. The Keycloak **Client ID** (e.g., `my-service-account-client`)
2. The specific GDB **databases** and **data views** the client needs access to
3. The required **permission level** (read, write, or admin)

The GDB administrator assigns permissions through the GDB admin interface. Once configured, retry the request from Step 3.

### Step 5: Token Management Best Practices

For production integrations, follow these practices:

**Handle token expiry proactively.** Track the `expires_in` value and request a new token before expiry. A common pattern is to refresh when 80% of the token lifetime has elapsed:

```python
import time
import requests
import base64

class GDBClient:
    def __init__(self, token_url, client_id, client_secret):
        self.token_url = token_url
        self.credentials = base64.b64encode(
            f"{client_id}:{client_secret}".encode()
        ).decode()
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        if self.token and time.time() < self.token_expiry:
            return self.token

        response = requests.post(
            self.token_url,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {self.credentials}"
            },
            data={"grant_type": "client_credentials"}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        # Refresh at 80% of token lifetime
        self.token_expiry = time.time() + (data["expires_in"] * 0.8)
        return self.token
```

**Never hardcode credentials.** Store the Client ID and Client Secret in environment variables or a secrets management system (e.g., Docker Secrets, HashiCorp Vault).

**Handle HTTP error codes:**

| Code | Meaning | Action |
|------|---------|--------|
| 401 Unauthorized | Token expired or invalid | Request a new token |
| 403 Forbidden | Insufficient GDB permissions | Contact GDB administrator |
| 429 Too Many Requests | Rate limit exceeded | Implement exponential backoff |

**Inspect tokens for debugging.** Decode the JWT at [jwt.io](https://jwt.io) to verify the `exp` (expiry), `sub` (subject), and `aud` (audience) claims.

---

## 4. Interoperability with External Systems

Beyond the GDB API, eRegistrations supports connecting BPA workflows to external systems. This allows automated data exchange during service processing — for example, verifying a business registration number against an external registry or submitting tax data to a revenue authority.

### 4.1 Direct API Integration

eRegistrations can consume external APIs (REST or SOAP) directly from within a BPA workflow:

1. **Import the API definition**: Upload a Swagger/OpenAPI file or WSDL describing the external service.
2. **Register the API in the BPA**: The imported definition makes the external service available as a callable endpoint within the platform.
3. **Define a Bot**: Create a Bot that executes the API call at a specific workflow step.

### 4.2 Service Bus (Mule ESB)

For integration scenarios that require data transformation, protocol conversion, or orchestration across multiple systems, eRegistrations uses **Mule ESB** as middleware:

- Creates connectors and data transformations between eRegistrations and external services
- Supports bidirectional data flow (both sending and receiving data)
- Allows analysts to get or send data at different points in a workflow
- Compatible with both Mule 3 and Mule 4 runtimes

Use the Service Bus when direct API integration is insufficient — for example, when the external system uses a non-standard protocol, when data must be transformed between incompatible schemas, or when a single workflow step must call multiple external systems.

### 4.3 Bot Integration

Bots are the primary mechanism for executing automated tasks within BPA workflows. A Bot runs at a specific workflow step and interacts with external services or generates documents.

#### Bot Types

| Type | Purpose | Example |
|------|---------|---------|
| **Data Bot** | Execute API calls to external systems | Verify a tax ID against the revenue authority |
| **Document Bot** | Generate PDF documents | Produce a registration certificate |
| **Internal Bot** | Perform internal platform operations | Copy data between workflow stages |

#### Bot Configuration

Each Bot is configured with:

- **External service endpoint**: Discovered via Swagger/OpenAPI definitions imported into the BPA
- **Input mappings**: Connect form fields to API request parameters
- **Output mappings**: Connect API response fields back to form fields

#### Integration Data Flow

The complete flow from configuration to runtime execution:

```
1. Analyst configures Bot in BPA
   - Selects external service endpoint
   - Maps form fields --> API request parameters (input)
   - Maps API response fields --> form fields (output)

2. Service is published
   - BPA generates Mule Flow XML from Bot configuration
   - Mule Flow is deployed to the Mule ESB runtime

3. Workflow execution reaches Bot step
   - Mule executes the API call with mapped input data
   - API response is received
   - Output mappings populate form fields for the next role

4. Next role sees the populated data
   - Reviewer can see data retrieved from external system
   - Workflow continues to the next step
```

This architecture allows analysts to integrate external services without writing code. The BPA handles the configuration, the publishing process generates the integration artifacts, and Mule handles the runtime execution.

---

## 5. GDB Data Management

The GDB provides built-in capabilities for data synchronization, schema migration, audit logging, notifications, and filtering.

### 5.1 Data Synchronization (Import/Export)

The GDB supports bulk data import and export in multiple formats:

| Format | Import | Export |
|--------|--------|--------|
| JSON | Yes | Yes |
| XLSX | Yes | Yes |
| CSV | Yes | Yes |

Synchronization operations run asynchronously via Celery:

1. Client submits an import/export request
2. GDB creates a job ticket and returns it immediately
3. A Celery worker processes the job in the background
4. Progress is tracked at 25%, 50%, 75%, and 100% (or -1 on failure)
5. Client polls the job ticket for status updates

The synchronization framework is extensible. New formats can be added by implementing the `SynchronizationBase` interface.

### 5.2 Data Migration

When a database schema changes, existing data must be migrated to the new version. The GDB handles this through a versioned migration system:

- **Schema versioning**: Each database schema is versioned. Old data is validated against the schema version under which it was created; new data is validated against the latest schema.
- **Migration templates**: Forward and backward migration logic is defined using Jinja2 templates.
- **On-the-fly migration**: When data is requested at a different schema version, the GDB applies migration templates automatically.
- **Bulk migration**: For large datasets, a Celery task migrates all records in the background.

### 5.3 Audit Logging

The GDB maintains a comprehensive, tamper-evident audit trail at three levels:

#### Entry-Level Audit (AuditLog)

Each data modification is recorded with:

| Field | Description |
|-------|-------------|
| `action` | CREATE, UPDATE, or DELETE |
| `user` | The authenticated user who performed the action |
| `data_type` | The database (register) affected |
| `data_id` | The specific record identifier |
| `timestamp` | When the action occurred |
| `diff_data` | Field-level differences (using the `dictdiffer` library) |

#### Tamper-Evident Chain

Each audit log entry includes a **blockchain hash**: the hash of each entry incorporates the hash of the previous entry. This creates a chain where any tampering with a historical record would break the hash chain, making unauthorized modifications detectable.

#### Field-Level Audit (AuditFieldLog)

For fast per-field history queries, the GDB also maintains `AuditFieldLog` records. These store individual field changes, enabling queries such as "show all changes to the `status` field of record X over time."

#### Audit Scope

| Scope | What Is Logged |
|-------|---------------|
| Database structure changes | Schema modifications, field additions/removals |
| Entry-level history | All CRUD operations on individual records |
| Full database history | Aggregated view of all changes across all records |

### 5.4 Notification System

The GDB supports both real-time and scheduled notifications:

- **Real-time broadcasts**: Delivered via ActiveMQ using the STOMP protocol (`StompClient`). Connected clients receive instant updates when data changes.
- **Scheduled reminders**: The `Reminder` model defines notifications with configurable filters, receiver lists (static users and dynamic groups), and frequencies. Celery Beat runs the `check_reminder_tasks` job every minute to evaluate and dispatch due reminders.

### 5.5 Data Filtering

The GDB provides a flexible filtering system for querying data:

#### Filter JSON Format

The frontend constructs filter queries as a JSON array:

```json
[
  {
    "gate": "&&",
    "field_id": 1,
    "logic": "icontains",
    "value": "Innovate"
  },
  {
    "gate": "||",
    "field_id": 2,
    "logic": "equals",
    "value": "Active"
  }
]
```

#### Filter Components

| Component | Description | Values |
|-----------|-------------|--------|
| `gate` | Logical operator combining this filter with the previous one | `&&` (AND), `\|\|` (OR) |
| `field_id` | The numeric ID of the field to filter on | Database-specific |
| `logic` | The comparison operator | `icontains`, `equals`, `gt`, `lt`, `gte`, `lte`, etc. |
| `value` | The value to compare against | Depends on field type |

The backend's `apply_filters` function routes each filter condition to the correct storage table based on the field type (`DataContentText`, `DataContentNumber`, `DataContentDate`, etc.).

---

## 6. GDB Hosting Requirements (Standalone)

When deploying the GDB as a standalone instance (separate from the main eRegistrations platform), the following server specifications apply:

| Configuration | CPU | RAM | Storage | Network |
|---------------|-----|-----|---------|---------|
| **Minimum** | 4 cores | 8 GB | 500 GB SSD | 25 Mbit, public IPv4 |
| **Recommended** | 8 cores | 16 GB | 1 TB SSD | 1 Gbit, public IPv4 + IPv6 |

Additional requirements:

- Operating system: Linux (Ubuntu 20.04+ or equivalent)
- Docker and Docker Compose installed
- Outbound internet access for container image pulls and Keycloak federation
- DNS records configured for the GDB domain
- TLS certificate for HTTPS termination

> **Note**: When the GDB is deployed as part of the full eRegistrations platform, its resource usage is included in the platform's overall hosting requirements. See [10 - Hosting Requirements](10-hosting-requirements.md) for full platform specifications.

---

## 7. Integration Architecture Summary

The following diagram shows how the integration components relate to each other:

```
External Systems            eRegistrations Platform              Data Stores
+------------------+    +-------------------------------+    +----------------+
|                  |    |                               |    |                |
| REST/SOAP APIs   |<-->|  Mule ESB (Service Bus)       |<-->| PostgreSQL     |
|                  |    |    |                           |    |                |
| Government       |    |    v                           |    | MongoDB        |
| registries       |    |  BPA (Bot Configuration)       |    |                |
|                  |    |    |                           |    | Redis          |
| Payment          |    |    v                           |    |                |
| gateways         |    |  DS (Workflow Execution)       |    | MinIO          |
|                  |    |    |                           |    |                |
+------------------+    |    v                           |    +----------------+
                        |  GDB (Data Storage & API)      |
+------------------+    |    |                           |    +----------------+
| Integration      |    |    v                           |    |                |
| Clients          |<-->|  Keycloak (Authentication)     |<-->| Keycloak DB    |
| (API consumers)  |    |                               |    |                |
+------------------+    +-------------------------------+    +----------------+
```

---

## 8. Quick Reference

### Authentication Flow

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Obtain JWT token | `POST /auth/realms/REALM_NAME/protocol/openid-connect/token` |
| 2 | Include token in request | `Authorization: Bearer <JWT>` |
| 3 | Handle 401 by re-authenticating | Same as Step 1 |

### Common GDB API Calls

| Task | Method | Endpoint |
|------|--------|----------|
| Create/modify database schema | POST | `/api/v1/database/modify` |
| Create data entry | POST | `/api/v1/data` |
| Read data (per database) | GET | `/data/{code}/{version}/read` |
| Create data (per database) | POST | `/data/{code}/{version}/create` |
| Query data views | GET | `/api/v1/data-view/{view-name}` |
| View API documentation | GET | `/api/docs/` |

### Error Code Reference

| HTTP Code | Meaning | Resolution |
|-----------|---------|------------|
| 200 | Success | Request completed normally |
| 401 | Unauthorized | Token missing, expired, or invalid. Re-authenticate. |
| 403 | Forbidden | Valid token but insufficient permissions. Contact GDB admin. |
| 429 | Too Many Requests | Rate limit reached. Implement exponential backoff. |
| 500 | Server Error | Check GDB backend logs: `docker-compose logs gdb-backend` |

---

## 9. Next Steps

- **Configure services that use integrations**: See [04 - Configuration](04-configuration.md) for BPA Bot setup and external service registration.
- **Secure your integration endpoints**: See [05 - Security](05-security.md) for TLS configuration, credential management, and network policies.
- **Monitor integration health**: See [06 - Maintenance](06-maintenance.md) for log monitoring and Mule ESB health checks.
- **Debug integration failures**: See [07 - Troubleshooting](07-troubleshooting.md) for diagnosing Bot execution errors and API connectivity issues.

---

*Previous: [07 - Troubleshooting](07-troubleshooting.md) | Next: [09 - Localization](09-localization.md)*
