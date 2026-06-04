import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV = loadEnv('', DIR, '') as Partial<Record<string, string>>;
const URL = `http://localhost:${ENV['VITE_PORT'] ?? '5173'}`;
const ENV_PROCESS_IS_CI = Boolean(process.env['CI']);

export default defineConfig({
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    },
  },
  fullyParallel: true,
  outputDir: path.resolve(DIR, '.playwright'),
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
  snapshotDir: path.resolve(DIR, './tests/snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{arg}/{projectName}-{platform}{ext}',
  testDir: path.resolve(DIR, './tests'),
  timeout: 30_000,
  use: {
    actionTimeout: 10_000,
    baseURL: URL,
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
    reuseExistingServer: !ENV_PROCESS_IS_CI,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 120_000,
    url: URL,
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
