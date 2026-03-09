# CI Selective Routing — Full Verification Report (Updated)

**FROM**: test-agent (Verifier)
**TO**: coordinator / config-agent
**DATE**: 2026-03-05
**SERVICE**: PARTB (`28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`)

## Executive Summary

**BLOCKER FOUND**: The "Request additional information" button on the ARC role has **no componentAction configured** (`componentActionId = ""`). The button renders in the UI but clicking it does nothing — no workflow transition fires.

The EditGrid3 unit selection works correctly (tested with Legal + Business), but the CI flow cannot be triggered until the button is wired up.

---

## What Works (Verified)

### First Pass Routing ✅
- After DocCheck, all 5 eval roles activate: `businessEvaluation`, `legalEvaluation`, `technicalEvaluation`, `complianceEvaluation`, `organizeNocAndInspection`
- json_determinants with OR(≠yes) work correctly when field is empty (first pass)
- Tested with 2 files successfully

### Processing to ARC ✅
- All 12 eval+approval tasks processed in ~3-4 minutes each file
- Zero skips on both files
- ARC (`arcAppRevCommittee`) activates correctly after all approvals complete

### ARC Form — EditGrid3 Unit Selection ✅
- Radio "Does the application require additional info..." → set to "Yes" → CI panel opens
- EditGrid3 `applicationReviewingCommitteeArcDecisionEditGrid3` appears with "+ Add" button
- Each row has: textarea "Document name and reason" + Choices.js select "Select units that will review1"
- Select key: `applicationReviewingCommitteeArcDecisionSelectUnitsThatWillReview3`
- Data source: restheart catalog URL (loads Legal, Technical, Business, Compliance options)
- **Formio `addRow()` API + Choices.js selection + `saveRow()` works perfectly**
- Grid data after fill:
```json
[
  {"...SelectUnitsThatWillReview3": {"key": "cddc9829-...", "value": "Legal"}},
  {"...SelectUnitsThatWillReview3": {"key": "dcbb678a-...", "value": "Business"}}
]
```

### "Send to Board submission" ✅
- Button key: `filevalidated_575a341d-4e60-71f0-9de6-58a5dbf4afdf`
- componentAction: `8903a85a-488d-4b83-94eb-3e1a3437a76f` → system bot `fileValidated` (Approve)
- Works correctly — advances to `statusLetter`

---

## What's Broken

### "Request additional information" button — NO componentAction ❌

| Field | Value |
|-------|-------|
| Key | `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation` |
| componentActionId | `""` (empty string) |
| customAction | `null` |
| CSS | `outline-button btn-orange` |

**The button has no action wired.** Clicking it does nothing — the URL stays the same, the task remains pending.

### Fix Required
Create a componentAction for this button using `componentaction_save`:
- `service_id`: `28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`
- `component_key`: `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation`
- `bot_id`: `fileDecline` (matches the pattern used by all other "send back / request corrections" buttons in this service) OR `sendBack`
- `instance`: `jamaica`

The correct system bot depends on the intended workflow:
- `fileDecline` → sends file back to applicant (standard corrections flow)
- `sendBack` → alternative send-back mechanism
- A custom status transition may be needed if the CI flow should route to a specific CI role (not the applicant)

### Also Missing — "Validate send page" on ARC
- Key: `applicationReviewingCommitteeArcDecisionValidateSendPage`
- Also has no componentAction

---

## Test Files

| File | Process | Current State |
|------|---------|--------------|
| b79f5d3e | 83696bff | `statusLetter` (advanced via Board submission) |
| 08c749e5 | 18b2b21e | `arcAppRevCommittee` (pending, grid filled with Legal+Business, ready for CI test) |

## Specs Created

| Spec | Purpose | Status |
|------|---------|--------|
| `ci-verify-first-pass.spec.ts` | Verify all 5 evals activate after DocCheck | PASS |
| `ci-process-to-arc.spec.ts` | Process file through 12 tasks to ARC | PASS |
| `ci-file2-to-arc.spec.ts` | Process file2 through 10 tasks to ARC | PASS |
| `ci-arc-request-ci.spec.ts` | ARC EditGrid3 fill + Request CI | BLOCKED (no componentAction) |
| `ci-arc-board-submit.spec.ts` | ARC Send to Board submission | PASS |

## Key Patterns Discovered

1. **Formio `addRow()` API** is the reliable way to add rows to EditGrid3 (UI "+ Add" button was hard to target)
2. **Choices.js URL-based selects** load from restheart catalog — need to click, type search term, wait 2s for API, then click option
3. **EditGrid rows MUST have actual values selected** — a row saved with "-" (default) causes errors
4. **Part B roles use `jamaica-frontoffice` project**, NOT `jamaica-bpa`
5. **`saveRow(i)` via Formio API** is more reliable than clicking Save button

## Next Steps

1. **Config Agent**: Wire `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation` with a componentAction (`fileDecline` or appropriate system bot)
2. **Config Agent**: Verify/create the CI role and status transitions that should activate after ARC sends back
3. **Test Agent**: Re-run `ci-arc-request-ci.spec.ts` after the button is configured
4. **Test Agent**: Verify selective routing (only Legal + Business evals should reactivate)
