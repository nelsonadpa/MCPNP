# Request: Comprehensive Service Testing — Jamaica

**From:** Coordinator (root)
**To:** Test Agent (Verifier)
**Date:** 2026-02-25
**Country:** Jamaica
**Priority:** High

---

## Mission

Perform a comprehensive manual test of a Jamaica eRegistrations service. You will act as both applicant (front-office) and processing officer (back-office), systematically exploring every element, documenting findings, capturing evidence, producing a user manual, and generating a detailed issue report.

**IMPORTANT:** This is a **Jamaica** service, not Cuba. Different platform instance, different URLs, different auth.

---

## Target Service

- **BPA:** `https://bpa.jamaica.eregistrations.org/services/d51d6c78-5ead-c948-0b82-0d9bc71cd712`
- **Front-office (applicant):** `https://jamaica.eregistrations.org/`
- **Back-office (officer):** Toggle to "Inspector view" at `https://jamaica.eregistrations.org/`

---

## Execution Plan (5 Phases)

### Phase 0 — Reconnaissance & Architecture Mapping

Before touching the live system, build a complete mental model:

1. **Explore the BPA** (use MCP server `BPA-jamaica` or navigate the URL):
   - Service name, description
   - Institutions involved (JAMPRO, SEZA, COJ, etc.)
   - List of procedures/steps (in order)
   - Requirements per step (documents, forms, fees)
   - Roles involved (applicant, officer roles per institution)
   - Expected timelines per step
   - Decision points (approvals, rejections, correction requests)
   - Outputs/deliverables (certificates, licenses, notifications)

2. **Create a Service Architecture Diagram** (Mermaid) showing: application → submission → processing steps → corrections loop → approval → certificate issuance.

3. **Explore Platform Configuration** (if accessible):
   - Form schemas for each step
   - Validation rules and conditional logic
   - Workflow triggers
   - Role-based access control

4. **Document every form field** per step: name, type, required/optional, validation rules, conditional visibility.

5. **Produce a Test Plan** table covering:

| Test ID | Phase | Scenario | Description | Expected Result | Priority |
|---------|-------|----------|-------------|-----------------|----------|
| T-001 | Applicant | Happy path | Complete submission with all valid data | File accepted | Critical |
| T-002 | Applicant | Missing required fields | Submit with empty required fields | Validation errors | Critical |
| T-003 | Applicant | Invalid data formats | Wrong formats for dates, emails, IDs | Field-level errors | High |
| T-004 | Officer | First review - approve | Officer reviews and approves | File moves to next step | Critical |
| T-005 | Officer | Request corrections | Officer sends back for corrections | Applicant notified | Critical |
| T-006 | Applicant | Resubmit after corrections | Fix and resubmit | File returns to officer | Critical |
| T-007 | Officer | Reject application | Officer rejects file | Applicant notified, file closed | High |
| T-008 | E2E | Full happy path | Complete cycle to final certificate | All steps complete | Critical |

Plus edge cases: wrong file types, abandoned mid-process, concurrent officers, special characters, browser back/forward.

---

### Phase 1 — Front-Office Testing (Applicant)

1. **Account & Access:** Create test account, test login/recovery/session. Screenshot dashboard.
2. **Service Discovery:** Find service in catalog. Document presentation. Screenshot landing page.
3. **Happy Path:** Fill every form section with valid test data. For each section:
   - Screenshot blank form
   - Document every field (label, type, required, help text, placeholder)
   - Fill with realistic test data (prefix "TEST-")
   - Screenshot filled form
   - Note conditional fields
   - Document file upload process (formats, size limits)
   - Screenshot confirmation and reference number
4. **Negative Testing** per section:
   - Empty required fields → document error messages
   - Invalid formats (wrong email, future dates, letters in numeric)
   - Boundary values (max length, min, zero)
   - File uploads (wrong format, oversized, empty, special chars in names)
   - Browser back/forward/refresh mid-form
   - Multiple tabs simultaneously
5. **Post-Submission:**
   - Check status in "My Applications"
   - Verify email notifications
   - Test corrections flow (notification, editable fields, resubmission)

---

### Phase 2 — Back-Office Testing (Officer)

1. **Officer Dashboard** per role:
   - Login as each officer role
   - Document dashboard, queue, filters
   - Screenshot with test file visible
2. **File Review** per processing step:
   - Open test file as assigned officer
   - Document what officer sees (data, documents, available actions)
   - Screenshot each view
   - Test: approve → verify moves correctly
   - Test: request corrections → verify returns to applicant with comment
   - Test: reject → verify notification and closure
   - Test: internal notes → visible to officers only
3. **Multi-Step Processing:**
   - Walk file through every step in order
   - Verify correct role access at each step
   - Verify previous step data visible
   - Verify status updates in front/back office
4. **Edge Cases:**
   - Officer processes unassigned file
   - Browser close mid-action
   - Two officers on same file
   - Undo after confirming

---

### Phase 3 — End-to-End Validation

1. **Complete Happy Path:** Applicant → Officer 1 approves → Officer 2 requests corrections → Applicant corrects → Officer 2 approves → Final output. Document elapsed time at each step.
2. **Complete Rejection Path:** Submit → Officer rejects with reason → Applicant sees rejection.
3. **Status Consistency Check:** At every step verify dashboard status, email content, and timeline match actual stage.

---

### Phase 4 — Documentation Outputs

Produce and save to `countries/jamaica/testing/`:

1. **Applicant User Manual** — Step-by-step with annotated screenshots
2. **Officer Manual** — Per role, step-by-step
3. **Service Flowchart** — Mermaid diagram with all steps, roles, decision points
4. **Data Dictionary** — Every field, type, validation, step
5. **Role Matrix** — Who can see/edit/act on what at which step

---

### Phase 5 — Issue Report

For every issue found:

```
### ISSUE-XXX: [Short title]
- **Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- **Phase:** (testing phase)
- **Step:** (form/processing step)
- **Role:** (applicant/officer)
- **Description:** What happened
- **Expected:** What should have happened
- **Actual:** What actually happened
- **Steps to reproduce:** 1. ... 2. ... 3. ...
- **Screenshot/evidence:** [attached]
- **Recommendation:** Suggested fix
```

Severity guide:
| Severity | Definition |
|----------|-----------|
| 🔴 Critical | Blocks service entirely. Data loss. Security issue. |
| 🟠 High | Major functionality broken, workaround exists. |
| 🟡 Medium | Minor functionality/UI/UX issue. |
| 🟢 Low | Cosmetic. Typo. Minor inconsistency. |

Final summary: total issues by severity, top 5 critical, production readiness assessment, next steps.

---

## Output Structure

```
countries/jamaica/testing/
├── 00-test-plan.md
├── 01-reconnaissance/
│   ├── service-architecture.mermaid
│   ├── bpa-analysis.md
│   └── field-inventory.csv
├── 02-front-office-tests/
│   ├── screenshots/
│   └── test-results.md
├── 03-back-office-tests/
│   ├── screenshots/
│   └── test-results.md
├── 04-e2e-tests/
│   ├── screenshots/
│   └── test-results.md
├── 05-manuals/
│   ├── applicant-manual.md
│   ├── officer-manual.md
│   └── assets/
├── 06-issues/
│   ├── issue-report.md
│   └── evidence/
└── 07-summary-report.md
```

---

## Key Notes

- Use **MCP server `BPA-jamaica`** (not `BPA-cuba`) for all MCP operations
- Use realistic but clearly test data (prefix "TEST-")
- Screenshot naming: `P{phase}-S{step}-{description}.png`
- **Do not skip steps. Do not assume anything works — verify everything.**
- Start with Phase 0 — Reconnaissance using MCP to explore the BPA service structure
- If you need Manual Agent to extract data, create a request in `shared/requests/test→manual_NNN.md`

---

## Context

eRegistrations platform (UNCTAD):
- Form.io for form configuration
- n8n for workflow automation
- BPA module maps legal/regulatory requirements to digital procedures
- Jamaica involves JAMPRO, SEZA, COJ, and other agencies
- Service ID: `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
