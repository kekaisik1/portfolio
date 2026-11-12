/**
 * The stops of the journey, in walking order: the greeting, the seven places, about, contact.
 * Each stop is STEP px of scroll. Pure, derived from src/content/, so it is unit-tested.
 */
import { PROJECTS } from '../content/projects';
import { SITE, ZONES } from '../content/site';
import type { ZoneId } from '../content/types';

/** px of scroll per stop (the reference walks about 450 px per place) */
export const STEP = 460;

export type StopKind = 'hello' | 'place' | 'about' | 'contact';

export interface Stop {
  kind: StopKind;
  country: ZoneId;
  /** the element id on the page */
  id: string;
  /** what a screen reader hears on arriving */
  say: string;
  /** places only */
  slug?: string;
}

export const STOPS: readonly Stop[] = [
  { kind: 'hello', country: 'mountains', id: 'hello', say: SITE.hero.heading },
  ...PROJECTS.map((p): Stop => ({ kind: 'place', country: p.zone, id: p.slug, say: p.name, slug: p.slug })),
  { kind: 'about', country: 'night', id: 'about', say: SITE.about.heading },
  { kind: 'contact', country: 'night', id: 'contact', say: SITE.contact.heading },
];
export const N = STOPS.length;
export const LAST = N - 1;

/** The first stop of each country. */
export const COUNTRY_START: Readonly<Record<ZoneId, number>> = Object.fromEntries(
  ZONES.map((z) => [z.id, STOPS.findIndex((s) => s.country === z.id)]),
) as Record<ZoneId, number>;

export const stopOfSlug = (slug: string): number => STOPS.findIndex((s) => s.slug === slug);
export const stopOfId = (id: string): number => STOPS.findIndex((s) => s.id === id);

/** The stop nearest to a (fractional) journey position. */
export const nearest = (s: number): number => Math.max(0, Math.min(LAST, Math.round(s)));
export const countryAt = (s: number): ZoneId => STOPS[nearest(s)].country;

/** The page scroll that stands exactly at stop i. */
export const scrollOf = (i: number): number => Math.max(0, Math.min(LAST, i)) * STEP;
/** Where on the journey a page scroll is (0 .. LAST, fractional). */
export const atScroll = (y: number): number => Math.max(0, Math.min(LAST, y / STEP));
