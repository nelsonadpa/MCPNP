# Catalogo Maestro de Servicios — VUCE Cuba

## Servicios Principales

| # | Servicio | Service ID | Tipo | Estado Bitacora |
|---|----------|-----------|------|-----------------|
| - | **Bitacora (Hub)** | `ffe746aac09241078bad48c9b95cdfe0` | Hub | N/A |
| - | **Acreditaciones** | `2c918084887c7a8f01888b72010c7d6e` | Standalone | N/A |

## Servicios Destino (conectados a Bitacora)

### Permisos (Block22)
| # | Servicio | Service ID | StatusBitacora | Expirado |
|---|----------|-----------|----------------|----------|
| 1 | Permiso Eventual (PE) | `2c918084887c7a8f01887c99ed2a6fd5` | Parcial | Correcto |
| 2 | Permiso Fitosanitario | `2c91808893792e2b019379310a8003a9` | OK (modelo) | Pendiente link |
| 3 | Permiso Zoosanitario | `2c91808893792e2b01938d3fd5800ceb` | Bloque incorrecto | Recrear |
| 4 | Sustancias Controladas | `8393ad98-a16d-4a2d-80d0-23fbbd69b9e7` | Bloque incorrecto | Recrear |
| 5 | Certificado Sanitario | `2c91808893792e2b0193792f8e170001` | Bloque incorrecto | Recrear |
| 6 | ONURE Equipos energia | `2c91808893792e2b01944713789f1c89` | Pendiente | Falta EditGrid? |
| 7 | ONN Instrumentos medicion | `d69e921e-62e2-4b39-9d7e-bc8f6e36a426` | Pendiente | Falta CSS |

### Registros (Block4)
| # | Servicio | Service ID | StatusBitacora | Expirado |
|---|----------|-----------|----------------|----------|
| 8 | CECMED Licencia sanitaria | `2c9180879656ae1901965aa932f60348` | Pendiente | Falta |
| 9 | Homologacion ONURE | `bf77b220-6643-4f1e-bab0-69cf808b4e42` | Pendiente | Falta |
| 10 | CyP Clientes y Proveedores | `2c918090909800d60190c16b80292f3a` | Pendiente | Falta |
| 11 | Sucursales CCRC | `2c91809196d796900196d9b69f9f0cf7` | Pendiente | Falta |
| 12 | Donativos CECMED | `a5f936ea-96ae-4ed6-9ef4-84a02b4733aa` | Pendiente | Falta |
| 13 | Cert. Origen exportacion | `8a2b5457-9656-424e-9e34-f09c27bed997` | Pendiente | Falta |
| 14 | Cert. aprobacion modelo ONN | `2c918088948ec322019499d518660007` | Pendiente | Correcto |
| 15 | INHEM Reg. sanitario | `2c91809094f110ae0195435c8fb209b6` | Bloque incorrecto | Falta |
| 16 | CENASA Reg. zoosanitario | `2c91809095d83aac0195de8f880f03cd` | Bloque incorrecto | Falta |
| 17 | Reg. Sustancias fiscalizacion | `2ef97d8e-a5c7-47e8-81de-1856675139e5` | Bloque incorrecto | Falta |
| 18 | Seg. ambiental/nuclear (ORSA) | `2c918083976cc50e01977dd5a5a90061` | Bloque incorrecto | Falta |

## Campos Clave por Servicio

| Servicio | NIT Key | Empresa Key |
|----------|---------|-------------|
| PE | `applicantNit3` | `applicantNombreDeLaEmpresa4` |
| Fito | `applicantNit` | `applicantNombreDeLaEmpresa` |
| Zoo | `applicantNit` | `applicantNombreDeLaEmpresa` |
| Sustancias | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Cert. Sanitario | `applicantNit3` | `applicantNombreDeLaEmpresa` |
| ONURE | `applicantNit` | `applicantNombreEmpresa` |
| ONN | `applicantNit` | `applicantNombreDeLaEmpresa` |
| CECMED | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Homologacion | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| CyP | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Sucursales | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Donativos | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Cert. Origen | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Cert. aprobacion ONN | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| INHEM | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| CENASA | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Reg. Sustancias fisc. | `applicantNit` | `applicantNombreDeLaEmpresa11` |
| Seg. ambiental | `applicantNit3` | `applicantNombreDeLaEmpresa11` |

**Solo PE, Cert. Sanitario, y Seg. ambiental usan `applicantNit3`** — todos los demas usan `applicantNit`.
