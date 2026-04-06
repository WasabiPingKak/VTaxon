// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import {
  getDailyHash,
  entryToKey,
  computeRawFocusedEntries,
  applyLiveDedup,
  computeLiveCount,
  buildSortConfigs,
  deriveFocusedSpeciesIdx,
  computeActiveFocusedEntries,
  computeMaxTraceBack,
  computeTraceBackLevels,
  computeDepthLabels,
  computeNodeBounds,
  resolveLocateEntry,
} from '../graphLogic';
import { realEntry, fictionalEntry } from './fixtures';

// ── getDailyHash ──

describe('getDailyHash', () => {
  it('returns a number', () => {
    expect(typeof getDailyHash()).toBe('number');
  });

  it('returns the same hash for the same date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const a = getDailyHash();
    vi.setSystemTime(new Date('2026-01-15T23:59:59Z'));
    const b = getDailyHash();
    expect(a).toBe(b);
    vi.useRealTimers();
  });
});

// ── entryToKey ──

describe('entryToKey', () => {
  it('returns null for null input', () => {
    expect(entryToKey(null)).toBeNull();
  });

  it('returns taxon_path + breed_id for real entry', () => {
    const e = realEntry('u1', 'A|B|C', { breed_id: 42 });
    expect(entryToKey(e)).toBe('A|B|C\x0042');
  });

  it('returns taxon_path + empty string when breed_id is missing', () => {
    const e = realEntry('u1', 'A|B|C');
    expect(entryToKey(e)).toBe('A|B|C\x00');
  });

  it('returns fictional key for fictional entry', () => {
    const e = fictionalEntry('u1', 'X|Y|Z', { fictional_species_id: 99 });
    expect(entryToKey(e)).toBe('F\x00X|Y|Z\x0099');
  });

  it('returns fictional key with empty species_id when missing', () => {
    const e = fictionalEntry('u1', 'X|Y');
    expect(entryToKey(e)).toBe('F\x00X|Y\x00');
  });
});

// ── computeRawFocusedEntries ──

describe('computeRawFocusedEntries', () => {
  const r1 = realEntry('u1', 'A|B');
  const r2 = realEntry('u2', 'C|D');
  const f1 = fictionalEntry('u1', 'X|Y');
  const f2 = fictionalEntry('u3', 'M|N');

  it('returns empty array when userId is null', () => {
    expect(computeRawFocusedEntries(null, [r1, r2], [f1])).toEqual([]);
  });

  it('filters real entries by userId', () => {
    expect(computeRawFocusedEntries('u1', [r1, r2], null)).toEqual([r1]);
  });

  it('filters fictional entries by userId', () => {
    expect(computeRawFocusedEntries('u1', null, [f1, f2])).toEqual([f1]);
  });

  it('combines real + fictional for the same user', () => {
    expect(computeRawFocusedEntries('u1', [r1, r2], [f1, f2])).toEqual([r1, f1]);
  });

  it('returns empty when user has no entries', () => {
    expect(computeRawFocusedEntries('u999', [r1], [f1])).toEqual([]);
  });
});

// ── applyLiveDedup ──

describe('applyLiveDedup', () => {
  it('filters to only live user entries', () => {
    const entries = [realEntry('u1', 'A'), realEntry('u2', 'B'), realEntry('u3', 'C')];
    const liveIds = new Set(['u1', 'u3']);
    const result = applyLiveDedup(entries, liveIds, new Map(), 'real');
    expect(result.map(e => e.user_id)).toEqual(['u1', 'u3']);
  });

  it('returns empty when no live users', () => {
    const entries = [realEntry('u1', 'A')];
    const result = applyLiveDedup(entries, new Set(), new Map(), 'real');
    expect(result).toEqual([]);
  });

  it('deduplicates by user_id', () => {
    const entries = [
      realEntry('u1', 'A'),
      realEntry('u1', 'B'),
    ];
    const liveIds = new Set(['u1']);
    const result = applyLiveDedup(entries, liveIds, new Map(), 'real');
    expect(result).toHaveLength(1);
    expect(result[0].taxon_path).toBe('A');
  });

  it('prefers primary trait over fallback (real)', () => {
    const entries = [
      { ...realEntry('u1', 'A'), trait_id: 'trait-a' },
      { ...realEntry('u1', 'B'), trait_id: 'trait-b' },
    ];
    const liveIds = new Set(['u1']);
    const primaries = new Map([['u1', { real: 'trait-b' }]]);
    const result = applyLiveDedup(entries, liveIds, primaries, 'real');
    expect(result).toHaveLength(1);
    expect(result[0].taxon_path).toBe('B');
  });

  it('prefers primary trait over fallback (fictional)', () => {
    const entries = [
      { ...fictionalEntry('u1', 'X|Y'), trait_id: 'trait-x' },
      { ...fictionalEntry('u1', 'X|Z'), trait_id: 'trait-z' },
    ];
    const liveIds = new Set(['u1']);
    const primaries = new Map([['u1', { fictional: 'trait-z' }]]);
    const result = applyLiveDedup(entries, liveIds, primaries, 'fictional');
    expect(result).toHaveLength(1);
    expect(result[0].fictional_path).toBe('X|Z');
  });

  it('falls back to first entry when no primary match', () => {
    const entries = [
      { ...realEntry('u1', 'A'), trait_id: 'trait-a' },
      { ...realEntry('u1', 'B'), trait_id: 'trait-b' },
    ];
    const liveIds = new Set(['u1']);
    const primaries = new Map([['u1', { real: 'trait-none' }]]);
    const result = applyLiveDedup(entries, liveIds, primaries, 'real');
    expect(result).toHaveLength(1);
    expect(result[0].taxon_path).toBe('A');
  });

  it('handles multiple live users with dedup', () => {
    const entries = [
      realEntry('u1', 'A'),
      realEntry('u1', 'B'),
      realEntry('u2', 'C'),
      realEntry('u2', 'D'),
    ];
    const liveIds = new Set(['u1', 'u2']);
    const result = applyLiveDedup(entries, liveIds, new Map(), 'real');
    expect(result).toHaveLength(2);
    expect(result.map(e => e.user_id)).toEqual(['u1', 'u2']);
  });

  it('keeps all entries for different users even without primaries', () => {
    const entries = [
      realEntry('u1', 'A'),
      realEntry('u2', 'B'),
      realEntry('u3', 'C'),
    ];
    const liveIds = new Set(['u1', 'u2', 'u3']);
    const result = applyLiveDedup(entries, liveIds, new Map(), 'real');
    expect(result).toHaveLength(3);
  });
});

// ── computeLiveCount ──

describe('computeLiveCount', () => {
  it('returns 0 when entries is null', () => {
    expect(computeLiveCount(null, null, new Set(['u1']))).toBe(0);
  });

  it('returns 0 when liveUserIds is empty', () => {
    expect(computeLiveCount([realEntry('u1', 'A')], null, new Set())).toBe(0);
  });

  it('counts unique live users across real + fictional', () => {
    const real = [realEntry('u1', 'A'), realEntry('u2', 'B')];
    const fict = [fictionalEntry('u1', 'X'), fictionalEntry('u3', 'Y')];
    const liveIds = new Set(['u1', 'u2', 'u3']);
    expect(computeLiveCount(real, fict, liveIds)).toBe(3);
  });

  it('does not double-count same user in both trees', () => {
    const real = [realEntry('u1', 'A')];
    const fict = [fictionalEntry('u1', 'X')];
    const liveIds = new Set(['u1']);
    expect(computeLiveCount(real, fict, liveIds)).toBe(1);
  });
});

// ── buildSortConfigs ──

describe('buildSortConfigs', () => {
  const liveIds = new Set(['u1']);

  it('returns base config for both trees when no shuffle', () => {
    const { realSortConfig, fictSortConfig } = buildSortConfigs('name', 'asc', null, liveIds, 'real');
    expect(realSortConfig).toEqual({ key: 'name', order: 'asc', shuffleSeed: null, liveUserIds: liveIds });
    expect(fictSortConfig).toEqual({ key: 'name', order: 'asc', shuffleSeed: null, liveUserIds: liveIds });
  });

  it('overrides real tree with shuffle when activeTree is real', () => {
    const { realSortConfig, fictSortConfig } = buildSortConfigs('name', 'asc', 42, liveIds, 'real');
    expect(realSortConfig.key).toBe('shuffle');
    expect(realSortConfig.shuffleSeed).toBe(42);
    expect(fictSortConfig.key).toBe('name');
  });

  it('overrides fictional tree with shuffle when activeTree is fictional', () => {
    const { realSortConfig, fictSortConfig } = buildSortConfigs('name', 'asc', 42, liveIds, 'fictional');
    expect(realSortConfig.key).toBe('name');
    expect(fictSortConfig.key).toBe('shuffle');
    expect(fictSortConfig.shuffleSeed).toBe(42);
  });

  it('propagates sortOrder to shuffle config', () => {
    const { realSortConfig } = buildSortConfigs('name', 'desc', 42, liveIds, 'real');
    expect(realSortConfig.order).toBe('desc');
  });

  it('propagates liveUserIds to base config', () => {
    const { realSortConfig } = buildSortConfigs('created_at', 'asc', null, liveIds, 'real');
    expect(realSortConfig.liveUserIds).toBe(liveIds);
  });

  it('shuffle config does not carry liveUserIds', () => {
    const { realSortConfig } = buildSortConfigs('name', 'asc', 42, liveIds, 'real');
    expect(realSortConfig.liveUserIds).toBeUndefined();
  });
});

// ── computeMaxTraceBack ──

describe('computeMaxTraceBack', () => {
  it('returns 0 for empty entries', () => {
    expect(computeMaxTraceBack([], false)).toBe(0);
  });

  it('computes correctly for real entry (7 segments → 4)', () => {
    const e = realEntry('u1', 'A|B|C|D|E|F|G');
    expect(computeMaxTraceBack([e], false)).toBe(4);
  });

  it('computes correctly for fictional entry (4 segments → 3)', () => {
    const e = fictionalEntry('u1', 'A|B|C|D');
    expect(computeMaxTraceBack([e], true)).toBe(3);
  });

  it('clamps to 0 for real entry with 3 or fewer segments', () => {
    const e = realEntry('u1', 'A|B|C');
    expect(computeMaxTraceBack([e], false)).toBe(0);
  });

  it('returns 0 for fictional entry with 1 segment', () => {
    const e = fictionalEntry('u1', 'A');
    expect(computeMaxTraceBack([e], true)).toBe(0);
  });
});

// ── computeTraceBackLevels ──

describe('computeTraceBackLevels', () => {
  it('returns empty for empty entries', () => {
    expect(computeTraceBackLevels([], 0, false)).toEqual([]);
  });

  it('fictional with 4 segments returns 4 levels', () => {
    const e = fictionalEntry('u1', 'A|B|C|D');
    const levels = computeTraceBackLevels([e], 3, true);
    expect(levels).toHaveLength(4);
    expect(levels.map(l => l.label)).toEqual(['同來源', '同體系', '同類型', '同種']);
    expect(levels.map(l => l.value)).toEqual([3, 2, 1, 0]);
  });

  it('fictional with 3 segments returns 3 levels', () => {
    const e = fictionalEntry('u1', 'A|B|C');
    const levels = computeTraceBackLevels([e], 2, true);
    expect(levels).toHaveLength(3);
    expect(levels.map(l => l.label)).toEqual(['同來源', '同體系', '同種']);
  });

  it('fictional with 2 segments returns 2 levels', () => {
    const e = fictionalEntry('u1', 'A|B');
    const levels = computeTraceBackLevels([e], 1, true);
    expect(levels).toHaveLength(2);
    expect(levels.map(l => l.label)).toEqual(['同來源', '同種']);
  });

  it('real entry returns 5 levels with correct labels', () => {
    const e = realEntry('u1', 'A|B|C|D|E|F|G|H');
    const levels = computeTraceBackLevels([e], 5, false);
    expect(levels).toHaveLength(5);
    expect(levels.map(l => l.label)).toEqual(['同綱', '同目', '同科', '同屬', '同種']);
  });

  it('real entry: value = maxDepth - depth', () => {
    const e = realEntry('u1', 'A|B|C|D|E|F|G|H');
    const levels = computeTraceBackLevels([e], 5, false);
    expect(levels.map(l => l.value)).toEqual([5, 4, 3, 2, 1]);
  });

  it('available respects maxTraceBack boundary', () => {
    const e = fictionalEntry('u1', 'A|B|C|D');
    const levels = computeTraceBackLevels([e], 1, true);
    expect(levels.map(l => l.available)).toEqual([false, false, true, true]);
  });

  it('real: available respects maxTraceBack boundary', () => {
    const e = realEntry('u1', 'A|B|C|D|E|F|G|H');
    const levels = computeTraceBackLevels([e], 2, false);
    expect(levels.map(l => l.available)).toEqual([false, false, false, true, true]);
  });
});

// ── computeDepthLabels ──

describe('computeDepthLabels', () => {
  it('returns null for empty entries', () => {
    expect(computeDepthLabels([], false)).toBeNull();
  });

  it('fictional with 4+ segments returns 4-key object', () => {
    const e = fictionalEntry('u1', 'A|B|C|D');
    expect(computeDepthLabels([e], true)).toEqual({ 4: '同種', 3: '同類型', 2: '同體系', 1: '同來源' });
  });

  it('fictional with 3 segments returns 3-key object', () => {
    const e = fictionalEntry('u1', 'A|B|C');
    expect(computeDepthLabels([e], true)).toEqual({ 3: '同種', 2: '同體系', 1: '同來源' });
  });

  it('fictional with 2 segments returns 2-key object', () => {
    const e = fictionalEntry('u1', 'A|B');
    expect(computeDepthLabels([e], true)).toEqual({ 2: '同種', 1: '同來源' });
  });

  it('real entry returns fixed 8-key object', () => {
    const e = realEntry('u1', 'A|B|C|D|E|F|G|H');
    const labels = computeDepthLabels([e], false);
    expect(labels).toEqual({
      8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界',
    });
  });
});

// ── deriveFocusedSpeciesIdx ──

describe('deriveFocusedSpeciesIdx', () => {
  it('returns 0 when key is null', () => {
    expect(deriveFocusedSpeciesIdx(null, [realEntry('u1', 'A')])).toBe(0);
  });

  it('returns 0 when entries is empty', () => {
    expect(deriveFocusedSpeciesIdx('some-key', [])).toBe(0);
  });

  it('finds correct index for real entry', () => {
    const entries = [
      realEntry('u1', 'A|B', { breed_id: 1 }),
      realEntry('u1', 'C|D', { breed_id: 2 }),
    ];
    const key = 'C|D\x002';
    expect(deriveFocusedSpeciesIdx(key, entries)).toBe(1);
  });

  it('finds correct index for fictional entry', () => {
    const entries = [
      fictionalEntry('u1', 'X|Y', { fictional_species_id: 10 }),
      fictionalEntry('u1', 'A|B', { fictional_species_id: 20 }),
    ];
    const key = 'F\x00A|B\x0020';
    expect(deriveFocusedSpeciesIdx(key, entries)).toBe(1);
  });

  it('returns 0 when no match found', () => {
    const entries = [realEntry('u1', 'A|B')];
    expect(deriveFocusedSpeciesIdx('nonexistent', entries)).toBe(0);
  });
});

// ── computeActiveFocusedEntries ──

describe('computeActiveFocusedEntries', () => {
  it('returns entry at valid index', () => {
    const entries = [realEntry('u1', 'A'), realEntry('u2', 'B')];
    expect(computeActiveFocusedEntries(entries, 1)).toEqual([entries[1]]);
  });

  it('falls back to index 0 when out of range', () => {
    const entries = [realEntry('u1', 'A'), realEntry('u2', 'B')];
    expect(computeActiveFocusedEntries(entries, 99)).toEqual([entries[0]]);
  });

  it('returns empty array when entries is empty', () => {
    expect(computeActiveFocusedEntries([], 0)).toEqual([]);
  });
});

// ── computeNodeBounds ──

describe('computeNodeBounds', () => {
  const nodes = [
    { x: 10, y: 20, data: { _pathKey: 'A' } },
    { x: 50, y: 5, data: { _pathKey: '__F__|X' } },
    { x: 30, y: 40, data: { _pathKey: 'B|C' } },
  ];

  it('returns bounds of all nodes when no filter', () => {
    expect(computeNodeBounds(nodes)).toEqual({ minX: 10, minY: 5, maxX: 50, maxY: 40 });
  });

  it('returns null for empty array', () => {
    expect(computeNodeBounds([])).toBeNull();
  });

  it('filters nodes correctly', () => {
    const result = computeNodeBounds(nodes, n => !(n.data._pathKey || '').startsWith('__F__'));
    expect(result).toEqual({ minX: 10, minY: 20, maxX: 30, maxY: 40 });
  });

  it('returns null when filter matches nothing', () => {
    expect(computeNodeBounds(nodes, () => false)).toBeNull();
  });

  it('handles single node', () => {
    expect(computeNodeBounds([nodes[0]])).toEqual({ minX: 10, minY: 20, maxX: 10, maxY: 20 });
  });
});

// ── resolveLocateEntry ──

describe('resolveLocateEntry', () => {
  const r1 = realEntry('u1', 'A|B', { breed_id: 1 });
  const r2 = realEntry('u1', 'C|D', { breed_id: 2 });
  const r3 = realEntry('u2', 'E|F');
  const f1 = fictionalEntry('u1', 'X|Y', { fictional_species_id: 10 });
  const f2 = fictionalEntry('u3', 'M|N', { fictional_species_id: 20 });

  it('finds by fictional_path + fid', () => {
    const result = resolveLocateEntry([r1], [f1, f2], 'u1', null, 'X|Y', null, '10');
    expect(result).toBe(f1);
  });

  it('finds by taxon_path + bid', () => {
    const result = resolveLocateEntry([r1, r2], [f1], 'u1', 'C|D', null, '2', null);
    expect(result).toBe(r2);
  });

  it('falls back to first entry for userId', () => {
    const result = resolveLocateEntry([r1, r3], [f2], 'u2', null, null, null, null);
    expect(result).toBe(r3);
  });

  it('falls back to fictional when no real match', () => {
    const result = resolveLocateEntry([r1], [f2], 'u3', null, null, null, null);
    expect(result).toBe(f2);
  });

  it('returns undefined when no match', () => {
    const result = resolveLocateEntry([r1], [f1], 'u999', null, null, null, null);
    expect(result).toBeUndefined();
  });

  it('handles null entries gracefully', () => {
    const result = resolveLocateEntry(null, null, 'u1', null, null, null, null);
    expect(result).toBeUndefined();
  });

  it('matches taxon_path without bid filter', () => {
    const result = resolveLocateEntry([r1, r2], null, 'u1', 'A|B', null, null, null);
    expect(result).toBe(r1);
  });
});
