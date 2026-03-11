/**
 * eRegistrations Form Filler + Key Analyzer v3.0
 * Unified bookmarklet: inspect keys, fill forms, manage presets
 * Auto Fill: works on any form without presets (reads Form.io components live)
 * Auto-Pilot: detects role, fills preset, highlights action button
 * Presets can be baked-in at build time or imported manually
 */
(function () {
  const PANEL_ID = '__er_filler_panel';
  if (document.getElementById(PANEL_ID)) {
    document.getElementById(PANEL_ID).remove();
    return;
  }

  const STORAGE_KEY      = 'er_presets';
  const ROLE_STORAGE_KEY = 'er_role_presets';
  const RECENT_KEY       = 'er_recent_services';
  const MAX_RECENT       = 8;
  const VERSION          = '3.0';

  // BUILD_INJECT_PRESETS (replaced by build script with actual data)
  const EMBEDDED_PRESETS = {"0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc":{"demo":{"_meta":{"serviceId":"d51d6c78-5ead-c948-0b82-0d9bc71cd712","serviceName":"Jamaica - Establish a new zone","scenario":"demo","generatedAt":"2026-03-05T16:00:00Z","fieldCount":95,"mcpServer":"BPA-jamaica","note":"EditGrid fields nested as arrays per Form.io requirements"},"applicantProposedNameOfZone":"New Kingston Innovation Park","applicantMultiOrSingleOccupant":"multiOccupant","applicantMultiOrSingleOccupant2":"multiOccupant","applicantCity3":"Kingston","applicantAddress3":"12 Ocean Boulevard, Port Royal, Kingston 1, Jamaica","applicantTotalLandArea3":250000,"applicantUnit3":"Square feet","applicantAuthorizedActivities":["Manufacturing","Warehousing","Logistics"],"applicantOtherActivity":"Technology research and development","applicantCompanyName":"Caribbean Development Holdings Ltd","applicantCompanyType":"Limited Company","applicantTaxRegistrationNumberTrn2":"COJ-2024-98765","applicantDateOfIncorporationInJamaica":"2020-06-15T00:00:00","applicantTaxRegistrationNumberTrn":"123-456-789","applicantCity":"Kingston","applicantAddress":"45 Hope Road, Kingston 6, Jamaica","applicantPhone":"+1 876 555 1234","applicantEmail":"info@caribdevholdings.com","applicantNames":"Marcus Anthony","applicantLastName":"Williams","applicantPhone2":"+1 876 555 5678","applicantEmail2":"m.williams@caribdevholdings.com","applicantEnterYourPaidUpCapitalAmountInUsd":1500000,"applicantCompanyName2":"Caribbean Development Holdings Ltd","applicantLegalType2":"Limited Liability Company","applicantCountryOfRegistration":"Jamaica","applicantEditGrid":[{"applicantName":"Marcus Anthony Williams","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":60},{"applicantName":"Sandra Chen","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":40}],"applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany":"no","applicantParentCompanies":[{"applicantParentCompanyName":"Caribbean Group International","applicantLegalType":"Corporation","applicantCountryOfOrigin":"Jamaica"}],"applicantYesIWillUploadAFinalMasterPlan":true,"applicantCheckbox":true,"applicantParcelsDescriptionGrid":[{"applicantPlotParcelDesignation":"Parcel A-1","applicantPrivateOrPublicLand":"private","applicantDoYouHaveRightsOnThisLand":"held","applicantWhatTypeOfRightsDoYouHave":"ownership"}],"applicantDetailedParcelsGrid2":[{"applicantParcelDesignation":"Parcel A-1","applicantArea":250000,"applicantUnit2":"Square feet"}],"applicantNumberOfPlotsBlocksParcels":8,"applicantTotalLandArea":250000,"applicantUnit":"Square feet","applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation":"no","applicantDensityParametersForEachProposedLandUseDesignationOrArea":"Zone A: Industrial — max 60% lot coverage, 15m height limit. Zone B: Commercial — max 70% lot coverage, 20m height limit. Zone C: Logistics — max 50% lot coverage, open yard permitted.","applicantWarehousing":40000,"applicantWarehousing2":35000,"applicantManufacturing":20000,"applicantBusinessProcessOutsourcing":15000,"applicantLogistics2":10000,"applicantLogistics":5000,"applicantTrainingFacilities":8000,"applicantIndustrial":12000,"applicantOffices":3000,"applicantServiceYardArea":2000,"applicantSubstation":1500,"applicantGuardHouse":800,"applicantLiftStation":1200,"applicantSewageTreatment":3000,"applicantSewageTreatment2":15000,"applicantParking":25000,"applicantWhatIsTheMinimumProposedWidthOfInternalRoads":12,"applicantWhatIsTheProposedBuildingCoverageRatioOnEachPlot":60,"applicantWhatIsTheMinimumBuildingSetbackFromPlotBoundaries":5,"applicantWillTheZoneIncludeInternalDrainageSystemsStormwater":"yes","applicantWhatIsTheMaximumProposedBuildingHeight":20,"applicantHaveInternalRoadLayoutsBeenDesignedWithTurningRadiiForTrucks":"yes","applicantAreThereAnyDrainageIssuesThatWillAffectThisProperty":"yes","applicantHaveProvisionsBeenMadeForTheWaterStorage":"no","applicantWillThisProposedSezProjectBeServiceableByTheNwcSewageSystemAndPotableWaterMain":"yes","applicantWillFullOrPartialBuildOutOfThisProjectRequireALiftStation":"no","applicantRadio29":"yes","applicantRadio28":"yes","applicantRadio31":"yes","applicantRadio30":"no","applicantWhatIsTheDistanceToTheNearestPublicHighwayOrArterialRoad":2,"applicantWhatIsTheDistanceToTheNearestPortOrAirport":15,"applicantRadio32":"yes","applicantRadio33":"no","applicantIsCustomsInfrastructureAvailableNearbyOrPlannedInsideTheZone":"yes","applicantShortNarrativeDescriptionOfTheVision":"A modern, sustainable multi-occupant industrial park designed to attract high-value manufacturing and logistics operations. The park features green building standards, integrated digital infrastructure, and proximity to Kingston's port facilities.","applicantIsItOnPrivateOrPublicLand":"private","applicantDescriptionOfTheQualityConditionAndSizeOfExistingInfrastructureAtOrNearTheSite":"The site is a previously undeveloped 250,000 sq ft parcel with existing road access from Ocean Boulevard. Municipal water and electricity connections are available within 500m. The terrain is relatively flat with minimal grading required.","applicantSocialInfrastructureNearby500MRadius":"Schools","applicantNearbyCommunities2":"Port Royal community, Newport East, Hunts Bay industrial area","applicantWillThisProposedSezProjectBeServiceableByTheNwcSewageSystemAndPotableWaterMain2":"yes","applicantHaveProvisionsBeenMadeForTheWaterStorage2":"no","applicantDoesTheProjectInvolveAnyPhysicalOrEconomicDisplacement":"no","applicantHasAResettlementOrMitigationPlanBeenPrepared":"no","applicantNoOfBuildingsProposed":0,"applicantNoOfFloorsProposed":0,"applicantDoAnyOfTheExistingStructuresRequireDemolitionOrEnvironmentalClearance":"no","applicantHaveAnyInfrastructureWorksAlreadyReceivedTechnicalApproval":"no","applicantIsTheProjectSubjectToPhasingOrAnnexation3":"yes","applicantPlannedStartOfConstruction":"2026-09-01T00:00:00","applicantEstimatedConstructionPeriod":24,"applicantPlannedStartOfConstruction2":"2028-09-01T00:00:00","applicantWillTheDevelopmentBeImplementedInPhases":"yes","applicantAreThereExternalDependencies":"no","applicantTimelinePerPhase":[{"applicantBriefDescriptionOfThePhase":"Phase 1 — Site preparation, infrastructure, first 4 warehouse units","applicantStart2":"2026-09-01T00:00:00","applicantStart3":"2027-09-01T00:00:00"},{"applicantBriefDescriptionOfThePhase":"Phase 2 — BPO center, manufacturing units, logistics yard","applicantStart2":"2027-09-01T00:00:00","applicantStart3":"2028-09-01T00:00:00"}],"applicantValueOfLand":50000000,"applicantValueOfLand2":25000000,"applicantOnSiteInfrastructure":30000000,"applicantBuildingFactoryDevelopmentCost":5000000,"applicantEquity":40,"applicantEquity2":50,"applicantDebt":5,"applicantGrant":5,"applicantPleaseDescribe":"Primary equity from Caribbean Group International. Debt financing from Development Bank of Jamaica. Government incentive grant pending approval.","applicantBrieflyExplainOurBusinessModel":"The zone will host 15-20 occupants spanning manufacturing, warehousing, and BPO sectors. Target tenants include garment manufacturers serving the US market, pharmaceutical packaging operations, and regional distribution centers.","applicantEquity3":50,"applicantDebt3":35,"applicantOther":15,"applicantPleaseDescribe2":"Revenue from tenant lease payments (base rent + CAM), service fees for shared infrastructure (security, waste management, utilities metering), and value-added services (customs brokerage facilitation).","applicantDoYouHaveLoIsOrConfirmedOccupants":"yes","applicantYear5":3,"applicantYear1TempJobs2":3,"applicantYear6":10,"applicantYear2TempJobs2":10,"applicantYear7":18,"applicantYear3TempJobs":18,"applicantEquity4":80,"applicantDebt2":60,"applicantGrant2":30,"applicantDoYouExpectAnyOfYourTenantsToBeExporters":"yes","applicantAreYourOccupantsExpectedToBeExportOriented":"yes","applicantYear1":200,"applicantYear4":80,"applicantYear2":500,"applicantYear1TempJobs":200,"applicantYear3":1200,"applicantYear2TempJobs":500,"applicantWhatOrGoodsAndServicesDoYouExpectOccupantsToSourceLocally":"yes","applicantBrieflyDescribeHowYourProjectWillBenefitJamaica":"The project will create over 1,200 direct jobs within 5 years, primarily in manufacturing and logistics. It will increase Jamaica's export capacity, attract foreign direct investment, and develop specialized workforce skills in advanced manufacturing.","applicantIsTheProjectBeingFinancedByTheDeveloperDirectlyByInvestorsOrThroughAffiliatedEntities":{"developersOwnFunds":true,"thirdPartyInvestors":true,"affiliatedCompany":false},"applicantProvideAShortDescriptionOfHowTheProjectIsFinanced":"60% developer equity through Caribbean Group International. 30% debt financing from Development Bank of Jamaica. 10% incentive grants from JAMPRO/government programs.","applicantHasTheDeveloperCompanyAnyOfItsOwnersDirectorsOrFinanciersEverBeenSubjectToFinancialSanctionsMoneyLaunderingInvestigationsOrRegulatoryPenaltiesInJamaicaOrAbroad":"no","applicantDoesTheDeveloperCompanyOrAnyOfItsShareholdersDirectorsOrAffiliatedFirmsHaveLinksToAnyExistingSezLicensedCompaniesInJamaica":"no","applicantDoesTheDeveloperCompanyOrAnyOfItsShareholdersDirectorsOrAffiliatedEntitiesIntendToIncludeAnyOccupantsOrZoneUsersThatWereAlreadyOperationalAndGeneratingRevenuePriorToThisSezApplication":"no","applicantWasTheDeveloperCompanyAlreadyOperationalAndGeneratingRevenueBeforeApplyingForSezStatus":"no","applicantWillActivitiesIncludeTheHandlingOfExciseGoods":"no","applicantOHsManagementSystem":"yes","applicantScopeAndImprovement":"yes","applicantOhSPolicy":"yes","applicantOhSManagementSystem":"yes","applicantOhSLegalRequirements":"yes","applicantControlsInPlace":"yes","applicantTraining":"yes","applicanttrainingNeeds":"yes","applicantInventoryControls":"yes","applicantconsultation":"yes"},"test":{"_meta":{"serviceId":"d51d6c78-5ead-c948-0b82-0d9bc71cd712","serviceName":"Jamaica - Establish a new zone","scenario":"test","generatedAt":"2026-03-05T16:00:00Z","fieldCount":30,"mcpServer":"BPA-jamaica"},"applicantProposedNameOfZone":"Test Zone A","applicantMultiOrSingleOccupant":"single","applicantMultiOrSingleOccupant2":"single","applicantCity3":"St. Catherine","applicantAddress3":"1 Main St","applicantTotalLandArea3":100,"applicantUnit3":"Square meters","applicantCompanyName":"Test Corp","applicantTaxRegistrationNumberTrn2":"COJ-001","applicantTaxRegistrationNumberTrn":"111-222-333","applicantCity":"St. Catherine","applicantAddress":"1 Main St","applicantPhone":"8765551111","applicantEmail":"test@test.com","applicantNames":"John","applicantLastName":"Doe","applicantPhone2":"8765552222","applicantEmail2":"j.doe@test.com","applicantCompanyName2":"Test Corp","applicantLegalType2":"LLC","applicantCountryOfRegistration":"Jamaica","applicantEditGrid":[{"applicantName":"John Doe","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":100}],"applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany":"no","applicantParentCompanies":[{"applicantParentCompanyName":"Test Parent","applicantLegalType":"Corporation","applicantCountryOfOrigin":"Jamaica"}],"applicantParcelsDescriptionGrid":[{"applicantPlotParcelDesignation":"Lot 1","applicantPrivateOrPublicLand":"private","applicantDoYouHaveRightsOnThisLand":"held","applicantWhatTypeOfRightsDoYouHave":"ownership"}],"applicantUnit2":"Square meters","applicantNumberOfPlotsBlocksParcels":1,"applicantTotalLandArea":100,"applicantUnit":"Square meters","applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation":"no","applicantValueOfLand":1000,"applicantValueOfLand2":500,"applicantOnSiteInfrastructure":500,"applicantBuildingFactoryDevelopmentCost":100}},"d51d6c78-5ead-c948-0b82-0d9bc71cd712":{"demo":{"_meta":{"serviceId":"d51d6c78-5ead-c948-0b82-0d9bc71cd712","serviceName":"Jamaica - Establish a new zone","scenario":"demo","generatedAt":"2026-03-05T16:00:00Z","fieldCount":95,"mcpServer":"BPA-jamaica","note":"EditGrid fields nested as arrays per Form.io requirements"},"applicantProposedNameOfZone":"New Kingston Innovation Park","applicantMultiOrSingleOccupant":"multiOccupant","applicantMultiOrSingleOccupant2":"multiOccupant","applicantCity3":"Kingston","applicantAddress3":"12 Ocean Boulevard, Port Royal, Kingston 1, Jamaica","applicantTotalLandArea3":250000,"applicantUnit3":"Square feet","applicantAuthorizedActivities":["Manufacturing","Warehousing","Logistics"],"applicantOtherActivity":"Technology research and development","applicantCompanyName":"Caribbean Development Holdings Ltd","applicantCompanyType":"Limited Company","applicantTaxRegistrationNumberTrn2":"COJ-2024-98765","applicantDateOfIncorporationInJamaica":"2020-06-15T00:00:00","applicantTaxRegistrationNumberTrn":"123-456-789","applicantCity":"Kingston","applicantAddress":"45 Hope Road, Kingston 6, Jamaica","applicantPhone":"+1 876 555 1234","applicantEmail":"info@caribdevholdings.com","applicantNames":"Marcus Anthony","applicantLastName":"Williams","applicantPhone2":"+1 876 555 5678","applicantEmail2":"m.williams@caribdevholdings.com","applicantEnterYourPaidUpCapitalAmountInUsd":1500000,"applicantCompanyName2":"Caribbean Development Holdings Ltd","applicantLegalType2":"Limited Liability Company","applicantCountryOfRegistration":"Jamaica","applicantEditGrid":[{"applicantName":"Marcus Anthony Williams","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":60},{"applicantName":"Sandra Chen","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":40}],"applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany":"no","applicantParentCompanies":[{"applicantParentCompanyName":"Caribbean Group International","applicantLegalType":"Corporation","applicantCountryOfOrigin":"Jamaica"}],"applicantYesIWillUploadAFinalMasterPlan":true,"applicantCheckbox":true,"applicantParcelsDescriptionGrid":[{"applicantPlotParcelDesignation":"Parcel A-1","applicantPrivateOrPublicLand":"private","applicantDoYouHaveRightsOnThisLand":"held","applicantWhatTypeOfRightsDoYouHave":"ownership"}],"applicantDetailedParcelsGrid2":[{"applicantParcelDesignation":"Parcel A-1","applicantArea":250000,"applicantUnit2":"Square feet"}],"applicantNumberOfPlotsBlocksParcels":8,"applicantTotalLandArea":250000,"applicantUnit":"Square feet","applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation":"no","applicantDensityParametersForEachProposedLandUseDesignationOrArea":"Zone A: Industrial — max 60% lot coverage, 15m height limit. Zone B: Commercial — max 70% lot coverage, 20m height limit. Zone C: Logistics — max 50% lot coverage, open yard permitted.","applicantWarehousing":40000,"applicantWarehousing2":35000,"applicantManufacturing":20000,"applicantBusinessProcessOutsourcing":15000,"applicantLogistics2":10000,"applicantLogistics":5000,"applicantTrainingFacilities":8000,"applicantIndustrial":12000,"applicantOffices":3000,"applicantServiceYardArea":2000,"applicantSubstation":1500,"applicantGuardHouse":800,"applicantLiftStation":1200,"applicantSewageTreatment":3000,"applicantSewageTreatment2":15000,"applicantParking":25000,"applicantWhatIsTheMinimumProposedWidthOfInternalRoads":12,"applicantWhatIsTheProposedBuildingCoverageRatioOnEachPlot":60,"applicantWhatIsTheMinimumBuildingSetbackFromPlotBoundaries":5,"applicantWillTheZoneIncludeInternalDrainageSystemsStormwater":"yes","applicantWhatIsTheMaximumProposedBuildingHeight":20,"applicantHaveInternalRoadLayoutsBeenDesignedWithTurningRadiiForTrucks":"yes","applicantAreThereAnyDrainageIssuesThatWillAffectThisProperty":"yes","applicantHaveProvisionsBeenMadeForTheWaterStorage":"no","applicantWillThisProposedSezProjectBeServiceableByTheNwcSewageSystemAndPotableWaterMain":"yes","applicantWillFullOrPartialBuildOutOfThisProjectRequireALiftStation":"no","applicantRadio29":"yes","applicantRadio28":"yes","applicantRadio31":"yes","applicantRadio30":"no","applicantWhatIsTheDistanceToTheNearestPublicHighwayOrArterialRoad":2,"applicantWhatIsTheDistanceToTheNearestPortOrAirport":15,"applicantRadio32":"yes","applicantRadio33":"no","applicantIsCustomsInfrastructureAvailableNearbyOrPlannedInsideTheZone":"yes","applicantShortNarrativeDescriptionOfTheVision":"A modern, sustainable multi-occupant industrial park designed to attract high-value manufacturing and logistics operations. The park features green building standards, integrated digital infrastructure, and proximity to Kingston's port facilities.","applicantIsItOnPrivateOrPublicLand":"private","applicantDescriptionOfTheQualityConditionAndSizeOfExistingInfrastructureAtOrNearTheSite":"The site is a previously undeveloped 250,000 sq ft parcel with existing road access from Ocean Boulevard. Municipal water and electricity connections are available within 500m. The terrain is relatively flat with minimal grading required.","applicantSocialInfrastructureNearby500MRadius":"Schools","applicantNearbyCommunities2":"Port Royal community, Newport East, Hunts Bay industrial area","applicantWillThisProposedSezProjectBeServiceableByTheNwcSewageSystemAndPotableWaterMain2":"yes","applicantHaveProvisionsBeenMadeForTheWaterStorage2":"no","applicantDoesTheProjectInvolveAnyPhysicalOrEconomicDisplacement":"no","applicantHasAResettlementOrMitigationPlanBeenPrepared":"no","applicantNoOfBuildingsProposed":0,"applicantNoOfFloorsProposed":0,"applicantDoAnyOfTheExistingStructuresRequireDemolitionOrEnvironmentalClearance":"no","applicantHaveAnyInfrastructureWorksAlreadyReceivedTechnicalApproval":"no","applicantIsTheProjectSubjectToPhasingOrAnnexation3":"yes","applicantPlannedStartOfConstruction":"2026-09-01T00:00:00","applicantEstimatedConstructionPeriod":24,"applicantPlannedStartOfConstruction2":"2028-09-01T00:00:00","applicantWillTheDevelopmentBeImplementedInPhases":"yes","applicantAreThereExternalDependencies":"no","applicantTimelinePerPhase":[{"applicantBriefDescriptionOfThePhase":"Phase 1 — Site preparation, infrastructure, first 4 warehouse units","applicantStart2":"2026-09-01T00:00:00","applicantStart3":"2027-09-01T00:00:00"},{"applicantBriefDescriptionOfThePhase":"Phase 2 — BPO center, manufacturing units, logistics yard","applicantStart2":"2027-09-01T00:00:00","applicantStart3":"2028-09-01T00:00:00"}],"applicantValueOfLand":50000000,"applicantValueOfLand2":25000000,"applicantOnSiteInfrastructure":30000000,"applicantBuildingFactoryDevelopmentCost":5000000,"applicantEquity":40,"applicantEquity2":50,"applicantDebt":5,"applicantGrant":5,"applicantPleaseDescribe":"Primary equity from Caribbean Group International. Debt financing from Development Bank of Jamaica. Government incentive grant pending approval.","applicantBrieflyExplainOurBusinessModel":"The zone will host 15-20 occupants spanning manufacturing, warehousing, and BPO sectors. Target tenants include garment manufacturers serving the US market, pharmaceutical packaging operations, and regional distribution centers.","applicantEquity3":50,"applicantDebt3":35,"applicantOther":15,"applicantPleaseDescribe2":"Revenue from tenant lease payments (base rent + CAM), service fees for shared infrastructure (security, waste management, utilities metering), and value-added services (customs brokerage facilitation).","applicantDoYouHaveLoIsOrConfirmedOccupants":"yes","applicantYear5":3,"applicantYear1TempJobs2":3,"applicantYear6":10,"applicantYear2TempJobs2":10,"applicantYear7":18,"applicantYear3TempJobs":18,"applicantEquity4":80,"applicantDebt2":60,"applicantGrant2":30,"applicantDoYouExpectAnyOfYourTenantsToBeExporters":"yes","applicantAreYourOccupantsExpectedToBeExportOriented":"yes","applicantYear1":200,"applicantYear4":80,"applicantYear2":500,"applicantYear1TempJobs":200,"applicantYear3":1200,"applicantYear2TempJobs":500,"applicantWhatOrGoodsAndServicesDoYouExpectOccupantsToSourceLocally":"yes","applicantBrieflyDescribeHowYourProjectWillBenefitJamaica":"The project will create over 1,200 direct jobs within 5 years, primarily in manufacturing and logistics. It will increase Jamaica's export capacity, attract foreign direct investment, and develop specialized workforce skills in advanced manufacturing.","applicantIsTheProjectBeingFinancedByTheDeveloperDirectlyByInvestorsOrThroughAffiliatedEntities":{"developersOwnFunds":true,"thirdPartyInvestors":true,"affiliatedCompany":false},"applicantProvideAShortDescriptionOfHowTheProjectIsFinanced":"60% developer equity through Caribbean Group International. 30% debt financing from Development Bank of Jamaica. 10% incentive grants from JAMPRO/government programs.","applicantHasTheDeveloperCompanyAnyOfItsOwnersDirectorsOrFinanciersEverBeenSubjectToFinancialSanctionsMoneyLaunderingInvestigationsOrRegulatoryPenaltiesInJamaicaOrAbroad":"no","applicantDoesTheDeveloperCompanyOrAnyOfItsShareholdersDirectorsOrAffiliatedFirmsHaveLinksToAnyExistingSezLicensedCompaniesInJamaica":"no","applicantDoesTheDeveloperCompanyOrAnyOfItsShareholdersDirectorsOrAffiliatedEntitiesIntendToIncludeAnyOccupantsOrZoneUsersThatWereAlreadyOperationalAndGeneratingRevenuePriorToThisSezApplication":"no","applicantWasTheDeveloperCompanyAlreadyOperationalAndGeneratingRevenueBeforeApplyingForSezStatus":"no","applicantWillActivitiesIncludeTheHandlingOfExciseGoods":"no","applicantOHsManagementSystem":"yes","applicantScopeAndImprovement":"yes","applicantOhSPolicy":"yes","applicantOhSManagementSystem":"yes","applicantOhSLegalRequirements":"yes","applicantControlsInPlace":"yes","applicantTraining":"yes","applicanttrainingNeeds":"yes","applicantInventoryControls":"yes","applicantconsultation":"yes"},"test":{"_meta":{"serviceId":"d51d6c78-5ead-c948-0b82-0d9bc71cd712","serviceName":"Jamaica - Establish a new zone","scenario":"test","generatedAt":"2026-03-05T16:00:00Z","fieldCount":30,"mcpServer":"BPA-jamaica"},"applicantProposedNameOfZone":"Test Zone A","applicantMultiOrSingleOccupant":"single","applicantMultiOrSingleOccupant2":"single","applicantCity3":"St. Catherine","applicantAddress3":"1 Main St","applicantTotalLandArea3":100,"applicantUnit3":"Square meters","applicantCompanyName":"Test Corp","applicantTaxRegistrationNumberTrn2":"COJ-001","applicantTaxRegistrationNumberTrn":"111-222-333","applicantCity":"St. Catherine","applicantAddress":"1 Main St","applicantPhone":"8765551111","applicantEmail":"test@test.com","applicantNames":"John","applicantLastName":"Doe","applicantPhone2":"8765552222","applicantEmail2":"j.doe@test.com","applicantCompanyName2":"Test Corp","applicantLegalType2":"LLC","applicantCountryOfRegistration":"Jamaica","applicantEditGrid":[{"applicantName":"John Doe","applicantNationality":"Jamaica","applicantRadio":"no","applicantBeneficialOwner":"yes","applicantOfTotalShares":100}],"applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany":"no","applicantParentCompanies":[{"applicantParentCompanyName":"Test Parent","applicantLegalType":"Corporation","applicantCountryOfOrigin":"Jamaica"}],"applicantParcelsDescriptionGrid":[{"applicantPlotParcelDesignation":"Lot 1","applicantPrivateOrPublicLand":"private","applicantDoYouHaveRightsOnThisLand":"held","applicantWhatTypeOfRightsDoYouHave":"ownership"}],"applicantUnit2":"Square meters","applicantNumberOfPlotsBlocksParcels":1,"applicantTotalLandArea":100,"applicantUnit":"Square meters","applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation":"no","applicantValueOfLand":1000,"applicantValueOfLand2":500,"applicantOnSiteInfrastructure":500,"applicantBuildingFactoryDevelopmentCost":100}}};

  // BUILD_INJECT_ROLE_PRESETS (replaced by build script with actual data)
  const EMBEDDED_ROLE_PRESETS = {"2d3c18a3-be2b-4533-a898-ed0bd946afd3":{"Applicant (Part A)":{"_meta":{"serviceId":"2d3c18a3-be2b-4533-a898-ed0bd946afd3","serviceName":"Film production permit","role":"Applicant (Part A)","scenario":"demo","generatedAt":"2026-03-11T14:30:00.000Z","fieldCount":46,"notes":{"selectFields":"Select values use catalog entries. applicantType uses catalog e4a89764, applicantParish uses catalog 90b10436, applicantTypeOfApplicant uses catalog fd1f27d9, applicantNationality uses country_selection, applicantSelectMethod uses catalog 1783331a, applicantSelectPortOfEntry2 is a subCatalog dependent on method, applicantAirline uses catalog b817ab42, applicantCategory has no catalog info in flat export.","fileFields":"applicantUploadTheCompletedExcelTemplateSCorrespondingToTheItemsListedAbove, applicantUploadWardrobeList, applicantUpload — must be uploaded manually.","editgrids":"applicantImportAndEquipment contains nested fieldsets (import method, customs broker, equipment list). applicantEditGrid is nested inside it for individual items."}},"applicantTitle":"Caribbean Storm: The Kingston Protocol","applicantType":"Feature film","applicantHhortSynopsisMaximum600Characters":"A retired intelligence officer is pulled back into action when a rogue operative threatens to destabilize the Caribbean. Filming across Kingston and Montego Bay, the production features high-octane chase sequences through downtown Kingston, scenic helicopter shots over the Blue Mountains, and dramatic confrontations at Port Royal. The story celebrates Jamaica's culture while delivering world-class action cinema.","applicantProductionFrom":"2026-06-15T00:00:00","applicantProductionEnd":"2026-08-30T00:00:00","applicantTotalFilmingDuration":55,"applicantParish":"Kingston","applicantProposedProductionLocations":"1. Downtown Kingston — New Kingston business district (chase sequences, office interiors)\n2. Port Royal — Historic fort and waterfront (climactic confrontation scenes)\n3. Blue Mountains — John Crow Peak trail area (helicopter aerial shots, mountain hideout scenes)\n4. Montego Bay — Hip Strip and Doctor's Cave Beach (resort scenes, undercover meetings)\n5. Trelawny — Cockpit Country (jungle pursuit sequences)\n6. Kingston Harbour — Industrial waterfront (night action sequences)","applicantTypeOfApplicant":"Company","applicantNationality":"United States of America","applicantSelectIfApplicable":false,"applicantFullName":"Marcus J. Wellington","applicantName":"Trident Bay Productions LLC","applicantContactPersonaName":"Samantha R. Chen","applicantProductionTitle2":"+1-310-555-7842","applicantAdress":"4200 Wilshire Boulevard, Suite 1100, Los Angeles, CA 90010, United States","applicantEmail":"samantha.chen@tridentbayproductions.com","applicantLocalProductionManager":"Island Light Film Services Ltd.","applicantemail":"bookings@islandlightfilms.com.jm","applicantLocalProducer":"Devon A. Campbell","applicantemail2":"devon.campbell@islandlightfilms.com.jm","applicantEquipmentRentalManagerName":"Natasha K. Browne","applicantemail3":"natasha.browne@caribgear.com.jm","applicantJamaicanPersonnel":85,"applicantNonJamaicanPersonnel":42,"applicantBudgetedExpenditureInJamaica":12500000,"applicantBudgetedExpenditureInJamaica2":4800000,"applicantWillYouImportEquipmentInJamaica":"yes","applicantDoYouAlreadyKnowYourImportMethodAndDetails":"yes","applicantImportAndEquipment":[{"applicantSelectMethod":"by air cargo","applicantSelectPortOfEntry2":"Norman Manley International Airport","applicantArrivalDate":"2026-06-10T00:00:00","applicantFlightNumber":"AA2417","applicantAirline":"American Airlines","applicantAirwayBill":"001-7845-2936","applicantPassengerName":"Robert M. Tanner","applicantVesselName":"","applicantBillOfLading":"","applicantName2":"Caribbean Customs Brokers Ltd.","applicantCustomsBrokerEmail":"clearance@caribcustoms.com.jm","applicantPhone":"+1-876-922-4500","applicantEditGrid":[{"applicantCategory":"Camera","applicantDescription":"ARRI ALEXA Mini LF cinema camera body with accessories","applicantBrandModel":"ARRI ALEXA Mini LF","applicantSerial":"K1.0024873","applicantQuantity":3,"applicantWeight":12.5,"applicantUnitPrice":65000},{"applicantCategory":"Lens","applicantDescription":"Cooke Anamorphic/i SF prime lens set (32mm, 50mm, 75mm, 100mm)","applicantBrandModel":"Cooke Anamorphic/i SF","applicantSerial":"SF-SET-00482","applicantQuantity":4,"applicantWeight":8.2,"applicantUnitPrice":28000}]},{"applicantSelectMethod":"by sea cargo","applicantSelectPortOfEntry2":"Kingston","applicantArrivalDate":"2026-06-08T00:00:00","applicantFlightNumber":"","applicantAirline":"","applicantAirwayBill":"","applicantPassengerName":"","applicantVesselName":"MV Atlantic Carrier","applicantBillOfLading":"KKLU-2026-JAM-04872","applicantName2":"Caribbean Customs Brokers Ltd.","applicantCustomsBrokerEmail":"clearance@caribcustoms.com.jm","applicantPhone":"+1-876-922-4500","applicantEditGrid":[{"applicantCategory":"Grip","applicantDescription":"Chapman Leonard PeeWee IV dolly with accessories and track","applicantBrandModel":"Chapman PeeWee IV","applicantSerial":"PW4-11287","applicantQuantity":2,"applicantWeight":185,"applicantUnitPrice":42000},{"applicantCategory":"Lighting","applicantDescription":"ARRI SkyPanel S360-C LED soft light panel","applicantBrandModel":"ARRI SkyPanel S360-C","applicantSerial":"SP360-07823","applicantQuantity":6,"applicantWeight":25.4,"applicantUnitPrice":18500}]}],"applicantDoesYourProductionInvolveAnyOfTheFollowingSelectAllThatApply":{"drones":true,"radios":true,"cellularPhones":false,"gunsAndExplosives":true,"underwaterFilming":false,"airports":true},"applicantWhenWouldYouLikeToCompleteThePayment":"now"},"Approval":{"_meta":{"serviceId":"2d3c18a3-be2b-4533-a898-ed0bd946afd3","serviceName":"Film production permit","role":"Approval","roleId":"bfa78b70-2ee3-477f-ac2f-a72504f5f828","scenario":"approve","generatedAt":"2026-03-11T14:30:00.000Z","fieldCount":4,"notes":"Most Approval role fields are disabled/readonly (copyValueFrom review/applicant). Editable fields: approvalPaymentConfirmed (checkbox), approvalPermitNumber (textfield), approvalBondWaiverNumber (textfield inside editgrid), approvalReviewersComments2 (textarea). The editgrid approvalImportOperations copies from applicant and its inner fields are disabled except for officer document fields (bond waiver number, file uploads)."},"approvalPaymentConfirmed":true,"approvalPermitNumber":"FPP-2026-0147","approvalImportOperations":[{"approvalBondWaiverNumber":"BW-2026-KGN-00312"},{"approvalBondWaiverNumber":"BW-2026-KGN-00313"}],"approvalReviewersComments2":"Application approved. Payment of USD 300 administrative fee has been verified and confirmed. Permit number FPP-2026-0147 issued. Bond waiver numbers assigned for both import operations. All documentation is in order. Production may proceed as scheduled from June 15, 2026."},"Review":{"_meta":{"serviceId":"2d3c18a3-be2b-4533-a898-ed0bd946afd3","serviceName":"Film production permit","role":"Review","roleId":"63bb5a19-ff48-4210-b9ec-e573756f24eb","scenario":"approve","generatedAt":"2026-03-11T14:30:00.000Z","fieldCount":1,"notes":"Most Review role fields are disabled/readonly (copyValueFrom applicant). Only reviewReviewersComments is editable."},"reviewReviewersComments":"Application reviewed and verified. Production details are complete and consistent. All equipment import declarations match the uploaded lists. Local production service provider (Island Light Film Services Ltd.) is a known and reputable company. Budget allocation appears realistic for the scope of production. Recommended for approval."}},"0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc":{"ARC":{"_meta":{"roleId":"a0de7cbd-84de-4f9c-bcf2-f5e7f5dd43c4","roleName":"ARC","scenario":"approve","fieldCount":117},"applicationReviewingCommitteeArcDecisionCasRecommendation2":"preApproval","applicationReviewingCommitteeArcDecisionCasComments2":"Compliance assessment completed satisfactorily. All regulatory requirements met.","applicationReviewingCommitteeArcDecisionLsuARecommendationyy":"preApproval","applicationReviewingCommitteeArcDecisionConditionsyy":"no","applicationReviewingCommitteeArcDecisionRisksyy":"no","applicationReviewingCommitteeArcDecisionCommentsyy":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisionLsuAConditionsGrid":[],"applicationReviewingCommitteeArcDecisionConditionyy":"Standard conditions apply as per JSEZA operational guidelines.","applicationReviewingCommitteeArcDecisionJustificationyy":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","applicationReviewingCommitteeArcDecisionTypeyy":"Precedent","applicationReviewingCommitteeArcDecisionMilestoneyy":"ARC","applicationReviewingCommitteeArcDecisionTimelineyy":"30 days","applicationReviewingCommitteeArcDecisionSpecifyyy":"","applicationReviewingCommitteeArcDecisionLsuARisksGrid":[],"applicationReviewingCommitteeArcDecisionIdentifiedRiskyy":"Low risk. No significant concerns identified during evaluation.","applicationReviewingCommitteeArcDecisionLikelihoodyy":"Low","applicationReviewingCommitteeArcDecisionImpactyy":"Low","applicationReviewingCommitteeArcDecisionMitigationStrategyy":"Standard monitoring and compliance verification procedures to be applied.","applicationReviewingCommitteeArcDecisionRecommendation5":"preApproval","applicationReviewingCommitteeArcDecisionComments5":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisionRecommendation3":"preApproval","applicationReviewingCommitteeArcDecisionConditions3":"no","applicationReviewingCommitteeArcDecisionRisks3":"no","applicationReviewingCommitteeArcDecisionComments3":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisionCasAConditionsGrid":[],"applicationReviewingCommitteeArcDecisionCondition4":"Standard conditions apply as per JSEZA operational guidelines.","applicationReviewingCommitteeArcDecisionJustification4":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","applicationReviewingCommitteeArcDecisionType4":"Precedent","applicationReviewingCommitteeArcDecisionMilestone4":"ARC","applicationReviewingCommitteeArcDecisionTimelinexx":"30 days","applicationReviewingCommitteeArcDecisionSpecify3":"","applicationReviewingCommitteeArcDecisionCasARisksGrid":[],"applicationReviewingCommitteeArcDecisionIdentifiedRisk4":"Low risk. No significant concerns identified during evaluation.","applicationReviewingCommitteeArcDecisionLikelihood4":"Low","applicationReviewingCommitteeArcDecisionImpact4":"Low","applicationReviewingCommitteeArcDecisionMitigationStrategy4":"Standard monitoring and compliance verification procedures to be applied.","applicationReviewingCommitteeArcDecisionRecommendation":"preApproval","applicationReviewingCommitteeArcDecisionTsiComments":"Technical services and infrastructure assessment completed. All standards met.","applicationReviewingCommitteeArcDecisionRecommendation4":"preApproval","applicationReviewingCommitteeArcDecisionConditions4":"no","applicationReviewingCommitteeArcDecisionRisks4":"no","applicationReviewingCommitteeArcDecisionComments4":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisionTsiAConditionsGrid":[],"applicationReviewingCommitteeArcDecisionCondition5":"Standard conditions apply as per JSEZA operational guidelines.","applicationReviewingCommitteeArcDecisionJustification5":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","applicationReviewingCommitteeArcDecisionType5":"Precedent","applicationReviewingCommitteeArcDecisionMilestone5":"ARC","applicationReviewingCommitteeArcDecisionTimeline4":"30 days","applicationReviewingCommitteeArcDecisionSpecifyTimeline2":"","applicationReviewingCommitteeArcDecisionTsiARisksGrid":[],"applicationReviewingCommitteeArcDecisionIdentifiedRisk5":"Low risk. No significant concerns identified during evaluation.","applicationReviewingCommitteeArcDecisionLikelihood5":"Low","applicationReviewingCommitteeArcDecisionImpact5":"Low","applicationReviewingCommitteeArcDecisionMitigationStrategy5":"Standard monitoring and compliance verification procedures to be applied.","applicationReviewingCommitteeArcDecisionCasRecommendation":"preApproval","applicationReviewingCommitteeArcDecisionCasComments":"Compliance assessment completed satisfactorily. All regulatory requirements met.","applicationReviewingCommitteeArcDecisionRecommendation2":"preApproval","applicationReviewingCommitteeArcDecisionConditions2":"no","applicationReviewingCommitteeArcDecisionRisks2":"no","applicationReviewingCommitteeArcDecisionComments2":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisioneditgrid2":[],"applicationReviewingCommitteeArcDecisionCondition2":"Standard conditions apply as per JSEZA operational guidelines.","applicationReviewingCommitteeArcDecisionJustification2":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","applicationReviewingCommitteeArcDecisionType2":"Precedent","applicationReviewingCommitteeArcDecisionMilestone2":"ARC","applicationReviewingCommitteeArcDecisionTimeline2":"30 days","applicationReviewingCommitteeArcDecisionSpecify":"","applicationReviewingCommitteeArcDecisionRisksGrid2":[],"applicationReviewingCommitteeArcDecisionIdentifiedRisk2":"Low risk. No significant concerns identified during evaluation.","applicationReviewingCommitteeArcDecisionLikelihood2":"Low","applicationReviewingCommitteeArcDecisionImpact2":"Low","applicationReviewingCommitteeArcDecisionMitigationStrategy2":"Standard monitoring and compliance verification procedures to be applied.","applicationReviewingCommitteeArcDecisionDecisionTajArc":"true","applicationReviewingCommitteeArcDecisionReceivedTaj":"2026-03-08T09:00:00","applicationReviewingCommitteeArcDecisionDateTime":"2026-03-11T10:00:00","applicationReviewingCommitteeArcDecisionCommentsTaj":"TAJ has confirmed no outstanding tax obligations. Non-objection received.","applicationReviewingCommitteeArcDecisionDecisionTajArc2":"true","applicationReviewingCommitteeArcDecisionReceivedTaj2":"2026-03-08T09:00:00","applicationReviewingCommitteeArcDecisionsentTaj":"2026-03-07T14:00:00","applicationReviewingCommitteeArcDecisionCommentsTaj2":"TAJ has confirmed no outstanding tax obligations. Non-objection received.","applicationReviewingCommitteeArcDecisionDecisionJcaArc":"true","applicationReviewingCommitteeArcDecisionReceivedJca":"2026-03-08T09:00:00","applicationReviewingCommitteeArcDecisionsentJca":"2026-03-07T14:00:00","applicationReviewingCommitteeArcDecisionCommentsTaj3":"TAJ has confirmed no outstanding tax obligations. Non-objection received.","applicationReviewingCommitteeArcDecisionDoesTheApplicationRequireAdditionalInformationOrSupportingDocumentationBeforeProceedingToTheNextStage":"no","applicationReviewingCommitteeArcDecisionEditGrid3":[],"arcAppRevCommitteeTypeOfRequest":"document","arcAppRevCommitteeDocumentName":"Additional supporting documentation","applicationReviewingCommitteeArcDecisionDocumentNameAndReason2":"Additional supporting documentation","applicationReviewingCommitteeArcDecisionSelectUnitsThatWillReview3":"","arcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","arcAppRevCommitteeArcAdditionalInfoEditGrid":[],"arcAppRevCommitteeRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","arcAppRevCommitteeReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","arcAppRevCommitteeRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year.","arcAppRevCommitteeSelectUnitsThatWillReview2":"","applicationReviewingCommitteeArcDecisionTsiRecommendation":"preApproval","applicationReviewingCommitteeArcDecisionConditions":"no","applicationReviewingCommitteeArcDecisionRisks":"no","applicationReviewingCommitteeArcDecisionComments6":"Application Review Committee has reviewed all evaluations and recommends approval.","applicationReviewingCommitteeArcDecisioneditgrid3":[],"applicationReviewingCommitteeArcDecisionCondition3":"Standard conditions apply as per JSEZA operational guidelines.","applicationReviewingCommitteeArcDecisionJustification3":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","applicationReviewingCommitteeArcDecisionType3":"Precedent","arcAppRevCommitteeEntity":"ARC","applicationReviewingCommitteeArcDecisionTimeline3":"30 days","applicationReviewingCommitteeArcDecisionSpecify2":"","applicationReviewingCommitteeArcDecisionRisksGrid3":[],"applicationReviewingCommitteeArcDecisionIdentifiedRisk3":"Low risk. No significant concerns identified during evaluation.","applicationReviewingCommitteeArcDecisionLikelihood3":"Low","applicationReviewingCommitteeArcDecisionImpact3":"Low","applicationReviewingCommitteeArcDecisionMitigationStrategy3":"Standard monitoring and compliance verification procedures to be applied.","applicationReviewingCommitteeArcDecisionCounterTaj":1,"applicationReviewingCommitteeArcDecisionCounterJca":1,"applicationReviewingCommitteeArcDecisionCounterMof":1,"applicationReviewingCommitteeArcDecisionCounterSumNonObjections":3,"applicationReviewingCommitteeArcDecisionMax":3},"Board":{"_meta":{"roleId":"59530d8d-87ad-4b99-9775-40be489166f4","roleName":"Board","scenario":"approve","fieldCount":57},"boardArcRecommendation":"preApproval","boardConditions5":"no","boardRisks5":"no","boardComments5":"Reviewed and found satisfactory. No issues identified.","boardArcConsolidatedConditions":[],"boardCondition5":"Standard conditions apply as per JSEZA operational guidelines.","boardJustification5":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","boardEntity":"ARC","boardBeforeAfter":"Precedent","boardTimeline5":"30 days","boardSpecify4":"","boardArcConsolidatedRisks":[],"boardIdentifiedRisk5":"Low risk. No significant concerns identified during evaluation.","boardLikelihood5":"Low","boardImpact5":"Low","boardMitigationStrategy4":"Standard monitoring and compliance verification procedures to be applied.","boardDecisionTajArc":"true","boardReceivedTaj":"2026-03-08T09:00:00","boardsentTaj":"2026-03-07T14:00:00","boardCommentsTaj":"TAJ has confirmed no outstanding tax obligations. Non-objection received.","boardDecisionJcaArc":"true","boardReceivedJca":"2026-03-08T09:00:00","boardsentJca":"2026-03-07T14:00:00","boardCommentsJca":"JCA has reviewed customs compliance history. Non-objection received.","boardDecisionMofpsArc":"true","boardReceivedMof":"2026-03-08T09:00:00","boardsentMof":"2026-03-07T14:00:00","boardCommentsMofps":"Ministry of Finance has reviewed the fiscal implications. Non-objection received.","boardMembers":7,"boardVotesCast":7,"boardPChairOrDeputyChairVoted1P":true,"boardPChairOrDeputyChairVotedP":true,"boardApproved1":7,"boardDenied1":0,"boardDeferred1":0,"boardApproved2":7,"boardDenied2":0,"boardDeferred3":0,"boardVotesDataGrid":[],"boardName2":"Board Member","boardTitle":"Director","boardVote":"approved","boardReasonForDeferral":"","boardApproved6":7,"boardDenied4":0,"boardDeferred2":0,"approvalEvaluatorsComments2":"Application thoroughly evaluated. All criteria satisfactorily met. Recommend approval.","boardBoardDecision":"Approved","boardQuorumReachedUnreached":"Reached","boardSendEmail":[],"boardFullName":"Board Secretary","boardFirstName":"Board","boardLastName":"Secretary","boardEmail2":"board.secretary@jseza.gov.jm","boardMobilePhone":"+1-876-555-0200","boardNumberOrRowsGdb":0,"boardNumberOfRowsGrid":0},"Business approval":{"_meta":{"roleId":"b821ad92-2391-4bef-a2a9-03d87abacbd9","roleName":"Business approval","scenario":"approve","fieldCount":22},"businessApprovalCommentsFromEvaluator":"Application thoroughly evaluated. All criteria satisfactorily met. Recommend approval.","businessApprovalCommentsToEvaluator":"Application thoroughly evaluated. All criteria satisfactorily met. Recommend approval.","businessApprovalEditGrid":[],"businessApprovalRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","businessApprovalReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","businessApprovalRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year.","businessApprovalRecommendation":"preApproval","businessApprovalConditions":"no","businessApprovalRisks":"no","businessApprovalComments":"Business plan reviewed and found to be comprehensive. Financial projections are realistic and well-supported.","businessApprovalBpssRConditionsGrid":[],"businessApprovalCondition2":"Standard conditions apply as per JSEZA operational guidelines.","businessApprovalJustification2":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","businessApprovalBeforeAfter":"Precedent","businessApprovalMilestone":"ARC","businessApprovalTimeline2":"30 days","businessApprovalSpecify2":"","businessApprovalRisksGrid":[],"businessApprovalIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","businessApprovalLikelihood":"Low","businessApprovalImpact":"Low","businessApprovalMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied."},"Business evaluation":{"_meta":{"roleId":"2a87aeab-3705-44ed-b1fc-a4afc41d0a56","roleName":"Business evaluation","scenario":"approve","fieldCount":22},"businessReviewComments":"Business plan reviewed and found to be comprehensive. Financial projections are realistic and well-supported.","businessReviewCommentsForApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","businessReviewRecommendation":"preApproval","businessReviewConditions":"no","businessReviewRisks":"no","businessReviewComments2":"Business plan reviewed and found to be comprehensive. Financial projections are realistic and well-supported.","businessRevieweditgrid":[],"businessReviewCondition":"Standard conditions apply as per JSEZA operational guidelines.","businessReviewJustification":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","businessReviewType":"Precedent","businessEvaluationBeforeStep":"ARC","businessReviewTimeline":"30 days","businessReviewSpecify":"","businessReviewRisksGrid":[],"businessReviewIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","businessReviewLikelihood":"Low","businessReviewImpact":"Low","businessReviewMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied.","businessEvaluationEditGrid":[],"businessEvaluationRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","businessEvaluationReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","businessEvaluationRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year."},"CEO validation":{"_meta":{"roleId":"99113077-e9d9-4f58-a971-77363cc2b0e2","roleName":"CEO validation","scenario":"approve","fieldCount":0,"note":"File upload and button components only - no fillable fields for bookmarklet"}},"Compliance approval":{"_meta":{"roleId":"2b4e6815-ea08-4a2d-ae8d-f17f48777dd4","roleName":"Compliance approval","scenario":"approve","fieldCount":22},"complianceApprovalComments":"Reviewed and found satisfactory. No issues identified.","complianceApprovalCommentsFromReviewer":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","complianceApprovalEditGrid":[],"complianceApprovalRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","complianceApprovalReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","complianceApprovalRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year.","complianceApprovalRecommendation":"preApproval","complianceApprovalConditions":"no","complianceApprovalRisks":"no","complianceApprovalComments2":"Reviewed and found satisfactory. No issues identified.","complianceApprovalCasRConditionsGrid":[],"complianceApprovalCondition2":"Standard conditions apply as per JSEZA operational guidelines.","complianceApprovalJustification2":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","complianceApprovalBeforeAfter":"Precedent","complianceApprovalMilestone":"ARC","complianceApprovalTimeline2":"30 days","complianceApprovalSpecify2":"","complianceApprovalRisksGrid":[],"complianceApprovalIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","complianceApprovalLikelihood":"Low","complianceApprovalImpact":"Low","complianceApprovalMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied."},"Compliance evaluation":{"_meta":{"roleId":"32ba8fae-b5cb-451e-bc63-9781806e3fb9","roleName":"Compliance evaluation","scenario":"approve","fieldCount":22},"complianceReviewCommentsFromReviewer":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","complianceReviewCommentsFromApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","complianceReviewRecommendation":"preApproval","complianceReviewConditions":"no","complianceReviewRisks":"no","complianceReviewComments":"Reviewed and found satisfactory. No issues identified.","complianceRevieweditgrid":[],"complianceReviewCondition":"Standard conditions apply as per JSEZA operational guidelines.","complianceReviewJustification":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","complianceReviewType":"Precedent","complianceEvaluationEntity":"ARC","complianceReviewTimeline":"30 days","complianceReviewSpecify":"","complianceReviewRisksGrid":[],"complianceReviewIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","complianceReviewLikelihood":"Low","complianceReviewImpact":"Low","complianceReviewMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied.","complianceEvaluationEditGrid":[],"complianceEvaluationRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","complianceEvaluationReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","complianceEvaluationRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year."},"Documents review":{"_meta":{"roleId":"318ad3a0-c09d-4459-9a50-47f1211618c8","roleName":"Documents review","scenario":"approve","fieldCount":61},"documentSreviewRadio":"Yes","documentSreviewcommentBusinessPlan":"Business plan reviewed and found to be comprehensive. Financial projections are realistic and well-supported.","documentSreviewRadioInfrastructure":"Yes","documentSreviewcommentInfrastructure":"Infrastructure layout plan is complete and meets all regulatory requirements.","documentSreviewRadioLicences":"Yes","documentSreviewcommentLicences":"All required licences and supporting documents have been verified and are valid.","documentSreviewRadioResettlement":"Yes","documentSreviewcommentResettlement":"Resettlement statement reviewed. No displacement issues identified.","documentSreviewRadioLandlord":"Yes","documentSreviewcommentLandlord":"Landlord affidavit verified and properly notarized.","documentSreviewRadioApprovedPlans":"Yes","documentSreviewcommentApprovedPlans":"Reviewed and found satisfactory. No issues identified.","documentSreviewRadioOccHealth":"Yes","documentSreviewcommentOccHealth":"Occupational health and safety documentation is satisfactory and meets OSHA requirements.","documentSreviewRadioTaxCompliance":"Yes","documentSreviewcommentTaxCompliance":"Tax compliance certificate verified with TAJ. Entity is in good standing.","documentSreviewRadioFinalMaster":"Yes","documentSreviewcommentFinalMaster":"Master plan reviewed and found comprehensive.","documentSreviewRadioOccupancy":"Yes","documentSreviewcommentOccupancy":"Occupational health and safety documentation is satisfactory and meets OSHA requirements.","documentSreviewRadioLandDispute":"Yes","documentSreviewcommentLandDispute":"Affidavit of no land dispute verified. No encumbrances found on record.","documentSreviewRadioDesignPlans":"Yes","documentSreviewcommentDesignPlans":"Design plans reviewed and found compliant with development order requirements.","documentSreviewRadioSafetySecurity":"Yes","documentSreviewcommentSafetySecurity":"Safety, security and business continuity plans are comprehensive and adequate.","documentSreviewRadioOwner":"Yes","documentSreviewcommentOwner":"Owner affidavit verified. Ownership documentation consistent with title records.","documentSreviewRadioArticles":"Yes","documentSreviewcommentArticles":"Articles of incorporation verified with Companies Office of Jamaica.","documentSreviewRadioDisaster":"Yes","documentSreviewcommentDisaster":"Disaster mitigation plan reviewed and found adequate.","documentSreviewRadioPhasing":"Yes","documentSreviewcommentPhasing":"Phasing and expansion plan is realistic and well-structured.","documentSreviewRadioShareCapital":"Yes","documentSreviewcommentShareCapital":"Share capital proof verified. Minimum capitalization requirements met.","documentSreviewRadioTransportMaps":"Yes","documentSreviewcommentTransportMaps":"Transportation maps and logistics plans are satisfactory.","documentSreviewRadioScheduleAreas":"Yes","documentSreviewcommentScheduleAreas":"Schedule of areas reviewed and consistent with submitted plans.","documentSreviewRadioVendor":"Yes","documentSreviewcommentVendor":"Vendor affidavit verified and properly executed.","documentSreviewRadioVisual":"Yes","documentSreviewcommentVisual":"Visual impressions and renderings are of acceptable quality.","documentSreviewRadioCertIncorp":"Yes","documentSreviewcommentCertIncorp":"Certificate of incorporation verified with Companies Office of Jamaica.","documentSreviewRadioLease":"Yes","documentSreviewcommentLease":"Long-term lease agreement reviewed. Terms are acceptable.","documentSreviewRadioExciseGoods":"Yes","documentSreviewcommentExciseGoods":"Excise goods security plan meets JCA requirements.","documentSreviewRadioCertTitle":"Yes","documentSreviewcommentCertTitle":"Certificate of title verified with National Land Agency.","documentSreviewRadioPlotLayout":"Yes","documentSreviewcommentPlotLayout":"Plot layout map is accurate and consistent with surveyor report.","documentSreviewRadioSurveyor":"Yes","documentSreviewcommentSurveyor":"Surveyor identification report verified. Boundaries clearly demarcated.","documentSreviewRadioConceptMaster":"Yes","documentSreviewcommentConceptMaster":"Master plan reviewed and found comprehensive.","documentSreviewRadioLandUse":"Yes","documentSreviewcommentLandUse":"Land use plan is compatible with local development order.","documentSreviewCommentsOfTheReviewer":"All documents reviewed and verified. Application package is complete."},"Legal approval":{"_meta":{"roleId":"0d52653d-ffc2-4225-ac73-42e02a83ea21","roleName":"Legal approval","scenario":"approve","fieldCount":22},"legalApprovalCommentsForTheApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","legalApprovalCommentsFromTheApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","legalApprovalEditGrid":[],"legalApprovalRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","legalApprovalReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","legalApprovalRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year.","legalApprovalLsuRRecommendation":"preApproval","legalApprovalConditionsxx":"no","legalApprovalRisksxx":"no","legalApprovalCommentsxx":"Reviewed and found satisfactory. No issues identified.","legalApprovalLsuRConditionsGrid2":[],"legalApprovalCondition":"Standard conditions apply as per JSEZA operational guidelines.","legalApprovalJustification":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","legalApprovalBeforeAfter":"Precedent","legalApprovalMilestone":"ARC","legalApprovalTimeline":"30 days","legalApprovalSpecify":"","legalApprovalTsiRRisksGrid":[],"legalApprovalIdentifiedRiskxx":"Low risk. No significant concerns identified during evaluation.","legalApprovalLikelihoodxx":"Low","legalApprovalImpactxx":"Low","legalApprovalMitigationStrategyxx":"Standard monitoring and compliance verification procedures to be applied."},"Legal evaluation":{"_meta":{"roleId":"998caef5-e46f-474d-9106-266dc6db9423","roleName":"Legal evaluation","scenario":"approve","fieldCount":22},"legalReviewCommentsForApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","legalReviewCommentsFromApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","legalReviewRecommendation":"preApproval","legalReviewConditions":"no","legalReviewRisks":"no","legalReviewComments":"Reviewed and found satisfactory. No issues identified.","legalReviewTsiRConditionsGrid":[],"legalReviewCondition":"Standard conditions apply as per JSEZA operational guidelines.","legalReviewJustification":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","legalReviewType":"Precedent","legalEvaluationEntity":"ARC","legalReviewTimeline":"30 days","legalReviewSpecify":"","legalReviewTsiRRisksGrid":[],"legalReviewIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","legalReviewLikelihood":"Low","legalReviewImpact":"Low","legalReviewMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied.","legalEvaluationEditGrid":[],"legalEvaluationRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","legalEvaluationReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","legalEvaluationRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year."},"Technical evaluation":{"_meta":{"serviceId":"0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc","serviceName":"SEZ - Technical evaluation","scenario":"approve","generatedAt":"2026-03-11T21:15:03.097687+00:00","fieldCount":22},"technicalServicesInfrastructureComments":"Infrastructure layout plan is complete and meets all regulatory requirements.","technicalReviewComments":"Reviewed and found satisfactory. No issues identified.","technicalServicesInfrastructureRecomendation":"ministerialApproval","technicalReviewConditions":"no","technicalReviewConditions2":"no","technicalReviewCommentsForApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","technicalServicesInfrastructureeditgrid":[],"technicalReviewCondition":"Standard conditions apply as per JSEZA operational guidelines.","technicalReviewCondition2":"Standard conditions apply as per JSEZA operational guidelines.","technicalReviewType":"Precedent","technicalEvaluationEntity":"ARC","technicalReviewTimeline":"30 days","technicalReviewSpecify":"","technicalReviewRisksAssessment":[],"technicalReviewIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","technicalReviewLikelihood":"Low","technicalReviewLikelihood2":"Low","technicalReviewMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied.","technicalEvaluationEditGrid":[],"technicalEvaluationRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","technicalEvaluationReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","technicalEvaluationRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year."},"Technical approval":{"_meta":{"serviceId":"0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc","serviceName":"SEZ - Technical approval","scenario":"approve","generatedAt":"2026-03-11T21:15:03.097687+00:00","fieldCount":22},"technicalApprovalCommentsForApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","technicalApprovalCommentsFromApprover":"Evaluation report reviewed and approved. Findings are consistent and well-documented.","technicalApprovalEditGrid":[],"technicalApprovalRowArcAppRevCommitteeTypeOfInformationRequested":"Compliance verification report","technicalApprovalReasonsExplanations":"Required for due diligence verification as per JSEZA standard procedures.","technicalApprovalRequiredData":"Updated compliance certificates and financial statements for the most recent fiscal year.","technicalApprovalTsiRRecommendation":"preApproval","technicalApprovalConditions":"no","technicalApprovalRisks":"no","technicalApprovalComments2":"Reviewed and found satisfactory. No issues identified.","technicalApprovalTsiRConditionsGrid":[],"technicalApprovalCondition2":"Standard conditions apply as per JSEZA operational guidelines.","technicalApprovalJustification2":"Condition is standard practice for all new SEZ applications per JSEZA guidelines.","technicalApprovalBeforeAfter":"Precedent","technicalApprovalMilestone":"ARC","technicalApprovalTimeline2":"30 days","technicalApprovalSpecify2":"","technicalApprovalRisksGrid":[],"technicalApprovalIdentifiedRisk":"Low risk. No significant concerns identified during evaluation.","technicalApprovalLikelihood":"Low","technicalApprovalImpact":"Low","technicalApprovalMitigationStrategy":"Standard monitoring and compliance verification procedures to be applied."},"Signature status letter":{"_meta":{"serviceId":"0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc","serviceName":"SEZ - Signature status letter","scenario":"approve","generatedAt":"2026-03-11T21:15:03.097687+00:00","fieldCount":0,"note":"File upload and button components only - no fillable fields for bookmarklet"}}}};

  // Utilities
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function detectServiceId() {
    const url = location.href;
    let m = url.match(/\/services?\/([0-9a-f-]{36})/i);
    if (m) return m[1];
    m = url.match(/\/part-b\/([0-9a-f-]{36})/i);
    if (m) return m[1];
    m = url.match(/[?&]serviceId=([0-9a-f-]{36})/i);
    if (m) return m[1];
    m = url.match(/[?&]file_id=([0-9a-f-]{36})/i);
    if (m) return null; // file_id is not service id
    if (window.wizard?._form?.machineName) return window.wizard._form.machineName;
    if (window.wizardForm?.serviceId) return window.wizardForm.serviceId;
    return null;
  }

  function detectServiceName() {
    const title = document.title?.replace(/[|–-].*$/, '').trim();
    if (title && title.length > 3) return title;
    return $('h1')?.textContent?.trim() || 'Unknown Service';
  }

  function timeAgo(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  // Storage for Part A presets (serviceId -> scenario -> preset)
  const Store = {
    getAll() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
    },
    save(d) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); return true; } catch { return false; }
    },
    getService(sid) { return this.getAll()[sid] || {}; },
    savePreset(sid, scenario, preset) {
      const all = this.getAll();
      if (!all[sid]) all[sid] = {};
      all[sid][scenario] = preset;
      return this.save(all);
    },
    deleteService(sid) { const all = this.getAll(); delete all[sid]; return this.save(all); },
    getRecent() {
      try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
    },
    addRecent(sid, name, scenario) {
      let r = this.getRecent().filter(x => !(x.serviceId === sid && x.scenario === scenario));
      r.unshift({ serviceId: sid, name, scenario, usedAt: Date.now() });
      if (r.length > MAX_RECENT) r = r.slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch {}
    },
    exportAll() { return JSON.stringify(this.getAll(), null, 2); },
    importAll(json) {
      const d = JSON.parse(json);
      if (typeof d !== 'object') throw new Error('Invalid format');
      return this.save(d);
    },
    seedFromEmbedded() {
      if (typeof EMBEDDED_PRESETS === 'string') return; // placeholder, no presets baked in
      const current = this.getAll();
      let seeded = 0;
      Object.entries(EMBEDDED_PRESETS).forEach(([sid, scenarios]) => {
        Object.entries(scenarios).forEach(([sc, preset]) => {
          const existingMeta = current[sid]?.[sc]?._meta;
          const newMeta = preset._meta;
          // only seed if newer or doesn't exist
          if (!existingMeta || (newMeta?.generatedAt && (!existingMeta.generatedAt || newMeta.generatedAt > existingMeta.generatedAt))) {
            if (!current[sid]) current[sid] = {};
            current[sid][sc] = preset;
            seeded++;
          }
        });
      });
      if (seeded > 0) {
        this.save(current);
        console.log(`eR Filler: seeded ${seeded} preset(s) from embedded data`);
      }
    }
  };

  // Storage for Part B role presets (serviceId -> roleName -> preset)
  const RoleStore = {
    getAll() {
      try { return JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY) || '{}'); } catch { return {}; }
    },
    save(d) {
      try { localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(d)); return true; } catch { return false; }
    },
    getService(sid) { return this.getAll()[sid] || {}; },
    getRolePreset(sid, roleName) {
      const svc = this.getService(sid);
      // Exact match first
      if (svc[roleName]) return svc[roleName];
      // Case-insensitive match
      const lower = roleName.toLowerCase();
      for (const [k, v] of Object.entries(svc)) {
        if (k.toLowerCase() === lower) return v;
      }
      return null;
    },
    getRoleNames(sid) { return Object.keys(this.getService(sid)); },
    saveRolePreset(sid, roleName, preset) {
      const all = this.getAll();
      if (!all[sid]) all[sid] = {};
      all[sid][roleName] = preset;
      return this.save(all);
    },
    deleteService(sid) { const all = this.getAll(); delete all[sid]; return this.save(all); },
    seedFromEmbedded() {
      if (typeof EMBEDDED_ROLE_PRESETS === 'string') return; // placeholder
      const current = this.getAll();
      let seeded = 0;
      Object.entries(EMBEDDED_ROLE_PRESETS).forEach(([sid, roles]) => {
        Object.entries(roles).forEach(([roleName, preset]) => {
          const existingMeta = current[sid]?.[roleName]?._meta;
          const newMeta = preset._meta;
          if (!existingMeta || (newMeta?.generatedAt && (!existingMeta.generatedAt || newMeta.generatedAt > existingMeta.generatedAt))) {
            if (!current[sid]) current[sid] = {};
            current[sid][roleName] = preset;
            seeded++;
          }
        });
      });
      if (seeded > 0) {
        this.save(current);
        console.log(`eR Filler: seeded ${seeded} role preset(s) from embedded data`);
      }
    }
  };

  // Seed embedded presets on load
  Store.seedFromEmbedded();
  RoleStore.seedFromEmbedded();

  // Filler
  const Filler = {
    findWizard() { return window.wizard || window.wizardForm?.formio || window.formioApp; },
    fill(patch) {
      const wiz = this.findWizard();
      if (!wiz) return this.fillDOM(patch);
      try {
        // Separate flat+object fields from array (EditGrid/DataGrid) fields
        const flatPatch = {};
        const gridPatch = {};
        Object.entries(patch).forEach(([k, v]) => {
          if (k.startsWith('_')) return;
          if (Array.isArray(v)) gridPatch[k] = v;
          else flatPatch[k] = v;
        });

        // Use the proven Form.io pattern: form.submission = { data: { ...current, ...new } }
        // This properly triggers Form.io's internal setValue on all components
        const formio = window.Formio?.forms;
        let form = null;
        if (formio) {
          const fk = Object.keys(formio)[0];
          if (fk) form = formio[fk];
        }
        const currentData = form?.submission?.data || wiz._submission?.data || {};
        const mergedData = Object.assign({}, currentData, flatPatch, gridPatch);

        if (form) {
          // This is the key: setting form.submission triggers Form.io's internal
          // component update cycle, which populates all visible inputs
          form.submission = { data: mergedData };
        } else {
          // Fallback: direct assignment
          if (!wiz._submission) wiz._submission = { data: {} };
          wiz._submission.data = mergedData;
          wiz.data = mergedData;
        }

        // For EditGrids: find components and saveRow() any 'new' rows
        let gridFilled = 0;
        if (Object.keys(gridPatch).length > 0) {
          var saveGridRows = function(rootComp) {
            if (!rootComp || typeof rootComp.everyComponent !== 'function') return;
            rootComp.everyComponent(function(comp) {
              var compType = comp.component?.type || comp.type;
              var compKey = comp.component?.key || comp.key;
              if (gridPatch[compKey] !== undefined && compType === 'editgrid' && comp.editRows) {
                for (var i = 0; i < comp.editRows.length; i++) {
                  if (comp.editRows[i].state === 'new' || comp.editRows[i].state === 'editing') {
                    try { comp.saveRow(i); } catch(e) {}
                  }
                }
                gridFilled++;
              }
            });
          };
          if (form?.root) saveGridRows(form.root);
          else if (typeof wiz.everyComponent === 'function') saveGridRows(wiz);
          if (gridFilled === 0 && formio) {
            Object.keys(formio).forEach(function(fk) {
              if (formio[fk]?.root) saveGridRows(formio[fk].root);
            });
          }
        }

        const total = Object.keys(flatPatch).length + Object.keys(gridPatch).length;
        return { ok: true, fieldCount: total, gridsFilled: gridFilled, method: 'wizard' };
      } catch (e) { return { ok: false, error: e.message }; }
    },
    fillDOM(patch) {
      let filled = 0;
      Object.entries(patch).forEach(([key, value]) => {
        if (key.startsWith('_')) return;
        for (const sel of [`[name="data[${key}]"]`, `[data-key="${key}"]`, `#${key}`]) {
          try {
            const el = document.querySelector(sel);
            if (!el) continue;
            if (el.tagName === 'SELECT') { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }
            else if (el.type === 'checkbox') { el.checked = !!value; el.dispatchEvent(new Event('change', { bubbles: true })); }
            else { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
            filled++; break;
          } catch {}
        }
      });
      return { ok: filled > 0, fieldCount: filled, method: 'dom' };
    },
    inspect() { const w = this.findWizard(); return w?._submission?.data || null; },
    reset() {
      const w = this.findWizard();
      if (!w || !w._submission) return false;
      w._submission.data = {}; w.data = {};
      if (typeof w.redraw === 'function') w.redraw();
      return true;
    },
    fillFiles() {
      // Use Form.io's comp.upload([File]) API to upload a mini PDF to the server.
      var formio = window.Formio?.forms;
      if (!formio) return { ok: false, error: 'No Formio.forms found' };
      var fk = Object.keys(formio)[0];
      var form = formio[fk];
      if (!form?.root) return { ok: false, error: 'No form root found' };
      // Create a minimal valid PDF as a File object
      var pdfB64 = 'JVBERi0xLjEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjIwNgolJUVPRgo=';
      var bin = atob(pdfB64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var file = new File([blob], 'demo-document.pdf', { type: 'application/pdf' });
      // Upload to all file components that have an upload() method
      var uploaded = 0, errors = 0, skipped = 0;
      form.root.everyComponent(function(comp) {
        if (comp.component?.type === 'file' && typeof comp.upload === 'function') {
          // Skip if already has a file uploaded
          if (comp.dataValue && comp.dataValue.length > 0) { skipped++; return; }
          try { comp.upload([file]); uploaded++; } catch(e) { errors++; }
        }
      });
      var msg = uploaded + ' file(s) uploading to server';
      if (skipped > 0) msg += ', ' + skipped + ' already had files';
      if (errors > 0) msg += ', ' + errors + ' error(s)';
      return { ok: uploaded > 0, fieldCount: uploaded, skipped: skipped, errors: errors, message: msg };
    }
  };

  // AutoFiller — generates data dynamically from Form.io component tree
  const AutoFiller = {
    _counter: 0,
    _getAllForms() {
      const formio = window.Formio?.forms;
      if (!formio) return [];
      return Object.keys(formio).map(k => formio[k]).filter(f => f?.root);
    },
    _getForm() {
      const forms = this._getAllForms();
      return forms.length > 0 ? forms[0] : null;
    },
    _isPartB() {
      // Enhanced Part B detection
      if (/\/part-b\//.test(location.href)) return true;
      if (/\/task\//.test(location.href)) return true;
      if (/\/processing\//.test(location.href)) return true;
      // Check for Part B indicators in the page
      if ($('.part-b-container, .task-container, [class*="partb"]')) return true;
      // Check for role-specific form patterns (Part B has action buttons like Approve)
      const forms = this._getAllForms();
      for (const form of forms) {
        let hasActionButton = false;
        form.root.everyComponent(comp => {
          const c = comp.component;
          if (c?.type === 'button' && c.action && c.action !== 'reset' && c.action !== 'event') {
            hasActionButton = true;
          }
        });
        if (hasActionButton) return true;
      }
      return false;
    },
    _val(comp) {
      const c = comp.component || comp;
      const type = c.type;
      const key = c.key;
      const label = c.label || key;
      this._counter++;

      switch (type) {
        case 'textfield': case 'text':
          if (c.inputMask) return c.inputMask.replace(/9/g, () => Math.floor(Math.random() * 10)).replace(/a/g, 'x').replace(/\*/g, 'x');
          if (key.toLowerCase().includes('email')) return 'test@example.com';
          if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) return '555-0100';
          if (key.toLowerCase().includes('name')) return 'Test Name ' + this._counter;
          if (key.toLowerCase().includes('address') || key.toLowerCase().includes('street')) return '123 Test Street';
          if (key.toLowerCase().includes('city')) return 'Kingston';
          if (key.toLowerCase().includes('zip') || key.toLowerCase().includes('postal')) return '10001';
          if (key.toLowerCase().includes('country')) return 'Jamaica';
          if (key.toLowerCase().includes('url') || key.toLowerCase().includes('website')) return 'https://example.com';
          return 'Test ' + label.slice(0, 30);
        case 'textarea':
          return 'Test description for ' + label.slice(0, 40) + '. This is auto-generated sample text for testing purposes.';
        case 'number':
          return c.validate?.min != null ? c.validate.min + 1 : 100;
        case 'currency':
          return c.validate?.min != null ? c.validate.min + 100 : 1000;
        case 'email':
          return 'test@example.com';
        case 'phoneNumber':
          return '876-555-0100';
        case 'url':
          return 'https://example.com';
        case 'datetime':
          return new Date().toISOString();
        case 'day':
          const now = new Date();
          return ('0' + (now.getMonth()+1)).slice(-2) + '/' + ('0' + now.getDate()).slice(-2) + '/' + now.getFullYear();
        case 'time':
          return '09:00:00';
        case 'checkbox':
          return true;
        case 'radio':
          if (c.values?.length) return c.values[0].value;
          return null;
        case 'select':
          if (c.data?.values?.length) return c.data.values[0].value;
          // For catalog/url selects, try runtime sources
          if (comp.selectOptions?.length) return comp.selectOptions[0].value;
          if (comp.loadedOptions?.length) return comp.loadedOptions[0].value;
          // Try Choices.js instance
          if (comp.choices?._store?.choices?.length) {
            const choices = comp.choices._store.choices.filter(ch => ch.value && ch.value !== '');
            if (choices.length) return choices[0].value;
          }
          // Try to trigger async load for catalog-based selects
          if (comp.choices && typeof comp.choices.ajax === 'function') {
            try { comp.choices.ajax(function(){}); } catch(e) {}
          }
          if (typeof comp.triggerUpdate === 'function') {
            try { comp.triggerUpdate(); } catch(e) {}
          }
          if (typeof comp.updateItems === 'function') {
            try { comp.updateItems(); } catch(e) {}
          }
          // Mark for DOM fallback pass
          return '__NEEDS_DOM_SELECT__';
        case 'selectboxes':
          if (c.values?.length) { const r = {}; r[c.values[0].value] = true; return r; }
          return null;
        case 'survey':
          // Survey: object where each question key maps to a value
          if (c.questions?.length && c.values?.length) {
            const surveyData = {};
            const firstVal = c.values[0].value;
            c.questions.forEach(q => { surveyData[q.value] = firstVal; });
            return surveyData;
          }
          return null;
        case 'signature':
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        default:
          return null;
      }
    },
    _leafFields(components) {
      // Recursively extract actual input fields from nested columns/panels
      const results = [];
      (components || []).forEach(child => {
        const type = child.type;
        if (type === 'columns') {
          (child.columns || []).forEach(col => {
            results.push(...this._leafFields(col.components));
          });
        } else if (['panel', 'fieldset', 'well', 'container'].includes(type)) {
          results.push(...this._leafFields(child.components));
        } else if (!['button', 'content', 'htmlelement'].includes(type)) {
          results.push(child);
        }
      });
      return results;
    },
    _gridRow(gridComp) {
      const row = {};
      const fields = this._leafFields(gridComp.component?.components || []);
      fields.forEach(child => {
        if (child.hidden) return;
        const val = this._val({ component: child });
        if (val !== null && val !== '__NEEDS_DOM_SELECT__') row[child.key] = val;
      });
      return row;
    },
    generate() {
      const forms = this._getAllForms();
      if (!forms.length) return { ok: false, error: 'No Form.io form found on this page' };
      const isPartB = this._isPartB();
      this._counter = 0;
      const patch = {};
      const grids = {};
      const skipped = [];
      const skipTypes = ['button', 'content', 'htmlelement', 'panel', 'fieldset', 'well', 'columns', 'column', 'tabs', 'table', 'hidden', 'container', 'file'];

      // Iterate ALL forms on the page (Part B can have multiple)
      forms.forEach(form => {
        form.root.everyComponent(comp => {
          const c = comp.component;
          if (!c || !c.key) return;
          if (skipTypes.includes(c.type)) return;
          if (c.hidden) return;
          // In Part B, disabled fields can still be set via API — only skip in Part A
          if (c.disabled && !isPartB) return;
          // Skip submit/action buttons
          if (c.key === 'submit' || c.action) return;
          // Skip if already has a value (Part B forms often come pre-filled)
          if (isPartB) {
            const existing = comp.dataValue ?? comp.getValue?.();
            if (existing !== undefined && existing !== null && existing !== '' &&
                !(Array.isArray(existing) && existing.length === 0) &&
                !(typeof existing === 'object' && !Array.isArray(existing) && Object.keys(existing).length === 0)) {
              return; // Already has data, don't overwrite in Part B
            }
          }

          if (c.type === 'editgrid' || c.type === 'datagrid') {
            // In Part B, grids often have existing rows — don't add more
            if (isPartB) {
              const existingRows = comp.dataValue || [];
              if (existingRows.length > 0) return;
            }
            const row = this._gridRow(comp);
            if (Object.keys(row).length > 0) {
              grids[c.key] = [row];
              patch[c.key] = [row];
            }
            return;
          }

          // Skip children of grids (handled above)
          let parent = comp.parent;
          while (parent) {
            if (parent.component?.type === 'editgrid' || parent.component?.type === 'datagrid') return;
            parent = parent.parent;
          }

          const val = this._val(comp);
          if (val !== null) {
            patch[c.key] = val;
          } else {
            skipped.push(c.key + ' (' + c.type + ')');
          }
        });
      });

      return { ok: true, patch, fieldCount: Object.keys(patch).length, gridCount: Object.keys(grids).length, skipped };
    },
    _fillSelectsDOM() {
      // Second pass: fill selects that couldn't be resolved from component data
      // by reading Choices.js dropdown items from the DOM
      const forms = this._getAllForms();
      if (!forms.length) return 0;
      let filled = 0;
      forms.forEach(form => { form.root.everyComponent(comp => {
        const c = comp.component;
        if (!c || c.type !== 'select') return;
        // Skip if already has a value
        const current = comp.dataValue ?? comp.getValue?.();
        if (current && current !== '' && current !== '__NEEDS_DOM_SELECT__') return;

        // Strategy 1: Choices.js store (may have loaded after generate())
        if (comp.choices?._store?.choices?.length) {
          const opts = comp.choices._store.choices.filter(ch => ch.value && ch.value !== '' && !ch.placeholder);
          if (opts.length) {
            comp.choices.setChoiceByValue(opts[0].value);
            filled++;
            return;
          }
        }

        // Strategy 2: selectOptions on the component
        if (comp.selectOptions?.length) {
          const opt = comp.selectOptions.find(o => o.value && o.value !== '');
          if (opt) {
            comp.updateValue(opt.value);
            filled++;
            return;
          }
        }

        // Strategy 3: DOM <select> element or Choices.js dropdown items
        const el = comp.element || comp.refs?.input?.[0]?.closest('.formio-component');
        if (el) {
          // Native select
          const sel = el.querySelector('select');
          if (sel?.options?.length > 1) {
            sel.value = sel.options[1].value; // skip first (placeholder)
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            return;
          }
          // Choices.js rendered items
          const choiceItems = el.querySelectorAll('.choices__item--selectable[data-value]');
          for (const item of choiceItems) {
            if (item.dataset.value && item.dataset.value !== '') {
              item.click();
              filled++;
              return;
            }
          }
        }
      }); });
      return filled;
    },
    _partBExtras() {
      // Part B specific: save editing EditGrid rows + set FORMDATAVALIDATIONSTATUS
      const forms = this._getAllForms();
      let saved = 0;
      forms.forEach(form => {
        form.root.everyComponent(comp => {
          const c = comp.component;
          if (!c) return;
          // Save EditGrid rows stuck in 'editing' state (Part B loads them this way)
          if ((c.type === 'editgrid') && comp.editRows) {
            for (let i = 0; i < comp.editRows.length; i++) {
              const state = comp.editRows[i]?.state;
              if (state === 'new' || state === 'editing') {
                try { comp.saveRow(i); saved++; } catch {
                  try { comp.cancelRow(i); } catch {}
                }
              }
            }
          }
          // Set FORMDATAVALIDATIONSTATUS to enable action buttons
          if (c.key === 'FORMDATAVALIDATIONSTATUS') {
            try { comp.setValue('true'); comp.triggerChange?.(); } catch {}
          }
        });
        // Trigger condition re-evaluation to show/enable buttons
        try { form.root.checkConditions?.(); } catch {}
      });
      return saved;
    },
    fillAuto() {
      const result = this.generate();
      if (!result.ok) return result;
      const isPartB = this._isPartB();

      // Remove sentinel values before filling
      Object.keys(result.patch).forEach(k => {
        if (result.patch[k] === '__NEEDS_DOM_SELECT__') delete result.patch[k];
      });

      const fillResult = Filler.fill(result.patch);

      // Second pass: fill selects via DOM/Choices.js
      const domSelects = this._fillSelectsDOM();

      // Delayed third pass for async catalog selects
      setTimeout(() => {
        const retryCount = this._fillSelectsDOM();
        if (retryCount > 0) console.log('eR Auto Fill: resolved ' + retryCount + ' async select(s) on retry');
      }, 500);

      // Part B extras: save editing rows, enable action buttons
      let partBSaved = 0;
      if (isPartB) {
        partBSaved = this._partBExtras();
      }

      return {
        ok: fillResult.ok || partBSaved > 0,
        fieldCount: result.fieldCount + domSelects,
        gridCount: result.gridCount,
        skipped: result.skipped.length,
        skippedList: result.skipped,
        domSelects: domSelects,
        partBSaved: partBSaved,
        isPartB: isPartB,
        method: 'auto+' + fillResult.method + (isPartB ? '+partB' : ''),
        error: fillResult.error
      };
    }
  };

  // Auto-Pilot: detect role, fill preset, highlight action button
  const AutoPilot = {
    detectCurrentRole() {
      // Try multiple strategies to detect the current Part B role
      const strategies = [
        // Strategy 1: page title (often "Role Name | Service Name")
        () => {
          const t = document.title;
          if (!t) return null;
          // Remove service name portion after separator
          const cleaned = t.replace(/\s*[|–-]\s*eRegistrations.*$/i, '').replace(/\s*[|–-]\s*$/, '').trim();
          return cleaned;
        },
        // Strategy 2: h1/h2 headers or task-specific elements
        () => {
          const el = document.querySelector('h1, h2, .task-title, .role-name');
          return el?.textContent?.trim();
        },
        // Strategy 3: breadcrumb (active item)
        () => {
          const el = document.querySelector('.breadcrumb-item.active, .breadcrumb li:last-child');
          return el?.textContent?.trim();
        },
        // Strategy 4: card title
        () => {
          const el = document.querySelector('.card-title, .card-header h3, .card-header h4');
          return el?.textContent?.trim();
        },
        // Strategy 5: look for text matching known role names in prominent elements
        () => {
          const sid = detectServiceId();
          if (!sid) return null;
          const knownRoles = RoleStore.getRoleNames(sid);
          if (!knownRoles.length) return null;
          // Search in headings and prominent text
          const textNodes = $$('h1, h2, h3, h4, .card-title, .card-header, .page-title, .breadcrumb, title');
          for (const el of textNodes) {
            const text = el.textContent?.trim()?.toLowerCase();
            if (!text) continue;
            for (const role of knownRoles) {
              if (text.includes(role.toLowerCase())) return role;
            }
          }
          return null;
        },
        // Strategy 6: URL path segments (e.g., /documents-review/ or ?role=...)
        () => {
          const url = location.href;
          const m = url.match(/[?&]role=([^&]+)/i);
          if (m) return decodeURIComponent(m[1]);
          // Try path-based role detection
          const pathParts = location.pathname.split('/').filter(p => p.length > 2);
          const sid = detectServiceId();
          if (!sid) return null;
          const knownRoles = RoleStore.getRoleNames(sid);
          for (const part of pathParts) {
            const normalized = part.replace(/-/g, ' ').toLowerCase();
            for (const role of knownRoles) {
              if (normalized.includes(role.toLowerCase()) || role.toLowerCase().includes(normalized)) return role;
            }
          }
          return null;
        }
      ];

      for (const s of strategies) {
        try {
          const text = s();
          if (text && text.length > 2 && text.length < 100) return text;
        } catch(e) { /* ignore strategy errors */ }
      }
      return null;
    },

    // Fuzzy match detected role name against available role presets
    matchRole(detectedName, availableRoles) {
      if (!detectedName || !availableRoles.length) return null;
      const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const detected = normalize(detectedName);
      const detectedWords = detected.split(' ').filter(w => w.length > 1);

      let bestMatch = null;
      let bestScore = 0;

      for (const role of availableRoles) {
        const norm = normalize(role);
        // Exact match
        if (detected === norm) return { role, score: 1.0 };
        // Check if one contains the other
        if (detected.includes(norm) || norm.includes(detected)) {
          const score = 0.9;
          if (score > bestScore) { bestScore = score; bestMatch = role; }
          continue;
        }
        // Word matching score
        const roleWords = norm.split(' ').filter(w => w.length > 1);
        let matchingWords = 0;
        for (const dw of detectedWords) {
          for (const rw of roleWords) {
            if (dw === rw || dw.includes(rw) || rw.includes(dw)) { matchingWords++; break; }
          }
        }
        const score = roleWords.length > 0 ? matchingWords / Math.max(detectedWords.length, roleWords.length) : 0;
        if (score > bestScore) { bestScore = score; bestMatch = role; }
      }

      // Threshold: at least 40% word match
      if (bestScore >= 0.4 && bestMatch) return { role: bestMatch, score: bestScore };
      return null;
    },

    // Find the action button in the form (Approve, Submit, Validate, etc.)
    findActionButton() {
      const forms = AutoFiller._getAllForms();
      const candidates = [];

      for (const form of forms) {
        form.root.everyComponent(comp => {
          const c = comp.component;
          if (!c || c.type !== 'button') return;
          if (c.action === 'reset') return;
          // Skip generic navigation buttons
          if (c.key === 'submit' && !c.label) return;

          const label = (c.label || '').toLowerCase();
          const key = (c.key || '').toLowerCase();
          let priority = 0;

          // High priority: explicit action words
          if (/approve|accept|validate|confirm/i.test(label) || /approve|accept|validate|confirm/i.test(key)) priority = 10;
          else if (/send|forward|complete/i.test(label) || /send|forward|complete/i.test(key)) priority = 8;
          else if (/submit/i.test(label) || /submit/i.test(key)) priority = 7;
          else if (c.action === 'submit' || c.action === 'saveState') priority = 6;
          // Medium: success-styled buttons
          else if (c.theme === 'success' || c.theme === 'primary') priority = 4;
          else priority = 1;

          // Boost for btn-success styling
          if (c.customClass?.includes('btn-success')) priority += 2;

          const el = comp.element?.querySelector('button') || comp.refs?.button;
          if (el && priority > 0) {
            candidates.push({ comp, element: el, label: c.label || c.key, key: c.key, priority });
          }
        });
      }

      // Also check DOM for buttons not in Formio tree
      $$('button.btn-success, button.btn-primary').forEach(el => {
        const text = el.textContent?.trim();
        if (!text) return;
        let priority = 0;
        if (/approve|accept|validate|confirm/i.test(text)) priority = 9;
        else if (/send|forward|complete/i.test(text)) priority = 7;
        else if (/submit/i.test(text)) priority = 6;
        if (priority > 0) {
          // Only add if not already captured by Formio scan
          const isDuplicate = candidates.some(c => c.element === el);
          if (!isDuplicate) candidates.push({ element: el, label: text, key: '', priority });
        }
      });

      candidates.sort((a, b) => b.priority - a.priority);
      return candidates.length > 0 ? candidates[0] : null;
    },

    // Highlight the action button with a pulsing green glow
    highlightButton(el) {
      if (!el) return;
      // Scroll into view
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add pulsing highlight
      el.style.outline = '3px solid #38a169';
      el.style.outlineOffset = '3px';
      el.style.animation = 'erPulseGlow 1.5s ease-in-out infinite';
      // Add keyframes if not present
      if (!document.getElementById('er_pulse_style')) {
        const s = document.createElement('style');
        s.id = 'er_pulse_style';
        s.textContent = `@keyframes erPulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(56,161,105,.5); outline-color: #38a169; }
          50% { box-shadow: 0 0 20px rgba(56,161,105,.8); outline-color: #48bb78; }
        }`;
        document.head.appendChild(s);
      }
      // Remove highlight after 15 seconds
      setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.animation = '';
      }, 15000);
    },

    // Show a toast notification
    showToast(msg, type) {
      const existing = document.getElementById('er_toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'er_toast';
      const bg = type === 'ok' ? '#38a169' : type === 'warn' ? '#d69e2e' : '#e53e3e';
      toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:12px 24px;border-radius:8px;font:600 13px -apple-system,system-ui,sans-serif;z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;`;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
    },

    // Main Auto-Pilot execution
    run() {
      const log = [];
      const sid = detectServiceId();

      // Step 1: Detect role
      const detectedRole = this.detectCurrentRole();
      if (detectedRole) {
        log.push({ icon: 'ok', text: 'Detected role: ' + detectedRole });
      } else {
        log.push({ icon: 'warn', text: 'Could not detect role from page' });
      }

      // Step 2: Match role to preset
      let matchedPreset = null;
      let matchedRoleName = null;
      if (sid) {
        const availableRoles = RoleStore.getRoleNames(sid);
        if (availableRoles.length > 0) {
          if (detectedRole) {
            const match = this.matchRole(detectedRole, availableRoles);
            if (match) {
              matchedRoleName = match.role;
              matchedPreset = RoleStore.getRolePreset(sid, match.role);
              const fc = matchedPreset ? Object.keys(matchedPreset).filter(k => !k.startsWith('_')).length : 0;
              log.push({ icon: 'ok', text: `Found preset: ${match.role} (${fc} fields, ${Math.round(match.score*100)}% match)` });
            } else {
              log.push({ icon: 'warn', text: `No matching preset. Available: ${availableRoles.join(', ')}` });
            }
          } else {
            log.push({ icon: 'warn', text: `${availableRoles.length} role presets available but cannot match without detection` });
          }
        } else {
          log.push({ icon: 'warn', text: 'No role presets for this service' });
        }
      } else {
        log.push({ icon: 'warn', text: 'No service ID detected' });
      }

      // Step 3: Fill form
      if (matchedPreset) {
        const patch = Object.fromEntries(Object.entries(matchedPreset).filter(([k]) => !k.startsWith('_')));
        const result = Filler.fill(patch);
        if (result.ok) {
          log.push({ icon: 'ok', text: `Filled ${result.fieldCount} fields` });
          // Also run Part B extras
          const extras = AutoFiller._partBExtras();
          if (extras > 0) log.push({ icon: 'ok', text: `Saved ${extras} editing row(s)` });
        } else {
          log.push({ icon: 'err', text: 'Fill failed: ' + (result.error || 'unknown') });
        }
      } else if (!matchedPreset && detectedRole) {
        // No preset found — fallback to auto-fill
        log.push({ icon: 'warn', text: 'Falling back to Auto Fill (no preset)' });
        const result = AutoFiller.fillAuto();
        if (result.ok) {
          log.push({ icon: 'ok', text: `Auto-filled ${result.fieldCount} fields` });
        } else {
          log.push({ icon: 'err', text: 'Auto fill failed: ' + (result.error || 'unknown') });
        }
      }

      // Step 4: Find action button
      const actionBtn = this.findActionButton();
      if (actionBtn) {
        log.push({ icon: 'ok', text: `Found action button: ${actionBtn.label}` });
        this.highlightButton(actionBtn.element);
        log.push({ icon: 'arrow', text: 'Click the highlighted button to proceed' });
        this.showToast('Ready to submit. Click the highlighted button to proceed.', 'ok');
      } else {
        log.push({ icon: 'warn', text: 'No action button found' });
      }

      return { log, detectedRole, matchedRoleName, matchedPreset, actionButton: actionBtn };
    }
  };

  // Scanner
  const Scanner = {
    scan() {
      const keys = new Set();
      $$('[class]').forEach(el => {
        const r = /(?:^|\s)formio-component-([A-Za-z0-9_\-:]+)/g; let m;
        while ((m = r.exec(el.className)) !== null) keys.add(m[1]);
      });
      $$('[data-component-key],[data-key]').forEach(el => {
        const k1 = el.getAttribute('data-component-key'), k2 = el.getAttribute('data-key');
        if (k1) keys.add(k1); if (k2) keys.add(k2);
      });
      $$('[name]').forEach(el => {
        const r = /data\[(?:'|")?([^\]'"]+)(?:'|")?\]/g; let m;
        while ((m = r.exec(el.getAttribute('name') || '')) !== null) keys.add(m[1]);
      });
      return Array.from(keys).filter(k => k && k.length > 1 && !/^[0-9a-f]{8}-/.test(k)).sort();
    },
    getFieldInfo(key) {
      let el = null;
      for (const sel of [`.formio-component-${CSS.escape(key)}`, `[data-component-key="${CSS.escape(key)}"]`, `[name="data[${CSS.escape(key)}]"]`]) {
        try { el = document.querySelector(sel); if (el) break; } catch {}
      }
      if (!el) return { key, type: 'unknown', label: '', required: false };
      const input = el.querySelector('input,select,textarea') || el;
      const labelEl = el.querySelector('label,.control-label');
      let type = 'unknown';
      for (const t of ['textfield','number','select','radio','checkbox','datetime','textarea','file','button','content','panel','editgrid','datagrid']) {
        if (el.className?.includes(`formio-component-${t}`)) { type = t; break; }
      }
      return { key, type, label: labelEl?.textContent?.trim().replace(/\*\s*$/, '') || '', value: input?.value || '', required: input?.hasAttribute('required') || false };
    }
  };

  // CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #${PANEL_ID} * { box-sizing:border-box; font-family:-apple-system,system-ui,'Segoe UI',sans-serif; }
    #${PANEL_ID} { position:fixed; right:16px; top:16px; width:380px; max-height:88vh; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.18); z-index:2147483647; overflow:hidden; display:flex; flex-direction:column; font-size:13px; color:#1a202c; }
    #${PANEL_ID} .h { background:linear-gradient(135deg,#1a365d,#2b6cb0); color:#fff; padding:12px 14px 10px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    #${PANEL_ID} .h-left { display:flex; align-items:center; gap:8px; }
    #${PANEL_ID} .h-title { font-weight:700; font-size:13px; }
    #${PANEL_ID} .h-sub { font-size:10px; opacity:.7; margin-top:1px; }
    #${PANEL_ID} .close-btn { background:rgba(255,255,255,.15); border:none; color:#fff; width:26px; height:26px; border-radius:6px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
    #${PANEL_ID} .close-btn:hover { background:rgba(255,255,255,.3); }
    #${PANEL_ID} .svc-bar { background:#ebf4ff; border-bottom:1px solid #bee3f8; padding:6px 14px; display:flex; align-items:center; gap:6px; font-size:11px; color:#2c5282; flex-shrink:0; }
    #${PANEL_ID} .svc-bar.no-svc { color:#c05621; background:#fffaf0; border-color:#fbd38d; }
    #${PANEL_ID} .svc-name { font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0; }
    #${PANEL_ID} .svc-id { font-family:monospace; opacity:.6; font-size:10px; }
    #${PANEL_ID} .svc-role { font-size:10px; color:#276749; font-weight:600; margin-top:1px; }
    #${PANEL_ID} .tabs { display:flex; background:#f7fafc; border-bottom:1px solid #e2e8f0; flex-shrink:0; }
    #${PANEL_ID} .tab { flex:1; padding:8px 4px; text-align:center; font-size:11px; font-weight:600; color:#718096; cursor:pointer; border:none; background:none; border-bottom:2px solid transparent; transition:all .15s; }
    #${PANEL_ID} .tab:hover { color:#2b6cb0; background:#ebf8ff; }
    #${PANEL_ID} .tab.active { color:#2b6cb0; border-bottom-color:#2b6cb0; background:#fff; }
    #${PANEL_ID} .body { flex:1; overflow-y:auto; }
    #${PANEL_ID} .pane { display:none; padding:12px 14px; }
    #${PANEL_ID} .pane.active { display:block; }
    #${PANEL_ID} .scenarios { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:12px; }
    #${PANEL_ID} .sc-btn { padding:8px 4px; border-radius:8px; border:2px solid #e2e8f0; background:#f7fafc; cursor:pointer; text-align:center; transition:all .15s; }
    #${PANEL_ID} .sc-btn:hover { border-color:#90cdf4; background:#ebf8ff; }
    #${PANEL_ID} .sc-btn.active { border-color:#2b6cb0; background:#ebf4ff; }
    #${PANEL_ID} .sc-icon { font-size:18px; display:block; margin-bottom:2px; }
    #${PANEL_ID} .sc-name { font-size:11px; font-weight:700; color:#2d3748; display:block; }
    #${PANEL_ID} .sc-desc { font-size:9px; color:#718096; display:block; margin-top:1px; }
    #${PANEL_ID} .sec-label { font-size:10px; font-weight:700; color:#718096; text-transform:uppercase; letter-spacing:.06em; margin:10px 0 6px; }
    #${PANEL_ID} .recent-list { display:flex; flex-direction:column; gap:4px; }
    #${PANEL_ID} .recent-item { display:flex; align-items:center; justify-content:space-between; padding:7px 10px; border-radius:7px; border:1px solid #e2e8f0; background:#fafafa; cursor:pointer; transition:all .15s; }
    #${PANEL_ID} .recent-item:hover { border-color:#90cdf4; background:#ebf8ff; }
    #${PANEL_ID} .ri-name { font-weight:600; font-size:12px; color:#2d3748; }
    #${PANEL_ID} .ri-meta { font-size:10px; color:#a0aec0; margin-top:1px; }
    #${PANEL_ID} .ri-badge { font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600; }
    #${PANEL_ID} .ri-badge.demo { background:#c6f6d5; color:#276749; }
    #${PANEL_ID} .ri-badge.test { background:#bee3f8; color:#2c5282; }
    #${PANEL_ID} .ri-badge.edge { background:#fed7d7; color:#9b2335; }
    #${PANEL_ID} .btn { padding:8px 14px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-weight:600; transition:all .15s; display:inline-flex; align-items:center; gap:5px; }
    #${PANEL_ID} .btn-primary { background:linear-gradient(135deg,#2b6cb0,#2c5282); color:#fff; box-shadow:0 2px 6px rgba(43,108,176,.3); }
    #${PANEL_ID} .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(43,108,176,.4); }
    #${PANEL_ID} .btn-sm { background:#edf2f7; color:#4a5568; font-size:10px; padding:4px 8px; }
    #${PANEL_ID} .btn-sm:hover { background:#e2e8f0; }
    #${PANEL_ID} .btn-danger { background:#fff5f5; color:#c53030; border:1px solid #fed7d7; }
    #${PANEL_ID} .btn-danger:hover { background:#fed7d7; }
    #${PANEL_ID} .btn-row { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
    #${PANEL_ID} .btn-autopilot { background:linear-gradient(135deg,#276749,#38a169); color:#fff; box-shadow:0 2px 8px rgba(56,161,105,.4); padding:10px 18px; font-size:13px; font-weight:700; border:none; border-radius:8px; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:6px; }
    #${PANEL_ID} .btn-autopilot:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(56,161,105,.5); }
    #${PANEL_ID} .result { padding:8px 10px; border-radius:7px; font-size:11px; font-weight:600; display:none; margin-top:8px; }
    #${PANEL_ID} .result.ok  { background:#f0fff4; color:#276749; border:1px solid #c6f6d5; display:flex; align-items:center; gap:6px; }
    #${PANEL_ID} .result.err { background:#fff5f5; color:#c53030; border:1px solid #fed7d7; display:flex; align-items:center; gap:6px; }
    #${PANEL_ID} .result.warn { background:#fffaf0; color:#744210; border:1px solid #fbd38d; display:flex; align-items:center; gap:6px; }
    #${PANEL_ID} textarea { width:100%; border:1px solid #e2e8f0; border-radius:7px; padding:8px 10px; font-size:11px; font-family:monospace; resize:vertical; min-height:100px; background:#f7fafc; color:#2d3748; }
    #${PANEL_ID} textarea:focus { outline:none; border-color:#90cdf4; background:#fff; }
    #${PANEL_ID} .keys-search { width:100%; padding:7px 10px; border:1px solid #e2e8f0; border-radius:7px; font-size:12px; margin-bottom:8px; background:#f7fafc; }
    #${PANEL_ID} .keys-search:focus { outline:none; border-color:#90cdf4; }
    #${PANEL_ID} .keys-list { max-height:340px; overflow-y:auto; }
    #${PANEL_ID} .krow { display:flex; align-items:center; justify-content:space-between; padding:5px 6px; border-bottom:1px dashed #edf2f7; gap:6px; }
    #${PANEL_ID} .krow:hover { background:#f7fafc; }
    #${PANEL_ID} .k-name { font-family:monospace; font-size:11px; color:#2d3748; font-weight:600; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #${PANEL_ID} .k-type { font-size:10px; color:#a0aec0; flex-shrink:0; }
    #${PANEL_ID} .k-copy { font-size:10px; color:#2b6cb0; cursor:pointer; padding:2px 5px; border-radius:3px; flex-shrink:0; }
    #${PANEL_ID} .k-copy:hover { background:#ebf4ff; }
    #${PANEL_ID} .k-req { font-size:9px; background:#fff5f5; color:#c53030; padding:1px 4px; border-radius:3px; flex-shrink:0; }
    #${PANEL_ID} .preset-card { border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:8px; background:#fafafa; }
    #${PANEL_ID} .pc-name { font-weight:700; font-size:12px; color:#2d3748; }
    #${PANEL_ID} .pc-id { font-family:monospace; font-size:9px; color:#a0aec0; }
    #${PANEL_ID} .pc-scenarios { display:flex; gap:4px; margin-top:6px; flex-wrap:wrap; }
    #${PANEL_ID} .pc-s { font-size:10px; padding:3px 7px; border-radius:4px; cursor:pointer; border:1px solid #e2e8f0; background:#fff; font-weight:600; transition:all .12s; }
    #${PANEL_ID} .pc-s:hover { border-color:#90cdf4; background:#ebf4ff; }
    #${PANEL_ID} .pc-actions { display:flex; gap:6px; margin-top:8px; }
    #${PANEL_ID} .empty { text-align:center; padding:30px 20px; color:#a0aec0; }
    #${PANEL_ID} .empty .ei { font-size:32px; display:block; margin-bottom:8px; }
    #${PANEL_ID} .empty .et { font-weight:700; color:#718096; font-size:13px; margin-bottom:4px; }
    #${PANEL_ID} .empty .ed { font-size:11px; line-height:1.5; }
    #${PANEL_ID} .ap-log { max-height:140px; overflow-y:auto; font-size:11px; margin-top:8px; background:#f7fafc; border:1px solid #e2e8f0; border-radius:7px; padding:6px 8px; }
    #${PANEL_ID} .ap-log-item { padding:2px 0; color:#4a5568; display:flex; align-items:flex-start; gap:4px; }
    #${PANEL_ID} .ap-log-icon { flex-shrink:0; width:14px; text-align:center; }
    #${PANEL_ID} .ap-detect { background:#f0fff4; border:1px solid #c6f6d5; border-radius:7px; padding:8px 10px; font-size:11px; margin-bottom:8px; }
    #${PANEL_ID} ::-webkit-scrollbar { width:5px; }
    #${PANEL_ID} ::-webkit-scrollbar-thumb { background:#cbd5e0; border-radius:3px; }
  `;
  document.head.appendChild(styleEl);

  // State
  const state = { serviceId: detectServiceId(), serviceName: detectServiceName(), scenario: 'demo', keys: [], keyFilter: '' };
  const ICONS = { demo: '🎯', test: '🧪', edge: '⚡' };

  // Detect role info for the service bar
  const isPartB = AutoFiller._isPartB();
  const roleNames = state.serviceId ? RoleStore.getRoleNames(state.serviceId) : [];
  const detectedRole = isPartB ? AutoPilot.detectCurrentRole() : null;
  let roleMatch = null;
  if (detectedRole && roleNames.length > 0) {
    roleMatch = AutoPilot.matchRole(detectedRole, roleNames);
  }

  // Panel HTML
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // Count loaded presets for this service
  const loadedScenarios = state.serviceId ? Object.keys(Store.getService(state.serviceId)) : [];
  const presetInfo = loadedScenarios.length > 0
    ? `<span style="color:#c6f6d5">● ${loadedScenarios.length} preset(s) ready</span>`
    : roleNames.length > 0
      ? `<span style="color:#c6f6d5">● ${roleNames.length} role(s) ready</span>`
      : '';

  // Service bar role display
  const roleDisplay = isPartB && detectedRole
    ? `<div class="svc-role">Role: ${detectedRole}${roleMatch ? ' ✓ Preset ready' : ''}</div>`
    : roleNames.length > 0
      ? `<div class="svc-role">${roleNames.length} role preset(s) available</div>`
      : '';

  panel.innerHTML = `
    <div class="h">
      <div class="h-left">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="rgba(255,255,255,.8)"/>
          <rect x="11" y="2" width="7" height="7" rx="1.5" fill="rgba(255,255,255,.5)"/>
          <rect x="2" y="11" width="7" height="7" rx="1.5" fill="rgba(255,255,255,.5)"/>
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="rgba(255,255,255,.3)"/>
        </svg>
        <div><div class="h-title">eR Form Filler</div><div class="h-sub">v${VERSION} ${presetInfo}</div></div>
      </div>
      <button class="close-btn" id="er_x">&times;</button>
    </div>
    <div class="svc-bar ${state.serviceId ? '' : 'no-svc'}" id="er_svc">
      <span>📋</span>
      <div style="flex:1;min-width:0;">
        <div class="svc-name" id="er_svc_name">${state.serviceId ? state.serviceName : 'No service detected'}</div>
        <div class="svc-id" id="er_svc_id">${state.serviceId || 'Open Part A to auto-detect'}</div>
        <div id="er_svc_role">${roleDisplay}</div>
      </div>
      <button class="btn btn-sm" id="er_rescan">↺</button>
    </div>
    <div class="tabs">
      <button class="tab active" data-tab="fill">🚀 Fill</button>
      <button class="tab" data-tab="keys">🔍 Keys</button>
      <button class="tab" data-tab="manage">⚙️ Manage</button>
    </div>
    <div class="body">
      <div class="pane active" id="er_pane_fill">
        <button class="btn-autopilot" id="er_autopilot_btn" style="width:100%;justify-content:center;margin-bottom:12px;">⚡ Auto-Pilot</button>
        <div id="er_ap_detect"></div>
        <div id="er_ap_log" style="display:none;"></div>

        <div class="sec-label">Scenario</div>
        <div class="scenarios">
          <button class="sc-btn active" data-scenario="demo"><span class="sc-icon">🎯</span><span class="sc-name">Demo</span><span class="sc-desc">Full realistic</span></button>
          <button class="sc-btn" data-scenario="test"><span class="sc-icon">🧪</span><span class="sc-name">Test</span><span class="sc-desc">Minimal valid</span></button>
          <button class="sc-btn" data-scenario="edge"><span class="sc-icon">⚡</span><span class="sc-name">Edge</span><span class="sc-desc">Stress test</span></button>
        </div>
        <div id="er_preset_status"></div>
        <div id="er_fill_result" class="result"></div>
        <div class="btn-row">
          <button class="btn btn-primary" id="er_auto_btn" style="background:linear-gradient(135deg,#805ad5,#6b46c1);box-shadow:0 2px 6px rgba(107,70,193,.3);">⚡ Auto Fill</button>
          <button class="btn btn-primary" id="er_fill_btn">▶ Fill Form</button>
          <button class="btn btn-sm" id="er_files_btn">📎 Fill Files</button>
          <button class="btn btn-sm" id="er_inspect_btn">👁 Inspect</button>
          <button class="btn btn-danger" id="er_reset_btn">↺ Reset</button>
        </div>
        <div style="margin-top:14px;"><div class="sec-label">Recent</div><div class="recent-list" id="er_recent"></div></div>
      </div>
      <div class="pane" id="er_pane_keys">
        <input class="keys-search" id="er_ks" placeholder="Filter keys or labels..." />
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span class="sec-label" style="margin:0;" id="er_kcount">0 keys</span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm" id="er_scan_btn">↺ Scan</button>
            <button class="btn btn-sm" id="er_copy_keys">Copy All</button>
            <button class="btn btn-sm" id="er_export_keys">Export JSON</button>
          </div>
        </div>
        <div class="keys-list" id="er_klist"></div>
      </div>
      <div class="pane" id="er_pane_manage">
        <div class="sec-label">Import Preset (from /fill-form)</div>
        <textarea id="er_import_ta" placeholder="Paste JSON preset here..."></textarea>
        <div class="btn-row">
          <button class="btn btn-primary" id="er_import_btn">⬆ Import</button>
          <button class="btn btn-sm" id="er_export_all_btn">⬇ Export All</button>
          <button class="btn btn-danger" id="er_clear_all_btn">🗑 Clear All</button>
        </div>
        <div id="er_manage_result" class="result"></div>
        <div style="margin-top:14px;"><div class="sec-label">Saved Presets (Part A)</div><div id="er_plist"></div></div>
        <div style="margin-top:14px;"><div class="sec-label">Role Presets (Part B)</div><div id="er_rplist"></div></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Helpers
  function showResult(id, type, msg) {
    const el = document.getElementById(id); if (!el) return;
    const icons = { ok: '✅', err: '❌', warn: '⚠️' };
    el.className = `result ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    setTimeout(() => { if (el.className.includes(type)) el.className = 'result'; }, 4000);
  }

  function renderPresetStatus() {
    const el = document.getElementById('er_preset_status'); if (!el) return;
    const sid = state.serviceId;
    if (!sid) { el.innerHTML = ''; return; }
    const p = Store.getService(sid)[state.scenario];
    if (p) {
      const fc = Object.keys(p).filter(k => !k.startsWith('_')).length;
      const meta = p._meta || {};
      el.innerHTML = `<div style="background:#f0fff4;border:1px solid #c6f6d5;border-radius:7px;padding:8px 10px;font-size:11px;margin-bottom:8px;"><strong style="color:#276749;">✅ Preset: ${meta.scenario || state.scenario}</strong><div style="color:#4a7c59;margin-top:2px;">${fc} fields · ${meta.generatedAt ? new Date(meta.generatedAt).toLocaleDateString() : 'imported'}</div></div>`;
    } else {
      const allScenarios = Object.keys(Store.getService(sid));
      const hint = allScenarios.length > 0
        ? `Available: ${allScenarios.join(', ')}`
        : 'Run /fill-form in Claude Code, then import here';
      el.innerHTML = `<div style="background:#fffaf0;border:1px solid #fbd38d;border-radius:7px;padding:8px 10px;font-size:11px;color:#744210;margin-bottom:8px;"><strong>No "${state.scenario}" preset</strong><div style="margin-top:3px;">${hint}</div></div>`;
    }
  }

  function renderRoleDetection() {
    const el = document.getElementById('er_ap_detect'); if (!el) return;
    const sid = state.serviceId;
    if (!sid) { el.innerHTML = ''; return; }
    const roles = RoleStore.getRoleNames(sid);
    if (roles.length === 0) { el.innerHTML = ''; return; }
    const detected = AutoPilot.detectCurrentRole();
    if (detected) {
      const match = AutoPilot.matchRole(detected, roles);
      if (match) {
        const preset = RoleStore.getRolePreset(sid, match.role);
        const fc = preset ? Object.keys(preset).filter(k => !k.startsWith('_')).length : 0;
        el.innerHTML = `<div class="ap-detect"><strong>🎯 Detected: ${detected}</strong> ✓ preset found<div style="color:#4a7c59;margin-top:2px;">→ ${match.role} (${fc} fields)</div></div>`;
      } else {
        el.innerHTML = `<div class="ap-detect" style="background:#fffaf0;border-color:#fbd38d;color:#744210;"><strong>🎯 Detected: ${detected}</strong> — no matching preset<div style="margin-top:2px;">Available: ${roles.join(', ')}</div></div>`;
      }
    } else {
      el.innerHTML = `<div class="ap-detect" style="background:#f7fafc;border-color:#e2e8f0;color:#718096;"><strong>Role detection:</strong> could not detect role<div style="margin-top:2px;">${roles.length} preset(s): ${roles.join(', ')}</div></div>`;
    }
  }

  function renderAutoPilotLog(log) {
    const el = document.getElementById('er_ap_log'); if (!el) return;
    if (!log || !log.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    const iconMap = { ok: '✓', err: '✗', warn: '⚠', arrow: '→' };
    const colorMap = { ok: '#276749', err: '#c53030', warn: '#744210', arrow: '#2b6cb0' };
    el.innerHTML = `<div class="ap-log">${log.map(l =>
      `<div class="ap-log-item"><span class="ap-log-icon" style="color:${colorMap[l.icon]||'#718096'}">${iconMap[l.icon]||'·'}</span><span>${l.text}</span></div>`
    ).join('')}</div>`;
  }

  function renderRecent() {
    const el = document.getElementById('er_recent'); if (!el) return;
    const recent = Store.getRecent();
    if (!recent.length) { el.innerHTML = `<div style="font-size:11px;color:#a0aec0;text-align:center;padding:12px;">No recent fills yet</div>`; return; }
    el.innerHTML = recent.map(r => `
      <div class="recent-item" data-sid="${r.serviceId}" data-sc="${r.scenario || 'demo'}">
        <div><div class="ri-name">${r.name || r.serviceId.slice(0,20)+'...'}</div><div class="ri-meta">${r.serviceId.slice(0,8)}... · ${timeAgo(r.usedAt)}</div></div>
        <span class="ri-badge ${r.scenario || 'demo'}">${r.scenario || 'demo'}</span>
      </div>
    `).join('');
    el.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => quickFill(item.dataset.sid, item.dataset.sc));
    });
  }

  function renderKeys() {
    const listEl = document.getElementById('er_klist'), countEl = document.getElementById('er_kcount'); if (!listEl) return;
    const q = state.keyFilter.toLowerCase();
    const filtered = q ? state.keys.filter(k => { const i = Scanner.getFieldInfo(k); return k.toLowerCase().includes(q) || i.label?.toLowerCase().includes(q); }) : state.keys;
    countEl.textContent = `${filtered.length} keys${q ? ' filtered' : ''}`;
    if (!filtered.length) { listEl.innerHTML = `<div class="empty"><span class="ei">🔍</span><div class="et">No keys found</div><div class="ed">Click Scan to detect fields</div></div>`; return; }
    listEl.innerHTML = filtered.map(k => { const i = Scanner.getFieldInfo(k); return `<div class="krow"><span class="k-name" title="${k}">${k}</span>${i.required ? '<span class="k-req">REQ</span>' : ''}<span class="k-type">${i.type}</span><span class="k-copy" data-key="${k}">copy</span></div>`; }).join('');
    listEl.querySelectorAll('.k-copy').forEach(btn => {
      btn.addEventListener('click', () => { navigator.clipboard?.writeText(btn.dataset.key); btn.textContent = '✓'; setTimeout(() => { btn.textContent = 'copy'; }, 1000); });
    });
  }

  function renderManageList() {
    const el = document.getElementById('er_plist'); if (!el) return;
    const all = Store.getAll(), entries = Object.entries(all);
    if (!entries.length) { el.innerHTML = `<div class="empty"><span class="ei">📦</span><div class="et">No presets saved</div><div class="ed">Import a preset generated by /fill-form</div></div>`; return; }
    el.innerHTML = entries.map(([sid, scenarios]) => {
      const first = Object.values(scenarios)[0], name = first?._meta?.serviceName || sid.slice(0,20)+'...';
      return `<div class="preset-card"><div class="pc-name">${name}</div><div class="pc-id">${sid}</div>
        <div class="pc-scenarios">${Object.keys(scenarios).map(s => { const fc = Object.keys(scenarios[s]).filter(k => !k.startsWith('_')).length; return `<button class="pc-s" data-sid="${sid}" data-sc="${s}">${ICONS[s]||'📋'} ${s} (${fc})</button>`; }).join('')}</div>
        <div class="pc-actions"><button class="btn btn-sm" data-exp="${sid}">Export</button><button class="btn btn-danger" data-del="${sid}" style="font-size:10px;padding:4px 8px;">Delete</button></div>
      </div>`;
    }).join('');
    el.querySelectorAll('.pc-s').forEach(btn => {
      btn.addEventListener('click', () => { switchTab('fill'); state.serviceId = btn.dataset.sid; state.scenario = btn.dataset.sc; syncUI(); });
    });
    el.querySelectorAll('[data-exp]').forEach(btn => {
      btn.addEventListener('click', () => { const json = JSON.stringify(Store.getService(btn.dataset.exp), null, 2); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], {type:'application/json'})); a.download = `er-preset-${btn.dataset.exp.slice(0,8)}.json`; a.click(); });
    });
    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => { if (confirm('Delete all presets for this service?')) { Store.deleteService(btn.dataset.del); renderManageList(); renderPresetStatus(); showResult('er_manage_result', 'ok', 'Deleted'); } });
    });
  }

  function renderRolePresetList() {
    const el = document.getElementById('er_rplist'); if (!el) return;
    const all = RoleStore.getAll(), entries = Object.entries(all);
    if (!entries.length) { el.innerHTML = `<div style="font-size:11px;color:#a0aec0;text-align:center;padding:12px;">No role presets saved</div>`; return; }
    el.innerHTML = entries.map(([sid, roles]) => {
      const roleEntries = Object.entries(roles);
      const firstMeta = roleEntries[0]?.[1]?._meta;
      return `<div class="preset-card"><div class="pc-name">${firstMeta?.serviceName || sid.slice(0,20)+'...'}</div><div class="pc-id">${sid}</div>
        <div class="pc-scenarios">${roleEntries.map(([roleName, preset]) => {
          const fc = Object.keys(preset).filter(k => !k.startsWith('_')).length;
          return `<button class="pc-s" data-rsid="${sid}" data-rname="${roleName}">🏷 ${roleName} (${fc})</button>`;
        }).join('')}</div>
        <div class="pc-actions"><button class="btn btn-danger" data-rdel="${sid}" style="font-size:10px;padding:4px 8px;">Delete All</button></div>
      </div>`;
    }).join('');
    el.querySelectorAll('.pc-s[data-rname]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = RoleStore.getRolePreset(btn.dataset.rsid, btn.dataset.rname);
        if (!preset) return;
        const patch = Object.fromEntries(Object.entries(preset).filter(([k]) => !k.startsWith('_')));
        const r = Filler.fill(patch);
        if (r.ok) showResult('er_manage_result', 'ok', `Filled ${r.fieldCount} fields from role: ${btn.dataset.rname}`);
        else showResult('er_manage_result', 'err', r.error || 'Fill failed');
      });
    });
    el.querySelectorAll('[data-rdel]').forEach(btn => {
      btn.addEventListener('click', () => { if (confirm('Delete all role presets for this service?')) { RoleStore.deleteService(btn.dataset.rdel); renderRolePresetList(); showResult('er_manage_result', 'ok', 'Role presets deleted'); } });
    });
  }

  function syncUI() {
    panel.querySelectorAll('.sc-btn').forEach(b => b.classList.toggle('active', b.dataset.scenario === state.scenario));
    document.getElementById('er_svc_name').textContent = state.serviceId ? state.serviceName : 'No service detected';
    document.getElementById('er_svc_id').textContent = state.serviceId || 'Open Part A to auto-detect';
    document.getElementById('er_svc').className = `svc-bar ${state.serviceId ? '' : 'no-svc'}`;
    // Update role display in service bar
    const roleEl = document.getElementById('er_svc_role');
    if (roleEl && state.serviceId) {
      const roles = RoleStore.getRoleNames(state.serviceId);
      const detected = AutoPilot.detectCurrentRole();
      if (detected && roles.length > 0) {
        const match = AutoPilot.matchRole(detected, roles);
        roleEl.innerHTML = `<div class="svc-role">Role: ${detected}${match ? ' ✓ Preset ready' : ''}</div>`;
      } else if (roles.length > 0) {
        roleEl.innerHTML = `<div class="svc-role">${roles.length} role preset(s) available</div>`;
      } else {
        roleEl.innerHTML = '';
      }
    }
    renderPresetStatus();
    renderRoleDetection();
    renderRecent();
  }

  function switchTab(tab) {
    panel.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    panel.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === `er_pane_${tab}`));
    if (tab === 'keys' && !state.keys.length) doScan();
    if (tab === 'manage') { renderManageList(); renderRolePresetList(); }
  }

  // Actions
  function doFill() {
    if (!state.serviceId) { showResult('er_fill_result', 'warn', 'No service detected. Navigate to Part A.'); return; }
    const p = Store.getService(state.serviceId)[state.scenario];
    if (!p) { showResult('er_fill_result', 'warn', `No "${state.scenario}" preset. Import one in Manage tab.`); return; }
    const patch = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('_')));
    const r = Filler.fill(patch);
    if (r.ok) { Store.addRecent(state.serviceId, state.serviceName, state.scenario); renderRecent(); showResult('er_fill_result', 'ok', `Filled ${r.fieldCount} fields (${r.method})`); }
    else showResult('er_fill_result', 'err', r.error || 'Fill failed');
  }

  function quickFill(sid, scenario) {
    const p = Store.getService(sid)[scenario];
    if (!p) { showResult('er_fill_result', 'warn', 'Preset not found'); return; }
    const patch = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('_')));
    const r = Filler.fill(patch);
    if (r.ok) { Store.addRecent(sid, p._meta?.serviceName || sid, scenario); renderRecent(); showResult('er_fill_result', 'ok', `Quick fill: ${r.fieldCount} fields`); }
    else showResult('er_fill_result', 'err', r.error || 'Fill failed');
  }

  function doScan() { state.keys = Scanner.scan(); renderKeys(); }

  function doImport() {
    const json = document.getElementById('er_import_ta')?.value?.trim();
    if (!json) { showResult('er_manage_result', 'warn', 'Paste JSON first'); return; }
    try {
      const data = JSON.parse(json);
      // Check if it's a consolidated role preset file (has "roles" key)
      if (data.roles && data.serviceId) {
        const sid = data.serviceId;
        let imported = 0;
        Object.entries(data.roles).forEach(([roleName, preset]) => {
          RoleStore.saveRolePreset(sid, roleName, preset);
          imported++;
        });
        showResult('er_manage_result', 'ok', `Imported ${imported} role preset(s) for ${sid.slice(0,8)}...`);
      }
      // Check if it's a single role preset (has _meta.roleId or _meta.role)
      else if (data._meta && (data._meta.roleId || data._meta.role)) {
        const sid = data._meta.serviceId || state.serviceId;
        const roleName = data._meta.roleName || data._meta.role || data._meta.serviceName;
        if (!sid) { showResult('er_manage_result', 'err', 'No serviceId in _meta'); return; }
        RoleStore.saveRolePreset(sid, roleName, data);
        showResult('er_manage_result', 'ok', `Imported role preset: ${roleName}`);
      }
      // Standard Part A preset
      else if (data._meta) {
        const sid = data._meta.serviceId || state.serviceId;
        const sc = data._meta.scenario || state.scenario || 'demo';
        if (!sid) { showResult('er_manage_result', 'err', 'No serviceId in _meta'); return; }
        Store.savePreset(sid, sc, data);
        if (data._meta.serviceName) state.serviceName = data._meta.serviceName;
        state.serviceId = sid;
        showResult('er_manage_result', 'ok', `Imported "${sc}" for ${sid.slice(0,8)}...`);
      } else {
        Store.importAll(json);
        showResult('er_manage_result', 'ok', 'All presets imported');
      }
      document.getElementById('er_import_ta').value = '';
      renderManageList(); renderRolePresetList(); renderPresetStatus(); renderRoleDetection();
    } catch (e) { showResult('er_manage_result', 'err', e.message); }
  }

  // Events
  document.getElementById('er_x').addEventListener('click', () => { panel.remove(); styleEl.remove(); });
  document.getElementById('er_rescan').addEventListener('click', () => { state.serviceId = detectServiceId(); state.serviceName = detectServiceName(); syncUI(); });
  panel.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  panel.querySelectorAll('.sc-btn').forEach(b => b.addEventListener('click', () => { state.scenario = b.dataset.scenario; syncUI(); }));

  // Auto-Pilot button
  document.getElementById('er_autopilot_btn').addEventListener('click', () => {
    const result = AutoPilot.run();
    renderAutoPilotLog(result.log);
    renderRoleDetection();
  });

  document.getElementById('er_auto_btn').addEventListener('click', () => {
    const r = AutoFiller.fillAuto();
    if (r.ok) {
      let msg = r.isPartB ? '[Part B] ' : '';
      msg += `Auto-filled ${r.fieldCount} fields`;
      if (r.gridCount > 0) msg += `, ${r.gridCount} grid(s)`;
      if (r.domSelects > 0) msg += `, ${r.domSelects} select(s) via DOM`;
      if (r.partBSaved > 0) msg += `, ${r.partBSaved} row(s) saved`;
      if (r.skipped > 0) msg += ` (${r.skipped} skipped)`;
      showResult('er_fill_result', 'ok', msg);
      if (r.skippedList?.length) console.log('eR Auto Fill skipped:', r.skippedList);
    } else {
      showResult('er_fill_result', 'err', r.error || 'Auto fill failed');
    }
  });
  document.getElementById('er_fill_btn').addEventListener('click', doFill);
  document.getElementById('er_files_btn').addEventListener('click', () => {
    const r = Filler.fillFiles();
    if (r.ok) showResult('er_fill_result', 'warn', r.message);
    else showResult('er_fill_result', 'err', r.error || 'No file fields found');
  });
  document.getElementById('er_inspect_btn').addEventListener('click', () => {
    const d = Filler.inspect();
    if (!d) { showResult('er_fill_result', 'warn', 'No wizard found'); return; }
    const w = window.open('', '_blank', 'width=600,height=500');
    w.document.write(`<pre style="font:12px monospace;padding:16px;background:#1a202c;color:#a0ff9a;margin:0;">${JSON.stringify(d, null, 2)}</pre>`);
  });
  document.getElementById('er_reset_btn').addEventListener('click', () => { if (confirm('Reset form?')) { const ok = Filler.reset(); showResult('er_fill_result', ok ? 'ok' : 'warn', ok ? 'Form reset' : 'No wizard found'); } });
  document.getElementById('er_scan_btn').addEventListener('click', doScan);
  document.getElementById('er_ks').addEventListener('input', e => { state.keyFilter = e.target.value; renderKeys(); });
  document.getElementById('er_copy_keys').addEventListener('click', () => { navigator.clipboard?.writeText(state.keys.join('\n')); const b = document.getElementById('er_copy_keys'); b.textContent = '✓'; setTimeout(() => { b.textContent = 'Copy All'; }, 1500); });
  document.getElementById('er_export_keys').addEventListener('click', () => { const json = JSON.stringify(state.keys.map(k => Scanner.getFieldInfo(k)), null, 2); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], {type:'application/json'})); a.download = 'er-keys.json'; a.click(); });
  document.getElementById('er_import_btn').addEventListener('click', doImport);
  document.getElementById('er_export_all_btn').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportAll()], {type:'application/json'})); a.download = 'er-all-presets.json'; a.click(); });
  document.getElementById('er_clear_all_btn').addEventListener('click', () => { if (confirm('Delete ALL presets?')) { Store.save({}); RoleStore.save({}); renderManageList(); renderRolePresetList(); renderPresetStatus(); renderRoleDetection(); showResult('er_manage_result', 'ok', 'Cleared'); } });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { panel.remove(); styleEl.remove(); document.removeEventListener('keydown', esc); } });

  // Init
  syncUI();
})();
