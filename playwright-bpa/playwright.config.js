// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  timeout: 300_000, // 5 min - plenty of time for manual login
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'https://bpa.cuba.eregistrations.org',
    // Save screenshots on failure
    screenshot: 'on',
    // Slow down for visibility
    launchOptions: {
      slowMo: 300,
    },
    // Save auth state for reuse
    storageState: undefined,
  },
  // Single worker for headed mode
  workers: 1,
  // Keep browser open on failure for debugging
  retries: 0,
});
