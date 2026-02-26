import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Verify final application status after all 21 back-office tasks completed
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2-final');
const SERVICE_ID = 'd51d6c78-5ead-c948-0b82-0d9bc71cd712';
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('Verify final application status', async ({ page }) => {
  test.setTimeout(300_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // ══════════════════════════════════════════════════════════
  // 1. Check process API — all tasks status
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 1. Process API — Task Status ══');
  await page.goto('/');
  await page.waitForTimeout(3000);

  const processData = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return { error: `${resp.status} ${resp.statusText}` };
    const data = await resp.json();
    return {
      processId: data.id,
      status: data.status,
      startTime: data.startTime,
      endTime: data.endTime,
      totalTasks: (data.tasks || []).length,
      pendingTasks: (data.tasks || []).filter((t: any) => !t.endTime).length,
      completedTasks: (data.tasks || []).filter((t: any) => !!t.endTime).length,
      tasks: (data.tasks || []).map((t: any) => ({
        camundaName: t.camundaName,
        shortname: t.shortname,
        status: t.status,
        done: !!t.endTime,
        assignee: t.assignee,
      })),
      // Check for any extra fields
      rawKeys: Object.keys(data),
    };
  });

  if ('error' in processData) {
    console.log(`  ERROR: ${processData.error}`);
  } else {
    console.log(`  Process status: ${processData.status}`);
    console.log(`  Start time: ${processData.startTime}`);
    console.log(`  End time: ${processData.endTime || 'still running'}`);
    console.log(`  Total tasks: ${processData.totalTasks}`);
    console.log(`  Completed: ${processData.completedTasks}`);
    console.log(`  Pending: ${processData.pendingTasks}`);
    console.log(`  Raw keys: ${processData.rawKeys.join(', ')}`);
    console.log('  ─────────────────────────────────');
    for (const t of processData.tasks) {
      const icon = t.done ? '✓' : '○';
      console.log(`  ${icon} ${t.camundaName} (${t.shortname}) — ${t.status} [${t.assignee}]`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. Check file API — application file status
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 2. File API — Application Status ══');

  const fileData = await page.evaluate(async () => {
    const resp = await fetch('/backend/file/8681df73-af32-45d6-8af1-30d5a7b0b6a1');
    if (!resp.ok) return { error: `${resp.status} ${resp.statusText}` };
    const data = await resp.json();
    return {
      id: data.id,
      status: data.status,
      label: data.label,
      uniqueId: data.uniqueId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      serviceName: data.serviceName,
      rawKeys: Object.keys(data).slice(0, 30),
    };
  });

  if ('error' in fileData) {
    console.log(`  ERROR: ${fileData.error}`);
    // Try alternate endpoints
    for (const ep of [
      `/backend/files/${FILE_ID}`,
      `/backend/my-files/${FILE_ID}`,
      `/backend/services/${SERVICE_ID}/files/${FILE_ID}`,
    ]) {
      const alt = await page.evaluate(async (url) => {
        const resp = await fetch(url);
        return { url, status: resp.status, ok: resp.ok };
      }, ep);
      console.log(`  Alt ${alt.url}: ${alt.status}`);
    }
  } else {
    console.log(`  File ID: ${fileData.id}`);
    console.log(`  Status: ${fileData.status}`);
    console.log(`  Label: ${fileData.label}`);
    console.log(`  Unique ID: ${fileData.uniqueId}`);
    console.log(`  Service: ${fileData.serviceName}`);
    console.log(`  Created: ${fileData.createdAt}`);
    console.log(`  Updated: ${fileData.updatedAt}`);
    console.log(`  Keys: ${fileData.rawKeys.join(', ')}`);
  }

  // ══════════════════════════════════════════════════════════
  // 3. Front-office dashboard — "My applications"
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 3. Front-office Dashboard ══');
  await page.goto('/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png`, fullPage: true });

  // Expand "My applications" if collapsed
  const myApps = page.locator('text="My applications"').first();
  if (await myApps.isVisible().catch(() => false)) {
    await myApps.click();
    await page.waitForTimeout(2000);
  }

  // Find our application row
  const appRow = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr, [class*="list-item"], [class*="application"]');
    const results: any[] = [];
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('TEST-SEZ') || text.includes('Establish') || text.includes('8681df73')) {
        // Get all visible text content
        const cells = row.querySelectorAll('td, [class*="col"], span, badge');
        const cellTexts = Array.from(cells)
          .map(c => c.textContent?.trim())
          .filter(t => t && t.length > 0 && t.length < 100);

        // Get badge/status elements
        const badges = row.querySelectorAll('.badge, [class*="badge"], [class*="status"]');
        const badgeTexts = Array.from(badges).map(b => ({
          text: b.textContent?.trim(),
          class: (b as HTMLElement).className,
        }));

        // Get links
        const links = row.querySelectorAll('a[href]');
        const linkData = Array.from(links).map(a => ({
          text: a.textContent?.trim().substring(0, 40),
          href: (a as HTMLAnchorElement).getAttribute('href'),
        }));

        results.push({
          fullText: text.substring(0, 300),
          cellTexts: cellTexts.slice(0, 15),
          badges: badgeTexts,
          links: linkData,
          html: (row as HTMLElement).innerHTML.substring(0, 500),
        });
      }
    }
    return results;
  });

  if (appRow.length === 0) {
    console.log('  Application row not found in dashboard');
  } else {
    for (const row of appRow) {
      console.log(`  Full text: ${row.fullText}`);
      console.log(`  Cells: ${JSON.stringify(row.cellTexts)}`);
      console.log(`  Badges: ${JSON.stringify(row.badges)}`);
      console.log(`  Links: ${JSON.stringify(row.links)}`);
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-my-applications.png`, fullPage: true });

  // ══════════════════════════════════════════════════════════
  // 4. Navigate to the application detail page
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 4. Application Detail ══');
  await page.goto(`/services/${SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-application-detail.png`, fullPage: true });

  // Get page content
  const detailContent = await page.evaluate(() => {
    const results: any = {};

    // Headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
    results.headings = Array.from(headings)
      .filter(h => (h as HTMLElement).offsetParent !== null)
      .map(h => h.textContent?.trim().substring(0, 80));

    // Tabs
    const tabs = document.querySelectorAll('.nav-link, a[role="tab"]');
    results.tabs = Array.from(tabs)
      .filter(t => (t as HTMLElement).offsetParent !== null)
      .map(t => ({
        text: t.textContent?.trim(),
        active: t.classList.contains('active'),
      }));

    // Buttons
    const buttons = document.querySelectorAll('button');
    results.buttons = Array.from(buttons)
      .filter(b => (b as HTMLElement).offsetParent !== null && b.textContent?.trim())
      .map(b => ({
        text: b.textContent?.trim().substring(0, 80),
        disabled: (b as HTMLButtonElement).disabled,
      }))
      .filter(b => !['NPNELSON PEREZ', 'en'].includes(b.text));

    // Alerts/messages
    const alerts = document.querySelectorAll('.alert, [class*="alert"], [class*="message"], [class*="info-box"]');
    results.alerts = Array.from(alerts)
      .filter(a => (a as HTMLElement).offsetParent !== null)
      .map(a => ({
        text: a.textContent?.trim().substring(0, 200),
        class: (a as HTMLElement).className.substring(0, 60),
      }));

    // Status badges
    const badges = document.querySelectorAll('.badge, [class*="badge"], [class*="status"]');
    results.badges = Array.from(badges)
      .filter(b => (b as HTMLElement).offsetParent !== null)
      .map(b => ({
        text: b.textContent?.trim(),
        class: (b as HTMLElement).className.substring(0, 60),
      }))
      .filter(b => b.text && b.text.length < 60);

    // Any download links (certificates, documents)
    const downloads = document.querySelectorAll('a[download], a[href*="download"], a[href*="certificate"], a[href*="document"], a[href*="pdf"]');
    results.downloads = Array.from(downloads)
      .filter(d => (d as HTMLElement).offsetParent !== null)
      .map(d => ({
        text: d.textContent?.trim().substring(0, 60),
        href: (d as HTMLAnchorElement).getAttribute('href')?.substring(0, 100),
      }));

    return results;
  });

  console.log('  Headings:', JSON.stringify(detailContent.headings));
  console.log('  Tabs:', JSON.stringify(detailContent.tabs));
  console.log('  Buttons:', JSON.stringify(detailContent.buttons));
  console.log('  Alerts:', JSON.stringify(detailContent.alerts));
  console.log('  Badges:', JSON.stringify(detailContent.badges));
  console.log('  Downloads:', JSON.stringify(detailContent.downloads));

  // ══════════════════════════════════════════════════════════
  // 5. Check back-office Part B list for the application
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 5. Back-office Part B list ══');
  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-partb-list.png`, fullPage: true });

  // Find our application in the list
  const partBRow = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('TEST-SEZ') || text.includes('8681df73')) {
        const cells = row.querySelectorAll('td');
        return {
          cellTexts: Array.from(cells).map(c => c.textContent?.trim().substring(0, 80)),
          html: (row as HTMLElement).innerHTML.substring(0, 500),
        };
      }
    }
    return null;
  });

  if (partBRow) {
    console.log('  Found in Part B:');
    for (const cell of partBRow.cellTexts) {
      console.log(`    ${cell}`);
    }
  } else {
    console.log('  Application not found in Part B list — may have moved to completed/archive');
  }

  // ══════════════════════════════════════════════════════════
  // 6. Check if there's a certificate or final document
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 6. Check for certificates/final documents ══');

  const certData = await page.evaluate(async () => {
    // Try various API endpoints for certificates/documents
    const endpoints = [
      '/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add/documents',
      '/backend/file/8681df73-af32-45d6-8af1-30d5a7b0b6a1/documents',
      '/backend/file/8681df73-af32-45d6-8af1-30d5a7b0b6a1/certificates',
      '/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add/print-documents',
    ];

    const results: any = {};
    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep);
        results[ep] = {
          status: resp.status,
          ok: resp.ok,
          data: resp.ok ? await resp.json().catch(() => 'parse error') : null,
        };
      } catch (e: any) {
        results[ep] = { error: e.message };
      }
    }

    // Also re-fetch the full process data for completeness
    const processResp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (processResp.ok) {
      const data = await processResp.json();
      results.processStatus = data.status;
      results.processEndTime = data.endTime;
      results.processKeys = Object.keys(data);
      // Check for any document/certificate-related keys
      for (const key of Object.keys(data)) {
        if (key.toLowerCase().includes('doc') || key.toLowerCase().includes('cert') || key.toLowerCase().includes('print') || key.toLowerCase().includes('letter')) {
          results[`process.${key}`] = JSON.stringify(data[key]).substring(0, 200);
        }
      }
    }

    return results;
  });

  for (const [key, val] of Object.entries(certData)) {
    const s = JSON.stringify(val) ?? 'undefined';
    console.log(`  ${key}: ${s.substring(0, 200)}`);
  }

  // ══════════════════════════════════════════════════════════
  // 7. Check the file data from the process endpoint
  // ══════════════════════════════════════════════════════════
  console.log('\n══ 7. Full process + file data ══');

  const fullData = await page.evaluate(async () => {
    const resp = await fetch('/backend/process/84e53b18-12b2-11f1-899e-b6594fb67add');
    if (!resp.ok) return { error: resp.status };
    const data = await resp.json();

    // Get everything except tasks (already printed above)
    const { tasks, ...rest } = data;
    // Stringify and truncate each value
    const result: any = {};
    for (const [k, v] of Object.entries(rest)) {
      const str = JSON.stringify(v);
      result[k] = str.length > 200 ? str.substring(0, 200) + '...' : str;
    }
    return result;
  });

  for (const [key, val] of Object.entries(fullData)) {
    console.log(`  ${key}: ${String(val).substring(0, 200)}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-final.png`, fullPage: true });
  console.log('\n══ VERIFICATION COMPLETE ══');
});
