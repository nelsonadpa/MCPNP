import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for eRegistrations Cuba E2E tests.
 *
 * Target: Production (cuba.eregistrations.org)
 * Auth: CAS login via eid.cuba.eregistrations.org
 * Storage state must be captured first via the auth setup script.
 */
export default defineConfig({
  testDir: './specs',

  /* Maximum time a test can run: 5 minutes */
  timeout: 300_000,

  /* Assertion timeout */
  expect: {
    timeout: 30_000,
  },

  /* Run tests sequentially — single worker */
  workers: 1,

  /* No retries — fail fast for debugging */
  retries: 0,

  /* Reporter: line for CI, html for local debugging */
  reporter: [
    ['line'],
    ['html', { outputFolder: './test-results/html-report', open: 'never' }],
  ],

  /* Output directory for test artifacts */
  outputDir: './test-results/artifacts',

  use: {
    /* Base URL for navigation */
    baseURL: 'https://cuba.eregistrations.org',

    /* Browser settings */
    browserName: 'chromium',
    headless: false,

    /* Slow down for visibility during debugging */
    launchOptions: {
      slowMo: 200,
    },

    /* Screenshots: on failure only */
    screenshot: 'only-on-failure',

    /* Video: retain on failure for debugging */
    video: 'retain-on-failure',

    /* Trace: retain on failure */
    trace: 'retain-on-failure',

    /* Viewport */
    viewport: { width: 1440, height: 900 },

    /* Navigation timeout */
    navigationTimeout: 60_000,

    /* Action timeout */
    actionTimeout: 15_000,
  },

  /* Project definitions */
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth-setup\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://eid.cuba.eregistrations.org',
        storageState: undefined,
      },
    },
    {
      name: 'cuba-frontoffice',
      testIgnore: /auth-setup\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://cuba.eregistrations.org',
        storageState: './auth-state-cuba.json',
      },
    },
  ],
});
