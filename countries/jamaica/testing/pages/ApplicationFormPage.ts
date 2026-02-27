import { Page, expect } from '@playwright/test';
import path from 'path';
import {
  fillText, fillEmail, typeText, fillNumber,
  searchAndSelect, clickRadioLabel, checkBox,
  clickSubTab, clickSideNav,
  uploadFile, uploadGenericBrowse,
  fillSurveyYes, save, setFormioData,
} from '../helpers/form-helpers';

/**
 * Page Object for the eRegistrations front-office application form.
 *
 * Encapsulates the applicant-side form filling workflow:
 * Dashboard → Start Application → Fill Tabs → Validate → Submit
 *
 * Parameterized by service name and test data — reusable across services.
 */
export class ApplicationFormPage {
  constructor(
    private page: Page,
    private serviceName: string,
    private docsDir: string,
  ) {}

  // ── Navigation ──

  /** Navigate to dashboard and start a new application */
  async startNewApplication(): Promise<string> {
    await this.page.goto('/');
    await this.page.waitForSelector('text=Dashboard', { timeout: 30_000 });
    await this.page.getByRole('button', { name: this.serviceName }).click();
    await this.page.waitForTimeout(5000);
    const url = this.page.url();
    console.log(`\n=== New application: ${url} ===\n`);
    return url;
  }

  /** Navigate to an existing application by file ID */
  async openExistingApplication(serviceId: string, fileId: string): Promise<void> {
    await this.page.goto(`/services/${serviceId}?file_id=${fileId}`);
    await this.page.waitForTimeout(5000);
  }

  // ── Tab Navigation ──

  async goToTab(tabName: string): Promise<void> {
    await clickSubTab(this.page, tabName);
  }

  async goToFormTab(): Promise<void> {
    await this.page.locator('text=Form').first().click();
    await this.page.waitForTimeout(2000);
  }

  async goToPaymentTab(): Promise<void> {
    await this.page.locator('text=Payment').first().click();
    await this.page.waitForTimeout(2000);
  }

  async goToSendTab(): Promise<void> {
    await this.page.locator('text=Send').first().click();
    await this.page.waitForTimeout(2000);
  }

  // ── Form Filling (delegated to helpers) ──

  async fillText(key: string, value: string) { return fillText(this.page, key, value); }
  async fillEmail(key: string, value: string) { return fillEmail(this.page, key, value); }
  async typeText(key: string, value: string, delay?: number) { return typeText(this.page, key, value, delay); }
  async fillNumber(key: string, value: string) { return fillNumber(this.page, key, value); }
  async searchAndSelect(key: string, term: string) { return searchAndSelect(this.page, key, term); }
  async clickRadio(key: string, label: string) { return clickRadioLabel(this.page, key, label); }
  async checkBox(key: string) { return checkBox(this.page, key); }
  async clickSideNav(name: string) { return clickSideNav(this.page, name); }
  async fillSurveyYes() { return fillSurveyYes(this.page); }
  async save() { return save(this.page); }
  async setFormioData(data: Record<string, any>) { return setFormioData(this.page, data); }

  async uploadFile(key: string, filename: string) {
    return uploadFile(this.page, key, path.join(this.docsDir, filename));
  }

  async uploadGenericBrowse(filename: string) {
    return uploadGenericBrowse(this.page, path.join(this.docsDir, filename));
  }

  // ── Consent & Submit ──

  /** Check all visible consent checkboxes on the Send tab */
  async checkAllConsents(): Promise<number> {
    const cbs = this.page.locator('input[type="checkbox"]:visible');
    const count = await cbs.count();
    for (let i = 0; i < count; i++) {
      await cbs.nth(i).check().catch(() => {});
      await this.page.waitForTimeout(200);
    }
    console.log(`Consents checked: ${count}`);
    return count;
  }

  /** Click "Validate the form" button and return error count */
  async validateForm(): Promise<{ errorCount: number; errors: string[] }> {
    await this.goToFormTab();
    const validateBtn = this.page.locator('button:has-text("validate the form"), button:has-text("Validate")');
    if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await validateBtn.click();
      await this.page.waitForTimeout(3000);

      const errorItems = this.page.locator('.formio-errors .formio-error-wrapper, .text-danger:visible');
      const errorCount = await errorItems.count();

      const errors: string[] = [];
      if (errorCount > 0) {
        const errTexts = await this.page.locator('.formio-errors .error, .help-block:visible, .formio-error-wrapper:visible').allTextContents();
        for (const t of errTexts.slice(0, 20)) {
          const clean = t.trim().replace(/\s+/g, ' ').substring(0, 100);
          if (clean) errors.push(clean);
        }
      }

      return { errorCount, errors };
    }
    return { errorCount: -1, errors: ['Validate button not found'] };
  }

  /** Submit the application */
  async submitApplication(): Promise<boolean> {
    await this.goToSendTab();
    await this.checkAllConsents();

    const submitBtn = this.page.locator('button:has-text("Submit application")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Submit button found — clicking...');
      await submitBtn.click();
      await this.page.waitForTimeout(15000);
      return true;
    }
    console.log('Submit button not visible');
    return false;
  }

  /** Click "Validate send page" + submit (complementary info flow) */
  async submitComplementaryInfo(): Promise<boolean> {
    const validateBtn = this.page.locator('button:has-text("Validate send page")');
    if (await validateBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await validateBtn.click();
      await this.page.waitForTimeout(10_000);
    }

    const submitBtn = this.page.locator('button:has-text("Submit application"), button:has-text("Submit complementary"), button:has-text("Submit")').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await this.page.waitForTimeout(10_000);

      // Handle confirmation
      const confirmBtn = this.page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first();
      try {
        if (await confirmBtn.isVisible({ timeout: 3000 })) {
          await confirmBtn.click();
          await this.page.waitForTimeout(5000);
        }
      } catch { }
      return true;
    }
    return false;
  }

  // ── Dashboard Status ──

  /** Get the application status from the front-office dashboard */
  async getDashboardStatus(): Promise<{ status: string; cssClass: string } | null> {
    await this.page.goto('/');
    await this.page.waitForTimeout(5000);

    const badge = this.page.locator('span.status-badge, span[class*="status"]').first();
    if (await badge.isVisible({ timeout: 5000 }).catch(() => false)) {
      const status = (await badge.textContent())?.trim() || '';
      const cssClass = (await badge.getAttribute('class')) || '';
      return { status, cssClass };
    }
    return null;
  }
}
