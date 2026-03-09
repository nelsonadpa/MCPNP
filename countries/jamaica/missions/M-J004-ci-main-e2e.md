# M-J004: CI Selective Routing — MAIN Service E2E Verification

**Status**: PENDING
**Service**: MAIN — Establish a New Zone (`0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`)
**Reference**: Replicated from PARTB (`28bf8aca`) — same pattern, same 5 determinants, same 12 roles
**Prereq Report**: `shared/responses/test-coordinator_008.md`

---

## Context

PARTB CI Selective Routing is **COMPLETE** (39/39 tasks, file `f16763e1`). The same configuration was replicated to MAIN by the config agent. MCP verification passed (5/5 determinants, 4/4 roles spot-checked, ARC button PASS). What remains is the actual E2E file processing.

## Proven Patterns

All patterns documented in `countries/jamaica/testing/knowledge/partb-e2e-patterns.md`:
- Processing tab click before action buttons
- EditGrid row save/cancel before any action
- FORMDATAVALIDATIONSTATUS set to 'true'
- Applicant roles via `/services/` URL + `saveSENDPAGE`
- ARC radio controls: yes → fileDecline, no → fileValidated
- Formio customEvent emit for transitions

## Steps to Resume

### Step 1: Submit a test file on MAIN (MANUAL — ~2 min)
- Draft file exists: `9b7143dc-4977-4d93-bccb-94c09e216d89`
- URL: `https://jamaica.eregistrations.org/services/0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc?file_id=9b7143dc-4977-4d93-bccb-94c09e216d89`
- Blocker: 33+ document requirements need real uploads, EditGrid `applicantUnit2` needs UI fix
- Alternative: create a brand new file and submit manually

### Step 2: Get FILE_ID and PROCESS_ID
- After submission, get process ID via `/backend/process/{processId}` or from URL
- Update constants in:
  - `countries/jamaica/testing/specs/main-ci-pipeline.spec.ts`
  - `countries/jamaica/testing/specs/main-screenshot-capture.spec.ts`
  - `countries/jamaica/testing/test-data/main-service-ids.json`

### Step 3: Run E2E pipeline
```bash
cd countries/jamaica/testing
npx playwright test specs/main-ci-pipeline.spec.ts --project=jamaica-frontoffice --headed
```
Expected: Same flow as PARTB — DocCheck → 5 evals → 7 approvals → ARC → CI → selective evals → ARC → Board → SEZ Docs

### Step 4: Verify selective routing
- ARC sets radio=yes, selects Legal+Business → fileDecline
- After CI submit: ONLY Legal + Business evals should activate
- Technical, Compliance, NOC, agency approvals should be SKIPPED

### Step 5: Complete to SEZ Documents
- ARC radio=no → Board submission → statusLetter → signature → complementaryInformationSl → board → CEO → board → sezDocuments
- Target: all tasks completed, 0 pending

### Step 6: Capture screenshots + generate report
```bash
npx playwright test specs/main-screenshot-capture.spec.ts --project=jamaica-frontoffice --headed
```
- Populates HTML validation manual at `05-manuals/main-ci-validation-manual.html`
- Write final report to `shared/responses/test-coordinator_009.md`

## Existing Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Pipeline spec | `specs/main-ci-pipeline.spec.ts` | Ready (needs FILE_ID) |
| Screenshot spec | `specs/main-screenshot-capture.spec.ts` | Ready (needs FILE_ID) |
| Service IDs | `test-data/main-service-ids.json` | Ready |
| Verification report | `countries/jamaica/analysis/main-ci-verification-report.md` | Done |
| HTML manual | `05-manuals/main-ci-validation-manual.html` | Done (screenshots pending) |
| PARTB patterns | `knowledge/partb-e2e-patterns.md` | Done |

## Success Criteria

- [ ] Test file submitted on MAIN
- [ ] Pipeline spec runs end-to-end
- [ ] Selective routing verified (only selected units re-evaluate)
- [ ] All tasks completed (0 pending)
- [ ] Screenshots captured
- [ ] Final report written
- [ ] CHANGELOG updated
