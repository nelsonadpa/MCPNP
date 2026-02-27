# PE Nuevo — Bot Trace Report #001

**Date**: 2026-02-26
**Period**: 24h (15:00-16:00 UTC focus) + 7d for MINCEX XLS
**Service**: Permiso Eventual (`2c918084887c7a8f01887c99ed2a6fd5`)
**Trigger**: E2E test runs (`pe-e2e-nuevo.spec.ts`)

## Summary

| Bot | Logs (24h) | Status | Verdict |
|-----|-----------|--------|---------|
| UNIDAD DE MEDIDA Leer | 134 | `status: true` | HEALTHY |
| PERMISO EVENTUAL Listar productos | 157 | `status: false` | EXPECTED (bypass) |
| MINCEX XLS nuevos | 83 (7d) | Mixed | KNOWN ISSUE (activation race) |
| INTERNO PE Nuevo | 0 | N/A | NOT TRIGGERED (lives in Bitacora) |

## Bot Analysis

### 1. UNIDAD DE MEDIDA Leer

**Purpose**: Look up unit of measure by tariff code in NOMENCLATURA FLAT7.

**Flow**:
```
Input:  applicantSubpartida = "01023100"
Mapped: query.content.Código = "01023100"
GDB:    NOMENCLATURA FLAT7 → Unidad = "U", Descripción = "--Reproductores de raza pura"
Output: applicantUm = "U", status = true
```

**Verdict**: Working correctly. Fires every time a product is selected in the DataGrid. Returns `status: true` consistently.

**Note**: "Payload is null, can't create json!" appears at action start — this is a harmless initial state message, not an error.

### 2. PERMISO EVENTUAL Listar productos

**Purpose**: List existing products for a permit (used in modification flow).

**Why it fails**: This bot fires automatically when the PE form opens. It expects the company NIT to be passed via Bitacora input mappings. Our E2E test navigates directly to `/services/{PE_ID}`, bypassing Bitacora, so the NIT is never set.

**Error pattern**:
```
Input payload is empty in bot permisoEventualListarProductos
→ applicantDataGridNuevonuevo3: [], status: false
```

**Verdict**: Expected failure. This bot is only needed for the "modificar" flow, not "nuevo". Does not block submission.

### 3. MINCEX XLS nuevos

**Purpose**: Generate XLS document for MINCEX review (back-office bot, fires on revision).

**Observed behavior** (claudia, ER4044, 2026-02-25 21:21 UTC):
1. First flow: `productos: []` → "Input payload is empty" → `status: false`
2. Second flow: Full data with 1 product (02032200, Carne porcina, KG) → generates `PE_INSTITUTOFINLAYDEVACUNAS.xls` → `status: true`

**Root cause**: ActionId `adsAction2c918084887c7a8f01887c9a916a7352` is "probably just in activation" — Mule activation race condition. The action gets called before it's fully initialized, fails, then succeeds on retry.

**Verdict**: Known issue. Does not block the workflow — the retry always succeeds. Documented as plan item 2.4 for future investigation.

### 4. INTERNO PE Nuevo

**Purpose**: Internal bot that creates the PE dossier from Bitacora.

**Why 0 logs**: This bot lives in the Bitacora service (`ffe746aac09241078bad48c9b95cdfe0`), not in the PE service. Our E2E test navigates directly to the PE form, so the INTERNO bot is never triggered.

**Implication**: In production, the INTERNO bot transfers hidden fields (NIT, company name, QueQuiereHacer, etc.) from Bitacora to PE. Our test sets these manually via Form.io API, which is functionally equivalent.

## Dossier Timeline

| Time (UTC) | Dossier | User | Bot |
|------------|---------|------|-----|
| 15:43:54 | ER4205 | nelson | Listar productos + UNIDAD DE MEDIDA Leer |
| 15:50:11 | ER4206 | alina | Listar productos (real production user!) |
| 15:50:50 | ER4211 | nelson | Listar productos + UNIDAD DE MEDIDA Leer |
| 15:50:58 | ER4212 | nelson | UNIDAD DE MEDIDA Leer |
| 15:51:56 | ER4213 | nelson | Listar productos |
| 15:58:10 | ER4215 | nelson | Listar productos |
| 15:59:17 | ER4216 | nelson | Listar productos |
| 16:00:21 | ER4217 | nelson | Listar productos + UNIDAD DE MEDIDA Leer |

## Key Observations

1. **`is_submit_allowed: false`** in all payloads — submissions succeed because `sysadmin` role bypasses this check. Production users (citizens) may face different validation.
2. **`Form is valid: false`** — same bypass. A non-sysadmin user with incomplete form would be blocked.
3. **Real production activity**: User `alina` (ER4206) submitted a PE on the same day as our tests.
4. **No LISTAR (GDB) logs**: The GDB.GDB-PE(1.5)-list bot from Bitacora Block22 was not triggered because we never opened Block22.

## Recommendations

1. **Test with non-sysadmin user**: Create a `testcitizen` account to verify real-user validation behavior.
2. **Investigate MINCEX XLS activation race**: The double-fire pattern wastes resources and could fail if the retry doesn't work.
3. **Consider adding Bitacora step to E2E**: To trigger INTERNO bot and get realistic `is_submit_allowed` behavior.

## Queries Used

```
# All PE logs (excluding Listar productos noise)
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND NOT actionName:"PERMISO EVENTUAL Listar productos"

# Failures
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND (message:"status\":false" OR message:"Input payload is empty")

# MINCEX XLS
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX XLS nuevos"

# Dossier creation
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"dossierNumber"
```
