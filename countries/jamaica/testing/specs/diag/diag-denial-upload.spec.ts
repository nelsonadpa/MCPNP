import { test } from '@playwright/test';
import path from 'path';
import * as boHelpers from '../../helpers/backoffice-helpers';
import * as formHelpers from '../../helpers/form-helpers';

/**
 * Upload the SEZ Denial letter and complete the denialLetter role
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '9621433e-0fdb-4765-8c49-907ddc516d1f';
const TEST_PDF = path.resolve(__dirname, '../../test-data/documents/TEST-certificate-of-incorporation.pdf');

test('Complete denialLetter with file upload', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  const processId = fileInfo.processId;
  console.log(`File: ${JSON.stringify(fileInfo)}`);

  await boHelpers.navigateToRole(page, SERVICE_ID, 'denialLetter', processId, FILE_ID);
  await page.waitForTimeout(6000);

  // Go to Processing tab
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(3000);
  }

  // Step 1: Click "Download SEZ Denial letter" to generate it
  console.log('Step 1: Generating denial letter...');
  const downloadBtn = page.locator('button:has-text("Download SEZ Denial letter")').first();
  if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await downloadBtn.click();
    await page.waitForTimeout(10000); // Wait for generation

    // Check if a new tab opened
    const pages = page.context().pages();
    console.log(`  Browser tabs: ${pages.length}`);
    if (pages.length > 1) {
      const newPage = pages[pages.length - 1];
      console.log(`  New tab URL: ${newPage.url()}`);
      // Close the new tab
      await newPage.close();
    }
  }

  // Step 2: Check if the file field was auto-populated
  const fileValue = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return undefined;
    return roleForm.submission.data.denialLettersSezPreApprovalLetter;
  });
  console.log(`  File field value: ${JSON.stringify(fileValue)?.substring(0, 100)}`);

  // Step 3: If not auto-populated, look for browse link and upload
  if (!fileValue || (Array.isArray(fileValue) && fileValue.length === 0)) {
    console.log('\nStep 2: File not auto-populated. Looking for upload mechanism...');

    // Go to Documents tab where the file component might be
    const docsTab = page.locator('.nav-link:has-text("Documents")').first();
    if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(3000);
    }

    // Look for browse links (file upload triggers)
    const browseLinks = page.locator('a.browse:visible, a:has-text("browse"):visible');
    const browseCount = await browseLinks.count();
    console.log(`  Browse links visible: ${browseCount}`);

    // Look for the denial letter upload specifically
    // Find all Formio file components and their labels
    const fileComponents = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.formio-component-file'))
        .filter((el: any) => el.offsetParent !== null)
        .map((el: any) => ({
          label: el.querySelector('label')?.textContent?.trim().substring(0, 60) || '',
          ref: el.getAttribute('ref') || '',
          hasBrowse: !!el.querySelector('a.browse'),
          hasFiles: el.querySelectorAll('.fileUploadTable, .formio-component-file-image').length > 0,
          classes: el.className?.substring(0, 80),
        }));
    });
    console.log(`  File components visible: ${fileComponents.length}`);
    for (const fc of fileComponents) {
      console.log(`    label="${fc.label}" hasBrowse=${fc.hasBrowse} hasFiles=${fc.hasFiles}`);
    }

    // Go back to Processing tab — the file upload might be there
    if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab.click();
      await page.waitForTimeout(3000);
    }

    // Look for file upload on processing tab
    const procFileComponents = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.formio-component-file'))
        .filter((el: any) => el.offsetParent !== null)
        .map((el: any) => ({
          label: el.querySelector('label')?.textContent?.trim().substring(0, 60) || '',
          hasBrowse: !!el.querySelector('a.browse'),
          browseVisible: el.querySelector('a.browse')?.offsetParent !== null,
        }));
    });
    console.log(`\n  Processing tab file components: ${procFileComponents.length}`);
    for (const fc of procFileComponents) {
      console.log(`    label="${fc.label}" hasBrowse=${fc.hasBrowse} browseVisible=${fc.browseVisible}`);
    }

    // Try to find and click ANY browse link
    const anyBrowse = page.locator('a.browse:visible').first();
    if (await anyBrowse.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('\n  Found browse link — uploading test PDF...');
      try {
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 10000 }),
          anyBrowse.click(),
        ]);
        await fc.setFiles(TEST_PDF);
        await page.waitForTimeout(10000);
        console.log('  File uploaded');
      } catch (e: any) {
        console.log(`  Upload failed: ${e.message?.substring(0, 100)}`);
      }
    } else {
      console.log('  No browse link visible');

      // Check ALL tabs for browse links
      const tabs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.nav-link'))
          .filter((el: any) => el.offsetParent !== null)
          .map((el: any) => el.textContent?.trim())
          .filter((t: any) => t && t.length < 40 && !['NP', 'en', 'NPNELSON PEREZ'].includes(t));
      });

      for (const tabName of tabs) {
        const tab = page.locator('.nav-link').filter({ hasText: tabName }).first();
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(2000);

          const browseOnTab = page.locator('a.browse:visible').first();
          if (await browseOnTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`\n  Found browse link on "${tabName}" tab — uploading...`);
            try {
              const [fc] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 10000 }),
                browseOnTab.click(),
              ]);
              await fc.setFiles(TEST_PDF);
              await page.waitForTimeout(10000);
              console.log('  File uploaded');
            } catch (e: any) {
              console.log(`  Upload failed: ${e.message?.substring(0, 100)}`);
            }
            break;
          }
        }
      }
    }
  }

  // Step 3: Save and try Approve
  console.log('\nStep 3: Saving and approving...');

  // Go back to Processing tab
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(2000);
  }

  await formHelpers.enableFormValidation(page);
  await formHelpers.saveDraft(page);
  await page.waitForTimeout(3000);

  const approveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
  if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await approveBtn.click({ timeout: 10_000 });
    await page.waitForTimeout(5000);
    await boHelpers.handleConfirmation(page);
    await page.waitForTimeout(10000);

    const toasts = await boHelpers.getToastMessages(page);
    console.log(`  Toasts: ${JSON.stringify(toasts)}`);
  }

  await page.screenshot({ path: '/tmp/denial-upload-result.png', fullPage: true });

  // Check final status
  const finalTasks = await boHelpers.getProcessTasks(page, processId);
  const denialAfter = finalTasks.find(t => t.camundaName === 'denialLetter');
  console.log(`\n  denialLetter: status=${denialAfter?.status}, endTime=${denialAfter?.endTime}`);

  const finalPending = finalTasks.filter(t => !t.endTime);
  console.log(`  Remaining pending: ${finalPending.map(t => t.camundaName).join(', ') || 'none'}`);

  const processStatus = await boHelpers.getProcessStatus(page, processId);
  console.log(`  Process: ended=${processStatus.ended} status=${processStatus.processStatus}`);

  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { state: 'unknown' };
    const data = await resp.json();
    return { state: data.state };
  }, FILE_ID);
  console.log(`  File state: ${fileState.state}`);

  console.log('\n\nDone.');
});
