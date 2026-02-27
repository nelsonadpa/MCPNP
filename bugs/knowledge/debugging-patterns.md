# Debugging Patterns for eRegistrations/BPA

Patrones genéricos para investigar bugs. Aplicables a cualquier instancia y servicio.

---

## 1. Triage inicial — ¿Dónde está el bug?

Antes de profundizar, clasificar el bug en una de estas capas:

| Capa | Síntomas | Herramientas |
|------|----------|--------------|
| **Configuración** | Behaviour mal armado, determinante incorrecto, bot mal mapeado | MCP: `componentbehaviour_get`, `determinant_get`, `bot_*` |
| **Datos** | Campo vacío, valor incorrecto, tipo string vs boolean | Network tab (WIZARD payload), campos hidden en UI |
| **Plataforma (engine)** | Config correcta pero no funciona. Timing, rendering, re-evaluación | Comparar config esperada vs comportamiento real |
| **MCP tool** | El MCP reporta algo diferente a lo que la UI muestra | Comparar output MCP vs screenshot de admin UI |

**Regla**: Si la config se ve bien pero no funciona → sospechar de la plataforma.

---

## 2. Approach de investigación

### Paso 1: Reproducir y documentar
- Screenshots del estado antes/después
- Capturar Network tab (payloads JSON) cuando sea posible
- Anotar la secuencia exacta de clicks del usuario

### Paso 2: Mapear la cadena de dependencias
```
Campo usuario → Determinante → Behaviour → Componente visible
                                              ↓
                                     Bot (action) → Outputs → WIZARD save
                                              ↓
                                     Determinantes downstream → Secciones dependientes
```

### Paso 3: Verificar cada eslabón
- Para cada determinante: ¿qué campo evalúa? ¿cuál es el valor actual?
- Para cada behaviour: ¿cuántos grupos? ¿AND/OR entre grupos? ¿AND/OR dentro de items?
- Para cada bot: ¿qué inputs lee? ¿qué outputs escribe? ¿a qué campos?

### Paso 4: Encontrar el eslabón roto
- El eslabón roto es donde la expectativa difiere de la realidad
- Puede ser un valor incorrecto, un timing incorrecto, o una ausencia de valor

---

## 3. Trampas comunes

### 3.1 El MCP no muestra todo
- **El JSON del MCP puede omitir determinantes**. Siempre verificar contra la UI de admin (screenshot del tab Effects)
- Los determinantes tipo `grid` devuelven `json_condition: null` — no puedes ver qué campos comparan solo con `determinant_get`
- Para entender un grid determinant, necesitas buscar los componentes que referencia y sus `copyValueFrom`

### 3.2 AND/OR en behaviours — leer del UI, no del JSON
- El JSON tiene `type` a nivel de grupo y a nivel de item
- El `type` del grupo indica cómo se conecta con el grupo ANTERIOR
- El `type` de los items indica cómo se conectan ENTRE SÍ dentro del grupo
- **Siempre pedir screenshot del tab Effects al usuario** para confirmar la estructura

### 3.3 IDs cortos vs IDs completos
- Los MCP tools a veces aceptan IDs cortos (primeros 8 chars) y a veces no
- `determinant_get` requiere UUID completo — si solo tienes el corto, usa `componentbehaviour_get` con el behaviour completo para obtener los IDs full

### 3.4 Campos hidden y copyValueFrom
- Muchos campos hidden se llenan vía `copyValueFrom` (client-side copy)
- `copyValueFrom` se ejecuta cuando el campo SOURCE cambia en el UI
- `copyValueFrom` NO se re-ejecuta después de un WIZARD save post-bot
- Si un determinante compara un campo hidden (via copyValueFrom) contra un campo de bot output, puede haber desync

### 3.5 Valores string vs boolean
- Los bots escriben "true" como STRING, no como boolean
- Los radio fields muestran "Verdadero"/"Falso" en la UI pero almacenan "true"/"false"
- Los determinantes de radio evalúan contra el string — esto generalmente funciona
- PERO: verificar siempre que el determinante correcto se esté usando (radio vs select vs text)

---

## 4. Checklist rápido por tipo de bug

### "Un componente no se muestra cuando debería"
1. ¿Tiene behaviour? → `form_component_get` para ver `behaviourId`
2. ¿Qué condiciones tiene? → `componentbehaviour_get` con el behaviourId
3. ¿El componente padre está activo? → Verificar behaviour del padre también
4. ¿Los determinantes evalúan TRUE? → Verificar valor actual de cada campo referenciado
5. ¿El default CSS incluye `deactivated`? → Necesita behaviour con `activate: true` para mostrarse

### "Un botón ejecuta un bot y todo se desordena"
1. Capturar el JSON de respuesta del bot (Network tab, response de la llamada al servicio GDB)
2. Capturar el payload del WIZARD save (Network tab, request POST posterior)
3. Comparar: ¿el WIZARD save incluye los valores correctos del formulario?
4. Verificar: ¿el WIZARD usa datos persistidos o datos del UI?
5. Ver mappings del bot: `bot_output_mapping_list` — ¿qué campos escribe?

### "Algo funciona diferente en modo edición de grid"
1. Los EditGrid tienen contexto propio — los determinantes tipo `grid` evalúan dentro de la fila
2. El WIZARD save post-bot en grid usa datos PERSISTIDOS, no el UI state
3. Si el usuario cambió un campo en la fila sin guardar → el WIZARD lo sobreescribe
4. Workaround: guardar la fila antes de ejecutar el bot

---

## 5. Herramientas MCP útiles por escenario

| Necesito... | Tool MCP |
|-------------|----------|
| Ver la estructura de un componente | `form_component_get` |
| Ver todos los hijos de un bloque | `form_component_get` (incluye children en raw) |
| Ver el behaviour de un componente | `componentbehaviour_get` (por behaviour_id) |
| Buscar behaviours de un componente | `componentbehaviour_get_by_component` |
| Ver detalles de un determinante | `determinant_get` (necesita UUID completo) |
| Buscar determinantes por nombre | `determinant_search` (por name_pattern) |
| Ver bots de un botón | `componentaction_get` o `componentaction_get_by_component` |
| Ver mappings de un bot | `bot_input_mapping_list` / `bot_output_mapping_list` |
| Buscar campos en el form | `form_query` (por label, path, type) |
| Scan automático de problemas | `debug_scan` |

---

## 6. Plantilla para documentar un bug investigado

```markdown
# [Título descriptivo del bug]

## Síntoma
Qué ve el usuario. 1-2 líneas.

## Causa raíz
Qué está mal internamente. Ser específico: campo X tiene valor Y cuando debería tener Z.

## Capa
Configuración | Datos | Plataforma | MCP

## Cadena de dependencias involucrada
Campo → Determinante → Behaviour → Componente (con IDs)

## Fix / Workaround
Qué hacer para resolverlo.

## Aprendizaje genérico
Qué patrón nuevo aprendimos que aplica más allá de este caso.
```
