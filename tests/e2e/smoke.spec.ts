import { expect, test, type Page } from '@playwright/test';

const SLUGS = ['front-desk', 'numbers-room', 'lowl', 'emberquill', 'history-lens', 'bookforge', 'kana-notebook'];
const COUNTRY: Record<string, string> = {
  'front-desk': 'mountains',
  'numbers-room': 'mountains',
  lowl: 'steppe',
  emberquill: 'steppe',
  'history-lens': 'sea',
  bookforge: 'sea',
  'kana-notebook': 'sea',
};
const NAMES: Record<string, string> = {
  'front-desk': 'The Front Desk',
  'numbers-room': 'The Numbers Room',
  lowl: 'LOWL',
  emberquill: 'Emberquill',
  'history-lens': 'History Lens',
  bookforge: 'BookForge',
  'kana-notebook': 'Kana Notebook',
};
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

/** Open the page and wait until the first screen has painted itself and the horizon is laid out. */
async function open(page: Page, path = './'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/ready-nav/, { timeout: 15_000 });
  await expect(page.locator('html')).toHaveClass(/\bready\b/, { timeout: 20_000 });
  /* the page is laid out once more when the typefaces arrive: wait for that, so positions are final */
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => r(null)))));
}

/** Is this place's painted object showing, with its middle on screen? */
async function onScreen(page: Page, slug: string): Promise<boolean> {
  return page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(`.cut[data-slug="${s}"]`);
    if (!el || getComputedStyle(el).visibility !== 'visible') return false;
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    return cx > 0 && cx < innerWidth && cy > 0 && cy < innerHeight;
  }, slug);
}

/** Land on a place by its link and step inside with the keyboard. */
async function enter(page: Page, slug: string): Promise<void> {
  await open(page, `./#${slug}`);
  const label = page.getByRole('button', { name: `Go inside ${NAMES[slug]}` });
  await label.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('the page loads with no console errors and sends nothing off the machine', async ({ page }) => {
  const problems = await watch(page);

  await open(page);
  await page.waitForTimeout(1500);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Hi, I'm Kaisar.");
  await expect(page.locator('.label')).toHaveCount(7);
  expect(problems).toEqual([]);
});

test('the painting is really painted: the first place has paint on its canvas', async ({ page }) => {
  await open(page);

  /* it soaks in for a moment after the page says it is ready */
  const inked = (): Promise<number> =>
    page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.cut[data-slug="front-desk"] canvas');
      const g = c?.getContext('2d');
      if (!c || !g || c.width < 10) return 0;
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const seen = new Set<string>();
      let n = 0;
      for (let i = 3; i < d.length; i += 400)
        if (d[i] > 0) {
          n++;
          seen.add(`${d[i - 3] >> 4},${d[i - 2] >> 4},${d[i - 1] >> 4}`);
        }
      return n > 200 ? seen.size : 0;
    });

  await expect.poll(inked, { timeout: 8000 }).toBeGreaterThan(8);
});

test('all seven places can be reached with the arrow keys, in order, and each is announced', async ({ page }) => {
  await open(page);

  for (const slug of SLUGS) {
    await page.keyboard.press('ArrowRight');

    await expect(page.locator(`.horizon a[href="#${COUNTRY[slug]}"]`)).toHaveAttribute('aria-current', 'location');
    await expect.poll(() => onScreen(page, slug), { timeout: 8000 }).toBe(true);
    await expect(page.locator('#where')).toContainText(NAMES[slug]);
  }
});

test('entering and leaving a place by keyboard restores focus and scroll', async ({ page }) => {
  const problems = await watch(page);
  await open(page);
  await page.locator('.horizon a[href="#steppe"]').click();
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

test('inside a place the finished painting is painted behind the paper', async ({ page }) => {
  await enter(page, 'numbers-room');

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const c = document.querySelector<HTMLCanvasElement>('#in-paint');
          const g = c?.getContext('2d');
          if (!c || !g || c.width < 10 || getComputedStyle(c).opacity !== '1') return 0;
          const d = g.getImageData(Math.floor(c.width * 0.7), Math.floor(c.height * 0.5), 40, 40).data;
          const seen = new Set<string>();
          for (let i = 0; i < d.length; i += 4) seen.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
          return seen.size;
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThan(4);
});

test('inside a place Tab stays in the room, and the link and video are there', async ({ page }) => {
  await enter(page, 'kana-notebook');
  const room = page.getByRole('dialog');

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

test('a video frame says it is loading, then shows the video or says it did not load', async ({ page }) => {
  await enter(page, 'numbers-room');
  const frame = page.locator('#inside .frame');

  /* the bundled Chromium may lack H.264: either the controls come up or the frame says so, never stuck loading */
  await expect
    .poll(async () => {
      const state = await frame.getAttribute('data-state');
      const text = (await frame.textContent()) ?? '';
      return state === 'ready' || text.includes("the video didn't load");
    })
    .toBe(true);
});

test('the browser Back button leaves a place, and Forward goes back in', async ({ page }) => {
  await enter(page, 'bookforge');
  const room = page.getByRole('dialog');

  await page.goBack();
  await expect(room).toBeHidden();

  await page.goForward();
  await expect(room).toBeVisible();
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('BookForge');
});

test('Forward pressed while a place is still closing ends up inside it', async ({ page }) => {
  await enter(page, 'bookforge');
  const room = page.getByRole('dialog');

  /* Back starts the closing dissolve; Forward lands before it has finished */
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => !location.hash.includes('bookforge') || history.state === null);
  await page.evaluate(() => history.forward());

  await expect(room).toBeVisible();
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('BookForge');
  await page.waitForTimeout(800);
  await expect(room).toBeVisible();
});

test('a place with no video says so', async ({ page }) => {
  await enter(page, 'emberquill');

  await expect(page.getByRole('dialog')).toContainText('no video yet');
});

test('a #emberquill deep link lands on Emberquill', async ({ page }) => {
  await open(page, './#emberquill');

  await expect.poll(() => onScreen(page, 'emberquill'), { timeout: 8000 }).toBe(true);
  await expect(page.locator('.horizon a[href="#steppe"]')).toHaveAttribute('aria-current', 'location');
  await page.waitForTimeout(3500);
  expect(await onScreen(page, 'emberquill')).toBe(true);
});

test('a #sea link lands on the first place by the sea', async ({ page }) => {
  await open(page, './#sea');

  await expect.poll(() => onScreen(page, 'history-lens'), { timeout: 8000 }).toBe(true);
});

test('an old deep link still lands on the place that took it over', async ({ page }) => {
  await open(page, './#voice-receptionist');

  await expect.poll(() => onScreen(page, 'front-desk'), { timeout: 8000 }).toBe(true);
});

test('the skip link takes keyboard focus to the first place', async ({ page }) => {
  await open(page);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('button', { name: 'Go inside The Front Desk' })).toBeFocused();
});

test("a label says where you would step on hover, in the page's accent", async ({ page }) => {
  await open(page, './#lowl');
  const label = page.getByRole('button', { name: 'Go inside LOWL' });
  await expect(label).toHaveClass(/\bon\b/);

  await label.hover();

  await expect(label.locator('.lhint .b')).toHaveText('look in the workshop');
  await expect.poll(() => label.locator('.lhint .b').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await expect(label.locator('.lname')).toHaveCSS('color', 'rgb(154, 72, 38)');
});

test('a lantern lit in the night hangs on the string and is kept in this browser', async ({ page }) => {
  const problems = await watch(page);
  await open(page, './#contact');
  const button = page.getByRole('button', { name: 'Light a lantern' });
  await expect(page.locator('#lantern-tag')).toHaveClass(/\bon\b/, { timeout: 10_000 });

  await button.click();

  await expect(page.locator('.cut[data-kind="lanterns"] .lit')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kaisar.lanterns.v1') ?? '[]').length)).toBe(1);
  await page.reload();
  await expect(page.locator('.cut[data-kind="lanterns"] .lit')).toHaveCount(1, { timeout: 15_000 });
  expect(problems).toEqual([]);
});

test.describe('leave a note', () => {
  async function openNote(page: Page): Promise<void> {
    await open(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    /* the contact words soak in at the end of the walk: wait until they can be pressed */
    await expect(page.locator('#contact .words')).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await page.getByRole('button', { name: 'or leave a note' }).click();
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

for (const [width, height] of [
  [320, 640],
  [390, 844],
  [768, 1024],
  [1024, 768],
]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
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

test('on a phone each place stands in the lower part of the screen, with its label on screen to tap', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await open(page);

  for (const slug of SLUGS) {
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => onScreen(page, slug), { timeout: 8000 }).toBe(true);
    const label = page.getByRole('button', { name: `Go inside ${NAMES[slug]}` });
    await expect(label).toHaveClass(/\bon\b/);
    await page.waitForTimeout(1200);
    const b = await label.boundingBox();
    const art = await page.locator(`.cut[data-slug="${slug}"]`).boundingBox();
    expect(b, slug).not.toBeNull();
    expect(art, slug).not.toBeNull();
    if (!b || !art) continue;

    expect(b.x, slug).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width, slug).toBeLessThanOrEqual(PHONE.width + 0.5);
    expect(b.height, slug).toBeGreaterThanOrEqual(44);
    expect(b.y + b.height, slug).toBeLessThanOrEqual(PHONE.height - 60);
    expect(art.height / PHONE.height, slug).toBeGreaterThan(0.2);
  }
});

test('on a phone a place can be entered by tap and left with Back outside', async ({ page }) => {
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

  test('the page renders at once, places are painted, and a place opens without a transition', async ({ page }) => {
    const problems = await watch(page);
    await open(page);

    await page.locator('.horizon a[href="#sea"]').click();
    await expect.poll(() => onScreen(page, 'history-lens')).toBe(true);
    const inked = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.cut[data-slug="history-lens"] canvas');
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
      name: a.querySelector('h3')?.textContent ?? '',
      text: a.querySelector('.more')?.textContent ?? '',
      hiddenFromAT: !!a.querySelector('.more')?.closest('[hidden], [aria-hidden="true"]'),
      tabbableLinks: Array.from(a.querySelectorAll<HTMLAnchorElement>('.more a')).filter((l) => l.tabIndex >= 0).length,
      button: a.querySelector('.label')?.getAttribute('aria-label') ?? '',
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
