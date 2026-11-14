/**
 * The words of the toys (src/worlds/toys.ts): what a screen reader hears on each thing in a painting that answers a
 * press, and what it is told after one. Nothing here is shown on the painting except a thrown die's number.
 */
export const TOY_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  emberquill: {
    dragon: 'Wake the dragon',
    gold: 'Stir the gold',
    chest: 'Open the chest',
    archer: 'Loose an arrow',
    staff: "Light the wizard's staff",
    die: 'Throw the die',
  },
  'front-desk': {
    booth: 'Open the booth',
    fox: 'Call the fox',
    car: 'Bring a car up the road',
    aurora: 'Light the northern lights',
  },
  'numbers-room': {
    telescope: 'Turn the telescope on the stars',
    building: 'Light the windows',
    comet: 'Wait for a comet',
  },
  lowl: {
    washer: 'Open the washing machine',
    fridge: 'Open the fridge',
    lamp: 'Switch on the lamp',
    palm: 'Wake the parrots in the palm',
  },
  'history-lens': {
    brazier: 'Stoke the brazier',
    legion: 'March the legion through the arch',
    temple: 'Open the temple doors',
    you: 'Stand at the rail',
    now: 'See the Forum today',
    doves: 'Send up the doves',
  },
  bookforge: {
    page: 'Paint the drawn page',
    castle: 'Set off fireworks over the castle',
    pen: 'Light the pen',
    threads: 'Tie the characters together',
    editor: 'Put a ship on the mountain',
    tether: 'Light the island’s tether',
    waterfall: 'Make a rainbow over the waterfall',
  },
  'kana-notebook': {
    lantern: 'Light the lantern',
    pagoda: 'Light the pagoda',
    cat: 'Call the cat',
    blossom: 'Shake the blossom',
  },
};

/**
 * What an easter egg says when it is pressed: the idea of the project it stands for, in a few plain words. Shown as
 * a small chip beside the thing and told to a screen reader. Only toys with a `note` in src/worlds/toys.ts have one.
 */
export const TOY_NOTES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  /* the three kinds of thing the app tells apart at the end of a story, and who you are in it */
  'history-lens': {
    legion: 'In the record: triumphs came down this road.',
    doves: 'Made up: the doves.',
    temple: 'Made up: what is behind the doors.',
    brazier: 'Your choice: you stoked the fire.',
    you: 'You play someone who was really there.',
    now: 'The same terrace, today.',
  },
  bookforge: {
    threads: 'It keeps track of where every character is.',
    editor: 'The editor circles what can’t be true yet.',
    tether: 'A plot thread still open.',
    pen: 'It never writes the book for you.',
  },
};

/** A toy's note; a toy with a place for a note and no words is a build mistake. */
export function toyNote(world: string, toy: string): string {
  const note = Object.hasOwn(TOY_NOTES, world) ? TOY_NOTES[world][toy] : undefined;
  if (!note)
    throw new Error(`No note for the toy "${toy}" of "${world}": add one to TOY_NOTES in src/content/toys.ts.`);
  return note;
}

export const TOY_SAYS = {
  rolled: (n: number, sides: number): string => (n === sides ? `A natural ${n}.` : `You rolled ${n}.`),
};

/** A toy's label; a toy without one is a build mistake. */
export function toyLabel(world: string, toy: string): string {
  const label = Object.hasOwn(TOY_LABELS, world) ? TOY_LABELS[world][toy] : undefined;
  if (!label) throw new Error(`No label for the toy "${toy}" of "${world}": add one to src/content/toys.ts.`);
  return label;
}
