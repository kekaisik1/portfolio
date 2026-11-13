/**
 * What moves in each world's painting. Authored by looking at each picture with a 10x10 grid over it: a region
 * stops short of anything solid (a ridge, a rock, a wall), because a moving edge on a still thing reads as a wobble.
 * Quiet and real beats busy: if a move looks fake, make it smaller or take it out.
 * See the README ("Make a place move") for how to add or tune one.
 */
import type { Scene } from './scene';

export const SCENES: Readonly<Record<string, Scene>> = {
  /* the cloud sea flows slowly under the ridge; the plume off the top drifts; snow is carried off it (looks.ts) */
  hello: {
    cycle: 11,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, 0.54],
            [0.14, 0.53],
            [0.3, 0.555],
            [0.35, 0.59],
            [0.385, 0.625],
            [0.43, 0.65],
            [0.39, 0.685],
            [0.33, 0.725],
            [0.26, 0.78],
            [0.19, 0.84],
            [0.12, 0.9],
            [0.05, 0.96],
            [-0.1, 1.05],
          ],
        },
        feather: 0.04,
        dir: [0.03, 0.003],
        /* far cloud near the horizon moves less than the cloud under the ridge */
        ramp: { from: [0.2, 0.54], to: [0.2, 0.9], a: 0.35, b: 1 },
      },
      /* the far cloud sea right of the summit, under the sun */
      {
        shape: {
          kind: 'poly',
          points: [
            [0.845, 0.47],
            [1.1, 0.46],
            [1.1, 0.56],
            [0.965, 0.575],
            [0.9, 0.53],
          ],
        },
        feather: 0.025,
        dir: [0.012, 0.001],
      },
    ],
    mist: {
      regions: [{ shape: { kind: 'ellipse', at: [0.672, 0.262], rx: 0.07, ry: 0.04 }, feather: 0.035, amount: 0.3 }],
      rgb: [1, 0.95, 0.92],
      drift: [-0.014, -0.003],
      scale: 2.2,
    },
  },

  /* mist drifts along the valley under the peaks; the booth's light breathes on the wet road; a few stars */
  'front-desk': {
    cycle: 10,
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.5],
              [0.35, 0.5],
              [0.6, 0.53],
              [0.6, 0.6],
              [0.45, 0.66],
              [0.3, 0.72],
              [0.26, 0.77],
              [-0.1, 0.8],
            ],
          },
          feather: 0.08,
          amount: 0.45,
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [0.6, 0.41],
              [0.9, 0.4],
              [0.9, 0.48],
              [0.6, 0.5],
            ],
          },
          feather: 0.035,
          amount: 0.3,
        },
      ],
      rgb: [0.6, 0.64, 0.82],
      drift: [0.012, 0.001],
      scale: 1.5,
    },
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

  /* the cloud sea flows below the summit; the stars twinkle; the lamp in the dome and the windows breathe */
  'numbers-room': {
    cycle: 12,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            /* under the far peaks, then down along the foot of the cliff */
            [-0.1, 0.655],
            [0.09, 0.648],
            [0.28, 0.648],
            [0.33, 0.622],
            [0.42, 0.618],
            [0.405, 0.655],
            [0.37, 0.7],
            [0.34, 0.75],
            [0.31, 0.8],
            [0.255, 0.85],
            [0.2, 0.9],
            [0.16, 0.95],
            [-0.1, 1.1],
          ],
        },
        feather: 0.03,
        dir: [0.028, 0.002],
        ramp: { from: [0.2, 0.64], to: [0.2, 0.95], a: 0.35, b: 1 },
      },
    ],
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

  /* the palm crowns stir, and with them their dappled shadow on the shop wall; dust hangs in the light (looks.ts) */
  lowl: {
    cycle: 10,
    sway: {
      regions: [
        { shape: { kind: 'ellipse', at: [0.372, 0.085], rx: 0.15, ry: 0.1 }, feather: 0.07, dir: [0.0032, 0.0014] },
        { shape: { kind: 'ellipse', at: [0.322, 0.325], rx: 0.09, ry: 0.065 }, feather: 0.05, dir: [0.0018, 0.0007] },
        { shape: { kind: 'ellipse', at: [0.24, 0.475], rx: 0.06, ry: 0.045 }, feather: 0.035, dir: [0.0016, 0.0006] },
        { shape: { kind: 'ellipse', at: [0.94, 0.165], rx: 0.11, ry: 0.09 }, feather: 0.06, dir: [0.0026, 0.0012] },
        /* the fronds' shadow on the wall over the door: sideways only, so the coping and the door's top stay straight */
        {
          shape: {
            kind: 'poly',
            points: [
              [0.425, 0.455],
              [0.72, 0.45],
              [0.72, 0.485],
              [0.425, 0.49],
            ],
          },
          feather: 0.012,
          dir: [0.0028, 0],
        },
      ],
      rate: 1.1,
      wave: [9, 5],
    },
  },

  /* the gold glints and glows under the dragon; the wizard's staff burns; light hangs in the shafts; the water
     at the cave mouth never sits still; sparks rise off the hoard (looks.ts) */
  emberquill: {
    cycle: 9,
    mist: {
      regions: [
        /* the cave's teal haze, left */
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.05],
              [0.19, 0.08],
              [0.21, 0.4],
              [0.19, 0.7],
              [-0.1, 0.72],
            ],
          },
          feather: 0.08,
          amount: 0.3,
        },
        /* the shaft of daylight between the arches */
        {
          shape: {
            kind: 'poly',
            points: [
              [0.53, -0.1],
              [0.61, -0.1],
              [0.62, 0.2],
              [0.565, 0.24],
            ],
          },
          feather: 0.025,
          amount: 0.25,
        },
      ],
      rgb: [0.86, 0.96, 0.92],
      drift: [0.004, 0.008],
      scale: 1.8,
    },
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

  /* fog drifts down the far street and low over the cobbles; the wet stones shimmer; the gas lamps flicker */
  'history-lens': {
    cycle: 10,
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.2],
              [0.28, 0.24],
              [0.38, 0.36],
              [0.38, 0.66],
              [0.3, 0.7],
              [-0.1, 0.74],
            ],
          },
          feather: 0.08,
          amount: 0.45,
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.66],
              [0.4, 0.66],
              [0.52, 0.7],
              [0.42, 0.8],
              [-0.1, 0.86],
            ],
          },
          feather: 0.07,
          amount: 0.25,
        },
      ],
      rgb: [0.74, 0.74, 0.84],
      drift: [-0.01, 0.002],
      scale: 1.7,
    },
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.72],
              [0.4, 0.7],
              [0.5, 0.71],
              [0.445, 0.78],
              [0.445, 0.85],
              [0.5, 0.92],
              [0.58, 1.1],
              [-0.1, 1.1],
            ],
          },
          feather: 0.03,
          amount: 0.8,
        },
      ],
      size: 0.0028,
      speed: 0.06,
    },
    lights: [
      { at: [0.655, 0.22], radius: 0.09, amount: 0.12, speed: 4.6, seed: 3, kind: 'flicker' },
      { at: [0.41, 0.45], radius: 0.04, amount: 0.12, speed: 5.2, seed: 7, kind: 'flicker' },
      { at: [0.305, 0.54], radius: 0.025, amount: 0.12, speed: 5.8, seed: 11, kind: 'flicker' },
      { at: [0.4, 0.82], radius: 0.1, amount: 0.06, speed: 5.2, seed: 7, kind: 'flicker' },
      { at: [0.9, 0.42], radius: 0.1, amount: 0.07, speed: 1, seed: 17, kind: 'breathe' },
    ],
  },

  /* the waterfall pours off the page into the cloud; the harbour water shimmers; cloud drifts in the valley
     and under the hill; the loose pages flutter; wind runs through the grass */
  bookforge: {
    cycle: 4,
    flow: [
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
    sway: {
      regions: [
        /* the pages lifting off the book, on their way to being birds */
        { shape: { kind: 'ellipse', at: [0.288, 0.35], rx: 0.07, ry: 0.13 }, feather: 0.05, dir: [0.0018, 0.0026] },
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.79],
              [0.14, 0.77],
              [0.3, 0.79],
              [0.26, 0.84],
              [0.36, 0.9],
              [0.45, 1.1],
              [-0.1, 1.1],
            ],
          },
          feather: 0.03,
          minus: [{ kind: 'ellipse', at: [0.3, 0.86], rx: 0.045, ry: 0.025 }],
          dir: [0.0045, 0.001],
          ramp: { from: [0.2, 0.78], to: [0.2, 1], a: 0.3, b: 1 },
        },
      ],
      rate: 1.4,
      wave: [12, 7],
    },
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.6, 0.86],
              [1.1, 0.82],
              [1.1, 1.1],
              [0.6, 1.1],
            ],
          },
          feather: 0.06,
          amount: 0.3,
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.55],
              [0.17, 0.55],
              [0.19, 0.62],
              [0.15, 0.72],
              [-0.1, 0.78],
            ],
          },
          feather: 0.05,
          amount: 0.3,
        },
      ],
      rgb: [0.95, 0.93, 0.96],
      drift: [0.008, 0],
      scale: 1.6,
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

  /* the wet stones shimmer; the big lantern and the noren stir; the lanterns breathe; mist lies on the hills;
     petals drift down from the blossom (looks.ts) */
  'kana-notebook': {
    cycle: 10,
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
      size: 0.003,
      speed: 0.07,
    },
    sway: {
      regions: [
        { shape: { kind: 'ellipse', at: [0.875, 0.435], rx: 0.05, ry: 0.06 }, feather: 0.03, dir: [0.0016, 0.0002] },
        {
          shape: {
            kind: 'poly',
            points: [
              [0.795, 0.53],
              [0.9, 0.53],
              [0.9, 0.7],
              [0.795, 0.7],
            ],
          },
          feather: 0.02,
          dir: [0.0018, 0],
        },
        /* the blossom over the street, clear of the pagoda's spire */
        { shape: { kind: 'ellipse', at: [0.5, 0.16], rx: 0.13, ry: 0.11 }, feather: 0.07, dir: [0.0014, 0.0008] },
      ],
      rate: 0.9,
      wave: [3, 2],
    },
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.48],
              [0.2, 0.5],
              [0.34, 0.6],
              [0.3, 0.72],
              [0.2, 0.9],
              [-0.1, 0.95],
            ],
          },
          feather: 0.08,
          amount: 0.35,
        },
      ],
      rgb: [0.78, 0.74, 0.9],
      drift: [0.008, 0],
      scale: 1.5,
    },
    lights: [
      { at: [0.875, 0.435], radius: 0.08, amount: 0.08, speed: 1.1, seed: 0, kind: 'breathe' },
      { at: [0.548, 0.66], radius: 0.025, amount: 0.1, speed: 1.4, seed: 5, kind: 'breathe' },
      { at: [0.7, 0.62], radius: 0.025, amount: 0.1, speed: 1.7, seed: 9, kind: 'breathe' },
      { at: [0.69, 0.41], radius: 0.05, amount: 0.08, speed: 1.2, seed: 12, kind: 'breathe' },
      { at: [0.65, 0.86], radius: 0.1, amount: 0.06, speed: 1.4, seed: 5, kind: 'breathe' },
    ],
  },

  /* wind runs through the grass; the cloud drifts over the mountains */
  about: {
    cycle: 14,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [1.1, -0.1],
            [1.1, 0.36],
            [0.9, 0.36],
            [0.8, 0.34],
            [0.72, 0.29],
            [0.66, 0.275],
            [0.6, 0.34],
            [0.45, 0.41],
            [0.3, 0.44],
            [0.15, 0.46],
            [-0.1, 0.47],
          ],
        },
        feather: 0.06,
        dir: [0.022, -0.002],
      },
    ],
    sway: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.64, 0.64],
              [1.1, 0.6],
              [1.1, 1.1],
              [0.58, 1.1],
              [0.565, 0.85],
              [0.6, 0.73],
            ],
          },
          feather: 0.03,
          dir: [0.0055, 0.0012],
          ramp: { from: [0.8, 0.62], to: [0.8, 0.95], a: 0.15, b: 1 },
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.69],
              [0.42, 0.67],
              [0.34, 0.75],
              [0.24, 0.83],
              [0.15, 0.92],
              [0.08, 1.1],
              [-0.1, 1.1],
            ],
          },
          feather: 0.03,
          dir: [0.0045, 0.001],
          ramp: { from: [0.2, 0.68], to: [0.2, 0.98], a: 0.15, b: 1 },
        },
      ],
      rate: 1.7,
      wave: [16, 9],
    },
  },

  /* the fire climbs and throws light on the chairs and the crate; sparks (looks.ts); the stars twinkle;
     the grass on the left stirs */
  contact: {
    cycle: 1.6,
    flow: [{ shape: { kind: 'ellipse', at: [0.59, 0.655], rx: 0.035, ry: 0.045 }, feather: 0.025, dir: [0, -0.03] }],
    sway: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.63],
              [0.32, 0.62],
              [0.33, 0.86],
              [-0.1, 0.9],
            ],
          },
          feather: 0.03,
          dir: [0.003, 0.0006],
        },
      ],
      rate: 1.3,
      wave: [12, 6],
    },
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

/** What moves in a world's photograph; a world without a scene is a build mistake. */
export function sceneOf(id: string): Scene {
  if (!Object.hasOwn(SCENES, id))
    throw new Error(`No scene for the world "${id}": add one to SCENES in src/living/scenes.ts.`);
  return SCENES[id];
}
