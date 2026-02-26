import { test } from '@playwright/test';

/**
 * Diagnostic: Actual field inventory per tab — inputs, selects, dropdowns, uploads
 */
test('DIAG: Field inventory per tab', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.locator('text=Establish a new zone').click();
  await page.waitForTimeout(5000);

  await page.locator('text=Form').first().click();
  await page.waitForTimeout(2000);

  // Helper to dump fields on current view
  async function dumpFields(label: string) {
    console.log(`\n──── ${label} ────`);

    // Visible inputs with names
    const inputs = await page.evaluate(() => {
      const els = document.querySelectorAll('input:not([type="hidden"]), textarea');
      return Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(e => ({
        tag: e.tagName,
        type: (e as HTMLInputElement).type,
        name: (e as HTMLInputElement).name?.substring(0, 60),
        placeholder: (e as HTMLInputElement).placeholder?.substring(0, 40),
        formioClass: e.closest('[class*="formio-component-"]')?.className?.match(/formio-component-(\S+)/)?.[1] || '',
      }));
    });
    console.log(`  Inputs (${inputs.length}):`);
    for (const inp of inputs.slice(0, 25)) {
      console.log(`    ${inp.tag}[${inp.type}] name="${inp.name}" component="${inp.formioClass}" ph="${inp.placeholder}"`);
    }

    // Visible <select> elements
    const selects = await page.evaluate(() => {
      const els = document.querySelectorAll('select');
      return Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        // Include hidden selects (Choices.js hides the real select)
        return true;
      }).map(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        const opts = Array.from(e.options).map(o => o.text.substring(0, 30));
        return {
          name: e.name?.substring(0, 60),
          visible: rect.width > 0 && rect.height > 0,
          optionCount: e.options.length,
          options: opts.slice(0, 5),
          formioClass: e.closest('[class*="formio-component-"]')?.className?.match(/formio-component-(\S+)/)?.[1] || '',
          parentClasses: e.parentElement?.className?.substring(0, 60) || '',
        };
      });
    });
    console.log(`  Selects (${selects.length}):`);
    for (const sel of selects) {
      console.log(`    name="${sel.name}" visible=${sel.visible} opts=${sel.optionCount} → [${sel.options.join(', ')}]`);
      console.log(`      component="${sel.formioClass}" parent="${sel.parentClasses}"`);
    }

    // Choices.js containers (broader search)
    const choices = await page.evaluate(() => {
      const els = document.querySelectorAll('.choices, [class*="choices"]');
      return Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(e => ({
        classes: e.className.substring(0, 80),
        formioClass: e.closest('[class*="formio-component-"]')?.className?.match(/formio-component-(\S+)/)?.[1] || '',
      }));
    });
    console.log(`  Choices containers visible (${choices.length}):`);
    for (const c of choices.slice(0, 10)) {
      console.log(`    "${c.classes}" component="${c.formioClass}"`);
    }

    // Browse links for file uploads
    const browseLinks = await page.evaluate(() => {
      const els = document.querySelectorAll('a.browse');
      return Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(e => ({
        text: e.textContent?.trim().substring(0, 30),
        formioClass: e.closest('[class*="formio-component-"]')?.className?.match(/formio-component-(\S+)/)?.[1] || '',
      }));
    });
    console.log(`  Browse links visible (${browseLinks.length}):`);
    for (const b of browseLinks) {
      console.log(`    "${b.text}" component="${b.formioClass}"`);
    }

    // Radio groups
    const radios = await page.evaluate(() => {
      const els = document.querySelectorAll('input[type="radio"]');
      const visible = Array.from(els).filter(e => {
        const rect = (e as HTMLElement).getBoundingClientRect();
        return rect.width > 0 || (e.closest('label') as HTMLElement)?.getBoundingClientRect()?.width > 0;
      });
      // Group by name
      const groups: Record<string, string[]> = {};
      for (const el of visible) {
        const name = (el as HTMLInputElement).name;
        const label = el.closest('label')?.textContent?.trim().substring(0, 30) || (el as HTMLInputElement).value;
        if (!groups[name]) groups[name] = [];
        groups[name].push(label);
      }
      return Object.entries(groups).map(([name, labels]) => ({
        name: name.substring(0, 60),
        labels,
        formioClass: els[0]?.closest('[class*="formio-component-"]')?.className?.match(/formio-component-(\S+)/)?.[1] || '',
      }));
    });
    console.log(`  Radio groups (${radios.length}):`);
    for (const r of radios.slice(0, 15)) {
      console.log(`    name="${r.name}" → [${r.labels.join(' | ')}]`);
    }
  }

  // ── PROJECT OVERVIEW ──
  await page.locator('text=Project overview').first().click();
  await page.waitForTimeout(2000);
  await dumpFields('PROJECT OVERVIEW');

  // ── DEVELOPER ──
  await page.locator(`[role="tab"]:has-text("Developer"), .nav-link:has-text("Developer")`).first().click();
  await page.waitForTimeout(3000);
  await dumpFields('DEVELOPER');

  // ── MASTER PLAN ──
  await page.locator(`[role="tab"]:has-text("Master plan"), .nav-link:has-text("Master plan")`).first().click();
  await page.waitForTimeout(3000);
  await dumpFields('MASTER PLAN');

  // ── BUSINESS PLAN ──
  await page.locator(`[role="tab"]:has-text("Business plan"), .nav-link:has-text("Business plan")`).first().click();
  await page.waitForTimeout(3000);
  await dumpFields('BUSINESS PLAN');

  // ── COMPLIANCE (each side-nav section) ──
  await page.locator(`[role="tab"]:has-text("Compliance"), .nav-link:has-text("Compliance")`).first().click();
  await page.waitForTimeout(3000);
  await dumpFields('COMPLIANCE - Ownership & financial integrity');

  // Click through compliance sub-sections
  const complianceSections = [
    'Health & Safety',
    'Disaster mitigation & Recovery',
    'Security plan',
    'Licensing & Permits',
    'Customs',
  ];
  for (const section of complianceSections) {
    try {
      const link = page.locator(`.nav-link:has-text("${section}"), a:has-text("${section}")`).last();
      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();
        await page.waitForTimeout(2000);
        await dumpFields(`COMPLIANCE - ${section}`);
      }
    } catch { }
  }

  // ── PAYMENT ──
  await page.locator('text=Payment').first().click();
  await page.waitForTimeout(2000);
  await dumpFields('PAYMENT');

  // ── SEND ──
  await page.locator('text=Send').first().click();
  await page.waitForTimeout(2000);
  await dumpFields('SEND');
});
