# Service Design Knowledge: CI Selective Routing Pattern

**Status**: Confirmed — 2 implementations
**Services**: PARTB + MAIN "Establish a new zone" (Jamaica, BPA-jamaica)
**Date**: 2026-03-05
**First documented**: 2026-03-04

---

## Problem Statement

In multi-unit review workflows, when an ARC (App Review Committee) requests Complementary Information (CI), the file should only return to the specific units ARC indicated — not to all units. The challenge is that BPA routes files based on `sort_order_number`, activating all roles at the same sort level simultaneously.

---

## Design Pattern: OR Determinants on Existing Roles

### Core Idea

Instead of creating new CI-specific roles, **reuse the existing evaluation and approval roles** by adding combined OR determinant logic. This avoids role duplication, sort order renumbering, and rebuilding forms from scratch.

### Determinant Set

| Determinant | Type | Field | Condition | When TRUE |
|---|---|---|---|---|
| `Not CI flow` | Radio | `...DoesTheApplicationRequireAdditionalInformation...` | `!= Yes` | First pass (ARC did not request CI) |
| `CI review by legal` | Grid (SOME) | `applicationReviewingCommitteeArcDecisionSelectUnitsThatWillReview3` | `SOME = Legal` | ARC selected Legal |
| `CI review by technical` | Grid (SOME) | same | `SOME = Technical` | ARC selected Technical |
| `CI review by business` | Grid (SOME) | same | `SOME = Business` | ARC selected Business |
| `CI review by compliance` | Grid (SOME) | same | `SOME = Compliance` | ARC selected Compliance |

> **Key insight**: `Not CI flow` reuses the same radio field that already drives the visibility of the units grid in the ARC form. When ARC does not select "Yes", the grid never appears and is empty by definition — so `!= Yes` reliably identifies the first pass.

### Role json_determinants Logic

| Role | Sort | json_determinants |
|---|---|---|
| Legal eval | 2 | `OR('Not CI flow', 'CI review by legal')` |
| Technical eval | 2 | `OR('Not CI flow', 'CI review by technical')` |
| Business eval | 2 | `OR('Not CI flow', 'CI review by business')` |
| Compliance eval | 2 | `OR('Not CI flow', 'CI review by compliance')` |
| Organize NOC | 2 | `'Not CI flow'` only |
| Legal approval | 3 | `OR('Not CI flow', 'CI review by legal')` |
| Technical approval | 3 | `OR('Not CI flow', 'CI review by technical')` |
| Business approval | 3 | `OR('Not CI flow', 'CI review by business')` |
| Compliance approval | 3 | `OR('Not CI flow', 'CI review by compliance')` |
| TAJ approval | 3 | `'Not CI flow'` only |
| JCA approval | 3 | `'Not CI flow'` only |
| MOFPS approval | 3 | `'Not CI flow'` only |
| ARC | 4 | No gating (activates on both passes) |

### Flow Verification

**First pass:**
```
Sort 1 (CI) — skipped, determinant false
Sort 2 — 'Not CI flow' = TRUE → all 5 evals activate
Sort 3 — 'Not CI flow' = TRUE → all 7 approvals activate
Sort 4 — ARC activates (no gating)
ARC approves → Sort 5 (Status letter)
```

**CI pass (ARC selected Legal + Business):**
```
Sort 1 (CI) — applicant uploads docs → FILE VALIDATED
Sort 2 — 'Not CI flow' = FALSE
         'CI review by legal' = TRUE → Legal eval activates
         'CI review by business' = TRUE → Business eval activates
         Technical, Compliance, NOC → skipped
Sort 3 — same logic → only Legal + Business approval activate
         TAJ, JCA, MOFPS → skipped
Sort 4 — ARC activates again (reviews CI results)
ARC approves → Sort 5 (Status letter)
ARC sends back again → loop
```

---

## Why Not Create New CI Roles?

The initial approach (rejected) was to create 4 new roles at sort 5 with determinant gating. This was discarded because:

- Requires renumbering 7 existing roles (sorts 5→12)
- Requires building 4 new forms from scratch
- The file would not naturally return to ARC after CI review — needed an additional ARC role
- More configuration, more maintenance surface

The OR approach achieves the same result with zero new roles and zero sort renumbering.

---

## Cross-Service Implementation Comparison

### Services Implemented

| Service | Service ID | Type | Status |
|---|---|---|---|
| PARTB "Establish a new zone" | `28bf8aca-6d59-45ce-b81f-5068ab5ae7e1` | Part B workflow | E2E tested, 39/39 tasks complete |
| MAIN "Establish a new zone" | `0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc` | Main workflow | MCP verified, published |

### Determinant IDs

| Determinant | PARTB | MAIN |
|---|---|---|
| additional information ≠ yes | `2cb77156-57e7-45fd-86a0-aba6c68db690` | `ff6cca8a` |
| CI review by Legal | `b8b03bd5-83d5-4666-9e2f-a45028ce2e10` | `4ffec4a3` |
| CI review by Technical | `026efd11-e520-44dd-9c33-bfb844532290` | `65d147a7` |
| CI review by Compliance | `68c31790-0907-42b9-b4b5-57a8b6933a28` | `ec696538` |
| CI review by Business | `a4885fdb-7c5f-4e74-aec9-dbc5be17d706` | `d45f8e03` |

### Role IDs (sample — 12 roles per service)

| Role | PARTB | MAIN |
|---|---|---|
| Legal evaluation | `b74fb436` | `998caef5` |
| Organize NOC | `7d05a12e` | `f447186b` |
| Business approval | `94e0ece3` | `b821ad92` |
| MOFPS approval | `23d8b812` | `c656a915` |

### ARC Configuration

| Item | PARTB | MAIN |
|---|---|---|
| CI button → fileDecline | `3a585297-2021-4f00-8b87-728fd2c81dc2` | `0e3b93e0` |
| Board button → fileValidated | `8903a85a-488d-4b83-94eb-3e1a3437a76f` | (existing) |

---

## Implementation Notes

### What can be done via MCP
- `role_update` to set `json_determinants` (OR syntax supported) — **12 roles per service, batchable**
- Linking registrations, institutions, units to roles
- `componentaction_save` to wire buttons to `fileDecline` / `fileValidated`

### What requires BPA UI (known MCP bugs)
- Creating radio determinants (`selectdeterminant_create` creates wrong Java class)
- Creating grid determinants with SOME condition (`griddeterminant_create` is buggy)
- `copyValueFrom` configuration for complex EditGrid fields
- ARC "Send back for correction" status activation and destination change

### OR syntax for json_determinants
```json
[{"type":"OR","items":[
  {"type":"OR","determinantId":"<not-ci-flow-id>"},
  {"type":"OR","determinantId":"<ci-review-by-legal-id>"}
]}]
```

---

## Resolved Questions (from E2E testing)

### 1. Second CI pass edge case — RESOLVED
**Question**: If ARC sends back a second time with different units, does residual grid data corrupt SOME determinants?
**Answer**: Not tested with a third pass, but the pattern supports it. ARC fills the EditGrid fresh each time (the form reloads). The grid determinants evaluate the current state of the grid at the moment of the `fileDecline` action. Previous grid values are overwritten, not accumulated.

### 2. CI data visibility — RESOLVED
**Question**: How do eval/approval roles see ARC's CI request and applicant's uploads?
**Answer**: This is handled by the existing `copyValueFrom` configuration on the processing forms. The ARC EditGrid data and CI uploads are already visible through standard form inheritance. Step 8 (optional) in the playbook covers adding dedicated panels if more explicit presentation is needed. Not strictly required for the workflow to function.

### 3. ARC second pass radio reset — DISCOVERED
**Issue**: After CI cycle, the ARC radio remains "yes". The officer must manually change it to "No" before the "Send to Board submission" button appears. This is controlled by a separate determinant (`= no`, not `≠ yes`). This is a UX consideration, not a bug — it forces ARC to consciously confirm the CI cycle is complete.

---

## Design Decisions & Lessons Learned

### 1. != yes vs = no
Using `NOT_EQUAL "yes"` instead of `EQUAL "no"` is critical for the role-gating determinant. On first pass, the ARC radio field is empty (never set). `empty != "yes"` = TRUE (roles activate). `empty = "no"` = FALSE (roles blocked!).

### 2. Alternative A vs B for ARC transitions
- **Alternative A** (preferred but blocked): Single "File approved" status with dual destinations (Status letter + CI), gated by determinants. BPA UI does not support determinant-gated destinations.
- **Alternative B** (implemented): Two separate statuses. `fileValidated` → File approved → Status letter. `fileDecline` → Send back for correction → Complementary Information. Works but marks file as "sent back" which may affect reporting.

### 3. Grid determinants use "Value in parent catalog"
NOT radio-style matching. The grid determinant checks if SOME rows in the EditGrid have a specific catalog value selected. Type = grid, predicate = SOME, matching = "Value in parent catalog".

### 4. Save EditGrid rows before action buttons (CRITICAL)
Any unsaved EditGrid rows cause silent form validation failure — the action button does nothing (0 network requests). Must call `saveRow()` on all open EditGrid rows BEFORE clicking any action button. Applies to ALL Part B roles.

### 5. Full workflow after ARC approval
ARC → Status letter → Signature Status Letter → Complementary Information SL → Board submission → CEO validation → Board → SEZ Documents → DONE (39 tasks total for CI path).

### 6. Pattern is fully replicable
MAIN was configured by replicating the PARTB pattern. The same 5 determinants + 12 role updates + ARC button wiring. Total time: ~3 hours (config + verification). See `designer/knowledge/service-replication-methodology.md`.

---

## Related BPA Concepts Used

- `sort_order_number`: BPA routes files to all roles sharing the same sort number simultaneously. The file advances to sort N+1 only when ALL roles at sort N are resolved (FILE VALIDATED). Determinant-gated roles are automatically skipped when their condition is false.
- `json_determinants`: OR/AND combinable logic on roles. Roles with no matching determinant are skipped automatically.
- Grid determinants with SOME: TRUE when at least one row in the EditGrid matches the condition.
- `Not CI flow` pattern: Using `!= Yes` on a radio field that controls grid visibility — reliable proxy for "grid is empty / CI not requested".
- `fileDecline` system bot: Triggers "Send back for correction" status. Used to redirect file to CI role instead of applicant.
