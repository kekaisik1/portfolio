/** Words and labels dissolve through stepped paper-grain masks: a CSS mask image per level, swapped only when the level changes. */
import { TEXT_MASKS, TEXT_MASKS_INV } from '../paint/masks';
import { LV } from './timing';

const levels = new WeakMap<HTMLElement, number>();

/** Show an element at dissolve level L (0 = gone, LV = whole). `inverted` uses the complementary blotches. */
export function setTextLevel(el: HTMLElement, L: number, inverted = false): void {
  if (levels.get(el) === L) return;
  levels.set(el, L);
  const st = el.style;
  if (L >= LV) {
    st.opacity = '1';
    st.maskImage = 'none';
    st.setProperty('-webkit-mask-image', 'none');
  } else if (L <= 0) st.opacity = '0';
  else {
    const u = (inverted ? TEXT_MASKS_INV : TEXT_MASKS)[L];
    if (!u) {
      /* the masks are still being made: step the opacity instead, and draw this level again once they are here */
      st.opacity = (L / LV).toFixed(2);
      levels.delete(el);
      el.classList.toggle('on', L > LV * 0.55);
      return;
    }
    st.opacity = '1';
    st.maskImage = u;
    st.setProperty('-webkit-mask-image', u);
  }
  /* only words you can read can be clicked */
  el.classList.toggle('on', L > LV * 0.55);
}

/** Forget the level drawn, so the next set draws again (after a resize changed the masks' alignment). */
export const resetTextLevel = (el: HTMLElement): void => void levels.delete(el);
