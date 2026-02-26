# Response: Oraculo → Forjador
**Date**: 2026-02-22 14:35
**Re**: CENASA structure extraction

## Service Summary
| Field | Value |
|-------|-------|
| Name | Registros Zoosanitarios del CENASA |
| ID | `2c91809095d83aac0195de8f880f03cd` |
| Registrations | 2 (Medicamentos veterinarios + Alimentacion animal) |
| Components | 135 |
| Fields | 455 |
| Bots | 10 |
| Determinants | 20 |

## Form Hierarchy (Applicant)
```
applicantBlock6  "Su empresa seleccionada"
  applicantEmpresas (content)
  applicantcolumns12
    applicantTipoDeRegistro (radio: medicamento/alimento)

applicantBlock2  "Datos ocultos"
  applicantBlock11  "Llega de la bitacora"
    applicantcolumns13
      applicantStatusLlegaDeLaBitacora (radio) <-- RECEIVER
  applicantBlock19  "Que quiere hacer?"
    applicantQueQuiereHacer (columns)
      applicantQueQuiereHacerRegistrarNuevo (radio)
      applicantQueQuiereHacerModificar (radio)
      applicantQueQuiereHacerRenovar (radio)
      applicantQueQuiereHacerConsultar (radio)
      applicantQueQuiereHacerCancelar (radio)
  applicantBlock14  "Contadores"
    applicantContador (number)
    applicantNoLicencia (textfield)
    applicantBlock17  "Permiso que quiere modificar"
    applicantBlock18  "Trigger block: Leer permiso y productos"

applicantBlock  "Datos ocultos" (hidden fields)
  applicantcolumns10
    applicantNombreDeLaEmpresa11 (textfield) <-- RECEIVER Empresa
    applicantNit (textfield) <-- RECEIVER NIT
  applicantcolumns11
    applicantAlimento (textfield)
    applicantMedicamentos (textfield)

applicantBlock9  "Consultar el registro"
  applicantBlock16  "Registro de certificados sanitarios"
    (search + datagrid results)

applicantBlock10  "Modificar o Renovar Registro"
  applicantBlock15  (search by No. Registro)
  applicantcolumns2  (renovar, declaracion cambio, etc.)
  applicantcolumns7  (instalaciones, equipamiento, etc.)

applicantBlock3  "Registrar nuevo"
  applicantBlock8  "Producto" (16 fields)
  applicantBlock7  "Titular" (7 fields)
  applicantBlock4  "Representante"
  applicantBlock5  "Persona que realiza el tramite"

applicantBlock13  (Continuar button)
```

## Key Receiver Fields
| Field | Key | Type | Location |
|-------|-----|------|----------|
| StatusBitacora | `applicantStatusLlegaDeLaBitacora` | radio | Block2 > Block11 |
| NIT | `applicantNit` | textfield | Block (hidden) |
| Empresa | `applicantNombreDeLaEmpresa11` | textfield | Block (hidden) |
| QueQuiereHacer | `applicantQueQuiereHacer*` | 5 radios | Block2 > Block19 |
| Contador | `applicantContador` | number | Block2 > Block14 |

## Existing Determinants (StatusBitacora-related)
| ID | Name | Type | Target | Value |
|----|------|------|--------|-------|
| `1f83b9f3-4fad-4733-a524-0b72b62b60e7` | status bitacora = TRUE | radio | `applicantStatusLlegaDeLaBitacora` | "true" |

**NOTE**: Determinant EXISTS but has NO behaviour/effect linked to any component. Block11 has no behaviourId.

## Other Key Determinants
| Name | Type | Target | Value |
|------|------|--------|-------|
| QUiere=REgistro nuevo | radio | applicantQueQuiereHacerRegistrarNuevo | "nuevo" |
| QUiere=MOdificar registro | radio | applicantQueQuiereHacerModificar | "modificarExistente" |
| REgistro=Medicamento | radio | applicantTipoDeRegistro | "medicamento" |
| Registro=Alimento | radio | applicantTipoDeRegistro | "alimento" |
| check renovacion | boolean | applicantRenovar | true |

## Bots (10 total)
| Name | Type | GDB | Category |
|------|------|-----|----------|
| buscar por tipo de producto | data | GDB-CENASA(1.2)-list | list |
| buscar por nombre | data | GDB-CENASA(1.2)-list | list |
| buscar No licencia | data | GDB-CENASA(1.2)-list | list |
| CENASA crear registro | data | GDB-CENASA(1.2)-create | create |
| modificar registro | data | GDB-CENASA(1.2)-update-entries | update |
| llenar datos modificar | data | GDB-CENASA(1.2)-read | read |
| Mostrar Registro | document | generic-pdf-display | doc_gen |
| Generar certificado | document | generic-pdf-display | doc_gen |
| Generar Certif Mod Alim | document | generic-pdf-display | doc_gen |
| generar certificado mod alim | (null) | (null) | (null) |

## Component Actions (4 buttons have actions)
| Button | Action ID |
|--------|-----------|
| applicantBuscar4 | `2c9180839856efea0198676abca60161` |
| applicantBuscar | `2c9180839856efea019867720e880165` |
| applicantBuscar3 | `2c91809095d83aac0195de8f8b1005ef` |
| applicantValidateTheForm (Continuar) | `2c91809095d83aac0195de8f8a2f0522` |
| applicantSubmit (Cancelar) | `2c91809095d83aac0195de8f8b0d05ed` |

## Recommendation for Forjador
1. **StatusBitacora effect**: Determinant exists but needs effect. Create `effect_create` targeting a visible block (e.g., `applicantBlock6` "Su empresa seleccionada") with activate action when StatusBitacora = TRUE.
2. **Bitacora side**: Need bot INTERNO (type internal, targets CENASA service), bot LISTAR (GDB-CENASA-list), EditGrid in Block22, dropdown button.
3. **Field mapping**: NIT = `applicantNit`, Empresa = `applicantNombreDeLaEmpresa11` (matches pattern of other services using `11` suffix).
