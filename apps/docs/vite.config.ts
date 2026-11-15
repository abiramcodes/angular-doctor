/// <reference types="vitest" />

import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const routes = [
  '/',
  '/docs',
  '/docs/run',
  '/docs/reference',
  '/docs/rules',
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
  // Angular 22 keeps `ngServerMode` checks in `@angular/core`'s
  // `_debug_node-chunk.mjs`. Analog only rewrites `core.mjs`, and its
  // production define reads `build.ssr`, which Vite 8's environment build
  // leaves unset. The flag then stays false, `afterNextRender` runs during
  // prerender, and browser globals throw.
  environments: {
    ssr: {
      define: {
        ngServerMode: 'true',
      },
    },
  },
  plugins: [
    analog({
      static: true,
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
