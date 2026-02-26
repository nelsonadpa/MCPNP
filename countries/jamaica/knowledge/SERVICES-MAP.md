# Jamaica — Services Map

> Extract service IDs and field keys via Manual Agent using `BPA-jamaica` MCP server.

## Services

| Service | ID | Status |
|---|---|---|
| Establish a new zone | `d51d6c78-5ead-c948-0b82-0d9bc71cd712` | Testing in progress (M-J003) |
| *(other services pending discovery)* | | |

## Field Key Mapping

| Service | NIT Key | Company Key |
|---|---|---|
| *(pending discovery)* | | |

## Service: Establish a new zone — Registrations

| Registration | ID | Institution |
|---|---|---|
| Approval SEZA | `685dfe8b-d470-ecbf-baf7-579d2711cd7f` | SEZA |
| No objection JCA | `f7b547f2-7a48-418c-9c64-eacb5da09fb6` | JCA |
| No objection MOFPS | `2a70472b-53fa-461d-92aa-b945a8ede9e6` | MOFPS |
| No objection TAJ | `e937c6d5-62aa-4074-844d-13789f7b69f6` | TAJ |

## Service: Establish a new zone — Roles (49 Total)

### Key Roles by Phase
| Phase | Role | Order |
|---|---|---|
| Intake | Documents check | 0 |
| Evaluation | Legal / Technical / Business / Compliance evaluation | 1 |
| Evaluation | Organize NOC and inspection | 1 |
| Due Diligence | JCA / TAJ / MOFPS due diligence | concurrent |
| Approvals | JCA / TAJ / MOFPS / Business / Technical / Compliance / Legal approval | 2 |
| Committee | ARC — Application Reviewing Committee | 3 |
| Applicant | Complementary Information / Agreement review / Apply for license | loop |
| Status | Status letter / Signature status letter | 5-6 |
| Board | Board submission / CEO validation / Board | 7-10 |
| License | Draft / Legal review / Issue License Agreement | 299 |
| Ministerial | Bundle / MIC / Draft order / Legal review / Approval / Gazette | 299 |
| Operations | Inspection invite / Technical Inspection / Inspection / Operating Certificate | 299 |
| Finance | Billing info / Approval / Prepare invoice / Approves invoices | 299 |

## Service: Establish a new zone — Metrics

| Metric | Value |
|---|---|
| Total Fields | 1,355 |
| Form Components | 469 |
| Panels | 63 |
| Determinants | 94 |
| Document Requirements | 33 (SEZA only) |
| Bots | 8 (2 external, 6 internal) |
| Print Documents | 1 (Developer license) |

## Notes
- MCP server: `BPA-jamaica`
- Instance URL: `https://bpa.jamaica.eregistrations.org`
- Front-office: `https://jamaica.eregistrations.org/`
- Auth: CAS via `BPA-jamaica` MCP (session-based)
