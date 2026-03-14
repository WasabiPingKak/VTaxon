import { useState, memo } from 'react';
import VtuberCard from './VtuberCard';
import RankBadge from './RankBadge';
import { getActiveFilterBadges, getSortBadge } from '../lib/filterBadges';

const SHOW_LIMIT = 20;

// Static style objects (avoid re-creating on each render)
const arrowStyle = {
  display: 'inline-block', width: '16px', textAlign: 'center',
  transition: 'transform 0.15s', color: '#888',
};
const emptyArrowStyle = { display: 'inline-block', width: '16px' };
const countBadgeStyle = {
  marginLeft: '6px', padding: '0 6px',
  background: '#e8e8e8', borderRadius: '10px',
  fontSize: '0.8em', color: '#666',
};
const showMoreBtnStyle = {
  background: 'none', border: '1px dashed #ccc', borderRadius: '4px',
  padding: '4px 12px', cursor: 'pointer', color: '#666', fontSize: '0.85em',
};

function setsEqualForNode(a, b, pathKey, isExpanded) {
  if (a === b) return true;
  if (!a || !b) return a === b;
  // If this node is collapsed, only its own membership matters
  if (!isExpanded) return a.has(pathKey) === b.has(pathKey);
  // If expanded, children need propagation — must re-render
  return false;
}

const TreeNode = memo(function TreeNode({
  node, depth, expandedSet, onToggle,
  currentUserId, onSelectVtuber, highlightPaths, activeFilters, sortKey, liveUserIds,
}) {
  const [showAll, setShowAll] = useState(false);

  const isExpanded = expandedSet.has(node.pathKey);
  const isHighlighted = highlightPaths?.has(node.pathKey);
  const hasChildren = node.children.size > 0 || node.vtubers.length > 0;

  const childEntries = [...node.children.values()].sort((a, b) =>
    (a.nameZh || a.name).localeCompare(b.nameZh || b.name, 'zh-Hant')
  );

  const displayChildren = showAll ? childEntries : childEntries.slice(0, SHOW_LIMIT);
  const remaining = childEntries.length - SHOW_LIMIT;

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      {/* Node header */}
      <button
        type="button"
        onClick={() => hasChildren && onToggle(node.pathKey)}
        className={`vtaxon-tree-node${hasChildren ? ' vtaxon-tree-node--clickable' : ''}${isHighlighted ? ' vtaxon-tree-node--highlighted' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 8px', margin: '2px 0',
          border: 'none', borderRadius: '4px',
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: '0.95em', width: '100%', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        {hasChildren && (
          <span style={{
            ...arrowStyle,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            ▶
          </span>
        )}
        {!hasChildren && <span style={emptyArrowStyle} />}

        <RankBadge rank={node.rank} style={{ marginRight: '2px' }} />

        <span style={{ fontWeight: 500 }}>
          {node.nameZh ? `${node.nameZh}` : ''}
          <span style={{ color: '#888', fontStyle: 'italic', marginLeft: node.nameZh ? '4px' : '0' }}>
            {node.name}
          </span>
        </span>

        <span style={countBadgeStyle}>
          {node.count}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div>
          {/* Vtuber cards at this node (before children) */}
          {node.vtubers.length > 0 && (
            <div style={{
              marginLeft: (depth + 1) * 20,
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              padding: '4px 0',
            }}>
              {node.vtubers.map(v => (
                <VtuberCard
                  key={`${v.user_id}-${v.taxon_id}`}
                  entry={v}
                  isCurrentUser={currentUserId && v.user_id === currentUserId}
                  isLive={liveUserIds && liveUserIds.has(v.user_id)}
                  onClick={() => onSelectVtuber(v)}
                  activeFilterBadges={activeFilters ? getActiveFilterBadges(v, activeFilters) : undefined}
                  sortBadge={sortKey ? getSortBadge(v, sortKey) : undefined}
                />
              ))}
            </div>
          )}

          {/* Child taxonomy nodes */}
          {displayChildren.map(child => (
            <TreeNode
              key={child.pathKey}
              node={child}
              depth={depth + 1}
              expandedSet={expandedSet}
              onToggle={onToggle}
              currentUserId={currentUserId}
              onSelectVtuber={onSelectVtuber}
              highlightPaths={highlightPaths}
              activeFilters={activeFilters}
              sortKey={sortKey}
              liveUserIds={liveUserIds}
            />
          ))}

          {/* Show more button */}
          {!showAll && remaining > 0 && (
            <div style={{ marginLeft: (depth + 1) * 20 + 30, margin: '4px 0' }}>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={showMoreBtnStyle}
              >
                顯示更多 (剩餘 {remaining} 個)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Fast path: if all refs are identical, skip re-render
  if (prev.node !== next.node) return false;
  if (prev.depth !== next.depth) return false;
  if (prev.onToggle !== next.onToggle) return false;
  if (prev.currentUserId !== next.currentUserId) return false;
  if (prev.onSelectVtuber !== next.onSelectVtuber) return false;
  if (prev.activeFilters !== next.activeFilters) return false;
  if (prev.sortKey !== next.sortKey) return false;

  const pathKey = prev.node.pathKey;
  const wasExpanded = prev.expandedSet?.has(pathKey);
  const isExpanded = next.expandedSet?.has(pathKey);

  if (!setsEqualForNode(prev.expandedSet, next.expandedSet, pathKey, wasExpanded || isExpanded)) return false;
  if (!setsEqualForNode(prev.highlightPaths, next.highlightPaths, pathKey, wasExpanded || isExpanded)) return false;
  if (prev.liveUserIds !== next.liveUserIds) return false;

  return true;
});

export default TreeNode;
