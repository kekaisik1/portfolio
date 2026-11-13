import { expect, test } from '@playwright/test';

/**
 * Nobody can listen from a test. Instead every place's ambience is rendered offline (the same recipe, engine and
 * master gain the page uses) and measured: it must be there, quiet, unclipped and centred on zero.
 * The page is tests/pages/sound-check.html, served by the dev server (see playwright.config.ts).
 */
const PAGE = 'http://127.0.0.1:5174/tests/pages/sound-check.html';
const SECONDS = 45;

interface Measure {
  rms: number;
  peak: number;
  dc: number;
}

test('every place has a sound that is not silent, does not clip and has no offset', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  await page.goto(PAGE);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'yes');

  const measured = await page.evaluate(
    (seconds) =>
      (window as unknown as { measureAll: (s: number) => Promise<Record<string, Measure>> }).measureAll(seconds),
    SECONDS,
  );

  const ids = Object.keys(measured);
  expect(ids).toHaveLength(10);
  const db = (x: number): string => `${(20 * Math.log10(x)).toFixed(1)} dBFS`;
  for (const id of ids) {
    const m = measured[id];
    console.log(
      `${id.padEnd(14)} rms ${m.rms.toFixed(4)} (${db(m.rms)})  peak ${m.peak.toFixed(3)}  dc ${m.dc.toExponential(1)}`,
    );
    /* there, but quiet: ambience sits between about -46 and -20 dBFS */
    expect(m.rms, `${id} is silent`).toBeGreaterThan(0.005);
    expect(m.rms, `${id} is loud`).toBeLessThan(0.1);
    expect(m.peak, `${id} clips`).toBeLessThan(0.9);
    expect(Math.abs(m.dc), `${id} has an offset`).toBeLessThan(0.002);
  }
  expect(problems).toEqual([]);
});
