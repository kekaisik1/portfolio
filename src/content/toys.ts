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
    doves: 'Send up the doves',
  },
  bookforge: {
    page: 'Paint the drawn page',
    castle: 'Set off fireworks over the castle',
    pen: 'Light the pen',
    waterfall: 'Make a rainbow over the waterfall',
  },
  'kana-notebook': {
    lantern: 'Light the lantern',
    pagoda: 'Light the pagoda',
    cat: 'Call the cat',
    blossom: 'Shake the blossom',
  },
};

export const TOY_SAYS = {
  rolled: (n: number, sides: number): string => (n === sides ? `A natural ${n}.` : `You rolled ${n}.`),
};

/** A toy's label; a toy without one is a build mistake. */
export function toyLabel(world: string, toy: string): string {
  const label = Object.hasOwn(TOY_LABELS, world) ? TOY_LABELS[world][toy] : undefined;
  if (!label) throw new Error(`No label for the toy "${toy}" of "${world}": add one to src/content/toys.ts.`);
  return label;
}
