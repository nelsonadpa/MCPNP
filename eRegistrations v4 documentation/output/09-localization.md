# eRegistrations v4 — Localization and Country Adaptation Guide

**Audience**: Project managers, analysts, system administrators
**Purpose**: How to adapt eRegistrations to a new country, language, or regulatory context

---

## 1. Overview

eRegistrations is designed to be deployed in any country and adapted to local requirements. Localization involves:

1. **Language translation** — Interface labels, form text, notifications, certificates
2. **Service configuration** — Country-specific procedures, institutions, requirements
3. **Regulatory adaptation** — Legal frameworks, document types, payment methods
4. **Infrastructure setup** — Local hosting, domains, SSL certificates

This guide covers each area with practical steps and recommendations.

---

## 2. Language Configuration

### 2.1 Setting Up Languages

Languages are configured in the BPA admin interface:

1. Visit `https://bpa.YOUR_DOMAIN`
2. Go to Settings
3. Add required languages (e.g., English, French, Arabic, Spanish)
4. Set the default language

The default language is also set via environment variable:

```
DEFAULT_LANGUAGE=en
```

### 2.2 Translation Workflow

eRegistrations uses a multi-layer translation system:

| Layer | What It Covers | Where Managed |
|-------|---------------|---------------|
| **Platform labels** | UI elements, buttons, menus, system messages | Global Translation Service |
| **Service labels** | Form field labels, role names, status names | BPA translations module |
| **Data labels** | GDB field names, database titles | GDB translation component |
| **Content** | Certificate text, notification messages | BPA per-service configuration |

### 2.3 Global Translation Service

The platform includes an optional centralized translation service that stores shared translations (common labels used across all deployments).

To connect to the translation service:

1. Ensure ActiveMQ port 61613 is accessible
2. Configure the firewall rule:
   ```bash
   sudo ufw allow from <TRANSLATION_SERVER_IP> to any port 61613
   ```
3. In BPA, go to Settings and pull translations

After pulling translations, restart the BPA backend if needed.

### 2.4 Service-Level Translations

Each service can have its own translations for:

- Form field labels and help text
- Role names and status labels
- Notification message templates
- Certificate templates and print documents
- Cost descriptions

These are configured per service in the BPA and published to RestHeart during service publishing.

### 2.5 Translation Best Practices

- **Start with the default language**: Configure the entire service in the default language first, then add translations.
- **Use the global service for shared labels**: Common terms (Submit, Cancel, Approved, etc.) should come from the global translation service.
- **Keep labels short**: Short labels translate better and fit in UI elements across languages.
- **Test RTL languages**: If deploying in Arabic, Hebrew, or other right-to-left languages, verify form rendering and layout.
- **Version translations with services**: Translations are published alongside service versions, ensuring consistency.

---

## 3. Service Configuration for a New Country

### 3.1 Planning a Service

Before configuring in BPA, document:

1. **Process map**: Who does what, in what order? What are the decision points?
2. **Form fields**: What information does the applicant provide? What do officers see?
3. **Document requirements**: What must the applicant upload?
4. **Business rules**: What conditions change the process? (e.g., different requirements for different business types)
5. **Costs and payments**: What fees apply? Are they fixed or calculated?
6. **Institutions involved**: Which agencies participate in the process?
7. **Outputs**: What certificates or documents are issued?

### 3.2 Configuring in BPA

Follow this order:

1. **Create the Service** — Name and description
2. **Add Registrations** — License/permit types within the service
3. **Add Institutions** — Government agencies involved
4. **Define Roles** — Create workflow participants (applicant, reviewer, approver, etc.)
5. **Configure Role Statuses** — Define outcomes for each role (approved, rejected, correction needed) and link to next role
6. **Build Forms** — Add determinants (form fields) to the applicant form
7. **Add Business Rules** — Configure determinant conditions (show/hide, required)
8. **Set Up Classifications** — Create lookup tables (countries, business types, sectors)
9. **Configure Document Requirements** — Specify required uploads per registration
10. **Set Costs** — Define fees (fixed or formula-based) per registration
11. **Configure Bots** — Set up automated tasks (external API calls, document generation)
12. **Add Notifications** — Configure email/message templates
13. **Configure Print Documents** — Design certificate templates
14. **Translate** — Add translations for all labels
15. **Publish** — Deploy the service to the Display System

### 3.3 Service Replication

To replicate a service from one country to another:

1. **Export** the service from the source BPA:
   ```
   POST /download_service/{service_id}
   ```
   This produces a JSON file with all service components.

2. **Import** into the target BPA:
   ```
   POST /upload_service
   ```
   Select which components to import (service, roles, forms, bots, catalogs).

3. **Adapt** the imported service to local requirements:
   - Update institution names
   - Modify form fields for local regulations
   - Adjust business rules
   - Update translations
   - Configure local payment providers

---

## 4. Regulatory Adaptation

### 4.1 Legal Framework

Each country deployment should account for:

| Area | Considerations |
|------|---------------|
| **Data privacy** | Local data protection laws, data retention requirements, right to deletion |
| **Digital signatures** | Whether electronic submissions have legal standing |
| **Payment regulations** | Approved payment gateways, currency requirements |
| **Document standards** | Official document formats, certificate requirements |
| **Accessibility** | Government accessibility standards (e.g., WCAG compliance) |

### 4.2 Data Retention

Default data retention policies:

| Data Type | Default Retention | Configurable |
|-----------|------------------|-------------|
| Processing database | 2 years | Yes, per instance |
| Active log databases | 1 year | Yes |
| Log database backups | 3 years | Yes |
| Daily backups (local) | 5 days | Yes |
| Daily backups (remote) | 20 days | Yes |

Adjust retention periods to comply with local regulations. This is configured by the system administrator.

### 4.3 Payment Gateway Integration

The Display System supports multiple payment providers. Currently supported:

- FedaPay
- iVeri
- Pesaflow
- Additional gateways can be integrated

To add a new payment provider:
1. Configure the provider in the DS database (`PaymentProvider` model)
2. Set provider code, name, and configuration (JSON)
3. After updating payment providers in BPA, restart the `bpa-backend` container

---

## 5. Infrastructure Adaptation

### 5.1 Hosting Options

| Option | Description | Recommended For |
|--------|-------------|-----------------|
| **UNCTAD cloud** | Hosted by UNCTAD in Germany (1 year included) | Initial deployment, pilot phase |
| **Local cloud** | Hosted on local cloud provider | Countries with cloud-first policies |
| **On-premise** | Hosted on government infrastructure | Countries with data sovereignty requirements |

### 5.2 Environment Strategy

For production deployments, set up multiple environments:

| Environment | Purpose | Spec |
|-------------|---------|------|
| **DEV** | Development and experimentation | 32 cores, 64 GB RAM, 2 TB SSD |
| **UAT** | User acceptance testing | 16 cores, 32 GB RAM, 2 TB SSD |
| **Staging** | Pre-production validation | 16 cores, 32 GB RAM, 2 TB SSD |
| **LIVE** | Production | 32 cores, 64 GB RAM, 4 TB SSD |

Each environment needs its own set of DNS domains (e.g., `dev.example.gov`, `uat.example.gov`, etc.).

### 5.3 Domain Configuration

Replace the placeholder domains with country-specific domains:

```
example.gov              → Your country's domain
services.example.gov     → Service portal
login.example.gov        → Authentication
bpa.example.gov          → Administration
gdb.example.gov          → Government database
stats.example.gov        → Analytics
graylog.example.gov      → Logs (restricted access)
admin-home.example.gov   → Admin home
```

### 5.4 Email Configuration

Configure the SMTP server for the country's email infrastructure. Options:

- Local ISP relay
- Dedicated email service (e.g., MailChimp, SendGrid)
- Government SMTP server
- Authenticated relay on port 587

---

## 6. Training Requirements

Successful country adoption requires training at multiple levels:

### 6.1 Technical Training (IT Staff)

| Level | Duration | Content |
|-------|----------|---------|
| 1. System Installation | 3 hours (2 sessions) | Full stack installation on local server |
| 2. System Architecture | 1.5 hours (1 session) | Components, interactions, data flows |
| 3. System Maintenance | 4.5 hours (3 sessions) | Updates, databases, troubleshooting, backups |
| 4. Integration | 4.5 hours (3 sessions) | Mule ESB, REST/SOAP connectors, DataWeave |

**Prerequisites for IT staff**: OS administration, Docker, PostgreSQL, MongoDB.

### 6.2 Service Configuration Training (Analysts)

Analysts should be trained on:
- BPA interface and service creation workflow
- Form design with determinants and business rules
- Workflow configuration (roles, statuses, routing)
- Classification and catalog management
- Service publishing and versioning
- Testing procedures (use a test server / draft environment)

### 6.3 Change Management

Best practices for managing service changes:

1. **Test server**: Make changes on copies of the operating service
2. **Thorough testing**: Test the modified service completely before going live
3. **Pre-live validation**: Apply changes to a pre-live server to check backward compatibility
4. **Draft publishing**: Publish new versions to a draft environment first
5. **Version control**: Publishing creates a new version — old versions remain accessible

---

## 7. Translation Readiness Checklist

When adapting documentation or interfaces to a new language:

- [ ] Identify all required languages for the deployment
- [ ] Configure languages in BPA settings
- [ ] Pull global translations from the translation service
- [ ] Translate service-specific labels in BPA
- [ ] Translate notification and certificate templates
- [ ] Translate GDB data labels
- [ ] Test all forms in each language
- [ ] Verify right-to-left (RTL) rendering if applicable
- [ ] Train local staff on the translation workflow
- [ ] Establish a process for maintaining translations when services change

---

## 8. Country Deployment Checklist

- [ ] **Planning**: Document all services to be digitized
- [ ] **Infrastructure**: Provision servers per hosting requirements
- [ ] **DNS**: Configure all required domains and subdomains
- [ ] **Installation**: Follow the installation guide (02-installation.md)
- [ ] **Deployment**: Follow the deployment guide (03-deployment.md)
- [ ] **Security**: Apply all security measures (05-security.md)
- [ ] **Languages**: Configure and pull translations
- [ ] **Services**: Configure each service in BPA
- [ ] **Testing**: Test each service end-to-end on UAT
- [ ] **Training**: Train IT staff and analysts
- [ ] **Payments**: Integrate local payment gateways
- [ ] **Go-live**: Publish services to production
- [ ] **Monitoring**: Set up Zabbix alerts and Graylog dashboards
- [ ] **Backups**: Verify backup scripts are running
- [ ] **Documentation**: Adapt user manuals for local context

---

*Previous: [08 - Integration](08-integration.md) | Next: [10 - Hosting Requirements](10-hosting.md)*
