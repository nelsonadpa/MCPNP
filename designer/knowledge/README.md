# Designer Knowledge Base — Pattern Index

This directory contains documented service design patterns for eRegistrations.

## How to use
1. Check this index before answering design questions
2. Each file documents one pattern or pattern family
3. Update this index when adding new pattern files

## Patterns

| # | File | Category | Description | Country |
|---|------|----------|-------------|---------|
| 1 | `ci-selective-routing.md` | workflow | OR determinants for selective unit routing in CI loops — Confirmed, 2 implementations | Jamaica |
| 2 | `bitacora-connection-model.md` | cross-service | 6 connection primitives, patterns, harmonization analysis | Cuba |
| 3 | `bitacora-functional-analysis.md` | cross-service | Bitacora user flow, 3 architectural patterns, bot inventory | Cuba |
| 4 | `rosetta-stone.md` | reference | Designer ↔ BPA UI ↔ JSON ↔ Java terminology mapping | Generic |
| 5 | `partb-workflow-architecture.md` | workflow | 2-track workflow (main + CI loop), 25 roles, multi-unit review | Jamaica |
| 6 | `expirado-badge-pattern.md` | determinant | 3-object chain for per-row expiration visual indicators | Cuba |
| 7 | `service-replication-methodology.md` | workflow | Methodology for replicating configurations between services (MCP + manual) | Jamaica |

## Categories
- **workflow** — Role chains, status transitions, conditional routing
- **cross-service** — Inter-service connections, hub patterns, transfer fields
- **determinant** — Business rules, visibility logic, conditional chains
- **form** — Form architecture, component patterns (planned)
- **bot** — Bot orchestration, mapping strategies (planned)
- **reference** — Terminology, translation guides
- **anti-pattern** — Common mistakes and how to avoid them (planned)

## Boundary: Designer vs Config

| Designer (here) | Config Agent |
|-----------------|-------------|
| **Why** does this pattern exist? | **How** to execute it step-by-step |
| Architecture and functional analysis | MCP commands and procedures |
| Pattern with variants across services | Specific IDs and field keys per service |
| Design decisions and trade-offs | Checklists and verification steps |
| Anti-patterns to avoid | Bug workarounds and REST API calls |
