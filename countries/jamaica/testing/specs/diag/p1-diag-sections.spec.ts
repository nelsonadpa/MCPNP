import { test } from '@playwright/test';

/**
 * Quick diagnostic: What section patterns exist on each tab?
 */
test('DIAG: Section structure on each tab', async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto('/');
  await page.waitForSelector('text=Dashboard', { timeout: 30_000 });
  await page.locator('text=Establish a new zone').click();
  await page.waitForTimeout(5000);

  // Ensure we're on Form tab
  await page.locator('text=Form').first().click();
  await page.waitForTimeout(2000);

  const tabs = ['Project overview', 'Developer', 'Master plan', 'Business plan', 'Compliance'];

  for (const tabName of tabs) {
    console.log(`\n════ ${tabName.toUpperCase()} ════`);
    await page.locator(`[role="tab"]:has-text("${tabName}"), .nav-link:has-text("${tabName}")`).first().click();
    await page.waitForTimeout(3000);

    // 1. card-header[role="button"] with aria-expanded
    const allHeaders = await page.locator('.card-header[role="button"]').count();
    const collapsedHeaders = await page.locator('.card-header[role="button"][aria-expanded="false"]').count();
    const expandedHeaders = await page.locator('.card-header[role="button"][aria-expanded="true"]').count();
    const visibleHeaders = await page.locator('.card-header[role="button"]:visible').count();
    console.log(`  card-header[role="button"]: total=${allHeaders} collapsed=${collapsedHeaders} expanded=${expandedHeaders} visible=${visibleHeaders}`);

    // 2. Log first 5 visible headers with text
    const vHeaders = page.locator('.card-header[role="button"]:visible');
    const vCount = await vHeaders.count();
    for (let i = 0; i < Math.min(vCount, 5); i++) {
      const text = await vHeaders.nth(i).textContent();
      const ariaExp = await vHeaders.nth(i).getAttribute('aria-expanded');
      console.log(`    [${i}] aria-expanded="${ariaExp}" → "${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}"`);
    }

    // 3. Check for other collapse patterns
    const panelHeaders = await page.locator('.formio-component-panel .card-header:visible').count();
    const collapseHeaders = await page.locator('[data-toggle="collapse"]:visible').count();
    const accordionBtns = await page.locator('.accordion-button:visible, .panel-heading:visible').count();
    console.log(`  panel .card-header:visible=${panelHeaders}, [data-toggle]:visible=${collapseHeaders}, accordion/panel:visible=${accordionBtns}`);

    // 4. Count visible inputs on this tab
    const visibleInputs = await page.locator('input:visible, textarea:visible, select:visible').count();
    const choicesWrappers = await page.locator('.choices__inner:visible').count();
    const browseLinks = await page.locator('a.browse:visible').count();
    console.log(`  Visible: inputs=${visibleInputs} choices=${choicesWrappers} browseLinks=${browseLinks}`);

    // 5. Check if content is inside a scrollable container
    const scrollInfo = await page.evaluate(() => {
      const containers = document.querySelectorAll('.tab-pane.active, .formio-form, .tab-content, [class*="scroll"]');
      return Array.from(containers).map(c => ({
        tag: c.tagName,
        classes: c.className.substring(0, 80),
        scrollH: c.scrollHeight,
        clientH: c.clientHeight,
        overflow: getComputedStyle(c).overflow,
      }));
    });
    console.log(`  Scroll containers:`, JSON.stringify(scrollInfo.slice(0, 3)));

    // 6. Try expanding collapsed sections that are visible
    const collapsedVisible = page.locator('.card-header[role="button"][aria-expanded="false"]:visible');
    const cvCount = await collapsedVisible.count();
    console.log(`  Collapsed + visible: ${cvCount}`);
    if (cvCount > 0) {
      // Try clicking the first one
      const firstText = await collapsedVisible.first().textContent();
      console.log(`    Trying to click: "${firstText?.trim().substring(0, 60)}"`);
      try {
        await collapsedVisible.first().scrollIntoViewIfNeeded();
        await collapsedVisible.first().click();
        await page.waitForTimeout(1000);
        const afterCount = await page.locator('.card-header[role="button"][aria-expanded="false"]:visible').count();
        console.log(`    After click: collapsed visible=${afterCount} (was ${cvCount})`);

        // Check inputs again
        const afterInputs = await page.locator('input:visible, textarea:visible').count();
        const afterChoices = await page.locator('.choices__inner:visible').count();
        const afterBrowse = await page.locator('a.browse:visible').count();
        console.log(`    After expand: inputs=${afterInputs} choices=${afterChoices} browse=${afterBrowse}`);
      } catch (e) {
        console.log(`    Click FAILED: ${e}`);
      }
    }
  }

  // Also check Compliance sub-navigation
  console.log('\n════ COMPLIANCE SIDE NAV ════');
  await page.locator(`[role="tab"]:has-text("Compliance"), .nav-link:has-text("Compliance")`).first().click();
  await page.waitForTimeout(3000);

  const sideNavLinks = page.locator('.nav-link:visible, .list-group-item:visible, [class*="sidebar"] a:visible');
  const sideCount = await sideNavLinks.count();
  console.log(`  Side nav links visible: ${sideCount}`);
  for (let i = 0; i < Math.min(sideCount, 10); i++) {
    const text = await sideNavLinks.nth(i).textContent();
    console.log(`    [${i}] "${text?.trim().replace(/\s+/g, ' ').substring(0, 60)}"`);
  }
});
