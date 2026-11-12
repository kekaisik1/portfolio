/** A sheet closes when it is swiped down, unless its own text is scrolled and the finger is only scrolling it back. */

const CLOSE_PX = 56;

export function closeOnSwipeDown(sheet: HTMLElement, close: () => void): void {
  let start: { x: number; y: number; scrolled: boolean } | null = null;
  sheet.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const scroller = e.target instanceof Element ? e.target.closest<HTMLElement>('.rows, .sheet-body') : null;
      start = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrolled: scroller !== null && scroller.scrollTop > 0,
      };
    },
    { passive: true },
  );
  sheet.addEventListener(
    'touchend',
    (e) => {
      const s = start;
      start = null;
      if (!s || s.scrolled || e.changedTouches.length < 1) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (dy > CLOSE_PX && dy > Math.abs(dx) * 1.2) close();
    },
    { passive: true },
  );
}

/** A modal dialog closes when the dimmed page around it is pressed (a press inside it does nothing). */
export function closeOnOutsidePress(dialog: HTMLDialogElement): void {
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
}
