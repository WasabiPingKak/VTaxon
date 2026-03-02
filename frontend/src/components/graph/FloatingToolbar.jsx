import { useState } from 'react';

/**
 * Left-side floating toolbar for graph controls.
 */
export default function FloatingToolbar({
  canvasRef,
  nodeCount,
  entryCount,
  onExpandAll,
  onCollapseAll,
}) {
  const [hovered, setHovered] = useState(null);

  const buttons = [
    { id: 'zoomIn', label: '+', title: '放大', action: () => canvasRef.current?.zoomIn() },
    { id: 'zoomOut', label: '\u2212', title: '縮小', action: () => canvasRef.current?.zoomOut() },
    { id: 'fitView', label: '\u2299', title: '重置視圖', action: () => {
      canvasRef.current?.fitView(0, 0, 0.5);
    }},
    { id: 'sep1', sep: true },
    { id: 'expandAll', label: '\u229e', title: '全部展開', action: onExpandAll },
    { id: 'collapseAll', label: '\u229f', title: '全部收合', action: onCollapseAll },
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      top: 60,
      background: 'rgba(8,13,21,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      zIndex: 50,
    }}>
      {buttons.map(btn => {
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

        return (
          <button
            key={btn.id}
            type="button"
            title={btn.title}
            onClick={btn.action}
            onMouseEnter={() => setHovered(btn.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.2em',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {btn.label}
          </button>
        );
      })}

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
