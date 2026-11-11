/**
 * Today: two pencilled lines that come from the API (the weather where Kaisar is, and what he was last working on),
 * the weather falling in the drawing, and how much each project has grown.
 */
import { api } from '../api';
import type { Today } from '../api/schemas';
import { byId } from '../lib/dom';
import { measureHaze } from './haze';
import { requestDraw } from './scheduler';
import { S } from './state';
import { forcedWeather, nowLine, weatherLine } from './today-text';

export function initToday(): void {
  S.wx = forcedWeather(location.search);
}

function showToday(d: Today): void {
  if (d.weather) {
    byId('wx').textContent = weatherLine(d.weather);
    if (!forcedWeather(location.search))
      S.wx = d.weather.kind === 'snow' || d.weather.kind === 'rain' ? d.weather.kind : '';
  }
  S.growth = d.growth;
  if (d.now) {
    const line = nowLine(d.now);
    if (line) byId('now').textContent = line;
  }
  /* the new lines change where the words are, so the mist behind them is measured again */
  measureHaze();
  requestDraw();
}

export async function loadToday(): Promise<void> {
  const r = await api.getToday();
  /* no API, or it is down: no weather line, the sky stays as drawn, every place gets its small default of life */
  if (r.ok) showToday(r.data);
}
