# Request: Test Agent → Manual Agent #001

**DATE**: 2026-02-21
**PRIORITY**: ALTA
**SERVICE_ID**: `2c918084887c7a8f01888b72010c7d6e` (Acreditaciones)
**MCP_SERVER**: BPA-cuba

## CONTEXTO

Tengo 34/34 tests pasando en producción para el dashboard de la Bitácora (Empresas tab, Servicios tab, Solicitudes, roles). Ahora necesito ir más profundo y testear los flujos que se abren al hacer clic en botones del dashboard.

## LO QUE NECESITO

### 1. Formulario de "Acreditarse en otra empresa" (PRIORIDAD MÁXIMA)
Cuando el usuario hace clic en "Agregar" → "Acreditarse en otra empresa", ¿qué pasa?
- ¿Se abre un formulario del servicio Acreditaciones (`2c918084887c7a8f01888b72010c7d6e`)?
- ¿O es un flujo inline en la Bitácora?
- Necesito la **estructura completa del formulario**: panels, tabs, campos (keys + labels + types), component actions
- ¿Hay campo de búsqueda de NIT? ¿Dropdown de empresa? ¿Checkbox de confirmación?
- ¿Qué determinantes controlan visibilidad?

### 2. Estructura del Block22 "Permisos" expandido (Bitácora)
**SERVICE_ID**: `ffe746aac09241078bad48c9b95cdfe0`
- Los 6 botones del dropdown "Agregar" dentro del section Permisos:
  - Keys exactas (applicantPermisoEventual, applicantEventuales3, etc.)
  - Labels exactos como aparecen al usuario
- Los 6 EditGrids con sus columnas (Tipo, Número, Vigente hasta, Expirado)
  - Keys exactas de cada EditGrid
  - Qué bot LISTAR llena cada uno

### 3. Formulario de Permisos Eventuales (para next iteration)
**SERVICE_ID**: `2c918084887c7a8f01887c99ed2a6fd5`
- Estructura del formulario: panels, tabs, campos con keys + types
- Campos auto-populados desde Bitácora (NIT, empresa, StatusBitacora)
- Radio "Nuevo permiso" vs "Modificar existente" y sus determinantes
- Component actions de los bots (UNIDAD DE MEDIDA Leer, etc.)

## FORMATO DESEADO

Markdown con:
```
## Sección/Panel: [nombre]
| Key | Label | Type | Required | Notes |
|-----|-------|------|----------|-------|
| applicantXxx | "Label visible" | textfield/select/radio/... | Y/N | auto-filled from Bitacora |
```

Y para Component Actions:
```
## Component Actions
| Component Key | Bot | Trigger | What it does |
|---------------|-----|---------|--------------|
```

## PARA QUÉ LO NECESITO

Escribir tests E2E que:
1. Abran el formulario de Acreditaciones y verifiquen su estructura
2. Expandan Permisos en Servicios tab y verifiquen los 6 EditGrids
3. Creen una solicitud de Permiso Eventual y verifiquen el formulario completo
