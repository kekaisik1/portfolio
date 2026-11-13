/**
 * Builds one place's ambience from its recipe on any audio context: the page's live one, or an offline one that
 * renders it to numbers for the checks. Everything is synthesised: looping noise through filters, a few
 * oscillators, and small one-off voices (a far phone, a bell, a foghorn, a drip, a bird).
 */
import {
  chance,
  eventsBetween,
  swellGains,
  type CrackleLayer,
  type EventLayer,
  type NoiseColour,
  type NoiseLayer,
  type Recipe,
  type Swell,
  type ToneLayer,
  type Voice,
} from './recipe';
import { crackleSamples, noiseSamples } from './samples';

/** seconds of noise in a loop: long enough that the ear does not catch it coming round */
const LOOP_S = 5;

export interface Ambience {
  /** everything this place sounds like comes out here; its gain is the crossfade */
  out: GainNode;
  /** Schedule the now-and-then voices that fall before `until` (context time). Call again as time goes on. */
  schedule(until: number): void;
  /** Stop every source at `when` (context time). */
  stop(when: number): void;
}

/** The loops, made once per context and shared by every place. */
export interface Bank {
  noise(colour: NoiseColour): AudioBuffer;
  crackle(density: number): AudioBuffer;
}

export function makeBank(ctx: BaseAudioContext): Bank {
  const noises = new Map<NoiseColour, AudioBuffer>();
  const crackles = new Map<number, AudioBuffer>();
  const length = Math.round(LOOP_S * ctx.sampleRate);
  const buffer = (samples: Float32Array): AudioBuffer => {
    const b = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    b.getChannelData(0).set(samples);
    return b;
  };
  const SEEDS: Record<NoiseColour, number> = { white: 11, pink: 23, brown: 37 };
  return {
    noise(colour) {
      let b = noises.get(colour);
      if (!b) {
        b = buffer(noiseSamples(colour, length, SEEDS[colour]));
        noises.set(colour, b);
      }
      return b;
    },
    crackle(density) {
      let b = crackles.get(density);
      if (!b) {
        b = buffer(crackleSamples(length, ctx.sampleRate, density, 53 + density));
        crackles.set(density, b);
      }
      return b;
    },
  };
}

type Source = AudioScheduledSourceNode;

export function buildAmbience(ctx: BaseAudioContext, recipe: Recipe, bank: Bank, seed = 1): Ambience {
  const out = ctx.createGain();
  const sources = new Set<Source>();
  const t0 = ctx.currentTime;
  let scheduled = 0;

  const started = <T extends Source>(node: T): T => {
    node.start(t0);
    sources.add(node);
    return node;
  };
  const loop = (buffer: AudioBuffer, offset: number): AudioBufferSourceNode => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    /* two layers sharing a loop start at different places in it, so they never line up */
    src.start(t0, offset % buffer.duration);
    sources.add(src);
    return src;
  };
  const lfo = (rate: number, amount: number, to: AudioParam): void => {
    const osc = ctx.createOscillator();
    const depth = ctx.createGain();
    osc.frequency.value = rate;
    depth.gain.value = amount;
    osc.connect(depth).connect(to);
    started(osc);
  };
  /** a gain node at `gain`, swelling if asked; everything connects through one to `out` */
  const level = (gain: number, swell: Swell | undefined): GainNode => {
    const node = ctx.createGain();
    const { base, swing } = swellGains(gain, swell);
    node.gain.value = base;
    if (swell && swing > 0) lfo(swell.rate, swing, node.gain);
    node.connect(out);
    return node;
  };

  function noise(layer: NoiseLayer, index: number): void {
    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter;
    filter.frequency.value = layer.freq;
    filter.Q.value = layer.q;
    if (layer.sweep) lfo(layer.sweep.rate, layer.sweep.cents, filter.detune);
    loop(bank.noise(layer.colour), index * 1.37)
      .connect(filter)
      .connect(level(layer.gain, layer.swell));
  }

  function tone(layer: ToneLayer): void {
    const osc = ctx.createOscillator();
    osc.type = layer.wave;
    osc.frequency.value = layer.freq;
    const dest = level(layer.gain, layer.swell);
    if (layer.trill) {
      /* pulsing: the tone's loudness swings between nothing and full, `trill` times a second */
      const pulse = ctx.createGain();
      pulse.gain.value = 0.5;
      lfo(layer.trill, 0.5, pulse.gain);
      osc.connect(pulse).connect(dest);
    } else osc.connect(dest);
    started(osc);
  }

  function crackle(layer: CrackleLayer, index: number): void {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = layer.freq;
    filter.Q.value = 0.7;
    loop(bank.crackle(layer.density), index * 0.83)
      .connect(filter)
      .connect(level(layer.gain, undefined));
  }

  /** an oscillator that lives from `at` for `length` seconds, through `shape` (a gain envelope) */
  function note(
    type: OscillatorType,
    freq: number,
    at: number,
    length: number,
    shape: (gain: AudioParam, osc: OscillatorNode) => void,
    dest: AudioNode,
  ): void {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    env.gain.setValueAtTime(0, at);
    shape(env.gain, osc);
    osc.connect(env).connect(dest);
    osc.start(at);
    osc.stop(at + length);
    sources.add(osc);
    osc.addEventListener('ended', () => sources.delete(osc), { once: true });
  }

  const voices: Record<Voice, (at: number, vary: number, dest: AudioNode) => void> = {
    /* a telephone bell a long way off: two rings, each a quick trill */
    ring(at, _vary, dest) {
      const far = ctx.createBiquadFilter();
      far.type = 'bandpass';
      far.frequency.value = 1500;
      far.Q.value = 1.2;
      far.connect(dest);
      for (const start of [0, 0.62]) {
        for (const freq of [1230, 1560]) {
          note(
            'sine',
            freq,
            at + start,
            0.46,
            (gain) => {
              /* the clapper: on and off twenty-odd times a second */
              for (let i = 0; i < 9; i++) {
                gain.setValueAtTime(0.5, at + start + i * 0.045);
                gain.setValueAtTime(0.12, at + start + i * 0.045 + 0.022);
              }
              gain.linearRampToValueAtTime(0, at + start + 0.45);
            },
            far,
          );
        }
      }
    },
    /* a church bell far away: a strike and a long hum of partials that are not quite in tune */
    bell(at, vary, dest) {
      const base = 196 * (1 + (vary - 0.5) * 0.02);
      const far = ctx.createBiquadFilter();
      far.type = 'lowpass';
      far.frequency.value = 1100;
      far.connect(dest);
      const partials: readonly (readonly [ratio: number, gain: number, decay: number])[] = [
        [0.5, 0.3, 5],
        [1, 0.34, 4],
        [1.19, 0.2, 3],
        [1.5, 0.1, 2.4],
        [2, 0.12, 1.8],
        [2.63, 0.05, 1.1],
      ];
      for (const [ratio, gain, decay] of partials)
        note(
          'sine',
          base * ratio,
          at,
          decay + 0.1,
          (g) => {
            g.linearRampToValueAtTime(gain, at + 0.012);
            g.exponentialRampToValueAtTime(0.0001, at + decay);
          },
          far,
        );
    },
    /* a foghorn: low, slow to speak, slow to stop */
    foghorn(at, _vary, dest) {
      const far = ctx.createBiquadFilter();
      far.type = 'lowpass';
      far.frequency.value = 300;
      far.connect(dest);
      for (const [type, freq, gain] of [
        ['sawtooth', 87, 0.5],
        ['sawtooth', 87.7, 0.4],
        ['sine', 130.5, 0.25],
      ] as const)
        note(
          type,
          freq,
          at,
          3,
          (g) => {
            g.linearRampToValueAtTime(gain, at + 0.35);
            g.setValueAtTime(gain, at + 2.1);
            g.linearRampToValueAtTime(0, at + 2.9);
          },
          far,
        );
    },
    /* a drop of water: a short falling ping */
    drip(at, vary, dest) {
      const high = 1100 + vary * 900;
      note(
        'sine',
        high,
        at,
        0.22,
        (g, osc) => {
          osc.frequency.exponentialRampToValueAtTime(high * 0.62, at + 0.05);
          g.linearRampToValueAtTime(1, at + 0.004);
          g.exponentialRampToValueAtTime(0.0001, at + 0.2);
        },
        dest,
      );
    },
    /* a small bird: two to four quick rising chirps */
    bird(at, vary, dest) {
      const chirps = 2 + Math.floor(vary * 3);
      const pitch = 2700 + chance(7, Math.floor(vary * 1000)) * 1300;
      for (let i = 0; i < chirps; i++) {
        const t = at + i * 0.13;
        note(
          'sine',
          pitch,
          t,
          0.1,
          (g, osc) => {
            osc.frequency.exponentialRampToValueAtTime(pitch * 1.28, t + 0.07);
            g.linearRampToValueAtTime(0.9, t + 0.012);
            g.exponentialRampToValueAtTime(0.0001, t + 0.09);
          },
          dest,
        );
      }
    },
  };

  const events: { layer: EventLayer; dest: GainNode; seed: number }[] = [];
  recipe.forEach((layer, index) => {
    if (layer.kind === 'noise') noise(layer, index);
    else if (layer.kind === 'tone') tone(layer);
    else if (layer.kind === 'crackle') crackle(layer, index);
    else events.push({ layer, dest: level(layer.gain, undefined), seed: seed * 31 + index });
  });

  return {
    out,
    schedule(until) {
      const to = until - t0;
      for (const e of events)
        for (const { k, at } of eventsBetween(e.layer, scheduled, to, e.seed))
          voices[e.layer.voice](t0 + at, chance(e.seed + 101, k), e.dest);
      scheduled = Math.max(scheduled, to);
    },
    stop(when) {
      for (const s of sources) {
        try {
          s.stop(when);
        } catch (err) {
          /* a one-off voice that has already ended cannot be stopped again: nothing to do */
          if (!(err instanceof DOMException)) throw err;
        }
      }
      sources.clear();
    },
  };
}
