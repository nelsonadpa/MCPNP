# Service Design Knowledge: Service Replication Methodology

**Status**: Confirmed — validated with CI Selective Routing (PARTB → MAIN)
**Country**: Jamaica (BPA-jamaica)
**Date**: 2026-03-05

---

## Problem Statement

When a configuration pattern has been developed and tested on one service, it needs to be replicated to other services that share the same workflow structure. The challenge is determining what can be automated via MCP, what requires manual BPA UI work, and how to verify the result efficiently.

---

## Methodology Overview

The replication follows a 3-phase approach:

```
Phase 1: Manual setup (BPA UI)     ~1-2 hours
Phase 2: Automated config (MCP)    ~30 min
Phase 3: Verification (MCP)        ~30 min
```

Total estimated time per service: **2-3 hours** (config) + **~1 hour** (verification).

---

## Phase 1: Manual Setup (BPA UI)

These steps cannot be automated due to known MCP bugs.

### 1a. Create determinants in BPA UI

| What | Why manual |
|---|---|
| Radio determinant (`≠ yes`) | `selectdeterminant_create` creates wrong Java class (select instead of radio) |
| Grid determinants (SOME condition) | `griddeterminant_create` doesn't persist `select_value` or `row_determinant_id` |

**Process**: Navigate to `https://bpa.<country>.eregistrations.org/services/<SERVICE_ID>/determinantstable`, create each determinant manually, record the generated UUIDs.

**Tip**: Check `determinant_list` first — some determinants may already exist (e.g., "CI review by business" was pre-existing on PARTB).

### 1b. Configure ARC button determinants (BPA UI)

Add determinants to ARC action buttons so only one shows at a time:

| Button | Determinant | Shows when |
|--------|------------|------------|
| "Send to Board submission" | ≠ yes (Not CI flow) | No additional info needed |
| "Request additional information" | = yes | Additional info requested |

### 1c. Configure ARC "Send back for correction" status (BPA UI)

In BPA UI → ARC role → Status tab:
1. Change "Send back for correction" destination from **Applicant** → **Complementary Information**
2. **Activate** the status (toggle ON)

---

## Phase 2: Automated Configuration (MCP)

These steps are fully automatable and represent the bulk of the configuration.

### 2a. Apply json_determinants to roles (12 calls)

```
role_update(role_id=<ROLE_ID>, json_determinants='[{"type":"OR","items":[...]}]', instance=<INSTANCE>)
```

**12 roles** per service, divided into 3 groups:
- **4 internal evals**: OR(Not CI flow, CI review by <unit>)
- **4 internal approvals**: OR(Not CI flow, CI review by <unit>)
- **4 external/agency roles**: OR(Not CI flow) only

All 12 calls can run in parallel or sequential — no dependencies between them.

### 2b. Wire ARC "Request CI" button to fileDecline

```
componentaction_save(
  service_id=<SERVICE_ID>,
  component_key='<REQUEST_CI_BUTTON_KEY>',
  actions=[{"bot_id": "fileDecline"}],
  instance=<INSTANCE>
)
```

### 2c. Publish the service

```
service_publish(service_id=<SERVICE_ID>, instance=<INSTANCE>)
```

---

## Phase 3: Verification (MCP)

### Verification Checklist

| Check | Tool | What to verify |
|---|---|---|
| Determinants exist | `determinant_list` | All 5 determinants present with correct types and values |
| Role gating correct | `role_get` (spot-check 3-4 roles) | `json_determinants` contains correct OR structure with right determinant IDs |
| ARC button wired | `componentaction_get_by_component` | "Request CI" button has `fileDecline` action |
| Service published | `service_get` | `hasUnpublishedChanges = false` |

### Spot-check strategy

Don't verify all 12 roles — verify one from each group:
1. One internal eval (e.g., Legal evaluation) — should have OR(not-ci, ci-legal)
2. One external role (e.g., Organize NOC) — should have OR(not-ci) only
3. One internal approval (e.g., Business approval) — should have OR(not-ci, ci-business)

If all 3 match, the batch was applied correctly.

---

## Known Issues & Resolutions

### Publish error: duplicate component key

**Error**: `Determinants key sendbacktocorrections is duplicated inside the same form`

**Cause**: Two `sendbacktocorrections` components exist in the same form — one from the original configuration and one added during ARC status setup.

**Resolution**: Remove the duplicate component in BPA UI (Form editor → find the duplicate → delete it), then retry `service_publish`.

**Prevention**: Before configuring ARC statuses, check if a `sendbacktocorrections` component already exists in the ARC form.

### MCP bugs affecting determinant creation

| Bug | Impact | Workaround |
|---|---|---|
| `selectdeterminant_create` wrong Java class | Cannot create radio determinants via MCP | Create in BPA UI |
| `griddeterminant_create` no select_value | Cannot create grid SOME determinants via MCP | Create in BPA UI |
| `datedeterminant_create` broken | Cannot create date determinants via MCP | Create in BPA UI |

**Full bug tracker**: `mcp-bugs.md`

---

## What Was Automated vs Manual (CI Selective Routing)

| Step | Method | Time |
|---|---|---|
| Create 5 determinants | Manual (BPA UI) | ~30 min |
| Apply json_determinants to 12 roles | Automated (MCP `role_update`) | ~10 min |
| Wire ARC button to fileDecline | Automated (MCP `componentaction_save`) | ~5 min |
| Add button determinants | Manual (BPA UI) | ~15 min |
| Configure ARC status destination | Manual (BPA UI) | ~10 min |
| Resolve publish error (duplicate key) | Manual (BPA UI) | ~15 min |
| Publish service | Automated (MCP `service_publish`) | ~2 min |
| Verification (determinants + roles + action) | Automated (MCP read tools) | ~30 min |

**Automation ratio**: ~40% automated (role updates + button wiring + publish + verification), ~60% manual (determinant creation + UI configuration).

**Future improvement**: If MCP determinant creation bugs are fixed, automation ratio jumps to ~80%.

---

## Replication Template

When replicating CI Selective Routing to a new service:

1. **Gather IDs**: `role_list` to get the 12 target role IDs + `determinant_list` to check existing determinants
2. **Manual**: Create missing determinants in BPA UI, record their UUIDs
3. **Script**: Run 12x `role_update` with the determinant IDs from step 2
4. **Script**: Run `componentaction_save` for the ARC CI button
5. **Manual**: Add button determinants + configure ARC status destination
6. **Script**: `service_publish`
7. **Verify**: `determinant_list` + 3x `role_get` spot-checks + `componentaction_get_by_component`

---

## Related Patterns

- `ci-selective-routing.md` — The pattern being replicated (design rationale + cross-service comparison)
- `partb-workflow-architecture.md` — The workflow structure these services share
