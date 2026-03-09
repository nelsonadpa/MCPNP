# Plan: Configurar servicio "Establish a new zone 2026" (Jamaica)

**Service copiado:** `b45bb51e-7ab6-4a1e-84fd-408eff33410b`
**Service original:** `d51d6c78-5ead-c948-0b82-0d9bc71cd712`
**Instance:** BPA-jamaica

---

## Actividad 1: Configurar 8 roles CI

Los roles CI ya existen con: nombre, descripción, roleunits, registration link.
Falta: form components + transiciones workflow.

### 1.1 — Copiar form components (Manual: Nelson en BPA UI)

**Método:** Copy en rol original → Paste (component + value) en rol CI

| # | Copiar desde (servicio original) | Pegar en (servicio copiado) | ID rol CI |
|---|----------------------------------|----------------------------|-----------|
| 1 | Business evaluation | Business evaluation CI | `40c6d1ae-54b1-4f01-8be6-952d9d814fe0` |
| 2 | Legal evaluation | Legal evaluation CI | `a9cf9d0c-a7de-4483-91db-eaa2e75c944b` |
| 3 | Technical evaluation | Technical evaluation CI | `52499828-46e4-416a-8f85-4415d2bcf536` |
| 4 | Compliance evaluation | Compliance evaluation CI | `44e1ffa8-9e37-4739-b470-bfafc7517062` |
| 5 | Business approval | Business approval CI | `2a559ea2-776b-4b2b-9f2d-7f872f7686dd` |
| 6 | Legal approval | Legal approval CI | `fc55bd48-2a11-478a-aa54-61d477b64adf` |
| 7 | Technical approval | Technical approval CI | `39338121-ef47-48da-a8f0-379926c98f43` |
| 8 | Compliance approval | Compliance approval CI | `c9428edc-7742-42a1-beab-f41c9c4c422b` |

- [ ] Business evaluation CI
- [ ] Legal evaluation CI
- [ ] Technical evaluation CI
- [ ] Compliance evaluation CI
- [ ] Business approval CI
- [ ] Legal approval CI
- [ ] Technical approval CI
- [ ] Compliance approval CI

### 1.2 — Configurar transiciones workflow (Manual: Nelson en BPA UI)

**Complementary Info → 4 evals CI:**
- [ ] Complementary Info FILE VALIDATED → Business evaluation CI
- [ ] Complementary Info FILE VALIDATED → Legal evaluation CI
- [ ] Complementary Info FILE VALIDATED → Technical evaluation CI
- [ ] Complementary Info FILE VALIDATED → Compliance evaluation CI

**4 evals CI → 4 approvals CI:**
- [ ] Business eval CI FILE VALIDATED → Business approval CI
- [ ] Legal eval CI FILE VALIDATED → Legal approval CI
- [ ] Technical eval CI FILE VALIDATED → Technical approval CI
- [ ] Compliance eval CI FILE VALIDATED → Compliance approval CI

**4 approvals CI → Status letter:**
- [ ] Business approval CI FILE VALIDATED → Status letter
- [ ] Legal approval CI FILE VALIDATED → Status letter
- [ ] Technical approval CI FILE VALIDATED → Status letter
- [ ] Compliance approval CI FILE VALIDATED → Status letter

**Desconectar ruta anterior:**
- [ ] Remover: Complementary Info → Status letter (ruta directa)

---

## Actividad 2: Reparar 9 roles con formSchema vacío

**Método:** Copy en rol del servicio original → Paste (component + value) en mismo rol del servicio copiado

| # | Rol | Componentes (~) |
|---|-----|----------------|
| 1 | Documents check | ~8 |
| 2 | Status letter | ~7 |
| 3 | Signature status letter | ~6 |
| 4 | Board submission | ~110 |
| 5 | CEO validation | ~7 |
| 6 | Board | ~37 |
| 7 | SEZ Documents | ~6 |
| 8 | Denial letter | ~12 |
| 9 | Pre-approval letter | ~12 |

- [ ] Documents check
- [ ] Status letter
- [ ] Signature status letter
- [ ] Board submission
- [ ] CEO validation
- [ ] Board
- [ ] SEZ Documents
- [ ] Denial letter
- [ ] Pre-approval letter

### 2.2 — Verificar transiciones de estos roles
- [ ] Confirmar que las transiciones copiadas del servicio original siguen intactas

---

## Limitaciones MCP (no se puede automatizar)

1. **Transiciones (destinations):** `rolestatus_update` rechaza system statuses, `rolestatus_create` ignora `destination_role_id`
2. **Role formSchema:** No existe tool MCP para modificar `formSchema` de un rol
3. **Issue reports:** `~/Desktop/bpa-mcp-reports/` (2 archivos)

---

## Estado

- [x] Servicio copiado
- [x] 8 roles CI creados (nombre, descripción, roleunits, registration)
- [x] APPROVED statuses creados en roles CI (sin destino)
- [x] Issue reports documentados
- [ ] **Actividad 1** — Roles CI: forms + transiciones
- [ ] **Actividad 2** — Reparar 9 roles vacíos
