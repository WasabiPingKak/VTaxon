/**
 * Shared tree utilities extracted from TaxonomyTree.jsx.
 * Used by both the legacy text tree and the new graph canvas.
 */

/** Strip taxonomic author citations from scientific names.
 *  "Vulpes zerda (Zimmermann, 1780)" → "Vulpes zerda" */
export function stripAuthor(name) {
  if (!name) return name;
  return name.replace(/\s+\(?[A-Z][\w.\s,''-]*,\s*\d{4}\)?$/, '').trim();
}

const RANK_KEYS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_NAMES = {
  0: 'KINGDOM', 1: 'PHYLUM', 2: 'CLASS', 3: 'ORDER',
  4: 'FAMILY', 5: 'GENUS', 6: 'SPECIES', 7: 'SUBSPECIES',
  8: 'BREED',
};

/** Split taxon_path and normalize species-level segments (strip author citations). */
function splitPath(taxonPath) {
  const parts = (taxonPath || '').split('|');
  for (let i = RANK_KEYS.length; i < parts.length; i++) {
    parts[i] = stripAuthor(parts[i]);
  }
  return parts;
}

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
    const parts = splitPath(entry.taxon_path);
    if (parts.length === 0) continue;

    let current = root;
    root.count++;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue; // skip empty rank segments (missing intermediate ranks)

      const pathKey = parts.slice(0, i + 1).join('|');

      // Use path_ranks for rank determination and zh key lookup
      const rankFromPath = entry.path_ranks?.[i];
      const zhKey = rankFromPath ? rankFromPath.toLowerCase() : RANK_KEYS[i];
      const rank = rankFromPath || RANK_NAMES[i] || '';

      if (!current.children.has(part)) {
        let nameZh = zhKey ? (entry.path_zh?.[zhKey] || '') : '';
        if (!nameZh && (i >= RANK_KEYS.length || i === parts.length - 1)) {
          nameZh = entry.common_name_zh || '';
        }

        current.children.set(part, {
          name: stripAuthor(part),
          nameZh,
          rank,
          pathKey,
          count: 0,
          children: new Map(),
          vtubers: [],
        });
      }

      const child = current.children.get(part);
      child.count++;

      // Update rank if new entry provides a more specific rank (e.g. SUBPHYLUM vs PHYLUM)
      if (rankFromPath && child.rank !== rankFromPath && rankFromPath.startsWith('SUB')) {
        child.rank = rankFromPath;
        if (!child.nameZh && zhKey) {
          child.nameZh = entry.path_zh?.[zhKey] || '';
        }
      }

      if (!child.nameZh && (i >= RANK_KEYS.length || i === parts.length - 1) && entry.common_name_zh) {
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

  // Post-pass: move unbreed vtubers to "未指定品種" node when breed siblings exist
  _addUnspecifiedBreedNodes(root);

  return root;
}

/**
 * Build a Set of normalized taxon_paths that have at least one breed entry.
 * Used to determine if a breedless entry would be placed under __breed__unspecified.
 */
export function buildBreedPaths(entries) {
  const paths = new Set();
  for (const entry of entries) {
    if (entry.breed_id) {
      paths.add(splitPath(entry.taxon_path).join('|'));
    }
  }
  return paths;
}

/**
 * Build the vtuber node pathKey for an entry, accounting for __breed__unspecified.
 * @param {object} entry - taxonomy entry with taxon_path, breed_id, user_id, fictional_path
 * @param {Set<string>} breedPaths - Set from buildBreedPaths()
 */
export function entryToVtuberPathKey(entry, breedPaths) {
  if (entry.fictional_path) {
    return `__F__|${entry.fictional_path}|__vtuber__${entry.user_id}`;
  }
  const parts = splitPath(entry.taxon_path);
  let pk = parts.join('|');
  if (entry.breed_id) {
    pk += `|__breed__${entry.breed_id}`;
  } else if (breedPaths && breedPaths.has(pk)) {
    pk += '|__breed__unspecified';
  }
  return pk + `|__vtuber__${entry.user_id}`;
}

/** Recursively add "未指定品種" virtual nodes for species that have both
 *  breed children and vtubers without a breed. */
function _addUnspecifiedBreedNodes(node) {
  for (const child of node.children.values()) {
    _addUnspecifiedBreedNodes(child);
  }
  if ((node.rank === 'SPECIES' || node.rank === 'SUBSPECIES') &&
      node.vtubers.length > 0 && node.children.size > 0) {
    const unspecKey = '__breed__unspecified';
    node.children.set(unspecKey, {
      name: '',
      nameZh: '未指定品種',
      rank: 'BREED',
      pathKey: `${node.pathKey}|${unspecKey}`,
      count: node.vtubers.length,
      children: new Map(),
      vtubers: [...node.vtubers],
    });
    node.vtubers = [];
  }
}

/**
 * Compute the set of path keys belonging to a specific user.
 */
export function computeHighlightPaths(entries, userId, breedPaths) {
  const paths = new Set();
  if (!userId) return paths;

  // Build breedPaths lazily if not provided
  const bp = breedPaths || buildBreedPaths(entries);

  for (const entry of entries) {
    if (entry.user_id !== userId) continue;
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    const fullPath = parts.join('|');
    if (entry.breed_id) {
      paths.add(`${fullPath}|__breed__${entry.breed_id}`);
    } else if (bp.has(fullPath)) {
      paths.add(`${fullPath}|__breed__unspecified`);
    }
  }
  return paths;
}

/**
 * Find a node in the tree by its pathKey.
 */
export function findNode(root, pathKey) {
  if (root.pathKey === pathKey) return root;

  // Strip root prefix for non-empty roots (e.g., fictional tree root '__F__')
  let navPath = pathKey;
  if (root.pathKey && pathKey.startsWith(root.pathKey + '|')) {
    navPath = pathKey.slice(root.pathKey.length + 1);
  }

  const parts = navPath.split('|');
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Try normalized key for species-level segments
    const key = i >= RANK_KEYS.length ? stripAuthor(part) : part;
    const child = current.children.get(key) || current.children.get(part);
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
  const bp = buildBreedPaths(entries);
  for (const entry of entries) {
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      all.add(parts.slice(0, i).join('|'));
    }
    const fullPath = parts.join('|');
    if (entry.breed_id) {
      all.add(`${fullPath}|__breed__${entry.breed_id}`);
    } else if (bp.has(fullPath)) {
      all.add(`${fullPath}|__breed__unspecified`);
    }
  }
  return all;
}

const AUTO_EXPAND_THRESHOLD = 5;

/**
 * Recursively expand children into pathSet when a node has ≤ threshold children.
 * Each level independently checks children.size ≤ 5; stops drilling when exceeded.
 */
export function autoExpandPaths(node, pathSet) {
  if (!node || node.children.size === 0) return;
  if (node.children.size === 1) {
    // Special case: 只有一個子節點時無條件遞迴展開
    const child = node.children.values().next().value;
    pathSet.add(child.pathKey);
    autoExpandPaths(child, pathSet);
  } else if (node.children.size <= AUTO_EXPAND_THRESHOLD) {
    for (const child of node.children.values()) {
      pathSet.add(child.pathKey);
      autoExpandPaths(child, pathSet);
    }
  }
}

const CLASS_IDX = 2;

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
  const focusedSegArrays = focusedPaths.map(p => splitPath(p));

  // Pre-compute minCommon for each focused entry
  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - CLASS_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  for (const entry of allEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.taxon_path;
    if (!ep) continue;

    const epSegs = splitPath(ep);

    for (let fi = 0; fi < focusedSegArrays.length; fi++) {
      const fpSegs = focusedSegArrays[fi];
      const minCommon = minCommons[fi];

      let common = 0;
      const minLen = Math.min(epSegs.length, fpSegs.length);
      for (let i = 0; i < minLen; i++) {
        if (epSegs[i] !== fpSegs[i]) break;
        if (epSegs[i]) common++; // don't count empty-to-empty (missing rank) matches
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
export function collectCloseVtuberPaths(closeVtuberIds, entries, breedPaths) {
  const paths = new Set();
  if (!closeVtuberIds || closeVtuberIds.size === 0) return paths;

  const bp = breedPaths || buildBreedPaths(entries);

  for (const entry of entries) {
    if (!closeVtuberIds.has(entry.user_id)) continue;
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    const fullPath = parts.join('|');
    if (entry.breed_id) {
      paths.add(`${fullPath}|__breed__${entry.breed_id}`);
    } else if (bp.has(fullPath)) {
      paths.add(`${fullPath}|__breed__unspecified`);
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
  const focusedSegArrays = focusedPaths.map(p => splitPath(p));

  // Pre-compute minCommon for each focused entry
  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - CLASS_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  const bestDepth = new Map();

  for (const entry of allEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.taxon_path;
    if (!ep) continue;

    const epSegs = splitPath(ep);

    for (let fi = 0; fi < focusedSegArrays.length; fi++) {
      const fpSegs = focusedSegArrays[fi];
      const minCommon = minCommons[fi];

      let common = 0;
      const minLen = Math.min(epSegs.length, fpSegs.length);
      for (let i = 0; i < minLen; i++) {
        if (epSegs[i] !== fpSegs[i]) break;
        if (epSegs[i]) common++; // don't count empty-to-empty (missing rank) matches
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
    const parts = splitPath(entry.taxon_path);
    const limit = Math.min(parts.length, maxDepth);
    for (let i = 1; i <= limit; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
  }
  return paths;
}


// ─── Fictional species tree utilities ───

const F_ORIGIN_IDX = 0;
const F_PREFIX = '__F__';
const F_RANK_NAMES = { 0: 'F_ORIGIN', 1: 'F_SUB_ORIGIN', 2: 'F_SPECIES' };

/**
 * Build a tree structure from fictional entries based on fictional_path.
 * fictional_path: "東方神話|日本神話|Kitsune" (origin|sub_origin|name)
 */
export function buildFictionalTree(entries) {
  const root = {
    name: 'Fictional', nameZh: '虛構生物', rank: 'F_ROOT', pathKey: F_PREFIX,
    count: 0, children: new Map(), vtubers: [],
  };

  for (const entry of entries) {
    const parts = (entry.fictional_path || '').split('|');
    if (parts.length === 0) continue;

    let current = root;
    root.count++;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const pathKey = F_PREFIX + '|' + parts.slice(0, i + 1).join('|');

      if (!current.children.has(part)) {
        let nameZh = '';
        if (i === 0) nameZh = entry.origin || '';
        else if (i === 1) nameZh = entry.sub_origin || '';
        else if (i === 2) nameZh = entry.fictional_name_zh || '';

        current.children.set(part, {
          name: part,
          nameZh,
          rank: F_RANK_NAMES[i] || 'F_SPECIES',
          pathKey,
          count: 0,
          children: new Map(),
          vtubers: [],
        });
      }

      const child = current.children.get(part);
      child.count++;

      if (i === parts.length - 1) {
        child.vtubers.push(entry);
      }

      current = child;
    }
  }

  return root;
}

/**
 * Collect fictional pathKeys up to a certain depth.
 * depth 0=F_ROOT, 1=F_ORIGIN, 2=F_SUB_ORIGIN
 */
export function collectFictionalPathsToDepth(entries, maxDepth) {
  const paths = new Set();
  for (const entry of entries) {
    const parts = (entry.fictional_path || '').split('|');
    const limit = Math.min(parts.length, maxDepth);
    for (let i = 1; i <= limit; i++) {
      paths.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return paths;
}

/**
 * Compute the set of fictional path keys belonging to a specific user.
 */
export function computeFictionalHighlightPaths(entries, userId) {
  const paths = new Set();
  if (!userId) return paths;

  for (const entry of entries) {
    if (entry.user_id !== userId) continue;
    const parts = (entry.fictional_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return paths;
}

/**
 * Collect all expandable fictional pathKeys from entries.
 */
export function collectAllFictionalPaths(entries) {
  const all = new Set();
  for (const entry of entries) {
    const parts = (entry.fictional_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      all.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return all;
}

/**
 * Find fictional vtubers "close" to the focused user using traceBack ancestor model.
 * Uses fictional_path instead of taxon_path. Upper bound: origin (F_ORIGIN_IDX=0).
 */
export function computeCloseFictionalVtubers(focusedEntries, allFictionalEntries, traceBack = 1) {
  if (!focusedEntries?.length || !allFictionalEntries) return new Map();
  const focusedUserId = focusedEntries[0].user_id;
  const closeMap = new Map();

  const focusedPaths = focusedEntries.map(e => e.fictional_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => p.split('|'));

  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - F_ORIGIN_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  for (const entry of allFictionalEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.fictional_path;
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
 * Compute close fictional vtuber counts grouped by path common depth.
 */
export function computeCloseFictionalVtubersByRank(focusedEntries, allFictionalEntries, traceBack = 1) {
  if (!focusedEntries?.length || !allFictionalEntries) return null;
  const focusedUserId = focusedEntries[0].user_id;

  const focusedPaths = focusedEntries.map(e => e.fictional_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => p.split('|'));

  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - F_ORIGIN_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  const bestDepth = new Map();

  for (const entry of allFictionalEntries) {
    if (entry.user_id === focusedUserId) continue;
    const ep = entry.fictional_path;
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

/**
 * Compute edge pathKeys that should be highlighted during trace-back.
 * Returns Set<pathKey> covering all intermediate taxonomy edges from the
 * common ancestor down to close vtuber leaf nodes and the focused user's leaf.
 */
export function computeCloseEdgePaths(focusedEntries, allEntries, closeVtuberIds, traceBack, breedPaths) {
  const edgeKeys = new Set();
  if (!focusedEntries?.length || !allEntries) return edgeKeys;

  const bp = breedPaths || buildBreedPaths(allEntries);
  const focusedUserId = focusedEntries[0].user_id;
  const focusedSegs = splitPath(focusedEntries[0].taxon_path);
  const ancestorDepth = Math.max(0, focusedSegs.length - traceBack);
  const ancestorPrefix = focusedSegs.slice(0, ancestorDepth).join('|');

  // Collect edges for all relevant entries (close vtubers + focused user)
  for (const entry of allEntries) {
    const uid = entry.user_id;
    const isClose = closeVtuberIds?.has(uid);
    const isFocused = uid === focusedUserId;
    if (!isClose && !isFocused) continue;

    const ep = entry.taxon_path;
    if (!ep) continue;

    const parts = splitPath(ep);
    const normalized = parts.join('|');
    if (!normalized.startsWith(ancestorPrefix)) continue;

    // Add all intermediate pathKeys from ancestorDepth+1 down to leaf
    for (let i = ancestorDepth + 1; i <= parts.length; i++) {
      edgeKeys.add(parts.slice(0, i).join('|'));
    }
    // Add vtuber leaf node pathKey
    let leafKey = normalized;
    if (entry.breed_id) {
      leafKey += `|__breed__${entry.breed_id}`;
    } else if (bp.has(normalized)) {
      leafKey += '|__breed__unspecified';
    }
    edgeKeys.add(leafKey + `|__vtuber__${entry.user_id}`);
    // Add breed/unspecified pathKey if applicable
    if (entry.breed_id) {
      edgeKeys.add(`${normalized}|__breed__${entry.breed_id}`);
    } else if (bp.has(normalized)) {
      edgeKeys.add(`${normalized}|__breed__unspecified`);
    }
  }
  return edgeKeys;
}

/**
 * Fictional version of computeCloseEdgePaths.
 * Uses fictional_path; pathKeys prefixed with __F__|.
 */
export function computeCloseFictionalEdgePaths(focusedEntries, allFictionalEntries, closeVtuberIds, traceBack) {
  const edgeKeys = new Set();
  if (!focusedEntries?.length || !allFictionalEntries) return edgeKeys;

  const focusedUserId = focusedEntries[0].user_id;
  const focusedSegs = (focusedEntries[0].fictional_path || '').split('|');
  const ancestorDepth = Math.max(0, focusedSegs.length - traceBack);
  const ancestorPrefix = focusedSegs.slice(0, ancestorDepth).join('|');

  for (const entry of allFictionalEntries) {
    const uid = entry.user_id;
    const isClose = closeVtuberIds?.has(uid);
    const isFocused = uid === focusedUserId;
    if (!isClose && !isFocused) continue;

    const ep = entry.fictional_path;
    if (!ep) continue;
    if (!ep.startsWith(ancestorPrefix)) continue;

    const parts = ep.split('|');
    for (let i = ancestorDepth + 1; i <= parts.length; i++) {
      edgeKeys.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
    // Add vtuber leaf node pathKey
    edgeKeys.add(F_PREFIX + '|' + ep + `|__vtuber__${entry.user_id}`);
  }
  return edgeKeys;
}

/**
 * Collect all expandable fictional pathKeys needed to reveal close vtuber nodes.
 */
export function collectCloseFictionalVtuberPaths(closeVtuberIds, fictionalEntries) {
  const paths = new Set();
  if (!closeVtuberIds || closeVtuberIds.size === 0) return paths;

  for (const entry of fictionalEntries) {
    if (!closeVtuberIds.has(entry.user_id)) continue;
    const parts = (entry.fictional_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return paths;
}
