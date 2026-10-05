import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['tests/e2e/**/*.spec.ts', 'src/games/*/**/*.e2e.ts'],
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
