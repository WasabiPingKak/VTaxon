// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

/* ─── Mock supabase before importing api ─── */
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-jwt-token' } },
      }),
    },
  },
}));

import { api } from '../api';
import { ApiError } from '../../types/api';

/* ─── Helpers ─── */

/** Monotonic counter to generate unique query keys per test, avoiding cache collisions. */
let seq = 0;
function uniqueKey(prefix = 'q') { return `${prefix}-${++seq}`; }

function mockFetchJson(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  }) as unknown as typeof fetch;
}

function mockFetchError(errorBody: Record<string, unknown>, status: number) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(errorBody),
  }) as unknown as typeof fetch;
}

/** Create a mock ReadableStream reader that yields chunks then signals done. */
function mockStreamReader(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    read: vi.fn().mockImplementation(() => {
      if (i < chunks.length) {
        return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) });
      }
      return Promise.resolve({ done: true, value: undefined });
    }),
    cancel: vi.fn(),
  };
}

function mockFetchStream(chunks: string[], status = 200) {
  const reader = mockStreamReader(chunks);
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({}),
    body: { getReader: () => reader },
  }) as unknown as typeof fetch;
  return reader;
}

beforeEach(() => {
  vi.restoreAllMocks();
  api.clearTreeCache();
});

/* ─── apiFetch basics (via api.getMe) ─── */

describe('apiFetch', () => {
  it('sends Authorization header from supabase session', async () => {
    mockFetchJson({ id: 'u1', display_name: 'Test' });
    await api.getMe();

    const fetchMock = globalThis.fetch as Mock;
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('sends Content-Type application/json', async () => {
    mockFetchJson({ id: 'u1' });
    await api.getMe();

    const fetchMock = globalThis.fetch as Mock;
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetchError({ error: 'Not found' }, 404);
    await expect(api.getMe()).rejects.toThrow(ApiError);

    try {
      mockFetchError({ error: 'Forbidden' }, 403);
      await api.getMe();
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).message).toBe('Forbidden');
    }
  });

  it('falls back to status code when error field missing', async () => {
    mockFetchError({}, 500);
    try {
      await api.getMe();
    } catch (e) {
      expect((e as ApiError).message).toBe('API error 500');
    }
  });
});

/* ─── apiFetch with no session ─── */

describe('apiFetch without session', () => {
  it('omits Authorization header when not logged in', async () => {
    const { supabase } = await import('../supabase');
    (supabase.auth.getSession as Mock).mockResolvedValueOnce({
      data: { session: null },
    });
    mockFetchJson({});
    await api.getMe();

    const fetchMock = globalThis.fetch as Mock;
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });
});

/* ─── Cache behavior (searchSpecies) ─── */

describe('searchSpecies cache', () => {
  it('returns cached result on second call with same query', async () => {
    const key = uniqueKey('search');
    const species = [{ taxon_id: 1, scientific_name: 'Felis catus' }];
    mockFetchJson(species);

    const result1 = await api.searchSpecies(key);
    const result2 = await api.searchSpecies(key);

    expect(result1).toEqual(species);
    expect(result2).toEqual(species);
    expect((globalThis.fetch as Mock).mock.calls.length).toBe(1);
  });

  it('normalizes cache key (case-insensitive, trimmed)', async () => {
    const base = uniqueKey('norm');
    const species = [{ taxon_id: 1, scientific_name: 'Felis catus' }];
    mockFetchJson(species);

    await api.searchSpecies(`  ${base.toUpperCase()}  `);
    const result = await api.searchSpecies(base.toLowerCase());

    expect((globalThis.fetch as Mock).mock.calls.length).toBe(1);
    expect(result).toEqual(species);
  });
});

/* ─── Cache behavior (getTaxonomyTree) ─── */

describe('getTaxonomyTree cache', () => {
  it('caches tree entries', async () => {
    const qs = `?t=${uniqueKey('tree')}`;
    const data = { entries: [{ user_id: 'u1', taxon_path: 'A|B' }] };
    mockFetchJson(data);

    const r1 = await api.getTaxonomyTree(qs);
    const r2 = await api.getTaxonomyTree(qs);

    expect(r1.entries).toEqual(data.entries);
    expect(r2.entries).toEqual(data.entries);
    expect((globalThis.fetch as Mock).mock.calls.length).toBe(1);
  });

  it('clearTreeCache invalidates cache', async () => {
    const qs = `?t=${uniqueKey('treeclear')}`;
    const data = { entries: [] as unknown[] };

    // Use a single persistent mock to count total calls
    const fetchMock = vi.fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(data) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await api.getTaxonomyTree(qs);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call should hit cache
    await api.getTaxonomyTree(qs);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // After clearing, should fetch again
    api.clearTreeCache();
    await api.getTaxonomyTree(qs);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

/* ─── Stream parsing (searchSpeciesStream) ─── */

describe('searchSpeciesStream', () => {
  it('parses NDJSON lines and calls onResult per entry', async () => {
    const key = uniqueKey('stream-ndjson');
    const sp1 = { taxon_id: 1, scientific_name: 'Felis catus' };
    const sp2 = { taxon_id: 2, scientific_name: 'Canis lupus' };

    mockFetchStream([
      JSON.stringify(sp1) + '\n' + JSON.stringify(sp2) + '\n',
    ]);

    const results: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results.push(sp));

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(sp1);
    expect(results[1]).toEqual(sp2);
  });

  it('handles data split across multiple chunks', async () => {
    const key = uniqueKey('stream-split');
    const sp = { taxon_id: 1, scientific_name: 'Felis catus' };
    const json = JSON.stringify(sp);
    const mid = Math.floor(json.length / 2);

    mockFetchStream([
      json.slice(0, mid),
      json.slice(mid) + '\n',
    ]);

    const results: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results.push(sp));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(sp);
  });

  it('skips empty lines', async () => {
    const key = uniqueKey('stream-empty');
    const sp = { taxon_id: 1, scientific_name: 'X' };
    mockFetchStream([
      '\n\n' + JSON.stringify(sp) + '\n\n',
    ]);

    const results: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results.push(sp));
    expect(results).toHaveLength(1);
  });

  it('throws on error object in stream', async () => {
    const key = uniqueKey('stream-error');
    mockFetchStream([
      JSON.stringify({ error: 'rate limited' }) + '\n',
    ]);

    await expect(
      api.searchSpeciesStream(key, () => {}),
    ).rejects.toThrow('rate limited');
  });

  it('handles trailing data without newline', async () => {
    const key = uniqueKey('stream-trail');
    const sp = { taxon_id: 1, scientific_name: 'Trailing' };
    mockFetchStream([JSON.stringify(sp)]);

    const results: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results.push(sp));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(sp);
  });

  it('respects abort signal', async () => {
    const key = uniqueKey('stream-abort');
    const controller = new AbortController();
    controller.abort();

    const sp = { taxon_id: 1, scientific_name: 'X' };
    const reader = mockFetchStream([JSON.stringify(sp) + '\n']);

    const results: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results.push(sp), { signal: controller.signal });
    expect(results).toHaveLength(0);
    expect(reader.cancel).toHaveBeenCalled();
  });

  it('uses cache on second stream call', async () => {
    const key = uniqueKey('stream-cache');
    const sp = { taxon_id: 1, scientific_name: 'Cached' };
    mockFetchStream([JSON.stringify(sp) + '\n']);

    const results1: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results1.push(sp));

    const results2: unknown[] = [];
    await api.searchSpeciesStream(key, (sp) => results2.push(sp));

    expect(results1).toHaveLength(1);
    expect(results2).toHaveLength(1);
    expect((globalThis.fetch as Mock).mock.calls.length).toBe(1);
  });
});

/* ─── POST methods ─── */

describe('POST methods', () => {
  it('authCallback sends POST with body', async () => {
    mockFetchJson({ id: 'u1', display_name: 'Test' });
    await api.authCallback({ display_name: 'Test' });

    const fetchMock = globalThis.fetch as Mock;
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/callback');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ display_name: 'Test' });
  });
});

/* ─── Trait mutation events ─── */

describe('trait mutations dispatch events', () => {
  it('createTrait dispatches vtaxon:traits-changed', async () => {
    mockFetchJson({ id: 't1', user_id: 'u1' });

    const listener = vi.fn();
    window.addEventListener('vtaxon:traits-changed', listener);

    await api.createTrait({ taxon_id: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener('vtaxon:traits-changed', listener);
  });

  it('deleteTrait dispatches vtaxon:traits-changed', async () => {
    mockFetchJson({ ok: true });

    const listener = vi.fn();
    window.addEventListener('vtaxon:traits-changed', listener);

    await api.deleteTrait('t1');
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener('vtaxon:traits-changed', listener);
  });
});
