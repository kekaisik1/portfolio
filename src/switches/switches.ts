/**
 * The corner switches: motion (the living photographs and the things in their air) and sound (each place's
 * ambience). Real toggle buttons: aria-pressed says the state, the choice is kept in this browser. Motion starts
 * off for visitors who ask for reduced motion; sound starts off for everyone.
 */
import { byId } from '../lib/dom';
import { reduce } from '../lib/media';
import { MOTION_KEY, SOUND_KEY, motionAtStart, readPref, soundAtStart, writePref } from './prefs';

export interface Switches {
  motion(): boolean;
  sound(): boolean;
}

export function initSwitches(on: { motion: (on: boolean) => void; sound: (on: boolean) => void }): Switches {
  const motionBtn = byId<HTMLButtonElement>('sw-motion');
  const soundBtn = byId<HTMLButtonElement>('sw-sound');
  let motion = motionAtStart(readPref(MOTION_KEY), reduce.matches);
  let sound = soundAtStart(readPref(SOUND_KEY));

  const show = (): void => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    motionBtn.setAttribute('aria-pressed', String(motion));
    soundBtn.setAttribute('aria-pressed', String(sound));
  };

  motionBtn.addEventListener('click', () => {
    motion = !motion;
    writePref(MOTION_KEY, motion);
    show();
    on.motion(motion);
  });
  soundBtn.addEventListener('click', () => {
    sound = !sound;
    writePref(SOUND_KEY, sound);
    show();
    on.sound(sound);
  });
  show();

  return { motion: () => motion, sound: () => sound };
}
