import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV = loadEnv('', DIR, '');
const URL = `http://localhost:${(ENV.VITE_PORT ??= '5173')}`;
const ENV_PROCESS_IS_CI = Boolean(process.env.CI);

export default defineConfig({
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  outputDir: path.resolve(DIR, '.playwright'),
  snapshotDir: path.resolve(DIR, './tests/snapshots'),
  snapshotPathTemplate: '{snapshotDir}/{arg}/{projectName}-{platform}{ext}',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  testDir: path.resolve(DIR, './tests'),
  timeout: 30_000,
  use: {
    baseURL: URL,
    trace: 'on-first-retry',
    viewport: { height: 960, width: 1280 },
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js',
    reuseExistingServer: !ENV_PROCESS_IS_CI,
    timeout: 120_000,
    url: URL,
  },
  ...(ENV_PROCESS_IS_CI
    ? {
        forbidOnly: true,
        workers: 1,
        retries: 2,
        reporter: [['dot'], ['html', { open: 'never' }]],
      }
    : {
        forbidOnly: false,
        reporter: 'list',
        retries: 0,
      }),
});
