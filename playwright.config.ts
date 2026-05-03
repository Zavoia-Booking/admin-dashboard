import { defineConfig, devices } from '@playwright/test'

const ADMIN_API_DIR = '../admin-api'
const API_URL = 'http://localhost:3001'
const APP_PORT = 5174
const APP_URL = `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: APP_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './e2e/global-setup.ts',

  webServer: [
    {
      command:
        'yarn db:test:up && yarn migration:run:test && yarn start:test',
      cwd: ADMIN_API_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `yarn dev --mode test --port ${APP_PORT} --strictPort`,
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
