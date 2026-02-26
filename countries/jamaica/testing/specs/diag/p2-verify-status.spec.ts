import { test } from '@playwright/test';

test('P2-VERIFY: Check application status after Documents Check', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/part-b');
  await page.waitForTimeout(5000);

  // Check all tabs/statuses for the application
  console.log('\n══ Part B Queue (filepending) ══');
  const queueData = await page.evaluate(async () => {
    // Check different status filters
    const statuses = ['filepending', 'filecomplete', 'filedecline', 'filecancelled'];
    const results: Record<string, any> = {};

    for (const status of statuses) {
      try {
        const resp = await fetch(`/en/backend/process/inprocess/all/my?orderBy=startDate&page=0&size=5&sortOrder=desc&status=${status}`);
        const data = await resp.json();
        results[status] = {
          count: data.count || data.results?.length || 0,
          first: data.results?.[0] ? {
            company: data.results[0].company_name?.substring(0, 40),
            service: data.results[0].service_name?.substring(0, 40),
            step: data.results[0].current_step_name?.substring(0, 40) || data.results[0].role_name?.substring(0, 40),
            date: data.results[0].start_date?.substring(0, 10),
          } : null,
        };
      } catch {
        results[status] = { error: true };
      }
    }

    return results;
  });

  for (const [status, data] of Object.entries(queueData)) {
    console.log(`  ${status}: ${data.count} items${data.first ? ` — first: ${JSON.stringify(data.first)}` : ''}`);
  }

  // Check inspector for our application
  console.log('\n══ Inspector ══');
  await page.goto('/inspector/');
  await page.waitForTimeout(5000);

  const inspectorData = await page.evaluate(() => {
    const items = document.querySelectorAll('.list-item');
    const results: string[] = [];
    items.forEach((item, i) => {
      if (i >= 5) return;
      const badge = item.querySelector('.status-badge')?.textContent?.trim() || '';
      const company = item.querySelector('.column-text')?.textContent?.trim() || '';
      const allText = item.textContent?.trim().replace(/\s+/g, ' ').substring(0, 150) || '';
      results.push(`[${i}] badge="${badge}" company="${company}" text="${allText.substring(0, 100)}"`);
    });
    return results;
  });
  for (const line of inspectorData) console.log(`  ${line}`);

  // Direct file API check
  console.log('\n══ Direct API check ══');
  const directCheck = await page.evaluate(async () => {
    const fileId = '8681df73-af32-45d6-8af1-30d5a7b0b6a1';
    const processId = '84e53b18-12b2-11f1-899e-b6594fb67add';

    const fileResp = await fetch(`/backend/files/${fileId}`);
    const file = await fileResp.json();

    // Try to get process instance details
    let processInfo = null;
    try {
      const procResp = await fetch(`/en/backend/process/${processId}`);
      if (procResp.ok) {
        processInfo = await procResp.json();
      }
    } catch {}

    // Try the file's data for form status
    const dataResp = await fetch(`/backend/files/${fileId}/data`);
    const formData = await dataResp.json();

    let wizardData = null;
    if (Array.isArray(formData)) {
      for (const fd of formData) {
        if (fd.form_type === 'WIZARD') {
          const content = JSON.parse(fd.data_content);
          wizardData = {
            isFormValid: content.isFormValid,
            'Form is valid': content['Form is valid'],
            FORMDATAVALIDATIONSTATUS: content.FORMDATAVALIDATIONSTATUS,
          };
        }
      }
    }

    return {
      fileState: file.state,
      processInstanceId: file.process_instance_id,
      processInfo: processInfo ? JSON.stringify(processInfo).substring(0, 300) : null,
      wizardData,
    };
  });

  console.log(`  File state: ${directCheck.fileState}`);
  console.log(`  Process ID: ${directCheck.processInstanceId}`);
  console.log(`  Wizard data: ${JSON.stringify(directCheck.wizardData)}`);
  if (directCheck.processInfo) {
    console.log(`  Process info: ${directCheck.processInfo}`);
  }

  // Check if the Part B page now shows different content for status filter
  console.log('\n══ Part B (all users, all statuses) ══');
  const allUsers = await page.evaluate(async () => {
    const resp = await fetch('/en/backend/process/inprocess/all/all?orderBy=startDate&page=0&size=5&sortOrder=desc&status=filepending');
    const data = await resp.json();
    const results: string[] = [];
    results.push(`Count: ${data.count || data.results?.length || 0}`);
    for (const p of (data.results || []).slice(0, 5)) {
      results.push(`  ${p.company_name?.substring(0, 30)} — ${p.current_step_name || p.role_name || 'unknown step'} — ${p.state || 'unknown'}`);
    }
    return results;
  });
  for (const line of allUsers) console.log(`  ${line}`);

  console.log('\n══ DONE ══');
});
