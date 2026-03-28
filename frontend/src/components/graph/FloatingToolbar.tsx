import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { countActiveFilters } from '../../lib/treeFilters';
import BottomSheet from '../BottomSheet';
import type { TreeFilters, SortKey, SortOrder, ActiveTree } from '../../types/tree';
import type { GraphCanvasHandle } from './GraphCanvas';

const SORT_SHORT: Record<string, string> = { active_first: '活躍', created_at: '登錄', debut_date: '出道', display_name: '名稱', country: '國旗', organization: '組織' };

const DEPTH_LABELS: Record<number, string> = { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '��門', 1: '同界' };

interface SortOption {
  key: SortKey;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'active_first', label: '活躍優先' },
  { key: 'created_at', label: '登錄順序' },
  { key: 'debut_date', label: '出道日期' },
  { key: 'display_name' as SortKey, label: '顯示名稱' },
  { key: 'country', label: '國旗分群' },
  { key: 'organization', label: '組織分群' },
];

// px-based font sizes to avoid compound em scaling
const F = { section: 11, option: 12, zoom: 12, badge: 10, footer: 11 };
// Mobile: larger sizes for touch-friendly readability
const FM = { section: 14, option: 15, badge: 12, footer: 14 };

interface TraceBackLevel {
  label: string;
  value: number;
  available: boolean;
}

interface FloatingToolbarProps {
  canvasRef: React.RefObject<GraphCanvasHandle | null>;
  entryCount?: number;
  filteredCount?: number | null;
  totalCount?: number;
  onExpandAll: (tree: string) => void;
  onCollapseAll: (tree: string) => void;
  onExpandBothTrees: () => void;
  closeByRank?: Map<number, number> | null;
  traceBack?: number;
  traceBackLevels?: TraceBackLevel[] | null;
  onTraceBackChange?: (value: number) => void;
  depthLabels?: Record<number, string>;
  activeTree: ActiveTree;
  onSelectTree?: (tree: ActiveTree) => void;
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSortChange?: (key: SortKey, order: SortOrder) => void;
  onShuffle?: () => void;
  isShuffled?: boolean;
  filters?: TreeFilters | null;
  filterPanelOpen?: boolean;
  onFilterToggle?: () => void;
  liveCount?: number;
  liveFilterActive?: boolean;
  onLiveFilterToggle?: () => void;
  isMobile: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

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
  liveCount,
  liveFilterActive,
  onLiveFilterToggle,
  isMobile,
  expanded,
  onExpandedChange,
}: FloatingToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortBtnRef = useRef<HTMLDivElement | null>(null);
  const setExpanded = (v: boolean) => onExpandedChange?.(v);

  const activeFilterCount = countActiveFilters(filters ?? null);
  const hp = (id: string) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) });

  // Close expanded panel when switching away from mobile
  useEffect(() => {
    if (!isMobile) onExpandedChange?.(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onExpandedChange is a callback prop, only react to isMobile changes
  }, [isMobile]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handler = (e: PointerEvent) => {
      if (sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [sortDropdownOpen]);

  // Body scroll lock is handled by BottomSheet component

  // Close vtuber rank stats
  const rankEntries: Array<{ label: string; count: number }> = [];
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
  const radioRow = (id: string, label: string, isActive: boolean, onClick: () => void, { disabled = false, trailing = null as ReactNode } = {}): ReactNode => {
    const isH = hovered === id && !disabled;
    return (
      <button key={id} type="button" disabled={disabled} onClick={onClick} {...hp(id)}
        style={{
          width: '100%', height: 26, padding: '0 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          background: isActive ? 'rgba(34,197,94,0.12)' : isH ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: 'none',
          borderRadius: 4,
          color: disabled ? 'rgba(255,255,255,0.18)' : isActive ? '#22c55e' : 'rgba(255,255,255,0.6)',
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
  const iconBtn = (id: string, title: string, onClick: () => void, icon: ReactNode): ReactNode => {
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
  const actionBtn = (id: string, label: string, onClick: () => void, icon: ReactNode, { active = false, badge = null as ReactNode, extraProps = {} as Record<string, unknown> } = {}): ReactNode => {
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
      {/* ── Zoom (hidden on mobile BottomSheet) ── */}
      {!isMobile && [{
        id: 'fitAll', tint: '#22c55e', title: '完整展開', action: onExpandBothTrees,
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
      },
      {
        id: 'zoomIn', tint: undefined, title: '放大', action: () => canvasRef.current?.zoomIn(),
        icon: <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</span>
      },
      {
        id: 'zoomOut', tint: undefined, title: '縮小', action: () => canvasRef.current?.zoomOut(),
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

      {/* ── Tree selector with inline expand/collapse ── */}
      {onSelectTree && (
        <div style={{ paddingTop: 2 }}>
          {([
            { key: 'real' as ActiveTree, label: '現實生物' },
            { key: 'fictional' as ActiveTree, label: '虛構生物' },
          ]).map(item => {
            const isActive = activeTree === item.key;
            const isH = hovered === `tree-${item.key}`;
            return (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center',
                background: isActive ? 'rgba(34,197,94,0.12)' : isH ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.15s', height: 26,
              }}>
                <button type="button"
                  onClick={() => onSelectTree(item.key)} {...hp(`tree-${item.key}`)}
                  style={{
                    flex: 1, height: '100%', padding: '0 0 0 8px',
                    display: 'flex', alignItems: 'center',
                    background: 'none', border: 'none', borderRadius: 0,
                    color: isActive ? '#22c55e' : 'rgba(255,255,255,0.6)',
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
                {sortOrder === 'asc' ? '\u2191' : '\u2193'}
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

      {/* ── Action buttons: 直播中 + 篩選 + 打亂排序 ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, padding: '6px 4px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 直播中 */}
        {(liveCount ?? 0) > 0 && actionBtn('live-filter-btn', '直播中',
          () => { onLiveFilterToggle?.(); if (isMobile) setExpanded(false); },
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
            animation: 'vtaxonPulse 1.5s ease-in-out infinite', display: 'inline-block'
          }} />,
          {
            active: liveFilterActive,
            badge: <span style={{
              background: '#ef4444', color: '#fff', borderRadius: 7, padding: '0 4px',
              fontSize: F.badge, fontWeight: 700, lineHeight: '14px', minWidth: 14, textAlign: 'center',
            }}>{liveCount}</span>,
          },
        )}

        {/* 篩選 */}
        {hasFilters && actionBtn('filter-btn', '篩選', () => { onFilterToggle!(); if (isMobile) setExpanded(false); },
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>,
          {
            active: filterPanelOpen,
            badge: activeFilterCount > 0 ? (
              <span style={{
                background: '#22c55e', color: '#fff', borderRadius: 7, padding: '0 4px',
                fontSize: F.badge, fontWeight: 700, lineHeight: '14px', minWidth: 14, textAlign: 'center',
              }}>{activeFilterCount}</span>
            ) : null,
            extraProps: { 'data-filter-toggle': true },
          },
        )}

        {/* 打亂排序 */}
        {onShuffle && actionBtn('shuffle-btn', '今日隨機樹枝', () => { onShuffle(); if (isMobile) setExpanded(false); },
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>,
          { active: isShuffled },
        )}
      </div>

      {/* ── Trace back range ── */}
      {showTraceBack && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 4, paddingBottom: 2 }}>
          <div style={{ textAlign: 'center', fontSize: F.section, color: 'rgba(255,255,255,0.35)', marginBottom: 2, letterSpacing: 1.5 }}>
            溯源範圍
          </div>
          {traceBackLevels!.map(lv => {
            const isActive = lv.available && lv.value === traceBack;
            return radioRow(`tb-${lv.label}`, lv.label, isActive, () => onTraceBackChange!(lv.value), { disabled: !lv.available });
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
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{count}</span>
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

  // ── Mobile-only icon button (larger touch targets) ──
  const mobileIconBtn = (id: string, title: string, onClick: () => void, icon: ReactNode): ReactNode => {
    const isH = hovered === id;
    return (
      <button key={id} type="button" title={title} onClick={(e) => { e.stopPropagation(); onClick(); }} {...hp(id)}
        style={{
          width: 32, height: 32, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isH ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: 'none', borderRadius: 6,
          color: isH ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        }}
      >{icon}</button>
    );
  };

  const mobileExpandIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;
  const mobileCollapseIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>;

  // ── Mobile-only: simplified BottomSheet content (no tree selector, sort, filter) ──
  const mobileSheetContent = (
    <>
      {/* ── Tree expand/collapse controls ── */}
      {onSelectTree && (
        <div style={{ paddingTop: 4 }}>
          {([
            { key: 'real' as ActiveTree, label: '現實生物' },
            { key: 'fictional' as ActiveTree, label: '虛構生物' },
          ]).map(item => {
            const isActive = activeTree === item.key;
            return (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 12px', height: 44,
                background: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderRadius: 6,
              }}>
                <span style={{
                  fontSize: FM.option,
                  color: isActive ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 600 : 400,
                }}>{item.label}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {mobileIconBtn(`expand-${item.key}`, `${item.label} 全部展開`, () => { onSelectTree(item.key); onExpandAll(item.key); }, mobileExpandIcon)}
                  {mobileIconBtn(`collapse-${item.key}`, `${item.label} 全部收合`, () => { onSelectTree(item.key); onCollapseAll(item.key); }, mobileCollapseIcon)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 直播中 ���─ */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, padding: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(liveCount ?? 0) > 0 && (
          <button type="button" onClick={() => { onLiveFilterToggle?.(); setExpanded(false); }} {...hp('live-filter-btn')}
            style={{
              width: '100%', height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: liveFilterActive ? 'rgba(56,189,248,0.12)' : hovered === 'live-filter-btn' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: liveFilterActive ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer',
              color: liveFilterActive ? '#38bdf8' : 'rgba(255,255,255,0.7)',
              fontSize: FM.option, transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
              animation: 'vtaxonPulse 1.5s ease-in-out infinite', display: 'inline-block'
            }} />
            <span>直播中</span>
            <span style={{
              background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 6px',
              fontSize: FM.badge, fontWeight: 700, lineHeight: '18px', minWidth: 18, textAlign: 'center',
            }}>{liveCount}</span>
          </button>
        )}
      </div>

      {/* ── 打亂排序 ── */}
      {onShuffle && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, padding: '8px 8px 0' }}>
          <button type="button" onClick={() => { onShuffle(); setExpanded(false); }} {...hp('shuffle-btn')}
            style={{
              width: '100%', height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: isShuffled ? 'rgba(56,189,248,0.12)' : hovered === 'shuffle-btn' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: isShuffled ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer',
              color: isShuffled ? '#38bdf8' : 'rgba(255,255,255,0.7)',
              fontSize: FM.option, transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            <span>今日隨機樹枝</span>
          </button>
        </div>
      )}

      {/* ── Trace back range ── */}
      {showTraceBack && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ textAlign: 'center', fontSize: FM.section, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1.5 }}>
            溯源範圍
          </div>
          {traceBackLevels!.map(lv => {
            const isActive = lv.available && lv.value === traceBack;
            const isH = hovered === `tb-${lv.label}` && lv.available;
            return (
              <button key={`tb-${lv.label}`} type="button" disabled={!lv.available} onClick={() => onTraceBackChange!(lv.value)} {...hp(`tb-${lv.label}`)}
                style={{
                  width: '100%', height: 40, padding: '0 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: isActive ? 'rgba(34,197,94,0.12)' : isH ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderRadius: 6,
                  color: !lv.available ? 'rgba(255,255,255,0.18)' : isActive ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  fontSize: FM.option, fontWeight: isActive ? 600 : 400,
                  cursor: !lv.available ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {lv.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Close vtuber stats ── */}
      {rankEntries.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ textAlign: 'center', fontSize: FM.section, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1.5 }}>
            與我相近
          </div>
          {rankEntries.map(({ label, count }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px', fontSize: FM.option, color: 'rgba(255,255,255,0.6)' }}>
              <span>{label}</span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 8, padding: '8px 0 4px',
        textAlign: 'center', fontSize: FM.footer, color: 'rgba(255,255,255,0.4)',
      }}>
        {filteredCount != null && filteredCount !== totalCount
          ? <span>{filteredCount}/{totalCount} 筆</span>
          : <span>{entryCount || totalCount || 0} 筆</span>}
      </div>
    </>
  );

  // ═══════ Mobile: top horizontal toolbar + simplified bottom sheet ═══���═══
  if (isMobile) {
    const currentSortLabel = isShuffled ? '隨機' : (SORT_SHORT[sortKey] || '排序');
    return (
      <>
        {/* ── Top horizontal bar: 5 elements ── */}
        <div style={{
          background: 'rgba(8,13,21,0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '4px',
          display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          {/* 1. Hamburger — open simplified BottomSheet */}
          <button type="button" title="展開工具列" onClick={() => { setExpanded(true); setSortDropdownOpen(false); }}
            style={{
              minWidth: 34, height: 34, padding: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: expanded ? 'rgba(34,197,94,0.15)' : 'transparent',
              border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* 2. Fit all — expand both trees */}
          <button type="button" title="完整展開" onClick={onExpandBothTrees}
            style={{
              minWidth: 34, height: 34, padding: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </button>

          {/* 3. Segmented tree toggle */}
          {onSelectTree && (
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.08)',
              borderRadius: 6, padding: 2, flexShrink: 0,
            }}>
              {([
                { key: 'real' as ActiveTree, label: '現實' },
                { key: 'fictional' as ActiveTree, label: '虛構' },
              ]).map(item => {
                const isActive = activeTree === item.key;
                return (
                  <button key={item.key} type="button"
                    onClick={() => { onSelectTree(item.key); setSortDropdownOpen(false); }}
                    style={{
                      padding: '0 10px', height: 28, border: 'none', borderRadius: 4,
                      fontSize: 11, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                      background: isActive ? 'rgba(34,197,94,0.2)' : 'transparent',
                      color: isActive ? '#22c55e' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{item.label}</button>
                );
              })}
            </div>
          )}

          {/* 4. Sort dropdown */}
          {onSortChange && (
            <div ref={sortBtnRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button type="button" title="排序方式"
                onClick={() => setSortDropdownOpen(prev => !prev)}
                style={{
                  height: 34, padding: '0 8px', border: 'none', borderRadius: 6,
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: sortDropdownOpen ? 'rgba(34,197,94,0.15)' : 'transparent',
                  color: isShuffled ? 'rgba(255,255,255,0.5)' : '#22c55e',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'all 0.15s',
                }}
              >
                <span>{currentSortLabel}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{'\u25BE'}</span>
              </button>

              {/* Sort popover */}
              {sortDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4,
                  zIndex: 100, minWidth: 140,
                  background: 'rgba(8,13,21,0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: '4px 0',
                  animation: 'sortDropIn 0.2s cubic-bezier(0.32,0.72,0,1)',
                }}>
                  <style>{`@keyframes sortDropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  {SORT_OPTIONS.map(opt => {
                    const isActive = sortKey === opt.key && !isShuffled;
                    return (
                      <button key={opt.key} type="button"
                        onClick={() => {
                          if (isActive) {
                            onSortChange(sortKey, sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            onSortChange(opt.key, sortOrder);
                          }
                          if (!isActive) setSortDropdownOpen(false);
                        }}
                        style={{
                          width: '100%', height: 44, padding: '0 14px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: isActive ? '#22c55e' : 'rgba(255,255,255,0.65)',
                          fontSize: 13, fontWeight: isActive ? 600 : 400,
                          transition: 'background 0.15s',
                        }}
                      >
                        <span>{opt.label}</span>
                        {isActive && (
                          <span style={{ fontSize: 12 }}>
                            {sortOrder === 'asc' ? '\u2191' : '\u2193'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. Live filter button */}
          {(liveCount ?? 0) > 0 && (
            <button type="button" title="直播中"
              onClick={() => { onLiveFilterToggle?.(); setSortDropdownOpen(false); }}
              style={{
                minWidth: 34, height: 34, padding: 0, position: 'relative', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: liveFilterActive ? 'rgba(239,68,68,0.15)' : 'transparent',
                border: 'none', borderRadius: 6,
                color: liveFilterActive ? '#ef4444' : 'rgba(255,255,255,0.7)', cursor: 'pointer',
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
                animation: 'vtaxonPulse 1.5s ease-in-out infinite', display: 'inline-block'
              }} />
              <span style={{
                position: 'absolute', top: 0, right: -2,
                background: '#ef4444', color: '#fff', borderRadius: 7, padding: '0 3px',
                fontSize: 9, fontWeight: 700, lineHeight: '13px', minWidth: 13, textAlign: 'center',
              }}>{liveCount}</span>
            </button>
          )}

          {/* 6. Filter button + badge */}
          {hasFilters && (
            <button type="button" title="篩選" data-filter-toggle
              onClick={() => { onFilterToggle!(); setSortDropdownOpen(false); }}
              style={{
                minWidth: 34, height: 34, padding: 0, position: 'relative', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: filterPanelOpen ? 'rgba(56,189,248,0.15)' : 'transparent',
                border: 'none', borderRadius: 6,
                color: filterPanelOpen ? '#38bdf8' : 'rgba(255,255,255,0.7)', cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: -2,
                  background: '#22c55e', color: '#fff', borderRadius: 7, padding: '0 3px',
                  fontSize: 9, fontWeight: 700, lineHeight: '13px', minWidth: 13, textAlign: 'center',
                }}>{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>

        {/* ── Simplified BottomSheet (advanced settings only) ── */}
        <BottomSheet open={expanded ?? false} onClose={() => setExpanded(false)} maxHeight="85vh">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 10px' }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>進階設定</span>
            <button type="button" onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
            >&times;</button>
          </div>
          {mobileSheetContent}
        </BottomSheet>
      </>
    );
  }

  // ═══════ Desktop: full sidebar panel ════��══
  return (
    <div className="vtaxon-scroll" style={{
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
