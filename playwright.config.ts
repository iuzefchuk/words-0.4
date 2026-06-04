import { defineConfig, devices } from '@playwright/test';
import { DIRECTORY } from './workspace/constants.ts';
import EnvVariableFinder from './workspace/EnvVariableFinder.ts';

const ENV_PROCESS_IS_CI = EnvVariableFinder.getFromProcess('CI', {
  fallback: false,
  parse: value => Boolean(value),
});

export default defineConfig({
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    },
  },
  fullyParallel: true,
  outputDir: DIRECTORY.playwright,
  projects: [
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
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  snapshotDir: DIRECTORY.testsSnapshots,
  snapshotPathTemplate: '{snapshotDir}/{arg}/{projectName}-{platform}{ext}',
  testDir: DIRECTORY.tests,
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    extraHTTPHeaders: {
      'x-test-automation': 'playwright',
    },
    locale: 'en-US',
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure',
    timezoneId: 'America/New_York',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'yarn serve',
    port: EnvVariableFinder.getFromConfig('VITE_PORT', {
      envDir: DIRECTORY.root,
      mode: '',
      parse: value => Number(value),
      validate: value => !Number.isInteger(value) || value <= 0,
    }),
    reuseExistingServer: !ENV_PROCESS_IS_CI,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 120_000,
  },
  ...(ENV_PROCESS_IS_CI
    ? {
        forbidOnly: true,
        reporter: [['html', { open: 'never' }], ['github']],
        retries: 2,
        workers: '50%',
      }
    : {
        forbidOnly: false,
        reporter: [['html', { open: 'on-failure' }]],
        retries: 0,
      }),
});
