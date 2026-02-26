// @ts-check
// Fix StatusBitacora determinant + behaviour for ALL destination services
// Creates radio determinant (StatusBitacora = TRUE) + behaviour (activate Block12)
// Then outputs MCP commands for form_component_update
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const RESULTS_DIR = path.join(__dirname, 'api-responses', 'statusbitacora');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';

// ── Service inventory ──
// Each entry: [shortName, serviceId, action]
// action: 'both' = create det + behaviour, 'behaviour_only' = skip det, 'delete_first' = delete wrong behaviour first
const SERVICES = [
  // #1 PE - already has determinant 7383e917, only needs behaviour
  ['PE', '2c918084887c7a8f01887c99ed2a6fd5', 'behaviour_only', '7383e917-4d3b-4c39-ab41-b09e17e17f8a'],
  // #2 Fito - DONE, skip
  // ['Fito', '2c91808893792e2b019379310a8003a9', 'done'],
  // #3 Zoo
  ['Zoo', '2c91808893792e2b01938d3fd5800ceb', 'both'],
  // #4 Sustancias - has wrong behaviour, delete first
  ['Sustancias', '8393ad98-a16d-4a2d-80d0-23fbbd69b9e7', 'delete_first'],
  // #5 CertSanitario
  ['CertSanitario', '2c91808893792e2b0193792f8e170001', 'both'],
  // #6 ONURE
  ['ONURE', '2c91808893792e2b0193885a0f900b09', 'both'],
  // #7 ONN
  ['ONN', '2c91808893792e2b01938868a1700b1d', 'both'],
  // #8 CECMED
  ['CECMED', '2c91808893792e2b01938dd9ebad0d05', 'both'],
  // #9 Homologacion
  ['Homologacion', '2c91808893792e2b01938876a97c0b33', 'both'],
  // #10 CyP
  ['CyP', '2c91808893792e2b01938860ec600b0d', 'both'],
  // #11 Sucursales
  ['Sucursales', '2c91808893792e2b0193886f49c80b27', 'both'],
  // #12 Donativos
  ['Donativos', '2c91808893792e2b01938de47adb0d11', 'both'],
  // #13 CertOrigen
  ['CertOrigen', '2c918084887c7a8f01889aae35000c7d', 'both'],
  // #14 CertAprobacionONN
  ['CertAprobacionONN', '2c918084887c7a8f01889ab2d6f80c91', 'both'],
  // #15 INHEM
  ['INHEM', '2c91809094f110ae0195435c8fb209b6', 'both'],
  // #16 CENASA
  ['CENASA', '2c91809095d83aac0195de8f880f03cd', 'both'],
  // #17 RegSustancias
  ['RegSustancias', '2ef97d8e-a5c7-47e8-81de-1856675139e5', 'both'],
  // #18 SegAmbiental
  ['SegAmbiental', '2c918083976cc50e01977dd5a5a90061', 'both'],
];

test.describe('Fix StatusBitacora - All Services', () => {
  test.beforeAll(() => {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  });

  test('Create radio determinants + behaviours for all services', async ({ page }) => {
    test.setTimeout(600_000); // 10 min

    // ── Auth ──
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
      await page.context().addCookies(state.cookies || []);
    }

    await page.goto(`${BPA_URL}/services`, { waitUntil: 'networkidle' });
    if (page.url().includes('/cback/') || page.url().includes('/cas/')) {
      console.log('PLEASE LOG IN MANUALLY... (3 min timeout)');
      await page.waitForURL(u => u.toString().includes('/services'), { timeout: 180_000 });
    }
    await page.waitForTimeout(3000);
    fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify(await page.context().storageState(), null, 2));

    // Navigate to first service form builder to get JWT
    const firstSvc = SERVICES[0];
    console.log(`Navigating to ${firstSvc[0]} form builder for JWT...`);
    await page.goto(`${BPA_URL}/services/${firstSvc[1]}/forms/applicant-form`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);

    const jwt = await page.evaluate(() => localStorage.getItem('tokenJWT'));
    if (!jwt) {
      console.log('ERROR: No JWT found! Login may have failed.');
      return;
    }
    console.log('JWT obtained successfully.');

    // ── API helper ──
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

    // ── Results collector ──
    const results = [];
    const mcpCommands = [];

    for (const [name, serviceId, action, existingDetId] of SERVICES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${name} (${serviceId})`);
      console.log(`Action: ${action}`);
      console.log('='.repeat(60));

      let determinantId = existingDetId || null;

      // Step 0: Delete wrong behaviour if needed (Sustancias)
      if (action === 'delete_first') {
        console.log('  Checking for existing behaviours on applicantBlock12...');
        const behList = await apiCall('GET', `/bparest/bpa/v2016/06/service/${serviceId}/behaviour`);
        if (behList.status === 200) {
          const behaviours = JSON.parse(behList.body);
          const block12Beh = behaviours.find(b => b.componentKey === 'applicantBlock12');
          if (block12Beh) {
            console.log(`  Found existing behaviour ${block12Beh.id} - will need MCP effect_delete`);
            console.log(`  >>> MCP: effect_delete(service_id="${serviceId}", behaviour_id="${block12Beh.id}")`);
            mcpCommands.push({
              type: 'effect_delete',
              service: name,
              serviceId,
              behaviourId: block12Beh.id
            });
          }
        }
      }

      // Step 1: Create radio determinant (skip if behaviour_only)
      if (action === 'both' || action === 'delete_first') {
        console.log('  Creating radio determinant...');
        const detPayload = {
          name: `status bitacora = TRUE`,
          determinantType: 'FORMFIELD',
          serviceId: serviceId,
          targetFormFieldKey: 'applicantStatusLlegaDeLaBitacora',
          generated: false,
          determinantInsideGrid: false,
          businessKey: `${name}statusbitacora=TRUE`,
          operator: 'EQUAL',
          selectValue: 'true',
          value: 'true',
          type: 'radio',
          operatorStringValue: 'EQUAL',
          valueIsNullOrEmpty: false
        };

        const detResult = await apiCall('POST',
          `/bparest/bpa/v2016/06/service/${serviceId}/radiodeterminant`,
          detPayload
        );

        if (detResult.status === 200 || detResult.status === 201) {
          const det = JSON.parse(detResult.body);
          determinantId = det.id;
          console.log(`  ✅ Determinant created: ${determinantId}`);
        } else {
          console.log(`  ❌ Failed to create determinant: ${detResult.status}`);
          console.log(`  Response: ${detResult.body?.substring(0, 300)}`);
          results.push({ service: name, serviceId, status: 'FAILED', step: 'determinant', error: detResult.status });
          continue;
        }
      }

      if (!determinantId) {
        console.log(`  ❌ No determinant ID available, skipping behaviour creation`);
        results.push({ service: name, serviceId, status: 'FAILED', step: 'no_determinant_id' });
        continue;
      }

      // Step 2: Create behaviour
      console.log('  Creating behaviour for applicantBlock12...');
      const jsonDeterminants = JSON.stringify([{
        type: 'OR',
        items: [{ type: 'OR', determinantId: determinantId }]
      }]);

      const behPayload = {
        componentKey: 'applicantBlock12',
        effects: [{
          sortOrderNumber: 0,
          jsonDeterminants: jsonDeterminants,
          propertyEffects: [
            { name: 'activate', type: 'boolean', value: 'true' }
          ]
        }]
      };

      const behResult = await apiCall('POST',
        `/bparest/bpa/v2016/06/service/${serviceId}/behaviour`,
        behPayload
      );

      if (behResult.status === 200 || behResult.status === 201) {
        const beh = JSON.parse(behResult.body);
        const behaviourId = beh.id;
        const effectId = beh.effects?.[0]?.id;
        console.log(`  ✅ Behaviour created: ${behaviourId}`);
        console.log(`  ✅ Effect ID: ${effectId}`);

        // Record MCP command needed
        const mcpCmd = {
          type: 'form_component_update',
          service: name,
          serviceId,
          componentKey: 'applicantBlock12',
          behaviourId,
          effectId,
          determinantId
        };
        mcpCommands.push(mcpCmd);

        results.push({
          service: name,
          serviceId,
          status: 'SUCCESS',
          determinantId,
          behaviourId,
          effectId
        });
      } else {
        console.log(`  ❌ Failed to create behaviour: ${behResult.status}`);
        console.log(`  Response: ${behResult.body?.substring(0, 300)}`);
        results.push({ service: name, serviceId, status: 'FAILED', step: 'behaviour', determinantId, error: behResult.status });
      }

      // Small delay between services
      await page.waitForTimeout(1000);
    }

    // ── Summary ──
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const successes = results.filter(r => r.status === 'SUCCESS');
    const failures = results.filter(r => r.status === 'FAILED');

    console.log(`\nSuccessful: ${successes.length}/${SERVICES.length}`);
    console.log(`Failed: ${failures.length}/${SERVICES.length}`);

    if (failures.length > 0) {
      console.log('\nFailed services:');
      for (const f of failures) {
        console.log(`  - ${f.service}: step=${f.step}, error=${f.error}`);
      }
    }

    // ── MCP Commands ──
    console.log(`\n${'='.repeat(60)}`);
    console.log('MCP COMMANDS TO RUN (copy-paste these):');
    console.log('='.repeat(60));

    for (const cmd of mcpCommands) {
      if (cmd.type === 'effect_delete') {
        console.log(`\n# ${cmd.service} - DELETE wrong behaviour first`);
        console.log(`effect_delete(service_id="${cmd.serviceId}", behaviour_id="${cmd.behaviourId}")`);
      } else {
        console.log(`\n# ${cmd.service}`);
        console.log(`form_component_update(service_id="${cmd.serviceId}", component_key="${cmd.componentKey}", updates={"behaviourId": "${cmd.behaviourId}", "effectsIds": ["${cmd.effectId}"]})`);
      }
    }

    // Save results
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'results.json'),
      JSON.stringify({ results, mcpCommands, timestamp: new Date().toISOString() }, null, 2)
    );
    console.log(`\nResults saved to: ${path.join(RESULTS_DIR, 'results.json')}`);

    console.log('\nDone!');
    await page.waitForTimeout(3_000);
  });
});
