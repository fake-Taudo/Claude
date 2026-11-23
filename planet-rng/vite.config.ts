/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renameSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// After the single-file build, publish the result as planet-rng.html
// (dist/ for local testing, project root as the committed deliverable).
function publishSingleFile(): Plugin {
  return {
    name: 'publish-single-file',
    apply: 'build',
    closeBundle() {
      const built = resolve(__dirname, 'dist/index.html');
      if (!existsSync(built)) return;
      const target = resolve(__dirname, 'dist/planet-rng.html');
      renameSync(built, target);
      copyFileSync(target, resolve(__dirname, 'planet-rng.html'));
    },
  };
}

export default defineConfig({
  base: './',
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true }), publishSingleFile()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
