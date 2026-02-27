# Bot Investigation Guide

Cómo rastrear la ejecución de bots, sus efectos y el WIZARD save.

---

## 1. Anatomía de una ejecución de bot en un formulario

```
Usuario click en botón
    ↓
ComponentAction define qué bot(s) ejecutar (con sort order)
    ↓
Bot(s) se ejecutan secuencialmente contra servicio GDB
    ↓
GDB retorna respuesta JSON
    ↓
Outputs del bot se mapean a campos del formulario
    ↓
WIZARD auto-save se dispara (POST /api/wizard/...)
    ↓
WIZARD construye payload: datos persistidos + outputs del bot
    ↓
Save response actualiza el UI
    ↓
Behaviours se re-evalúan con los nuevos valores
```

---

## 2. Cómo investigar un bot

### Paso 1: Identificar el bot desde el botón
```
form_component_get(component_key) → componentActionId
componentaction_get(componentActionId) → lista de bots con sort order
```

### Paso 2: Ver inputs del bot
```
bot_input_mapping_list(bot_id) → qué campos del form se envían al GDB
```
Verificar: ¿los campos de input tienen valor al momento de ejecutar?

### Paso 3: Ver outputs del bot
```
bot_output_mapping_list(bot_id) → qué campos del GDB se escriben al form
```
Verificar: ¿qué campos se sobreescriben? ¿hay conflictos?

### Paso 4: Capturar la ejecución real
- Network tab del browser
- Buscar la llamada al servicio GDB (request + response)
- Buscar el WIZARD save posterior (request payload)

---

## 3. El WIZARD save — fuente de bugs

### Qué es
Después de que un bot se ejecuta, el sistema hace un auto-save para persistir los outputs del bot. Este save se llama "WIZARD save".

### Cómo construye el payload
1. Lee los datos **persistidos** del formulario (los que están en base de datos)
2. Mergea los outputs del bot sobre estos datos
3. Envía el resultado como POST

### ⚠️ BUG CONOCIDO: Grid + cambios no guardados
**Cuando el bot se ejecuta dentro de un EditGrid en modo edición:**
- El WIZARD lee los datos persistidos de la FILA del grid
- Si el usuario cambió campos en la fila SIN guardar → esos cambios se PIERDEN
- El WIZARD sobreescribe el UI con los datos persistidos + outputs del bot
- Resultado: los cambios del usuario se revierten silenciosamente

**Workaround**: Guardar la fila del grid ANTES de ejecutar el bot.

---

## 4. Múltiples bots mapeando al mismo campo GDB

### El problema
Si un bot tiene múltiples output mappings que apuntan al MISMO campo del GDB (ej. `status`), TODOS los campos destino reciben el mismo valor.

### Ejemplo real
```
Bot "EmisionesGEI Leer" outputs:
  applicantStatusBalanceDeMasas     → GDB.status = "true"
  applicantStatusCombinado          → GDB.status = "true"
  applicantStatusMedicionDirecta    → GDB.status = "true"
```

Los tres status fields reciben "true" independientemente del método de cálculo seleccionado. La diferenciación depende de los **behaviours** de cada status field (que los activan/desactivan según el método).

### Implicación
- No confiar solo en el valor del status — verificar también si el componente está ACTIVO
- Un campo con valor "true" pero behaviour desactivado puede NO satisfacer un determinante

---

## 5. Captura de Network tab — qué buscar

### Request del bot (llamada GDB)
```
POST /api/bot/execute o similar
Response JSON: { campo1: valor1, campo2: valor2, ... }
```
- Verificar qué valores retorna el GDB
- Campos de status ("true"/"false")
- Campos de datos (valores numéricos, textos, catálogos)

### WIZARD save
```
POST /api/wizard/...
Request body: { applicantCampo1: valor1, applicantCampo2: valor2, ... }
```
- **Este es el payload más importante**
- Comparar cada campo contra lo que el usuario tenía en el UI
- Buscar campos que muestren el valor VIEJO (persistido) en vez del valor del UI
- Los outputs del bot deberían estar presentes con los valores nuevos

### Qué indica un bug de plataforma
Si en el payload del WIZARD save ves:
- Un campo que el usuario CAMBIÓ en el UI pero el payload tiene el valor VIEJO → bug de WIZARD
- Campos del bot con valores correctos PERO campos del usuario con valores viejos → confirma que el WIZARD lee de persistidos, no del UI

---

## 6. Checklist de investigación de bot

- [ ] ¿Qué bot(s) se ejecutan? (componentaction → bots con sort order)
- [ ] ¿Qué GDB service llama cada bot?
- [ ] ¿Qué inputs envía? ¿Tienen valor correcto al momento de ejecutar?
- [ ] ¿Qué outputs recibe? ¿A qué campos mapea?
- [ ] ¿Hay campos mapeados al MISMO campo GDB? (duplicación de outputs)
- [ ] ¿El WIZARD save incluye los valores correctos del formulario?
- [ ] ¿Los behaviours downstream se re-evalúan correctamente después del save?
- [ ] Si es grid: ¿el usuario tenía cambios no guardados en la fila?
