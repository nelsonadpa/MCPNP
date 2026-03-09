import { test } from '@playwright/test';

const MAIN_SERVICE_ID = '0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc';

test('MAIN: Iterative submit - fill required fields until it works', async ({ page }) => {
  test.setTimeout(300_000);

  // Use the freshly-created file from previous test
  const FILE_ID = 'd5bb8b57-1471-4fb1-ba31-7fec292b9ee6';

  await page.goto(`/services/${MAIN_SERVICE_ID}?file_id=${FILE_ID}`);
  await page.waitForTimeout(10000);

  // Get the initial form data
  let formData = await page.evaluate(() => {
    const formio = (window as any).Formio; if (!formio?.forms) return null;
    for (const fk of Object.keys(formio.forms)) {
      const form = formio.forms[fk]; if (!form?.root) continue;
      return form.root.submission?.data || null;
    }
    return null;
  });

  if (!formData) { console.log('No form data!'); return; }
  console.log(`Initial data keys: ${Object.keys(formData).length}`);

  // Iteratively submit, fill missing fields, retry
  for (let attempt = 0; attempt < 10; attempt++) {
    console.log(`\n=== Attempt ${attempt + 1} ===`);

    const result = await page.evaluate(async (args: { fid: string, data: any }) => {
      const r = await fetch(`/backend/files/${args.fid}/start_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_content: JSON.stringify(args.data) }),
      });
      const text = await r.text();
      return { status: r.status, body: text };
    }, { fid: FILE_ID, data: formData });

    console.log(`Status: ${result.status}`);

    if (result.status === 200 || result.status === 201) {
      console.log(`✅ SUCCESS! Body: ${result.body.substring(0, 500)}`);
      break;
    }

    if (result.status === 500) {
      console.log(`500 Server Error — data too complex or references broken`);
      console.log(`Body: ${result.body.substring(0, 200)}`);
      break;
    }

    if (result.status === 400) {
      try {
        const err = JSON.parse(result.body);
        const details = err.details || [];
        console.log(`Validation errors: ${details.length}`);

        if (details.length === 0) {
          console.log(`Non-detail error: ${result.body.substring(0, 500)}`);
          break;
        }

        let filled = 0;
        for (const d of details) {
          const key = d.path?.[0];
          if (!key) continue;

          const msg = d.message || '';

          console.log(`  [${key}]: ${msg}`);

          // Handle "must be a non-empty array" — file uploads & arrays
          if (msg.includes('non-empty array')) {
            formData[key] = [{ name: 'test-doc.pdf', url: '/test', size: 1024, type: 'application/pdf', storage: 'url', originalName: 'test-doc.pdf' }];
            filled++;
            continue;
          }

          // Handle "does not match the mask" — format errors
          if (msg.includes('mask')) {
            if (key.includes('Trn') || key.includes('trn') || key.includes('TRN') || key.includes('Registration')) {
              formData[key] = '123456789'; // Try without dashes
            } else {
              formData[key] = '000000000';
            }
            filled++;
            continue;
          }

          // Smart fill based on field name patterns
          let val: any = 'Test Data';
          if (key.includes('Email') || key.includes('email')) val = 'test@seza.gov.jm';
          else if (key.includes('Phone') || key.includes('phone') || key.includes('Number') || key.includes('number')) val = '+18765551234';
          else if (key.match(/area|Area|sqfeet|Sqfeet|Acres|acres|Size|size|Total|total|cost|Cost|Amount|amount|Spaces|spaces/)) val = 100;
          else if (key.match(/date|Date/)) val = '2025-01-15';
          else if (key.match(/Multi|multi|Type|type|Focus|focus|Single|Occupant|occupant/)) val = 'Multi-occupant';
          else if (key.match(/parish|Parish|city|City/)) val = 'Kingston';
          else if (key.match(/address|Address/)) val = '1 Main Street, Kingston';
          else if (key.match(/name|Name/)) val = 'TEST-SEZ Kingston Innovation Park';
          else if (key.match(/description|Description/)) val = 'Test description for E2E testing of MAIN service CI selective routing.';
          else if (key.match(/country|Country/)) val = 'Jamaica';
          else if (key.match(/yes|Yes|no|No|true|True|false|False/)) val = true;
          else if (key.match(/select|Select|choose|Choose/)) val = 'yes';

          if (msg.includes('is required')) {
            formData[key] = val;
            filled++;
          }
        }
        console.log(`Filled ${filled} fields`);

        if (filled === 0) {
          // Show the errors for debugging
          for (const d of details.slice(0, 20)) {
            console.log(`  - ${d.path?.[0]}: ${d.message}`);
          }
          break;
        }
      } catch (e: any) {
        console.log(`Parse error: ${e.message}`);
        console.log(`Raw: ${result.body.substring(0, 500)}`);
        break;
      }
    } else {
      console.log(`Unexpected status ${result.status}: ${result.body.substring(0, 500)}`);
      break;
    }
  }

  // Final check
  const fileState = await page.evaluate(async (fid: string) => {
    const r = await fetch(`/backend/files?serviceId=0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc&page=1&page_size=20`);
    const files = await r.json();
    const f = (files || []).find((f: any) => f.file_id === fid);
    return f ? { state: f.state, processId: f.process_instance_id } : null;
  }, FILE_ID);
  console.log(`\nFile state: ${JSON.stringify(fileState)}`);

  if (fileState?.processId) {
    console.log(`\n✅ SUBMITTED!`);
    console.log(`FILE_ID = '${FILE_ID}'`);
    console.log(`PROCESS_ID = '${fileState.processId}'`);

    // Get initial tasks
    const tasks = await page.evaluate(async (pid: string) => {
      const r = await fetch(`/backend/process/${pid}`);
      const d = await r.json();
      const pending = (d.tasks || []).filter((t: any) => !t.endTime);
      return { total: d.tasks?.length || 0, pending: pending.map((t: any) => t.camundaName) };
    }, fileState.processId);
    console.log(`Tasks: ${tasks.total} total, pending: ${tasks.pending.join(', ')}`);
  }
});
