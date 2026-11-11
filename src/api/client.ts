/**
 * A typed client for the small API behind lanterns, notes, weather, growth and the "now" line.
 * The API is optional: with no address every call answers `disabled` without touching the network,
 * and every failure is a value the caller handles (the page must work fully with the API absent or down).
 */
import * as z from 'zod/mini';
import {
  lanternCountSchema,
  noteAckSchema,
  parseLanterns,
  parseToday,
  type LanternDto,
  type Lanterns,
  type Today,
} from './schemas';

export type ApiFailure =
  | { ok: false; reason: 'disabled' }
  | { ok: false; reason: 'network' }
  | { ok: false; reason: 'timeout' }
  | { ok: false; reason: 'http'; status: number }
  | { ok: false; reason: 'invalid' };
export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

export interface NoteBody {
  text: string;
  name: string;
  contact: string;
  /** a trap: people never see this field, bots fill it in */
  website: string;
}

export interface Api {
  /** false = no API configured; nothing will be sent anywhere */
  readonly enabled: boolean;
  getLanterns(): Promise<ApiResult<Lanterns>>;
  postLantern(l: LanternDto): Promise<ApiResult<{ count: number }>>;
  postNote(note: NoteBody): Promise<ApiResult<{ ok: boolean }>>;
  getToday(): Promise<ApiResult<Today>>;
}

export const DEFAULT_TIMEOUT_MS = 12000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createApi(
  base: string,
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Api {
  const enabled = base !== '';

  async function call<T>(path: string, parse: (body: unknown) => T | null, body?: unknown): Promise<ApiResult<T>> {
    if (!enabled) return { ok: false, reason: 'disabled' };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const init: RequestInit =
        body === undefined
          ? { signal: ctl.signal }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
              signal: ctl.signal,
            };
      const res = await fetchImpl(base + path, init);
      if (!res.ok) return { ok: false, reason: 'http', status: res.status };
      const data = parse(await res.json());
      return data === null ? { ok: false, reason: 'invalid' } : { ok: true, data };
    } catch (err) {
      /* the three ways a request legitimately fails; anything else is a bug and should surface */
      if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, reason: 'timeout' };
      if (err instanceof SyntaxError) return { ok: false, reason: 'invalid' };
      if (err instanceof TypeError) return { ok: false, reason: 'network' };
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  const withSchema =
    <T>(schema: z.ZodMiniType<T>) =>
    (body: unknown): T | null => {
      const r = schema.safeParse(body);
      return r.success ? r.data : null;
    };

  return {
    enabled,
    getLanterns: () => call('/api/lanterns', parseLanterns),
    postLantern: (l) => call('/api/lanterns', withSchema(lanternCountSchema), l),
    postNote: (note) => call('/api/notes', withSchema(noteAckSchema), note),
    getToday: () => call('/api/today', parseToday),
  };
}
