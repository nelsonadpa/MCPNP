import { test } from '@playwright/test';

/**
 * Diagnostic: Why does browse[6] (first upload in "Land rights documents"
 * on Master Plan tab) fail to trigger a filechooser event, while browse[7]
 * and browse[8] in the same section succeed?
 *
 * Inspects browse links at indices 5..8 — ancestor chains, visibility,
 * associated file inputs, formio keys, and filechooser behavior.
 */

test.use({ storageState: './auth-state-jamaica.json' });

test('DIAG: browse[6] filechooser failure on Master Plan', async ({ page }) => {
  test.setTimeout(300_000);

  // ── 1. Open the form ──────────────────────────────────────────────
  console.log('\n=== STEP 1: Navigate to form ===');
  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Establish a new zone' }).click();
  await page.waitForTimeout(5000);
  console.log(`URL: ${page.url()}`);

  // ── 2. Form tab → Master plan tab ────────────────────────────────
  console.log('\n=== STEP 2: Navigate to Master plan tab ===');
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(1000);
  await page.locator('[role="tab"]:has-text("Master plan"), .nav-link:has-text("Master plan")').first().click();
  await page.waitForTimeout(2000);

  // ── 3. Check both master plan checkboxes ─────────────────────────
  console.log('\n=== STEP 3: Check master plan checkboxes ===');

  // applicantYesIWillUploadAFinalMasterPlan
  const cb1 = page.locator('[name="data[applicantYesIWillUploadAFinalMasterPlan]"], .formio-component-applicantYesIWillUploadAFinalMasterPlan input[type="checkbox"]').first();
  if (await cb1.count() > 0) {
    const checked1 = await cb1.isChecked().catch(() => false);
    if (!checked1) {
      await cb1.click({ force: true });
      console.log('  Checked: applicantYesIWillUploadAFinalMasterPlan');
    } else {
      console.log('  Already checked: applicantYesIWillUploadAFinalMasterPlan');
    }
  } else {
    console.log('  NOT FOUND: applicantYesIWillUploadAFinalMasterPlan');
  }

  // applicantCheckbox
  const cb2 = page.locator('[name="data[applicantCheckbox]"], .formio-component-applicantCheckbox input[type="checkbox"]').first();
  if (await cb2.count() > 0) {
    const checked2 = await cb2.isChecked().catch(() => false);
    if (!checked2) {
      await cb2.click({ force: true });
      console.log('  Checked: applicantCheckbox');
    } else {
      console.log('  Already checked: applicantCheckbox');
    }
  } else {
    console.log('  NOT FOUND: applicantCheckbox');
  }

  await page.waitForTimeout(3000);

  // ── 4. CSS unhiding — make all hidden ancestors of a.browse visible ──
  console.log('\n=== STEP 4: CSS unhiding ===');
  const unhideCount = await page.evaluate(() => {
    let count = 0;
    const browseLinks = document.querySelectorAll('a.browse');
    browseLinks.forEach((link) => {
      let el: HTMLElement | null = link as HTMLElement;
      while (el) {
        const style = getComputedStyle(el);
        if (style.display === 'none') {
          (el as HTMLElement).style.display = 'block';
          count++;
        }
        el = el.parentElement;
      }
    });
    return count;
  });
  console.log(`  Unhid ${unhideCount} ancestor elements`);

  // ── 5. Add active/show classes to tab-pane ancestors ──────────────
  const tabPaneCount = await page.evaluate(() => {
    let count = 0;
    const browseLinks = document.querySelectorAll('a.browse');
    browseLinks.forEach((link) => {
      let el: HTMLElement | null = link as HTMLElement;
      while (el) {
        if (el.classList.contains('tab-pane')) {
          if (!el.classList.contains('active')) {
            el.classList.add('active');
            count++;
          }
          if (!el.classList.contains('show')) {
            el.classList.add('show');
            count++;
          }
        }
        el = el.parentElement;
      }
    });
    return count;
  });
  console.log(`  Added active/show to ${tabPaneCount} tab-pane ancestors`);

  await page.waitForTimeout(2000);

  // ── 6. Inspect browse links at indices 5, 6, 7, 8 ────────────────
  const indicesToCheck = [5, 6, 7, 8];
  const allBrowse = page.locator('a.browse');
  const totalBrowse = await allBrowse.count();
  console.log(`\n=== STEP 5: Inspecting browse links (total: ${totalBrowse}) ===`);

  for (const idx of indicesToCheck) {
    console.log(`\n──── browse[${idx}] ────`);

    if (idx >= totalBrowse) {
      console.log(`  SKIP: index ${idx} out of range (total=${totalBrowse})`);
      continue;
    }

    const browseLink = allBrowse.nth(idx);

    // 6a. Ancestor chain (up to 5 levels) with class names
    const ancestorInfo = await browseLink.evaluate((el: HTMLElement) => {
      const chain: string[] = [];
      let current: HTMLElement | null = el;
      for (let i = 0; i < 6; i++) { // el itself + 5 ancestors
        if (!current) break;
        const tag = current.tagName.toLowerCase();
        const cls = current.className
          ? (typeof current.className === 'string' ? current.className : '')
          : '';
        const id = current.id ? `#${current.id}` : '';
        const display = getComputedStyle(current).display;
        const visibility = getComputedStyle(current).visibility;
        const opacity = getComputedStyle(current).opacity;
        chain.push(`${tag}${id}.${cls.replace(/\s+/g, '.')} [display:${display}, vis:${visibility}, opacity:${opacity}]`);
        current = current.parentElement;
      }
      return chain;
    });
    console.log('  Ancestor chain (self → parent → ...):');
    ancestorInfo.forEach((a: string, i: number) => console.log(`    [${i}] ${a}`));

    // 6b. Visibility & bounding rect
    const isVisible = await browseLink.isVisible().catch(() => false);
    const box = await browseLink.boundingBox().catch(() => null);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  BoundingBox: ${box ? JSON.stringify(box) : 'null'}`);

    // 6c. Nearby input[type="file"] in same formio component
    const fileInputInfo = await browseLink.evaluate((el: HTMLElement) => {
      // Walk up to find the closest formio component container
      let formioComp: HTMLElement | null = el;
      while (formioComp && !formioComp.className?.match?.(/formio-component-\w+/)) {
        formioComp = formioComp.parentElement;
      }
      if (!formioComp) return { found: false, formioKey: null, fileInputCount: 0, details: 'No formio-component ancestor found' };

      const classMatch = formioComp.className.match(/formio-component-(\w+)/);
      const formioKey = classMatch ? classMatch[1] : null;

      const fileInputs = formioComp.querySelectorAll('input[type="file"]');
      const fileDetails = Array.from(fileInputs).map((fi: Element) => {
        const htmlFi = fi as HTMLInputElement;
        const style = getComputedStyle(htmlFi);
        return {
          name: htmlFi.name,
          display: style.display,
          visibility: style.visibility,
          disabled: htmlFi.disabled,
          offsetParent: htmlFi.offsetParent ? 'yes' : 'null',
          rect: htmlFi.getBoundingClientRect().toJSON(),
        };
      });

      return {
        found: fileInputs.length > 0,
        formioKey,
        fileInputCount: fileInputs.length,
        formioClasses: formioComp.className.substring(0, 120),
        details: fileDetails,
      };
    });
    console.log(`  Formio component key: ${fileInputInfo.formioKey}`);
    console.log(`  File inputs in component: ${fileInputInfo.fileInputCount}`);
    console.log(`  File input details: ${JSON.stringify(fileInputInfo.details)}`);
    console.log(`  Formio classes: ${fileInputInfo.formioClasses || 'n/a'}`);

    // 6d. Additional: check the browse link's own href and onclick
    const linkAttrs = await browseLink.evaluate((el: HTMLElement) => {
      const a = el as HTMLAnchorElement;
      return {
        href: a.href,
        onclick: a.getAttribute('onclick'),
        innerText: a.innerText?.trim(),
        parentTag: a.parentElement?.tagName,
        parentClass: a.parentElement?.className?.substring(0, 100),
      };
    });
    console.log(`  Link text: "${linkAttrs.innerText}", href: ${linkAttrs.href}`);
    console.log(`  Parent: <${linkAttrs.parentTag}> class="${linkAttrs.parentClass}"`);

    // 6e. Try clicking — does filechooser fire?
    console.log(`  Attempting click + filechooser...`);
    try {
      // Scroll into view first
      await browseLink.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 3000 }),
        browseLink.click({ force: true }),
      ]);
      console.log(`  >>> FILECHOOSER FIRED: accepted=${fileChooser.isMultiple()}, element=${fileChooser.element().toString()}`);
      // Dismiss the filechooser without selecting a file
      await page.keyboard.press('Escape').catch(() => {});
    } catch (err: any) {
      console.log(`  >>> FILECHOOSER DID NOT FIRE (${err.message?.substring(0, 100)})`);

      // Extra diagnostics: check if maybe the click triggered something else
      const afterClickInfo = await browseLink.evaluate((el: HTMLElement) => {
        // Check if any file input near this browse link has changed
        let comp: HTMLElement | null = el;
        while (comp && !comp.className?.match?.(/formio-component-\w+/)) {
          comp = comp.parentElement;
        }
        if (!comp) return { note: 'no formio parent' };

        const fileInputs = comp.querySelectorAll('input[type="file"]');
        const inputStates = Array.from(fileInputs).map((fi: Element) => {
          const htmlFi = fi as HTMLInputElement;
          return {
            display: getComputedStyle(htmlFi).display,
            width: htmlFi.offsetWidth,
            height: htmlFi.offsetHeight,
            disabled: htmlFi.disabled,
          };
        });

        // Check for any event listeners by looking at parent structure
        const browseParent = el.closest('.fileSelector, .formio-component-file, [ref="fileDrop"]');
        return {
          inputStates,
          fileSelectorAncestor: browseParent ? {
            tag: browseParent.tagName,
            class: browseParent.className.substring(0, 100),
            display: getComputedStyle(browseParent).display,
          } : null,
        };
      });
      console.log(`  Post-click diagnostics: ${JSON.stringify(afterClickInfo)}`);
    }

    // Small pause between browse link tests
    await page.waitForTimeout(1000);
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
});
