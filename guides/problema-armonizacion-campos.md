# Armonización de Campos: Análisis Real de Todos los Servicios Destino

## Hallazgo Principal
**Cada servicio existente usa mappings DIFERENTES.** No hay un estándar. El modelo de Permiso Eventual es el MÁS completo (4 campos + 3 extras).

---

## TABLA COMPARATIVA: Mappings reales de todos los bots INTERNO

### Patrón por campo receptor:

| # | Servicio | StatusBitacora | QueQuiereHacer | NIT | NombreEmpresa | Checkbox tipo | Contador | Otros |
|---|---|---|---|---|---|---|---|---|
| 1 | **PE nuevo** (modelo) | ✅ `applicantStatusLlegaDeLaBitacora` | ✅ `applicantQueQuiereHacer` via `applicantRadio` | ✅ `applicantNit3` | ✅ `applicantNombreDeLaEmpresa4` | — | — | — |
| 2 | **PE modificar** (modelo) | ✅ mismo | ✅ mismo via `applicantRadio2` | ✅ mismo | ✅ mismo | ✅ `permisoEventual` | ✅ `applicantContadorEventuales` | solicitud |
| 3 | **ONN nuevo** | ✅ mismo | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `autorizacionTecnicaOnn` | — | tipoPermiso |
| 4 | **Acreditación nueva** | ❌ No tiene | ❌ No mapea | ❌ No mapea | ❌ No mapea | — | — | radio propio |
| 5 | **Lic. CECMED nuevo** | ✅ mismo | ✅ `applicantQueQuiereHacer` via `applicantQueQuiereHacer6` | ❌ No mapea | ❌ No mapea | ✅ `licenciaSanitaria...` | — | — |
| 6 | **Zoosanitario nuevo** | ❌ No tiene | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `permisoZoosanitarios1` | ✅ `applicantContadorEnergia` | — |
| 7 | **Fitosanitario nuevo** | ✅ mismo | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `permisoFitosanitario` | ✅ `applicantcontadorPermisosExistentes` | — |
| 8 | **Homologar equipos** | ❌ No tiene | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `homologacionTecnica2` | — | — |
| 9 | **Cert. sanitario** | ✅ mismo | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `certificadoMinsap` | — | — |
| 10 | **Donaciones** | ✅ mismo | ❌ No mapea | ❌ No mapea | ❌ No mapea | ✅ `autorizacionDeImportacion...` | — | — |
| 11 | **Clientes y Prov.** | ✅ mismo | ⚠️ `applicantQueQuiereHacerYy` via `applicantQueQuiereHacer4` | ✅ `applicantNit3` | ❌ No mapea | ✅ `registrarNuevoCliente...` | — | — |
| 12 | **ONURE** | ✅ mismo | ✅ `applicantQueQuiereHacer` via `applicantQueQuiereHacer5` | ❌ No mapea | ❌ No mapea | ✅ `aceptacionTecnicaOnure` | — | — |

---

## RESUMEN DE PATRONES

### Campo `applicantStatusLlegaDeLaBitacora`:
- **8/12 servicios lo tienen** ✅ (PE, ONN, CECMED, Fito, Cert.San., Donaciones, CyP, ONURE)
- **4/12 NO lo tienen** ❌ (Acreditación, Zoosanitario, Homologar, PE modelo sí)
- **Conclusión**: Es el campo más estandarizado pero no universal

### Campo `applicantQueQuiereHacer` (tipo operación):
- **Solo 4/12 lo mapean**: PE (via applicantRadio/Radio2), CECMED (via QQH6), CyP (via QQH4→**QQHYy**), ONURE (via QQH5)
- **Target key varía**: `applicantQueQuiereHacer` vs `applicantQueQuiereHacerYy`
- **Source key varía**: applicantRadio, applicantRadio2, applicantQueQuiereHacer4, 5, 6

### Campos NIT y Nombre Empresa:
- **Solo PE y CyP mapean NIT** (2/12)
- **Solo PE mapea nombre empresa** (1/12)
- **Conclusión**: La mayoría de servicios NO reciben NIT/empresa de la Bitácora

### Checkbox de tipo de servicio:
- **11/12 lo tienen** - cada uno con nombre diferente
- Es el campo más consistente en concepto (marca qué tipo de servicio es)

---

## CONCLUSIÓN Y RECOMENDACIÓN

### La realidad es: NO hay un estándar uniforme hoy.

El modelo de Permiso Eventual es el **más completo** pero es la excepción, no la regla.
La mayoría de servicios solo reciben:
1. `applicantStatusLlegaDeLaBitacora` (8/12)
2. Un checkbox que identifica el tipo de servicio (11/12)

### Para la guía de replicación, hay 2 niveles:

**Nivel BÁSICO** (mínimo para que funcione):
- `applicantStatusLlegaDeLaBitacora` → radio, valor "true"
- Checkbox identificador del tipo de servicio → constant_true

**Nivel COMPLETO** (modelo Permiso Eventual):
- Todo lo básico +
- `applicantQueQuiereHacer` → radio, "registrarNuevo"/"modificarExistente"
- `applicantNit3` → NIT de empresa
- `applicantNombreDeLaEmpresa4` → nombre empresa
- Contador de registros existentes
- Número de solicitud (para modificar)

### Recomendación PRAGMÁTICA (Opción C confirmada):
Para cada servicio, el proceso debe ser:
1. **Listar los campos del bot INTERNO existente** (si ya existe)
2. **Usar los target fields que ya existen** en el destino
3. **Agregar solo lo que falta** según el nivel deseado
4. **NO renombrar campos existentes** → riesgo de quebrar el servicio
