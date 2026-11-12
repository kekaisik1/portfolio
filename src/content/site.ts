import type { SiteCopy, Zone } from './types';

export const ZONES: readonly Zone[] = [
  { id: 'mountains', label: 'In the mountains', short: 'mountains' },
  { id: 'steppe', label: 'On the steppe', short: 'steppe' },
  { id: 'sea', label: 'By the sea', short: 'sea' },
  { id: 'night', label: 'At night: about and contact', short: 'night' },
];

export const SITE: SiteCopy = {
  title: 'Kaisar — I build things with computers',
  mark: 'Kaisar Turysbek',
  description: 'Kaisar builds things with computers in Kazakhstan. Seven of them are places you can walk into.',
  url: 'https://kekaisik1.github.io/portfolio/',
  ogAlt: 'A watercolour of snowy mountains, spruce and a wooden hut on pale paper, with the words:',
  hero: {
    heading: "Hi, I'm Kaisar.",
    line: 'I live in Kazakhstan and I build things with computers.',
    walk: 'Scroll to walk in',
  },
  source: { work: 'something I built for work', play: 'something I made for fun' },
  about: {
    heading: 'About',
    paragraphs: [
      "I'm Kaisar. I'm from Kazakhstan, I work remotely, and I speak Kazakh, Russian and English.",
      'I like building things that help real people — a business owner who misses calls, a writer who loses track of their characters, friends who want to play D&D online. I break a lot of stuff on the way. Catan beat my AI in one day.',
    ],
  },
  contact: {
    heading: 'Write me',
    email: 'kaisar.turysbek@gmail.com',
    writeMe: 'write me',
    leaveNote: 'or leave a note',
    links: [
      { href: 'https://t.me/kekaisik', label: 'Telegram @kekaisik', external: true },
      { href: 'https://github.com/kekaisik1', label: 'github.com/kekaisik1', external: true },
    ],
  },
  skip: 'Skip to the first place',
  travelHint: 'Arrow keys move between places.',
};

/** Everything a visitor can be told by the page itself (as opposed to by the API). */
export const MESSAGES = {
  goInside: (name: string): string => `Go inside ${name}`,
  backOutside: 'Back outside',
  /** what a screen reader hears when you arrive somewhere: "Steppe. LOWL." */
  arrived: (country: string, place: string): string => `${country[0].toUpperCase()}${country.slice(1)}. ${place}.`,
  noVideo: 'no video yet',
  videoFailed: "the video didn't load",
  videoLoading: 'loading…',
  videoLabel: (name: string): string => `${name}, a short video`,
  lightLantern: 'Light a lantern',
  lanterns: (n: number): string => (n < 1 ? '' : n < 2 ? '1 lantern lit.' : `${Math.floor(n)} lanterns lit.`),
  note: {
    empty: 'Write something first.',
    tooLong: 'That is too long for the paper: 600 characters for the note, 60 for the name.',
    rateLimited: "That's a lot of notes. Try again in an hour, or email me instead.",
    failed: "It didn't go through. Write me instead: ",
    send: 'send it',
    sending: 'sending…',
  },
} as const;
