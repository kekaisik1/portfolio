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
  alt: 'A snowy Tian Shan summit ridge above a sea of clouds at sunrise, with footprints along the ridge',
};

/** Where each project stands, by slug. A project without an entry here fails the unit tests. */
export const PROJECT_PLACES: Readonly<Record<string, PlaceWords>> = {
  'front-desk': {
    place: 'Front desk',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'front desk, after hours',
    alt: 'An empty front desk at blue hour with one desk phone, its screen glowing',
  },
  'numbers-room': {
    place: 'Reading room',
    status: 'PRIVATE',
    tone: 'private',
    pos: 'reading room, one lamp on',
    alt: 'A dark archive reading room with one brass lamp lit over an open ledger',
  },
  lowl: {
    place: 'Workshop',
    status: 'IN USE',
    tone: 'use',
    pos: 'repair workshop, door open',
    alt: 'A bright appliance-repair workshop with an open washing machine on the bench and sun through the roll-up door',
  },
  emberquill: {
    place: 'Tavern',
    status: 'LIVE',
    tone: 'live',
    pos: 'tavern table, candles lit',
    alt: 'A candlelit tavern table with painted miniatures, dice and a dungeon map, a fire behind',
  },
  'history-lens': {
    place: 'Soho, 1854',
    status: 'BUILDING',
    tone: 'building',
    pos: '51.5°N 0.1°W',
    tz: 'Europe/London',
    tzLabel: 'Soho',
    alt: 'A cast-iron water pump on a wet cobbled London street in fog, under a gas lamp',
  },
  bookforge: {
    place: 'Lighthouse',
    status: 'BUILDING',
    tone: 'building',
    pos: 'lighthouse room, dusk',
    alt: "A writer's desk under an arched window, a lighthouse beam over the sea at dusk outside",
  },
  'kana-notebook': {
    place: 'Kyoto',
    status: 'LIVE',
    tone: 'live',
    pos: '35.0°N 135.8°E',
    tz: 'Asia/Tokyo',
    tzLabel: 'Kyoto',
    alt: 'A narrow Kyoto back street after rain, red paper lanterns reflected in the wet stones',
  },
};

const ABOUT: PlaceWords = {
  place: 'The road',
  status: 'about',
  tone: 'plain',
  pos: '43.2°N 76.9°E',
  tz: 'Asia/Almaty',
  tzLabel: 'Kazakhstan',
  alt: 'An empty road across the golden steppe towards snow mountains at dawn, a white yurt beside it',
};

const CONTACT: PlaceWords = {
  place: 'Campfire',
  status: 'write me',
  tone: 'plain',
  pos: '48.0°N 68.0°E',
  tz: 'Asia/Almaty',
  tzLabel: 'the steppe',
  alt: 'A campfire with empty camp chairs on the night steppe under the Milky Way',
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
