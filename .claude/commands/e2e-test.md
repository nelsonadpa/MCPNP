# Generate & Run E2E Test for a BPA Service

Complete Playwright E2E test generation for any eRegistrations service — from structure extraction to passing tests.

**Requires**: BPA MCP (read-only), Playwright installed in the testing directory.

## Input

Provide a service ID, instance name, and country. Optionally specify which test type: `nuevo` (new application), `modificar` (modify existing), or `both`.

## Process

### 1. Extract service structure
Via MCP:
```
service_get(service_id, instance=INSTANCE)
form_get(service_id, instance=INSTANCE)
determinant_list(service_id, instance=INSTANCE)
bot_list(service_id, instance=INSTANCE)
```

### 2. Generate PRD
Create `countries/<country>/testing/prds/<service>-PRD.md` with:
- User stories (5-8 per service)
- Acceptance criteria per story
- Test cases (3-6 per story)
- Expected selectors (based on component keys)

### 3. Create Page Object
`countries/<country>/testing/pages/<Service>Page.ts`

### 4. Write Spec
`countries/<country>/testing/specs/<service>.spec.ts`

### 5. Run and iterate
```bash
cd ~/Desktop/OCAgents/countries/<country>/testing
npx playwright test specs/<service>.spec.ts --headed --reporter=line
```
Iterate until 100% pass rate.

## eRegistrations Platform Patterns

| Pattern | Solution |
|---------|----------|
| Choices.js dropdowns | Search-based: click → type → wait 2s for API → select first match |
| File uploads | `a.browse` + `waitForEvent('filechooser')` |
| Hidden required fields | Form.io JS API: `form.submission = { data: { ...form.submission.data, key: value } }` |
| Hidden tab-pane sections | CSS unhiding: walk ancestors, set `display:block`, add `active`/`show` classes |
| Masked inputs (TRN) | `.type(value, { delay: 80 })` not `.fill()` |

## Selector Rules

| Element | Pattern |
|---------|---------|
| Form field | `[ref="componentKey"] input` |
| Panel/Block | `[ref="componentKey"]` |
| Sidebar tab | `a:not(.dropdown-item):has-text("TabName")` |
| EditGrid row | `[ref="editGridKey"] .formio-component-editgrid tbody tr` |
| Submit button | `button:has-text("Enviar")` or `button:has-text("Submit application")` |

## Common Mistakes
- DO NOT assume CSS selectors — verify with MCP first
- CAS login uses `eid.cuba.eregistrations.org`, not the main domain
- Some fields have duplicate labels — use component key, not label text
- Each "new service" click creates a NEW application — navigate by `file_id` to reuse drafts
- Set test timeout to 20min+ for forms with 30+ file uploads

$ARGUMENTS
