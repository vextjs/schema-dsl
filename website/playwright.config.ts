import { defineConfig } from '@playwright/test';

const previewUrl = 'http://127.0.0.1:4182/schema-dsl/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: '.tmp/playwright/test-results',
  use: {
    baseURL: previewUrl,
    browserName: 'chromium',
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4182',
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
