# eRegistrations v4 Installation Guide

**Version**: 4.0
**Audience**: System administrators, DevOps engineers
**Prerequisite reading**: [00 - Overview](00-overview.md), [01 - Architecture](01-architecture.md)

---

## Table of Contents

1. [Prerequisites and Planning](#1-prerequisites-and-planning)
2. [Phase 1 -- Server Preparation](#2-phase-1--server-preparation)
3. [Phase 2 -- Security Hardening](#3-phase-2--security-hardening)
4. [Phase 3 -- System Tuning and Database Configuration](#4-phase-3--system-tuning-and-database-configuration)
5. [Phase 4 -- HTTPS Certificates](#5-phase-4--https-certificates)
6. [Phase 5 -- Backups and Maintenance](#6-phase-5--backups-and-maintenance)
7. [Post-Installation Checklist](#7-post-installation-checklist)

---

## 1. Prerequisites and Planning

This guide covers preparing an Ubuntu server with all required software, security, and backups. After completing these steps, the server will be ready for Docker stack deployment (covered in [03 - Deployment](03-deployment.md)).

### 1.1 Hardware Requirements

**Single-server installation** (application + database on one machine):

| Resource | Specification |
|----------|--------------|
| CPU | 32 cores |
| RAM | 64 GB |
| Storage | 6 TB SSD |
| Network | 1 Gbit redundant uplink |
| IP | Dedicated public IPv4 address |

**Two-server installation** (database separated from application):

| Resource | Database Server | Application Server |
|----------|----------------|-------------------|
| CPU | 8 cores | 16 cores |
| RAM | 32 GB | 64 GB |
| Storage | 2 TB SSD | 1 TB SSD |
| Network | 1 Gbit redundant | 1 Gbit redundant |
| IP | Private or public IPv4 | Dedicated public IPv4 |

**Backup storage**: At least 1 TB (covers approximately 1 month of daily backups).

**For testing or demonstrations**: Smaller machines are acceptable (8 cores, 16 GB RAM).

The server can be a virtual machine or a dedicated physical machine.

### 1.2 Software Requirements

- **Ubuntu Server 24.04 LTS** (fresh installation recommended)
- **Internet access** (1 Gbit recommended for pulling Docker images and packages)
- **SMTP server** for outgoing emails (your ISP relay, or a dedicated service such as Amazon SES, Mailgun, etc.)
- **DNS management capability** to create and modify DNS records

### 1.3 DNS Domains

Configure the following DNS records, all pointing to the server's public IPv4 address:

| Domain | Purpose |
|--------|---------|
| `YOUR_DOMAIN` | Public homepage |
| `services.YOUR_DOMAIN` | Display System (citizen-facing interface) |
| `login.YOUR_DOMAIN` | Keycloak (authentication and identity provider) |
| `bpa.YOUR_DOMAIN` | BPA (service administration) |
| `gdb.YOUR_DOMAIN` | GDB (government database) |
| `stats.YOUR_DOMAIN` | Analytics dashboard |
| `graylog.YOUR_DOMAIN` | Centralized log management |
| `admin-home.YOUR_DOMAIN` | Administrative home page |

> **Note**: Replace `YOUR_DOMAIN` with your actual domain (e.g., `example.gov`). All records should be A records pointing to the same public IP. Create these records before starting Phase 4 (HTTPS certificates).

### 1.4 Firewall Port Requirements

**Inbound** (from internet to server):

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH remote administration |
| 80 | TCP | HTTP (redirects to HTTPS) |
| 443 | TCP | HTTPS (primary web traffic) |
| 8444 | TCP | Monitoring (Zabbix) |
| 9200 | TCP | Monitoring (OpenSearch) |
| 10050 | TCP | Monitoring (Zabbix agent) |

**Outbound** (from server to internet):

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH (git operations, remote access) |
| 53 | TCP/UDP | DNS resolution |
| 80 | TCP | HTTP (package updates, Docker image pulls) |
| 443 | TCP | HTTPS (package updates, Docker image pulls) |
| 587 | TCP | SMTP (outgoing emails) |
| -- | -- | All established/related connections |

---

## 2. Phase 1 -- Server Preparation

All commands in this guide should be executed over SSH. Begin by connecting to the server as the root user or an existing user with sudo privileges.

### 2.1 Create an Administrative User

> **Note**: Skip this step if a user with sudo privileges already exists on the system.

Create a dedicated administrative user named `manager`:

```bash
sudo addgroup --gid "1300" manager
sudo useradd -G sudo -m -s /bin/bash --uid "1300" --gid "1300" manager
```

Switch to the new user and configure SSH key access:

```bash
sudo su - manager
mkdir .ssh
touch .ssh/authorized_keys
chmod 700 .ssh
echo "YOUR_SSH_KEY" > .ssh/authorized_keys
```

> **Important**: Replace `YOUR_SSH_KEY` with your actual SSH public key. Test that you can log in as `manager` in a separate terminal before closing your current session.

**Verification**:
```bash
# In a new terminal window:
ssh manager@YOUR_SERVER_IP
whoami    # Should print: manager
sudo -v   # Should succeed without errors
```

### 2.2 Add Required Software Repositories

Add the Docker repository:

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/docker.gpg

echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list
```

Add the MongoDB 8.0 repository:

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

Add the PostgreSQL repository:

```bash
sudo sh -c 'echo "deb [arch=amd64] https://apt.postgresql.org/pub/repos/apt \
  $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
  sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
```

Add the HAProxy 2.9 repository:

```bash
sudo add-apt-repository ppa:vbernat/haproxy-2.9 -y
```

Update the package index:

```bash
sudo apt-get update
```

### 2.3 Install Core Packages

Install all required packages in a single operation:

```bash
sudo apt-get install -y \
  snapd snap vim-nox auditd \
  postgresql-18 postgresql-contrib postgresql \
  screen git qemu-guest-agent \
  pbzip2 python3-venv python3-pip python3-psycopg2 htop \
  ufw apt-transport-https ca-certificates curl software-properties-common \
  aptitude mongodb-org redis-server docker-ce bind9-dnsutils \
  haproxy=2.9.\*
```

Install Certbot via snap (used later for HTTPS certificates):

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo snap set certbot trust-plugin-with-root=ok
sudo snap install certbot-dns-cloudflare
```

**Verification**:
```bash
docker --version        # Docker CE installed
mongod --version        # MongoDB 8.x
psql --version          # PostgreSQL 18.x
redis-server --version  # Redis installed
haproxy -v              # HAProxy 2.9.x
certbot --version       # Certbot installed
```

### 2.4 Create Volume Directories and System Users

These directories are bind-mounted into Docker containers at runtime. Each service requires specific ownership and permissions.

**ActiveMQ volume**:

```bash
sudo mkdir -p /opt/volumes/activemq
sudo chown sys:sys /opt/volumes/activemq
sudo chmod 770 /opt/volumes/activemq
sudo chmod g+s /opt/volumes/activemq
```

**Graylog user and volume** (UID/GID 1100):

```bash
sudo addgroup --gid "1100" --quiet graylog
sudo adduser --disabled-password --disabled-login --gecos "" \
  --uid "1100" --gid "1100" --quiet graylog

sudo mkdir -p /opt/volumes/graylog/journal
sudo chown -R graylog:graylog /opt/volumes/graylog
sudo chmod 770 /opt/volumes/graylog
sudo chmod g+s /opt/volumes/graylog
```

**MinIO user and volume** (UID/GID 1001):

```bash
sudo addgroup --gid "1001" --quiet minio
sudo adduser --disabled-password --disabled-login --gecos "" \
  --uid "1001" --gid "1001" --quiet minio

sudo mkdir -p /opt/volumes/minio
sudo chown -R 1001:1001 /opt/volumes/minio
sudo chmod 770 /opt/volumes/minio
sudo chmod g+s /opt/volumes/minio
```

**OpenSearch volume** (UID 1000):

```bash
sudo mkdir -p /opt/volumes/opensearch/data
sudo mkdir -p /opt/volumes/opensearch/os_backup
sudo chown -R 1000:1000 /opt/volumes/opensearch
sudo chmod 770 /opt/volumes/opensearch
```

**GDB media volume** (UID 1000):

```bash
sudo mkdir -p /opt/volumes/gdb/media
sudo chown -R 1000:1000 /opt/volumes/gdb
sudo chmod -R 770 /opt/volumes/gdb
sudo chmod g+s /opt/volumes/gdb
```

**Backup directories**:

```bash
sudo mkdir -p /opt/backup/data/mongo
sudo mkdir -p /opt/backup/log
sudo mkdir -p /opt/backup/scripts
sudo chmod g+rwx /opt/backup/data
sudo chmod g+rwx /opt/backup/log
sudo chgrp postgres /opt/backup/data
sudo chgrp postgres /opt/backup/log/
```

**Verification**:
```bash
ls -la /opt/volumes/
# Should list: activemq, graylog, minio, opensearch, gdb

ls -la /opt/backup/
# Should list: data, log, scripts

id graylog   # uid=1100(graylog) gid=1100(graylog)
id minio     # uid=1001(minio) gid=1001(minio)
```

### 2.5 Reboot

Reboot the server to ensure all new packages and kernel modules are loaded:

```bash
sudo reboot
```

After the server comes back up, reconnect via SSH and verify services are running:

```bash
systemctl is-active mongod       # Should show: active (or inactive, configured later)
systemctl is-active redis-server  # Should show: active
systemctl is-active postgresql    # Should show: active
systemctl is-active docker        # Should show: active
```

---

## 3. Phase 2 -- Security Hardening

### 3.1 Configure UFW Firewall

Set the default policies and allow required services:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

Allow traffic from Docker bridge networks (required for container-to-host communication):

```bash
sudo ufw allow from 172.18.0.0/16
sudo ufw allow from 172.19.0.0/16
```

### 3.2 Harden SSH

> **WARNING**: Before making SSH changes, verify that public key authentication works. Open a second terminal and confirm you can log in with your key. If you lock yourself out, you will need physical or console access to recover.

Remove any distribution-provided SSH configuration overrides and apply hardened settings:

```bash
sudo rm /etc/ssh/sshd_config.d/*.conf

echo -e "PermitRootLogin no\nPubkeyAuthentication yes\nPermitEmptyPasswords no\nPasswordAuthentication no" | \
  sudo tee -a /etc/ssh/sshd_config

sudo systemctl restart ssh
sudo systemctl daemon-reload
```

**What this does**:
- Disables direct root login
- Enforces public key authentication
- Disables password-based authentication
- Disables empty passwords

**Verification** (from a new terminal):
```bash
ssh manager@YOUR_SERVER_IP  # Should succeed with your key
ssh root@YOUR_SERVER_IP     # Should be denied
```

### 3.3 Configure UFW for Docker Compatibility

Docker bypasses UFW rules by default because it manipulates iptables directly. The following rules ensure UFW controls Docker's external traffic.

Append the following block to the **end** of `/etc/ufw/after.rules`:

```bash
sudo tee -a /etc/ufw/after.rules << 'EOF'
# BEGIN UFW AND DOCKER
*filter
:ufw-user-forward - [0:0]
:ufw-docker-logging-deny - [0:0]
:DOCKER-USER - [0:0]
-A DOCKER-USER -j ufw-user-forward
-A DOCKER-USER -j RETURN -s 10.0.0.0/8
-A DOCKER-USER -j RETURN -s 172.16.0.0/12
-A DOCKER-USER -j RETURN -s 192.168.0.0/16
-A DOCKER-USER -p udp -m udp --sport 53 --dport 1024:65535 -j RETURN
-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 192.168.0.0/16
-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 10.0.0.0/8
-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 172.16.0.0/12
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 192.168.0.0/16
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 10.0.0.0/8
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 172.16.0.0/12
-A DOCKER-USER -j RETURN
-A ufw-docker-logging-deny -m limit --limit 3/min --limit-burst 10 -j LOG --log-prefix "[UFW DOCKER BLOCK] "
-A ufw-docker-logging-deny -j DROP
COMMIT
# END UFW AND DOCKER
EOF
```

**What this does**:
- Routes Docker traffic through UFW's user-defined forward chain
- Allows traffic from private IP ranges (container-to-container)
- Allows DNS response traffic
- Blocks and logs unsolicited inbound traffic to Docker containers from the internet
- Prevents Docker from exposing container ports that should remain internal

### 3.4 Enable UFW

> **WARNING**: Double-check that SSH key authentication works before enabling UFW. If SSH is blocked, you will be locked out of the server.

```bash
sudo ufw enable
```

**Verification**:
```bash
sudo ufw status verbose
```

Expected output should show:
- Default: deny (incoming), allow (outgoing)
- Rules for SSH (22), HTTP (80), HTTPS (443)
- Rules for 172.18.0.0/16 and 172.19.0.0/16

---

## 4. Phase 3 -- System Tuning and Database Configuration

### 4.1 Kernel Parameters

**Increase virtual memory map count** (required by OpenSearch/Elasticsearch):

```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

**Reduce swap usage** (prioritize RAM over swap for database workloads):

```bash
sudo sysctl -w vm.swappiness=1
echo "vm.swappiness = 1" | sudo tee -a /etc/sysctl.d/99-sysctl.conf
```

**Disable automatic unattended upgrades** (prevent unexpected package changes in production):

```bash
sudo sed -i 's/APT::Periodic::Unattended-Upgrade "1";/APT::Periodic::Unattended-Upgrade "0";/g' \
  /etc/apt/apt.conf.d/20auto-upgrades
```

> **Note**: With unattended upgrades disabled, you are responsible for scheduling and applying security patches manually. Plan a regular maintenance window.

**Configure bash history with timestamps** (for audit and troubleshooting):

```bash
sudo tee /etc/profile.d/02-history.sh << 'EOS'
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTTIMEFORMAT="%F %T "
EOS
sudo chmod +x /etc/profile.d/02-history.sh
```

**Verification**:
```bash
sysctl vm.max_map_count    # Should show: 262144
sysctl vm.swappiness       # Should show: 1
```

### 4.2 Configure Redis

Modify Redis to accept connections from Docker containers and run under systemd supervision:

```bash
sudo sed -i '/^bind 127.0.0.1 -::1/s/ 127.0.0.1 -::1/ 0.0.0.0/' /etc/redis/redis.conf
sudo sed -i '/^protected-mode yes/s/ yes/ no/' /etc/redis/redis.conf
sudo sed -i 's/# supervised auto/supervised systemd/g' /etc/redis/redis.conf
```

Enable and restart Redis:

```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

**What changed**:
- `bind 0.0.0.0` -- listen on all interfaces (Docker containers connect via bridge network)
- `protected-mode no` -- allow connections without authentication (secured at the network layer by UFW)
- `supervised systemd` -- integrate with systemd for proper process management

**Verification**:
```bash
sudo systemctl status redis-server   # Should show: active (running)
redis-cli ping                        # Should return: PONG
```

### 4.3 Install Docker Compose

Install the standalone `docker-compose` binary (required by the eRegistrations deployment scripts):

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Verification**:
```bash
docker-compose --version   # Should show the installed version
```

### 4.4 Configure MongoDB

**Bind to all interfaces** (allows Docker containers to connect):

```bash
sudo sed -i '/^  bindIp: 127.0.0.1/s/ 127.0.0.1/ 0.0.0.0/' /etc/mongod.conf
```

**Set WiredTiger cache size** to 4 GB (prevents MongoDB from consuming all available memory):

```bash
sudo sed -i '/#  wiredTiger:/a \ \ wiredTiger:' /etc/mongod.conf
sudo sed -i '/^  wiredTiger:/a \ \ \ \ engineConfig:' /etc/mongod.conf
sudo sed -i '/^    engineConfig:/a \ \ \ \ \ cacheSizeGB: 4' /etc/mongod.conf
```

**Configure automatic restart via systemd** (ensures MongoDB recovers from crashes):

Create the systemd override file:

```bash
sudo mkdir -p /etc/systemd/system/mongod.service.d
sudo tee /etc/systemd/system/mongod.service.d/override.conf << 'EOF'
[Unit]
StartLimitIntervalSec=1000
StartLimitBurst=10

[Service]
Restart=always
RestartSec=10s
EOF
```

Enable and restart MongoDB:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mongod
sudo systemctl restart mongod
```

**Verification**:
```bash
sudo systemctl status mongod   # Should show: active (running)
mongosh --eval "db.runCommand({ ping: 1 })"   # Should return: { ok: 1 }
```

### 4.5 Configure Docker Logging

Limit Docker container log sizes to prevent disk exhaustion:

```bash
sudo tee /etc/docker/daemon.json << 'EOS'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOS
```

Restart Docker to apply:

```bash
sudo systemctl restart docker
```

**What this does**: Each container keeps at most 3 log files of 10 MB each (30 MB total per container). Older logs are automatically rotated.

**Verification**:
```bash
docker info | grep "Logging Driver"   # Should show: json-file
```

### 4.6 Configure PostgreSQL 18

**Enable authenticated local access** (scram-sha-256):

```bash
sudo sed -i '/# "local" is for Unix domain socket connections only/a \
local   all             all                                     scram-sha-256' \
  /etc/postgresql/18/main/pg_hba.conf

echo "host    all             all             0.0.0.0/0               scram-sha-256" | \
  sudo tee -a /etc/postgresql/18/main/pg_hba.conf
```

**Increase maximum connections** (required for the eRegistrations stack):

```bash
sudo sed -i '/^max_connections = 100/s/= 100/ = 1000/' \
  /etc/postgresql/18/main/postgresql.conf
```

**Configure network listening and logging**:

```bash
sudo tee -a /etc/postgresql/18/main/postgresql.conf << 'EOS'
listen_addresses = '*'
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql/'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
client_min_messages = notice
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = -1
EOS
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

**What changed**:
- `listen_addresses = '*'` -- accept connections from Docker containers
- `max_connections = 1000` -- support the full eRegistrations stack (many microservices connect simultaneously)
- `scram-sha-256` -- modern password authentication for all connections
- Logging configured with daily rotation to `/var/log/postgresql/`

**Verification**:
```bash
sudo systemctl status postgresql   # Should show: active (running)
sudo -u postgres psql -c "SHOW max_connections;"   # Should show: 1000
sudo -u postgres psql -c "SHOW listen_addresses;"  # Should show: *
```

---

## 5. Phase 4 -- HTTPS Certificates

eRegistrations requires HTTPS for all web traffic. HAProxy terminates TLS and needs a combined certificate file. You can use either host-based or wildcard certificates.

### 5.1 Install Certbot

If not installed during Phase 1:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo snap set certbot trust-plugin-with-root=ok
sudo snap install certbot-dns-cloudflare
```

### 5.2 Option A: Host-Based Certificates

Issue individual certificates for each domain. The server must be reachable on ports 80/443:

```bash
sudo certbot certonly --standalone \
  -d YOUR_DOMAIN \
  -d services.YOUR_DOMAIN \
  -d login.YOUR_DOMAIN \
  -d bpa.YOUR_DOMAIN \
  -d gdb.YOUR_DOMAIN \
  -d stats.YOUR_DOMAIN \
  -d graylog.YOUR_DOMAIN \
  -d admin-home.YOUR_DOMAIN
```

> **Note**: Replace `YOUR_DOMAIN` with your actual domain. All domains must resolve to this server's IP before running the command. Stop HAProxy temporarily if it is already running on port 80/443.

### 5.3 Option B: Wildcard Certificate (DNS Challenge)

A wildcard certificate covers all subdomains with a single certificate. This requires DNS TXT record access:

```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  --email YOUR_EMAIL \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  --manual-public-ip-logging-ok \
  -d "*.YOUR_DOMAIN" \
  -d YOUR_DOMAIN
```

> **Note**: Replace `YOUR_EMAIL` with your email address and `YOUR_DOMAIN` with your actual domain. Certbot will prompt you to create a DNS TXT record. Follow the instructions and wait for DNS propagation before pressing Enter.

### 5.4 Combine Certificates for HAProxy

HAProxy requires the full certificate chain and private key in a single file:

```bash
sudo cat /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem \
  /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem | \
  sudo tee /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt
```

> **Note**: Replace `YOUR_DOMAIN` with the actual directory name created by Certbot under `/etc/letsencrypt/live/`. Check with `ls /etc/letsencrypt/live/` if unsure.

**Verification**:
```bash
sudo ls -la /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt
# Should exist and be non-empty

sudo openssl x509 -in /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem -noout -dates
# Should show valid notBefore and notAfter dates
```

> **Renewal note**: Let's Encrypt certificates expire every 90 days. Certbot installs an automatic renewal timer. After each renewal, you must regenerate the `haproxy.crt` file and reload HAProxy. Consider adding this to a post-renewal hook:
> ```bash
> sudo tee /etc/letsencrypt/renewal-hooks/post/haproxy.sh << 'EOF'
> #!/bin/bash
> cat /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem \
>   /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem \
>   > /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt
> systemctl reload haproxy
> EOF
> sudo chmod +x /etc/letsencrypt/renewal-hooks/post/haproxy.sh
> ```

---

## 6. Phase 5 -- Backups and Maintenance

### 6.1 Create the Backup Script

Create the maintenance script file:

```bash
sudo touch /opt/backup/scripts/maintenance.sh
sudo chmod +x /opt/backup/scripts/maintenance.sh
```

Write the full backup script:

```bash
sudo tee /opt/backup/scripts/maintenance.sh << 'SCRIPT'
#!/bin/bash
#
# eRegistrations Nightly Backup Script
# Backs up: system files, MinIO, MongoDB, PostgreSQL, OpenSearch
# Retention: 5 days
#

DATADIR="/opt/backup/data"
LOGDIR="/opt/backup/log"
HOSTFQDN="$(hostname -f)"
NUMCPU="6"

# MongoDB credentials (uncomment and set if authentication is enabled)
# MONGOUSER="YOUR_MONGO_USERNAME"
# MONGOPASS="YOUR_MONGO_PASSWORD"

cd "$DATADIR" || exit 1

# Remove previous completion marker
rm -f backupdone

echo "=== Backup started at $(date) on ${HOSTFQDN} ==="

#### System files backup ####
echo "[$(date)] Starting system files backup..."
tar --ignore-failed-read -cvf "$DATADIR/sysbackup.tar" \
  /etc /opt/eregistrations /opt/backup/scripts \
  &>"$LOGDIR/sysbackup.log"
pbzip2 -p"$NUMCPU" sysbackup.tar
mv sysbackup.tar.bz2 "sysbackup_$(date +%F_%H%M).tar.bz2"
echo "[$(date)] System files backup complete."

#### MinIO backup ####
echo "[$(date)] Starting MinIO backup..."
tar --ignore-failed-read --use-compress-prog=pbzip2 \
  -cf "$DATADIR/minio.tar.bz2" /opt/volumes/minio \
  &>"$LOGDIR/minio.log"
mv minio.tar.bz2 "minio_$(date +%F_%H%M).tar.bz2"
echo "[$(date)] MinIO backup complete."

#### MongoDB backup ####
echo "[$(date)] Starting MongoDB backup..."
# Without authentication:
mongodump -o "$DATADIR/mongo" &>"$LOGDIR/mongobackup.log"
# With authentication (uncomment the line below and comment out the line above):
# mongodump -u "$MONGOUSER" -p "$MONGOPASS" -o "$DATADIR/mongo" &>"$LOGDIR/mongobackup.log"

tar -cvf "$DATADIR/mongod.tar" "$DATADIR/mongo" &>>"$LOGDIR/mongobackup.log"
pbzip2 -p"$NUMCPU" mongod.tar
mv mongod.tar.bz2 "mongod_$(date +%F_%H%M).tar.bz2"
rm -rf "$DATADIR/mongo"
echo "[$(date)] MongoDB backup complete."

#### PostgreSQL backup ####
echo "[$(date)] Starting PostgreSQL backup..."
su - postgres -c "pg_basebackup -D /opt/backup/data/postgres &> $LOGDIR/postgresbackup.log"
tar -cf postgres.tar postgres
rm -rf postgres
pbzip2 -p"$NUMCPU" postgres.tar
mv postgres.tar.bz2 "postgres_$(date +%F_%H%M).tar.bz2"
echo "[$(date)] PostgreSQL backup complete."

#### OpenSearch backup ####
echo "[$(date)] Starting OpenSearch backup..."

# Register snapshot repository (idempotent)
docker exec -t $(docker ps -q -f name=opensearch-node1) \
  curl -s -XPUT "http://localhost:9200/_snapshot/os_backup" \
  -H 'Content-Type: application/json' \
  -d '{"type": "fs","settings": {"location": "/opt/os_backup"}}'

# Create snapshot (waits for completion)
docker exec -t $(docker ps -q -f name=opensearch-node1) \
  curl -s -XPUT "http://localhost:9200/_snapshot/os_backup/os_backup_data?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d '{"ignore_unavailable": true, "partial": false}'

# Archive snapshot data
tar -cvf "$DATADIR/opensearch.tar" /opt/volumes/opensearch/os_backup \
  &>>"$LOGDIR/opensearch.log"

# Remove snapshot from OpenSearch (free disk space inside container)
docker exec -t $(docker ps -q -f name=opensearch-node1) \
  curl -s -XDELETE "http://localhost:9200/_snapshot/os_backup/os_backup_data"

# Compress
pbzip2 -p5 opensearch.tar
mv opensearch.tar.bz2 "opensearch_$(date +%F_%H%M).tar.bz2"
echo "[$(date)] OpenSearch backup complete."

#### Cleanup old backups ####
echo "[$(date)] Removing backups older than 5 days..."
find "$DATADIR" -type f -mtime +5 -exec rm {} \;

#### Mark backup as complete ####
echo "BACKUPOK" > "$DATADIR/backupdone"
echo "=== Backup completed at $(date) ==="
SCRIPT
```

### 6.2 Configure Cron Jobs

Add the nightly backup and Docker cleanup jobs to root's crontab:

```bash
sudo crontab -l 2>/dev/null | {
  cat
  echo "# eRegistrations nightly backup at midnight"
  echo "0 0 * * * /opt/backup/scripts/maintenance.sh &>/opt/backup/log/maintenance-cron.log"
  echo "# Docker cleanup at 4:01 AM (removes unused images, containers, volumes)"
  echo "1 4 * * * /usr/bin/docker system prune -a --volumes -f > /var/log/docker_prune.log"
} | sudo crontab -
```

> **WARNING**: The `docker system prune -a --volumes -f` command removes **all unused images, containers, and volumes**. This is intentional for production (prevents disk exhaustion) but will remove any stopped containers and their data. Make sure all critical containers are running before 4:01 AM.

**Verification**:
```bash
sudo crontab -l
# Should show both cron entries

# Test the backup script manually (optional, takes several minutes):
sudo /opt/backup/scripts/maintenance.sh
cat /opt/backup/data/backupdone   # Should show: BACKUPOK
ls -lh /opt/backup/data/          # Should show timestamped .tar.bz2 files
```

### 6.3 Backup Retention Summary

| What | Location | Retention |
|------|----------|-----------|
| System files (`/etc`, `/opt/eregistrations`, scripts) | `/opt/backup/data/sysbackup_*.tar.bz2` | 5 days |
| MinIO object storage | `/opt/backup/data/minio_*.tar.bz2` | 5 days |
| MongoDB (full dump) | `/opt/backup/data/mongod_*.tar.bz2` | 5 days |
| PostgreSQL (base backup) | `/opt/backup/data/postgres_*.tar.bz2` | 5 days |
| OpenSearch snapshots | `/opt/backup/data/opensearch_*.tar.bz2` | 5 days |

> **Recommendation**: Copy backup files to a separate off-site server or cloud storage. Local backups alone do not protect against disk failure or server loss. A separate backup server with at least 1 TB of disk space is recommended for production deployments.

---

## 7. Post-Installation Checklist

Use this checklist to verify that all installation steps have been completed successfully.

### Infrastructure

- [ ] Ubuntu 24.04 LTS installed (fresh)
- [ ] Administrative user (`manager`) created with SSH key access
- [ ] DNS records created for all 8 domains, pointing to server IP

### Packages and Services

- [ ] Docker CE installed and running (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] MongoDB 8.0 installed and running (`mongosh --eval "db.runCommand({ping:1})"`)
- [ ] PostgreSQL 18 installed and running (`sudo -u postgres psql -c "SELECT 1;"`)
- [ ] Redis installed and running (`redis-cli ping` returns `PONG`)
- [ ] HAProxy 2.9 installed (`haproxy -v`)
- [ ] Certbot installed (`certbot --version`)

### Volume Directories

- [ ] `/opt/volumes/activemq` -- owned by `sys:sys`, mode 770
- [ ] `/opt/volumes/graylog/journal` -- owned by `graylog:graylog`, mode 770
- [ ] `/opt/volumes/minio` -- owned by `1001:1001`, mode 770
- [ ] `/opt/volumes/opensearch/data` and `os_backup` -- owned by `1000:1000`, mode 770
- [ ] `/opt/volumes/gdb/media` -- owned by `1000:1000`, mode 770
- [ ] `/opt/backup/data`, `/opt/backup/log`, `/opt/backup/scripts` -- exist and writable

### Security

- [ ] UFW enabled with deny-incoming / allow-outgoing defaults
- [ ] SSH hardened (password auth disabled, root login disabled)
- [ ] UFW Docker rules appended to `/etc/ufw/after.rules`
- [ ] SSH key-based access verified from external machine

### System Tuning

- [ ] `vm.max_map_count = 262144` (persistent in `/etc/sysctl.conf`)
- [ ] `vm.swappiness = 1` (persistent in `/etc/sysctl.d/99-sysctl.conf`)
- [ ] Unattended upgrades disabled
- [ ] Bash history timestamps configured

### Database Configuration

- [ ] Redis: bound to `0.0.0.0`, protected-mode off, supervised by systemd
- [ ] MongoDB: bound to `0.0.0.0`, WiredTiger cache 4 GB, auto-restart enabled
- [ ] PostgreSQL: `listen_addresses = '*'`, `max_connections = 1000`, `scram-sha-256`, logging on

### Docker

- [ ] Docker logging: `json-file` driver, `max-size: 10m`, `max-file: 3`

### HTTPS

- [ ] TLS certificates issued (Let's Encrypt)
- [ ] Combined `haproxy.crt` file created at `/etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt`
- [ ] Renewal hook configured (optional but recommended)

### Backups

- [ ] `/opt/backup/scripts/maintenance.sh` exists and is executable
- [ ] Cron: midnight backup job configured
- [ ] Cron: 4:01 AM Docker prune job configured
- [ ] Test backup run completed successfully (`/opt/backup/data/backupdone` contains `BACKUPOK`)

---

*Previous: [01 - Architecture](01-architecture.md) | Next: [03 - Deployment](03-deployment.md) (Docker stack deployment and initial configuration)*
