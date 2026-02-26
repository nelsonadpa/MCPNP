import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: More API endpoint exploration
 * - Try /en/backend/ prefix
 * - Try PATCH on process/document
 * - Try multipart form data with is_valid field
 * - Check WebSocket usage
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');
const FILE_ID = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
const PROCESS_ID = '84e53b18-12b2-11f1-899e-b6594fb67add';
const DOC_ID = 1522; // First document

test('P2-DIAG: Document API v3', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  // 1. Try endpoints with /en/ prefix
  console.log('\n══ Endpoints with /en/ prefix ══');
  const enEndpoints = [
    { method: 'PATCH', url: `/en/backend/documents/${DOC_ID}`, body: { is_valid: true }, ct: 'application/json' },
    { method: 'PUT', url: `/en/backend/documents/${DOC_ID}`, body: { is_valid: true }, ct: 'application/json' },
    { method: 'GET', url: `/en/backend/documents/${DOC_ID}` },
    { method: 'PATCH', url: `/en/backend/process/${PROCESS_ID}/document/${DOC_ID}`, body: { is_valid: true }, ct: 'application/json' },
    { method: 'PUT', url: `/en/backend/process/${PROCESS_ID}/document/${DOC_ID}`, body: { is_valid: true }, ct: 'application/json' },
    { method: 'POST', url: `/en/backend/process/${PROCESS_ID}/document/${DOC_ID}`, body: { is_valid: true }, ct: 'application/json' },
  ];

  for (const ep of enEndpoints) {
    try {
      const result = await page.evaluate(async ({ method, url, body, ct }) => {
        const opts: RequestInit = { method };
        if (body) {
          opts.headers = { 'Content-Type': ct || 'application/json' };
          opts.body = JSON.stringify(body);
        }
        const resp = await fetch(url, opts);
        return {
          status: resp.status,
          body: (await resp.text()).substring(0, 300),
          contentType: resp.headers.get('content-type'),
        };
      }, ep);

      const ind = result.status >= 200 && result.status < 300 ? '✓' : '✗';
      console.log(`  ${ind} ${ep.method} ${ep.url} → ${result.status} (${result.contentType})`);
      if (result.status !== 404) {
        console.log(`    ${result.body.substring(0, 200)}`);
      }
    } catch (e: any) {
      console.log(`  ✗ ${ep.method} ${ep.url} → Error`);
    }
  }

  // 2. Try FormData with additional fields on /en/backend/documents/{id}
  console.log('\n══ FormData on /en/backend/documents/{id} ══');
  const fdTests = [
    { fields: { is_valid: 'true' } },
    { fields: { is_valid: 'true', name: 'TEST-certificate-of-incorporation.pdf' } },
    { fields: { is_valid: '1', name: 'TEST-certificate-of-incorporation.pdf', file_name: 'TEST-certificate-of-incorporation.pdf' } },
  ];

  for (const fdt of fdTests) {
    const result = await page.evaluate(async ({ docId, fields }) => {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      const resp = await fetch(`/en/backend/documents/${docId}`, { method: 'PATCH', body: fd });
      return { status: resp.status, body: (await resp.text()).substring(0, 300) };
    }, { docId: DOC_ID, fields: fdt.fields });
    console.log(`  PATCH FormData(${JSON.stringify(fdt.fields)}): ${result.status}`);
    console.log(`    ${result.body.substring(0, 200)}`);
  }

  // 3. Try to find validation via the process endpoint
  console.log('\n══ Process endpoint variations ══');
  const procEndpoints = [
    { method: 'GET', url: `/backend/process/${PROCESS_ID}/document/${DOC_ID}` },
    { method: 'PATCH', url: `/backend/process/${PROCESS_ID}/document/${DOC_ID}`, ct: 'application/json', body: { is_valid: true } },
    { method: 'POST', url: `/backend/process/${PROCESS_ID}/validate`, ct: 'application/json', body: { document_ids: [DOC_ID] } },
    { method: 'POST', url: `/backend/process/${PROCESS_ID}/document/validate`, ct: 'application/json', body: { document_id: DOC_ID, is_valid: true } },
    { method: 'PUT', url: `/backend/files/${FILE_ID}/validate`, ct: 'application/json', body: {} },
    { method: 'POST', url: `/backend/files/${FILE_ID}/validate`, ct: 'application/json', body: {} },
    // Maybe the document has its own validate endpoint
    { method: 'POST', url: `/backend/documents/${DOC_ID}/validate`, ct: 'application/json', body: {} },
    { method: 'POST', url: `/en/backend/documents/${DOC_ID}/validate`, ct: 'application/json', body: {} },
    // Maybe the validation is done through a file-level endpoint
    { method: 'POST', url: `/backend/files/${FILE_ID}/document-validation`, ct: 'application/json', body: { document_id: DOC_ID, is_valid: true } },
    // PATCH with FormData on process document
    { method: 'PATCH', url: `/backend/process/${PROCESS_ID}/document/${DOC_ID}`, useFormData: true },
  ];

  for (const ep of procEndpoints) {
    try {
      const result = await page.evaluate(async ({ method, url, ct, body, useFormData }) => {
        const opts: RequestInit = { method };
        if (useFormData) {
          const fd = new FormData();
          fd.append('is_valid', 'true');
          opts.body = fd;
        } else if (body) {
          opts.headers = { 'Content-Type': ct || 'application/json' };
          opts.body = JSON.stringify(body);
        }
        const resp = await fetch(url, opts);
        return { status: resp.status, body: (await resp.text()).substring(0, 300) };
      }, ep);

      if (result.status !== 404 && result.status !== 405) {
        console.log(`  ${result.status} ${ep.method} ${ep.url}`);
        console.log(`    ${result.body.substring(0, 200)}`);
      }
    } catch {}
  }

  // 4. Look at the Angular app's HTTP interceptors and services
  console.log('\n══ Angular app inspection ══');
  const angularInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Check for custom services on window
    const customKeys = Object.keys(window).filter(k =>
      k.includes('document') || k.includes('Document') ||
      k.includes('validate') || k.includes('Validate') ||
      k.includes('carousel') || k.includes('Carousel')
    );
    results.push(`Custom window keys: ${customKeys.join(', ') || 'none'}`);

    // Check for WebSocket connections
    const wsCheck = (window as any).WebSocket;
    results.push(`WebSocket available: ${!!wsCheck}`);

    // Check for Formio component event handlers
    const formio = (window as any).Formio;
    if (formio?.forms) {
      for (const k of Object.keys(formio.forms)) {
        const form = formio.forms[k];
        // Check for event listeners on the form
        if (form?.events) {
          const eventNames = Object.keys(form.events);
          results.push(`Form ${k} events: ${eventNames.slice(0, 20).join(', ')}`);
        }
        if (form?.on) {
          results.push(`Form ${k} has .on() method`);
        }
      }
    }

    // Check Angular injector for document-related services
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      const injector = (appRoot as any).__ngContext__;
      if (injector) {
        results.push(`Angular context found (type: ${typeof injector})`);
        if (Array.isArray(injector)) {
          results.push(`Context array length: ${injector.length}`);
          // Look for service-like objects
          for (let i = 0; i < Math.min(injector.length, 50); i++) {
            const item = injector[i];
            if (item && typeof item === 'object' && item.constructor?.name) {
              const name = item.constructor.name;
              if (name.includes('Service') || name.includes('Document') || name.includes('Carousel')) {
                results.push(`  [${i}]: ${name}`);
              }
            }
          }
        }
      }
    }

    return results;
  });
  for (const line of angularInfo) {
    console.log(`  ${line}`);
  }

  // 5. Check the save button's actual click handler
  console.log('\n══ Save button click flow ══');
  // Navigate to Documents tab and open carousel for proper context
  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  const saveFlowInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Find the save-draft button
    const saveBtn = document.querySelector('.save-draft-btn') as HTMLElement;
    if (!saveBtn) {
      results.push('No save-draft-btn found');
      return results;
    }

    const rect = saveBtn.getBoundingClientRect();
    results.push(`Save button: at (${Math.round(rect.x)},${Math.round(rect.y)}) ${Math.round(rect.width)}x${Math.round(rect.height)} visible=${saveBtn.offsetParent !== null}`);

    // Check zone event listeners
    const keys = Object.getOwnPropertyNames(saveBtn);
    for (const key of keys) {
      if (key.includes('zone') || key.includes('ng') || key.includes('click') || key.startsWith('__')) {
        try {
          const val = (saveBtn as any)[key];
          if (typeof val === 'function') {
            results.push(`  ${key}: function`);
          } else if (val !== undefined) {
            results.push(`  ${key}: ${JSON.stringify(val)?.substring(0, 100)}`);
          }
        } catch {}
      }
    }

    return results;
  });
  for (const line of saveFlowInfo) {
    console.log(`  ${line}`);
  }

  console.log('\n══ DONE ══');
});
