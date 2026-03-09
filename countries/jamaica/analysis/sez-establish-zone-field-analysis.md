# SEZ "Establish a New Zone - March" Field Analysis Report

**Service ID**: `0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`
**Instance**: BPA-jamaica
**Total fields**: 1,719
**Date**: 2026-03-08

---

## 1. Form Organization

### Forms
Only **1 active form**: the **applicant form** (461 components in the form schema).
The **guide form** exists but is **inactive** with 0 components.
No separate `send_file` or `payment` form types detected as standalone.

### Role Prefixes Identified (from field keys)
The service uses a flat single-form architecture where all roles share one form. Fields are namespaced by key prefix:

| Role/Stage Prefix | Description |
|---|---|
| `applicant*` | Zone developer applicant fields |
| `businessApproval*` / `businessReview*` / `businessEvaluation*` | BPSS (Business Processing & Support Services) |
| `legalApproval*` / `legalReview*` / `legalEvaluation*` | LSU (Legal Services Unit) |
| `complianceApproval*` / `complianceReview*` / `complianceEvaluation*` | CAS (Compliance, Audit & Security) |
| `technicalApproval*` / `technicalReview*` / `technicalServicesInfrastructure*` | TSI (Technical Services & Infrastructure) |
| `applicationReviewingCommitteeArcDecision*` | ARC (Application Reviewing Committee) |
| `boardSubmission*` / `board*` | Board of Directors |
| `complementaryInformation*` | Additional info requests (all units) |
| `documentSreview*` | Document review step |
| `inspectionTc*` / `technicalInspection*` / `complianceInspection*` | Site inspections |
| `tajApproval*` / `jcaApproval*` / `mofpsApproval*` | External agencies (TAJ, JCA, MOFPS) |
| `organizeNocAndInspection*` | NOC coordination |
| `ceoValidation*` | CEO validation |
| `approvalMinisterw*` | Minister approval |
| `preapprovalLetter*` / `denialLetters*` | Output letters |
| `signatureStatusLetter*` / `signatureOfStatusLetter*` | Status letter workflow |
| `templatedeveloperLicense*` | Developer license certificate template |
| `sendbacktocorrections*` | Rejection reason fields (~90 fields) |
| `filetitle*` / `fileupload*` | Document collection system fields (~62 fields) |
| `filevalidated_*` / `filedecline_*` | Workflow action buttons (~52 fields) |

---

## 2. Applicant Form Structure

### Top-Level Navigation: `applicantTabs` (Main Menu)
5 tabs in the main applicant menu:

| Tab | Key | Purpose |
|---|---|---|
| **Project overview** | `applicantTabsprojectOverview` | Zone identity, location, proposed activities |
| **Developer** | `applicantTabsdeveloper` | Company info, shareholders, authorized rep, registration docs |
| **Master plan** | `applicantTabsmasterPlan` | Contains nested `applicantTabs2` (Concept Master Plan) |
| **Business plan** | `applicantTabsbusinessPlan` | Contains nested `applicantBusinessPlan` tabs |
| **Compliance** | `applicantTabscompliance` | Contains nested `applicantCompliance` tabs |

### Nested Tab: `applicantTabs2` (Concept Master Plan) - 7 sub-tabs

| Sub-tab | Key |
|---|---|
| Land Information & Layout | `applicantTabs2landInformationLayout` |
| Land use & Zoning | `applicantTabs2landUseZoning` |
| Infrastructure & External connectivity | `applicantTabs2infrastructureExternalConnectivity` |
| Design & Visualizations | `applicantTabs2designVisualizations` |
| Site Conditions & Existing Infrastructure | `applicantTabs2siteConditionsExistingInfrastructure` |
| Implementation timeline | `applicantTabs2implementationTimeline` |
| Master plan submission | `applicantTabs2masterPlanSubmission` |

### Nested Tab: `applicantBusinessPlan` - 3 sub-tabs

| Sub-tab | Key |
|---|---|
| Viability indicators | `applicantBusinessPlanviabilityIndicators` |
| Project benefits | `applicantBusinessPlanprojectBenefits` |
| Upload business plan document | `applicantBusinessPlanuploadBusinessPlanDocument` |

### Nested Tab: `applicantCompliance` - 6 sub-tabs

| Sub-tab | Key |
|---|---|
| Ownership & financial integrity | `applicantComplianceownershipFinancialIntegrity` |
| Health & Safety | `applicantCompliancehealthSafety` |
| Disaster mitigation & Recovery | `applicantCompliancedisasterMitigationRecovery` |
| Security plan | `applicantCompliancesecurityPlan` |
| Licensing & Permits | `applicantCompliancelicensingPermits` |
| Customs | `applicantCompliancecustoms` |

### Tab Flow Assessment
The flow is **logical and well-structured** for a zone developer application:
1. **Project overview** -- what is the project?
2. **Developer** -- who is the applicant?
3. **Master plan** -- how will the zone be built? (7 detailed sub-tabs)
4. **Business plan** -- is the project financially viable?
5. **Compliance** -- does the developer meet legal/safety/security requirements?

This follows a natural progression from "what" to "who" to "how" to "why it works" to "is it safe/legal".

---

## 3. Field Naming Conventions

### Strengths
- **Consistent role prefixing**: All applicant fields start with `applicant`, all BPSS fields with `business*`, all LSU with `legal*`, etc.
- **Select child keys**: Every `select` field properly generates `_child_key` and `_child_value` companion fields.
- **EditGrid row counts**: Every editgrid has a matching `_nrOfRows` field.

### Issues & Red Flags

**Generic/unclear field names** (key does not match label):
| Key | Label | Issue |
|---|---|---|
| `applicantRadio` | "Corporate?" | Generic key, unclear purpose |
| `applicantBlock24` | `{{data.applicantTextField}}` | Dynamic label depending on mustache -- confusing |
| `applicantTextField` | "Moustache for shareholders list" | Internal/helper field exposed |
| `applicantGuardHouse` | "Lift station" | Key says "guard house" but label says "lift station" |
| `applicantSubstation` | "Guard house" | Key says "substation" but label says "guard house" |
| `applicantOffices` | "Service yard" | Key/label mismatch |
| `applicantSewageTreatment` | "Parking" | Key/label mismatch |
| `applicantLiftStation` | "Sewage treatment" | Key/label mismatch |
| `applicantTrainingFacilities` | "Offices" | Key/label mismatch |
| `applicantManufacturing` | "Industrial" | Key/label mismatch |
| `applicantIndustrial` | "Business Process Outsourcing" | Key/label mismatch |
| `applicantBusinessProcessOutsourcing` | "Logistics" | Key/label mismatch |
| `applicantLogistics` | "Training facilities" | Key/label mismatch |
| `applicantParking` | "Open space / landscaping" | Key/label mismatch |

**Pattern**: There are ~12 number fields where keys were originally created for one land-use category but labels were later changed to a different category. This is a **circular key-label mismatch chain** -- the keys were likely never updated when labels were rearranged. This is confusing for developers and mapping.

**Suffix patterns with `yy`, `xx`**:
- `applicationReviewingCommitteeArcDecisionMitigationStrategyy` -- typo ("strategyy")
- Several fields end in `yy` or `xx` (e.g., `legalApprovalConditionsxx`, `legalApprovalRisksxx`) suggesting they were cloned and renamed hastily.

---

## 4. File Upload Analysis (Applicant Form)

### 40 file upload fields in the applicant form, broken into categories:

#### Master Plan Documents (15 files)
| Key | Label | Required |
|---|---|---|
| `applicantUploadYourFinalMasterPlan` | Upload your concept master plan | YES |
| `applicantUploadYourMasterPlan` | Upload your final master plan | YES |
| `applicantUploadPreliminaryLandUsePlan2` | Land use plan | YES |
| `applicantScheduleOfAreasForBuildings` | Schedule of areas | YES |
| `applicantZoningRegulationsOptional` | Zoning regulations (optional) | no |
| `applicantUploadDensityParametersForEachProposedLandUseDesignationOrArea` | Upload density parameters | no |
| `applicantUpload5` | Infrastructure layout plan | no |
| `applicantUploadUtilityLayoutPlansOrConnectionDiagrams` | Utility layout plans | no |
| `applicantSketchPlansAndPreliminaryDesignsOfTheProposedSez` | Early-stage design plans | YES |
| `applicantUploadTechnicalDrawingsAndArchitecturalEngineeringPlans` | Technical drawings (optional) | YES |
| `applicantRenderingsDrawingsPaintingsOrComputerGeneratedVisualsOfWhatTheSezWillLookLikeWhenCompleted` | Visual renderings | YES |
| `applicantUploadDescriptionOfTheQualityConditionAndSizeOfExistingInfrastructureAtOrNearTheSite` | Site condition photos | no |
| `applicantUploadWrittenStatementOnAnyResettlementPlansOrMitigationMeasures` | Resettlement/mitigation statement | YES |
| `applicantUploadSupportingDocumentsApprovedPlansAuditsAsBuiltLayouts` | Approved plans/audits/"as-built" | YES |
| `applicantUploadPlanForPhasingOrExpansion` | Phasing/expansion plan | YES |

#### Business Plan Documents (1 file)
| Key | Label | Required |
|---|---|---|
| `applicantBusinessPlan2` | Business plan | YES |

#### Compliance Documents (5 files)
| Key | Label | Required |
|---|---|---|
| `applicantUploadOccupationalHealthSafetyPlan` | OH&S plan | YES |
| `applicantUploadDisasterMitigationAndRecoveryPlan` | Disaster mitigation plan | YES |
| `applicantSecurityPlan` | Security plan | YES |
| `applicantUploadSupportingDocumentsIfAny` | Supporting documents | YES |
| `applicantUploadSecurityAndLogisticalPlanForTheHandlingOfExciseGoods` | Excise goods security plan | YES |

#### Financial/Ownership Documents (3 files)
| Key | Label | Required |
|---|---|---|
| `applicantUploadAnyAvailableDocumentationSupportingTheLegalOriginOfProjectFunds` | Financial source docs | no |
| `applicantUploadAnyAvailableDocumentationSupportingTheLegalOriginOfProjectFunds2` | Upload supporting documents | no |
| `applicantUploadSupportingDocuments` | Upload supporting documents | no |
| `applicantUploadSupportingDocuments2` | Upload supporting documents | no |

#### Land Rights Documents (7 files)
| Key | Label | Required |
|---|---|---|
| `applicantUploadPlotBoundariesAndFullLandAreaLayout` | Site plan (scaled) | no |
| `applicantSurveyorsTechnicalDescription` | Surveyor's technical description | no |
| `applicantSurveyorsIdentificationReportWithSketchPlan` | Surveyor's ID report with sketch | no |
| `applicantCertifiedCopyOfTheCertificateOfTitle` | Certificate(s) of title | no |
| `applicantCertifiedCopyOfALongTermLeaseAgreement` | Long-term lease agreement(s) | no |
| `applicantDocumentEstablishingThatTheApplicantIsInTheProcessOfObtainingOccupancyRights` | Occupancy rights document | no |
| `applicantOwnersAffidavit` | Owner's affidavit | no |
| `applicantLandlordsAffidavit` | Landlord's affidavit | no |
| `applicantVendorsAffidavit` | Vendor's affidavit | no |
| `applicantAffidavitOfNoLandDispute` | Affidavit of no land dispute | no |

#### Registration Documents (4 files)
| Key | Label | Required |
|---|---|---|
| `applicantCertificateOfIncorporation` | Certificate of incorporation | no |
| `applicantProofOfIssuedAndPaidUpShareCapitalUs1500000` | Proof of paid-up capital | no |
| `applicantArticlesOfIncorporation` | Articles of incorporation | no |
| `applicantTaxComplianceCertificate` | Tax compliance certificate | no |

#### Upload Approval Observations (not in applicant form)
| Key | Label |
|---|---|
| `applicantUploadRelevantApprovalsOrCorrespondenceBelow` | Relevant approvals |

### Duplicate/Near-Duplicate Upload Concern
- `applicantUploadSupportingDocuments` and `applicantUploadSupportingDocuments2` have the same label "Upload supporting documents" -- purpose unclear
- `applicantUploadAnyAvailableDocumentationSupportingTheLegalOriginOfProjectFunds` and `...2` are near-duplicates

### Total Required Files: 17
The applicant must upload at minimum **17 required documents** to submit the form.

---

## 5. EditGrid Analysis

### Applicant EditGrids (3)

| Key | Label | Purpose |
|---|---|---|
| `applicantEditGrid` | Shareholders1 | Shareholder details (repeating rows) |
| `applicantParentCompanies` | Involved companies | Parent/JV companies (repeating rows) |
| `applicantDetailedParcelsGrid2` | Parcel areas grid (master plan) | Individual parcel details with areas |

### Officer/Reviewer EditGrids (54, across roles)

**BPSS** (6 editgrids):
- `businessApprovaleditgrid` / `businessApprovalRisksGrid` -- BPSS-A conditions & risks
- `businessRevieweditgrid` / `businessReviewRisksGrid` -- BPSS-R conditions & risks
- `businessApprovalEditGrid` / `businessEvaluationEditGrid` -- Additional info requests

**LSU** (6 editgrids):
- `legalApprovalLsuRConditionsGrid` / `legalApprovalTsiRRisksGrid` -- LSU-A conditions & risks
- `legalReviewTsiRConditionsGrid` / `legalReviewTsiRRisksGrid` -- LSU-R conditions & risks
- `legalApprovalEditGrid` / `legalEvaluationEditGrid` -- Additional info requests

**CAS** (6 editgrids):
- `complianceApprovaleditgrid` / `complianceApprovalRisksGrid` -- CAS-A conditions & risks
- `complianceRevieweditgrid` / `complianceReviewRisksGrid` -- CAS-R conditions & risks
- `complianceApprovalEditGrid` / `complianceEvaluationEditGrid` -- Additional info requests

**TSI** (6 editgrids):
- `technicalApprovaleditgrid2` / `technicalApprovalRisksGrid` -- TSI-A conditions & risks
- `technicalServicesInfrastructureeditgrid` / `technicalReviewRisksAssessment` -- TSI-R conditions & risks
- `technicalApprovalEditGrid` / `technicalEvaluationEditGrid` -- Additional info requests

**ARC** (10 editgrids):
- Per-unit conditions and risks grids: `CasAConditionsGrid`, `CasARisksGrid`, `LsuAConditionsGrid`, `LsuARisksGrid`, `TsiAConditionsGrid`, `TsiARisksGrid`, `RisksGrid2`, `RisksGrid3` (consolidated), `editgrid2`, `editgrid3` (consolidated conditions), `EditGrid3`

**Board Submission** (mirrors ARC grids for read-only display, ~10 editgrids)

**Complementary Information** (5 editgrids for each unit: Business, Legal, Technical, ARC, Compliance, + Status Letter)

**Pattern**: Each evaluation unit follows the same template: **Review -> Approve**, each with conditions grid + risks grid + additional info grid. This is consistent and well-structured.

---

## 6. Button Analysis

### Applicant Form Buttons (11)

| Key | Label | Type |
|---|---|---|
| `applicantNext2` | Go to developer | Navigation |
| `applicantGoToMasterPlan` | Go to overview | Navigation |
| `applicantNext` | Go to master plan | Navigation |
| `applicantNext3` | Next | Navigation |
| `applicantNext5` | Next | Navigation |
| `applicantGoToBusinessPlan` | Go to developer | Navigation |
| `applicantNext19` | Go to business plan | Navigation |
| `applicantGoToCompliance` | Go to master plan | Navigation |
| `applicantNext12` | Go to compliance | Navigation |
| `applicantNext13` | Go to business plan | Navigation |
| `applicantValidateTheForm` | Validate the form | Validation |

### Navigation Mislabeling Issues
- `applicantGoToMasterPlan` is labeled "Go to overview" (key says master plan, label says overview)
- `applicantGoToCompliance` is labeled "Go to master plan" (key says compliance, label says master plan)
- `applicantGoToBusinessPlan` is labeled "Go to developer" (key says business plan, label says developer)

These are **key-label mismatches** similar to the land-use fields. The labels may have been updated while keys remain from original creation.

### Workflow Buttons (66 total)
- **~35 "Approve" buttons** (`filevalidated_*`) -- one per workflow step
- **~12 "Request corrections" / "Send back" buttons** (`filedecline_*`) -- rejection flow
- **3 "Send evaluation for approval"** buttons
- **3 "Send decision to SEZA"** buttons
- **4 "Approve and send to ARC"** buttons
- **2 "Send to Board submission"** buttons
- **1 "Submit application"** (`sendPageSubmit`)
- **1 "Download SEZ pre-approval letter"**
- **1 "Download SEZ Denial letter"**
- **1 "Upload draft Licence Agreement"**
- **1 "Send consultation documents"**
- **1 "Go to payment"** (`saveDocuments`)
- **1 "Continue"** (`paymentPageContinue`)

---

## 7. Field Count per Role (Estimated)

| Role/Stage | Est. Fields | Notes |
|---|---|---|
| **Applicant** | ~380 | Core form + all sub-tabs |
| **BPSS** (Business) | ~85 | Review + Approval + evaluation + additional info |
| **LSU** (Legal) | ~100 | Review + Approval + evaluation + eligibility criteria + land rights |
| **CAS** (Compliance) | ~85 | Review + Approval + evaluation + inspection |
| **TSI** (Technical) | ~90 | Review + Approval + evaluation + inspection + billing |
| **ARC** | ~180 | Consolidates all unit evaluations + external consultations (TAJ/JCA/MOFPS) |
| **Board** | ~170 | Mirrors ARC data + Board decision + vote |
| **External (TAJ/JCA/MOFPS)** | ~45 | 15 fields each for due diligence/approval |
| **CEO Validation** | ~5 | Board submission upload + signed copy |
| **Minister** | ~8 | Comments + approval |
| **System/Infrastructure** | ~170 | `sendbacktocorrections*` (~90), `filetitle*` (~31), `fileupload*` (~31), constants, dates, payment |
| **Document Review** | ~65 | Radio + comment pairs for each of ~30 documents |
| **Print Template** | ~25 | Developer license certificate template fields |
| **Workflow Buttons** | ~77 | Approve/decline/navigate buttons |

---

## 8. Required Fields Summary

**46 required fields** on the applicant form:

### Identity & Location (7 required)
- Proposed name, Zone type, Zone focus, Parish, Address, Total land area, Unit

### Company Information (10 required)
- Company name, Registration number, TRN, Parish, Address, Phone, Email
- Auth rep: Names, Last names, Phone, Email

### Developer Details (5 required)
- Parent company name, Company name, Legal type, Country of registration, JV status

### Financial (4 required)
- Land value, On-site infrastructure, Building/factory development, Other costs

### File Uploads (17 required)
- Concept master plan, Final master plan, Land use plan, Schedule of areas
- Early-stage design plans, Technical drawings, Visual renderings
- Resettlement/mitigation statement, Approved plans/audits
- Phasing/expansion plan, Business plan
- OH&S plan, Disaster mitigation plan, Security plan
- Supporting documents, Excise goods security plan

### Other (3 required)
- Terrain requires grading? (radio)
- Name (representative), Country of origin

---

## 9. Red Flags & Recommendations

### CRITICAL: Key-Label Mismatches (12+ fields)
The land-use breakdown fields have a **circular mismatch** where keys don't match labels. This causes confusion in:
- Bot/automation development (which key to use?)
- Data mapping and exports
- Debugging form issues

**Recommendation**: Create a key-label mapping table for the land-use section and either rename the keys or add comments/tooltips.

### HIGH: Duplicate "Upload supporting documents" fields
- `applicantUploadSupportingDocuments` and `applicantUploadSupportingDocuments2` have identical labels
- Same for `applicantUploadAnyAvailableDocumentationSupportingTheLegalOriginOfProjectFunds` (1 and 2)

**Recommendation**: Differentiate labels (e.g., "Supporting docs - financial source" vs "Supporting docs - compliance").

### HIGH: Navigation button label mismatches
- 3 navigation buttons have keys that say one thing and labels that say another
- Users see correct labels, but developers/automations using keys will navigate to wrong tabs

### MEDIUM: "Technical drawings (optional)" is marked required
- The label says "optional" but the field is `required: true`

### MEDIUM: Typos in field keys
- `applicationReviewingCommitteeArcDecisionMitigationStrategyy` (double "y")
- `applicantMentionHereOtherRequiredPermitsIndicatingIfObtainedOrAppllied` (typo "appllied" -> "applied")
- Various `xx` and `yy` suffixed fields suggest hasty cloning

### LOW: No guide form
- The guide form is inactive with 0 components. For a complex 1,719-field service, an applicant guide would significantly reduce support burden.

### LOW: Very long field keys
- Some keys exceed 100 characters (e.g., `applicantDoesTheDeveloperCompanyOrAnyOfItsShareholdersDirectorsOrAffiliatedEntitiesIntendToIncludeAnyOccupantsOrZoneUsersThatWereAlreadyOperationalAndGeneratingRevenuePriorToThisSezApplication`)
- While functional, these make debugging and data mapping difficult.

### INFO: Overall Service Architecture Assessment
The service is **well-structured** with:
- Clear 5-tab applicant form with logical subtabs
- Consistent evaluation pattern (Review -> Approve) per unit
- Proper risk/conditions grids at every evaluation stage
- Full document review workflow with per-document radio + comment pairs
- External agency consultation flow (TAJ, JCA, MOFPS)
- Board decision + Minister approval chain

The main issues are cosmetic (key-label mismatches) rather than architectural. The 1,719 field count is high but justified given the complexity of SEZ zone establishment.

---

## Appendix: Workflow Steps (from `*selection` status fields)

1. Documents check (Type revision)
2. Documents review
3. Business evaluation -> Business approval (BPSS)
4. Legal evaluation -> Legal approval (LSU)
5. Compliance evaluation -> Compliance approval (CAS)
6. Technical evaluation -> Technical approval (TSI)
7. ARC - App Rev Committee
8. Complementary Information (back to applicant)
9. Complementary Information SL (status letter)
10. Signature status letter
11. Status letter
12. Organize NOC and inspection
13. TAJ due diligence -> TAJ approval
14. JCA due diligence -> JCA approval
15. MOFPS due diligence -> MOFPS approval
16. Board submission -> Board decision
17. CEO validation
18. Pre-approval letter / Denial letter
19. Inspection invite -> Inspection (Technical + Compliance)
20. Preparation of Ministerial Bundle
21. MIC instructions -> Draft Ministerial order -> Ministerial order legal review -> Ministerial order approval
22. Draft License Agreement -> Apply for License Agreement -> Legal review of payment and Licence agreement -> Agreement review and payment -> Issue License Agreement
23. Prepare invoice -> Approves invoices -> Approval of billing information -> Technical prepares billing information
24. Developer license -> Developer create
25. SEZ Documents -> Gazette
26. Prepare operating certificate -> Operating Certificate
