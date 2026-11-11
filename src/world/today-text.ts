/** The words of the two lines that come from the API. Pure, so they are unit-tested. */
import type { Today } from '../api/schemas';
import type { WeatherKind } from './types';

const WEATHER_WORDS = { snow: 'snowing', rain: 'raining', fog: 'foggy', cloud: 'grey', clear: 'clear' } as const;
const HOUR_MS = 36e5;
/** older than two weeks is not "last seen" any more */
const NOW_MAX_HOURS = 24 * 14;

/** "3 hours ago" for an ISO time, or null when it is in the future, unreadable or too old to mention. */
export function ago(iso: string, nowMs: number = Date.now()): string | null {
  const h = (nowMs - Date.parse(iso)) / HOUR_MS;
  if (!(h >= 0) || h > NOW_MAX_HOURS) return null;
  return h < 1.5
    ? 'just now'
    : h < 24
      ? Math.round(h) + ' hours ago'
      : h < 48
        ? 'yesterday'
        : Math.floor(h / 24) + ' days ago';
}

/** "−12° and snowing in Astana right now." */
export function weatherLine(w: NonNullable<Today['weather']>): string {
  const deg = Math.round(w.temp);
  return (
    (deg < 0 ? '−' : '') +
    Math.abs(deg) +
    '° and ' +
    WEATHER_WORDS[w.kind] +
    ' in ' +
    w.place.slice(0, 40) +
    ' right now.'
  );
}

/** "last seen working on Emberquill, yesterday." or null when there is nothing recent to say. */
export function nowLine(n: NonNullable<Today['now']>, nowMs: number = Date.now()): string | null {
  const a = ago(n.at, nowMs);
  return a ? 'last seen working on ' + n.label.slice(0, 60) + ', ' + a + '.' : null;
}

/** ?weather=snow or ?weather=rain shows that weather whatever the real sky is doing */
export function forcedWeather(search: string): WeatherKind {
  const m = /[?&]weather=(snow|rain)\b/.exec(search);
  return m ? (m[1] as 'snow' | 'rain') : '';
}
