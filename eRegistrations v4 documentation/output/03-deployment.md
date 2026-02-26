# eRegistrations v4 Deployment Guide

**Version**: 4.0
**Audience**: System administrators, DevOps engineers
**Prerequisites**: Server with Docker and Docker Compose installed (see [02 - Installation](02-installation.md))

---

## 1. Deployment Overview

The eRegistrations stack runs entirely in Docker. A `deploy.py` script automates the deployment process by:

1. Generating `docker-compose.yml` based on selected options
2. Generating an `.env` file with environment variables
3. Generating webserver configuration files (HAProxy)
4. Pulling Docker images from the container registry
5. Starting Docker containers
6. Starting the webserver (HAProxy)

The script operates in three modes, which are run sequentially during initial deployment:

| Mode | Purpose |
|------|---------|
| **pwd** | Generates random passwords and writes them to `.env` |
| **auth** | Generates a Keycloak realm JSON file for authentication setup |
| **all** | Pulls images, starts containers, and configures the webserver |

---

## 2. Directory Structure

After deployment, the following directory structure is created on the server:

```
/opt/eregistrations/
  compose/eregistrations/
    docker-compose.yml          # Container orchestration
    .env                        # Environment variables and secrets
    keycloak-realm.json         # Generated Keycloak configuration
  scripts/
    deploy.py                   # Deployment automation script
    requirements.txt            # Python dependencies

/opt/volumes/                   # Persistent data volumes
  activemq/                     # Message queue data
  graylog/                      # Log management data
  minio/                        # Object storage data
  opensearch/                   # Search engine indices
  gdb/                          # Government database volumes

/opt/backup/                    # Backup storage
  data/                         # Database backups
  log/                          # Log archives
  scripts/                      # Backup scripts
  config/                       # Configuration backups
```

---

## 3. Create the Deployment User

Create a dedicated user for managing the deployment. This user needs `sudo` and `docker` group membership.

```bash
sudo adduser jenkins
sudo passwd -d jenkins
sudo usermod -aG sudo,docker jenkins
```

> **Troubleshooting**: If `docker` commands fail with permission errors after adding the user to the group, either log out and back in or run `newgrp docker` to refresh group membership.

---

## 4. Set Up SSH Access to the Code Repository

Switch to the deployment user and generate an SSH key pair for Bitbucket repository access.

```bash
sudo su - jenkins
ssh-keygen -t ecdsa -b 256
cat ~/.ssh/id_ecdsa.pub
```

Copy the public key output and add it as an **access key** in the Bitbucket repository settings.

> **Troubleshooting**: If `git clone` fails with "Permission denied (publickey)", verify the key was added correctly and test connectivity with `ssh -T git@bitbucket.org`.

---

## 5. Clone the Starter Configuration

Clone the eRegistrations starter configuration repository into `/opt/eregistrations`:

```bash
cd /opt
sudo mkdir eregistrations
sudo chown -R jenkins:jenkins eregistrations
git clone https://bitbucket.org/unctad/eregistrations-starter-conf.git eregistrations
```

> **Troubleshooting**: If the clone fails, verify that the SSH key from the previous step has been added to the repository's access keys and that the server has outbound SSH access (port 22) to `bitbucket.org`.

---

## 6. Generate Passwords and Authentication Configuration

### 6.1 Install Python Dependencies

```bash
cd /opt/eregistrations/scripts/
sudo pip3 install -r requirements.txt
```

### 6.2 Generate Passwords (pwd mode)

Run the deploy script in password mode. This generates random, secure passwords for all services and writes them to the `.env` file.

```bash
sudo python3 deploy.py
# Select: pwd mode
```

### 6.3 Generate Keycloak Realm (auth mode)

Run the deploy script in authentication mode. This generates the `keycloak-realm.json` file used to configure the identity provider.

```bash
sudo python3 deploy.py
# Select: auth mode
```

> **Troubleshooting**: If `pip3 install` fails, ensure Python 3 and pip are installed. On Ubuntu/Debian: `sudo apt install python3-pip`. If the script fails with import errors, verify all dependencies from `requirements.txt` are installed.

---

## 7. Configure Environment Variables

Edit the generated `.env` file to review and adjust configuration values:

```bash
cd /opt/eregistrations/compose/eregistrations/
nano .env
```

### Critical Variables to Review

| Variable | Description |
|----------|-------------|
| `RESTHEART_MONGO_DB_PASSWORD` | MongoDB password for the `eregistration` user. Note this value for the MongoDB initialization step. |
| Domain-related variables | Ensure all domain names match your DNS configuration. |
| Email/SMTP settings | Configure outbound email for notifications. |
| SSL certificate paths | Verify paths to your TLS certificates. |

Replace any placeholder values (such as `YOUR_DOMAIN`) with your actual domain names and credentials.

> **Troubleshooting**: If containers fail to start after editing `.env`, check for syntax errors. The `.env` file uses `KEY=VALUE` format with no spaces around the `=` sign. Avoid quoting values unless they contain spaces.

---

## 8. Deploy the Stack

With passwords generated and the `.env` file configured, deploy the full stack:

```bash
cd /opt/eregistrations/scripts/
sudo python3 deploy.py
# Select: all mode
```

This command will:
1. Generate `docker-compose.yml` from templates
2. Generate HAProxy configuration files
3. Pull all Docker images from the registry
4. Start all containers via Docker Compose
5. Start or restart HAProxy

> **Troubleshooting**: If Docker image pulls fail with 401 or 403 errors, authenticate with the container registry using credentials from the `.env` file:
> ```bash
> docker login
> ```
> If individual containers fail to start, check their logs:
> ```bash
> cd /opt/eregistrations/compose/eregistrations/
> docker-compose logs <service-name>
> ```

---

## 9. Optional: Allow Translation Service Access

If your deployment uses the centralized UNCTAD translation service, open the ActiveMQ STOMP port for the translation server:

```bash
# Find your server's public IP
curl -s https://api.ipify.org

# Allow the translation server to connect
sudo ufw allow from <TRANSLATION_SERVER_IP> to any port 61613
```

Replace `<TRANSLATION_SERVER_IP>` with the actual IP address of the translation server.

> **Troubleshooting**: If translations are not syncing, verify that port 61613 is open with `sudo ufw status` and that ActiveMQ is running with `docker ps | grep activemq`.

---

## 10. Initialize MongoDB

After the stack is running, initialize the MongoDB database with the required base document:

```bash
mongosh
```

Inside the MongoDB shell:

```javascript
use admin
db.auth('eregistration', 'YOUR_MONGO_PASSWORD')
use eregsystem
db.jenkins.insertOne({ '_id': 'deploys' })
```

Replace `YOUR_MONGO_PASSWORD` with the value of `RESTHEART_MONGO_DB_PASSWORD` from the `.env` file.

> **Troubleshooting**: If `mongosh` cannot connect, the MongoDB container may not be running. Check with `docker ps | grep mongo`. If authentication fails, verify the password matches the one generated in step 6.2.

---

## 11. First Login and Platform Setup

### 11.1 Keycloak (Identity Provider)

1. Navigate to `https://login.YOUR_DOMAIN`
2. Log in with the Keycloak admin credentials from the `.env` file
3. Import the `keycloak-realm.json` file generated in step 6.3:
   - Go to **Realm Settings** > **Partial Import**
   - Upload the JSON file
   - Select all resources and import
4. Create admin user accounts for the platform

### 11.2 BPA (Business Process Analyzer)

1. Navigate to `https://bpa.YOUR_DOMAIN`
2. Log in with an admin account created in Keycloak
3. Configure foundational settings:
   - **Languages**: Add and activate the languages your services will support
   - **Currencies**: Configure the currencies used for service fees
   - **Translations**: Verify translation connectivity and import base translations
4. Optionally create a test service to verify the full pipeline

> **Note**: If you update the payment provider configuration, the `bpa-backend` container must be restarted for changes to take effect:
> ```bash
> cd /opt/eregistrations/compose/eregistrations/
> docker-compose restart bpa-backend
> ```

### 11.3 Verification Checklist

Confirm the deployment is operational by verifying each URL and checking container status:

| Check | Command or URL | Expected Result |
|-------|---------------|-----------------|
| Display System | `https://services.YOUR_DOMAIN` | Public service catalog loads |
| Keycloak | `https://login.YOUR_DOMAIN` | Login page renders |
| BPA | `https://bpa.YOUR_DOMAIN` | Admin dashboard loads |
| Container status | `docker ps` | All containers show status `Up` |
| HAProxy | `sudo service haproxy status` | Active and running |

> **Troubleshooting**: If a URL returns 502/503 errors, the corresponding backend container may still be starting. Some Java-based services (Keycloak, Camunda, BPA backend) can take 2-3 minutes to fully initialize. Check logs with `docker-compose logs -f <service-name>`.

---

## 12. Save Deployment Configuration

Back up the generated configuration files immediately after a successful deployment:

```bash
cd /opt/eregistrations/compose/eregistrations/
cp docker-compose.yml .env /opt/backup/config/
```

Store these backups securely. The `.env` file contains sensitive credentials.

> **Troubleshooting**: Ensure the backup directory exists before copying: `sudo mkdir -p /opt/backup/config/`.

---

## 13. Updating the Stack

To update the platform to a newer version:

```bash
cd /opt/eregistrations/compose/eregistrations

# Pull latest configuration
git pull

# Pull updated Docker images
docker-compose pull

# Restart containers with new images
docker-compose up -d

# Restart the reverse proxy
sudo service haproxy restart
```

> **Troubleshooting**: If `docker-compose pull` returns 401 or 403 errors, your registry credentials may have expired. Re-authenticate:
> ```bash
> docker login
> ```
> Use the registry credentials from the `.env` file. After updating, verify all containers are running with `docker ps` and check application logs for startup errors.

---

## 14. Environment-Specific Considerations

### Recommended Environment Layout

Enterprise deployments should maintain four separate environments:

| Environment | Purpose | Secret Management |
|-------------|---------|-------------------|
| **DEV** | Development and experimentation | `.env` files acceptable |
| **UAT** | User acceptance testing | `.env` files acceptable |
| **Staging** | Pre-production validation | Docker Secrets recommended |
| **LIVE** | Production | Docker Secrets required |

### Production Deployments

Production environments use **Docker Swarm mode** with **Docker Secrets** instead of `.env` files. This ensures that sensitive values (database passwords, API keys, TLS certificates) are encrypted at rest and only available to the containers that need them.

Key differences in production:
- Secrets are managed with `docker secret create` instead of environment variables
- The `docker-compose.yml` references secrets rather than `.env` values
- Swarm mode provides built-in container orchestration and restart policies

---

## 15. Quick Reference: Deployment Commands

| Task | Command |
|------|---------|
| Generate passwords | `sudo python3 deploy.py` (pwd mode) |
| Generate Keycloak realm | `sudo python3 deploy.py` (auth mode) |
| Deploy full stack | `sudo python3 deploy.py` (all mode) |
| Check running containers | `docker ps` |
| View container logs | `docker-compose logs -f <service>` |
| Restart a single service | `docker-compose restart <service>` |
| Restart HAProxy | `sudo service haproxy restart` |
| Update stack | `git pull && docker-compose pull && docker-compose up -d` |
| Authenticate to registry | `docker login` |

---

## 16. Next Steps

Once the platform is deployed and verified:

- **Configure your first service**: See [04 - Configuration](04-configuration.md) for the BPA configuration reference.
- **Harden the deployment**: See [05 - Security](05-security.md) for security policies, firewall rules, and TLS configuration.
- **Set up monitoring and backups**: See [06 - Maintenance](06-maintenance.md) for routine maintenance tasks and backup schedules.
- **Prepare for issues**: See [07 - Troubleshooting](07-troubleshooting.md) for debugging procedures and common issue resolution.

---

*Previous: [02 - Installation](02-installation.md) | Next: [04 - Configuration](04-configuration.md)*
