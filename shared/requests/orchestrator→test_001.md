# Request: Setup Cuba PE E2E Testing Infrastructure

**From**: Orchestrator
**To**: Test Agent (Verifier)
**Date**: 2026-02-26
**Mission**: PE E2E (Fase 0)
**Priority**: HIGH

## What I need

### 0.1 — Playwright Config for Cuba
Create `countries/cuba/testing/playwright.config.ts` based on Jamaica's config:
- baseURL: `https://cuba.eregistrations.org`
- Auth: CAS via `eid.cuba.eregistrations.org`
- Storage state: `countries/cuba/testing/auth-state-cuba.json`
- Projects: `auth-setup`, `cuba-frontoffice`
- headless: false, slowMo: 200, viewport: 1440x900

### 0.2 — Auth Setup Spec
Create `countries/cuba/testing/specs/auth-setup.spec.ts`:
- Navigate to cuba.eregistrations.org
- Detect CAS redirect to eid.cuba.eregistrations.org
- Login (env vars: CUBA_USERNAME, CUBA_PASSWORD or manual 3-min wait)
- Save storage state

### 0.3 — Copy Jamaica Helpers
Reuse these proven helpers from Jamaica (p1-submit-complete.spec.ts):
- fillText, fillEmail, typeText, fillNumber
- searchAndSelect (Choices.js pattern — critical)
- clickRadioLabel, checkBox
- uploadFile (filechooser pattern)
- clickSubTab

Create them as a shared helper file: `countries/cuba/testing/helpers/form-helpers.ts`

### 0.4 — Verify Page Objects
Check that these are up to date:
- `countries/cuba/testing/pages/PermisosEventualesPage.ts`
- `countries/cuba/testing/pages/BitacoraPage.ts`

## Reference
- Full PE knowledge: service ID `2c918084887c7a8f01887c99ed2a6fd5`
- PE form structure: 140 components, key fields in `tasks/todo.md`
- Jamaica patterns: `countries/jamaica/testing/specs/p1-submit-complete.spec.ts`

## When done
Respond in `shared/responses/test-orchestrator_001.md` with status of each item.
