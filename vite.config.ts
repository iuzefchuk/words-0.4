import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { DIRECTORY } from './meta/constants.ts';
import EnvVariableFinder from './meta/EnvVariableFinder.ts';
import type { Plugin, UserConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    build: {
      chunkSizeWarningLimit: 1_000,
      emptyOutDir: true,
      outDir: DIRECTORY.dist,
      target: 'esnext',
    },
    envDir: DIRECTORY.root,
    optimizeDeps: {
      include: ['vue', 'pinia'],
    },
    plugins: [
      vue(),
      {
        configureServer(server): void {
          server.middlewares.use((_, res, next) => {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            next();
          });
        },
        name: 'cross-origin-isolation',
      } satisfies Plugin,
    ],
    publicDir: DIRECTORY.public,
    resolve: {
      tsconfigPaths: true,
    },
    root: DIRECTORY.srcInterface,
    server: {
      port: EnvVariableFinder.getFromConfig('VITE_PORT', {
        envDir: DIRECTORY.root,
        mode,
        parse: value => Number(value),
        validate: value => !Number.isInteger(value) || value <= 0,
      }),
      strictPort: true,
    },
  } satisfies UserConfig;
});
