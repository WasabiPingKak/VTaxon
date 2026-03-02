/**
 * Shared tree utilities extracted from TaxonomyTree.jsx.
 * Used by both the legacy text tree and the new graph canvas.
 */

const RANK_KEYS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_NAMES = {
  0: 'KINGDOM', 1: 'PHYLUM', 2: 'CLASS', 3: 'ORDER',
  4: 'FAMILY', 5: 'GENUS', 6: 'SPECIES', 7: 'SUBSPECIES',
  8: 'BREED',
};

/**
 * Build a tree structure from flat entries based on taxon_path.
 * Each entry's taxon_path looks like "Animalia|Chordata|Mammalia|..."
 * The vtuber is placed at the deepest node corresponding to their path.
 */
export function buildTree(entries) {
  const root = {
    name: 'Life', nameZh: '生命', rank: 'ROOT', pathKey: '',
    count: 0, children: new Map(), vtubers: [],
  };

  for (const entry of entries) {
    const parts = (entry.taxon_path || '').split('|');
    if (parts.length === 0) continue;

    let current = root;
    root.count++;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const pathKey = parts.slice(0, i + 1).join('|');

      if (!current.children.has(part)) {
        const rankKey = RANK_KEYS[i];
        let nameZh = rankKey ? (entry.path_zh?.[rankKey] || '') : '';
        if (!nameZh && i >= RANK_KEYS.length) {
          nameZh = entry.common_name_zh || '';
        }

        current.children.set(part, {
          name: part,
          nameZh,
          rank: RANK_NAMES[i] || '',
          pathKey,
          count: 0,
          children: new Map(),
          vtubers: [],
        });
      }

      const child = current.children.get(part);
      child.count++;

      if (!child.nameZh && i >= RANK_KEYS.length && entry.common_name_zh) {
        child.nameZh = entry.common_name_zh;
      }

      if (i === parts.length - 1) {
        if (entry.breed_id) {
          const breedKey = `${pathKey}|__breed__${entry.breed_id}`;
          if (!child.children.has(`__breed__${entry.breed_id}`)) {
            child.children.set(`__breed__${entry.breed_id}`, {
              name: entry.breed_name_en || entry.breed_name || '',
              nameZh: entry.breed_name_zh || entry.breed_name || '',
              rank: 'BREED',
              pathKey: breedKey,
              count: 0,
              children: new Map(),
              vtubers: [],
            });
          }
          const breedNode = child.children.get(`__breed__${entry.breed_id}`);
          breedNode.count++;
          breedNode.vtubers.push(entry);
        } else {
          child.vtubers.push(entry);
        }
      }

      current = child;
    }
  }

  return root;
}

/**
 * Compute the set of path keys belonging to a specific user.
 */
export function computeHighlightPaths(entries, userId) {
  const paths = new Set();
  if (!userId) return paths;

  for (const entry of entries) {
    if (entry.user_id !== userId) continue;
    const parts = (entry.taxon_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      const fullPath = parts.join('|');
      paths.add(`${fullPath}|__breed__${entry.breed_id}`);
    }
  }
  return paths;
}

/**
 * Find a node in the tree by its pathKey.
 */
export function findNode(root, pathKey) {
  if (root.pathKey === pathKey) return root;
  const parts = pathKey.split('|');
  let current = root;
  for (const part of parts) {
    const child = current.children.get(part);
    if (!child) return null;
    if (child.pathKey === pathKey) return child;
    current = child;
  }
  return null;
}

/**
 * Collect all expandable pathKeys from entries.
 */
export function collectAllPaths(entries) {
  const all = new Set();
  for (const entry of entries) {
    const parts = (entry.taxon_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      all.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      all.add(`${parts.join('|')}|__breed__${entry.breed_id}`);
    }
  }
  return all;
}

const ORDER_IDX = 3;

/**
 * Find vtubers "close" to the focused user using traceBack ancestor model.
 *
 * traceBack = N → 從物種位置往上追溯 N 層，該祖先下所有子節點都算近親。
 * 上限：祖先不可超過「目」（ORDER，path index 3）。
 *
 * traceBack guide (focused at species level, 7 segments):
 *   0 = 同種 (minCommon=7)
 *   1 = 同屬 (minCommon=6)
 *   2 = 同科 (minCommon=5)
 *   3 = 同目 (minCommon=4, 上限)
 */
export function computeCloseVtubers(focusedEntries, allEntries, traceBack = 2) {
  if (!focusedEntries?.length || !allEntries) return new Map();
  const focusedUserId = focusedEntries[0].user_id;
  const closeMap = new Map(); // Map<userId, Set<taxonPath>>

  const focusedPaths = focusedEntries.map(e => e.taxon_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => p.split('|'));

  // Pre-compute minCommon for each focused entry
  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - ORDER_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  for (const entry of allEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.taxon_path;
    if (!ep) continue;

    const epSegs = ep.split('|');

    for (let fi = 0; fi < focusedSegArrays.length; fi++) {
      const fpSegs = focusedSegArrays[fi];
      const minCommon = minCommons[fi];

      let common = 0;
      const minLen = Math.min(epSegs.length, fpSegs.length);
      for (let i = 0; i < minLen; i++) {
        if (epSegs[i] === fpSegs[i]) common++;
        else break;
      }

      if (common >= minCommon) {
        if (!closeMap.has(entry.user_id)) closeMap.set(entry.user_id, new Set());
        closeMap.get(entry.user_id).add(ep);
        break;
      }
    }
  }
  return closeMap;
}

/**
 * Collect pathKeys up to a certain rank depth.
 * depth 0=ROOT, 1=KINGDOM, 2=PHYLUM, 3=CLASS, 4=ORDER, 5=FAMILY, 6=GENUS
 */
/**
 * Collect all expandable pathKeys needed to reveal close vtuber nodes.
 */
export function collectCloseVtuberPaths(closeVtuberIds, entries) {
  const paths = new Set();
  if (!closeVtuberIds || closeVtuberIds.size === 0) return paths;

  for (const entry of entries) {
    if (!closeVtuberIds.has(entry.user_id)) continue;
    const parts = (entry.taxon_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      paths.add(`${parts.join('|')}|__breed__${entry.breed_id}`);
    }
  }
  return paths;
}

/**
 * Compute close vtuber counts grouped by taxonomy common depth.
 * Returns Map<commonDepth, count>. Each vtuber counted only at its highest depth match.
 * Uses the same traceBack ancestor model as computeCloseVtubers.
 */
export function computeCloseVtubersByRank(focusedEntries, allEntries, traceBack = 2) {
  if (!focusedEntries?.length || !allEntries) return null;
  const focusedUserId = focusedEntries[0].user_id;

  const focusedPaths = focusedEntries.map(e => e.taxon_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => p.split('|'));

  // Pre-compute minCommon for each focused entry
  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - ORDER_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  const bestDepth = new Map();

  for (const entry of allEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.taxon_path;
    if (!ep) continue;

    const epSegs = ep.split('|');

    for (let fi = 0; fi < focusedSegArrays.length; fi++) {
      const fpSegs = focusedSegArrays[fi];
      const minCommon = minCommons[fi];

      let common = 0;
      const minLen = Math.min(epSegs.length, fpSegs.length);
      for (let i = 0; i < minLen; i++) {
        if (epSegs[i] === fpSegs[i]) common++;
        else break;
      }

      if (common >= minCommon) {
        const prev = bestDepth.get(entry.user_id) || 0;
        if (common > prev) bestDepth.set(entry.user_id, common);
      }
    }
  }

  const byRank = new Map();
  for (const [, depth] of bestDepth) {
    byRank.set(depth, (byRank.get(depth) || 0) + 1);
  }

  return byRank.size > 0 ? byRank : null;
}

export function collectPathsToDepth(entries, maxDepth) {
  const paths = new Set();
  for (const entry of entries) {
    const parts = (entry.taxon_path || '').split('|');
    const limit = Math.min(parts.length, maxDepth);
    for (let i = 1; i <= limit; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
  }
  return paths;
}
