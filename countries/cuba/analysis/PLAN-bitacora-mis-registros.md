# PLAN: Bitacora - Mis Registros y Permisos

**Servicio:** Bitacora (`ffe746aac09241078bad48c9b95cdfe0`)
**Fecha:** 2026-02-06 (actualizado 2026-02-07)
**Estado:** EN PROGRESO - Fase 1 bots creados, Fase 2 paneles creados, pendiente mappings UI

---

## OBJETIVO
Mostrar al usuario todos sus permisos y registros procesados/iniciados a traves de la VUCE, organizados en:
1. Un **grid resumen** consolidado con todos los tipos
2. **Grids individuales** por cada tipo de permiso/registro con mas detalle

---

## ESTRUCTURA DEL FORMULARIO

```
applicantBlock2 (Mis registros)
  |
  +-- applicantTipo3 (datagrid - RESUMEN CONSOLIDADO)  <-- YA CREADO
  |     Columnas: Tipo | Numero | Desde | Vigente hasta | Tipo de operacion
  |
  +-- [PENDIENTE] Bloques individuales por tipo:
        +-- Panel: Permisos Eventuales
        |     +-- datagrid con campos especificos de PE
        +-- Panel: Permisos Fitosanitarios
        |     +-- datagrid con campos especificos de Fito
        +-- Panel: Autorizaciones de Comercio
        |     +-- datagrid con campos especificos
        +-- Panel: Permisos Zoosanitarios
        |     +-- datagrid con campos especificos
        +-- Panel: Certificados Sanitarios
        |     +-- datagrid con campos especificos
        +-- Panel: Permisos ONURE
        |     +-- datagrid con campos especificos
        +-- Panel: Permisos ONN
        |     +-- datagrid con campos especificos
        +-- Panel: Licencias CECMED
        |     +-- datagrid con campos especificos
        +-- Panel: Permisos ORSA
        |     +-- datagrid con campos especificos
        +-- Panel: Sustancias Controladas MINSAP
        |     +-- datagrid con campos especificos
        +-- Panel: Registros CENASA
        |     +-- datagrid con campos especificos
        +-- Panel: Registros INHEM
        |     +-- datagrid con campos especificos
        +-- Panel: Contratos INHEM
        |     +-- datagrid con campos especificos
        +-- Panel: Clientes y Proveedores
        |     +-- datagrid con campos especificos
        +-- Panel: Registro MINSAP
              +-- datagrid con campos especificos
```

---

## BOTS DATA A CREAR (un bot por tipo, todos consultan por NIT)

### Grid Resumen (applicantTipo3)

Cada bot mapea al mismo grid resumen. El campo "Tipo" se llenara con logica posterior.

| # | Bot | Vista GDB | Input | Numero | Desde | Hasta | Tipo Op |
|---|-----|-----------|-------|--------|-------|-------|---------|
| 1 | VIEW PE resumen | GDB-PE(1.5)-list | NIT | Numero SE ($id:194) | Permiso eventual > desde ($id:14) | Permiso eventual > hasta ($id:15) | Operacion > tipo de operacion > value ($id:162) |
| 2 | VIEW Fito resumen | GDB-FITO2(1.1)-list | NIT | Permiso > num permiso ($id:1) | Permiso > desde ($id:14) | Permiso > hasta ($id:15) | Operacion > tipo de operacion > value ($id:162) |
| 3 | VIEW Autorizaciones resumen | GDB-PERMISOS(1.5)-list | NIT | Permiso > num resolucion ($id:62) | Permiso > desde ($id:14) | Permiso > hasta ($id:15) | Permiso > tipo de operacion > value ($id:162) |
| 4 | VIEW Zoo resumen | GDB-PERMISO ZOO(1.0)-list | NIT | num aprobacion ($id:62) | Permiso > desde ($id:14) | Permiso > hasta ($id:15) | Permiso > Tipo de operacion ($id:239) |
| 5 | VIEW Sanitario resumen | GDB-SANITARIO(1.1)-list | NIT | Numero P ($id:1) | Permiso > fecha solicitud ($id:16) | - | Operacion > Tipo de Operacion ($id:205) |
| 6 | VIEW ONURE resumen | GDB-PERMISO ONURE(1.7)-list | NIT | num aprobacion ($id:62) | Certificacion ($id:16) | Expiracion ($id:218) | Tipo de Operacion ($id:205) |
| 7 | VIEW ONN resumen | GDB-ONN(1.2)-list | NIT | Permiso > num aprobacion ($id:62) | Permiso > fecha solicitud ($id:16) | - | Operacion > Tipo de Operacion ($id:205) |
| 8 | VIEW ORSA resumen | GDB-ORSA* | NIT | num aprobacion ($id:62) | F solicitud ($id:16) | Hasta ($id:207) | Tipo de Permiso ($id:206) |
| 9 | VIEW Sust.Controladas resumen | GDB-SUSTANCIAS* | NIT | No certificado ($id:8) | Desde ($id:4) | Hasta ($id:5) | - |
| 10 | VIEW CECMED resumen | GDB-CECMED(1.4)-list | NIT | num licencia ($id:62) | Emision ($id:15) | Vence ($id:14) | tipo de operacion ($id:235) |
| 11 | VIEW CENASA resumen | GDB-CENASA* | NIT | num solicitud ($id:62) | Registro > desde ($id:14) | Registro > hasta ($id:15) | Operacion > tipo de operacion > value ($id:162) |
| 12 | VIEW INHEM resumen | GDB-REG INHEM* | NIT | No licencia ($id:239) | fecha aprobacion ($id:240) | Vigencia ($id:241) | Tipo de registro ($id:226) |
| 13 | VIEW Contrato INHEM resumen | GDB-CONTRATOS INHEM* | NIT | Contrato ($id:5) | FECHA ($id:4) | - | - |
| 14 | VIEW Clientes Prov resumen | GDB-CLIENTES PROVEEDORES(1.4)-list | NIT | Codigo ($id:227) | Desde ($id:54) | Hasta ($id:55) | - |
| 15 | VIEW Registro MINSAP resumen | GDB-REG MINSAP* | NIT | No registro ($id:2) | Fecha ($id:3) | - | - |

*Nota: Las vistas marcadas con * puede que no existan aun como GDB-list y habria que verificar/crear.*

### Grid Target (todos mapean a):
- `applicantTipo3_collection_applicantNumero4` <- Numero
- `applicantTipo3_collection_applicantDesde2` <- Desde
- `applicantTipo3_collection_applicantVigenteHasta2` <- Hasta
- `applicantTipo3_collection_applicantTipoDeOperacion12` <- Tipo Op

### Bots Creados (IDs para referencia):

| # | Bot Name | Bot ID | GDB Source |
|---|----------|--------|------------|
| 1 | VIEW PE resumen | `02542a10-74d1-4325-a872-b1b0f8dd8f4b` | PE(1.5)-list |
| 2 | VIEW Fito resumen | `ce641081-9de0-4930-aac9-6cb34f455e3c` | FITO2(1.1)-list |
| 3 | VIEW Autorizaciones resumen | `f0e6c217-7afc-4d47-ac95-ab5ca05f1e88` | PERMISOS(1.5)-list |
| 4 | VIEW Zoo resumen | `dc18c028-6114-460d-97a3-ca45e0a5cb66` | PERMISO ZOO(1.0)-list |
| 5 | VIEW Sanitario resumen | `007d68f2-73b6-44be-9406-304ddd4f7523` | SANITARIO(1.1)-list |
| 6 | VIEW ONURE resumen | `09880707-169e-4f91-8095-b56dec472b49` | PERMISO ONURE(1.7)-list |
| 7 | VIEW ONN resumen | `28d1f1cc-f1a5-4326-b422-77f3cb1b708b` | ONN(1.2)-list |
| 8 | VIEW ORSA resumen | `ad774604-eb6c-4ba7-851a-9b6cdefa5a39` | ORSA-list |
| 9 | VIEW Sust.Controladas resumen | `19dc4c92-7711-4ad2-ad4e-e053b98bf230` | SUSTANCIAS-list |
| 10 | VIEW CECMED resumen | `13404283-d1dd-4c89-b71c-2052e2a36e67` | CECMED(1.4)-list |
| 11 | VIEW CENASA resumen | `f7ec46c9-8c5f-4044-8e38-6db0d028d35e` | CENASA-list |
| 12 | VIEW INHEM resumen | `7f3d22eb-eba7-47f1-86d7-b3c3b73a92b5` | REG INHEM-list |
| 13 | VIEW Contrato INHEM resumen | `c9e74013-a1e6-4a2f-9fc3-332946e333ff` | CONTRATOS INHEM-list |
| 14 | VIEW Clientes Prov resumen | `20462be7-d5fe-45ad-836f-e3211759f5a7` | CLIENTES PROVEEDORES(1.4)-list |
| 15 | VIEW Registro MINSAP resumen | `53f917ba-5b83-45e4-9dbe-80805fc53730` | REG MINSAP-list |

### Component Action:
Todos los bots se vinculan al `applicantBlock2` como action rows en un unico component action.

---

## BASES DE DATOS GDB (16 databases en PartC)

| # | Database | Code | PK | Campo NIT |
|---|----------|------|----|-----------|
| 1 | USUARIOS | clientes | numero ($id:115) | NIT ($id:177) - FK master a todas |
| 2 | DERECHOS | derechos | ID ($id:1) | Entidad > NIT ($id:3) |
| 3 | Permisos eventuales | pe | Numero PE ($id:1) | NIT ($id:64) |
| 4 | Fito 2 | fito2 | Permiso > num permiso ($id:1) | NIT ($id:64) |
| 5 | PERMISOS (autorizaciones) | permisos | Numero ($id:1) | NIT ($id:64) |
| 6 | permisos Zoosanitaro | permiso zoo | Numero P ($id:1) | NIT ($id:64) |
| 7 | Permiso sanitario | sanitario | Numero P ($id:1) | NIT ($id:64) |
| 8 | Permisos ORSA | orsa | Numero P ($id:1) | NIT ($id:64) |
| 9 | Permisos ONN | onn | Numero P ($id:1) | NIT ($id:64) |
| 10 | Permiso ONURE | permiso onure | Numero P ($id:1) | NIT ($id:64) |
| 11 | Permiso Sustancias controladas | sustancias controladas | ID ($id:1) | NIT ($id:13) |
| 12 | Registros CECMED | cecmed | num solicitud ($id:1) | NIT ($id:64) |
| 13 | Registros CENASA | cenasa | num Licencia ($id:1) | NIT ($id:64) |
| 14 | Registro INHEM | reg inhem | Num solicitud ($id:1) | NIT ($id:64) |
| 15 | Contratos INHEM | contratos inhem | ID ($id:1) | NIT ($id:11) |
| 16 | Clientes y Proveedores | clientes proveedores | Codigo ($id:227) | codigo empresa ($id:229) |
| 17 | Registro MINSAP | registro minsap | ID ($id:1) | NIT ($id:4) |

---

## CHECKLIST DE EJECUCION

### Fase 1: Grid Resumen Consolidado
- [x] Crear bloque `applicantBlock2` (Mis registros)
- [x] Crear datagrid `applicantTipo3` con 5 columnas (Tipo, Numero, Desde, Hasta, Tipo Op)
- [x] Crear bots data individuales (15 bots) - COMPLETADO via MCP
- [ ] Configurar data mappings Input (NIT) para cada bot - requiere UI
- [ ] Configurar data mappings Output al grid resumen para cada bot - requiere UI
- [ ] Vincular todos los bots al applicantBlock2 via component action - requiere UI
- [ ] Probar con un NIT real que tenga datos
- [ ] Resolver campo "Tipo" (formula, constante, o logica)

### Fase 2: Grids Individuales por Tipo - COMPLETADO via MCP
- [x] Crear panel + datagrid para Permisos Eventuales (`applicantPanelPE` > `applicantGridPE`)
- [x] Crear panel + datagrid para Permisos Fitosanitarios (`applicantPanelFito` > `applicantGridFito`)
- [x] Crear panel + datagrid para Autorizaciones de Comercio (`applicantPanelAutorizaciones` > `applicantGridAutorizaciones`)
- [x] Crear panel + datagrid para Permisos Zoosanitarios (`applicantPanelZoo` > `applicantGridZoo`)
- [x] Crear panel + datagrid para Certificados Sanitarios (`applicantPanelSanitario` > `applicantGridSanitario`)
- [x] Crear panel + datagrid para Permisos ONURE (`applicantPanelONURE` > `applicantGridONURE`)
- [x] Crear panel + datagrid para Permisos ONN (`applicantPanelONN` > `applicantGridONN`)
- [x] Crear panel + datagrid para Licencias CECMED (`applicantPanelCECMED` > `applicantGridCECMED`)
- [x] Crear panel + datagrid para Permisos ORSA (`applicantPanelORSA` > `applicantGridORSA`)
- [x] Crear panel + datagrid para Sustancias Controladas MINSAP (`applicantPanelSustancias` > `applicantGridSustancias`)
- [x] Crear panel + datagrid para Registros CENASA (`applicantPanelCENASA` > `applicantGridCENASA`)
- [x] Crear panel + datagrid para Registros INHEM (`applicantPanelINHEM` > `applicantGridINHEM`)
- [x] Crear panel + datagrid para Contratos INHEM (`applicantPanelContratosINHEM` > `applicantGridContratosINHEM`)
- [x] Crear panel + datagrid para Clientes y Proveedores (`applicantPanelClientesProv` > `applicantGridClientesProv`)
- [x] Crear panel + datagrid para Registro MINSAP (`applicantPanelMINSAP` > `applicantGridMINSAP`)
- [ ] Crear bots data para cada grid individual
- [ ] Configurar mappings detallados por cada tipo

### Fase 3: Patrones y Botones de Accion
- [ ] Agregar botones "Nuevo" en cada panel individual (patron bot interno)
- [ ] Agregar botones "Modificar" donde aplique
- [ ] Configurar determinantes de visibilidad
- [ ] Aplicar patrones del dropdown existente

### Fase 4: Limpieza y Optimizacion
- [x] Resolver bug de traducciones (50 traducciones vacias causan loop i18n) - RESUELTO por Nelson manualmente
- [ ] Revisar debug_scan del servicio
- [ ] Optimizar carga de bots (paralelizar donde sea posible)

---

## NOTAS TECNICAS

### El campo "Tipo" en el grid resumen
Opciones para diferenciarlo:
1. **Formula en el bot:** El bot podria setear un valor constante, pero BPA no soporta constantes de texto en mappings output
2. **Campo calculado:** Usar una formula en el componente que derive el tipo del path del dato
3. **Post-procesamiento:** Llenar con logica JS custom despues de que todos los bots corran
4. **DECISION PENDIENTE** - ver con el equipo

### Vistas GDB que puede que no existan como -list:
- ORSA
- Sustancias controladas
- CENASA
- Registro INHEM
- Contratos INHEM
- Registro MINSAP
Verificar en PartC si existen las vistas list para estas databases.

### Mappings especiales:
- Fito y PE: el campo "tipo de operacion" es un catalog (key/value), mapear el `.value`
- Autorizaciones (permisos): el tipo de operacion tambien es catalog
- Zoo: "Tipo de operacion" es string directo ($id:239)
- CECMED: "tipo de operacion" es string directo ($id:235)

### Grids Individuales - Referencia de Keys (Fase 2):

| Panel Key | Grid Key | Columnas (keys) |
|-----------|----------|-----------------|
| applicantPanelPE | applicantGridPE | _numero, _desde, _hasta, _tipoOp, _estado |
| applicantPanelFito | applicantGridFito | _numero, _desde, _hasta, _tipoOp, _estado |
| applicantPanelAutorizaciones | applicantGridAutorizaciones | Aut_numero, Aut_desde, Aut_hasta, Aut_tipoOp, Aut_estado |
| applicantPanelZoo | applicantGridZoo | _numero, _desde, _hasta, _tipoOp, _estado |
| applicantPanelSanitario | applicantGridSanitario | San_numero, San_fechaSol, San_tipoOp, San_estado |
| applicantPanelONURE | applicantGridONURE | _numero, _certificacion, _expiracion, _tipoOp, _estado |
| applicantPanelONN | applicantGridONN | _numero, _fechaSol, _tipoOp, _estado |
| applicantPanelCECMED | applicantGridCECMED | _numero, _emision, _vence, _tipoOp, _estado |
| applicantPanelORSA | applicantGridORSA | _numero, _fechaSol, _hasta, _tipoPerm, _estado |
| applicantPanelSustancias | applicantGridSustancias | Sust_noCert, Sust_desde, Sust_hasta, Sust_estado |
| applicantPanelCENASA | applicantGridCENASA | _numero, _desde, _hasta, _tipoOp, _estado |
| applicantPanelINHEM | applicantGridINHEM | _noLicencia, _fechaAprob, _vigencia, _tipoReg, _estado |
| applicantPanelContratosINHEM | applicantGridContratosINHEM | ConINHEM_contrato, ConINHEM_fecha, ConINHEM_estado |
| applicantPanelClientesProv | applicantGridClientesProv | CliProv_codigo, CliProv_desde, CliProv_hasta, CliProv_estado |
| applicantPanelMINSAP | applicantGridMINSAP | _noReg, _fecha, _estado |

*Los prefijos de columnas son: applicantGrid[Grid]_[columna]. Ej: applicantGridPE_numero*
