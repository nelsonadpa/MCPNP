# SEZ Developer Registration -- Simplified UX Architecture Proposal

**Service:** Establish a New Zone (Jamaica SEZ)
**Date:** 2026-03-08
**Author:** ArchitectUX Analysis
**Scope:** UX simplification addressing client's "centralized information" vision

---

## 1. Executive Summary

The current service works end-to-end (verified via testing) but distributes information collection and review across 51 roles, 1,718 fields, and 109 determinants. The client's core request is clear: **"All information requested from the user should be centralized in a single place and different persons with different roles should be able to see the list and validate if the information is good or if something else is needed."**

This proposal restructures the UX around three principles:

1. **One Dossier, Many Lenses** -- All application data lives in a single "Application Dossier" that every role accesses with role-appropriate permissions
2. **One Review Template, Seven Instances** -- The duplicated evaluation/approval pattern becomes a single reusable component
3. **Phase-Based Progression, Not Role-Based Fragmentation** -- Reduce 51 roles to ~20 functional roles organized in 4 clear phases

### Impact Summary

| Metric | Current | Proposed | Reduction |
|--------|---------|----------|-----------|
| Roles (human) | 49 | ~20 | -59% |
| Distinct form patterns | 12+ | 4 | -67% |
| Fields (total) | 1,718 | ~900 | -48% |
| Evaluation form variants | 8 (4 eval + 4 approval) | 1 template x 4 | -88% duplication |
| Agency form variants | 6 (3 DD + 3 approval) | 1 template x 3 | -83% duplication |
| Complementary Info forms | 2 (CI + CI-SL) | 1 | -50% |
| Post-Board roles | 21 | ~8 | -62% |

---

## 2. Architecture Diagnosis: Why It Feels Complex

### 2.1 The Duplication Problem

The biggest source of complexity is not the workflow itself (which is sound) but the **quadruple duplication** of identical patterns:

```
CURRENT: 4 evaluation forms x 2 stages (eval + approval) = 8 form variants
         3 agency forms x 2 stages (DD + approval) = 6 form variants
         2 complementary info forms (CI + CI-SL) = 2 form variants
         1 ARC form that copies all 7 evaluations = massive consolidation form
         1 Board form that copies the ARC form = another massive form
         = 18 form variants doing essentially 3 things

PROPOSED: 1 evaluation template (parameterized per unit)
          1 agency decision template (parameterized per agency)
          1 complementary info template
          = 3 templates
```

### 2.2 The Scattered Information Problem

Currently, an applicant's information is reviewed at **different stages by different roles with different views of the same data**. When the ARC committee meets, they see a consolidated form (~180 fields) that is a read-only copy of what 7 reviewers already saw. The Board then sees another copy (~170 fields) of what the ARC saw.

This cascading copy pattern means:
- Data is duplicated 3-4 times across the form schema
- Any update requires tracing through the copy chain
- Reviewers cannot easily see "the full picture" -- they see their slice

### 2.3 The Role Explosion Problem

Post-Board, what the BPMN describes as 6 steps becomes 21 roles in the system. Many of these are sequential handoffs that could be combined:

| BPMN Step | Current Roles | Could Be |
|-----------|---------------|----------|
| Licence Agreement | Draft LA + Apply for LA + Legal Review + Agreement Review + Issue LA = **5 roles** | Draft LA + Applicant Signs + Issue LA = **3 roles** |
| Ministerial Order | MIC + Draft + Legal Review + Approval + Gazette = **5 roles** | Draft + Legal Review + Approval = **3 roles** |
| Billing | Tech Prep + Approval + Prep Invoice + Approve Invoice = **4 roles** | Prepare Invoice + Approve Invoice = **2 roles** |
| Inspection | Invite + Tech Inspection + Inspection = **3 roles** | Schedule + Inspect = **2 roles** |

---

## 3. Proposed Architecture

### 3.1 The Application Dossier Model

Replace the current "role-owns-fields" model with a "dossier-with-sections" model:

```
APPLICATION DOSSIER
├── SECTION A: Application Data (applicant-owned)
│   ├── A1. Project Overview (zone identity, location, activities)
│   ├── A2. Developer Profile (company, shareholders, representatives)
│   ├── A3. Master Plan (7 sub-sections: land, zoning, infrastructure, design, site, timeline, docs)
│   ├── A4. Business Plan (viability, benefits, upload)
│   └── A5. Compliance (6 sub-sections: ownership, H&S, disaster, security, permits, customs)
│
├── SECTION B: Document Library (centralized)
│   ├── B1. Required Documents (17 mandatory uploads -- checklist view)
│   ├── B2. Optional Documents (23 optional uploads)
│   └── B3. Status per document: Not uploaded | Uploaded | Under review | Approved | Needs revision
│
├── SECTION C: Evaluations (officer-owned, read by committee)
│   ├── C1. Technical Evaluation    ─┐
│   ├── C2. Legal Evaluation        │ Same template: Report + Recommendation +
│   ├── C3. Business Evaluation     │ Conditions EditGrid + Risks EditGrid + Comments
│   └── C4. Compliance Evaluation   ─┘
│
├── SECTION D: External Consultations (agency-owned)
│   ├── D1. JCA Decision    ─┐
│   ├── D2. TAJ Decision    │ Same template: Decision (radio) + Comments + Upload
│   └── D3. MOFPS Decision  ─┘
│
├── SECTION E: Committee & Board Decisions
│   ├── E1. ARC Recommendation (consolidated view of C + D, plus committee decision)
│   ├── E2. Board Decision (view of E1 + final vote)
│   └── E3. CEO Validation (sign-off)
│
├── SECTION F: Complementary Information (if requested)
│   └── F1. Requested items (EditGrid from ARC/evaluators) + applicant responses
│
└── SECTION G: Post-Approval Documents (officer-generated)
    ├── G1. Status Letter (draft + signed)
    ├── G2. Pre-Approval / Denial Letter
    ├── G3. Licence Agreement
    ├── G4. Ministerial Order
    ├── G5. Operating Certificate
    └── G6. Developer License
```

### 3.2 Role-Based View Matrix

Every role sees the SAME dossier but with different permissions:

```
PERMISSION LEGEND:
  [R]  = Read-only (can see but not edit)
  [RW] = Read-Write (can edit)
  [H]  = Hidden (section not visible)
  [A]  = Approve/Decide (can set status)

┌─────────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Dossier Section     │ App │ Doc │ Eval│ Ext │ ARC │Board│Post │
│                     │licnt│Check│ x4  │ x3  │     │     │Apprv│
├─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ A. Application Data │ RW  │  R  │  R  │  R* │  R  │  R  │  R  │
│ B. Document Library │ RW  │ R+A │  R  │  R* │  R  │  R  │  R  │
│ C. Evaluations      │  H  │  H  │ RW† │  H  │  R  │  R  │  R  │
│ D. External Consult │  H  │  H  │  H  │ RW  │  R  │  R  │  H  │
│ E. Committee/Board  │  H  │  H  │  H  │  H  │ RW  │ RW  │  R  │
│ F. Complementary    │ RW‡ │  H  │  R  │  H  │ RW  │  H  │  H  │
│ G. Post-Approval    │  R  │  H  │  H  │  H  │  H  │  H  │ RW  │
└─────────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

†  Each evaluator writes ONLY their own evaluation (C1/C2/C3/C4)
‡  Applicant writes F only when CI is active (triggered by ARC)
R* External agencies see a curated subset of A (via NOC package)
```

### 3.3 Simplified Workflow

```
PROPOSED WORKFLOW (20 roles, 4 phases)

PHASE 1: APPLICATION & INTAKE
  ┌──────────────────────────────────────────────────────────┐
  │  Applicant ──submit──> Document Check (1 role)           │
  │     │                      │                             │
  │     │<──corrections────────┘ (if incomplete)             │
  │     │                      │                             │
  │     │                      ▼ (if complete)               │
  └──────────────────────────────────────────────────────────┘

PHASE 2: PARALLEL REVIEW (8 roles, all parallel)
  ┌──────────────────────────────────────────────────────────┐
  │  INTERNAL (4 combined eval+approve roles):               │
  │    Technical Review ────────────────────┐                │
  │    Legal Review ────────────────────────┤                │
  │    Business Review ─────────────────────┤ all must       │
  │    Compliance Review ───────────────────┤ complete       │
  │                                         │                │
  │  EXTERNAL (3 agency roles + 1 dispatch):│                │
  │    Organize NOC ──> JCA Decision ───────┤                │
  │                 ──> TAJ Decision ───────┤                │
  │                 ──> MOFPS Decision ─────┘                │
  └──────────────────────────────────────────────────────────┘
                          │
                          ▼
PHASE 3: DECISION (4 roles, sequential)
  ┌──────────────────────────────────────────────────────────┐
  │  ARC Committee ──> Status Letter ──> Board ──> CEO       │
  │       │                                  │               │
  │       │<──CI loop (applicant)            │               │
  │       │                                  │               │
  │       │                           ┌──────┴──────┐        │
  │       │                        Approved      Denied      │
  └───────│────────────────────────────│─────────────│────────┘
          │                           │             │
          │                           ▼             ▼
PHASE 4: POST-APPROVAL              (8 roles)    Denial Letter
  ┌──────────────────────────────────────────────────────────┐
  │  Pre-Approval Letter                                     │
  │  Ministerial Bundle ──> Ministerial Order (2 roles)      │
  │  Licence Agreement (2 roles: draft + applicant signs)    │
  │  Billing (1 role: prepare + approve)                     │
  │  Inspection ──> Operating Certificate                    │
  └──────────────────────────────────────────────────────────┘
```

---

## 4. Specific Recommendations

### 4.1 Merge Evaluation + Approval Into Single Review Role

**Before:** 8 separate roles (4 evaluations + 4 approvals) with separate forms

```
Current flow per unit:
  [Evaluation] analyst fills form ──> [Approval] director sees copy, clicks Approve
  = 2 roles, 2 form variants, ~170 fields per unit, data copied between them

  Total: 8 roles, 680+ fields
```

**After:** 4 combined Review roles with two-step workflow within each role

```
Proposed flow per unit:
  [Unit Review] analyst fills evaluation ──> director reviews IN SAME FORM, adds approval
  = 1 role with internal state (Draft > Under Approval > Approved)

  Total: 4 roles, ~340 fields (no duplication)
```

**Implementation in BPA:**
- Keep a single role per unit (e.g., `technicalReview`)
- Use a `status` field within the role: `evaluating` | `pending_approval` | `approved`
- The analyst fills the evaluation section; when they click "Submit for Approval," the role assignment shifts to the director
- The director sees the evaluation as read-only + an approval section (approve/reject/conditions)
- This is achievable by using **determinants** to show/hide the approval section based on the status field
- The role remains assigned to the same user pool; role assignment handles who sees it when

**Effort:** MEDIUM -- requires restructuring 4 role pairs into 4 single roles, merging their form fields, and adjusting determinants. No platform changes needed. BPA supports this via role reassignment and field visibility determinants.

### 4.2 Merge Due Diligence + Agency Approval Into Single Agency Decision

**Before:** 6 roles (3 due diligence + 3 approval) -- and the DD roles are currently empty/unused

```
Current: jcaDueDiligence (empty) + jcaApproval (radio + upload) = 2 roles
         x 3 agencies = 6 roles
```

**After:** 3 roles, one per agency

```
Proposed: jcaDecision (receives NOC package, makes decision, uploads justification)
          x 3 agencies = 3 roles
```

**Effort:** LOW -- The DD roles are already empty and likely deprecated. Delete them and rename the approval roles to "Decision." No form changes needed.

### 4.3 Centralized Document Library With Status Tracking

**Before:** Documents are uploaded by the applicant in the form, then each reviewer independently checks them. Document check happens at intake (Phase 1) and is not revisited. Reviewers in later phases cannot flag document issues without going through the full CI loop.

**After:** A centralized "Document Library" section visible to all roles:

```
DOCUMENT LIBRARY VIEW
┌─────────────────────────────────────────────────────────────┐
│ Document                  │ Status    │ Reviewer  │ Notes   │
├───────────────────────────┼───────────┼───────────┼─────────┤
│ Certificate of Incorp.    │ Approved  │ DocCheck  │         │
│ Concept Master Plan       │ Approved  │ DocCheck  │         │
│ Business Plan             │ Flagged   │ BPSS      │ "Sec 3  │
│                           │           │           │ missing" │
│ OH&S Plan                 │ Under Rev │ CAS       │         │
│ Tax Compliance Certificate│ Not Uploaded │ --     │         │
└───────────────────────────┴───────────┴───────────┴─────────┘
```

**Implementation in BPA:**
- This is partially achievable. BPA's document requirement system already tracks upload status per document requirement.
- What's missing is the **per-reviewer status** and **notes** capability. Currently, document approval is binary at the DocCheck stage.
- **Workaround:** Add a `document_review` editgrid to each evaluator's section where they can flag specific documents with comments. These flags feed into the CI request if needed.
- **Platform enhancement needed:** A true centralized document status tracker across roles is not a native BPA feature. The workaround keeps the concept within BPA's capabilities.

**Effort:** MEDIUM for workaround, HIGH for platform feature.

### 4.4 ARC Consolidation: Auto-Populate Instead of Copy

**Before:** The ARC form has ~180 fields, most of which are `copyFrom` fields that duplicate evaluation data. If an evaluator updates something, the ARC copy is stale.

**After:** The ARC form should display live references to evaluation sections rather than static copies.

**Implementation in BPA:**
- BPA's `copyFrom` mechanism is one-directional (copies at role activation time). There is no "live reference."
- **Workaround:** Use bots more aggressively. The existing internal bots (`APPROVALS to ARC - conditions to consolidated`, `APPROVALS to ARC - risks to consolidated`) already do this. Ensure they run at the correct time and cover ALL data, not just conditions and risks.
- **Better approach:** Reduce what the ARC form shows. Instead of copying ALL evaluation fields, show only:
  1. Per-unit summary (recommendation + key conditions + key risks) -- this is what the bots already consolidate
  2. A link/button to "View full evaluation" that opens the evaluation section read-only
  3. The ARC's own decision fields (recommendation, consolidated conditions/risks, minutes upload)

This reduces the ARC form from ~180 fields to ~50 fields.

**Effort:** MEDIUM -- Requires trimming the ARC form and verifying bot mappings cover the essential summary data.

### 4.5 Applicant Form: Progressive Disclosure

**Before:** The applicant sees all 5 tabs with all sub-tabs from the start. The Master Plan tab alone has 7 sub-tabs and ~128 fields. Many fields are conditional but the conditions are not always clear.

**After:** Guide the applicant through sections with clear progress indicators and smart conditionals:

```
PROPOSED APPLICANT EXPERIENCE

Step 1: GETTING STARTED (gate)
  "What type of zone are you establishing?"
  → Answer drives which subsequent sections are required
  → Shows estimated completion checklist

Step 2: PROJECT OVERVIEW
  ├── Zone identity (5 fields -- always required)
  ├── Location (3 fields -- always required)
  └── Proposed activities (checkbox list)
      → Activities selected drive which compliance sub-sections appear

Step 3: DEVELOPER PROFILE
  ├── Company information (7 fields -- always required)
  ├── Authorized representative (4 fields)
  ├── Shareholders (EditGrid -- conditional on company type)
  └── Parent companies (EditGrid -- conditional on JV status)

Step 4: MASTER PLAN
  ├── 4a. Land Information (parcels, rights, ownership)
  │     → Land rights type drives which documents are required
  ├── 4b. Land Use & Zoning (if applicable based on zone type)
  ├── 4c. Infrastructure (roads, utilities, connectivity)
  ├── 4d. Design (sketches, renderings, technical drawings)
  ├── 4e. Site Conditions (existing infrastructure, nearby communities)
  └── 4f. Timeline (phases, dependencies)

Step 5: BUSINESS PLAN
  ├── Upload business plan document
  ├── Investment breakdown (4 fields)
  ├── Funding structure (4 fields)
  ├── Revenue model (3 fields)
  └── Employment projections (6 fields)

Step 6: COMPLIANCE
  ├── 6a. Ownership & Financial Integrity (always required)
  ├── 6b. Health & Safety (always required)
  ├── 6c. Disaster Mitigation (always required)
  ├── 6d. Security Plan (always required)
  ├── 6e. Licensing & Permits (always required)
  └── 6f. Excise Goods (conditional: only if activities include excise goods)

Step 7: DOCUMENT CHECKLIST (new -- does not exist currently)
  ├── Auto-populated list based on what was filled
  ├── Shows: Required | Optional | Already uploaded | Missing
  └── Prevents submission until all required documents uploaded

Step 8: REVIEW & SUBMIT
  ├── Summary view of all sections (read-only)
  ├── Consent checkboxes
  └── Submit button
```

**Key Changes:**
1. Add a "Document Checklist" step that aggregates all upload requirements in one view
2. Make the excise goods compliance sub-section conditional on selected activities
3. Add progress indicators showing completion percentage per section
4. Activate the currently empty Guide Form to provide contextual help

**Implementation in BPA:**
- Step 7 (Document Checklist) requires a new tab that displays all `file` fields with their upload status. This can be built as a content component with mustache templates referencing each file field.
- Progressive disclosure via determinants is already the mechanism used. The proposal is to ADD determinants for sections that are currently always shown but should be conditional.
- The Guide Form activation is a straightforward configuration: populate the guide form with help text per section.

**Effort:** MEDIUM -- New tab creation, new determinants for conditional sections, guide form population.

### 4.6 Post-Board Phase Consolidation

**Before:** 21 roles at sort_order 299, many untested

**After:** 8 roles organized in clear sub-phases:

```
POST-APPROVAL CONSOLIDATION

Current 21 roles → Proposed 8 roles:

1. Pre-Approval Letter (keep as-is)

2. Ministerial Bundle + Draft Order → "Prepare Ministerial Order"
   (merge 3 roles: bundle prep + MIC instructions + draft into 1)

3. Ministerial Order Legal Review (keep -- different department)

4. Ministerial Order Approval (keep -- ministerial sign-off)

5. Licence Agreement Process:
   - Draft + Issue → "Prepare Licence Agreement" (merge 2)
   - Apply for LA + Agreement Review & Payment → "Applicant Signs Agreement" (merge 2)
   - Legal Review of Payment (keep -- different department)

6. Billing:
   - Tech Prepares Billing + Prep Invoice → "Prepare Invoice" (merge 2)
   - Approval of Billing + Approve Invoice → "Approve Invoice" (merge 2)

7. Inspection:
   - Inspection Invite + Technical Inspection + Inspection → "Site Inspection" (merge 3)
   - Keep Compliance Inspection separate if it involves different staff

8. Operating Certificate + Gazette → "Issue Certificate & Gazette" (merge 2)
```

**Effort:** HIGH -- This involves significant role restructuring, form field merging, and workflow reconfiguration. However, since these 21 roles are untested and some have empty forms, this is the right time to do it (before they go into production).

---

## 5. Unified Review Template

The single most impactful change: create ONE review template used by all 7 reviewing entities.

### Template Structure

```
UNIFIED REVIEW TEMPLATE
(parameterized by: unit_name, reviewer_name, approver_name)

┌─────────────────────────────────────────────────────┐
│ SECTION 1: Application Summary (read-only)          │
│   Shows relevant subset of applicant data            │
│   - For Technical: infrastructure, site, design      │
│   - For Legal: company, land rights, permits         │
│   - For Business: business plan, projections         │
│   - For Compliance: H&S, disaster, security          │
│   - For Agencies: NOC package documents              │
│                                                      │
│ SECTION 2: Evaluation (analyst fills)                │
│   ├── Upload evaluation report (file, required)      │
│   ├── Recommendation (radio: Approve/Reject/Cond.)   │
│   ├── Conditions? (radio: Yes/No)                    │
│   │   └── Conditions EditGrid (if yes):              │
│   │       Condition | Justification | Type | Timeline│
│   ├── Risks? (radio: Yes/No)                         │
│   │   └── Risks EditGrid (if yes):                   │
│   │       Risk | Probability | Impact | Mitigation   │
│   └── Comments for approver (textarea)               │
│                                                      │
│ SECTION 3: Approval (director fills)                 │
│   ├── Evaluation report (read-only from Section 2)   │
│   ├── Approve / Return to evaluator / Reject (radio) │
│   ├── Comments from approver (textarea)              │
│   └── Action button: "Approve and send to ARC"       │
│                                                      │
│ SECTION 4: Complementary Info Tracking               │
│   ├── Items requested from applicant (EditGrid, RO)  │
│   └── Items received (status per item)               │
└─────────────────────────────────────────────────────┘
```

**What changes per instance:**
- Section 1 content (which applicant fields are shown) -- controlled by determinants based on role
- Role assignment (who fills Section 2 vs Section 3)
- Label text ("Technical Evaluation" vs "Legal Evaluation" etc.)
- Nothing else. The structure is identical.

**Implementation in BPA:**
- This is achievable TODAY by making the 4 evaluation roles use identical field structures (they already nearly do -- the analysis confirmed "consistent evaluation pattern").
- The main work is removing the copy-paste variants and pointing all 4 roles at the SAME set of field keys with role-based visibility determinants.
- For external agencies, the template is even simpler (Section 2 only: Decision radio + Comments + Upload).

**Effort:** MEDIUM -- Field consolidation and determinant adjustments. No platform changes.

---

## 6. Implementation Priority Matrix

### Tier 1: Quick Wins (1-2 weeks, high impact, low risk)

| # | Action | Impact | Effort | BPA-Native? |
|---|--------|--------|--------|-------------|
| 1 | Delete 3 empty Due Diligence roles | Reduces role count by 3, removes confusion | Very Low | Yes |
| 2 | Fix key-label mismatches (12 fields) | Prevents mapping errors | Low | Yes |
| 3 | Fix navigation button labels (3 buttons) | Prevents user confusion | Very Low | Yes |
| 4 | Rename inconsistent roles (9 roles) | Professionalism, clarity | Very Low | Yes |
| 5 | Rename "generated by copying" determinants (6) | Developer clarity | Very Low | Yes |
| 6 | Delete duplicate determinants (2 pairs) | Reduces determinant count | Very Low | Yes |
| 7 | Fix "Technical drawings (optional)" required flag | UX consistency | Very Low | Yes |
| 8 | Configure bot mappings for Developer License | Enables certificate generation | Medium | Yes |

**Combined impact:** Reduces role count from 51 to 48, fixes 20+ naming issues, enables the primary output document.

### Tier 2: Structural Improvements (2-4 weeks, high impact, medium risk)

| # | Action | Impact | Effort | BPA-Native? |
|---|--------|--------|--------|-------------|
| 9 | Add Document Checklist tab to applicant form | Major UX improvement for applicants | Medium | Yes |
| 10 | Activate Guide Form with section help text | Reduces support burden | Medium | Yes |
| 11 | Trim ARC form to summary + decision only | Reduces ARC from ~180 to ~50 fields | Medium | Yes |
| 12 | Trim Board form similarly | Reduces Board from ~170 to ~40 fields | Medium | Yes |
| 13 | Merge CI + CI-SL into single CI mechanism | Reduces complexity, eliminates duplication | Medium | Yes |
| 14 | Add conditional visibility for excise goods section | Hides irrelevant compliance section | Low | Yes |

**Combined impact:** Reduces total field count by ~400, improves applicant experience significantly, simplifies the two most complex forms (ARC, Board).

### Tier 3: Role Consolidation (4-8 weeks, very high impact, higher risk)

| # | Action | Impact | Effort | BPA-Native? |
|---|--------|--------|--------|-------------|
| 15 | Merge 4 eval + 4 approval into 4 Review roles | Reduces 8 roles to 4, eliminates data duplication | High | Yes (with workarounds) |
| 16 | Consolidate post-Board 21 roles into ~8 | Reduces role count by 13, simplifies tracking | High | Yes |
| 17 | Implement unified Review Template for evaluations | Eliminates form duplication, standardizes UX | High | Yes |

**Combined impact:** Reduces role count from ~48 to ~20, eliminates ~400 duplicated fields.

### Tier 4: Platform Enhancement Requests (requires platform changes)

| # | Enhancement | Impact | Effort | Who |
|---|-------------|--------|--------|-----|
| 18 | Centralized document status tracker across roles | Enables the client's core vision | High | Platform team |
| 19 | "View full evaluation" read-only overlay within ARC | Better than copyFrom duplication | Medium | Platform team |
| 20 | Progress indicator component for multi-section forms | Better applicant experience | Medium | Platform team |
| 21 | Live field references (not just copyFrom at activation) | Eliminates stale data copies | High | Platform team |

---

## 7. Before/After: Key Screens

### 7.1 Officer Dashboard (Before vs After)

**BEFORE:** Officer logs in, sees a queue filtered by their specific role (e.g., "Legal Evaluation"). They can only see fields assigned to their role. To understand the full application, they must navigate between tabs and roles.

```
CURRENT OFFICER VIEW
┌──────────────────────────────────────────────────┐
│ Legal Evaluation Queue                    [Inbox] │
├──────────────────────────────────────────────────┤
│ App #2025-003  ABC Corp  Status: Pending   [Open]│
│ App #2025-007  XYZ Ltd   Status: Pending   [Open]│
├──────────────────────────────────────────────────┤
│ [Click Open → sees ONLY legal evaluation fields] │
└──────────────────────────────────────────────────┘
```

**AFTER:** Officer logs in, sees the Application Dossier with a sidebar showing which section they need to act on. They can browse ALL sections (read-only for others) to understand context.

```
PROPOSED OFFICER VIEW
┌─────────────────────────────────────────────────────────────┐
│ Application Dossier: ABC Corp - Kingston SEZ     [#2025-003]│
├──────────┬──────────────────────────────────────────────────┤
│ SECTIONS │  C2. LEGAL EVALUATION                [YOUR TASK]│
│          │                                                  │
│ A. App   │  Application Summary (read-only)                 │
│   Data[R]│  ┌──────────────────────────────────────────┐    │
│ B. Docs  │  │ Company: ABC Corp                        │    │
│   [R]    │  │ Land rights: Freehold (Certificate #123) │    │
│ C. Evals │  │ Zone type: Industrial                    │    │
│  C1.Tech │  │ Key documents: [Articles] [Title] [Lease]│    │
│ >C2.Legal│  └──────────────────────────────────────────┘    │
│  C3.Biz  │                                                  │
│  C4.Compl│  Your Evaluation                                 │
│ D. Ext   │  ┌──────────────────────────────────────────┐    │
│   [H]    │  │ Upload report: [Choose file]             │    │
│ E. Cmte  │  │ Recommendation: ○ Approve ○ Reject ○ Cond│    │
│   [H]    │  │ Conditions: ○ Yes ○ No                   │    │
│          │  │ Risks: ○ Yes ○ No                        │    │
│ PROGRESS │  │ Comments: [                        ]     │    │
│ ████░░░░ │  │                                          │    │
│ 3/7 done │  │ [Submit Evaluation for Approval]         │    │
│          │  └──────────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────────┘
```

### 7.2 ARC Committee View (Before vs After)

**BEFORE:** ARC sees a massive form with ~180 fields: read-only copies of all 4 evaluations + 3 agency decisions + their own decision fields. Scrolling through this form is the primary UX challenge.

**AFTER:** ARC sees a dashboard-style summary with expandable sections:

```
PROPOSED ARC VIEW
┌─────────────────────────────────────────────────────────────┐
│ ARC DECISION DASHBOARD: ABC Corp - Kingston SEZ  [#2025-003]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ EVALUATION SUMMARY                                          │
│ ┌─────────────┬──────────────┬────────────┬───────────────┐ │
│ │ Unit        │ Recommendation│ Conditions │ Risks         │ │
│ ├─────────────┼──────────────┼────────────┼───────────────┤ │
│ │ Technical   │ APPROVE      │ 2 items    │ 1 item        │ │
│ │ Legal       │ CONDITIONAL  │ 3 items    │ 0 items       │ │
│ │ Business    │ APPROVE      │ 0 items    │ 2 items       │ │
│ │ Compliance  │ APPROVE      │ 1 item     │ 1 item        │ │
│ └─────────────┴──────────────┴────────────┴───────────────┘ │
│ [Expand Technical ▼] [Expand Legal ▼] [Expand All]          │
│                                                             │
│ EXTERNAL CONSULTATIONS                                      │
│ ┌──────┬──────────────┬────────────────────────────────────┐│
│ │ JCA  │ No objection │ Received 2025-02-15                ││
│ │ TAJ  │ No objection │ Received 2025-02-18                ││
│ │ MOFPS│ No objection │ Received 2025-02-20                ││
│ └──────┴──────────────┴────────────────────────────────────┘│
│                                                             │
│ ARC DECISION                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Recommendation: ○ Approve ○ Conditional ○ Reject        ││
│ │ Consolidated conditions: [EditGrid]                      ││
│ │ Consolidated risks: [EditGrid]                           ││
│ │ Upload ARC Minutes: [Choose file]                        ││
│ │ Additional info needed? ○ Yes ○ No                       ││
│ │                                                          ││
│ │ [Send to Board]  [Request Additional Information]        ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Implementation:** This is achievable in BPA by restructuring the ARC form to use:
- `content` components for the summary table (populated via mustache from bot-consolidated data)
- `panel` components with collapse/expand for detail sections
- Removing the individual read-only field copies in favor of summary rows

---

## 8. What Is Achievable Within BPA vs What Requires Platform Changes

### Fully Achievable in BPA Today

1. **Role deletion/merging** -- Roles can be deleted, renamed, reordered
2. **Form field restructuring** -- Fields can be moved, hidden, shown via determinants
3. **Determinant-based progressive disclosure** -- Show/hide sections based on applicant answers
4. **Bot-driven data consolidation** -- Internal bots already exist; expand their coverage
5. **Guide form activation** -- Already exists as inactive; populate it
6. **EditGrid standardization** -- All units already use the same pattern; formalize it
7. **Tab addition** (Document Checklist) -- BPA supports adding tabs to forms
8. **Content components for summary views** -- Mustache templates can render summary tables
9. **Panel collapse/expand** -- BPA panels support this natively

### Requires BPA Workarounds

1. **Two-stage role (eval then approve)** -- Use determinant-based section visibility + role reassignment. Not elegant but functional.
2. **Per-document status across roles** -- Use an editgrid within each evaluator's section for document flags. Not centralized but captures the data.
3. **Live cross-role references** -- Not possible; use bots to copy data at transition points (existing pattern).

### Requires Platform Enhancement

1. **Centralized document status tracker** -- A dashboard widget showing document approval status across all roles. This is the single most impactful platform feature for the client's vision.
2. **Role-scoped views of shared form** -- Currently, BPA shows/hides fields per role via determinants. A "view mode" that automatically scopes visibility by role without manual determinant configuration would dramatically simplify setup.
3. **Live field references** -- Replace `copyFrom` with live references that always show current data.
4. **Progress indicator widget** -- A visual progress bar for multi-section forms.

---

## 9. Addressing the Client's Core Vision

The client said: *"All information requested from the user should be centralized in a single place and different persons with different roles should be able to see the list and validate if the information is good or if something else is needed."*

### What This Means Architecturally

1. **"Centralized in a single place"** = The Application Dossier model (Section 3.1). All data about an application lives in one form, organized by sections, not scattered across role-specific forms.

   **Status:** Already partially true. BPA uses a flat single-form architecture where all roles share one form. The form fields are namespaced by prefix. What's needed is to **make this visible to users** -- currently, each role sees only "their" fields, giving the illusion of separate forms.

2. **"Different persons with different roles should be able to see the list"** = Role-Based Views (Section 3.2). Every officer, regardless of role, can browse the full dossier with read-only access to sections outside their responsibility.

   **Status:** Requires expanding field visibility. Currently, evaluators cannot see other evaluators' work. Add read-only visibility for cross-sections via determinants.

3. **"Validate if the information is good or if something else is needed"** = The Unified Review Template (Section 5) plus the Complementary Information mechanism.

   **Status:** The CI mechanism already works well (tested, including selective routing). The improvement is to allow ANY reviewer to flag information needs, not just the ARC committee. This means adding "flag for CI" capability to the evaluation roles.

### Minimum Viable Implementation

To deliver the client's vision with minimum disruption:

1. **Expand read-only visibility** across roles (Tier 2, ~1 week)
   - Let evaluators see other evaluators' sections as read-only
   - Let evaluators see the applicant's full submission, not just their domain
   - This requires adding determinant effects to show fields as `readOnly` for additional roles

2. **Add Document Library tab** to the back-office view (Tier 2, ~1 week)
   - A new tab visible to all officer roles showing all 33 documents with upload status
   - Built as a `content` component using mustache templates

3. **Trim the ARC form** to summary + decision (Tier 2, ~1 week)
   - Remove duplicated read-only field copies
   - Replace with summary content components
   - Keep the decision section as-is

These three changes together deliver 80% of the client's vision within 3 weeks, using only BPA-native features.

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Role merging breaks existing workflows | Medium | High | Test each merge on staging before production; keep backups via service copy |
| Expanded visibility creates data privacy issues | Low | Medium | Verify that external agencies should NOT see internal evaluations; maintain [H] for those sections |
| Post-Board consolidation disrupts untested roles | Low | Low | These roles are untested anyway; consolidating before production is safer than after |
| ARC form trimming loses important data | Medium | Medium | Verify with SEZA staff which ARC fields are actually used vs just displayed; archive removed fields |
| Determinant complexity increases with cross-role visibility | Medium | Medium | Document all new determinants thoroughly; use consistent naming convention |

---

## 11. Appendix: Role Consolidation Detail

### Current 49 Human Roles → Proposed ~20 Roles

```
ROLE MAPPING TABLE

KEEP AS-IS (10 roles):
  1. Documents Check (intake -- unique function)
  2. Organize NOC & Inspection (dispatch -- unique function)
  3. ARC - Application Review Committee (committee -- unique function)
  4. Complementary Information (applicant CI loop -- unique function)
  5. Status Letter (unique function)
  6. Signature Status Letter (unique function)
  7. Board Submission (unique function)
  8. CEO Validation (unique function)
  9. Board (unique function)
  10. SEZ Documents (unique function)

MERGE EVAL+APPROVAL (8→4 roles):
  11. Technical Review (was: technicalEvaluation + technicalApproval)
  12. Legal Review (was: legalEvaluation + legalApproval)
  13. Business Review (was: businessEvaluation + businessApproval)
  14. Compliance Review (was: complianceEvaluation + complianceApproval)

DELETE (3 empty DD roles):
  - jcaDueDiligence (empty form)
  - tajDueDiligence (empty form)
  - mofpsDueDiligence (empty form)

RENAME ONLY (3 agency roles):
  15. JCA Decision (was: jcaApproval)
  16. TAJ Decision (was: tajApproval)
  17. MOFPS Decision (was: mofpsApproval)

CONSOLIDATE POST-BOARD (21→8 roles):
  18. Pre-Approval Letter (keep)
  19. Denial Letter (keep)
  20. Prepare Ministerial Order (merge: bundle + MIC + draft)
  21. Ministerial Order Review (merge: legal review + approval)
  22. Prepare Licence Agreement (merge: draft + issue)
  23. Applicant Signs Agreement (merge: apply + review & payment)
  24. Prepare & Approve Invoice (merge: 4 billing roles)
  25. Site Inspection & Certificate (merge: invite + inspect + prepare cert + cert)

DELETE (2 redundant bot roles if reconfigured):
  - Keep as bots but fix mappings

TOTAL: 25 roles (from 49) = 49% reduction
```

---

## 12. Next Steps

1. **Validate with SEZA stakeholders** -- Present this proposal to the SEZA team (Licia, Michelle, technical leads) for feedback on which merges are acceptable
2. **Prioritize Tier 1** -- Execute quick wins immediately (1-2 weeks)
3. **Prototype Tier 2** -- Build the Document Checklist tab and trimmed ARC form on a staging copy of the service
4. **Test Tier 3** -- Create a service copy for role consolidation testing before touching production
5. **Submit Tier 4** -- File platform enhancement requests with the eRegistrations core team

---

*Analysis based on: service deep audit, functional analysis, field analysis, role matrix, E2E test results, and service architecture documents from the OCAgents Jamaica knowledge base.*
