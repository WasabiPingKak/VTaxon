import { describe, it, expect } from 'vitest';
import {
  stripAuthor,
  buildTree,
  entryToVtuberPathKey,
  findNode,
  computeHighlightPaths,
  collectAllPaths,
  getVisualTier,
  subtreeHasNormalUser,
  autoExpandPaths,
  autoExpandPathsUnfiltered,
  extendSingleChildChains,
  expandAllSingleChildChains,
  collectPathsToDepth,
  computeCloseVtubers,
  computeCloseVtubersByRank,
  collectCloseVtuberPaths,
  buildFictionalTree,
  collectFictionalPathsToDepth,
  computeFictionalHighlightPaths,
  collectAllFictionalPaths,
  computeCloseFictionalVtubers,
  BUDGET_TIER_DOT,
  BUDGET_TIER_HIDDEN,
} from '../treeUtils';
import { realEntry, fictionalEntry } from './fixtures';

/* ─── stripAuthor ─── */

describe('stripAuthor', () => {
  it('returns null/undefined as-is', () => {
    expect(stripAuthor(null)).toBeNull();
    expect(stripAuthor(undefined)).toBeUndefined();
  });

  it('returns name without author unchanged', () => {
    expect(stripAuthor('Vulpes vulpes')).toBe('Vulpes vulpes');
  });

  it('strips parenthesized author + year', () => {
    expect(stripAuthor('Vulpes zerda (Zimmermann, 1780)')).toBe('Vulpes zerda');
  });

  it('strips non-parenthesized author + year', () => {
    expect(stripAuthor('Felis catus Linnaeus, 1758')).toBe('Felis catus');
  });

  it('strips author with apostrophe', () => {
    expect(stripAuthor("Canis lupus O'Brien, 2000")).toBe('Canis lupus');
  });

  it('handles empty string', () => {
    expect(stripAuthor('')).toBe('');
  });
});

/* ─── buildTree ─── */

describe('buildTree', () => {
  it('returns root node for empty entries', () => {
    const tree = buildTree([]);
    expect(tree.name).toBe('Life');
    expect(tree.count).toBe(0);
    expect(tree.children.size).toBe(0);
  });

  it('builds hierarchy from single entry', () => {
    const entries = [realEntry('u1', 'Animalia|Chordata|Mammalia')];
    const tree = buildTree(entries);

    expect(tree.count).toBe(1);
    expect(tree.children.has('Animalia')).toBe(true);

    const animalia = tree.children.get('Animalia')!;
    expect(animalia.rank).toBe('KINGDOM');
    expect(animalia.pathKey).toBe('Animalia');
    expect(animalia.count).toBe(1);

    const chordata = animalia.children.get('Chordata')!;
    expect(chordata.rank).toBe('PHYLUM');
    expect(chordata.pathKey).toBe('Animalia|Chordata');

    const mammalia = chordata.children.get('Mammalia')!;
    expect(mammalia.rank).toBe('CLASS');
    expect(mammalia.vtubers).toHaveLength(1);
  });

  it('merges entries sharing the same path prefix', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia'),
      realEntry('u2', 'Animalia|Chordata|Aves'),
    ];
    const tree = buildTree(entries);

    expect(tree.count).toBe(2);
    const chordata = tree.children.get('Animalia')!.children.get('Chordata')!;
    expect(chordata.count).toBe(2);
    expect(chordata.children.size).toBe(2); // Mammalia + Aves
  });

  it('creates breed sub-nodes', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus familiaris', {
        breed_id: 42,
        breed_name: 'Shiba Inu',
        breed_name_en: 'Shiba Inu',
        breed_name_zh: '柴犬',
      }),
    ];
    const tree = buildTree(entries);

    // Navigate to species node
    let node = tree;
    for (const part of ['Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Canis', 'Canis lupus familiaris']) {
      node = node.children.get(part)!;
    }

    expect(node.children.has('__breed__42')).toBe(true);
    const breedNode = node.children.get('__breed__42')!;
    expect(breedNode.rank).toBe('BREED');
    expect(breedNode.nameZh).toBe('柴犬');
    expect(breedNode.vtubers).toHaveLength(1);
    // species node itself should NOT have the vtuber (it's on the breed node)
    expect(node.vtubers).toHaveLength(0);
  });

  it('applies path_zh for Chinese names', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata', {
        path_zh: { kingdom: '動物界', phylum: '脊索動物門' },
      }),
    ];
    const tree = buildTree(entries);
    expect(tree.children.get('Animalia')!.nameZh).toBe('動物界');
    expect(tree.children.get('Animalia')!.children.get('Chordata')!.nameZh).toBe('脊索動物門');
  });

  it('strips author citations from species-level path parts', () => {
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes zerda (Zimmermann, 1780)'),
    ];
    const tree = buildTree(entries);

    let node = tree;
    for (const part of ['Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Vulpes']) {
      node = node.children.get(part)!;
    }
    // The key should be the stripped name
    expect(node.children.has('Vulpes zerda')).toBe(true);
    expect(node.children.get('Vulpes zerda')!.name).toBe('Vulpes zerda');
  });
});

/* ─── entryToVtuberPathKey ─── */

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

/* ─── findNode ─── */

describe('findNode', () => {
  const entries = [realEntry('u1', 'Animalia|Chordata|Mammalia')];

  it('finds root', () => {
    const tree = buildTree(entries);
    expect(findNode(tree, '')).toBe(tree);
  });

  it('finds intermediate node', () => {
    const tree = buildTree(entries);
    const found = findNode(tree, 'Animalia|Chordata');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Chordata');
  });

  it('finds leaf node', () => {
    const tree = buildTree(entries);
    const found = findNode(tree, 'Animalia|Chordata|Mammalia');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Mammalia');
  });

  it('returns null for non-existent path', () => {
    const tree = buildTree(entries);
    expect(findNode(tree, 'Animalia|Arthropoda')).toBeNull();
  });
});

/* ─── getVisualTier ─── */

describe('getVisualTier', () => {
  it('returns "normal" for low trait_count', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 1 }))).toBe('normal');
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 4 }))).toBe('normal');
  });

  it('returns "dot" at BUDGET_TIER_DOT threshold', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: BUDGET_TIER_DOT }))).toBe('dot');
  });

  it('returns "hidden" at BUDGET_TIER_HIDDEN threshold', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: BUDGET_TIER_HIDDEN }))).toBe('hidden');
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 10 }))).toBe('hidden');
  });

  it('returns "normal" when is_live_primary regardless of trait_count', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 99, is_live_primary: true }))).toBe('normal');
  });

  it('returns "normal" when trait_count is undefined', () => {
    expect(getVisualTier(realEntry('u1', 'A'))).toBe('normal');
  });
});

/* ─── subtreeHasNormalUser ─── */

describe('subtreeHasNormalUser', () => {
  it('returns true when node has normal-tier vtuber', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: 1 })]);
    expect(subtreeHasNormalUser(tree)).toBe(true);
  });

  it('returns false when all vtubers are hidden', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: BUDGET_TIER_HIDDEN })]);
    expect(subtreeHasNormalUser(tree)).toBe(false);
  });

  it('returns true when nested child has dot-tier vtuber', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: BUDGET_TIER_DOT })]);
    expect(subtreeHasNormalUser(tree)).toBe(true); // dot is not hidden
  });
});

/* ─── computeHighlightPaths ─── */

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

/* ─── collectAllPaths ─── */

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

/* ─── collectPathsToDepth ─── */

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

/* ─── autoExpandPaths ─── */

describe('autoExpandPaths', () => {
  it('expands children with count <= threshold', () => {
    // Build a tree with a few entries under same kingdom
    const entries = [
      realEntry('u1', 'Animalia|Chordata|Mammalia'),
      realEntry('u2', 'Animalia|Chordata|Aves'),
    ];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPaths(tree, paths);

    // Animalia has 1 child (Chordata), Chordata has 2 children — both ≤ 5
    expect(paths.has('Animalia')).toBe(true);
    expect(paths.has('Animalia|Chordata')).toBe(true);
  });

  it('does not expand nodes exceeding threshold', () => {
    // 6 different classes under one phylum → exceeds AUTO_EXPAND_THRESHOLD (5)
    const classes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const entries = classes.map((c, i) => realEntry(`u${i}`, `K|P|${c}`));
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPaths(tree, paths);

    // K is single-child (→P) so it gets expanded via single-child chain.
    // But P has 6 children (> threshold) and is not single-child, so it is NOT expanded.
    expect(paths.has('K')).toBe(true);
    expect(paths.has('K|P')).toBe(false);
    expect(paths.has('K|P|A')).toBe(false);
  });
});

/* ─── autoExpandPathsUnfiltered ─── */

describe('autoExpandPathsUnfiltered', () => {
  it('expands without checking visual tier', () => {
    const entries = [realEntry('u1', 'A|B|C', { trait_count: BUDGET_TIER_HIDDEN })];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    autoExpandPathsUnfiltered(tree, paths);
    // Should still expand because unfiltered ignores visual tier
    expect(paths.has('A')).toBe(true);
  });
});

/* ─── extendSingleChildChains ─── */

describe('extendSingleChildChains', () => {
  it('extends already-expanded single-child nodes', () => {
    const entries = [realEntry('u1', 'A|B|C|D')];
    const tree = buildTree(entries);
    const paths = new Set(['A']);
    extendSingleChildChains(tree, paths);
    // A→B→C→D is all single-child chain, extending from A
    expect(paths.has('A|B')).toBe(true);
    expect(paths.has('A|B|C')).toBe(true);
    expect(paths.has('A|B|C|D')).toBe(true);
  });
});

/* ─── expandAllSingleChildChains ─── */

describe('expandAllSingleChildChains', () => {
  it('expands all single-child paths in tree', () => {
    const entries = [
      realEntry('u1', 'A|B|C'),
      realEntry('u2', 'A|B|D'),
    ];
    const tree = buildTree(entries);
    const paths = new Set<string>();
    expandAllSingleChildChains(tree, paths);
    // A is single-child (→B), B has 2 children → not single-child
    expect(paths.has('A')).toBe(true);
    expect(paths.has('A|B')).toBe(false); // B has 2 children
  });
});

/* ─── computeCloseVtubers ─── */

describe('computeCloseVtubers', () => {
  it('returns empty map for null/empty inputs', () => {
    expect(computeCloseVtubers([], [], 2).size).toBe(0);
  });

  it('finds close vtubers sharing common path prefix', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|H'), // same family, different species
      realEntry('u3', 'A|B|C|X|Y|Z|W'), // different order
    ];
    const closeMap = computeCloseVtubers(focused, all, 2);
    expect(closeMap.has('u2')).toBe(true);
    // u3 diverges at order level → too far
    expect(closeMap.has('u3')).toBe(false);
  });

  it('excludes the focused user', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const closeMap = computeCloseVtubers(focused, focused, 2);
    expect(closeMap.has('u1')).toBe(false);
  });
});

/* ─── computeCloseVtubersByRank ─── */

describe('computeCloseVtubersByRank', () => {
  it('returns null for empty inputs', () => {
    expect(computeCloseVtubersByRank([], [])).toBeNull();
  });

  it('groups close vtubers by depth', () => {
    const focused = [realEntry('u1', 'A|B|C|D|E|F|G')];
    const all = [
      ...focused,
      realEntry('u2', 'A|B|C|D|E|F|H'), // depth 6
      realEntry('u3', 'A|B|C|D|E|X|Y'), // depth 5
    ];
    const byRank = computeCloseVtubersByRank(focused, all, 2);
    expect(byRank).not.toBeNull();
    expect(byRank!.get(6)).toBe(1); // u2 shares 6 segments
    expect(byRank!.get(5)).toBe(1); // u3 shares 5 segments
  });
});

/* ─── collectCloseVtuberPaths ─── */

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
    expect(paths.has('A|B|C')).toBe(false); // u1 not in ids
  });
});

/* ─── Fictional tree utilities ─── */

describe('buildFictionalTree', () => {
  it('returns root for empty entries', () => {
    const tree = buildFictionalTree([]);
    expect(tree.name).toBe('Fictional');
    expect(tree.count).toBe(0);
  });

  it('builds fictional hierarchy', () => {
    const entries = [
      fictionalEntry('u1', 'Western Mythology|Norse Mythology|Dragon', {
        origin: '西方神話',
        sub_origin: '北歐神話',
        fictional_name_zh: '龍',
      }),
    ];
    const tree = buildFictionalTree(entries);

    expect(tree.count).toBe(1);
    const origin = tree.children.get('Western Mythology')!;
    expect(origin.rank).toBe('F_ORIGIN');
    expect(origin.nameZh).toBe('西方神話');

    const sub = origin.children.get('Norse Mythology')!;
    expect(sub.rank).toBe('F_SUB_ORIGIN');
    expect(sub.nameZh).toBe('北歐神話');

    const species = sub.children.get('Dragon')!;
    expect(species.rank).toBe('F_SPECIES');
    expect(species.nameZh).toBe('龍');
    expect(species.vtubers).toHaveLength(1);
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

describe('computeCloseFictionalVtubers', () => {
  it('finds close fictional vtubers', () => {
    const focused = [fictionalEntry('u1', 'A|B|C')];
    const all = [
      ...focused,
      fictionalEntry('u2', 'A|B|D'), // same sub_origin
      fictionalEntry('u3', 'A|X|Y'), // different sub_origin
    ];
    const closeMap = computeCloseFictionalVtubers(focused, all, 1);
    expect(closeMap.has('u2')).toBe(true);
  });
});
