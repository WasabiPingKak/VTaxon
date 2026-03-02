import { useState } from 'react';

const DEPTH_LABELS = { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界' };

/**
 * Left-side floating toolbar for graph controls.
 * Positioning is controlled by the parent wrapper div.
 */
export default function FloatingToolbar({
  canvasRef,
  nodeCount,
  entryCount,
  onExpandAll,
  onCollapseAll,
  onExpandClose,
  closeByRank,
  traceBack,
  traceBackLevels,
  onTraceBackChange,
}) {
  const [hovered, setHovered] = useState(null);

  const renderBtn = (btn) => {
    if (btn.sep) {
      return (
        <div key={btn.id} style={{
          height: 1,
          background: 'rgba(255,255,255,0.08)',
          margin: '4px 2px',
        }} />
      );
    }

    const isHovered = hovered === btn.id;
    const tint = btn.tint;

    return (
      <button
        key={btn.id}
        type="button"
        title={btn.title}
        onClick={btn.action}
        onMouseEnter={() => setHovered(btn.id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          width: '100%',
          height: 32,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isHovered
            ? (tint ? `${tint}22` : 'rgba(255,255,255,0.1)')
            : 'transparent',
          border: 'none',
          borderRadius: 6,
          color: isHovered && tint ? tint : 'rgba(255,255,255,0.8)',
          fontSize: '1.2em',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <span style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          {btn.icon || btn.label}
        </span>
        <span style={{ fontSize: '0.72em', whiteSpace: 'nowrap' }}>
          {btn.title}
        </span>
      </button>
    );
  };

  const buttons = [
    { id: 'zoomIn', label: '+', title: '放大', action: () => canvasRef.current?.zoomIn() },
    { id: 'zoomOut', label: '\u2212', title: '縮小', action: () => canvasRef.current?.zoomOut() },
    { id: 'fitView', label: '\u2299', title: '重置視圖', action: () => canvasRef.current?.fitView(0, 0, 0.5) },
    { id: 'sep1', sep: true },
  ];

  if (onExpandClose) {
    buttons.push({
      id: 'expandClose',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      title: '展開相近',
      action: onExpandClose,
      tint: '#FF6B35',
    });
  }

  buttons.push(
    {
      id: 'expandAll',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ),
      title: '全部展開',
      action: onExpandAll,
    },
    {
      id: 'collapseAll',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ),
      title: '全部收合',
      action: onCollapseAll,
    },
  );

  // Close vtuber rank stats
  const rankEntries = [];
  if (closeByRank) {
    const sorted = [...closeByRank.entries()].sort((a, b) => a[0] - b[0]);
    for (const [depth, count] of sorted) {
      const label = DEPTH_LABELS[depth];
      if (label) {
        rankEntries.push({ label, count });
      }
    }
  }

  const showTraceBack = traceBackLevels && traceBackLevels.length > 0 && onTraceBackChange;

  return (
    <div style={{
      background: 'rgba(8,13,21,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      pointerEvents: 'auto',
    }}>
      {buttons.map(renderBtn)}

      {/* Trace back range — vertical level list */}
      {showTraceBack && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 4,
          paddingTop: 6,
          paddingBottom: 2,
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '0.6em',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 4,
            letterSpacing: 1,
          }}>
            ── 溯源範圍 ──
          </div>
          {traceBackLevels.map(lv => {
            const isActive = lv.available && lv.value === traceBack;
            const isDisabled = !lv.available;
            const isLvHovered = hovered === `tb-${lv.label}` && !isDisabled;

            return (
              <button
                key={lv.label}
                type="button"
                disabled={isDisabled}
                onClick={() => onTraceBackChange(lv.value)}
                onMouseEnter={() => setHovered(`tb-${lv.label}`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: '100%',
                  height: 24,
                  padding: '0 6px 0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: isActive
                    ? 'rgba(255,107,53,0.12)'
                    : isLvHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '2px solid #FF6B35' : '2px solid transparent',
                  borderRadius: 0,
                  color: isDisabled
                    ? 'rgba(255,255,255,0.18)'
                    : isActive ? '#FF6B35' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.7em',
                  fontWeight: isActive ? 600 : 400,
                  cursor: isDisabled ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {lv.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Close vtuber stats */}
      {rankEntries.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 4,
          paddingTop: 6,
          paddingBottom: 2,
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '0.6em',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 4,
            letterSpacing: 1,
          }}>
            ── 與我相近 ──
          </div>
          {rankEntries.map(({ label, count }) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '1px 6px',
              fontSize: '0.65em',
              color: 'rgba(255,255,255,0.55)',
            }}>
              <span>{label}</span>
              <span style={{ color: '#FF6B35' }}>{count}</span>
            </div>
          ))}
          <div style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '4px 4px 2px',
          }} />
        </div>
      )}

      {/* Node count badge */}
      <div style={{
        marginTop: 6,
        padding: '4px 0',
        textAlign: 'center',
        fontSize: '0.65em',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.3,
      }}>
        <div>{entryCount} 筆</div>
        <div>{nodeCount} 節點</div>
      </div>
    </div>
  );
}
