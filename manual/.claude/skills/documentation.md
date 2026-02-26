# Skill: Technical Documentation for Government Services

## When to use
When generating technical documentation for government officials or other agents about an eRegistrations service.

## Process

### 1. Extract fresh data
Use MCP to get the current service structure.

### 2. Document structure

For **user manuals** (HTML):
- Section 1: Service introduction
- Section 2: Prerequisites (accredited company, required documents)
- Section 3: Step-by-step walkthrough with screenshots/mockups
- Section 4: Form (fields, validations, conditional sections)
- Section 5: Application status (role pipeline)
- Section 6: Certificate/final result
- Section 7: FAQ

For **technical documentation** (Markdown):
- Service metadata
- Form structure (component table)
- Conditional logic (determinants and effects)
- Integrations (bots, GDB queries)
- Workflow (roles and status transitions)

### 3. Cross-reference
Verify data against the shared `SERVICES-MAP.md` for ID consistency.

## Common mistakes
- DO NOT use technical jargon in user manuals (say "form" not "form component")
- DO NOT assume the reader knows BPA — explain from scratch
- Always include the service_id for traceability
- Verify that steps match the current production UI (production may differ from config)
