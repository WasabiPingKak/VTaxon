import { useState, useEffect } from 'react';
import { countActiveFilters } from '../../lib/treeFilters';

const DEPTH_LABELS = { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界' };

const SORT_OPTIONS = [
  { key: 'created_at', label: '登錄順序' },
  { key: 'debut_date', label: '出道日期' },
  { key: 'display_name', label: '顯示名稱' },
  { key: 'country', label: '國旗分群' },
  { key: 'organization', label: '組織分群' },
];

// px-based font sizes to avoid compound em scaling
const F = { section: 11, option: 12, zoom: 12, badge: 10, footer: 11 };

/**
 * Left-side floating toolbar for graph controls.
 * On mobile: collapsed by default, tap hamburger to expand as bottom sheet.
 */
export default function FloatingToolbar({
  canvasRef,
  entryCount,
  filteredCount,
  totalCount,
  onExpandAll,
  onCollapseAll,
  onExpandBothTrees,
  closeByRank,
  traceBack,
  traceBackLevels,
  onTraceBackChange,
  depthLabels,
  activeTree,
  onSelectTree,
  sortKey,
  sortOrder,
  onSortChange,
  onShuffle,
  isShuffled,
  filters,
  filterPanelOpen,
  onFilterToggle,
  isMobile,
  expanded,
  onExpandedChange,
}) {
  const [hovered, setHovered] = useState(null);
  const setExpanded = (v) => onExpandedChange?.(v);

  const activeFilterCount = countActiveFilters(filters);
  const hp = (id) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) });

  // Close expanded panel when switching away from mobile
  useEffect(() => {
    if (!isMobile) setExpanded(false);
  }, [isMobile]);

  // Lock body scroll when expanded on mobile
  useEffect(() => {
    if (!isMobile || !expanded) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, expanded]);

  // Close vtuber rank stats
  const rankEntries = [];
  if (closeByRank) {
    const labels = depthLabels || DEPTH_LABELS;
    for (const [depth, count] of [...closeByRank.entries()].sort((a, b) => a[0] - b[0])) {
      const label = labels[depth];
      if (label) rankEntries.push({ label, count });
    }
  }
  const showTraceBack = traceBackLevels && traceBackLevels.length > 0 && onTraceBackChange;
  const hasFilters = onFilterToggle && filters;

  // ── Shared: indicator radio row ──
  const radioRow = (id, label, isActive, onClick, { disabled = false, trailing = null } = {}) => {
    const isH = hovered === id && !disabled;
    return (
      <button key={id} type="button" disabled={disabled} onClick={onClick} {...hp(id)}
        style={{
          width: '100%', height: 26, padding: '0 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          background: isActive ? 'rgba(255,107,53,0.12)' : isH ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: 'none',
          borderRadius: 4,
          color: disabled ? 'rgba(255,255,255,0.18)' : isActive ? '#FF6B35' : 'rgba(255,255,255,0.6)',
          fontSize: F.option, fontWeight: isActive ? 600 : 400,
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {label}
        {trailing}
      </button>
    );
  };

  // ── Shared: small icon button (for expand/collapse in tree rows) ──
  const iconBtn = (id, title, onClick, icon) => {
    const isH = hovered === id;
    return (
      <button key={id} type="button" title={title} onClick={(e) => { e.stopPropagation(); onClick(); }} {...hp(id)}
        style={{
          width: 20, height: 20, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isH ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: 'none', borderRadius: 4,
          color: isH ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        }}
      >{icon}</button>
    );
  };

  // ── Shared: full-width action button (for 篩選, 打亂) ──
  const actionBtn = (id, label, onClick, icon, { active = false, badge = null, extraProps = {} } = {}) => {
    const isH = hovered === id;
    return (
      <button type="button" onClick={onClick} {...hp(id)} {...extraProps}
        style={{
          width: '100%', height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: active ? 'rgba(56,189,248,0.12)' : isH ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, cursor: 'pointer',
          color: active ? '#38bdf8' : 'rgba(255,255,255,0.65)',
          fontSize: F.option, transition: 'all 0.15s',
        }}
      >
        {icon}
        <span>{label}</span>
        {badge}
      </button>
    );
  };

  const expandIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;
  const collapseIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;

  // ── Full toolbar content (shared between desktop panel and mobile bottom sheet) ──
  const toolbarContent = (
    <>
      {/* ── Zoom ── */}
      {[
        {
          id: 'fitAll', tint: '#FF6B35', title: '完整展開', action: onExpandBothTrees,
          icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
        },
        {
          id: 'zoomIn', title: '放大', action: () => canvasRef.current?.zoomIn(),
          icon: <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
        },
        {
          id: 'zoomOut', title: '縮小', action: () => canvasRef.current?.zoomOut(),
          icon: <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{'\u2212'}</span>
        },
      ].map(btn => {
        const isH = hovered === btn.id;
        const tint = btn.tint;
        return (
          <button key={btn.id} type="button" title={btn.title} onClick={btn.action} {...hp(btn.id)}
            style={{
              width: '100%', height: 30, padding: '0 8px',
              display: 'flex', alignItems: 'center', gap: 8,
              background: isH ? (tint ? `${tint}22` : 'rgba(255,255,255,0.08)') : 'transparent',
              border: 'none', borderRadius: 6,
              color: isH && tint ? tint : 'rgba(255,255,255,0.8)',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{btn.icon}</span>
            <span style={{ fontSize: F.zoom, whiteSpace: 'nowrap' }}>{btn.title}</span>
          </button>
        );
      })}

      {/* ── Tree selector with inline ⊞⊟ ── */}
      {onSelectTree && (
        <div style={{ paddingTop: 2 }}>
          {[
            { key: 'real', label: '現實生物' },
            { key: 'fictional', label: '虛構生物' },
          ].map(item => {
            const isActive = activeTree === item.key;
            const isH = hovered === `tree-${item.key}`;
            return (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center',
                background: isActive ? 'rgba(255,107,53,0.12)' : isH ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid #FF6B35' : '2px solid transparent',
                transition: 'all 0.15s', height: 26,
              }}>
                <button type="button"
                  onClick={() => onSelectTree(item.key)} {...hp(`tree-${item.key}`)}
                  style={{
                    flex: 1, height: '100%', padding: '0 0 0 8px',
                    display: 'flex', alignItems: 'center',
                    background: 'none', border: 'none', borderRadius: 0,
                    color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.6)',
                    fontSize: F.option, fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', transition: 'color 0.15s',
                  }}
                >{item.label}</button>
                <span style={{ display: 'flex', gap: 1, paddingRight: 4 }}>
                  {iconBtn(`expand-${item.key}`, `${item.label} 全部展開`, () => { onSelectTree(item.key); onExpandAll(item.key); }, expandIcon)}
                  {iconBtn(`collapse-${item.key}`, `${item.label} 全部收合`, () => { onSelectTree(item.key); onCollapseAll(item.key); }, collapseIcon)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sort section (no title, options only) ── */}
      {onSortChange && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 4 }}>
          {SORT_OPTIONS.map(opt => {
            const isActive = sortKey === opt.key && !isShuffled;
            const arrow = isActive ? (
              <span style={{ fontSize: 10, flexShrink: 0 }}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            ) : null;
            return radioRow(`sort-${opt.key}`, opt.label, isActive,
              () => isActive
                ? onSortChange(sortKey, sortOrder === 'asc' ? 'desc' : 'asc')
                : onSortChange(opt.key, sortOrder),
              { trailing: arrow },
            );
          })}
        </div>
      )}

      {/* ── Action buttons: 篩選 + 打亂排序 ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, padding: '6px 4px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 篩選 */}
        {hasFilters && actionBtn('filter-btn', '篩選', () => { onFilterToggle(); if (isMobile) setExpanded(false); },
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>,
          {
            active: filterPanelOpen,
            badge: activeFilterCount > 0 ? (
              <span style={{
                background: '#FF6B35', color: '#fff', borderRadius: 7, padding: '0 4px',
                fontSize: F.badge, fontWeight: 700, lineHeight: '14px', minWidth: 14, textAlign: 'center',
              }}>{activeFilterCount}</span>
            ) : null,
            extraProps: { 'data-filter-toggle': true },
          },
        )}

        {/* 打亂排序 */}
        {onShuffle && actionBtn('shuffle-btn', '打亂排序', () => { onShuffle(); if (isMobile) setExpanded(false); },
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>,
        )}
      </div>

      {/* ── Trace back range ── */}
      {showTraceBack && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 4, paddingBottom: 2 }}>
          <div style={{ textAlign: 'center', fontSize: F.section, color: 'rgba(255,255,255,0.35)', marginBottom: 2, letterSpacing: 1.5 }}>
            溯源範圍
          </div>
          {traceBackLevels.map(lv => {
            const isActive = lv.available && lv.value === traceBack;
            return radioRow(`tb-${lv.label}`, lv.label, isActive, () => onTraceBackChange(lv.value), { disabled: !lv.available });
          })}
        </div>
      )}

      {/* ── Close vtuber stats ── */}
      {rankEntries.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4, paddingTop: 4, paddingBottom: 2 }}>
          <div style={{ textAlign: 'center', fontSize: F.section, color: 'rgba(255,255,255,0.35)', marginBottom: 2, letterSpacing: 1.5 }}>
            與我相近
          </div>
          {rankEntries.map(({ label, count }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px', fontSize: F.option, color: 'rgba(255,255,255,0.55)' }}>
              <span>{label}</span>
              <span style={{ color: '#FF6B35', fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 6, padding: '5px 0 2px',
        textAlign: 'center', fontSize: F.footer, color: 'rgba(255,255,255,0.4)',
      }}>
        {filteredCount != null && filteredCount !== totalCount
          ? <span>{filteredCount}/{totalCount} 筆</span>
          : <span>{entryCount || totalCount || 0} 筆</span>}
      </div>
    </>
  );

  // ═══════ Mobile: collapsed mini-bar + expandable bottom sheet ═══════
  if (isMobile) {
    return (
      <>
        {/* Mini floating bar: hamburger + zoom buttons */}
        <div style={{
          background: 'rgba(8,13,21,0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '4px',
          display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'auto',
        }}>
          {/* Toggle button */}
          <button type="button" title="展開工具列" onClick={() => setExpanded(true)}
            style={{
              width: 34, height: 30, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: expanded ? 'rgba(255,107,53,0.15)' : 'transparent',
              border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {/* Fit all */}
          <button type="button" title="完整展開" onClick={onExpandBothTrees}
            style={{
              width: 34, height: 30, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </button>
          {/* Zoom in */}
          <button type="button" title="放大" onClick={() => canvasRef.current?.zoomIn()}
            style={{
              width: 34, height: 30, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
          </button>
          {/* Zoom out */}
          <button type="button" title="縮小" onClick={() => canvasRef.current?.zoomOut()}
            style={{
              width: 34, height: 30, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{'\u2212'}</span>
          </button>
          {/* Filter badge shortcut */}
          {hasFilters && (
            <button type="button" title="篩選" data-filter-toggle
              onClick={() => { onFilterToggle(); }}
              style={{
                width: 34, height: 30, padding: 0, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: filterPanelOpen ? 'rgba(56,189,248,0.15)' : 'transparent',
                border: 'none', borderRadius: 6,
                color: filterPanelOpen ? '#38bdf8' : 'rgba(255,255,255,0.7)', cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute', top: 1, right: 1,
                  background: '#FF6B35', color: '#fff', borderRadius: 7, padding: '0 3px',
                  fontSize: 9, fontWeight: 700, lineHeight: '13px', minWidth: 13, textAlign: 'center',
                }}>{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>

        {/* Expanded bottom sheet */}
        {expanded && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
            onClick={() => setExpanded(false)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{
              background: '#0d1526',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '8px 12px env(safe-area-inset-bottom, 12px)',
              pointerEvents: 'auto',
            }}>
              {/* Handle bar + close */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>工具列</span>
                <button type="button" onClick={() => setExpanded(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}
                >&times;</button>
              </div>
              {toolbarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // ═══════ Desktop: full sidebar panel ═══════
  return (
    <div style={{
      background: 'rgba(8,13,21,0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '6px 4px',
      display: 'flex', flexDirection: 'column', gap: 0,
      pointerEvents: 'auto',
      maxHeight: 'calc(100vh - 140px)',
      overflowY: 'auto',
    }}>
      {toolbarContent}
    </div>
  );
}
