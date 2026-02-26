// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

const GRID_DET_ID = 'a993d0b8-1482-4af3-bc4f-0231da19dd76';
const ROW_DET_ID = '534517b4-34cb-4599-a651-b89d5aca8464';

test.describe('Verify and Fix Grid Determinant', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Check if rowDeterminant is linked and try to fix', async ({ page }) => {
    // ── Auth ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('PLEASE LOG IN...');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }
    await page.waitForTimeout(3000);
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(await page.context().storageState(), null, 2));

    await page.goto(`${BPA_URL}/services/${BITACORA_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);

    const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));

    // Helper
    async function apiCall(method, endpoint, body) {
      return page.evaluate(async ({ method, endpoint, body, jwt }) => {
        try {
          const opts = {
            method,
            headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' }
          };
          if (body) opts.body = JSON.stringify(body);
          const resp = await fetch(endpoint, opts);
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 3000) };
        } catch (e) {
          return { error: e.message };
        }
      }, { method, endpoint, body, jwt });
    }

    // ── Step 1: Fetch the grid determinant to check if rowDeterminant is linked ──
    console.log('=== Checking grid determinant full structure ===');
    const fullDets = await page.evaluate(async ({ jwt, serviceId, gridId }) => {
      const resp = await fetch(`/bparest/bpa/v2016/06/service/${serviceId}/determinant`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await resp.json();
      return data.find(d => d.id === gridId);
    }, { jwt, serviceId: BITACORA_ID, gridId: GRID_DET_ID });

    console.log('Grid determinant full JSON:');
    console.log(JSON.stringify(fullDets, null, 2));

    const hasRowDet = fullDets?.rowDeterminant != null;
    console.log(`\nrowDeterminant linked: ${hasRowDet}`);

    if (!hasRowDet) {
      console.log('\nRow determinant NOT linked. Trying to fix...');

      // ── Step 2: Delete the broken grid determinant ──
      console.log('\n=== Deleting broken grid determinant ===');
      const delGrid = await apiCall('DELETE',
        `/bparest/bpa/v2016/06/service/${BITACORA_ID}/griddeterminant/${GRID_DET_ID}`);
      console.log('Delete grid:', delGrid.status, delGrid.body?.substring(0, 200));

      // Also try alternative DELETE path
      if (delGrid.status >= 400) {
        const delGrid2 = await apiCall('DELETE',
          `/bparest/bpa/v2016/06/service/${BITACORA_ID}/determinant/${GRID_DET_ID}`);
        console.log('Delete via /determinant/:', delGrid2.status, delGrid2.body?.substring(0, 200));
      }

      // ── Step 3: Try creating grid determinant with INLINE (new) row determinant ──
      console.log('\n=== Creating grid determinant with inline NEW row determinant ===');
      // Don't include id on the row determinant - let server create both together
      const inlineResult = await apiCall('POST',
        `/bparest/bpa/v2016/06/service/${BITACORA_ID}/griddeterminant`, {
          name: "CertAprobacion fecha < hoy v2",
          determinantType: "FORMFIELD",
          serviceId: BITACORA_ID,
          targetFormFieldKey: "applicantEditGridCertAprobacion",
          generated: false,
          determinantInsideGrid: true,
          businessKey: "MyAccountPageCertAprobacionfecha<hoyv2",
          rowDeterminant: {
            // NO id field - create new
            name: "Row determinant in CertAprobacion expirado v2",
            determinantType: "FORMFIELD",
            serviceId: BITACORA_ID,
            targetFormFieldKey: "applicantEditGridCertAprobacion_collection_applicantFechaCertAprobacion",
            generated: false,
            determinantInsideGrid: false,
            businessKey: "MyAccountPageRowdeterminantinCertAprobacionexpiradov2",
            operator: "LESS_THAN",
            isCurrentDate: true,
            type: "date",
            operatorStringValue: "LESS_THAN",
            valueIsNullOrEmpty: true
          },
          type: "grid",
          valueIsNullOrEmpty: true
        });

      console.log('Inline create result:', inlineResult.status);
      console.log(inlineResult.body);

      if (inlineResult.status === 200 || inlineResult.status === 201) {
        try {
          const data = JSON.parse(inlineResult.body);
          console.log('\nGrid ID:', data.id);
          console.log('Has rowDeterminant:', !!data.rowDeterminant);
          if (data.rowDeterminant) {
            console.log('Row det ID:', data.rowDeterminant.id);
            console.log('Row det type:', data.rowDeterminant.type);
            console.log('Row det operator:', data.rowDeterminant.operator);
          }
          fs.writeFileSync(path.join(API_DIR, 'created-grid-determinant-v2.json'), JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      }
    } else {
      console.log('\nrowDeterminant IS linked! No fix needed.');
      console.log('Row det ID:', fullDets.rowDeterminant.id);
      console.log('Row det type:', fullDets.rowDeterminant.type);
    }

    // ── Step 4: Also try PUT to update existing grid with rowDeterminant ──
    console.log('\n=== Trying PUT to update grid determinant ===');
    const putResult = await apiCall('PUT',
      `/bparest/bpa/v2016/06/service/${BITACORA_ID}/griddeterminant`, {
        id: GRID_DET_ID,
        name: "CertAprobacion fecha < hoy",
        determinantType: "FORMFIELD",
        serviceId: BITACORA_ID,
        targetFormFieldKey: "applicantEditGridCertAprobacion",
        generated: false,
        determinantInsideGrid: true,
        businessKey: "MyAccountPageCertAprobacionfecha<hoy",
        rowDeterminantId: ROW_DET_ID,
        type: "grid",
        valueIsNullOrEmpty: true
      });
    console.log('PUT result:', putResult.status);
    console.log(putResult.body?.substring(0, 500));

    // ── Final verification ──
    console.log('\n=== Final: all CertAprobacion determinants ===');
    const finalDets = await page.evaluate(async ({ jwt, serviceId }) => {
      const resp = await fetch(`/bparest/bpa/v2016/06/service/${serviceId}/determinant`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await resp.json();
      return data.filter(d => d.name && d.name.toLowerCase().includes('certaprobacion'));
    }, { jwt, serviceId: BITACORA_ID });
    console.log(JSON.stringify(finalDets, null, 2));

    console.log('\nDone.');
    await page.waitForTimeout(10_000);
  });
});
