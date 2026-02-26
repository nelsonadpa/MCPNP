# Conocimiento: Bitacora - Bot Interno Permisos Eventuales

## Servicio Origen: Bitacora
- **ID:** `ffe746aac09241078bad48c9b95cdfe0`

## Boton: "Eventuales"
- **Component key:** `applicantClientesYProveedores3`
- **Tipo:** button (dropdown-menu-item, size xs)
- **Ubicacion en el formulario:**
  ```
  applicantBitacoraV2
    > applicantBitacoraV2servicios
      > applicantcolumns19
        > applicantBlock22
          > applicantcolumns14
            > applicantdropdown5
  ```
- **Component Action ID:** `b2f2ef64-031c-4d06-81ac-f96d0b1c590d`
- **Action Row ID:** `c2200230-8734-4028-a71d-1ad9f1e802d9`
- **Sin comportamientos condicionales** (siempre visible)

## Bot Vinculado: INTERNO permisos eventuales - nuevo
- **Bot ID:** `a969f314-4258-40c6-b025-00fab58cda7c`
- **Tipo:** `internal`
- **Business Key:** `INTERNO permisos eventuales - modificarMyAccountPage1`

## Servicio Destino: Permisos eventuales
- **ID:** `2c918084887c7a8f01887c99ed2a6fd5`
- **Registration:** "Permiso eventual" (`2c91808d973b9d7a01975ecc39050772`)

## Mapeo de Datos (Input: Bitacora -> Permisos eventuales)

| # | Campo Origen (Bitacora)       | Campo Destino (Permisos eventuales) | Tipo Origen | Tipo Destino |
|---|-------------------------------|--------------------------------------|-------------|--------------|
| 1 | `constant_true`               | `applicantStatusLlegaDeLaBitacora`   | Boolean     | radio        |
| 2 | `constant_true`               | `permisoEventual`                    | Boolean     | checkbox     |
| 3 | `applicantNit5`               | `applicantNit3`                      | string      | textfield    |
| 4 | `applicantRadio`              | `applicantQueQuiereHacer`            | radio       | radio        |
| 5 | `applicantCompania7`          | `applicantNombreDeLaEmpresa4`        | string      | textfield    |
| 6 | `applicantContadorPermiso`    | `applicantContadorEventuales`        | Number      | number       |

## Comportamiento del Bot

1. El usuario hace clic en el boton "Eventuales" dentro del dropdown en Bitacora.
2. Se abre una **nueva solicitud** en el servicio **Permisos eventuales**.
3. Se pre-llenan 6 campos:
   - **Flag de origen:** `applicantStatusLlegaDeLaBitacora` = true (para que el servicio destino sepa que viene de Bitacora).
   - **Tipo de permiso:** `permisoEventual` = true.
   - **NIT:** se copia el NIT de la empresa (`applicantNit5` -> `applicantNit3`).
   - **Tipo de operacion:** se copia la seleccion del radio (`applicantRadio` -> `applicantQueQuiereHacer`).
   - **Nombre de empresa:** se copia el nombre (`applicantCompania7` -> `applicantNombreDeLaEmpresa4`).
   - **Contador:** se copia el valor del contador (`applicantContadorPermiso` -> `applicantContadorEventuales`).

## Patron para Replicar

Para replicar este comportamiento en otros servicios se necesita:

1. **Boton** en el formulario de Bitacora (tipo button, clase `dropdown-menu-item`).
2. **Component Action** vinculada al boton con un action row.
3. **Bot interno** con:
   - `botType: internal`
   - `botServiceId` apuntando al servicio destino
   - `dataMappings` con los campos a pre-llenar (direction: Input)
4. **Vincular** el bot al action row del component action.
