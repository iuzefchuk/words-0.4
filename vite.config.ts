import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const ENV = loadEnv(mode, __dirname, '');
  const PORT = Number(ENV.VITE_PORT);
  return {
    build: {
      chunkSizeWarningLimit: 1000,
      emptyOutDir: true,
      outDir: path.resolve(__dirname, 'dist'),
      target: 'esnext',
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    optimizeDeps: {
      include: ['vue', 'pinia'],
    },
    plugins: [
      vue(),
      {
        configureServer(server) {
          server.middlewares.use((_, res, next) => {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            next();
          });
        },
        name: 'cross-origin-isolation',
      },
    ],
    publicDir: path.resolve(__dirname, 'public'),
    resolve: {
      tsconfigPaths: true,
    },
    root: path.resolve(__dirname, './src/interface'),
    server: {
      port: Number.isNaN(PORT) || PORT === 0 ? 5173 : PORT,
      strictPort: true,
    },
  };
});
