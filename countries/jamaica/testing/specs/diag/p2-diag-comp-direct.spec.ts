import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('Direct navigation to complementary info', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate directly to the application in front-office
  console.log('\n══ STEP 1: Direct navigation ══');

  await page.goto(`/my-applications/${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-direct-01.png`, fullPage: true });

  // Get page content
  const pageInfo = await page.evaluate(() => {
    const results: any = {};

    // Tabs
    const tabs = document.querySelectorAll('.nav-link, a[role="tab"]');
    results.tabs = Array.from(tabs)
      .filter(t => (t as HTMLElement).offsetParent !== null)
      .map(t => ({
        text: t.textContent?.trim(),
        active: t.classList.contains('active'),
        href: (t as HTMLAnchorElement).getAttribute('href'),
      }));

    // Buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
        class: b.className.substring(0, 60),
      }))
      .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));

    // Headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
    results.headings = Array.from(headings)
      .filter(h => (h as HTMLElement).offsetParent !== null)
      .map(h => h.textContent?.trim().substring(0, 60));

    // Check for wizard pages
    const wizardPages = document.querySelectorAll('.wizard-page, [ref="wizard"]');
    results.wizardPages = wizardPages.length;

    // Get Formio form info
    const formio = (window as any).Formio;
    if (formio?.forms) {
      results.forms = {};
      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k];
        const data = form?.submission?.data;
        if (!data) continue;
        results.forms[k] = {
          keyCount: Object.keys(data).length,
          isFormValid: data.isFormValid,
          isSubmittable: data.isSubmittable,
          sendPageSubmit: data.sendPageSubmit,
        };
      }
    }

    return results;
  });
  console.log('  Tabs:', JSON.stringify(pageInfo.tabs, null, 2));
  console.log('  Buttons:', JSON.stringify(pageInfo.buttons, null, 2));
  console.log('  Headings:', JSON.stringify(pageInfo.headings));
  console.log('  Wizard pages:', pageInfo.wizardPages);
  console.log('  Forms:', JSON.stringify(pageInfo.forms));

  // ══════════════════════════════════════════════════════════
  // STEP 2: Check for Form/Payment/Send tabs
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Check tabs ══');

  // Try clicking the "Send" tab
  const sendTab = page.locator('a:has-text("Send"), [href*="send"]').first();
  if (await sendTab.isVisible().catch(() => false)) {
    console.log('  Clicking Send tab...');
    await sendTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-direct-02-send.png`, fullPage: true });

    const sendContent = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons)
        .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
        .map(b => ({
          text: b.textContent?.trim().substring(0, 80),
          disabled: (b as HTMLButtonElement).disabled,
        }))
        .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));
    });
    console.log('  Send tab buttons:', JSON.stringify(sendContent));
  }

  // ══════════════════════════════════════════════════════════
  // STEP 3: Try clicking "Submit application" if visible
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Try submit ══');

  const submitBtn = page.locator('button:has-text("Submit application"), button:has-text("Submit complementary"), button:has-text("Submit")').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    const text = await submitBtn.textContent();
    const disabled = await submitBtn.isDisabled();
    console.log(`  Submit button: "${text?.trim()}", disabled: ${disabled}`);

    if (!disabled) {
      console.log('  Clicking submit...');
      const beforeUrl = page.url();
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

      // Check for toast
      const toasts = page.locator('.toast:visible, [class*="toast"]:visible');
      const count = await toasts.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const t = (await toasts.nth(i).textContent())?.trim();
        if (t) console.log(`  Toast: "${t.substring(0, 60)}"`);
      }
    }
  } else {
    console.log('  No submit button found');

    // Try dispatching goToNextPage repeatedly
    console.log('  Trying goToNextPage events...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('goToNextPage'));
      });
      await page.waitForTimeout(2000);

      // Check if submit button appeared
      const sub = page.locator('button:has-text("Submit")').first();
      if (await sub.isVisible().catch(() => false)) {
        const text = await sub.textContent();
        console.log(`  Found submit after ${i + 1} pages: "${text?.trim()}"`);
        break;
      }
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-direct-final.png`, fullPage: true });

  // Final check
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

  console.log('\n══ DONE ══');
});
