# TEMPLATE: Agregar un tipo de permiso/registro a la Bitacora

**Servicio Bitacora:** `ffe746aac09241078bad48c9b95cdfe0`
**Basado en:** Patrón de Permisos Eventuales (referencia funcional)
**Fecha:** 2026-02-07

---

## QUE HACE ESTE TEMPLATE

Este template describe cómo agregar un nuevo tipo de permiso o registro a la Bitacora de la VUCE Cuba. El resultado final es que el usuario podrá:

1. **Ver** sus permisos/registros existentes de ese tipo en un grid (cargados desde GDB)
2. **Solicitar uno nuevo** desde un botón "Agregar"
3. **Modificar** uno existente desde un botón en cada fila del grid
4. Ver si un permiso está **expirado** con un badge visual

---

## REFERENCIA: ASI FUNCIONA PERMISOS EVENTUALES

### Estructura visual (lo que ve el usuario):

```
┌──────────────────────────────────────────────────────────┐
│  Permisos eventuales                            [⋮ Agregar]│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Tipo              │ Número    │ Vigente hasta │ ⋮  │  │
│  ├───────────────────┼───────────┼───────────────┼─────┤  │
│  │ Permiso eventual  │ PE-00123  │ 15-03-2026    │ ⋮  │  │
│  │ Permiso eventual  │ PE-00456  │ 01-01-2025    │ 🔴 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Al hacer clic en ⋮ de una fila:                         │
│    → Modificar                                            │
│    → Cancelar (pendiente)                                 │
└──────────────────────────────────────────────────────────┘
```

### Anatomía técnica (5 piezas):

```
PIEZA 1: PANEL CONTENEDOR con Component Action (carga datos)
  → applicantBlock (panel "Permisos eventuales", colapsado, tab 2)
  → Component Action: ejecuta bot "PERMISOS EVENTUALES listar"
  → Cuando el panel se renderiza, automáticamente consulta GDB y llena el grid

PIEZA 2: BLOQUE VISUAL con título + dropdown "Agregar"
  → applicantBlock4 (panel en tab "Servicios")
  → Contiene título HTML "Permisos y Registros"
  → Contiene dropdown "Agregar" con botón "Permiso eventual"

PIEZA 3: EDITGRID (tabla de datos, read-only)
  → applicantEditGrid (editgrid, sin poder agregar/editar/eliminar filas)
  → Columnas: Tipo | Número | Vigente hasta | Expirado (badge) | ⋮ (dropdown acciones)
  → Los datos los llena el bot data (Pieza 1)

PIEZA 4: BOTÓN "Nuevo" (solicitar permiso nuevo)
  → applicantPermisoEventual (botón dentro del dropdown "Agregar")
  → Component Action → Bot interno "nuevo"
  → Abre el servicio destino con datos pre-llenados

PIEZA 5: BOTÓN "Modificar" (modificar permiso existente)
  → applicantModificar (botón dentro del dropdown ⋮ de cada fila)
  → Component Action → Bot interno "modificar"
  → Abre el servicio destino con el número del permiso seleccionado
```

---

## DETALLE DE CADA PIEZA

### PIEZA 1: Bot Data "Listar" (carga los datos desde GDB)

**Qué hace:** Cuando el panel se carga, consulta la base de datos GDB filtrando por el NIT de la empresa seleccionada, y llena el editgrid con los resultados.

**Bot:** `PERMISOS EVENTUALES listar`
- Tipo: `data`
- Servicio GDB: `GDB.GDB-PE(1.5)-list`
- Se dispara desde: Component Action en panel `applicantBlock`

**Mappings del bot:**

| Dirección | Campo en Bitacora | Campo en GDB | Qué hace |
|-----------|-------------------|--------------|----------|
| **INPUT** | `applicantNit5` (NIT de la empresa) | `query_child_NIT` | Filtra los permisos por NIT |
| **OUTPUT** | `applicantEditGrid` > `applicantNumero5` | `results_collection_content_child_Permiso eventual_child_num aprobación` | Llena la columna "Número" |
| **OUTPUT** | `applicantEditGrid` > `applicantExpiracion` | `results_collection_content_child_Permiso eventual_child_hasta` | Llena la columna "Vigente hasta" |
| **OUTPUT** | `applicantContadorPermiso` | `count` | Guarda cuántos permisos tiene (para el bot de modificar) |

**Assertions:**
- ✅ El bot debe tener exactamente 1 mapping INPUT con el NIT
- ✅ Los mappings OUTPUT deben apuntar a campos DENTRO del editgrid (usando `_collection_` en la ruta)
- ✅ El mapping de `count` va a un campo `number` fuera del grid (se usa después para el bot modificar)
- ✅ El campo de NIT (`applicantNit5`) se llena previamente cuando el usuario selecciona la empresa

---

### PIEZA 2: Campo "Tipo" (identifica qué tipo de permiso es)

**Qué hace:** Muestra el nombre del tipo de permiso en cada fila. Es un textfield con valor fijo.

**Componente:** `applicantTipo5`
- Tipo: `textfield`
- Label: "Tipo"
- **defaultValue: "Permiso eventual"** ← Este es el valor hardcodeado
- **disabled: true** ← El usuario no puede editarlo

**Assertions:**
- ✅ El defaultValue DEBE coincidir con el nombre del tipo de permiso
- ✅ Debe estar disabled para que el usuario no lo modifique
- ✅ NO necesita mapping del bot data — se llena solo con el defaultValue
- ✅ Cada tipo de servicio tendrá su propio valor (ej: "Permiso fitosanitario", "Licencia CECMED", etc.)

---

### PIEZA 3: Badge "Expirado"

**Qué hace:** Muestra un badge rojo "Expirado" cuando la fecha de vigencia ya pasó.

**Componente:** `applicantExpirado`
- Tipo: `button`
- Label: "Expirado"
- Classes: `btn-red`, `hover-feedback-off`, `button-status`, `datagrid-hide-column-label`
- Es visual, no interactivo

**Assertions:**
- ✅ Debe tener las clases CSS correctas para verse como badge
- ✅ Necesita un behaviour/determinant que lo muestre solo cuando la fecha de vigencia < hoy
- ⚠️ En el patrón actual no se encontró un behaviour explícito — posiblemente se controla por lógica en el frontend o por el bot data

---

### PIEZA 4: Bot Interno "Nuevo" (solicitar permiso nuevo)

**Qué hace:** Cuando el usuario hace clic en "Permiso eventual" dentro del dropdown "Agregar", abre el servicio de Permisos Eventuales con datos pre-llenados para iniciar una nueva solicitud.

**Bot:** `INTERNO permisos eventuales - nuevo`
- Tipo: `internal`
- Servicio destino: `2c918084887c7a8f01887c99ed2a6fd5` (Permisos eventuales)
- Se dispara desde: Component Action en botón `applicantPermisoEventual`

**Mappings del bot (4 mappings, todos INPUT):**

| # | Campo origen (Bitacora) | Campo destino (Serv. Eventuales) | Qué hace |
|---|------------------------|----------------------------------|----------|
| 1 | `applicantRadio` (radio, default="registrarNuevo") | `applicantQueQuiereHacer` | Le dice al servicio destino que el usuario quiere "Registrar nuevo" |
| 2 | `constant_true` | `applicantStatusLlegaDeLaBitacora` | Flag que indica que la solicitud viene desde la Bitacora (no directa) |
| 3 | `applicantNit5` | `applicantNit3` | Pasa el NIT de la empresa seleccionada |
| 4 | `applicantCompania7` | `applicantNombreDeLaEmpresa4` | Pasa el nombre de la empresa seleccionada |

**El radio `applicantRadio`** tiene estas opciones:
- `registrarNuevo` — Registrar nuevo
- `modificarExistente` — Modificar
- `renovarExistente` — Renovar
- `consultar` — Consultar
- `cancelar` — Cancelar

Su defaultValue es `registrarNuevo`, así que al bot "nuevo" le pasa automáticamente la intención de registrar.

**Assertions:**
- ✅ El bot DEBE enviar `constant_true` a `applicantStatusLlegaDeLaBitacora` (para que el servicio destino sepa que viene de la Bitacora)
- ✅ El bot DEBE enviar el NIT y el nombre de empresa
- ✅ El campo radio DEBE tener defaultValue correcto según la acción (nuevo = "registrarNuevo")
- ✅ Los nombres de campos destino (`applicantNit3`, `applicantQueQuiereHacer`, etc.) son ESPECÍFICOS de cada servicio destino — hay que verificarlos en el servicio que se quiere vincular

---

### PIEZA 5: Bot Interno "Modificar" (modificar permiso existente)

**Qué hace:** Cuando el usuario hace clic en "Modificar" en el dropdown ⋮ de una fila del editgrid, abre el servicio de Permisos Eventuales con datos pre-llenados para modificar el permiso seleccionado.

**Bot:** `INTERNO permisos eventuales - modificar`
- Tipo: `internal`
- Servicio destino: `2c918084887c7a8f01887c99ed2a6fd5` (Permisos eventuales)
- Se dispara desde: Component Action en botón `applicantModificar` (dentro del editgrid)

**Mappings del bot (5 mappings, todos INPUT):**

| # | Campo origen (Bitacora) | Campo destino (Serv. Eventuales) | Qué hace |
|---|------------------------|----------------------------------|----------|
| 1 | `constant_true` | `applicantStatusLlegaDeLaBitacora` | Flag "viene de Bitacora" |
| 2 | `constant_true` | `permisoEventual` | Flag que identifica el tipo de permiso (checkbox en destino) |
| 3 | `applicantContadorPermiso` | `applicantContadorEventuales` | Pasa cuántos permisos tiene la empresa |
| 4 | `applicantRadio2` (radio, default="modificarExistente") | `applicantQueQuiereHacer` | Le dice al servicio destino que quiere "Modificar" |
| 5 | `applicantEditGrid` > `applicantNumero5` | `applicantSolicitud` | Pasa el NÚMERO del permiso que se quiere modificar |

**Assertions:**
- ✅ El mapping #5 es CRÍTICO: debe tomar el número de la FILA SELECCIONADA del editgrid (no un campo global)
- ✅ La ruta del mapping es `applicantEditGrid_collection_applicantNumero5` → esto significa "el valor de applicantNumero5 dentro de la fila actual del editgrid"
- ✅ El `applicantRadio2` tiene defaultValue `modificarExistente` (diferente al radio del bot "nuevo")
- ✅ El bot de "modificar" envía un mapping adicional que el de "nuevo" no tiene: el número del permiso (`applicantSolicitud`)
- ✅ Cada servicio tendrá su propio campo de "solicitud/número" donde recibe el identificador

---

## CAMPOS AUXILIARES (compartidos entre todos los servicios)

Estos campos ya existen en la Bitacora y se reusan para TODOS los tipos de permisos:

| Campo | Tipo | Label | Valor | Propósito |
|-------|------|-------|-------|-----------|
| `applicantNit5` | textfield | NIT | (se llena al seleccionar empresa) | NIT de la empresa, se envía como INPUT a todos los bots |
| `applicantCompania7` | textfield | Compañia | (se llena al seleccionar empresa) | Nombre de la empresa |
| `applicantRadio` | radio | "¿Qué quiere hacer?" | default: `registrarNuevo` | Se envía al servicio destino para operaciones "nuevo" |
| `applicantRadio2` | radio | "¿Qué quiere hacer?" | default: `modificarExistente` | Se envía al servicio destino para operaciones "modificar" |

---

## PARA REPLICAR A UN NUEVO SERVICIO

### Lo que el analista debe proveer:

```yaml
nombre_tipo: "Permiso fitosanitario"      # Nombre que verá el usuario
servicio_destino_id: "2c91808893792e2b019379310a8003a9"  # ID del servicio BPA destino

# Base de datos GDB
gdb_vista: "GDB.GDB-FITO2(1.1)-list"     # Vista GDB para listar
gdb_campo_nit: "query_child_NIT"           # Campo NIT en la query GDB (casi siempre igual)

# Campos GDB para el OUTPUT del bot listar
gdb_campo_numero: "results_collection_content_child_Permiso_child_num permiso"
gdb_campo_vigente_hasta: "results_collection_content_child_Permiso_child_hasta"
# gdb_campo_desde: (opcional, si aplica)

# Campos del servicio destino para el bot "nuevo"
destino_campo_nit: "applicantNit3"                  # Donde recibe el NIT
destino_campo_empresa: "applicantNombreDeLaEmpresa4" # Donde recibe nombre empresa
destino_campo_que_quiere_hacer: "applicantQueQuiereHacer"  # Radio de intención
destino_campo_llega_bitacora: "applicantStatusLlegaDeLaBitacora"  # Flag bitacora

# Campos del servicio destino para el bot "modificar"
destino_campo_solicitud: "applicantSolicitud"       # Donde recibe el número a modificar
destino_campo_tipo_permiso: "permisoEventual"       # Checkbox que identifica el tipo
destino_campo_contador: "applicantContadorEventuales" # Donde recibe el contador
```

### Pasos de ejecución:

**Paso 1: Crear el panel contenedor con component action**
- Crear un panel (colapsado) dentro de la estructura de tabs de la Bitacora
- Configurar component action que ejecute el bot data "listar"
- Assertion: ✅ Al renderizar el panel, debe ejecutarse el bot automáticamente

**Paso 2: Crear el bot data "listar"**
- Tipo: `data`
- GDB source: la vista proporcionada por el analista
- INPUT: NIT desde `applicantNit5`
- OUTPUT: mapear campos GDB a columnas del editgrid
- OUTPUT: mapear `count` a un campo `number` (contador)
- Assertion: ✅ Con un NIT válido debe retornar registros en el grid

**Paso 3: Crear el editgrid (tabla read-only)**
- Tipo: `editgrid`
- Propiedades: `disableAddingRows: true`, `disableRemovingRows: true`, `disableEditingRows: true`
- Columnas:
  - Tipo (textfield, disabled, defaultValue: nombre_tipo) ← valor fijo
  - Número (textfield, disabled) ← llenado por bot data
  - Vigente hasta (datetime, disabled, format: dd-MM-yyyy) ← llenado por bot data
  - Expirado (button badge, clases: btn-red hover-feedback-off button-status)
  - Dropdown ⋮ con botones de acción (Modificar, Cancelar pendiente)
- Assertion: ✅ El grid NO debe permitir que el usuario agregue o edite filas
- Assertion: ✅ El campo Tipo debe mostrar siempre el mismo valor fijo

**Paso 4: Crear el bot interno "nuevo"**
- Tipo: `internal`
- Servicio destino: el ID proporcionado por el analista
- Mappings INPUT:
  1. `applicantRadio` → campo "qué quiere hacer" en destino (valor: registrarNuevo)
  2. `constant_true` → flag "llega de bitacora" en destino
  3. `applicantNit5` → campo NIT en destino
  4. `applicantCompania7` → campo empresa en destino
- Vincular a un botón dentro del dropdown "Agregar"
- Assertion: ✅ Al hacer clic, debe abrir el servicio destino con NIT y empresa pre-llenados
- Assertion: ✅ El servicio destino debe reconocer que viene de la Bitacora

**Paso 5: Crear el bot interno "modificar"**
- Tipo: `internal`
- Servicio destino: mismo que el bot "nuevo"
- Mappings INPUT:
  1. `constant_true` → flag "llega de bitacora"
  2. `constant_true` → flag tipo de permiso (checkbox específico del servicio)
  3. `applicantContadorPermiso` → contador en destino
  4. `applicantRadio2` → campo "qué quiere hacer" (valor: modificarExistente)
  5. `editgrid_collection_numero` → campo solicitud/número en destino
- Vincular al botón "Modificar" dentro del dropdown ⋮ del editgrid
- Assertion: ✅ Al hacer clic en Modificar de una fila, debe pasar el NÚMERO de esa fila
- Assertion: ✅ El servicio destino debe abrir en modo "modificar" con el permiso correcto

**Paso 6: Agregar botón al dropdown "Agregar" de applicantBlock4**
- Crear un nuevo botón `dropdown-menu-item` dentro de `applicantdropdown2`
- Label: nombre_tipo proporcionado por el analista
- Vincular component action al bot interno "nuevo"
- Assertion: ✅ El botón debe aparecer en el dropdown junto a los otros tipos

---

## RESUMEN DE COMPONENTES POR SERVICIO

Para cada tipo de permiso/registro se necesitan crear:

| # | Componente | Tipo | Propósito |
|---|-----------|------|-----------|
| 1 | Panel contenedor | `panel` | Dispara bot listar (component action) |
| 2 | Bot "Listar" | `data bot` | Consulta GDB y llena el grid |
| 3 | EditGrid | `editgrid` | Tabla read-only con los datos |
| 4 | Campo Tipo | `textfield` | Valor fijo con el nombre del tipo |
| 5 | Campo Número | `textfield` | Llenado por bot listar |
| 6 | Campo Vigente hasta | `datetime` | Llenado por bot listar |
| 7 | Badge Expirado | `button` | Visual, badge rojo |
| 8 | Dropdown acciones ⋮ | `dropdown` | Contiene botones por fila |
| 9 | Botón Modificar | `button` | Dentro del dropdown ⋮ |
| 10 | Bot "Nuevo" | `internal bot` | Abre servicio destino para nueva solicitud |
| 11 | Bot "Modificar" | `internal bot` | Abre servicio destino para modificar |
| 12 | Botón en "Agregar" | `button` | Dentro del dropdown "Agregar" del bloque |
| 13 | Campo Contador | `number` | Cuenta registros (output del bot listar) |

**Total: 3 bots + 10 componentes de formulario por servicio**
