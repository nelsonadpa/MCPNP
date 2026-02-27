import { test } from '@playwright/test';
import path from 'path';
import { ExecutionLogger, LoggedFormFiller } from '../helpers/execution-logger';
import * as formHelpers from '../helpers/form-helpers';

/**
 * Phase 5 — Structured Capture Re-run
 *
 * Re-runs the P1 happy-path form fill + submit using the ExecutionLogger
 * to capture every field fill, button click, and tab transition as structured data.
 * Produces: screenshots per tab + execution-log.json for manual generation.
 */

const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots/structured');
const LOG_OUTPUT = path.resolve(__dirname, '../../02-front-office-tests/execution-log.json');

test('P5-CAPTURE: Full form fill with structured data capture', async ({ page }) => {
  test.setTimeout(1_200_000); // 20 min

  const logger = new ExecutionLogger(page, { phase: 1, screenshotDir: SCREENSHOT_DIR });
  const filler = new LoggedFormFiller(page, logger);

  // ── Create new application ──
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  logger.logStateChange('Dashboard loaded', 'navigating', 'dashboard');
  await logger.screenshot('dashboard');

  await page.getByRole('button', { name: 'Establish a new zone' }).click();
  await page.waitForTimeout(5000);
  const appUrl = page.url();
  const fileId = appUrl.match(/file_id=([^&]+)/)?.[1] || 'unknown';
  logger.logStateChange('Application created', 'dashboard', `file_id=${fileId}`);
  console.log(`\n=== FILE: ${appUrl} ===\n`);

  // ════════════════════════════════════════════
  // TAB: FORM > PROJECT OVERVIEW
  // ════════════════════════════════════════════
  logger.setTab('Project overview');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(2000);
  await logger.screenshot('project-overview-empty');

  // Zone identity
  await filler.fillText('applicantProposedNameOfZone', 'TEST-SEZ Kingston Innovation Park', 'Proposed name of zone');
  await filler.clickRadio('applicantMultiOrSingleOccupant', 'Multi-occupant', 'Zone type');
  await filler.clickRadio('applicantMultiOrSingleOccupant2', 'Multi-purpose', 'Zone focus');

  // Site
  await filler.searchAndSelect('applicantCity3', 'Kingston', 'Parish');
  await filler.fillText('applicantAddress3', '123 Test Industrial Road, Kingston 15, Jamaica', 'Address');
  await filler.fillNumber('applicantTotalLandArea3', '50000', 'Total land area');
  await filler.searchAndSelect('applicantUnit3', 'Square', 'Unit');

  // Land parcels EditGrid
  try {
    const parcelInput = page.locator('.formio-component-applicantParcelsDescriptionGrid input[type="text"]:visible').first();
    if (await parcelInput.isVisible({ timeout: 2000 })) {
      await parcelInput.fill('Parcel A - Main Site');
      logger.logField('applicantParcelsDescriptionGrid', 'Parcel A - Main Site', 'editgrid-text', 'Parcel description');
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Private"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Held"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Ownership"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      logger.logField('applicantParcelsDescriptionGrid', 'Private/Held/Ownership', 'editgrid-radios', 'Parcel type');
      const saveRow = page.locator('.formio-component-applicantParcelsDescriptionGrid button:has-text("Save"):visible').first();
      if (await saveRow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveRow.click();
        await page.waitForTimeout(1000);
        logger.logButton('Save (parcel row)', 'clicked');
      }
    }
  } catch (e) {
    logger.logError('Land parcels EditGrid', String(e));
  }

  // Activities
  await filler.searchAndSelect('applicantAuthorizedActivities', 'Manufacturing', 'Authorized activities');
  await filler.fillText('applicantOtherActivity', 'Special Economic Zone Administration', 'Other activity');

  await formHelpers.save(page);
  await logger.screenshot('project-overview-filled');
  console.log('Project overview ✓');

  // ════════════════════════════════════════════
  // TAB: FORM > DEVELOPER
  // ════════════════════════════════════════════
  logger.setTab('Developer');
  await formHelpers.clickSubTab(page, 'Developer');
  await logger.screenshot('developer-empty');

  // Company
  logger.setSection('Company details');
  await filler.fillText('applicantCompanyName', 'TEST-SEZ Development Corp Ltd', 'Company name');
  await filler.searchAndSelect('applicantCompanyType', 'Limited', 'Company type');
  await filler.fillText('applicantTaxRegistrationNumberTrn2', 'TEST-REG-12345', 'Registration # at COJ');
  await filler.typeText('applicantTaxRegistrationNumberTrn', '123456789', 'TRN');

  // Address
  logger.setSection('Company address');
  await filler.searchAndSelect('applicantCity', 'Kingston', 'Parish');
  await filler.fillText('applicantAddress', '456 Corporate Drive, Kingston 10, Jamaica', 'Address');
  await filler.fillText('applicantPhone', '+18765550100', 'Phone');
  await filler.fillEmail('applicantEmail', 'test-sez@example.com', 'Email');

  // Authorized representative
  logger.setSection('Authorized representative');
  await filler.fillText('applicantNames', 'John', 'First name');
  await filler.fillText('applicantLastName', 'Testerton', 'Last name');
  await filler.fillText('applicantPhone2', '+18765550200', 'Representative phone');
  await filler.fillEmail('applicantEmail2', 'john.testerton@example.com', 'Representative email');

  // Shareholders EditGrid
  logger.setSection('Shareholders');
  try {
    const editGridName = page.locator('.formio-component-applicantEditGrid input[type="text"]:visible').first();
    if (await editGridName.isVisible({ timeout: 2000 })) {
      await editGridName.fill('Test Shareholder Holdings Ltd');
      logger.logField('applicantEditGrid', 'Test Shareholder Holdings Ltd', 'editgrid-text', 'Shareholder name');

      const natSearch = page.locator('.formio-component-applicantEditGrid .choices__input--cloned:visible').first();
      if (await natSearch.isVisible({ timeout: 1000 }).catch(() => false)) {
        await natSearch.click();
        await natSearch.type('Jamaica', { delay: 100 });
        await page.waitForTimeout(2000);
        const natOpt = page.locator('.choices__list--dropdown .choices__item--selectable:visible').first();
        if (await natOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await natOpt.click();
          await page.waitForTimeout(300);
          logger.logField('applicantEditGrid.nationality', 'Jamaica', 'select', 'Nationality');
        }
      }

      const numInput = page.locator('.formio-component-applicantOfTotalShares input:visible, .formio-component-applicantEditGrid .formio-component-number input:visible').first();
      if (await numInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await numInput.fill('100');
        logger.logField('applicantOfTotalShares', '100', 'number', '% of shares');
      }

      await page.locator('.formio-component-applicantEditGrid label:has-text("Yes"):visible').first().click().catch(() => {});
      logger.logField('applicantEditGrid.beneficialOwner', 'Yes', 'radio', 'Beneficial owner');

      const saveRow = page.locator('.formio-component-applicantEditGrid button:has-text("Save"):visible').first();
      if (await saveRow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveRow.click();
        await page.waitForTimeout(1000);
        logger.logButton('Save (shareholder row)', 'clicked');
      }
    }
  } catch (e) {
    logger.logError('Shareholders EditGrid', String(e));
  }

  // Joint venture + paid-up capital
  logger.setSection('Ownership structure');
  await filler.clickRadio('applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany', 'No', 'Joint venture?');
  await filler.fillNumber('applicantEnterYourPaidUpCapitalAmountInUsd', '2000000', 'Paid-up capital (USD)');

  // Document uploads
  logger.setSection('Developer documents');
  const devDocs: Array<[string, string, string]> = [
    ['applicantCertificateOfIncorporation', 'TEST-certificate-of-incorporation.pdf', 'Certificate of incorporation'],
    ['applicantArticlesOfIncorporation', 'TEST-articles-of-incorporation.pdf', 'Articles of incorporation'],
    ['applicantTaxComplianceCertificate', 'TEST-tax-compliance-certificate.pdf', 'Tax compliance certificate'],
    ['applicantProofOfIssuedAndPaidUpShareCapitalUs1500000', 'TEST-financial-statements.pdf', 'Financial statements'],
  ];
  for (const [key, file, label] of devDocs) {
    await filler.uploadFile(key, path.join(DOCS_DIR, file), label);
    console.log(`  Uploaded ${file} ✓`);
  }

  await formHelpers.save(page);
  await logger.screenshot('developer-filled');
  console.log('Developer ✓');

  // ════════════════════════════════════════════
  // TAB: FORM > MASTER PLAN
  // ════════════════════════════════════════════
  logger.setTab('Master plan');
  await formHelpers.clickSubTab(page, 'Master plan');

  // Checkboxes
  await filler.checkBox('applicantYesIWillUploadAFinalMasterPlan', 'Upload final master plan');
  await filler.checkBox('applicantCheckbox', 'Master plan checkbox');
  await page.waitForTimeout(3000);

  // Hidden required fields via Form.io API
  logger.setSection('Hidden required fields');
  const formioResult = await formHelpers.setFormioData(page, {
    applicantNumberOfPlotsBlocksParcels: 1,
    applicantTotalLandArea: 50000,
    applicantUnit: 'sqft',
    applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation: 'No',
  });
  logger.logField('applicantNumberOfPlotsBlocksParcels', '1', 'number', 'Number of parcels (hidden)');
  logger.logField('applicantTotalLandArea', '50000', 'number', 'Total land area (hidden)');
  logger.logField('applicantUnit', 'sqft', 'text', 'Unit (hidden)');
  logger.logField('applicantGrading', 'No', 'radio', 'Grading required (hidden)');
  console.log('  Form.io data update:', JSON.stringify(formioResult));

  await formHelpers.save(page);
  await page.waitForTimeout(2000);
  await formHelpers.clickSubTab(page, 'Master plan');
  await page.waitForTimeout(3000);

  // Upload to visible browse links
  logger.setSection('Master plan uploads');
  const allBrowseLinks = page.locator('a.browse:visible');
  const browseCount = await allBrowseLinks.count();
  console.log(`  Master plan browse links visible: ${browseCount}`);

  const masterDocList = [
    ['TEST-concept-master-plan.pdf', 'Concept master plan'],
    ['TEST-final-master-plan.pdf', 'Final master plan'],
  ];
  for (let i = 0; i < Math.min(browseCount, masterDocList.length); i++) {
    try {
      const link = allBrowseLinks.nth(i);
      await link.scrollIntoViewIfNeeded();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(path.join(DOCS_DIR, masterDocList[i][0]));
      await page.waitForTimeout(3000);
      logger.logField(`masterplan-browse-${i}`, masterDocList[i][0], 'file', masterDocList[i][1]);
      console.log(`  Uploaded ${masterDocList[i][0]} ✓`);
    } catch (e) {
      logger.logError(`Master plan browse[${i}]`, String(e));
    }
  }

  // Navigate Master Plan sub-sections and upload
  const mpSubSections: Array<[string, string, string]> = [
    ['Land use', 'TEST-drainage-plan.pdf', 'Land use plan'],
    ['Infrastructure', 'TEST-infrastructure-layout.pdf', 'Infrastructure layout'],
    ['External connectivity', 'TEST-infrastructure-layout.pdf', 'External connectivity'],
  ];
  for (const [section, docFile, label] of mpSubSections) {
    const navLink = page.locator(`.nav-link:has-text("${section}")`).last();
    if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await navLink.click();
      await page.waitForTimeout(1500);
      logger.setSection(section);

      const secBrowse = page.locator('a.browse:visible');
      const secCount = await secBrowse.count();
      for (let i = 0; i < secCount; i++) {
        try {
          const link = secBrowse.nth(i);
          await link.scrollIntoViewIfNeeded();
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }),
            link.click(),
          ]);
          await fc.setFiles(path.join(DOCS_DIR, docFile));
          await page.waitForTimeout(2000);
          logger.logField(`${section}-browse-${i}`, docFile, 'file', `${label} [${i}]`);
          console.log(`  ${section} browse[${i}] ✓`);
        } catch {
          console.log(`  ${section} browse[${i}] failed`);
        }
      }
    }
  }

  // Unhide remaining browse links and upload
  logger.setSection('Hidden document uploads');
  await page.evaluate(() => {
    const links = document.querySelectorAll('a.browse');
    links.forEach(el => {
      let ancestor = el.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (getComputedStyle(ancestor).display === 'none') {
          (ancestor as HTMLElement).style.display = 'block';
        }
        if (ancestor.classList?.contains('tab-pane')) {
          ancestor.classList.add('active', 'show');
        }
        ancestor = ancestor.parentElement;
      }
    });
  });
  await page.waitForTimeout(1000);

  const nowVisible = page.locator('a.browse:visible');
  const nowCount = await nowVisible.count();
  console.log(`  Browse links after unhiding: ${nowCount}`);

  const browseDocMap: Array<[number, string, string]> = [
    [6, 'TEST-certificate-of-title.pdf', 'Certificate of title'],
    [7, 'TEST-landlords-affidavit.pdf', "Landlord's affidavit"],
    [8, 'TEST-affidavit-no-land-dispute.pdf', 'Affidavit no land dispute'],
    [9, 'TEST-site-plan.pdf', 'Parcel layout plan'],
    [10, 'TEST-survey-plan.pdf', "Surveyor's technical description"],
    [11, 'TEST-survey-plan.pdf', "Surveyor's sketch"],
    [12, 'TEST-drainage-plan.pdf', 'Land use map'],
    [13, 'TEST-drainage-plan.pdf', 'Land use schedule'],
    [14, 'TEST-building-plans.pdf', 'Zoning plan'],
    [15, 'TEST-building-plans.pdf', 'Density & building parameters'],
    [16, 'TEST-infrastructure-layout.pdf', 'Infrastructure layout'],
    [17, 'TEST-infrastructure-layout.pdf', 'Transport connectivity'],
    [18, 'TEST-building-plans.pdf', 'Early-stage plans'],
    [19, 'TEST-building-plans.pdf', 'Technical drawings'],
    [20, 'TEST-building-plans.pdf', 'Visual renderings'],
    [21, 'TEST-environmental-assessment.pdf', 'Site context'],
    [22, 'TEST-building-plans.pdf', 'Existing approvals'],
  ];

  for (const [idx, docFile, label] of browseDocMap) {
    if (idx >= nowCount) break;
    let uploaded = false;
    // Standard filechooser
    try {
      const link = nowVisible.nth(idx);
      await link.scrollIntoViewIfNeeded();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(path.join(DOCS_DIR, docFile));
      await page.waitForTimeout(3000);
      uploaded = true;
    } catch {}
    // JS click fallback
    if (!uploaded) {
      try {
        const [fc2] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          page.evaluate((browseIdx: number) => {
            const links = document.querySelectorAll('a.browse');
            const link = links[browseIdx] as HTMLElement;
            if (link) {
              link.style.position = 'fixed';
              link.style.top = '300px';
              link.style.left = '300px';
              link.style.zIndex = '99999';
              link.click();
            }
          }, idx),
        ]);
        await fc2.setFiles(path.join(DOCS_DIR, docFile));
        await page.waitForTimeout(3000);
        uploaded = true;
        await page.evaluate((browseIdx: number) => {
          const links = document.querySelectorAll('a.browse');
          const link = links[browseIdx] as HTMLElement;
          if (link) { link.style.position = ''; link.style.top = ''; link.style.left = ''; link.style.zIndex = ''; }
        }, idx);
      } catch {}
    }
    if (uploaded) {
      logger.logField(`browse-${idx}`, docFile, 'file', label);
      console.log(`  browse[${idx}] ${label} ✓`);
    } else {
      logger.logError(`browse[${idx}] upload`, `Failed: ${docFile}`);
      console.log(`  browse[${idx}] FAILED`);
    }
  }

  await formHelpers.save(page);
  // Viewport-only screenshot — page is too tall after CSS unhiding
  await logger.screenshot('master-plan-filled', false);
  console.log('Master plan ✓');

  // ════════════════════════════════════════════
  // TAB: FORM > BUSINESS PLAN
  // ════════════════════════════════════════════
  logger.setTab('Business plan');
  await formHelpers.clickSubTab(page, 'Business plan');
  await logger.screenshot('business-plan-empty');

  await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-business-plan.pdf'), 'Business plan document');
  console.log('  Business plan uploaded ✓');
  await page.waitForTimeout(2000);

  await formHelpers.save(page);
  await logger.screenshot('business-plan-filled');
  console.log('Business plan ✓');

  // ════════════════════════════════════════════
  // TAB: FORM > COMPLIANCE
  // ════════════════════════════════════════════
  logger.setTab('Compliance');
  await formHelpers.clickSubTab(page, 'Compliance');

  // 1. Ownership & financial integrity
  logger.setSection('Ownership & financial integrity');
  await logger.screenshot('compliance-ownership-empty');

  const finCheckboxes = page.locator('input[type="checkbox"][name*="applicantIsTheProjectBeingFinanced"]:visible');
  const finCount = await finCheckboxes.count();
  if (finCount > 0) {
    await finCheckboxes.first().check().catch(() => {});
    logger.logField('applicantIsTheProjectBeingFinanced', 'checked', 'checkbox', 'Financial source');
  }

  const fundingTextarea = page.locator('textarea[name*="applicantProvideAShortDescription"]:visible').first();
  if (await fundingTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fundingTextarea.fill('The project is funded through equity investment from the developer company and bank financing.');
    logger.logField('applicantProvideAShortDescription', 'equity + bank financing', 'textarea', 'Funding description');
  }

  // Radio "No" for all compliance questions
  const noLabels = page.locator('label:has-text("No"):visible');
  let noClicked = 0;
  for (let i = 0; i < await noLabels.count(); i++) {
    try {
      const labelText = await noLabels.nth(i).textContent();
      if (labelText?.trim() === 'No') {
        await noLabels.nth(i).scrollIntoViewIfNeeded();
        await noLabels.nth(i).click();
        noClicked++;
        await page.waitForTimeout(200);
      }
    } catch {}
  }
  logger.logField('compliance-radios', `${noClicked} "No" clicked`, 'radio', 'Compliance radio answers');

  // Due diligence upload
  const ownershipBrowse = page.locator('a.browse:visible').first();
  if (await ownershipBrowse.isVisible({ timeout: 1000 }).catch(() => false)) {
    await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-due-diligence-report.pdf'), 'Due diligence report');
  }
  await formHelpers.save(page);

  // 2. Health & Safety
  logger.setSection('Health & Safety');
  await formHelpers.clickSideNav(page, 'Health & Safety');
  await logger.screenshot('compliance-health-safety');

  const hsBrowse = page.locator('a.browse:visible').first();
  if (await hsBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-health-safety-plan.pdf'), 'Health & Safety plan');
  }
  const hsSurveys = await formHelpers.fillSurveyYes(page);
  logger.logField('health-safety-survey', `${hsSurveys} yes`, 'survey', 'H&S survey');
  await formHelpers.save(page);

  // 3. Disaster mitigation
  logger.setSection('Disaster mitigation & Recovery');
  await formHelpers.clickSideNav(page, 'Disaster mitigation');
  await logger.screenshot('compliance-disaster');

  const dmBrowse = page.locator('a.browse:visible').first();
  if (await dmBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-disaster-mitigation-plan.pdf'), 'Disaster mitigation plan');
  }
  const dmSurveys = await formHelpers.fillSurveyYes(page);
  logger.logField('disaster-survey', `${dmSurveys} yes`, 'survey', 'DM survey');
  await formHelpers.save(page);

  // 4. Security plan
  logger.setSection('Security plan');
  await formHelpers.clickSideNav(page, 'Security plan');
  await logger.screenshot('compliance-security');

  const spBrowse = page.locator('a.browse:visible').first();
  if (await spBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-security-plan.pdf'), 'Security plan');
  }
  const spSurveys = await formHelpers.fillSurveyYes(page);
  logger.logField('security-survey', `${spSurveys} yes`, 'survey', 'Security survey');
  await formHelpers.save(page);

  // 5. Licensing & Permits
  logger.setSection('Licensing & Permits');
  await formHelpers.clickSideNav(page, 'Licensing');
  await logger.screenshot('compliance-licensing');

  const lpSurveys = await formHelpers.fillSurveyYes(page);
  logger.logField('licensing-survey', `${lpSurveys} yes`, 'survey', 'Licensing survey');
  await formHelpers.save(page);

  // 6. Customs
  logger.setSection('Customs');
  await formHelpers.clickSideNav(page, 'Customs');
  await logger.screenshot('compliance-customs');

  const cusSurveys = await formHelpers.fillSurveyYes(page);
  logger.logField('customs-survey', `${cusSurveys} yes`, 'survey', 'Customs survey');
  await filler.clickRadio('applicantWillActivitiesIncludeTheHandlingOfExciseGoods', 'No', 'Excise goods');
  const cusBrowse = page.locator('a.browse:visible').first();
  if (await cusBrowse.isVisible({ timeout: 1000 }).catch(() => false)) {
    await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-customs-readiness-plan.pdf'), 'Customs readiness plan');
  }
  await formHelpers.save(page);
  await logger.screenshot('compliance-filled');
  console.log('Compliance ✓');

  // ════════════════════════════════════════════
  // TAB: PAYMENT
  // ════════════════════════════════════════════
  logger.setTab('Payment');
  await page.locator('text=Payment').first().click();
  await page.waitForTimeout(2000);
  await logger.screenshot('payment-empty');

  await filler.uploadGenericBrowse(path.join(DOCS_DIR, 'TEST-bank-reference-letter.pdf'), 'Proof of payment');
  console.log('  Payment uploaded ✓');
  await formHelpers.save(page);
  await logger.screenshot('payment-filled');

  // ════════════════════════════════════════════
  // TAB: SEND
  // ════════════════════════════════════════════
  logger.setTab('Send');
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);
  await logger.screenshot('send-tab');

  // Check consents
  const consentCbs = page.locator('input[type="checkbox"]:visible');
  const cbCount = await consentCbs.count();
  for (let i = 0; i < cbCount; i++) {
    await consentCbs.nth(i).check().catch(() => {});
    await page.waitForTimeout(200);
  }
  logger.logField('consents', `${cbCount} checked`, 'checkbox', 'Consent checkboxes');
  console.log(`  Consents: ${cbCount} ✓`);
  await logger.screenshot('send-consents-checked');

  // ════════════════════════════════════════════
  // VALIDATE
  // ════════════════════════════════════════════
  logger.setTab('Validation');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(1000);

  // Dismiss floating alerts before clicking validate
  await page.evaluate(() => {
    document.querySelectorAll('.floating-alerts .alert').forEach(el => (el as HTMLElement).remove());
  });

  const validateBtn = page.locator('button:has-text("validate the form"), button:has-text("Validate")');
  if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await validateBtn.click({ force: true });
    await page.waitForTimeout(3000);

    const errorItems = page.locator('.formio-errors .formio-error-wrapper, .text-danger:visible, .formio-errors li');
    const errCount = await errorItems.count();
    logger.logStateChange('Form validation', 'validating', `${errCount} errors`);
    console.log(`  Validation errors: ${errCount}`);

    if (errCount > 0) {
      const errTexts = await page.locator('.formio-errors .error, .help-block:visible, .formio-error-wrapper:visible').allTextContents();
      for (const t of errTexts.slice(0, 20)) {
        const clean = t.trim().replace(/\s+/g, ' ').substring(0, 100);
        if (clean) {
          console.log(`    - ${clean}`);
          logger.logError('Validation error', clean);
        }
      }
    } else {
      console.log('  ✅ No validation errors');
    }
  }
  await logger.screenshot('validation-result');

  // ════════════════════════════════════════════
  // SUBMIT
  // ════════════════════════════════════════════
  logger.setTab('Submit');
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);

  // Re-check consents
  const finalCbs = page.locator('input[type="checkbox"]:visible');
  for (let i = 0; i < await finalCbs.count(); i++) {
    await finalCbs.nth(i).check().catch(() => {});
  }

  // Dismiss alerts before submit
  await page.evaluate(() => {
    document.querySelectorAll('.floating-alerts .alert').forEach(el => (el as HTMLElement).remove());
  });

  const submitBtn = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  Submit button found — clicking...');
    logger.logButton('Submit application', 'clicked');
    await submitBtn.click({ force: true });
    await page.waitForTimeout(15000);

    const postUrl = page.url();
    if (!postUrl.includes('file_id')) {
      logger.logStateChange('Application submitted', 'form', 'submitted');
      console.log('  ✅ URL changed — submitted successfully');
    } else {
      logger.logStateChange('Submission attempt', 'form', 'still on form');
      console.log('  ⏳ Still on form page');
    }
    await logger.screenshot('post-submit');
  } else {
    logger.logButton('Submit application', 'not_found');
    console.log('  Submit button not visible');
  }

  // ════════════════════════════════════════════
  // SAVE EXECUTION LOG
  // ════════════════════════════════════════════
  logger.save(LOG_OUTPUT);
  const summary = logger.getSummary();
  console.log('\n══════ STRUCTURED CAPTURE SUMMARY ══════');
  console.log(`  Total entries: ${summary.totalEntries}`);
  console.log(`  Fields captured: ${summary.fields}`);
  console.log(`  Buttons captured: ${summary.buttons}`);
  console.log(`  Screenshots: ${summary.screenshots}`);
  console.log(`  Errors: ${summary.errors}`);
  console.log(`  Tabs: ${summary.tabs.join(', ')}`);
  console.log(`  File ID: ${fileId}`);
  console.log(`  Log: ${LOG_OUTPUT}`);
  console.log('\n=== DONE ===');
});
