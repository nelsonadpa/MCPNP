# CI Selective Routing — E2E Test Report #005

**FROM**: test-agent (Verifier)
**TO**: coordinator / config-agent
**DATE**: 2026-03-05
**SERVICE**: PARTB (`28bf8aca-6d59-45ce-b81f-5068ab5ae7e1`)

## Executive Summary

**PARTIAL SUCCESS — WORKFLOW MISCONFIGURATION**

The "Request additional information" button mechanism now works (we can trigger `fileDecline` via formio customEvent), but the workflow routes to `statusLetter` instead of `complementaryInformation`. The CI selective routing flow **cannot be tested** until the ARC role's decline transition is fixed to route to the Complementary Information role.

Both test files are now at `statusLetter` — new files needed for re-testing.

---

## What Was Fixed

### 1. ComponentAction Created
- Button key: `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation`
- ComponentAction ID: `c2b0c2b8-a6a2-4912-9aa7-681aea8d44f8`
- Bot: `fileDecline` (system action = "Request corrections")
- Created via `componentaction_save` MCP tool

### 2. Button Trigger Mechanism Discovered
The button has `action: "custom"` with empty custom JS — it cannot trigger a componentAction natively. The eRegistrations frontend uses this flow:

```
Button click (action="event") -> Formio fires customEvent -> Angular wrapper catches -> fireCustomEvent(s)
```

Since the button is `action: "custom"`, clicking it never fires the customEvent. **Workaround**: Emit the event directly via Formio API:

```javascript
form.emit('customEvent', {
  type: 'fileDecline',
  component: { key: 'applicationReviewingCommitteeArcDecisionRequestAdditionalInformation' }
});
```

This successfully triggered the ARC transition with network calls:
- `PUT /backend/process/{processId}/role-forms/arcAppRevCommittee/WIZARD`
- `GET /en/backend/services?isPartB=1`
- `GET /en/backend/process/inprocess/...`

---

## What's Still Broken

### 1. Button Form Component Needs Update
The button in the ARC role form has:
- `action: "custom"` -> should be `action: "event"`
- `custom: ""` (empty) -> should have event dispatch code
- `event: undefined` -> should be `"fileDecline"` or similar

The form component is in a **role form** (Part B processing), not the applicant form. MCP `form_component_update` only works with applicant/guide/send_file/payment forms — **cannot update role forms via MCP**.

**Fix options:**
1. Update via BPA Admin UI (manually change button action to "event" with event="fileDecline")
2. Update via REST API directly to the role form endpoint
3. Keep `action: "custom"` but set the custom JS to:
   ```javascript
   var formio = window.Formio;
   for (var fk in formio.forms) {
     var form = formio.forms[fk];
     if (form && form.emit) {
       form.emit('customEvent', {type: 'fileDecline', component: this.component});
     }
   }
   ```

### 2. Workflow Transition Routes to Wrong Destination (CRITICAL)
`fileDecline` on ARC advances to `statusLetter`, NOT to `complementaryInformation`.

**ARC Role Status Transitions**: EMPTY (no statuses defined)

The `Complementary Information` role exists:
- ID: `c3905b1b-01b3-40a8-a306-f410ba8d4acd`
- assigned_to: applicant
- visible_for_applicant: true

But the ARC role has NO status transition configured to route to it. The `fileDecline` system action follows the default workflow path (next role = statusLetter).

**Per CHANGELOG**: Config agent ALREADY set "SEND BACK TO CORRECTIONS" status destination to Complementary Information (`c3905b1b`) and activated it via BPA UI. But `fileDecline` still went to `statusLetter`.

ARC has 4 statuses configured (via MCP role_get):
- SEND BACK TO CORRECTIONS
- FILE VALIDATED
- FILE PENDING
- FILE REJECT

**Possible causes:**
1. `fileDecline` system action doesn't map to "SEND BACK TO CORRECTIONS" status — may use a different internal path
2. The BPA UI activation didn't save properly
3. The service needs to be re-published for status changes to take effect
4. The `fileDecline` action was mapped to a registration-level status that still points to statusLetter

**Investigation needed**: Check in BPA UI whether the status transition is actually active and pointing to CI. Try re-publishing the service. Or use `sendBack` system action instead of `fileDecline`.

---

## Test Infrastructure — What Works

| Component | Status | Notes |
|-----------|--------|-------|
| Grid fill (Legal+Business) | WORKS | Direct Formio dataValue set — most reliable |
| Formio customEvent emit | WORKS | Bypasses button click, triggers Angular handler |
| EditGrid clear | WORKS | `removeRow()` from last to first |
| Network monitoring | WORKS | Captures PUT/GET to backend |
| Process task API | WORKS | `/backend/process/{pid}` returns task list |
| Auth setup | WORKS | Auto-login via .env credentials |

## Test Files Status

| File | Process | Current State |
|------|---------|---------------|
| b79f5d3e | 83696bff | `statusLetter` |
| 08c749e5 | 18b2b21e | `statusLetter` |

**Both files past ARC** — new files needed for CI selective routing test.

## Specs Created

| Spec | Purpose | Status |
|------|---------|--------|
| `ci-full-test.spec.ts` | Full 5-step CI E2E test | BLOCKED (workflow routing) |
| `ci-diag-correction-event.spec.ts` | Proved formio customEvent works | PASS |
| `ci-diag-arc-button.spec.ts` | Diagnosed button componentAction | PASS |
| `ci-diag-partb-handler.spec.ts` | Found Angular fireCustomEvent handler | PASS |
| `ci-diag-angular.spec.ts` | Searched Angular bundle for handlers | PASS |

## Key Technical Discovery

The eRegistrations Part B frontend handles button events through this chain:

```
1. Formio button (action="event") -> emits customEvent
2. @angular/formio wrapper: this.formio.on("customEvent", ...) -> emits to Angular
3. Angular component: (customEvent)="fireCustomEvent($event)"
4. fireCustomEvent checks s.type:
   - includes("reject") -> rejectFile()
   - includes("decline") -> declineFile()
   - includes("validated") -> validateFile()
5. Handler calls PUT /backend/process/{pid}/role-forms/{role}/WIZARD
6. Backend executes componentAction bots and advances workflow
```

Window event listeners (from `registerFormEventListeners`):
- `"correction"` -> `declineFile()` (HAS real handler)
- `"reject"` -> `rejectFile()` (HAS real handler)
- `"saveDraft"` -> `saveAndStayOnSamePage()` (HAS real handler)
- `"fileValidated"` / `"fileDecline"` -> registered with EMPTY handlers `()=>{}`

The actual handlers for fileValidated/fileDecline are in `fireCustomEvent`, not in window event listeners. The formio `customEvent` emit is the reliable trigger.

## Next Steps

1. **Config Agent**: Create ARC role status transition -> Complementary Information role
2. **Config Agent**: Fix button form component (action: "custom" -> "event" with event="fileDecline")
3. **Test Agent**: Submit 2 new test files through to ARC
4. **Test Agent**: Re-run CI selective routing test with fixed workflow
