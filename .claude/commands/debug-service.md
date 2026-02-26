# Debug an eRegistrations Service

Analyze and debug a BPA service using the MCP tools. Run a full diagnostic and report findings.

## Steps

1. **Connect**: Verify MCP connection with `connection_status`
2. **Scan**: Run `debug_scan` on the service to find all issues
3. **Group**: Use `debug_group_issues` to categorize by severity
4. **Investigate**: For each critical/high issue, run `debug_investigate` to understand root cause
5. **Plan**: Use `debug_plan` to generate a fix plan
6. **Report**: Present a summary table:
   - Total issues found (critical / high / medium / low)
   - Root causes identified
   - Recommended fixes (auto-fixable vs manual)
   - Ask before applying any fixes

## Important
- Do NOT auto-fix without confirmation
- If auth expires mid-scan, re-authenticate with `auth_login`
- Service ID is provided as argument

Service to debug: $ARGUMENTS
