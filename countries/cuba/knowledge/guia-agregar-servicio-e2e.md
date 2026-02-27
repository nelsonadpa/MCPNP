# Guia: Agregar E2E Testing para un Nuevo Servicio Cuba

Para agregar un nuevo servicio al framework de testing E2E, seguir estos pasos.

**Referencia**: PE (Permiso Eventual) es el servicio modelo. Todos los patrones y templates estan basados en la implementacion exitosa de PE.

**Tiempo estimado**: 2-3 horas por servicio.

---

## Prerequisitos

Antes de empezar, verificar que existen estos archivos:

| Archivo | Ruta | Proposito |
|---------|------|-----------|
| Auth state | `countries/cuba/testing/auth-state-cuba.json` | Sesion CAS autenticada (sysadmin) |
| Playwright config | `countries/cuba/testing/playwright.config.ts` | Config con proyecto `cuba-frontoffice` |
| Form helpers | `countries/cuba/testing/helpers/form-helpers.ts` | `searchAndSelect`, `fillText`, `fillNumber`, `checkBox`, `setHiddenFields`, `uploadFile` |
| Template | `countries/cuba/testing/specs/service-e2e-template.spec.ts` | Template configurable para cualquier servicio |

Si `auth-state-cuba.json` esta expirado, regenerarlo:

```bash
cd countries/cuba/testing
npx playwright test --project=auth-setup --headed --config=playwright.config.ts
```

---

## Paso 1: Identificar el Servicio

### 1a. Obtener IDs del servicio

Buscar en `countries/cuba/knowledge/SERVICES-MAP.md` o via BPA MCP:

```
service_list  -->  Buscar el servicio por nombre
service_get(service_id)  -->  Obtener registration_id, form_id
```

Datos necesarios:

| Dato | Ejemplo (PE) | Donde obtenerlo |
|------|-------------|-----------------|
| Service ID | `2c918084887c7a8f01887c99ed2a6fd5` | `SERVICES-MAP.md` o `service_list` |
| Service Name | Permiso Eventual | `service_get` |
| Registration ID | `2c91808d973b9d7a01975ecc39050772` | `registration_list` o `service_get` |
| Form ID | `2c918084887c7a8f01887c9a32387268` | `form_get(service_id)` |

### 1b. Identificar campo NIT y Empresa

Cada servicio usa claves DIFERENTES para NIT y nombre de empresa. Consultar la tabla en `SERVICES-MAP.md`:

| Patron | Servicios que lo usan |
|--------|----------------------|
| `applicantNit3` / `applicantNombreDeLaEmpresa4` | PE |
| `applicantNit3` / `applicantNombreDeLaEmpresa` | Cert. Sanitario |
| `applicantNit3` / `applicantNombreDeLaEmpresa11` | Seg. ambiental |
| `applicantNit` / `applicantNombreDeLaEmpresa` | Fito, Zoo, ONN |
| `applicantNit` / `applicantNombreDeLaEmpresa11` | Sustancias, CECMED, CyP, Sucursales, Donativos, Cert. Origen, Cert. Aprobacion, INHEM, CENASA, Reg. Sustancias |
| `applicantNit` / `applicantNombreEmpresa` | ONURE |

**CRITICO**: Nunca asumir que un servicio usa los mismos campos que otro. Siempre verificar con `form_get`.

### 1c. Identificar boton en Bitacora

El boton que abre el servicio desde Bitacora esta en:
- **Block22** (Permisos) o **Block4** (Registros) dependiendo del tipo de servicio
- Consultar `countries/cuba/analysis/bitacora-permisos-eventuales.md` para el patron
- O consultar `BitacoraPage.ts` que tiene los selectores de todos los botones:

```typescript
// Permisos (Block22)
btnPermisoEventual:       '[ref="applicantPermisoEventual"]'
btnFitosanitario:         '[ref="applicantEventuales3"]'
btnZoosanitario:          '[ref="applicantEquiposUsoDeEnergia2"]'
btnEquiposEnergia:        '[ref="applicantEventuales"]'
btnCertificadoSanitario:  '[ref="applicantSanitarioBtn"]'
btnInstrumentosMedicion:  '[ref="applicantCertificadoSanitario3"]'
btnDonativosMedicos:      '[ref="applicantCertificadoSanitario2"]'
btnSustanciasControladas: '[ref="applicantSustanciasBtn"]'
btnCertAprobacionModelo:  '[ref="applicantCertAprobacionBtn"]'
```

---

## Paso 2: Ejecutar Diagnostico de Descubrimiento

### 2a. Crear spec de diagnostico

Copiar el template:

```bash
cd countries/cuba/testing
cp specs/service-e2e-template.spec.ts specs/{servicio}-diag.spec.ts
```

### 2b. Configurar minimo para navegar

En `{servicio}-diag.spec.ts`, cambiar solo:

```typescript
const SERVICE_ID = 'el-uuid-del-servicio';
const SERVICE_NAME = 'Nombre del Servicio';
const SERVICE_SLUG = 'slug-corto';
```

### 2c. Ejecutar inventario de componentes

Agregar este bloque dentro del test, despues de que el formulario carga:

```typescript
const inventory = await page.evaluate(() => {
  const forms = (window as any).Formio?.forms;
  const form = forms?.[Object.keys(forms)[0]];
  const components: any[] = [];
  form?.everyComponent((c: any) => {
    components.push({
      key: c.key,
      type: c.type,
      label: c.label?.substring(0, 50),
      visible: c.visible !== false,
      hidden: c.component?.hidden || false,
      required: c.component?.validate?.required || false,
      block: c.key.match(/Block\d+/) ? c.key : undefined,
    });
  });
  return components;
});
console.log('INVENTORY:', JSON.stringify(inventory, null, 2));
```

### 2d. Ejecutar

```bash
npx playwright test specs/{servicio}-diag.spec.ts --project=cuba-frontoffice --headed
```

El inventario da:
- Todas las claves de campo (`key`)
- Tipos de componente (`textfield`, `select`, `radio`, `datagrid`, `checkbox`, etc.)
- Visibilidad actual y si estan ocultos por configuracion
- Campos requeridos

---

## Paso 3: Identificar Campos Ocultos de Bitacora

### 3a. Patrones comunes

Los campos ocultos que el bot INTERNO establece al abrir el formulario desde Bitacora siguen este patron:

| Campo | Clave tipica | Valor | Proposito |
|-------|-------------|-------|-----------|
| Status Bitacora | `applicantStatusLlegaDeLaBitacora` | `'true'` | Flag de origen |
| Que quiere hacer | `applicantQueQuiereHacer` | `'registrarNuevo'` | Tipo de operacion |
| NIT | `applicantNit3` o `applicantNit` (varia!) | `'01000348911'` | NIT de la empresa |
| Empresa | `applicantNombreDeLaEmpresa4` o variante (varia!) | Nombre completo | Nombre empresa |
| Contador | `applicantContadorEventuales` o variante (varia!) | `'-1'` | Contador de permisos |
| Flag permiso | `permisoEventual` o similar (varia!) | `'true'` | Flag del tipo |

### 3b. Buscar en inventario

Del diagnostico del Paso 2, filtrar componentes con `hidden: true` y prefijo `applicant`:

```
Buscar: hidden: true + key contiene "Status", "Nit", "Empresa", "Contador", "QueQuiere"
```

### 3c. Verificar con BPA MCP

Obtener el bot INTERNO y sus mappings:

```
bot_get(bot_id)
bot_input_mapping_list(bot_id)
```

Esto confirma exactamente que campos se mapean y sus valores fuente. El bot INTERNO vive en el servicio **Bitacora** (`ffe746aac09241078bad48c9b95cdfe0`), no en el servicio destino.

Para servicios en Block22, buscar el bot con:
```
componentaction_get_by_component(component_id)  -->  da el bot vinculado
```

### 3d. Nota importante sobre sufijos

Los sufijos de campo varian entre servicios:
- PE usa `Nit3`, `NombreDeLaEmpresa4`, `ContadorEventuales`
- Fito usa `Nit`, `NombreDeLaEmpresa`
- Otros usan `Nit`, `NombreDeLaEmpresa11`

**Siempre** verificar con el inventario o `form_get` del servicio especifico.

---

## Paso 4: Mapear Conexiones de Bots

### 4a. Identificar bots del servicio

Via BPA MCP:

```
# Bots configurados en el servicio
bot_list(service_id)  -->  Lista todos los bots

# Detalle de cada bot
bot_get(bot_id)  -->  Tipo (internal, mule, gdb), mule service, etc.

# Mappings de entrada
bot_input_mapping_list(bot_id)  -->  Que datos recibe

# Mappings de salida
bot_output_mapping_list(bot_id)  -->  Que datos escribe
```

### 4b. Verificar en Graylog

```graylog
# Todos los logs del servicio (ultimos 7 dias)
serviceId:"{SERVICE_ID}"

# Bots que ejecutan
serviceId:"{SERVICE_ID}" AND actionName:*

# Fallos
serviceId:"{SERVICE_ID}" AND message:"status\":false"

# Payloads vacios
serviceId:"{SERVICE_ID}" AND message:"Input payload is empty"
```

### 4c. Documentar

Crear un resumen de bots:

| Bot | Tipo | Trigger | Estado esperado |
|-----|------|---------|-----------------|
| UNIDAD DE MEDIDA Leer | GDB | Seleccion producto | true |
| Listar productos | GDB | Auto al abrir form | false (bypass) |
| ... | ... | ... | ... |

---

## Paso 5: Escribir el Spec E2E

### 5a. Copiar template

```bash
cd countries/cuba/testing
cp specs/service-e2e-template.spec.ts specs/{servicio}-e2e-nuevo.spec.ts
```

### 5b. Rellenar bloque de configuracion

El template tiene secciones claramente marcadas con `// TEMPLATE:`. Rellenar cada una:

```typescript
// ===== SERVICE CONFIGURATION =====
const SERVICE_ID = 'uuid-del-servicio';
const SERVICE_NAME = 'Nombre Legible';
const SERVICE_SLUG = 'slug-corto';
const COMPANY_NAME = 'EMPRESA DE SERVICIOS INGENIEROS';

// ===== HIDDEN FIELDS =====
const HIDDEN_FIELDS: Record<string, string> = {
  applicantStatusLlegaDeLaBitacora: 'true',
  applicantQueQuiereHacer: 'registrarNuevo',
  applicantNit: '01000348911',           // <-- clave correcta para ESTE servicio
  applicantNombreDeLaEmpresa11: '...',    // <-- clave correcta para ESTE servicio
};

// ===== FIRST VISIBLE BLOCK =====
const FIRST_VISIBLE_BLOCK = 'applicantBlock8';  // <-- ajustar segun inventario

// ===== DROPDOWN FIELDS =====
const DROPDOWN_FIELDS: [string, string][] = [
  ['applicantTipoDeOperacion', 'Import'],  // <-- claves del inventario
  // ...
];

// ===== TEXT FIELDS =====
const TEXT_FIELDS: [string, string][] = [
  ['applicantObservaciones', 'Prueba E2E automatizada'],
  // ...
];

// ===== DATAGRID =====
// null si no tiene DataGrid, o configurar segun inventario
const DATAGRID_CONFIG = null;

// ===== CONTACT FIELDS =====
// Generalmente iguales para todos los servicios
const CONTACT_FIELDS: [string, string][] = [
  ['applicantElaboradoPor', 'Test Agent E2E'],
  ['applicantTelefono', '73985278'],
  ['applicantCorreoElectronico', 'test-e2e@eregistrations.org'],
  ['applicantEmail', 'test-e2e@eregistrations.org'],
];
```

### 5c. La logica del test NO se modifica

El template tiene logica generica que:
1. Navega a Bitacora
2. Selecciona empresa
3. Va directo al formulario via URL (`/services/{SERVICE_ID}`)
4. Inyecta campos ocultos via Form.io API
5. Llena dropdowns, textos, datagrid
6. Llena fundamentacion y contacto
7. Marca checkbox de confirmacion
8. Intenta submit
9. Si no puede submit, ejecuta diagnostico completo

Esta logica **no debe editarse** salvo que el servicio tenga un flujo verdaderamente diferente.

---

## Paso 6: Ejecutar y Depurar

### 6a. Primera ejecucion (headed)

```bash
npx playwright test specs/{servicio}-e2e-nuevo.spec.ts \
  --project=cuba-frontoffice \
  --headed \
  --config=playwright.config.ts
```

### 6b. Problemas comunes y soluciones

| Problema | Causa | Solucion |
|----------|-------|----------|
| Bloques no aparecen despues de setear campos ocultos | Claves de campos incorrectas | Verificar inventario, ajustar `HIDDEN_FIELDS` |
| Dropdown muestra 0 opciones | Termino de busqueda no coincide | Probar otros terminos; agregar fallbacks en `DROPDOWN_FIELDS_WITH_FALLBACK` |
| Click en dropdown falla | Item fuera de viewport | El helper ya usa Enter como fallback; verificar que funciona |
| Pagina se congela o recarga | Llamaste `onChange()` o `rebuild()` en Form.io | Solo usar `checkConditions()` (el template ya lo hace bien) |
| Submit no visible | Campos requeridos sin llenar | El test ejecuta diagnostico automatico; revisar la lista de "EMPTY FIELDS" |
| Form tarda en cargar | Espera insuficiente | El template usa `waitForTimeout(10000)` + `waitForSelector` — no reducir |
| `applicantBlock8` no es el primer bloque visible | Cada servicio tiene estructura diferente | Ajustar `FIRST_VISIBLE_BLOCK` segun inventario |
| Campos deshabilitados | Sin datos reales (e.g., numero de permiso anterior) | El template chequea `isFieldEnabled()` y salta campos deshabilitados |

### 6c. Interpretar diagnostico

Si submit no es visible, el test automaticamente genera:

1. **Applicant data dump**: todos los valores `applicant*` en submission
2. **Visible components inventory**: lista de componentes visibles con tipo y si estan vacios
3. **Empty fields list**: campos que probablemente necesitan llenarse
4. **Validation errors**: errores de validacion del DOM

Usar esta informacion para ajustar la configuracion y re-ejecutar.

### 6d. Screenshots

El test genera screenshots en `countries/cuba/testing/screenshots/{slug}/`:

| Screenshot | Momento |
|------------|---------|
| `01-form-loaded.png` | Form cargado (antes de hidden fields) |
| `02-hidden-fields-set.png` | Despues de inyectar campos ocultos |
| `03-main-fields.png` | Despues de llenar campos principales |
| `04-datagrid.png` | Despues de llenar DataGrid |
| `05-fundamentacion.png` | Despues de llenar fundamentacion |
| `06-contact.png` | Despues de llenar contacto |
| `07-before-submit.png` | Estado final antes de submit |
| `08-after-submit.png` | Resultado del submit |
| `09-final.png` | Screenshot final |

---

## Paso 7: Validacion con Observer

### 7a. Crear queries de monitoreo

Usar las queries de Graylog basadas en el template de PE:

```graylog
# Todos los logs del servicio
serviceId:"{SERVICE_ID}"

# Fallos inesperados (excluir bots que fallan por diseno)
serviceId:"{SERVICE_ID}" AND message:"status\":false" AND NOT actionName:"{bot-que-falla-esperado}"

# Payloads vacios
serviceId:"{SERVICE_ID}" AND message:"Input payload is empty"

# Errores de activacion (Mule)
serviceId:"{SERVICE_ID}" AND message:"was probably just in activation"

# Por usuario (para ver ejecuciones del test)
serviceId:"{SERVICE_ID}" AND user:"nelson"

# Bots cruzados en Bitacora (INTERNO y LISTAR)
serviceId:"ffe746aac09241078bad48c9b95cdfe0" AND actionName:"{NOMBRE_BOT_INTERNO}"
```

### 7b. Verificar ejecucion de bots

Despues de ejecutar el test E2E, verificar en Graylog:

1. **Bots que debieron ejecutar**: buscar por `serviceId` + `actionName` en la ventana de tiempo del test
2. **Status esperado**: `status:true` para bots saludables, `status:false` para bots que fallan por diseno (como Listar productos cuando se bypasa Bitacora)
3. **Payloads vacios**: `"Input payload is empty"` indica que el bot no recibio datos de entrada

### 7c. Crear dashboard del servicio

Copiar `observer/dashboards/pe-dashboard.md` como template:

```bash
cp observer/dashboards/pe-dashboard.md observer/dashboards/{servicio}-dashboard.md
```

Reemplazar:
- Service ID
- Nombre del servicio
- Nombres de bots
- Queries especificas
- Umbrales de alerta

### 7d. Crear bot map

Copiar `observer/reports/pe-bot-map.md` como template:

```bash
cp observer/reports/pe-bot-map.md observer/reports/{servicio}-bot-map.md
```

Documentar:
- Bots front-office (formulario ciudadano)
- Bots cross-service (viven en Bitacora)
- Bots back-office (workflow camunda)
- Diagrama de flujo de ejecucion
- Queries de monitoreo por bot

---

## Paso 8: Actualizar Knowledge

### 8a. SERVICES-MAP.md

En `countries/cuba/knowledge/SERVICES-MAP.md`, actualizar la columna E2E del servicio:

```
| # | Servicio | Service ID | StatusBitacora | Expirado | E2E |
|---|----------|-----------|----------------|----------|-----|
| X | Nombre   | uuid      | ...            | ...      | VERIFIED |
```

Agregar bloque de detalle similar al de PE:

```markdown
#### {Servicio} -- E2E Verification ({fecha})
- **Status**: VERIFIED
- **Specs**: `{servicio}-e2e-nuevo.spec.ts` (PASSING, ~Xmin)
- **Bots verified**: Lista de bots y su estado
- **Dashboard**: `observer/dashboards/{servicio}-dashboard.md`
```

### 8b. Page Object (si aplica)

Si el servicio necesita interacciones complejas mas alla del template, crear un Page Object:

```bash
# Solo si necesario
touch countries/cuba/testing/pages/{Servicio}Page.ts
```

Para la mayoria de servicios, el template es suficiente y no se necesita Page Object.

### 8c. Bot map y dashboard

- `observer/reports/{servicio}-bot-map.md` -- mapa de bots
- `observer/dashboards/{servicio}-dashboard.md` -- dashboard de salud

### 8d. MEMORY.md

Actualizar `~/.claude/projects/-Users-nelsonperez-Desktop-OCAgents/memory/MEMORY.md` si el servicio revela patrones nuevos o gotchas.

### 8e. Lessons

Si el proceso de agregar el servicio revelo errores o patrones nuevos, actualizar `tasks/lessons.md`.

---

## Tiempos Estimados por Servicio

| Paso | Tiempo | Notas |
|------|--------|-------|
| 1. Identificar servicio | ~10 min | Rapido si SERVICES-MAP esta actualizado |
| 2. Diagnostico de descubrimiento | ~30 min | Incluye ejecucion y analisis del inventario |
| 3. Campos ocultos | ~15 min | Verificar con BPA MCP + inventario |
| 4. Mapear bots | ~20 min | BPA MCP + Graylog |
| 5. Escribir spec | ~30 min | Rellenar config en template |
| 6. Debug y fix | ~30 min | 2-3 iteraciones tipicas |
| 7. Validacion Observer | ~15 min | Queries + crear dashboard |
| 8. Actualizar knowledge | ~15 min | SERVICES-MAP + bot map |
| **Total** | **~2.5 horas** | Menos si el servicio es similar a PE |

---

## Referencia de Archivos

### Testing Framework

| Archivo | Ruta absoluta |
|---------|---------------|
| Playwright config | `countries/cuba/testing/playwright.config.ts` |
| Auth state | `countries/cuba/testing/auth-state-cuba.json` |
| Auth setup spec | `countries/cuba/testing/specs/auth-setup.spec.ts` |
| Form helpers | `countries/cuba/testing/helpers/form-helpers.ts` |
| Template E2E | `countries/cuba/testing/specs/service-e2e-template.spec.ts` |
| PE E2E Nuevo (referencia) | `countries/cuba/testing/specs/pe-e2e-nuevo.spec.ts` |
| PE E2E Modificar (referencia) | `countries/cuba/testing/specs/pe-e2e-modificar.spec.ts` |
| BitacoraPage | `countries/cuba/testing/pages/BitacoraPage.ts` |
| package.json | `countries/cuba/testing/package.json` |

### Knowledge

| Archivo | Ruta absoluta |
|---------|---------------|
| Services Map | `countries/cuba/knowledge/SERVICES-MAP.md` |
| Changelog | `countries/cuba/knowledge/CHANGELOG.md` |
| Bitacora PE Analysis | `countries/cuba/analysis/bitacora-permisos-eventuales.md` |
| Connection Model | `countries/cuba/analysis/bitacora-connection-model-complete.md` |
| Comparativa PE-Fito-Zoo | `countries/cuba/analysis/comparativa-PE-Fito-Zoo.md` |
| PE Connection Template | `countries/cuba/analysis/PE-Connection-Template.md` |
| E2E Service Test Skill | `countries/cuba/skills/e2e-service-test/SKILL.md` |

### Observer

| Archivo | Ruta absoluta |
|---------|---------------|
| PE Dashboard (referencia) | `observer/dashboards/pe-dashboard.md` |
| PE Bot Map (referencia) | `observer/reports/pe-bot-map.md` |
| PE Baseline Report | `observer/reports/pe-baseline-001.md` |
| PE Trace Report | `observer/reports/pe-nuevo-trace-001.md` |

### Lessons

| Archivo | Ruta absoluta |
|---------|---------------|
| Lessons Learned | `tasks/lessons.md` |

---

## Checklist Rapido

```
[ ] Service ID, Registration ID, Form ID identificados
[ ] Claves NIT/Empresa verificadas (no asumidas)
[ ] Diagnostico de inventario ejecutado
[ ] Campos ocultos de Bitacora identificados y verificados con BPA MCP
[ ] Bots del servicio mapeados
[ ] Template copiado y configuracion rellenada
[ ] Test ejecuta exitosamente (submit o diagnostico completo)
[ ] Queries de Graylog ejecutadas, bots verificados
[ ] Dashboard del servicio creado
[ ] Bot map creado
[ ] SERVICES-MAP.md actualizado con E2E = VERIFIED
[ ] Lessons actualizadas si hubo hallazgos nuevos
```
