import type { SiteCopy } from './types';

export const SITE: SiteCopy = {
  title: 'Kaisar Turysbek: apps I build',
  mark: 'Kaisar Turysbek',
  description:
    'Projects by Kaisar Turysbek, an AI engineer in Kazakhstan: a phone-answering assistant, a finance assistant, a D&D tabletop, a history game and a few more.',
  url: 'https://kekaisik.dev/',
  ogAlt: 'A painting of a snowy summit above a sea of clouds at sunrise, with the words:',
  hero: {
    heading: "Hi, I'm Kaisar.",
    line: "I'm from Kazakhstan. I like building apps.",
    walk: 'Scroll to depart',
  },
  groups: { work: 'Work', play: 'Play' },
  source: { work: 'something I built for work', play: 'something I made for fun' },
  about: {
    heading: 'About',
    paragraphs: [
      "I'm Kaisar. I'm from Kazakhstan, I work remotely, and I speak Kazakh, Russian and English.",
      'I like building things someone will actually use: a shop owner who misses calls, a writer who loses track of their characters, friends who want to play D&D online. I break a lot of stuff on the way. Catan beat my AI in one day.',
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
  travelKeys: '↑ ↓ to travel',
  boardLabel: 'Places',
  switches: { label: 'Motion and sound', motion: 'Motion', sound: 'Sound' },
};

/** Everything a visitor can be told by the page itself (as opposed to by the API). */
export const MESSAGES = {
  /** what a screen reader hears when you arrive somewhere: "Kyoto. Kana Notebook." */
  arrived: (place: string, title: string): string => `${place}. ${title}.`,
  /** a board row, read aloud: "07 Kyoto: Kana Notebook, LIVE" */
  row: (n: string, place: string, title: string, status: string): string => `${n} ${place}: ${title}, ${status}`,
  /** the phone's bottom bar, read aloud */
  barLabel: (n: string, place: string, title: string): string => `${SITE.boardLabel}. Now at ${n} ${place}, ${title}`,
  read: 'Read',
  readLabel: (name: string): string => `Read about ${name}`,
  close: 'Close',
  watch: 'Watch',
  /** read aloud between "Watch" and the length */
  watchLabel: (name: string): string => ` the ${name} video,`,
  videoFailed: "the video didn't load",
  videoLoading: 'loading…',
  videoLabel: (name: string): string => `${name}, a short video`,
  /** the button in a world's words that opens its try where the spot in the painting cannot be shown */
  tryIt: 'Try it',
  /** a try's spot and its Try it button, read aloud: "Try Kana Notebook: read a card" */
  tryLabel: (name: string, spot: string): string => `Try ${name}: ${spot}`,
  /** what a choice in a try turned out to be, in words beside it (never colour alone) */
  marks: { right: 'right', wrong: 'not this one', chosen: 'your choice', fine: 'fine', found: 'this one' },
  /** the footer clock, for a room that is nowhere in particular */
  yourTime: 'your time',
  newTab: ' (opens in a new tab)',
  lightLantern: 'Light a lantern',
  lanterns: (n: number): string => (n < 1 ? '' : n < 2 ? '1 lantern lit.' : `${Math.floor(n)} lanterns lit.`),
  note: {
    heading: 'Leave a note',
    text: 'Your note',
    name: 'Your name',
    nameHint: '(if you like)',
    contact: 'Where can I answer?',
    contactHint: '(only if you want an answer)',
    done: 'Sent. Thank you, I read every note.',
    empty: 'Write something first.',
    tooLong: 'That is too long. A note can be 600 characters and a name 60.',
    rateLimited: "That's a lot of notes. Try again in an hour, or email me instead.",
    failed: "It didn't go through. Write me instead: ",
    send: 'send it',
    sending: 'sending…',
  },
} as const;
