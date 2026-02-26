# eRegistrations v4 Platform Overview

**Version**: 4.0
**Audience**: Technical administrators, project managers, government counterparts
**Status**: Production-ready

---

## 1. What Is eRegistrations?

eRegistrations is a **no-code development platform** for building e-government applications. It allows government agencies to digitize public services — such as business registration, licensing, permits, and tax procedures — so that citizens can apply online through a single form, submit one set of documents, and make a single payment, even when the procedure involves multiple government agencies.

The platform separates two concerns:

| Concern | Who | Tool |
|---------|-----|------|
| **Service design** | Analysts and administrators | Business Process Analyzer (BPA) |
| **Service delivery** | Citizens and applicants | Display System (DS) |

Analysts configure services in the BPA without writing code. When a service is ready, they publish it to the Display System, where citizens can access it through a web browser.

A third component, the **Government Database (GDB)**, acts as the central data repository where all entities (businesses, persons, licenses) are stored and can be queried across services.

---

## 2. Key Capabilities

- **No-code service configuration**: Design forms, workflows, business rules, notifications, and document requirements through an administrative interface.
- **Role-based workflow automation**: Define roles (applicant, reviewer, approver) and their decision paths. The system automatically generates BPMN process definitions and deploys them to a workflow engine.
- **Dynamic form generation**: Forms are generated automatically from service configuration and rendered using Form.io. Each role sees a customized view.
- **Multi-agency coordination**: A single service can involve registrations with multiple institutions, each with their own forms and requirements.
- **External system integration**: Connect to third-party APIs (REST or SOAP) through a service bus (Mule) or direct bot integrations.
- **Multi-language support**: Full internationalization with a global translation service.
- **Audit trail**: All configuration changes and data modifications are logged and traceable.
- **Open-source stack**: All underlying technologies are open-source and free of licensing costs.

---

## 3. System Components at a Glance

The eRegistrations platform consists of the following major components:

```
+-------------------+     +-------------------+     +-------------------+
|   BPA Frontend    |     |   DS Frontend     |     |   GDB Frontend    |
|    (Angular)      |     |   (Django)        |     |    (React)        |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                          |
         v                         v                          v
+--------+----------+     +--------+----------+     +--------+----------+
|   BPA Backend     |     |   DS Backend      |     |   GDB Backend     |
|  (Java/Spring     |     |  (Python/Django)  |     |  (Python/Django)  |
|   Boot)           |     |                   |     |  + Celery workers |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                          |
         +------------+------------+-----------+--------------+
                      |                        |
              +-------v--------+      +--------v--------+
              |  PostgreSQL    |      |    MongoDB      |
              |  (relational)  |      |    (document)   |
              +----------------+      +-----------------+
```

### Supporting Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Keycloak** | Java | Authentication and authorization (OpenID Connect / OAuth 2.0) |
| **Camunda** | Java | Workflow process engine (executes BPMN diagrams) |
| **Form.io** | Node.js | Form definition, rendering, and validation |
| **Restheart** | Java | REST API for MongoDB (stores catalogs, bot configs, translations) |
| **ActiveMQ** | Java | Message queue for inter-service communication |
| **Mule ESB** | Java | Service bus for external system integration |
| **HAProxy** | C | Reverse proxy and load balancer with HTTPS termination |
| **Graylog** | Java | Centralized log management and analysis |
| **OpenSearch** | Java | Search and analytics engine (used by Graylog) |
| **Zabbix** | C/PHP | Infrastructure monitoring and alerting |
| **ClamAV** | C | Antivirus scanning for uploaded files |
| **Redis** | C | In-memory cache |
| **MinIO** | Go | Object storage for user-uploaded files |

---

## 4. How the Three Subsystems Work Together

### 4.1 BPA (Business Process Analyzer)

The BPA is the **administrative backend** where analysts design and configure services. Key capabilities:

- Create services with registrations, institutions, and requirements
- Define roles and workflow steps with status-based routing
- Configure forms using determinants (form fields with business logic)
- Set up bots for automated tasks and external API calls
- Define document requirements and costs
- Manage classifications and catalogs
- Publish services to the Display System

The BPA backend is a set of Java/Spring Boot microservices that generate:
- **BPMN definitions** for the workflow engine (Camunda)
- **Form.io schemas** for dynamic form rendering
- **Bot configurations** for automated tasks
- **Translation packages** for multi-language support

### 4.2 DS (Display System)

The DS is the **public-facing application** where citizens interact with services. It provides:

- User registration and authentication (via Keycloak)
- Service catalog browsing
- Online form submission with file uploads
- Application tracking and status updates
- Certificate and document downloads
- Payment processing

The DS backend is built with Python/Django and connects to PostgreSQL for application data, Keycloak for authentication, and Camunda for workflow execution.

### 4.3 GDB (Government Database)

The GDB is the **central data repository** that stores structured government data. It provides:

- Dynamic database schema creation (no-code)
- Fine-grained authorization (down to individual database fields)
- REST API for querying and managing data
- Data import/export and synchronization
- Audit logging of all data changes
- Multi-language translations for data labels

The GDB backend is built with Python/Django with Celery for asynchronous task processing. It uses PostgreSQL for data storage and Redis for caching.

---

## 5. Typical Deployment Architecture

A standard eRegistrations deployment runs on a single server (or two servers for larger installations) using Docker containers. The following domains are typically configured:

| Domain | Service |
|--------|---------|
| `example.gov` | Public homepage |
| `services.example.gov` | Display System (citizen interface) |
| `login.example.gov` | Keycloak (authentication) |
| `bpa.example.gov` | BPA (service administration) |
| `gdb.example.gov` | GDB (government database) |
| `stats.example.gov` | Analytics dashboard |
| `graylog.example.gov` | Centralized logs |
| `admin-home.example.gov` | Admin home page |

All traffic enters through **HAProxy**, which handles HTTPS termination and routes requests to the appropriate Docker container.

---

## 6. Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Programming languages** | Java, Python, Node.js |
| **Frameworks** | Spring Boot, Django, Angular, React |
| **Databases** | PostgreSQL, MongoDB |
| **Caching** | Redis |
| **Search** | OpenSearch (Elasticsearch-compatible) |
| **Object storage** | MinIO |
| **Containerization** | Docker, Docker Compose, Docker Swarm |
| **Reverse proxy** | HAProxy |
| **Authentication** | Keycloak (OIDC / OAuth 2.0) |
| **Workflow engine** | Camunda (BPMN) |
| **Form engine** | Form.io |
| **Integration** | Mule ESB, ActiveMQ |
| **Monitoring** | Zabbix, Graylog |
| **Security** | ClamAV, TLS 1.2+, Google reCAPTCHA |

---

## 7. Licensing

- The eRegistrations platform license is **perpetual**.
- All underlying components are **open-source and free of charge**.
- No paid licenses are required for operation.
- The cost of maintaining the platform is limited to server hosting, internet connectivity, and trained IT staff.

---

## 8. Document Map

This documentation set consists of the following guides:

| Document | Audience | Description |
|----------|----------|-------------|
| **00 - Overview** (this document) | All | Platform introduction and architecture summary |
| **01 - Architecture** | Technical | Detailed system architecture with C4 diagrams |
| **02 - Installation** | Technical | Step-by-step server setup and software installation |
| **03 - Deployment** | Technical | Docker stack deployment and initial configuration |
| **04 - Configuration** | Technical | BPA, Form.io, workflow, and service configuration reference |
| **05 - Security** | All | Security measures, policies, and best practices |
| **06 - Maintenance** | Technical | Routine maintenance tasks and scheduling |
| **07 - Troubleshooting** | Technical | Debugging procedures and common issue resolution |
| **08 - Integration** | Technical | GDB API, external system integration, and interoperability |
| **09 - Localization** | All | Country adaptation and multi-language configuration |
| **10 - Hosting Requirements** | All | Hardware, software, network, and DNS requirements |

---

*Next: [01 - Architecture](01-architecture.md) for detailed system architecture.*
