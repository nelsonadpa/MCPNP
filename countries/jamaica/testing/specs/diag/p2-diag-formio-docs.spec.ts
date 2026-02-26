import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Map Formio data structure for document validation
 * - What keys exist for isdocvalid*?
 * - What's inside loadDocumentData/documentsTabDocuments?
 * - Click Yes via Playwright (not evaluate) and diff data
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Formio document validation data', async ({ page }) => {
  test.setTimeout(120_000);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  await page.goto('/part-b');
  await page.waitForTimeout(5000);
  await page.locator('span.status-badge:has-text("File pending")').first().click();
  await page.waitForTimeout(5000);

  await page.locator('a:has-text("Documents")').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button.btn-link:visible').first().click();
  await page.waitForTimeout(3000);

  // 1. Dump all isdocvalid* keys and document data structure
  console.log('\n══ Formio data: isdocvalid + document structure ══');
  const formioDetails = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return ['No Formio'];
    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];
      const data = form?.submission?.data;
      if (!data) continue;

      results.push(`\nForm ${k} (${Object.keys(data).length} keys):`);

      // Find all keys containing 'isdoc', 'docvalid', 'document', 'valid'
      const matchingKeys = Object.keys(data).filter(key =>
        key.toLowerCase().includes('isdoc') ||
        key.toLowerCase().includes('docvalid') ||
        key.toLowerCase().includes('isvalid') ||
        key.toLowerCase().includes('filevalidated')
      );

      if (matchingKeys.length > 0) {
        results.push(`  isdoc/valid keys: ${matchingKeys.length}`);
        for (const mk of matchingKeys) {
          results.push(`    ${mk}: ${JSON.stringify(data[mk])?.substring(0, 100)}`);
        }
      }

      // Dump loadDocumentData structure (first 2 items)
      if (data.loadDocumentData) {
        const docs = typeof data.loadDocumentData === 'string'
          ? JSON.parse(data.loadDocumentData)
          : data.loadDocumentData;
        if (Array.isArray(docs)) {
          results.push(`  loadDocumentData: ${docs.length} items`);
          for (let i = 0; i < Math.min(docs.length, 3); i++) {
            results.push(`    [${i}]: ${JSON.stringify(docs[i])?.substring(0, 200)}`);
          }
        }
      }

      if (data.documentsTabDocuments) {
        const docs = typeof data.documentsTabDocuments === 'string'
          ? JSON.parse(data.documentsTabDocuments)
          : data.documentsTabDocuments;
        if (Array.isArray(docs)) {
          results.push(`  documentsTabDocuments: ${docs.length} items`);
          for (let i = 0; i < Math.min(docs.length, 3); i++) {
            results.push(`    [${i}]: ${JSON.stringify(docs[i])?.substring(0, 200)}`);
          }
        }
      }

      // Also dump the Formio component tree for the carousel section
      // Look for components with key containing 'isdoc' or 'docvalid'
      const findComponents = (comps: any[], depth = 0): any[] => {
        const found: any[] = [];
        if (!comps) return found;
        for (const c of comps) {
          if (c.key?.toLowerCase().includes('isdoc') || c.key?.toLowerCase().includes('valid') || c.type === 'checkbox') {
            found.push({ key: c.key, type: c.type, label: c.label?.substring(0, 40), depth });
          }
          if (c.components) found.push(...findComponents(c.components, depth + 1));
          if (c.columns) {
            for (const col of c.columns) {
              if (col.components) found.push(...findComponents(col.components, depth + 1));
            }
          }
          if (c.rows && Array.isArray(c.rows)) {
            for (const row of c.rows) {
              if (!Array.isArray(row)) continue;
              for (const cell of row) {
                if (cell?.components) found.push(...findComponents(cell.components, depth + 1));
              }
            }
          }
        }
        return found;
      };

      if (form.form?.components) {
        const checkboxes = findComponents(form.form.components);
        if (checkboxes.length > 0) {
          results.push(`  Relevant components (checkboxes/valid): ${checkboxes.length}`);
          for (const c of checkboxes.slice(0, 20)) {
            results.push(`    key="${c.key}" type=${c.type} label="${c.label}"`);
          }
        }
      }
    }

    return results;
  });

  for (const line of formioDetails) {
    console.log(`  ${line}`);
  }

  // 2. Find the input element for the Yes radio
  console.log('\n══ Input elements for isdocvalid ══');
  const inputInfo = await page.evaluate(() => {
    const results: string[] = [];

    // Find all inputs with id containing "isdocvalid"
    const inputs = document.querySelectorAll('input[id*="isdocvalid"], input[name*="isdocvalid"]');
    results.push(`Found ${inputs.length} isdocvalid inputs`);
    inputs.forEach((input, i) => {
      const inp = input as HTMLInputElement;
      results.push(`  [${i}] id="${inp.id}" name="${inp.name}" type="${inp.type}" checked=${inp.checked} value="${inp.value}" visible=${inp.offsetParent !== null}`);
    });

    // Also check all checkbox/radio inputs in the active carousel item
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (activeItem) {
      const activeInputs = activeItem.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      results.push(`\nActive item inputs: ${activeInputs.length}`);
      activeInputs.forEach((input, i) => {
        const inp = input as HTMLInputElement;
        results.push(`  [${i}] id="${inp.id}" name="${inp.name}" type="${inp.type}" checked=${inp.checked} value="${inp.value}"`);
      });
    }

    return results;
  });
  for (const line of inputInfo) {
    console.log(`  ${line}`);
  }

  // 3. Navigate to doc 2 (which is unvalidated) via carousel
  console.log('\n══ Navigate to doc 2 ══');
  await page.evaluate(() => {
    const $ = (window as any).$;
    if ($) $('.carousel').carousel(1); // Go to index 1 (doc 2)
  });
  await page.waitForTimeout(2000);

  // Check inputs on doc 2
  const doc2Inputs = await page.evaluate(() => {
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (!activeItem) return ['no active item'];
    const results: string[] = [];

    const inputs = activeItem.querySelectorAll('input');
    results.push(`Active item has ${inputs.length} inputs`);
    inputs.forEach((inp, i) => {
      results.push(`  [${i}] id="${inp.id}" name="${inp.name}" type="${inp.type}" checked=${inp.checked} value="${inp.value}"`);
    });

    // Also find the label for "Yes"
    const labels = activeItem.querySelectorAll('label');
    labels.forEach((lbl, i) => {
      const text = lbl.textContent?.trim();
      if (text === 'Yes' || text === 'No') {
        results.push(`  Label: "${text}" for="${lbl.getAttribute('for')}" at (${Math.round(lbl.getBoundingClientRect().x)},${Math.round(lbl.getBoundingClientRect().y)}) ${Math.round(lbl.getBoundingClientRect().width)}x${Math.round(lbl.getBoundingClientRect().height)}`);
      }
    });

    return results;
  });
  for (const line of doc2Inputs) {
    console.log(`  ${line}`);
  }

  // 4. Snapshot BEFORE clicking Yes on doc 2
  const beforeSnapshot = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return {};
    const result: Record<string, any> = {};
    for (const k of Object.keys(formio.forms)) {
      const data = formio.forms[k]?.submission?.data;
      if (data) result[k] = JSON.parse(JSON.stringify(data));
    }
    return result;
  });

  // 5. Try clicking the Yes label via page.click at coordinates
  console.log('\n══ Clicking Yes on doc 2 ══');
  const yesCoords = await page.evaluate(() => {
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    if (!activeItem) return null;
    const labels = activeItem.querySelectorAll('label');
    for (const lbl of labels) {
      if (lbl.textContent?.trim() === 'Yes') {
        const rect = lbl.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
    }
    return null;
  });

  if (yesCoords) {
    console.log(`  Clicking at (${Math.round(yesCoords.x)}, ${Math.round(yesCoords.y)})...`);
    await page.mouse.click(yesCoords.x, yesCoords.y);
    await page.waitForTimeout(3000);

    // Check what changed
    const afterSnapshot = await page.evaluate(() => {
      const formio = (window as any).Formio;
      if (!formio?.forms) return {};
      const result: Record<string, any> = {};
      for (const k of Object.keys(formio.forms)) {
        const data = formio.forms[k]?.submission?.data;
        if (data) result[k] = JSON.parse(JSON.stringify(data));
      }
      return result;
    });

    console.log('\n  Data changes after Yes click:');
    let totalChanges = 0;
    for (const fk of Object.keys(beforeSnapshot)) {
      const before = beforeSnapshot[fk];
      const after = afterSnapshot[fk];
      if (!after) continue;

      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
      for (const key of allKeys) {
        const bVal = JSON.stringify(before[key]);
        const aVal = JSON.stringify(after[key]);
        if (bVal !== aVal) {
          console.log(`    Form ${fk}: ${key}: ${bVal?.substring(0, 80)} → ${aVal?.substring(0, 80)}`);
          totalChanges++;
        }
      }
    }
    if (totalChanges === 0) {
      console.log('    NO CHANGES (click not registered by Formio)');
    }

    // Check checkbox state
    const afterInputState = await page.evaluate(() => {
      const activeItem = document.querySelector('.carousel-item.active, .item.active');
      if (!activeItem) return 'no active';
      const inputs = activeItem.querySelectorAll('input');
      const results: string[] = [];
      inputs.forEach(inp => {
        if (inp.id?.includes('isdocvalid') || inp.name?.includes('isdocvalid')) {
          results.push(`${inp.id}: checked=${inp.checked}`);
        }
      });
      return results;
    });
    console.log('  Input states:');
    if (Array.isArray(afterInputState)) {
      for (const line of afterInputState) {
        console.log(`    ${line}`);
      }
    }
  } else {
    console.log('  No Yes label coordinates found');
  }

  // 6. Try method: find the Formio checkbox component instance and setValue
  console.log('\n══ Strategy: Formio component setValue ══');
  const setValueResult = await page.evaluate(() => {
    const formio = (window as any).Formio;
    if (!formio?.forms) return 'No Formio';

    const results: string[] = [];

    for (const k of Object.keys(formio.forms)) {
      const form = formio.forms[k];

      // Walk all components recursively
      const walkComponents = (component: any, path = ''): any[] => {
        const found: any[] = [];
        if (!component) return found;

        const key = component.key || '';
        const fullPath = path ? `${path}.${key}` : key;

        if (key.toLowerCase().includes('isdoc') || key.toLowerCase().includes('docvalid') ||
            key.toLowerCase().includes('filevalidated') || key.toLowerCase().includes('btnvalidate')) {
          found.push({
            key,
            type: component.type,
            path: fullPath,
            value: component.getValue?.(),
            hasSetValue: typeof component.setValue === 'function',
          });
        }

        if (component.components) {
          for (const c of component.components) {
            found.push(...walkComponents(c, fullPath));
          }
        }
        if (component.columns) {
          for (const col of component.columns) {
            if (col.components) {
              for (const c of col.components) {
                found.push(...walkComponents(c, fullPath));
              }
            }
          }
        }
        return found;
      };

      // Get the root Formio component
      if (form.root) {
        const relevant = walkComponents(form.root);
        results.push(`Form ${k}: ${relevant.length} relevant components`);
        for (const r of relevant.slice(0, 30)) {
          results.push(`  key="${r.key}" type=${r.type} value=${JSON.stringify(r.value)?.substring(0, 60)} hasSetValue=${r.hasSetValue}`);
        }
      }
    }

    return results;
  });

  if (Array.isArray(setValueResult)) {
    for (const line of setValueResult) {
      console.log(`  ${line}`);
    }
  } else {
    console.log(`  ${setValueResult}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/76-formio-doc-data.png` });
  console.log('\n══ DONE ══');
});
