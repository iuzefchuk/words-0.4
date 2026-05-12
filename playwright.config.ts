import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';

const dirName = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv('', dirName, '');
const URL = `http://localhost:${String(env.VITE_PORT || 5173)}`;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  forbidOnly: isCi,
  outputDir: path.resolve(dirName, '.playwright'),
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  reporter: isCi ? [['dot'], ['html', { open: 'never' }]] : 'list',
  retries: isCi ? 2 : 0,
  testDir: path.resolve(dirName, './tests/'),
  timeout: 30_000,
  use: {
    baseURL: URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js',
    reuseExistingServer: !isCi,
    timeout: 120_000,
    url: URL,
  },
  ...(isCi && { workers: 1 }),
});
