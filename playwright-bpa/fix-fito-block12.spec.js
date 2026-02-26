// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const FITO_ID = '2c91808893792e2b019379310a8003a9';

// Radio determinant for StatusBitacora = TRUE (created via REST API)
const RADIO_DET_ID = 'daf38ab6-2dff-43f8-bfb3-77b15d10303f';

test.describe('Fix Fito Block12 Behaviour', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Create correct behaviour for applicantBlock12', async ({ page }) => {
    // ── Auth ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('PLEASE LOG IN... (3 min)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }
    await page.waitForTimeout(3000);
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(await page.context().storageState(), null, 2));

    // Navigate to FITO form builder to get JWT
    await page.goto(`${BPA_URL}/services/${FITO_ID}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);

    const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));
    console.log('JWT available:', !!jwt);

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
          return { status: resp.status, body: text };
        } catch (e) {
          return { error: e.message };
        }
      }, { method, endpoint, body, jwt });
    }

    const behEndpoint = `/bparest/bpa/v2016/06/service/${FITO_ID}/behaviour`;

    // ── Create behaviour with correct jsonDeterminants for Block12 ──
    console.log('=== Creating behaviour for applicantBlock12 with determinantId reference ===');

    const jsonDeterminants = JSON.stringify([{
      type: 'OR',
      items: [{
        type: 'OR',
        determinantId: RADIO_DET_ID
      }]
    }]);

    const payload = {
      componentKey: 'applicantBlock12',
      effects: [{
        sortOrderNumber: 0,
        jsonDeterminants: jsonDeterminants,
        propertyEffects: [
          { name: 'activate', type: 'boolean', value: 'true' }
        ]
      }]
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    const createResult = await apiCall('POST', behEndpoint, payload);
    console.log('\nPOST result:', createResult.status);
    console.log('Response:', createResult.body);

    if (createResult.status === 200 || createResult.status === 201) {
      const data = JSON.parse(createResult.body);
      const behaviourId = data.id;
      const effectId = data.effects?.[0]?.id;
      console.log('\n✅ Behaviour created!');
      console.log('Behaviour ID:', behaviourId);
      console.log('Effect ID:', effectId);
      console.log('Has jsonDeterminants:', !!data.effects?.[0]?.jsonDeterminants);
      console.log('jsonDeterminants:', data.effects?.[0]?.jsonDeterminants);
      fs.writeFileSync(path.join(API_DIR, 'fito-block12-behaviour.json'), JSON.stringify(data, null, 2));

      // Update these values in the output for manual update via MCP
      console.log(`\n=== MCP UPDATE NEEDED ===`);
      console.log(`form_component_update(service_id="${FITO_ID}", component_key="applicantBlock12", updates={"behaviourId": "${behaviourId}", "effectsIds": ["${effectId}"]})`);
    } else {
      console.log('FAILED!');
    }

    // ── Verify all Fito behaviours ──
    console.log('\n=== All Fito behaviours ===');
    const allBeh = await apiCall('GET', behEndpoint);
    if (allBeh.status === 200) {
      const behaviours = JSON.parse(allBeh.body);
      console.log(`Total: ${behaviours.length}`);
      const block12 = behaviours.find(b => b.componentKey === 'applicantBlock12');
      if (block12) {
        console.log('Block12 behaviour:');
        console.log(JSON.stringify(block12, null, 2));
      }
    }

    console.log('\nDone.');
    await page.waitForTimeout(5_000);
  });
});
