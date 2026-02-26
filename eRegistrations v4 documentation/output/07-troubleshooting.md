# eRegistrations v4 — Troubleshooting Guide

**Audience**: System administrators, DevOps engineers
**Prerequisites**: SSH access, Docker familiarity, basic SQL knowledge

---

## 1. Troubleshooting Approach

When diagnosing issues in eRegistrations, follow this order:

1. **Check logs** — Graylog first, then container logs
2. **Check resources** — CPU, memory, disk, swap
3. **Check connectivity** — HAProxy, Docker networking, database connections
4. **Check containers** — Running status, restart count, health
5. **Restart if needed** — Individual container first, then full stack

---

## 2. Log Analysis

### 2.1 Graylog (Primary)

Access centralized logs at:

```
https://graylog.YOUR_DOMAIN/search
```

- **Search exact error messages** using quotes: `"NullPointerException in ServiceController"`
- **Filter by severity**: Levels 0 (emergency) through 7 (debug)
- **Use time ranges** to narrow results around the time of the reported issue

Log entries include metadata: container name, severity level, timestamp, and message content.

### 2.2 Container Logs (Fallback)

If Graylog is unavailable or the container has been recently restarted:

```bash
# Search for exceptions in a container
docker logs ereg-cms-frontend 2>&1 | grep -i 'exception' -A 5 -B 5

# Tail logs in real-time (last 1000 lines, then follow)
docker logs -f -n 1000 ereg-cms-frontend

# Same for BPA backend
docker logs bpa-backend 2>&1 | grep -i 'error' -A 5 -B 5
```

### 2.3 HAProxy Logs

Verify that traffic is reaching containers:

```bash
sudo tail -f /var/log/haproxy.log
```

---

## 3. Resource Monitoring

### 3.1 System Resources

```bash
# Interactive resource monitor
htop

# Docker container resource usage
docker stats
```

Key indicators:

| Indicator | Normal | Warning |
|-----------|--------|---------|
| CPU per container | < 80% | > 90% sustained |
| Memory per container | Within limit | Approaching limit |
| Swap usage | 0 | Any usage indicates RAM exhaustion |
| Disk usage | < 80% | > 90% |

### 3.2 Disk Space

```bash
# Check overall disk usage
df -h

# Check backup directory size
du -sh /opt/backup/data/

# Check Docker disk usage
docker system df
```

---

## 4. Common Issues and Solutions

### 4.1 Container Not Running

**Symptom**: Service unavailable, `docker ps` does not show the container.

```bash
# Check all containers (including stopped)
docker ps -a

# Check container logs for crash reason
docker logs <container_name>

# Restart specific container
docker-compose restart <service_name>

# If that fails, recreate
docker-compose up -d <service_name>
```

### 4.2 Stack Behaving Erratically / Out of Memory

**Symptom**: Multiple services slow or unresponsive, swap usage detected.

```bash
# Full stack restart
cd /opt/eregistrations/compose/eregistrations
docker-compose down
docker-compose up -d
```

### 4.3 Database Connection Errors

**PostgreSQL**:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart if needed
sudo service postgresql restart

# Check active connections
sudo su - postgres
psql
SELECT count(*) FROM pg_stat_activity;
# If near max_connections (1000), investigate long-running queries
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

**MongoDB**:

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Restart if needed
sudo service mongod restart

# Check database status
mongosh
use admin
db.auth('eregistration', 'YOUR_MONGO_PASSWORD')
db.serverStatus().connections
```

### 4.4 Docker Image Pull Failures (401/403)

**Symptom**: `docker-compose pull` returns authentication errors.

```bash
# Log in to Docker registry
docker login
# Use credentials from the .env file
```

### 4.5 SSL Certificate Issues

**Symptom**: Browser shows certificate warnings, HTTPS not working.

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem -noout -dates

# Test SSL connection
openssl s_client -connect YOUR_DOMAIN:443

# Renew and rebuild HAProxy cert
sudo certbot renew
sudo cat /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem \
  /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem | \
  sudo tee /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt
sudo service haproxy restart
```

### 4.6 Networking Issues

**Symptom**: Containers cannot communicate with each other.

```bash
# Inspect Docker network
docker network inspect deploy_default
# Should show 172.18.0.0/16 and all microservice containers

# Check UFW status
sudo ufw status verbose

# Verify Docker subnet rules exist
sudo ufw status | grep 172.18
# Should show: ALLOW from 172.18.0.0/16
```

### 4.7 ActiveMQ Connectivity

**Symptom**: Services not receiving publish notifications, translation sync failing.

```bash
# Check if ActiveMQ container is running
docker ps | grep -i activemq

# Test connectivity from inside another container
docker exec -it ereg-cms-frontend bash
apt update && apt install telnet
telnet activemq 61613
# Success = Docker networking works and ActiveMQ is responding on STOMP port
```

### 4.8 Form.io Issues

**Symptom**: Forms not rendering, form submission errors.

```bash
# Check Form.io container
docker ps | grep formio
docker logs $(docker ps -q -f name=formio)

# Verify connectivity from BPA backend
docker exec -it bpa-backend bash
curl -s http://formio:3001/status
```

### 4.9 Camunda Issues

**Symptom**: Workflows not starting, tasks not assigned.

```bash
# Check Camunda container
docker ps | grep camunda
docker logs $(docker ps -q -f name=camunda)

# Access Camunda Cockpit (via port forwarding)
ssh -L 6009:localhost:6009 user@YOUR_SERVER
# Then visit: http://localhost:6009/app/cockpit/default/#/
```

---

## 5. Advanced Debugging

### 5.1 Django Shell (DS)

For deep debugging of the Display System:

```bash
# Enter container
docker exec -it ereg-cms-frontend bash

# Activate virtual environment (if present)
source venv/bin/activate

# Open Django shell
python3.11 manage.py shell
```

If the container does not have a virtual environment (older versions):

```bash
python3 manage.py shell
```

From the shell, you can inspect configuration, test database connectivity, and verify service state.

### 5.2 PostgreSQL Debug Queries

```sql
-- Check for deadlocks
SELECT * FROM pg_stat_statements WHERE calls > 0 ORDER BY deadlock_time DESC;

-- Check active locks
SELECT * FROM pg_locks;

-- Check active connections and queries
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

### 5.3 Port Forwarding for Admin UIs

Several admin interfaces are only accessible from localhost. Use SSH port forwarding:

```bash
ssh -L 9000:localhost:9000 -L 8161:localhost:8161 -L 6009:localhost:6009 user@YOUR_SERVER
```

Then access:

| URL | Service |
|-----|---------|
| `http://localhost:9000` | Portainer (Docker management) |
| `http://localhost:8161/admin/queues.jsp` | ActiveMQ (queue/topic state) |
| `http://localhost:6009/app/cockpit/default/#/` | Camunda (process definitions) |

---

## 6. Admin UI Quick Reference

| URL | Purpose | Access |
|-----|---------|--------|
| `https://bpa.YOUR_DOMAIN/settings` | BPA instance settings | Public (authenticated) |
| `https://login.YOUR_DOMAIN/auth/admin/` | Keycloak admin console | Public (authenticated) |
| `https://services.YOUR_DOMAIN/admin/` | Django admin (DS) | Public (authenticated) |
| `https://graylog.YOUR_DOMAIN/search` | Log analysis | Public (authenticated) |
| `http://localhost:9000` | Portainer | SSH tunnel only |
| `http://localhost:8161/admin/` | ActiveMQ admin | SSH tunnel only |
| `http://localhost:6009/app/cockpit/` | Camunda Cockpit | SSH tunnel only |

---

## 7. Updating the Stack

Standard update procedure:

```bash
# Switch to deployment user
sudo su - jenkins

# Navigate to deployment directory
cd /opt/eregistrations/compose/eregistrations

# Pull latest configuration
git pull

# Pull latest Docker images
docker-compose pull

# Restart services with new images
docker-compose up -d

# Restart HAProxy (picks up config changes via symlink)
sudo service haproxy restart
```

HAProxy automatically reloads configuration because it uses symlinks to the Git repository.

---

## 8. Emergency Procedures

### Full Stack Restart

```bash
cd /opt/eregistrations/compose/eregistrations
docker-compose down
docker-compose up -d
sudo service haproxy restart
sudo service postgresql restart
sudo service mongod restart
sudo service redis-server restart
```

### Database Recovery

If databases are corrupted, restore from the latest backup:

```bash
# PostgreSQL
sudo service postgresql stop
sudo su - postgres
# Follow pg_basebackup restore procedure
sudo service postgresql start

# MongoDB
sudo service mongod stop
mongorestore --drop /opt/backup/data/mongo/
sudo service mongod start
```

Always test on a non-production instance before applying to production.

---

*Previous: [06 - Maintenance](06-maintenance.md) | Next: [08 - Integration](08-integration.md)*
