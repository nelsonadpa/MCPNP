# MAIN Service — CI Selective Routing Verification Report

**Service**: MAIN (`0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`)
**Date**: 2026-03-05
**Verified by**: Config Agent (MCP read-only)
**Reference**: Replicated from PARTB (`28bf8aca`)

---

## 1. Determinants (5/5 PASS)

| # | Determinant | Expected ID | Found | Type | Operator | Target Field | Status |
|---|-------------|-------------|-------|------|----------|-------------|--------|
| 1 | additional information ≠ yes | `ff6cca8a` | `ff6cca8a-04ce-4b4f-adde-7322bb87901c` | radio | NOT_EQUAL | `...DoesTheApplicationRequireAdditionalInformation...` | **PASS** |
| 2 | CI review by legal | `4ffec4a3` | `4ffec4a3-eacd-4582-bbb7-199478897176` | grid | SOME | `applicationReviewingCommitteeArcDecisionEditGrid3` | **PASS** |
| 3 | CI review by technical | `65d147a7` | `65d147a7-7797-4fb1-89d5-2ec5631e55f3` | grid | SOME | `applicationReviewingCommitteeArcDecisionEditGrid3` | **PASS** |
| 4 | CI review by compliance | `ec696538` | `ec696538-7672-44c0-9f32-e7fc04f95963` | grid | SOME | `applicationReviewingCommitteeArcDecisionEditGrid3` | **PASS** |
| 5 | CI review by business | `d45f8e03` | `d45f8e03-613d-4b3b-b98d-d79aab44e729` | grid | SOME | `applicationReviewingCommitteeArcDecisionEditGrid3` | **PASS** |

**Note**: All 4 CI grid determinants target the same EditGrid (`EditGrid3` = ARC units selection grid). This is correct — each determinant checks a different column/value within the grid rows.

---

## 2. Roles — json_determinants (4/4 spot-checked, 12/12 configured per CHANGELOG)

### Spot-checked roles

| # | Role | ID | json_determinants | Expected Logic | Status |
|---|------|----|-------------------|---------------|--------|
| 1 | Legal evaluation | `998caef5-e46f-474d-9106-266dc6db9423` | `OR(≠yes, CI Legal)` | OR(ff6cca8a, 4ffec4a3) | **PASS** |
| 2 | Organize NOC | `f447186b-57dd-4d55-8301-08b4e7422baa` | `OR(≠yes)` | OR(ff6cca8a) | **PASS** |
| 3 | Business approval | `b821ad92-2391-4bef-a2a9-03d87abacbd9` | `OR(≠yes, CI Business)` | OR(ff6cca8a, d45f8e03) | **PASS** |
| 4 | MOFPS approval | `c656a915-f823-4d9a-9140-01b2bf7399f4` | `OR(≠yes)` | OR(ff6cca8a) | **PASS** |

### Role logic explanation

- **Eval/Approval with unit** (Legal, Technical, Business, Compliance): `OR(≠yes, CI_{unit})` — role activates on first pass (≠yes = true because ARC hasn't selected yet) AND on CI if that specific unit was selected
- **Approval-only ≠yes** (NOC, TAJ, JCA, MOFPS): `OR(≠yes)` — role activates ONLY on first pass, SKIPPED during CI (because ≠yes = false when ARC selected "yes")

### All 12 roles from CHANGELOG (not all spot-checked via MCP)

| Role | ID | Logic | Spot-checked |
|------|----|-------|-------------|
| Legal evaluation | `998caef5` | OR(≠yes, CI Legal) | Yes |
| Technical evaluation | `ed093633` | OR(≠yes, CI Technical) | — |
| Business evaluation | `2a87aeab` | OR(≠yes, CI Business) | — |
| Compliance evaluation | `32ba8fae` | OR(≠yes, CI Compliance) | — |
| Organize NOC | `f447186b` | OR(≠yes) | Yes |
| TAJ approval | `89a09269` | OR(≠yes) | — |
| JCA approval | `0f4d3be1` | OR(≠yes) | — |
| MOFPS approval | `c656a915` | OR(≠yes) | Yes |
| Legal approval | `0d52653d` | OR(≠yes, CI Legal) | — |
| Technical approval | `6819d50d` | OR(≠yes, CI Technical) | — |
| Business approval | `b821ad92` | OR(≠yes, CI Business) | Yes |
| Compliance approval | `2b4e6815` | OR(≠yes, CI Compliance) | — |

---

## 3. ARC Button (PASS)

| Property | Expected | Found | Status |
|----------|----------|-------|--------|
| Component key | `applicationReviewingCommitteeArcDecisionRequestAdditionalInformation` | Same | **PASS** |
| ComponentAction ID | `0e3b93e0` | `0e3b93e0-221c-472e-bc8d-75f259c91099` | **PASS** |
| Bot | `fileDecline` (system) | `fileDecline` — "Request corrections" | **PASS** |
| Bot enabled | true | true | **PASS** |

---

## 4. Additional verifications (from CHANGELOG, not MCP-verified)

| Item | Status | Notes |
|------|--------|-------|
| ARC "Send to Board" button → determinant ≠yes (`ff6cca8a`) | Configured in BPA UI | Shows only when ARC selects "no" (first pass) |
| ARC "Request additional info" button → determinant =yes (`fc7aa267`) | Configured in BPA UI | Shows only when ARC selects "yes" (CI path) |
| Status "Send back for correction" → Complementary Information | Configured in BPA UI | Redirects to applicant CI page |
| Status "Send back for correction" → activated | Configured in BPA UI | Was previously inactive |

---

## 5. Overall Verdict

| Category | Result |
|----------|--------|
| Determinants | **5/5 PASS** |
| Roles (spot-check) | **4/4 PASS** |
| ARC button | **PASS** |
| **OVERALL** | **PASS — Ready for E2E testing** |

---

## 6. Cross-service comparison (MAIN vs PARTB)

| Aspect | PARTB | MAIN |
|--------|-------|------|
| Service ID | `28bf8aca-6d59-45ce-b81f-5068ab5ae7e1` | `0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc` |
| CI determinants | 5 | 5 (same pattern, different IDs) |
| Roles with json_determinants | 12 | 12 (same logic) |
| ARC button key | Same component key | Same component key |
| ARC fileDecline action | `3a585297` | `0e3b93e0` |
| EditGrid3 (units) key | Same | Same |
| Workflow path | DocCheck→evals→approvals→ARC→CI→selective→Board... | Identical |

**Configuration is consistent between MAIN and PARTB. Ready to proceed to Phase 2 (docs) and Phase 3 (E2E).**
