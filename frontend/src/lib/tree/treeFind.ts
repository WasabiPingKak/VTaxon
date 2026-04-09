/**
 * Tree node lookup by path key.
 */

import type { TaxonomyTreeNode } from '../../types/tree';
import { stripAuthor, RANK_KEYS } from './treeCore';

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
