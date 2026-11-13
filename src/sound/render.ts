/**
 * Renders a place's ambience to numbers with an offline audio context, through the same master gain the page uses.
 * Nobody can listen from a test, so this is how the sound is checked: is it there, is it quiet, does it clip, does
 * it sit around zero (tests/e2e/sound.spec.ts, through tests/pages/sound-check.html).
 */
import { buildAmbience, makeBank } from './engine';
import { MASTER_GAIN, recipeOf } from './recipe';
import { measure, type Measure } from './samples';

export async function renderAmbience(id: string, seconds: number, rate = 44100): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, Math.round(seconds * rate), rate);
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);
  const ambience = buildAmbience(ctx, recipeOf(id), makeBank(ctx));
  ambience.out.connect(master);
  ambience.schedule(seconds);
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0);
}

export async function measureAmbience(id: string, seconds: number): Promise<Measure> {
  return measure(await renderAmbience(id, seconds));
}
