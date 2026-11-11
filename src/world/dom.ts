/** The fixed parts of the page the engine works with. index.html is the other half of this contract. */
import { byId, ctx2d, pick, pickAll } from '../lib/dom';

export const root = document.documentElement;
export const canvas = byId<HTMLCanvasElement>('scene');
export const ctx = ctx2d(canvas);
export const journey = byId('journey');
export const stage = byId('stage');
export const track = byId('track');
/** the four stretches of the journey, in order: mountains, steppe, sea, night */
export const sections = pickAll<HTMLElement>(document, '.stretch');
export const moonSpot = byId('moon-spot');
export const aboutEl = byId('about');
export const writeWrap = byId('write-wrap');
export const lanternBtn = byId<HTMLButtonElement>('lantern');
export const lanternN = byId('lantern-n');
export const grainEl = pick(document, '.grain');
export const inside = byId<HTMLDialogElement>('inside');
export const noteDlg = byId<HTMLDialogElement>('note');

export const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
export const mqWide = matchMedia('(min-width: 900px) and (min-height: 620px)');
