import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Process Complementary Information step (applicant side)
 * Click "Action required" → submit the complementary info form
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-eval');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('Submit complementary information', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Navigate to dashboard and click "Action required"
  console.log('\n══ STEP 1: Click Action required ══');

  await page.goto('/');
  await page.waitForTimeout(5000);

  // Click "My applications" to expand if needed
  const myApps = page.locator('text="My applications"').first();
  if (await myApps.isVisible().catch(() => false)) {
    await myApps.click();
    await page.waitForTimeout(2000);
  }

  // Click "Action required" link/badge
  const actionReq = page.locator('text="Action required"').first();
  if (await actionReq.isVisible().catch(() => false)) {
    console.log('  Clicking "Action required"...');
    await actionReq.click();
    await page.waitForTimeout(5000);
    console.log(`  URL: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-submit-01.png`, fullPage: true });
  } else {
    // Try the edit icon (pen icon)
    console.log('  "Action required" not found — trying edit icon...');
    const editIcon = page.locator('[class*="edit"], [class*="pen"], .fa-pen').first();
    if (await editIcon.isVisible().catch(() => false)) {
      await editIcon.click();
      await page.waitForTimeout(5000);
    } else {
      // Direct navigation
      console.log('  Using direct navigation...');
      await page.goto(`/my-applications/${FILE_ID}`);
      await page.waitForTimeout(5000);
    }
    console.log(`  URL: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-submit-01.png`, fullPage: true });
  }

  // ══════════════════════════════════════════════════════════
  // STEP 2: Explore the complementary info form
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Explore form ══');

  const pageContent = await page.evaluate(() => {
    const results: any = {};

    // Get all tabs
    const tabs = document.querySelectorAll('.nav-link, a[role="tab"]');
    results.tabs = Array.from(tabs)
      .filter(t => (t as HTMLElement).offsetParent !== null)
      .map(t => ({
        text: t.textContent?.trim(),
        active: t.classList.contains('active'),
      }));

    // Get all buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
      }))
      .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));

    // Get headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
    results.headings = Array.from(headings)
      .filter(h => (h as HTMLElement).offsetParent !== null)
      .map(h => h.textContent?.trim().substring(0, 60));

    // Get paragraphs with instructions
    const paras = document.querySelectorAll('p');
    results.instructions = Array.from(paras)
      .filter(p => (p as HTMLElement).offsetParent !== null)
      .map(p => p.textContent?.trim())
      .filter(t => t && t.length > 20)
      .slice(0, 5);

    // Get form components
    const components = document.querySelectorAll('[class*="formio-component"]');
    results.formComponents = Array.from(components)
      .filter(c => {
        const el = c as HTMLElement;
        return el.offsetParent !== null;
      })
      .map(c => {
        const label = c.querySelector('label')?.textContent?.trim();
        const key = c.className.match(/formio-component-(\S+)/)?.[1];
        const input = c.querySelector('input, textarea, select');
        return {
          key: key?.substring(0, 60),
          label: label?.substring(0, 60),
          type: input?.tagName || 'other',
          required: !!c.querySelector('.field-required'),
        };
      })
      .filter(c => c.label && c.key && !c.key.startsWith('panel') && !c.key.startsWith('columns'))
      .slice(0, 20);

    // Browse links for file uploads
    const browseLinks = document.querySelectorAll('a.browse');
    results.browseCount = Array.from(browseLinks).filter(b => (b as HTMLElement).offsetParent !== null).length;

    return results;
  });
  console.log('  Tabs:', JSON.stringify(pageContent.tabs));
  console.log('  Buttons:', JSON.stringify(pageContent.buttons));
  console.log('  Headings:', JSON.stringify(pageContent.headings));
  console.log('  Instructions:', JSON.stringify(pageContent.instructions));
  console.log('  Form components:', JSON.stringify(pageContent.formComponents));
  console.log('  Browse links:', pageContent.browseCount);

  // ══════════════════════════════════════════════════════════
  // STEP 3: Check if there's a submit/send button
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Look for submit button ══');

  // Check for typical submit buttons
  const submitSelectors = [
    'button:has-text("Submit")',
    'button:has-text("Send")',
    'button:has-text("Submit application")',
    'button:has-text("Submit complementary")',
    'button:has-text("Confirm")',
    'button:has-text("Complete")',
  ];

  for (const sel of submitSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      const text = await btn.textContent();
      const disabled = await btn.isDisabled();
      console.log(`  Found: "${text?.trim()}", disabled: ${disabled}`);
    }
  }

  // Check the "Send" tab (like in the original form submission)
  const sendTab = page.locator('a:has-text("Send")').first();
  if (await sendTab.isVisible().catch(() => false)) {
    console.log('  Found "Send" tab — clicking...');
    await sendTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-submit-02-send-tab.png`, fullPage: true });

    // Look for submit button on the Send tab
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
  // STEP 4: Try goToNextPage to navigate through the wizard
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Try wizard navigation ══');

  // The complementary info form is a WIZARD type — it might have next/previous buttons
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  if (await nextBtn.isVisible().catch(() => false)) {
    console.log('  Found Next button — this is a wizard');
    const nextText = await nextBtn.textContent();
    console.log(`  Next button: "${nextText?.trim()}"`);
  }

  // Try dispatching goToNextPage event
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('goToNextPage'));
  });
  await page.waitForTimeout(3000);
  console.log(`  URL after goToNextPage: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-submit-03-after-next.png`, fullPage: true });

  // Check what page we're on now
  const afterNext = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
      }))
      .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));
  });
  console.log('  Buttons after goToNextPage:', JSON.stringify(afterNext));

  // ══════════════════════════════════════════════════════════
  // STEP 5: Check Formio for submit mechanism
  // ══════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Check Formio submit mechanism ══');

  const formioInfo = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';

    const results: any = {};
    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      const data = form?.submission?.data;
      if (!data) continue;

      results[k] = {
        keyCount: Object.keys(data).length,
        isFormValid: data.isFormValid,
        isSubmittable: data.isSubmittable,
        sendPageSubmit: data.sendPageSubmit,
        FORMDATAVALIDATIONSTATUS: data.FORMDATAVALIDATIONSTATUS,
      };
    }
    return results;
  });
  console.log('  Formio info:', JSON.stringify(formioInfo, null, 2));

  await page.screenshot({ path: `${SCREENSHOT_DIR}/comp-submit-final.png`, fullPage: true });
  console.log('\n══ COMPLEMENTARY INFO SUBMIT DIAGNOSTIC COMPLETE ══');
});
