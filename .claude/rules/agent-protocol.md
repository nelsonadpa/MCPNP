# Agent Protocol Rules

## Multi-Country Structure
Country-specific data lives in `countries/<country>/`:
- `knowledge/` — SERVICES-MAP, CHANGELOG, field keys
- `missions/` — Active missions
- `testing/` — PRDs, specs, page objects
- `skills/` — Country-specific skills
- `sitreps/` — Situation reports

Active countries: `cuba`, `jamaica`

Symlinks in `shared/knowledge/` point to the active country for backward compatibility.

## Session Start
At the beginning of each session:
1. Read all profiles in `shared/profiles/`
2. Read the active country's CHANGELOG for recent changes
3. Check `shared/requests/` for pending requests addressed to you
4. Identify which country you're working on from the request context

## Communication
- Requests go in `shared/requests/[from]→[to]_NNN.md`
- Responses go in `shared/responses/[from]-[to]_NNN.md`
- Sequential numbering: _001, _002, _003...
- One request per file
- Always respond within the same session
- Include the country name in request files when relevant

## Config Agent Rules
- ALWAYS log changes to `countries/<country>/knowledge/CHANGELOG.md`
- ALWAYS read current state before modifying
- ALWAYS verify field IDs (not labels) before creating mappings

## Manual Agent Rules
- NEVER use create/update/delete tools — READ-ONLY
- Always extract fresh data from MCP when asked
- Structured output: JSON or markdown tables
- Use the correct MCP server per country (BPA-cuba, BPA-jamaica, etc.)

## Test Agent Rules
- ALWAYS read profiles and CHANGELOG before generating tests
- NEVER assume UI structure — verify via MCP or Manual Agent first
- Country test artifacts go in `countries/<country>/testing/`
  - PRDs in `testing/prds/`, specs in `testing/specs/`, pages in `testing/pages/`
