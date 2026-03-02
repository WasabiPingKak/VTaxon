import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import TreeNode from './TreeNode';
import VtuberDetailPanel from './VtuberDetailPanel';

// Inject shared animation keyframes once
if (typeof document !== 'undefined' && !document.getElementById('vtaxon-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'vtaxon-pulse-style';
  style.textContent = `
    @keyframes vtaxonPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes vtaxonSpin {
      to { transform: rotate(360deg); }
    }
    .vtaxon-spinner {
      width: 14px; height: 14px;
      border: 2px solid #4a90d9;
      border-top-color: transparent;
      border-radius: 50%;
      animation: vtaxonSpin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

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
function buildTree(entries) {
  const root = { name: 'Life', nameZh: '生命', rank: 'ROOT', pathKey: '', count: 0, children: new Map(), vtubers: [] };

  for (const entry of entries) {
    const parts = (entry.taxon_path || '').split('|');
    if (parts.length === 0) continue;

    let current = root;
    root.count++;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const pathKey = parts.slice(0, i + 1).join('|');

      if (!current.children.has(part)) {
        // Determine Chinese name for this rank level
        const rankKey = RANK_KEYS[i]; // kingdom=0, phylum=1, ...
        let nameZh = rankKey ? (entry.path_zh?.[rankKey] || '') : '';

        // For species/subspecies levels (beyond genus), use common_name_zh
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

      // Backfill Chinese name if this node was created without one
      if (!child.nameZh && i >= RANK_KEYS.length && entry.common_name_zh) {
        child.nameZh = entry.common_name_zh;
      }

      // If this is the last part, handle breed sub-node or attach directly
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
 * Compute the set of path keys that should be auto-expanded
 * for the current user's traits.
 */
function computeHighlightPaths(entries, userId) {
  const paths = new Set();
  if (!userId) return paths;

  for (const entry of entries) {
    if (entry.user_id !== userId) continue;
    const parts = (entry.taxon_path || '').split('|');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('|'));
    }
    // Include breed node path if present
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
function findNode(root, pathKey) {
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

export default function TaxonomyTree({ currentUser }) {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState(null);
  const treeRef = useRef(null);
  const scrolledRef = useRef(false);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    api.getTaxonomyTree()
      .then(data => {
        if (cancelled) return;
        setEntries(data.entries || []);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Build tree
  const tree = useMemo(() => {
    if (!entries) return null;
    return buildTree(entries);
  }, [entries]);

  // Compute highlight paths for current user
  const highlightPaths = useMemo(() => {
    if (!entries || !currentUser) return new Set();
    return computeHighlightPaths(entries, currentUser.id);
  }, [entries, currentUser]);

  // Auto-expand user's paths on first load
  useEffect(() => {
    if (!entries || !currentUser || highlightPaths.size === 0) return;
    setExpandedSet(prev => {
      const next = new Set(prev);
      for (const p of highlightPaths) next.add(p);
      return next;
    });
  }, [highlightPaths, entries, currentUser]);

  // Scroll to first highlighted node after auto-expand
  useEffect(() => {
    if (scrolledRef.current || !currentUser || highlightPaths.size === 0) return;
    // Wait a tick for DOM to render expanded nodes
    const timer = setTimeout(() => {
      const el = treeRef.current?.querySelector('[data-user-node="true"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrolledRef.current = true;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [expandedSet, currentUser, highlightPaths]);

  const handleToggle = (pathKey) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
        // Auto-expand through empty intermediate nodes
        // Walk down the tree to find the node, then drill down while:
        // - node has no vtubers AND
        // - node has exactly 1 child
        if (tree) {
          let node = findNode(tree, pathKey);
          while (node && node.vtubers.length === 0 && node.children.size === 1) {
            const child = [...node.children.values()][0];
            next.add(child.pathKey);
            node = child;
          }
        }
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (!entries) return;
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
    setExpandedSet(all);
  };

  const handleCollapseAll = () => {
    setExpandedSet(new Set());
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={skeletonStyle} />
        <div style={{ ...skeletonStyle, width: '60%', margin: '8px auto' }} />
        <div style={{ ...skeletonStyle, width: '40%', margin: '8px auto' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#d9534f', textAlign: 'center' }}>
        載入分類樹失敗：{error}
      </div>
    );
  }

  if (!tree || tree.count === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
        目前尚無 Vtuber 物種資料
      </div>
    );
  }

  // Render top-level children (kingdoms)
  const topNodes = [...tree.children.values()].sort((a, b) => b.count - a.count);

  return (
    <div ref={treeRef}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
      }}>
        <span style={{ fontSize: '0.9em', color: '#888' }}>
          共 {tree.count} 筆物種標註
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleExpandAll} style={toolBtn}>全部展開</button>
          <button type="button" onClick={handleCollapseAll} style={toolBtn}>全部收合</button>
        </div>
      </div>

      {/* Tree */}
      {topNodes.map(node => (
        <TreeNode
          key={node.pathKey}
          node={node}
          depth={0}
          expandedSet={expandedSet}
          onToggle={handleToggle}
          currentUserId={currentUser?.id}
          onSelectVtuber={setSelectedVtuber}
          highlightPaths={highlightPaths}
        />
      ))}

      {/* Detail panel */}
      {selectedVtuber && (
        <VtuberDetailPanel
          entry={selectedVtuber}
          onClose={() => setSelectedVtuber(null)}
        />
      )}
    </div>
  );
}

const toolBtn = {
  background: 'none', border: '1px solid #ddd', borderRadius: '4px',
  padding: '4px 12px', cursor: 'pointer', fontSize: '0.85em', color: '#666',
};

const skeletonStyle = {
  height: '16px', background: '#eee', borderRadius: '4px',
  width: '80%', margin: '0 auto',
  animation: 'vtaxonPulse 1.5s ease-in-out infinite',
};
