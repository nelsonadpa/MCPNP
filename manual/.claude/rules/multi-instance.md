# Multi-Instance MCP Rule

## Available instances
- `BPA-cuba` — Primary production instance
- `BPA-colombia-test` — Colombia test instance
- `BPA-jamaica` — Jamaica instance
- `BPA-lesotho2` — Lesotho instance

## Rules
1. Always specify which MCP server to use for each operation
2. Default to `BPA-cuba` unless a different instance is requested
3. Service IDs are DIFFERENT between instances — never cross-reference IDs
4. When comparing across instances, match by service NAME not ID
5. Always include the instance name in extraction output filenames
