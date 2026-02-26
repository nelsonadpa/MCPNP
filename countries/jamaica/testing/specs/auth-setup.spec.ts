import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Auth Setup — Jamaica eRegistrations
 *
 * Run this ONCE to capture auth state:
 *   npx playwright test auth-setup.spec.ts --project=auth-setup --headed
 *
 * Supports two modes:
 *   1. Automatic login via JAMAICA_USERNAME / JAMAICA_PASSWORD in .env
 *   2. Manual login fallback (waits 3 minutes for you to log in)
 */
test('capture Jamaica auth state', async ({ page, context }) => {
  test.setTimeout(300_000);
  await context.clearCookies();

  await page.goto('https://jamaica.eregistrations.org/');

  const username = process.env.JAMAICA_USERNAME;
  const password = process.env.JAMAICA_PASSWORD;

  if (username && password) {
    console.log(`\n  Attempting auto-login as ${username}...`);

    // Wait for Keycloak login form
    try {
      await page.waitForSelector('#username, #kc-login, input[name="username"]', { timeout: 15_000 });

      // Fill credentials
      const userInput = page.locator('#username, input[name="username"]').first();
      await userInput.fill(username);

      const passInput = page.locator('#password, input[name="password"]').first();
      await passInput.fill(password);

      // Click login button
      const loginBtn = page.locator('#kc-login, input[type="submit"], button[type="submit"]').first();
      await loginBtn.click();

      console.log('  Credentials submitted, waiting for dashboard...');
    } catch (e) {
      console.log(`  Login form not found — might already be logged in or different flow`);
    }
  } else {
    console.log('\n========================================');
    console.log('  No credentials in .env — waiting for manual login...');
    console.log('  Up to 3 minutes...');
    console.log('========================================\n');
  }

  // Wait for dashboard to load
  await page.waitForSelector('text=Dashboard', { timeout: 180_000 });

  // Save auth state
  await context.storageState({
    path: './auth-state-jamaica.json',
  });

  console.log('\n  Auth state saved to auth-state-jamaica.json');
});
