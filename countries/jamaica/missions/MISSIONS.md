# Jamaica — Active Missions

## M-J001: Service Discovery
**Status**: PENDING
**Objective**: Extract all Jamaica services, IDs, field keys, and form structure via Manual Agent.

## M-J002: Service Configuration
**Status**: PENDING
**Objective**: Configure Jamaica services as needed.

## M-J004: CI Selective Routing — MAIN Service E2E
**Status**: PENDING
**Objective**: Run the proven CI Selective Routing E2E test on the MAIN service (`0d8ca0c6`), verifying selective routing works identically to PARTB.
**Plan**: `M-J004-ci-main-e2e.md`
**Blocker**: Need a submitted test file (manual submission ~2 min, 33+ doc requirements)
**Specs ready**: `main-ci-pipeline.spec.ts`, `main-screenshot-capture.spec.ts`

## M-J003: Comprehensive Service Testing
**Status**: IN PROGRESS — Cycle 1 complete, Cycle 2 planned
**Objective**: Full manual + automated testing of Jamaica service `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Plan**: `M-J003-plan.md` (detailed plan with gap analysis, improvements, execution order)
**Cycle 1 (2026-02-26)**: Happy path E2E complete (Phase 1.3 + Phase 2 approve + Phase 3.1)
**Cycle 2 (pending)**: Reconnaissance via MCP, helpers, manuals, corrections/rejection flows, negative testing, formal reports
**URLs**:
- BPA: `https://bpa.jamaica.eregistrations.org/services/d51d6c78-5ead-c948-0b82-0d9bc71cd712`
- Front-office: `https://jamaica.eregistrations.org/`
- Back-office: Inspector view at same URL
