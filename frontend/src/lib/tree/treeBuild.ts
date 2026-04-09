/**
 * Tree building: construct TaxonomyTreeNode hierarchies from flat entries.
 */

import type { TaxonomyTreeNode, TreeEntry } from '../../types/tree';
import { stripAuthor, splitPath, RANK_KEYS, RANK_NAMES, F_PREFIX, F_RANK_NAMES } from './treeCore';

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
