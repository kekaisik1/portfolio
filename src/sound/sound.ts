/**
 * The page's sound: each place's ambience, off until the visitor asks for it. An audio context is only ever made
 * inside a press or a key (browsers refuse anything else, and say so in the console); the choice is remembered, so
 * on a later visit the sound waits for the first press or key and then begins. Moving to another place crossfades;
 * a video ducks it to silence; a hidden tab suspends it.
 */
import { buildAmbience, makeBank, type Ambience, type Bank } from './engine';
import { FADE_S, MASTER_GAIN, recipeOf, type Voice } from './recipe';

/** how far ahead the now-and-then voices are scheduled, and how often that is topped up */
const AHEAD_S = 2;
const TOP_UP_MS = 700;
/** the events that count as the visitor acting, for a browser that will not start audio otherwise */
const GESTURES = ['pointerup', 'keydown', 'touchend'] as const;
const SWITCH = '#sw-sound';

export interface Sound {
  /** At start-up: was sound left on last time? Then it begins with the first press or key. */
  arm(on: boolean, world: () => string): void;
  /** The switch was pressed (a gesture): start with this world's sound, or fade out. */
  turn(on: boolean, world: string): void;
  /** Travel has begun towards this world: crossfade to its sound. */
  go(world: string): void;
  /** A video is playing (or has stopped): be silent under it. */
  duck(on: boolean): void;
  /** One short sound now (a ring when a try's phone is picked up), only if the sound is on and already started. */
  cue(voice: Voice): void;
}

/** a cue is one event of a recipe of its own, far quieter than any ambience */
const CUE_GAIN = 0.08;
const CUE_S = 2;

export function createSound(): Sound {
  let ctx: AudioContext | null = null;
  let bank: Bank | null = null;
  let master: GainNode | null = null;
  let duckGain: GainNode | null = null;
  let playing: { id: string; ambience: Ambience } | null = null;
  let on = false;
  let ducked = false;
  /** stops waiting for a first gesture (set while sound left on from last time has not started yet) */
  let disarm: (() => void) | null = null;
  let seed = 1;

  const ramp = (param: AudioParam, to: number, at: number, seconds = FADE_S): void => {
    param.cancelScheduledValues(at);
    param.setValueAtTime(param.value, at);
    param.linearRampToValueAtTime(to, at + seconds);
  };

  function topUp(): void {
    if (ctx && playing && ctx.state === 'running') playing.ambience.schedule(ctx.currentTime + AHEAD_S);
  }

  function play(id: string): void {
    if (!ctx || !bank || !duckGain || playing?.id === id) return;
    const now = ctx.currentTime;
    if (playing) {
      const old = playing.ambience;
      ramp(old.out.gain, 0, now);
      old.stop(now + FADE_S + 0.05);
    }
    const ambience = buildAmbience(ctx, recipeOf(id), bank, seed++);
    ambience.out.gain.value = 0;
    ambience.out.connect(duckGain);
    ramp(ambience.out.gain, 1, now);
    playing = { id, ambience };
    topUp();
  }

  /** Make the context. Only ever called from inside a gesture. */
  function begin(): AudioContext {
    if (ctx) return ctx;
    const made = new AudioContext({ latencyHint: 'playback' });
    ctx = made;
    bank = makeBank(made);
    master = made.createGain();
    master.gain.value = MASTER_GAIN;
    duckGain = made.createGain();
    duckGain.gain.value = ducked ? 0 : 1;
    duckGain.connect(master).connect(made.destination);
    window.setInterval(topUp, TOP_UP_MS);
    return made;
  }

  function start(id: string): void {
    const made = begin();
    if (made.state === 'suspended' && !document.hidden) void made.resume();
    if (master) ramp(master.gain, MASTER_GAIN, made.currentTime);
    play(id);
  }

  function silence(): void {
    if (!ctx || !master) return;
    const made = ctx;
    ramp(master.gain, 0, made.currentTime);
    window.setTimeout(
      () => {
        /* still off once the fade is over: rest the context, and forget what was playing so it starts fresh */
        if (on) return;
        playing?.ambience.stop(made.currentTime);
        playing = null;
        void made.suspend();
      },
      FADE_S * 1000 + 60,
    );
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (on) void ctx.resume();
  });

  return {
    arm(wanted, world) {
      on = wanted;
      if (!on) return;
      const first = (e: Event): void => {
        /* some browsers send these events without counting them as the visitor acting (a scroll, Esc) */
        if (navigator.userActivation && !navigator.userActivation.isActive) return;
        /* a press on the sound switch itself is the switch's to answer: it may be turning the sound off */
        if (e.target instanceof Element && e.target.closest(SWITCH)) return;
        disarm?.();
        if (on && !ctx) start(world());
      };
      disarm = () => {
        for (const type of GESTURES) window.removeEventListener(type, first, true);
        disarm = null;
      };
      for (const type of GESTURES) window.addEventListener(type, first, true);
    },
    turn(wanted, world) {
      disarm?.();
      on = wanted;
      if (on) start(world);
      else silence();
    },
    go(world) {
      if (on && ctx) play(world);
    },
    duck(wanted) {
      ducked = wanted;
      if (ctx && duckGain) ramp(duckGain.gain, ducked ? 0 : 1, ctx.currentTime);
    },
    cue(voice) {
      /* never a context of its own: only into one a gesture has already started */
      if (!on || !ctx || !bank || !duckGain || ctx.state !== 'running') return;
      const one = buildAmbience(
        ctx,
        [{ kind: 'event', voice, every: 60, jitter: 0, first: 0.05, gain: CUE_GAIN }],
        bank,
      );
      one.out.connect(duckGain);
      one.schedule(ctx.currentTime + 1);
      one.stop(ctx.currentTime + CUE_S);
      window.setTimeout(() => one.out.disconnect(), CUE_S * 1000 + 100);
    },
  };
}
