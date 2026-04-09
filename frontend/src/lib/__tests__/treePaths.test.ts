import { describe, it, expect } from 'vitest';
import {
  entryToVtuberPathKey,
  computeHighlightPaths,
  collectAllPaths,
  collectPathsToDepth,
  collectFictionalPathsToDepth,
  computeFictionalHighlightPaths,
  collectAllFictionalPaths,
} from '../tree';
import { realEntry, fictionalEntry } from './fixtures';

describe('entryToVtuberPathKey', () => {
  it('builds path key for real species entry', () => {
    const e = realEntry('u1', 'Animalia|Chordata');
    expect(entryToVtuberPathKey(e)).toBe('Animalia|Chordata|__vtuber__u1');
  });

  it('includes breed segment when breed_id is present', () => {
    const e = realEntry('u1', 'Animalia|Chordata', { breed_id: 5 });
    expect(entryToVtuberPathKey(e)).toBe('Animalia|Chordata|__breed__5|__vtuber__u1');
  });

  it('uses fictional prefix for fictional entries', () => {
    const e = fictionalEntry('u1', 'Western|Dragon');
    expect(entryToVtuberPathKey(e)).toBe('__F__|Western|Dragon|__vtuber__u1');
  });
});

describe('computeHighlightPaths', () => {
  it('returns empty set for null userId', () => {
    const entries = [realEntry('u1', 'A|B')];
    expect(computeHighlightPaths(entries, null).size).toBe(0);
  });

  it('collects all ancestor paths for matching user', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia'),
      realEntry('u2', 'Animalia|Chordata|Aves'),
    ];
    const paths = computeHighlightPaths(entries, 'u1');
    expect(paths.has('Animalia')).toBe(true);
    expect(paths.has('Animalia|Chordata')).toBe(true);
    expect(paths.has('Animalia|Chordata|Mammalia')).toBe(true);
    expect(paths.has('Animalia|Chordata|Aves')).toBe(false);
  });

  it('includes breed path when breed_id is present', () => {
    const entries = [realEntry('u1', 'A|B|C', { breed_id: 7 })];
    const paths = computeHighlightPaths(entries, 'u1');
    expect(paths.has('A|B|C|__breed__7')).toBe(true);
  });
});

describe('collectAllPaths', () => {
  it('collects all hierarchical paths', () => {
    const entries = [realEntry('u1', 'A|B|C')];
    const paths = collectAllPaths(entries);
    expect(paths).toEqual(new Set(['A', 'A|B', 'A|B|C']));
  });

  it('includes breed paths', () => {
    const entries = [realEntry('u1', 'A|B', { breed_id: 3 })];
    const paths = collectAllPaths(entries);
    expect(paths.has('A|B|__breed__3')).toBe(true);
  });
});

describe('collectPathsToDepth', () => {
  it('limits depth', () => {
    const entries = [realEntry('u1', 'A|B|C|D')];
    const paths = collectPathsToDepth(entries, 2);
    expect(paths).toEqual(new Set(['A', 'A|B']));
  });

  it('returns all when depth exceeds path length', () => {
    const entries = [realEntry('u1', 'A|B')];
    const paths = collectPathsToDepth(entries, 10);
    expect(paths).toEqual(new Set(['A', 'A|B']));
  });
});

describe('collectFictionalPathsToDepth', () => {
  it('limits fictional paths to depth', () => {
    const entries = [fictionalEntry('u1', 'A|B|C')];
    const paths = collectFictionalPathsToDepth(entries, 2);
    expect(paths).toEqual(new Set(['__F__|A', '__F__|A|B']));
  });
});

describe('computeFictionalHighlightPaths', () => {
  it('highlights fictional paths for user', () => {
    const entries = [
      fictionalEntry('u1', 'A|B|C'),
      fictionalEntry('u2', 'A|B|D'),
    ];
    const paths = computeFictionalHighlightPaths(entries, 'u1');
    expect(paths.has('__F__|A')).toBe(true);
    expect(paths.has('__F__|A|B')).toBe(true);
    expect(paths.has('__F__|A|B|C')).toBe(true);
    expect(paths.has('__F__|A|B|D')).toBe(false);
  });
});

describe('collectAllFictionalPaths', () => {
  it('collects all fictional hierarchical paths', () => {
    const entries = [fictionalEntry('u1', 'X|Y')];
    const paths = collectAllFictionalPaths(entries);
    expect(paths).toEqual(new Set(['__F__|X', '__F__|X|Y']));
  });
});
