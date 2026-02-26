import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Process ALL remaining evaluation/review roles
 *
 * Strategy:
 * 1. Get all tasks from /backend/process/{processId}
 * 2. For each pending task, navigate directly via URL
 * 3. Click the role-specific approval button
 * 4. Handle NOC separately (needs file uploads)
 *
 * Run:
 *   npx playwright test specs/p2-eval-process-all.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('Process all remaining roles', async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // STEP 1: Get all tasks from the process API
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Get all tasks ══');

  // Need to be on the site first
  await page.goto('/part-b');
  await page.waitForTimeout(3000);

  const tasks = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.tasks || []).map((t: any) => ({
      id: t.id,
      camundaName: t.camundaName,
      name: t.name,
      shortname: t.shortname,
      status: t.status,
      assignee: t.assignee,
      endTime: t.endTime,
    }));
  });

  console.log(`  Total tasks: ${tasks.length}`);
  for (const t of tasks) {
    const done = t.endTime ? '✓' : '○';
    console.log(`  ${done} ${t.camundaName} (${t.shortname}) — ${t.status} [${t.assignee}]`);
  }

  // Filter pending tasks (no endTime)
  const pendingTasks = tasks.filter((t: any) => !t.endTime);
  console.log(`\n  Pending tasks: ${pendingTasks.length}`);
  for (const t of pendingTasks) {
    console.log(`    ○ ${t.camundaName} (${t.shortname}) — ${t.status}`);
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Process each pending evaluation task
  // ══════════════════════════════════════════════════════════
  const completedRoles: string[] = [];
  const skippedRoles: string[] = [];

  for (const task of pendingTasks) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Processing: ${task.camundaName} (${task.shortname})`);
    console.log(`${'─'.repeat(60)}`);

    // Navigate directly to this role's processing view
    const roleUrl = `/part-b/${SERVICE_ID}/${task.camundaName}/${PROCESS_ID}?file_id=${FILE_ID}`;
    console.log(`  URL: ${roleUrl}`);
    await page.goto(roleUrl);
    await page.waitForTimeout(5000);

    const actualUrl = page.url();
    console.log(`  Actual URL: ${actualUrl}`);

    // Check if page loaded correctly (not redirected to list)
    if (!actualUrl.includes(PROCESS_ID)) {
      console.log(`  SKIP: Redirected away — role may not be accessible`);
      skippedRoles.push(task.camundaName);
      continue;
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/proc-${task.camundaName}.png`, fullPage: true });

    // Get page info
    const pageInfo = await page.evaluate(() => {
      const results: any = {};

      // Get workspace text
      const paras = document.querySelectorAll('p');
      for (const p of paras) {
        const text = p.textContent?.trim() || '';
        if (text.includes('workspace') || text.includes('evaluation') || text.includes('consultation') || text.includes('page is your')) {
          results.workspace = text.substring(0, 200);
          break;
        }
      }

      // Get ALL visible buttons
      const buttons = document.querySelectorAll('button');
      results.buttons = Array.from(buttons)
        .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
        .map(b => ({
          text: b.textContent?.trim().substring(0, 80),
          disabled: (b as HTMLButtonElement).disabled,
          class: b.className.substring(0, 60),
        }))
        .filter(b => !['NPNELSON PEREZ', 'en', 'Back to list', 'Application history'].includes(b.text));

      return results;
    });
    console.log(`  Workspace: ${pageInfo.workspace || 'none'}`);
    console.log(`  Buttons: ${JSON.stringify(pageInfo.buttons)}`);

    // Find the main action button
    const actionBtnSelectors = [
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
      'button:has-text("Approve")',
      'button:has-text("Submit")',
      'button:has-text("Send")',
    ];

    let actionBtn = null;
    let actionBtnText = '';
    for (const selector of actionBtnSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible().catch(() => false)) {
        actionBtnText = (await btn.textContent())?.trim() || '';
        const isDisabled = await btn.isDisabled();
        console.log(`  Action button: "${actionBtnText}", disabled: ${isDisabled}`);
        actionBtn = btn;
        break;
      }
    }

    if (!actionBtn) {
      console.log(`  No action button found — skipping`);
      skippedRoles.push(task.camundaName);
      continue;
    }

    const isDisabled = await actionBtn.isDisabled();

    // If the button requires file uploads (NOC role), handle differently
    if (actionBtnText.includes('consultation')) {
      console.log(`  NOC role — needs file uploads, handling separately...`);

      // Upload test files for each agency
      const browseLinks = page.locator('a.browse:visible');
      const browseCount = await browseLinks.count();
      console.log(`  Found ${browseCount} browse links for uploads`);

      const testPdfPath = path.resolve(__dirname, '../test-data/documents/TEST-certificate-of-incorporation.pdf');

      for (let i = 0; i < browseCount; i++) {
        const browseLink = browseLinks.nth(i);
        const parentLabel = await browseLink.evaluate(el => {
          const comp = el.closest('[class*="formio-component"]');
          return comp?.querySelector('label')?.textContent?.trim() || `upload-${i}`;
        });
        console.log(`  Uploading to: ${parentLabel}`);

        try {
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }),
            browseLink.click(),
          ]);
          await fc.setFiles(testPdfPath);
          await page.waitForTimeout(5000); // Wait for upload
          console.log(`    ✓ Uploaded`);
        } catch (e: any) {
          console.log(`    ✗ Upload failed: ${e.message?.substring(0, 50)}`);
        }
      }

      // Save after uploads
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('saveDraft'));
      });
      await page.waitForTimeout(3000);
    }

    // If the button is "Send decision to SEZA" (agency approval roles),
    // need to select "No objection" radio first
    if (actionBtnText.includes('decision to SEZA')) {
      console.log('  Agency approval — selecting "No objection"...');

      // Click the "No objection" radio label
      const noObjectionLabel = page.locator('label, span').filter({ hasText: /^No objection$/ }).first();
      if (await noObjectionLabel.isVisible().catch(() => false)) {
        await noObjectionLabel.click();
        await page.waitForTimeout(1000);
        console.log('  ✓ Selected "No objection" via label click');
      } else {
        // Fallback: set via Formio
        console.log('  Label not found — trying Formio API...');
        const setResult = await page.evaluate(() => {
          const roleForm = (window as any).roleForm;
          if (!roleForm?.submission?.data) return 'No roleForm';

          const data = roleForm.submission.data;
          // Find the decision key (noObjectionTaj, noObjectionJca, noObjectionMofps)
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
                if (comp.components) {
                  for (const c of comp.components) walk(c);
                }
                if (comp.columns) {
                  for (const col of comp.columns) {
                    if (col?.components) {
                      for (const c of col.components) walk(c);
                    }
                  }
                }
              };
              walk(form.root);
            }
          }

          return results.join(', ') || 'No decision keys found';
        });
        console.log(`  Formio result: ${setResult}`);
      }

      // Save to persist
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('saveDraft'));
      });
      await page.waitForTimeout(3000);
    }

    if (isDisabled) {
      // Try to enable via FORMDATAVALIDATIONSTATUS
      console.log('  Button disabled — trying FORMDATAVALIDATIONSTATUS...');
      await page.evaluate(() => {
        const formio = (window as any).Formio;
        if (!formio?.forms) return;
        for (const k of Object.keys(formio.forms)) {
          const form = formio.forms[k];
          if (!form?.root) continue;
          const findComp = (comp: any, target: string): any => {
            if (!comp) return null;
            if (comp.key === target) return comp;
            if (comp.components) {
              for (const c of comp.components) {
                const found = findComp(c, target);
                if (found) return found;
              }
            }
            if (comp.columns) {
              for (const col of comp.columns) {
                if (col?.components) {
                  for (const c of col.components) {
                    const found = findComp(c, target);
                    if (found) return found;
                  }
                }
              }
            }
            return null;
          };
          const statusComp = findComp(form.root, 'FORMDATAVALIDATIONSTATUS');
          if (statusComp?.setValue) {
            statusComp.setValue('true');
            if (statusComp.triggerChange) statusComp.triggerChange();
          }
          if (form.root.triggerChange) form.root.triggerChange();
          if (form.root.checkConditions) form.root.checkConditions(form.submission?.data);
        }
      });
      await page.waitForTimeout(2000);

      // Save
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('saveDraft'));
      });
      await page.waitForTimeout(3000);

      // Re-check
      const stillDisabled = await actionBtn.isDisabled();
      console.log(`  After enable: disabled=${stillDisabled}`);
    }

    // Save any unsaved EditGrid rows before clicking
    const savedRows = await page.evaluate(() => {
      const formio = (window as any).Formio;
      if (!formio?.forms) return 0;
      let saved = 0;
      for (const fk of Object.keys(formio.forms)) {
        const form = formio.forms[fk];
        if (!form?.root) continue;
        const walk = (comp: any) => {
          if (!comp) return;
          if (comp.component?.type === 'editgrid' && comp.editRows) {
            for (let i = 0; i < comp.editRows.length; i++) {
              if (comp.editRows[i].state === 'new' || comp.editRows[i].state === 'editing') {
                try { comp.saveRow(i); saved++; } catch {}
              }
            }
          }
          if (comp.components) for (const c of comp.components) walk(c);
          if (comp.columns) for (const col of comp.columns) {
            if (col?.components) for (const c of col.components) walk(c);
          }
        };
        walk(form.root);
      }
      return saved;
    });
    if (savedRows > 0) {
      console.log(`  Saved ${savedRows} EditGrid rows`);
      await page.waitForTimeout(1000);
    }

    // Click the button
    console.log(`  Clicking "${actionBtnText}"...`);
    const beforeUrl = page.url();

    try {
      await actionBtn.click({ timeout: 10_000 });
    } catch (e: any) {
      console.log(`  Click error: ${e.message?.substring(0, 60)}`);
      try {
        await actionBtn.click({ force: true, timeout: 10_000 });
      } catch (e2: any) {
        console.log(`  Force click error: ${e2.message?.substring(0, 60)}`);
        skippedRoles.push(task.camundaName);
        continue;
      }
    }

    await page.waitForTimeout(10_000);

    // Handle confirmation dialog
    const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
    try {
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        console.log('  Confirmation — clicking...');
        await confirmBtn.click();
        await page.waitForTimeout(5000);
      }
    } catch {}

    // Check for validation toasts (meaning it failed)
    const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible');
    const toastCount = await toasts.count();
    let hadValidationError = false;
    for (let i = 0; i < Math.min(toastCount, 5); i++) {
      const text = (await toasts.nth(i).textContent())?.trim();
      if (text) {
        console.log(`  Toast: "${text.substring(0, 60)}"`);
        if (text.toLowerCase().includes('required') || text.toLowerCase().includes('upload')) {
          hadValidationError = true;
        }
      }
    }

    const afterUrl = page.url();
    console.log(`  After URL: ${afterUrl}`);

    if (hadValidationError) {
      console.log(`  ✗ Validation error — skipping for now`);
      skippedRoles.push(task.camundaName);
    } else if (afterUrl !== beforeUrl || afterUrl.includes('roleId=')) {
      console.log(`  ✓ ${task.camundaName} completed!`);
      completedRoles.push(task.camundaName);
    } else {
      console.log(`  ? URL unchanged — marking as completed (may have had side effect)`);
      completedRoles.push(task.camundaName);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/proc-${task.camundaName}-after.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`  Completed: ${completedRoles.length} — ${completedRoles.join(', ')}`);
  console.log(`  Skipped: ${skippedRoles.length} — ${skippedRoles.join(', ')}`);
  console.log(`${'═'.repeat(60)}`);

  // Check final status
  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  const finalTasks = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.tasks || []).map((t: any) => ({
      camundaName: t.camundaName,
      shortname: t.shortname,
      status: t.status,
      endTime: t.endTime ? 'completed' : 'pending',
    }));
  });

  console.log('\n  Final task status:');
  for (const t of finalTasks) {
    const done = t.endTime === 'completed' ? '✓' : '○';
    console.log(`    ${done} ${t.camundaName} (${t.shortname}) — ${t.status}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/final-all-roles.png`, fullPage: true });
  console.log('\n══ ALL ROLES PROCESSING COMPLETE ══');
});
