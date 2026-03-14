import { useState, useRef, useEffect, useMemo } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import { getCountryName } from '../../lib/countries';
import { countActiveFilters } from '../../lib/treeFilters';
import { FILTER_BADGES } from '../../lib/filterBadges';
import { YouTubeIcon, TwitchIcon } from '../SnsIcons';
import BottomSheet from '../BottomSheet';

const GENDER_LABELS = { '男': '男', '女': '女', 'other': '自訂', unset: '未設定' };
const STATUS_LABELS = { active: '活動中', hiatus: '活動休止', preparing: '準備中', unset: '未設定' };
const ORG_LABELS = { corporate: '企業勢', indie: '個人勢', club: '社團勢' };
const PLATFORM_LABELS = { youtube: 'YouTube', twitch: 'Twitch' };

/**
 * Floating filter panel — appears to the right of the toolbar.
 */
export default function FilterPanel({ filters, onFiltersChange, facets, onClose, isMobile, open: openProp }) {
  const panelRef = useRef(null);
  const [collapsed, setCollapsed] = useState({});

  // Click outside to close (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)
          && !e.target.closest('[data-filter-toggle]')) onClose();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [onClose, isMobile]);

  // Body scroll lock is handled by BottomSheet component on mobile

  const toggle = (dim, val) => {
    const set = new Set(filters[dim]);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onFiltersChange({ ...filters, [dim]: set });
  };

  const toggleSingle = (dim, val) => {
    const set = new Set(filters[dim]);
    if (set.has(val)) set.delete(val);
    else onFiltersChange({ ...filters, [dim]: new Set([val]) });
    if (set.has(val)) {
      set.delete(val);
      onFiltersChange({ ...filters, [dim]: set });
    }
  };

  const clearAll = () => {
    onFiltersChange({
      country: new Set(), gender: new Set(), status: new Set(),
      org_type: new Set(), platform: new Set(),
    });
  };

  const activeCount = countActiveFilters(filters);

  const toggleSection = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build options
  const countryOpts = useMemo(() => {
    if (!facets?.country) return [];
    let noneItem = null;
    const items = [];
    for (const [code, count] of facets.country) {
      if (code === 'none') noneItem = { value: 'none', label: '無國旗', count };
      else items.push({ value: code, label: getCountryName(code) || code, flagClass: `fi fi-${code.toLowerCase()}`, count });
    }
    items.sort((a, b) => b.count - a.count);
    if (noneItem) items.unshift(noneItem);
    return items;
  }, [facets?.country]);

  const genderOpts = useMemo(() => {
    if (!facets?.gender) return [];
    return [...facets.gender.entries()].map(([v, c]) => ({ value: v, label: GENDER_LABELS[v] || v, count: c }));
  }, [facets?.gender]);

  const statusOpts = useMemo(() => {
    if (!facets?.status) return [];
    return [...facets.status.entries()].map(([v, c]) => ({ value: v, label: STATUS_LABELS[v] || v, count: c }));
  }, [facets?.status]);

  const orgOpts = useMemo(() => {
    if (!facets?.org_type) return [];
    return [...facets.org_type.entries()].map(([v, c]) => ({ value: v, label: ORG_LABELS[v] || v, count: c }));
  }, [facets?.org_type]);

  const platformOpts = useMemo(() => {
    if (!facets?.platform) return [];
    return [...facets.platform.entries()].map(([v, c]) => ({ value: v, label: PLATFORM_LABELS[v] || v, count: c }));
  }, [facets?.platform]);

  const sections = [
    { key: 'country', title: '國旗', options: countryOpts, multi: true },
    { key: 'gender', title: '性別', options: genderOpts, multi: true },
    { key: 'status', title: '狀態', options: statusOpts, multi: true },
    { key: 'org_type', title: '組織', options: orgOpts, multi: false },
    { key: 'platform', title: '平台', options: platformOpts, multi: true },
  ].filter(s => s.options.length > 0);

  const checkboxRow = (dim, opt, multi) => {
    const selected = filters[dim] || new Set();
    const isChecked = selected.has(opt.value);
    // Get badge color for this option (skip country — uses flag icons)
    const badgeConf = dim !== 'country' ? FILTER_BADGES[dim]?.[opt.value] : null;
    const checkSize = isMobile ? 20 : 15;
    const checkSvgSize = isMobile ? 12 : 9;
    const rowFontSize = isMobile ? 15 : 12;
    const countFontSize = isMobile ? 14 : 11;
    const platformIconSize = isMobile ? 18 : 14;
    const dotSize = isMobile ? 10 : 8;
    const flagW = isMobile ? 22 : 18;
    const flagH = isMobile ? 16 : 13;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => multi ? toggle(dim, opt.value) : toggleSingle(dim, opt.value)}
        style={{
          width: '100%', padding: isMobile ? '8px 12px 8px 8px' : '4px 8px 4px 4px',
          display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 7,
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.85)',
          fontSize: rowFontSize, cursor: 'pointer', textAlign: 'left',
          borderRadius: isMobile ? 6 : 4,
          minHeight: isMobile ? 44 : undefined,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
      >
        {/* Checkbox / radio indicator */}
        <span style={{
          width: checkSize, height: checkSize, flexShrink: 0,
          borderRadius: multi ? (isMobile ? 4 : 3) : checkSize,
          border: `${isMobile ? 2 : 1.5}px solid ${isChecked ? '#38bdf8' : 'rgba(255,255,255,0.25)'}`,
          background: isChecked ? 'rgba(56,189,248,0.2)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isChecked && (
            <svg width={checkSvgSize} height={checkSvgSize} viewBox="0 0 10 10" fill="none" stroke="#38bdf8" strokeWidth="2">
              <path d="M2 5 L4 7 L8 3" />
            </svg>
          )}
        </span>
        {/* Platform icon or badge color dot */}
        {badgeConf?.isPlatform ? (
          <span style={{ flexShrink: 0, opacity: isChecked ? 1 : 0.5, display: 'flex', alignItems: 'center' }}>
            {opt.value === 'youtube' ? <YouTubeIcon size={platformIconSize} /> : <TwitchIcon size={platformIconSize} />}
          </span>
        ) : badgeConf && !badgeConf.isPlatform ? (
          <span style={{
            width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
            background: badgeConf.color,
            opacity: isChecked ? 1 : 0.5,
          }} />
        ) : null}
        {/* Flag icon */}
        {opt.flagClass && (
          <span className={opt.flagClass}
            style={{ width: flagW, height: flagH, display: 'inline-block', borderRadius: 2, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1 }}>{opt.label}</span>
        {opt.count != null && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: countFontSize }}>{opt.count}</span>
        )}
      </button>
    );
  };

  const panelBody = (
    <>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px 10px' : '0 6px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: isMobile ? 4 : 2,
      }}>
        <span style={{ fontSize: isMobile ? 17 : 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
          篩選
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 8 }}>
          {activeCount > 0 && (
            <button
              type="button" onClick={clearAll}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: isMobile ? 14 : 11, color: 'rgba(255,255,255,0.4)',
                textDecoration: 'underline', padding: isMobile ? '4px 0' : 0,
              }}
            >
              清除全部
            </button>
          )}
          <button
            type="button" onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 22 : 18, lineHeight: 1,
              padding: isMobile ? '0 4px' : '0 2px',
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.map(sec => {
        const isOpen = !collapsed[sec.key];
        const selectedCount = (filters[sec.key] || new Set()).size;
        return (
          <div key={sec.key}>
            <button
              type="button"
              onClick={() => toggleSection(sec.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: isMobile ? '10px 12px' : '5px 6px',
                background: 'none', border: 'none', cursor: 'pointer',
                gap: isMobile ? 6 : 4,
                minHeight: isMobile ? 44 : undefined,
              }}
            >
              <svg
                width={isMobile ? 10 : 8} height={isMobile ? 10 : 8} viewBox="0 0 10 10" fill="none"
                stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"
                style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }}
              >
                <path d="M2 3.5 L5 6.5 L8 3.5" />
              </svg>
              <span style={{ fontSize: isMobile ? 15 : 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', flex: 1, textAlign: 'left' }}>
                {sec.title}
              </span>
              {selectedCount > 0 && (
                <span style={{
                  background: '#22c55e', color: '#fff',
                  borderRadius: isMobile ? 8 : 7, padding: isMobile ? '1px 6px' : '0 4px',
                  fontSize: isMobile ? 12 : 9, fontWeight: 700,
                  lineHeight: isMobile ? '18px' : '14px', minWidth: isMobile ? 18 : 14, textAlign: 'center',
                }}>
                  {selectedCount}
                </span>
              )}
            </button>
            {isOpen && (
              <div style={{ padding: isMobile ? '0 4px 8px' : '0 2px 4px' }}>
                {sec.options.map(opt => checkboxRow(sec.key, opt, sec.multi))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  // Mobile: animated bottom sheet with backdrop
  if (isMobile) {
    return (
      <BottomSheet open={openProp !== undefined ? openProp : true} onClose={onClose} maxHeight="85vh">
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {panelBody}
      </BottomSheet>
    );
  }

  // Desktop: floating panel
  return (
    <div
      ref={panelRef}
      style={{
        background: 'rgba(8,13,21,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: '10px 6px',
        minWidth: 180, maxWidth: 220,
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {panelBody}
    </div>
  );
}
