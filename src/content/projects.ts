import type { Project } from './types';

const EMAIL = 'mailto:kaisar.turysbek@gmail.com';

/**
 * The seven places, in the order of the board.
 * Adding a project = one entry here, its place in src/content/places.ts and its painting (see the README).
 * Slugs are public: they are #links, video file names and the keys of the API's growth numbers. Don't rename them lightly.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'front-desk',
    group: 'work',
    name: 'The Front Desk',
    line: 'An AI that picks up the phone.',
    inside: [
      "It answers the phone for a small business and books appointments. It looks at the real calendar, remembers people who have called before, and passes the call to a human when it can't help. Most of my time went into the scheduling rules: staff hours, gaps between jobs, daylight saving, and two callers who want the same slot.",
    ],
    note: "I built it for a client, so I can't name them.",
    link: { href: EMAIL, label: "It's private. Write me and I'll show you how it works.", external: false },
  },
  {
    slug: 'numbers-room',
    group: 'work',
    name: 'The Numbers Room',
    line: 'A finance assistant in the team chat.',
    inside: [
      'Her name is Abby. People mention her in the team chat and ask about their budget in plain words. She answers in the thread from the company database, with a chart and the Excel and PDF files to back it up.',
      'The AI never does the sums. Ordinary tested code calculates every number, and the AI writes the sentences around them. Each channel can only reach the data it is allowed to see, a second model reads every answer before it is posted, and on Mondays she sends the weekly reports herself.',
    ],
    note: 'the video uses sample data.',
    link: { href: EMAIL, label: "The real one is private. Write me and I'll explain how it's built.", external: false },
  },
  {
    slug: 'lowl',
    group: 'work',
    name: 'LOWL',
    line: 'A website for a repair business.',
    inside: [
      "The business repairs home appliances. The site has a page for every service they offer, in Russian and English, so people who search Google for a repair can find them. It's the plainest project here, and it's in use.",
    ],
  },
  {
    slug: 'emberquill',
    group: 'play',
    name: 'Emberquill',
    line: 'A 3D tabletop for D&D fights.',
    inside: [
      "It runs in the browser. It knows the rules, plays the enemies, has a map builder, and lets friends join online with a human Dungeon Master. You can throw the furniture. I've restarted it from scratch more than once, and the old versions are still on my laptop.",
    ],
    link: {
      href: 'https://dnd-production-080b.up.railway.app',
      label: "It's live. Go break something.",
      external: true,
    },
  },
  {
    slug: 'history-lens',
    group: 'play',
    name: 'History Lens',
    line: 'Play a real person from history.',
    inside: [
      'You make their choices. In one story you are John Snow, tracing cholera through Soho in 1854. In another you are a servant carrying secret letters for Mary, Queen of Scots. At the end it shows which parts are in the historical record, which parts I made up, and which parts happened because of your choices.',
    ],
    note: 'five stories so far.',
  },
  {
    slug: 'bookforge',
    group: 'play',
    name: 'BookForge',
    line: 'A tool for writers of long stories.',
    inside: [
      "It keeps track of who knows what, where each character is, and which plot threads are still open. The AI works like an editor: it will tell you “this character couldn't know that yet”, and it never writes the book for you.",
    ],
    note: "I'm still building it.",
  },
  {
    slug: 'kana-notebook',
    group: 'play',
    name: 'Kana Notebook',
    line: 'A free app for learning Japanese.',
    inside: [
      "The lessons are in English and Russian: hiragana, words, grammar and review. Students can ask for what's missing and vote on what I add next.",
    ],
    link: { href: 'https://kana-notebook-production.up.railway.app', label: "It's live. Try it.", external: true },
  },
];

export const projectBySlug = (slug: string): Project | undefined => PROJECTS.find((p) => p.slug === slug);
