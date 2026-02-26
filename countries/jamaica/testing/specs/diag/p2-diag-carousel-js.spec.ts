import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Diagnostic: Try multiple approaches to advance the carousel
 * 1. Bootstrap jQuery API: $('.carousel').carousel('next')
 * 2. Direct DOM: click the anchor element
 * 3. Dispatch click event on the anchor
 * 4. Trigger Bootstrap slide via data-slide attribute
 * 5. Manually toggle active class on carousel items
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/p2');

test('P2-DIAG: Carousel JS navigation', async ({ page }) => {
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

  await page.screenshot({ path: `${SCREENSHOT_DIR}/70-before-carousel-js.png` });

  // Get initial state
  const initialState = await page.evaluate(() => {
    const bullet = document.querySelector('.carousel-selected-index.bullet');
    const activeItem = document.querySelector('.carousel-item.active, .item.active');
    const carousel = document.querySelector('.carousel');
    return {
      bulletText: bullet?.textContent?.trim(),
      activeIndex: activeItem ? Array.from(activeItem.parentElement?.children || []).indexOf(activeItem) : -1,
      carouselExists: !!carousel,
      carouselClasses: carousel?.className?.toString().substring(0, 80),
      hasJQuery: typeof (window as any).$ !== 'undefined',
      hasBootstrap: typeof (window as any).$.fn?.carousel !== 'undefined',
    };
  });
  console.log('\n══ Initial state ══');
  console.log(`  Bullet: "${initialState.bulletText}"`);
  console.log(`  Active index: ${initialState.activeIndex}`);
  console.log(`  Carousel exists: ${initialState.carouselExists}`);
  console.log(`  jQuery: ${initialState.hasJQuery}, Bootstrap carousel: ${initialState.hasBootstrap}`);

  // Strategy 1: jQuery Bootstrap API
  console.log('\n══ Strategy 1: jQuery Bootstrap carousel("next") ══');
  try {
    const result1 = await page.evaluate(() => {
      const $ = (window as any).$;
      if (!$ || !$.fn?.carousel) return 'No jQuery/Bootstrap carousel';
      try {
        $('.carousel').carousel('next');
        return 'Called .carousel("next")';
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    });
    console.log(`  Result: ${result1}`);
    await page.waitForTimeout(2000);

    const state1 = await page.evaluate(() => {
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      const items = document.querySelectorAll('.carousel-item, .item');
      let activeIdx = -1;
      items.forEach((item, i) => {
        if (item.classList.contains('active')) activeIdx = i;
      });
      return { bullet: bullet?.textContent?.trim(), activeIdx };
    });
    console.log(`  After: bullet="${state1.bullet}", activeIdx=${state1.activeIdx}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 2: Playwright locator click on the anchor
  console.log('\n══ Strategy 2: Playwright locator click ══');
  try {
    const rightArrow = page.locator('a.carousel-control.right').first();
    const isVisible = await rightArrow.isVisible({ timeout: 3000 });
    console.log(`  a.carousel-control.right visible: ${isVisible}`);
    if (isVisible) {
      await rightArrow.click({ force: true });
      await page.waitForTimeout(2000);
      const state2 = await page.evaluate(() => {
        const bullet = document.querySelector('.carousel-selected-index.bullet');
        const items = document.querySelectorAll('.carousel-item, .item');
        let activeIdx = -1;
        items.forEach((item, i) => {
          if (item.classList.contains('active')) activeIdx = i;
        });
        return { bullet: bullet?.textContent?.trim(), activeIdx };
      });
      console.log(`  After: bullet="${state2.bullet}", activeIdx=${state2.activeIdx}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 3: Dispatch click event programmatically on the anchor
  console.log('\n══ Strategy 3: Dispatch click event ══');
  try {
    const result3 = await page.evaluate(() => {
      const arrow = document.querySelector('a.carousel-control.right');
      if (!arrow) return 'No arrow found';
      arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return 'Dispatched click';
    });
    console.log(`  Result: ${result3}`);
    await page.waitForTimeout(2000);

    const state3 = await page.evaluate(() => {
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      const items = document.querySelectorAll('.carousel-item, .item');
      let activeIdx = -1;
      items.forEach((item, i) => {
        if (item.classList.contains('active')) activeIdx = i;
      });
      return { bullet: bullet?.textContent?.trim(), activeIdx };
    });
    console.log(`  After: bullet="${state3.bullet}", activeIdx=${state3.activeIdx}`);
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 4: Check if the anchor has href="#" with data-slide="next"
  console.log('\n══ Strategy 4: Check anchor attributes ══');
  try {
    const anchorInfo = await page.evaluate(() => {
      const arrow = document.querySelector('a.carousel-control.right') as HTMLAnchorElement;
      if (!arrow) return null;
      return {
        href: arrow.href,
        dataSlide: arrow.getAttribute('data-slide'),
        dataTarget: arrow.getAttribute('data-target'),
        role: arrow.getAttribute('role'),
        onclick: arrow.getAttribute('onclick'),
        allAttrs: Array.from(arrow.attributes).map(a => `${a.name}="${a.value}"`).join(', '),
        innerHTML: arrow.innerHTML.substring(0, 200),
        // Check Angular bindings
        ngAttrs: Array.from(arrow.attributes).filter(a => a.name.startsWith('ng') || a.name.startsWith('_ng') || a.name.startsWith('('))
          .map(a => `${a.name}="${a.value}"`).join(', '),
        // Check all properties with 'click' or 'event'
        eventKeys: Object.keys(arrow).filter(k => k.includes('click') || k.includes('event') || k.includes('zone') || k.includes('listener')).join(', '),
      };
    });
    if (anchorInfo) {
      console.log(`  All attrs: ${anchorInfo.allAttrs}`);
      console.log(`  Angular attrs: ${anchorInfo.ngAttrs || 'none'}`);
      console.log(`  Event keys: ${anchorInfo.eventKeys || 'none'}`);
      console.log(`  innerHTML: ${anchorInfo.innerHTML}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 5: Angular component - try finding the Angular component instance
  console.log('\n══ Strategy 5: Angular component ══');
  try {
    const result5 = await page.evaluate(() => {
      const results: string[] = [];
      const carousel = document.querySelector('.carousel');
      if (!carousel) return ['No carousel'];

      // Try to get Angular component ref
      const ng = (window as any).ng;
      if (ng) {
        try {
          const component = ng.getComponent(carousel);
          results.push(`ng.getComponent: ${JSON.stringify(component)?.substring(0, 200)}`);
        } catch (e: any) {
          results.push(`ng.getComponent error: ${e.message}`);
        }
        try {
          const context = ng.getContext(carousel);
          results.push(`ng.getContext: ${JSON.stringify(context)?.substring(0, 200)}`);
        } catch (e: any) {
          results.push(`ng.getContext error: ${e.message}`);
        }
      } else {
        results.push('No window.ng');
      }

      // Try to find Formio reference on the carousel
      const formio = (window as any).Formio;
      if (formio?.forms) {
        const keys = Object.keys(formio.forms);
        results.push(`Formio forms: ${keys.length}`);

        for (const k of keys) {
          const form = formio.forms[k];
          // Look for carousel-related components
          const components = form?.components || [];
          const findCarousel = (comps: any[]): any => {
            for (const c of comps) {
              if (c.type === 'carousel' || c.key?.includes('carousel') || c.type === 'panel') {
                return c;
              }
              if (c.components) {
                const found = findCarousel(c.components);
                if (found) return found;
              }
            }
            return null;
          };
          // Actually check the root component tree
          if (form?.root) {
            results.push(`Form ${k} root type: ${form.root?.type}, components: ${form.root?.components?.length}`);
          }
        }
      }

      return results;
    });
    for (const line of result5) {
      console.log(`  ${line}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 6: Manually toggle active class
  console.log('\n══ Strategy 6: Manual active class toggle ══');
  try {
    const result6 = await page.evaluate(() => {
      const items = document.querySelectorAll('.carousel-item, .item');
      if (items.length < 2) return `Only ${items.length} items`;

      // Remove active from first, add to second
      items[0].classList.remove('active');
      items[1].classList.add('active');

      // Update bullet
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      if (bullet) {
        (bullet as HTMLElement).textContent = '2';
      }

      return `Toggled: item[0] active=${items[0].classList.contains('active')}, item[1] active=${items[1].classList.contains('active')}`;
    });
    console.log(`  Result: ${result6}`);
    await page.waitForTimeout(2000);

    // Check if the UI actually updated
    const state6 = await page.evaluate(() => {
      const bullet = document.querySelector('.carousel-selected-index.bullet');
      const items = document.querySelectorAll('.carousel-item, .item');
      let activeIdx = -1;
      items.forEach((item, i) => {
        if (item.classList.contains('active')) activeIdx = i;
      });
      // Check if the new active item has visible content
      const activeItem = items[activeIdx] as HTMLElement;
      const rect = activeItem?.getBoundingClientRect();
      const title = activeItem?.querySelector('.tab-description, [class*="title"], button.btn-link, h4, h5, strong');
      return {
        bullet: bullet?.textContent?.trim(),
        activeIdx,
        activeRect: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)} at (${Math.round(rect.x)},${Math.round(rect.y)})` : 'N/A',
        titleText: title?.textContent?.trim().substring(0, 60) || 'no title found',
        yesVisible: !!activeItem?.querySelector('button, input, label'),
      };
    });
    console.log(`  After toggle: bullet="${state6.bullet}", activeIdx=${state6.activeIdx}`);
    console.log(`  Active rect: ${state6.activeRect}`);
    console.log(`  Title: ${state6.titleText}`);
    console.log(`  Has buttons: ${state6.yesVisible}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/71-after-manual-toggle.png` });
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 7: Find & call the Angular click handler directly
  console.log('\n══ Strategy 7: Find click handler on arrow ══');
  try {
    const result7 = await page.evaluate(() => {
      const arrow = document.querySelector('a.carousel-control.right') as HTMLElement;
      if (!arrow) return ['No arrow'];
      const results: string[] = [];

      // Check __zone_symbol__ event listeners
      const allKeys = Object.getOwnPropertyNames(arrow);
      results.push(`Own properties: ${allKeys.filter(k => !k.startsWith('__')).join(', ')}`);
      results.push(`Zone/event props: ${allKeys.filter(k => k.includes('zone') || k.includes('event') || k.includes('click') || k.includes('listener')).join(', ')}`);

      // Check prototype chain
      const proto = Object.getPrototypeOf(arrow);
      const protoKeys = Object.getOwnPropertyNames(proto).filter(k => k.includes('click'));
      results.push(`Proto click methods: ${protoKeys.join(', ')}`);

      // Try getEventListeners equivalent
      const clickProp = (arrow as any).__zone_symbol__clickfalse;
      if (clickProp) {
        results.push(`__zone_symbol__clickfalse: ${JSON.stringify(clickProp)?.substring(0, 200)}`);
      }
      const clickTrue = (arrow as any).__zone_symbol__clicktrue;
      if (clickTrue) {
        results.push(`__zone_symbol__clicktrue: ${JSON.stringify(clickTrue)?.substring(0, 200)}`);
      }

      // Check for Angular click binding via __ng attributes
      for (const key of allKeys) {
        if (key.startsWith('__ng') || key.startsWith('__zone')) {
          const val = (arrow as any)[key];
          const valStr = typeof val === 'function' ? 'function' : JSON.stringify(val)?.substring(0, 100);
          results.push(`  ${key}: ${valStr}`);
        }
      }

      return results;
    });
    for (const line of result7) {
      console.log(`  ${line}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  // Strategy 8: Formio bulk validation - set all docs as valid
  console.log('\n══ Strategy 8: Formio bulk validation ══');
  try {
    const result8 = await page.evaluate(() => {
      const results: string[] = [];
      const formio = (window as any).Formio;
      if (!formio?.forms) return ['No Formio'];

      const keys = Object.keys(formio.forms);
      for (const k of keys) {
        const form = formio.forms[k];
        const data = form?.submission?.data;
        if (!data) continue;

        results.push(`\nForm ${k}: ${Object.keys(data).length} keys`);

        // Find all validation-related keys
        const validKeys = Object.keys(data).filter(key =>
          key.includes('validate') || key.includes('Validate') ||
          key.includes('valid') || key.includes('Valid') ||
          key.includes('filevalidated') || key.includes('btnValidate') ||
          key.includes('document') || key.includes('Document')
        );

        for (const vk of validKeys) {
          results.push(`  ${vk}: ${JSON.stringify(data[vk])?.substring(0, 100)}`);
        }

        // Also find "Form is valid" type keys
        const formValidKeys = Object.keys(data).filter(key =>
          key.includes('Form is valid') || key.includes('formIsValid') || key.includes('isValid')
        );
        for (const fk of formValidKeys) {
          results.push(`  [FORM VALID] ${fk}: ${JSON.stringify(data[fk])}`);
        }
      }

      return results;
    });
    for (const line of result8) {
      console.log(`  ${line}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message?.substring(0, 80)}`);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/72-final-state.png` });
  console.log('\n══ DONE ══');
});
