import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { fillShell } from './src/content/render';
import { readVideoManifest } from './scripts/video-manifest';

const VIDEOS_DIR = resolve(import.meta.dirname, 'public/videos');
const VIRTUAL_VIDEOS = 'virtual:videos';

/** Writes the words from src/content/ into index.html, so they are in the page without JavaScript. */
function contentHtml(): Plugin {
  return {
    name: 'portfolio:content-html',
    /* 'pre': Vite then puts the site's base in front of every /fonts/… and /worlds/… address written here */
    transformIndexHtml: { order: 'pre', handler: (html) => fillShell(html, readVideoManifest(VIDEOS_DIR)) },
  };
}

/** `import videos from 'virtual:videos'`: which projects have a video in public/videos/ and how long it runs, found at build time. */
function videoManifest(): Plugin {
  return {
    name: 'portfolio:video-manifest',
    resolveId: (id) => (id === VIRTUAL_VIDEOS ? '\0' + VIRTUAL_VIDEOS : undefined),
    load(id) {
      if (id !== '\0' + VIRTUAL_VIDEOS) return undefined;
      return `export default ${JSON.stringify(readVideoManifest(VIDEOS_DIR))};`;
    },
  };
}

export default defineConfig({
  /* served from the root of kekaisik.dev (GitHub Pages with a custom domain) */
  base: '/',
  plugins: [contentHtml(), videoManifest()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 400,
  },
  preview: { port: 4173, strictPort: true },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
