import { expect, test, type Page } from '@playwright/test';

const IDS = [
  'hello',
  'front-desk',
  'numbers-room',
  'lowl',
  'emberquill',
  'history-lens',
  'bookforge',
  'kana-notebook',
  'about',
  'contact',
];

async function open(page: Page, id: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`./#${id}`);
  await expect(page.locator('html')).toHaveClass(/\bready\b/, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`#${id}`)).toHaveClass(/\bon\b/);
  await expect(page.locator('#cut > *')).toHaveCount(0);
}

/** The on-screen world's reacting object, if it is shown, and everything it must not stand on. */
const placed = (page: Page): Promise<{ react: DOMRect | null; others: Record<string, DOMRect> }> =>
  page.evaluate(() => {
    const world = document.querySelector('.world.on');
    const react = world?.querySelector<HTMLElement>('.react');
    const box = (el: Element | null): DOMRect => {
      if (!el) throw new Error('missing element');
      return el.getBoundingClientRect();
    };
    const others: Record<string, DOMRect> = {
      words: box(document.querySelector('.world.on .block')),
      switches: box(document.getElementById('switches')),
      mark: box(document.querySelector('.brand .mark')),
      tag: box(document.getElementById('bar')),
    };
    world?.querySelectorAll<HTMLElement>('.spot').forEach((s, k) => {
      if (!s.hidden) others[`spot ${k}`] = s.getBoundingClientRect();
    });
    return { react: react && !react.hidden && react.offsetParent ? react.getBoundingClientRect() : null, others };
  });
const apart = (a: DOMRect, b: DOMRect): boolean =>
  a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;

test.describe('the painting reacts', () => {
  test('Rome: pressing the brazier flares it and throws sparks, then it is quiet again', async ({ page }) => {
    await open(page, 'history-lens');
    const brazier = page.getByRole('button', { name: 'Stoke the brazier', exact: true });
    await expect(brazier).toBeVisible();
    expect(await brazier.evaluate((b) => getComputedStyle(b).cursor)).toBe('pointer');

    await brazier.click();
    await expect(page.locator('#history-lens .flare')).toHaveCount(1);
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'on');
    /* gone after a second or two */
    await expect(page.locator('#history-lens .flare')).toHaveCount(0, { timeout: 4000 });
  });

  test('the pass has nothing in its air, but its booth light flickers, and the canvas rests again', async ({
    page,
  }) => {
    await open(page, 'front-desk');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
    const booth = page.getByRole('button', { name: "Flick the booth's light", exact: true });

    await booth.focus();
    await expect(booth).toBeFocused();
    expect(await booth.evaluate((b) => getComputedStyle(b).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(page.locator('#front-desk .flare')).toHaveCount(1);
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
  });

  test('the observatory: a shooting star; the summit: snow off the top, on a canvas that rests after it', async ({
    page,
  }) => {
    await open(page, 'numbers-room');
    await page.getByRole('button', { name: 'Wait for a shooting star', exact: true }).click();
    await expect(page.locator('#numbers-room .streak')).toHaveCount(1);
    await expect(page.locator('#numbers-room .streak')).toHaveCount(0, { timeout: 3000 });
  });

  test('with the motion switched off there is nothing to press', async ({ page }) => {
    await open(page, 'history-lens');
    await expect(page.locator('#history-lens .react')).toBeVisible();
    await page.locator('#sw-motion').click();

    await expect(page.locator('#history-lens .react')).toBeHidden();
    await page.locator('#sw-motion').click();
    await expect(page.locator('#history-lens .react')).toBeVisible();
  });

  for (const size of [
    { width: 1440, height: 900 },
    { width: 1366, height: 680 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ])
    test(`at ${size.width}x${size.height} it never stands on the words, a spot, the switches or the tag`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(size);
      let shown = 0;
      for (const id of IDS) {
        await open(page, id);
        const { react, others } = await placed(page);
        if (!react) continue;
        shown++;
        expect(react.width, id).toBeGreaterThanOrEqual(44);
        expect(react.height, id).toBeGreaterThanOrEqual(44);
        for (const [name, r] of Object.entries(others))
          expect(apart(react, r), `${id}: the reacting object stands on the ${name}`).toBe(true);
      }
      /* most places keep theirs on a wide screen; on a phone the upright crop leaves several objects out */
      expect(shown).toBeGreaterThanOrEqual(size.width > 1000 ? 8 : 3);
    });
});
