/**
 * What moves in each world's painting. Authored by looking at each picture with a 10x10 grid over it: a region
 * stops short of anything solid (a ridge, a rock, a wall), because a moving edge on a still thing reads as a wobble.
 * Quiet and real beats busy: if a move looks fake, make it smaller or take it out. Nothing is pushed by wind: a
 * painting's own pixels dragged across it read as a smear, so cloud, grass, leaves and fog stay still; light, stars,
 * water and the particles of looks.ts are what moves.
 * See the README ("Make a place move") for how to add or tune one.
 */
import type { Scene } from './scene';

export const SCENES: Readonly<Record<string, Scene>> = {
  /* the painting stays still; only the snow carried off the top moves (looks.ts) */
  hello: {},

  /* the booth's light breathes, on the wet road too; the road's reflection shimmers; a few stars */
  'front-desk': {
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.61, 0.79],
              [0.75, 0.79],
              [0.78, 0.96],
              [0.6, 0.98],
            ],
          },
          feather: 0.04,
          amount: 0.7,
        },
      ],
      size: 0.0022,
      speed: 0.05,
    },
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [0.88, -0.1],
            [0.88, 0.07],
            [0.72, 0.08],
            [0.62, 0.16],
            [0.5, 0.23],
            [0.3, 0.3],
            [-0.1, 0.33],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.678, 0.6], radius: 0.12, amount: 0.07, speed: 0.9, seed: 0, kind: 'breathe' },
      { at: [0.678, 0.86], radius: 0.1, amount: 0.08, speed: 0.9, seed: 0, kind: 'breathe' },
    ],
  },

  /* the stars twinkle; the lamp in the dome and the windows breathe */
  'numbers-room': {
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [1.1, -0.1],
            [1.1, 0.28],
            [0.86, 0.27],
            [0.8, 0.19],
            [0.74, 0.16],
            [0.62, 0.17],
            [0.56, 0.22],
            [0.53, 0.3],
            [0.5, 0.36],
            [-0.1, 0.38],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.66, 0.33], radius: 0.08, amount: 0.12, speed: 1.3, seed: 2, kind: 'breathe' },
      { at: [0.862, 0.545], radius: 0.05, amount: 0.1, speed: 1.1, seed: 6, kind: 'breathe' },
      { at: [0.915, 0.55], radius: 0.035, amount: 0.1, speed: 1.1, seed: 6, kind: 'breathe' },
      { at: [0.726, 0.535], radius: 0.025, amount: 0.1, speed: 1.4, seed: 9, kind: 'breathe' },
    ],
  },

  /* the painting stays still; dust hangs in the light (looks.ts) */
  lowl: {},

  /* the gold glints and glows under the dragon; the wizard's staff burns; the water at the cave mouth never sits
     still; sparks rise off the hoard (looks.ts) */
  emberquill: {
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.75],
              [0.2, 0.735],
              [0.235, 0.8],
              [0.19, 0.865],
              [-0.1, 0.9],
            ],
          },
          feather: 0.03,
          /* the rock standing in the water */
          minus: [{ kind: 'ellipse', at: [0.05, 0.8], rx: 0.055, ry: 0.035 }],
          amount: 0.7,
        },
      ],
      size: 0.0025,
      speed: 0.05,
    },
    /* the coins' highlights twinkle; the party stands in front of them */
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [0.25, 0.61],
            [0.45, 0.565],
            [0.75, 0.555],
            [0.98, 0.6],
            [0.98, 0.72],
            [0.72, 0.72],
            [0.7, 0.66],
            [0.25, 0.67],
          ],
        },
        feather: 0.02,
        minus: [
          {
            kind: 'poly',
            points: [
              [0.39, 0.58],
              [0.7, 0.575],
              [0.7, 0.8],
              [0.39, 0.8],
            ],
          },
        ],
        amount: 1,
      },
    ],
    lights: [
      { at: [0.545, 0.553], radius: 0.035, amount: 0.2, speed: 2.2, seed: 5, kind: 'breathe' },
      { at: [0.6, 0.6], radius: 0.22, amount: 0.07, speed: 3.2, seed: 1, kind: 'flicker' },
      { at: [0.84, 0.6], radius: 0.2, amount: 0.07, speed: 2.7, seed: 7, kind: 'flicker' },
      { at: [0.69, 0.305], radius: 0.012, amount: 0.15, speed: 0.8, seed: 3, kind: 'breathe' },
    ],
  },

  /* the brazier's flame flickers and throws its light on the marble round it; dust hangs in the light (looks.ts) */
  'history-lens': {
    lights: [
      { at: [0.93, 0.655], radius: 0.045, amount: 0.18, speed: 7, seed: 3, kind: 'flicker' },
      { at: [0.925, 0.69], radius: 0.16, amount: 0.06, speed: 7, seed: 3, kind: 'flicker' },
    ],
  },

  /* the waterfall pours off the page into the cloud; the harbour water shimmers */
  bookforge: {
    flow: {
      cycle: 4,
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.797, 0.71],
              [0.845, 0.71],
              [0.868, 0.8],
              [0.884, 0.95],
              [0.88, 1.1],
              [0.81, 1.1],
              [0.8, 0.86],
            ],
          },
          feather: 0.015,
          dir: [0, 0.03],
        },
      ],
    },
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.68, 0.575],
              [0.88, 0.575],
              [0.88, 0.64],
              [0.68, 0.64],
            ],
          },
          feather: 0.015,
          /* the ships stay still on it */
          minus: [
            { kind: 'ellipse', at: [0.735, 0.585], rx: 0.025, ry: 0.03 },
            { kind: 'ellipse', at: [0.83, 0.6], rx: 0.04, ry: 0.04 },
          ],
          amount: 0.6,
        },
      ],
      size: 0.0018,
      speed: 0.05,
    },
  },

  /* the wet stones shimmer; the lanterns breathe; petals drift down from the blossom (looks.ts) */
  'kana-notebook': {
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.6, 0.72],
              [0.67, 0.72],
              [0.72, 0.8],
              [0.8, 0.9],
              [0.86, 1.1],
              [0.38, 1.1],
              [0.45, 0.95],
              [0.53, 0.82],
            ],
          },
          feather: 0.03,
          amount: 1,
        },
      ],
      size: 0.002,
      speed: 0.07,
    },
    lights: [
      { at: [0.875, 0.435], radius: 0.08, amount: 0.08, speed: 1.1, seed: 0, kind: 'breathe' },
      { at: [0.548, 0.66], radius: 0.025, amount: 0.1, speed: 1.4, seed: 5, kind: 'breathe' },
      { at: [0.7, 0.62], radius: 0.025, amount: 0.1, speed: 1.7, seed: 9, kind: 'breathe' },
      { at: [0.69, 0.41], radius: 0.05, amount: 0.08, speed: 1.2, seed: 12, kind: 'breathe' },
      { at: [0.65, 0.86], radius: 0.1, amount: 0.06, speed: 1.4, seed: 5, kind: 'breathe' },
    ],
  },

  /* the painting stays still; seeds hang in the low sun over the grass (looks.ts) */
  about: {},

  /* the fire flickers and throws light on the chairs and the crate; sparks (looks.ts); the stars twinkle */
  contact: {
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [1.1, -0.1],
            [1.1, 0.47],
            [0.6, 0.495],
            [-0.1, 0.525],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.59, 0.7], radius: 0.3, amount: 0.12, speed: 8, seed: 2, kind: 'flicker' },
      { at: [0.59, 0.66], radius: 0.07, amount: 0.1, speed: 11, seed: 8, kind: 'flicker' },
    ],
  },
};

/** What moves in a world's painting; a world without a scene is a build mistake. */
export function sceneOf(id: string): Scene {
  if (!Object.hasOwn(SCENES, id))
    throw new Error(`No scene for the world "${id}": add one to SCENES in src/living/scenes.ts.`);
  return SCENES[id];
}

/** Does nothing move inside this painting? Then the living canvas is not drawn at all for it. */
export function isStill(scene: Scene): boolean {
  return !scene.flow?.regions.length && !scene.shimmer?.regions.length && !scene.stars?.length && !scene.lights?.length;
}
