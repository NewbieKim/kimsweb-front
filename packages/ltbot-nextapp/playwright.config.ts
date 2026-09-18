import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    // `./node_modules/.bin/next` is a Unix shim and the Codex pnpm runtime may
    // use an older Node version. Volta honors this package's Node 22 pin.
    command: `volta run node node_modules/next/dist/bin/next dev --webpack -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 16 Pro'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
