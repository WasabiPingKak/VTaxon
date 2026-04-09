/**
 * Visual tier logic: budget thresholds, visibility checks, hash utilities.
 */

import type { TaxonomyTreeNode, TreeEntry, VisualTier } from '../../types/tree';

// ── Visual budget tier thresholds ──
export const BUDGET_TIER_DOT = 5;
export const BUDGET_TIER_HIDDEN = 6;

// ── Split group threshold ──
export const SPLIT_GROUP_MAX = 25;

/** Deterministic hash for user_id -> group assignment. */
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

export function effectiveChildCount(node: TaxonomyTreeNode): number {
  return node.children.size + node.vtubers.length;
}

export function effectiveVisibleChildCount(node: TaxonomyTreeNode): number {
  let count = 0;
  for (const child of node.children.values()) {
    if (subtreeHasNormalUser(child)) count++;
  }
  for (const v of node.vtubers) {
    if (getVisualTier(v) !== 'hidden') count++;
  }
  return count;
}
