import { test } from '@playwright/test';
import * as boHelpers from '../../helpers/backoffice-helpers';

/**
 * Diagnostic: Investigate send-back mechanism on legalReview
 *
 * Goals:
 * 1. Navigate to legalReview and catalog BOTH "Sent back to applicant" buttons
 * 2. Examine roleForm rejection fields (document-level rejection, reason textareas)
 * 3. Click the send-back button, then check what appears (dialog, textarea, etc.)
 * 4. If a reason textarea appears, fill it and confirm
 * 5. Verify task status change via API
 */

const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '873484d6-b472-4151-9801-c27bcbf7f2a2';

test('DIAG: Investigate send-back on legalReview', async ({ page }) => {
  test.setTimeout(300_000);

  // Navigate and discover process
  await page.goto('/');
  await page.waitForTimeout(3000);

  const fileInfo = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { state: data.state, processId: data.process_instance_id };
  }, FILE_ID);

  console.log(`File info: ${JSON.stringify(fileInfo)}`);
  if (fileInfo.error || !fileInfo.processId) { test.skip(); return; }
  const processId = fileInfo.processId;

  // Check tasks
  const tasks = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nTasks (${tasks.length}):`);
  for (const t of tasks) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  const legalReview = tasks.find(t => t.camundaName === 'legalReview');
  if (!legalReview || legalReview.endTime) {
    console.log('legalReview not pending — checking first pending role');
    const firstPending = tasks.find(t => !t.endTime);
    if (!firstPending) { console.log('No pending tasks'); test.skip(); return; }
    console.log(`Using: ${firstPending.camundaName}`);
  }

  // Navigate to legalReview
  const roleUrl = `/part-b/${SERVICE_ID}/legalReview/${processId}?file_id=${FILE_ID}`;
  console.log(`\nNavigating to: ${roleUrl}`);
  await page.goto(roleUrl);
  await page.waitForTimeout(6000);

  // ══════════════════════════════════════════════════════
  // PART 1: Catalog ALL buttons on each tab
  // ══════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('PART 1: Full button catalog per tab');
  console.log('='.repeat(60));

  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="tab"], .nav-link, .nav-item a'))
      .filter((t: any) => t.offsetParent !== null)
      .map((t: any) => t.textContent?.trim())
      .filter(Boolean);
  });
  console.log(`Tabs: ${JSON.stringify(tabs)}`);

  for (const tabName of tabs) {
    const tab = page.locator(`.nav-link:has-text("${tabName}")`).first();
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(2000);

      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
          .map((b: any) => ({
            text: b.textContent?.trim().substring(0, 120),
            disabled: b.disabled,
            classes: b.className.substring(0, 100),
            id: b.id || '',
            type: b.type || '',
            parentId: b.parentElement?.id || '',
            parentClass: b.parentElement?.className?.substring(0, 60) || '',
          }))
          .filter((b: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(b.text));
      });

      console.log(`\n  Tab "${tabName}" — ${buttons.length} buttons:`);
      for (const b of buttons) {
        console.log(`    "${b.text}" | disabled=${b.disabled} | id="${b.id}" | type="${b.type}" | class="${b.classes?.substring(0, 60)}" | parent="${b.parentClass}"`);
      }

      // Look for textareas
      const textareas = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('textarea'))
          .map((t: any) => ({
            visible: t.offsetParent !== null,
            name: t.name,
            id: t.id,
            placeholder: t.placeholder?.substring(0, 50),
            classes: t.className?.substring(0, 60),
            parentClass: t.parentElement?.className?.substring(0, 60),
          }));
      });
      if (textareas.length > 0) {
        console.log(`    Textareas (${textareas.length}, incl hidden):`);
        for (const t of textareas) {
          console.log(`      vis=${t.visible} name="${t.name}" id="${t.id}" class="${t.classes}" parent="${t.parentClass}"`);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // PART 2: roleForm rejection fields deep-dive
  // ══════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('PART 2: roleForm rejection/send-back fields');
  console.log('='.repeat(60));

  const rejectionFields = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.submission?.data) return 'No roleForm';

    const data = roleForm.submission.data;
    const keys = Object.keys(data);
    // Filter for rejection/correction/sendback/complement related
    const relevant = keys.filter(k => {
      const lk = k.toLowerCase();
      return lk.includes('reject') || lk.includes('correction') || lk.includes('sendback') ||
        lk.includes('sent_back') || lk.includes('sentback') || lk.includes('complement') ||
        lk.includes('reason') || lk.includes('observation') || lk.includes('comment') ||
        lk.includes('status') || lk.includes('decision') || lk.includes('action') ||
        lk.includes('return') || lk.includes('incomplete');
    });

    const result: string[] = [];
    for (const k of relevant) {
      result.push(`${k} = ${JSON.stringify(data[k])?.substring(0, 120)}`);
    }
    // Also show ALL keys for context
    result.push(`\nALL keys (${keys.length}):`);
    for (const k of keys) {
      if (k.startsWith('_')) continue;
      const val = data[k];
      const valStr = typeof val === 'string' ? val.substring(0, 60) :
        typeof val === 'object' ? JSON.stringify(val)?.substring(0, 60) : String(val);
      result.push(`  ${k} = ${valStr}`);
    }
    return result.join('\n');
  });
  console.log(rejectionFields);

  // ══════════════════════════════════════════════════════
  // PART 3: Form component tree (focus on rejection/action components)
  // ══════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('PART 3: Form component tree');
  console.log('='.repeat(60));

  const componentTree = await page.evaluate(() => {
    const roleForm = (window as any).roleForm;
    if (!roleForm?.root) return 'No roleForm root';

    const lines: string[] = [];
    const walk = (comp: any, depth: number) => {
      if (!comp) return;
      const key = comp.component?.key || comp.key || '';
      const type = comp.component?.type || comp.type || '';
      const label = comp.component?.label || '';
      const hidden = comp.component?.hidden || false;
      const cond = comp.component?.conditional ? JSON.stringify(comp.component.conditional).substring(0, 80) : '';
      const values = comp.component?.values ?
        comp.component.values.map((v: any) => `${v.label}=${v.value}`).join(', ').substring(0, 100) : '';

      if (key) {
        let line = `${'  '.repeat(depth)}${key} (${type})`;
        if (label) line += ` — "${label.substring(0, 40)}"`;
        if (hidden) line += ' [HIDDEN]';
        if (values) line += ` VALUES: [${values}]`;
        if (cond) line += ` COND: ${cond}`;
        lines.push(line);
      }

      if (comp.components) for (const c of comp.components) walk(c, depth + 1);
      if (comp.columns) for (const col of comp.columns) {
        if (col?.components) for (const c of col.components) walk(c, depth + 1);
      }
      if (comp.rows) for (const row of comp.rows) {
        if (Array.isArray(row)) for (const cell of row) {
          if (cell?.components) for (const c of cell.components) walk(c, depth + 1);
        }
      }
    };
    walk(roleForm.root, 0);
    return lines.join('\n');
  });
  console.log(componentTree);

  // ══════════════════════════════════════════════════════
  // PART 4: Click "Sent back to applicant" and observe
  // ══════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('PART 4: Click send-back and observe changes');
  console.log('='.repeat(60));

  // Go to Processing tab first
  const procTab = page.locator('.nav-link:has-text("Processing")').first();
  if (await procTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await procTab.click();
    await page.waitForTimeout(2000);
  }

  // Find ALL "Sent back to applicant" buttons and get details
  const sentBackBtns = page.locator('button:has-text("Sent back to applicant")');
  const sbCount = await sentBackBtns.count();
  console.log(`\nFound ${sbCount} "Sent back to applicant" buttons`);

  for (let i = 0; i < sbCount; i++) {
    const btn = sentBackBtns.nth(i);
    const info = await btn.evaluate((el: any) => ({
      text: el.textContent?.trim(),
      disabled: el.disabled,
      id: el.id,
      classes: el.className,
      onclick: el.getAttribute('onclick')?.substring(0, 100),
      parentHTML: el.parentElement?.outerHTML?.substring(0, 200),
    }));
    console.log(`  Button ${i}: ${JSON.stringify(info, null, 2)}`);
  }

  if (sbCount === 0) {
    // Fallback: check for any send-back variant
    const allBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter((b: any) => b.offsetParent !== null)
        .map((b: any) => b.textContent?.trim())
        .filter(Boolean)
        .filter((t: any) => t.toLowerCase().includes('send') || t.toLowerCase().includes('sent') ||
          t.toLowerCase().includes('back') || t.toLowerCase().includes('return') ||
          t.toLowerCase().includes('reject') || t.toLowerCase().includes('correction'));
    });
    console.log(`  Fallback buttons matching send/back/reject: ${JSON.stringify(allBtns)}`);
    console.log('  No send-back buttons found — stopping');
    return;
  }

  // Set up dialog listener BEFORE clicking
  page.on('dialog', async (dialog) => {
    console.log(`  *** DIALOG appeared: type="${dialog.type()}" message="${dialog.message()?.substring(0, 200)}"`);
    await dialog.accept();
  });

  // Listen for page changes
  const pageStatesBefore = await page.evaluate(() => ({
    url: window.location.href,
    bodyLen: document.body.innerHTML.length,
    visibleTextareas: document.querySelectorAll('textarea').length,
    visibleModals: document.querySelectorAll('.modal.show, .modal.fade.show, [class*="modal"][style*="display: block"]').length,
  }));
  console.log(`\nState BEFORE click: ${JSON.stringify(pageStatesBefore)}`);

  // Click the FIRST "Sent back to applicant" button
  console.log('\nClicking button 0...');
  const firstBtn = sentBackBtns.first();
  await firstBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Screenshot before click
  await page.screenshot({ path: '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback/before-click.png', fullPage: true });

  await firstBtn.click();
  console.log('  Clicked! Waiting 3s...');
  await page.waitForTimeout(3000);

  // Screenshot immediately after click
  await page.screenshot({ path: '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback/after-click-3s.png', fullPage: true });

  // Check what changed
  const pageStatesAfter = await page.evaluate(() => ({
    url: window.location.href,
    bodyLen: document.body.innerHTML.length,
    visibleTextareas: Array.from(document.querySelectorAll('textarea'))
      .filter((t: any) => t.offsetParent !== null).length,
    allTextareas: document.querySelectorAll('textarea').length,
    visibleModals: document.querySelectorAll('.modal.show, .modal.fade.show, [class*="modal"][style*="display: block"]').length,
    newAlerts: Array.from(document.querySelectorAll('.alert, .notification, [class*="toast"]'))
      .filter((a: any) => a.offsetParent !== null)
      .map((a: any) => a.textContent?.trim().substring(0, 100)),
    // Check for any new overlays or popups
    overlays: Array.from(document.querySelectorAll('[class*="overlay"], [class*="popup"], [class*="dialog"], .swal2-container, .sweet-alert'))
      .filter((o: any) => o.offsetParent !== null)
      .map((o: any) => ({ class: o.className?.substring(0, 60), text: o.textContent?.trim().substring(0, 150) })),
  }));
  console.log(`\nState AFTER click: ${JSON.stringify(pageStatesAfter, null, 2)}`);

  // Check for SweetAlert or custom confirmation
  const sweetAlert = await page.evaluate(() => {
    const swal = document.querySelector('.swal2-container, .sweet-alert, .swal-overlay');
    if (!swal) return null;
    return {
      visible: (swal as any).offsetParent !== null || (swal as any).style?.display !== 'none',
      text: swal.textContent?.trim().substring(0, 300),
      html: swal.innerHTML?.substring(0, 500),
    };
  });
  console.log(`\nSweetAlert: ${JSON.stringify(sweetAlert)}`);

  // Check for any new forms/inputs that appeared
  const newInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
      .filter((el: any) => el.offsetParent !== null)
      .map((el: any) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder?.substring(0, 50) || '',
        classes: el.className?.substring(0, 60) || '',
      }))
      .filter((el: any) => !['NPNELSON PEREZ', 'en'].some(x => el.name?.includes(x)));
  });
  console.log(`\nVisible inputs after click (${newInputs.length}):`);
  for (const inp of newInputs.slice(0, 30)) {
    console.log(`  <${inp.tag} type="${inp.type}" name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}">`);
  }

  // Wait more and check again
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback/after-click-8s.png', fullPage: true });

  // Re-check buttons (did any new ones appear? did old ones disappear?)
  const buttonsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter((b: any) => b.offsetParent !== null && b.textContent?.trim())
      .map((b: any) => b.textContent?.trim().substring(0, 100))
      .filter((t: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(t));
  });
  console.log(`\nButtons after click: ${JSON.stringify(buttonsAfter)}`);

  // Check task status via API
  const tasksAfter = await boHelpers.getProcessTasks(page, processId);
  console.log(`\nTasks after click:`);
  for (const t of tasksAfter) {
    const done = t.endTime ? 'DONE' : 'PEND';
    console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
  }

  // Was a complementaryInformation task created?
  const compInfo = tasksAfter.find(t => t.camundaName.includes('complement') || t.camundaName.includes('Complement'));
  console.log(`\nComplementary info task: ${compInfo ? JSON.stringify(compInfo) : 'NOT FOUND'}`);

  // Check file state
  const fileState = await page.evaluate(async (fid: string) => {
    const resp = await fetch(`/backend/files/${fid}`);
    if (!resp.ok) return 'error';
    const data = await resp.json();
    return { state: data.state, processStatus: data.process_status };
  }, FILE_ID);
  console.log(`\nFile state: ${JSON.stringify(fileState)}`);

  // ══════════════════════════════════════════════════════
  // PART 5: If click didn't work, try the SECOND button
  // ══════════════════════════════════════════════════════
  const lrTask = tasksAfter.find(t => t.camundaName === 'legalReview');
  if (lrTask && !lrTask.endTime && sbCount > 1) {
    console.log('\n' + '='.repeat(60));
    console.log('PART 5: First button didn\'t change status. Try button 1...');
    console.log('='.repeat(60));

    // Re-navigate to refresh the page
    await page.goto(roleUrl);
    await page.waitForTimeout(6000);

    // Go to Processing tab
    const procTab2 = page.locator('.nav-link:has-text("Processing")').first();
    if (await procTab2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procTab2.click();
      await page.waitForTimeout(2000);
    }

    const sentBackBtns2 = page.locator('button:has-text("Sent back to applicant")');
    const sbCount2 = await sentBackBtns2.count();
    console.log(`Found ${sbCount2} buttons after re-navigation`);

    if (sbCount2 > 1) {
      const secondBtn = sentBackBtns2.nth(1);
      const info2 = await secondBtn.evaluate((el: any) => ({
        text: el.textContent?.trim(),
        disabled: el.disabled,
        classes: el.className,
        parentHTML: el.parentElement?.outerHTML?.substring(0, 300),
      }));
      console.log(`Second button: ${JSON.stringify(info2, null, 2)}`);

      await secondBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback/before-second-click.png', fullPage: true });

      console.log('Clicking second button...');
      await secondBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/screenshots/diag-sendback/after-second-click.png', fullPage: true });

      // Check for modals/dialogs/textareas
      const afterSecond = await page.evaluate(() => ({
        visibleTextareas: Array.from(document.querySelectorAll('textarea'))
          .filter((t: any) => t.offsetParent !== null)
          .map((t: any) => ({
            name: t.name, id: t.id, placeholder: t.placeholder?.substring(0, 50),
            class: t.className?.substring(0, 60),
          })),
        modals: Array.from(document.querySelectorAll('.modal.show, .modal.fade.show, .swal2-container, [class*="dialog"]'))
          .filter((m: any) => m.offsetParent !== null || (m as any).style?.display !== 'none')
          .map((m: any) => ({
            class: m.className?.substring(0, 80),
            text: m.textContent?.trim().substring(0, 200),
          })),
        buttons: Array.from(document.querySelectorAll('button'))
          .filter((b: any) => b.offsetParent !== null)
          .map((b: any) => b.textContent?.trim().substring(0, 80))
          .filter((t: any) => !['NPNELSON PEREZ', 'en', 'NP'].includes(t)),
      }));
      console.log(`\nAfter second click: ${JSON.stringify(afterSecond, null, 2)}`);

      await page.waitForTimeout(5000);

      // Final task check
      const tasksFinal = await boHelpers.getProcessTasks(page, processId);
      console.log(`\nFinal tasks:`);
      for (const t of tasksFinal) {
        const done = t.endTime ? 'DONE' : 'PEND';
        console.log(`  [${done}] ${t.camundaName} — ${t.shortname} — ${t.status}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
});
