import { describe, it, expect } from 'vitest';
import {
  computeCloseVtubers,
  computeCloseVtubersByRank,
  collectCloseVtuberPaths,
  computeCloseEdgePaths,
  computeCloseFictionalVtubers,
  computeCloseFictionalVtubersByRank,
  computeCloseFictionalEdgePaths,
  collectCloseFictionalVtuberPaths,
} from '../tree';
import { realEntry, fictionalEntry } from './fixtures';

describe('computeCloseVtubers', () => {
  it('returns empty map for null/empty inputs', () => {
    expect(computeCloseVtubers([], [], 2).size).toBe(0);
  });

  it('finds close vtubers sharing common path prefix', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|H'),
      realEntry('u3', 'A|B|C|X|Y|Z|W'),
    ];
    const closeMap = computeCloseVtubers(focused, all, 2);
    expect(closeMap.has('u2')).toBe(true);
    expect(closeMap.has('u3')).toBe(false);
  });

  it('excludes the focused user', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const closeMap = computeCloseVtubers(focused, focused, 2);
    expect(closeMap.has('u1')).toBe(false);
  });
});

describe('computeCloseVtubersByRank', () => {
  it('returns null for empty inputs', () => {
    expect(computeCloseVtubersByRank([], [])).toBeNull();
  });

  it('groups close vtubers by depth', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|H'),
      realEntry('u3', 'A|B|C|D|E|X|Y'),
    ];
    const byRank = computeCloseVtubersByRank(focused, all, 2);
    expect(byRank).not.toBeNull();
    expect(byRank!.get(6)).toBe(1);
    expect(byRank!.get(5)).toBe(1);
  });
});

describe('collectCloseVtuberPaths', () => {
  it('returns empty for null ids', () => {
    expect(collectCloseVtuberPaths(null, []).size).toBe(0);
  });

  it('collects paths for close vtuber ids', () => {
    const entries = [
      realEntry('u1', 'A|B|C'),
      realEntry('u2', 'A|B|D'),
    ];
    const ids = new Set(['u2']);
    const paths = collectCloseVtuberPaths(ids, entries);
    expect(paths.has('A')).toBe(true);
    expect(paths.has('A|B')).toBe(true);
    expect(paths.has('A|B|D')).toBe(true);
    expect(paths.has('A|B|C')).toBe(false);
  });
});

describe('computeCloseEdgePaths', () => {
  it('returns empty set for empty inputs', () => {
    expect(computeCloseEdgePaths([], [], null, 2).size).toBe(0);
  });

  it('collects edge paths for focused and close vtubers', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|H'),
      realEntry('u3', 'X|Y|Z|W|V|U|T'),
    ];
    const closeIds = new Set(['u2']);
    const edges = computeCloseEdgePaths(focused, all, closeIds, 2);

    expect(edges.has('A|B|C|D|E|F|G|__vtuber__u1')).toBe(true);
    expect(edges.has('A|B|C|D|E|F|H|__vtuber__u2')).toBe(true);
    expect(edges.has('X|Y|Z|W|V|U|T|__vtuber__u3')).toBe(false);
  });

  it('includes breed segment in edge paths', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|G', { breed_id: 10 }),
    ];
    const closeIds = new Set(['u2']);
    const edges = computeCloseEdgePaths(focused, all, closeIds, 2);
    expect(edges.has('A|B|C|D|E|F|G|__breed__10')).toBe(true);
  });
});

describe('computeCloseFictionalVtubers', () => {
  it('finds close fictional vtubers', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const all = [
      ...focused,
      fictionalEntry('u2', 'A|B|D'),
      fictionalEntry('u3', 'A|X|Y'),
    ];
    const closeMap = computeCloseFictionalVtubers(focused, all, 1);
    expect(closeMap.has('u2')).toBe(true);
  });
});

describe('computeCloseFictionalVtubersByRank', () => {
  it('returns null for empty inputs', () => {
    expect(computeCloseFictionalVtubersByRank([], [])).toBeNull();
  });

  it('groups close fictional vtubers by depth', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const all = [
      ...focused,
      fictionalEntry('u2', 'A|B|D'),
      fictionalEntry('u3', 'A|X|Y'),
    ];
    const byRank = computeCloseFictionalVtubersByRank(focused, all, 1);
    expect(byRank).not.toBeNull();
    expect(byRank!.get(2)).toBe(1);
  });

  it('excludes the focused user', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const byRank = computeCloseFictionalVtubersByRank(focused, focused, 1);
    expect(byRank).toBeNull();
  });
});

describe('computeCloseFictionalEdgePaths', () => {
  it('returns empty set for empty inputs', () => {
    expect(computeCloseFictionalEdgePaths([], [], null, 1).size).toBe(0);
  });

  it('collects fictional edge paths for focused and close vtubers', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const all = [
      ...focused,
      fictionalEntry('u2', 'A|B|D'),
    ];
    const closeIds = new Set(['u2']);
    const edges = computeCloseFictionalEdgePaths(focused, all, closeIds, 1);

    expect(edges.has('__F__|A|B|C|__vtuber__u1')).toBe(true);
    expect(edges.has('__F__|A|B|D|__vtuber__u2')).toBe(true);
  });

  it('excludes unrelated vtubers', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const all = [
      ...focused,
      fictionalEntry('u3', 'X|Y|Z'),
    ];
    const edges = computeCloseFictionalEdgePaths(focused, all, null, 1);
    expect(edges.has('__F__|X|Y|Z|__vtuber__u3')).toBe(false);
  });
});

describe('collectCloseFictionalVtuberPaths', () => {
  it('returns empty for null ids', () => {
    expect(collectCloseFictionalVtuberPaths(null, []).size).toBe(0);
  });

  it('collects fictional paths for close vtuber ids', () => {
    const entries = [
      fictionalEntry('u1', 'A|B|C'),
      fictionalEntry('u2', 'A|B|D'),
    ];
    const ids = new Set(['u2']);
    const paths = collectCloseFictionalVtuberPaths(ids, entries);
    expect(paths.has('__F__|A')).toBe(true);
    expect(paths.has('__F__|A|B')).toBe(true);
    expect(paths.has('__F__|A|B|D')).toBe(true);
    expect(paths.has('__F__|A|B|C')).toBe(false);
  });
});
