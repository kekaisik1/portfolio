import { expect, test, type Locator, type Page } from '@playwright/test';

/** The seven projects, each with its try. */
const PROJECTS = ['front-desk', 'numbers-room', 'lowl', 'emberquill', 'history-lens', 'bookforge', 'kana-notebook'];

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`./#${id}`);
  await expect(page.locator('html')).toHaveClass(/\bready\b/, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(`#${id}`)).toHaveClass(/\bon\b/);
  await expect(page.locator('#cut > *')).toHaveCount(0);
}

/** The way into a project's try that is on screen: its spot in the painting, or the Try it button in its words. */
async function wayIn(page: Page, id: string): Promise<Locator> {
  const spot = page.locator(`#${id} .spot[data-try]`);
  return (await spot.isVisible()) ? spot : page.locator(`#${id} .acts .try`);
}

/** Press the panel's next unanswered choice until it says it is done (an example call goes on by itself). */
async function finish(page: Page): Promise<void> {
  const dlg = page.locator('#try');
  for (let i = 0; i < 60; i++) {
    if ((await dlg.getAttribute('data-done')) === 'true') return;
    const next = dlg.locator('#try-choices button:not([disabled]):not([data-mark])').first();
    if (await next.count()) await next.click();
    else await page.waitForTimeout(300);
  }
  throw new Error('the try never finished');
}

function refuseOutside(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  void page.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) => {
      problems.push(`request left the machine: ${route.request().url()}`);
      return route.abort();
    },
  );
  return problems;
}

test.describe('try it', () => {
  for (const id of PROJECTS)
    test(`${id}: opens from the painting, can be finished, closes with Esc and gives focus back`, async ({ page }) => {
      test.setTimeout(45_000);
      const problems = refuseOutside(page);
      await open(page, id);
      const opener = await wayIn(page, id);
      await expect(opener).toHaveAccessibleName(/^Try .+: .+/);

      await opener.click();
      const dlg = page.locator('#try');
      await expect(dlg).toBeVisible();
      await expect(page.locator('#try-t')).toContainText(':');
      /* the frame loop rests under it */
      await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
      await finish(page);
      await expect(page.locator('#try-said')).not.toHaveText('');

      await page.keyboard.press('Escape');
      await expect(dlg).toBeHidden();
      await expect(opener).toBeFocused();
      expect(problems).toEqual([]);
    });

  test('Kyoto: three cards, each answered in words, and a score out of three at the end', async ({ page }) => {
    await open(page, 'kana-notebook');
    await (await wayIn(page, 'kana-notebook')).click();
    const choices = page.locator('#try-choices button');

    await expect(page.locator('#try-step')).toHaveText('card 1 of 3');
    await expect(page.locator('.try-glyph')).toHaveAttribute('aria-label', 'Card 1: a hiragana character');
    await choices.filter({ hasText: /^sa$/ }).click();
    await expect(page.locator('#try-blocks')).toContainText('Not this one: き is ki.');
    await expect(choices.filter({ hasText: 'ki' })).toContainText('right');
    await expect(page.locator('#try-said')).toHaveText('Not this one: き is ki.');
    /* the next card is the next thing to press, and has focus */
    await expect(choices.filter({ hasText: 'Next card' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#try-step')).toHaveText('card 2 of 3');
    await choices.filter({ hasText: /^nu$/ }).click();
    await choices.filter({ hasText: 'Next card' }).click();
    await choices.filter({ hasText: /^a$/ }).click();

    await expect(page.locator('#try-blocks')).toContainText('2 of 3.');
    await expect(page.locator('#try-end a')).toHaveAttribute('target', '_blank');
  });

  test('the dragon: the d20 lands, the sum is in words, and the orc loses its hit points until it is down', async ({
    page,
  }) => {
    await open(page, 'emberquill');
    await (await wayIn(page, 'emberquill')).click();
    const roll = page.getByRole('button', { name: 'Roll the d20', exact: true });

    await expect(roll).toBeFocused();
    await roll.click();
    await expect(page.locator('#try-said')).toHaveText(/^\d+ \+ 5 = \d+ vs AC 13: .+\. Orc: \d+ of 15 hit points\.$/);
    await expect(page.locator('.try-roll')).toHaveText(/^\d+$/);
    await finish(page);
    await expect(page.locator('#try-blocks')).toContainText('The orc is down');
    await expect(page.locator('.try-meter-t')).toHaveText('Orc: 0 of 15 hit points');
  });

  test('the pass: the example call comes line by line after picking up, and says it is an example', async ({
    page,
  }) => {
    await open(page, 'front-desk');
    await (await wayIn(page, 'front-desk')).click();

    await expect(page.locator('#try-blocks')).toContainText('example call');
    await page.getByRole('button', { name: 'Pick up', exact: true }).click();
    await expect(page.locator('.try-who')).toHaveCount(1, { timeout: 4000 });
    await expect(page.locator('.try-who')).toHaveCount(2, { timeout: 4000 });
    await expect(page.locator('#try')).toHaveAttribute('data-done', 'true', { timeout: 10_000 });
    await expect(page.locator('#try-blocks')).toContainText('Booked: Thursday');
  });

  test('Rome: one choice, then what followed and what is in the record, tagged as the app tags it', async ({
    page,
  }) => {
    await open(page, 'history-lens');
    await (await wayIn(page, 'history-lens')).click();

    await expect(page.locator('#try-blocks .try-tag')).toHaveText('Reconstructed');
    await page.getByRole('button', { name: 'Ask them to take the handle off the pump', exact: true }).click();
    await expect(page.locator('#try-choices button')).toHaveCount(1);
    await expect(page.locator('#try-choices button')).toContainText('your choice');
    await expect(page.locator('#try-after .try-tag')).toHaveText(['Documented', 'History']);
  });

  test('the repair shop: what broke shows that service page of the live site, in a new tab', async ({ page }) => {
    await open(page, 'lowl');
    await (await wayIn(page, 'lowl')).click();

    await page.getByRole('button', { name: 'Oven', exact: true }).click();
    const link = page.locator('#try-end a');
    await expect(link).toHaveAttribute('href', 'https://www.lowl.net/services/oven-repair/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('button', { name: 'Oven', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('a press outside the card closes it, and Close does too', async ({ page }) => {
    await open(page, 'bookforge');
    const opener = await wayIn(page, 'bookforge');
    await opener.click();
    await expect(page.locator('#try')).toBeVisible();
    await page.mouse.click(20, 450);
    await expect(page.locator('#try')).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.click();
    await page
      .locator('#try')
      .getByRole('button', { name: /^Close/ })
      .click();
    await expect(page.locator('#try')).toBeHidden();
  });

  test('the arrow keys do not travel while it is open', async ({ page }) => {
    await open(page, 'lowl');
    await (await wayIn(page, 'lowl')).click();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);

    await expect(page.locator('#lowl')).toHaveClass(/\bon\b/);
  });

  test('where the spot cannot stand (the pen is outside a phone crop), the Try it button opens it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, 'bookforge');
    await expect(page.locator('#bookforge .spot[data-try]')).toBeHidden();
    const button = page.locator('#bookforge .acts .try');
    await expect(button).toBeVisible();

    await button.click();
    await expect(page.locator('#try')).toBeVisible();
    await finish(page);
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  });

  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ])
    test(`at ${size.width}x${size.height} the card fits the screen, and every choice is a 44 px target`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      for (const id of ['history-lens', 'numbers-room', 'kana-notebook']) {
        await open(page, id);
        await (await wayIn(page, id)).click();
        await page.locator('#try-choices button').first().click();
        /* measured once it has come up */
        await page
          .locator('#try')
          .evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)));
        const card = await page.locator('#try').boundingBox();
        expect(card?.x, id).toBeGreaterThanOrEqual(0);
        expect((card?.x ?? 0) + (card?.width ?? 0), id).toBeLessThanOrEqual(size.width);
        expect((card?.y ?? 0) + (card?.height ?? 0), id).toBeLessThanOrEqual(size.height + 0.5);
        const small = await page
          .locator('#try button, #try a')
          .evaluateAll(
            (els) =>
              els.filter((e) => (e as HTMLElement).offsetParent !== null && e.getBoundingClientRect().height < 44)
                .length,
          );
        expect(small, id).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.keyboard.press('Escape');
      }
    });
});
