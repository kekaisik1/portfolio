import { projectBySlug } from './projects';
import type { ProjectLink, TryCopy } from './types';

/**
 * The "try it" of each project: a taste of it in one or two presses, from a spot in its painting (where that spot
 * stands is src/worlds/spots.ts; how each kind behaves is src/try/). Every word of them is here.
 * Kaisar's rule for these: pick something, then see what it meant. Plain words, nothing to learn first.
 */

const linkOf = (slug: string): ProjectLink | undefined => projectBySlug(slug)?.link;

/** A page of the live LOWL site (each one checked to exist when it was added). */
const lowlPage = (path: string, label: string): ProjectLink => ({
  href: `https://www.lowl.net${path}`,
  label,
  external: true,
});

export const TRIES: Readonly<Record<string, TryCopy>> = {
  'front-desk': {
    kind: 'call',
    spot: 'pick up',
    heading: 'An example call',
    mark: "This is an example call I wrote. There's no real caller, business or phone number in it.",
    pickUp: 'Pick up',
    lines: [
      { who: 'Caller', text: 'Hi, my dishwasher stopped draining. Can someone come out this week?' },
      { who: 'AI', text: 'Sorry to hear that. I can book a technician for you. Does Thursday between 10 and 12 work?' },
      { who: 'Caller', text: "Thursday's fine." },
      { who: 'AI', text: 'Done: Thursday, 10 to 12. Is there anything else I can help with?' },
    ],
    booked: 'Booked: Thursday, 10:00 to 12:00, dishwasher not draining.',
    end: 'The real one answers the phone for a business and books the visit while the caller is still on the line.',
  },
  'numbers-room': {
    kind: 'pick',
    mode: 'any',
    spot: 'ask it',
    heading: 'Ask it something',
    step: 'an example, with made-up numbers',
    intro: [],
    ask: 'Pick a question.',
    options: [
      {
        id: 'left',
        label: 'How much of the marketing budget is left?',
        result: [{ text: '18,400 of 60,000 is left: 31%.' }],
        meter: { value: 18_400, max: 60_000 },
      },
      {
        id: 'most',
        label: 'Which team spent the most this quarter?',
        result: [{ text: 'Engineering: 142,000, which is 46% of all spending.' }],
        meter: { value: 46, max: 100 },
      },
      {
        id: 'travel',
        label: 'Are we on track with travel this month?',
        result: [{ text: 'Not quite: 9,800 of 12,000 is spent, with 9 days still to go.' }],
        meter: { value: 9_800, max: 12_000 },
      },
    ],
    end: { text: "These numbers are made up. The real one answers from a team's own budget, in their chat." },
  },
  lowl: {
    kind: 'pick',
    mode: 'any',
    spot: 'what broke?',
    heading: 'What broke?',
    intro: [],
    ask: 'Pick one, and I will show you its page.',
    options: [
      {
        id: 'washer',
        label: 'Washing machine',
        result: [{ text: 'This is the page people land on when they search for a washer repair.' }],
        link: lowlPage('/services/washer-repair/', 'Washer repair on lowl.net'),
      },
      {
        id: 'fridge',
        label: 'Fridge',
        result: [{ text: 'This is the page people land on when they search for a fridge repair.' }],
        link: lowlPage('/services/refrigerator-repair/', 'Refrigerator repair on lowl.net'),
      },
      {
        id: 'oven',
        label: 'Oven',
        result: [{ text: 'This is the page people land on when they search for an oven repair.' }],
        link: lowlPage('/services/oven-repair/', 'Oven repair on lowl.net'),
      },
    ],
  },
  emberquill: {
    kind: 'fight',
    spot: 'roll the die',
    heading: 'Roll to hit',
    intro: 'Your fighter swings a longsword at an orc: +5 to hit, 1d8 + 3 damage. The orc has AC 13 and 15 hit points.',
    enemy: 'Orc',
    ac: 13,
    hp: 15,
    toHit: 5,
    damage: { count: 1, sides: 8, bonus: 3 },
    roll: 'Roll the d20',
    sum: (d20, bonus, total, ac) => `${d20} + ${bonus} = ${total} vs AC ${ac}`,
    hit: (damage) => `hit, ${damage} damage`,
    crit: (damage) => `a natural 20: a critical hit, the damage dice twice, ${damage} damage`,
    miss: 'miss',
    fumble: 'a natural 1: a miss, whatever the bonus',
    hpText: (hp, max) => `Orc: ${hp} of ${max} hit points`,
    down: (rolls) =>
      `The orc is down, in ${rolls} ${rolls === 1 ? 'roll' : 'rolls'}. Emberquill does this maths for every roll at the table.`,
    link: linkOf('emberquill'),
  },
  /* the scene, the choices and what followed are History Lens's own text (its Broad Street, 1854 story: the
     Board of Guardians scene, the "remedy" decision and its endings), shortened; the tags are the app's own labels */
  'history-lens': {
    kind: 'pick',
    mode: 'once',
    spot: 'make a choice',
    heading: 'You are John Snow',
    step: 'Soho, London, September 1854',
    intro: [
      {
        tag: 'Reconstructed',
        text: 'A long table, a green cloth, the gas turned low, a clerk with a minute-book. The chairman gives you the floor. First, tell them what you ask.',
      },
    ],
    ask: 'What do you ask the Board to do?',
    options: [
      {
        id: 'handle',
        label: 'Ask them to take the handle off the pump',
        result: [
          {
            tag: 'Documented',
            text: 'Friday 8 September. The parish has the handle taken off the Broad Street pump. Nobody records who did it, and nobody cheers.',
          },
        ],
      },
      {
        id: 'warning',
        label: 'Ask them to post a warning on the pump',
        result: [
          {
            tag: 'Your outcome',
            text: 'On Friday a printed notice is pasted to the pump: the water is suspected. The handle stays on, and by dinner-time the pump is busy again.',
          },
        ],
      },
      {
        id: 'well',
        label: 'Ask them to close and fill the well',
        result: [
          {
            tag: 'Your outcome',
            text: 'No one will dig up a public street on one evening’s argument, the chairman says. But no member objects to the handle being taken off the pump in the morning.',
          },
        ],
      },
    ],
    end: {
      tag: 'History',
      text: 'What Snow asked for is not recorded. He says only that he “represented the above circumstances” to the Board, and that the handle was removed the next day.',
    },
  },
  bookforge: {
    kind: 'pick',
    mode: 'find',
    spot: 'be the editor',
    heading: 'Be the editor',
    step: 'chapter 3 of a made-up story',
    intro: [],
    ask: 'One of these lines can’t be right yet. Press it.',
    options: [
      { id: 'waits', label: 'Mara waits at the station for her brother, who is late again.', result: [] },
      { id: 'coffee', label: 'She buys two coffees and drinks both while she waits.', result: [] },
      {
        id: 'knows',
        label: 'She already knows why he’s late: the letter told her.',
        target: true,
        result: [{ tag: 'Editor’s note', text: 'She can’t know that yet: the letter arrives two chapters later.' }],
      },
      { id: 'train', label: 'When the train comes in, he isn’t on it.', result: [] },
    ],
    fine: 'That one is fine.',
    end: {
      text: 'BookForge catches this because it keeps track of who knows what, and when. The fix is yours to write.',
    },
  },
  'kana-notebook': {
    kind: 'kana',
    spot: 'read a card',
    heading: 'Read three cards',
    cards: [
      { kana: 'き', romaji: 'ki', choices: ['sa', 'ki', 'chi'] },
      { kana: 'ぬ', romaji: 'nu', choices: ['me', 'ne', 'nu'] },
      { kana: 'あ', romaji: 'a', choices: ['a', 'o', 'e'] },
    ],
    step: (n, of) => `card ${n} of ${of}`,
    cardLabel: (n) => `Card ${n}: a hiragana character`,
    right: (kana, romaji) => `Right: ${kana} is ${romaji}.`,
    wrong: (kana, romaji) => `Not this one: ${kana} is ${romaji}.`,
    next: 'Next card',
    score: (right, of) => `${right} of ${of}.`,
    end: 'The app has the other 43, then words and grammar.',
    link: linkOf('kana-notebook'),
  },
};

/** A project's try, or null when it has none. */
export const tryOf = (slug: string): TryCopy | null => (Object.hasOwn(TRIES, slug) ? TRIES[slug] : null);
