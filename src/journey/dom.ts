/** The fixed parts of the page the journey works with. index.html and content/render.ts are the other half of this contract. */
import { byId, pick, pickAll } from '../lib/dom';

export const root = document.documentElement;
export const sceneEl = byId('scene');
export const nightScene = byId('nightscene');
export const nightSky = byId('nightsky');
export const duskCv = byId<HTMLCanvasElement>('dusk');
export const veilDay = byId('veil');
export const veilNight = byId('veil-night');
export const track = byId('track');
export const journey = byId('journey');
export const where = byId('where');
export const horizon = byId('horizon');
export const hdot = pick(horizon, '.hdot');
export const hlinks = pickAll<HTMLAnchorElement>(horizon, 'a[data-country]');
/** every stop, in walking order (their data-stop is their index) */
export const stopEls = pickAll<HTMLElement>(document, '#journey .stop');
export const wordsEls = stopEls.map((a) => pick(a, '.words'));
export const labelEls = new Map(
  pickAll<HTMLButtonElement>(document, '.label[data-open]').map((b) => [b.dataset.open ?? '', b]),
);
export const lanternTag = byId('lantern-tag');
export const lanternBtn = byId<HTMLButtonElement>('lantern');
export const lanternN = byId('lantern-n');
export const inside = byId<HTMLDialogElement>('inside');
export const noteDlg = byId<HTMLDialogElement>('note');

export const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
