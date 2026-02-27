import { Page } from '@playwright/test';

/**
 * eRegistrations Form.io helpers
 *
 * Reusable functions for interacting with Form.io-based forms
 * on the eRegistrations platform (Angular + Choices.js + EditGrid).
 *
 * Extracted from p1-submit-complete.spec.ts (Jamaica SEZ Cycle 1).
 */

// ── Text Input ──

/** Fill a text input by formio component key */
export async function fillText(page: Page, componentKey: string, value: string): Promise<boolean> {
  const sel = `.formio-component-${componentKey}`;
  const input = page.locator(`${sel} input[type="text"]:visible, ${sel} textarea:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillText(${componentKey}): NOT visible`);
  return false;
}

/** Fill an email input by formio component key */
export async function fillEmail(page: Page, componentKey: string, value: string): Promise<boolean> {
  const input = page.locator(`.formio-component-${componentKey} input[type="email"]:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillEmail(${componentKey}): NOT visible`);
  return false;
}

/** Type text character-by-character (for masked inputs like TRN) */
export async function typeText(page: Page, componentKey: string, value: string, delay = 80): Promise<boolean> {
  const input = page.locator(`.formio-component-${componentKey} input:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.click();
      await input.fill('');
      await page.waitForTimeout(200);
      await input.type(value, { delay });
      return true;
    }
  } catch { }
  console.log(`  typeText(${componentKey}): NOT visible`);
  return false;
}

/** Fill a number input by formio component key */
export async function fillNumber(page: Page, componentKey: string, value: string): Promise<boolean> {
  const input = page.locator(`.formio-component-${componentKey} input:visible`).first();
  try {
    if (await input.isVisible({ timeout: 2000 })) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
      return true;
    }
  } catch { }
  console.log(`  fillNumber(${componentKey}): NOT visible`);
  return false;
}

// ── Choices.js Dropdowns ──

/**
 * Search-based Choices.js select:
 * 1. Click the Choices wrapper to open/focus
 * 2. Type searchTerm into the search input
 * 3. Wait for API results
 * 4. Select first matching option
 */
export async function searchAndSelect(page: Page, componentKey: string, searchTerm: string): Promise<boolean> {
  try {
    const component = page.locator(`.formio-component-${componentKey}`).first();
    const searchInput = component.locator('.choices__input--cloned:visible, input[name="search_terms"]:visible').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.scrollIntoViewIfNeeded();
      await searchInput.click();
      await page.waitForTimeout(300);
      await searchInput.fill('');
      await searchInput.type(searchTerm, { delay: 100 });
      await page.waitForTimeout(2000);

      // Find selectable options (scoped to component first, then global)
      let options = component.locator('.choices__list--dropdown .choices__item--selectable:visible');
      let count = await options.count();
      if (count === 0) {
        options = page.locator('.choices__list--dropdown.is-active .choices__item--selectable:visible');
        count = await options.count();
      }
      console.log(`  searchAndSelect(${componentKey}, "${searchTerm}"): ${count} options`);
      if (count > 0) {
        const optText = await options.first().textContent();
        console.log(`  → selecting: "${optText?.trim().substring(0, 50)}"`);
        await options.first().click();
        await page.waitForTimeout(500);
        return true;
      }
    } else {
      // Fallback: click outer Choices container to activate search
      const choicesDiv = component.locator('.choices:visible, .formio-choices:visible').first();
      if (await choicesDiv.isVisible({ timeout: 2000 })) {
        await choicesDiv.scrollIntoViewIfNeeded();
        await choicesDiv.click();
        await page.waitForTimeout(500);
        const si = component.locator('.choices__input--cloned:visible').first();
        if (await si.isVisible({ timeout: 1000 })) {
          await si.type(searchTerm, { delay: 100 });
          await page.waitForTimeout(2000);
          const opts = page.locator('.choices__list--dropdown .choices__item--selectable:visible');
          const c = await opts.count();
          if (c > 0) {
            await opts.first().click();
            await page.waitForTimeout(500);
            return true;
          }
        }
      }
      console.log(`  searchAndSelect(${componentKey}): search input NOT visible`);
    }
  } catch (e) {
    console.log(`  searchAndSelect(${componentKey}) ERROR: ${e}`);
  }
  return false;
}

// ── Radio & Checkbox ──

/** Click a radio option by its label text within a formio component */
export async function clickRadioLabel(page: Page, componentKey: string, labelText: string): Promise<boolean> {
  try {
    const label = page.locator(`.formio-component-${componentKey} label:has-text("${labelText}")`).first();
    if (await label.isVisible({ timeout: 2000 })) {
      await label.scrollIntoViewIfNeeded();
      await label.click();
      return true;
    }
  } catch { }
  console.log(`  clickRadio(${componentKey}, "${labelText}"): NOT visible`);
  return false;
}

/** Check a checkbox by formio component key */
export async function checkBox(page: Page, componentKey: string): Promise<boolean> {
  try {
    const cb = page.locator(`.formio-component-${componentKey} input[type="checkbox"]:visible`).first();
    if (await cb.isVisible({ timeout: 2000 })) {
      await cb.scrollIntoViewIfNeeded();
      await cb.check();
      return true;
    }
  } catch { }
  console.log(`  checkBox(${componentKey}): NOT visible`);
  return false;
}

/** Click all visible "yes" radio buttons in survey components */
export async function fillSurveyYes(page: Page): Promise<number> {
  const yesRadios = page.locator('input[type="radio"][value="yes"]:visible');
  const count = await yesRadios.count();
  for (let i = 0; i < count; i++) {
    try {
      const radio = yesRadios.nth(i);
      await radio.scrollIntoViewIfNeeded();
      await radio.click({ force: true });
      await page.waitForTimeout(100);
    } catch { }
  }
  return count;
}

// ── Navigation ──

/** Click a form tab (top-level tab like "Form", "Developer", "Master plan") */
export async function clickSubTab(page: Page, tabName: string): Promise<void> {
  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), .nav-link:has-text("${tabName}")`).first();
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await page.waitForTimeout(3000);
}

/** Click a side-nav link (e.g., Compliance sub-sections). Uses .last() to avoid matching main tabs. */
export async function clickSideNav(page: Page, sectionName: string): Promise<boolean> {
  const link = page.locator(`.nav-link:has-text("${sectionName}")`).last();
  if (await link.isVisible({ timeout: 2000 })) {
    await link.click();
    await page.waitForTimeout(2000);
    return true;
  }
  console.log(`  clickSideNav("${sectionName}"): NOT visible`);
  return false;
}

// ── File Upload ──

/** Upload a file by formio component key */
export async function uploadFile(page: Page, componentKey: string, filePath: string): Promise<boolean> {
  try {
    const browseLink = page.locator(`.formio-component-${componentKey} a.browse`).first();
    if (await browseLink.isVisible({ timeout: 3000 })) {
      await browseLink.scrollIntoViewIfNeeded();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLink.click(),
      ]);
      await fileChooser.setFiles(filePath);
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (e) {
    console.log(`  uploadFile(${componentKey}) ERROR: ${e}`);
    return false;
  }
  console.log(`  uploadFile(${componentKey}): browse NOT visible`);
  return false;
}

/** Upload to the first visible browse link (generic, no component key) */
export async function uploadGenericBrowse(page: Page, filePath: string): Promise<boolean> {
  try {
    const browseLink = page.locator('a.browse:visible').first();
    if (await browseLink.isVisible({ timeout: 3000 })) {
      await browseLink.scrollIntoViewIfNeeded();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        browseLink.click(),
      ]);
      await fileChooser.setFiles(filePath);
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (e) {
    console.log(`  uploadGenericBrowse ERROR: ${e}`);
  }
  return false;
}

/** Upload to a specific browse link by index (0-based) */
export async function uploadBrowseByIndex(page: Page, index: number, filePath: string): Promise<boolean> {
  try {
    const link = page.locator('a.browse:visible').nth(index);
    if (await link.isVisible({ timeout: 3000 })) {
      await link.scrollIntoViewIfNeeded();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        link.click(),
      ]);
      await fc.setFiles(filePath);
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (e) {
    console.log(`  uploadBrowseByIndex(${index}) ERROR: ${e}`);
  }
  return false;
}

// ── Form.io API ──

/** Click save button */
export async function save(page: Page): Promise<void> {
  try {
    const saveBtn = page.locator('button.btn-success:visible, [class*="save"]:visible').last();
    if (await saveBtn.isVisible({ timeout: 2000 })) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }
  } catch { }
}

/** Dispatch saveDraft custom event (used in back-office) */
export async function saveDraft(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('saveDraft'));
  });
  await page.waitForTimeout(3000);
}

/** Set Form.io submission data fields directly via JS API */
export async function setFormioData(page: Page, updates: Record<string, any>): Promise<{ success: boolean; formKeys: number; dataKeys: number }> {
  return page.evaluate((data) => {
    const instances = (window as any).Formio?.forms || {};
    const formKeys = Object.keys(instances);
    if (formKeys.length > 0) {
      const form = instances[formKeys[0]];
      const currentData = form?.submission?.data || {};
      form.submission = { data: { ...currentData, ...data } };
      return { success: true, formKeys: formKeys.length, dataKeys: Object.keys(currentData).length };
    }
    return { success: false, formKeys: 0, dataKeys: 0 };
  }, updates);
}

/**
 * Set FORMDATAVALIDATIONSTATUS to 'true' via Formio component tree.
 * This enables action buttons that are disabled until form validation passes.
 */
export async function enableFormValidation(page: Page): Promise<void> {
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
}

/** Save all unsaved EditGrid rows via Formio API. Returns number of rows saved. */
export async function saveEditGridRows(page: Page): Promise<number> {
  return page.evaluate(() => {
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
              try { comp.saveRow(i); saved++; } catch { }
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
}
