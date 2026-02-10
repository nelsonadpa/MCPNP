# MCPNP - MCP & BPA Documentation

Documentation for the **mcp-eregistrations-bpa** MCP Server and VUCE Cuba BPA project.

---

## Bug Reports

| # | Document | Severity | Status | Fixed in |
|---|----------|----------|--------|----------|
| 1 | [Radio Determinant Type + Effect Linking](bugs/MCP-Bug-Radio-Determinant.md) | High | Open | — |

## Guides

| # | Document | Description | Last Updated |
|---|----------|-------------|--------------|
| 1 | [Service Replication Guide](guides/guia-replicacion-servicio.md) | Step-by-step: connect a service to the Bitacora via MCP | 2026-02-09 |
| 2 | [Service-Bitacora Template](guides/TEMPLATE-servicio-bitacora.md) | Template with 5-piece pattern (Panel, Bot Listar, Grid, Bot Nuevo, Bot Modificar) | 2026-02-07 |
| 3 | [Field Harmonization Analysis](guides/problema-armonizacion-campos.md) | Mapping analysis across all 12 destination services | 2026-02-08 |

## Analysis

| # | Document | Service | Last Updated |
|---|----------|---------|--------------|
| 1 | [Bitacora - Complete Analysis](analysis/bitacora-analisis-completo.md) | Bitacora (Hub) | 2026-02-07 |
| 2 | [Bitacora + Permiso Eventual Model](analysis/bitacora-permiso-eventual-analysis.md) | PE (Reference model) | 2026-02-07 |
| 3 | [Fitosanitario + Bitacora Gap Analysis](analysis/analisis-fitosanitario-bitacora.md) | Permiso Fitosanitario | 2026-02-09 |
| 4 | [Bitacora - Permisos Eventuales Bot](analysis/bitacora-permisos-eventuales.md) | PE Bot internals | 2026-02-06 |
| 5 | [Mis Registros Plan](analysis/PLAN-bitacora-mis-registros.md) | Bitacora registros grid | 2026-02-07 |

## Reference

| # | Document | Description | Last Updated |
|---|----------|-------------|--------------|
| 1 | [eR Rosetta Stone](reference/rosetta-stone.md) | Designer <-> AI <-> JSON <-> Java mapping guide | 2025-01-23 |

---

## MCP Server Info

- **Package**: `mcp-eregistrations-bpa`
- **Current version**: v0.15.0
- **Install**: `gh api repos/UNCTAD-eRegistrations/mcp-eregistrations-bpa/contents/scripts/install.sh --jq '.content' | base64 -d | bash`

## Key Service IDs

| Service | ID |
|---|---|
| Bitacora (Hub) | `ffe746aac09241078bad48c9b95cdfe0` |
| Permiso Eventual (PE model) | `2c918084887c7a8f01887c99ed2a6fd5` |
| Permiso Fitosanitario | `2c91808893792e2b019379310a8003a9` |
