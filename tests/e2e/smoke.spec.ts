import { expect, test, type Page } from '@playwright/test';

const SLUGS = ['front-desk', 'numbers-room', 'lowl', 'emberquill', 'history-lens', 'bookforge', 'kana-notebook'];
const PHONE = { width: 390, height: 844 };

/** Collect console errors and uncaught exceptions, and refuse every request that is not to the local server. */
async function watch(page: Page): Promise<string[]> {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  await page.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) => {
      problems.push(`request left the machine: ${route.request().url()}`);
      return route.abort();
    },
  );
  return problems;
}

/** Open the page and wait until the first screen has drawn itself and the horizon line is showing. */
async function open(page: Page, path = './'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/ready-nav/, { timeout: 15_000 });
  /* the page is laid out once more when the typefaces arrive: wait for that, so positions are final */
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => r(null)))));
}

/** Is this place's button on screen (at least its middle)? */
async function onScreen(page: Page, slug: string): Promise<boolean> {
  return page.evaluate((s) => {
    const r = document.querySelector(`#${s} .obj`)?.getBoundingClientRect();
    if (!r) return false;
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    return cx > 0 && cx < innerWidth && cy > 0 && cy < innerHeight;
  }, slug);
}

test('the page loads with no console errors and sends nothing off the machine', async ({ page }) => {
  const problems = await watch(page);

  await open(page);
  await page.waitForTimeout(1500);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Hi, I'm Kaisar.");
  await expect(page.locator('.obj')).toHaveCount(7);
  expect(problems).toEqual([]);
});

test('the drawing is really drawn: the scene canvas is not blank', async ({ page }) => {
  await open(page);

  const colours = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('#scene');
    const g = c?.getContext('2d');
    if (!c || !g) return 0;
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const d = g.getImageData(
        Math.floor((c.width * (i % 20)) / 20),
        Math.floor((c.height * Math.floor(i / 20)) / 20),
        1,
        1,
      ).data;
      seen.add(`${d[0] >> 3},${d[1] >> 3},${d[2] >> 3}`);
    }
    return seen.size;
  });

  expect(colours).toBeGreaterThan(8);
});

test('all seven places can be reached with the arrow keys, in order', async ({ page }) => {
  await open(page);

  for (const slug of SLUGS) {
    await page.keyboard.press('ArrowRight');

    await expect(page.locator(`.horizon a[href="#${slug}"]`)).toHaveAttribute('aria-current', 'location');
    await expect.poll(() => onScreen(page, slug), { timeout: 8000 }).toBe(true);
  }
});

test('entering and leaving a place by keyboard restores focus and scroll', async ({ page }) => {
  const problems = await watch(page);
  await open(page);
  await page.locator('.horizon a[href="#lowl"]').click();
  const place = page.getByRole('button', { name: 'Go inside LOWL' });
  await expect(place).toBeFocused();
  await expect.poll(() => onScreen(page, 'lowl')).toBe(true);
  const before = await page.evaluate(() => window.scrollY);

  await page.keyboard.press('Enter');

  const room = page.getByRole('dialog');
  await expect(room).toBeVisible();
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('LOWL');
  await expect(room).toContainText('A website for an appliance-repair business');
  await expect(page).toHaveURL(/#lowl$/);

  await page.keyboard.press('Escape');

  await expect(room).toBeHidden();
  await expect(place).toBeFocused();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(2);
  expect(problems).toEqual([]);
});

test('inside a place Tab stays in the room, and the link and video are there', async ({ page }) => {
  await open(page);
  await page.locator('.horizon a[href="#kana-notebook"]').click();
  await page.keyboard.press('Enter');
  const room = page.getByRole('dialog');
  await expect(room).toBeVisible();

  await expect(room.getByRole('link', { name: "It's live." })).toHaveAttribute(
    'href',
    'https://kana-notebook-production.up.railway.app',
  );
  await expect(room.locator('video')).toHaveAttribute('src', '/portfolio/videos/kana-notebook.mp4');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#inside'))).toBe(true);
  }
});

test('the browser Back button leaves a place, and Forward goes back in', async ({ page }) => {
  await open(page);
  await page.locator('.horizon a[href="#bookforge"]').click();
  await page.keyboard.press('Enter');
  const room = page.getByRole('dialog');
  await expect(room).toBeVisible();

  await page.goBack();
  await expect(room).toBeHidden();

  await page.goForward();
  await expect(room).toBeVisible();
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('BookForge');
});

test('Forward pressed while a place is still closing ends up inside it', async ({ page }) => {
  await open(page);
  await page.locator('.horizon a[href="#bookforge"]').click();
  await page.keyboard.press('Enter');
  const room = page.getByRole('dialog');
  await expect(room).toBeVisible();

  /* Back starts the closing animation; Forward lands before it has finished */
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => !location.hash.includes('bookforge') || history.state === null);
  await page.evaluate(() => history.forward());

  await expect(room).toBeVisible();
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('BookForge');
  await page.waitForTimeout(800);
  await expect(room).toBeVisible();
});

test('a place with no video says so', async ({ page }) => {
  await open(page);
  await page.locator('.horizon a[href="#emberquill"]').click();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toContainText('no video yet');
});

test('a #emberquill deep link lands on Emberquill', async ({ page }) => {
  await open(page, './#emberquill');

  await expect.poll(() => onScreen(page, 'emberquill'), { timeout: 8000 }).toBe(true);
  await expect(page.locator('.horizon a[href="#emberquill"]')).toHaveAttribute('aria-current', 'location');
  await page.waitForTimeout(3500);
  expect(await onScreen(page, 'emberquill')).toBe(true);
});

test('an old deep link still lands on the place that took it over', async ({ page }) => {
  await open(page, './#voice-receptionist');

  await expect.poll(() => onScreen(page, 'front-desk'), { timeout: 8000 }).toBe(true);
});

test.describe('leave a note', () => {
  async function openNote(page: Page): Promise<void> {
    await open(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    /* the scene glides to the end: wait until the button has arrived and stopped moving before pressing it */
    const button = page.getByRole('button', { name: 'or leave a note' });
    let last = -1;
    await expect
      .poll(
        async () => {
          const x = (await button.boundingBox())?.x ?? -1;
          const still = x >= 0 && x < 1440 && Math.abs(x - last) < 0.5;
          last = x;
          return still;
        },
        { timeout: 30_000, intervals: [250] },
      )
      .toBe(true);
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }

  test('an empty note is refused with a message, and the field is marked', async ({ page }) => {
    await openNote(page);

    await page.getByRole('button', { name: 'send it' }).click();

    await expect(page.locator('#note-msg')).toHaveText('Write something first.');
    await expect(page.locator('#note-text')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#note-text')).toBeFocused();
  });

  test('typing clears the complaint', async ({ page }) => {
    await openNote(page);
    await page.getByRole('button', { name: 'send it' }).click();

    await page.locator('#note-text').fill('hello');

    await expect(page.locator('#note-msg')).toHaveText('');
    await expect(page.locator('#note-text')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('a note over 600 characters is refused', async ({ page }) => {
    await openNote(page);
    /* the field itself stops typing at 600; a paste through script can still exceed it */
    await page.locator('#note-text').evaluate((el: HTMLTextAreaElement) => {
      el.value = 'a'.repeat(601);
    });

    await page.getByRole('button', { name: 'send it' }).click();

    await expect(page.locator('#note-msg')).toContainText('too long for the paper');
  });

  test('with no API the note says it did not go through and gives the email', async ({ page }) => {
    const problems = await watch(page);
    await openNote(page);
    await page.locator('#note-text').fill('A note from the smoke test. It must never be sent.');

    await page.getByRole('button', { name: 'send it' }).click();

    await expect(page.locator('#note-msg')).toContainText("It didn't go through. Write me instead:");
    await expect(page.locator('#note-msg a')).toHaveAttribute('href', 'mailto:kaisar.turysbek@gmail.com');
    await expect(page.getByRole('button', { name: 'send it' })).toBeEnabled();
    expect(problems).toEqual([]);
  });
});

for (const width of [320, 390, 768, 1024]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 900 ? 844 : 768 });
    await open(page);

    for (const at of [0, 0.3, 0.6, 1]) {
      await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), at);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `at ${at * 100}% of the page`).toBeLessThanOrEqual(0);
    }
  });
}

test('on a phone each place stands about half the screen tall and fits the width', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await open(page);

  const boxes = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.obj')).map((b) => {
      const r = b.getBoundingClientRect();
      return { w: r.width, h: r.height, left: r.left };
    }),
  );

  expect(boxes).toHaveLength(7);
  for (const b of boxes) {
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.left + b.w).toBeLessThanOrEqual(PHONE.width + 0.5);
    /* the button is the building plus its strip of ground; the building alone is 36-55% of the screen */
    expect(b.h / PHONE.height).toBeGreaterThan(0.42);
  }
});

test('on a phone a place can be entered by tap and left with the cross', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await open(page, './#numbers-room');
  await expect.poll(() => onScreen(page, 'numbers-room')).toBe(true);

  await page.getByRole('button', { name: 'Go inside The Numbers Room' }).click();
  const room = page.getByRole('dialog');
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('The Numbers Room');

  await page.getByRole('button', { name: 'Back outside' }).click();
  await expect(room).toBeHidden();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the page renders at once, places are drawn, and a place opens without a transition', async ({ page }) => {
    const problems = await watch(page);
    await open(page);

    await page.locator('.horizon a[href="#history-lens"]').click();
    await expect.poll(() => onScreen(page, 'history-lens')).toBe(true);
    const inked = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#history-lens .obj-base');
      const g = c?.getContext('2d');
      if (!c || !g || c.width < 10) return 0;
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 400) if (d[i] > 0) n++;
      return n;
    });
    expect(inked).toBeGreaterThan(100);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(problems).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every project, its text and its link are readable in the page', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('article.spot')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Emberquill' })).toBeVisible();
    await expect(page.getByText('You can throw furniture.')).toBeVisible();
    await expect(page.getByRole('link', { name: "It's live — go break something." })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Telegram @kekaisik' })).toBeVisible();
  });
});

test('for screen readers every place has its text and link in the page, outside the Tab order', async ({ page }) => {
  await open(page);

  const spots = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article.spot')).map((a) => ({
      name: a.querySelector('h2')?.textContent ?? '',
      text: a.querySelector('.more')?.textContent ?? '',
      hiddenFromAT: !!a.querySelector('.more')?.closest('[hidden], [aria-hidden="true"]'),
      tabbableLinks: Array.from(a.querySelectorAll<HTMLAnchorElement>('.more a')).filter((l) => l.tabIndex >= 0).length,
      button: a.querySelector('.obj')?.getAttribute('aria-label') ?? '',
    })),
  );

  expect(spots).toHaveLength(7);
  for (const s of spots) {
    expect(s.text.length, s.name).toBeGreaterThan(60);
    expect(s.hiddenFromAT, s.name).toBe(false);
    expect(s.tabbableLinks, s.name).toBe(0);
    expect(s.button).toBe(`Go inside ${s.name}`);
  }
});
