# eRegistrations v4 — Maintenance Guide

**Audience**: System administrators, DevOps engineers
**Prerequisites**: Server access (SSH), Docker familiarity, basic PostgreSQL/MongoDB knowledge

---

## 1. Maintenance Overview

eRegistrations requires regular maintenance to ensure system stability, security, and performance. Maintenance tasks are organized by frequency: daily (automated), monthly, quarterly/yearly, and on-demand.

---

## 2. Daily Tasks (Automated)

### 2.1 Data Backups

Backups run automatically every night at midnight via cron job. The backup script covers:

| Component | Method | Output |
|-----------|--------|--------|
| System files | `tar` + `pbzip2` | `sysbackup_YYYY-MM-DD_HHMM.tar.bz2` |
| MinIO (file uploads) | `tar` + `pbzip2` | `minio_YYYY-MM-DD_HHMM.tar.bz2` |
| MongoDB | `mongodump` + `tar` + `pbzip2` | `mongod_YYYY-MM-DD_HHMM.tar.bz2` |
| PostgreSQL | `pg_basebackup` + `tar` + `pbzip2` | `postgres_YYYY-MM-DD_HHMM.tar.bz2` |
| OpenSearch | Snapshot API + `tar` + `pbzip2` | `opensearch_YYYY-MM-DD_HHMM.tar.bz2` |

**Backup location**: `/opt/backup/data/`
**Log location**: `/opt/backup/log/`
**Retention**: 5 days locally (configurable)

**Backup verification**: Check for the `backupdone` file:

```bash
cat /opt/backup/data/backupdone
# Should output: BACKUPOK
```

**Backup parameters**:

| Parameter | Default | Description |
|-----------|---------|-------------|
| Recovery Point Objective (RPO) | 24 hours | Maximum acceptable data loss |
| Retention (local) | 5 days | Files older than 5 days are deleted |
| Retention (remote) | 20 days | Adjustable per instance |

### 2.2 Docker Cleanup

A Docker prune runs daily at 4:01 AM:

```
1 4 * * * /usr/bin/docker system prune -a --volumes -f > /var/log/docker_prune.log
```

This removes all unused images, containers, and volumes. This is aggressive but keeps disk usage under control.

### 2.3 Performance Monitoring

Zabbix monitors server resources continuously:

- CPU and memory usage per container
- Disk space and I/O
- Network throughput
- Container health status

Respond to Zabbix alerts promptly. Common triggers:

| Alert | Likely Cause | Action |
|-------|-------------|--------|
| High CPU | Heavy processing or runaway container | Check `docker stats`, restart container |
| High memory / swap usage | Memory leak or undersized server | Check `htop`, consider scaling |
| Disk space low | Backup accumulation or log growth | Check `/opt/backup/data/`, run manual prune |
| Container down | Crash or OOM kill | Check `docker logs <container>`, restart |

### 2.4 Cron Job Reference

```
0 0 * * * /opt/backup/scripts/maintenance.sh &>/opt/backup/log/maintenance-cron.log
1 4 * * * /usr/bin/docker system prune -a --volumes -f > /var/log/docker_prune.log
```

---

## 3. Monthly Tasks

### 3.1 Software Updates

Apply available updates and patches:

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade

# Update Docker images
cd /opt/eregistrations/compose/eregistrations
git pull
docker-compose pull
docker-compose up -d
sudo service haproxy restart
```

**Security updates** should be applied immediately when acknowledged, not on a monthly schedule.

If `docker-compose pull` returns 401/403 errors:

```bash
docker login
# Use credentials from the .env file
```

### 3.2 Review Graylog Alerts

Check Graylog for recurring warnings or errors:

```
https://graylog.YOUR_DOMAIN/search
```

Look for:
- Repeated exceptions in application logs
- Authentication failures (potential brute-force attempts)
- Database connection errors

---

## 4. Quarterly and Yearly Tasks

### 4.1 Review User Access Permissions

1. Audit Keycloak users and roles at `https://login.YOUR_DOMAIN/auth/admin/`
2. Remove inactive users
3. Verify role assignments match current organizational structure
4. Review GDB permissions (field-level access)

### 4.2 Performance Tuning

Analyze system metrics and adjust:

```bash
# Check resource usage
htop
docker stats

# Check PostgreSQL performance
sudo su - postgres
psql
\c YOUR_DATABASE
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_statements WHERE calls > 0 ORDER BY total_exec_time DESC LIMIT 20;
```

Common tuning actions:
- Increase PostgreSQL `shared_buffers` if memory allows
- Adjust MongoDB `wiredTiger.cacheSizeGB` based on available RAM
- Scale Docker container resource limits

### 4.3 Test Backup Restoration

Periodically verify backups can be restored:

1. **PostgreSQL**: Restore to a test instance

```bash
# Create test database
sudo su - postgres
createdb test_restore

# Restore from backup
tar -xf postgres_YYYY-MM-DD_HHMM.tar.bz2
pg_restore -d test_restore postgres/

# Verify data
psql -d test_restore -c "SELECT count(*) FROM some_table;"

# Clean up
dropdb test_restore
```

2. **MongoDB**: Restore to a test database

```bash
tar -xf mongod_YYYY-MM-DD_HHMM.tar.bz2
mongorestore --db test_restore mongo/YOUR_DB/
mongosh test_restore --eval "db.stats()"
mongosh test_restore --eval "db.dropDatabase()"
```

### 4.4 Hardware Evaluation

Assess whether current resources are sufficient:

- Check if swap is being used (indicates insufficient RAM)
- Monitor disk usage trends
- Review network bandwidth utilization
- Plan capacity for expected growth in users and services

### 4.5 SSL Certificate Renewal

Certificates must be renewed before expiry. Let's Encrypt certificates expire after 90 days.

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem -noout -dates

# Renew certificates
sudo certbot renew

# Rebuild HAProxy certificate
sudo cat /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem \
  /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem | \
  sudo tee /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt

# Restart HAProxy
sudo service haproxy restart
```

Consider automating renewal with a cron job:

```
0 3 1 * * certbot renew --quiet && cat /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem > /etc/letsencrypt/live/YOUR_DOMAIN/haproxy.crt && service haproxy restart
```

---

## 5. On-Demand Tasks

### 5.1 Review System Logs

Use Graylog for centralized log analysis:

```
https://graylog.YOUR_DOMAIN/search
```

- Search for specific errors using quoted strings for exact match
- Filter by severity level (0=emergency to 7=debug)
- Use time-range selectors to narrow results

If Graylog is unavailable, access container logs directly:

```bash
docker logs ereg-cms-frontend 2>&1 | grep -i 'exception' -A 5 -B 5
docker logs -f -n 1000 ereg-cms-frontend
```

### 5.2 Database Maintenance

**PostgreSQL** — check for locks and long-running queries:

```sql
-- Active connections
SELECT * FROM pg_stat_activity;

-- Locks
SELECT * FROM pg_locks;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

**MongoDB** — check database status:

```bash
mongosh
use admin
db.auth('eregistration', 'YOUR_MONGO_PASSWORD')
db.serverStatus()
db.currentOp()
```

### 5.3 Data Integrity Verification

- Check application audit logs for unexpected changes
- Verify backup file sizes are consistent (sudden drops may indicate issues)
- Cross-reference GDB data counts with expected volumes

### 5.4 Network Configuration

On-demand tasks may include:
- Creating private networks between application and database servers
- Updating internal routing rules
- Configuring VPN connections for remote access
- Updating DNS records for eRegistrations domains

---

## 6. Maintenance Checklist

### Daily (Automated)
- [ ] Backup script completed (`/opt/backup/data/backupdone` contains `BACKUPOK`)
- [ ] Docker prune completed
- [ ] No critical Zabbix alerts

### Monthly
- [ ] System packages updated
- [ ] Docker images updated
- [ ] Graylog reviewed for recurring issues
- [ ] Disk space checked

### Quarterly
- [ ] User access permissions reviewed
- [ ] Backup restoration tested
- [ ] Performance metrics analyzed
- [ ] SSL certificate expiry checked (renew if < 30 days)

### Yearly
- [ ] Hardware evaluation completed
- [ ] System requirements reassessed
- [ ] Security audit conducted
- [ ] On-premise hardware maintained (if applicable)

---

## 7. Required Staff Skills

System maintenance requires the following knowledge:

| Area | Skills |
|------|--------|
| Operating system | Ubuntu Linux administration |
| Containers | Docker commands, Docker Compose, container logs |
| Relational database | PostgreSQL queries, backup/restore |
| NoSQL database | MongoDB commands, mongodump/mongorestore |
| Networking | UFW firewall, DNS, SSL/TLS certificates |
| Monitoring | Graylog log analysis, Zabbix alerts |

A training program (6-7 sessions of 1.5 hours each) covers all these topics. See the deployment documentation for training details.

---

*Previous: [05 - Security](05-security.md) | Next: [07 - Troubleshooting](07-troubleshooting.md)*
