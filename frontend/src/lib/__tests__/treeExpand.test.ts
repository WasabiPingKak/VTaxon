import { describe, it, expect } from 'vitest';
import {
  buildTree,
  autoExpandPaths,
  autoExpandPathsUnfiltered,
  extendSingleChildChains,
  expandAllSingleChildChains,
  BUDGET_TIER_HIDDEN,
} from '../tree';
import { realEntry } from './fixtures';

describe('autoExpandPaths', () => {
  it('expands children with count <= threshold', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia'),
      realEntry('u2', 'Animalia|Chordata|Aves'),
    ];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPaths(tree, paths);

    expect(paths.has('Animalia')).toBe(true);
    expect(paths.has('Animalia|Chordata')).toBe(true);
  });

  it('does not expand nodes exceeding threshold', () => {
    const classes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const entries = classes.map((c, i) => realEntry(`u${i}`, `K|P|${c}`));
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPaths(tree, paths);

    expect(paths.has('K')).toBe(true);
    expect(paths.has('K|P')).toBe(false);
    expect(paths.has('K|P|A')).toBe(false);
  });
});

describe('autoExpandPathsUnfiltered', () => {
  it('expands without checking visual tier', () => {
    const entries = [realEntry('u1', 'A|B|C', { trait_count: BUDGET_TIER_HIDDEN })];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPathsUnfiltered(tree, paths);
    expect(paths.has('A')).toBe(true);
  });
});

describe('extendSingleChildChains', () => {
  it('extends already-expanded single-child nodes', () => {
    const entries = [realEntry('u1', 'A|B|C|D')];
    const tree = buildTree(entries);
    const paths = new Set(['A']);
    extendSingleChildChains(tree, paths);
    expect(paths.has('A|B')).toBe(true);
    expect(paths.has('A|B|C')).toBe(true);
    expect(paths.has('A|B|C|D')).toBe(true);
  });
});

describe('expandAllSingleChildChains', () => {
  it('expands all single-child paths in tree', () => {
    const entries = [
      realEntry('u1', 'A|B|C'),
      realEntry('u2', 'A|B|D'),
    ];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    expandAllSingleChildChains(tree, paths);
    expect(paths.has('A')).toBe(true);
    expect(paths.has('A|B')).toBe(false);
  });
});
