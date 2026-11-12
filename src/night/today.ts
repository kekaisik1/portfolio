/** Today: two lines from the API under the about words: the weather where Kaisar is, and what he was last working on. */
import { api } from '../api';
import type { Today } from '../api/schemas';
import { byId } from '../lib/dom';
import { nowLine, weatherLine } from './today-text';

function showToday(d: Today): void {
  if (d.weather) byId('wx').textContent = weatherLine(d.weather);
  if (d.now) {
    const line = nowLine(d.now);
    if (line) byId('now').textContent = line;
  }
}

export async function loadToday(): Promise<void> {
  const r = await api.getToday();
  /* no API, or it is down: the lines stay empty */
  if (r.ok) showToday(r.data);
}
