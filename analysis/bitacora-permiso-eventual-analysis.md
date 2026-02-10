# Analisis Completo: Bitacora + Permiso Eventual (Modelo de Replicacion)

## Servicio 1: BITACORA (Hub)
- **ID**: `ffe746aac09241078bad48c9b95cdfe0`
- **Campos**: 332 | **Determinantes**: 19 | **Bots**: 34

## Servicio 2: PERMISOS EVENTUALES (Destino)
- **ID**: `2c918084887c7a8f01887c99ed2a6fd5`
- **Campos**: 778 | **Determinantes**: 40 | **Bots**: 17 | **Roles**: 10
- **Registration**: `Permiso eventual` (ID: `2c91808d973b9d7a01975ecc39050772`)

---

## CONTRATO BITACORA <-> SERVICIO DESTINO

### Campos que el servicio destino DEBE tener para recibir datos de Bitacora:

| Campo destino | Key | Tipo | Proposito |
|---|---|---|---|
| Status llega de la bitacora | `applicantStatusLlegaDeLaBitacora` | radio | Marca que viene de bitacora (true) |
| Que quiere hacer | `applicantQueQuiereHacer` | radio | "registrarNuevo" o "modificarExistente" |
| NIT | `applicantNit3` | textfield | NIT de la empresa |
| Nombre empresa | `applicantNombreDeLaEmpresa4` | textfield | Nombre de la empresa |
| Numero de solicitud | `applicantSolicitud` | textfield | Solo en modificar: numero del PE |
| Contador eventuales | `applicantContadorEventuales` | number | Solo en modificar: cantidad existente |
| Permiso eventual | `permisoEventual` | checkbox | Solo en modificar: marca tipo PE |

### Determinantes clave en servicio destino que usan estos campos:

| Determinante | Tipo | Campo | Valor |
|---|---|---|---|
| status bitacora = TRUE | radio | `applicantStatusLlegaDeLaBitacora` | EQUAL "true" |
| status bitacora = NOT TRUE | radio | `applicantStatusLlegaDeLaBitacora` | NOT_EQUAL "true" |
| Que necesita = nuevo permiso | radio | `applicantQueQuiereHacer` | EQUAL "registrarNuevo" |
| Que necesita = modificar permiso existente | radio | `applicantQueQuiereHacer` | EQUAL "modificarExistente" |

### Workflow del servicio destino (Roles):
1. **Revision** (start_role, processing) - Primer punto
2. **Solicitud** (processing) - Asigna numero
3. **Datos complementarios** (applicant) - Vuelve al ciudadano
4. **Permiso eventual** (processing) - Aprobacion final
5. **Actualizar PE** (BotRole) - Bot actualiza en GDB
6. **Crear nuevo PE** (BotRole) - Bot crea en GDB
7. **Actualizar productos** (BotRole) - Bot actualiza productos
8. **Crear nuevos productos** (BotRole) - Bot crea productos
9. **Permiso** (BotRole) - Genera certificado

---

## PATRON DE REPLICACION

### En la BITACORA (para cada nuevo servicio):

**Paso 1**: Agregar boton en dropdown `applicantdropdown2` (Agregar)
**Paso 2**: Crear bot INTERNO "nuevo" → apunta al service_id destino
**Paso 3**: Crear bot INTERNO "modificar" → apunta al service_id destino
**Paso 4**: Crear bot LISTAR (GDB) → lee registros por NIT
**Paso 5**: Vincular component actions (boton → bot)
**Paso 6**: Mapear inputs del bot LISTAR → output al EditGrid

### En el SERVICIO DESTINO (campos obligatorios):

1. `applicantStatusLlegaDeLaBitacora` (radio) - con valores true/false
2. `applicantQueQuiereHacer` (radio) - con valores "registrarNuevo"/"modificarExistente"
3. `applicantNit3` (textfield) - para recibir el NIT
4. `applicantNombreDeLaEmpresa4` (textfield) - para recibir nombre empresa
5. `applicantSolicitud` (textfield) - para modificar: recibir numero solicitud
6. Determinantes que evaluen estos campos para mostrar/ocultar secciones

### Input mappings del bot NUEVO:
```
constant_true          → applicantStatusLlegaDeLaBitacora
applicantRadio         → applicantQueQuiereHacer
applicantNit5          → applicantNit3
applicantCompania7     → applicantNombreDeLaEmpresa4
```

### Input mappings del bot MODIFICAR:
```
constant_true                                    → applicantStatusLlegaDeLaBitacora
applicantRadio2                                  → applicantQueQuiereHacer
applicantNit5                                    → applicantNit3
applicantCompania7                               → applicantNombreDeLaEmpresa4
applicantEditGrid_collection_applicantNumero5    → applicantSolicitud
constant_true                                    → permisoEventual (checkbox)
applicantContadorPermiso                         → applicantContadorEventuales
```

### Output mappings del bot LISTAR (GDB → EditGrid en Bitacora):
```
results_collection_...hasta          → applicantEditGrid_collection_applicantExpiracion
results_collection_...num aprobacion → applicantEditGrid_collection_applicantNumero5
status                               → applicantStatusFuncionoElBot
count                                → applicantContadorPermiso
```
