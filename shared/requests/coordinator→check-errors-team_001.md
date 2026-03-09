# Bug Report: Bug Checker False Positive — "MUSTACHE SOURCE FIELD MISSING" for filetitle* fields

**TO**: Check Errors Team (Bug Checker)
**FROM**: Coordinator Agent
**DATE**: 2026-03-07
**PRIORITY**: Medium
**TYPE**: False Positive / Feature Gap

---

## Summary

The Bug Checker reports **"MUSTACHE SOURCE FIELD MISSING"** for all `filetitle*` mustache references used in role form content components. These are **valid runtime fields** auto-generated from document requirements, but the checker only validates against form component keys.

## Affected Service

- **Service**: Establish a new zone - March (`0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`)
- **Instance**: Jamaica (`bpa.jamaica.eregistrations.org`)
- **Role**: Document sreview (`318ad3a0-c09d-4459-9a50-47f1211618c8`)
- **Components flagged**: `documentSreviewContent2` through `documentSreviewContent31` (30 content components)

## Bug Checker Output

```
MUSTACHE SOURCE FIELD MISSING  DOCUMENTSREVIEWCONTENT2
MUSTACHE SOURCE FIELD MISSING  DOCUMENTSREVIEWCONTENT3
...
MUSTACHE SOURCE FIELD MISSING  DOCUMENTSREVIEWCONTENT31
```

(30 warnings total)

## Root Cause

Each content component uses a `{{data.filetitle*}}` mustache template, e.g.:
- `{{data.filetitlebusinessPlan}}`
- `{{data.filetitleinfrastructureLayoutPlan}}`
- `{{data.filetitlecertificateOfIncorporationInJamaica}}`

These `filetitle*` keys are **virtual runtime fields** generated automatically by the eRegistrations platform from **document requirements** (31 document requirements exist for this registration). They are not form components, so they don't appear in the form schema.

## Evidence

- The registration `1b09a267-ccd3-4ec6-9d50-fc0c2ed046fb` has **31 document requirements** (verified via API: `/bparest/bpa/v2016/06/registration/{id}/document_requirement`)
- Each document requirement generates a `filetitle*` field at runtime (e.g., "Business plan" -> `filetitlebusinessPlan`)
- These fields **work correctly** in the rendered form at runtime — the document titles display as expected
- The Bug Checker only validates mustache references against form component keys, missing these virtual/runtime fields

## Expected Behavior

The Bug Checker should:
1. **Not flag `filetitle*` mustache references as missing** when corresponding document requirements exist for the service's registrations
2. OR at minimum, categorize them as **warnings** (not errors) with a note like "field is a virtual runtime field from document requirements"

## Suggested Fix

When validating mustache references in content components:
1. Collect all `filetitle*` references
2. Cross-reference against document requirements for the service's registrations
3. If a matching document requirement exists, suppress the "MUSTACHE SOURCE FIELD MISSING" error

## Workaround

None needed — the mustache templates work correctly at runtime. The warnings are cosmetic only.
