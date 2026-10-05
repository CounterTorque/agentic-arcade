import { defineConfig, devices } from '@playwright/test';

const full = process.env.TEST_DEPTH === 'full';

export default defineConfig({
  testDir: '.',
  testMatch: full ? ['tests/e2e/**/*.spec.ts', 'src/games/*/**/*.e2e.ts'] : ['tests/e2e/**/*.spec.ts'],
  grepInvert: full ? undefined : /@full/,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3457/agentic-arcade/',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 3457 --strictPort',
    url: 'http://localhost:3457/agentic-arcade/',
    reuseExistingServer: !process.env.CI,
  },
});
