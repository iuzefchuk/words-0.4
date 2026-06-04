import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { DIRECTORY } from './meta/constants.ts';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    allowOnly: false,
    clearMocks: true,
    dir: DIRECTORY.src,
    environment: 'happy-dom',
    globals: false,
    mockReset: true,
    passWithNoTests: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    watch: false,
  },
});
