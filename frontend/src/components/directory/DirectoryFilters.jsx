import { useState, useEffect, useRef, useMemo } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import FilterDropdown from './FilterDropdown';
import COUNTRIES, { getCountryName } from '../../lib/countries';
import useIsMobile from '../../hooks/useIsMobile';

const SORT_OPTIONS = [
  { value: 'created_at', label: '最近建檔' },
  { value: 'active_first', label: '活躍優先' },
  { value: 'name', label: '名稱' },
  { value: 'debut_date', label: '出道日期' },
  { value: 'organization', label: '組織' },
];

export default function DirectoryFilters({
  filters,
  onChange,
  viewMode,
  onViewModeChange,
  facets,       // from API: { country, country_none, gender, status, org_type, platform, has_traits }
  liveCount,
}) {
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setSearchInput(filters.q || '');
  }, [filters.q]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, q: val, page: 1 });
    }, 300);
  };

  const updateFilter = (key, val) => {
    onChange({ ...filters, [key]: val, page: 1 });
  };

  const updateSetFilter = (key, newSet) => {
    updateFilter(key, newSet.size > 0 ? [...newSet].join(',') : '');
  };

  const toSet = (str) => new Set(str ? str.split(',').filter(Boolean) : []);

  // --- Build dynamic options from facets ---
  const f = facets || {};

  // Country options: 無國旗 first, TW second, rest sorted by count desc
  const countryOptions = useMemo(() => {
    const countryFacets = f.country || {};
    const items = Object.entries(countryFacets).map(([code, count]) => ({
      value: code,
      label: getCountryName(code) || code,
      flagClass: `fi fi-${code.toLowerCase()}`,
      count,
    }));

    const tw = items.find(o => o.value === 'TW');
    const rest = items
      .filter(o => o.value !== 'TW')
      .sort((a, b) => b.count - a.count);

    return [
      { value: 'none', label: '無國旗', count: f.country_none || 0 },
      ...(tw ? [tw] : []),
      ...rest,
    ];
  }, [f.country, f.country_none]);

  const genderFacets = f.gender || {};
  const genderOptions = [
    { value: '男', label: '男', count: genderFacets['男'] ?? 0 },
    { value: '女', label: '女', count: genderFacets['女'] ?? 0 },
    { value: 'other', label: '自訂', count: genderFacets['other'] ?? 0 },
    { value: 'unset', label: '未設定', count: genderFacets['unset'] ?? 0 },
  ];

  const statusFacets = f.status || {};
  const statusOptions = [
    { value: 'active', label: '活動中', count: statusFacets['active'] ?? 0 },
    { value: 'hiatus', label: '活動休止', count: statusFacets['hiatus'] ?? 0 },
    { value: 'preparing', label: '準備中', count: statusFacets['preparing'] ?? 0 },
  ];

  const orgFacets = f.org_type || {};
  const orgOptions = [
    { value: 'corporate', label: '企業勢', count: orgFacets['corporate'] ?? 0 },
    { value: 'indie', label: '個人勢', count: orgFacets['indie'] ?? 0 },
    { value: 'club', label: '社團勢', count: orgFacets['club'] ?? 0 },
  ];

  const platformFacets = f.platform || {};
  const platformOptions = [
    { value: 'youtube', label: 'YouTube', count: platformFacets['youtube'] ?? 0 },
    { value: 'twitch', label: 'Twitch', count: platformFacets['twitch'] ?? 0 },
  ];

  const traitFacets = f.has_traits || {};

  // --- Collect active filter chips ---
  const chips = [];
  const countrySet = toSet(filters.country);
  for (const c of countrySet) {
    if (c === 'none') {
      chips.push({ key: 'country', value: c, label: '無國旗' });
    } else {
      chips.push({ key: 'country', value: c, label: getCountryName(c) || c, flagCode: c });
    }
  }
  const genderSet = toSet(filters.gender);
  for (const g of genderSet) {
    const opt = genderOptions.find(x => x.value === g);
    chips.push({ key: 'gender', value: g, label: opt?.label || g });
  }
  const statusSet = toSet(filters.status);
  for (const s of statusSet) {
    const opt = statusOptions.find(x => x.value === s);
    chips.push({ key: 'status', value: s, label: opt?.label || s });
  }
  if (filters.org_type) {
    const opt = orgOptions.find(x => x.value === filters.org_type);
    chips.push({ key: 'org_type', value: filters.org_type, label: opt?.label || filters.org_type });
  }
  const platformSet = toSet(filters.platform);
  for (const p of platformSet) {
    const opt = platformOptions.find(x => x.value === p);
    chips.push({ key: 'platform', value: p, label: opt?.label || p });
  }

  const removeChip = (chip) => {
    if (chip.key === 'org_type') {
      updateFilter(chip.key, '');
    } else {
      const set = toSet(filters[chip.key]);
      set.delete(chip.value);
      updateSetFilter(chip.key, set);
    }
  };

  const clearAll = () => {
    onChange({
      q: '', country: '', gender: '', status: '',
      org_type: '', platform: '', has_traits: 'true', live_first: '',
      sort: 'created_at', order: 'desc', page: 1,
    });
    setSearchInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Row 1: Search */}
      <div style={{ position: 'relative' }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        >
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="搜尋實況主名稱..."
          autoComplete="new-password"
          style={{
            width: '100%', padding: '8px 12px 8px 36px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff',
            fontSize: '0.9em', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Row 2: Filter buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        flexWrap: 'wrap',
      }}>
        <FilterDropdown
          label="國旗"
          options={countryOptions}
          selected={toSet(filters.country)}
          onChange={(s) => updateSetFilter('country', s)}
          isMobile={isMobile}
        />
        <FilterDropdown
          label="性別"
          options={genderOptions}
          selected={toSet(filters.gender)}
          onChange={(s) => updateSetFilter('gender', s)}
          isMobile={isMobile}
        />
        <FilterDropdown
          label="狀態"
          options={statusOptions}
          selected={toSet(filters.status)}
          onChange={(s) => updateSetFilter('status', s)}
          isMobile={isMobile}
        />
        <FilterDropdown
          label="組織"
          options={orgOptions}
          selected={toSet(filters.org_type)}
          onChange={(s) => updateSetFilter('org_type', s)}
          multi={false}
          isMobile={isMobile}
        />
        <FilterDropdown
          label="平台"
          options={platformOptions}
          selected={toSet(filters.platform)}
          onChange={(s) => updateSetFilter('platform', s)}
          isMobile={isMobile}
        />

        {/* Separator between dropdowns and toggles */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />

        <ToggleControls filters={filters} updateFilter={updateFilter} traitFacets={traitFacets} liveCount={liveCount} />

        {/* Desktop: separator + sort + view toggle inline */}
        {!isMobile && <>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }} />
          <SortControls filters={filters} updateFilter={updateFilter} />
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </>}
      </div>

      {/* Row 2b (mobile only): sort */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SortControls filters={filters} updateFilter={updateFilter} />
        </div>
      )}

      {/* Row 3: Active chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {chips.map((chip, i) => (
            <span
              key={`${chip.key}-${chip.value}`}
              style={{
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: 12, padding: '2px 8px',
                fontSize: '0.78em', color: '#38bdf8',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {chip.flagCode && (
                <span
                  className={`fi fi-${chip.flagCode.toLowerCase()}`}
                  style={{ width: 14, height: 10, display: 'inline-block', borderRadius: 1 }}
                />
              )}
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip)}
                style={{
                  background: 'none', border: 'none', color: '#38bdf8',
                  cursor: 'pointer', padding: 0, fontSize: '1.1em', lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: '0.78em',
            }}
          >
            清除全部
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleControls({ filters, updateFilter, traitFacets, liveCount }) {
  const toggles = [
    {
      key: 'live_first',
      active: filters.live_first === 'true',
      label: '直播優先',
      count: liveCount || null,
      onClick: () => updateFilter('live_first', filters.live_first === 'true' ? '' : 'true'),
    },
    {
      key: 'show_untagged',
      active: filters.has_traits !== 'true',
      label: '顯示未標註',
      count: traitFacets?.['false'] ?? null,
      onClick: () => updateFilter('has_traits', filters.has_traits !== 'true' ? 'true' : ''),
    },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.8em' }}>
      {toggles.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={t.onClick}
          style={{
            background: t.active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${t.active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 5, padding: '4px 8px',
            color: t.active ? '#38bdf8' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: '1em',
            whiteSpace: 'nowrap',
          }}
        >
          {t.label}
          {t.count != null && (
            <span style={{ opacity: 0.6, marginLeft: 2 }}>({t.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

function SortControls({ filters, updateFilter }) {
  const currentSort = filters.sort || 'created_at';
  const isAsc = filters.order === 'asc';

  const handleClick = (value) => {
    if (value === currentSort) {
      updateFilter('order', isAsc ? 'desc' : 'asc');
    } else {
      updateFilter('sort', value);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.8em' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>排序:</span>
      {SORT_OPTIONS.map(o => {
        const active = o.value === currentSort;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => handleClick(o.value)}
            style={{
              background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 5, padding: '4px 8px',
              color: active ? '#38bdf8' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: '1em',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}{active ? (isAsc ? ' ↑' : ' ↓') : ''}
          </button>
        );
      })}
    </div>
  );
}

function ViewToggle({ viewMode, onViewModeChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        title="格狀檢視"
        style={viewBtnStyle(viewMode === 'grid')}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" rx="1" />
          <rect x="8" y="0" width="6" height="6" rx="1" />
          <rect x="0" y="8" width="6" height="6" rx="1" />
          <rect x="8" y="8" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        title="列表檢視"
        style={viewBtnStyle(viewMode === 'list')}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="1" width="14" height="2.5" rx="1" />
          <rect x="0" y="5.75" width="14" height="2.5" rx="1" />
          <rect x="0" y="10.5" width="14" height="2.5" rx="1" />
        </svg>
      </button>
    </div>
  );
}

function viewBtnStyle(active) {
  return {
    background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 5, padding: '5px 7px',
    color: active ? '#38bdf8' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  };
}
