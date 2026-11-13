/** Today: two lines from the API: the weather where Kaisar is, and what he was last working on. */
import { api } from '../api';
import { nowLine, weatherLine } from './today-text';

export interface TodayLines {
  weather: string;
  now: string;
}

/** The two lines, each '' when there is nothing to say; null with no API, or when it is down. */
export async function loadToday(): Promise<TodayLines | null> {
  const r = await api.getToday();
  if (!r.ok) return null;
  return {
    weather: r.data.weather ? weatherLine(r.data.weather) : '',
    now: (r.data.now ? nowLine(r.data.now) : null) ?? '',
  };
}
