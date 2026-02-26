import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for eRegistrations/VUCE Cuba E2E tests.
 *
 * Target: Production (cuba.eregistrations.org)
 * Auth: CAS login via storage state (eid.cuba.eregistrations.org)
 * BPA Admin: bpa.cuba.eregistrations.org
 *
 * Uses auth-state.json from the playwright-bpa project for authentication.
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
    ['html', { outputFolder: '../test-results/html-report', open: 'never' }],
  ],

  /* Output directory for test artifacts */
  outputDir: '../test-results/artifacts',

  use: {
    /* Base URL for navigation */
    baseURL: 'https://cuba.eregistrations.org',

    /* Authentication via CAS storage state */
    storageState: '../../playwright-bpa/auth-state.json',

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

    /* Trace: on first retry (if retries are enabled) */
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
      name: 'production-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://cuba.eregistrations.org',
        storageState: '../../playwright-bpa/auth-state.json',
      },
    },
    {
      name: 'bpa-admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://bpa.cuba.eregistrations.org',
        storageState: '../../playwright-bpa/auth-state.json',
      },
    },
  ],
});
