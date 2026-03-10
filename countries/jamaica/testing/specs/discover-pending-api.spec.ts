import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Discover pending back-office files by querying the API endpoints.
 * Tries multiple approaches to find files with active processes.
 */

const SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';
const EXCLUDE_FILE_ID = '810ff0d9-369a-4db9-84f0-91c2ad60484f';
const OUT = path.resolve(__dirname, '../test-data/pending-discovery.json');

test('Discover pending files via API', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForTimeout(5000);

  // 1. Try the backoffice API endpoint used by the Part B UI
  console.log('\n=== Trying backoffice endpoints ===');
  const endpoints = [
    `/backend/backoffice/services/${SERVICE_ID}/files`,
    `/backend/backoffice/${SERVICE_ID}/pending`,
    `/backend/process?serviceId=${SERVICE_ID}`,
    `/backend/services/${SERVICE_ID}/processes`,
    `/backend/files?serviceId=${SERVICE_ID}&status=submitted&page=1&page_size=50`,
    `/backend/files?serviceId=${SERVICE_ID}&has_process=true&page=1&page_size=50`,
    `/backend/files?serviceId=${SERVICE_ID}&state=in_process&page=1&page_size=50`,
    `/backend/files?serviceId=${SERVICE_ID}&page=1&page_size=5`,
  ];

  const results: any[] = [];
  for (const ep of endpoints) {
    const result = await page.evaluate(async (url: string) => {
      try {
        const r = await fetch(url);
        const text = await r.text();
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch {}
        return {
          url,
          status: r.status,
          bodyLength: text.length,
          isArray: Array.isArray(parsed),
          arrayLength: Array.isArray(parsed) ? parsed.length : null,
          hasResults: parsed?.results ? parsed.results.length : null,
          hasCount: parsed?.count ?? null,
          sample: text.substring(0, 500),
        };
      } catch (e: any) {
        return { url, error: e.message };
      }
    }, ep);
    console.log(`  ${ep}`);
    console.log(`    status=${result.status} bodyLen=${result.bodyLength} isArray=${result.isArray} len=${result.arrayLength} hasResults=${result.hasResults} count=${result.hasCount}`);
    results.push(result);
  }

  // 2. Get the first page to understand file structure
  console.log('\n=== Getting sample file to understand structure ===');
  const sampleFiles = await page.evaluate(async (sid: string) => {
    const r = await fetch(`/backend/files?serviceId=${sid}&page=1&page_size=3`);
    if (!r.ok) return { error: r.status };
    return JSON.parse(await r.text());
  }, SERVICE_ID);

  if (Array.isArray(sampleFiles) && sampleFiles.length > 0) {
    console.log('  File structure keys:', Object.keys(sampleFiles[0]));
    console.log('  Sample:', JSON.stringify(sampleFiles[0], null, 2).substring(0, 1000));
  }

  // 3. Try to find a process list endpoint
  console.log('\n=== Trying process-based discovery ===');
  const processEndpoints = [
    `/backend/process/list?serviceId=${SERVICE_ID}`,
    `/backend/processes?serviceId=${SERVICE_ID}`,
    `/camunda/process-instance?processDefinitionKey=${SERVICE_ID}`,
  ];

  for (const ep of processEndpoints) {
    const result = await page.evaluate(async (url: string) => {
      try {
        const r = await fetch(url);
        return { url, status: r.status, body: (await r.text()).substring(0, 500) };
      } catch (e: any) {
        return { url, error: e.message };
      }
    }, ep);
    console.log(`  ${ep}: ${result.status}`);
    if (result.status === 200) console.log(`    ${result.body?.substring(0, 300)}`);
  }

  // 4. Check the Part B page directly to see how it loads pending files
  console.log('\n=== Checking Part B backoffice page ===');

  // Intercept network requests on the Part B page
  const apiCalls: string[] = [];
  page.on('request', (req: any) => {
    const url = req.url();
    if (url.includes('/backend/') || url.includes('/api/')) {
      apiCalls.push(`${req.method()} ${url}`);
    }
  });

  await page.goto(`/part-b/${SERVICE_ID}`);
  await page.waitForTimeout(10000);

  console.log('  API calls made by Part B page:');
  for (const call of apiCalls) {
    console.log(`    ${call}`);
  }

  // 5. Check if there's a table of files visible
  const pageContent = await page.content();
  const fileIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
  const foundIds = [...new Set(pageContent.match(fileIdPattern) || [])];
  console.log(`\n  File IDs found on Part B page: ${foundIds.length}`);
  for (const id of foundIds.slice(0, 20)) {
    console.log(`    ${id}`);
  }

  await page.screenshot({ path: path.resolve(__dirname, '../screenshots/partb-page.png') });

  // Save results
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ endpoints: results, sampleFiles, apiCalls, foundIds }, null, 2));
  console.log(`\nResults saved to ${OUT}`);
});
