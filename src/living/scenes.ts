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
  /* the painting stays still */
  hello: {},

  /* the desk lamp's light breathes, very slightly: the lamp and its warm pool on the map */
  'front-desk': {
    lights: [
      { at: [0.663, 0.19], radius: 0.06, amount: 0.05, speed: 0.9, seed: 0, kind: 'breathe' },
      { at: [0.6, 0.4], radius: 0.18, amount: 0.04, speed: 0.9, seed: 0, kind: 'breathe' },
    ],
  },

  /* the stars twinkle, only inside the open dome (short of its ribs and the telescope); the desk lamp breathes */
  'numbers-room': {
    stars: [
      {
        shape: {
          kind: 'poly',
          points: [
            [0.685, -0.1],
            [0.865, -0.1],
            [0.885, 0.1],
            [0.9, 0.2],
            [0.916, 0.32],
            [0.872, 0.32],
            [0.8, 0.258],
            [0.768, 0.258],
            [0.762, 0.345],
            [0.718, 0.345],
            [0.703, 0.22],
            [0.693, 0.1],
          ],
        },
        feather: 0.015,
        amount: 1,
      },
    ],
    lights: [
      { at: [0.268, 0.71], radius: 0.05, amount: 0.07, speed: 1, seed: 2, kind: 'breathe' },
      { at: [0.32, 0.82], radius: 0.14, amount: 0.05, speed: 1, seed: 2, kind: 'breathe' },
    ],
  },

  /* the painting stays still; dust hangs in the sun in the doorway (looks.ts) */
  lowl: {},

  /* the red glow in the cave breathes slowly, from the gold on its floor; the wizard's staff breathes; embers rise
     off the floor (looks.ts) */
  emberquill: {
    lights: [
      { at: [0.7, 0.5], radius: 0.32, amount: 0.05, speed: 0.6, seed: 1, kind: 'breathe' },
      { at: [0.73, 0.73], radius: 0.1, amount: 0.06, speed: 0.6, seed: 1, kind: 'breathe' },
      { at: [0.423, 0.7], radius: 0.022, amount: 0.12, speed: 1.3, seed: 4, kind: 'breathe' },
    ],
  },

  /* the oil lamp's small flame on the scaffold; dust hangs in the sunbeams (looks.ts) */
  'history-lens': {
    lights: [
      { at: [0.665, 0.578], radius: 0.02, amount: 0.12, speed: 4, seed: 3, kind: 'flicker' },
      { at: [0.67, 0.61], radius: 0.06, amount: 0.04, speed: 4, seed: 3, kind: 'flicker' },
    ],
  },

  /* the desk lamp breathes: its shade and the light it throws on the pages below */
  bookforge: {
    lights: [
      { at: [0.172, 0.615], radius: 0.05, amount: 0.07, speed: 1, seed: 2, kind: 'breathe' },
      { at: [0.2, 0.7], radius: 0.14, amount: 0.05, speed: 1, seed: 2, kind: 'breathe' },
    ],
  },

  /* the painting stays still */
  'kana-notebook': {},

  /* the painting stays still */
  about: {},

  /* the sun's path on the water shimmers, short of the mist line and the shore; the sun breathes slightly */
  contact: {
    shimmer: {
      regions: [
        {
          shape: {
            kind: 'poly',
            points: [
              [0.145, 0.47],
              [0.21, 0.47],
              [0.25, 0.56],
              [0.27, 0.68],
              [0.26, 0.76],
              [0.1, 0.76],
              [0.09, 0.68],
              [0.11, 0.56],
            ],
          },
          feather: 0.03,
          amount: 0.6,
        },
      ],
      size: 0.0015,
      speed: 0.04,
    },
    lights: [{ at: [0.177, 0.275], radius: 0.06, amount: 0.05, speed: 0.7, seed: 0, kind: 'breathe' }],
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
