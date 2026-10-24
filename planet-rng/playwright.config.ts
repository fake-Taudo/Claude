import { defineConfig, devices } from '@playwright/test';

// Smoke tests run against the built single file (npm run build first).
export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    trace: 'off',
    viewport: { width: 390, height: 844 },
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1366, height: 820 } } },
  ],
});
