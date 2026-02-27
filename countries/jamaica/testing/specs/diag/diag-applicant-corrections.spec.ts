import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Diagnostic: Explore applicant corrections view after send-back
 *
 * After legalReview sent the application back with "Data is invalid",
 * check what the applicant sees and what they can do.
 *
 * State:
 * - legalReview: DONE (filedecline)
 * - New task: applicant (AP, filepending)
 * - Other evals: still pending
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '873484d6-b472-4151-9801-c27bcbf7f2a2';
const SCREENSHOT_DIR = '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback';

test('DIAG: Applicant corrections view + resubmit', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File: ${JSON.stringify(fileInfo)}`);
  if (fileInfo.error || !fileInfo.processId) { test.skip(); return; }
  const processId = fileInfo.processId;

  // Check tasks — should have "applicant" task
  const tasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nTasks (${tasks.length}):`);
  for (const t of tasks) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  const applicantTask = tasks.find(t => t.camundaName === 'applicant' && !t.endTime);
  if (!applicantTask) {
    console.log('No pending applicant task found');
    test.skip();
    return;
  }
  console.log(`\nApplicant task found: ${JSON.stringify(applicantTask)}`);

  // ══════════════════════════════════════════════════════
  // STEP 1: Check dashboard for correction indicators
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 1: Dashboard view ===');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/app-01-dashboard.png`, fullPage: true });

  // Look for any status changes or notifications
  const dashboardInfo = await page.evaluate(() => {
    const body = document.body.textContent?.toLowerCase() || '';
    const terms = ['send back', 'sent back', 'correction', 'complementary',
      'returned', 'pending correction', 'resubmit', 'additional information',
      'decline', 'data is invalid', 'incomplete'];
    const found = terms.filter(t => body.includes(t));

    // Look for file cards and their status
    const fileCards = Array.from(document.querySelectorAll('[class*="card"], [class*="file"], [class*="application"]'))
      .filter((c: any) => c.offsetParent !== null)
      .map((c: any) => c.textContent?.trim().substring(0, 200))
      .filter((t: any) => t && (t.includes('TEST-SEZ') || t.includes('Establish')));

    return { found, fileCards: fileCards.slice(0, 5) };
  });
  console.log(`Dashboard terms: ${JSON.stringify(dashboardInfo.found)}`);
  console.log(`File cards: ${JSON.stringify(dashboardInfo.fileCards)}`);

  // ══════════════════════════════════════════════════════
  // STEP 2: Navigate to applicant form view
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 2: Navigate to form ===');

  // Try direct URL to the service with file_id
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/app-02-form-view.png`, fullPage: true });

  // Check page title/status
  const pageInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      // Look for status badges
      badges: Array.from(document.querySelectorAll('.badge, [class*="status"], [class*="alert"]'))
        .filter((b: any) => b.offsetParent !== null)
        .map((b: any) => ({
          text: b.textContent?.trim().substring(0, 100),
          classes: b.className?.substring(0, 60),
        })),
      // Look for tabs
      tabs: Array.from(document.querySelectorAll('[role="tab"], .nav-link, .nav-item a'))
        .filter((t: any) => t.offsetParent !== null)
        .map((t: any) => t.textContent?.trim())
        .filter(Boolean),
    };
  });
  console.log(`Page info: ${JSON.stringify(pageInfo)}`);

  // ══════════════════════════════════════════════════════
  // STEP 3: Check form editability
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 3: Check editability ===');

  const editability = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    let editable = 0;
    let readonly = 0;
    let disabled = 0;
    let total = 0;
    const editableFields: string[] = [];

    for (const inp of inputs) {
      const el = inp as HTMLInputElement;
      if (el.offsetParent === null) continue;
      total++;
      if (el.disabled) {
        disabled++;
      } else if (el.readOnly) {
        readonly++;
      } else {
        editable++;
        if (editableFields.length < 20) {
          editableFields.push(`${el.tagName.toLowerCase()}[name="${el.name}"]`);
        }
      }
    }
    return { total, editable, readonly, disabled, editableFields };
  });
  console.log(`Editability: ${JSON.stringify(editability)}`);

  // ══════════════════════════════════════════════════════
  // STEP 4: Look for correction messages/alerts
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 4: Look for correction messages ===');

  const correctionInfo = await page.evaluate(() => {
    // Check for messages, alerts, notifications
    const selectors = [
      '.alert', '.notification', '[class*="message"]', '[class*="correction"]',
      '[class*="comment"]', '[class*="observation"]', '[class*="warning"]',
      '[class*="info-box"]', '[class*="note"]',
    ];
    const elements: any[] = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if ((el as any).offsetParent !== null) {
          elements.push({
            text: (el as any).textContent?.trim().substring(0, 200),
            classes: (el as any).className?.substring(0, 60),
          });
        }
      }
    }

    // Check the Formio form for submission state
    const formio = (window as any).Formio;
    let formState = 'unknown';
    if (formio?.forms) {
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (form?.submission) {
          formState = form.submission.state || 'no state';
        }
      }
    }

    return { elements: elements.slice(0, 10), formState };
  });
  console.log(`Correction messages: ${JSON.stringify(correctionInfo.elements)}`);
  console.log(`Form state: ${correctionInfo.formState}`);

  // ══════════════════════════════════════════════════════
  // STEP 5: Explore all tabs and buttons
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 5: Explore tabs ===');

  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="tab"], .nav-link, .nav-item a'))
      .filter((t: any) => t.offsetParent !== null)
      .map((t: any) => t.textContent?.trim())
      .filter(Boolean);
  });
  console.log(`Tabs: ${JSON.stringify(tabs)}`);

  // Check each tab
  for (const tabName of tabs) {
    const tab = page.locator(`.nav-link:has-text("${tabName}")`).first();
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(2000);

      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
          .map((b: any) => b.textContent?.trim().substring(0, 80))
          .filter((t: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(t));
      });
      console.log(`  Tab "${tabName}": buttons=${JSON.stringify(buttons)}`);
    }
  }

  // ══════════════════════════════════════════════════════
  // STEP 6: Try the "Validate send page" / submit flow
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 6: Check submit options ===');

  // Navigate to the last tab (usually "Submit" or similar)
  const lastTab = tabs[tabs.length - 1];
  if (lastTab) {
    const lt = page.locator(`.nav-link:has-text("${lastTab}")`).first();
    if (await lt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lt.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/app-03-last-tab.png`, fullPage: true });

      const submitButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null)
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 80),
            disabled: b.disabled,
            classes: b.className?.substring(0, 60),
          }))
          .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(b.text));
      });
      console.log(`Submit tab buttons: ${JSON.stringify(submitButtons)}`);
    }
  }

  // Look for "Validate send page" specifically
  const validateSendBtn = page.locator('button:has-text("Validate send page")').first();
  if (await validateSendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('\nFound "Validate send page" — clicking...');
    await validateSendBtn.click();
    await page.waitForTimeout(10000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/app-04-validate-send.png`, fullPage: true });

    // Check for submit button
    const submitBtns = ['Submit application', 'Resubmit', 'Submit corrections', 'Submit', 'Send'];
    for (const txt of submitBtns) {
      const btn = page.locator(`button:has-text("${txt}")`).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found: "${txt}"`);
      }
    }
  } else {
    console.log('No "Validate send page" button found');

    // Check for any submit-related buttons across the page
    const submitRelated = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter((b: any) => b.offsetParent !== null)
        .map((b: any) => b.textContent?.trim())
        .filter((t: any) => {
          const tl = t?.toLowerCase() || '';
          return tl.includes('submit') || tl.includes('resubmit') || tl.includes('send') ||
            tl.includes('validate') || tl.includes('correction');
        });
    });
    console.log(`Submit-related buttons: ${JSON.stringify(submitRelated)}`);
  }

  // ══════════════════════════════════════════════════════
  // STEP 7: Try making a small change and resubmitting
  // ══════════════════════════════════════════════════════
  console.log('\n=== STEP 7: Try corrections + resubmit ===');

  if (editability.editable > 0) {
    // Navigate to first tab to make a change
    if (tabs.length > 0) {
      const firstTab = page.locator(`.nav-link:has-text("${tabs[0]}")`).first();
      if (await firstTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstTab.click();
        await page.waitForTimeout(2000);
      }
    }

    // Try to modify a text field
    try {
      const firstInput = page.locator('input[type="text"]:visible:not([readonly]):not([disabled])').first();
      if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const currentVal = await firstInput.inputValue();
        console.log(`Current value: "${currentVal?.substring(0, 50)}"`);
        // Make a small edit
        await firstInput.clear();
        await firstInput.fill(currentVal + ' (CORRECTED)');
        console.log('Made a correction');
        await page.waitForTimeout(1000);
      }
    } catch (e: any) {
      console.log(`Could not modify field: ${e.message?.substring(0, 80)}`);
    }

    // Try saving
    await formHelpers.saveDraft(page).catch(() => console.log('Save draft failed'));
    await page.waitForTimeout(2000);

    // Navigate to last tab and try submit
    if (lastTab) {
      const lt = page.locator(`.nav-link:has-text("${lastTab}")`).first();
      if (await lt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lt.click();
        await page.waitForTimeout(2000);
      }
    }

    // Try "Validate send page" again
    const vsBtn = page.locator('button:has-text("Validate send page")').first();
    if (await vsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking "Validate send page"...');
      await vsBtn.click();
      await page.waitForTimeout(10000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/app-05-after-validate.png`, fullPage: true });

      // Check consents
      const consents = page.locator('input[type="checkbox"]:visible');
      const ccCount = await consents.count();
      console.log(`Checkboxes: ${ccCount}`);
      for (let i = 0; i < ccCount; i++) {
        await consents.nth(i).check({ force: true }).catch(() => {});
      }

      // Try submit
      const submitBtns = ['Submit application', 'Resubmit', 'Submit corrections', 'Submit'];
      for (const txt of submitBtns) {
        const btn = page.locator(`button:has-text("${txt}")`).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const disabled = await btn.isDisabled();
          console.log(`Submit button "${txt}" disabled=${disabled}`);
          if (!disabled) {
            console.log(`Clicking "${txt}"...`);
            await btn.click();
            await page.waitForTimeout(10000);
            await boHelpers.handleConfirmation(page);
            await page.waitForTimeout(5000);
            console.log('Submitted!');
            break;
          }
        }
      }
    }
  } else {
    console.log('No editable fields — form is read-only');
    console.log('This may mean the applicant view is different from expected');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/app-06-final.png`, fullPage: true });

  // Final task check
  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nFinal tasks (${finalTasks.length}):`);
  for (const t of finalTasks) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  const finalState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return 'error';
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`\nFinal file state: ${JSON.stringify(finalState)}`);

  console.log('\n=== APPLICANT CORRECTIONS DIAGNOSTIC COMPLETE ===');
});
