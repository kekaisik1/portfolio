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
  /** The longer text, one string per paragraph. */
  inside: string[];
  /** A small aside under the text. */
  note?: string;
  link?: ProjectLink;
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
  /** What the photograph shows, for people who cannot see it. */
  alt: string;
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
