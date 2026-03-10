import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import {
  getProcessTasks,
  getPendingTasks,
  navigateToRole,
  findActionButton,
  handleNocUploads,
  handleAgencyApproval,
  validateAllDocuments,
  handleConfirmation,
  processRole,
} from '../helpers/backoffice-helpers';
import { enableFormValidation, saveEditGridRows, saveDraft } from '../helpers/form-helpers';

/**
 * UX Full Test — Establish a new zone (March)
 *
 * Complete E2E test: front-office form capture + back-office processing.
 * Takes one screenshot per role/step for UX/UI evaluation.
 *
 * Run:
 *   cd countries/jamaica/testing
 *   npx playwright test specs/ux-full-test.spec.ts --project=jamaica-bpa --headed
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const FILE_ID = '9b7143dc-4977-4d93-bccb-94c09e216d89';
const PROCESS_ID = '6baccd1e-18e5-11f1-899e-b6594fb67add';
const SS_DIR = path.resolve(__dirname, '../screenshots/ux-full-test');
const DOCS_DIR = path.resolve(__dirname, '../test-data/documents');
const TEST_PDF = path.resolve(DOCS_DIR, 'land-title.pdf');
const REPORT_FILE = path.resolve(SS_DIR, 'test-report.md');

// Back-office roles in expected processing order
const BACKOFFICE_ROLES = [
  { camundaName: 'documentsCheck', label: 'Documents Check', actor: 'SEZA Officer', action: 'Reviews submitted documents for completeness' },
  { camundaName: 'complementaryInformation', label: 'Complementary Information', actor: 'SEZA Officer', action: 'Requests additional info from applicant if needed' },
  { camundaName: 'complianceEvaluation', label: 'Compliance Evaluation', actor: 'Compliance Officer', action: 'Evaluates regulatory compliance' },
  { camundaName: 'businessEvaluation', label: 'Business Evaluation', actor: 'Business Analyst', action: 'Evaluates business viability and economic impact' },
  { camundaName: 'legalEvaluation', label: 'Legal Evaluation', actor: 'Legal Officer', action: 'Evaluates legal aspects of the application' },
  { camundaName: 'technicalEvaluation', label: 'Technical Evaluation', actor: 'Technical Officer', action: 'Evaluates technical/infrastructure aspects' },
  { camundaName: 'organizeNocAndInspection', label: 'Organize NOC & Inspection', actor: 'SEZA Coordinator', action: 'Sends consultation documents to external agencies' },
  { camundaName: 'tajDueDiligence', label: 'TAJ Due Diligence', actor: 'TAJ Officer', action: 'Tax Administration Jamaica reviews tax compliance' },
  { camundaName: 'jcaDueDiligence', label: 'JCA Due Diligence', actor: 'JCA Officer', action: 'Jamaica Customs Agency reviews customs aspects' },
  { camundaName: 'mofpsDueDiligence', label: 'MOFPS Due Diligence', actor: 'MOFPS Officer', action: 'Ministry of Finance reviews financial aspects' },
  { camundaName: 'tajApproval', label: 'TAJ Approval', actor: 'TAJ Approver', action: 'Issues No Objection or Objection decision' },
  { camundaName: 'jcaApproval', label: 'JCA Approval', actor: 'JCA Approver', action: 'Issues No Objection or Objection decision' },
  { camundaName: 'mofpsApproval', label: 'MOFPS Approval', actor: 'MOFPS Approver', action: 'Issues No Objection or Objection decision' },
  { camundaName: 'technicalApproval', label: 'Technical Approval', actor: 'Technical Approver', action: 'Approves technical evaluation' },
  { camundaName: 'complianceApproval', label: 'Compliance Approval', actor: 'Compliance Approver', action: 'Approves compliance evaluation' },
  { camundaName: 'businessApproval', label: 'Business Approval', actor: 'Business Approver', action: 'Approves business evaluation' },
  { camundaName: 'legalApproval', label: 'Legal Approval', actor: 'Legal Approver', action: 'Approves legal evaluation' },
  { camundaName: 'arcAppRevCommittee', label: 'ARC - Application Review Committee', actor: 'ARC Committee', action: 'Reviews all evaluations and makes recommendation' },
  { camundaName: 'statusLetter', label: 'Status Letter', actor: 'SEZA Officer', action: 'Prepares status letter for applicant' },
  { camundaName: 'ceoValidation', label: 'CEO Validation', actor: 'CEO', action: 'Validates recommendation before Board' },
  { camundaName: 'boardSubmission', label: 'Board Submission', actor: 'Board Secretary', action: 'Submits case to Board of Directors' },
  { camundaName: 'board', label: 'Board', actor: 'Board of Directors', action: 'Makes final approval/denial decision' },
  { camundaName: 'preApprovalLetter', label: 'Pre-Approval Letter', actor: 'SEZA Officer', action: 'Generates pre-approval letter' },
  { camundaName: 'sezDocuments', label: 'SEZ Documents', actor: 'SEZA Officer', action: 'Prepares SEZ documentation' },
  { camundaName: 'technicalInspection', label: 'Technical Inspection', actor: 'Technical Inspector', action: 'Conducts on-site technical inspection' },
  { camundaName: 'inspectionInvite', label: 'Inspection Invite', actor: 'SEZA Coordinator', action: 'Invites parties for inspection' },
  { camundaName: 'draftLicenseAgreement', label: 'Draft License Agreement', actor: 'Legal Officer', action: 'Drafts the license agreement' },
  { camundaName: 'micInstructionsToPreparMinisterialOrder', label: 'MIC Instructions', actor: 'MIC Officer', action: 'Instructs ministerial order preparation' },
  { camundaName: 'draftMinisterialOrder', label: 'Draft Ministerial Order', actor: 'Legal Officer', action: 'Drafts the ministerial order' },
  { camundaName: 'ministerialOrderLegalReview', label: 'Ministerial Order Legal Review', actor: 'Legal Reviewer', action: 'Reviews ministerial order for legal accuracy' },
  { camundaName: 'ministerialOrderApproval', label: 'Ministerial Order Approval', actor: 'Minister', action: 'Approves ministerial order' },
  { camundaName: 'gazette', label: 'Gazette', actor: 'Gazette Officer', action: 'Publishes in official gazette' },
  { camundaName: 'technicalPreparesBillingInformation', label: 'Technical Billing', actor: 'Technical Officer', action: 'Prepares billing information' },
  { camundaName: 'approvalOfBillingInformation', label: 'Billing Approval', actor: 'Finance Officer', action: 'Approves billing information' },
  { camundaName: 'prepareInvoice', label: 'Prepare Invoice', actor: 'Finance Officer', action: 'Prepares invoice for applicant' },
  { camundaName: 'approvesInvoices', label: 'Approve Invoices', actor: 'Finance Approver', action: 'Approves invoices' },
  { camundaName: 'agreementReviewAndPayment', label: 'Agreement Review & Payment', actor: 'Applicant', action: 'Reviews agreement and makes payment' },
  { camundaName: 'legalReviewOfPaymentAndLicenceAgreement', label: 'Legal Review Payment', actor: 'Legal Officer', action: 'Reviews payment and license agreement' },
  { camundaName: 'issueLicenseAgreement', label: 'Issue License Agreement', actor: 'Legal Officer', action: 'Issues final license agreement' },
  { camundaName: 'prepareOperatingCertificate', label: 'Prepare Operating Certificate', actor: 'SEZA Officer', action: 'Prepares the operating certificate' },
  { camundaName: 'operatingCertificate', label: 'Operating Certificate', actor: 'CEO/Director', action: 'Issues final operating certificate' },
  { camundaName: 'denialLetter', label: 'Denial Letter', actor: 'SEZA Officer', action: 'Generates denial letter (if denied)' },
];

// Front-office tab names (from form analysis)
const FORM_TABS = [
  'Project overview',
  'Zone identity',
  'Developer',
  'Master plan',
  'Business plan',
  'Compliance',
  'Documents',
  'Undertaking',
  'Summary',
];

interface ReportEntry {
  step: number;
  role: string;
  actor: string;
  action: string;
  screenshot: string;
  status: 'captured' | 'skipped' | 'processed' | 'error';
  notes: string;
}

test('UX Full Test — E2E with screenshots', async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(SS_DIR, { recursive: true });

  const report: ReportEntry[] = [];
  let stepNum = 0;

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   UX FULL TEST — Establish a new zone (March)    ║');
  console.log('║   Service: ' + SERVICE_ID.substring(0, 36) + '  ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // ── Phase 0: Auth check ──
  await page.goto('/');
  await page.waitForTimeout(3000);
  console.log('  Auth: Navigated to homepage');

  const fileId = FILE_ID;
  const processId = PROCESS_ID;

  // ── Phase 1: Verify process is active ──
  console.log('\n── Phase 1: Verify process ──');
  const processInfo = await page.evaluate(async (pid: string) => {
    const r = await fetch(`/backend/process/${pid}`);
    if (!r.ok) return { error: r.status };
    const d = await r.json();
    const tasks = d.tasks || [];
    const pending = tasks.filter((t: any) => !t.endTime);
    return {
      ended: d.ended,
      status: d.processStatus,
      total: tasks.length,
      pending: pending.length,
      pendingRoles: pending.map((t: any) => t.camundaName),
    };
  }, processId);
  console.log(`  Process: ${processId}`);
  console.log(`  Status: ${processInfo.status} | Tasks: ${processInfo.total} | Pending: ${processInfo.pending}`);
  console.log(`  Pending roles: ${processInfo.pendingRoles?.join(', ')}`);

  // ── Phase 2: Front Office — Applicant Form ──
  console.log('── Phase 2: Front Office — Applicant Form ──');

  await page.goto(`/services/${SERVICE_ID}?file_id=${fileId}`);
  await page.waitForTimeout(8000);

  // Capture the main form view
  stepNum++;
  const ssApplicant = `${SS_DIR}/${String(stepNum).padStart(2, '0')}-applicant-form.png`;
  await page.screenshot({ path: ssApplicant, fullPage: true });
  report.push({
    step: stepNum,
    role: 'Applicant',
    actor: 'Applicant (Company Representative)',
    action: 'Fills and submits the application form for establishing a new Special Economic Zone',
    screenshot: path.basename(ssApplicant),
    status: 'captured',
    notes: 'Main form view with all tabs visible',
  });
  console.log(`  [${String(stepNum).padStart(2, '0')}] Applicant form captured`);

  // Try to capture each tab
  for (const tabName of FORM_TABS) {
    const tabLink = page.locator(`a:has-text("${tabName}"), li:has-text("${tabName}")`).first();
    if (await tabLink.isVisible().catch(() => false)) {
      try {
        await tabLink.click();
        await page.waitForTimeout(2000);
        stepNum++;
        const ssTab = `${SS_DIR}/${String(stepNum).padStart(2, '0')}-applicant-tab-${tabName.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: ssTab, fullPage: true });
        report.push({
          step: stepNum,
          role: 'Applicant',
          actor: 'Applicant (Company Representative)',
          action: `Fills the "${tabName}" section of the application`,
          screenshot: path.basename(ssTab),
          status: 'captured',
          notes: `Tab: ${tabName}`,
        });
        console.log(`  [${String(stepNum).padStart(2, '0')}] Tab "${tabName}" captured`);
      } catch (e: any) {
        console.log(`  Tab "${tabName}" — error: ${e.message?.substring(0, 50)}`);
      }
    } else {
      console.log(`  Tab "${tabName}" — not visible, skipping`);
    }
  }

  // ── Phase 3: Back Office — Process roles ──
  console.log('\n── Phase 3: Back Office — Role Processing ──');

  // Get current pending tasks
  const allTasks = await getProcessTasks(page, processId);
  const pendingTasks = allTasks.filter(t => !t.endTime);
  const completedTasks = allTasks.filter(t => t.endTime);

  console.log(`  Total tasks: ${allTasks.length}`);
  console.log(`  Pending: ${pendingTasks.length}`);
  console.log(`  Completed: ${completedTasks.length}`);
  console.log('  Pending roles:', pendingTasks.map(t => t.camundaName).join(', '));

  // Navigate to each role (pending first, then completed for screenshots)
  for (const role of BACKOFFICE_ROLES) {
    const task = allTasks.find(t => t.camundaName === role.camundaName);
    if (!task) continue; // Role not in process

    stepNum++;
    const nn = String(stepNum).padStart(2, '0');
    const isPending = !task.endTime;

    console.log(`\n  [${nn}] ${role.label} (${isPending ? 'PENDING' : 'completed'})`);
    console.log(`       Actor: ${role.actor}`);
    console.log(`       Action: ${role.action}`);

    // Navigate to role
    const roleUrl = `/part-b/${SERVICE_ID}/${role.camundaName}/${processId}?file_id=${fileId}`;
    await page.goto(roleUrl);
    await page.waitForTimeout(5000);

    // Check if we landed on the role
    const currentUrl = page.url();
    if (!currentUrl.includes(processId)) {
      console.log(`       SKIP: Redirected away`);
      report.push({
        step: stepNum,
        role: role.label,
        actor: role.actor,
        action: role.action,
        screenshot: '',
        status: 'skipped',
        notes: 'Role not accessible (redirected)',
      });
      continue;
    }

    // Click Processing tab if visible
    const procTab = page.locator('a:has-text("Processing")').first();
    if (await procTab.isVisible().catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot
    const ssRole = `${SS_DIR}/${nn}-${role.camundaName}.png`;
    await page.screenshot({ path: ssRole, fullPage: true });
    console.log(`       Screenshot: ${path.basename(ssRole)}`);

    // If pending, try to process it
    if (isPending) {
      const actionBtn = await findActionButton(page);
      if (actionBtn) {
        console.log(`       Action button: "${actionBtn.text}"`);

        // Handle special roles
        if (role.camundaName === 'documentsCheck' || role.camundaName === 'documentsCheckTypeRevision') {
          // Validate documents
          const docResult = await validateAllDocuments(page);
          console.log(`       Documents validated: ${docResult.executed} new, ${docResult.alreadyTrue} already done`);
          await saveDraft(page);
        }

        if (role.camundaName.includes('Noc') || role.camundaName.includes('organize')) {
          // Upload NOC files
          if (fs.existsSync(TEST_PDF)) {
            await handleNocUploads(page, TEST_PDF);
          }
        }

        if (['tajApproval', 'jcaApproval', 'mofpsApproval'].includes(role.camundaName)) {
          await handleAgencyApproval(page);
        }

        // Handle disabled button
        if (await actionBtn.locator.isDisabled()) {
          await enableFormValidation(page);
          await saveDraft(page);
          await page.waitForTimeout(2000);
        }

        // Save unsaved EditGrid rows
        await saveEditGridRows(page);

        // Click action
        console.log(`       Processing: clicking "${actionBtn.text}"...`);
        try {
          await actionBtn.locator.click({ timeout: 10_000 });
          await page.waitForTimeout(8000);
          await handleConfirmation(page);
          await page.waitForTimeout(5000);

          // After screenshot
          const ssAfter = `${SS_DIR}/${nn}-${role.camundaName}-after.png`;
          await page.screenshot({ path: ssAfter, fullPage: true });
          console.log(`       Processed successfully`);
          report.push({
            step: stepNum,
            role: role.label,
            actor: role.actor,
            action: role.action,
            screenshot: path.basename(ssRole),
            status: 'processed',
            notes: `Action: "${actionBtn.text}" clicked`,
          });
        } catch (e: any) {
          console.log(`       FAILED: ${e.message?.substring(0, 80)}`);
          report.push({
            step: stepNum,
            role: role.label,
            actor: role.actor,
            action: role.action,
            screenshot: path.basename(ssRole),
            status: 'error',
            notes: `Error: ${e.message?.substring(0, 100)}`,
          });
        }
      } else {
        console.log(`       No action button found`);
        report.push({
          step: stepNum,
          role: role.label,
          actor: role.actor,
          action: role.action,
          screenshot: path.basename(ssRole),
          status: 'captured',
          notes: 'No action button (may need prerequisites)',
        });
      }
    } else {
      report.push({
        step: stepNum,
        role: role.label,
        actor: role.actor,
        action: role.action,
        screenshot: path.basename(ssRole),
        status: 'captured',
        notes: 'Already completed — screenshot only',
      });
    }
  }

  // ── Phase 4: Generate Report ──
  console.log('\n── Phase 4: Generate Report ──');

  let md = `# UX Full Test Report — Establish a New Zone (March)\n\n`;
  md += `**Service:** ${SERVICE_ID}\n`;
  md += `**File:** ${fileId}\n`;
  md += `**Process:** ${processId}\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Total Steps Captured:** ${report.length}\n\n`;
  md += `## Test Execution Summary\n\n`;
  md += `| # | Role | Actor | Action | Screenshot | Status |\n`;
  md += `|---|------|-------|--------|------------|--------|\n`;

  for (const entry of report) {
    md += `| ${entry.step} | ${entry.role} | ${entry.actor} | ${entry.action} | ${entry.screenshot || '-'} | ${entry.status} |\n`;
  }

  md += `\n## Notes\n\n`;
  for (const entry of report) {
    if (entry.notes) {
      md += `- **Step ${entry.step} (${entry.role}):** ${entry.notes}\n`;
    }
  }

  fs.writeFileSync(REPORT_FILE, md);
  console.log(`\n  Report saved to: ${REPORT_FILE}`);
  console.log(`  Screenshots dir: ${SS_DIR}`);
  console.log(`  Total steps: ${report.length}`);
  console.log(`  Processed: ${report.filter(r => r.status === 'processed').length}`);
  console.log(`  Captured: ${report.filter(r => r.status === 'captured').length}`);
  console.log(`  Skipped: ${report.filter(r => r.status === 'skipped').length}`);
  console.log(`  Errors: ${report.filter(r => r.status === 'error').length}`);
  console.log('\n  Done.\n');
});
