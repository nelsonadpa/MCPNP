# Test Patterns — Rules for Every BPA Service Test

## Every test spec MUST include:
1. Auth setup via storage state (CAS login)
2. Navigation to correct starting point (Bitacora dashboard or service form)
3. Wait for async loads before assertions (companies, EditGrid data, bot responses)
4. Screenshots on failure (automatic via Playwright config)

## Selector rules:
- Prefer `[ref="componentKey"]` over text-based selectors
- Never hardcode Spanish text with accents in selectors — use component keys
- Use `page.waitForSelector()` not `page.waitForTimeout()`
- EditGrids load async — always wait for data before interacting

## Test structure:
- One describe block per user story
- beforeEach: navigate to starting state
- afterEach: cleanup if test modified data
- Use test.describe.serial() for dependent tests

## Naming:
- Spec files: `[service].spec.ts` (lowercase, hyphenated)
- Page Objects: `[Service]Page.ts` (PascalCase)
- Test data: `[service]-data.ts`
