/** DOM lookups that fail loudly: the page shell is ours, so a missing element is a build mistake, not a runtime state. */

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html: the page shell and src/ are out of step.`);
  return el as T;
}

export function pick<T extends Element = HTMLElement>(parent: ParentNode, selector: string): T {
  const el = parent.querySelector<T>(selector);
  if (!el) throw new Error(`Missing "${selector}" in the page: the page shell and src/ are out of step.`);
  return el;
}

export function pickAll<T extends Element = HTMLElement>(parent: ParentNode, selector: string): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/** A 2D context, or a clear error (a browser without canvas cannot show this page at all). */
export function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = canvas.getContext('2d');
  if (!g) throw new Error('This browser gave no 2D canvas context, so the drawing cannot be made.');
  return g;
}

export function newCanvas(width = 1, height = 1): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

/** requestIdleCallback where there is one, a short timeout where there is not (Safari). */
export function whenIdle(fn: () => void, timeout: number, fallbackDelay: number): number {
  return typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(fn, { timeout })
    : window.setTimeout(fn, fallbackDelay);
}
