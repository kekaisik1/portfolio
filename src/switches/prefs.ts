/** The two choices the corner switches keep in this browser: do the places move, and do they sound. */

export const MOTION_KEY = 'kaisar.motion.v1';
export const SOUND_KEY = 'kaisar.sound.v1';

/** What a stored choice means; anything unexpected is no choice at all. */
export function parsePref(raw: string | null): boolean | null {
  return raw === 'on' ? true : raw === 'off' ? false : null;
}

/** Motion starts on, unless the visitor chose otherwise here or asks every site for less motion. */
export const motionAtStart = (stored: boolean | null, reducedMotion: boolean): boolean => stored ?? !reducedMotion;

/** Sound starts off, unless the visitor turned it on here before (it still waits for a press or a key). */
export const soundAtStart = (stored: boolean | null): boolean => stored ?? false;

export function readPref(key: string): boolean | null {
  try {
    return parsePref(window.localStorage.getItem(key));
  } catch (err) {
    /* storage is blocked (private mode, a sandbox): the choice lasts for this visit only */
    if (err instanceof DOMException) return null;
    throw err;
  }
}

export function writePref(key: string, on: boolean): void {
  try {
    window.localStorage.setItem(key, on ? 'on' : 'off');
  } catch (err) {
    if (!(err instanceof DOMException)) throw err;
  }
}
