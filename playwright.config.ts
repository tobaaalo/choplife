import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run serve',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
          args: ['--no-sandbox'],
        },
      },
    },
  ],
})
