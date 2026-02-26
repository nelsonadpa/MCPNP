import { test } from '@playwright/test';
import path from 'path';

test.setTimeout(300_000);

test('DOM inventory — Establish a new zone form', async ({ page }) => {

  // ── 1. Navigate to dashboard ─────────────────────────────────────────────
  console.log('\n=== [1] Opening dashboard ===');
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  console.log('Dashboard loaded.');

  // ── 2. Click "Establish a new zone" ──────────────────────────────────────
  console.log('\n=== [2] Clicking "Establish a new zone" ===');
  await page.click('text=Establish a new zone');
  await page.waitForTimeout(5_000);
  console.log('Waited 5 s after click.');

  // ── 3. Click "Form" tab, stay on "Project overview" ──────────────────────
  console.log('\n=== [3] Clicking Form tab ===');
  try {
    await page.click('text=Form', { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    console.log('Form tab clicked.');
  } catch (e) {
    console.log('Form tab not found or already on form — continuing.');
  }

  // ── 4. Expand ALL collapsed card sections ────────────────────────────────
  console.log('\n=== [4] Expanding collapsed sections ===');
  const collapsedBefore = await page.$$eval(
    '.card-header[role="button"][aria-expanded="false"]',
    (els) => els.length,
  );
  console.log(`Collapsed sections before expand: ${collapsedBefore}`);

  // Click them all
  const collapsedHeaders = await page.$$('.card-header[role="button"][aria-expanded="false"]');
  for (let i = 0; i < collapsedHeaders.length; i++) {
    try {
      await collapsedHeaders[i].click();
      await page.waitForTimeout(300);
    } catch (_) { /* already removed from DOM or hidden */ }
  }

  // Wait for animations
  await page.waitForTimeout(1_500);

  const collapsedAfter = await page.$$eval(
    '.card-header[role="button"][aria-expanded="false"]',
    (els) => els.length,
  );
  console.log(`Collapsed sections after expand: ${collapsedAfter}`);

  // ── 5. Full DOM inventory via page.evaluate() ─────────────────────────────
  console.log('\n=== [5] Running DOM inventory ===');

  const inventory = await page.evaluate(() => {

    // ── helper ──
    function vis(el: Element): boolean {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetParent !== null;
    }

    function inputType(el: Element): string {
      const inp = el.querySelector('input, textarea, select');
      if (!inp) return 'none';
      const tag = inp.tagName.toLowerCase();
      if (tag === 'select') return 'select';
      if (tag === 'textarea') return 'textarea';
      return (inp as HTMLInputElement).type || 'text';
    }

    function extractKey(el: Element): string {
      // The formio component key is encoded as class: formio-component-<key>
      const classes = Array.from(el.classList);
      const match = classes.find(c => c.startsWith('formio-component-') && c !== 'formio-component');
      return match ? match.replace('formio-component-', '') : '';
    }

    // ── A. All .formio-component elements ──
    const formioComponents = Array.from(document.querySelectorAll('.formio-component')).map(el => ({
      key: extractKey(el),
      classes: Array.from(el.classList).join(' '),
      inputType: inputType(el),
      visible: vis(el),
      tagName: el.tagName.toLowerCase(),
    }));

    // ── B. Choices.js wrappers ──
    const choicesWrappers = Array.from(document.querySelectorAll('.choices')).map(el => {
      const sel = el.querySelector('select') as HTMLSelectElement | null;
      return {
        name: sel ? (sel.name || sel.id || '(unnamed)') : '(no select)',
        choicesType: el.classList.contains('choices--single') ? 'single' : 'multiple',
        visible: vis(el),
        placeholderText: (el.querySelector('.choices__placeholder') as HTMLElement | null)?.innerText?.trim() || '',
      };
    });

    // ── C. File upload components ──
    const fileComponents = Array.from(
      document.querySelectorAll('.formio-component-file, [ref*="file"], .browse, [class*="fileSelector"]')
    ).map(el => ({
      key: extractKey(el.closest('.formio-component') || el),
      classes: Array.from(el.classList).join(' '),
      ref: el.getAttribute('ref') || '',
      tagName: el.tagName.toLowerCase(),
      visible: vis(el),
      innerText: (el as HTMLElement).innerText?.trim().slice(0, 80) || '',
    }));

    // ── D. EditGrid components ──
    const editGrids = Array.from(document.querySelectorAll('.formio-component-editgrid')).map(el => {
      const rows = el.querySelectorAll('.formio-component-editgrid > .editgrid-listgroup > li');
      const addBtn = el.querySelector('.btn[ref*="addRow"], button[class*="add"]');
      return {
        key: extractKey(el),
        classes: Array.from(el.classList).join(' '),
        rowCount: rows.length,
        addButtonText: (addBtn as HTMLElement | null)?.innerText?.trim() || '',
        visible: vis(el),
      };
    });

    // ── E. Masked inputs ──
    const maskedInputs = Array.from(
      document.querySelectorAll('input[data-inputmask], input[data-inputmask-mask], input.input-masked')
    ).map(inp => ({
      name: (inp as HTMLInputElement).name,
      id: inp.id,
      dataMask: inp.getAttribute('data-inputmask') || inp.getAttribute('data-inputmask-mask') || '',
      componentKey: extractKey(inp.closest('.formio-component') || inp),
      visible: vis(inp),
    }));

    // ── F. Radio / toggle groups ──
    const radioGroups: Record<string, { name: string; values: string[]; componentKey: string; visible: boolean }> = {};
    document.querySelectorAll('input[type="radio"]').forEach(inp => {
      const radio = inp as HTMLInputElement;
      const name = radio.name || radio.id || '(unnamed)';
      if (!radioGroups[name]) {
        radioGroups[name] = {
          name,
          values: [],
          componentKey: extractKey(inp.closest('.formio-component') || inp),
          visible: vis(inp),
        };
      }
      const label = inp.closest('label') || document.querySelector(`label[for="${inp.id}"]`);
      radioGroups[name].values.push((label as HTMLElement | null)?.innerText?.trim() || radio.value);
    });

    // ── G. Card headers and their aria-expanded state ──
    const cardHeaders = Array.from(document.querySelectorAll('.card-header[role="button"]')).map(el => ({
      title: (el as HTMLElement).innerText?.trim().slice(0, 100) || '',
      ariaExpanded: el.getAttribute('aria-expanded'),
      classes: Array.from(el.classList).join(' '),
      visible: vis(el),
    }));

    // ── H. Count of visible inputs after expansion ──
    const allInputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const visibleInputCount = allInputs.filter(el => vis(el)).length;

    // ── I. All unique formio component keys (structured) ──
    const keyMap: Record<string, { type: string; inputType: string; visible: boolean }> = {};
    document.querySelectorAll('.formio-component').forEach(el => {
      const key = extractKey(el);
      if (!key) return;
      const classes = Array.from(el.classList);
      // Detect component type from class
      const typeClass = classes.find(c => c.startsWith('formio-component-') && c !== 'formio-component' && c !== `formio-component-${key}`);
      keyMap[key] = {
        type: typeClass ? typeClass.replace('formio-component-', '') : 'unknown',
        inputType: inputType(el),
        visible: vis(el),
      };
    });

    return {
      formioComponents,
      choicesWrappers,
      fileComponents,
      editGrids,
      maskedInputs,
      radioGroups: Object.values(radioGroups),
      cardHeaders,
      visibleInputCount,
      keyMap,
      url: window.location.href,
    };
  });

  // ── 6. Log everything ─────────────────────────────────────────────────────
  console.log('\n=== URL ===');
  console.log(inventory.url);

  console.log('\n=== [A] ALL FORMIO COMPONENTS ===');
  console.log(`Total .formio-component elements: ${inventory.formioComponents.length}`);
  inventory.formioComponents.forEach((c, i) => {
    if (c.key) {
      console.log(`  [${i}] key="${c.key}" | inputType=${c.inputType} | visible=${c.visible}`);
      console.log(`       classes: ${c.classes}`);
    }
  });

  console.log('\n=== [B] CHOICES.JS WRAPPERS ===');
  console.log(`Total .choices elements: ${inventory.choicesWrappers.length}`);
  inventory.choicesWrappers.forEach((c, i) => {
    console.log(`  [${i}] name="${c.name}" | type=${c.choicesType} | visible=${c.visible} | placeholder="${c.placeholderText}"`);
  });

  console.log('\n=== [C] FILE UPLOAD COMPONENTS ===');
  console.log(`Total file-related elements: ${inventory.fileComponents.length}`);
  inventory.fileComponents.forEach((f, i) => {
    console.log(`  [${i}] key="${f.key}" | tag=${f.tagName} | ref="${f.ref}" | visible=${f.visible}`);
    console.log(`       classes: ${f.classes}`);
    if (f.innerText) console.log(`       text: "${f.innerText}"`);
  });

  console.log('\n=== [D] EDITGRID COMPONENTS ===');
  console.log(`Total editgrid components: ${inventory.editGrids.length}`);
  inventory.editGrids.forEach((g, i) => {
    console.log(`  [${i}] key="${g.key}" | rows=${g.rowCount} | addBtn="${g.addButtonText}" | visible=${g.visible}`);
    console.log(`       classes: ${g.classes}`);
  });

  console.log('\n=== [E] MASKED INPUTS ===');
  console.log(`Total masked inputs: ${inventory.maskedInputs.length}`);
  inventory.maskedInputs.forEach((m, i) => {
    console.log(`  [${i}] componentKey="${m.componentKey}" | name="${m.name}" | id="${m.id}" | mask="${m.dataMask}" | visible=${m.visible}`);
  });

  console.log('\n=== [F] RADIO / TOGGLE GROUPS ===');
  console.log(`Total radio groups: ${inventory.radioGroups.length}`);
  inventory.radioGroups.forEach((r, i) => {
    console.log(`  [${i}] name="${r.name}" | componentKey="${r.componentKey}" | visible=${r.visible}`);
    console.log(`       values: [${r.values.join(', ')}]`);
  });

  console.log('\n=== [G] CARD HEADERS (collapsible sections) ===');
  console.log(`Total card headers: ${inventory.cardHeaders.length}`);
  inventory.cardHeaders.forEach((h, i) => {
    console.log(`  [${i}] aria-expanded="${h.ariaExpanded}" | visible=${h.visible} | title="${h.title}"`);
  });

  console.log('\n=== [H] VISIBLE INPUT COUNT (after expand) ===');
  console.log(`Visible inputs: ${inventory.visibleInputCount}`);

  console.log('\n=== [I] COMPONENT KEY MAP (deduplicated) ===');
  const keys = Object.keys(inventory.keyMap).sort();
  console.log(`Unique component keys: ${keys.length}`);
  keys.forEach(k => {
    const v = inventory.keyMap[k];
    console.log(`  "${k}" → inputType=${v.inputType} | visible=${v.visible} | type=${v.type}`);
  });

  console.log('\n=== DOM INVENTORY COMPLETE ===');
});
