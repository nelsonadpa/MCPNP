import { test } from '@playwright/test';

test('capture Cuba auth state', async ({ page, context }) => {
  test.setTimeout(300_000); // 5 min total

  await page.goto('https://cuba.eregistrations.org');
  await page.waitForLoadState('networkidle');

  const username = process.env.CUBA_USERNAME;
  const password = process.env.CUBA_PASSWORD;

  // Detect VUCE login page by checking for the "Ingresar" button
  const isLoginPage = await page.locator('button:has-text("Ingresar")')
    .isVisible({ timeout: 10_000 }).catch(() => false);

  if (isLoginPage && username && password) {
    // Auto-login on VUCE login page
    console.log('VUCE login page detected. Auto-filling credentials...');
    // First input: accepts document ID, email, or username
    const userInput = page.locator('input').first();
    const passInput = page.locator('input[type="password"]');

    await userInput.fill(username);
    await passInput.fill(password);
    await page.locator('button:has-text("Ingresar")').click();

    console.log('Credentials submitted. Waiting for dashboard...');
    await page.waitForSelector('text=Mi cuenta', { timeout: 60_000 });
  } else if (isLoginPage) {
    // Manual login - wait for human to log in
    console.log('VUCE login page detected. Please log in manually within 4 minutes.');
    console.log('After login, wait for the dashboard to appear.');
    await page.waitForSelector('text=Mi cuenta', { timeout: 240_000 });
  } else {
    // Already authenticated or redirected — wait for dashboard
    console.log('No login page detected. Checking if already authenticated...');
    await page.waitForSelector('text=Mi cuenta', { timeout: 60_000 });
  }

  console.log('Login successful! Dashboard loaded.');

  // Save storage state
  await context.storageState({ path: './auth-state-cuba.json' });
  console.log('Auth state saved to auth-state-cuba.json');
});
