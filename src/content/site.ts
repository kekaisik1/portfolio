import type { SiteCopy } from './types';

export const SITE: SiteCopy = {
  title: 'Kaisar — I build things with computers',
  mark: 'Kaisar Turysbek',
  description: 'Kaisar builds things with computers in Kazakhstan. Seven of them are places you can walk into.',
  url: 'https://kekaisik1.github.io/portfolio/',
  ogAlt: 'A snowy summit ridge above a sea of clouds at sunrise, with the words:',
  hero: {
    heading: "Hi, I'm Kaisar.",
    line: 'I live in Kazakhstan and I build things with computers.',
    walk: 'Scroll to depart',
  },
  groups: { work: 'Work', play: 'Play' },
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
    tooLong: 'That is too long for the paper: 600 characters for the note, 60 for the name.',
    rateLimited: "That's a lot of notes. Try again in an hour, or email me instead.",
    failed: "It didn't go through. Write me instead: ",
    send: 'send it',
    sending: 'sending…',
  },
} as const;
