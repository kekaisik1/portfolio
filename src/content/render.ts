/**
 * The page's words as HTML. Used at build time to write them into index.html (so they are there without JavaScript,
 * for search engines and for screen readers), from the same content the painting reads.
 * Without JavaScript this is a plain document; with it, each stop's words stand on the paper one at a time.
 */
import { MESSAGES, SITE, ZONES } from './site';
import { PROJECTS } from './projects';
import type { Project, ProjectLink, ZoneId } from './types';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => ENTITIES[ch]);

function linkHtml(l: ProjectLink, attrs = ''): string {
  const target = l.external ? ' target="_blank" rel="noopener"' : '';
  const tail = l.external ? '<span class="sr-only"> (opens in a new tab)</span>' : '';
  return `<a${attrs} href="${esc(l.href)}"${target}>${esc(l.label)}${tail}</a>`;
}

/** The label beside a place's object: its name, its line, and (on hover) where you would be stepping. */
function labelHtml(p: Project): string {
  return (
    `<button class="label" type="button" data-open="${p.slug}" aria-haspopup="dialog" aria-label="${esc(MESSAGES.goInside(p.name))}">` +
    `<span class="dot" aria-hidden="true"></span><span class="ltext" aria-hidden="true"><span class="lname">${esc(p.name)}</span>` +
    `<span class="lhint"><span class="a">${esc(p.line)}</span><span class="b">${esc(p.hover)}</span></span></span></button>`
  );
}

/** One place: its words on the paper, its label, and everything written inside it. */
export function renderSpot(p: Project, stop: number): string {
  const inside = p.inside.map((t) => `<p>${esc(t)}</p>`).join('');
  const note = p.note ? `<aside class="note">${esc(p.note)}</aside>` : '';
  const link = p.link ? `<p class="live">${linkHtml(p.link)}</p>` : '';
  return (
    `<article class="stop spot" id="${p.slug}" data-stop="${stop}" style="--i:${stop}" data-kind="${p.group}" aria-labelledby="${p.slug}-t">` +
    `<div class="words"><h3 id="${p.slug}-t">${esc(p.name)}</h3><p class="line">${esc(p.line)}</p>` +
    `<p class="src">${esc(SITE.source[p.group])}</p></div>` +
    labelHtml(p) +
    `<div class="more">${inside}${note}${link}</div>` +
    `</article>`
  );
}

const hello = (): string =>
  `<article class="stop hello" id="hello" data-stop="0" style="--i:0" aria-labelledby="hello-t"><div class="words">` +
  `<h1 id="hello-t">${esc(SITE.hero.heading)}</h1><p class="lede">${esc(SITE.hero.line)}</p>` +
  `<button class="walk" type="button" data-go="1">${esc(SITE.hero.walk)}</button>` +
  `</div></article>`;

function night(first: number): string {
  const c = SITE.contact;
  return (
    `<article class="stop about" id="about" data-stop="${first}" style="--i:${first}" aria-labelledby="about-t"><div class="words">` +
    `<h3 class="sr-only" id="about-t">${esc(SITE.about.heading)}</h3>` +
    SITE.about.paragraphs.map((t, i) => `<p${i ? '' : ' class="big"'}>${esc(t)}</p>`).join('') +
    `<p class="today" id="wx"></p><p class="today" id="now"></p>` +
    `</div></article>` +
    `<article class="stop contact" id="contact" data-stop="${first + 1}" style="--i:${first + 1}" aria-labelledby="contact-t"><div class="words">` +
    `<h3 class="sr-only" id="contact-t">${esc(c.heading)}</h3>` +
    `<p class="big"><a id="write" href="mailto:${esc(c.email)}">${esc(c.writeMe)}</a></p>` +
    `<p class="mail"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` +
    `<p><button class="note-link" id="note-open" type="button" aria-haspopup="dialog">${esc(c.leaveNote)}</button></p>` +
    `<ul class="elsewhere">${c.links.map((l) => `<li>${linkHtml(l)}</li>`).join('')}</ul>` +
    `</div>` +
    `<div class="lantern" id="lantern-tag"><button class="lantern-btn" id="lantern" type="button">` +
    `<span class="dot" aria-hidden="true"></span>${esc(MESSAGES.lightLantern)}</button>` +
    `<p class="lantern-n" id="lantern-n" aria-live="polite"></p></div>` +
    `</article>`
  );
}

/** The whole journey: four countries, the first with the greeting, the last with about and contact. */
export function renderJourney(): string {
  let stop = 1;
  return ZONES.map((z) => {
    /* the country stands at its first stop, so the browser's own jump to #sea lands there too */
    const first = z.id === 'mountains' ? 0 : stop;
    let body: string;
    if (z.id === 'night') body = night(stop);
    else {
      const spots = PROJECTS.filter((p) => p.zone === z.id).map((p) => renderSpot(p, stop++));
      body = (z.id === 'mountains' ? hello() : '') + spots.join('');
    }
    return (
      `<section class="country" id="${z.id}" style="--c:${first}" aria-labelledby="${z.id}-t">` +
      `<h2 class="sr-only" id="${z.id}-t">${esc(z.label)}</h2>${body}</section>`
    );
  }).join('\n');
}

/** The words on the horizon bar: one link per country. */
export function renderNavItems(): string {
  return ZONES.map((z) => `<li><a href="#${z.id}" data-country="${z.id}">${esc(z.short)}</a></li>`).join('');
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
    mark: esc(SITE.mark),
    description: esc(SITE.description),
    url: SITE.url,
    ogAlt: esc(SITE.ogAlt),
    heading: esc(SITE.hero.heading),
    line: esc(SITE.hero.line),
    email: esc(SITE.contact.email),
    contactHeading: esc(SITE.contact.heading),
    skip: esc(SITE.skip),
    travelHint: esc(SITE.travelHint),
    backOutside: esc(MESSAGES.backOutside),
  };
  return html
    .replace(/<!--app:(\w+)-->/g, (m, k: string) => slots[k] ?? m)
    .replace(/\{\{(\w+)\}\}/g, (m, k: string) => words[k] ?? m);
}

export const zoneIds = (): ZoneId[] => ZONES.map((z) => z.id);
