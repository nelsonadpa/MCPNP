# Analisis Completo: Servicio Bitacora

**Service ID:** `ffe746aac09241078bad48c9b95cdfe0`
**Status:** active
**Complejidad:** alta (326 campos, 36 bots, 18 determinantes, 41 component actions)

---

## 1. ARQUITECTURA GENERAL

La Bitacora funciona como un **hub central** que:
- Muestra al usuario sus empresas acreditadas y permisos existentes
- Permite lanzar nuevas solicitudes hacia otros servicios via **bots internos**
- Carga datos de registros existentes desde GDB via **bots data**
- Controla visibilidad de secciones con **determinantes**

### 1.1 FLUJO DEL USUARIO (UX)

**Tab "Empresas" (pantalla inicial):**
Cuando el usuario ingresa a la Bitacora, carga la tab "Empresas". Un bot data consulta la tabla GDB DERECHOS para listar las empresas a las que el usuario esta acreditado, basado en su ID de registrations. La lista muestra:
- Nombre de la empresa
- NIT
- Vigencia (fecha "vigente hasta")
- Estado: muestra badge "Expirado" si la acreditacion esta vencida

**Acciones disponibles en la lista de empresas:**
- **Seleccionar empresa** → aparece panel "Empresa seleccionada: confirme para continuar" con boton "Confirmar y continuar". Al confirmar, carga todos los permisos de esa empresa desde GDB y navega a la tab "Servicios"
- **Boton "Agregar"** → ofrece dos opciones:
  - "Acreditarse a otra empresa" → bot interno que abre servicio de Acreditacion
  - "Solicitar nueva autorizacion" → (pendiente de implementar)
- **Menu tres puntos (⋮)** por empresa:
  - Si la empresa tiene acreditacion **expirada** → boton "Extender" para solicitar extension via bot interno
  - Si la empresa tiene acreditacion **vigente** → botones para navegar a secciones de permisos/registros (algunos pendientes de implementar)

**Tab "Servicios":**
Una vez confirmada la empresa, el usuario navega a la tab "Servicios" donde se muestran los permisos y registros de esa empresa. Aqui es donde aplican los Patrones A, B y C documentados abajo.

**Tab "Servicios (tabs)":**
Vista alternativa con tabs por tipo de servicio.

**Tab "Registros":**
Vista de los registros del usuario.

**Tab "Importadores y exportadores de servicios":**
Seccion especifica para operadores de comercio exterior.

---

## 2. PATRONES IDENTIFICADOS

### PATRON A: Bot Interno "Nuevo" (Lanzar nueva solicitud)
Un boton en Bitacora abre una nueva solicitud en un servicio destino, pre-llenando campos.

**Estructura:**
```
Boton (dropdown-menu-item)
  -> Component Action
    -> Action Row
      -> Bot interno (botType: internal, botServiceId: <servicio destino>)
        -> dataMappings (direction: Input)
```

**Mappings comunes en todos los bots internos "nuevo":**

| Mapping | Proposito |
|---------|-----------|
| `constant_true` -> `applicantStatusLlegaDeLaBitacora` | Flag: "viene de la Bitacora" |
| `constant_true` -> `<checkbox tipo permiso>` | Identifica el tipo de permiso |
| `applicantCompania7` -> `<campo empresa destino>` | Nombre de empresa |
| `applicantNit5` -> `<campo NIT destino>` | NIT de empresa |
| `applicant<Radio>` -> `applicantQueQuiereHacer` | Tipo de operacion |
| `applicant<Contador>` -> `<contador destino>` | Contador de permisos existentes |

### PATRON B: Bot Data "Listar" (Cargar datos de GDB)
Un panel (Block) al cargarse ejecuta un bot data que consulta una vista GDB y llena grids/campos.

**Estructura:**
```
Panel (applicantBlock<N>)
  -> Component Action
    -> Action Row
      -> Bot data (botType: data, botServiceId: GDB.<vista>-list)
        -> dataMappings: Input (query params) + Output (resultados)
```

### PATRON C: Bot Interno "Modificar" (Abrir solicitud existente)
Similar al Patron A pero abre una solicitud existente (no nueva).

---

## 3. INVENTARIO DE BOTS INTERNOS (17)

### 3.1 Bots "Nuevo" - Lanzan nueva solicitud

| Bot | Servicio Destino | ID Servicio | Mappings | Boton(es) |
|-----|-----------------|-------------|----------|-----------|
| INTERNO permisos eventuales - nuevo | Permisos eventuales | `2c918084887c7a8f01887c99ed2a6fd5` | 6 | `applicantSolicitarNuevoPermiso`, `applicantClientesYProveedores3` |
| INTERNO permisos fitosanitario - nuevo | Permisos fitosanitarios | `2c91808893792e2b019379310a8003a9` | 3 | `applicantSolicitarNuevoPermisoEventual`, `applicantEquiposUsoDeEnergia` |
| INTERNO permiso zoosanitario-nuevo | Permiso zoosanitario | `2c91808893792e2b01938d3fd5800ceb` | 3 | `applicantAgregarPermiso2` |
| INTERNO Permiso ONN nuevo | Permisos ONN | `2c918088948ec322019499d518660007` | 4 | `applicantAgregarPermiso` |
| INTERNO certificado sanitario nuevo | Certificado sanitario | `2c91808893792e2b0193792f8e170001` | 3 | `applicantSolicitarNuevoPermiso2`, `applicantEventuales2` |
| INTERNO LIcencia sanitaria cecmed nuevo | Licencia CECMED | `2c9180879656ae1901965aa932f60348` | 4 | `applicantSolicitarNuevoPermiso3`, `applicantHomologacionDeEquiposDeEnergia` |
| INTERNO autorizacion donaciones nuevo | Donaciones CECMED | `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa` | 3 | `applicantAgregarPermiso3` |
| INTERNO homologar equipos nuevo | Homologar equipos | `bf77b220-6643-4f1e-bab0-69cf808b4e42` | 2 | `applicantSolicitarNuevoPermiso5` |
| Interno nuevo permiso ONURE | Permiso ONURE | `2c91808893792e2b01944713789f1c89` | 4 | `applicantArregarNuevo`, `applicantEventuales` |
| INTERNO Registro de clientes y proveedores nuevo | Clientes y proveedores | `2c918090909800d60190c16b80292f3a` | 5 | `applicantClientesYProveedores2` |
| INTERNO nueva acreditacion | Acreditacion | `2c918084887c7a8f01888b72010c7d6e` | 1 | `applicantAcreditarmeAOtraEmpresa` |

### 3.2 Bots "Modificar/Renovar/Extension"

| Bot | Servicio Destino | ID Servicio | Mappings | Boton(es) |
|-----|-----------------|-------------|----------|-----------|
| INTERNO permisos eventuales - modificar | Permisos eventuales | `2c918084887c7a8f01887c99ed2a6fd5` | 5 | `applicantModificar`, `applicantCancelar`, `applicantModificar5` |
| INTERNO Licencia CECMEDmodificar | Licencia CECMED | `2c9180879656ae1901965aa932f60348` | 3 | *(vinculado por accion)* |
| INTERNO LIcencia CECMED-renovar | Licencia CECMED | `2c9180879656ae1901965aa932f60348` | 4 | *(vinculado por accion)* |
| INTERNO extension acreditacion | Acreditacion | `2c918084887c7a8f01888b72010c7d6e` | 4 | `applicantCompartir` |
| INterno homologar equipos ONURE | Homologar equipos | `bf77b220-6643-4f1e-bab0-69cf808b4e42` | 5 | *(vinculado por accion)* |

### 3.3 Bot especial

| Bot | Proposito | Mappings |
|-----|-----------|----------|
| Listar Registros | Consolida datos de licencias y aprobaciones en un grid unificado | 7 |

---

## 4. INVENTARIO DE BOTS DATA (16)

| Bot | Vista GDB | Proposito | Inputs | Outputs | Panel Trigger |
|-----|-----------|-----------|--------|---------|---------------|
| PERMISOS EVENTUALES listar | GDB-PE(1.5)-list | Lista permisos eventuales | NIT | 8 campos (contador, grid datos) | `applicantBlock` |
| PERMISOS FITOSANITARIOS listar | GDB-FITO2(1.1)-list | Lista permisos fito | NIT | 3 campos | `applicantBlock18` |
| Permiso Zoosanitario Listar | GDB-PERMISO ZOO(1.0)-list | Lista permisos zoo | Empresa | 0 outputs | `applicantBlock21` |
| PERMISOS ONN listar | GDB-ONN(1.2)-list | Lista permisos ONN | Tipo+Empresa | 0 outputs | `applicantBlock17` |
| Permiso ONN Aprobacion modelo listar | GDB-ONN(1.2)-list | Lista aprobaciones ONN | Tipo+Empresa | 4 campos | `applicantBlock29` |
| Certificado sanitario listar | GDB-SANITARIO(1.1)-list | Lista certificados | NIT | 0 outputs | `applicantBlock24` |
| Licencia sanitaria cecmed listar | GDB-CECMED(1.4)-list | Lista licencias CECMED | NIT | 0 outputs | `applicantBlock26` |
| Permiso donaciones cecmed listar | GDB-CECMED(1.4)-list | Lista donaciones CECMED | NIT | 0 outputs | `applicantBlock25` |
| Homologar equipos ONURE listar | GDB-PERMISO ONURE(1.7)-list | Lista homologaciones | NIT | 3 campos | `applicantBlock16` |
| PERMISOS Autorizacion importacion ONURE listar | GDB-PERMISO ONURE(1.7)-list | Lista autorizaciones ONURE | Empresa+Tipo | 0 outputs | `applicantBlock12` |
| AUTORIZACIONES DE COMERCIO listar | GDB-PERMISOS(1.5)-list | Lista autorizaciones comercio | NIT | 3 campos | `applicantBlock19` |
| ENTIDAD EXONERADA listar | GDB-EXONERADAS(1.1)-list | Lista entidades exoneradas | Cantidad | 1 campo | `applicantBlock14` |
| DERECHOS listar | GDB-DERECHOS(1.4)-list | Lista derechos del usuario | UserID | 3 campos | `applicantBlock7` |
| DERECHOS contar | GDB-DERECHOS(1.4)-list | Cuenta acreditaciones | UserID | 1 campo | `applicantBlock7` |
| VIEW listar permisos | GDB-VIEW-Permisos y registros(1.7)-list | Vista consolidada | NIT | 0 outputs | `applicantBlock33` |
| Clientes y proveedores listar | GDB-CLIENTES PROVEEDORES(1.4)-list | Lista clientes/proveedores | NIT empresa | 3 campos | `applicantMostrar` |

---

## 5. SERVICIOS DESTINO (Mapa de relaciones)

```
                          BITACORA (hub)
                              |
        ┌─────────┬───────────┼───────────┬──────────────┐
        |         |           |           |              |
   Permisos    Permisos    Permiso     Permisos      Acreditacion
   eventuales  fitosanit.  zoosanit.   ONN           2c91..7d6e
   2c91..6fd5  2c91..03a9  2c91..0ceb  2c91..0007       |
        |                                            (nueva/extension)
        |
   (nuevo/modificar)

        ┌─────────┬───────────┬───────────┬──────────────┐
        |         |           |           |              |
   Certificado  Licencia   Donaciones  Homologar    Clientes y
   sanitario    CECMED     CECMED      equipos      proveedores
   2c91..0001   2c91..0348  a5f9..33aa  bf77..4e42   2c91..2f3a
                    |
              (nuevo/modificar/renovar)

   Permiso ONURE
   2c91..1c89
```

---

## 6. DETERMINANTES (18)

### Control de flujo de usuario
| Determinante | Tipo | Proposito |
|-------------|------|-----------|
| User is logged in | boolean | Controla acceso |
| Form is valid | boolean | Validacion del formulario |
| Current PartA tab is valid | boolean | Validacion de pestana |
| EVENT empresa confirmada | button | Trigger cuando confirma empresa |
| EVENT empresa selected | grid | Trigger cuando selecciona empresa del grid |

### Control de empresas
| Determinante | Tipo | Proposito |
|-------------|------|-----------|
| Contador acreditaciones = 0 | numeric | No tiene acreditaciones |
| Contador acreditaciones > 0 | numeric | Tiene al menos una |
| Contador acreditaciones > 1 | numeric | Tiene mas de una |
| Contador acreditadas = 1 | numeric | Tiene exactamente una |
| Contador relacionadas > 1 | numeric | Mas de una empresa relacionada |
| Empresa seleccionada distinto de vacio | text | Hay empresa seleccionada |
| Status Empresa seleccionada = True | radio | Empresa confirmada |

### Control de permisos
| Determinante | Tipo | Proposito |
|-------------|------|-----------|
| Tipo de permiso = Permiso eventual | grid | Filtra permisos eventuales |
| Acreditacion = expirada | grid | Detecta acreditacion vencida |
| Vigencia < hoy (inside grid) | grid | Permiso vencido dentro del grid |
| Vigencia > hoy (empresa seleccionada) | date | Empresa vigente |
| Vigencia > hoy (inside grid) | grid | Permiso vigente dentro del grid |
| Vigente hasta not empty | grid | Campo vigencia no vacio |

---

## 7. CAMPOS CLAVE DE LA BITACORA (campos fuente para bots)

| Campo | Tipo | Proposito |
|-------|------|-----------|
| `applicantCompania7` | textfield | Nombre de la empresa seleccionada |
| `applicantNit5` | textfield | NIT de la empresa seleccionada |
| `applicantRadio` | radio | Tipo de operacion (importar/exportar) |
| `applicantuserid` | textfield | ID del usuario logueado |
| `applicantContadorPermiso` | number | Contador de permisos eventuales |
| `applicantContadorFito` | number | Contador de permisos fitosanitarios |
| `applicantContadorZoo` | number | Contador de permisos zoosanitarios |
| `applicantContadorAutorizaciones` | number | Contador de autorizaciones comercio |
| `applicantAcreditaciones` | number | Contador de acreditaciones |
| `applicantExpiracion4` | datetime | Fecha expiracion de acreditacion |

---

## 8. DROPDOWN DE ACCIONES (applicantdropdown5)

Ubicado en: `applicantBlock22 > applicantcolumns14 > applicantdropdown5`

Botones dentro del dropdown (todos tipo `dropdown-menu-item`):

| Boton Key | Label | Bot vinculado |
|-----------|-------|---------------|
| `applicantClientesYProveedores2` | Clientes y proveedores | INTERNO Registro de clientes y proveedores nuevo |
| `applicantClientesYProveedores3` | Eventuales | INTERNO permisos eventuales - nuevo |
| `applicantEventuales` | *(ONURE)* | Interno nuevo permiso ONURE |
| `applicantEventuales2` | *(Cert. sanitario)* | INTERNO certificado sanitario nuevo |
| `applicantEquiposUsoDeEnergia` | *(Fitosanitario)* | INTERNO permisos fitosanitario - nuevo |
| `applicantHomologacionDeEquiposDeEnergia` | *(Lic. CECMED)* | INTERNO LIcencia sanitaria cecmed nuevo |
