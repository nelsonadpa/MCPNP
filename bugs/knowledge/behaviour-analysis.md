# Behaviour Analysis Guide

Cómo analizar cadenas de behaviours y determinantes en BPA.

---

## 1. Estructura de un behaviour

```
Behaviour (ID)
├── Effect (ID)
│   ├── Determinant Groups []
│   │   ├── Group 1 { type: "AND"|"OR", items: [...] }
│   │   ├── Group 2 { type: "AND"|"OR", items: [...] }
│   │   └── Group N ...
│   └── Property Effects []
│       ├── { name: "show", value: "true" }
│       ├── { name: "activate", value: "true" }
│       └── { name: "disabled", value: "false" }
```

### Reglas de evaluación AND/OR

- El `type` del **grupo** indica cómo se conecta con el grupo **anterior**
  - Grupo 1 siempre es el primero (su `type` no conecta con nada previo)
  - Grupo 2 con `type: "AND"` → `Group1 AND Group2`
  - Grupo 3 con `type: "OR"` → `(Group1 AND Group2) OR Group3`
- El `type` de los **items** dentro de un grupo indica cómo se conectan entre sí
  - Items con `type: "OR"` → se evalúan como OR entre ellos
  - Items con `type: "AND"` → se evalúan como AND entre ellos

### Ejemplo real

```
Group 1 (type: AND):  [item OR: balance, item OR: medición, item OR: combinado]
Group 2 (type: AND):  [item: actividad hidden = GDB]
Group 3 (type: OR):   [item OR: Frío, item OR: Vapor, item OR: Calor]
```

Evalúa como:
```
((balance OR medición OR combinado) AND (actividad = GDB)) OR (Frío OR Vapor OR Calor)
```

---

## 2. CRÍTICO: El MCP puede omitir grupos

**Problema confirmado**: el MCP tool `componentbehaviour_get` puede devolver menos grupos de los que existen en la UI de admin.

**Siempre verificar contra screenshot del tab Effects en la UI de admin.**

Caso documentado: behaviour con 3 grupos en UI, MCP devolvió solo 2 (omitió el grupo del medio con un solo determinante).

---

## 3. Property effects y default behaviour

| Propiedad | Efecto cuando `true` |
|-----------|---------------------|
| `show` | Componente visible |
| `activate` | Componente activo (remueve clase `deactivated`) |
| `disabled` | Componente deshabilitado (no editable) |

### Default behaviour
- Si el componente tiene `customClass: "deactivated"` → está desactivado por defecto
- Necesita un behaviour con `activate: true` para activarse
- Si el behaviour evalúa FALSE → vuelve al default (desactivado)

### Herencia padres-hijos
- Si el PADRE está desactivado, los hijos NO se muestran aunque sus propios behaviours evalúen TRUE
- Verificar siempre la cadena completa: padre → hijo → nieto

---

## 4. Tipos de determinantes

| Tipo | Qué evalúa | Notas |
|------|------------|-------|
| `text` | Campo texto = valor | Comparación string exacta |
| `select` | Campo select = valor del catálogo | Usa el key del catálogo |
| `radio` | Campo radio = true/false | ⚠️ El MCP no tiene `radiodeterminant_create` |
| `boolean` | Campo boolean = true/false | Diferente de radio |
| `numeric` | Campo numérico con operador | EQUAL, GREATER_THAN, etc. |
| `date` | Campo fecha con operador | Soporta `isCurrentDate` |
| `grid` | Evalúa dentro de fila de EditGrid | `json_condition` no visible via MCP |
| `classification` | Campo clasificación | Jerárquico |

### Grid determinants — caso especial
- Evalúan condiciones DENTRO de una fila de EditGrid
- Pueden comparar dos campos de la misma fila entre sí
- El MCP `determinant_get` devuelve `json_condition: null` para grid — no puedes ver la condición interna
- Para entender qué compara: buscar el nombre del determinante y los campos que referencia

---

## 5. Patrón: campos hidden de comparación

Patrón común en servicios complejos:

```
[Select/Catalog visible] --copyValueFrom--> [Text Hidden A]
[Bot output]             --bot mapping-->   [Text Hidden B]
[Determinante]           --compara-->       A == B
```

### Cómo se rompe
1. `copyValueFrom` se ejecuta en el cliente cuando el usuario interactúa
2. Bot output se escribe por el WIZARD save
3. Si el timing no coincide (ej. WIZARD save no dispara copyValueFrom), A y B pueden diferir
4. El determinante evalúa FALSE aunque ambos valores sean "iguales" visualmente

### Cómo investigar
1. `form_component_get` del campo hidden A → ver `copyValueFrom`
2. `bot_output_mapping_list` → ver qué bot escribe al campo hidden B
3. Verificar ambos valores en la UI (hacer scroll a los campos hidden)
4. Si difieren → el bug es de timing/sync entre copyValueFrom y WIZARD

---

## 6. Patrón: status fields como flags de bot

Patrón para controlar secciones post-bot:

```
[Status Radio] --behaviour--> se activa cuando [Método = X]
[Bot]          --output-->    escribe "true" al [Status Radio]
[Sección]      --behaviour--> se muestra cuando [Status = true] AND [otras condiciones]
```

### Verificaciones
1. ¿El status field tiene behaviour que lo activa para el método correcto?
2. ¿El bot tiene output mapping al status field?
3. ¿El bot mapea MÚLTIPLES status fields al MISMO campo GDB? (pueden todos quedar en "true")
4. ¿Los status fields NO activos se consideran en determinantes? (si están deactivated, su valor puede ignorarse)
