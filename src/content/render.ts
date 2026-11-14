/**
 * The page's words as HTML. Used at build time to write them into index.html (so they are there without JavaScript,
 * for search engines and for screen readers), from the same content the page's code reads.
 * Without JavaScript this is a plain stacked document; with it, one world's words are on screen at a time.
 */
import type { VideoManifest } from '../../scripts/video-manifest';
import { TALL_QUERY } from '../lib/queries';
import placeholders from '../worlds/placeholders.json';
import { lookOf, photoUrl } from '../worlds/looks';
import { reactionOf } from '../worlds/reactions';
import { spotsOf, type Spot } from '../worlds/spots';
import { WORLDS, rowNumber } from './places';
import { MESSAGES, SITE } from './site';
import { tryOf } from './tries';
import type { Project, ProjectLink, World } from './types';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => ENTITIES[ch]);

/** "0:44" for a running time in seconds. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function linkHtml(l: ProjectLink, attrs = ''): string {
  const target = l.external ? ' target="_blank" rel="noopener"' : '';
  const tail = l.external ? `<span class="sr-only">${esc(MESSAGES.newTab)}</span>` : '';
  return `<a${attrs} href="${esc(l.href)}"${target}>${esc(l.label)}${tail}</a>`;
}

/** The small line above a world's name: its row number, the place, and what kind of thing stands there. */
function kicker(w: World, i: number): string {
  const src = w.group ? `<span class="src">${esc(SITE.source[w.group])}</span>` : '';
  return (
    `<p class="kicker"><span class="n" aria-hidden="true">${rowNumber(i)}</span>` +
    `<span class="pl">${esc(w.place)}</span>${src}</p>`
  );
}

/** How the world's words are placed: read by the stylesheets, from src/worlds/looks.ts. */
function placing(w: World, i: number): string {
  const look = lookOf(w.id);
  return `data-i="${i}" data-at="${look.at}" data-at-m="${look.atTall}" style="--w:${look.width}rem;--shade-a:${look.shade}"`;
}

const readButton = (name: string): string =>
  `<button class="btn read" type="button" data-read aria-haspopup="dialog" aria-label="${esc(MESSAGES.readLabel(name))}">` +
  `${esc(MESSAGES.read)}</button>`;

function watchButton(p: Project, videos: VideoManifest): string {
  if (!Object.hasOwn(videos, p.slug)) return '';
  const seconds = videos[p.slug].seconds;
  const length = seconds === undefined ? '' : ` <span class="len">${clock(seconds)}</span>`;
  return (
    `<button class="btn watch" type="button" data-video="${p.slug}" aria-haspopup="dialog">${esc(MESSAGES.watch)}` +
    `<span class="sr-only">${esc(MESSAGES.watchLabel(p.name))}</span>${length}</button>`
  );
}

/** The dot and its label: one real button, placed over its object by src/worlds/spot-view.ts. */
const spotHtml = (spot: Spot, k: number, data: string, name: string, label: string): string =>
  `<button class="spot ${spot.side}" type="button" ${data} data-k="${k}" aria-haspopup="dialog" ` +
  `aria-label="${esc(name)}" hidden>` +
  `<span class="spot-dot" aria-hidden="true"></span><span class="spot-l" aria-hidden="true">${label}</span></button>`;

/** A spot that opens the project's video: only where there is a label for it and a video to open. */
function videoSpot(p: Project, spot: Spot, k: number, videos: VideoManifest): string {
  if (!p.spot || !Object.hasOwn(videos, p.slug)) return '';
  const seconds = videos[p.slug].seconds;
  const length = seconds === undefined ? '' : clock(seconds);
  const name = `${MESSAGES.watch}${MESSAGES.watchLabel(p.name)} ${length}`.trim();
  const label = `${esc(p.spot)}${length ? ` <span class="len">${length}</span>` : ''}`;
  return spotHtml(spot, k, `data-video="${p.slug}"`, name, label);
}

/** A spot that opens the project's try. */
function trySpot(p: Project, spot: Spot, k: number): string {
  const t = tryOf(p.slug);
  return t ? spotHtml(spot, k, `data-try="${p.slug}"`, MESSAGES.tryLabel(p.name, t.spot), esc(t.spot)) : '';
}

/**
 * The one thing in the painting that answers a press (src/worlds/reactions.ts): an invisible button the size of its
 * object, placed by src/worlds/react-view.ts. Hidden until then, and without scripts.
 */
const reactButton = (w: World): string =>
  reactionOf(w.id) ? `<button class="react" type="button" aria-label="${esc(w.react)}" hidden></button>` : '';

/**
 * The layer over the painting that pushes in with it: the world's reaction and its spots (hidden until they are
 * placed, and without scripts, where the buttons in the words are the way in). Every world has one.
 */
function spotsLayer(w: World, videos: VideoManifest): string {
  const p = w.project;
  const spots = p
    ? spotsOf(p.slug)
        .map((s, k) => (s.opens === 'video' ? videoSpot(p, s, k, videos) : trySpot(p, s, k)))
        .join('')
    : '';
  return `<div class="spots">${reactButton(w)}${spots}</div>`;
}

/** The Try it button in the words: the way in where the try's spot cannot be shown. */
function tryButton(p: Project): string {
  const t = tryOf(p.slug);
  if (!t) return '';
  return (
    `<button class="btn try" type="button" data-try="${p.slug}" aria-haspopup="dialog" ` +
    `aria-label="${esc(MESSAGES.tryLabel(p.name, t.spot))}">${esc(MESSAGES.tryIt)}</button>`
  );
}

/** One project's world: its place, name, line, the longer text (and its Read button) if any, and what you can do there. */
export function renderProject(w: World, i: number, videos: VideoManifest = {}): string {
  const p = w.project;
  if (!p) throw new Error(`The world "${w.id}" is a project's place but has no project.`);
  const note = p.note ? `<p class="note">${esc(p.note)}</p>` : '';
  const link = p.link ? linkHtml(p.link, p.link.external ? ' class="btn go"' : ' class="ask"') : '';
  /* nothing longer to read: no empty .more and no Read button (on phones it would open an empty sheet) */
  const hasMore = p.inside.length > 0 || note !== '';
  const more = hasMore ? `<div class="more">${p.inside.map((t) => `<p>${esc(t)}</p>`).join('')}${note}</div>` : '';
  const read = hasMore ? readButton(p.name) : '';
  return (
    `<section class="world" id="${p.slug}" ${placing(w, i)} data-kind="${p.group}" aria-labelledby="${p.slug}-t">` +
    `<div class="block">${kicker(w, i)}` +
    `<h2 class="name" id="${p.slug}-t" tabindex="-1">${esc(p.name)}</h2>` +
    `<p class="line">${esc(p.line)}</p>` +
    more +
    `<div class="acts">${read}${tryButton(p)}${watchButton(p, videos)}${link}</div>` +
    `</div>${spotsLayer(w, videos)}</section>`
  );
}

function hello(w: World, i: number): string {
  return (
    `<section class="world hello" id="${w.id}" ${placing(w, i)} aria-labelledby="hello-t"><div class="block">` +
    `<h1 class="name" id="hello-t" tabindex="-1">${esc(SITE.hero.heading)}</h1>` +
    `<p class="lede">${esc(SITE.hero.line)}</p>` +
    `<div class="acts"><button class="btn walk" type="button" data-go="1">${esc(SITE.hero.walk)}</button></div>` +
    `</div>${spotsLayer(w, {})}</section>`
  );
}

function about(w: World, i: number): string {
  const [first, ...rest] = SITE.about.paragraphs;
  return (
    `<section class="world about" id="${w.id}" ${placing(w, i)} aria-labelledby="about-t"><div class="block">` +
    kicker(w, i) +
    `<h2 class="name" id="about-t" tabindex="-1">${esc(SITE.about.heading)}</h2>` +
    `<p class="lede">${esc(first)}</p>` +
    `<div class="more">${rest.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` +
    `<div class="acts">${readButton(SITE.about.heading)}</div>` +
    `</div>${spotsLayer(w, {})}</section>`
  );
}

function contact(w: World, i: number): string {
  const c = SITE.contact;
  return (
    `<section class="world contact" id="${w.id}" ${placing(w, i)} aria-labelledby="contact-t"><div class="block">` +
    kicker(w, i) +
    `<h2 class="sr-only" id="contact-t" tabindex="-1">${esc(c.heading)}</h2>` +
    `<p class="write-p"><a class="write" id="write" href="mailto:${esc(c.email)}">${esc(c.writeMe)}</a></p>` +
    `<ul class="elsewhere"><li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` +
    `${c.links.map((l) => `<li>${linkHtml(l)}</li>`).join('')}</ul>` +
    `<div class="acts">` +
    `<button class="btn note-link" id="note-open" type="button" aria-haspopup="dialog">${esc(c.leaveNote)}</button>` +
    `<button class="btn lantern-btn" id="lantern" type="button"><span class="dot" aria-hidden="true"></span>` +
    `${esc(MESSAGES.lightLantern)}</button></div>` +
    `<p class="lantern-n" id="lantern-n" aria-live="polite"></p>` +
    `</div>${spotsLayer(w, {})}</section>`
  );
}

/** Every world's words, in board order. */
export function renderWorlds(videos: VideoManifest = {}): string {
  return WORLDS.map((w, i) => {
    if (w.kind === 'hello') return hello(w, i);
    if (w.kind === 'about') return about(w, i);
    if (w.kind === 'contact') return contact(w, i);
    return renderProject(w, i, videos);
  }).join('\n');
}

/** The board's rows: a link per world (number, place, what stands there, status), under the Work and Play headings. */
export function renderRows(): string {
  let k = 0;
  let group: string | undefined;
  const out: string[] = [];
  WORLDS.forEach((w, i) => {
    if (w.group && w.group !== group) out.push(`<li class="grp" style="--k:${k++}">${esc(SITE.groups[w.group])}</li>`);
    group = w.group;
    const n = rowNumber(i);
    out.push(
      `<li style="--k:${k++}"><a class="row" href="#${w.id}" data-i="${i}"${i === 0 ? ' aria-current="true"' : ''} ` +
        `aria-label="${esc(MESSAGES.row(n, w.place, w.title, w.status))}">` +
        `<span class="n" aria-hidden="true">${n}</span>` +
        `<span class="pl" aria-hidden="true">${esc(w.place)}<span class="pj">${esc(w.title)}</span></span>` +
        `<span class="st ${w.tone}" aria-hidden="true">${esc(w.status)}</span></a></li>`,
    );
  });
  return out.join('');
}

/**
 * The first world's photograph, written into the page so it is on screen before any script runs: the tiny blurred
 * stand-in as a background, the real picture over it. The page's code takes it over (src/worlds/photos.ts).
 */
export function renderFirstFrame(): string {
  const w = WORLDS[0];
  const look = lookOf(w.id);
  const lq = placeholders[w.id as keyof typeof placeholders];
  return (
    `<div class="frame on" data-i="0" style="--x:${look.x}%;--lq:url(${lq.wide});--lq-m:url(${lq.tall})">` +
    `<picture><source media="${TALL_QUERY}" srcset="${photoUrl(w.id, true, '/')}" />` +
    `<img src="${photoUrl(w.id, false, '/')}" alt="${esc(w.alt)}" decoding="async" fetchpriority="high" /></picture></div>`
  );
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

/**
 * Fill the `<!--app:name-->` and `{{name}}` slots of index.html. `videos` says which projects have a video and how
 * long each runs. Addresses are written from the root (/worlds/…): Vite puts the site's base in front of them.
 */
export function fillShell(html: string, videos: VideoManifest = {}): string {
  const first = WORLDS[0];
  const slots: Record<string, string> = {
    worlds: renderWorlds(videos),
    rows: renderRows(),
    frame: renderFirstFrame(),
    jsonld: jsonLd(),
  };
  const n = MESSAGES.note;
  const words: Record<string, string> = {
    title: esc(SITE.title),
    mark: esc(SITE.mark),
    description: esc(SITE.description),
    url: SITE.url,
    ogAlt: esc(SITE.ogAlt),
    heading: esc(SITE.hero.heading),
    line: esc(SITE.hero.line),
    skip: esc(SITE.skip),
    skipTo: WORLDS[1].id,
    travelHint: esc(SITE.travelHint),
    travelKeys: esc(SITE.travelKeys),
    boardLabel: esc(SITE.boardLabel),
    switchesLabel: esc(SITE.switches.label),
    motionLabel: esc(SITE.switches.motion),
    soundLabel: esc(SITE.switches.sound),
    close: esc(MESSAGES.close),
    firstPhoto: photoUrl(first.id, false, '/'),
    firstPhotoTall: photoUrl(first.id, true, '/'),
    barLabel: esc(MESSAGES.barLabel(rowNumber(0), first.place, first.title)),
    firstNumber: rowNumber(0),
    ofCount: `/${rowNumber(WORLDS.length - 1)}`,
    firstPlace: esc(first.place),
    firstTitle: esc(first.title),
    firstStatus: esc(first.status),
    firstTone: first.tone,
    firstPos: esc(first.pos),
    count: `${rowNumber(0)}/${rowNumber(WORLDS.length - 1)}`,
    noteHeading: esc(n.heading),
    noteText: esc(n.text),
    noteName: esc(n.name),
    noteNameHint: esc(n.nameHint),
    noteContact: esc(n.contact),
    noteContactHint: esc(n.contactHint),
    noteSend: esc(n.send),
    noteDone: esc(n.done),
  };
  return html
    .replace(/<!--app:(\w+)-->/g, (m, k: string) => slots[k] ?? m)
    .replace(/\{\{(\w+)\}\}/g, (m, k: string) => words[k] ?? m);
}
