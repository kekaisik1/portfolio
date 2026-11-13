/**
 * The board's footer: where this place is, which row of how many, and the time there (a clock that ticks once a
 * second: text only). With the API it also carries two real lines: the weather where Kaisar is and what he was
 * last seen working on.
 */
import { LAST, WORLDS, rowNumber } from '../content/places';
import { MESSAGES } from '../content/site';
import { byId } from '../lib/dom';
import { reduce } from '../lib/media';
import type { Travel } from '../travel/travel';
import { scramble, scrambling } from './scramble';

const formats = new Map<string, Intl.DateTimeFormat>();

/** "07:42:10" in a time zone (the visitor's own when there is none, or the browser does not know it). */
export function clockText(tz: string | undefined, at: Date = new Date()): string {
  const key = tz ?? '';
  let fmt = formats.get(key);
  if (!fmt) {
    const base: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    };
    try {
      fmt = new Intl.DateTimeFormat('en-GB', tz ? { ...base, timeZone: tz } : base);
    } catch (err) {
      /* an old browser that does not know the zone: the visitor's own time is better than none */
      if (!(err instanceof RangeError)) throw err;
      fmt = new Intl.DateTimeFormat('en-GB', base);
    }
    formats.set(key, fmt);
  }
  return fmt.format(at);
}

export interface Footer {
  /** The two lines from the API ('' = nothing to say). */
  setToday(weather: string, now: string): void;
}

export function initFooter(travel: Travel): Footer {
  const pos = byId('f-pos');
  const count = byId('f-n');
  const clk = byId('f-clk');
  const zone = byId('f-tz');
  const wx = byId('f-wx');
  const now = byId('f-now');
  let timer = 0;

  const tick = (): void => {
    if (!scrambling(clk)) clk.textContent = clockText(WORLDS[travel.current()].tz);
  };
  const run = (): void => {
    window.clearInterval(timer);
    timer = document.hidden ? 0 : window.setInterval(tick, 1000);
    if (!document.hidden) tick();
  };
  document.addEventListener('visibilitychange', run);
  run();

  travel.onDepart((to, from) => {
    const w = WORLDS[to];
    const quiet = reduce.matches || from === null;
    scramble(pos, w.pos, quiet);
    scramble(count, `${rowNumber(to)}/${rowNumber(LAST)}`, quiet);
    scramble(clk, clockText(w.tz), quiet);
    zone.textContent = ` ${w.tz && w.tzLabel ? w.tzLabel : MESSAGES.yourTime}`;
  });

  return {
    setToday(weather, nowLine) {
      wx.textContent = weather;
      now.textContent = nowLine;
    },
  };
}
