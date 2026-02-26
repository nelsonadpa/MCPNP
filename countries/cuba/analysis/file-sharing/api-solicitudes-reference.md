# API de Solicitudes — Referencia para Integración

Documentación de la API que alimenta la tabla "Solicitudes" del dashboard Part A, y el endpoint para compartir expedientes.

---

## 1. Listar Expedientes del Usuario

### `GET /api/v1/current-user-files/`

Retorna los expedientes del usuario autenticado, paginados.

**Autenticación**: Cookie de sesión (el usuario ya está logueado en el dashboard).

### Parámetros de consulta

| Parámetro | Tipo | Requerido | Ejemplo | Descripción |
|-----------|------|:---------:|---------|-------------|
| `page` | int | No (default: 1) | `?page=2` | Número de página |
| `page_size` | int | No (default: 10) | `?page_size=25` | Resultados por página. Si `<= 0`, retorna todos |
| `ordering` | string | No (default: `-created_at`) | `?ordering=-submitted_at` | Campo de ordenamiento. Prefijo `-` = descendente |
| `state` | string | No | `?state=IN_PROCESS` | Filtrar por estado. Acepta múltiples separados por coma: `?state=NEW,IN_PROCESS` |
| `service` | string | No | `?service=certificado` | Busca en nombre de servicio (case-insensitive, incluye traducciones) |
| `company` | string | No | `?company=acme` | Busca en `data["listing-value"]`, `meta_data`, `business_entity.name` |
| `business_entity` | UUID o string | No | `?business_entity=uuid` | Si es UUID válido, filtra exacto. Si es texto, busca en nombre |
| `created_at` | date/datetime | No | `?created_at=2026-02-20` | Filtrar por fecha de creación exacta |

### Campos de ordenamiento válidos

```
created_at       -created_at       (default)
submitted_at     -submitted_at     (NULLs al final)
service__name    -service__name
```

### Quién ve qué expedientes

El endpoint retorna expedientes donde el usuario cumple **cualquiera** de estas condiciones:

```
1. Es dueño          →  file.user == usuario_actual
2. Miembro de empresa →  file.business_entity tiene al usuario como miembro
3. Delegado           →  usuario_actual.email está en file.allowed_users
```

Adicionalmente, solo se muestran expedientes de servicios que pertenecen al dominio actual (multi-tenancy).

### Respuesta

```json
{
  "count": 476,
  "next": "https://example.com/api/v1/current-user-files/?page=2",
  "previous": null,
  "results": [
    {
      "file_id": "550e8400-e29b-41d4-a716-446655440000",
      "state": "NEW",
      "process_instance_id": null,
      "created_at": "2026-02-20T10:30:00+00:00",
      "submitted_at": null,
      "metadata": "Certificado de importación - Donativo #123",
      "service_id": "cert-import-donativos",
      "service_name": "Certificado de importación para donativos médicos",
      "business_entity_name": null,
      "certificates": [],
      "tasks": [],
      "user": {
        "username": "juan.perez"
      }
    }
  ]
}
```

### Campos de cada expediente en la respuesta

| Campo | Tipo | Descripción | Columna en tabla |
|-------|------|-------------|------------------|
| `file_id` | UUID string | Identificador único del expediente | — (usado para links) |
| `service_name` | string | Nombre del servicio (traducido) | **Servicio** |
| `metadata` | string \| null | Nombre de despliegue (ej. nombre empresa) | **Solicitante** |
| `business_entity_name` | string \| null | Nombre de la empresa asociada | **Solicitante** (fallback) |
| `created_at` | ISO 8601 \| null | Fecha de creación | **Fecha de creación** |
| `submitted_at` | ISO 8601 \| null | Fecha de envío a gobierno | **Enviado** |
| `state` | string | Estado actual (ver tabla abajo) | **Estado actual** |
| `certificates` | array | Certificados emitidos | **Certificados** |
| `process_instance_id` | string \| null | ID del proceso en Camunda | — (interno) |
| `tasks` | array | Tareas visibles para el solicitante | — (estado detallado) |
| `user` | object | Dueño del expediente `{username}` | — (control de acceso) |
| `service_id` | string | ID del servicio | — (interno) |

### Valores posibles de `state`

| Valor | Etiqueta en UI | Descripción |
|-------|---------------|-------------|
| `NEW` | Borrador | En edición, no enviado |
| `IN_PROCESS` | En proceso | Enviado, en revisión gubernamental |
| `filepending` | Pendiente | Esperando acción del ciudadano |
| `filevalidated` | Validado | Validado por el oficial |
| `applicantPayment` | Pago pendiente | Esperando pago del ciudadano |
| `filedecline` | Devuelto | Devuelto para correcciones |
| `filereject` | Rechazado | Rechazado permanentemente |
| `ended` | Completado | Aprobado, certificados emitidos |
| `cancelled` | Cancelado | Cancelado |

---

## 2. Compartir un Expediente

### `POST /api/v1/access-to-file/`

Agrega un email a la lista `allowed_users` de un expediente. El usuario con ese email verá el expediente en su propia tabla de solicitudes.

**Autenticación**: Cookie de sesión o JWT Bearer token.

**Autorización**: Solo puede compartir:
- El **dueño** del expediente (`file.user`)
- Un usuario **staff** o **superuser**

### Request

```http
POST /api/v1/access-to-file/
Content-Type: application/json

{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "allowed_users": ["delegado@example.com"]
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `file_id` | string (UUID) | Sí | ID del expediente a compartir |
| `allowed_users` | array de strings | Sí | Lista de emails a agregar |

### Comportamiento

1. Valida el formato del payload
2. Busca el expediente por `file_id` — **404** si no existe
3. Valida cada email (formato válido) — **400** si alguno es inválido
4. **Auto-crea cuentas de usuario** para emails que no existen en el sistema
5. **Acumula emails** por unión de conjuntos (no duplicados, no remueve existentes)
6. Retorna la lista actualizada

### Respuestas

**200 — Éxito**:
```json
{
  "allowed_users": [
    "delegado@example.com",
    "otro.usuario@example.com"
  ]
}
```

**400 — Email inválido o payload mal formado**:
```json
{
  "allowed_users": [
    "email: `email` is invalid, please enter a valid email!"
  ]
}
```

**403 — No es dueño ni staff**:
```
"You do not have permission to access this resource"
```

**404 — Expediente no encontrado**:
```json
{
  "detail": "Not found."
}
```

### Idempotencia

Seguro. Llamar múltiples veces con el mismo email no produce duplicados. Los emails se acumulan (unión de conjuntos). **No existe mecanismo para remover emails**.

---

## 3. Ejemplos de Uso

### 3a. Obtener todos los expedientes en borrador

```http
GET /api/v1/current-user-files/?state=NEW&ordering=-created_at
```

### 3b. Obtener expedientes en proceso y devueltos

```http
GET /api/v1/current-user-files/?state=IN_PROCESS,filedecline&ordering=-submitted_at
```

### 3c. Buscar expedientes por nombre de servicio

```http
GET /api/v1/current-user-files/?service=certificado+importacion
```

### 3d. Buscar expedientes por empresa

```http
GET /api/v1/current-user-files/?company=farmacia
```

### 3e. Página 3 con 25 resultados por página

```http
GET /api/v1/current-user-files/?page=3&page_size=25
```

### 3f. Todos los expedientes sin paginar

```http
GET /api/v1/current-user-files/?page_size=0
```

### 3g. Compartir expediente con un usuario

```http
POST /api/v1/access-to-file/
Content-Type: application/json

{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "allowed_users": ["maria.garcia@example.com"]
}
```

### 3h. Compartir expediente con múltiples usuarios a la vez

```http
POST /api/v1/access-to-file/
Content-Type: application/json

{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "allowed_users": [
    "maria.garcia@example.com",
    "pedro.lopez@example.com"
  ]
}
```

### 3i. Ejemplo completo con curl

```bash
# 1. Listar mis expedientes (con sesión autenticada)
curl -b cookies.txt \
  "https://cuba.eregistrations.org/api/v1/current-user-files/?page=1&page_size=10"

# 2. Compartir un expediente
curl -b cookies.txt \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"file_id": "550e8400-e29b-41d4-a716-446655440000", "allowed_users": ["delegado@example.com"]}' \
  "https://cuba.eregistrations.org/api/v1/access-to-file/"

# 3. Verificar que el expediente ahora tiene al delegado
#    (el delegado verá este expediente en SU dashboard)
```

---

## 4. Flujo Completo de Compartir

```
┌──────────────────────────────────────────────────────────────────┐
│  Usuario A (dueño)                                               │
│                                                                  │
│  1. Ve su tabla de Solicitudes                                   │
│     GET /api/v1/current-user-files/                              │
│     → Aparecen sus 476 expedientes                               │
│                                                                  │
│  2. Hace clic en "Compartir" en un expediente                    │
│     → Se abre input de email                                     │
│                                                                  │
│  3. Ingresa: delegado@example.com                                │
│     POST /api/v1/access-to-file/                                 │
│     { "file_id": "...", "allowed_users": ["delegado@..."] }      │
│     → 200 OK                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Usuario B (delegado@example.com)                                │
│                                                                  │
│  1. Inicia sesión en eRegistrations                              │
│                                                                  │
│  2. Ve su tabla de Solicitudes                                   │
│     GET /api/v1/current-user-files/                              │
│     → El expediente compartido aparece en la tabla               │
│       (filtro: allowed_users__contains=[user.email])             │
│                                                                  │
│  3. Puede: ver, editar datos, subir documentos, reenviar         │
│     (según el estado del expediente)                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Estructura de la Base de Datos

### Campo clave: `File.allowed_users`

```
Tabla:   applicant_file_file
Columna: allowed_users (jsonb)
Default: []
Null:    No permitido
```

**Contenido**: Array JSON de emails.

```json
["delegado@example.com", "otro@example.com"]
```

**Consulta PostgreSQL equivalente** (para referencia):

```sql
-- Expedientes donde el usuario es dueño O delegado
SELECT * FROM applicant_file_file
WHERE user_id = 123
   OR allowed_users @> '["delegado@example.com"]'::jsonb;
```

El operador `@>` de PostgreSQL verifica que el array JSON **contiene** el elemento exacto. No hace coincidencia parcial (a diferencia de `LIKE` o `ILIKE`).

---

## 6. Notas para la Implementación Frontend

### Lo que ya existe y funciona

| Componente | Estado |
|------------|--------|
| Campo `allowed_users` en la BD | Existe (migración 0036, julio 2024) |
| Endpoint `POST /api/v1/access-to-file/` | Funciona, probado |
| Filtro de visibilidad en el listing | Incluye `allowed_users` |
| Permisos de objeto (`MyFilePermission`) | Verifican `allowed_users` |
| Auto-creación de usuarios | El serializer crea User si el email no existe |

### Lo que falta (frontend)

| Componente | Archivo | Cambio |
|------------|---------|--------|
| Botón "Compartir" en cada fila | `parta_dashboard.html` | Agregar icono en columna de acciones |
| Input de email + confirmación | `user.applications.controller.js` | Popover con campo email (patrón existente: confirmDeleteFile) |
| Llamada al API | `backend.provider.js` | Agregar método `shareFile(file_id, email)` |

### Consideraciones

1. **Solo el dueño puede compartir** — el botón debe mostrarse solo cuando `f.user.username === user_appctrl.username`
2. **Funciona en cualquier estado** — el endpoint no filtra por estado
3. **No hay confirmación visual en la tabla** — el delegado simplemente verá el expediente en su propio dashboard
4. **No hay forma de revocar** — una vez compartido, no se puede descompartir (v2)
