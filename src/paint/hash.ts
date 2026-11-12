/**
 * A fingerprint of a painting: if a painter, its seed or its fade changes, the fingerprint changes, and the unit
 * test that compares it with src/paint/baked.json says the baked paintings must be made again (npm run paint).
 */
import { defOf, type PaintKind } from './kinds';
import { svgOf } from './svg-of';

/** 32-bit FNV-1a of a string, as 8 hex digits. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function paintHash(k: PaintKind, q: number): string {
  const def = defOf(k);
  return fnv1a(svgOf(k, 1) + '|' + JSON.stringify('fade' in def ? def.fade : null) + '|' + q.toFixed(4));
}
