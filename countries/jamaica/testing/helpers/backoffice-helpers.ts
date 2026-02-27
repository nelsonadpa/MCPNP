import { Page } from '@playwright/test';
import { enableFormValidation, saveEditGridRows, saveDraft } from './form-helpers';

/**
 * eRegistrations Back-Office helpers
 *
 * Reusable functions for processing applications in the back-office
 * (Part B). Handles role navigation, action buttons, document validation,
 * and special role patterns (NOC, agency approval).
 *
 * Extracted from p2-eval-process-all.spec.ts and p2-documents-check.spec.ts.
 */

export interface TaskInfo {
  id: string;
  camundaName: string;
  name: string;
  shortname: string;
  status: string;
  assignee: string;
  endTime: string | null;
}

export interface ProcessResult {
  completed: string[];
  skipped: string[];
  failed: string[];
}

// ── Process API ──

/** Fetch all tasks for a process from the backend API */
export async function getProcessTasks(page: Page, processId: string): Promise<TaskInfo[]> {
  return page.evaluate(async (pid) => {
    const resp = await fetch(`/backend/process/${pid}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.tasks || []).map((t: any) => ({
      id: t.id,
      camundaName: t.camundaName,
      name: t.name,
      shortname: t.shortname,
      status: t.status,
      assignee: t.assignee,
      endTime: t.endTime || null,
    }));
  }, processId);
}

/** Get pending (incomplete) tasks from a process */
export async function getPendingTasks(page: Page, processId: string): Promise<TaskInfo[]> {
  const tasks = await getProcessTasks(page, processId);
  return tasks.filter(t => !t.endTime);
}

/** Get process status (ended, processStatus, endDate) */
export async function getProcessStatus(page: Page, processId: string): Promise<{ ended: boolean; processStatus: string; endDate: string | null }> {
  return page.evaluate(async (pid) => {
    const resp = await fetch(`/backend/process/${pid}`);
    if (!resp.ok) return { ended: false, processStatus: 'unknown', endDate: null };
    const data = await resp.json();
    return {
      ended: data.ended || false,
      processStatus: data.processStatus || 'unknown',
      endDate: data.endDate || null,
    };
  }, processId);
}

// ── Role Navigation ──

/** Navigate directly to a role's processing view */
export async function navigateToRole(
  page: Page,
  serviceId: string,
  camundaName: string,
  processId: string,
  fileId: string,
): Promise<boolean> {
  const roleUrl = `/part-b/${serviceId}/${camundaName}/${processId}?file_id=${fileId}`;
  console.log(`  Navigating to: ${roleUrl}`);
  await page.goto(roleUrl);
  await page.waitForTimeout(5000);

  const actualUrl = page.url();
  if (!actualUrl.includes(processId)) {
    console.log(`  SKIP: Redirected away — role may not be accessible`);
    return false;
  }
  return true;
}

// ── Action Buttons ──

/**
 * Priority-ordered list of action button selectors.
 * More specific buttons come first to avoid false matches.
 */
const ACTION_BUTTON_SELECTORS = [
  'button:has-text("Send evaluation to approval")',
  'button:has-text("Send evaluation for approval")',
  'button:has-text("Send consultation documents")',
  'button:has-text("Send decision to SEZA")',
  'button:has-text("Send to approval")',
  'button:has-text("Approve and send to ARC")',
  'button:has-text("Approve and send")',
  'button:has-text("Approve no objection")',
  'button:has-text("Complete inspection")',
  'button:has-text("Send inspection")',
  'button:has-text("Send to ARC")',
  'button:has-text("Send to board")',
  'button:has-text("Approve documents check")',
  'button:has-text("Approve")',
  'button:has-text("Submit")',
  'button:has-text("Send")',
];

/** Find the primary action button on the current page */
export async function findActionButton(page: Page): Promise<{ locator: any; text: string } | null> {
  for (const selector of ACTION_BUTTON_SELECTORS) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible().catch(() => false)) {
      const text = (await btn.textContent())?.trim() || '';
      return { locator: btn, text };
    }
  }
  return null;
}

// ── Special Role Handlers ──

/**
 * Handle NOC (No Objection Certificate) consultation roles.
 * These require uploading files before sending.
 */
export async function handleNocUploads(page: Page, testFilePath: string): Promise<number> {
  const browseLinks = page.locator('a.browse:visible');
  const browseCount = await browseLinks.count();
  console.log(`  NOC: Found ${browseCount} browse links for uploads`);

  let uploaded = 0;
  for (let i = 0; i < browseCount; i++) {
    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLinks.nth(i).click(),
      ]);
      await fc.setFiles(testFilePath);
      await page.waitForTimeout(5000);
      uploaded++;
    } catch (e: any) {
      console.log(`    Upload ${i} failed: ${e.message?.substring(0, 50)}`);
    }
  }

  await saveDraft(page);
  return uploaded;
}

/**
 * Handle agency approval roles (JCA, MOFPS, TAJ).
 * These require selecting "No objection" radio before sending decision.
 */
export async function handleAgencyApproval(page: Page): Promise<boolean> {
  console.log('  Agency approval — selecting "No objection"...');

  // Try clicking the "No objection" radio label
  const noObjectionLabel = page.locator('label, span').filter({ hasText: /^No objection$/ }).first();
  if (await noObjectionLabel.isVisible().catch(() => false)) {
    await noObjectionLabel.click();
    await page.waitForTimeout(1000);
    console.log('  ✓ Selected "No objection" via label click');
  } else {
    // Fallback: set via Formio API
    console.log('  Label not found — trying Formio API...');
    const setResult = await page.evaluate(() => {
      const roleForm = (window as any).roleForm;
      if (!roleForm?.submission?.data) return 'No roleForm';

      const data = roleForm.submission.data;
      const decisionKeys = Object.keys(data).filter(k =>
        k.toLowerCase().includes('noobjection') ||
        k.toLowerCase().includes('decision')
      );

      const results: string[] = [];
      for (const key of decisionKeys) {
        data[key] = 'noObjection';
        results.push(`Set ${key} = noObjection`);
      }

      // Also try via Formio component setValue
      const formio = (window as any).Formio;
      if (formio?.forms) {
        for (const fk of Object.keys(formio.forms)) {
          const form = formio.forms[fk];
          if (!form?.root) continue;
          const walk = (comp: any) => {
            if (!comp) return;
            const cKey = comp.component?.key || comp.key;
            if (cKey && (
              cKey.toLowerCase().includes('noobjection') ||
              cKey.toLowerCase().includes('decision')
            )) {
              if (comp.setValue) {
                comp.setValue('noObjection');
                if (comp.triggerChange) comp.triggerChange();
                results.push(`Formio: Set ${cKey} via setValue`);
              }
            }
            if (comp.components) for (const c of comp.components) walk(c);
            if (comp.columns) for (const col of comp.columns) {
              if (col?.components) for (const c of col.components) walk(c);
            }
          };
          walk(form.root);
        }
      }

      return results.join(', ') || 'No decision keys found';
    });
    console.log(`  Formio result: ${setResult}`);
  }

  await saveDraft(page);
  return true;
}

// ── Document Validation ──

/**
 * Validate all documents via carousel onclick handlers.
 * Clicks "Yes" for each document validation radio and sets filestatus fields.
 * Returns count of documents validated.
 */
export async function validateAllDocuments(page: Page): Promise<{ executed: number; alreadyTrue: number; errors: number }> {
  return page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm) return { executed: 0, alreadyTrue: 0, errors: 0 };

    let executed = 0;
    let alreadyTrue = 0;
    let errors = 0;

    for (let i = 1; i <= 50; i++) {
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLElement;
      if (!radio) break;

      const onclick = radio.getAttribute('onclick');
      if (!onclick) continue;

      const match = onclick.match(/roleForm\.submission\.data\['([^']+)'\]=true/);
      const key = match?.[1];

      if (key && roleForm.submission.data[key] === true) {
        alreadyTrue++;
      } else {
        try {
          const fn = new Function(onclick);
          fn.call(radio);
          executed++;
        } catch {
          errors++;
        }
      }
    }

    // Also click all radios to update visual state
    for (let i = 1; i <= 50; i++) {
      const radio = document.getElementById(`isdocvalid${i}-yes`) as HTMLInputElement;
      if (!radio) break;
      radio.checked = true;
    }

    return { executed, alreadyTrue, errors };
  });
}

// ── Confirmation Dialog ──

/** Handle confirmation dialogs (OK/Confirm/Yes buttons) */
export async function handleConfirmation(page: Page): Promise<boolean> {
  const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
  try {
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('  Confirmation dialog — clicking...');
      await confirmBtn.click();
      await page.waitForTimeout(5000);
      return true;
    }
  } catch { }
  return false;
}

// ── Toast / Error Detection ──

/** Check for validation error toasts. Returns array of toast messages. */
export async function getToastMessages(page: Page): Promise<string[]> {
  const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible');
  const count = await toasts.count();
  const messages: string[] = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const text = (await toasts.nth(i).textContent())?.trim();
    if (text) messages.push(text.substring(0, 100));
  }
  return messages;
}

/** Check if any toast indicates a validation error */
export async function hasValidationError(page: Page): Promise<boolean> {
  const messages = await getToastMessages(page);
  return messages.some(m =>
    m.toLowerCase().includes('required') || m.toLowerCase().includes('upload')
  );
}

// ── Composite: Process a Single Role ──

/**
 * Process a single back-office role (click action button with all necessary pre-steps).
 * Handles NOC uploads, agency approvals, disabled buttons, EditGrid saves, and confirmations.
 */
export async function processRole(
  page: Page,
  opts: {
    serviceId: string;
    camundaName: string;
    processId: string;
    fileId: string;
    testFilePath?: string;
    screenshotDir?: string;
  }
): Promise<'completed' | 'skipped' | 'failed'> {
  const { serviceId, camundaName, processId, fileId, testFilePath, screenshotDir } = opts;

  // Navigate to role
  const loaded = await navigateToRole(page, serviceId, camundaName, processId, fileId);
  if (!loaded) return 'skipped';

  if (screenshotDir) {
    await page.screenshot({ path: `${screenshotDir}/proc-${camundaName}.png`, fullPage: true });
  }

  // Find action button
  const actionBtn = await findActionButton(page);
  if (!actionBtn) {
    console.log(`  No action button found — skipping`);
    return 'skipped';
  }

  console.log(`  Action button: "${actionBtn.text}", disabled: ${await actionBtn.locator.isDisabled()}`);

  // Handle NOC roles (need file uploads)
  if (actionBtn.text.includes('consultation') && testFilePath) {
    await handleNocUploads(page, testFilePath);
  }

  // Handle agency approval roles (need "No objection" selection)
  if (actionBtn.text.includes('decision to SEZA')) {
    await handleAgencyApproval(page);
  }

  // Handle disabled button
  if (await actionBtn.locator.isDisabled()) {
    console.log('  Button disabled — trying FORMDATAVALIDATIONSTATUS...');
    await enableFormValidation(page);
    await saveDraft(page);
  }

  // Save unsaved EditGrid rows
  const savedRows = await saveEditGridRows(page);
  if (savedRows > 0) {
    console.log(`  Saved ${savedRows} EditGrid rows`);
    await page.waitForTimeout(1000);
  }

  // Click the action button
  console.log(`  Clicking "${actionBtn.text}"...`);
  const beforeUrl = page.url();

  try {
    await actionBtn.locator.click({ timeout: 10_000 });
  } catch {
    try {
      await actionBtn.locator.click({ force: true, timeout: 10_000 });
    } catch {
      return 'failed';
    }
  }

  await page.waitForTimeout(10_000);

  // Handle confirmation dialog
  await handleConfirmation(page);

  // Check for validation errors
  if (await hasValidationError(page)) {
    console.log(`  ✗ Validation error`);
    return 'failed';
  }

  if (screenshotDir) {
    await page.screenshot({ path: `${screenshotDir}/proc-${camundaName}-after.png`, fullPage: true });
  }

  console.log(`  ✓ ${camundaName} completed!`);
  return 'completed';
}
