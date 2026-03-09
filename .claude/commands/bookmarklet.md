# /bookmarklet — eR Form Filler Bookmarklet Development

Work on the eRegistrations Form Filler bookmarklet: develop, build, test, debug.

## Usage

```
/bookmarklet                    # show status + interactive menu
/bookmarklet build              # rebuild from source
/bookmarklet test               # run Playwright diagnostic test
/bookmarklet test --headed      # run test with visible browser
/bookmarklet debug [issue]      # investigate a specific issue
/bookmarklet status             # show current state of all files
```

## Architecture

### Source files
| File | Purpose |
|------|---------|
| `bookmarklet/er-filler.js` | **Main source** (~600 lines). Panel UI + Filler + Scanner + Store |
| `bookmarklet/build-bookmarklet.js` | Build script: reads er-presets/, embeds into built.js, generates install.html |
| `er-presets/[serviceId]/[scenario].json` | Preset data files (demo.json, test.json, edge.json) |

### Build outputs (generated, do NOT edit directly)
| File | Purpose |
|------|---------|
| `bookmarklet/er-filler.built.js` | Source + embedded presets |
| `bookmarklet/er-filler.bookmarklet.txt` | URI-encoded inline bookmarklet |
| `bookmarklet/seed-presets.bookmarklet.txt` | Seed-only bookmarklet (just presets to localStorage) |
| `bookmarklet/seed-presets.js` | Standalone preset seeder |
| `bookmarklet/install.html` | Drag-to-install page with both bookmarklets |

### Key internal objects in er-filler.js
- **`Store`** — localStorage CRUD for presets. `seedFromEmbedded()` loads baked-in presets.
- **`Filler`** — Core logic:
  - `fill(patch)` — Sets form data via `form.submission = { data: mergedData }` pattern. Separates flat fields from arrays (EditGrid/DataGrid). Calls `comp.saveRow(i)` for EditGrid rows in 'new'/'editing' state.
  - `fillFiles()` — Creates a mini PDF blob, uploads via `comp.upload([File])` to all file components.
  - `fillDOM(patch)` — Fallback: sets values via DOM selectors + events.
  - `inspect()` — Returns current `wizard._submission.data`.
  - `reset()` — Clears form data.
- **`Scanner`** — Finds field keys from DOM classes/attributes.

### Form.io patterns (critical knowledge)
- **Setting data**: `form.submission = { data: {...} }` triggers Form.io's internal setValue cycle. NEVER use `wiz.redraw()` — it re-renders ALL wizard pages and breaks CSS layout.
- **Finding the form**: `window.Formio.forms[Object.keys(window.Formio.forms)[0]]` — the Form.io instance.
- **EditGrid save**: After setting data, rows appear in `'new'` state. Must call `comp.saveRow(i)` for each row. `comp.editRows[i].state` tracks state.
- **File upload**: `comp.upload([File])` handles HTTP upload to configured storage URL. Creates `new File([blob], name, {type})`.
- **everyComponent()**: Only finds components on the **current rendered page/tab**. Grids on unvisited tabs get their data from `submission.data` when the tab is visited.
- **Input masks** (e.g., TRN `___-___-___`): Setting value via JS bypasses mask keystroke validation. May show "Format not respected" even with correct data. The data IS correct in submission.

### Playwright test
- **Spec**: `countries/jamaica/testing/specs/diag/bookmarklet-test.spec.ts`
- **What it tests**: Load form, inject bookmarklet JS, seed preset, Fill Form, check layout integrity, verify wizard data, EditGrid states, file upload via comp.upload(), navigate tabs.
- **Screenshots saved to**: `countries/jamaica/testing/test-data/bookmarklet-*.png`
- **Run command**: `cd countries/jamaica/testing && npx playwright test specs/diag/bookmarklet-test.spec.ts`

## Instructions for Claude

### On `/bookmarklet` or `/bookmarklet status`
Show current status:
1. Check if `bookmarklet/er-filler.js` exists, show line count
2. List presets in `er-presets/` (services + scenarios)
3. Check if built files are newer than source (needs rebuild?)
4. Show last test results if available in test-data/

### On `/bookmarklet build`
1. Run `cd /path/to/OCAgents && node bookmarklet/build-bookmarklet.js`
2. Report output (preset count, file sizes)

### On `/bookmarklet test` or `/bookmarklet test --headed`
1. Rebuild first (always build before testing)
2. Run: `cd countries/jamaica/testing && npx playwright test specs/diag/bookmarklet-test.spec.ts [--headed]`
3. If test fails, read the error and diagnose
4. Show screenshots from test-data/ if available

### On `/bookmarklet debug [issue]`
1. Read `bookmarklet/er-filler.js` focusing on the relevant section
2. Read the Playwright test spec for test patterns
3. If issue relates to Form.io behavior, check `countries/jamaica/testing/` knowledge files
4. Propose and implement fix in er-filler.js
5. Rebuild and test

### Common issues and solutions
| Issue | Cause | Fix |
|-------|-------|-----|
| Layout breaks after fill | `wiz.redraw()` called | NEVER call redraw. Use `form.submission = {data}` |
| EditGrid rows not saving | Rows in 'new' state | Call `comp.saveRow(i)` after setting data |
| Inputs appear empty | Data set but inputs not updated | Use `form.submission = {data}` not direct assignment |
| Files not uploading | Wrong API | Use `comp.upload([File])` not DOM file input |
| Grids empty on other tabs | everyComponent() is page-scoped | Data is in submission.data; renders when tab visited |
| TRN "Format not respected" | Input mask bypass | Cosmetic only; data is correct in submission |

### Development workflow
1. Edit `bookmarklet/er-filler.js` (the source)
2. Run `node bookmarklet/build-bookmarklet.js` to rebuild
3. Test via Playwright: `npx playwright test specs/diag/bookmarklet-test.spec.ts --headed`
4. Or test manually: open install.html, re-drag bookmarklet to toolbar, use on live form

### Preset generation
Use `/fill-form` command to generate new presets for other services. That command handles MCP schema reading and preset creation. This command handles the bookmarklet code itself.
