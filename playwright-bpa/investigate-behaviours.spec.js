// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const API_DIR = path.join(__dirname, 'api-responses');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// IDs we want to investigate
const WORKING_BEHAVIOUR_ID = '448beb4f-86ce-43f7-998d-68c26ee1ec6d'; // PE Expirado (works in UI)
const MCP_BEHAVIOUR_ID = 'b8620b17-d876-4e9f-b3e6-d19eb3d6e5dc';     // Fito Block12 (MCP-created)

// Grid determinant we created via REST API for CertAprobacion
const GRID_DET_ID = 'ae522e53-04da-4be9-a32b-407567bb6f57';

test.describe('Investigate Behaviour REST API', () => {
  test.beforeAll(() => {
    fs.mkdirSync(API_DIR, { recursive: true });
  });

  test('Fetch raw behaviours and find the correct format', async ({ page }) => {
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
    async function apiGet(endpoint) {
      return page.evaluate(async ({ endpoint, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${jwt}` }
          });
          const text = await resp.text();
          return { status: resp.status, body: text };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, jwt });
    }

    async function apiPost(endpoint, body) {
      return page.evaluate(async ({ endpoint, body, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const text = await resp.text();
          return { status: resp.status, body: text };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, body, jwt });
    }

    async function apiPut(endpoint, body) {
      return page.evaluate(async ({ endpoint, body, jwt }) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const text = await resp.text();
          return { status: resp.status, body: text };
        } catch (e) {
          return { error: e.message };
        }
      }, { endpoint, body, jwt });
    }

    // ── Step 1: Fetch ALL behaviours ──
    console.log('\n=== Fetching all behaviours ===');
    const behavioursResult = await apiGet(`/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour`);
    console.log('Behaviours status:', behavioursResult.status);

    if (behavioursResult.status === 200) {
      const behaviours = JSON.parse(behavioursResult.body);
      console.log(`Total behaviours: ${behaviours.length}`);
      fs.writeFileSync(path.join(API_DIR, 'all-behaviours-raw.json'), JSON.stringify(behaviours, null, 2));

      // Find the two we want to compare
      const workingBehaviour = behaviours.find(b => b.id === WORKING_BEHAVIOUR_ID);
      const mcpBehaviour = behaviours.find(b => b.id === MCP_BEHAVIOUR_ID);

      if (workingBehaviour) {
        console.log('\n=== WORKING Behaviour (PE Expirado) ===');
        console.log(JSON.stringify(workingBehaviour, null, 2));
        fs.writeFileSync(path.join(API_DIR, 'working-behaviour.json'), JSON.stringify(workingBehaviour, null, 2));
      } else {
        console.log('Working behaviour not found!');
      }

      if (mcpBehaviour) {
        console.log('\n=== MCP-CREATED Behaviour (Fito Block12) ===');
        console.log(JSON.stringify(mcpBehaviour, null, 2));
        fs.writeFileSync(path.join(API_DIR, 'mcp-behaviour.json'), JSON.stringify(mcpBehaviour, null, 2));
      } else {
        console.log('MCP behaviour not found!');
      }

      // Also show any other behaviours to understand the pattern
      console.log('\n=== All behaviour IDs and component keys ===');
      behaviours.forEach(b => {
        console.log(`  ${b.id} → component: ${b.componentKey || b.component_key || 'unknown'}`);
      });
    }

    // ── Step 2: Try specific behaviour GET endpoints ──
    console.log('\n=== Trying specific behaviour endpoint ===');
    const specificBeh = await apiGet(`/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour/${WORKING_BEHAVIOUR_ID}`);
    console.log('Specific behaviour GET:', specificBeh.status);
    if (specificBeh.status === 200) {
      console.log(specificBeh.body.substring(0, 1000));
    }

    // ── Step 3: Also try componentaction endpoint to see the data structure ──
    console.log('\n=== Checking componentaction for reference ===');
    const actions = await apiGet(`/bparest/bpa/v2016/06/service/${BITACORA_ID}/componentaction`);
    console.log('ComponentAction status:', actions.status);

    // ── Step 4: Try POST/PUT on behaviour endpoint ──
    console.log('\n=== Testing behaviour write endpoints ===');

    // First, let's see what methods are supported
    const behEndpoint = `/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour`;

    // Try POST with a minimal behaviour
    const postTest = await apiPost(behEndpoint, {
      componentKey: 'applicantExpiradoCertAprobacion',
      serviceId: BITACORA_ID,
      effects: [{
        determinants: JSON.stringify({
          type: 'OR',
          items: [{
            type: 'OR',
            determinantId: GRID_DET_ID
          }]
        }),
        propertyEffects: [
          { name: 'activate', value: 'true' }
        ]
      }]
    });
    console.log('POST behaviour:', postTest.status);
    console.log('POST response:', postTest.body?.substring(0, 1000));

    // Try PUT
    const putTest = await apiPut(behEndpoint, {
      componentKey: 'applicantExpiradoCertAprobacion',
      serviceId: BITACORA_ID,
      effects: [{
        determinants: JSON.stringify({
          type: 'OR',
          items: [{
            type: 'OR',
            determinantId: GRID_DET_ID
          }]
        }),
        propertyEffects: [
          { name: 'activate', value: 'true' }
        ]
      }]
    });
    console.log('PUT behaviour:', putTest.status);
    console.log('PUT response:', putTest.body?.substring(0, 1000));

    // ── Step 5: Check the form data to see how behaviourId is linked ──
    console.log('\n=== Checking form data ===');
    const formResult = await apiGet(`/bparest/bpa/v2016/06/service/${BITACORA_ID}/applicant-form`);
    if (formResult.status === 200) {
      const formData = JSON.parse(formResult.body);
      // Find the component with the working behaviour
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

      // Check how the working component references its behaviour
      const expiradoComp = findComponent(formData, 'applicantExpirado');
      if (expiradoComp) {
        console.log('\napplicantExpirado component (working):');
        console.log('  behaviourId:', expiradoComp.behaviourId);
        console.log('  effectsIds:', JSON.stringify(expiradoComp.effectsIds));
      }

      const block12Comp = findComponent(formData, 'applicantBlock12');
      if (block12Comp) {
        console.log('\napplicantBlock12 component (MCP-created):');
        console.log('  behaviourId:', block12Comp.behaviourId);
        console.log('  effectsIds:', JSON.stringify(block12Comp.effectsIds));
      }

      const expiradoCertComp = findComponent(formData, 'applicantExpiradoCertAprobacion');
      if (expiradoCertComp) {
        console.log('\napplicantExpiradoCertAprobacion component (no effect):');
        console.log('  behaviourId:', expiradoCertComp.behaviourId);
        console.log('  effectsIds:', JSON.stringify(expiradoCertComp.effectsIds));
      }
    }

    console.log('\nDone.');
    await page.waitForTimeout(5_000);
  });
});
