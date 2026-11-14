/** The shape of everything written on the page. Text lives in this folder and nowhere else. */

export type ProjectGroup = 'work' | 'play';

export interface ProjectLink {
  href: string;
  label: string;
  /** true = opens in a new tab (a live site); false = a mailto or same-page link */
  external: boolean;
}

export interface Project {
  /** The id of its world on the page, its #link, its photo and video file name and its key in the API's growth numbers. */
  slug: string;
  group: ProjectGroup;
  name: string;
  /** One line under the name. At most 60 characters. */
  line: string;
  /** The longer text, one string per paragraph. Empty (with no note) = just the name and line: no Read button. */
  inside: string[];
  /** A small aside under the text. */
  note?: string;
  link?: ProjectLink;
  /** The label of the spot in its painting that opens its video (src/worlds/spots.ts says where it stands). */
  spot?: string;
}

/**
 * A "try it": a taste of a project in one or two presses, opened from a spot in its painting (or the Try it button).
 * Each kind is a small state machine in src/try/; this is only its words and data.
 */
export type TryCopy = KanaTry | FightTry | CallTry | PickTry;

interface TryBase {
  /** the label of its spot in the painting, a few words, lower case: "read a card" */
  spot: string;
  /** the heading of the panel */
  heading: string;
  /** where it ends: the project's own link, if it has one */
  link?: ProjectLink;
}

export interface KanaCard {
  kana: string;
  romaji: string;
  /** the readings offered, the right one among them */
  choices: readonly string[];
}

export interface KanaTry extends TryBase {
  kind: 'kana';
  cards: readonly KanaCard[];
  /** the small line over a card: "card 1 of 3" */
  step: (n: number, of: number) => string;
  /** what the card is, for a screen reader (the character itself would say its reading) */
  cardLabel: (n: number) => string;
  right: (kana: string, romaji: string) => string;
  wrong: (kana: string, romaji: string) => string;
  next: string;
  /** the last line: "3 of 3." and what the app has */
  score: (right: number, of: number) => string;
  end: string;
}

export interface FightTry extends TryBase {
  kind: 'fight';
  intro: string;
  enemy: string;
  ac: number;
  hp: number;
  toHit: number;
  damage: { count: number; sides: number; bonus: number };
  roll: string;
  /** "14 + 5 = 19 vs AC 15" */
  sum: (d20: number, bonus: number, total: number, ac: number) => string;
  hit: (damage: number) => string;
  crit: (damage: number) => string;
  miss: string;
  fumble: string;
  hpText: (hp: number, max: number) => string;
  down: (rolls: number) => string;
}

export interface CallLine {
  who: string;
  text: string;
}

export interface CallTry extends TryBase {
  kind: 'call';
  /** said before anything else: it is an example */
  mark: string;
  pickUp: string;
  lines: readonly CallLine[];
  booked: string;
  end: string;
}

/** A line shown after a choice, with an optional tag in front of it ("Documented", "Your outcome"). */
export interface ResultLine {
  text: string;
  tag?: string;
}

export interface PickOption {
  id: string;
  label: string;
  result: readonly ResultLine[];
  /** a plain bar under the result: how much of what */
  meter?: { value: number; max: number };
  /** a page to go on to (a live site's real page) */
  link?: ProjectLink;
  /** 'find' mode: the one the visitor is looking for */
  target?: boolean;
}

export interface PickTry extends TryBase {
  kind: 'pick';
  /**
   * once: one choice, then what it meant (the others close); find: press until the one you are looking for
   * (the others say so); any: every choice shows its own answer, as often as you like
   */
  mode: 'once' | 'find' | 'any';
  /** a small line over it all: "an example, with made-up numbers" */
  step?: string;
  intro: readonly ResultLine[];
  ask: string;
  options: readonly PickOption[];
  /** 'find': what a wrong press says */
  fine?: string;
  /** the last line, once it is done */
  end?: ResultLine;
}

/** How a status word on the board is coloured. */
export type StatusTone = 'live' | 'use' | 'building' | 'private' | 'plain';

/** One row of the board: a place, and what the board says about it. */
export interface Place {
  /** The id of its world on the page and its #link; a project's slug, or hello / about / contact. */
  id: string;
  /** The destination on the board: "Kyoto". */
  place: string;
  /** The status word at the end of the row. */
  status: string;
  tone: StatusTone;
  /** The board's footer while you are there: coordinates, or a few words for a room. */
  pos: string;
  /** IANA time zone of the place, when it is a real one: the footer clock shows its time. */
  tz?: string;
  /** Whose time the clock shows: "Kyoto". */
  tzLabel?: string;
  /** What the painting shows, for people who cannot see it. */
  alt: string;
  /** The name of the one thing in the painting that answers a press (src/worlds/reactions.ts says where). */
  react: string;
}

/** A place together with what stands in it. */
export interface World extends Place {
  kind: 'hello' | 'project' | 'about' | 'contact';
  /** The second line of its board row: the project's name, or what the place is for. */
  title: string;
  group?: ProjectGroup;
  project?: Project;
}

export interface SiteCopy {
  title: string;
  /** The name at the top of the board. */
  mark: string;
  description: string;
  url: string;
  /** What the picture shown when the link is pasted somewhere is of (og:image:alt), before the greeting. */
  ogAlt: string;
  /** The first screen: the greeting, the one line under it, and the hint that starts the journey. */
  hero: { heading: string; line: string; walk: string };
  /** The board's group headings. */
  groups: Record<ProjectGroup, string>;
  /** The small line beside each place's number, by kind of project. */
  source: Record<ProjectGroup, string>;
  about: { heading: string; paragraphs: string[] };
  contact: {
    heading: string;
    email: string;
    writeMe: string;
    leaveNote: string;
    links: ProjectLink[];
  };
  skip: string;
  travelHint: string;
  /** The short version of the travel hint, at the top of the board. */
  travelKeys: string;
  /** The name of the board for screen readers. */
  boardLabel: string;
  /** The two corner switches: the name of the pair, and of each (their state is said by aria-pressed). */
  switches: { label: string; motion: string; sound: string };
}
