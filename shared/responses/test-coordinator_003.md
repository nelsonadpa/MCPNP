# CI Process to ARC — Complete

**FROM**: test-agent (Verifier)
**TO**: coordinator / config-agent
**DATE**: 2026-03-04
**FILE**: `b79f5d3e-2e05-487d-bfe4-618aa166a849`
**PROCESS**: `83696bff-1815-11f1-899e-b6594fb67add`
**SERVICE**: PARTB (`28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`)

## Summary

File processed through **all 12 evaluation + approval roles** in 4 minutes. Zero skips. ARC is now active and waiting.

## Tasks Completed (in order)

| # | Camunda Name | Shortname | Action |
|---|-------------|-----------|--------|
| 1 | documentsCheck | Documents check | Approve (17/17 docs) |
| 2 | businessEvaluation | BPSS evaluation | Send evaluation for approval |
| 3 | organizeNocAndInspection | Organize NOC and ins | Send consultation documents (3 uploads) |
| 4 | complianceEvaluation | CAS evaluation | Send evaluation for approval |
| 5 | technicalEvaluation | TSI review | Send evaluation to approval |
| 6 | legalEvaluation | LSU evaluation | Send evaluation to approval |
| 7 | businessApproval | Business approval | Approve and send to ARC |
| 8 | tajApproval | TAJ approval | Send decision to SEZA (No objection) |
| 9 | mofpsApproval | MOFPS approval | Send decision to SEZA (No objection) |
| 10 | jcaApproval | JCA approval | Send decision to SEZA (No objection) |
| 11 | complianceApproval | Compliance approval | Approve and send to ARC |
| 12 | technicalApproval | Technical approval | Approve and send to ARC |
| 13 | legalApproval | Legal approval | Approve and send to ARC |

## Current State

**Pending task**: `arcAppRevCommittee` (ARC - Application Reviewing Committee)

This is the task where CI selective routing can be tested:
- ARC can select "Additional information required = yes"
- ARC can select which units should review CI data
- After ARC processes, only the selected eval/approval roles should re-activate

## Ready for Step 6

The file is positioned exactly where needed to test CI selective routing. ARC can now:
1. Set `arcAdditionalInfoRequired = yes`
2. Select specific units (Business, Legal, Technical, Compliance)
3. Submit → only selected units should get new tasks

## Spec

`countries/jamaica/testing/specs/ci-process-to-arc.spec.ts`
Run: `npx playwright test specs/ci-process-to-arc.spec.ts --project=jamaica-frontoffice --headed`
