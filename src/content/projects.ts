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
      "An AI that answers a small business's phone and books appointments, like a person at the front desk would. It checks the real calendar, remembers who called before, and hands the call to a human when it should. The hard part was never the AI talking. It was time: staff hours, buffers, daylight saving, two people trying to book the same slot.",
    ],
    note: 'built for a client, so no name.',
    link: { href: EMAIL, label: "Private — ask me and I'll walk you through it.", external: false },
  },
  {
    slug: 'numbers-room',
    group: 'work',
    name: 'The Numbers Room',
    line: 'Ask your numbers a question.',
    inside: [
      'Her name is Abby. People @mention her in the team chat, ask about the budget in plain words, and she answers in the thread from their database, with a chart and the Excel and PDF behind it.',
      "The part I'm proud of is boring: I don't let the AI do the math. The sums are ordinary checked code; the AI only writes the words around them. Each channel reaches only the data it's allowed to see, a second model reads every answer before it's posted, and on Mondays she sends the reports on her own.",
    ],
    note: 'the video runs on sample data.',
    link: { href: EMAIL, label: "The real one is private. I can tell you how it's built.", external: false },
  },
  {
    slug: 'lowl',
    group: 'work',
    name: 'LOWL',
    line: 'A repair shop people can find.',
    inside: [
      "A website for an appliance-repair business: lots of service pages so people can find them on Google, in Russian and English. Not glamorous. It's real, it's used.",
    ],
  },
  {
    slug: 'emberquill',
    group: 'play',
    name: 'Emberquill',
    line: 'A 3D tabletop for D&D fights.',
    inside: [
      'A little 3D tabletop in the browser: rules, enemy AI, a map builder, and online battles with a human Dungeon Master. You can throw furniture. I started it over more than once; the old folders are still on my laptop.',
    ],
    link: {
      href: 'https://dnd-production-080b.up.railway.app',
      label: "It's live — go break something.",
      external: true,
    },
  },
  {
    slug: 'history-lens',
    group: 'play',
    name: 'History Lens',
    line: 'Live a life from history.',
    inside: [
      "A history game where you live someone's life instead of reading about it. You're John Snow hunting cholera in Soho in 1854, or a servant smuggling letters for Mary, Queen of Scots. At the end it sets your story beside the historical record: what was documented, what I invented, and what only happened because of you.",
    ],
    note: 'five stories so far.',
  },
  {
    slug: 'bookforge',
    group: 'play',
    name: 'BookForge',
    line: 'Keep a whole story world straight.',
    inside: [
      "A place for writers to keep track of who knows what, who's where, and which plot threads are still open. The AI is an editor, not a ghostwriter: it says “this character couldn't know that yet”, but it never writes your book.",
    ],
    note: 'still building.',
  },
  {
    slug: 'kana-notebook',
    group: 'play',
    name: 'Kana Notebook',
    line: 'Learn Japanese, free.',
    inside: [
      "A small app for learning Japanese, in English and Russian: hiragana, words, grammar, review. Students can ask for what's missing and vote on it.",
    ],
    link: { href: 'https://kana-notebook-production.up.railway.app', label: "It's live.", external: true },
  },
];

export const projectBySlug = (slug: string): Project | undefined => PROJECTS.find((p) => p.slug === slug);
