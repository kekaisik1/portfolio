/**
 * The page's words as HTML. Used at build time to write them into index.html (so they are there without JavaScript,
 * for search engines and for screen readers), from the same content the drawing reads.
 */
import { PROJECTS } from './projects';
import { SITE, ZONES } from './site';
import type { Project, ProjectLink, ZoneId } from './types';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => ENTITIES[ch]);

function linkHtml(l: ProjectLink, attrs = ''): string {
  const target = l.external ? ' target="_blank" rel="noopener"' : '';
  return `<a${attrs} href="${esc(l.href)}"${target}>${esc(l.label)}</a>`;
}

/** One place: its name and one line beside the drawing, and everything written inside it. */
export function renderSpot(p: Project): string {
  const inside = p.inside.map((t) => `<p>${esc(t)}</p>`).join('');
  const note = p.note ? `<aside class="note">${esc(p.note)}</aside>` : '';
  const link = p.link ? `<p class="live">${linkHtml(p.link)}</p>` : '';
  return (
    `<article class="spot" id="${p.slug}" data-kind="${p.group}" aria-labelledby="${p.slug}-t">` +
    `<div class="cap"><h2 id="${p.slug}-t">${esc(p.name)}</h2><p>${esc(p.line)}</p></div>` +
    `<div class="more">${inside}${note}${link}</div>` +
    `</article>`
  );
}

const HERO =
  `<header class="hero"><div class="hero-text">` +
  `<h1>${esc(SITE.hero.heading)}</h1><p class="quiet">${esc(SITE.hero.line)}</p>` +
  `</div></header>`;

const LANTERN =
  `<button class="lantern-btn" id="lantern" type="button" aria-label="Light a lantern"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">` +
  `<path d="M8.5 40.6 C15 39.8 22 40.9 29 40.2 C33 39.9 37 40.6 40.5 40.1" stroke-width="1.1" opacity=".75"/>` +
  `<path d="M12 42.8 C17 42.3 21 42.9 25.5 42.6" stroke-width=".8" opacity=".45"/>` +
  `<path class="lb-body" d="M17.6 21.2 C16.4 25 16.5 31.2 17.9 35.4 L30.3 35.5 C31.7 31 31.6 25.1 30.2 21.1 Z" stroke-width="1.15"/>` +
  `<path d="M17.2 21.3 L30.7 21.1 M17.6 35.6 L30.4 35.3 M19.6 21 L20.3 18.9 L27.8 18.8 L28.4 21 M21 35.5 L21.4 37.7 L26.7 37.6 L27.1 35.4" stroke-width="1"/>` +
  `<path d="M20.4 18.9 C20.6 14.2 27.4 14.1 27.6 18.8" stroke-width=".9"/>` +
  `<path d="M20.1 25.4 C22.6 25.9 25.6 25.8 28 25.2 M19.9 30.5 C22.6 31 25.8 31 28.3 30.3" stroke-width=".7" opacity=".55"/>` +
  `</svg></button><p class="lantern-n" id="lantern-n" aria-live="polite"></p>`;

function renderNight(): string {
  const c = SITE.contact;
  return (
    LANTERN +
    `<article class="block" id="about" aria-labelledby="about-t">` +
    `<h2 class="sr-only" id="about-t">${esc(SITE.about.heading)}</h2>` +
    SITE.about.paragraphs.map((t) => `<p>${esc(t)}</p>`).join('') +
    `<aside class="note today" id="wx"></aside><aside class="note today" id="now"></aside>` +
    `</article>` +
    `<div class="write" id="write-wrap"><div id="moon-spot" aria-hidden="true"></div><div class="block">` +
    `<p class="big"><a id="write" href="mailto:${esc(c.email)}">${esc(c.writeMe)}</a>` +
    `<button class="note-link" id="note-open" type="button" aria-haspopup="dialog">${esc(c.leaveNote)}</button></p>` +
    c.links.map((l) => `<p class="gh">${linkHtml(l)}</p>`).join('') +
    `</div></div>`
  );
}

/** The whole journey: four stretches, the first with the greeting, the last with about and contact. */
export function renderJourney(): string {
  return ZONES.map((z) => {
    const spots = PROJECTS.filter((p) => p.zone === z.id)
      .map(renderSpot)
      .join('');
    const body = z.id === 'night' ? renderNight() : (z.id === 'mountains' ? HERO : '') + spots;
    return `<section class="stretch" id="${z.id}" aria-label="${esc(z.label)}">${body}</section>`;
  }).join('\n');
}

/** The marks along the horizon line: one per place, and the end. */
export function renderNavItems(): string {
  const items = PROJECTS.map((p) => ({ href: `#${p.slug}`, label: p.name }));
  items.push({ href: '#about', label: SITE.about.heading });
  return items.map((i) => `<li><a class="place" href="${i.href}"><span>${esc(i.label)}</span></a></li>`).join('');
}

const jsonLd = (): string =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kaisar',
    url: SITE.url,
    description: SITE.description,
    homeLocation: { '@type': 'Country', name: 'Kazakhstan' },
    knowsLanguage: ['kk', 'ru', 'en'],
    email: `mailto:${SITE.contact.email}`,
    sameAs: SITE.contact.links.filter((l) => l.external).map((l) => l.href),
  }).replace(/</g, '\\u003c');

/** Fill the `<!--app:name-->` and `{{name}}` slots of index.html. */
export function fillShell(html: string): string {
  const slots: Record<string, string> = {
    journey: renderJourney(),
    nav: renderNavItems(),
    jsonld: jsonLd(),
  };
  const words: Record<string, string> = {
    title: esc(SITE.title),
    description: esc(SITE.description),
    url: SITE.url,
    heading: esc(SITE.hero.heading),
    line: esc(SITE.hero.line),
    skip: esc(SITE.skip),
    travelHint: esc(SITE.travelHint),
  };
  return html
    .replace(/<!--app:(\w+)-->/g, (m, k: string) => slots[k] ?? m)
    .replace(/\{\{(\w+)\}\}/g, (m, k: string) => words[k] ?? m);
}

export const zoneIds = (): ZoneId[] => ZONES.map((z) => z.id);
