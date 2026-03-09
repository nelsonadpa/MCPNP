import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * MAIN Service — Screenshot Capture for Validation Manual
 *
 * NON-DESTRUCTIVE: navigates and takes screenshots only, no action buttons clicked.
 *
 * Service: MAIN - Establish a new zone (0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc)
 * File: TODO-needs-a-submitted-file
 * Process: TODO-needs-a-submitted-file
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/main-screenshot-capture.spec.ts --project=jamaica-frontoffice --headed
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const FILE_ID = '9b7143dc-4977-4d93-bccb-94c09e216d89';
const PROCESS_ID = '6baccd1e-18e5-11f1-899e-b6594fb67add';
const SS_DIR = path.resolve(__dirname, '../05-manuals/screenshots/main-ci');

const ROLES_TO_CAPTURE = [
  { camundaName: 'documentsCheck', label: 'Documents Check' },
  { camundaName: 'legalEvaluation', label: 'Legal Evaluation' },
  { camundaName: 'technicalEvaluation', label: 'Technical Evaluation' },
  { camundaName: 'businessEvaluation', label: 'Business Evaluation' },
  { camundaName: 'complianceEvaluation', label: 'Compliance Evaluation' },
  { camundaName: 'organizeNocAndInspection', label: 'Organize NOC' },
  { camundaName: 'tajApproval', label: 'TAJ Approval' },
  { camundaName: 'jcaApproval', label: 'JCA Approval' },
  { camundaName: 'mofpsApproval', label: 'MOFPS Approval' },
  { camundaName: 'legalApproval', label: 'Legal Approval' },
  { camundaName: 'technicalApproval', label: 'Technical Approval' },
  { camundaName: 'businessApproval', label: 'Business Approval' },
  { camundaName: 'complianceApproval', label: 'Compliance Approval' },
  { camundaName: 'arcAppRevCommittee', label: 'ARC - Application Reviewing Committee' },
];

test('Capture screenshots for validation manual', async ({ page }) => {
  test.setTimeout(300_000); // 5 min
  fs.mkdirSync(SS_DIR, { recursive: true });

  console.log('\n=============================================');
  console.log('  MAIN SERVICE — Screenshot Capture');
  console.log(`  Service: ${SERVICE_ID}`);
  console.log(`  File:    ${FILE_ID}`);
  console.log(`  Output:  ${SS_DIR}`);
  console.log('=============================================\n');

  // Initial navigation to establish session
  await page.goto('/');
  await page.waitForTimeout(3000);

  // Capture each back-office role's Processing tab
  for (let i = 0; i < ROLES_TO_CAPTURE.length; i++) {
    const role = ROLES_TO_CAPTURE[i];
    const nn = String(i + 1).padStart(2, '0');
    console.log(`  [${nn}] ${role.label}...`);

    await page.goto(`/part-b/${SERVICE_ID}/${role.camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`);
    await page.waitForTimeout(5000);

    // Click Processing tab if visible
    const procTab = page.locator('a:has-text("Processing")').first();
    if (await procTab.isVisible().catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: `${SS_DIR}/${nn}-${role.camundaName}.png`, fullPage: true });
    console.log(`    -> ${SS_DIR}/${nn}-${role.camundaName}.png`);
  }

  // Capture CI page (applicant view)
  console.log('  [15] Complementary Information (applicant)...');
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${SS_DIR}/15-complementary-information.png`, fullPage: true });
  console.log(`    -> ${SS_DIR}/15-complementary-information.png`);

  console.log('\n  Done. All screenshots saved.\n');
});
