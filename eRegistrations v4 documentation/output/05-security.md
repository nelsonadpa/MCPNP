# eRegistrations v4 Security Guide

**Version**: 4.0
**Audience**: Technical administrators, project managers, government counterparts
**Status**: Production-ready

---

## 1. Security Overview

The eRegistrations platform implements a **defense-in-depth** strategy: multiple independent security layers protect the system so that no single point of failure compromises the whole. Even if one layer is breached, the remaining layers continue to provide protection.

### Security Layers at a Glance

| Layer | Scope | Key Measures |
|-------|-------|-------------|
| **Physical** | Data center | ISO/IEC 27001 certified hosting provider |
| **Network** | Data in transit | TLS 1.2+, firewall, DDoS protection, private Docker network |
| **Server & OS** | Host machine | Hardened Ubuntu, SSH key-only access, UFW firewall |
| **Container** | Runtime isolation | Non-root containers, resource quotas, vulnerability scanning |
| **Application** | Business logic | Spring Boot Security, Django protections, input validation |
| **Authentication** | Identity | Keycloak SSO, OIDC/OAuth 2.0, Bcrypt, reCAPTCHA |
| **Data** | Storage & privacy | Encryption, retention policies, right to be forgotten |
| **Monitoring** | Detection & response | Graylog, Zabbix, audit logs, anomaly detection |
| **Testing** | Validation | Threat modeling, penetration testing, ethical hacker audits |

```
  ┌─────────────────────────────────────────────┐
  │           Physical Security                  │  Data center (hosting provider)
  │  ┌───────────────────────────────────────┐   │
  │  │        Network Security               │   │  TLS, firewall, DDoS protection
  │  │  ┌───────────────────────────────┐    │   │
  │  │  │     Server & OS Security      │    │   │  Ubuntu hardening, SSH keys
  │  │  │  ┌───────────────────────┐    │    │   │
  │  │  │  │  Container Security   │    │    │   │  Docker isolation, quotas
  │  │  │  │  ┌───────────────┐    │    │    │   │
  │  │  │  │  │  Application  │    │    │    │   │  Input validation, CSRF, XSS
  │  │  │  │  │  ┌─────────┐  │    │    │    │   │
  │  │  │  │  │  │  Data   │  │    │    │    │   │  Encryption, retention, audit
  │  │  │  │  │  └─────────┘  │    │    │    │   │
  │  │  │  │  └───────────────┘    │    │    │   │
  │  │  │  └───────────────────────┘    │    │   │
  │  │  └───────────────────────────────┘    │   │
  │  └───────────────────────────────────────┘   │
  └─────────────────────────────────────────────┘
            Monitoring & Testing (all layers)
```

---

## 2. Physical Security

Physical security refers to the protection of the hardware infrastructure where the platform is hosted. This responsibility belongs to the hosting provider.

### Hosting Provider Requirements

- Servers should be hosted by a reputable cloud provider with recognized security certifications.
- UNCTAD partners with **Hetzner** (Germany), which holds **ISO/IEC 27001** certification for information security management.
- The hosting provider is responsible for:
  - Physical access control to data centers
  - Environmental protections (fire suppression, power redundancy, cooling)
  - Hardware maintenance and replacement
  - Network uptime guarantees (SLA)

### Recommendations

| Aspect | Requirement |
|--------|------------|
| Certification | ISO/IEC 27001 or equivalent |
| Location | Jurisdiction with adequate data protection laws |
| Redundancy | Power and network redundancy at the data center level |
| SLA | Minimum 99.9% uptime |

---

## 3. Network Security

### 3.1 Encryption in Transit

All data transmitted between clients and servers is encrypted using **TLS 1.2 or higher**. This applies to:

- User browser sessions (HTTPS)
- API calls between subsystems
- Authentication flows (Keycloak)
- Administrative access (BPA, GDB)

HAProxy handles HTTPS termination and enforces TLS for all incoming connections.

### 3.2 Firewall

The server uses **UFW** (Uncomplicated Firewall) as the primary firewall, with special handling for Docker:

- UFW manages the host-level firewall rules.
- Docker's iptables integration is managed through the **DOCKER-USER chain**, ensuring that UFW rules are respected even when Docker publishes ports.
- Only explicitly allowed ports are open to the public.

**Default open ports:**

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | Restricted to admin IPs |
| 80 | HTTP | Public (redirects to 443) |
| 443 | HTTPS | Public |
| 8444 | Zabbix Web | Restricted |
| 9200 | OpenSearch | Restricted |
| 10050 | Zabbix Agent | Restricted |
| 10051 | Zabbix Trapper | Restricted |

### 3.3 Docker Private Network

Inter-service communication uses a **Docker private network** (`172.18.0.0/16`). This network is:

- Not routable from the public internet
- Isolated from the host network
- Accessible only to containers within the Docker stack

Services communicate with each other over this private network, so internal ports (databases, message queues, caches) are never exposed to the public internet.

### 3.4 DDoS Protection

DDoS mitigation is provided at the hosting provider level (cloud firewalls, traffic scrubbing). The specific protections depend on the chosen provider.

---

## 4. Server & Operating System Security

### 4.1 Operating System

The platform runs on **Ubuntu 24.04 LTS**, chosen for its long-term support and extensive security track record:

- Security patches are applied through **manual controlled updates** (automatic unattended-upgrades are disabled to prevent unplanned service disruption).
- The swap preference is set to `vm.swappiness=1` to minimize swap usage and keep sensitive data in RAM where possible.

### 4.2 SSH Hardening

SSH access is hardened with the following configuration:

| Setting | Value | Purpose |
|---------|-------|---------|
| `PubkeyAuthentication` | `yes` | Only public key authentication is allowed |
| `PasswordAuthentication` | `no` | Password-based login is completely disabled |
| `PermitRootLogin` | `no` | Direct root login is prohibited |

Administrators must use SSH key pairs to access the server. This eliminates brute-force password attacks entirely.

### 4.3 UFW and Docker Integration

Because Docker manages its own iptables rules, standard UFW rules alone are insufficient to control Docker-published ports. The eRegistrations deployment uses the **DOCKER-USER chain** to ensure that:

1. UFW rules apply before Docker's NAT rules.
2. Ports published by Docker containers are still subject to firewall restrictions.
3. Internal service ports remain inaccessible from the public internet.

---

## 5. Container Security

All eRegistrations microservices run inside **Docker containers**, providing process isolation and reproducible deployments.

### 5.1 Container Hardening

| Measure | Description |
|---------|-------------|
| **Non-root execution** | Containers run as non-root users to limit the impact of a container escape |
| **Resource quotas** | CPU and memory limits are configured per container to prevent resource exhaustion |
| **Clean images** | Only images from trusted sources are used; no unverified third-party images |
| **Minimal images** | Production images contain only the runtime dependencies required by the service |

### 5.2 Vulnerability Scanning

Docker Hub images are scanned for vulnerabilities using **Snyk**:

- Scans run automatically on image push.
- Alerts are generated for known CVEs in base images and dependencies.
- Critical vulnerabilities are remediated before deployment to production.

### 5.3 Logging Configuration

Docker logging is configured to prevent disk exhaustion:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Each container retains a maximum of 30 MB of logs (3 files of 10 MB each). Older logs are rotated and discarded automatically. Application-level logs are forwarded to Graylog for centralized retention.

### 5.4 Secrets Management

| Environment | Method | Details |
|-------------|--------|---------|
| **Development** | `.env` files | Acceptable for local development only |
| **Production** | **Docker Swarm secrets** | Secrets are encrypted at rest, mounted as in-memory files, and never stored in images or environment variables |

Production deployments use **Docker Swarm mode**, which provides:

- Encrypted secret storage in the Swarm Raft log
- Secrets distributed only to containers that need them
- In-memory tmpfs mounts (secrets are never written to disk inside the container)

---

## 6. Application Security

### 6.1 Java / Spring Boot (BPA Backend)

The BPA backend uses the **Spring Boot Security** library, which provides:

- HTTP security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)
- CSRF protection for state-changing operations
- Session management and fixation protection
- Method-level authorization annotations

### 6.2 Python / Django (DS and GDB Backends)

The Display System and Government Database backends are built with **Django**, which includes built-in protection against common web vulnerabilities:

| Protection | Mechanism |
|-----------|-----------|
| **SQL Injection** | ORM parameterized queries (Django QuerySet API) |
| **XSS** | Auto-escaping in templates |
| **CSRF** | CSRF middleware with per-request tokens |
| **CORS** | Django CORS headers middleware with whitelist |
| **Clickjacking** | X-Frame-Options middleware |

Before every production deployment, **Django deployment checks** (`manage.py check --deploy`) are run to verify that security settings are correctly configured.

### 6.3 Input Validation and Data Handling

All user input undergoes two layers of validation:

1. **Client-side validation**: Immediate feedback in the browser (Form.io schema validation).
2. **Server-side validation**: Authoritative validation that cannot be bypassed.

After validation, data is **sanitized** before storage. Data persistence is handled through the **Java Persistence API (JPA)** ORM, which uses parameterized queries to prevent injection attacks.

### 6.4 File Upload Security

All files uploaded by users are scanned by **ClamAV** (open-source antivirus engine) before being stored in the system. Infected files are rejected and the event is logged.

---

## 7. Authentication and Authorization

### 7.1 Identity Provider: Keycloak

Authentication is managed by **Keycloak**, an open-source identity and access management solution. Keycloak provides:

- **Single Sign-On (SSO)** across all platform subsystems (DS, BPA, GDB)
- **OpenID Connect (OIDC)** protocol over **OAuth 2.0**
- **JWT tokens** for stateless API authentication
- Centralized user management and session control

### 7.2 Password Security

| Policy | Implementation |
|--------|---------------|
| **Hashing algorithm** | Bcrypt (`$2y$` variant) |
| **Password expiration** | Configurable per instance |
| **Password history** | Enforced — prevents reuse of recent passwords |
| **Brute-force protection** | Account lockout after repeated failed attempts |

### 7.3 Public Form Protection

All public-facing forms are protected by **Google reCAPTCHA**:

- Login page
- User registration page
- Password reset page

This prevents automated bot submissions and credential stuffing attacks.

### 7.4 Authorization Model

Authorization operates at multiple levels:

| Level | Mechanism |
|-------|-----------|
| **Platform** | Keycloak roles (admin, analyst, citizen) |
| **Workflow** | Role-based access per service status (Camunda) |
| **Data** | Fine-grained field-level permissions in GDB |

The GDB authorization system can restrict access **down to individual database fields**, allowing precise control over who can view or modify specific data elements.

---

## 8. Backup and Recovery

### 8.1 Backup Strategy

| Parameter | Value |
|-----------|-------|
| **Frequency** | Automatic daily backups |
| **RPO** (Recovery Point Objective) | 24 hours |
| **Retention** | 20 days (adjustable per instance) |
| **Storage** | Separate server with restricted access |
| **Transfer** | Encrypted via HTTPS or SFTP |

### 8.2 Backup Scope

Daily backups include:

- PostgreSQL databases (BPA, DS, GDB, Keycloak, Camunda)
- MongoDB databases (catalogs, translations, bot configurations)
- Uploaded files (MinIO object storage)
- Configuration files and Docker stack definitions

### 8.3 Recovery Testing

Recovery procedures are **tested regularly** to ensure that:

- Backups are complete and not corrupted.
- Recovery time is within acceptable limits.
- Restored data is consistent across all subsystems.

---

## 9. Data Privacy

### 9.1 Retention Policies

| Data Type | Retention Period | Notes |
|-----------|-----------------|-------|
| **Processing database data** | 2 years | Configurable per instance |
| **Active log databases** | 1 year | Application and system logs |
| **Log database backups** | 3 years | Archived on backup server |

All retention periods are configurable and should be adjusted to comply with the data protection regulations of the deploying jurisdiction.

### 9.2 Right to Be Forgotten

Users can request the deletion of their personal data. Upon a valid request:

1. The user's personal data is identified across all subsystems.
2. Data is permanently deleted or anonymized.
3. The deletion event is recorded in the audit log (without the deleted data).

### 9.3 Audit Trail

All data access and modification events are logged in the platform's audit system:

- **Who**: The authenticated user responsible for the action
- **What**: The entity and fields that were accessed or changed
- **When**: Timestamp of the event
- **Where**: The subsystem and endpoint involved

---

## 10. Logging, Monitoring, and Threat Detection

### 10.1 Graylog — Centralized Log Aggregation

**Graylog** collects and indexes logs from all platform components. It is self-hosted and access-restricted.

| Feature | Details |
|---------|---------|
| **Log levels** | Error, Info, Debug (levels 0-7) |
| **Anomaly detection** | AI/ML-based metrics for detecting unusual patterns |
| **Alert types** | Persistent Alert, Incident, and Team Logs |
| **Search** | Full-text search and structured queries via OpenSearch |
| **Retention** | Configurable per index (see data privacy section) |

Use cases:

- Detecting repeated failed login attempts
- Identifying unusual API call patterns
- Tracing errors across microservices
- Forensic analysis after security incidents

### 10.2 Zabbix — Infrastructure Monitoring

**Zabbix** monitors the health of the server and its containers in real time.

| Metric | Example |
|--------|---------|
| **Storage** | Disk usage, I/O latency |
| **Network** | Bandwidth, connection counts |
| **Containers** | CPU, memory, restart counts |
| **Services** | HTTP response codes, SSL certificate expiry |

Zabbix generates **real-time alerts** when anomalies are detected (e.g., disk usage above threshold, container crashes, SSL certificate nearing expiry).

**Ports used by Zabbix:**

| Port | Purpose |
|------|---------|
| 8444 | Zabbix Web UI |
| 9200 | OpenSearch API |
| 10050 | Zabbix Agent (passive checks) |
| 10051 | Zabbix Trapper (active checks) |

### 10.3 Application Audit Logs

Beyond infrastructure monitoring, the platform maintains **application-level audit logs** that record:

- All entity changes (create, update, delete) with timestamp and responsible user
- Configuration changes in the BPA
- Data access events in the GDB
- Authentication events in Keycloak

### 10.4 HTTP and SSL Monitoring

Public-facing services are monitored for:

- HTTP availability and response time
- SSL/TLS certificate validity and expiration
- Unexpected certificate changes

---

## 11. Security Testing

### 11.1 Testing Methodology

The eRegistrations platform undergoes multiple levels of security testing:

| Method | Description | Frequency |
|--------|-------------|-----------|
| **Threat modeling** | Systematic identification of threats and attack vectors | During design and major changes |
| **Automated cloud scanning** | Automated vulnerability scans of the server and network | Regular intervals |
| **Ethical hacker audits** | Third-party white-hat security professionals review the platform | Periodic (at least annually) |
| **Penetration testing** | Simulated attacks with documented findings and mitigations | Periodic (at least annually) |

### 11.2 Penetration Test Findings and Mitigations

The following table illustrates typical findings from penetration tests and the mitigations applied. These serve as a reference pattern for ongoing security improvement:

| # | Finding | Risk | Mitigation Applied |
|---|---------|------|-------------------|
| 1 | Password-based SSH authentication enabled | High | Disabled password authentication; enforced public key only |
| 2 | `.env` file containing secrets accessible in production | High | Migrated to Docker Swarm secrets; `.env` files removed from production |
| 3 | Backup files with overly permissive file permissions | Medium | Applied stricter file permissions; restricted access to backup directories |

Each penetration test produces a formal report with findings, risk ratings, and remediation timelines.

---

## 12. Security Checklist

Use this checklist to verify security posture during deployment and periodic reviews.

### Physical and Network

- [ ] Hosting provider holds ISO/IEC 27001 or equivalent certification
- [ ] TLS 1.2+ is enforced on all public endpoints
- [ ] HAProxy is configured to reject connections below TLS 1.2
- [ ] UFW firewall is enabled with DOCKER-USER chain rules configured
- [ ] Docker private network (`172.18.0.0/16`) is used for inter-service communication
- [ ] Only required ports are exposed to the public internet
- [ ] DDoS protection is enabled at the hosting provider level

### Server and OS

- [ ] Ubuntu 24.04 LTS is installed with latest security patches
- [ ] SSH password authentication is disabled (`PasswordAuthentication no`)
- [ ] SSH root login is disabled (`PermitRootLogin no`)
- [ ] SSH access uses public key authentication only
- [ ] `vm.swappiness` is set to `1`
- [ ] Automatic updates are disabled (manual controlled update process is documented)

### Containers

- [ ] All containers run as non-root users
- [ ] Resource quotas (CPU and memory) are set for every container
- [ ] Docker images are from trusted sources only
- [ ] Docker Hub vulnerability scanning (Snyk) is enabled with alerts
- [ ] Docker logging is configured with `max-size: 10m` and `max-file: 3`
- [ ] Production uses Docker Swarm mode with Docker secrets (no `.env` files)

### Application

- [ ] Spring Boot Security is enabled on all BPA endpoints
- [ ] Django deployment checks pass (`manage.py check --deploy`)
- [ ] CSRF, XSS, SQL injection, clickjacking protections are active
- [ ] CORS whitelist is configured (no wildcard `*` in production)
- [ ] All input is validated both client-side and server-side
- [ ] ClamAV is running and scanning all file uploads

### Authentication and Authorization

- [ ] Keycloak is configured with OIDC/OAuth 2.0
- [ ] Password hashing uses Bcrypt (`$2y$`)
- [ ] Password expiration and history policies are enforced
- [ ] Google reCAPTCHA is active on login, registration, and password reset pages
- [ ] JWT tokens are used for API authentication
- [ ] GDB field-level authorization is configured for sensitive data

### Backup and Recovery

- [ ] Daily automatic backups are running
- [ ] Backups are stored on a separate server with restricted access
- [ ] Backup transfer uses HTTPS or SFTP
- [ ] Backup retention is set (default: 20 days)
- [ ] Recovery testing has been performed and documented

### Data Privacy

- [ ] Data retention periods are configured per local regulations
- [ ] Right-to-be-forgotten process is documented and functional
- [ ] All data access events are logged in the audit system

### Monitoring and Logging

- [ ] Graylog is operational and collecting logs from all services
- [ ] Graylog anomaly detection metrics are configured
- [ ] Zabbix is monitoring server resources and container health
- [ ] Zabbix alerts are configured for critical thresholds
- [ ] Application audit logs are recording all entity changes
- [ ] HTTP/SSL monitoring is active for all public domains
- [ ] Graylog and Zabbix access is restricted to authorized administrators

### Security Testing

- [ ] Threat model exists and is updated with major changes
- [ ] Automated cloud scanning is running at regular intervals
- [ ] Most recent penetration test report is on file
- [ ] All critical and high-risk findings have been remediated
- [ ] Next penetration test is scheduled

---

*Previous: [04 - Configuration](04-configuration.md) | Next: [06 - Maintenance](06-maintenance.md)*
