import { defineConfig, devices } from '@playwright/test'

const testPort = process.env.PLAYWRIGHT_TEST_PORT || '3100'
const localBaseUrl = `http://127.0.0.1:${testPort}`
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || localBaseUrl
const useExternalBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: `npx next dev -H 127.0.0.1 -p ${testPort}`,
        url: localBaseUrl,
        reuseExistingServer: false,
      },
})
