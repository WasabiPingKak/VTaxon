/**
 * Path computation: highlight paths, collect paths, depth-limited paths.
 */

import type { TreeEntry } from '../../types/tree';
import { splitPath, F_PREFIX } from './treeCore';

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
