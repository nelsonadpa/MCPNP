import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Submit Complementary Information via front-office
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('Submit complementary information', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate to the front-office form view
  console.log('\n══ STEP 1: Navigate to form ══');
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-final-01.png`, fullPage: true });

  // Click "Validate send page"
  console.log('\n══ STEP 2: Click Validate send page ══');
  const validateBtn = page.locator('button:has-text("Validate send page")');
  await expect(validateBtn).toBeVisible({ timeout: 10_000 });

  const isDisabled = await validateBtn.isDisabled();
  console.log(`  Button disabled: ${isDisabled}`);

  // Track network requests
  const requests: string[] = [];
  page.on('request', req => {
    if (req.url().includes('/backend/') || req.url().includes('/api/')) {
      requests.push(`${req.method()} ${req.url().substring(0, 120)}`);
    }
  });

  await validateBtn.click();
  await page.waitForTimeout(10_000);

  console.log(`  Network requests: ${requests.length}`);
  for (const r of requests.slice(0, 10)) console.log(`    ${r}`);

  // Check for toasts/notifications
  const toasts = page.locator('.toast:visible, [class*="toast"]:visible, .alert:visible');
  const toastCount = await toasts.count();
  for (let i = 0; i < Math.min(toastCount, 5); i++) {
    const text = (await toasts.nth(i).textContent())?.trim();
    if (text) console.log(`  Toast: "${text.substring(0, 80)}"`);
  }

  const afterUrl = page.url();
  console.log(`  URL after: ${afterUrl}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-final-02-after-validate.png`, fullPage: true });

  // Check if a new button appeared (like "Submit application")
  console.log('\n══ STEP 3: Check for submit button ══');
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
      }))
      .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));
  });
  console.log('  Buttons:', JSON.stringify(buttons, null, 2));

  // If "Submit application" appeared, click it
  const submitBtn = page.locator('button:has-text("Submit application"), button:has-text("Submit complementary"), button:has-text("Submit")').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    const text = await submitBtn.textContent();
    console.log(`  Found submit: "${text?.trim()}" — clicking...`);
    await submitBtn.click();
    await page.waitForTimeout(10_000);

    // Handle confirmation
    const confirmBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
    try {
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
        await page.waitForTimeout(5000);
      }
    } catch {}

    console.log(`  URL after submit: ${page.url()}`);

    // Check for success toast
    const toasts2 = page.locator('.toast:visible, [class*="toast"]:visible');
    const count2 = await toasts2.count();
    for (let i = 0; i < Math.min(count2, 3); i++) {
      const t = (await toasts2.nth(i).textContent())?.trim();
      if (t) console.log(`  Toast: "${t.substring(0, 80)}"`);
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-final-03.png`, fullPage: true });

  // Final task status check
  console.log('\n══ Final task status ══');
  await page.goto('/part-b');
  await page.waitForTimeout(3000);
  const tasks = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.tasks || []).map((t: any) => ({
      name: t.camundaName,
      shortname: t.shortname,
      status: t.status,
      done: !!t.endTime,
    }));
  });
  for (const t of tasks) {
    console.log(`  ${t.done ? '✓' : '○'} ${t.name} (${t.shortname}) — ${t.status}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-final-status.png`, fullPage: true });
  console.log('\n══ COMPLEMENTARY INFO COMPLETE ══');
});
