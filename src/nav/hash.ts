/**
 * Links to a country (#sea), a place (#emberquill), about or contact land on that stop. Each stop is laid out at
 * its own scroll position (see journey.css), so even the browser's own jump lands there; this does it for links
 * followed later, and for the old links routing.ts translates.
 */
import { COUNTRY_START, stopOfId } from '../scene/stops';
import type { ZoneId } from '../content/types';
import { S } from '../journey/state';
import { stopEls } from '../journey/dom';
import { goTo } from './travel';
import { hashTarget } from './routing';

/** Which stop an address points at, or -1. */
export function stopOfHash(hash: string): number {
  const id = hashTarget(hash);
  if (!id) return -1;
  if (Object.hasOwn(COUNTRY_START, id)) return COUNTRY_START[id as ZoneId];
  const i = stopOfId(id);
  if (i >= 0) return i;
  const el = document.getElementById(id);
  const host = el?.closest('.stop');
  return host instanceof HTMLElement ? stopEls.indexOf(host) : -1;
}

/** Travel to whatever the address points at. Returns false when it points at nothing on the journey. */
export function goHash(): boolean {
  const i = stopOfHash(location.hash);
  if (i < 0) return false;
  goTo(i);
  S.s = S.target = i;
  return true;
}

export function initHash(): void {
  window.addEventListener('hashchange', () => {
    if (S.skipHash) {
      S.skipHash = false;
      return;
    }
    goHash();
  });
}
