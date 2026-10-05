import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/agentic-arcade/',
  plugins: [svelte()],
  resolve: {
    alias: { '@arcade/sdk': fileURLToPath(new URL('./src/sdk/index.ts', import.meta.url)) },
    // Svelte 5 resolves to its server build under Vitest unless the browser condition is set.
    conditions: process.env.VITEST ? ['browser'] : undefined,
  },
  server: { port: 3456, strictPort: true },
  preview: { port: 3456, strictPort: true },
  build: { manifest: true, target: 'es2022' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts', 'tests/contract/**/*.test.ts'],
    setupFiles: ['tests/setup/canvas-stub.ts'],
  },
});
