# Skill: Playwright Workaround for MCP Bugs

## When to use
When MCP has bugs that prevent creating determinants or behaviours correctly. Use Playwright to automate REST API calls to the BPA backend.

## Prerequisites
- Playwright installed in `~/Desktop/OCAgents/playwright-bpa/`
- Auth state saved in `playwright-bpa/auth-state.json`
- If no auth state, run any spec with `--headed` for manual login

## Process

### 1. Get JWT via Playwright
```javascript
// In a spec file:
const storageState = JSON.parse(fs.readFileSync('auth-state.json'));
await page.goto('https://bpa.cuba.eregistrations.org/...');
const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));
```

### 2. Call REST API
```javascript
const response = await page.request.post(
  `https://bpa.cuba.eregistrations.org/bparest/bpa/v2016/06/service/${serviceId}/radiodeterminant`,
  {
    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { /* payload */ }
  }
);
```

### 3. Run
```bash
cd ~/Desktop/OCAgents/playwright-bpa
npx playwright test [script].spec.js --headed --reporter=line
```

## Existing scripts
| Script | Purpose |
|--------|---------|
| `fix-statusbitacora-all.spec.js` | Radio dets + behaviours for 17 services |
| `fix-expirado-all.spec.js` | Grid dets + behaviours for 14 Expirado badges |
| `create-radio-determinant.spec.js` | Template for creating radio determinant |
| `create-behaviour-correct.spec.js` | Template for creating behaviour |

## Post-Playwright
After each successful run:
1. Copy IDs from output (determinant_id, behaviour_id, effect_id)
2. Link via MCP: `form_component_update(component_key, {behaviourId, effectsIds})`
3. Log in CHANGELOG

## Common mistakes
- JWT expires — if you get 401, re-navigate to refresh
- `auth-state.json` expires every ~24h — re-login if needed
- Always run with `--headed` the first time to verify visually
- Screenshots per step go in `playwright-bpa/screenshots/`
