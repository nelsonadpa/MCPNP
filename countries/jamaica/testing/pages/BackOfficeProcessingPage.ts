import { Page } from '@playwright/test';
import {
  getProcessTasks, getPendingTasks, getProcessStatus,
  navigateToRole, processRole, validateAllDocuments,
  handleConfirmation, findActionButton,
  TaskInfo, ProcessResult,
} from '../helpers/backoffice-helpers';
import { enableFormValidation, saveDraft } from '../helpers/form-helpers';

/**
 * Page Object for the eRegistrations back-office processing view (Part B).
 *
 * Encapsulates the officer-side workflow:
 * Part B List → Select Application → Process Role → Approve/Reject
 *
 * Parameterized by service ID and process ID — reusable across services.
 */
export class BackOfficeProcessingPage {
  constructor(
    private page: Page,
    private serviceId: string,
    private processId: string,
    private fileId: string,
  ) {}

  // ── Navigation ──

  /** Navigate to Part B dashboard */
  async goToPartB(): Promise<void> {
    await this.page.goto('/part-b');
    await this.page.waitForTimeout(5000);
  }

  /** Navigate directly to a specific role's processing view */
  async goToRole(camundaName: string): Promise<boolean> {
    return navigateToRole(this.page, this.serviceId, camundaName, this.processId, this.fileId);
  }

  // ── Process API ──

  /** Get all tasks for this process */
  async getAllTasks(): Promise<TaskInfo[]> {
    return getProcessTasks(this.page, this.processId);
  }

  /** Get pending (incomplete) tasks */
  async getPendingTasks(): Promise<TaskInfo[]> {
    return getPendingTasks(this.page, this.processId);
  }

  /** Get process status */
  async getStatus(): Promise<{ ended: boolean; processStatus: string; endDate: string | null }> {
    return getProcessStatus(this.page, this.processId);
  }

  /** Log all tasks with their status */
  async logTaskStatus(): Promise<void> {
    const tasks = await this.getAllTasks();
    console.log(`\n  Total tasks: ${tasks.length}`);
    for (const t of tasks) {
      const done = t.endTime ? '✓' : '○';
      console.log(`  ${done} ${t.camundaName} (${t.shortname}) — ${t.status} [${t.assignee}]`);
    }
    const pending = tasks.filter(t => !t.endTime);
    console.log(`  Pending: ${pending.length}`);
  }

  // ── Document Check ──

  /** Navigate to Documents tab and validate all documents */
  async validateDocuments(): Promise<{ executed: number; alreadyTrue: number; errors: number }> {
    // Ensure Documents tab is active
    await this.page.locator('a:has-text("Documents")').first().click();
    await this.page.waitForTimeout(2000);

    // Open first document to enter carousel
    await this.page.locator('button.btn-link:visible').first().click();
    await this.page.waitForTimeout(3000);

    const result = await validateAllDocuments(this.page);

    // Set FORMDATAVALIDATIONSTATUS to enable approve button
    await enableFormValidation(this.page);
    await saveDraft(this.page);

    return result;
  }

  // ── Single Role Processing ──

  /** Process a single role with all necessary pre-steps */
  async processSingleRole(
    camundaName: string,
    opts?: { testFilePath?: string; screenshotDir?: string },
  ): Promise<'completed' | 'skipped' | 'failed'> {
    return processRole(this.page, {
      serviceId: this.serviceId,
      camundaName,
      processId: this.processId,
      fileId: this.fileId,
      testFilePath: opts?.testFilePath,
      screenshotDir: opts?.screenshotDir,
    });
  }

  // ── Batch Processing ──

  /** Process all pending roles (happy path approval) */
  async processAllPendingRoles(opts?: {
    testFilePath?: string;
    screenshotDir?: string;
    skipRoles?: string[];
  }): Promise<ProcessResult> {
    // Must be on the site first for API calls
    await this.goToPartB();

    const pending = await this.getPendingTasks();
    console.log(`\n  Processing ${pending.length} pending roles...`);

    const result: ProcessResult = { completed: [], skipped: [], failed: [] };
    const skipSet = new Set(opts?.skipRoles || []);

    for (const task of pending) {
      if (skipSet.has(task.camundaName)) {
        console.log(`  SKIP (excluded): ${task.camundaName}`);
        result.skipped.push(task.camundaName);
        continue;
      }

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`  Processing: ${task.camundaName} (${task.shortname})`);
      console.log(`${'─'.repeat(60)}`);

      const status = await this.processSingleRole(task.camundaName, {
        testFilePath: opts?.testFilePath,
        screenshotDir: opts?.screenshotDir,
      });

      result[status === 'completed' ? 'completed' :
             status === 'skipped' ? 'skipped' : 'failed'].push(task.camundaName);
    }

    // Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  SUMMARY`);
    console.log(`  Completed: ${result.completed.length} — ${result.completed.join(', ')}`);
    console.log(`  Skipped: ${result.skipped.length} — ${result.skipped.join(', ')}`);
    console.log(`  Failed: ${result.failed.length} — ${result.failed.join(', ')}`);
    console.log(`${'═'.repeat(60)}`);

    return result;
  }

  // ── Corrections Flow ──

  /** Find and click "Send back to applicant" / "Request corrections" button */
  async requestCorrections(reason?: string): Promise<boolean> {
    // Look for corrections/send-back buttons
    const corrBtn = this.page.locator(
      'button:has-text("Send back to applicant"), ' +
      'button:has-text("Request corrections"), ' +
      'button:has-text("Send back")'
    ).first();

    if (await corrBtn.isVisible().catch(() => false)) {
      // Fill reason if a textarea is visible
      if (reason) {
        const textarea = this.page.locator('textarea:visible').first();
        if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await textarea.fill(reason);
        }
      }

      await corrBtn.click();
      await this.page.waitForTimeout(5000);
      await handleConfirmation(this.page);
      return true;
    }
    return false;
  }

  // ── Rejection Flow ──

  /** Find and click rejection button */
  async rejectApplication(reason?: string): Promise<boolean> {
    const rejectBtn = this.page.locator(
      'button:has-text("Reject"), ' +
      'button:has-text("Deny"), ' +
      'button:has-text("Refuse")'
    ).first();

    if (await rejectBtn.isVisible().catch(() => false)) {
      if (reason) {
        const textarea = this.page.locator('textarea:visible').first();
        if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await textarea.fill(reason);
        }
      }

      await rejectBtn.click();
      await this.page.waitForTimeout(5000);
      await handleConfirmation(this.page);
      return true;
    }
    return false;
  }
}
