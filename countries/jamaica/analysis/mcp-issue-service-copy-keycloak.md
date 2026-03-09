# MCP Issue Report: service_copy fails with Keycloak error

**Date**: 2026-03-04
**Instance**: Jamaica (`bpa.jamaica.eregistrations.org`)
**Tool**: `service_copy`
**Severity**: Blocking

---

## What happened

Calling `service_copy` on "Establish a new zone" (`d51d6c78-5ead-c948-0b82-0d9bc71cd712`) consistently fails with:

```
BPA server error (500): Keycloak connection problem: {"errorMessage":"Group name is missing"}
```

## Root cause

Roles with **empty/null `unit_id`** in their unit assignments. When BPA's copy endpoint tries to recreate these roles in the new service, it passes the empty unit to Keycloak for security group creation. Keycloak requires a group name and rejects the request.

**Affected roles found**:
| Role | Name |
|------|------|
| `efa02beb-3158-48dd-aef3-6972fbafbe77` | Business evaluation CI |
| `5bc50bc7-cbe5-49d3-b83a-b445d9c8ca29` | ARC - App Rev Committee CI |
| `b86c1327-9e7c-4401-bc8f-8290f8079bd1` | Business approval CI (fixed by user) |

All three had institution assigned (JSEZA) but **"Unit in charge" was empty** (`-` displayed in UI).

## Expected behavior

`service_copy` should either:
1. **Validate** unit assignments before copy and warn about empty units
2. **Skip** empty unit assignments instead of passing them to Keycloak
3. **Fail gracefully** with a clear error message indicating which role has the bad unit

## Workaround

Manually delete or fix the empty unit assignments on the source service roles before running `service_copy`.

## Recommendation for MCP tool

The `service_copy` tool should add a pre-flight validation step:
```
1. Export source service
2. Scan all roles for empty unit_id values  <-- NEW
3. Warn user or auto-skip empty units       <-- NEW
4. Proceed with import
```

Also applies to: `role_create`, `roleunit_create` — these should never create a unit assignment with null/empty unit_id.

## Lesson learned

**NEVER create roles with empty "Unit in charge"**. Always assign a valid unit when setting institution on a role. The BPA UI allows saving an empty unit but it breaks Keycloak integration downstream.
