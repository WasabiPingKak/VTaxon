/**
 * Tree expansion logic: auto-expand, single-child chain expansion.
 */

import type { TaxonomyTreeNode } from '../../types/tree';
import { subtreeHasNormalUser, effectiveChildCount, effectiveVisibleChildCount } from './treeVisual';

const AUTO_EXPAND_THRESHOLD = 5;

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
