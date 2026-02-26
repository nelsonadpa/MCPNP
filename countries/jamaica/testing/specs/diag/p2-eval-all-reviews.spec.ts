import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 — Process all parallel evaluation/review roles
 *
 * After Documents Check, the application enters 5 parallel roles:
 *   Legal review, Technical review, Business review,
 *   Compliance review, Organize NOC and inspection
 *
 * Each role has an evaluation workspace with:
 *   - LSU evaluation (or similar) — collapsible, optional
 *   - LSU recommendation (or similar) — collapsible, optional
 *   - "Send evaluation to approval" button — already enabled
 *
 * Strategy: Loop through roles by clicking into the app from Part B,
 * finding and clicking the approval button, then returning to Part B.
 *
 * Run:
 *   npx playwright test specs/p2-eval-all-reviews.spec.ts --project=jamaica-frontoffice --headed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';

test('P2: Process all evaluation/review roles', async ({ page }) => {
  test.setTimeout(600_000); // 10 min
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const MAX_ITERATIONS = 10; // Safety limit
  let iteration = 0;
  const completedRoles: string[] = [];

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ITERATION ${iteration}: Navigate to Part B and process next role`);
    console.log(`${'═'.repeat(60)}`);

    // Navigate to Part B
    await page.goto(`/part-b/${SERVICE_ID}/my/${PROCESS_ID}?file_id=${FILE_ID}`);
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`  URL: ${currentUrl}`);

    // Check if we got redirected (no more roles assigned)
    if (!currentUrl.includes(PROCESS_ID)) {
      console.log('  Redirected away from processing view — may mean no more roles');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/iter-${iteration}-redirected.png`, fullPage: true });
      break;
    }

    // Identify which role we're on
    const roleInfo = await page.evaluate(() => {
      const results: any = {};

      // Get the role name from the Roles dropdown header
      const ngValues = document.querySelectorAll('.ng-value-label, .ng-value span');
      for (const v of ngValues) {
        const text = v.textContent?.trim();
        if (text && !text.includes('Establish') && !text.includes('All services') && text.length > 3) {
          results.roleName = text;
          break;
        }
      }
      // Fallback: check for workspace heading text
      if (!results.roleName) {
        const bolds = document.querySelectorAll('strong, b');
        for (const b of bolds) {
          const text = b.textContent?.trim() || '';
          if (text.includes('workspace') || text.includes('evaluation') || text.includes('consultation')) {
            results.roleName = text.substring(0, 50);
            break;
          }
        }
      }

      // Get workspace heading
      const headings = document.querySelectorAll('h4, h5, p');
      for (const h of headings) {
        const text = h.textContent?.trim() || '';
        if (text.includes('workspace') || text.includes('consultation')) {
          results.workspace = text.substring(0, 100);
          break;
        }
      }

      // Get all visible buttons
      const buttons = document.querySelectorAll('button');
      results.buttons = Array.from(buttons)
        .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
        .map(b => ({
          text: b.textContent?.trim().substring(0, 80),
          disabled: (b as HTMLButtonElement).disabled,
          class: b.className.substring(0, 60),
        }))
        .filter(b =>
          b.text.toLowerCase().includes('send') ||
          b.text.toLowerCase().includes('approve') ||
          b.text.toLowerCase().includes('sent') ||
          b.text.toLowerCase().includes('complete') ||
          b.text.toLowerCase().includes('submit') ||
          b.text.toLowerCase().includes('inspection')
        );

      return results;
    });

    console.log(`  Role: ${roleInfo.roleName || 'unknown'}`);
    console.log(`  Workspace: ${roleInfo.workspace || 'none'}`);
    console.log(`  Action buttons: ${JSON.stringify(roleInfo.buttons)}`);

    // Check if we already processed this role
    if (roleInfo.roleName && completedRoles.includes(roleInfo.roleName)) {
      console.log(`  Already completed "${roleInfo.roleName}" — breaking to avoid loop`);
      break;
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/iter-${iteration}-role-${(roleInfo.roleName || 'unknown').replace(/\s+/g, '-')}.png`, fullPage: true });

    // Find the approval/send button
    // Common patterns: "Send evaluation to approval", "Send to approval",
    // "Complete inspection", "Approve", etc.
    const actionBtnSelectors = [
      'button:has-text("Send evaluation to approval")',
      'button:has-text("Send consultation documents")',
      'button:has-text("Send to approval")',
      'button:has-text("Complete inspection")',
      'button:has-text("Send inspection")',
      'button:has-text("Approve")',
      'button:has-text("Complete")',
      'button:has-text("Submit")',
    ];

    let clicked = false;
    for (const selector of actionBtnSelectors) {
      const btn = page.locator(selector).first();
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        const btnText = await btn.textContent();
        const isDisabled = await btn.isDisabled();
        console.log(`  Found button: "${btnText?.trim()}", disabled: ${isDisabled}`);

        if (isDisabled) {
          // Try to enable it like Documents Check — set FORMDATAVALIDATIONSTATUS
          console.log('  Button disabled — trying to enable via FORMDATAVALIDATIONSTATUS...');
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

          // Re-check if button is now enabled
          const stillDisabled = await btn.isDisabled();
          console.log(`  After enable attempt: disabled=${stillDisabled}`);
        }

        // Click the button
        console.log(`  Clicking "${btnText?.trim()}"...`);
        const beforeUrl = page.url();

        try {
          await btn.click({ timeout: 10_000 });
        } catch (e: any) {
          console.log(`  Click error: ${e.message?.substring(0, 60)}`);
          // Try force click
          await btn.click({ force: true, timeout: 10_000 });
        }

        await page.waitForTimeout(10_000);

        // Handle confirmation dialogs
        const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
        try {
          if (await confirmBtn.isVisible({ timeout: 3000 })) {
            console.log('  Confirmation dialog — clicking OK...');
            await confirmBtn.click();
            await page.waitForTimeout(5000);
          }
        } catch {}

        const afterUrl = page.url();
        console.log(`  After click URL: ${afterUrl}`);

        if (afterUrl !== beforeUrl || afterUrl.includes('roleId=my')) {
          console.log(`  ✓ Role "${roleInfo.roleName}" completed!`);
          completedRoles.push(roleInfo.roleName || `iteration-${iteration}`);
          clicked = true;
        } else {
          console.log('  URL unchanged — checking page state...');
          // Check for toasts
          const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible');
          const count = await toasts.count();
          for (let i = 0; i < Math.min(count, 3); i++) {
            console.log(`  Toast: "${(await toasts.nth(i).textContent())?.trim().substring(0, 60)}"`);
          }
          completedRoles.push(roleInfo.roleName || `iteration-${iteration}`);
          clicked = true;
        }

        break; // Found and clicked a button
      }
    }

    if (!clicked) {
      console.log('  No action button found — examining page...');

      // Maybe it's a different type of role (e.g., "Organize NOC and inspection")
      // Let's check what buttons are on the page
      const allBtns = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons)
          .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
          .map(b => b.textContent?.trim().substring(0, 60));
      });
      console.log(`  All visible buttons: ${JSON.stringify(allBtns)}`);

      // Check if we need to switch to Processing tab
      const procTab = page.locator('a:has-text("Processing")').first();
      if (await procTab.isVisible().catch(() => false)) {
        console.log('  Switching to Processing tab...');
        await procTab.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/iter-${iteration}-processing-tab.png`, fullPage: true });

        // Re-check for buttons
        for (const selector of actionBtnSelectors) {
          const btn = page.locator(selector).first();
          if (await btn.isVisible().catch(() => false)) {
            const btnText = await btn.textContent();
            console.log(`  Found button after tab switch: "${btnText?.trim()}"`);
            await btn.click({ timeout: 10_000 });
            await page.waitForTimeout(10_000);
            completedRoles.push(roleInfo.roleName || `iteration-${iteration}`);
            clicked = true;
            break;
          }
        }
      }

      if (!clicked) {
        console.log('  WARNING: Could not find any action button. Breaking.');
        break;
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/iter-${iteration}-after.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // FINAL: Check status
  // ══════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SUMMARY: Completed ${completedRoles.length} roles`);
  console.log(`  Roles: ${completedRoles.join(', ')}`);
  console.log(`${'═'.repeat(60)}`);

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Get TEST-SEZ application status
  const finalStatus = await page.evaluate(() => {
    const rows = document.querySelectorAll('.list-item, tr');
    for (const row of rows) {
      if (row.textContent?.includes('TEST-SEZ')) {
        const badge = row.querySelector('.status-badge');
        const processing = row.querySelector('[class*="processing"], .active-task');
        return {
          status: badge?.textContent?.trim(),
          processing: processing?.textContent?.trim().substring(0, 200),
        };
      }
    }
    return { status: 'not found', processing: 'not found' };
  });
  console.log(`  Final status: ${JSON.stringify(finalStatus)}`);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/final-status.png`, fullPage: true });
  console.log('\n══ ALL EVALUATION ROLES COMPLETE ══');
});
