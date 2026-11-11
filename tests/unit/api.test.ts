import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApi } from '../../src/api/client';
import { resolveApiBase } from '../../src/api/config';
import { parseLanterns, parseToday } from '../../src/api/schemas';

const BASE = 'https://api.example.test';
const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const note = { text: 'hello', name: '', contact: '', website: '' };

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveApiBase', () => {
  it('is empty when nothing is configured, even on localhost', () => {
    expect(resolveApiBase(undefined, 'kekaisik1.github.io')).toBe('');
    expect(resolveApiBase('  ', 'localhost')).toBe('');
  });

  it('uses the configured address in production, without trailing slashes', () => {
    expect(resolveApiBase('https://api.example.test//', 'kekaisik1.github.io')).toBe('https://api.example.test');
  });

  it('uses a local copy on localhost only when an address is configured', () => {
    expect(resolveApiBase('https://api.example.test', 'localhost')).toBe('http://localhost:8787');
    expect(resolveApiBase('https://api.example.test', '127.0.0.1', '9000')).toBe('http://127.0.0.1:9000');
  });

  it('rejects anything that is not http(s)', () => {
    expect(resolveApiBase('javascript:alert(1)', 'example.org')).toBe('');
    expect(resolveApiBase('api.example.test', 'example.org')).toBe('');
  });
});

describe('api client with no address', () => {
  it('answers disabled without touching the network', async () => {
    const fetchMock = vi.fn();
    const api = createApi('', fetchMock);

    const results = await Promise.all([
      api.getLanterns(),
      api.getToday(),
      api.postNote(note),
      api.postLantern({ x: 0, y: 0, s: 0 }),
    ]);

    expect(api.enabled).toBe(false);
    for (const r of results) expect(r).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api client parsing', () => {
  it('reads lanterns and drops malformed ones', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      json({
        count: 12,
        lanterns: [{ x: 0.1, y: 0.2, s: 0.3 }, { x: 4, y: 0, s: 0 }, 'nope', { x: 0.5, y: 0.1, s: 1 }],
      }),
    );
    const api = createApi(BASE, fetchMock);

    const r = await api.getLanterns();

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/lanterns`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(r).toEqual({
      ok: true,
      data: {
        count: 12,
        lanterns: [
          { x: 0.1, y: 0.2, s: 0.3 },
          { x: 0.5, y: 0.1, s: 1 },
        ],
      },
    });
  });

  it('posts a lantern as JSON and reads the new count', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ count: 13 }, 201));
    const api = createApi(BASE, fetchMock);

    const r = await api.postLantern({ x: 0.1, y: 0.2, s: 0.3 });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"x":0.1,"y":0.2,"s":0.3}');
    expect(r).toEqual({ ok: true, data: { count: 13 } });
  });

  it('reads today: weather, now and growth, each checked on its own', () => {
    const today = parseToday({
      weather: { place: 'Astana', temp: -12.4, kind: 'snow', day: true },
      now: { label: 'Emberquill', at: '2026-11-10T10:00:00Z' },
      growth: {
        emberquill: { total: 310, week: 12, day: 3, at: 'x' },
        broken: { total: -1, week: 0, day: 0 },
        odd: 'no',
      },
    });

    expect(today).toEqual({
      weather: { place: 'Astana', temp: -12.4, kind: 'snow' },
      now: { label: 'Emberquill', at: '2026-11-10T10:00:00Z' },
      growth: { emberquill: { total: 310, week: 12, day: 3 } },
    });
  });

  it('treats missing or odd parts of today as absent rather than failing', () => {
    expect(parseToday({ weather: null, now: null, growth: {} })).toEqual({ weather: null, now: null, growth: {} });
    expect(parseToday({ weather: { place: 'X', temp: 1, kind: 'tornado' } })).toEqual({
      weather: null,
      now: null,
      growth: {},
    });
    expect(parseToday('nope')).toBeNull();
  });

  it('rejects a lantern list that is not shaped like one', () => {
    expect(parseLanterns({ count: -1, lanterns: [] })).toBeNull();
    expect(parseLanterns({ count: 1 })).toBeNull();
  });
});

describe('api client failures', () => {
  it('reports an HTTP error with its status', async () => {
    const api = createApi(BASE, vi.fn().mockResolvedValue(json({ detail: 'slow down' }, 429)));

    expect(await api.postNote(note)).toEqual({ ok: false, reason: 'http', status: 429 });
  });

  it('reports a network failure', async () => {
    const api = createApi(BASE, vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await api.getToday()).toEqual({ ok: false, reason: 'network' });
  });

  it('reports a body that is not JSON as invalid', async () => {
    const api = createApi(BASE, vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));

    expect(await api.getToday()).toEqual({ ok: false, reason: 'invalid' });
  });

  it('reports JSON of the wrong shape as invalid', async () => {
    const api = createApi(BASE, vi.fn().mockResolvedValue(json({ count: 'many' })));

    expect(await api.postLantern({ x: 0, y: 0, s: 0 })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('gives up after the timeout and aborts the request', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const api = createApi(BASE, fetchMock, 1000);

    const pending = api.getLanterns();
    await vi.advanceTimersByTimeAsync(1000);

    expect(await pending).toEqual({ ok: false, reason: 'timeout' });
  });

  it('lets an unexpected error surface instead of swallowing it', async () => {
    const api = createApi(BASE, vi.fn().mockRejectedValue(new RangeError('a bug')));

    await expect(api.getToday()).rejects.toThrow('a bug');
  });
});
