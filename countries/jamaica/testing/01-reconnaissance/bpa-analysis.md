# Phase 0 — BPA Reconnaissance Report
## Service: "Establish a new zone" (Special Economic Zone)

**Service ID:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Instance:** BPA-jamaica
**Status:** Active
**Date:** 2026-02-25

---

## Executive Summary

This is a **high-complexity** SEZ (Special Economic Zone) establishment service involving **49 roles** across multiple Jamaican government agencies. The applicant form contains **1,355 fields** organized in **63 panels** covering company information, land/property, financial details, health/safety/security compliance, and due diligence. The service processes through **4 registrations** with **94 determinants** controlling workflow logic.

| Metric | Value |
|--------|-------|
| Total Fields | 1,355 |
| Form Components | 469 |
| Panels/Sections | 63 |
| Determinants (business rules) | 94 |
| Roles | 49 |
| Registrations | 4 |
| Document Requirements | 33 (all on SEZA registration) |
| Bots (integrations) | 8 |
| Print Documents | 1 (Developer license) |

---

## Registrations

| Registration | ID | Institution | Doc Requirements |
|---|---|---|---|
| Approval SEZA | `685dfe8b-d470-ecbf-baf7-579d2711cd7f` | SEZA | 33 |
| No objection JCA | `f7b547f2-7a48-418c-9c64-eacb5da09fb6` | Jamaica Customs Agency | 0 |
| No objection MOFPS | `2a70472b-53fa-461d-92aa-b945a8ede9e6` | Ministry of Finance & Public Services | 0 |
| No objection TAJ | `e937c6d5-62aa-4074-844d-13789f7b69f6` | Tax Administration Jamaica | 0 |

---

## Workflow Architecture (10 Phases)

### Phase 1 — Intake & Document Check (Order 0)
- **Documents check** — Applications Quality and Case File Specialist validates initial submission

### Phase 2 — Parallel Multi-Agency Evaluation (Order 1)
Five parallel evaluation tracks:
- **Legal evaluation** — Legal Services Unit
- **Technical evaluation** — Technical Services Infrastructure
- **Business evaluation** — Business Process/Services
- **Compliance evaluation** — Compliance & Assurance
- **Organize NOC and inspection** — Coordination role

### Phase 3 — Due Diligence Clearances (Concurrent)
- **JCA due diligence** — Jamaica Customs Agency
- **TAJ due diligence** — Tax Administration Jamaica
- **MOFPS due diligence** — Ministry of Finance & Public Services

### Phase 4 — Leadership Approvals (Order 2)
Seven senior decision-makers:
- JCA approval, TAJ approval, MOFPS approval
- Business approval (Senior Director BPSS)
- Technical approval (Director of Technical Services)
- Compliance approval (Chief Operating Officer)
- Legal approval (Senior Director of Legal Services)

### Phase 5 — Committee Review (Order 3)
- **ARC — Application Reviewing Committee** — Final gatekeeping, consolidates all approvals/risks/conditions

### Phase 6 — Applicant Input Loop (Flexible)
- **Complementary Information** — Request for additional data
- **Agreement review and payment** — Applicant reviews terms
- **Apply for license Agreement** — Applicant initiates license

### Phase 7 — Status Communication (Order 5-6)
- **Status letter** preparation
- **Signature status letter** — Signed by Senior Director

### Phase 8 — Board & CEO Sign-Off (Order 7-10)
- **Board submission** → **CEO validation** → **Board decision**
- **SEZ Documents** preparation
- **Pre-approval letter** OR **Denial letter**

### Phase 9 — License Agreement Processing (Order 299)
- **Draft License Agreement** — Legal Officers
- **Legal review of payment and Licence agreement**
- **Issue License Agreement** — CEO issues
- **Ministerial order** workflow (MIC instructions → Ministerial Order → Gazette)

### Phase 10 — Operations & Billing (Order 299)
- **Inspection invite** → **Technical Inspection** → **Inspection**
- **Prepare operating certificate** → **Operating Certificate** dispatched
- **Billing information** → **Invoice** → **Approval of billing** → **Approves invoices**

---

## Roles Summary (49 Total)

### By Category
| Category | Count | Examples |
|----------|-------|---------|
| Applicant-facing | 4 | Applicant, Complementary Information, Agreement review, Apply for license |
| Document check | 1 | Documents check |
| Evaluations (Order 1) | 5 | Legal, Technical, Business, Compliance, Organize NOC |
| Due Diligence | 3 | JCA, TAJ, MOFPS |
| Approvals (Order 2) | 7 | JCA/TAJ/MOFPS/Business/Technical/Compliance/Legal approval |
| Committee | 1 | ARC |
| Status/Communication | 2 | Status letter, Signature status letter |
| Board/CEO | 3 | Board submission, CEO validation, Board |
| License Agreement | 6 | Draft, Legal review, Issue, Ministerial order chain |
| Inspection/Ops | 5 | Inspection invite, Technical/General inspection, Operating cert, Prepare cert |
| Finance | 4 | Billing info, Approval billing, Prepare invoice, Approves invoices |
| Ministerial | 4 | Preparation bundle, Draft order, Legal review, MIC instructions |
| SEZ Documents/Letters | 3 | SEZ Documents, Pre-approval letter, Denial letter |
| Bot roles | 2 | DEVELOPER create, Developer license |

---

## Form Structure — Major Sections (63 Panels)

### Core Information (6 sections)
- Company registration, authorized representative, zone identity, ownership, related entities

### Land & Property (11 sections)
- Land use breakdown, rights documents, tenure status, GPS coordinates, physical address, zoning, area calculations, density parameters, site suitability, site context, existing infrastructure

### Activities & Operations (6 sections)
- Proposed activities, prohibited activities reference, utilities, excise goods, export orientation, employment impact

### Design & Infrastructure (8 sections)
- Master plan, supporting maps, internal/external connectivity, design vision, drawings, surrounding environment, resettlement

### Financial & Investment (7 sections)
- Funding structure, total investment, revenue model, risk assessment, Jamaica benefits, financial integrity, pre-SEZ revenue

### Corporate Governance & Compliance (13 sections)
- Parent company, JVs/SPVs, registration docs, capital structure, regulatory approvals, ownership risk, related entities, sanctions history

### Health, Safety & Security (11 sections)
- Disaster mitigation, security risk, security plan, H&S plan, OSH management, hazard ID, emergency response, disaster response, business continuity, perimeter protection, security personnel

---

## Field Types Distribution

| Type | Count | Type | Count |
|---|---|---|---|
| textfield | 401 | button | 73 |
| panel | 154 | file | 72 |
| select | 124 | textarea | 121 |
| number | 114 | radio | 110 |
| fileupload | 34 | editgrid | 32 |
| checkbox | 29 | datetime | 29 |
| survey | 11 | tabs | 8 |
| email | 4 | htmlelement | 4 |
| string | 2 | tab | 2 |
| datagrid | 1 | selectboxes | 1 |
| qrcode | 1 | hidden | 1 |
| unknown | 27 | | |

---

## Determinants — Business Rules (94 Total)

### By Type
| Type | Count | Purpose |
|------|-------|---------|
| Radio/Select | 52 | Decision gates (approval/denial/conditions) |
| Boolean | 13 | Form validity, consent, payment verification |
| Grid | 9 | Timeline tracking across evaluation stages |
| Classification | 7 | Entity type, activity classification |
| Numeric | 8 | Threshold checks (capital, land area, buildings) |
| Text | 5 | Comment-not-empty validation for approvers |

### Key Decision Gates
Each review stage (BPSS, CAS, TSI, LSU) has:
- **Recommendation**: preApproval | ministerialApproval | denial
- **Conditions flag**: yes/no → triggers timeline grid
- **Risks flag**: yes/no → triggers risk documentation
- **Comments validation**: NOT_EQUAL "" → ensures approver documented reasoning

### ARC Consolidation
ARC determinants aggregate all agency no-objections:
- `ARC no objection JCA`
- `ARC no objection MOF`
- `ARC no objection TAJ`

### Board Decision
- `BOD = Approved` → proceeds to license/certificate
- `BOD = denied` → denial letter path

---

## Bots (8 Total)

| Name | Type | External Service | Purpose |
|------|------|-----------------|---------|
| DEVELOPERS create | data | GDB.GDB-ZONE ENTITIES(2.8)-create | Creates zone entity record |
| Developer license | document | generic-pdf-generator | Generates license PDF |
| APPROVALS to ARC - conditions | internal | self-service | Consolidates conditions to ARC |
| APPROVALS to ARC - risks to consolidated | internal | unlinked | Risk consolidation |
| APPROVALS to ARC - risks | internal | self-service | Risk data flow |
| DOCUMENTS to LSU-R | internal | unlinked | Document routing to Legal |
| Docs and data to LSU | internal | unlinked | Data routing to Legal |
| NOC to ARC - recommendations agencies | internal | unlinked | Agency recommendations to ARC |

**Note:** 3 internal bots have unlinked external services — potential configuration gaps to verify.

---

## Print Documents (1 Total)
- **Developer license** — Active, default template, generates upon approval

---

## Key Observations for Testing

1. **No required fields** — All 1,355 fields are optional. Testing must verify what happens with empty submissions.
2. **Guide form not configured** — No applicant guidance/help text available.
3. **33 document uploads** — Only on SEZA registration. Need to test file type/size limits.
4. **Complex approval matrix** — 4 parallel evaluation tracks + 7 approvals + ARC + Board = many permutations.
5. **3 unlinked bots** — May cause runtime errors if triggered.
6. **No timestamps** — Service lacks created_at/updated_at metadata.
7. **Dual-track processing** — Applicant-facing track and back-office ministerial/billing track run in parallel.
8. **Correction loop** — Complementary Information role allows applicant re-entry. Must test this path.
9. **Payment integration** — `isPayedDigitally` boolean suggests digital payment flow exists.
10. **Consent gates** — 2 consent signatures + 1 undertaking required before submission.
