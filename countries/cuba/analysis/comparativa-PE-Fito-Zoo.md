# Comparativa: Permiso Eventual vs Fitosanitario vs Zoosanitario
## Estado actual en Bitácora (`ffe746aac09241078bad48c9b95cdfe0`)
**Fecha**: 2026-02-10

---

## 1. COMPONENTES UI EN BLOCK22

| Aspecto | PE (modelo) | Fito | Zoo |
|---|---|---|---|
| **EditGrid key** | `applicantEditGrid` | `applicantEditGridFito` | `applicantEditGridZoo` |
| **Label** | "Permiso eventual" | "Permiso fitosanitario" | "Permiso zoosanitario" |
| **hideLabel** | no (muestra label) | `true` | `true` |
| **fieldsShownInGrid** | ✅ 5 campos | ✅ 5 campos | ✅ 5 campos |
| **disableAdding/Removing/Editing** | ✅ true | ✅ true | ✅ true |
| **virtualScroll** | ✅ true | ✅ true | ✅ true |
| **emptyRowFeedbackMessage** | ✅ configurado | ✅ configurado | ✅ configurado |

### Dropdown (menú ⋮)

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Key** | `applicantdropdown7` | `applicantDropdownFito` | `applicantDropdownZoo` |
| **hideLabel** | ✅ true | ✅ true | ✅ true |
| **leftIcon** | ✅ `fa-solid fa-ellipsis-vertical` | ✅ igual | ✅ igual |
| **direction** | `left` | `left` | `left` |
| **size** | `sm` | `sm` | `sm` |
| **collapsed** | ✅ true | ✅ true | ✅ true |
| **customClasses** | ✅ 3 clases | ✅ 3 clases | ✅ 3 clases |

### Columnas

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Key** | `applicantcolumns6` | `applicantColumnsFito` | `applicantColumnsZoo` |
| **label** | `""` (vacío) | `""` (vacío) | `""` (vacío) ✅ corregido |
| **Column width** | 2 | 2 | 2 ✅ corregido |
| **5ta columna vacía** | ✅ sí | ✅ sí | ✅ sí ✅ corregido |
| **Tipo defaultValue** | "Permiso eventual" | "Permiso fitosanitario" | "Zoosanitario" |

### Badge Expirado

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Key** | `applicantExpirado` | `applicantExpiradoFito` | `applicantExpiradoZoo` |
| **size** | `xs` | `xs` | `xs` ✅ corregido |
| **customClasses base** | ✅ 4 clases badge | ✅ 4 clases badge | ✅ 4 clases badge ✅ corregido |
| **`datagrid-hide-column-label`** | ✅ SÍ | ❌ FALTA | ❌ FALTA |
| **`deactivated`** | ✅ SÍ | ❌ FALTA | ❌ FALTA |
| **behaviourId** | ✅ `448beb4f` | ❌ vacío (MCP bug) | ❌ vacío (MCP bug) |
| **activate** | `false` (oculto por defecto) | `true` (siempre visible) | `true` (siempre visible) |
| **effectsIds** | ✅ `f2271f0a` | ❌ `[]` vacío | ❌ sin campo |

---

## 2. BOTONES EN DROPDOWN "AGREGAR"

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Botón key** | `applicantPermisoEventual` | `applicantEventuales3` | `applicantEquiposUsoDeEnergia2` |
| **Label** | "Permiso eventual" | "Fitosanitarios" | "Zoosanitarios" |
| **componentActionId** | ✅ `b1139de3` | ✅ `02229d1d` | ✅ `d9bb352b` |
| **Bot vinculado** | INTERNO PE nuevo | INTERNO Fito nuevo | INTERNO Zoo nuevo |

---

## 3. BOTS INTERNO (nuevo)

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Bot ID** | `6603eb75` | `d98caa87` | `c28bb4c1` |
| **bot_service_id** | PE service | Fito service | Zoo service |
| **Input mappings** | **4** | **5** | **6** |
| ↳ `constant_true` → StatusBitacora | ✅ | ✅ | ✅ |
| ↳ QueQuiereHacer (nuevo) | ✅ `applicantRadio` → `applicantQueQuiereHacer` | ❌ N/A (Fito no tiene) | ✅ `applicantQueQuiereHacerNuevo4` → `applicantQueQuiereHacerRegistrarNuevo` |
| ↳ NIT | ✅ `applicantNit5` → `applicantNit3` | ✅ `applicantNit5` → `applicantNit` | ✅ `applicantNit5` → `applicantNit` |
| ↳ Empresa | ✅ `applicantCompania7` → `applicantNombreDeLaEmpresa4` | ✅ `applicantCompania7` → `applicantNombreDeLaEmpresa` | ✅ `applicantCompania7` → `applicantNombreDeLaEmpresa` |
| ↳ Checkbox tipo | ❌ no tiene | ✅ `constant_true` → `permisoFitosanitario` | ✅ `constant_true` → `permisoZoosanitarios1` |
| ↳ Contador | ❌ no tiene | ✅ `ContadorFito` → `contadorPermisosExistentes` | ✅ `ContadorZoo` → `ContadorEnergia` |
| **Output mappings** | 0 | 0 | 0 |

---

## 4. BOTS INTERNO (modificar)

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Bot ID** | `c88be29b` | ❌ NO EXISTE (no hay flujo modif) | `f6d16dc7` |
| **Input mappings** | **7** | N/A | **6** |
| ↳ `constant_true` → StatusBitacora | ✅ | — | ✅ |
| ↳ QueQuiereHacer (modif) | ✅ `applicantRadio2` → `applicantQueQuiereHacer` | — | ✅ `applicantQueQuiereHacerModif3` → `applicantQueQuiereHacerModificar` |
| ↳ NIT | ✅ | — | ✅ |
| ↳ Empresa | ✅ | — | ✅ |
| ↳ Solicitud (num permiso) | ✅ `EditGrid_collection_Numero5` → `applicantSolicitud` | — | ❌ FALTA |
| ↳ Checkbox tipo | ✅ `constant_true` → `permisoEventual` | — | ✅ `constant_true` → `permisoZoosanitarios1` |
| ↳ Contador | ✅ | — | ✅ |
| **Botón Modificar key** | `applicantModificar` | `applicantModificarFito` (sin acción) | `applicantModificarZoo` |
| **componentActionId** | ✅ `6230a2b0` | ❌ no tiene (no necesita) | ✅ `ecbd7248` |

---

## 5. BOTS LISTAR (GDB)

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **Bot ID** | `b94c62ab` | `7248ea6d` | `3f66f6b7` |
| **GDB service** | `GDB.GDB-PE(1.5)-list` | `GDB.GDB-FITO2(1.1)-list` | `GDB.GDB-PERMISO ZOO(1.0)-list` |
| **Attached to** | ❓ No en Block22 | ✅ Block22 (sort 1) | ✅ Block22 (sort 2) |
| **Input mappings** | 1 (`applicantNit5` → `query_child_NIT`) | 1 (igual) | 1 (igual) |
| **Output mappings** | **4** | **4** | **4** |
| ↳ count → contador | ✅ | ✅ | ✅ |
| ↳ num permiso → grid | ✅ | ✅ | ✅ |
| ↳ hasta → grid (expiración) | ✅ | ✅ | ✅ |
| ↳ status → StatusFuncionoElBot | ✅ | ✅ | ✅ |

---

## 6. DETERMINANTES Y EFECTOS (en servicio destino)

| Aspecto | PE | Fito | Zoo |
|---|---|---|---|
| **StatusBitacora radio field** | ✅ existe | ✅ existe | ✅ existe (creado por Claude) |
| **Determinant StatusBitacora=TRUE** | ✅ existe (manual) | 🔴 FALTA (MCP bug 1-3) | 🔴 FALTA (MCP bug 1-3) |
| **Effect en bloque** | ✅ existe (manual) | 🔴 FALTA (MCP bug 1-3) | 🔴 FALTA (MCP bug 1-3) |
| **Expirado: grid determinant** | ✅ existe (manual) | 🔴 FALTA (MCP bug 4-5) | 🔴 FALTA (MCP bug 4-5) |
| **Expirado: date row determinant** | ✅ existe (manual) | 🔴 FALTA (MCP bug 4-5) | 🔴 FALTA (MCP bug 4-5) |
| **Expirado: effect on badge** | ✅ existe (manual) | 🔴 FALTA (MCP bug 4-5) | 🔴 FALTA (MCP bug 4-5) |

---

## 7. RESUMEN GAPS PENDIENTES

### Fito - Gaps vs PE:
| # | Gap | Causa | Acción |
|---|---|---|---|
| 1 | Determinant StatusBitacora + Effect en Block12 | MCP bug 1-3 | Manual en BPA UI |
| 2 | Expirado badge: `datagrid-hide-column-label` + `deactivated` classes | No aplicadas | `form_component_update` |
| 3 | Expirado badge: behaviourId + effect (grid determinant) | MCP bug 4-5 | Manual en BPA UI |
| 4 | Botón Modificar sin acción | Fito no tiene flujo modif | ✅ Correcto (no necesita) |

### Zoo - Gaps vs PE:
| # | Gap | Causa | Acción |
|---|---|---|---|
| 1 | Determinant StatusBitacora + Effect en bloque Zoo | MCP bug 1-3 | Manual en BPA UI |
| 2 | Expirado badge: `datagrid-hide-column-label` + `deactivated` classes | No aplicadas | `form_component_update` |
| 3 | Expirado badge: behaviourId + effect (grid determinant) | MCP bug 4-5 | Manual en BPA UI |
| 4 | Bot INTERNO modificar: falta mapping Solicitud (num permiso) | No implementado aún | `bot_input_mapping_create` |

---

## 8. RESUMEN EJECUCIÓN

| Métrica | PE (referencia) | Fito (por Claude) | Zoo (por Claude) |
|---|---|---|---|
| **Pasos automatizados** | — (ya existía) | 5 de 7 (71%) | 6 de 8 (75%) |
| **Pasos bloqueados MCP** | — | 2 (bugs 1-5) | 2 (bugs 1-5) |
| **Bots configurados** | 3 (nuevo, modif, listar) | 2 (nuevo, listar) | 3 (nuevo, modif, listar) |
| **Component Actions** | 3 (PE btn, Modif, panel) | 2 (Fito btn, panel) | 3 (Zoo btn, Modif, panel) |
| **Correcciones visuales** | — | 1 (label Tipo) | 5 (label, width, badge, dropdown, grid) |
| **Flujo modificar** | ✅ SÍ | ❌ NO (siempre nuevo) | ✅ SÍ |

---

*Generado por: Claude (AI assistant)*
*Proyecto: VUCE Cuba BPA - Bitácora hub*
