import type { Project } from './types';

const EMAIL = 'mailto:kaisar.turysbek@gmail.com';

/**
 * The seven places, in the order you walk past them.
 * Adding a project = one entry here, one drawing in src/places/<slug>.ts and one room in src/rooms/<slug>.ts.
 * Slugs are public: they are #links, video file names and the keys of the API's growth numbers. Don't rename them lightly.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'front-desk',
    group: 'work',
    zone: 'mountains',
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
    zone: 'mountains',
    name: 'The Numbers Room',
    line: 'Ask your numbers a question.',
    inside: [
      "People ask about their numbers in plain words and it answers from their database. The part I'm proud of is boring: I don't let the AI do the math. The sums are ordinary checked code; the AI only explains the result.",
    ],
    link: { href: EMAIL, label: "Can't show this one. I can tell you how it's built.", external: false },
  },
  {
    slug: 'lowl',
    group: 'work',
    zone: 'steppe',
    name: 'LOWL',
    line: 'A repair shop people can find.',
    inside: [
      "A website for an appliance-repair business: lots of service pages so people can find them on Google, in Russian and English. Not glamorous. It's real, it's used.",
    ],
  },
  {
    slug: 'emberquill',
    group: 'play',
    zone: 'steppe',
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
    zone: 'sea',
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
    zone: 'sea',
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
    zone: 'sea',
    name: 'Kana Notebook',
    line: 'Learn Japanese, free.',
    inside: [
      "A small app for learning Japanese, in English and Russian: hiragana, words, grammar, review. Students can ask for what's missing and vote on it.",
    ],
    link: { href: 'https://kana-notebook-production.up.railway.app', label: "It's live.", external: true },
  },
];

export const projectBySlug = (slug: string): Project | undefined => PROJECTS.find((p) => p.slug === slug);
