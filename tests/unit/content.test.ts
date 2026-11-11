import { describe, expect, it } from 'vitest';
import { PROJECTS, projectBySlug } from '../../src/content/projects';
import { fillShell, renderJourney, renderNavItems, renderSpot, esc } from '../../src/content/render';
import { SITE, ZONES } from '../../src/content/site';
import { PLACES } from '../../src/places';
import { ROOMS } from '../../src/rooms';

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

  it('has a drawing and a room for every project, and none left over', () => {
    const slugs = PROJECTS.map((p) => p.slug).sort();

    expect(Object.keys(PLACES).sort()).toEqual(slugs);
    expect(Object.keys(ROOMS).sort()).toEqual(slugs);
  });
});

describe('content rendered into the page', () => {
  it('escapes HTML in text', () => {
    expect(esc('D&D <b>"x"</b>')).toBe('D&amp;D &lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  });

  it('renders a place with its name, line, inside text, note and link', () => {
    const html = renderSpot(PROJECTS[0]);

    expect(html).toContain('<article class="spot" id="front-desk" data-kind="work" aria-labelledby="front-desk-t">');
    expect(html).toContain('<h2 id="front-desk-t">The Front Desk</h2><p>An AI that picks up the phone.</p>');
    expect(html).toContain('<aside class="note">built for a client, so no name.</aside>');
    expect(html).toContain('<p class="live"><a href="mailto:kaisar.turysbek@gmail.com">');
  });

  it('opens external links in a new tab without an opener, and mailto links in place', () => {
    const live = renderSpot(PROJECTS[3]);
    const mail = renderSpot(PROJECTS[0]);

    expect(live).toContain('target="_blank" rel="noopener"');
    expect(mail).not.toContain('target="_blank"');
  });

  it('renders four stretches holding all seven places, the greeting and the contact links', () => {
    const html = renderJourney();

    expect(html.match(/<section class="stretch"/g)).toHaveLength(4);
    expect(html.match(/<article class="spot"/g)).toHaveLength(7);
    expect(html).toContain('<h1>Hi, I&#39;m Kaisar.</h1>'.replace('&#39;', "'"));
    expect(html).toContain('A 3D tabletop for D&amp;D fights.');
    expect(html).toContain(`href="mailto:${SITE.contact.email}"`);
    expect(html).toContain('id="note-open"');
  });

  it('renders a horizon mark for each place and one for the end', () => {
    const html = renderNavItems();

    expect(html.match(/<li>/g)).toHaveLength(8);
    expect(html).toContain('<a class="place" href="#emberquill"><span>Emberquill</span></a>');
    expect(html).toContain('href="#about"');
  });

  it('fills every slot of the page shell and leaves unknown ones alone', () => {
    const out = fillShell('<title>{{title}}</title><!--app:journey--><!--app:nav--><!--app:other-->{{nope}}');

    expect(out).toContain(`<title>${SITE.title}</title>`);
    expect(out).toContain('id="kana-notebook"');
    expect(out).toContain('<!--app:other-->{{nope}}');
    expect(out).not.toContain('<!--app:journey-->');
  });
});
