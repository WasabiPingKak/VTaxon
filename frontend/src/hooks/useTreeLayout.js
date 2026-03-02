import { useMemo } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { buildTree } from '../lib/treeUtils';

/**
 * Convert flat entries + expandedSet into a d3 tree layout.
 * Returns { nodes, edges, bounds } ready for Canvas rendering.
 *
 * d3.tree with nodeSize([dx, dy]) lays out:
 *   x = breadth (horizontal spread), y = depth (vertical, top→bottom).
 * This is already correct for a top-down tree — no axis swap needed.
 */
export default function useTreeLayout(entries, expandedSet, currentUserId) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return { nodes: [], edges: [], rootData: null, bounds: null };
    }

    const root = buildTree(entries);
    const hierData = mapToHierarchy(root, expandedSet, currentUserId);
    const h = hierarchy(hierData, d => d.children);

    const treeLayout = tree()
      .nodeSize([70, 110])
      .separation((a, b) => {
        const hasV = a.data._vtuber || b.data._vtuber;
        return hasV ? 1.5 : (a.parent === b.parent ? 1 : 1.2);
      });

    treeLayout(h);

    const nodes = h.descendants();
    const edges = h.links();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    return {
      nodes,
      edges,
      rootData: root,
      bounds: { minX, maxX, minY, maxY },
    };
  }, [entries, expandedSet, currentUserId]);
}

/**
 * Recursively convert Map-based tree node → plain object for d3.hierarchy.
 * Only includes children that are expanded. Also creates vtuber leaf nodes.
 */
function mapToHierarchy(node, expandedSet, currentUserId, depth = 0) {
  const isExpanded = depth === 0 || expandedSet.has(node.pathKey);
  const children = [];

  if (isExpanded) {
    const sorted = [...node.children.values()].sort((a, b) => b.count - a.count);
    for (const child of sorted) {
      children.push(mapToHierarchy(child, expandedSet, currentUserId, depth + 1));
    }

    for (const v of node.vtubers) {
      children.push({
        _name: v.display_name,
        _displayName: v.display_name,
        _rank: 'VTUBER',
        _vtuber: true,
        _entry: v,
        _avatarUrl: v.avatar_url,
        _isCurrentUser: v.user_id === currentUserId,
        _pathKey: `${node.pathKey}|__vtuber__${v.user_id}`,
        children: null,
      });
    }
  }

  const hasHiddenChildren = !isExpanded && (node.children.size > 0 || node.vtubers.length > 0);

  return {
    _name: node.name,
    _nameZh: node.nameZh,
    _rank: node.rank || 'ROOT',
    _pathKey: node.pathKey,
    _count: node.count,
    _hasHiddenChildren: hasHiddenChildren,
    children: children.length > 0 ? children : null,
  };
}
