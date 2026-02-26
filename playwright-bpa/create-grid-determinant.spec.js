// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// Row determinant already created
const ROW_DET_ID = '534517b4-34cb-4599-a651-b89d5aca8464';

test.describe('Create Grid Determinant - Multiple Approaches', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Try different payloads for grid determinant', async ({ page }) => {
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
    const freshState = await page.context().storageState();
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(freshState, null, 2));

    await page.goto(`${BPA_URL}/services/${BITACORA_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);

    const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));
    console.log('JWT available:', !!jwt);

    // Helper to POST and report
    async function tryPost(label, endpoint, payload) {
      const result = await page.evaluate(async ({ endpoint, payload, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify(payload)
          });
          const text = await resp.text();
          return { status: resp.status, body: text.substring(0, 2000) };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, payload, jwt });

      console.log(`\n${label}: ${result.status}`);
      console.log(result.body);
      return result;
    }

    const gridEndpoint = `/bparest/bpa/v2016/06/service/${BITACORA_ID}/griddeterminant`;

    // ── Approach 1: Full nested rowDeterminant (matching PE reference) ──
    console.log('=== Approach 1: Full nested rowDeterminant ===');
    const result1 = await tryPost('Full nested', gridEndpoint, {
      name: "CertAprobacion fecha < hoy",
      determinantType: "FORMFIELD",
      serviceId: BITACORA_ID,
      targetFormFieldKey: "applicantEditGridCertAprobacion",
      generated: false,
      determinantInsideGrid: true,
      businessKey: "MyAccountPageCertAprobacionfecha<hoy",
      rowDeterminant: {
        id: ROW_DET_ID,
        type: "date",
        name: "Row determinant in CertAprobacion expirado",
        determinantType: "FORMFIELD",
        serviceId: BITACORA_ID,
        targetFormFieldKey: "applicantEditGridCertAprobacion_collection_applicantFechaCertAprobacion",
        generated: false,
        determinantInsideGrid: false,
        businessKey: "MyAccountPageRowdeterminantinCertAprobacionexpirado",
        operator: "LESS_THAN",
        isCurrentDate: true,
        operatorStringValue: "LESS_THAN",
        valueIsNullOrEmpty: true
      },
      type: "grid",
      valueIsNullOrEmpty: true
    });

    if (result1.status === 200 || result1.status === 201) {
      console.log('\n=== SUCCESS with Approach 1! ===');
      const data = JSON.parse(result1.body);
      console.log('Grid determinant ID:', data.id);
      fs.writeFileSync(path.join(API_DIR, 'created-grid-determinant.json'), JSON.stringify(data, null, 2));
    } else {
      // ── Approach 2: rowDeterminant with just id (string format) ──
      console.log('\n=== Approach 2: rowDeterminant as string ID ===');
      const result2 = await tryPost('String ID', gridEndpoint, {
        name: "CertAprobacion fecha < hoy",
        determinantType: "FORMFIELD",
        serviceId: BITACORA_ID,
        targetFormFieldKey: "applicantEditGridCertAprobacion",
        generated: false,
        determinantInsideGrid: true,
        businessKey: "MyAccountPageCertAprobacionfecha<hoy",
        rowDeterminant: ROW_DET_ID,
        type: "grid",
        valueIsNullOrEmpty: true
      });

      if (result2.status === 200 || result2.status === 201) {
        console.log('\n=== SUCCESS with Approach 2! ===');
      } else {
        // ── Approach 3: rowDeterminantId field instead of rowDeterminant ──
        console.log('\n=== Approach 3: rowDeterminantId field ===');
        const result3 = await tryPost('rowDeterminantId', gridEndpoint, {
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

        if (result3.status === 200 || result3.status === 201) {
          console.log('\n=== SUCCESS with Approach 3! ===');
        } else {
          // ── Approach 4: row_determinant_id (snake_case) ──
          console.log('\n=== Approach 4: row_determinant_id ===');
          const result4 = await tryPost('row_determinant_id', gridEndpoint, {
            name: "CertAprobacion fecha < hoy",
            determinantType: "FORMFIELD",
            serviceId: BITACORA_ID,
            targetFormFieldKey: "applicantEditGridCertAprobacion",
            generated: false,
            determinantInsideGrid: true,
            businessKey: "MyAccountPageCertAprobacionfecha<hoy",
            row_determinant_id: ROW_DET_ID,
            type: "grid",
            valueIsNullOrEmpty: true
          });

          if (result4.status === 200 || result4.status === 201) {
            console.log('\n=== SUCCESS with Approach 4! ===');
          } else {
            // ── Approach 5: Minimal - no rowDeterminant at all ──
            console.log('\n=== Approach 5: No rowDeterminant ===');
            const result5 = await tryPost('No row det', gridEndpoint, {
              name: "CertAprobacion fecha < hoy test",
              determinantType: "FORMFIELD",
              serviceId: BITACORA_ID,
              targetFormFieldKey: "applicantEditGridCertAprobacion",
              generated: false,
              determinantInsideGrid: true,
              businessKey: "MyAccountPageCertAprobacionfecha<hoytest",
              type: "grid",
              valueIsNullOrEmpty: true
            });

            if (result5.status === 200 || result5.status === 201) {
              console.log('\nCreated grid WITHOUT row det. Now try PUT to add rowDeterminant...');
              const gridData = JSON.parse(result5.body);
              const gridId = gridData.id;

              // Try PUT to update with rowDeterminant
              const putResult = await page.evaluate(async ({ endpoint, gridId, rowDetId, jwt }) => {
                try {
                  const resp = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${jwt}`
                    },
                    body: JSON.stringify({
                      id: gridId,
                      name: "CertAprobacion fecha < hoy test",
                      determinantType: "FORMFIELD",
                      targetFormFieldKey: "applicantEditGridCertAprobacion",
                      determinantInsideGrid: true,
                      rowDeterminant: { id: rowDetId },
                      type: "grid"
                    })
                  });
                  const text = await resp.text();
                  return { status: resp.status, body: text.substring(0, 2000) };
                } catch (e) {
                  return { error: e.message };
                }
              }, { endpoint: gridEndpoint, gridId, rowDetId: ROW_DET_ID, jwt });

              console.log('\nPUT result:', putResult.status);
              console.log(putResult.body);
            }
          }
        }
      }
    }

    // ── Final verification ──
    console.log('\n=== Final: check all determinants ===');
    const allDets = await page.evaluate(async ({ jwt, serviceId }) => {
      const resp = await fetch(`/bparest/bpa/v2016/06/service/${serviceId}/determinant`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await resp.json();
      return data.filter(d => d.name && d.name.toLowerCase().includes('certaprobacion'));
    }, { jwt, serviceId: BITACORA_ID });
    console.log('CertAprobacion determinants:', JSON.stringify(allDets, null, 2));

    console.log('\nDone.');
    await page.waitForTimeout(10_000);
  });
});
