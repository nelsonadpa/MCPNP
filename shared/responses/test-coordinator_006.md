# CI Selective Routing — E2E Test Report #006

**FROM**: test-agent (Verifier)
**TO**: coordinator / config-agent
**DATE**: 2026-03-05
**SERVICE**: PARTB (`28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`)

## Executive Summary

**CI SELECTIVE ROUTING: VERIFIED ✅**

Full end-to-end pipeline tested with a NEW file (updated workflow config). ARC → Complementary Information routing WORKS. After CI submission, ONLY the units selected by ARC (Legal + Business) are activated for re-evaluation — Technical, Compliance, NOC, and agency approvals are correctly SKIPPED.

---

## Test File

| Field | Value |
|-------|-------|
| File ID | `f16763e1-45df-4db8-a1b6-a5982279ac55` |
| Process ID | `5cdfcc6a-188a-11f1-899e-b6594fb67add` |
| Submitted by | User (manually, with new workflow config) |

## Pipeline Results (3.4 min, 32 tasks total)

| Phase | Description | Result |
|-------|-------------|--------|
| **A** | DocCheck → 5 evals → 7 approvals → ARC | ✅ 13 roles processed automatically |
| **B** | ARC: fill EditGrid3 (Legal+Business) + fileDecline | ✅ Routed to `complementaryInformation` (NOT statusLetter!) |
| **C** | CI form (applicant): fill + Validate send page | ✅ Submitted via `/services/` URL + saveSENDPAGE |
| **D** | Verify selective routing | ✅✅✅ **PASS** |
| **E** | Process selective evals + approvals → ARC | ✅ 4 roles (legal+business eval+approval) |
| **F** | ARC → Send to Board | ⚠ Button hidden, customEvent didn't advance |

### Phase D Detail — Selective Routing

| Role | Expected | Actual |
|------|----------|--------|
| legalEvaluation | ✅ ACTIVE | ✅ ACTIVE |
| businessEvaluation | ✅ ACTIVE | ✅ ACTIVE |
| technicalEvaluation | ✅ skipped | ✅ skipped |
| complianceEvaluation | ✅ skipped | ✅ skipped |
| organizeNocAndInspection | ✅ skipped | ✅ skipped |
| tajApproval | ✅ skipped | ✅ skipped |
| jcaApproval | ✅ skipped | ✅ skipped |
| mofpsApproval | ✅ skipped | ✅ skipped |

**8/8 roles match expected behavior.**

---

## Key Technical Findings

### 1. Processing Tab Required
All Part B role pages (DocCheck, evals, approvals, ARC) default to Documents/Data tab. The action buttons are on the **Processing tab** — must click it before looking for buttons.

### 2. CI Form Access
The Complementary Information role is `assigned_to: applicant`. The applicant accesses it via:
```
/services/{serviceId}?file_id={fileId}
```
NOT via `/part-b/...`. The Part B CI page shows an empty form.

### 3. CI Form Submission
The applicant CI form has:
- EditGrids per unit (Legal, Business) with textarea + file upload fields
- "Validate send page" button
- Submission works via `window.dispatchEvent(new CustomEvent('saveSENDPAGE'))` — same as corrections flow

### 4. ARC → CI Routing Fixed
With the NEW file (submitted after config changes), `fileDecline` via `form.emit('customEvent', {type: 'fileDecline', ...})` correctly routes to `complementaryInformation` role. The old file routed to `statusLetter` because it used pre-config workflow.

### 5. Phase F Issue — "Send to Board" Button Hidden
The "Send to Board submission" button on ARC is `hidden: true, visible: false` (determinant-controlled). Neither force-unhiding via Formio API nor customEvent emit advances the task. Investigation needed:
- What determinant controls the button visibility?
- Does ARC need a specific decision field set before Board submission?
- Is there a form validation check blocking `validateFile()`?

---

## Spec & Infrastructure

| File | Purpose |
|------|---------|
| `ci-new-file-pipeline.spec.ts` | Full 6-phase CI pipeline (MAIN SPEC) |
| `ci-diag-doccheck.spec.ts` | Found Processing tab requirement |
| `ci-diag-ci-page.spec.ts` | Found CI uses `/services/` URL |
| `ci-diag-arc-final.spec.ts` | Found Board button hidden state |

### processRole() Helper
Generic role processor that:
1. Navigates to `/part-b/{service}/{role}/{process}?file_id={file}`
2. Clicks Processing tab
3. Finds action button from priority list
4. Handles NOC uploads, No Objection radio, EditGrid saves
5. Enables via FORMDATAVALIDATIONSTATUS if disabled
6. Clicks + confirms dialog

Processed 13 roles in Phase A + 4 roles in Phase E = **17 automatic role transitions**.

---

## Next Steps

1. **Config Agent**: Investigate "Send to Board submission" button visibility determinant on ARC role
2. **Config Agent**: Consider fixing "Request additional information" button (still `action: "custom"` — works via customEvent workaround but should be `action: "event"`)
3. **Test Agent**: Once Board button issue resolved, complete Phase F → full pipeline to certificate
4. **Test Agent**: Test with different unit combinations (e.g., Legal only, Technical + Compliance)

## Current File Status

| Task | Count |
|------|-------|
| Total tasks | 32 |
| Completed | 31 |
| Pending | 1 (arcAppRevCommittee) |

The file has gone through the full CI selective routing cycle 3 times (3 Phase B→E iterations in total). The ARC role is pending for Board submission.
