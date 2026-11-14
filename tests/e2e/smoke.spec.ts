import { expect, test, type Page } from '@playwright/test';

/** The board, top to bottom: world id, the place on its row, what stands there. */
const WORLDS = [
  ['hello', 'Summit', 'Kaisar Turysbek'],
  ['front-desk', 'Mountain pass', 'The Front Desk'],
  ['numbers-room', 'Observatory', 'AI Finance Bot Assistant'],
  ['lowl', 'Repair shop', 'LOWL'],
  ['emberquill', "Dragon's hall", 'Emberquill'],
  ['history-lens', 'Rome, 117 AD', 'History Lens'],
  ['bookforge', 'The open book', 'BookForge'],
  ['kana-notebook', 'Kyoto', 'Kana Notebook'],
  ['about', 'The road', 'About'],
  ['contact', 'Campfire', 'Write me'],
] as const;
const PHONE = { width: 390, height: 844 };
const SMALL_PHONE = { width: 320, height: 568 };
const LAPTOP = { width: 1366, height: 680 };

/**
 * Collect console errors (and, when asked, warnings about audio: a browser warns when sound starts without a
 * gesture) and uncaught exceptions, and refuse every request that is not to the local server.
 */
async function watch(page: Page, audioWarnings = false): Promise<string[]> {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || (audioWarnings && m.type() === 'warning' && /audio/i.test(m.text())))
      problems.push(m.text());
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

/**
 * Is a real GPU drawing? The living photo is WebGL; on a software renderer (a CI runner without a GPU) the page
 * rightly gives the motion up after a few seconds and shows stills, so the tests that watch it move need hardware.
 */
const hasGpu = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    if (!gl || !info) return false;
    return !/swiftshader|llvmpipe|software/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  });
const NEEDS_GPU = 'the living photo needs a GPU: on a software renderer the page shows stills';

/** The summit with the tag already there: a #link skips the opening shot. */
const BOARD = './#hello';

/** Open the page and wait until the first screen is standing: script started, typefaces in. */
async function open(page: Page, path = './'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/\bready\b/, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => r(null)))));
}

const current = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector('.world.on')?.id ?? null);

/** Wait until world `id` is the one on screen and its photo is decoded and in front. */
async function arrived(page: Page, id: string): Promise<void> {
  await expect(page.locator(`#${id}`)).toHaveClass(/\bon\b/);
  const i = WORLDS.findIndex((w) => w[0] === id);
  await expect(page.locator(`.frame[data-i="${i}"]`)).toHaveClass(/\bon\b.*\bld\b|\bld\b.*\bon\b/);
  await expect(page.locator('#cut > *')).toHaveCount(0);
}

/**
 * Do the on-screen world's words (every line and button of its block) sit wholly inside the photo area, with nothing
 * sliced by an edge or the phone's bar? `share` is how much of the screen's height they take.
 */
const blockFits = (page: Page): Promise<{ fits: boolean; share: number }> =>
  page.evaluate(() => {
    const block = document.querySelector<HTMLElement>('.world.on .block');
    const main = document.getElementById('main');
    if (!block || !main) return { fits: false, share: 1 };
    const m = main.getBoundingClientRect();
    const boxes = [block, ...Array.from(block.querySelectorAll<HTMLElement>('*'))]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('sr-only'))
      .map((el) => el.getBoundingClientRect());
    const top = Math.min(...boxes.map((r) => r.top));
    const bottom = Math.max(...boxes.map((r) => r.bottom));
    const left = Math.min(...boxes.map((r) => r.left));
    const right = Math.max(...boxes.map((r) => r.right));
    return {
      fits: top >= m.top && bottom <= m.bottom + 0.5 && left >= m.left && right <= m.right + 0.5,
      share: (bottom - top) / window.innerHeight,
    };
  });

/** A one-finger swipe, as touch events (the browser's own touch input has only taps). */
async function swipe(page: Page, fromY: number, toY: number): Promise<void> {
  await page.evaluate(
    ([y0, y1]) => {
      const target = document.elementFromPoint(195, y0) ?? document.body;
      const touch = (y: number): Touch => new Touch({ identifier: 1, target, clientX: 195, clientY: y });
      target.dispatchEvent(
        new TouchEvent('touchstart', { bubbles: true, touches: [touch(y0)], changedTouches: [touch(y0)] }),
      );
      target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch(y1)] }));
    },
    [fromY, toY],
  );
}

test('the page loads with no console errors and sends nothing off the machine', async ({ page }) => {
  const problems = await watch(page);

  await open(page);
  await arrived(page, 'hello');
  await page.waitForTimeout(600);

  await expect(page.getByRole('heading', { level: 1, name: "Hi, I'm Kaisar." })).toBeVisible();
  await expect(page.locator('.frame.on img')).toHaveAttribute('alt', /summit at sunrise/);
  expect(problems).toEqual([]);
});

test('the board lists all ten places with the project and a status word on every row', async ({ page }) => {
  await open(page, BOARD);

  const rows = page.locator('#rows .row');
  await expect(rows).toHaveCount(10);
  for (const [i, [id, place, title]] of WORLDS.entries()) {
    const row = rows.nth(i);
    await expect(row).toHaveAttribute('href', `#${id}`);
    await expect(row.locator('.pl')).toContainText(place);
    await expect(row.locator('.pj')).toHaveText(title);
    await expect(row.locator('.st')).not.toHaveText('');
  }
  await expect(page.locator('#rows .grp')).toHaveText(['Work', 'Play']);
  await expect(page.locator('#f-pos')).toHaveText('43.0°N 76.9°E');
  await expect(page.locator('#f-clk')).toHaveText(/^\d\d:\d\d:\d\d$/);
});

test('all ten places can be reached with the arrow keys, in order, and each is announced', async ({ page }) => {
  const problems = await watch(page);
  await open(page);

  for (const [i, [id, place, title]] of WORLDS.entries()) {
    if (i > 0) await page.keyboard.press('ArrowDown');
    await arrived(page, id);
    await expect(page.locator(`#rows .row[data-i="${i}"]`)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#rows .row[aria-current]')).toHaveCount(1);
    if (i > 0) await expect(page.locator('#where')).toHaveText(`${place}. ${title}.`);
    expect(new URL(page.url()).hash).toBe(i === 0 ? '' : `#${id}`);
    /* never more than three photographs in the page */
    expect(await page.locator('#lens .frame').count()).toBeLessThanOrEqual(3);
    expect((await blockFits(page)).fits, id).toBe(true);
  }
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(400);
  expect(await current(page)).toBe('contact');

  await page.keyboard.press('Home');
  await arrived(page, 'hello');
  await page.keyboard.press('End');
  await arrived(page, 'contact');
  expect(problems).toEqual([]);
});

test('the words of the next place are readable soon after the key', async ({ page }) => {
  await open(page);
  await arrived(page, 'hello');
  /* let the neighbours decode, as they do while someone reads the first screen */
  await page.waitForTimeout(800);

  const ms = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const t0 = performance.now();
        const seen = new MutationObserver(() => {
          if (!document.getElementById('front-desk')?.classList.contains('on')) return;
          seen.disconnect();
          requestAnimationFrame(() => resolve(performance.now() - t0));
        });
        seen.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }),
  );

  /* about 300 ms on its own (the cut is 300 ms); the slack is for a machine running every test at once */
  expect(ms).toBeLessThan(1000);
  await expect(page.getByRole('heading', { name: 'The Front Desk' })).toBeVisible();
});

test('keys pressed quickly queue up and land on the last place asked for', async ({ page }) => {
  await open(page);

  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');

  await arrived(page, 'emberquill');
});

test('one turn of the wheel is one step', async ({ page }) => {
  await open(page);
  await page.mouse.move(800, 450);

  /* a trackpad fling: a burst of wheel events, all within one gesture */
  await page.evaluate(() => {
    const under = document.elementFromPoint(800, 450) ?? document.body;
    for (let i = 0; i < 12; i++) under.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true }));
  });
  await arrived(page, 'front-desk');
  await page.waitForTimeout(400);

  expect(await current(page)).toBe('front-desk');
});

test('a #kana-notebook deep link lands on Kyoto', async ({ page }) => {
  await open(page, './#kana-notebook');

  await arrived(page, 'kana-notebook');
  await expect(page.locator('#rows .row[aria-current]')).toContainText('Kyoto');
  await expect(page.getByRole('heading', { name: 'Kana Notebook' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeHidden();
  await expect(page.locator('#f-tz')).toHaveText(' Kyoto');
});

test('#about and #contact are places too, and an old link lands on the place that took it over', async ({ page }) => {
  await open(page, './#about');
  await arrived(page, 'about');

  await page.goto('./#contact');
  await arrived(page, 'contact');
  await expect(page.getByRole('link', { name: 'write me', exact: true })).toHaveAttribute(
    'href',
    'mailto:kaisar.turysbek@gmail.com',
  );

  await page.goto('./#crm');
  await arrived(page, 'front-desk');
});

test('the skip link takes keyboard focus to the first place', async ({ page }) => {
  await open(page);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');

  await arrived(page, 'front-desk');
  await expect(page.locator('#front-desk-t')).toBeFocused();
});

test('the board is one Tab stop: Enter on a row goes there and takes focus to its name', async ({ page }) => {
  await open(page, BOARD);
  const rows = page.locator('#rows .row');

  await page.locator('#bar').click();
  await expect(rows.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await arrived(page, 'numbers-room');
  await expect(rows.nth(2)).toBeFocused();
  expect(await page.locator('#rows .row[tabindex="0"]').count()).toBe(1);

  await rows.nth(6).click();
  await arrived(page, 'bookforge');
  await expect(page.locator('#bookforge-t')).toBeFocused();
  await expect(page.locator('#board')).not.toBeInViewport();
});

test.describe('the board drawer', () => {
  test('closed by default: the painting fills the window and the tag in the corner says where you are', async ({
    page,
  }) => {
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');

    await expect(page.locator('#board')).not.toBeInViewport();
    expect(await page.locator('#stage').boundingBox()).toMatchObject({ x: 0, y: 0, width: 1440, height: 900 });
    expect(await page.locator('#main').boundingBox()).toMatchObject({ x: 0, width: 1440 });
    const tag = page.locator('#bar');
    await expect(tag).toBeInViewport();
    await expect(tag).toHaveAttribute('aria-expanded', 'false');
    await expect(tag).toHaveAttribute('aria-controls', 'board');
    await expect(tag).toHaveAccessibleName('Places. Now at 07 Kyoto, Kana Notebook');
    await expect(tag).toContainText('07/09');
    await expect(tag).toContainText('Kyoto');
    await expect(tag).toContainText('LIVE');
    /* only the kicker, the name, the line and the buttons stand on the painting */
    await expect(page.locator('#kana-notebook .more')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Read about Kana Notebook' })).toBeVisible();
  });

  test('the tag opens it from the left with focus on the current row; Esc closes it and focus returns', async ({
    page,
  }) => {
    await open(page, './#emberquill');
    await arrived(page, 'emberquill');
    const tag = page.locator('#bar');
    const board = page.locator('#board');

    await tag.focus();
    await page.keyboard.press('Enter');

    await expect(tag).toHaveAttribute('aria-expanded', 'true');
    await expect(board).toBeInViewport();
    await expect(page.locator('#veil')).toBeVisible();
    await expect(page.locator('#rows .row[data-i="4"]')).toBeFocused();
    await expect.poll(async () => (await board.boundingBox())?.x).toBe(0);
    /* the footer with the coordinates and the clock is inside the drawer */
    await expect(page.locator('#f-pos')).toBeInViewport();
    /* behind the drawer nothing can be reached */
    expect(await page.evaluate(() => document.getElementById('main')?.inert)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(tag).toHaveAttribute('aria-expanded', 'false');
    await expect(board).not.toBeInViewport();
    await expect(page.locator('#veil')).toBeHidden();
    await expect(tag).toBeFocused();
    expect(await page.evaluate(() => document.getElementById('board')?.inert)).toBe(true);
  });

  test('a press outside closes it; choosing a row closes it and cuts to that place', async ({ page }) => {
    await open(page, BOARD);
    const tag = page.locator('#bar');

    await tag.click();
    await expect(page.locator('#board')).toBeInViewport();
    await page.mouse.click(1000, 450);
    await expect(page.locator('#board')).not.toBeInViewport();
    await expect(tag).toHaveAttribute('aria-expanded', 'false');
    expect(await current(page)).toBe('hello');

    await tag.click();
    await page.locator('#rows .row[data-i="7"]').click();
    await arrived(page, 'kana-notebook');
    await expect(page.locator('#board')).not.toBeInViewport();
    await expect(page.locator('#kana-notebook-t')).toBeFocused();
    await expect(page.locator('#where')).toHaveText('Kyoto. Kana Notebook.');
    await expect(tag).toContainText('Kyoto');
  });

  test('closed, the wheel and the keys still travel, and the tag follows', async ({ page }) => {
    await open(page, BOARD);
    await page.mouse.move(800, 450);

    await page.mouse.wheel(0, 120);
    await arrived(page, 'front-desk');
    await page.keyboard.press('ArrowDown');
    await arrived(page, 'numbers-room');

    await expect(page.locator('#bar')).toContainText('02/09');
    await expect(page.locator('#bar')).toContainText('Observatory');
    await expect(page.locator('#board')).not.toBeInViewport();
  });
});

test('every interactive thing on screen is at least 44 px tall', async ({ page }) => {
  await open(page, './#kana-notebook');
  await arrived(page, 'kana-notebook');

  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.row, .world.on a, .world.on button, .mark, .bar, .sw'))
      .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height < 44)
      .map((el) => el.className),
  );

  expect(small).toEqual([]);
});

test.describe('the video', () => {
  async function openVideo(page: Page): Promise<void> {
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');
    await page.getByRole('button', { name: /^Watch/ }).click();
    await expect(page.locator('#player')).toBeVisible();
  }

  test('"Watch" says how long the video runs', async ({ page }) => {
    await open(page, './#kana-notebook');

    await expect(page.locator('#kana-notebook .watch')).toHaveText('Watch the Kana Notebook video, 0:44');
    await expect(page.locator('#numbers-room .watch .len')).toHaveText('1:08');
    await expect(page.locator('#lowl .watch')).toHaveCount(0);
  });

  test('it opens over the photo as a modal, says it is loading, then shows the video or says it failed', async ({
    page,
  }) => {
    const problems = await watch(page);
    await openVideo(page);

    const wrap = page.locator('#pwrap');
    await expect(wrap).toHaveAttribute('data-state', /^(loading|ready|failed)$/);
    await expect(wrap).toHaveAttribute('data-state', /^(ready|failed)$/, { timeout: 15_000 });
    if ((await wrap.getAttribute('data-state')) === 'ready') {
      await expect(page.locator('#player video')).toBeVisible();
      const box = await page.locator('#player video').boundingBox();
      /* the player is the photo area, not a small box */
      expect(box?.width).toBeGreaterThan(1000);
      expect(box?.height).toBeGreaterThan(600);
    } else await expect(page.locator('#pstate')).toHaveText("the video didn't load");
    await expect(page.locator('#p-title')).toHaveText('Kana Notebook');
    await expect(page.locator('#pclose')).toBeFocused();
    /* the place stops moving while the photo is covered */
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'off');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
    expect(problems.filter((p) => !/video|media|ERR_/i.test(p))).toEqual([]);
  });

  test('Tab stays inside the player, and Esc closes it from anywhere, giving focus back to the spot', async ({
    page,
  }) => {
    await openVideo(page);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('#player'))).toBe(true);
    }
    /* deep in the video's own controls */
    await page.locator('#player video').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');

    await expect(page.locator('#player')).toBeHidden();
    await expect(page.locator('#kana-notebook .spot[data-video]')).toBeFocused();
    await expect(page.locator('#player video')).toHaveCount(0);
  });

  test('the Close button and a press beside the video both close it', async ({ page }) => {
    await openVideo(page);
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#player')).toBeHidden();

    await page.getByRole('button', { name: /^Watch/ }).click();
    await expect(page.locator('#player')).toBeVisible();
    /* the letterbox under the top bar, above the 16:9 picture */
    await expect(page.locator('#pwrap')).toHaveAttribute('data-state', /^(ready|failed)$/, { timeout: 15_000 });
    const wrap = await page.locator('#pwrap').boundingBox();
    const video = await page.locator('#player video').boundingBox();
    if (!wrap || !video) throw new Error('the player has no frame to press beside');
    await page.mouse.click(wrap.x + 40, (wrap.y + video.y) / 2);
    await expect(page.locator('#player')).toBeHidden();
    await expect(page.locator('#kana-notebook .spot[data-video]')).toBeFocused();
  });

  test('the arrow keys do not travel while the video is open', async ({ page }) => {
    await openVideo(page);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);

    expect(await current(page)).toBe('kana-notebook');
  });
});

/**
 * Where the on-screen world's shown spots and the things they must not stand on are, and which of the buttons in
 * the words that open the same things (Watch, Try it) are showing.
 */
const spotPlace = (
  page: Page,
): Promise<{ spots: { opens: string; r: DOMRect }[]; others: Record<string, DOMRect>; buttons: string[] }> =>
  page.evaluate(() => {
    const world = document.querySelector<HTMLElement>('.world.on');
    const visible = (el: Element | null | undefined): boolean => !!el && (el as HTMLElement).offsetParent !== null;
    const box = (sel: string): DOMRect => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`nothing at ${sel}`);
      return el.getBoundingClientRect();
    };
    const spots = Array.from(world?.querySelectorAll<HTMLElement>('.spot') ?? [])
      .filter((s) => !s.hidden)
      .map((s) => ({ opens: s.dataset.video === undefined ? 'try' : 'video', r: s.getBoundingClientRect() }));
    return {
      spots,
      others: {
        words: box('.world.on .block'),
        switches: box('#switches'),
        mark: box('.brand .mark'),
        tag: box('#bar'),
      },
      buttons: [
        ...(visible(world?.querySelector('.acts .watch')) ? ['video'] : []),
        ...(visible(world?.querySelector('.acts .try')) ? ['try'] : []),
      ],
    };
  });
const apart = (a: DOMRect, b: DOMRect): boolean =>
  a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
const PROJECT_IDS = WORLDS.slice(1, 8).map((w) => w[0]);
/** what each project's world can open: its try, and its video where it has one */
const OPENS: Record<string, string[]> = Object.fromEntries(
  PROJECT_IDS.map((id) => [
    id,
    id === 'emberquill' ? ['video'] : ['numbers-room', 'kana-notebook'].includes(id) ? ['try', 'video'] : ['try'],
  ]),
);

test.describe('the spot in the painting', () => {
  test('Kyoto: a dot on the lantern opens the video, and is the one way in (no Watch button beside it)', async ({
    page,
  }) => {
    const problems = await watch(page);
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');
    const spot = page.locator('#kana-notebook .spot[data-video]');

    await expect(spot).toBeVisible();
    await expect(spot).toHaveAccessibleName('Watch the Kana Notebook video, 0:44');
    await expect(page.locator('#kana-notebook .watch')).toBeHidden();
    /* on the lantern: the landscape painting is 1440x960 here, 30 px cut off at the top */
    const dot = await spot.locator('.spot-dot').boundingBox();
    expect(dot).not.toBeNull();
    if (dot) {
      expect(Math.abs(dot.x + dot.width / 2 - 1260)).toBeLessThan(12);
      expect(Math.abs(dot.y + dot.height / 2 - (0.42 * 960 - 30))).toBeLessThan(12);
    }

    await spot.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#player')).toBeVisible();
    await expect(page.locator('#p-title')).toHaveText('Kana Notebook');
    await page.keyboard.press('Escape');
    await expect(page.locator('#player')).toBeHidden();
    await expect(spot).toBeFocused();
    expect(problems.filter((p) => !/video|media|ERR_/i.test(p))).toEqual([]);
  });

  test("Emberquill: its painting is a toy, so the Watch button in the words opens the real app's video", async ({
    page,
  }) => {
    await open(page, './#emberquill');
    await arrived(page, 'emberquill');

    await expect(page.locator('#emberquill .spot')).toHaveCount(0);
    await page.locator('#emberquill .acts .watch').click();

    await expect(page.locator('#player')).toBeVisible();
    await expect(page.locator('#p-title')).toHaveText('Emberquill');
    await expect(page.locator('#pwrap')).toHaveAttribute('data-state', /^(ready|failed)$/, { timeout: 15_000 });
  });

  test('the ring stands still with the motion switched off', async ({ page }) => {
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');
    const ring = (): Promise<string> =>
      page.evaluate(() => {
        const dot = document.querySelector('#kana-notebook .spot[data-video] .spot-dot');
        return dot ? getComputedStyle(dot, '::after').animationName : 'missing';
      });

    expect(await ring()).toBe('spot-breathe');
    await page.locator('#sw-motion').click();
    expect(await ring()).toBe('none');
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 1366, height: 680 }, PHONE, SMALL_PHONE]) {
    test(`at ${size.width}x${size.height} no spot stands on the words, the switches, the tag or another spot`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      for (const id of PROJECT_IDS) {
        await page.goto('about:blank');
        await open(page, `./#${id}`);
        await arrived(page, id);
        const placed = await spotPlace(page);
        /* every way in exactly once: a spot in the painting, or the button in the words where it cannot stand */
        const ways = [...placed.spots.map((s) => s.opens), ...placed.buttons].sort();
        expect(ways, `${id}: each thing it opens has exactly one way in`).toEqual([...OPENS[id]].sort());
        placed.spots.forEach(({ opens, r }, k) => {
          for (const [name, o] of Object.entries(placed.others))
            expect(apart(r, o), `${id}: the ${opens} spot stands on the ${name}`).toBe(true);
          for (const other of placed.spots.slice(k + 1))
            expect(apart(r, other.r), `${id}: the two spots crowd each other`).toBe(true);
          expect(r.left).toBeGreaterThanOrEqual(0);
          expect(r.right).toBeLessThanOrEqual(size.width);
          expect(r.bottom).toBeLessThanOrEqual(size.height);
        });
      }
    });
  }
});

test.describe('the opening shot', () => {
  test('the summit fills the window: no board or tag, only the name, the greeting, a hint and the switches', async ({
    page,
  }) => {
    const problems = await watch(page);
    await open(page);
    await arrived(page, 'hello');

    await expect(page.locator('html')).toHaveClass(/\bopening\b/);
    await expect(page.locator('#board')).not.toBeInViewport();
    await expect(page.locator('#bar')).toHaveCSS('opacity', '0');
    expect(await page.locator('#stage').boundingBox()).toMatchObject({ x: 0, width: 1440, height: 900 });
    await expect(page.locator('.mark')).toBeInViewport();
    await expect(page.getByRole('heading', { level: 1, name: "Hi, I'm Kaisar." })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Scroll to depart' })).toBeInViewport();
    await expect(page.getByRole('group', { name: 'Motion and sound' })).toBeInViewport();
    /* the greeting stands low in the frame */
    const name = await page.locator('#hello-t').boundingBox();
    expect(name?.y).toBeGreaterThan(450);
    /* the snow is already blowing off the top; the painting itself stays still, so its canvas draws nothing */
    if (await hasGpu(page)) {
      await expect(page.locator('#fx')).toHaveAttribute('data-live', 'on');
      await expect(page.locator('#live')).toHaveAttribute('data-live', 'off');
    }
    expect(problems).toEqual([]);
  });

  test('the tag arrives with the first step, the stage keeps its shape, and the tag stays on the summit', async ({
    page,
  }) => {
    await open(page);

    await page.keyboard.press('ArrowDown');
    await arrived(page, 'front-desk');

    await expect(page.locator('html')).not.toHaveClass(/\bopening\b/);
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
    await expect(page.locator('#bar')).toContainText('Mountain pass');
    await expect(page.locator('#board')).not.toBeInViewport();
    expect(await page.locator('#stage').boundingBox()).toMatchObject({ x: 0, width: 1440 });
    await expect(page.locator('#rows .row[aria-current]')).toContainText('Mountain pass');

    await page.keyboard.press('ArrowUp');
    await arrived(page, 'hello');
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
    expect((await page.locator('#stage').boundingBox())?.x).toBe(0);
    expect((await blockFits(page)).fits).toBe(true);
  });

  test('the hint is a button: pressing it departs, and focus lands on the first place', async ({ page }) => {
    await open(page);

    await page.getByRole('button', { name: 'Scroll to depart' }).click();

    await arrived(page, 'front-desk');
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
    await expect(page.locator('#front-desk-t')).toBeFocused();
  });

  test('the wheel departs too', async ({ page }) => {
    await open(page);
    await page.mouse.move(700, 400);

    await page.mouse.wheel(0, 120);

    await arrived(page, 'front-desk');
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
  });

  test('Tab reaches the tag at once: focus reaching it is a first step, and Enter opens the board', async ({
    page,
  }) => {
    await open(page);

    /* the skip link, the name, then the tag */
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await arrived(page, 'front-desk');
    await expect(page.locator('#bar')).toBeFocused();
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    await expect(page.locator('#board')).toBeInViewport();
    await expect(page.locator('#rows .row[data-i="1"]')).toBeFocused();
  });

  test('a #link skips the opening: the tag is there from the start', async ({ page }) => {
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');

    await expect(page.locator('html')).not.toHaveClass(/\bopening\b/);
    await expect(page.locator('#bar')).toHaveCSS('opacity', '1');
    expect((await page.locator('#stage').boundingBox())?.x).toBe(0);
  });
});

test.describe('the places move', () => {
  test('Kyoto has lanterns, wet stones and petals; the road has only seeds in the air; the pass only its light', async ({
    page,
  }) => {
    await open(page, './#kana-notebook');
    test.skip(!(await hasGpu(page)), NEEDS_GPU);
    await arrived(page, 'kana-notebook');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'on');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'on');

    await page.keyboard.press('ArrowDown');
    await arrived(page, 'about');
    /* nothing moves inside the road's painting, so its canvas is not drawn at all */
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'off');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'on');

    await page.goto('./#front-desk');
    await arrived(page, 'front-desk');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'on');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
  });

  test('the living canvas lines up with the painting: where nothing moves it is transparent', async ({ page }) => {
    await open(page, './#kana-notebook');
    test.skip(!(await hasGpu(page)), NEEDS_GPU);
    await arrived(page, 'kana-notebook');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'on');
    await page.waitForTimeout(400);

    /* the dusk sky (top left) is still, the wet street (bottom middle) shimmers: read the canvas's own pixels */
    const alpha = await page.evaluate(() => {
      const live = document.querySelector<HTMLCanvasElement>('#live');
      const copy = document.createElement('canvas');
      if (!live) return null;
      copy.width = live.width;
      copy.height = live.height;
      const g = copy.getContext('2d');
      if (!g) return null;
      return new Promise<{ sky: number; street: number }>((resolve) =>
        requestAnimationFrame(() => {
          /* straight after a frame the canvas still holds what it drew */
          g.drawImage(live, 0, 0);
          const at = (x: number, y: number): number =>
            g.getImageData(Math.round(x * copy.width), Math.round(y * copy.height), 1, 1).data[3];
          resolve({ sky: at(0.1, 0.1), street: at(0.645, 0.95) });
        }),
      );
    });

    expect(alpha?.sky).toBe(0);
    expect(alpha?.street).toBe(255);
  });
});

test.describe('the corner switches', () => {
  /** count the living canvas's draw calls and the audio contexts made, from before the page's own code runs */
  async function instrument(page: Page): Promise<void> {
    await page.addInitScript(() => {
      const w = window as unknown as { drawn: number; contexts: AudioContext[] };
      w.drawn = 0;
      w.contexts = [];
      const draw = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function (...args) {
        w.drawn++;
        return draw.apply(this, args);
      };
      const Real = window.AudioContext;
      window.AudioContext = class extends Real {
        constructor(options?: AudioContextOptions) {
          super(options);
          w.contexts.push(this);
        }
      };
    });
  }
  const drawn = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { drawn: number }).drawn);
  const contexts = (page: Page): Promise<string[]> =>
    page.evaluate(() => (window as unknown as { contexts: AudioContext[] }).contexts.map((c) => c.state));
  const motion = (page: Page) => page.getByRole('button', { name: 'Motion', exact: true });
  const sound = (page: Page) => page.getByRole('button', { name: 'Sound', exact: true });

  test('motion is on by default; switched off, nothing is drawn, and the choice is remembered', async ({ page }) => {
    const problems = await watch(page);
    await instrument(page);
    await open(page, './#kana-notebook');
    test.skip(!(await hasGpu(page)), NEEDS_GPU);
    await arrived(page, 'kana-notebook');
    await expect(motion(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'on');
    const before = await drawn(page);
    await page.waitForTimeout(300);
    expect(await drawn(page)).toBeGreaterThan(before);

    await motion(page).click();

    await expect(motion(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'off');
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'off');
    await expect(page.locator('#live')).toBeHidden();
    await expect(page.locator('#fx')).toBeHidden();
    const stopped = await drawn(page);
    await page.waitForTimeout(400);
    expect(await drawn(page)).toBe(stopped);
    /* travelling does not start it again */
    await page.keyboard.press('ArrowDown');
    await arrived(page, 'about');
    await page.waitForTimeout(300);
    expect(await drawn(page)).toBe(stopped);

    await page.reload();
    await arrived(page, 'about');
    await expect(motion(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'off');

    await motion(page).click();
    await expect(motion(page)).toHaveAttribute('aria-pressed', 'true');
    /* the road's painting is still: switched back on, only its air moves */
    await expect(page.locator('#fx')).toHaveAttribute('data-live', 'on');
    await page.keyboard.press('ArrowUp');
    await arrived(page, 'kana-notebook');
    await expect(page.locator('#live')).toHaveAttribute('data-live', 'on');
    expect(problems).toEqual([]);
  });

  test('sound is off by default and no audio context exists until the switch is pressed', async ({ page }) => {
    const problems = await watch(page, true);
    await instrument(page);
    await open(page);
    await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('ArrowDown');
    await arrived(page, 'front-desk');
    expect(await contexts(page)).toEqual([]);

    await sound(page).click();

    await expect(sound(page)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => contexts(page)).toEqual(['running']);
    expect(await page.evaluate(() => localStorage.getItem('kaisar.sound.v1'))).toBe('on');
    /* another place: the same context, crossfaded */
    await page.keyboard.press('ArrowDown');
    await arrived(page, 'numbers-room');
    expect(await contexts(page)).toEqual(['running']);

    await sound(page).click();
    await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => contexts(page)).toEqual(['suspended']);
    expect(problems).toEqual([]);
  });

  test('sound left on is remembered, but waits for a key or a press before it starts', async ({ page }) => {
    const problems = await watch(page, true);
    await instrument(page);
    await page.addInitScript(() => localStorage.setItem('kaisar.sound.v1', 'on'));
    await open(page);

    await expect(sound(page)).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(300);
    expect(await contexts(page)).toEqual([]);

    await page.keyboard.press('ArrowDown');

    await expect.poll(() => contexts(page)).toEqual(['running']);
    await arrived(page, 'front-desk');
    expect(problems).toEqual([]);
  });

  test('the switches are real toggle buttons, reachable by keyboard, with a visible focus ring', async ({ page }) => {
    await open(page, BOARD);

    await motion(page).focus();
    await page.keyboard.press('Space');
    await expect(motion(page)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(sound(page)).toBeFocused();
    const ring = await sound(page).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).toBe('solid');
    for (const sw of [motion(page), sound(page)]) {
      const box = await sw.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('lanterns', () => {
  test('one lit by the campfire rises into the sky, is counted, and is kept in this browser', async ({ page }) => {
    const problems = await watch(page);
    await open(page, './#contact');
    await arrived(page, 'contact');
    await expect(page.locator('#lanterns .lit')).toHaveCount(0);

    await page.getByRole('button', { name: 'Light a lantern' }).click();

    await expect(page.locator('#lanterns .lit')).toHaveCount(1);
    await expect(page.locator('#lantern-n')).toHaveText('1 lantern lit.');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kaisar.lanterns.v1') ?? '[]'));
    expect(stored).toHaveLength(1);

    await page.reload();
    await arrived(page, 'contact');
    await expect(page.locator('#lanterns .lit')).toHaveCount(1);
    await expect(page.locator('#lantern-n')).toHaveText('1 lantern lit.');

    /* lanterns belong to the campfire: none are drawn anywhere else */
    await page.keyboard.press('ArrowUp');
    await arrived(page, 'about');
    await expect(page.locator('#lanterns')).toBeHidden();
    expect(problems).toEqual([]);
  });
});

test.describe('leave a note', () => {
  async function openNote(page: Page): Promise<void> {
    await open(page, './#contact');
    await arrived(page, 'contact');
    await page.getByRole('button', { name: 'or leave a note' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#note-text')).toBeFocused();
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

    await expect(page.locator('#note-msg')).toContainText('too long');
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

  test('Esc closes the note and gives focus back, and typing in it does not travel', async ({ page }) => {
    await openNote(page);

    await page.locator('#note-text').pressSequentially('jk');
    await page.keyboard.press('ArrowUp');
    expect(await current(page)).toBe('contact');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'or leave a note' })).toBeFocused();
  });
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
]) {
  test(`no horizontal overflow at ${width}px, in any place`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);

    for (const [i, [id]] of WORLDS.entries()) {
      if (i > 0) await page.keyboard.press('ArrowDown');
      await arrived(page, id);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, id).toBeLessThanOrEqual(0);
    }
  });
}

test.describe('on a laptop with a short window', () => {
  test.use({ viewport: LAPTOP });

  test('every place fits: only the name, the line and the buttons stand on the painting', async ({ page }) => {
    await open(page);

    for (const [i, [id]] of WORLDS.entries()) {
      if (i > 0) await page.keyboard.press('ArrowDown');
      await arrived(page, id);
      const fit = await blockFits(page);
      expect(fit.fits, id).toBe(true);
    }
  });

  test('the longer text waits behind Read: a sheet, and Esc gives focus back', async ({ page }) => {
    await open(page, './#history-lens');
    await arrived(page, 'history-lens');
    const read = page.getByRole('button', { name: 'Read about History Lens' });
    await expect(read).toBeVisible();

    await read.click();

    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'History Lens' })).toBeFocused();
    await expect(sheet).toContainText('you are John Snow, tracing cholera through Soho in 1854');
    await expect(sheet).toContainText('five stories so far.');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(read).toBeFocused();
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test('the photo is the whole screen and the words take at most 42% of it, in every place', async ({ page }) => {
    await open(page);
    await expect(page.locator('#board')).toBeHidden();

    for (const [i, [id]] of WORLDS.entries()) {
      if (i > 0) await swipe(page, 600, 300);
      await arrived(page, id);
      const fit = await blockFits(page);
      expect(fit.fits, id).toBe(true);
      expect(fit.share, id).toBeLessThanOrEqual(0.42);
      /* the upright crop of the photo is the one on screen */
      expect(await page.locator('.frame.on img').evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(
        /-m\.webp$/,
      );
    }
    await swipe(page, 300, 600);
    await arrived(page, 'about');
  });

  test('the opening shot: the photo to the very bottom; the bar rises with the first swipe', async ({ page }) => {
    await open(page);
    await arrived(page, 'hello');
    await expect(page.locator('#bar')).not.toBeInViewport();
    await expect(page.getByRole('button', { name: 'Scroll to depart' })).toBeInViewport();
    await expect(page.getByRole('group', { name: 'Motion and sound' })).toBeInViewport();

    await swipe(page, 600, 300);

    await arrived(page, 'front-desk');
    await expect(page.locator('#bar')).toBeInViewport();
    await expect(page.locator('#bar')).toContainText('Mountain pass');
    /* the switches keep clear of the name mark and of the words */
    const sw = await page.locator('#switches').boundingBox();
    const mark = await page.locator('.mark').boundingBox();
    expect(sw && mark && sw.x).toBeGreaterThan((mark?.x ?? 0) + (mark?.width ?? 0));
  });

  test('the bar says where you are and raises the index; a row travels and lowers it', async ({ page }) => {
    await open(page, BOARD);
    const bar = page.locator('#bar');
    await expect(bar).toContainText('Summit');

    await bar.tap();
    await expect(bar).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#board')).toBeVisible();
    await expect(page.locator('#rows .row')).toHaveCount(10);
    await expect(page.locator('#rows .row').nth(7)).toContainText('Kana Notebook');

    await page.locator('#rows .row').nth(7).tap();

    await arrived(page, 'kana-notebook');
    await expect(bar).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#board')).toBeHidden();
    await expect(bar).toContainText('Kyoto');
    await expect(bar).toContainText('Kana Notebook');
    await expect(bar).toContainText('LIVE');
  });

  test('the raised index closes with Esc, a tap outside, or a swipe down', async ({ page }) => {
    await open(page, BOARD);
    const bar = page.locator('#bar');
    const board = page.locator('#board');

    await bar.tap();
    await expect(board).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(board).toBeHidden();
    await expect(bar).toBeFocused();

    await bar.tap();
    await expect(board).toBeVisible();
    await page.locator('#veil').tap({ position: { x: 195, y: 30 } });
    await expect(board).toBeHidden();

    await bar.tap();
    await expect(page.locator('#rows .row').first()).toBeInViewport();
    /* the sheet is raised in four steps: wait until it stands */
    await page.waitForTimeout(250);
    await swipe(page, 500, 700);
    await expect(board).toBeHidden();
    expect(await current(page)).toBe('hello');
  });

  test('Read opens the longer text as a sheet over the photo, closed with its button', async ({ page }) => {
    await open(page, './#history-lens');
    await arrived(page, 'history-lens');
    await expect(page.locator('#history-lens .more')).toBeHidden();

    await page.getByRole('button', { name: 'Read about History Lens' }).tap();

    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('you are John Snow, tracing cholera through Soho in 1854');
    await expect(sheet).toContainText('five stories so far.');
    await sheet.getByRole('button', { name: 'Close' }).tap();
    await expect(sheet).toBeHidden();
  });

  test('a place with no longer text offers no Read (it would open an empty sheet), but keeps its video', async ({
    page,
  }) => {
    await open(page, './#numbers-room');
    await arrived(page, 'numbers-room');

    await expect(page.locator('#numbers-room [data-read]')).toHaveCount(0);
    await expect(page.locator('#front-desk [data-read]')).toHaveCount(0);
    await expect(page.locator('#numbers-room .watch')).toBeVisible();
  });

  test('the video fills the screen and Close returns', async ({ page }) => {
    await open(page, './#kana-notebook');
    await arrived(page, 'kana-notebook');

    await page.getByRole('button', { name: /^Watch/ }).tap();

    const player = page.locator('#player');
    await expect(player).toBeVisible();
    const box = await player.boundingBox();
    expect(box?.width).toBe(PHONE.width);
    await player.getByRole('button', { name: 'Close' }).tap();
    await expect(player).toBeHidden();
  });
});

test.describe('on a small phone', () => {
  test.use({ viewport: SMALL_PHONE, hasTouch: true, isMobile: true });

  test('nothing is sliced in any place, and the longest text fits its sheet without scrolling', async ({ page }) => {
    await open(page);

    for (const [i, [id]] of WORLDS.entries()) {
      if (i > 0) await swipe(page, 400, 150);
      await arrived(page, id);
      const fit = await blockFits(page);
      expect(fit.fits, id).toBe(true);
    }

    await page.goto('./#history-lens');
    await arrived(page, 'history-lens');
    await page.getByRole('button', { name: 'Read about History Lens' }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    const body = page.locator('#read .sheet-body');
    expect(await body.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('cuts are instant, nothing is drawn on either canvas, and every place is still reachable', async ({ page }) => {
    const problems = await watch(page);
    await open(page);
    let slats = 0;
    await page.exposeFunction('sawSlats', () => {
      slats++;
    });
    await page.evaluate(() => {
      const cut = document.getElementById('cut');
      if (cut)
        new MutationObserver(() => (window as unknown as { sawSlats: () => void }).sawSlats()).observe(cut, {
          childList: true,
        });
    });

    for (const [i, [id]] of WORLDS.entries()) {
      if (i > 0) await page.keyboard.press('ArrowDown');
      await arrived(page, id);
    }

    expect(slats).toBe(0);
    /* motion starts switched off for someone who asks for less of it: stills only */
    await expect(page.getByRole('button', { name: 'Motion', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#live')).toBeHidden();
    await expect(page.locator('#fx')).toBeHidden();
    await expect(page.locator('#live')).not.toHaveAttribute('data-live', 'on');
    await expect(page.locator('#fx')).not.toHaveAttribute('data-live', 'on');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    expect(problems).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page is a plain stacked document: every project, its text and its link are readable', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('section.world')).toHaveCount(10);
    await expect(page.getByRole('heading', { level: 1, name: "Hi, I'm Kaisar." })).toBeVisible();
    for (const [, , title] of WORLDS.slice(1, 8))
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('You can throw the furniture.')).toBeVisible();
    await expect(page.getByRole('link', { name: "It's live. Go break something." })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Telegram @kekaisik' })).toBeVisible();
    await expect(page.getByText('Catan beat my AI in one day.')).toBeVisible();
    /* the board is a list of links to the places below */
    await expect(page.locator('#rows a[href="#kana-notebook"]')).toBeVisible();
    /* it scrolls like any document, and not sideways */
    const size = await page.evaluate(() => ({
      tall: document.documentElement.scrollHeight > window.innerHeight * 2,
      wide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(size.tall).toBe(true);
    expect(size.wide).toBeLessThanOrEqual(0);
  });
});
