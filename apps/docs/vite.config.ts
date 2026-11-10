/// <reference types="vitest" />

import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const routes = [
  '/',
  '/docs',
  '/docs/run',
  '/docs/reference',
  '/docs/colors',
  '/docs/output',
  '/docs/ci',
  '/docs/open-source',
  '/changelog',
];

export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  ssr: {
    noExternal: ['@spartan-ng/**', '@angular/cdk/**'],
  },
  plugins: [
    analog({
      prerender: {
        routes: async () => routes,
      },
    }),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
