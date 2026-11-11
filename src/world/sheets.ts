/** Spare sheets of paper the scene is composed on, made once. */
import { ctx2d, newCanvas } from '../lib/dom';

/* the mist the words sit in, the day sky (so the mist can borrow it), the night coming down */
export const hz = newCanvas();
export const hzc = ctx2d(hz);
export const skyc = newCanvas();
export const skyg = ctx2d(skyc);
export const nc = newCanvas();
export const ncx = ctx2d(nc);
