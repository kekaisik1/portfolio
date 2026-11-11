/** Everything the API may answer, checked before the page believes it. Shapes follow the API's README. */
import * as z from 'zod/mini';

const unit = z.number().check(z.gte(0), z.lte(1));
const count = z.number().check(z.gte(0));

export const lanternSchema = z.object({ x: unit, y: unit, s: unit });
export type LanternDto = z.infer<typeof lanternSchema>;

/** `GET /api/lanterns`: the list is checked item by item, so one odd lantern does not lose the rest. */
export const lanternsSchema = z.object({
  count,
  lanterns: z.array(z.unknown()),
});
export const lanternCountSchema = z.object({ count });

export const noteAckSchema = z.object({ ok: z.boolean() });

export const WEATHER_KINDS = ['snow', 'rain', 'fog', 'cloud', 'clear'] as const;
export const weatherSchema = z.object({
  place: z.string(),
  temp: z.number(),
  kind: z.enum(WEATHER_KINDS),
});
export type WeatherDto = z.infer<typeof weatherSchema>;

export const nowSchema = z.object({ label: z.string().check(z.minLength(1)), at: z.string() });
export type NowDto = z.infer<typeof nowSchema>;

export const growthSchema = z.object({ total: count, week: count, day: count });
export type GrowthDto = z.infer<typeof growthSchema>;

/** `GET /api/today`: each of the three parts is optional and checked on its own. */
export const todaySchema = z.object({
  weather: z.optional(z.unknown()),
  now: z.optional(z.unknown()),
  growth: z.optional(z.unknown()),
});

export interface Today {
  weather: WeatherDto | null;
  now: NowDto | null;
  growth: Record<string, GrowthDto>;
}
export interface Lanterns {
  count: number;
  lanterns: LanternDto[];
}

const MAX_GROWTH_ENTRIES = 40;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse a `/api/today` body. Returns null when it is not an object at all; odd parts become null/empty. */
export function parseToday(body: unknown): Today | null {
  const top = todaySchema.safeParse(body);
  if (!top.success) return null;
  const weather = weatherSchema.safeParse(top.data.weather);
  const now = nowSchema.safeParse(top.data.now);
  const growth: Record<string, GrowthDto> = {};
  if (isRecord(top.data.growth)) {
    for (const slug of Object.keys(top.data.growth).slice(0, MAX_GROWTH_ENTRIES)) {
      const g = growthSchema.safeParse(top.data.growth[slug]);
      if (g.success) growth[slug] = { total: g.data.total, week: g.data.week, day: g.data.day };
    }
  }
  return {
    weather: weather.success && Number.isFinite(weather.data.temp) ? weather.data : null,
    now: now.success ? now.data : null,
    growth,
  };
}

/** Parse a `/api/lanterns` body, keeping only well-formed lanterns. */
export function parseLanterns(body: unknown): Lanterns | null {
  const top = lanternsSchema.safeParse(body);
  if (!top.success) return null;
  const lanterns: LanternDto[] = [];
  for (const item of top.data.lanterns) {
    const l = lanternSchema.safeParse(item);
    if (l.success) lanterns.push(l.data);
  }
  return { count: top.data.count, lanterns };
}
