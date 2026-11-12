import { describe, expect, it } from 'vitest';
import { PROJECTS, projectBySlug } from '../../src/content/projects';
import { fillShell, renderJourney, renderNavItems, renderSpot, esc } from '../../src/content/render';
import { SITE, ZONES } from '../../src/content/site';
import { COMPOSE } from '../../src/scene/compose';
import { CUTS } from '../../src/scene/objects';

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

  it('puts every project in a daytime zone that exists', () => {
    const zones = ZONES.map((z) => z.id);

    for (const p of PROJECTS) expect(zones).toContain(p.zone);
  });

  it('only links to http(s) or mailto addresses', () => {
    for (const p of PROJECTS) if (p.link) expect(p.link.href).toMatch(/^(https:\/\/|mailto:)/);
  });

  it('stands every project in the landscape as exactly one cut-out, and none left over', () => {
    const slugs = PROJECTS.map((p) => p.slug).sort();

    expect(
      CUTS.filter((c) => c.slug)
        .map((c) => c.slug)
        .sort(),
    ).toEqual(slugs);
  });

  it('has a finished painting for every country a project stands in', () => {
    for (const p of PROJECTS) expect(COMPOSE[p.zone], p.slug).toBeDefined();
  });

  it('gives every project a short line for its label to say on hover', () => {
    for (const p of PROJECTS) {
      expect(p.hover.trim(), p.slug).not.toBe('');
      expect(p.hover.length, p.slug).toBeLessThanOrEqual(40);
    }
  });
});

describe('content rendered into the page', () => {
  it('escapes HTML in text', () => {
    expect(esc('D&D <b>"x"</b>')).toBe('D&amp;D &lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  });

  it('renders a place with its words, its label, and the inside text, note and link', () => {
    const html = renderSpot(PROJECTS[0], 1);

    expect(html).toContain('<article class="stop spot" id="front-desk" data-stop="1" style="--i:1" data-kind="work"');
    expect(html).toContain(
      '<h3 id="front-desk-t">The Front Desk</h3><p class="line">An AI that picks up the phone.</p>',
    );
    expect(html).toContain('<p class="src">something I built for work</p>');
    expect(html).toContain('aria-label="Go inside The Front Desk"');
    expect(html).toContain('<span class="b">knock on the hut door</span>');
    expect(html).toContain('<aside class="note">built for a client, so no name.</aside>');
    expect(html).toContain('<p class="live"><a href="mailto:kaisar.turysbek@gmail.com">');
  });

  it('opens external links in a new tab without an opener, and says so; mailto links open in place', () => {
    const live = renderSpot(PROJECTS[3], 4);
    const mail = renderSpot(PROJECTS[0], 1);

    expect(live).toContain('target="_blank" rel="noopener"');
    expect(live).toContain('(opens in a new tab)');
    expect(mail).not.toContain('target="_blank"');
  });

  it('renders four countries holding the greeting, all seven places, about and contact, one stop after another', () => {
    const html = renderJourney();

    expect(html.match(/<section class="country"/g)).toHaveLength(4);
    expect(html.match(/<article class="stop spot"/g)).toHaveLength(7);
    expect(html.match(/data-stop="(\d)"/g)?.map((m) => m.replace(/\D/g, ''))).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
    expect(html).toContain('<h1 id="hello-t">Hi, I\'m Kaisar.</h1>');
    expect(html).toContain('Scroll to walk in');
    expect(html).toContain('A 3D tabletop for D&amp;D fights.');
    expect(html).toContain(`href="mailto:${SITE.contact.email}"`);
    expect(html).toContain('id="note-open"');
    expect(html).toContain('id="lantern"');
    expect(html).toContain('id="wx"');
  });

  it('renders a horizon word for each country, linking to it', () => {
    const html = renderNavItems();

    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html).toContain('<a href="#steppe" data-country="steppe">steppe</a>');
  });

  it('fills every slot of the page shell and leaves unknown ones alone', () => {
    const out = fillShell('<title>{{title}}</title><!--app:journey--><!--app:nav--><!--app:other-->{{nope}}');

    expect(out).toContain(`<title>${SITE.title}</title>`);
    expect(out).toContain('id="kana-notebook"');
    expect(out).toContain('<!--app:other-->{{nope}}');
    expect(out).not.toContain('<!--app:journey-->');
  });
});
