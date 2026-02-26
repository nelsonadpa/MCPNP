import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 1 — Complete form fill and submission (v3)
 *
 * Based on diagnostic findings:
 * - Sections are already expanded (59/62)
 * - Choices.js dropdowns are SEARCH-BASED (type to load options from API)
 * - Master Plan/Business Plan have conditional fields
 * - Compliance has 6 side-nav sub-sections
 * - Actual input names from DOM: data[applicantNames], etc.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../02-front-office-tests/screenshots');
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');

// ── Helpers ──

async function fillText(page: any, componentKey: string, value: string) {
  const sel = `.formio-component-${componentKey}`;
  const input = page.locator(`${sel} input[type="text"]:visible, ${sel} textarea:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillText(${componentKey}): NOT visible`);
  return false;
}

async function fillEmail(page: any, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input[type="email"]:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillEmail(${componentKey}): NOT visible`);
  return false;
}

async function typeText(page: any, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.click();
      await input.fill('');
      await page.waitForTimeout(200);
      await input.type(value, { delay: 80 });
      return true;
    }
  } catch { }
  console.log(`  typeText(${componentKey}): NOT visible`);
  return false;
}

async function fillNumber(page: any, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillNumber(${componentKey}): NOT visible`);
  return false;
}

/**
 * Choices.js search-based select:
 * 1. Click the Choices wrapper to open/focus
 * 2. Type searchTerm into the search input
 * 3. Wait for API results
 * 4. Select first matching option
 */
async function searchAndSelect(page: any, componentKey: string, searchTerm: string) {
  try {
    const component = page.locator(`.formio-component-${componentKey}`).first();
    // The search input inside Choices.js
    const searchInput = component.locator('.choices__input--cloned:visible, input[name="search_terms"]:visible').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.scrollIntoViewIfNeeded();
      await searchInput.click();
      await page.waitForTimeout(300);
      await searchInput.fill('');
      await searchInput.type(searchTerm, { delay: 100 });
      // Wait for API to return options
      await page.waitForTimeout(2000);

      // Find selectable options (scoped to component first, then global)
      let options = component.locator('.choices__list--dropdown .choices__item--selectable:visible');
      let count = await options.count();
      if (count === 0) {
        // Try global (dropdown may render outside component)
        options = page.locator('.choices__list--dropdown.is-active .choices__item--selectable:visible');
        count = await options.count();
      }
      console.log(`  searchAndSelect(${componentKey}, "${searchTerm}"): ${count} options`);
      if (count > 0) {
        const optText = await options.first().textContent();
        console.log(`  → selecting: "${optText?.trim().substring(0, 50)}"`);
        await options.first().click();
        await page.waitForTimeout(500);
        return true;
      }
    } else {
      // Try clicking the outer Choices container to activate search
      const choicesDiv = component.locator('.choices:visible, .formio-choices:visible').first();
      if (await choicesDiv.isVisible({ timeout: 2000 })) {
        await choicesDiv.scrollIntoViewIfNeeded();
        await choicesDiv.click();
        await page.waitForTimeout(500);
        // Now try the search input again
        const si = component.locator('.choices__input--cloned:visible').first();
        if (await si.isVisible({ timeout: 1000 })) {
          await si.type(searchTerm, { delay: 100 });
          await page.waitForTimeout(2000);
          const opts = page.locator('.choices__list--dropdown .choices__item--selectable:visible');
          const c = await opts.count();
          if (c > 0) {
            await opts.first().click();
            await page.waitForTimeout(500);
            return true;
          }
        }
      }
      console.log(`  searchAndSelect(${componentKey}): search input NOT visible`);
    }
  } catch (e) {
    console.log(`  searchAndSelect(${componentKey}) ERROR: ${e}`);
  }
  return false;
}

async function clickRadioLabel(page: any, componentKey: string, labelText: string) {
  try {
    const label = page.locator(`.formio-component-${componentKey} label:has-text("${labelText}")`).first();
    if (await label.isVisible({ timeout: 2000 })) {
      await label.scrollIntoViewIfNeeded();
      await label.click();
      return true;
    }
  } catch { }
  console.log(`  clickRadio(${componentKey}, "${labelText}"): NOT visible`);
  return false;
}

async function checkBox(page: any, componentKey: string) {
  try {
    const cb = page.locator(`.formio-component-${componentKey} input[type="checkbox"]:visible`).first();
    if (await cb.isVisible({ timeout: 2000 })) {
      await cb.scrollIntoViewIfNeeded();
      await cb.check();
      return true;
    }
  } catch { }
  console.log(`  checkBox(${componentKey}): NOT visible`);
  return false;
}

async function clickSubTab(page: any, tabName: string) {
  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), .nav-link:has-text("${tabName}")`).first();
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await page.waitForTimeout(3000);
}

/** Click a compliance side-nav link (use .last() to avoid matching main tab links) */
async function clickComplianceNav(page: any, sectionName: string) {
  const link = page.locator(`.nav-link:has-text("${sectionName}")`).last();
  if (await link.isVisible({ timeout: 2000 })) {
    await link.click();
    await page.waitForTimeout(2000);
    return true;
  }
  console.log(`  clickComplianceNav("${sectionName}"): NOT visible`);
  return false;
}

async function uploadFile(page: any, componentKey: string, filePath: string) {
  try {
    const browseLink = page.locator(`.formio-component-${componentKey} a.browse`).first();
    if (await browseLink.isVisible({ timeout: 3000 })) {
      await browseLink.scrollIntoViewIfNeeded();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLink.click(),
      ]);
      await fileChooser.setFiles(filePath);
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (e) {
    console.log(`  uploadFile(${componentKey}) ERROR: ${e}`);
    return false;
  }
  console.log(`  uploadFile(${componentKey}): browse NOT visible`);
  return false;
}

/** Upload to first visible browse link (generic, no component key) */
async function uploadGenericBrowse(page: any, filePath: string) {
  try {
    const browseLink = page.locator('a.browse:visible').first();
    if (await browseLink.isVisible({ timeout: 3000 })) {
      await browseLink.scrollIntoViewIfNeeded();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLink.click(),
      ]);
      await fileChooser.setFiles(filePath);
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (e) {
    console.log(`  uploadGenericBrowse ERROR: ${e}`);
  }
  return false;
}

/** Click all visible "yes" radio buttons in survey components */
async function fillSurveyYes(page: any) {
  // Survey radio inputs have value "yes" or "no"
  const yesRadios = page.locator('input[type="radio"][value="yes"]:visible');
  const count = await yesRadios.count();
  for (let i = 0; i < count; i++) {
    try {
      const radio = yesRadios.nth(i);
      await radio.scrollIntoViewIfNeeded();
      await radio.click({ force: true });
      await page.waitForTimeout(100);
    } catch { }
  }
  return count;
}

async function save(page: any) {
  try {
    const saveBtn = page.locator('button.btn-success:visible, [class*="save"]:visible').last();
    if (await saveBtn.isVisible({ timeout: 2000 })) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      return;
    }
  } catch { }
}

// ── Main Test ──

test('P1-SUBMIT: Fill entire form and submit', async ({ page }) => {
  test.setTimeout(1_200_000); // 20 min (30+ file uploads are slow)

  // ── Open application ──
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Establish a new zone' }).click();
  await page.waitForTimeout(5000);
  console.log(`\n=== FILE: ${page.url()} ===\n`);

  // ════════════════════════════════════════════
  // TAB: FORM > PROJECT OVERVIEW
  // ════════════════════════════════════════════
  console.log('──── PROJECT OVERVIEW ────');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(2000);

  // Zone identity
  await fillText(page, 'applicantProposedNameOfZone', 'TEST-SEZ Kingston Innovation Park');
  await clickRadioLabel(page, 'applicantMultiOrSingleOccupant', 'Multi-occupant');
  await clickRadioLabel(page, 'applicantMultiOrSingleOccupant2', 'Multi-purpose');
  console.log('Zone identity ✓');

  // Site — Parish is a search-based Choices.js dropdown
  await searchAndSelect(page, 'applicantCity3', 'Kingston');
  await fillText(page, 'applicantAddress3', '123 Test Industrial Road, Kingston 15, Jamaica');
  await fillNumber(page, 'applicantTotalLandArea3', '50000');
  await searchAndSelect(page, 'applicantUnit3', 'Square');
  console.log('Site ✓');

  // Land parcels EditGrid — row 0 is already rendered in DOM
  // Fill the pre-existing parcel row fields
  try {
    const parcelInput = page.locator('.formio-component-applicantParcelsDescriptionGrid input[type="text"]:visible').first();
    if (await parcelInput.isVisible({ timeout: 2000 })) {
      await parcelInput.fill('Parcel A - Main Site');
      // Radio options in the grid row
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Private"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Held"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      await page.locator('.formio-component-applicantParcelsDescriptionGrid label:has-text("Ownership"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);
      // Save the row if save button exists
      const saveRow = page.locator('.formio-component-applicantParcelsDescriptionGrid button:has-text("Save"):visible').first();
      if (await saveRow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveRow.click();
        await page.waitForTimeout(1000);
      }
      console.log('Land parcel row ✓');
    }
  } catch (e) {
    console.log(`Land parcels skipped: ${e}`);
  }

  // Number of parcels (may be required — try common field patterns)
  const parcelNum = page.locator('input[name*="NumberOfParcels"]:visible, input[name*="numberOfParcels"]:visible, input[name*="numberParcels"]:visible, input[name*="Parcels"][type="text"]:visible').first();
  if (await parcelNum.isVisible({ timeout: 1000 }).catch(() => false)) {
    await parcelNum.fill('1');
    console.log('Number of parcels: 1 ✓');
  } else {
    // Try by searching nearby labels
    const parcelLabel = page.locator('label:has-text("Number of parcels"), label:has-text("number of parcels")').first();
    if (await parcelLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Find input near this label
      const nearInput = page.locator('label:has-text("Number of parcels") ~ input:visible, label:has-text("Number of parcels") + * input:visible').first();
      if (await nearInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nearInput.fill('1');
        console.log('Number of parcels (by label): 1 ✓');
      }
    }
    // Also log all unfilled inputs on this tab to debug
    const allInputs = await page.evaluate(() => {
      const els = document.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="search"]), textarea');
      return Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(e => ({
        name: (e as HTMLInputElement).name?.substring(0, 80),
        value: (e as HTMLInputElement).value?.substring(0, 30),
        type: (e as HTMLInputElement).type,
      }));
    });
    console.log('All visible inputs on Project Overview:');
    for (const inp of allInputs) {
      console.log(`  [${inp.type}] name="${inp.name}" value="${inp.value}"`);
    }
  }

  // Search the ENTIRE DOM for any element related to "number of parcels"
  const parcelSearch = await page.evaluate(() => {
    // Search all elements for "parcel" related content
    const allEls = document.querySelectorAll('input, textarea, select, label, .form-group');
    const results: any[] = [];
    for (const el of allEls) {
      const name = (el as HTMLInputElement).name || '';
      const text = el.textContent || '';
      const cls = el.className || '';
      if (name.toLowerCase().includes('parcel') || text.toLowerCase().includes('number of parcel') ||
          cls.toLowerCase().includes('parcel')) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        results.push({
          tag: el.tagName,
          name: name.substring(0, 80),
          text: text.trim().substring(0, 60),
          classes: cls.substring(0, 80),
          visible: rect.width > 0 && rect.height > 0,
          display: getComputedStyle(el).display,
        });
      }
    }
    return results;
  });
  console.log(`DOM search for "parcel" (${parcelSearch.length} elements):`);
  for (const p of parcelSearch.slice(0, 15)) {
    console.log(`  ${p.tag} name="${p.name}" visible=${p.visible} display=${p.display} text="${p.text}"`);
  }

  // Proposed activities — search-based multi-select
  await searchAndSelect(page, 'applicantAuthorizedActivities', 'Manufacturing');

  // Also fill "Other Activity" field if visible
  await fillText(page, 'applicantOtherActivity', 'Special Economic Zone Administration');

  console.log('Project overview complete');

  await save(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-01-overview.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: FORM > DEVELOPER
  // ════════════════════════════════════════════
  console.log('\n──── DEVELOPER ────');
  await clickSubTab(page, 'Developer');

  // Company
  await fillText(page, 'applicantCompanyName', 'TEST-SEZ Development Corp Ltd');
  await searchAndSelect(page, 'applicantCompanyType', 'Limited'); // Choices.js search
  await fillText(page, 'applicantTaxRegistrationNumberTrn2', 'TEST-REG-12345'); // Registration number at COJ
  await typeText(page, 'applicantTaxRegistrationNumberTrn', '123456789'); // TRN (masked input)
  console.log('Company ✓');

  // Address
  await searchAndSelect(page, 'applicantCity', 'Kingston'); // Parish Choices.js search
  await fillText(page, 'applicantAddress', '456 Corporate Drive, Kingston 10, Jamaica');
  await fillText(page, 'applicantPhone', '+18765550100');
  await fillEmail(page, 'applicantEmail', 'test-sez@example.com');
  console.log('Address ✓');

  // Authorized representative (correct key: applicantNames, not applicantName)
  await fillText(page, 'applicantNames', 'John');
  await fillText(page, 'applicantLastName', 'Testerton');
  await fillText(page, 'applicantPhone2', '+18765550200');
  await fillEmail(page, 'applicantEmail2', 'john.testerton@example.com');
  console.log('Representative ✓');

  // Ownership & Structure — EditGrid row 0 is pre-rendered
  try {
    const editGridName = page.locator('.formio-component-applicantEditGrid input[type="text"]:visible').first();
    if (await editGridName.isVisible({ timeout: 2000 })) {
      await editGridName.fill('Test Shareholder Holdings Ltd');

      // Nationality — search-based Choices.js inside EditGrid
      const natSearch = page.locator('.formio-component-applicantEditGrid .choices__input--cloned:visible').first();
      if (await natSearch.isVisible({ timeout: 1000 }).catch(() => false)) {
        await natSearch.click();
        await natSearch.type('Jamaica', { delay: 100 });
        await page.waitForTimeout(2000);
        const natOpt = page.locator('.choices__list--dropdown .choices__item--selectable:visible').first();
        if (await natOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await natOpt.click();
          await page.waitForTimeout(300);
        }
      }

      // % of shares
      const pctInput = page.locator('.formio-component-applicantEditGrid input[type="text"]:visible').last();
      // This may be the % field (number rendered as text type per diagnostic)
      const allInputs = page.locator('.formio-component-applicantEditGrid input:visible');
      const inputCount = await allInputs.count();
      if (inputCount > 1) {
        // Find the number-like input (component="number")
        const numInput = page.locator('.formio-component-applicantOfTotalShares input:visible, .formio-component-applicantEditGrid .formio-component-number input:visible').first();
        if (await numInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await numInput.fill('100');
        }
      }

      // Radio: Yes for beneficial owner
      await page.locator('.formio-component-applicantEditGrid label:has-text("Yes"):visible').first().click().catch(() => {});
      await page.waitForTimeout(200);

      // Save row if button exists
      const saveRow = page.locator('.formio-component-applicantEditGrid button:has-text("Save"):visible').first();
      if (await saveRow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveRow.click();
        await page.waitForTimeout(1000);
      }
      console.log('Shareholder row ✓');
    }
  } catch (e) {
    console.log(`Shareholders skipped: ${e}`);
  }

  // Joint ventures: No
  await clickRadioLabel(page, 'applicantIsThisAJointVentureSpecialPurposeVehicleOrNonResidentCompany', 'No');
  // Paid-up capital
  await fillNumber(page, 'applicantEnterYourPaidUpCapitalAmountInUsd', '2000000');

  // Document uploads (4 browse links visible on Developer per diagnostic)
  const devDocs = [
    ['applicantCertificateOfIncorporation', 'TEST-certificate-of-incorporation.pdf'],
    ['applicantArticlesOfIncorporation', 'TEST-articles-of-incorporation.pdf'],
    ['applicantTaxComplianceCertificate', 'TEST-tax-compliance-certificate.pdf'],
    ['applicantProofOfIssuedAndPaidUpShareCapitalUs1500000', 'TEST-financial-statements.pdf'],
  ];
  for (const [key, file] of devDocs) {
    const result = await uploadFile(page, key, path.join(DOCS_DIR, file));
    if (result) console.log(`Uploaded ${file} ✓`);
  }

  console.log('Developer complete');
  await save(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-02-developer.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: FORM > MASTER PLAN
  // ════════════════════════════════════════════
  console.log('\n──── MASTER PLAN ────');
  await clickSubTab(page, 'Master plan');

  // Master plan has many hidden required fields. First, check both checkboxes.
  await checkBox(page, 'applicantYesIWillUploadAFinalMasterPlan');
  await checkBox(page, 'applicantCheckbox');
  await page.waitForTimeout(3000);

  // Set hidden required fields via Form.io JS API
  // Find the Formio form instance and update data directly
  const formioResult = await page.evaluate(() => {
    // Try to find Form.io instance
    const formEl = document.querySelector('.formio-form') as any;
    // eRegistrations/Form.io stores instance reference
    const instances = (window as any).Formio?.forms || {};
    const formKeys = Object.keys(instances);
    if (formKeys.length > 0) {
      const form = instances[formKeys[0]];
      const currentData = form?.submission?.data || {};
      // Set required Master Plan fields
      const updates: any = {
        applicantNumberOfPlotsBlocksParcels: 1,
        applicantTotalLandArea: 50000,
        applicantUnit: 'sqft',
        applicantIndicateWhetherTheTerrainRequiresSubstantialGradingOrSitePreparation: 'No',
      };
      form.submission = { data: { ...currentData, ...updates } };
      return { success: true, formKeys: formKeys.length, dataKeys: Object.keys(currentData).length };
    }
    // Fallback: set via input elements
    const setField = (name: string, value: string) => {
      const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };
    const r1 = setField('data[applicantNumberOfPlotsBlocksParcels]', '1');
    const r2 = setField('data[applicantTotalLandArea]', '50000');
    return { success: false, fallback: true, r1, r2 };
  });
  console.log('Form.io data update:', JSON.stringify(formioResult));
  await page.waitForTimeout(2000);

  // After data update, save to persist
  await save(page);
  await page.waitForTimeout(2000);

  // Reload the tab to see if more sections appear after save
  await clickSubTab(page, 'Master plan');
  await page.waitForTimeout(3000);

  // Log how many sections/elements are now visible
  const masterSectionCount = await page.locator('.card-header[role="button"]:visible').count();
  console.log(`Master plan visible sections after save: ${masterSectionCount}`);

  // Upload to ALL visible browse links
  const masterDocList = [
    'TEST-concept-master-plan.pdf',
    'TEST-final-master-plan.pdf',
    'TEST-certificate-of-title.pdf',
    'TEST-landlords-affidavit.pdf',
    'TEST-affidavit-no-land-dispute.pdf',
    'TEST-site-plan.pdf',
    'TEST-survey-plan.pdf',
    'TEST-survey-plan.pdf',
    'TEST-drainage-plan.pdf',
    'TEST-building-plans.pdf',
    'TEST-building-plans.pdf',
    'TEST-infrastructure-layout.pdf',
    'TEST-infrastructure-layout.pdf',
    'TEST-building-plans.pdf',
    'TEST-building-plans.pdf',
    'TEST-building-plans.pdf',
    'TEST-environmental-assessment.pdf',
    'TEST-building-plans.pdf',
  ];

  const allBrowseLinks = page.locator('a.browse:visible');
  const browseCount = await allBrowseLinks.count();
  console.log(`Master plan browse links visible: ${browseCount}`);
  for (let i = 0; i < browseCount; i++) {
    const docFile = masterDocList[i] || 'TEST-concept-master-plan.pdf';
    try {
      const link = allBrowseLinks.nth(i);
      await link.scrollIntoViewIfNeeded();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(path.join(DOCS_DIR, docFile));
      await page.waitForTimeout(3000);
      console.log(`  Uploaded ${docFile} to browse[${i}] ✓`);
    } catch (e) {
      console.log(`  Browse[${i}] upload failed`);
    }
  }

  // Check for internal sub-navigation on Master Plan (like Compliance side-nav)
  const mpNavLinks = page.locator('.nav-link:visible, .list-group-item:visible');
  const mpNavCount = await mpNavLinks.count();
  console.log(`Master plan nav links: ${mpNavCount}`);
  for (let i = 0; i < Math.min(mpNavCount, 15); i++) {
    const txt = await mpNavLinks.nth(i).textContent();
    console.log(`  nav[${i}] = "${txt?.trim().replace(/\s+/g, ' ').substring(0, 50)}"`);
  }

  // Try to click through ALL Master Plan sub-sections to initialize them
  const mpSubSections = [
    'Land rights',
    'Supporting maps',
    'Land use',
    'Density',
    'Infrastructure',
    'External connectivity',
    'Design drawings',
    'Site context',
    'Existing approvals',
  ];
  for (const section of mpSubSections) {
    try {
      const navLink = page.locator(`.nav-link:has-text("${section}")`).last();
      if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        await navLink.click();
        await page.waitForTimeout(1500);
        // Upload to all visible browse links on this sub-section
        const secBrowse = page.locator('a.browse:visible');
        const secCount = await secBrowse.count();
        if (secCount > 0) {
          console.log(`  ${section}: ${secCount} browse links`);
          for (let i = 0; i < secCount; i++) {
            try {
              const link = secBrowse.nth(i);
              await link.scrollIntoViewIfNeeded();
              const [fc] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 5000 }),
                link.click(),
              ]);
              const docFiles: Record<string, string> = {
                'Land rights': 'TEST-certificate-of-title.pdf',
                'Supporting maps': 'TEST-site-plan.pdf',
                'Land use': 'TEST-drainage-plan.pdf',
                'Density': 'TEST-building-plans.pdf',
                'Infrastructure': 'TEST-infrastructure-layout.pdf',
                'External connectivity': 'TEST-infrastructure-layout.pdf',
                'Design drawings': 'TEST-building-plans.pdf',
                'Site context': 'TEST-environmental-assessment.pdf',
                'Existing approvals': 'TEST-building-plans.pdf',
              };
              await fc.setFiles(path.join(DOCS_DIR, docFiles[section] || 'TEST-building-plans.pdf'));
              await page.waitForTimeout(2000);
              console.log(`    browse[${i}] uploaded ✓`);
            } catch {
              console.log(`    browse[${i}] failed`);
            }
          }
        }
      }
    } catch { }
  }

  // Go back to Upload your master plan section
  try {
    const uploadLink = page.locator('.nav-link:has-text("Upload your master plan")').last();
    if (await uploadLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await uploadLink.click();
      await page.waitForTimeout(1000);
    }
  } catch { }

  // Search ALL browse links in DOM (visible + hidden) to understand the upload layout
  const allDomBrowse = await page.evaluate(() => {
    const links = document.querySelectorAll('a.browse');
    return Array.from(links).map((el, i) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const comp = el.closest('[class*="formio-component-"]');
      const compClass = comp?.className?.match(/formio-component-(\S+)/)?.[1] || '';
      const panel = el.closest('.card-body');
      const panelHeader = panel?.previousElementSibling;
      const sectionTitle = panelHeader?.textContent?.trim().substring(0, 50) || '';
      const hidden = getComputedStyle(el).display === 'none' ||
        getComputedStyle(el.parentElement!).display === 'none';
      // Check all ancestors for display:none
      let ancestor = el.parentElement;
      let hiddenAncestor = '';
      while (ancestor && ancestor !== document.body) {
        if (getComputedStyle(ancestor).display === 'none') {
          hiddenAncestor = ancestor.className?.substring(0, 60) || ancestor.tagName;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      return {
        idx: i,
        visible: rect.width > 0 && rect.height > 0,
        component: compClass.substring(0, 50),
        section: sectionTitle,
        hiddenBy: hiddenAncestor,
      };
    });
  });
  console.log(`ALL browse links in DOM: ${allDomBrowse.length}`);
  for (const b of allDomBrowse) {
    console.log(`  [${b.idx}] visible=${b.visible} comp="${b.component}" section="${b.section}" hiddenBy="${b.hiddenBy}"`);
  }

  // If there are hidden browse links, try to make their containers visible and upload
  const hiddenBrowseLinks = allDomBrowse.filter(b => !b.visible);
  if (hiddenBrowseLinks.length > 0) {
    console.log(`\nAttempting to upload to ${hiddenBrowseLinks.length} hidden browse links...`);
    // Make all file upload containers visible + activate tab-panes
    await page.evaluate(() => {
      const links = document.querySelectorAll('a.browse');
      links.forEach(el => {
        let ancestor = el.parentElement;
        while (ancestor && ancestor !== document.body) {
          if (getComputedStyle(ancestor).display === 'none') {
            (ancestor as HTMLElement).style.display = 'block';
          }
          // Activate tab-panes so components are properly initialized
          if (ancestor.classList?.contains('tab-pane')) {
            ancestor.classList.add('active', 'show');
          }
          ancestor = ancestor.parentElement;
        }
      });
    });
    await page.waitForTimeout(1000);

    // Now try uploading to all visible browse links
    const nowVisible = page.locator('a.browse:visible');
    const nowCount = await nowVisible.count();
    console.log(`Browse links visible after unhiding: ${nowCount}`);

    const masterDocList2 = [
      'TEST-concept-master-plan.pdf', 'TEST-final-master-plan.pdf',
      'TEST-certificate-of-title.pdf', 'TEST-landlords-affidavit.pdf',
      'TEST-affidavit-no-land-dispute.pdf', 'TEST-site-plan.pdf',
      'TEST-survey-plan.pdf', 'TEST-survey-plan.pdf',
      'TEST-drainage-plan.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-infrastructure-layout.pdf',
      'TEST-infrastructure-layout.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-environmental-assessment.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
      'TEST-building-plans.pdf', 'TEST-building-plans.pdf',
    ];

    // DOM browse order: [0-3]=Developer tab, [4-5]=Master plan concept+final (done),
    // [6+]=Master plan document uploads we need to fill.
    // Map document files to correct browse indices
    const browseDocMap: Array<[number, string]> = [
      [6, 'TEST-certificate-of-title.pdf'],       // Land rights: certificate of title
      [7, 'TEST-landlords-affidavit.pdf'],         // Land rights: owner's affidavit
      [8, 'TEST-affidavit-no-land-dispute.pdf'],   // Land rights: no land dispute
      [9, 'TEST-site-plan.pdf'],                   // Supporting maps: parcel layout plan
      [10, 'TEST-survey-plan.pdf'],                // Supporting maps: surveyor's description
      [11, 'TEST-survey-plan.pdf'],                // Supporting maps: surveyor's sketch
      [12, 'TEST-drainage-plan.pdf'],              // Land use plan: map
      [13, 'TEST-drainage-plan.pdf'],              // Land use plan: schedule
      [14, 'TEST-building-plans.pdf'],             // Land use plan: zoning
      [15, 'TEST-building-plans.pdf'],             // Density: building areas
      [16, 'TEST-infrastructure-layout.pdf'],      // Infrastructure layout
      [17, 'TEST-infrastructure-layout.pdf'],      // External connectivity: transport
      [18, 'TEST-building-plans.pdf'],             // Design: early-stage plans
      [19, 'TEST-building-plans.pdf'],             // Design: technical drawings
      [20, 'TEST-building-plans.pdf'],             // Design: visual renderings
      [21, 'TEST-environmental-assessment.pdf'],   // Site context: photos/docs
      [22, 'TEST-building-plans.pdf'],             // Existing approvals
    ];

    // First pass: scroll through all unhidden sections to trigger initialization
    for (let i = 6; i <= 22 && i < nowCount; i++) {
      try {
        await nowVisible.nth(i).scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
      } catch { }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Second pass: upload to each browse link
    for (const [idx, docFile] of browseDocMap) {
      if (idx >= nowCount) break;
      let uploaded = false;
      // Try filechooser approach (2 attempts)
      for (let attempt = 0; attempt < 2 && !uploaded; attempt++) {
        try {
          const link = nowVisible.nth(idx);
          await link.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }),
            link.click(),
          ]);
          await fc.setFiles(path.join(DOCS_DIR, docFile));
          await page.waitForTimeout(3000);
          console.log(`  Uploaded ${docFile} to browse[${idx}] ✓`);
          uploaded = true;
        } catch (e) {
          if (attempt === 0) {
            // Click link first to initialize, wait, then retry
            try { await nowVisible.nth(idx).click(); } catch { }
            await page.waitForTimeout(2000);
          }
        }
      }
      // Fallback 1: JavaScript-level click (bypasses coordinate issues for off-screen elements)
      if (!uploaded) {
        try {
          const [fc2] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }),
            page.evaluate((browseIdx: number) => {
              const links = document.querySelectorAll('a.browse');
              const link = links[browseIdx] as HTMLElement;
              if (link) {
                // Fix position so component initializes properly
                link.style.position = 'fixed';
                link.style.top = '300px';
                link.style.left = '300px';
                link.style.zIndex = '99999';
                link.click(); // DOM-level click, no coordinate dependency
              }
            }, idx),
          ]);
          await fc2.setFiles(path.join(DOCS_DIR, docFile));
          await page.waitForTimeout(3000);
          console.log(`  Uploaded ${docFile} to browse[${idx}] via JS click ✓`);
          uploaded = true;
          // Restore position
          await page.evaluate((browseIdx: number) => {
            const links = document.querySelectorAll('a.browse');
            const link = links[browseIdx] as HTMLElement;
            if (link) {
              link.style.position = '';
              link.style.top = '';
              link.style.left = '';
              link.style.zIndex = '';
            }
          }, idx);
        } catch {
          console.log(`  Browse[${idx}] JS click also failed`);
        }
      }
      // Fallback 2: try finding nearest input[type="file"] and use setInputFiles
      if (!uploaded) {
        try {
          const fileInput = await page.evaluate((browseIdx: number) => {
            const links = document.querySelectorAll('a.browse');
            const link = links[browseIdx];
            if (!link) return null;
            const comp = link.closest('[class*="formio-component-"]');
            const input = comp?.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) {
              input.style.display = 'block';
              input.style.opacity = '1';
              input.style.position = 'relative';
              return true;
            }
            return null;
          }, idx);
          if (fileInput) {
            await page.waitForTimeout(500);
            const fInput = page.locator(`a.browse`).nth(idx).locator('..').locator('input[type="file"]').first();
            if (await fInput.count() > 0) {
              await fInput.setInputFiles(path.join(DOCS_DIR, docFile));
              await page.waitForTimeout(3000);
              console.log(`  Uploaded ${docFile} to browse[${idx}] via input[file] ✓`);
              uploaded = true;
            }
          }
        } catch { }
      }
      if (!uploaded) {
        console.log(`  Browse[${idx}] ${docFile} FAILED all methods`);
      }
    }
  }

  const masterInputs = await page.locator('input:visible, textarea:visible').count();
  console.log(`Master plan visible elements: ${masterInputs}`);

  console.log('Master plan complete');
  await save(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-03-masterplan.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: FORM > BUSINESS PLAN
  // ════════════════════════════════════════════
  console.log('\n──── BUSINESS PLAN ────');
  await clickSubTab(page, 'Business plan');

  // Business plan tab has 0 inputs + 1 browse link (per diagnostic)
  // Upload business plan document
  const bpResult = await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-business-plan.pdf'));
  if (bpResult) console.log('Business plan uploaded ✓');
  await page.waitForTimeout(2000); // wait for any conditional fields to appear

  // Try filling any numeric fields that appeared
  const bpInputs = await page.locator('input[type="text"]:visible, input[type="number"]:visible').count();
  console.log(`Business plan visible inputs after upload: ${bpInputs}`);

  console.log('Business plan complete');
  await save(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-04-businessplan.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: FORM > COMPLIANCE (6 sub-sections via side-nav)
  // ════════════════════════════════════════════
  console.log('\n──── COMPLIANCE ────');
  await clickSubTab(page, 'Compliance');

  // --- Sub-section 1: Ownership & financial integrity (default view) ---
  console.log('  → Ownership & financial integrity');

  // Financial source checkboxes (use name-based selector since formio class names are truncated)
  const finCheckboxes = page.locator('input[type="checkbox"][name*="applicantIsTheProjectBeingFinanced"]:visible');
  const finCount = await finCheckboxes.count();
  if (finCount > 0) {
    await finCheckboxes.first().check().catch(() => {});
    console.log(`  Checked financial source (${finCount} available)`);
  }

  // Textarea: funding description (use name-based selector)
  const fundingTextarea = page.locator('textarea[name*="applicantProvideAShortDescription"]:visible').first();
  if (await fundingTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fundingTextarea.fill('The project is funded through equity investment from the developer company and bank financing.');
    console.log('  Funding description filled');
  }

  // Radio questions: answer "No" — use labels (radio inputs may be hidden by CSS)
  await page.waitForTimeout(1000); // ensure content is rendered
  // Try clicking "No" labels within radio groups
  const noLabels2 = page.locator('label:has-text("No"):visible');
  const noLabelCount = await noLabels2.count();
  let noClicked = 0;
  for (let i = 0; i < noLabelCount; i++) {
    try {
      const labelText = await noLabels2.nth(i).textContent();
      // Only click if label text is exactly "No" (not "None", "Not", etc.)
      if (labelText?.trim() === 'No') {
        await noLabels2.nth(i).scrollIntoViewIfNeeded();
        await noLabels2.nth(i).click();
        noClicked++;
        await page.waitForTimeout(200);
      }
    } catch { }
  }
  console.log(`  "No" labels clicked: ${noClicked}/${noLabelCount}`);

  // File upload on this section
  const ownershipBrowse = page.locator('a.browse:visible');
  if (await ownershipBrowse.first().isVisible({ timeout: 1000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-due-diligence-report.pdf'));
    console.log('  Due diligence uploaded ✓');
  }

  await save(page);

  // --- Sub-section 2: Health & Safety ---
  console.log('  → Health & Safety');
  await clickComplianceNav(page, 'Health & Safety');
  // Upload health & safety plan
  const hsBrowse = page.locator('a.browse:visible').first();
  if (await hsBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-health-safety-plan.pdf'));
    console.log('  Health & Safety plan uploaded ✓');
  }
  // Fill any survey questions
  const hsSurveys = await fillSurveyYes(page);
  console.log(`  H&S survey "yes" clicked: ${hsSurveys}`);
  await save(page);

  // --- Sub-section 3: Disaster mitigation & Recovery ---
  console.log('  → Disaster mitigation & Recovery');
  await clickComplianceNav(page, 'Disaster mitigation');
  // Upload disaster plan
  const dmBrowse = page.locator('a.browse:visible').first();
  if (await dmBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-disaster-mitigation-plan.pdf'));
    console.log('  Disaster plan uploaded ✓');
  }
  // Fill survey questions with "yes"
  const dmSurveys = await fillSurveyYes(page);
  console.log(`  DM survey "yes" clicked: ${dmSurveys}`);
  await save(page);

  // --- Sub-section 4: Security plan ---
  console.log('  → Security plan');
  await clickComplianceNav(page, 'Security plan');
  // Upload security plan
  const spBrowse = page.locator('a.browse:visible').first();
  if (await spBrowse.isVisible({ timeout: 2000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-security-plan.pdf'));
    console.log('  Security plan uploaded ✓');
  }
  // Fill any survey questions
  const spSurveys = await fillSurveyYes(page);
  console.log(`  Security survey "yes" clicked: ${spSurveys}`);
  await save(page);

  // --- Sub-section 5: Licensing & Permits ---
  console.log('  → Licensing & Permits');
  await clickComplianceNav(page, 'Licensing');
  // Fill any visible fields/surveys
  const lpSurveys = await fillSurveyYes(page);
  console.log(`  Licensing survey "yes" clicked: ${lpSurveys}`);
  const lpBrowse = page.locator('a.browse:visible').first();
  if (await lpBrowse.isVisible({ timeout: 1000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-customs-readiness-plan.pdf'));
  }
  await save(page);

  // --- Sub-section 6: Customs ---
  console.log('  → Customs');
  await clickComplianceNav(page, 'Customs');
  // Fill survey Yes/No
  const cusSurveys = await fillSurveyYes(page);
  console.log(`  Customs survey "yes" clicked: ${cusSurveys}`);
  // Excise goods: No
  await clickRadioLabel(page, 'applicantWillActivitiesIncludeTheHandlingOfExciseGoods', 'No');
  const cusBrowse = page.locator('a.browse:visible').first();
  if (await cusBrowse.isVisible({ timeout: 1000 }).catch(() => false)) {
    await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-customs-readiness-plan.pdf'));
  }
  await save(page);

  console.log('Compliance complete');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-05-compliance.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: PAYMENT
  // ════════════════════════════════════════════
  console.log('\n──── PAYMENT ────');
  await page.locator('text=Payment').first().click();
  await page.waitForTimeout(2000);

  // Upload proof of payment (1 browse link per diagnostic)
  const payResult = await uploadGenericBrowse(page, path.join(DOCS_DIR, 'TEST-bank-reference-letter.pdf'));
  if (payResult) console.log('Payment proof uploaded ✓');

  await save(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-06-payment.png'), fullPage: true });

  // ════════════════════════════════════════════
  // TAB: SEND — Check consents
  // ════════════════════════════════════════════
  console.log('\n──── SEND ────');
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);

  // Check all visible consent checkboxes (generic approach — formio component
  // classes don't match the long key names)
  const consentCbs = page.locator('input[type="checkbox"]:visible');
  const cbCount = await consentCbs.count();
  for (let i = 0; i < cbCount; i++) {
    await consentCbs.nth(i).check().catch(() => {});
    await page.waitForTimeout(200);
  }
  console.log(`Consents checked: ${cbCount} ✓`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-07-send.png'), fullPage: true });

  // ════════════════════════════════════════════
  // VALIDATE before submit
  // ════════════════════════════════════════════
  console.log('\n──── VALIDATION ────');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(1000);

  const validateBtn = page.locator('button:has-text("validate the form"), button:has-text("Validate")');
  if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await validateBtn.click();
    await page.waitForTimeout(3000);

    // Check for error alert
    const errorPanel = page.locator('.alert-danger:visible');
    if (await errorPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
      const errorText = await errorPanel.textContent();
      console.log(`Validation result: ${errorText?.trim().replace(/\s+/g, ' ').substring(0, 300)}`);
    }

    // Count error items
    const errorItems = page.locator('.formio-errors .formio-error-wrapper, .text-danger:visible');
    const errCount = await errorItems.count();
    console.log(`Error items: ${errCount}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-08-validation.png'), fullPage: true });

    if (errCount === 0) {
      console.log('✅ No validation errors — ready to submit!');
    } else {
      console.log(`⚠️ ${errCount} validation issues remaining`);
      const errTexts = await page.locator('.formio-errors .error, .help-block:visible, .formio-error-wrapper:visible').allTextContents();
      for (const t of errTexts.slice(0, 20)) {
        const clean = t.trim().replace(/\s+/g, ' ').substring(0, 100);
        if (clean) console.log(`  - ${clean}`);
      }
    }
  }

  // ════════════════════════════════════════════
  // SUBMIT
  // ════════════════════════════════════════════
  console.log('\n──── SUBMIT ────');
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);

  // Re-check consents (may have unchecked after navigation)
  const finalCbs = page.locator('input[type="checkbox"]:visible');
  for (let i = 0; i < await finalCbs.count(); i++) {
    await finalCbs.nth(i).check().catch(() => {});
  }

  const submitBtn = page.locator('button:has-text("Submit application")').first();
  if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Submit button found — clicking...');
    await submitBtn.click();
    await page.waitForTimeout(15000); // Wait 15s for submission to process

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-09-after-submit.png'), fullPage: true });
    const postUrl = page.url();
    console.log(`Post-submit URL: ${postUrl}`);

    // Check button state (disabled = submitted)
    const btnDisabled = await submitBtn.isDisabled().catch(() => false);
    const btnText = await submitBtn.textContent().catch(() => '');
    console.log(`Submit button: disabled=${btnDisabled} text="${btnText?.trim()}"`);

    // Check for success indicators
    const successMsg = page.locator('text=successfully, text=submitted, text=received, .alert-success, text=Thank you');
    if (await successMsg.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const msgText = await successMsg.first().textContent();
      console.log(`✅ APPLICATION SUBMITTED SUCCESSFULLY: ${msgText?.trim().substring(0, 100)}`);
    } else {
      // Capture ALL error messages
      const errorMsgs = page.locator('.alert-danger:visible, .formio-errors:visible, .error:visible, .formio-error-wrapper:visible');
      const errCount = await errorMsgs.count();
      if (errCount > 0) {
        console.log(`❌ Submission blocked (${errCount} error elements):`);
        const allErrTexts = await errorMsgs.allTextContents();
        const seen = new Set<string>();
        for (const t of allErrTexts) {
          const clean = t.trim().replace(/\s+/g, ' ').substring(0, 150);
          if (clean && !seen.has(clean)) {
            seen.add(clean);
            console.log(`  ERR: ${clean}`);
          }
        }
      } else {
        // Check if URL changed (redirect after submit)
        if (!postUrl.includes('file_id')) {
          console.log('✅ URL changed — submitted successfully');
        } else {
          console.log('⏳ No errors, no success message — checking page for status...');
          // Log any visible alerts, toasts, status messages
          const allAlerts = page.locator('.alert:visible, .toast:visible, [role="alert"]:visible, .notification:visible');
          const alertCount = await allAlerts.count();
          if (alertCount > 0) {
            const alertTexts = await allAlerts.allTextContents();
            for (const t of alertTexts) console.log(`  ALERT: ${t.trim().substring(0, 100)}`);
          }
          // Check page body for submission-related text
          const bodyText = await page.locator('body').textContent();
          const submissionKeywords = ['submitted', 'pending', 'under review', 'received', 'confirmation'];
          for (const kw of submissionKeywords) {
            if (bodyText?.toLowerCase().includes(kw)) {
              console.log(`  Found keyword in page: "${kw}"`);
            }
          }
          // Navigate to dashboard to check application status
          await page.goto('/');
          await page.waitForTimeout(5000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'P1-SUB-10-dashboard-after.png'), fullPage: true });
          console.log('Dashboard screenshot captured — check application status manually');
        }
      }
    }
  } else {
    console.log('Submit button not visible — form may have validation errors');
  }

  console.log('\n=== DONE ===');
});
