import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Call /backend/documents/{id} with different content types
 * to find the correct way to validate documents.
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';

test('P2-DIAG: Document API content types', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // Get first document item ID
  const firstDocId = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return null;
    for (const k of Object.keys(formio.forms)) {
      const d = formio.forms[k]?.submission?.data;
      if (!d?.documentsTabDocuments) continue;
      const docs = typeof d.documentsTabDocuments === 'string'
        ? JSON.parse(d.documentsTabDocuments) : d.documentsTabDocuments;
      if (docs?.[0]?.items?.[0]) return docs[0].items[0].id;
    }
    return null;
  });
  console.log(`\n══ Document item id: ${firstDocId} ══`);

  if (!firstDocId) {
    console.log('  No doc found');
    return;
  }

  // First, GET the document to see its current structure
  console.log('\n══ GET /backend/documents/{id} ══');
  const getResult = await page.evaluate(async (id) => {
    const resp = await fetch(`/backend/documents/${id}`);
    return { status: resp.status, body: (await resp.text()).substring(0, 500), contentType: resp.headers.get('content-type') };
  }, firstDocId);
  console.log(`  Status: ${getResult.status}`);
  console.log(`  Content-Type: ${getResult.contentType}`);
  console.log(`  Body: ${getResult.body}`);

  // Try different content types for PUT
  console.log('\n══ PUT /backend/documents/{id} with different content types ══');

  const contentTypes = [
    { ct: 'application/x-www-form-urlencoded', body: 'is_valid=true' },
    { ct: 'application/x-www-form-urlencoded', body: 'is_valid=1' },
    { ct: 'multipart/form-data', body: null, useFormData: true },
    { ct: 'text/plain', body: 'is_valid=true' },
  ];

  for (const ct of contentTypes) {
    const result = await page.evaluate(async ({ id, contentType, body, useFormData }) => {
      const opts: RequestInit = { method: 'PUT' };
      if (useFormData) {
        const fd = new FormData();
        fd.append('is_valid', 'true');
        opts.body = fd;
        // Don't set Content-Type for FormData — browser sets it with boundary
      } else {
        opts.headers = { 'Content-Type': contentType };
        opts.body = body;
      }
      const resp = await fetch(`/backend/documents/${id}`, opts);
      return {
        status: resp.status,
        body: (await resp.text()).substring(0, 300),
        ct: contentType,
      };
    }, { id: firstDocId, contentType: ct.ct, body: ct.body, useFormData: ct.useFormData || false });

    console.log(`  PUT (${ct.ct}): ${result.status}`);
    console.log(`    Response: ${result.body.substring(0, 200)}`);
  }

  // Try PATCH with different content types
  console.log('\n══ PATCH /backend/documents/{id} ══');
  for (const ct of contentTypes) {
    const result = await page.evaluate(async ({ id, contentType, body, useFormData }) => {
      const opts: RequestInit = { method: 'PATCH' };
      if (useFormData) {
        const fd = new FormData();
        fd.append('is_valid', 'true');
        opts.body = fd;
      } else {
        opts.headers = { 'Content-Type': contentType };
        opts.body = body;
      }
      const resp = await fetch(`/backend/documents/${id}`, opts);
      return { status: resp.status, body: (await resp.text()).substring(0, 300) };
    }, { id: firstDocId, contentType: ct.ct, body: ct.body, useFormData: ct.useFormData || false });

    console.log(`  PATCH (${ct.ct}): ${result.status}`);
    console.log(`    Response: ${result.body.substring(0, 200)}`);
  }

  // Also try: POST /backend/process/{process_id}/document/{id}/validate
  console.log('\n══ Process-based document endpoints ══');
  const processEndpoints = [
    { method: 'GET', url: `/backend/process/${PROCESS_ID}/document` },
    { method: 'PUT', url: `/backend/process/${PROCESS_ID}/document/${firstDocId}`, body: { is_valid: true } },
    { method: 'POST', url: `/backend/process/${PROCESS_ID}/document/${firstDocId}/validate` },
    { method: 'PUT', url: `/backend/process/${PROCESS_ID}/document/${firstDocId}/validate` },
    // FormData variants
    { method: 'PUT', url: `/backend/documents/${firstDocId}`, useFormData: true, formFields: { is_valid: 'true' } },
    { method: 'PUT', url: `/backend/documents/${firstDocId}`, useFormData: true, formFields: { is_valid: '1' } },
    { method: 'PUT', url: `/backend/documents/${firstDocId}`, useFormData: true, formFields: { is_valid: 'true', file_id: FILE_ID } },
    // Maybe the validation endpoint uses process_id
    { method: 'POST', url: `/backend/process/${PROCESS_ID}/validate-documents` },
    { method: 'POST', url: `/backend/process/${PROCESS_ID}/validate-documents`, body: { documents: [firstDocId] } },
  ];

  for (const ep of processEndpoints) {
    try {
      const result = await page.evaluate(async ({ method, url, body, useFormData, formFields }) => {
        const opts: RequestInit = { method };
        if (useFormData && formFields) {
          const fd = new FormData();
          Object.entries(formFields).forEach(([k, v]) => fd.append(k, v as string));
          opts.body = fd;
        } else if (body) {
          opts.headers = { 'Content-Type': 'application/json' };
          opts.body = JSON.stringify(body);
        }
        const resp = await fetch(url, opts);
        return { status: resp.status, body: (await resp.text()).substring(0, 300) };
      }, ep);

      const indicator = result.status >= 200 && result.status < 300 ? '✓' :
                        result.status === 404 || result.status === 405 ? '✗' : '?';
      console.log(`  ${indicator} ${ep.method} ${ep.url.substring(0, 120)} → ${result.status}`);
      if (result.status !== 404 && result.status !== 405) {
        console.log(`    ${result.body.substring(0, 200)}`);
      }
    } catch (e: any) {
      console.log(`  ✗ ${ep.method} ${ep.url.substring(0, 80)} → Error`);
    }
  }

  // Check: What does GET /backend/process/{process_id}/document return?
  console.log('\n══ Full document list from process endpoint ══');
  const docList = await page.evaluate(async (processId) => {
    const resp = await fetch(`/backend/process/${processId}/document`);
    return { status: resp.status, body: (await resp.text()).substring(0, 1000) };
  }, PROCESS_ID);
  console.log(`  Status: ${docList.status}`);
  console.log(`  Body: ${docList.body}`);

  console.log('\n══ DONE ══');
});
