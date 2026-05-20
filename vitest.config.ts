import { readFileSync } from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: 'happy-dom',
    exclude: readFileSync(path.resolve(__dirname, '.gitignore'), 'utf-8').split('\n'),
    globals: false,
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    restoreMocks: true,
    watch: false,
  },
});
