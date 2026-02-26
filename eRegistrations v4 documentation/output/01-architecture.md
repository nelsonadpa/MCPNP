# eRegistrations v4 Architecture Reference

**Version**: 4.0
**Audience**: System architects, backend developers, DevOps engineers, project managers
**Prerequisites**: Familiarity with [00 - Overview](00-overview.md)

---

## 1. Architecture Principles

The eRegistrations platform follows these design principles:

1. **Microservice architecture** -- Each concern is handled by an independent service with a well-defined API.
2. **No-code configuration** -- Business analysts configure services through the BPA UI. No developer involvement is needed for routine changes.
3. **Open-source stack** -- Every component is open-source. No commercial licenses are required.
4. **Containerized deployment** -- All services run in Docker containers, orchestrated via Docker Compose or Docker Swarm.
5. **Separation of design and delivery** -- Configuration (BPA) and public delivery (DS) are independent subsystems connected through a publish pipeline.

---

## 2. High-Level System Diagram

The platform has three main subsystems -- BPA, DS, and GDB -- plus a set of shared infrastructure services.

```
                            +---[ HAProxy (HTTPS termination + routing) ]---+
                            |                                                |
          +-----------------+------------------+-----------------------------+
          |                                    |                             |
          v                                    v                             v
+-------------------+               +-------------------+          +-------------------+
|   BPA Frontend    |               |   DS Frontend     |          |   GDB Frontend    |
|   (Angular SPA)   |               |   (Django views)  |          |   (React SPA)     |
+---------+---------+               +---------+---------+          +---------+---------+
          |                                   |                              |
          v                                   v                              v
+---------+---------+               +---------+---------+          +---------+---------+
|   BPA Backend     |               |   DS Backend      |          |   GDB Backend     |
| Java / Spring Boot|               | Python / Django   |          | Python / Django   |
|                   |               |                   |          | + Celery workers  |
| +-- API ---------+|               | +-- AuthService --+|          | +-- API ---------+|
| +-- BPMN gen ----+|               | +-- CamundaClient +|          | +-- Authorization+|
| +-- FormIO gen --+|               | +-- FormIOClient -+|          | +-- Logging -----+|
| +-- Determinant -+|               | +-- Payments -----+|          | +-- Tasks -------+|
| +-- BOT gen -----+|               +---------+---------+          +---------+---------+
| +-- Translations +|                         |                              |
| +-- Websocket ---+|                         |                              |
+---------+---------+                         |                              |
          |                                   |                              |
          +----------------+------------------+-----+------------------------+
                           |                        |
                   +-------v--------+       +-------v--------+
                   |  PostgreSQL    |       |  MongoDB       |
                   | (relational   |       | (via RestHeart)|
                   |  data store)  |       | (document      |
                   +---------------+       |  store)        |
                                           +----------------+
```

### Shared Infrastructure Services

```
+-------------+  +----------+  +---------+  +-----------+  +----------+
|  Keycloak   |  | Camunda  |  | Form.io |  | RestHeart |  | ActiveMQ |
| (auth/OIDC) |  | (BPMN)   |  | (forms) |  | (MongoDB  |  | (message |
|             |  |          |  |         |  |  REST API) |  |  queue)  |
+-------------+  +----------+  +---------+  +-----------+  +----------+

+----------+  +----------+  +---------+  +--------+  +-------+  +-------+
|   Mule   |  | Graylog  |  |OpenSearch| |  Redis  |  | MinIO |  |ClamAV |
| (ESB/    |  | (logs)   |  | (search)|  | (cache) |  |(files)|  |(A/V)  |
| bots)    |  |          |  |         |  |         |  |       |  |       |
+----------+  +----------+  +---------+  +--------+  +-------+  +-------+
```

---

## 3. BPA (Business Process Analyzer) Architecture

The BPA is the administrative subsystem where analysts design and configure services.

### 3.1 BPA Frontend

| Property | Value |
|----------|-------|
| Framework | Angular (SPA) |
| Users | Analysts, administrators |
| Access | `https://bpa.YOUR_DOMAIN` |

The Angular application provides the configuration interface. It communicates with the BPA Backend through REST API calls.

### 3.2 BPA Backend

| Property | Value |
|----------|-------|
| Language | Java |
| Framework | Spring Boot |
| Database | PostgreSQL |
| Container | `bpa-backend` |

The BPA Backend is a single Spring Boot application organized into internal modules. Each module handles a specific domain.

#### Internal Modules

| Module | Responsibility |
|--------|---------------|
| **API** | REST controller. Exposes endpoints for all BPA entities (services, registrations, determinants, forms, bots, etc.). |
| **BPMN Generator** | Generates BPMN 2.0 XML process definitions from the service configuration. Deploys them to Camunda during publish. |
| **FormIO Generator** | Generates Form.io JSON schemas from determinant definitions. Deploys them to the Form.io service during publish. |
| **Determinant** | Manages determinants (form fields with business logic). Supports types: text, numeric, boolean, date, select, classification, grid. |
| **BOT Generator** | Generates bot configuration schemas. Bots are automated workflow steps that call external systems via Mule. |
| **Translations** | Manages entity and label translations. Integrates with an optional global translation service. |
| **Websocket** | Sends real-time notifications to connected BPA Frontend clients when data changes. |

#### BPA Backend -- Component Diagram

```
+------------------------------------------------------------------+
|                       BPA Backend (Spring Boot)                   |
|                                                                   |
|  +--------+   +----------+   +-----------+   +---------------+   |
|  |  API   |   |  BPMN    |   |  FormIO   |   | Determinant   |   |
|  | (REST  |   | Generator|   | Generator |   | Engine        |   |
|  |  ctrl) |   |          |   |           |   |               |   |
|  +---+----+   +----+-----+   +-----+-----+   +-------+-------+   |
|      |             |               |                  |           |
|  +---+----+   +----+-----+   +-----+-----+                      |
|  |  BOT   |   |Translations|  | Websocket |                      |
|  |Generator|   |           |  |           |                      |
|  +--------+   +-----------+  +-----------+                      |
+------------------------------------------------------------------+
       |              |               |              |
       v              v               v              v
  PostgreSQL      Camunda         Form.io       RestHeart
                                              (MongoDB)
```

### 3.3 BPA External Dependencies

| External Service | Protocol | Purpose |
|-----------------|----------|---------|
| **PostgreSQL** | JDBC | Stores all BPA configuration data (services, determinants, forms, roles, etc.) |
| **Keycloak** | OpenID Connect | Authenticates BPA users. Admin users are managed in a dedicated Keycloak realm. |
| **ActiveMQ** | JMS | Sends publish notifications to downstream services. |
| **Form.io** | HTTP/REST | Receives generated form schemas during publish. |
| **Camunda** | HTTP/REST | Receives generated BPMN process definitions during publish. |
| **RestHeart** | HTTP/REST | Stores catalogs, bot configurations, and entity translation definitions in MongoDB. |
| **Global Translation Service** | HTTP/REST | (Optional) Synchronizes translations across instances. |
| **External Websocket Service** | WebSocket | (Optional) Manages concurrent client data for collaborative editing. |

### 3.4 BPA REST API -- Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/service` | List all configured services |
| `POST` | `/service` | Create a new service |
| `GET` | `/service/{id}` | Get service details |
| `POST` | `/service/{id}/publish` | Publish a service to production |
| `POST` | `/download_service/{service_id}` | Export a service as a portable package |
| `POST` | `/upload_service` | Import a service from a package |
| `GET` | `/mule/services` | List available Mule ESB services |

The API follows REST conventions. Responses are JSON. Authentication is via Bearer token (JWT from Keycloak).

---

## 4. DS (Display System) Architecture

The DS is the public-facing application where citizens and officers interact with published services.

### 4.1 DS Frontend

| Property | Value |
|----------|-------|
| Framework | Django (server-rendered views) |
| Users | Citizens (Part A), Government officers (Part B) |
| Access | `https://services.YOUR_DOMAIN` |
| Container | `ereg-cms-frontend` |

The DS has two sections:

| Section | Audience | Purpose |
|---------|----------|---------|
| **Part A** | Citizens / Applicants | Public portal. Browse services, create applications, fill forms, upload documents, make payments, track status. |
| **Part B** | Government officers | Back-office portal. Review applications, approve/reject, complete workflow tasks, issue certificates. |

### 4.2 DS Backend

| Property | Value |
|----------|-------|
| Language | Python |
| Framework | Django |
| Database | PostgreSQL |

#### Key Internal Components

| Component | Responsibility |
|-----------|---------------|
| **AuthService** | Abstract authentication base with concrete implementations for Keycloak (OIDC) and CAS. Uses factory pattern for provider switching. |
| **Service Model** | Syncs service definitions from RestHeart. Represents the catalog of available services. |
| **File Model** | Tracks individual application cases. Each application is a "file" with states: `NEW`, `IN_PROCESS`, `ENDED`. |
| **CamundaRestClient** | Communicates with the Camunda engine to start processes, query tasks, and complete workflow steps. |
| **FormIOClient** | Fetches form schemas from the Form.io service. Uses Redis caching to reduce latency. |
| **Payment Integration** | Modular payment processing. Supported providers include FedaPay, iVeri, and Pesaflow. New providers can be added. |

#### DS Backend -- Component Diagram

```
+------------------------------------------------------------------+
|                     DS Backend (Django)                           |
|                                                                   |
|  +-------------+   +---------------+   +---------------------+   |
|  | AuthService |   | Service Model |   | File Model          |   |
|  | (Keycloak / |   | (sync from    |   | (application cases) |   |
|  |  CAS)       |   |  RestHeart)   |   | NEW > IN_PROCESS >  |   |
|  +------+------+   +-------+-------+   |       ENDED         |   |
|         |                  |            +----------+----------+   |
|  +------+------+   +-------+-------+              |              |
|  | FormIO      |   | Camunda       |   +----------+----------+   |
|  | Client      |   | REST Client   |   | Payment Integration |   |
|  | (+Redis     |   |               |   | (FedaPay, iVeri,    |   |
|  |  caching)   |   |               |   |  Pesaflow)          |   |
|  +-------------+   +---------------+   +---------------------+   |
+------------------------------------------------------------------+
       |          |           |              |            |
       v          v           v              v            v
   Keycloak   Form.io     Camunda      PostgreSQL   RestHeart
                                                    (MongoDB)
```

### 4.3 DS External Dependencies

| External Service | Protocol | Purpose |
|-----------------|----------|---------|
| **PostgreSQL** | SQL (Django ORM) | Stores application files, user profiles, and session data. |
| **Keycloak** | OpenID Connect | Authenticates citizens and officers. |
| **Camunda** | HTTP/REST | Executes and queries BPMN workflow processes. |
| **Form.io** | HTTP/REST | Provides form schemas for rendering dynamic forms. |
| **RestHeart** | HTTP/REST | Provides service catalog definitions synced from BPA. |
| **Redis** | TCP | Caches Form.io schemas and session data. |
| **ClamAV** | TCP (clamd) | (Optional) Scans uploaded files for viruses. |
| **MinIO** | S3 API | Stores user-uploaded documents and generated certificates. |
| **Payment providers** | HTTPS | Processes online payments (provider-dependent). |

---

## 5. GDB (Government Database) Architecture

The GDB is the central data repository. It stores structured government data (companies, persons, licenses) and provides a secured API for querying and managing records.

### 5.1 GDB Frontend

| Property | Value |
|----------|-------|
| Framework | React (SPA) |
| Users | Data administrators, government officers |
| Access | `https://gdb.YOUR_DOMAIN` |

### 5.2 GDB Backend -- Django Framework

| Property | Value |
|----------|-------|
| Language | Python |
| Framework | Django |
| Database | PostgreSQL |

The GDB backend has two processing layers: a synchronous Django layer and an asynchronous Celery layer.

#### Django Layer (Synchronous)

| Component | Responsibility |
|-----------|---------------|
| **API** | Django REST controller. Provides CRUD endpoints for all GDB entities. Secured by JWT tokens. |
| **Authorization** | Fine-grained user rights management. Permissions can be set down to individual database fields. |
| **Logging** | All data changes and schema modifications are logged with full audit trail. |
| **Database** | Schema and data management. Supports dynamic schema creation (no-code). Uses JSON Schema for field definitions. |
| **Translation** | Manages translated labels and messages for GDB entities. |
| **Notification** | Sends notifications for new API activity, published translations, and service count changes. |

#### Celery Layer (Asynchronous)

| Component | Responsibility |
|-----------|---------------|
| **Task** | Manages triggers, data import, and data export jobs. |
| **Synchronize** | Handles trigger execution, export, and import of data between systems. |
| **Translation** | Pulls translations from the global translation service. |
| **Database** | Performs long-running operations: delete, copy, and migrate data. |
| **Audit Log** | Analyzes data for compliance and reporting. |

#### GDB Backend -- Component Diagram

```
+------------------------------------------------------------------+
|                      GDB Backend                                  |
|                                                                   |
|  +--------------------  Django Framework  --------------------+   |
|  |                                                            |   |
|  |  +-------+  +---------------+  +----------+  +---------+  |   |
|  |  |  API  |  | Authorization |  | Logging  |  |Database |  |   |
|  |  | (JWT) |  | (field-level) |  | (audit)  |  |(schema) |  |   |
|  |  +-------+  +---------------+  +----------+  +---------+  |   |
|  |  +-------------+  +---------------+                        |   |
|  |  | Translation |  | Notification  |                        |   |
|  |  +-------------+  +---------------+                        |   |
|  +------------------------------------------------------------+   |
|                                                                   |
|  +--------------------  Celery Framework  --------------------+   |
|  |                                                            |   |
|  |  +------+  +-------------+  +-------------+  +----------+ |   |
|  |  | Task |  | Synchronize |  | Translation |  | Database | |   |
|  |  +------+  +-------------+  +-------------+  +----------+ |   |
|  |  +-----------+                                             |   |
|  |  | Audit Log |                                             |   |
|  |  +-----------+                                             |   |
|  +------------------------------------------------------------+   |
+------------------------------------------------------------------+
       |         |           |          |           |
       v         v           v          v           v
  PostgreSQL   Redis    Keycloak   ActiveMQ    RestHeart
                                  (optional)  (optional)
```

### 5.3 GDB External Dependencies

| External Service | Protocol | Purpose |
|-----------------|----------|---------|
| **PostgreSQL** | SQL (Django ORM) | Primary data store for all GDB records and schemas. |
| **Redis** | TCP | Cache layer for frequently accessed data and Celery task broker. |
| **Keycloak** | OpenID Connect | Authenticates GDB users and validates JWT tokens. |
| **ActiveMQ** | JMS/STOMP | (Optional) Message queue for inter-service notifications. |
| **RestHeart** | HTTP/REST | (Optional) Alternative data access layer via MongoDB. |
| **ClamAV** | TCP (clamd) | (Optional) Antivirus scanning for uploaded files. |
| **Global Translation Service** | HTTP/REST | (Optional) Synchronizes translations across instances. |

---

## 6. Shared Infrastructure Services

These services are used by multiple subsystems.

### 6.1 Keycloak (Authentication)

| Property | Value |
|----------|-------|
| Technology | Java |
| Protocol | OpenID Connect / OAuth 2.0 |
| Access | `https://login.YOUR_DOMAIN` |
| Admin UI | `https://login.YOUR_DOMAIN/auth/admin/master/console/` |

Keycloak manages all user identities and authentication flows. Each subsystem (BPA, DS, GDB) is registered as a client in the appropriate Keycloak realm. Users authenticate via browser-based OIDC flows and receive JWT tokens.

### 6.2 Camunda (Workflow Engine)

| Property | Value |
|----------|-------|
| Technology | Java |
| Protocol | REST API |
| Internal port | 8090 |
| Container | `camunda` |
| Admin UI | `localhost:6009/app/cockpit/default/#/dashboard` |

Camunda executes the BPMN process definitions generated by the BPA. When a citizen submits an application, the DS starts a Camunda process. Each workflow step (review, approve, reject, bot execution) is a Camunda task.

### 6.3 Form.io (Form Engine)

| Property | Value |
|----------|-------|
| Technology | Node.js |
| Protocol | REST API |
| Internal port | 3001 |
| Container | `formio` |

Form.io stores and serves form schema definitions. The BPA generates these schemas from determinant configurations and deploys them during publish. The DS fetches schemas at runtime to render dynamic forms in the browser.

### 6.4 RestHeart (MongoDB REST API)

| Property | Value |
|----------|-------|
| Technology | Java |
| Protocol | REST API over MongoDB |

RestHeart provides a REST interface to MongoDB. It stores:
- Service catalog definitions (synced to DS)
- Bot configurations
- Entity translation definitions
- Classification data

### 6.5 ActiveMQ (Message Queue)

| Property | Value |
|----------|-------|
| Technology | Java (Apache ActiveMQ) |
| Protocol | JMS / STOMP |
| Admin UI | `localhost:8161/admin/queues.jsp` |

ActiveMQ handles asynchronous messaging between services. Primary use case: the BPA sends a publish notification via ActiveMQ, which triggers downstream services to sync new configurations.

### 6.6 Mule ESB (Service Bus)

| Property | Value |
|----------|-------|
| Technology | Java (MuleSoft) |
| Protocol | HTTP/REST, SOAP |

Mule acts as the integration layer for external systems. Bot workflow steps call external APIs (government registries, tax systems, payment gateways) through Mule flows. The BPA generates Mule flow configurations during publish.

### 6.7 Supporting Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| **HAProxy** | C | HTTPS termination and request routing to Docker containers |
| **Graylog** | Java | Centralized log collection, search, and alerting |
| **OpenSearch** | Java (port 9200) | Search and analytics engine used by Graylog |
| **Redis** | C | In-memory cache (Form.io schemas, sessions, Celery broker) |
| **MinIO** | Go | S3-compatible object storage for uploaded files |
| **ClamAV** | C | Antivirus scanning for user uploads |
| **Zabbix** | C/PHP | Infrastructure monitoring and alerting |

---

## 7. Data Flow Architecture

This section describes the end-to-end data flow, from service configuration to citizen interaction.

### 7.1 Complete Data Flow Diagram

```
+-------------------+
|  1. CONFIGURE     |    Analyst designs service in the BPA:
|  (BPA)            |    - Forms (determinants)
|                   |    - Workflow (roles + statuses)
+--------+----------+    - Requirements, costs, bots
         |
         v
+--------+----------+
|  2. PUBLISH       |    BPA generates and deploys artifacts:
|  (BPA -> targets) |    - Form.io schemas   --> Form.io
|                   |    - BPMN XML          --> Camunda
+--------+----------+    - Bot configs        --> RestHeart
         |               - Mule flows         --> Mule ESB
         v               - Service catalog    --> RestHeart
+--------+----------+
|  3. SYNCHRONIZE   |    DS syncs service catalog from RestHeart.
|  (RestHeart -> DS)|    New/updated services become available
+--------+----------+    in the citizen portal.
         |
         v
+--------+----------+
|  4. CITIZEN FLOW  |    Citizen interacts with the DS:
|  (DS Part A)      |    - Login (Keycloak)
|                   |    - Browse service catalog
+--------+----------+    - Create application file
         |               - Fill form (Form.io schema)
         v               - Upload documents
+--------+----------+    - Make payment
|  5. SUBMIT        |    - Submit application
|  (DS -> Camunda)  |    DS starts a Camunda BPMN process.
+--------+----------+    Application state: NEW -> IN_PROCESS
         |
         v
+--------+----------+
|  6. OFFICER FLOW  |    Officer interacts with DS Part B:
|  (DS Part B)      |    - Login (Keycloak)
|                   |    - View assigned Camunda tasks
+--------+----------+    - Review application
         |               - Approve / reject / request changes
         v               - Complete task -> advance workflow
+--------+----------+
|  7. BOT EXECUTION |    Automated steps in the workflow:
|  (Camunda -> Mule)|    - Camunda triggers bot tasks
|                   |    - Bots call external APIs via Mule
+--------+----------+    - Results feed back into the process
         |
         v
+--------+----------+
|  8. COMPLETION    |    Process reaches end state:
|  (DS)             |    - Application state: IN_PROCESS -> ENDED
|                   |    - Certificates/documents generated
+-------------------+    - Citizen notified
```

### 7.2 Publishing Pipeline (Detailed Sequence)

When an analyst clicks "Publish" in the BPA, the following sequence executes:

```
  BPA Backend          Form.io        Camunda       RestHeart      Mule       ActiveMQ
      |                   |              |              |            |            |
      |  1. Generate Form.io schemas    |              |            |            |
      |------------------>|              |              |            |            |
      |  2. Deploy schemas|              |              |            |            |
      |  (POST /form)     |              |              |            |            |
      |<-- OK ------------|              |              |            |            |
      |                   |              |              |            |            |
      |  3. Generate BPMN XML           |              |            |            |
      |----------------------------->   |              |            |            |
      |  4. Deploy process definition   |              |            |            |
      |  (POST /deployment/create)      |              |            |            |
      |<-- OK --------------------------|              |            |            |
      |                   |              |              |            |            |
      |  5. Generate bot configs + catalog             |            |            |
      |----------------------------------------------->|            |            |
      |  6. Store in MongoDB (via REST)                |            |            |
      |<-- OK ------------------------------------------|            |            |
      |                   |              |              |            |            |
      |  7. Generate Mule flow configs                 |            |            |
      |-------------------------------------------------------->   |            |
      |  8. Deploy integration flows                   |            |            |
      |<-- OK --------------------------------------------------|            |
      |                   |              |              |            |            |
      |  9. Send publish notification                  |            |            |
      |--------------------------------------------------------------------->  |
      |                   |              |              |            |         notify
      |                   |              |              |            |       downstream
```

**Step-by-step breakdown:**

1. **Generate Form.io schemas** -- The FormIO Generator reads the service's determinant definitions and converts them into Form.io-compatible JSON schemas. One schema is created per role view.
2. **Deploy to Form.io** -- The generated schemas are sent to the Form.io service via its REST API. Form.io stores them for runtime rendering.
3. **Generate BPMN XML** -- The BPMN Generator reads the service's role and status definitions and produces a BPMN 2.0 XML process definition. This includes user tasks, service tasks (bots), gateways, and sequence flows.
4. **Deploy to Camunda** -- The BPMN XML is deployed to the Camunda engine via its deployment REST API. Camunda parses and validates the process definition.
5. **Generate bot configs and service catalog** -- The BOT Generator produces configuration objects for each bot in the service. The service catalog entry is also generated.
6. **Store in RestHeart/MongoDB** -- Bot configurations, the service catalog entry, classification data, and translation definitions are stored in MongoDB via RestHeart's REST API.
7. **Generate Mule flow configs** -- For bots that call external systems, the BPA generates Mule ESB flow configurations.
8. **Deploy to Mule** -- The flow configurations are deployed to the Mule ESB runtime.
9. **Send publish notification** -- A message is sent to ActiveMQ notifying downstream services (DS, GDB) that a new version of the service is available.

### 7.3 Authentication Flow

All three subsystems use the same authentication pattern via Keycloak.

```
  Browser          Application        Keycloak
     |                  |                 |
     | 1. Click Login   |                 |
     |----------------->|                 |
     |                  |                 |
     | 2. Redirect to Keycloak login page |
     |<------------------------------------|
     |                  |                 |
     | 3. User enters credentials         |
     |------------------------------------>|
     |                  |                 |
     | 4. Keycloak validates, redirects   |
     |    back with authorization code    |
     |<------------------------------------|
     |                  |                 |
     | 5. Forward code  |                 |
     |----------------->|                 |
     |                  | 6. Exchange code|
     |                  |    for tokens   |
     |                  |---------------->|
     |                  |                 |
     |                  | 7. JWT access   |
     |                  |    token        |
     |                  |<----------------|
     |                  |                 |
     | 8. Set session,  |                 |
     |    show app      |                 |
     |<-----------------|                 |
```

The DS supports two authentication providers through its abstract `AuthService`:
- **AuthKeycloakService** -- Default. Uses OpenID Connect.
- **AuthCasService** -- Alternative. Uses CAS protocol.

The active provider is selected by configuration. The application code is unchanged.

---

## 8. Docker Network and Container Architecture

All services run as Docker containers on a shared network.

### 8.1 Network Configuration

| Property | Value |
|----------|-------|
| Network type | Docker bridge |
| Default subnet | `172.18.0.0/16` |
| DNS resolution | Container names resolve within the network |

### 8.2 Key Containers

| Container Name | Service | Internal Port |
|---------------|---------|--------------|
| `bpa-backend` | BPA Backend (Java/Spring Boot) | 8080 |
| `ereg-cms-frontend` | Display System (Django) | 8000 |
| `formio` | Form.io (Node.js) | 3001 |
| `camunda` | Camunda (Java) | 8090 |
| `opensearch-node1` | OpenSearch | 9200 |
| `keycloak` | Keycloak (Java) | 8080 |
| `restheart` | RestHeart (Java) | 8080 |
| `activemq` | ActiveMQ (Java) | 61616 / 8161 |
| `redis` | Redis | 6379 |
| `postgres` | PostgreSQL | 5432 |
| `mongodb` | MongoDB | 27017 |

### 8.3 Request Routing

HAProxy sits in front of all containers and routes requests based on the domain name.

```
                     Internet
                        |
                   [ HAProxy ]
                   (HTTPS:443)
                        |
        +-------+-------+-------+-------+
        |       |       |       |       |
        v       v       v       v       v
      bpa.*  services.* login.* gdb.*  stats.*
        |       |       |       |       |
        v       v       v       v       v
     bpa-    ereg-cms  keycloak gdb    analytics
     backend frontend          backend dashboard
```

HAProxy handles:
- TLS/HTTPS termination (all internal traffic is HTTP)
- Domain-based routing to the correct container
- Load balancing (when multiple replicas are deployed)
- Health checks for backend containers

---

## 9. Internal Service Configuration

The BPA Backend uses environment variables to locate other services.

### 9.1 Key Configuration Parameters

| Configuration Key | Environment Variable | Default Value | Description |
|-------------------|---------------------|---------------|-------------|
| `formio.url` | `FORMIO_URL` | `http://formio:3001` | Form.io service URL |
| `camunda.url` | `CAMUNDA_URL` | `http://camunda:8090` | Camunda engine URL |
| `system.default-language` | `DEFAULT_LANGUAGE` | `en` | Default system language |
| `keycloak.auth-server-url` | `KEYCLOAK_URL` | `http://keycloak:8080/auth` | Keycloak base URL |
| `spring.datasource.url` | `DATABASE_URL` | `jdbc:postgresql://postgres:5432/bpa` | PostgreSQL connection |
| `restheart.url` | `RESTHEART_URL` | `http://restheart:8080` | RestHeart API URL |
| `activemq.broker-url` | `ACTIVEMQ_URL` | `tcp://activemq:61616` | ActiveMQ broker URL |

All service URLs use Docker container names as hostnames. Docker DNS resolves them within the network.

---

## 10. Administrative Interfaces

The following web interfaces are available for system administration.

| URL | Purpose | Audience |
|-----|---------|----------|
| `https://bpa.YOUR_DOMAIN` | BPA -- Service configuration | Analysts |
| `https://bpa.YOUR_DOMAIN/settings` | BPA instance settings | Administrators |
| `https://services.YOUR_DOMAIN` | Display System -- Citizen portal | Citizens |
| `https://services.YOUR_DOMAIN/admin/` | Django admin for the DS | Administrators |
| `https://login.YOUR_DOMAIN/auth/admin/master/console/` | Keycloak admin console | Administrators |
| `https://gdb.YOUR_DOMAIN` | GDB -- Government database | Data administrators |
| `localhost:9000` | Portainer -- Docker container management | DevOps |
| `localhost:8161/admin/queues.jsp` | ActiveMQ -- Message queue dashboard | DevOps |
| `localhost:6009/app/cockpit/default/#/dashboard` | Camunda Cockpit -- Workflow monitoring | DevOps |

> **Note**: `localhost` URLs are only accessible from the server itself (or via SSH tunnel). Public URLs require valid DNS records and HAProxy configuration.

---

## 11. Domain Model -- Key Entities

### 11.1 BPA Domain Model

The BPA's data model is centered on the **Service** entity.

```
Service
  |
  +-- Registration (1:N)     -- A permit/license type within the service
  |     |
  |     +-- Institution       -- The government agency issuing the registration
  |
  +-- Role (1:N)             -- Participant types (applicant, reviewer, approver)
  |     |
  |     +-- Status (1:N)     -- Workflow states per role
  |     +-- Form (1:1)       -- The form view for this role
  |           |
  |           +-- Component (1:N)  -- Form sections and fields
  |
  +-- Determinant (1:N)      -- Form fields with business logic
  |     Types: text, numeric, boolean, date, select, classification, grid
  |
  +-- Bot (1:N)              -- Automated workflow steps
  |     |
  |     +-- Input Mapping    -- Maps service fields to bot inputs
  |     +-- Output Mapping   -- Maps bot outputs to service fields
  |
  +-- Document Requirement   -- Required document uploads
  +-- Cost                   -- Fees (fixed or formula-based)
  +-- Notification           -- Email/SMS templates
  +-- Print Document         -- Certificate/output document templates
  +-- Classification         -- Lookup tables / catalogs
  +-- Message                -- User-facing text messages
```

### 11.2 DS Domain Model

The DS data model is centered on the **File** (application case).

```
File (Application Case)
  |
  +-- State: NEW --> IN_PROCESS --> ENDED
  |
  +-- Service (FK)          -- Which service this application belongs to
  +-- User (FK)             -- The citizen who created it
  +-- Form submissions      -- Completed form data (stored as JSON)
  +-- Uploaded documents    -- Files stored in MinIO
  +-- Payment records       -- Payment transactions
  +-- Camunda process ID    -- Links to the running workflow instance
```

### 11.3 GDB Domain Model

The GDB uses a dynamic schema approach.

```
DatabaseCatalog
  |
  +-- name: "Company Registry"
  +-- code: "COMPANIES"
  |
  +-- Database (1:N)        -- Versioned schema instances
        |
        +-- version: 1.0
        +-- schema: { JSON Schema definition }
        |
        +-- Records (1:N)  -- Actual data rows
              |
              +-- Validated against the schema version
              +-- Field-level authorization
              +-- Full audit log
```

---

## 12. Security Architecture

### 12.1 Authentication and Authorization

| Layer | Mechanism |
|-------|-----------|
| **Identity** | Keycloak (OIDC / OAuth 2.0). All users authenticate through Keycloak. |
| **Tokens** | JWT access tokens. Short-lived. Validated by each service. |
| **Roles** | Keycloak realm roles map to application permissions. |
| **Field-level auth** | GDB supports authorization down to individual database fields. |

### 12.2 Network Security

| Layer | Mechanism |
|-------|-----------|
| **TLS** | HAProxy terminates HTTPS (TLS 1.2+). Internal traffic is HTTP over Docker network. |
| **Network isolation** | Docker bridge network. Services are not directly exposed to the internet. |
| **Firewall** | Only ports 80 and 443 are exposed. Admin UIs are localhost-only. |

### 12.3 Data Security

| Layer | Mechanism |
|-------|-----------|
| **Antivirus** | ClamAV scans all uploaded files. |
| **Audit logging** | BPA and GDB log all data modifications with timestamps and user IDs. |
| **reCAPTCHA** | Google reCAPTCHA protects public forms from automated submissions. |
| **Encryption at rest** | Depends on server-level disk encryption (recommended). |

---

## 13. Technology Stack Reference

| Layer | Technology | Version Notes |
|-------|-----------|---------------|
| **Languages** | Java, Python, Node.js, JavaScript/TypeScript | |
| **BPA Backend** | Spring Boot (Java) | |
| **DS Backend** | Django (Python) | |
| **GDB Backend** | Django + Celery (Python) | |
| **BPA Frontend** | Angular | SPA |
| **GDB Frontend** | React | SPA |
| **DS Frontend** | Django templates | Server-rendered |
| **Relational DB** | PostgreSQL | Used by BPA, DS, GDB |
| **Document DB** | MongoDB (via RestHeart) | Catalogs, bots, translations |
| **Cache** | Redis | Form schemas, sessions, Celery broker |
| **Search** | OpenSearch | Used by Graylog |
| **Object Storage** | MinIO | User uploads, certificates |
| **Auth** | Keycloak | OIDC / OAuth 2.0 |
| **Workflow** | Camunda | BPMN 2.0 |
| **Forms** | Form.io | JSON-schema-based |
| **Integration** | Mule ESB | REST / SOAP |
| **Messaging** | ActiveMQ | JMS / STOMP |
| **Reverse Proxy** | HAProxy | HTTPS termination |
| **Monitoring** | Zabbix | Infrastructure metrics |
| **Logging** | Graylog + OpenSearch | Centralized logs |
| **Antivirus** | ClamAV | File scanning |
| **Containers** | Docker, Docker Compose, Docker Swarm | |

---

## 14. Deployment Topology

### 14.1 Single-Server Deployment (Standard)

For most installations, all services run on a single server.

```
+---------------------------------------------------------------+
|                     Production Server                          |
|                                                                |
|  [ HAProxy ] --> [ BPA ] [ DS ] [ GDB ]                       |
|                  [ Keycloak ] [ Camunda ] [ Form.io ]          |
|                  [ PostgreSQL ] [ MongoDB ] [ Redis ]          |
|                  [ RestHeart ] [ ActiveMQ ] [ Mule ]           |
|                  [ Graylog ] [ OpenSearch ] [ MinIO ]          |
|                  [ ClamAV ] [ Zabbix ]                         |
|                                                                |
|  Docker Compose / Docker Swarm                                 |
+---------------------------------------------------------------+
```

### 14.2 Multi-Server Deployment (High Availability)

For larger installations, services can be distributed across servers.

```
+---------------------------+     +---------------------------+
|     Application Server    |     |     Database Server       |
|                           |     |                           |
| [ HAProxy ]               |     | [ PostgreSQL ]            |
| [ BPA ] [ DS ] [ GDB ]   |     | [ MongoDB ]               |
| [ Keycloak ] [ Camunda ]  |     | [ Redis ]                 |
| [ Form.io ] [ Mule ]     |     | [ OpenSearch ]            |
| [ RestHeart ] [ ActiveMQ ]|     |                           |
+---------------------------+     +---------------------------+
```

### 14.3 Domain Configuration

| Subdomain | Routed To | Purpose |
|-----------|-----------|---------|
| `YOUR_DOMAIN` | Static site / landing page | Public homepage |
| `services.YOUR_DOMAIN` | DS container | Citizen and officer portal |
| `login.YOUR_DOMAIN` | Keycloak container | Authentication |
| `bpa.YOUR_DOMAIN` | BPA container | Service configuration |
| `gdb.YOUR_DOMAIN` | GDB container | Government database |
| `stats.YOUR_DOMAIN` | Analytics container | Usage statistics |
| `graylog.YOUR_DOMAIN` | Graylog container | Log management |
| `admin-home.YOUR_DOMAIN` | Admin home container | Admin landing page |

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **BPA** | Business Process Analyzer. The administrative tool for configuring services. |
| **DS** | Display System. The public-facing application for citizens and officers. |
| **GDB** | Government Database. The central data repository. |
| **Service** | A configured business process (e.g., "Business License Application"). |
| **Registration** | A specific permit or license type within a service. |
| **Institution** | A government agency that issues registrations. |
| **Determinant** | A form field with attached business logic (visibility rules, validations). |
| **Bot** | An automated workflow step that calls an external system. |
| **Role** | A participant type in a workflow (applicant, reviewer, approver). |
| **Status** | A workflow state within a role (e.g., "Pending Review", "Approved"). |
| **File** | An individual application case submitted by a citizen. |
| **BPMN** | Business Process Model and Notation. Standard for workflow definitions. |
| **Form.io** | A form engine that renders forms from JSON schema definitions. |
| **Camunda** | A workflow engine that executes BPMN process definitions. |
| **RestHeart** | A REST API layer over MongoDB. |
| **Mule ESB** | An enterprise service bus for external system integration. |
| **HAProxy** | A reverse proxy and load balancer that handles HTTPS termination. |
| **JWT** | JSON Web Token. Used for authentication between services. |
| **OIDC** | OpenID Connect. The authentication protocol used by Keycloak. |

---

*Previous: [00 - Overview](00-overview.md) | Next: [02 - Installation](02-installation.md)*
