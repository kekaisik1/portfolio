/** The shape of everything written on the page. Text lives in this folder and nowhere else. */

export type ProjectGroup = 'work' | 'play';
export type ZoneId = 'mountains' | 'steppe' | 'sea' | 'night';

export interface ProjectLink {
  href: string;
  label: string;
  /** true = opens in a new tab (a live site); false = a mailto or same-page link */
  external: boolean;
}

export interface Project {
  /** The id of its stop on the page, its #link, its video file name and its key in the API's growth numbers. */
  slug: string;
  group: ProjectGroup;
  /** Which country of the journey it stands in. */
  zone: Exclude<ZoneId, 'night'>;
  name: string;
  /** One line beside the place. At most 60 characters. */
  line: string;
  /** What the label beside the place says while the pointer is on it: where you would be stepping. */
  hover: string;
  /** What is written on the paper inside the place, one string per paragraph. */
  inside: string[];
  /** A small aside under the text. */
  note?: string;
  link?: ProjectLink;
}

export interface Zone {
  id: ZoneId;
  /** Spoken name of the stretch, for screen readers. */
  label: string;
  /** The word on the horizon bar. */
  short: string;
}

export interface SiteCopy {
  title: string;
  /** The name in the top corner. */
  mark: string;
  description: string;
  url: string;
  /** What the picture shown when the link is pasted somewhere is of (og:image:alt), before the greeting. */
  ogAlt: string;
  hero: { heading: string; line: string; walk: string };
  /** The small line under each place's words, by kind of project. */
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
}
