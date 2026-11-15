import { PROJECTS } from './projects';
import { SITE } from './site';
import type { Place, World } from './types';

type PlaceWords = Omit<Place, 'id'>;

const HELLO: PlaceWords = {
  place: 'Summit',
  status: 'hello',
  tone: 'plain',
  pos: '43.0°N 76.9°E',
  tz: 'Asia/Almaty',
  tzLabel: 'Tian Shan',
  alt: 'A painting of a tuxedo cat sitting on a summit cairn at sunrise, prayer flags on a pole beside it, a red backpack and an ice axe leaning on the stones, a sea of clouds and snow peaks beyond',
};

/** Where each project stands, by slug. A project without an entry here fails the unit tests. */
export const PROJECT_PLACES: Readonly<Record<string, PlaceWords>> = {
  'front-desk': {
    place: 'Dispatch desk',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'town office, blue hour',
    alt: 'A painting of a desk at blue hour: a town map with pins, threads and three tiny white vans under a brass lamp, a telephone, a headset, an appointment book and a row of job cards, the lit windows of the town outside',
  },
  'numbers-room': {
    place: 'Observatory',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'under the dome, night',
    alt: 'A painting of the inside of an observatory at night: one long hand-drawn chart of a year pinned around the wall, ledgers on the shelf above, a desk with a lit lamp and an open ledger, and a brass telescope under the open dome full of stars',
  },
  lowl: {
    place: 'Repair shop',
    status: 'IN USE',
    tone: 'use',
    pos: 'shop door, morning',
    alt: 'A painting of a repair shop on a sunny morning, its door rolled up on a workbench, tools on the wall and a counter with a brass bell, and outside a washing machine left with a tag tied to its door',
  },
  emberquill: {
    place: 'Cave mouth',
    status: 'LIVE',
    tone: 'live',
    pos: 'mountain cave, night',
    alt: 'A painting of four adventurers on a rock ledge at the mouth of a mountain cave at night, looking in at a red glow and the huge shadow of a dragon on the cave wall, a shaft of moonlight behind them',
  },
  'history-lens': {
    place: 'Rome, 117 AD',
    status: 'BUILDING',
    tone: 'building',
    pos: '41.9°N 12.5°E',
    tz: 'Europe/Rome',
    tzLabel: 'Rome',
    alt: 'A painting of a Roman wall where a fresco of a triumph is being painted: the general in his chariot and his guards finished in colour, the horses, soldiers and an elephant still red line drawing, and on the scaffold bowls of pigment, brushes and a small oil lamp burning',
  },
  bookforge: {
    place: 'The story wall',
    status: 'BUILDING',
    tone: 'building',
    pos: 'writing room, blue dusk',
    alt: 'A painting of a wall covered in pinned sketches, maps, portraits and notes joined by red threads at blue dusk; a young man seen from behind pins up one more page, and a tuxedo cat sits on the lamplit desk looking up at the wall',
  },
  'kana-notebook': {
    place: 'Kyoto',
    status: 'LIVE',
    tone: 'live',
    pos: '35.0°N 135.8°E',
    tz: 'Asia/Tokyo',
    tzLabel: 'Kyoto',
    alt: 'A painting of a low calligraphy desk on tatami in morning sun, sheets brushed with the kana あ, か, さ and な, an inkstone, a brush and a cup of green tea, and a tuxedo cat asleep on the veranda edge before a moss garden with a stone lantern',
  },
};

const ABOUT: PlaceWords = {
  place: 'Airport window',
  status: 'about',
  tone: 'plain',
  pos: '43.2°N 76.9°E',
  tz: 'Asia/Almaty',
  tzLabel: 'Kazakhstan',
  alt: 'A painting of a young man with a backpack, seen from behind, at a tall airport window in morning sun, watching a plane climb over snow mountains; a tuxedo cat sits on the seat beside him',
};

const CONTACT: PlaceWords = {
  place: 'Lake shore',
  status: 'write me',
  tone: 'plain',
  pos: 'lake shore, dawn',
  tz: 'Asia/Almaty',
  tzLabel: 'the lake',
  alt: 'A painting of a corked bottle with a rolled letter inside, washed up on the pebbles of a mountain lake at dawn, the sun rising through mist over the water',
};

function placeOf(slug: string): PlaceWords {
  if (!Object.hasOwn(PROJECT_PLACES, slug))
    throw new Error(`No place for the project "${slug}": add one to PROJECT_PLACES in src/content/places.ts.`);
  return PROJECT_PLACES[slug];
}

/** The board, top to bottom: the greeting, the seven projects, about, contact. */
export const WORLDS: readonly World[] = [
  { id: 'hello', kind: 'hello', title: SITE.mark, ...HELLO },
  ...PROJECTS.map((p): World => ({
    id: p.slug,
    kind: 'project',
    title: p.name,
    group: p.group,
    project: p,
    ...placeOf(p.slug),
  })),
  { id: 'about', kind: 'about', title: SITE.about.heading, ...ABOUT },
  { id: 'contact', kind: 'contact', title: SITE.contact.heading, ...CONTACT },
];

export const LAST = WORLDS.length - 1;

/** Which row a world id is, or -1. */
export const indexOfWorld = (id: string): number => WORLDS.findIndex((w) => w.id === id);

/** "07": the row number as the board writes it. */
export const rowNumber = (i: number): string => String(i).padStart(2, '0');
