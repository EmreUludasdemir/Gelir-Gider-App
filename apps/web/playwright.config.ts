import { defineConfig, devices } from '@playwright/test'

const testPort = process.env.PLAYWRIGHT_TEST_PORT || '3301'
const localBaseUrl = `http://127.0.0.1:${testPort}`
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || localBaseUrl
const useExternalBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL
const runAllBrowsers = process.env.PLAYWRIGHT_ALL_BROWSERS === '1'
const webServerEnvPrefix =
  process.platform === 'win32'
    ? 'set NEXT_PUBLIC_DISABLE_REALTIME=true&& '
    : 'NEXT_PUBLIC_DISABLE_REALTIME=true '

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
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
  projects: runAllBrowsers
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: `${webServerEnvPrefix}npx next dev -H 127.0.0.1 -p ${testPort}`,
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
})
