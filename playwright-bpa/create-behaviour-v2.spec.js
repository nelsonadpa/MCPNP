// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// Grid determinant created via REST API for CertAprobacion Expirado
const GRID_DET_ID = 'ae522e53-04da-4be9-a32b-407567bb6f57';

test.describe('Create Correct Behaviour v2', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Create behaviour with jsonDeterminants and update form', async ({ page }) => {
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

    // ── Step 1: Create behaviour with CORRECT jsonDeterminants ──
    console.log('=== Creating behaviour with correct jsonDeterminants ===');

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
      console.log('\n✅ Behaviour created!');
      console.log('Behaviour ID:', behaviourId);
      console.log('Effect ID:', effectId);
      console.log('Has jsonDeterminants:', !!data.effects?.[0]?.jsonDeterminants);
      console.log('jsonDeterminants:', data.effects?.[0]?.jsonDeterminants);
      fs.writeFileSync(path.join(API_DIR, 'created-behaviour-v2.json'), JSON.stringify(data, null, 2));
    } else {
      console.log('FAILED to create behaviour');
      return;
    }

    // ── Step 2: Verify by re-fetching ──
    console.log('\n=== Verifying behaviour ===');
    const allBeh = await apiCall('GET', behEndpoint);
    if (allBeh.status === 200) {
      const behaviours = JSON.parse(allBeh.body);
      const ourBeh = behaviours.find(b => b.id === behaviourId);
      if (ourBeh) {
        console.log('Verified behaviour from list:');
        console.log(JSON.stringify(ourBeh, null, 2));
      } else {
        console.log('⚠️ Behaviour NOT found in list!');
      }
    }

    // ── Step 3: Update form component with behaviourId and effectsIds ──
    console.log('\n=== Updating form component ===');
    const formResult = await apiCall('GET', `/bparest/bpa/v2016/06/service/${BITACORA_ID}/applicant-form`);
    if (formResult.status === 200) {
      const formData = JSON.parse(formResult.body);
      const formId = formData.id;
      console.log('Form ID:', formId);

      // Recursively find and update the component
      function findAndUpdate(obj) {
        if (!obj) return false;
        if (obj.key === 'applicantExpiradoCertAprobacion') {
          console.log('Found component! Current state:');
          console.log('  behaviourId:', obj.behaviourId || '(empty)');
          console.log('  effectsIds:', JSON.stringify(obj.effectsIds) || '(empty)');
          obj.behaviourId = behaviourId;
          obj.effectsIds = [effectId];
          console.log('Updated to:');
          console.log('  behaviourId:', obj.behaviourId);
          console.log('  effectsIds:', JSON.stringify(obj.effectsIds));
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
      if (!found) {
        console.log('⚠️ Component not found in form!');
        return;
      }

      // Save the form
      console.log('\nSaving form...');
      const saveResult = await apiCall('PUT',
        `/bparest/bpa/v2016/06/applicant-form/${formId}`,
        formData
      );
      console.log('Form save result:', saveResult.status);
      if (saveResult.status === 200) {
        console.log('✅ Form SAVED successfully!');
      } else {
        console.log('Save error:', saveResult.body?.substring(0, 500));
      }
    }

    // ── Step 4: Final verification ──
    console.log('\n=== Final verification ===');

    // Re-fetch form to confirm
    const verifyForm = await apiCall('GET', `/bparest/bpa/v2016/06/service/${BITACORA_ID}/applicant-form`);
    if (verifyForm.status === 200) {
      const formData = JSON.parse(verifyForm.body);
      function findComponent(obj, key) {
        if (!obj) return null;
        if (obj.key === key) return obj;
        if (Array.isArray(obj.components)) {
          for (const c of obj.components) {
            const found = findComponent(c, key);
            if (found) return found;
          }
        }
        if (Array.isArray(obj.columns)) {
          for (const col of obj.columns) {
            if (Array.isArray(col.components)) {
              for (const c of col.components) {
                const found = findComponent(c, key);
                if (found) return found;
              }
            }
          }
        }
        return null;
      }

      const comp = findComponent(formData, 'applicantExpiradoCertAprobacion');
      if (comp) {
        console.log('applicantExpiradoCertAprobacion after save:');
        console.log('  behaviourId:', comp.behaviourId);
        console.log('  effectsIds:', JSON.stringify(comp.effectsIds));
        console.log('  ✅ Both set!' + (comp.behaviourId && comp.effectsIds?.length > 0 ? ' SUCCESS' : ' FAILED'));
      }
    }

    // Also re-fetch the behaviour to confirm jsonDeterminants persisted
    const finalBeh = await apiCall('GET', behEndpoint);
    if (finalBeh.status === 200) {
      const behaviours = JSON.parse(finalBeh.body);
      const ourBeh = behaviours.find(b => b.id === behaviourId);
      if (ourBeh) {
        const hasDetId = ourBeh.effects?.[0]?.jsonDeterminants?.includes('determinantId');
        console.log('\nBehaviour jsonDeterminants check:');
        console.log('  Contains determinantId:', hasDetId);
        console.log('  jsonDeterminants:', ourBeh.effects?.[0]?.jsonDeterminants);
      }
    }

    console.log('\nDone! Check in BPA UI if the Expirado badge now shows the determinant properly.');
    await page.waitForTimeout(5_000);
  });
});
