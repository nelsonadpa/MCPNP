# eRegistrations v4 — Hosting Requirements

**Audience**: IT managers, procurement officers, system administrators
**Purpose**: Hardware, software, network, and DNS specifications for hosting eRegistrations

---

## 1. Overview

This document specifies the infrastructure required to host the eRegistrations platform. Requirements are provided for single-server and multi-server configurations, production and non-production environments.

All specifications assume a standard deployment. Adjust based on expected user volume and number of configured services.

---

## 2. Server Configurations

### 2.1 Single-Server (Recommended for Most Deployments)

Application and database on the same machine.

| Resource | Recommended | Minimum (Test/Demo) |
|----------|------------|---------------------|
| **CPU** | 32 cores | 8 cores |
| **RAM** | 64 GB | 16 GB |
| **Storage** | 6 TB SSD | 500 GB SSD |
| **Network** | 1 Gbit redundant | 100 Mbit |
| **Public IP** | Dedicated IPv4 | Dedicated IPv4 |
| **Form factor** | VM or dedicated machine | VM acceptable |

### 2.2 Two-Server Configuration

Separate application and database servers. Recommended for high-traffic deployments.

**Application Server**:

| Resource | Specification |
|----------|--------------|
| CPU | 16 cores |
| RAM | 64 GB |
| Storage | 1 TB SSD |
| Network | 1 Gbit redundant, dedicated public IPv4 |

**Database Server**:

| Resource | Specification |
|----------|--------------|
| CPU | 8 cores |
| RAM | 32 GB |
| Storage | 2 TB SSD |
| Network | 1 Gbit redundant, dedicated public IPv4 |

### 2.3 GDB Standalone (If Deployed Separately)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 500 GB SSD | 1 TB SSD |
| Network | 25 Mbit, public IPv4 | 1 Gbit, public IPv4 + IPv6 |

---

## 3. Multi-Environment Setup (Enterprise)

For production deployments, four environments are recommended:

| Environment | CPU | RAM | Storage | Purpose |
|-------------|-----|-----|---------|---------|
| **LIVE** | 32 cores | 64 GB | 4 TB SSD | Production |
| **Staging** | 16 cores | 32 GB | 2 TB SSD | Pre-production validation |
| **UAT** | 16 cores | 32 GB | 2 TB SSD | User acceptance testing |
| **DEV** | 32 cores | 64 GB | 2 TB SSD | Development and experimentation |

All environments require dedicated public IPv4 and 1 Gbit redundant network.

---

## 4. Backup Server

The backup server must be:

- A **separate installation** from the main server
- In a **different physical location**
- Accessible only to authorized personnel

| Environment | Minimum Storage |
|-------------|----------------|
| LIVE | 4 TB |
| DEV | 2 TB |
| Single-server deployment | 1 TB |

Storage calculation: 1 TB supports approximately 1 month of daily backups for a standard deployment.

---

## 5. Software Requirements

### 5.1 Operating System

| Requirement | Specification |
|-------------|--------------|
| Distribution | Ubuntu Server 24.04 LTS |
| Installation | Server (core only, no desktop) |
| Configuration | Fresh install recommended |

### 5.2 Pre-Installed by the Installation Guide

The following are installed during the setup process (see [02 - Installation](02-installation.md)):

| Software | Version | Purpose |
|----------|---------|---------|
| Docker CE | Latest | Container runtime |
| Docker Compose | Latest | Container orchestration |
| PostgreSQL | 18 | Relational database |
| MongoDB | 8.0 | Document database |
| Redis | Default | In-memory cache |
| HAProxy | 2.9 | Reverse proxy and HTTPS termination |
| Certbot | snap (latest) | SSL certificate management |

### 5.3 External Services

| Service | Requirement |
|---------|------------|
| **Internet** | Minimum 1 Gbit (required for Docker image pulls, updates, SSL) |
| **SMTP server** | For outgoing emails (ISP relay, MailChimp, SendGrid, or authenticated relay) |
| **DNS management** | Ability to create A records and optionally wildcard records |

---

## 6. DNS Requirements

The platform requires **1 main domain** and **7 subdomains**:

| Domain | Service | Description |
|--------|---------|-------------|
| `example.gov` | Homepage | Public landing page |
| `services.example.gov` | Display System | Citizen portal for service applications |
| `login.example.gov` | Keycloak | Authentication and single sign-on |
| `bpa.example.gov` | BPA | Service configuration (admin only) |
| `gdb.example.gov` | GDB | Government database management |
| `stats.example.gov` | Analytics | Usage statistics and dashboards |
| `graylog.example.gov` | Graylog | Centralized log management (restricted) |
| `admin-home.example.gov` | Admin Home | Administrative landing page |

All domains must point to the server's public IPv4 address via DNS A records.

For a multi-environment setup, each environment needs its own set of domains:

```
services.dev.example.gov     → Development
services.uat.example.gov     → User acceptance testing
services.staging.example.gov → Staging
services.example.gov         → Production
```

---

## 7. Firewall Requirements

If the server is behind a firewall, the following rules are required.

### 7.1 Inbound (From Internet)

| Port | Protocol | Service |
|------|----------|---------|
| 22 | TCP | SSH (remote administration) |
| 80 | TCP | HTTP (redirects to HTTPS) |
| 443 | TCP | HTTPS (all web traffic) |
| 8444 | TCP | Monitoring (Zabbix) |
| 9200 | TCP | Monitoring (OpenSearch/Elasticsearch) |
| 10050 | TCP | Monitoring (Zabbix agent) |

### 7.2 Outbound (To Internet)

| Port | Protocol | Service |
|------|----------|---------|
| 22 | TCP | SSH (Git operations, remote connections) |
| 53 | UDP/TCP | DNS (name resolution) |
| 80 | TCP | HTTP (package updates, Docker image pulls) |
| 443 | TCP | HTTPS (package updates, Docker image pulls, API calls) |
| 587 | TCP | SMTP (outgoing email) |
| 10051 | TCP | Monitoring (Zabbix server) |
| — | — | All established/related connections |

### 7.3 Internal (Docker Network)

Docker containers communicate on the `172.18.0.0/16` network. UFW rules must allow this:

```bash
sudo ufw allow from 172.18.0.0/16
sudo ufw allow from 172.19.0.0/16
```

---

## 8. SSL/TLS Certificates

HTTPS is required for all public-facing services.

| Option | Method | Best For |
|--------|--------|----------|
| **Host-based** | Certbot standalone mode | Few subdomains |
| **Wildcard** | Certbot DNS challenge | Many subdomains |
| **Commercial** | Manual import | Government-mandated CA |

Certificates are combined for HAProxy (reverse proxy) in PEM format. Let's Encrypt certificates expire after 90 days and must be renewed.

---

## 9. Capacity Planning

### 9.1 Storage Growth Factors

| Factor | Impact |
|--------|--------|
| Number of services | More service versions = more Form.io schemas and catalog data |
| File uploads | User documents (PDFs, images) stored in MinIO |
| Database records | Application data grows with number of submissions |
| Logs | Graylog/OpenSearch stores all application logs |
| Backups | Daily backups consume storage proportional to total data |

### 9.2 Sizing Guidance

| Deployment Size | Users | Services | Server Config |
|-----------------|-------|----------|---------------|
| **Small** (pilot) | < 1,000 | < 10 | 8 cores, 16 GB, 500 GB |
| **Medium** | 1,000–10,000 | 10–50 | 16 cores, 32 GB, 2 TB |
| **Large** | 10,000–100,000 | 50+ | 32 cores, 64 GB, 6 TB |
| **Enterprise** | 100,000+ | 100+ | Multi-server configuration |

### 9.3 Monitoring Thresholds

Set alerts at these thresholds:

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU usage | > 80% sustained | > 95% |
| Memory usage | > 80% | > 95% or swap active |
| Disk usage | > 70% | > 85% |
| Network bandwidth | > 70% capacity | > 90% capacity |

---

## 10. Summary Checklist

### Infrastructure

- [ ] Server(s) provisioned with required specs
- [ ] Ubuntu 24.04 LTS installed (server core)
- [ ] Public IPv4 assigned
- [ ] 1 Gbit internet connectivity confirmed
- [ ] Backup server provisioned (separate location)

### Network

- [ ] All 8 DNS domains configured and pointing to server IP
- [ ] Firewall rules configured (inbound and outbound)
- [ ] SMTP server accessible for email delivery
- [ ] SSL certificates obtained (Let's Encrypt or commercial)

### Access

- [ ] SSH key-based access configured
- [ ] Monitoring ports accessible (8444, 9200, 10050)
- [ ] Docker Hub access available (for image pulls)

---

*Previous: [09 - Localization](09-localization.md) | First: [00 - Overview](00-overview.md)*
