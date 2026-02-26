// @ts-check
// Fix Expirado badge determinant + behaviour for ALL EditGrids in Bitacora
// Creates grid+date determinant + behaviour for each Expirado badge
// Then outputs MCP commands for form_component_update
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');
const RESULTS_DIR = path.join(__dirname, 'api-responses', 'expirado');
const BPA_URL = 'https://bpa.cuba.eregistrations.org';
const BITACORA_ID = 'ffe746aac09241078bad48c9b95cdfe0';

// ── Badge inventory ──
// [badgeKey, editGridKey, dateColumnKey, action, existingBehaviourId?]
// action: 'create' = new grid det + behaviour
//         'link_only' = just form_component_update with existing behaviourId
//         'recreate' = delete wrong behaviour, create new grid det + behaviour
//         'skip' = already correct
const BADGES = [
  // #1 PE Expirado - CORRECT, skip
  // ['applicantExpirado', 'applicantEditGrid', 'applicantExpiracion', 'skip'],

  // #2 Fito - has behaviour f2394e29, just needs component link
  ['applicantExpiradoFito', 'applicantEditGridFito', 'applicantExpiracionFito', 'link_only', 'f2394e29'],

  // #3 Zoo - wrong det (points to PE's grid)
  ['applicantExpiradoZoo', 'applicantEditGridZoo', 'applicantExpiracionZoo', 'recreate'],

  // #4 ONURE (key is applicantPermisoZoosanitario, misleading!)
  ['applicantExpirado2', 'applicantPermisoZoosanitario', 'applicantVigenteHasta2', 'recreate'],

  // #5 Sustancias
  ['applicantExpiradoSustancias', 'applicantEditGridSustancias', 'applicantExpiracionSustancias', 'recreate'],

  // #6 Sanitario
  ['applicantExpiradoSanitario', 'applicantEditGridSanitario', 'applicantFechaSanitario', 'recreate'],

  // #7 CertAprobacion - CORRECT, skip
  // ['applicantExpiradoCertAprobacion', 'applicantEditGridCertAprobacion', 'applicantFechaCertAprobacion', 'skip'],

  // #8 ONN - MISSING + needs deactivated CSS
  ['applicantExpiradoOnn', 'applicantEditGridOnn', 'applicantFechaOnn', 'create'],

  // #9 Donativos - MISSING
  ['applicantExpiradoDonativos', 'applicantEditGridDonativos', 'applicantFechaDonativos', 'create'],

  // #10 Homologacion - MISSING
  ['applicantExpiradoHomologacion', 'applicantEditGridHomologacion', 'applicantFechaHomologacion', 'create'],

  // #11 CyP - MISSING
  ['applicantExpiradoCyp', 'applicantEditGridCyp', 'applicantFechaCyp', 'create'],

  // #12 CECMED - MISSING
  ['applicantExpiradoCecmed', 'applicantEditGridCecmed', 'applicantFechaCecmed', 'create'],

  // #13 Sucursales - MISSING
  ['applicantExpiradoSucursales', 'applicantEditGridSucursales', 'applicantHastaSucursales', 'create'],

  // #14 INHEM - MISSING
  ['applicantExpiradoInhem', 'applicantEditGridInhem', 'applicantVigenciaInhem', 'create'],

  // #15 CENASA - MISSING
  ['applicantExpiradoCenasa', 'applicantEditGridCenasa', 'applicantHastaCenasa', 'create'],

  // #16 Reg. Sustancias fisc. - MISSING
  ['applicantExpiradoRegSust', 'applicantEditGridRegSust', 'applicantHastaRegSust', 'create'],

  // #17 Seg. ambiental - MISSING
  ['applicantExpiradoSegAmb', 'applicantEditGridSegAmb', 'applicantHastaSegAmb', 'create'],
];

// Human-readable names for logging
const BADGE_NAMES = {
  applicantExpiradoFito: 'Fito',
  applicantExpiradoZoo: 'Zoo',
  applicantExpirado2: 'ONURE',
  applicantExpiradoSustancias: 'Sustancias',
  applicantExpiradoSanitario: 'Sanitario',
  applicantExpiradoOnn: 'ONN',
  applicantExpiradoDonativos: 'Donativos',
  applicantExpiradoHomologacion: 'Homologacion',
  applicantExpiradoCyp: 'CyP',
  applicantExpiradoCecmed: 'CECMED',
  applicantExpiradoSucursales: 'Sucursales',
  applicantExpiradoInhem: 'INHEM',
  applicantExpiradoCenasa: 'CENASA',
  applicantExpiradoRegSust: 'RegSustancias',
  applicantExpiradoSegAmb: 'SegAmbiental',
};

test.describe('Fix Expirado Badges - All EditGrids', () => {
  test.beforeAll(() => {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  });

  test('Create grid determinants + behaviours for all Expirado badges', async ({ page }) => {
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

    // Navigate to Bitacora form builder for JWT
    console.log('Navigating to Bitacora form builder for JWT...');
    await page.goto(`${BPA_URL}/services/${BITACORA_ID}/forms/applicant-form`, {
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

    // ── Fetch existing behaviours once for 'recreate' cleanup ──
    console.log('Fetching existing Bitacora behaviours...');
    const existingBehResult = await apiCall('GET',
      `/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour`
    );
    let existingBehaviours = [];
    if (existingBehResult.status === 200) {
      existingBehaviours = JSON.parse(existingBehResult.body);
      console.log(`Found ${existingBehaviours.length} existing behaviours in Bitacora.`);
    }

    // ── Results collector ──
    const results = [];
    const mcpCommands = [];

    for (const [badgeKey, editGridKey, dateColKey, action, existBehId] of BADGES) {
      const name = BADGE_NAMES[badgeKey] || badgeKey;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${name} (${badgeKey})`);
      console.log(`  EditGrid: ${editGridKey}, DateCol: ${dateColKey}`);
      console.log(`  Action: ${action}`);
      console.log('='.repeat(60));

      // ── link_only: just output MCP command ──
      if (action === 'link_only') {
        console.log(`  Just needs form_component_update with existing behaviourId: ${existBehId}`);

        // Fetch the behaviour to get the effectId
        const beh = existingBehaviours.find(b => b.id === existBehId);
        const effectId = beh?.effects?.[0]?.id || 'UNKNOWN';

        mcpCommands.push({
          type: 'form_component_update',
          badge: name,
          badgeKey,
          serviceId: BITACORA_ID,
          componentKey: badgeKey,
          behaviourId: existBehId,
          effectId
        });
        results.push({ badge: name, badgeKey, status: 'LINK_ONLY', behaviourId: existBehId, effectId });
        continue;
      }

      // ── recreate: find and record old behaviour for MCP deletion ──
      if (action === 'recreate') {
        const oldBeh = existingBehaviours.find(b => b.componentKey === badgeKey);
        if (oldBeh) {
          console.log(`  Found old behaviour ${oldBeh.id} - will need MCP effect_delete`);
          mcpCommands.push({
            type: 'effect_delete',
            badge: name,
            badgeKey,
            serviceId: BITACORA_ID,
            behaviourId: oldBeh.id
          });
        } else {
          console.log(`  No existing behaviour found for ${badgeKey} (proceeding as 'create')`);
        }
      }

      // ── Create grid+date determinant ──
      console.log('  Creating grid+date determinant...');
      const gridDetPayload = {
        name: `${name} fecha < hoy`,
        determinantType: 'FORMFIELD',
        serviceId: BITACORA_ID,
        targetFormFieldKey: editGridKey,
        generated: false,
        determinantInsideGrid: true,
        businessKey: `MyAccountPage${name}fecha<hoy`,
        rowDeterminant: {
          name: `Row det ${name} expirado`,
          determinantType: 'FORMFIELD',
          serviceId: BITACORA_ID,
          targetFormFieldKey: `${editGridKey}_collection_${dateColKey}`,
          generated: false,
          determinantInsideGrid: false,
          businessKey: `MyAccountPageRowdet${name}expirado`,
          operator: 'LESS_THAN',
          isCurrentDate: true,
          type: 'date',
          operatorStringValue: 'LESS_THAN',
          valueIsNullOrEmpty: true
        },
        type: 'grid',
        valueIsNullOrEmpty: true
      };

      const detResult = await apiCall('POST',
        `/bparest/bpa/v2016/06/service/${BITACORA_ID}/griddeterminant`,
        gridDetPayload
      );

      if (detResult.status !== 200 && detResult.status !== 201) {
        console.log(`  ❌ Failed to create grid determinant: ${detResult.status}`);
        console.log(`  Response: ${detResult.body?.substring(0, 300)}`);
        results.push({ badge: name, badgeKey, status: 'FAILED', step: 'grid_determinant', error: detResult.status });
        continue;
      }

      const gridDet = JSON.parse(detResult.body);
      const gridDetId = gridDet.id;
      const rowDetId = gridDet.rowDeterminant?.id;
      console.log(`  ✅ Grid determinant created: ${gridDetId}`);
      console.log(`  ✅ Row determinant created: ${rowDetId}`);

      // ── Create behaviour ──
      console.log('  Creating behaviour...');
      const jsonDeterminants = JSON.stringify([{
        type: 'OR',
        items: [{ type: 'OR', determinantId: gridDetId }]
      }]);

      const behPayload = {
        componentKey: badgeKey,
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

      const behResult = await apiCall('POST',
        `/bparest/bpa/v2016/06/service/${BITACORA_ID}/behaviour`,
        behPayload
      );

      if (behResult.status !== 200 && behResult.status !== 201) {
        console.log(`  ❌ Failed to create behaviour: ${behResult.status}`);
        console.log(`  Response: ${behResult.body?.substring(0, 300)}`);
        results.push({ badge: name, badgeKey, status: 'FAILED', step: 'behaviour', gridDetId, error: behResult.status });
        continue;
      }

      const beh = JSON.parse(behResult.body);
      const behaviourId = beh.id;
      const effectId = beh.effects?.[0]?.id;
      console.log(`  ✅ Behaviour created: ${behaviourId}`);
      console.log(`  ✅ Effect ID: ${effectId}`);

      // Record MCP command
      mcpCommands.push({
        type: 'form_component_update',
        badge: name,
        badgeKey,
        serviceId: BITACORA_ID,
        componentKey: badgeKey,
        behaviourId,
        effectId,
        gridDetId,
        rowDetId
      });

      results.push({
        badge: name,
        badgeKey,
        status: 'SUCCESS',
        gridDetId,
        rowDetId,
        behaviourId,
        effectId
      });

      // Small delay between badges
      await page.waitForTimeout(500);
    }

    // ── Summary ──
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const successes = results.filter(r => r.status === 'SUCCESS' || r.status === 'LINK_ONLY');
    const failures = results.filter(r => r.status === 'FAILED');

    console.log(`\nSuccessful: ${successes.length}/${BADGES.length}`);
    console.log(`Failed: ${failures.length}/${BADGES.length}`);

    if (failures.length > 0) {
      console.log('\nFailed badges:');
      for (const f of failures) {
        console.log(`  - ${f.badge}: step=${f.step}, error=${f.error}`);
      }
    }

    // ── MCP Commands ──
    console.log(`\n${'='.repeat(60)}`);
    console.log('MCP COMMANDS TO RUN (in order):');
    console.log('='.repeat(60));

    // First: all deletions
    const deletions = mcpCommands.filter(c => c.type === 'effect_delete');
    if (deletions.length > 0) {
      console.log('\n--- STEP 1: DELETE wrong behaviours ---');
      for (const cmd of deletions) {
        console.log(`\n# ${cmd.badge} (${cmd.badgeKey})`);
        console.log(`effect_delete(service_id="${cmd.serviceId}", behaviour_id="${cmd.behaviourId}")`);
      }
    }

    // Then: all component updates
    const updates = mcpCommands.filter(c => c.type === 'form_component_update');
    console.log('\n--- STEP 2: UPDATE components ---');
    for (const cmd of updates) {
      console.log(`\n# ${cmd.badge} (${cmd.badgeKey})`);
      console.log(`form_component_update(service_id="${cmd.serviceId}", component_key="${cmd.componentKey}", updates={"behaviourId": "${cmd.behaviourId}", "effectsIds": ["${cmd.effectId}"]})`);
    }

    // ── CSS fixes needed ──
    console.log(`\n${'='.repeat(60)}`);
    console.log('CSS FIXES (add deactivated class if missing):');
    console.log('='.repeat(60));
    console.log('Check applicantExpiradoOnn - may need customClass: "datagrid-hide-column-label deactivated"');

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
