# Role Matrix — Establish a New Zone (Jamaica SEZ)

## Service Info
- **Service**: Establish a new zone
- **Service ID**: `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
- **URL**: https://jamaica.eregistrations.org

## Active Workflow Roles

### Legend
- Y = Yes (confirmed capability)
- N = No
- ? = Needs verification via E2E testing
- (P) = Parallel step — multiple roles active simultaneously

### Phase 1: Intake

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 1 | Documents Check | 1 | Y | ? | N | ? | Y | N | ? | _(route to evaluations or corrections)_ |

### Phase 2: Parallel Evaluations (P)

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 2 | Legal Evaluation (P) | 1 | Y | Y | N | N | N | ? | Y | "Send evaluation to approval" |
| 3 | Technical Evaluation (P) | 1 | Y | Y | N | N | N | ? | Y | ? |
| 4 | Business Evaluation (P) | 1 | Y | Y | N | N | N | ? | Y | "Send evaluation for approval" |
| 5 | Compliance Evaluation (P) | 1 | Y | Y | N | N | N | ? | Y | "Send evaluation for approval" |

### Phase 3: External Agency Consultations

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 6 | Organize NOC & Inspection | 2 | Y | ? | N | N | N | Y | ? | "Send consultation documents" |
| 7 | JCA Approval (P) | 3 | Y | Y | Y | ? | N | ? | Y (radio) | "Send decision to SEZA" |
| 8 | TAJ Approval (P) | 3 | Y | Y | Y | ? | N | ? | Y (radio) | "Send decision to SEZA" |
| 9 | MOFPS Approval (P) | 3 | Y | Y | Y | ? | N | ? | Y (radio) | "Send decision to SEZA" |

### Phase 4: Internal Approvals (P)

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 10 | Legal Approval (P) | 4 | Y | ? | Y | ? | ? | N | ? | "Approve" |
| 11 | Technical Approval (P) | 4 | Y | ? | Y | ? | ? | N | ? | "Approve" |
| 12 | Business Approval (P) | 4 | Y | ? | Y | ? | ? | N | ? | "Approve" |
| 13 | Compliance Approval (P) | 4 | Y | ? | Y | ? | ? | N | ? | "Approve" |

### Phase 5: Committee & Corrections

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 14 | ARC (App Review Committee) | 5 | Y | Y | Y | Y | Y | ? | Y (EditGrid) | "Approve" |
| 15 | Complementary Information | — | Y | Y | N | N | N | Y | Y | "Validate send page" |

### Phase 6: Decision & Status

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 16 | Status Letter | 6 | Y | Y | N | N | N | ? | Y | ? |
| 17 | Signature Status Letter | 7 | Y | ? | Y | ? | N | N | ? | "Approve" |

### Phase 7: Board & Final

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| 18 | Board Submission | 8 | Y | Y | N | N | N | ? | Y (EditGrid) | ? |
| 19 | CEO Validation | 9 | Y | ? | Y | ? | N | N | ? | "Approve" |
| 20 | Board | 10 | Y | ? | Y | Y | N | N | ? | "Approve" |
| 21 | SEZ Documents | 11 | Y | ? | N | N | N | Y | ? | ? |

### Applicant

| # | Role | Sort | Can View | Can Edit | Can Approve | Can Reject | Can Req Corrections | Can Upload Docs | Has Form Fields | Action Button |
|---|------|------|----------|----------|-------------|------------|---------------------|-----------------|-----------------|---------------|
| — | Applicant (front-office) | 0 | Y | Y | N | N | N | Y | Y (469 components) | "Send" |

## Parallel Step Groups

Steps marked (P) can be active simultaneously for the same application:

| Group | Steps | Sort Order | Dependency |
|-------|-------|------------|------------|
| **Evaluations** | Legal, Technical, Business, Compliance | 1 | All must complete before NOC phase |
| **External NOC** | JCA, TAJ, MOFPS Approvals | 3 | All must complete before Internal Approvals |
| **Internal Approvals** | Legal, Technical, Business, Compliance Approvals | 4 | All must complete before ARC |

## Button Pattern Summary

| Button Text | Roles Using It | Notes |
|-------------|---------------|-------|
| "Send evaluation to approval" | Legal Evaluation | Singular "approval" |
| "Send evaluation for approval" | Compliance Evaluation, Business Evaluation | "for approval" |
| "Send consultation documents" | Organize NOC & Inspection | Requires file uploads for TAJ, JCA, MOFPS |
| "Send decision to SEZA" | TAJ Approval, MOFPS Approval, JCA Approval | Requires "No objection" radio selection |
| "Approve" | Legal/Technical/Business/Compliance Approval, ARC, Signature Status Letter, CEO Validation, Board | Most common action button |
| "Validate send page" | Complementary Information | Front-office (applicant-side) |

## Role-to-Institution Mapping

| Role | Institution | Registration |
|------|------------|-------------|
| Documents Check through Compliance Evaluation | SEZA | Approval SEZA |
| Organize NOC & Inspection | SEZA | Approval SEZA |
| JCA Approval | JCA | No objection JCA |
| TAJ Approval | TAJ | No objection TAJ |
| MOFPS Approval | MOFPS | No objection MOFPS |
| Legal through Compliance Approval | SEZA | Approval SEZA |
| ARC through SEZ Documents | SEZA | Approval SEZA |

## Inactive Roles (sort_order 299)

The following 28 roles are defined but NOT part of the active workflow. They may be used in future phases or alternative paths:

| Role | Type | Notes |
|------|------|-------|
| Denial letter | Processing | Alternative path — rejection |
| Pre-approval letter | Processing | Alternative path — conditional approval |
| Technical Inspection | Processing | Physical site inspection |
| Draft License Agreement | Processing | Post-approval licensing |
| MIC instructions | Processing | Unknown |
| Ministerial Order approval | Processing | Government minister sign-off |
| Gazette | Processing | Official publication |
| Legal review of payment and LA | Processing | License agreement review |
| Issue License Agreement | Processing | Final license issuance |
| Prepare operating certificate | Processing | Post-license operations |
| Apply for License Agreement | Applicant | Applicant action |
| Inspection | Processing | Physical inspection |
| TAJ due diligence | Processing | Extended TAJ review |
| Preparation of Ministerial Bundle | Processing | Ministerial package |
| Draft Ministerial order | Processing | Legal drafting |
| Prepare invoice | Processing | Billing |
| Technical prepares billing info | Processing | Cost estimation |
| Inspection invite | Processing | Schedule inspection |
| Approval of billing info | Processing | Cost approval |
| MOFPS due diligence | Processing | Extended MOFPS review |
| Ministerial order legal review | Processing | Legal check on order |
| Approves invoices | Processing | Financial approval |
| Agreement review and payment | Applicant | Applicant payment |
| JCA due diligence | Processing | Extended JCA review |
| Operating Certificate | Processing | Certificate issuance |
| DEVELOPER create | BotRole | Automated |
| Developer license | BotRole | Automated |
