# Cuba System Health Dashboard

## Overview
Daily health check template for cuba.eregistrations.org

## Metrics to Collect

### 1. Error Rate (Last 24h)
Query: `source:eregistrations AND level:<=3`
Metric: Count of error/critical messages
Threshold: < 50 = healthy, 50-200 = warning, > 200 = critical

### 2. Bot Execution Success Rate
Query: `source:eregistrations AND message:/bot.*complet|success/i`
vs: `source:eregistrations AND message:/bot.*error|fail/i`
Metric: success / (success + failure) * 100
Threshold: > 95% = healthy

### 3. Active Services
Query: `source:eregistrations AND message:/dossier/i`
Group by: facility
Metric: Count of distinct services with activity
Expected: 18 services (per SERVICES-MAP.md)

### 4. Authentication Health
Query: `source:eregistrations AND message:/CAS|login/i AND level:<=4`
Metric: Count of auth failures
Threshold: < 10 = healthy

### 5. Response Time Indicators
Query: `source:eregistrations AND message:/slow|timeout|latency/i`
Metric: Count of performance warnings

## Usage
Run from Observer agent:
"Run the Cuba system health dashboard — check all 5 metrics"

## Reporting Format
| Metric | Value | Status |
|--------|-------|--------|
| Error Rate (24h) | X errors | 🟢/🟡/🔴 |
| Bot Success Rate | X% | 🟢/🟡/🔴 |
| Active Services | X/18 | 🟢/🟡/🔴 |
| Auth Failures | X | 🟢/🟡/🔴 |
| Performance Warnings | X | 🟢/🟡/🔴 |
