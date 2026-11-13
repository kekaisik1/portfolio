/** The pure parts of the lanterns: what stored data may be, where each one hangs in the sky. Unit-tested. */
import type { LanternDto } from '../api/schemas';

/** how many of your own are kept */
export const MAX_OWN = 5;
/** how many of everyone's are shown */
export const MAX_SHARED = 80;

const isSaved = (l: unknown): l is LanternDto =>
  typeof l === 'object' &&
  l !== null &&
  (['x', 'y', 's'] as const).every((k) => {
    const v = (l as Record<string, unknown>)[k];
    return typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1;
  });

/** Your lanterns from what storage held: anything odd counts as none; only the last MAX_OWN are kept. */
export function parseStored(raw: string | null): LanternDto[] {
  let saved: unknown;
  try {
    saved = JSON.parse(raw || '[]');
  } catch (err) {
    if (err instanceof SyntaxError) return [];
    throw err;
  }
  if (!Array.isArray(saved)) return [];
  return saved.filter(isSaved).slice(-MAX_OWN);
}

/** Where a lantern hangs in a sky `w` wide and `h` high (it keeps to the upper half), how big and how faint. */
export function skyPlace(
  l: LanternDto,
  i: number,
  w: number,
  h: number,
): { x: number; y: number; scale: number; alpha: number } {
  /* spread a little so lanterns lit at the same spot don't stack */
  const jx = (((i * 0.7548) % 1) - 0.5) * 0.08,
    jy = (((i * 0.5698) % 1) - 0.5) * 0.06;
  return {
    x: Math.min(0.97, Math.max(0.03, l.x + jx)) * w,
    y: Math.min(0.5, Math.max(0.04, l.y * 0.6 + jy)) * h,
    scale: 0.22 + l.s * 0.2,
    alpha: 0.45 + ((i * 0.618) % 1) * 0.4,
  };
}
