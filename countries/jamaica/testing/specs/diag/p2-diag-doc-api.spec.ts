import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Find the document validation API endpoint
 * Each document item has is_valid:false. We need to find the API
 * that changes it to true.
 *
 * Approach:
 * 1. List all backend API calls during page load
 * 2. Try common eRegistrations API patterns for document validation
 * 3. Check if there's a documents/ endpoint we can call
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('P2-DIAG: Find document validation API', async ({ page }) => {
  test.setTimeout(180_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Capture ALL backend API calls during page load
  const apiCalls: { method: string; url: string; status?: number }[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/backend/') || url.includes('/api/')) {
      apiCalls.push({ method: req.method(), url });
    }
  });
  page.on('response', resp => {
    const url = resp.url();
    const req = apiCalls.find(r => r.url === url && !r.status);
    if (req) req.status = resp.status();
  });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  console.log('\n══ API calls on /part-b page load ══');
  for (const r of apiCalls) {
    console.log(`  ${r.method} ${r.status} ${r.url.substring(0, 150)}`);
  }

  // Navigate to processing view
  apiCalls.length = 0;
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  console.log('\n══ API calls on processing view load ══');
  for (const r of apiCalls) {
    console.log(`  ${r.method} ${r.status} ${r.url.substring(0, 150)}`);
  }

  // Get all document item IDs
  const docItems = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return [];

    for (const k of Object.keys(formio.forms)) {
      const d = formio.forms[k]?.submission?.data;
      if (!d?.documentsTabDocuments) continue;

      const docs = typeof d.documentsTabDocuments === 'string'
        ? JSON.parse(d.documentsTabDocuments)
        : d.documentsTabDocuments;

      if (!Array.isArray(docs)) continue;

      const items: any[] = [];
      for (const doc of docs) {
        if (doc.items) {
          for (const item of doc.items) {
            items.push({
              id: item.id,
              name: doc.name?.substring(0, 50),
              file_name: item.file_name?.substring(0, 40),
              is_valid: item.is_valid,
              document_id: item.document_id?.substring(0, 60),
              process_id: item.process_id,
              file_id: item.file_id,
            });
          }
        }
      }
      return items;
    }
    return [];
  });

  console.log(`\n══ Document items: ${docItems.length} ══`);
  for (const item of docItems.slice(0, 5)) {
    console.log(`  id=${item.id} is_valid=${item.is_valid} name="${item.name}" file="${item.file_name}"`);
  }

  // Try various API endpoints to validate a single document
  console.log('\n══ Trying document validation API endpoints ══');

  const testItem = docItems[0];
  if (!testItem) {
    console.log('  No document items found');
    return;
  }
  console.log(`  Testing with item id=${testItem.id}, name="${testItem.name}"`);

  const endpoints = [
    // Common eRegistrations patterns
    { method: 'PUT', url: `/backend/files/${FILE_ID}/documents/${testItem.id}/validate` },
    { method: 'POST', url: `/backend/files/${FILE_ID}/documents/${testItem.id}/validate` },
    { method: 'PUT', url: `/backend/files/${FILE_ID}/documents/${testItem.id}`, body: { is_valid: true } },
    { method: 'PATCH', url: `/backend/files/${FILE_ID}/documents/${testItem.id}`, body: { is_valid: true } },
    { method: 'PUT', url: `/backend/documents/${testItem.id}/validate` },
    { method: 'POST', url: `/backend/documents/${testItem.id}/validate` },
    { method: 'PUT', url: `/backend/documents/${testItem.id}`, body: { is_valid: true } },
    { method: 'PATCH', url: `/backend/documents/${testItem.id}`, body: { is_valid: true } },
    { method: 'POST', url: `/backend/files/${FILE_ID}/validate-document`, body: { document_id: testItem.id } },
    { method: 'PUT', url: `/backend/files/${FILE_ID}/process/${PROCESS_ID}/documents/${testItem.id}/validate` },
    { method: 'POST', url: `/backend/files/${FILE_ID}/process/${PROCESS_ID}/documents/${testItem.id}/validate` },
    // Try with is_valid in body
    { method: 'PUT', url: `/backend/files/${FILE_ID}/documents/${testItem.id}`, body: { is_valid: true } },
  ];

  for (const ep of endpoints) {
    try {
      const result = await page.evaluate(async ({ method, url, body }) => {
        const opts: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const resp = await fetch(url, opts);
        const text = await resp.text();
        return { status: resp.status, body: text.substring(0, 200) };
      }, ep);

      const status = result.status;
      if (status !== 404 && status !== 405) {
        console.log(`  ✓ ${ep.method} ${ep.url} → ${status}`);
        console.log(`    Body: ${result.body}`);
      } else {
        console.log(`  ✗ ${ep.method} ${ep.url} → ${status}`);
      }
    } catch (e: any) {
      console.log(`  ✗ ${ep.method} ${ep.url} → Error: ${e.message?.substring(0, 60)}`);
    }
  }

  // Also check: the backend base URL and available routes
  console.log('\n══ Backend route discovery ══');
  const discoveryEndpoints = [
    '/backend/',
    '/backend/files/' + FILE_ID,
    '/backend/files/' + FILE_ID + '/documents',
    '/backend/files/' + FILE_ID + '/data',
    `/backend/files/${FILE_ID}/processes`,
    `/backend/files/${FILE_ID}/process/${PROCESS_ID}`,
    `/backend/processes/${PROCESS_ID}/documents`,
  ];

  for (const url of discoveryEndpoints) {
    try {
      const result = await page.evaluate(async (url) => {
        const resp = await fetch(url);
        const text = await resp.text();
        return { status: resp.status, body: text.substring(0, 300) };
      }, url);
      if (result.status !== 404) {
        console.log(`  ${result.status} ${url}`);
        console.log(`    ${result.body.substring(0, 200)}`);
      }
    } catch {}
  }

  console.log('\n══ DONE ══');
});
