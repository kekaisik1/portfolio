import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECT_PLACES, WORLDS, indexOfWorld, rowNumber } from '../../src/content/places';
import { PROJECTS, projectBySlug } from '../../src/content/projects';
import {
  clock,
  esc,
  fillShell,
  renderFirstFrame,
  renderProject,
  renderRows,
  renderWorlds,
} from '../../src/content/render';
import { MESSAGES, SITE } from '../../src/content/site';

describe('project content', () => {
  it('has exactly seven projects', () => {
    expect(PROJECTS).toHaveLength(7);
  });

  it('gives every project a unique, URL-safe slug', () => {
    const slugs = PROJECTS.map((p) => p.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]{1,40}$/);
  });

  it('has three work projects and four play projects', () => {
    const count = (group: string): number => PROJECTS.filter((p) => p.group === group).length;

    expect(count('work')).toBe(3);
    expect(count('play')).toBe(4);
  });

  it('gives every project a name, a one-liner and inside text', () => {
    for (const p of PROJECTS) {
      expect(p.name.trim(), p.slug).not.toBe('');
      expect(p.line.trim(), p.slug).not.toBe('');
      expect(p.inside.length, p.slug).toBeGreaterThan(0);
      for (const paragraph of p.inside) expect(paragraph.trim(), p.slug).not.toBe('');
    }
  });

  it('keeps every one-liner to 60 characters or fewer', () => {
    for (const p of PROJECTS) expect(p.line.length, `${p.slug}: "${p.line}"`).toBeLessThanOrEqual(60);
  });

  it('keeps the slugs the backend growth numbers and old deep links are keyed by', () => {
    for (const slug of ['lowl', 'emberquill', 'bookforge', 'kana-notebook'])
      expect(projectBySlug(slug), slug).toBeDefined();
  });

  it('only links to http(s) or mailto addresses', () => {
    for (const p of PROJECTS) if (p.link) expect(p.link.href).toMatch(/^(https:\/\/|mailto:)/);
  });
});

describe('the board', () => {
  it('has ten rows: the greeting, the seven projects in order, about, contact', () => {
    expect(WORLDS.map((w) => w.id)).toEqual(['hello', ...PROJECTS.map((p) => p.slug), 'about', 'contact']);
  });

  it('stands every project in exactly one place, and has no place left over', () => {
    expect(Object.keys(PROJECT_PLACES).sort()).toEqual(PROJECTS.map((p) => p.slug).sort());
  });

  it('gives every row a place, a title, a status word, a footer line and a description of its photo', () => {
    for (const w of WORLDS) {
      for (const text of [w.place, w.title, w.status, w.pos, w.alt]) expect(text.trim(), w.id).not.toBe('');
      expect(w.status.length, w.id).toBeLessThanOrEqual(9);
    }
  });

  it('names a clock for every place that has a time zone, and only real zones', () => {
    for (const w of WORLDS) {
      if (!w.tz) continue;
      expect(w.tzLabel, w.id).toBeTruthy();
      expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: w.tz }), w.id).not.toThrow();
    }
  });

  it('uses the status words of the brief', () => {
    expect(WORLDS.map((w) => w.status)).toEqual([
      'hello',
      'PRIVATE',
      'PRIVATE',
      'IN USE',
      'LIVE',
      'BUILDING',
      'BUILDING',
      'LIVE',
      'about',
      'write me',
    ]);
  });

  it('finds a row by its id and numbers rows with two digits', () => {
    expect(indexOfWorld('kana-notebook')).toBe(7);
    expect(indexOfWorld('nowhere')).toBe(-1);
    expect(rowNumber(7)).toBe('07');
  });
});

describe('content rendered into the page', () => {
  const videos = { 'kana-notebook': { src: 'kana-notebook.mp4', seconds: 44 } };

  it('escapes HTML in text', () => {
    expect(esc('D&D <b>"x"</b>')).toBe('D&amp;D &lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  });

  it('writes a running time as m:ss', () => {
    expect(clock(44)).toBe('0:44');
    expect(clock(68.011)).toBe('1:08');
    expect(clock(600)).toBe('10:00');
  });

  it('renders a project with its place, name, line, the longer text, note and link', () => {
    const html = renderProject(WORLDS[1], 1);

    expect(html).toContain('<section class="world" id="front-desk" data-i="1" data-at="tl" data-at-m="bottom"');
    expect(html).toContain('data-kind="work" aria-labelledby="front-desk-t"');
    expect(html).toContain('<span class="pl">Front desk</span><span class="src">something I built for work</span>');
    expect(html).toContain('<h2 class="name" id="front-desk-t" tabindex="-1">The Front Desk</h2>');
    expect(html).toContain('<p class="line">An AI that picks up the phone.</p>');
    expect(html).toContain('<p class="note">built for a client, so no name.</p>');
    expect(html).toContain('<a class="ask" href="mailto:kaisar.turysbek@gmail.com">');
    expect(html).toContain('aria-label="Read about The Front Desk"');
  });

  it('opens external links in a new tab without an opener, and says so; mailto links open in place', () => {
    const live = renderProject(WORLDS[4], 4);
    const mail = renderProject(WORLDS[1], 1);

    expect(live).toContain('target="_blank" rel="noopener"');
    expect(live).toContain('(opens in a new tab)');
    expect(mail).not.toContain('target="_blank"');
  });

  it('shows "Watch" with the real length only for a project that has a video', () => {
    const kana = renderProject(WORLDS[7], 7, videos);

    expect(kana).toContain('data-video="kana-notebook"');
    expect(kana).toContain('Watch<span class="sr-only"> the Kana Notebook video,</span> <span class="len">0:44</span>');
    expect(renderProject(WORLDS[7], 7)).not.toContain('data-video');
    expect(renderProject(WORLDS[3], 3, videos)).not.toContain('data-video');
  });

  it('renders all ten worlds in board order, with the greeting, about and contact', () => {
    const html = renderWorlds(videos);

    expect(html.match(/<section class="world/g)).toHaveLength(10);
    expect(html.match(/data-i="(\d)"/g)?.map((m) => m.replace(/\D/g, ''))).toEqual([...'0123456789']);
    expect(html).toContain('<h1 class="name" id="hello-t" tabindex="-1">Hi, I\'m Kaisar.</h1>');
    expect(html).toContain('Scroll to walk in');
    expect(html).toContain('A 3D tabletop for D&amp;D fights.');
    expect(html).toContain(`<a class="write" id="write" href="mailto:${SITE.contact.email}">write me</a>`);
    expect(html).toContain('id="note-open"');
    expect(html).toContain('id="lantern"');
    expect(html).toContain('Telegram @kekaisik');
    for (const paragraph of SITE.about.paragraphs) expect(html).toContain(esc(paragraph));
  });

  it('renders a board row per world with the place, what stands there and a status, under Work and Play', () => {
    const html = renderRows();

    expect(html.match(/<a class="row"/g)).toHaveLength(10);
    expect(html.match(/<li class="grp"/g)).toHaveLength(2);
    expect(html.indexOf('>Work<')).toBeLessThan(html.indexOf('href="#front-desk"'));
    expect(html.indexOf('>Play<')).toBeGreaterThan(html.indexOf('href="#lowl"'));
    expect(html.indexOf('>Play<')).toBeLessThan(html.indexOf('href="#emberquill"'));
    expect(html).toContain('Kyoto<span class="pj">Kana Notebook</span>');
    expect(html).toContain('<span class="st live" aria-hidden="true">LIVE</span>');
    expect(html).toContain(`aria-label="${MESSAGES.row('07', 'Kyoto', 'Kana Notebook', 'LIVE')}"`);
    for (const w of WORLDS) expect(html, w.id).toContain(`<span class="pj">${esc(w.title)}</span>`);
  });

  it('writes the first photo into the page, with its blurred stand-in and the upright crop for phones', () => {
    const html = renderFirstFrame();

    expect(html).toContain('<div class="frame on" data-i="0"');
    expect(html).toContain('--lq:url(data:image/webp;base64,');
    expect(html).toContain('srcset="/worlds/hello-m.webp"');
    expect(html).toContain('src="/worlds/hello.webp"');
    expect(html).toContain(`alt="${esc(WORLDS[0].alt)}"`);
  });

  it('fills every slot of the page shell and leaves unknown ones alone', () => {
    const out = fillShell('<title>{{title}}</title><!--app:worlds--><!--app:rows--><!--app:other-->{{nope}}');

    expect(out).toContain(`<title>${SITE.title}</title>`);
    expect(out).toContain('id="kana-notebook"');
    expect(out).toContain('<!--app:other-->{{nope}}');
    expect(out).not.toContain('<!--app:worlds-->');
  });

  it('leaves no slot of the real index.html unfilled', () => {
    const out = fillShell(readFileSync('index.html', 'utf8'), videos);

    expect(out).not.toMatch(/\{\{\w+\}\}/);
    expect(out).not.toMatch(/<!--app:\w+-->/);
  });
});
