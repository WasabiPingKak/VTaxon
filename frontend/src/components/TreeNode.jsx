import { useState } from 'react';
import VtuberCard from './VtuberCard';
import RankBadge from './RankBadge';

const SHOW_LIMIT = 20;

export default function TreeNode({
  node, depth, expandedSet, onToggle,
  currentUserId, onSelectVtuber, highlightPaths,
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
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 8px', margin: '2px 0',
          background: isHighlighted ? '#FFF8E1' : 'transparent',
          border: 'none', borderRadius: '4px',
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: '0.95em', width: '100%', textAlign: 'left',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => {
          if (hasChildren && !isHighlighted) e.currentTarget.style.background = '#f5f5f5';
        }}
        onMouseLeave={e => {
          if (!isHighlighted) e.currentTarget.style.background = 'transparent';
          else e.currentTarget.style.background = '#FFF8E1';
        }}
      >
        {hasChildren && (
          <span style={{
            display: 'inline-block', width: '16px', textAlign: 'center',
            transition: 'transform 0.15s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: '#888',
          }}>
            ▶
          </span>
        )}
        {!hasChildren && <span style={{ display: 'inline-block', width: '16px' }} />}

        <RankBadge rank={node.rank} style={{ marginRight: '2px' }} />

        <span style={{ fontWeight: 500 }}>
          {node.nameZh ? `${node.nameZh}` : ''}
          <span style={{ color: '#888', fontStyle: 'italic', marginLeft: node.nameZh ? '4px' : '0' }}>
            {node.name}
          </span>
        </span>

        <span style={{
          marginLeft: '6px', padding: '0 6px',
          background: '#e8e8e8', borderRadius: '10px',
          fontSize: '0.8em', color: '#666',
        }}>
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
                  onClick={() => onSelectVtuber(v)}
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
            />
          ))}

          {/* Show more button */}
          {!showAll && remaining > 0 && (
            <div style={{ marginLeft: (depth + 1) * 20 + 30, margin: '4px 0' }}>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{
                  background: 'none', border: '1px dashed #ccc', borderRadius: '4px',
                  padding: '4px 12px', cursor: 'pointer', color: '#666', fontSize: '0.85em',
                }}
              >
                顯示更多 (剩餘 {remaining} 個)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

