import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Structured data capture during test execution.
 *
 * Captures every field fill, button click, state change, and screenshot
 * into a JSON execution log that can be used to generate manuals.
 *
 * Naming convention: P{phase}-S{step}-{description}.png
 */

export interface FieldEntry {
  type: 'field';
  timestamp: string;
  key: string;
  label?: string;
  value: string;
  fieldType: string; // text, email, number, select, radio, checkbox, file, survey
  tab: string;
  section?: string;
}

export interface ButtonEntry {
  type: 'button';
  timestamp: string;
  text: string;
  result: 'clicked' | 'disabled' | 'not_found';
  tab?: string;
}

export interface StateChangeEntry {
  type: 'state_change';
  timestamp: string;
  description: string;
  before: string;
  after: string;
  screenshotPath?: string;
}

export interface ScreenshotEntry {
  type: 'screenshot';
  timestamp: string;
  path: string;
  description: string;
  phase: number;
  step: number;
}

export interface NavigationEntry {
  type: 'navigation';
  timestamp: string;
  description: string;
  url: string;
  tab?: string;
  section?: string;
}

export interface ErrorEntry {
  type: 'error';
  timestamp: string;
  description: string;
  details?: string;
}

export type LogEntry = FieldEntry | ButtonEntry | StateChangeEntry | ScreenshotEntry | NavigationEntry | ErrorEntry;

export class ExecutionLogger {
  private entries: LogEntry[] = [];
  private currentTab = '';
  private currentSection = '';
  private phase: number;
  private stepCounter = 0;
  private screenshotDir: string;

  constructor(
    private page: Page,
    opts: {
      phase: number;
      screenshotDir: string;
    },
  ) {
    this.phase = opts.phase;
    this.screenshotDir = opts.screenshotDir;
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }

  // ── Context ──

  setTab(tab: string): void {
    this.currentTab = tab;
    this.addNavigation(`Switched to tab: ${tab}`, this.page.url(), tab);
  }

  setSection(section: string): void {
    this.currentSection = section;
    this.addNavigation(`Switched to section: ${section}`, this.page.url(), this.currentTab, section);
  }

  // ── Logging ──

  logField(key: string, value: string, fieldType: string, label?: string): void {
    this.entries.push({
      type: 'field',
      timestamp: new Date().toISOString(),
      key,
      label,
      value,
      fieldType,
      tab: this.currentTab,
      section: this.currentSection,
    });
  }

  logButton(text: string, result: 'clicked' | 'disabled' | 'not_found'): void {
    this.entries.push({
      type: 'button',
      timestamp: new Date().toISOString(),
      text,
      result,
      tab: this.currentTab,
    });
  }

  logStateChange(description: string, before: string, after: string, screenshotPath?: string): void {
    this.entries.push({
      type: 'state_change',
      timestamp: new Date().toISOString(),
      description,
      before,
      after,
      screenshotPath,
    });
  }

  logError(description: string, details?: string): void {
    this.entries.push({
      type: 'error',
      timestamp: new Date().toISOString(),
      description,
      details,
    });
  }

  private addNavigation(description: string, url: string, tab?: string, section?: string): void {
    this.entries.push({
      type: 'navigation',
      timestamp: new Date().toISOString(),
      description,
      url,
      tab,
      section,
    });
  }

  // ── Screenshot ──

  /** Take a named screenshot following the naming convention */
  async screenshot(description: string, fullPage = true): Promise<string> {
    this.stepCounter++;
    const filename = `P${this.phase}-S${String(this.stepCounter).padStart(2, '0')}-${description.replace(/\s+/g, '-').toLowerCase()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    try {
      await this.page.screenshot({ path: filepath, fullPage, timeout: 30000 });
    } catch {
      // Fallback to viewport-only screenshot if fullPage times out
      try {
        await this.page.screenshot({ path: filepath, fullPage: false, timeout: 15000 });
      } catch { /* skip screenshot entirely */ }
    }

    this.entries.push({
      type: 'screenshot',
      timestamp: new Date().toISOString(),
      path: filepath,
      description,
      phase: this.phase,
      step: this.stepCounter,
    });

    return filepath;
  }

  // ── Export ──

  /** Get all entries */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /** Get summary statistics */
  getSummary(): {
    totalEntries: number;
    fields: number;
    buttons: number;
    screenshots: number;
    errors: number;
    tabs: string[];
  } {
    const tabs = new Set<string>();
    let fields = 0, buttons = 0, screenshots = 0, errors = 0;
    for (const e of this.entries) {
      if (e.type === 'field') { fields++; if (e.tab) tabs.add(e.tab); }
      if (e.type === 'button') buttons++;
      if (e.type === 'screenshot') screenshots++;
      if (e.type === 'error') errors++;
    }
    return {
      totalEntries: this.entries.length,
      fields,
      buttons,
      screenshots,
      errors,
      tabs: [...tabs],
    };
  }

  /** Save log to JSON file */
  save(outputPath: string): void {
    const data = {
      metadata: {
        phase: this.phase,
        generatedAt: new Date().toISOString(),
        totalEntries: this.entries.length,
        summary: this.getSummary(),
      },
      entries: this.entries,
    };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\nExecution log saved: ${outputPath} (${this.entries.length} entries)`);
  }
}

/**
 * Wrapper functions that both perform an action AND log it.
 * Use these instead of raw form-helpers when you want structured capture.
 */
export class LoggedFormFiller {
  constructor(
    private page: Page,
    private logger: ExecutionLogger,
  ) {}

  async fillText(componentKey: string, value: string, label?: string): Promise<boolean> {
    const { fillText } = await import('./form-helpers');
    const result = await fillText(this.page, componentKey, value);
    this.logger.logField(componentKey, value, 'text', label);
    return result;
  }

  async fillEmail(componentKey: string, value: string, label?: string): Promise<boolean> {
    const { fillEmail } = await import('./form-helpers');
    const result = await fillEmail(this.page, componentKey, value);
    this.logger.logField(componentKey, value, 'email', label);
    return result;
  }

  async typeText(componentKey: string, value: string, label?: string): Promise<boolean> {
    const { typeText } = await import('./form-helpers');
    const result = await typeText(this.page, componentKey, value);
    this.logger.logField(componentKey, value, 'masked-text', label);
    return result;
  }

  async fillNumber(componentKey: string, value: string, label?: string): Promise<boolean> {
    const { fillNumber } = await import('./form-helpers');
    const result = await fillNumber(this.page, componentKey, value);
    this.logger.logField(componentKey, value, 'number', label);
    return result;
  }

  async searchAndSelect(componentKey: string, searchTerm: string, label?: string): Promise<boolean> {
    const { searchAndSelect } = await import('./form-helpers');
    const result = await searchAndSelect(this.page, componentKey, searchTerm);
    this.logger.logField(componentKey, searchTerm, 'select', label);
    return result;
  }

  async clickRadio(componentKey: string, labelText: string, label?: string): Promise<boolean> {
    const { clickRadioLabel } = await import('./form-helpers');
    const result = await clickRadioLabel(this.page, componentKey, labelText);
    this.logger.logField(componentKey, labelText, 'radio', label);
    return result;
  }

  async checkBox(componentKey: string, label?: string): Promise<boolean> {
    const { checkBox } = await import('./form-helpers');
    const result = await checkBox(this.page, componentKey);
    this.logger.logField(componentKey, 'true', 'checkbox', label);
    return result;
  }

  async uploadFile(componentKey: string, filePath: string, label?: string): Promise<boolean> {
    const { uploadFile } = await import('./form-helpers');
    const result = await uploadFile(this.page, componentKey, filePath);
    this.logger.logField(componentKey, path.basename(filePath), 'file', label);
    return result;
  }

  async uploadGenericBrowse(filePath: string, label?: string): Promise<boolean> {
    const { uploadGenericBrowse } = await import('./form-helpers');
    const result = await uploadGenericBrowse(this.page, filePath);
    this.logger.logField('generic-browse', path.basename(filePath), 'file', label);
    return result;
  }

  async clickButton(text: string): Promise<void> {
    const btn = this.page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      const disabled = await btn.isDisabled();
      if (disabled) {
        this.logger.logButton(text, 'disabled');
      } else {
        await btn.click();
        this.logger.logButton(text, 'clicked');
      }
    } else {
      this.logger.logButton(text, 'not_found');
    }
  }
}
