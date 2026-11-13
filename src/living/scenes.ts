/**
 * What moves in each world's photograph. Authored by looking at each picture with a 10x10 grid over it: a region
 * stops short of anything solid (a ridge, a rock, a wall), because a moving edge on a still thing reads as a wobble.
 * Quiet and real beats busy: if a move looks fake, make it smaller or take it out.
 * See the README ("Make a place move") for how to add or tune one.
 */
import type { Scene } from './scene';

export const SCENES: Readonly<Record<string, Scene>> = {
  /* the cloud sea flows slowly past the ridge; the snow is carried off the crest by the particles (looks.ts) */
  hello: {
    cycle: 11,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, 0.425],
            [0.3, 0.42],
            [0.41, 0.432],
            [0.385, 0.47],
            [0.35, 0.52],
            [0.315, 0.575],
            [0.285, 0.62],
            [0.3, 0.68],
            [0.25, 0.75],
            [0.16, 0.82],
            [0.09, 0.9],
            [0.02, 0.98],
            [-0.1, 1.1],
          ],
        },
        feather: 0.045,
        /* the dark peaks that stand in the cloud stay still */
        minus: [{ kind: 'ellipse', at: [0.1, 0.6], rx: 0.2, ry: 0.035 }],
        dir: [0.034, 0.004],
        /* far cloud near the horizon moves less than the cloud below the ridge */
        ramp: { from: [0.2, 0.43], to: [0.2, 0.8], a: 0.3, b: 1 },
      },
    ],
  },

  /* mist drifts across the valley and the far road; the booth's light breathes; a few stars */
  'front-desk': {
    cycle: 10,
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.5],
              [0.3, 0.5],
              [0.6, 0.47],
              [0.6, 0.72],
              [0.42, 0.79],
              [-0.1, 0.8],
            ],
          },
          feather: 0.1,
          amount: 0.5,
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [0.6, 0.35],
              [1.1, 0.3],
              [1.1, 0.48],
              [0.78, 0.47],
              [0.6, 0.5],
            ],
          },
          feather: 0.05,
          amount: 0.34,
        },
      ],
      rgb: [0.56, 0.63, 0.76],
      drift: [0.012, 0.001],
      scale: 1.5,
    },
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [0.64, -0.1],
            [0.62, 0.13],
            [0.45, 0.24],
            [-0.1, 0.26],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.7, 0.58], radius: 0.3, amount: 0.07, speed: 0.9, seed: 0, kind: 'breathe' },
      { at: [0.705, 0.48], radius: 0.07, amount: 0.07, speed: 0.9, seed: 0, kind: 'breathe' },
    ],
  },

  /* the cloud sea flows below the summit; the stars twinkle; the lamp inside the dome breathes */
  'numbers-room': {
    cycle: 12,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, 0.735],
            [0.34, 0.73],
            [0.37, 0.705],
            [0.455, 0.705],
            [0.435, 0.745],
            [0.4, 0.775],
            [0.33, 0.785],
            [0.27, 0.805],
            [0.2, 0.845],
            [0.13, 0.885],
            [0.07, 0.925],
            [-0.1, 0.94],
          ],
        },
        feather: 0.03,
        dir: [0.03, 0.002],
        ramp: { from: [0.2, 0.7], to: [0.2, 0.92], a: 0.35, b: 1 },
      },
    ],
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [1.1, -0.1],
            [1.1, 0.5],
            [0.79, 0.5],
            [0.76, 0.4],
            [0.7, 0.33],
            [0.6, 0.33],
            [0.53, 0.41],
            [0.5, 0.52],
            [-0.1, 0.56],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [{ at: [0.608, 0.505], radius: 0.05, amount: 0.16, speed: 1.3, seed: 2, kind: 'breathe' }],
  },

  /* the palm crowns stir, and with them their shadow on the shop wall; dust hangs in the light (looks.ts) */
  lowl: {
    cycle: 10,
    sway: {
      regions: [
        { shape: { kind: 'ellipse', at: [0.905, 0.085], rx: 0.2, ry: 0.13 }, feather: 0.09, dir: [0.0034, 0.0016] },
        { shape: { kind: 'ellipse', at: [0.283, 0.265], rx: 0.13, ry: 0.075 }, feather: 0.06, dir: [0.0016, 0.0006] },
        { shape: { kind: 'ellipse', at: [0.152, 0.4], rx: 0.06, ry: 0.04 }, feather: 0.035, dir: [0.002, 0.0008] },
        /* the fronds' shadow on the wall: sideways only, so the lines of the blocks stay straight */
        {
          shape: {
            kind: 'poly',
            points: [
              [0.365, 0.43],
              [0.47, 0.43],
              [0.47, 0.72],
              [0.365, 0.72],
            ],
          },
          feather: 0.04,
          dir: [0.003, 0],
        },
        { shape: { kind: 'ellipse', at: [0.925, 0.74], rx: 0.085, ry: 0.085 }, feather: 0.06, dir: [0.0022, 0.0008] },
      ],
      rate: 1.1,
      wave: [9, 5],
    },
  },

  /* the sea surges under the cliff; storm cloud creeps; the torches and lit windows flicker; sparks (looks.ts) */
  emberquill: {
    cycle: 9,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, 0.585],
            [0.31, 0.585],
            [0.3, 0.66],
            [0.275, 0.72],
            [0.255, 0.8],
            [0.24, 0.88],
            [0.215, 0.96],
            [0.2, 1.1],
            [-0.1, 1.1],
          ],
        },
        feather: 0.03,
        minus: [
          { kind: 'ellipse', at: [0.2, 0.785], rx: 0.1, ry: 0.035 },
          { kind: 'ellipse', at: [0.21, 0.915], rx: 0.055, ry: 0.04 },
          { kind: 'ellipse', at: [0.06, 0.955], rx: 0.11, ry: 0.03 },
        ],
        dir: [0.02, 0.012],
        ramp: { from: [0.1, 0.58], to: [0.1, 0.9], a: 0.25, b: 1 },
      },
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [0.55, -0.1],
            [0.548, 0.2],
            [0.52, 0.27],
            [0.41, 0.3],
            [0.36, 0.4],
            [-0.1, 0.45],
          ],
        },
        feather: 0.06,
        dir: [0.022, 0.002],
      },
      {
        shape: {
          kind: 'poly',
          points: [
            [0.69, -0.1],
            [1.1, -0.1],
            [1.1, 0.2],
            [0.93, 0.13],
            [0.8, 0.09],
            [0.7, 0.085],
          ],
        },
        feather: 0.04,
        dir: [0.018, 0.002],
      },
    ],
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.6],
              [0.3, 0.6],
              [0.25, 0.8],
              [0.2, 1.1],
              [-0.1, 1.1],
            ],
          },
          feather: 0.04,
          amount: 0.6,
        },
      ],
      size: 0.003,
      speed: 0.05,
    },
    lights: [
      { at: [0.657, 0.44], radius: 0.1, amount: 0.2, speed: 7.5, seed: 1, kind: 'flicker' },
      { at: [0.772, 0.44], radius: 0.1, amount: 0.2, speed: 6.8, seed: 9, kind: 'flicker' },
      { at: [0.715, 0.56], radius: 0.13, amount: 0.08, speed: 7.1, seed: 4, kind: 'flicker' },
      { at: [0.63, 0.27], radius: 0.04, amount: 0.14, speed: 6.2, seed: 13, kind: 'flicker' },
      { at: [0.868, 0.325], radius: 0.04, amount: 0.12, speed: 5.6, seed: 21, kind: 'flicker' },
      { at: [0.5, 0.355], radius: 0.07, amount: 0.1, speed: 6, seed: 30, kind: 'flicker' },
    ],
  },

  /* fog rolls down the far street and low over the cobbles; the gas lamps and their reflections flicker */
  'history-lens': {
    cycle: 10,
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.59, -0.1],
              [0.865, -0.1],
              [0.865, 0.6],
              [0.8, 0.62],
              [0.6, 0.6],
            ],
          },
          feather: 0.05,
          /* the pump stands in front of the fog */
          minus: [
            {
              kind: 'poly',
              points: [
                [0.66, 0.25],
                [0.735, 0.25],
                [0.735, 0.62],
                [0.66, 0.62],
              ],
            },
          ],
          amount: 0.55,
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.6],
              [0.62, 0.55],
              [0.62, 0.7],
              [-0.1, 0.78],
            ],
          },
          feather: 0.07,
          amount: 0.3,
        },
      ],
      rgb: [0.74, 0.73, 0.74],
      drift: [-0.01, 0.003],
      scale: 1.7,
    },
    lights: [
      { at: [0.819, 0.16], radius: 0.13, amount: 0.1, speed: 4.6, seed: 3, kind: 'flicker' },
      { at: [0.62, 0.7], radius: 0.16, amount: 0.07, speed: 4.6, seed: 3, kind: 'flicker' },
      { at: [0.83, 0.74], radius: 0.12, amount: 0.07, speed: 4.6, seed: 3, kind: 'flicker' },
      { at: [0.625, 0.41], radius: 0.05, amount: 0.12, speed: 5.2, seed: 11, kind: 'flicker' },
      { at: [0.79, 0.455], radius: 0.03, amount: 0.14, speed: 5.8, seed: 17, kind: 'flicker' },
    ],
  },

  /* the beam comes round; waves roll in under the point; mist over the far water */
  bookforge: {
    cycle: 8,
    flow: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, 0.61],
            [0.31, 0.61],
            [0.44, 0.645],
            [0.4, 0.7],
            [0.365, 0.745],
            [0.4, 0.8],
            [0.5, 0.84],
            [0.44, 0.89],
            [0.33, 1.1],
            [-0.1, 1.1],
          ],
        },
        feather: 0.03,
        minus: [
          { kind: 'ellipse', at: [0.345, 0.885], rx: 0.13, ry: 0.06 },
          { kind: 'ellipse', at: [0.34, 0.755], rx: 0.05, ry: 0.025 },
        ],
        dir: [0.02, 0.007],
        ramp: { from: [0.1, 0.6], to: [0.1, 0.9], a: 0.3, b: 1 },
      },
    ],
    mist: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.46],
              [0.6, 0.46],
              [0.6, 0.56],
              [0.47, 0.63],
              [-0.1, 0.64],
            ],
          },
          feather: 0.07,
          amount: 0.4,
        },
      ],
      rgb: [0.56, 0.6, 0.76],
      drift: [0.011, 0],
      scale: 1.6,
    },
    lights: [{ at: [0.668, 0.186], radius: 0.05, amount: 0.12, speed: 0.698, seed: 1.571, kind: 'breathe' }],
    beam: { at: [0.668, 0.186], to: [0.425, 0.272], spread: 0.15, period: 9, dim: 0.85 },
  },

  /* rain falls (looks.ts); the reflections on the wet street never sit still; the lanterns glow and stir */
  'kana-notebook': {
    cycle: 10,
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.39, 0.56],
              [0.455, 0.56],
              [0.6, 0.67],
              [0.67, 0.77],
              [0.98, 1.1],
              [0.22, 1.1],
            ],
          },
          feather: 0.035,
          amount: 1,
        },
      ],
      size: 0.0032,
      speed: 0.07,
    },
    sway: {
      regions: [
        { shape: { kind: 'ellipse', at: [0.925, 0.222], rx: 0.085, ry: 0.1 }, feather: 0.05, dir: [0.0022, 0.0004] },
      ],
      rate: 0.9,
      wave: [3, 2],
    },
    lights: [
      { at: [0.925, 0.225], radius: 0.13, amount: 0.07, speed: 1.1, seed: 0, kind: 'breathe' },
      { at: [0.586, 0.388], radius: 0.05, amount: 0.09, speed: 1.4, seed: 5, kind: 'breathe' },
      { at: [0.46, 0.465], radius: 0.025, amount: 0.1, speed: 1.7, seed: 9, kind: 'breathe' },
      { at: [0.435, 0.365], radius: 0.03, amount: 0.1, speed: 5, seed: 14, kind: 'flicker' },
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
            [1.1, 0.345],
            [0.87, 0.325],
            [0.78, 0.285],
            [0.7, 0.33],
            [0.56, 0.385],
            [0.4, 0.43],
            [0.25, 0.465],
            [-0.1, 0.49],
          ],
        },
        feather: 0.06,
        dir: [0.024, -0.003],
      },
    ],
    sway: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [-0.1, 0.6],
              [0.7, 0.6],
              [0.585, 0.7],
              [0.455, 0.8],
              [0.325, 0.9],
              [0.195, 1.1],
              [-0.1, 1.1],
            ],
          },
          feather: 0.03,
          dir: [0.0052, 0.0012],
          ramp: { from: [0.2, 0.6], to: [0.2, 0.999], a: 0.12, b: 1 },
        },
        {
          shape: {
            kind: 'poly',
            points: [
              [0.84, 0.6],
              [1.1, 0.6],
              [1.1, 0.72],
            ],
          },
          feather: 0.02,
          dir: [0.002, 0.0005],
        },
      ],
      rate: 1.7,
      wave: [16, 9],
    },
  },

  /* the fire climbs and throws light on the chairs; sparks (looks.ts); the stars twinkle */
  contact: {
    cycle: 1.6,
    flow: [{ shape: { kind: 'ellipse', at: [0.632, 0.615], rx: 0.036, ry: 0.06 }, feather: 0.03, dir: [0, -0.03] }],
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [-0.1, -0.1],
            [1.1, -0.1],
            [1.1, 0.465],
            [-0.1, 0.425],
          ],
        },
        feather: 0.03,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.632, 0.64], radius: 0.34, amount: 0.12, speed: 8, seed: 2, kind: 'flicker' },
      { at: [0.632, 0.63], radius: 0.07, amount: 0.1, speed: 11, seed: 8, kind: 'flicker' },
    ],
  },
};

/** What moves in a world's photograph; a world without a scene is a build mistake. */
export function sceneOf(id: string): Scene {
  if (!Object.hasOwn(SCENES, id))
    throw new Error(`No scene for the world "${id}": add one to SCENES in src/living/scenes.ts.`);
  return SCENES[id];
}
