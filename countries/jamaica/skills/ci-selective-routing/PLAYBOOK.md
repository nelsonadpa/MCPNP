# Playbook: CI Selective Routing for an eRegistrations Service

**Purpose**: Apply selective routing so that when ARC sends a file back for Complementary Information (CI), only the units ARC selected re-activate — not all evaluations/approvals.

**Prerequisites**:
- Service must already have a working workflow: DocCheck → Evals → Approvals → ARC
- ARC form must have a radio "Does the application require additional information?" (yes/no)
- ARC form must have an EditGrid with a catalog column for selecting units (e.g., "Select units that will review")
- CI role must already exist (sort between DocCheck and Evals, assigned to applicant)

---

## Step 1: Identify the roles to gate

**Who does it**: Config Agent (MCP `role_list`)

```
role_list(service_id=<SERVICE_ID>, instance=<INSTANCE>)
```

Categorize roles into 3 groups:

| Group | Logic | Example |
|-------|-------|---------|
| **Internal evals/approvals** | OR(Not CI flow, CI review by <unit>) | Legal eval, Business approval |
| **External-only roles** | OR(Not CI flow) — no unit det | NOC, TAJ, JCA, MOFPS |
| **Always active** | No gating | ARC, DocCheck, Status Letter, etc. |

**Output**: Table of role IDs + which group they belong to.

---

## Step 2: Create "Not CI flow" determinant

**Who does it**: Human in BPA UI (MCP bug: no `radiodeterminant_create`)

**URL**: `https://bpa.<country>.eregistrations.org/services/<SERVICE_ID>/determinantstable`

| Field | Value |
|-------|-------|
| Name | additional information ≠ yes |
| Type | Radio (or whatever the field type is) |
| Select field | ARC role → "Does the application require additional information..." |
| Predicate | ≠ (NOT_EQUAL) |
| Value | yes |

**Why ≠ yes and not = no**: When the field is empty (first pass, ARC hasn't touched it), `empty ≠ "yes"` evaluates TRUE. Using `= "no"` would be FALSE on empty fields, blocking the first pass.

**VERIFIED**: This works correctly — tested with Jamaica PARTB (2026-03-04).

**Record the determinant ID**: `<NOT_CI_ID>`

---

## Step 3: Create unit-specific grid determinants

**Who does it**: Human in BPA UI (MCP bug: `griddeterminant_create` doesn't persist `select_value`)

Create one grid determinant per unit. The field is inside an EditGrid on the ARC form.

| Name | Field | Where applied | For which rows | Predicate | Value in parent catalog |
|------|-------|---------------|----------------|-----------|------------------------|
| CI review by legal | EditGrid.Select units... | outside the grid | SOME | = | Legal |
| CI review by technical | (same) | outside the grid | SOME | = | Technical |
| CI review by business | (same) | outside the grid | SOME | = | Business |
| CI review by compliance | (same) | outside the grid | SOME | = | Compliance |

**Note**: Check `determinant_list` first — some may already exist.

**Record the determinant IDs**: `<CI_LEGAL_ID>`, `<CI_TECH_ID>`, `<CI_BIZ_ID>`, `<CI_COMP_ID>`

---

## Step 4: Apply json_determinants to roles

**Who does it**: Config Agent (MCP `role_update` — automated)

### Format
```json
[{"type":"OR","items":[
  {"type":"OR","determinantId":"<NOT_CI_ID>"},
  {"type":"OR","determinantId":"<CI_UNIT_ID>"}
]}]
```

### Role mapping

**Internal evals**:
| Role | json_determinants |
|------|-------------------|
| Legal evaluation | OR(NOT_CI, CI_LEGAL) |
| Technical evaluation | OR(NOT_CI, CI_TECH) |
| Business evaluation | OR(NOT_CI, CI_BIZ) |
| Compliance evaluation | OR(NOT_CI, CI_COMP) |

**External-only (first pass only)**:
| Role | json_determinants |
|------|-------------------|
| Organize NOC | OR(NOT_CI) |
| TAJ approval | OR(NOT_CI) |
| JCA approval | OR(NOT_CI) |
| MOFPS approval | OR(NOT_CI) |

**Internal approvals**:
| Role | json_determinants |
|------|-------------------|
| Legal approval | OR(NOT_CI, CI_LEGAL) |
| Technical approval | OR(NOT_CI, CI_TECH) |
| Business approval | OR(NOT_CI, CI_BIZ) |
| Compliance approval | OR(NOT_CI, CI_COMP) |

**ARC**: NO changes — must activate on both passes.

### Execution
```
# For each role:
role_update(role_id=<ROLE_ID>, json_determinants='[{"type":"OR","items":[...]}]', instance=<INSTANCE>)
```

12 calls total. Can run in parallel.

---

## Step 5: Configure ARC buttons + transitions

**Who does it**: Config Agent (MCP) + Human (BPA UI)

### 5a: Button visibility with determinants (BPA UI)

Add determinants to the ARC buttons so only one shows at a time:

| Button | Determinant | Shows when |
|--------|------------|------------|
| "Send to Board submission" | ≠ yes (NOT_CI) | No additional info needed |
| "Request additional information" | = yes (need to create) | Additional info needed |

### 5b: Wire "Request additional information" button (MCP)

```
componentaction_save(
  service_id=<SERVICE_ID>,
  component_key='<REQUEST_CI_BUTTON_KEY>',
  actions=[{"bot_id": "fileDecline"}],
  instance=<INSTANCE>
)
```

`fileDecline` triggers the system "Send back for correction" status.

### 5c: Configure ARC "Send back for correction" status (BPA UI)

In BPA UI → ARC role → Status tab:

| Status | Action |
|--------|--------|
| "Send back for correction" | Change destination from **Applicant** → **Complementary Information** |
| "Send back for correction" | **Activate** the status (toggle ON) |

**Why fileDecline / Send back?**: Attempted Alternative A (both CI + Status letter as destinations on "File approved" with determinants), but BPA UI doesn't allow determinant-gated destinations on a single status. Alternative B (separate statuses) works: approve → Status letter, decline → CI.

### 5d: "Send to Board submission" button (should already work)

Already wired to `fileValidated` → Status 1 (File approved) → Status letter.

---

## Step 6: Verify first pass (CRITICAL)

**Who does it**: Tester (Playwright or manual)

**Test**: Submit a new file → pass DocCheck → verify ALL evaluations + approvals activate.

This validates that `≠ yes` evaluates TRUE when the radio field is empty (never filled by ARC).

**VERIFIED on Jamaica PARTB**: All 5 evals activate after DocCheck. Camunda task names: `legalEvaluation`, `technicalEvaluation`, `businessEvaluation`, `complianceEvaluation`, `organizeNocAndInspection`.

**If it fails**: The determinant logic doesn't work with empty fields. Alternative: use a boolean determinant on a hidden field that defaults to TRUE and is set to FALSE by ARC.

---

## Step 7: Verify CI selective routing

**Who does it**: Tester (Playwright or manual)

**Test**:
1. Process file through to ARC (DocCheck → 5 evals → 7 approvals → ARC)
2. ARC selects "Yes" for additional information
3. ARC fills EditGrid with units (e.g., "Legal" + "Business")
4. ARC clicks "Request additional information" → `fileDecline` → CI role activates
5. Applicant completes CI form (upload docs, explanation, submit)
6. Verify ONLY Legal eval + Business eval activate (selective!)
7. Process those → verify ONLY Legal approval + Business approval activate
8. Those complete → ARC activates again
9. ARC approves normally → Status letter

**Expected skipped roles on CI pass**: Technical eval, Compliance eval, NOC, TAJ, JCA, MOFPS, Technical approval, Compliance approval.

### Testing the EditGrid (Playwright)

The EditGrid uses Form.io + Choices.js. To fill it programmatically:

```javascript
// Get the EditGrid Formio component
const editGrid = Object.values(Formio.forms)[0].getComponent('applicationReviewingCommitteeArcDecisionEditGrid3');

// Add a row
editGrid.addRow();
const rowIndex = editGrid.editRows.length - 1;

// Find the Choices.js select inside the new row
const choicesEl = document.querySelectorAll('.editgrid-row-modal .choices__input--cloned')[0];
const choicesInstance = choicesEl?.closest('.choices')?._choices;

// Search and select value
choicesInstance.setChoiceByValue('<catalog-key-for-Legal>');

// Save the row
editGrid.saveRow(rowIndex);
```

**Alternatively**: Click "+ Add" button → type in Choices.js dropdown → wait 2s for API → click option → click Save.

---

## Step 8: (Optional) Add CI data panels to forms

**Who does it**: Config Agent (MCP `form_component_add`) or Human in UI

Add a read-only panel to each eval/approval form showing:
- ARC's document request (copyValueFrom ARC EditGrid3)
- Applicant's CI uploads + explanation (copyValueFrom CI role fields)
- Panel gated by the unit determinant (show only during CI pass)

---

## Checklist

- [x] Step 1: Roles identified and categorized
- [x] Step 2: "Not CI flow" determinant created (BPA UI)
- [x] Step 3: Unit grid determinants created (BPA UI)
- [x] Step 4: json_determinants applied to 12 roles (MCP)
- [x] Step 5a: Button determinants added (BPA UI)
- [x] Step 5b: "Request additional information" wired to fileDecline (MCP)
- [x] Step 5c: "Send back for correction" → CI role + activated (BPA UI)
- [x] Step 6: First pass verified — all roles activate ✓
- [x] Step 7: CI selective routing verified — only selected units activate ✓ (2026-03-05)
- [ ] Step 8: CI data panels added (optional)
- [ ] Cleanup: delete unused determinant `2d193839`

---

## Design Decisions & Lessons Learned

### 1. ≠ yes vs = no
Using `NOT_EQUAL "yes"` instead of `EQUAL "no"` is critical. On first pass, the ARC radio field is empty (never set). `empty ≠ "yes"` = TRUE (roles activate). `empty = "no"` = FALSE (roles blocked!).

### 2. Alternative A vs B for ARC transitions
- **Alternative A** (preferred but blocked): Single "File approved" status with dual destinations (Status letter + CI), gated by determinants. BPA UI does not support determinant-gated destinations.
- **Alternative B** (implemented): Two separate statuses. `fileValidated` → File approved → Status letter. `fileDecline` → Send back for correction → Complementary Information. Works but marks file as "sent back" which may affect reporting.

### 3. EditGrid catalog selection
The unit selection uses an EditGrid with a Choices.js dropdown sourced from a restheart catalog. Each row has: textarea "Document name and reason" + select "Select units that will review". The select loads catalog values (Legal, Technical, Business, Compliance) via API.

### 4. Grid determinants use "Value in parent catalog"
NOT radio-style matching. The grid determinant checks if SOME rows in the EditGrid have a specific catalog value selected. Type = grid, predicate = SOME, matching = "Value in parent catalog".

### 5. MCP limitations requiring BPA UI
- **Radio determinants**: `selectdeterminant_create` creates wrong type (select instead of radio)
- **Grid determinants**: `griddeterminant_create` doesn't persist `select_value` or `row_determinant_id`
- **Role status IDs**: `role_get` doesn't return status UUIDs, only names
- **Processing forms**: `form_component_get`/`form_query` only access applicant/guide forms, not role processing forms
- **Full report**: `countries/jamaica/analysis/mcp-issue-ci-routing-determinants.md`

### 6. ARC form component keys (Jamaica PARTB)
- Radio: `applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditionalInformationOrSupportingDocumentationBeforeProceedingToTheNextStage`
- EditGrid: `applicationReviewingCommitteeArcDecisionEditGrid3`
- Select inside grid: `applicationReviewingCommitteeArcDecisionSelectUnitsThatWillReview3`
- Request CI button: `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation`
- Send to Board button: `filevalidated_575a341d-4e60-71f0-9de6-58a5dbf4afdf`

### 7. Camunda task names
The actual Camunda names use *Evaluation not *Review: `legalEvaluation`, `technicalEvaluation`, `businessEvaluation`, `complianceEvaluation`, `organizeNocAndInspection`.

### 8. Save EditGrid rows before action buttons (CRITICAL)
Any unsaved EditGrid rows cause silent form validation failure — the action button does nothing (0 network requests). Must call `saveRow()` on all open EditGrid rows BEFORE clicking any action button. Applies to ALL Part B roles.

### 9. ARC second pass — change radio before Board submission
After CI cycle, the radio is still "yes". Officer must change to "No" before "Send to Board submission" button appears (controlled by "additional information = no" determinant). The determinant `2d193839` uses `= no` (not `≠ yes`), so "No" must be explicitly selected.

### 10. Full workflow after ARC approval
ARC → Status letter → Signature Status Letter → Complementary Information SL → Board submission → CEO validation → Board → SEZ Documents → DONE (39 tasks total for CI path).

---

## Reference: Jamaica PARTB Implementation

### Determinants
| Determinant | ID | Type |
|---|---|---|
| additional information ≠ yes | `2cb77156-57e7-45fd-86a0-aba6c68db690` | radio NOT_EQUAL |
| CI review by Business | `a4885fdb-7c5f-4e74-aec9-dbc5be17d706` | grid catalog SOME |
| CI review by Legal | `b8b03bd5-83d5-4666-9e2f-a45028ce2e10` | grid catalog SOME |
| CI review by Technical | `026efd11-e520-44dd-9c33-bfb844532290` | grid catalog SOME |
| CI review by Compliance | `68c31790-0907-42b9-b4b5-57a8b6933a28` | grid catalog SOME |
| additional information = no (UNUSED) | `2d193839` | DELETE THIS |

### Roles updated (12)
| Role | ID | Group |
|---|---|---|
| Legal evaluation | `b74fb436` | Internal eval |
| Technical evaluation | `aa796230` | Internal eval |
| Business evaluation | `dd7be92b` | Internal eval |
| Compliance evaluation | `522154fd` | Internal eval |
| Organize NOC | `7d05a12e` | External |
| TAJ approval | `e91989e0` | External |
| JCA approval | `da0c1806` | External |
| MOFPS approval | `23d8b812` | External |
| Legal approval | `c04abd44` | Internal approval |
| Technical approval | `da3b18a8` | Internal approval |
| Business approval | `94e0ece3` | Internal approval |
| Compliance approval | `f4e92581` | Internal approval |

### ARC configuration
| Item | Value |
|---|---|
| ARC role ID | `f904ea5e-165e-469d-8ec2-b9658276a048` |
| CI role ID | `c3905b1b-01b3-40a8-a306-f410ba8d4acd` |
| Status 1 (File approved) | → Status letter |
| Status 2 (Send back) | → Complementary Information (activated) |
| Button componentAction | `3a585297-2021-4f00-8b87-728fd2c81dc2` (fileDecline) |
| Board button componentAction | `8903a85a-488d-4b83-94eb-3e1a3437a76f` (fileValidated) |

### Test files
| File | Process | Used for | Result |
|---|---|---|---|
| b79f5d3e | 83696bff | First pass verification | → Status letter (old config) |
| 08c749e5 | 18b2b21e | CI test attempt | → Status letter (old config) |
| f16763e1 | 5cdfcc6a | **Full CI E2E** (new config) | **39/39 tasks COMPLETE** ✅ |

### Full E2E result (file f16763e1)
- Phase A: DocCheck + 5 evals + 7 approvals → ARC (13 roles)
- Phase B: ARC → yes + Legal+Business → fileDecline → CI ✅
- Phase C: Applicant CI form → saveSENDPAGE ✅
- Phase D: **SELECTIVE ROUTING** — Legal + Business only, 6 roles skipped ✅
- Phase E: 4 selective roles → ARC ✅
- Phase F: ARC → radio "No" + Board submission → Status letter ✅
- Bonus: Status letter → Signature → CI SL → Board → CEO → Board → SEZ Docs → DONE ✅
- Report: `shared/responses/test-coordinator_006.md` + `test-coordinator_007.md`
- Spec: `countries/jamaica/testing/specs/ci-new-file-pipeline.spec.ts`
