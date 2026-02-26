// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// Grid determinant we created via REST API for CertAprobacion Expirado
const GRID_DET_ID = 'ae522e53-04da-4be9-a32b-407567bb6f57';

// Empty behaviour we just created by mistake (needs deletion)
const EMPTY_BEHAVIOUR_ID = '7ae5555b-c1a8-4869-8669-fbe4d0e2f458';

test.describe('Create Correct Behaviour with determinantId', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Create behaviour with jsonDeterminants field', async ({ page }) => {
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

    await page.goto(`${BPA_URL}/services/${BITACORA_ID}/forms/applicant-form`, {
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

    const behEndpoint = `/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour`;

    // ── Step 1: Delete the empty behaviour we created by mistake ──
    console.log('=== Deleting empty behaviour ===');
    const delResult = await apiCall('DELETE', `${behEndpoint}/${EMPTY_BEHAVIOUR_ID}`);
    console.log('DELETE:', delResult.status, delResult.body?.substring(0, 200));

    // If DELETE on /behaviour/{id} doesn't work, try general endpoint
    if (delResult.status >= 400) {
      const delResult2 = await apiCall('DELETE', behEndpoint, { id: EMPTY_BEHAVIOUR_ID });
      console.log('DELETE via body:', delResult2.status, delResult2.body?.substring(0, 200));
    }

    // ── Step 2: Create behaviour with CORRECT format matching working example ──
    // Working example has jsonDeterminants as a JSON STRING:
    // "[{\"type\":\"OR\",\"items\":[{\"type\":\"OR\",\"determinantId\":\"2b43313a-...\"}]}]"
    console.log('\n=== Creating behaviour with correct jsonDeterminants ===');

    const jsonDeterminants = JSON.stringify([{
      type: 'OR',
      items: [{
        type: 'OR',
        determinantId: GRID_DET_ID
      }]
    }]);

    const payload = {
      componentKey: 'applicantExpiradoCertAprobacion',
      effects: [{
        sortOrderNumber: 0,
        jsonDeterminants: jsonDeterminants,
        propertyEffects: [
          { name: 'activate', type: 'boolean', value: 'true' },
          { name: 'disabled', type: 'boolean', value: 'false' },
          { name: 'show', type: 'boolean', value: 'true' }
        ]
      }]
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    const createResult = await apiCall('POST', behEndpoint, payload);
    console.log('\nPOST result:', createResult.status);
    console.log('Response:', createResult.body);

    let behaviourId = null;
    let effectId = null;

    if (createResult.status === 200 || createResult.status === 201) {
      const data = JSON.parse(createResult.body);
      behaviourId = data.id;
      effectId = data.effects?.[0]?.id;
      console.log('\nBehaviour ID:', behaviourId);
      console.log('Effect ID:', effectId);
      console.log('Has jsonDeterminants:', !!data.effects?.[0]?.jsonDeterminants);
      console.log('jsonDeterminants value:', data.effects?.[0]?.jsonDeterminants);
      fs.writeFileSync(path.join(API_DIR, 'created-behaviour-correct.json'), JSON.stringify(data, null, 2));
    }

    // ── Step 3: Verify by fetching the behaviour back ──
    if (behaviourId) {
      console.log('\n=== Verifying created behaviour ===');
      const verifyResult = await apiCall('GET', `${behEndpoint}`);
      if (verifyResult.status === 200) {
        const allBeh = JSON.parse(verifyResult.body);
        const ourBeh = allBeh.find(b => b.id === behaviourId);
        if (ourBeh) {
          console.log('Verified behaviour:');
          console.log(JSON.stringify(ourBeh, null, 2));
        } else {
          console.log('Behaviour not found in list!');
        }
      }
    }

    // ── Step 4: Update the form component with behaviourId and effectsIds ──
    if (behaviourId && effectId) {
      console.log('\n=== Updating form component ===');

      // First, get the form to find the component
      const formResult = await apiCall('GET', `/bparest/bpa/v2016/06/service/${BITACORA_ID}/applicant-form`);
      if (formResult.status === 200) {
        const formData = JSON.parse(formResult.body);
        const formId = formData.id;
        console.log('Form ID:', formId);

        // Find and update the component
        function findAndUpdate(obj) {
          if (!obj) return false;
          if (obj.key === 'applicantExpiradoCertAprobacion') {
            obj.behaviourId = behaviourId;
            obj.effectsIds = [effectId];
            return true;
          }
          if (Array.isArray(obj.components)) {
            for (const c of obj.components) {
              if (findAndUpdate(c)) return true;
            }
          }
          if (Array.isArray(obj.columns)) {
            for (const col of obj.columns) {
              if (Array.isArray(col.components)) {
                for (const c of col.components) {
                  if (findAndUpdate(c)) return true;
                }
              }
            }
          }
          return false;
        }

        const found = findAndUpdate(formData);
        console.log('Component found and updated:', found);

        if (found) {
          // Save the form
          console.log('Saving form with updated component...');
          const saveResult = await apiCall('PUT',
            `/bparest/bpa/v2016/06/applicant-form/${formId}`,
            formData
          );
          console.log('Form save result:', saveResult.status);
          if (saveResult.status !== 200) {
            console.log('Save error:', saveResult.body?.substring(0, 500));
          } else {
            console.log('Form SAVED successfully!');
          }
        }
      }
    }

    // ── Step 5: Also check if there's a "broken" MCP behaviour for Block12 ──
    // that we should investigate
    console.log('\n=== Checking Fito Block12 MCP behaviour ===');
    // It was not in Bitacora behaviours list. Check if it exists as orphan
    const fito_beh = await apiCall('GET', `/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour/b8620b17-d876-4e9f-b3e6-d19eb3d6e5dc`);
    console.log('Fito Block12 behaviour status:', fito_beh.status);
    if (fito_beh.body) console.log('Body:', fito_beh.body.substring(0, 300));

    // Check in Fito service instead
    const FITO_ID = '2c91808893792e2b019379310a8003a9';
    const fito_beh2 = await apiCall('GET', `/bparest/bpa/v2016/06/service/${FITO_ID}/behaviour`);
    console.log('\nFito service behaviours:', fito_beh2.status);
    if (fito_beh2.status === 200) {
      const fitoBehaviours = JSON.parse(fito_beh2.body);
      console.log(`Total Fito behaviours: ${fitoBehaviours.length}`);
      const mcpBeh = fitoBehaviours.find(b => b.id === 'b8620b17-d876-4e9f-b3e6-d19eb3d6e5dc');
      if (mcpBeh) {
        console.log('Found MCP behaviour in FITO service:');
        console.log(JSON.stringify(mcpBeh, null, 2));
      } else {
        console.log('MCP behaviour NOT found in Fito either!');
        fitoBehaviours.forEach(b => {
          console.log(`  ${b.id} → ${b.componentKey}`);
        });
      }
    }

    console.log('\nDone.');
    await page.waitForTimeout(5_000);
  });
});
