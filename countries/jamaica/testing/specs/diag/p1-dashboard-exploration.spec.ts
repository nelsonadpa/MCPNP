import { test, expect } from '@playwright/test';

/**
 * Phase 1 — Front-Office Testing
 * T-001 area: Dashboard exploration + service discovery
 *
 * Captures: dashboard state, service catalog, existing applications
 */

const SCREENSHOTS = '../02-front-office-tests/screenshots';

test.describe('P1 — Dashboard & Service Discovery', () => {

  test('P1-S1: Dashboard overview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });

    // Screenshot full dashboard
    await page.screenshot({
      path: `${SCREENSHOTS}/P1-S1-dashboard-overview.png`,
      fullPage: true,
    });

    // Verify logged in as NELSON PEREZ
    const userMenu = page.locator('text=NELSON PEREZ');
    await expect(userMenu).toBeVisible();

    // Document the service catalog
    const serviceCards = page.locator('text=Special economic zone').locator('..');
    await expect(serviceCards).toBeVisible();

    // Check "My applications" count
    const myApps = page.locator('text=My applications');
    await expect(myApps).toBeVisible();
    const appsText = await myApps.locator('..').textContent();
    console.log(`My applications: ${appsText?.trim()}`);
  });

  test('P1-S2: Service catalog — identify all available services', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });

    // Document all service cards visible
    const allCards = page.locator('[class*="card"], [class*="Card"], [class*="service"]');
    const cardCount = await allCards.count();
    console.log(`Total service cards found: ${cardCount}`);

    // Screenshot the service section
    const sezSection = page.locator('text=Special economic zone').locator('..');
    await sezSection.screenshot({
      path: `${SCREENSHOTS}/P1-S2-service-catalog.png`,
    });

    // Verify our target service exists
    const targetService = page.locator('text=Establish a new zone');
    await expect(targetService).toBeVisible();
    console.log('Target service "Establish a new zone" found on dashboard');
  });

  test('P1-S3: My applications section', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });

    // Expand "My applications" if collapsed
    const myAppsHeader = page.locator('text=My applications').first();
    await myAppsHeader.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOTS}/P1-S3-my-applications-expanded.png`,
      fullPage: true,
    });

    // Count visible applications
    console.log('My applications section expanded and captured');
  });

  test('P1-S4: Notification bell', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Dashboard', { timeout: 30_000 });

    // Check notification badge (we saw "13" in the screenshot)
    const notifBadge = page.locator('[class*="badge"], [class*="notification"]').first();
    if (await notifBadge.isVisible()) {
      await notifBadge.screenshot({
        path: `${SCREENSHOTS}/P1-S4-notification-badge.png`,
      });
      console.log('Notification badge captured');
    }
  });
});
