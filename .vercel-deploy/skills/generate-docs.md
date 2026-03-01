# Generate Technical Documentation for a Government Service

Extract service structure via MCP and generate documentation for government officials or technical teams.

**Requires**: BPA MCP connection (read-only access is sufficient).

## Input

Provide a service ID and instance name. Specify output type: `user-manual` (HTML) or `technical` (Markdown).

## Process

### 1. Extract fresh data
Use MCP to get the current service structure:
- `service_get(service_id)` — metadata
- `form_get(service_id)` — full component hierarchy
- `determinant_list(service_id)` — business rules
- `bot_list(service_id)` — integrations
- `role_list(service_id)` — workflow pipeline

### 2. For user manuals (HTML)
- Section 1: Service introduction
- Section 2: Prerequisites (accredited company, required documents)
- Section 3: Step-by-step walkthrough
- Section 4: Form fields, validations, conditional sections
- Section 5: Application status (role pipeline)
- Section 6: Certificate/final result
- Section 7: FAQ

### 3. For technical documentation (Markdown)
- Service metadata
- Form structure (component table with keys, types, parents)
- Conditional logic (determinants and effects)
- Integrations (bots, GDB queries, Mule services)
- Workflow (roles and status transitions)

### 4. Cross-reference
Verify data against `SERVICES-MAP.md` for ID consistency.

## Rules
- DO NOT use technical jargon in user manuals (say "form" not "form component")
- DO NOT assume the reader knows BPA — explain from scratch
- Always include the service_id for traceability
- Verify that steps match the current production UI

$ARGUMENTS
