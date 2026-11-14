import { expect, test, type Page } from '@playwright/test';

async function open(page: Page): Promise<void> {
  await page.goto('./#emberquill');
  await expect(page.locator('html')).toHaveClass(/\bready\b/, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#emberquill')).toHaveClass(/\bon\b/);
  await expect(page.locator('#cut > *')).toHaveCount(0);
}

/** Press a toy the way a key or a finger does, without waiting for the painting's slow push-in to stop. */
const press = (page: Page, id: string): Promise<void> =>
  page.locator(`#emberquill .toy[data-toy="${id}"]`).evaluate((b: HTMLElement) => b.click());

const piece = (page: Page, file: string) => page.locator(`#emberquill .piece[src$="${file}"]`);

test.describe("the dragon's hall is a toy", () => {
  test('six things answer a press, each a named button, none standing on the words, the tag or the switches', async ({
    page,
  }) => {
    await open(page);
    const toys = page.locator('#emberquill .toy');

    await expect(toys).toHaveCount(6);
    for (const name of ['Wake the dragon', 'Open the chest', 'Throw the die', "Light the wizard's staff"])
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    const overlaps = await page.evaluate(() => {
      const box = (el: Element | null): DOMRect => {
        if (!el) throw new Error('missing element');
        return el.getBoundingClientRect();
      };
      const others = [
        box(document.querySelector('#emberquill .block')),
        box(document.getElementById('switches')),
        box(document.getElementById('bar')),
      ];
      return [...document.querySelectorAll<HTMLElement>('#emberquill .toy:not([hidden])')].filter((t) => {
        const r = t.getBoundingClientRect();
        return others.some((o) => r.left < o.right && o.left < r.right && r.top < o.bottom && o.top < r.bottom);
      }).length;
    });
    expect(overlaps).toBe(0);
    /* no labelled spots and no panel here: the picture is the thing to try */
    await expect(page.locator('#emberquill .spot')).toHaveCount(0);
    await expect(page.locator('#emberquill .acts .try')).toHaveCount(0);
  });

  test('the dragon breathes fire: a piece of the second painting lies exactly over its place, then is gone', async ({
    page,
  }) => {
    await open(page);
    await press(page, 'dragon');
    const fire = piece(page, 'fire.webp');

    await expect(fire).toBeVisible();
    await expect.poll(() => fire.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.7);
    /* its top right corner is the painting's: the painting covers the window and the piece runs to its right edge */
    const lies = await page.evaluate(() => {
      const img = document.querySelector<HTMLElement>('#emberquill .piece[src$="fire.webp"]');
      if (!img) throw new Error('no fire');
      return { right: img.offsetLeft + img.offsetWidth, ratio: img.offsetWidth / img.offsetHeight };
    });
    /* offsetLeft and offsetWidth are whole pixels: a pixel of rounding either way */
    expect(Math.abs(lies.right - 1440)).toBeLessThanOrEqual(1.5);
    expect(lies.ratio).toBeCloseTo(1496 / 500, 1);
    await expect(fire).toHaveCount(0, { timeout: 6000 });
  });

  test('the chest opens and stays open until it is pressed again', async ({ page }) => {
    await open(page);
    const chest = piece(page, 'chest.webp');

    await press(page, 'chest');
    await expect.poll(() => chest.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    await page.waitForTimeout(600);
    await expect(chest).toHaveCount(1);
    await press(page, 'chest');
    await expect(chest).toHaveCount(0);
  });

  test('the die is thrown, lands where it lay, shows a number from 1 to 20 and says it', async ({ page }) => {
    await open(page);
    await press(page, 'die');

    await expect(piece(page, 'die.webp')).toHaveCount(1);
    await expect(piece(page, 'ledge.webp')).toHaveCount(1);
    const chip = page.locator('#emberquill .roll');
    await expect(chip).toHaveText(/^([1-9]|1\d|20)$/, { timeout: 5000 });
    await expect(piece(page, 'die.webp')).toHaveCount(0);
    await expect(page.locator('#emberquill .toy-say')).toHaveText(/^(You rolled \d+\.|A natural 20\.)$/);
    await expect(chip).toHaveCount(0, { timeout: 6000 });
  });

  test('the archer looses an arrow and the dragon answers with fire', async ({ page }) => {
    await open(page);
    await press(page, 'archer');

    await expect(page.locator('#emberquill .streak')).toHaveCount(1);
    await expect(piece(page, 'fire.webp')).toHaveCount(1, { timeout: 3000 });
  });

  test('leaving the place clears what was going on, and the motion switch takes the toys away', async ({ page }) => {
    await open(page);
    await press(page, 'chest');
    await expect(piece(page, 'chest.webp')).toHaveCount(1);

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#history-lens')).toHaveClass(/\bon\b/);
    await expect(page.locator('#emberquill .piece')).toHaveCount(0);

    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#emberquill')).toHaveClass(/\bon\b/);
    await page.locator('#sw-motion').click();
    await expect(page.locator('#emberquill .toy:visible')).toHaveCount(0);
  });
});
