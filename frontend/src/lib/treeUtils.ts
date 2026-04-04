/**
 * Shared tree utilities extracted from TaxonomyTree.jsx.
 * Used by both the legacy text tree and the new graph canvas.
 */

import type { TaxonomyTreeNode, TreeEntry, VisualTier } from '../types/tree';
import { RANK_ORDER } from './taxonomyConstants';

/** Strip taxonomic author citations from scientific names.
 *  "Vulpes zerda (Zimmermann, 1780)" → "Vulpes zerda" */
export function stripAuthor(name: string | null | undefined): string {
  if (!name) return name as string;
  return name.replace(/\s+\(?[A-Z][\w.\s,''-]*,\s*\d{4}\)?$/, '').trim();
}

const RANK_KEYS = RANK_ORDER;
const RANK_NAMES: Record<number, string> = {
  0: 'KINGDOM', 1: 'PHYLUM', 2: 'CLASS', 3: 'ORDER',
  4: 'FAMILY', 5: 'GENUS', 6: 'SPECIES', 7: 'SUBSPECIES',
  8: 'BREED',
};

function splitPath(taxonPath: string | null | undefined): string[] {
  const parts = (taxonPath || '').split('|');
  for (let i = RANK_KEYS.length; i < parts.length; i++) {
    parts[i] = stripAuthor(parts[i]);
  }
  return parts;
}

export function buildTree(entries: TreeEntry[]): TaxonomyTreeNode {
  const root: TaxonomyTreeNode = {
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
      if (!part) continue;

      const pathKey = parts.slice(0, i + 1).join('|');

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

      const child = current.children.get(part)!;
      child.count++;

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
          const breedNode = child.children.get(`__breed__${entry.breed_id}`)!;
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

export function entryToVtuberPathKey(entry: TreeEntry): string {
  if (entry.fictional_path) {
    return `__F__|${entry.fictional_path}|__vtuber__${entry.user_id}`;
  }
  const parts = splitPath(entry.taxon_path);
  let pk = parts.join('|');
  if (entry.breed_id) {
    pk += `|__breed__${entry.breed_id}`;
  }
  return pk + `|__vtuber__${entry.user_id}`;
}

export function computeHighlightPaths(entries: TreeEntry[], userId: string | null): Set<string> {
  const paths = new Set<string>();
  if (!userId) return paths;

  for (const entry of entries) {
    if (entry.user_id !== userId) continue;
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      paths.add(`${parts.join('|')}|__breed__${entry.breed_id}`);
    }
  }
  return paths;
}

export function findNode(root: TaxonomyTreeNode, pathKey: string): TaxonomyTreeNode | null {
  if (root.pathKey === pathKey) return root;

  let navPath = pathKey;
  if (root.pathKey && pathKey.startsWith(root.pathKey + '|')) {
    navPath = pathKey.slice(root.pathKey.length + 1);
  }

  const parts = navPath.split('|');
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const key = i >= RANK_KEYS.length ? stripAuthor(part) : part;
    const child = current.children.get(key) || current.children.get(part);
    if (!child) return null;
    if (child.pathKey === pathKey) return child;
    current = child;
  }
  return null;
}

export function collectAllPaths(entries: TreeEntry[]): Set<string> {
  const all = new Set<string>();
  for (const entry of entries) {
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      all.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      all.add(`${parts.join('|')}|__breed__${entry.breed_id}`);
    }
  }
  return all;
}

const AUTO_EXPAND_THRESHOLD = 5;

// ── Visual budget tier thresholds ──
export const BUDGET_TIER_DOT = 5;
export const BUDGET_TIER_HIDDEN = 6;

// ── Split group threshold ──
export const SPLIT_GROUP_MAX = 25;

/** Deterministic hash for user_id → group assignment. */
export function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getVisualTier(entry: TreeEntry): VisualTier {
  if (entry.is_live_primary) return 'normal';
  const tc = entry.trait_count || 0;
  if (tc >= BUDGET_TIER_HIDDEN) return 'hidden';
  if (tc >= BUDGET_TIER_DOT) return 'dot';
  return 'normal';
}

export function subtreeHasNormalUser(node: TaxonomyTreeNode): boolean {
  for (const v of node.vtubers) {
    if (getVisualTier(v) !== 'hidden') return true;
  }
  for (const child of node.children.values()) {
    if (subtreeHasNormalUser(child)) return true;
  }
  return false;
}

function effectiveChildCount(node: TaxonomyTreeNode): number {
  return node.children.size + node.vtubers.length;
}

function effectiveVisibleChildCount(node: TaxonomyTreeNode): number {
  let count = 0;
  for (const child of node.children.values()) {
    if (subtreeHasNormalUser(child)) count++;
  }
  for (const v of node.vtubers) {
    if (getVisualTier(v) !== 'hidden') count++;
  }
  return count;
}

export function autoExpandPaths(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node || effectiveChildCount(node) === 0) return;
  for (const child of node.children.values()) {
    if (!subtreeHasNormalUser(child)) continue;
    const cc = effectiveVisibleChildCount(child);
    if (cc > 0 && cc <= AUTO_EXPAND_THRESHOLD) {
      pathSet.add(child.pathKey);
      autoExpandPaths(child, pathSet);
    } else {
      expandSingleChildChain(child, pathSet);
    }
  }
}

export function autoExpandPathsUnfiltered(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node || effectiveChildCount(node) === 0) return;
  for (const child of node.children.values()) {
    const cc = effectiveChildCount(child);
    if (cc > 0 && cc <= AUTO_EXPAND_THRESHOLD) {
      pathSet.add(child.pathKey);
      autoExpandPathsUnfiltered(child, pathSet);
    } else {
      expandSingleChildChainUnfiltered(child, pathSet);
    }
  }
}

function expandSingleChildChain(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node) return;
  const visibleChildren = [...node.children.values()].filter(c => subtreeHasNormalUser(c));
  if (visibleChildren.length !== 1) return;
  pathSet.add(node.pathKey);
  const child = visibleChildren[0];
  pathSet.add(child.pathKey);
  autoExpandPaths(child, pathSet);
}

function expandSingleChildChainUnfiltered(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node || node.children.size !== 1) return;
  pathSet.add(node.pathKey);
  const child = node.children.values().next().value!;
  pathSet.add(child.pathKey);
  autoExpandPathsUnfiltered(child, pathSet);
}

export function extendSingleChildChains(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node) return;
  for (const child of node.children.values()) {
    if (pathSet.has(child.pathKey)) {
      extendSingleChildChains(child, pathSet);
    }
  }
  if (node.children.size === 1) {
    const child = node.children.values().next().value!;
    if (!pathSet.has(child.pathKey)) {
      pathSet.add(child.pathKey);
      extendSingleChildChains(child, pathSet);
    }
  }
}

export function expandAllSingleChildChains(node: TaxonomyTreeNode, pathSet: Set<string>): void {
  if (!node) return;
  for (const child of node.children.values()) {
    if (child.children.size === 1) {
      pathSet.add(child.pathKey);
      expandAllSingleChildChains(child, pathSet);
    } else if (child.children.size > 0) {
      expandAllSingleChildChains(child, pathSet);
    }
  }
}

const CLASS_IDX = 2;

export function computeCloseVtubers(focusedEntries: TreeEntry[], allEntries: TreeEntry[], traceBack = 2): Map<string, Set<string>> {
  if (!focusedEntries?.length || !allEntries) return new Map();
  const focusedUserId = focusedEntries[0].user_id;
  const closeMap = new Map<string, Set<string>>();

  const focusedPaths = focusedEntries.map(e => e.taxon_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => splitPath(p));

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
        if (epSegs[i]) common++;
      }

      if (common >= minCommon) {
        if (!closeMap.has(entry.user_id)) closeMap.set(entry.user_id, new Set());
        closeMap.get(entry.user_id)!.add(ep);
        break;
      }
    }
  }
  return closeMap;
}

export function collectCloseVtuberPaths(closeVtuberIds: Set<string> | null, entries: TreeEntry[]): Set<string> {
  const paths = new Set<string>();
  if (!closeVtuberIds || closeVtuberIds.size === 0) return paths;

  for (const entry of entries) {
    if (!closeVtuberIds.has(entry.user_id)) continue;
    const parts = splitPath(entry.taxon_path);
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    if (entry.breed_id) {
      paths.add(`${parts.join('|')}|__breed__${entry.breed_id}`);
    }
  }
  return paths;
}

export function computeCloseVtubersByRank(focusedEntries: TreeEntry[], allEntries: TreeEntry[], traceBack = 2): Map<number, number> | null {
  if (!focusedEntries?.length || !allEntries) return null;
  const focusedUserId = focusedEntries[0].user_id;

  const focusedPaths = focusedEntries.map(e => e.taxon_path).filter(Boolean);
  const focusedSegArrays = focusedPaths.map(p => splitPath(p));

  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - CLASS_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  const bestDepth = new Map<string, number>();

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
        if (epSegs[i]) common++;
      }

      if (common >= minCommon) {
        const prev = bestDepth.get(entry.user_id) || 0;
        if (common > prev) bestDepth.set(entry.user_id, common);
      }
    }
  }

  const byRank = new Map<number, number>();
  for (const [, depth] of bestDepth) {
    byRank.set(depth, (byRank.get(depth) || 0) + 1);
  }

  return byRank.size > 0 ? byRank : null;
}

export function collectPathsToDepth(entries: TreeEntry[], maxDepth: number): Set<string> {
  const paths = new Set<string>();
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
const F_RANK_NAMES: Record<number, string> = { 0: 'F_ORIGIN', 1: 'F_SUB_ORIGIN', 2: 'F_TYPE' };

export function buildFictionalTree(entries: TreeEntry[]): TaxonomyTreeNode {
  const root: TaxonomyTreeNode = {
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
      const isLast = (i === parts.length - 1);
      const rank = isLast ? 'F_SPECIES' : (F_RANK_NAMES[i] || 'F_SPECIES');

      if (!current.children.has(part)) {
        let nameZh = '';
        if (i === 0) nameZh = entry.origin || '';
        else if (i === 1) nameZh = entry.sub_origin || '';
        else if (isLast) nameZh = entry.fictional_name_zh || '';
        else nameZh = part;

        current.children.set(part, {
          name: part,
          nameZh,
          rank,
          pathKey,
          count: 0,
          children: new Map(),
          vtubers: [],
        });
      }

      const child = current.children.get(part)!;
      child.count++;

      if (!isLast && child.rank === 'F_SPECIES' && F_RANK_NAMES[i]) {
        child.rank = F_RANK_NAMES[i];
      }

      if (isLast) {
        child.vtubers.push(entry);
      }

      current = child;
    }
  }

  return root;
}

export function collectFictionalPathsToDepth(entries: TreeEntry[], maxDepth: number): Set<string> {
  const paths = new Set<string>();
  for (const entry of entries) {
    const parts = (entry.fictional_path || '').split('|');
    const limit = Math.min(parts.length, maxDepth);
    for (let i = 1; i <= limit; i++) {
      paths.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return paths;
}

export function computeFictionalHighlightPaths(entries: TreeEntry[], userId: string | null): Set<string> {
  const paths = new Set<string>();
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

export function collectAllFictionalPaths(entries: TreeEntry[]): Set<string> {
  const all = new Set<string>();
  for (const entry of entries) {
    const parts = (entry.fictional_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      all.add(F_PREFIX + '|' + parts.slice(0, i).join('|'));
    }
  }
  return all;
}

export function computeCloseFictionalVtubers(focusedEntries: TreeEntry[], allFictionalEntries: TreeEntry[], traceBack = 1): Map<string, Set<string>> {
  if (!focusedEntries?.length || !allFictionalEntries) return new Map();
  const focusedUserId = focusedEntries[0].user_id;
  const closeMap = new Map<string, Set<string>>();

  const focusedPaths = focusedEntries.map(e => e.fictional_path).filter(Boolean) as string[];
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
        closeMap.get(entry.user_id)!.add(ep);
        break;
      }
    }
  }
  return closeMap;
}

export function computeCloseFictionalVtubersByRank(focusedEntries: TreeEntry[], allFictionalEntries: TreeEntry[], traceBack = 1): Map<number, number> | null {
  if (!focusedEntries?.length || !allFictionalEntries) return null;
  const focusedUserId = focusedEntries[0].user_id;

  const focusedPaths = focusedEntries.map(e => e.fictional_path).filter(Boolean) as string[];
  const focusedSegArrays = focusedPaths.map(p => p.split('|'));

  const minCommons = focusedSegArrays.map(segs => {
    const S = segs.length;
    const maxTrace = Math.max(0, S - 1 - F_ORIGIN_IDX);
    const effectiveTrace = Math.min(traceBack, maxTrace);
    return S - effectiveTrace;
  });

  const bestDepth = new Map<string, number>();

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

  const byRank = new Map<number, number>();
  for (const [, depth] of bestDepth) {
    byRank.set(depth, (byRank.get(depth) || 0) + 1);
  }

  return byRank.size > 0 ? byRank : null;
}

export function computeCloseEdgePaths(focusedEntries: TreeEntry[], allEntries: TreeEntry[], closeVtuberIds: Set<string> | null, traceBack: number): Set<string> {
  const edgeKeys = new Set<string>();
  if (!focusedEntries?.length || !allEntries) return edgeKeys;

  const focusedUserId = focusedEntries[0].user_id;
  const focusedSegs = splitPath(focusedEntries[0].taxon_path);
  const ancestorDepth = Math.max(0, focusedSegs.length - traceBack);
  const ancestorPrefix = focusedSegs.slice(0, ancestorDepth).join('|');

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

    for (let i = ancestorDepth + 1; i <= parts.length; i++) {
      edgeKeys.add(parts.slice(0, i).join('|'));
    }
    let leafKey = normalized;
    if (entry.breed_id) {
      leafKey += `|__breed__${entry.breed_id}`;
    }
    edgeKeys.add(leafKey + `|__vtuber__${entry.user_id}`);
    if (entry.breed_id) {
      edgeKeys.add(`${normalized}|__breed__${entry.breed_id}`);
    }
  }
  return edgeKeys;
}

export function computeCloseFictionalEdgePaths(focusedEntries: TreeEntry[], allFictionalEntries: TreeEntry[], closeVtuberIds: Set<string> | null, traceBack: number): Set<string> {
  const edgeKeys = new Set<string>();
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
    edgeKeys.add(F_PREFIX + '|' + ep + `|__vtuber__${entry.user_id}`);
  }
  return edgeKeys;
}

export function collectCloseFictionalVtuberPaths(closeVtuberIds: Set<string> | null, fictionalEntries: TreeEntry[]): Set<string> {
  const paths = new Set<string>();
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
