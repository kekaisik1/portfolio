import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const DEV_PORT = 5174;
/* the living photo is WebGL: locally Chromium is asked for the real GPU; a CI runner has none and uses the
   software renderer, where the tests that watch the photo move skip themselves */
const GPU_ARGS = process.env.CI
  ? ['--enable-unsafe-swiftshader']
  : ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'];

/**
 * The smoke suite runs against the real build, served the way GitHub Pages serves it (under /portfolio/),
 * with no API address: nothing is ever sent to the production API from tests.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}/portfolio/`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: GPU_ARGS },
      },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT}`,
      url: `http://127.0.0.1:${PORT}/portfolio/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { VITE_API_URL: '' },
    },
    /* the dev server, for the one page that is not part of the build: the sound check (tests/e2e/sound.spec.ts) */
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${DEV_PORT} --strictPort`,
      url: `http://127.0.0.1:${DEV_PORT}/tests/pages/sound-check.html`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_API_URL: '' },
    },
  ],
});
