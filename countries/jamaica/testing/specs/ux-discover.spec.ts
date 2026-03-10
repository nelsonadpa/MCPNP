import { test } from '@playwright/test';

/**
 * Quick discovery: find active file/process for MAIN service.
 * Run: npx playwright test specs/ux-discover.spec.ts --project=jamaica-frontoffice --headed
 */
const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';

test('Discover active files and processes', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.waitForTimeout(3000);

  // 1. Get files and their structure
  console.log('\n=== Files API ===');
  const filesResult = await page.evaluate(async (sid: string) => {
    const r = await fetch(`/backend/files?serviceId=${sid}&page=1&page_size=5`);
    const text = await r.text();
    try {
      const data = JSON.parse(text);
      const items = data.results || data;
      if (Array.isArray(items) && items.length > 0) {
        return {
          count: data.count || items.length,
          keys: Object.keys(items[0]),
          samples: items.slice(0, 3).map((f: any) => JSON.stringify(f).substring(0, 500)),
        };
      }
      return { raw: text.substring(0, 500) };
    } catch { return { raw: text.substring(0, 500) }; }
  }, SERVICE_ID);
  console.log(JSON.stringify(filesResult, null, 2));

  // 2. Navigate to Part B and capture network requests + find files
  console.log('\n=== Part B Discovery ===');
  const apiCalls: { method: string; url: string; status?: number }[] = [];
  page.on('response', (resp: any) => {
    const url = resp.url();
    if (url.includes('/backend/') || url.includes('/api/')) {
      apiCalls.push({ method: resp.request().method(), url, status: resp.status() });
    }
  });

  await page.goto(`/part-b/${SERVICE_ID}`);
  await page.waitForTimeout(10000);

  console.log('API calls from Part B:');
  for (const call of apiCalls) {
    console.log(`  ${call.method} ${call.status} ${call.url.substring(0, 120)}`);
  }

  // 3. Try to get the backoffice files list
  console.log('\n=== Backoffice Files ===');
  const boFiles = await page.evaluate(async (sid: string) => {
    const endpoints = [
      `/backend/backoffice/services/${sid}/files`,
      `/backend/backoffice/${sid}/files`,
      `/backend/backoffice/files?serviceId=${sid}`,
    ];
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep);
        if (r.ok) {
          const text = await r.text();
          return { endpoint: ep, status: r.status, body: text.substring(0, 2000) };
        }
      } catch {}
    }
    return { error: 'No endpoint worked' };
  }, SERVICE_ID);
  console.log(JSON.stringify(boFiles, null, 2));

  // 4. Try to find processes on the page
  const content = await page.content();
  const processIds = [...new Set((content.match(/[a-f0-9]{8}-[a-f0-9]{4}-[0-9a-f]{2}[a-f0-9]{2}-[0-9a-f]{4}-[a-f0-9]{12}/g) || []))];
  console.log(`\nUUIDs on Part B page: ${processIds.length}`);
  for (const id of processIds.slice(0, 15)) {
    console.log(`  ${id}`);
  }

  // 5. Try known process IDs
  console.log('\n=== Testing known process IDs ===');
  const knownProcesses = [
    '6baccd1e-18e5-11f1-899e-b6594fb67add',
    '3f3e03a2-18fc-11f1-899e-b6594fb67add',
  ];
  for (const pid of knownProcesses) {
    const result = await page.evaluate(async (processId: string) => {
      const r = await fetch(`/backend/process/${processId}`);
      if (!r.ok) return { processId, status: r.status };
      const data = await r.json();
      const tasks = data.tasks || [];
      const pending = tasks.filter((t: any) => !t.endTime);
      return {
        processId,
        status: r.status,
        ended: data.ended,
        processStatus: data.processStatus,
        totalTasks: tasks.length,
        pendingTasks: pending.length,
        pendingRoles: pending.map((t: any) => t.camundaName),
        fileId: data.fileId || data.file_id,
      };
    }, pid);
    console.log(`  Process ${pid}:`);
    console.log(`    ${JSON.stringify(result)}`);
  }

  // 6. Try getting files with "submitted" status
  console.log('\n=== Files with submitted status ===');
  const submittedFiles = await page.evaluate(async (sid: string) => {
    const r = await fetch(`/backend/files?serviceId=${sid}&status=submitted&page=1&page_size=5`);
    if (!r.ok) return { status: r.status };
    const data = await r.json();
    const items = data.results || data;
    if (!Array.isArray(items)) return { raw: JSON.stringify(data).substring(0, 500) };
    return items.slice(0, 5).map((f: any) => ({
      id: f.id,
      status: f.status || f.state,
      fileNumber: f.fileNumber || f.file_number,
      processId: f.processId || f.process_id,
    }));
  }, SERVICE_ID);
  console.log(JSON.stringify(submittedFiles, null, 2));

  // 7. Screenshot for reference
  await page.screenshot({ path: 'screenshots/ux-full-test/00-partb-discovery.png', fullPage: true });
  console.log('\n  Done.');
});
