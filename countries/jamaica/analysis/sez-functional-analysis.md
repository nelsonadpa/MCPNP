# Analisis Funcional: SEZ Application Process
## BPMN del Cliente vs. Implementacion eRegistrations

**Servicio**: Establish a new zone — MAIN (`0d8ca0c6`)
**Fecha**: 2026-03-08
**Base**: Diagrama BPMN oficial del cliente (`sez-process.svg`) vs. configuracion real en BPA Jamaica

---

## Resumen Ejecutivo

El proceso del cliente tiene **15 pasos** en su BPMN. La implementacion en eRegistrations tiene **51 roles** (incluyendo 21 roles post-Board que el BPMN solo menciona brevemente en los pasos 10-15). La logica central (Steps 1-9) esta bien mapeada, pero hay diferencias importantes en el flujo de decisiones del ARC y en los roles post-Board.

---

## Mapeo Step-by-Step: BPMN del Cliente → eRegistrations

### Step 1: Assignment of Application
**BPMN**: Unit BPSS. Assigned to Michelle Hewett or Britania Bryan.

| Aspecto | BPMN Cliente | eRegistrations | Estado |
|---------|-------------|----------------|--------|
| Rol | BPSS Assignment | `Documents review` + `Documents check` | **Dividido en 2** |
| Responsables | Michelle Hewett, Britania Bryan | Michelle Hewett, Britannia Bryan | OK |
| Accion | Asignar aplicacion | DocCheck: Approve / Send back / Reject | OK |

**Diferencia**: eRegistrations divide esto en `Documents review` (intake automatico) + `Documents check` (revision manual con botones). El BPMN lo muestra como 1 paso. No es un problema funcional — el flujo es correcto.

**Campos del formulario**: Solo contenido instructivo. No hay campos de entrada. El oficial revisa los documentos subidos por el aplicante y decide Approve/Reject/Sendback.

---

### Step 2: Unit Reviews & Site Inspections (PARALELO)
**BPMN**: Units BPSS, LSU, CAS, TSI. Legal, Compliance, Tech & Business reviews.

| Evaluacion | BPMN Unit | eRegistrations Role | Campos Clave | Boton |
|------------|-----------|-------------------|--------------|-------|
| Legal | LSU | `legalEvaluation` | Upload report, Recommendation (radio), Conditions EditGrid, Risks EditGrid, Comments | "Send evaluation to approval" |
| Technical | TSI | `technicalEvaluation` | Mismo patron | "Send evaluation to approval" |
| Business | BPSS | `businessEvaluation` | Mismo patron | "Send evaluation for approval" |
| Compliance | CAS | `complianceEvaluation` | Mismo patron | "Send evaluation for approval" |

**Paralelo**: SI, todos se ejecutan en paralelo. Correcto.

**Campos de cada evaluacion**:
- `[unit]EvaluationUploadEvaluationReport` — Archivo de reporte (required)
- `[unit]EvaluationRecommendation` — Radio: Approve/Reject/Conditions
- `[unit]EvaluationConditions` — Radio: Si/No → despliega EditGrid
- `[unit]EvaluationConditionsEditGrid` — Condicion, Justificacion, Tipo, Timeline, Especificar
- `[unit]EvaluationRisks` — Radio: Si/No → despliega EditGrid
- `[unit]EvaluationRisksEditGrid` — Riesgo, Probabilidad, Impacto, Mitigacion
- `[unit]EvaluationCommentsForApprover` — Textarea
- `[unit]EvaluationCommentsFromApprover` — Textarea (feedback del aprobador)

**Rol adicional**: `organizeNocAndInspection` — Prepara y despacha paquetes de consulta a las 3 agencias externas. Tiene 3 areas de upload (TAJ, JCA, MOFPS). Este rol NO aparece explicitamente en el BPMN como paso separado, pero su funcion esta implicita en el Step 3.

---

### Step 3: Due Diligence (PARALELO con Step 2)
**BPMN**: JCA, TAJ, MOFPS (concurrent with Step 2).

| Agencia | eRegistrations Role | Forma | Boton |
|---------|-------------------|-------|-------|
| JCA | `jcaDueDiligence` (`af338a52`) | Vacio (solo Approve) | "Approve" |
| TAJ | `tajDueDiligence` (`3d15ff01`) | Upload NOC TAJ letter | "Approve" |
| MOFPS | `mofpsDueDiligence` (`19e2048e`) | Vacio (solo Approve) | "Approve" |

**Diferencia IMPORTANTE**: El BPMN muestra Due Diligence como un paso **paralelo** con Step 2. En eRegistrations, estos roles (`*DueDiligence`) **existen** pero el flujo principal que hemos testeado (E2E) muestra que la ruta practica va por los `*Approval` roles (ver Step 4). Los roles de Due Diligence tienen formularios casi vacios — parecen ser placeholders o un track alternativo.

> **HALLAZGO**: Los roles de Due Diligence (`jcaDueDiligence`, `tajDueDiligence`, `mofpsDueDiligence`) pueden estar configurados como track paralelo pero NO aparecen en las tareas pendientes del flujo E2E normal. Investigar si estan activos o deprecados.

---

### Step 4: Approval of Unit Reviews
**BPMN**: Units BPSS, LSU, CAS, TSI. Approved by respective Directors/Sr. Directors.

| Aprobacion | BPMN Approver | eRegistrations Role | Responsable | Boton |
|-----------|--------------|-------------------|-------------|-------|
| Legal | Sr. Dir. Legal | `legalApproval` | Janis Williams | "Approve and send to ARC" |
| Technical | Dir. TSI | `technicalApproval` | Deborah Broomfield | "Approve and send to ARC" |
| Business | Sr. Dir. BPSS | `businessApproval` | Licia Grant Mullings, Yeuniek Hinds | "Approve and send to ARC" |
| Compliance | COO | `complianceApproval` | Ainsley Brown | "Approve and send to ARC" |

**Aprobaciones de agencias externas** (NO en Step 4 del BPMN, pero se ejecutan en paralelo):

| Agencia | eRegistrations Role | Decision | Boton |
|---------|-------------------|----------|-------|
| JCA | `jcaApproval` | No objection / Objection (radio, required) | "Send decision to SEZA" |
| TAJ | `tajApproval` | No objection / Objection (radio, required) | "Send decision to SEZA" |
| MOFPS | `mofpsApproval` | No objection / Objection (radio, required) | "Send decision to SEZA" |

**Campos de cada agencia**:
- Panel "Documents received from SEZA" (read-only, copiado de organizeNOC)
- Decision radio: No objection / Objection (required)
- Comments textarea
- Upload justification (file)

**Estado**: Bien mapeado. Las 7 aprobaciones se ejecutan en paralelo y todas deben completarse antes del ARC.

---

### Step 5: ARC Meeting & Decision
**BPMN**: All Units. Chairperson + Secretariat + Members convened.
**Decisiones posibles (BPMN)**:
- Options 1-3: Recommended for Board consideration
- Option 4: Escalate (to COO/Ainsley Brown)
- Option 5: Hold (request additional info from applicant)

| Aspecto | BPMN | eRegistrations | Estado |
|---------|------|---------------|--------|
| Rol | ARC Meeting | `arcAppRevCommittee` | OK |
| Opcion 1-3 (Board) | → Step 7 | Boton "Send to Board submission" | OK |
| Opcion 4 (Escalate) | → COO Ainsley Brown | **NO IMPLEMENTADO como ruta separada** | **GAP** |
| Opcion 5 (Hold/Info) | → Applicant loop | Radio "additional info?" = yes → `complementaryInformation` | OK |

**Campos del ARC** (formulario MUY grande):
- Resumen de cada unidad (LSU, CAS, TSI, BPSS) — paneles read-only con recomendacion, condiciones, riesgos
- Resumen de cada agencia (TAJ, JCA, MOFPS) — decision, fechas, documentos
- **ARC Recommendation** (radio) — decision consolidada
- **Conditions** (radio + EditGrid consolidado)
- **Risks** (radio + EditGrid consolidado)
- **Upload ARC Minutes** (file)
- **Radio critico**: "Does the application require additional information?" (key: `applicationReviewingCommittee...AdditionalInformation`)
  - `yes` → triggers `fileDecline` → `complementaryInformation` (applicant loop)
  - `no` → habilita "Send to Board submission"
- **EditGrid3**: Info type, document name, reasons, select reviewing units (para el loop de CI)

> **GAP IDENTIFICADO**: El BPMN muestra 5 opciones de decision en el ARC. eRegistrations solo implementa 2:
> 1. **Board** (radio=no → "Send to Board submission")
> 2. **Hold/CI** (radio=yes → "Request additional information")
>
> Falta: **Escalate to COO** (Option 4) — no existe como ruta/boton separado.
> Las opciones 1-3 (recommended for Board) se colapsan en una sola accion.

---

### Step 5b: Hold → Complementary Information (Applicant Loop)
**BPMN**: "Place on Hold — Request additional information from applicant"

| Aspecto | BPMN | eRegistrations |
|---------|------|---------------|
| Trigger | ARC Option 5 | Radio = "yes" + "Request additional information" button |
| Actor | Applicant | `complementaryInformation` (applicant-facing role) |
| Vuelta | Resubmit → back to evaluations selectively | Selective routing: solo unidades seleccionadas en EditGrid3 |

**Campos del Complementary Information** (applicant):
- 5 EditGrids (uno por unidad: ARC, Business, Legal, Technical, Compliance)
- Cada uno tiene: document name, reasons, required data, upload
- Boton: "Validate send page" (triggers `saveSENDPAGE`)

**Selective Routing** (post-CI):
- Controlado por determinantes: `ciLegal`, `ciBusiness`, `ciTechnical`, `ciCompliance`
- Solo las unidades seleccionadas en el EditGrid3 del ARC reciben nueva evaluacion
- Las demas se saltan (SKIP)
- Despues de las evaluaciones selectivas, vuelve al ARC

**Estado**: Implementado correctamente. Probado en E2E con exito (selective routing PASS).

---

### Step 6: Communication of ARC Decision
**BPMN**: Unit BPSS. 14-day Status Letter prepared & signed.

| Aspecto | BPMN | eRegistrations | Estado |
|---------|------|---------------|--------|
| Preparacion | BPSS prepara | `statusLetter` — Michelle Hewett, Britannia Bryan | OK |
| Firma | Signed | `signatureStatusLetter` — Licia Grant Mullings, Yeuniek Hinds | OK |

**Campos de Status Letter**:
- Upload Status Letter (file, required)
- Boton "Approve" → avanza a firma

**Campos de Signature Status Letter**:
- Status letter (copyFrom, read-only)
- Upload signed status letter (file)
- **Radio**: "Require additional info?" (si → loop a `complementaryInformationSl`)
- **Radio**: "Before board?" (si/no)
- EditGrid para info adicional requerida
- Botones: "Approve" / "Send to Board submission" / "Request additional information"

**Segundo loop de CI**: `complementaryInformationSl` — applicant sube documentos adicionales post-Status Letter.

> **NOTA**: El BPMN no muestra explicitamente un segundo loop de CI despues del Status Letter. eRegistrations implementa este loop adicional. Esto es una **mejora** sobre el BPMN.

---

### Step 7: CEO Approval of Board Submission
**BPMN**: CEO's Office. Corporate Secretary prepares. CEO validates decision.

| Aspecto | BPMN | eRegistrations | Estado |
|---------|------|---------------|--------|
| Preparacion | Corporate Secretary | `boardSubmission` | OK |
| CEO Valida | CEO | `ceoValidation` | OK |

**Campos de Board Submission**:
- Risk Analysis (radio: Low/Medium/High)
- Risks EditGrid
- Agency checkboxes: Non-ob JCA, TAJ, MOF + dates
- **Vote Chairman** (radio: Approved/Rejected/Deferred, required)
- Date, Reason deferral (si deferred)
- Upload Board submission (file)

**Campos de CEO Validation**:
- Board submission (copyFrom, read-only)
- Upload signed Board submission (file)
- Boton "Approve"

**Estado**: Bien mapeado.

---

### Step 8: Board of Directors Decision
**BPMN**: Application approved or denied by BOD.

| Aspecto | BPMN | eRegistrations | Estado |
|---------|------|---------------|--------|
| Decision | Approved / Denied | `board` — decision radio + comments | OK |
| Approved | → Step 9 | "Approve" (`filevalidated_3ca32c85`) | OK |
| Denied | → Denial Letter → End | "Request corrections" (`filedecline_3ca32c85`) → `denialLetter` | OK |

**Campos del Board**:
- Board's comments (textarea)
- Board decision (select/catalog)
- Board resolution: Vote Chairman (radio: Approved/Rejected/Deferred)
- Date, Reason deferral

**Denial path**: `denialLetter` — Download/Upload denial letter (signed by Sr. Dir. LSU) → End.

---

### Step 9: BOD Decision Communication
**BPMN**: CEO Office, BPSS, LSU. Pre-approval Letter prepared.

| Aspecto | BPMN | eRegistrations | Estado |
|---------|------|---------------|--------|
| Rol | Pre-approval letter | `sezDocuments` + `preApprovalLetter` | OK |

`sezDocuments`: boton Approve simple (cierra el paso).
`preApprovalLetter`: preparacion de carta pre-aprobacion.

---

### Steps 10-15: Post-Board Process (21 roles en eRegistrations)

El BPMN muestra estos como pasos lineales. eRegistrations los implementa como **21 roles separados**:

| BPMN Step | eRegistrations Roles | Notas |
|-----------|---------------------|-------|
| **Step 10**: Ministerial Bundle | `preparationOfMinisterialBundle` | LSU & CEO's Office |
| **Step 11**: Draft Licence Agreement | `draftLicenseAgreement` → `agreementReviewAndPayment` (applicant) → `legalReviewOfPayment` → `issueLicenseAgreement` | **4 roles** vs 1 paso en BPMN |
| **Step 12**: Ministerial Order | `micInstructions` → `draftMinisterialOrder` → `ministerialOrderLegalReview` → `ministerialOrderApproval` → `gazette` | **5 roles** vs 1 paso en BPMN |
| **Step 13**: Billing & Invoice | `technicalPreparesBilling` → `approvalOfBillingInfo` → `prepareInvoice` → `approvesInvoices` | **4 roles** vs 1 paso en BPMN |
| **Step 14**: Execution of Licence | Parte de `issueLicenseAgreement` + pago del cliente | OK |
| **Step 15**: Finalization & Certificate | `inspectionInvite` → `technicalInspection` → `inspection` → `prepareOperatingCertificate` → `operatingCertificate` | **5 roles** vs 1 paso en BPMN |

> **Hallazgo**: Los 21 roles post-Board estan configurados con `order: 299` (baja prioridad) y **no han sido testeados en E2E**. Los bots `DEVELOPER create` y `Developer license` tienen **0 mappings** — el certificado final no se genera automaticamente.

---

## Resumen de Gaps y Hallazgos

### GAPS (funcionalidad faltante)

| # | Gap | Severidad | Detalle |
|---|-----|-----------|---------|
| 1 | **ARC Escalate (Option 4)** | MEDIA | El BPMN muestra "Escalate to COO/Ainsley Brown" como opcion separada. No existe como ruta en eRegistrations. Solo hay Board o Hold. |
| 2 | **Due Diligence roles vacios** | BAJA | `jcaDueDiligence`, `mofpsDueDiligence` tienen formularios vacios. Pueden ser placeholders o necesitar contenido. |
| 3 | **Bot Developer license sin mappings** | ALTA | El bot que genera el certificado final tiene 0 mappings. No produce output. |
| 4 | **21 roles post-Board sin testing** | MEDIA | Steps 10-15 (Ministerial, License, Billing, Certificate) no testeados. |

### DIFERENCIAS (no necesariamente problemas)

| # | Diferencia | Tipo | Detalle |
|---|-----------|------|---------|
| 1 | DocCheck dividido en 2 roles | Mejora | Documents review (auto) + Documents check (manual) |
| 2 | Segundo loop CI post-Status Letter | Mejora | `complementaryInformationSl` no esta en el BPMN pero agrega flexibilidad |
| 3 | 21 roles post-Board vs 6 pasos BPMN | Detalle | Mas granularidad, mejor trazabilidad |
| 4 | Selective Routing | Mejora | El BPMN solo dice "Resubmit". eRegistrations implementa routing selectivo por unidad |
| 5 | organizeNocAndInspection como rol separado | Detalle | El BPMN lo agrupa en Step 2/3. eRegistrations lo separa para despacho explicito |

### LO QUE FUNCIONA BIEN

| Aspecto | Estado |
|---------|--------|
| 5 evaluaciones paralelas | OK |
| 7 aprobaciones paralelas (4 internas + 3 agencias) | OK |
| ARC con decision Board/Hold | OK |
| Complementary Information (applicant loop) | OK |
| Selective routing post-CI | OK (PASS verificado en E2E) |
| Status Letter + Firma | OK |
| Board process (Submission → CEO → Board → SEZ Docs) | OK |
| Denial path | OK |
| 6 files at ARC (3 API + 3 UI) | Verificado hoy |

---

## Flujo Comparativo Visual

```
BPMN Cliente                          eRegistrations
═══════════                           ══════════════
Step 1: Assignment                    documentsReview → documentsCheck
        │                                     │
Step 2: Unit Reviews ──────┐          5 evals (parallel) + organizeNOC
Step 3: Due Diligence ─────┤          3 dueDiligence (vacios?) + 3 agency approvals
        │                  │                  │
Step 4: Approvals ─────────┘          4 internal approvals + 3 agency approvals (parallel)
        │                                     │
Step 5: ARC Decision                  arcAppRevCommittee
        ├─ Board (Opt 1-3) ─────────── radio=no → "Send to Board"
        ├─ Escalate (Opt 4) ────────── ❌ NO IMPLEMENTADO
        └─ Hold (Opt 5) ───────────── radio=yes → complementaryInformation
                                               │
                                        Selective Routing → re-evals → ARC (2da vez)
        │                                     │
Step 6: Status Letter                 statusLetter → signatureStatusLetter
                                        └─ Optional: complementaryInformationSl (2do loop)
        │                                     │
Step 7: CEO Approval                  boardSubmission → ceoValidation
        │                                     │
Step 8: Board Decision                board (Approve/Reject)
        ├─ Approved ──────────────── → sezDocuments → 21 post-Board roles
        └─ Denied ────────────────── → denialLetter → End
        │                                     │
Steps 9-15: Post-Board               21 roles (order 299, sin E2E testing)
```

---

## Recomendaciones

1. **Prioridad ALTA**: Configurar mappings del bot `Developer license` para que genere el certificado final
2. **Prioridad MEDIA**: Evaluar si Option 4 (Escalate to COO) necesita implementarse como ruta separada o si el flujo actual es suficiente
3. **Prioridad MEDIA**: Ejecutar E2E testing de los 21 roles post-Board (Steps 10-15)
4. **Prioridad BAJA**: Revisar los roles de Due Diligence — determinar si son necesarios o se pueden deprecar
