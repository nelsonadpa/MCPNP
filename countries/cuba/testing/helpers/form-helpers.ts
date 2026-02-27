import { Page } from '@playwright/test';

/**
 * Fill a text/textarea field by component key
 */
export async function fillText(page: Page, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input, .formio-component-${componentKey} textarea`).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(value);
  await page.waitForTimeout(300);
}

/**
 * Fill an email field
 */
export async function fillEmail(page: Page, componentKey: string, value: string) {
  await fillText(page, componentKey, value);
}

/**
 * Type text char-by-char (for masked inputs like phone, TRN)
 */
export async function typeText(page: Page, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input`).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.type(value, { delay: 100 });
  await page.waitForTimeout(300);
}

/**
 * Fill a number input
 */
export async function fillNumber(page: Page, componentKey: string, value: string) {
  const input = page.locator(`.formio-component-${componentKey} input[type="number"], .formio-component-${componentKey} input`).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(value);
  await page.waitForTimeout(300);
}

/**
 * Search and select from a Choices.js dropdown (API-search based)
 * CRITICAL: eRegistrations dropdowns are NOT standard HTML selects
 */
export async function searchAndSelect(page: Page, componentKey: string, searchTerm: string): Promise<boolean> {
  try {
    const component = page.locator(`.formio-component-${componentKey}`).first();
    await component.scrollIntoViewIfNeeded();

    // Check if search input is already visible (Jamaica style — open by default)
    let searchInput = component.locator('.choices__input--cloned:visible, input[name="search_terms"]:visible').first();
    let isInputVisible = await searchInput.isVisible({ timeout: 1000 }).catch(() => false);

    // If not visible, click the Choices wrapper to open the dropdown (Cuba style)
    if (!isInputVisible) {
      const choicesWrapper = component.locator('.choices, .formio-choices').first();
      if (await choicesWrapper.isVisible({ timeout: 2000 }).catch(() => false)) {
        await choicesWrapper.click();
        await page.waitForTimeout(500);
        // Re-check for search input after opening
        searchInput = component.locator('.choices__input--cloned:visible, .choices__input:visible, input[type="search"]:visible').first();
        isInputVisible = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
      }
    }

    if (isInputVisible) {
      await searchInput.click();
      await page.waitForTimeout(300);
      await searchInput.fill('');
      await searchInput.type(searchTerm, { delay: 100 });
      await page.waitForTimeout(2000); // CRITICAL: wait for API to return options

      // Try scoped first, then global (dropdown may render OUTSIDE component)
      let options = component.locator('.choices__list--dropdown .choices__item--selectable:visible');
      let count = await options.count();
      if (count === 0) {
        options = page.locator('.choices__list--dropdown.is-active .choices__item--selectable:visible');
        count = await options.count();
      }

      if (count > 0) {
        // Try click first; if viewport issue, fall back to Enter key
        try {
          await options.first().click({ force: true, timeout: 3000 });
        } catch {
          // Dropdown items outside viewport — use Enter to select highlighted option
          await searchInput.press('Enter');
        }
        await page.waitForTimeout(500);
        return true;
      }
    }
  } catch (e) {
    console.log(`searchAndSelect(${componentKey}) ERROR: ${e}`);
  }
  return false;
}

/**
 * Click a radio button by its label text
 */
export async function clickRadioLabel(page: Page, componentKey: string, labelText: string) {
  const component = page.locator(`.formio-component-${componentKey}`).first();
  const label = component.locator(`label:has-text("${labelText}")`).first();
  await label.scrollIntoViewIfNeeded();
  await label.click();
  await page.waitForTimeout(300);
}

/**
 * Check a checkbox
 */
export async function checkBox(page: Page, componentKey: string) {
  const checkbox = page.locator(`.formio-component-${componentKey} input[type="checkbox"]`).first();
  if (!(await checkbox.isChecked())) {
    const label = page.locator(`.formio-component-${componentKey} label`).first();
    await label.scrollIntoViewIfNeeded();
    await label.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Upload a file via the browse link + filechooser pattern
 * eRegistrations never has visible <input type="file">
 */
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
    console.log(`uploadFile(${componentKey}) ERROR: ${e}`);
  }
  return false;
}

/**
 * Click a sub-tab within a form
 */
export async function clickSubTab(page: Page, tabName: string) {
  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), .nav-link:has-text("${tabName}")`).first();
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await page.waitForTimeout(3000);
}

/**
 * Set hidden fields via Form.io JS API
 * Use for required fields that have no visible UI
 */
export async function setHiddenFields(page: Page, fields: Record<string, any>) {
  await page.evaluate((data) => {
    const instances = (window as any).Formio?.forms || {};
    const form = instances[Object.keys(instances)[0]];
    if (form) {
      const currentData = form?.submission?.data || {};
      form.submission = { data: { ...currentData, ...data } };
    }
  }, fields);
  await page.waitForTimeout(500);
}

/**
 * Take a labeled screenshot
 */
export async function screenshot(page: Page, dir: string, name: string) {
  const path = require('path');
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}
