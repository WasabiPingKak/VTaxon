import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { buildTree, computeHighlightPaths, collectAllPaths, findNode, autoExpandPaths } from '../lib/treeUtils';
import TreeNode from './TreeNode';
import VtuberCard from './VtuberCard';
import VtuberDetailPanel from './VtuberDetailPanel';
import useLiveStatus from '../hooks/useLiveStatus';
import type { TreeEntry, TaxonomyTreeNode, TreeFilters, User } from '../types';

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

export interface TaxonomyTreeProps {
  currentUser: User | null;
  filters?: TreeFilters;
}

export default function TaxonomyTree({ currentUser, filters }: TaxonomyTreeProps) {
  const { liveUserIds } = useLiveStatus();
  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState<TreeEntry | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    api.getTaxonomyTree()
      .then(data => {
        if (cancelled) return;
        const result = data as unknown as { entries?: TreeEntry[] } | TreeEntry[];
        setEntries(Array.isArray(result) ? result : result.entries || []);
      })
      .catch(err => {
        if (cancelled) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // All entries for the selected vtuber (for trait tabs in detail panel)
  const selectedVtuberEntries = useMemo(() => {
    if (!selectedVtuber || !entries) return [];
    return entries.filter(e => e.user_id === selectedVtuber.user_id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on user_id, not the full object
  }, [selectedVtuber?.user_id, entries]);

  // Build tree
  const tree = useMemo((): TaxonomyTreeNode | null => {
    if (!entries) return null;
    return buildTree(entries);
  }, [entries]);

  // Compute highlight paths for current user
  const highlightPaths = useMemo(() => {
    if (!entries || !currentUser) return new Set<string>();
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

  const handleToggle = (pathKey: string) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
        // Auto-expand: recursively expand children when <= 5 at each level
        if (tree) {
          const found = findNode(tree, pathKey);
          if (found) autoExpandPaths(found, next);
        }
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (!entries) return;
    setExpandedSet(collectAllPaths(entries));
  };

  const handleCollapseAll = () => {
    setExpandedSet(new Set());
  };

  // Collect live entries (deduplicated by user_id, pick first entry per user)
  const liveEntries = useMemo(() => {
    if (!entries || liveUserIds.size === 0) return [];
    const seen = new Set<string>();
    const result: TreeEntry[] = [];
    for (const e of entries) {
      if (liveUserIds.has(e.user_id) && !seen.has(e.user_id)) {
        seen.add(e.user_id);
        result.push(e);
      }
    }
    return result;
  }, [entries, liveUserIds]);

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

      {/* Live banner */}
      {liveEntries.length > 0 && (
        <div style={liveBannerStyle}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '8px', fontSize: '0.85em', fontWeight: 600, color: '#ef4444',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444',
              animation: 'vtaxonPulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }} />
            {liveEntries.length} 位正在直播
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {liveEntries.map(v => (
              <VtuberCard
                key={v.user_id}
                entry={v as Parameters<typeof VtuberCard>[0]['entry']}
                isCurrentUser={currentUser?.id === v.user_id}
                isLive
                onClick={() => setSelectedVtuber(v)}
              />
            ))}
          </div>
        </div>
      )}

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
          activeFilters={filters}
          liveUserIds={liveUserIds}
        />
      ))}

      {/* Detail panel */}
      {selectedVtuber && (
        <VtuberDetailPanel
          entry={selectedVtuber}
          allEntries={selectedVtuberEntries.length > 1 ? selectedVtuberEntries : undefined}
          onClose={() => setSelectedVtuber(null)}
          onSwitchEntry={setSelectedVtuber}
        />
      )}
    </div>
  );
}

const liveBannerStyle: React.CSSProperties = {
  marginBottom: '16px', padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(239,68,68,0.2)',
  background: 'rgba(239,68,68,0.05)',
};

const toolBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #ddd', borderRadius: '4px',
  padding: '4px 12px', cursor: 'pointer', fontSize: '0.85em', color: '#666',
};

const skeletonStyle: React.CSSProperties = {
  height: '16px', background: '#eee', borderRadius: '4px',
  width: '80%', margin: '0 auto',
  animation: 'vtaxonPulse 1.5s ease-in-out infinite',
};
