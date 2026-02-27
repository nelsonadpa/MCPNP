# Platform Known Issues

Bugs confirmados del engine de eRegistrations que NO son de configuración.
Documentados para no perder tiempo re-investigando.

---

## PKI-001: WIZARD auto-save descarta cambios no guardados en EditGrid

**Fecha descubierto**: 2026-02-27
**Instancia**: Colombia Test
**Servicio referencia**: `881ca694-4d1c-42ba-9863-42f0b8a9628d`
**Issue formal**: `~/Desktop/issue-wizard-save-grid-bot-EN.md`

### Síntoma
Cuando un usuario edita una fila de EditGrid, cambia un campo (ej. dropdown), y luego ejecuta un bot sin guardar la fila, el cambio se revierte. Secciones que dependían del nuevo valor aparecen por ~1 segundo y luego desaparecen.

### Causa raíz
El WIZARD auto-save post-bot construye el payload desde datos persistidos de la base de datos, no desde el estado actual del formulario en el cliente. Los cambios no guardados del usuario se sobrescriben.

### Impacto
- Afecta CUALQUIER servicio que combine EditGrid + bots
- Pérdida silenciosa de datos del usuario
- Comportamiento confuso (flash de componentes)

### Workaround
Guardar la fila del grid ANTES de ejecutar el bot.

### Estado
Abierto — requiere fix en el engine.

---

## PKI-002: MCP componentbehaviour_get puede omitir grupos de determinantes

**Fecha descubierto**: 2026-02-27
**Herramienta**: `componentbehaviour_get` del MCP `mcp-eregistrations-bpa`

### Síntoma
La respuesta JSON del MCP devuelve menos grupos de determinantes de los que existen en la configuración real. En un caso, el MCP devolvió 2 grupos cuando la UI de admin mostraba 3.

### Causa raíz
Posible bug en la serialización del MCP tool, o en cómo interpreta la estructura de determinantes cuando un grupo tiene un solo item.

### Impacto
- Análisis incorrecto de condiciones de behaviour
- Puede llevar a conclusiones erróneas durante debugging

### Workaround
Siempre verificar la estructura de behaviours contra screenshots del tab Effects en la UI de admin. No confiar solo en la salida del MCP.

### Estado
Abierto — necesita reportarse al equipo de MCP.

---

## PKI-003: determinant_get no muestra json_condition para grid determinants

**Fecha descubierto**: 2026-02-27
**Herramienta**: `determinant_get` del MCP `mcp-eregistrations-bpa`

### Síntoma
Para determinantes de tipo `grid`, el campo `json_condition` siempre es `null`. No se puede ver qué campos compara el determinante ni qué operador usa.

### Impacto
- No se puede analizar determinantes grid programáticamente
- Requiere inferir la condición por el nombre del determinante y los campos del formulario

### Workaround
- Usar el nombre del determinante como pista (ej. "Campo A = Campo B")
- Buscar los componentes involucrados con `form_query` y `form_component_get`
- Verificar `copyValueFrom` en los campos para entender la cadena de datos

### Estado
Abierto — limitación del MCP tool.

---

## Plantilla para nuevos issues

```markdown
## PKI-NNN: [Título corto]

**Fecha descubierto**: YYYY-MM-DD
**Instancia**: [nombre]
**Servicio referencia**: [ID si aplica]

### Síntoma
[Qué se observa]

### Causa raíz
[Por qué pasa]

### Impacto
[A quién afecta]

### Workaround
[Cómo evitarlo]

### Estado
Abierto | Reportado | Resuelto en vX.X
```
