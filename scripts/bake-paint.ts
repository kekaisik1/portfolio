/**
 * npm run paint: bake every painting into public/paint/<kind>.webp and record them in src/paint/baked.json.
 * The paintings are code: seeded SVG washes. Painting them takes a real browser (SVG filters) and, for the big
 * ones, a few hundred milliseconds each, so the site ships them baked instead of painting them on every visit.
 * Run it after changing anything under src/paint/; a unit test fails until you do.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const ROOT = resolve(import.meta.dirname, '..'),
  OUT = resolve(ROOT, 'public/paint'),
  INDEX = resolve(ROOT, 'src/paint/baked.json');

interface BakedFile {
  k: string;
  q: number;
  w: number;
  h: number;
  hash: string;
  occ: string;
  bb: number[];
  webp: string;
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const browser = await chromium.launch();
try {
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('The Vite dev server did not report an address, so there is nothing to open.');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (err) => console.error('in the page:', err.message));
  await page.goto(new URL('scripts/bake.html', url).href);
  await page.waitForFunction(() => typeof window.bakeAll === 'function');
  const files = await page.evaluate(() => {
    const bake = window.bakeAll;
    if (!bake) throw new Error('bakeAll is missing');
    return bake();
  });

  const textures = await page.evaluate(() => {
    const bake = window.bakeTextures;
    if (!bake) throw new Error('bakeTextures is missing');
    return bake();
  });

  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(OUT)) if (f.endsWith('.webp') || f.endsWith('.png')) rmSync(resolve(OUT, f));
  for (const [name, url] of Object.entries(textures))
    writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  const index: Record<string, Omit<BakedFile, 'k' | 'webp'>> = {};
  let bytes = 0;
  for (const f of files as BakedFile[]) {
    const data = Buffer.from(f.webp.slice(f.webp.indexOf(',') + 1), 'base64');
    if (!f.webp.startsWith('data:image/webp'))
      throw new Error(`${f.k}: the browser did not make a WebP (got ${f.webp.slice(0, 30)}…).`);
    writeFileSync(resolve(OUT, `${f.k}.webp`), data);
    bytes += data.length;
    index[f.k] = { q: f.q, w: f.w, h: f.h, hash: f.hash, occ: f.occ, bb: f.bb };
  }
  writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
  console.log(
    `baked ${files.length} paintings (${(bytes / 1024).toFixed(0)} KB) and ${Object.keys(textures).length} paper textures into public/paint/`,
  );
} finally {
  await browser.close();
  await server.close();
}
