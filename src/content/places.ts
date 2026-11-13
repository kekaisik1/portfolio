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
  alt: 'A painting of a snowy Tian Shan summit at sunrise, snow streaming off its top and footprints climbing the ridge above a sea of clouds',
};

/** Where each project stands, by slug. A project without an entry here fails the unit tests. */
export const PROJECT_PLACES: Readonly<Record<string, PlaceWords>> = {
  'front-desk': {
    place: 'Mountain pass',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'pass road, blue hour',
    alt: 'A painting of a lit red phone booth beside a wet mountain road at blue hour, snowy pines around it, mist in the valley under the peaks',
  },
  'numbers-room': {
    place: 'Observatory',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'above the clouds, twilight',
    alt: 'A painting of a white observatory on a rocky summit at twilight, its dome open on a lit telescope, a sea of clouds below',
  },
  lowl: {
    place: 'Repair shop',
    status: 'IN USE',
    tone: 'use',
    pos: 'palm street, golden hour',
    alt: 'A painting of an appliance-repair shop on a palm street at golden hour, its door rolled up, a washing machine and a fridge out front, snowy mountains behind',
  },
  emberquill: {
    place: "Dragon's hall",
    status: 'LIVE',
    tone: 'live',
    pos: 'ruined hall, the dragon awake',
    alt: 'A painting of four adventurers on a rock ledge facing a huge red dragon on its gold in a ruined hall, light falling through the arches, a red twenty-sided die in front',
  },
  'history-lens': {
    place: 'Soho, 1854',
    status: 'BUILDING',
    tone: 'building',
    pos: '51.5°N 0.1°W',
    tz: 'Europe/London',
    tzLabel: 'Soho',
    alt: 'A painting of a cast-iron water pump under a lit gas lamp on a wet cobbled London street, fog down the street at dusk',
  },
  bookforge: {
    place: 'The open book',
    status: 'BUILDING',
    tone: 'building',
    pos: 'hilltop, late afternoon',
    alt: 'A painting of a giant open book on a hilltop with a world growing out of its pages, half ink drawing and half painted city, harbour and waterfall, a fountain pen beside it and loose pages turning into birds',
  },
  'kana-notebook': {
    place: 'Kyoto',
    status: 'LIVE',
    tone: 'live',
    pos: '35.0°N 135.8°E',
    tz: 'Asia/Tokyo',
    tzLabel: 'Kyoto',
    alt: 'A painting of a Kyoto street at dusk after spring rain, cherry blossom over a pagoda, paper lanterns lit, petals on the wet stones',
  },
};

const ABOUT: PlaceWords = {
  place: 'The road',
  status: 'about',
  tone: 'plain',
  pos: '43.2°N 76.9°E',
  tz: 'Asia/Almaty',
  tzLabel: 'Kazakhstan',
  alt: 'A painting of an empty dirt road across the golden steppe towards snow mountains at dawn, a white yurt beside it',
};

const CONTACT: PlaceWords = {
  place: 'Campfire',
  status: 'write me',
  tone: 'plain',
  pos: '48.0°N 68.0°E',
  tz: 'Asia/Almaty',
  tzLabel: 'the steppe',
  alt: 'A painting of a campfire with four empty camp chairs and a crate with a notebook and dice, on the night steppe under the Milky Way',
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
