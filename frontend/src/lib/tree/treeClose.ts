/**
 * Close vtuber computation: find taxonomically close vtubers and their paths.
 */

import type { TreeEntry } from '../../types/tree';
import { splitPath, F_PREFIX, F_ORIGIN_IDX } from './treeCore';

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
