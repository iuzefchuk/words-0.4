import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV = loadEnv('', DIR, '');
const URL = `http://localhost:${(ENV.VITE_PORT ??= '5173')}`;
const ENV_PROCESS_IS_CI = Boolean(process.env.CI);

export default defineConfig({
  fullyParallel: true,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    },
  },
  outputDir: path.resolve(DIR, '.playwright'),
  snapshotDir: path.resolve(DIR, './tests/snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{arg}/{projectName}-{platform}{ext}',
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
  testDir: path.resolve(DIR, './tests'),
  timeout: 30_000,
  use: {
    baseURL: URL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'x-test-automation': 'playwright',
    },
  },
  webServer: {
    url: URL,
    command: 'npm run serve',
    reuseExistingServer: !ENV_PROCESS_IS_CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  ...(ENV_PROCESS_IS_CI
    ? {
        forbidOnly: true,
        workers: '50%',
        retries: 2,
        reporter: [['html', { open: 'never' }], ['github']],
      }
    : {
        forbidOnly: false,
        reporter: [['html', { open: 'on-failure' }]],
        retries: 0,
      }),
});
