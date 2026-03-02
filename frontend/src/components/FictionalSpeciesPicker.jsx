import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../lib/api';
import AiPromptBlock from './AiPromptBlock';

/* ── 排序設定 ─────────────────────────────────────── */
const ORIGIN_ORDER = [
  '東方神話',
  '西方神話',
  '奇幻文學',
  '人造生命',
  '非物質生命',
  '現代虛構',
];

const SUB_ORIGIN_ORDER = {
  '東方神話': ['中國神話', '日本神話'],
  '西方神話': ['希臘神話', '北歐神話', '歐洲民間傳說'],
  '奇幻文學': ['通用'],
  '人造生命': ['機械生命', '生物合成'],
  '非物質生命': ['能量態生命', '意識態生命', '資訊態生命'],
  '現代虛構': ['克蘇魯神話', '都市傳說', '科幻'],
};

function sortedEntries(map, orderArr) {
  const rank = new Map(orderArr.map((k, i) => [k, i]));
  return Array.from(map.entries()).sort(([a], [b]) => {
    const ra = rank.has(a) ? rank.get(a) : 999;
    const rb = rank.has(b) ? rank.get(b) : 999;
    return ra - rb;
  });
}


export default function FictionalSpeciesPicker({ existingTraitIds = [], onAdd }) {
  const [allSpecies, setAllSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrigins, setExpandedOrigins] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ name_zh: '', name_en: '', suggested_origin: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getFictionalSpecies();
        if (!cancelled) setAllSpecies(data.species || []);
      } catch (err) {
        console.error('Failed to load fictional species:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Existing fictional trait IDs set for quick lookup
  const existingSet = useMemo(() => new Set(existingTraitIds), [existingTraitIds]);

  // Filter species by search query
  const filteredSpecies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSpecies;
    return allSpecies.filter(sp =>
      (sp.name_zh && sp.name_zh.toLowerCase().includes(q)) ||
      (sp.name && sp.name.toLowerCase().includes(q)) ||
      (sp.description && sp.description.toLowerCase().includes(q))
    );
  }, [allSpecies, searchQuery]);

  // Group filtered species by origin → sub_origin
  const grouped = useMemo(() => {
    const map = new Map();
    for (const sp of filteredSpecies) {
      const origin = sp.origin || '其他';
      if (!map.has(origin)) map.set(origin, new Map());
      const subMap = map.get(origin);
      const sub = sp.sub_origin || null;
      if (!subMap.has(sub)) subMap.set(sub, []);
      subMap.get(sub).push(sp);
    }
    return map;
  }, [filteredSpecies]);

  // Auto-expand all when searching
  const isSearching = searchQuery.trim().length > 0;

  const toggleOrigin = useCallback((origin) => {
    setExpandedOrigins(prev => ({ ...prev, [origin]: !prev[origin] }));
  }, []);

  const toggleSub = useCallback((key) => {
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (!requestForm.name_zh.trim()) return;
    setSubmitting(true);
    try {
      await api.createFictionalRequest(requestForm);
      setSubmitted(true);
      setRequestForm({ name_zh: '', name_en: '', suggested_origin: '', description: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        載入虛構物種資料中…
      </div>
    );
  }

  return (
    <div>
      {/* Search box */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜尋虛構物種（例：狐、龍、AI）"
        style={{
          width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '6px', fontSize: '0.95em', boxSizing: 'border-box',
          background: '#1a2433', color: '#e2e8f0',
        }}
      />

      {/* AI classify prompt section */}
      <div style={{ marginTop: '12px' }}>
        <AiPromptBlock />
      </div>

      {/* Accordion tree */}
      <div style={{ marginTop: '16px' }}>
        {grouped.size === 0 && (
          <div style={{ padding: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            找不到符合的虛構物種
          </div>
        )}
        {sortedEntries(grouped, ORIGIN_ORDER).map(([origin, subMap]) => {
          const originExpanded = isSearching || !!expandedOrigins[origin];
          return (
            <div key={origin} style={{ marginBottom: '2px' }}>
              <button
                type="button"
                onClick={() => toggleOrigin(origin)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  color: '#e2e8f0', fontWeight: 600, fontSize: '0.95em',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <span style={{ fontSize: '0.8em', width: '14px' }}>{originExpanded ? '▼' : '▶'}</span>
                {origin}
                <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                  ({Array.from(subMap.values()).reduce((sum, arr) => sum + arr.length, 0)})
                </span>
              </button>
              {originExpanded && (
                <div style={{ paddingLeft: '16px' }}>
                  {sortedEntries(subMap, SUB_ORIGIN_ORDER[origin] || []).map(([sub, species]) => {
                    const subKey = `${origin}|${sub}`;
                    const hasSubCategories = subMap.size > 1 || sub !== null;
                    const subExpanded = isSearching || !hasSubCategories || !!expandedSubs[subKey];

                    if (!hasSubCategories) {
                      // No sub_origin, render species directly
                      return species.map(sp => (
                        <SpeciesItem
                          key={sp.id}
                          species={sp}
                          isAdded={existingSet.has(sp.id)}
                          onAdd={onAdd}
                        />
                      ));
                    }

                    return (
                      <div key={subKey} style={{ marginBottom: '1px' }}>
                        <button
                          type="button"
                          onClick={() => toggleSub(subKey)}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '6px 10px', background: 'transparent',
                            border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)', fontSize: '0.9em',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <span style={{ fontSize: '0.75em', width: '12px' }}>{subExpanded ? '▼' : '▶'}</span>
                          {sub || '（未分類）'}
                          <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.25)' }}>
                            ({species.length})
                          </span>
                        </button>
                        {subExpanded && (
                          <div style={{ paddingLeft: '12px' }}>
                            {species.map(sp => (
                              <SpeciesItem
                                key={sp.id}
                                species={sp}
                                isAdded={existingSet.has(sp.id)}
                                onAdd={onAdd}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Request form */}
      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        {submitted ? (
          <div style={{ color: '#34d399', fontSize: '0.9em' }}>
            已送出，等待管理員審核！
            <button
              type="button"
              onClick={() => { setSubmitted(false); setShowRequestForm(false); }}
              style={{
                marginLeft: '8px', background: 'none', border: 'none',
                color: '#38bdf8', cursor: 'pointer', fontSize: '0.9em',
              }}
            >
              再送一筆
            </button>
          </div>
        ) : showRequestForm ? (
          <form onSubmit={handleSubmitRequest}>
            <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              回報遺漏的虛構物種
            </div>
            <div style={{
              fontSize: '0.8em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px',
              lineHeight: 1.6, padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '4px',
            }}>
              如果你發現某個有知名度的物種不在列表中，歡迎告訴我們！
              我們會定期審核並補上遺漏的種類。送出後管理員會收到通知。
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={requestForm.name_zh}
                onChange={(e) => setRequestForm(prev => ({ ...prev, name_zh: e.target.value }))}
                placeholder="物種名稱（中文）*"
                required
                style={formInputStyle}
              />
              <input
                type="text"
                value={requestForm.name_en}
                onChange={(e) => setRequestForm(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder="英文名（選填）"
                style={formInputStyle}
              />
              <input
                type="text"
                value={requestForm.suggested_origin}
                onChange={(e) => setRequestForm(prev => ({ ...prev, suggested_origin: e.target.value }))}
                placeholder="希望分類（例：東方神話 → 日本神話）"
                style={formInputStyle}
              />
              <textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="簡述這個物種的特徵…"
                rows={2}
                style={{ ...formInputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={submitting} style={{
                  padding: '6px 14px', background: '#38bdf8', color: '#0d1526',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '0.85em', fontWeight: 600,
                }}>
                  {submitting ? '送出中…' : '送出回報'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  style={{
                    padding: '6px 14px', background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)', border: 'none',
                    borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowRequestForm(true)}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(56,189,248,0.08)',
              border: '1px dashed rgba(56,189,248,0.35)',
              borderRadius: '6px', cursor: 'pointer',
              color: '#38bdf8', fontSize: '0.9em', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.1em' }}>+</span>
            找不到想要的物種？回報遺漏
          </button>
        )}
      </div>
    </div>
  );
}


function SpeciesItem({ species, isAdded, onAdd }) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (isAdded || adding) return;
    setAdding(true);
    try {
      await onAdd(species);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: '#e2e8f0', fontSize: '0.9em' }}>
          {species.name_zh || species.name}
        </span>
        {species.name_zh && species.name && species.name_zh !== species.name && (
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8em', marginLeft: '6px' }}>
            ({species.name})
          </span>
        )}
        {species.description && (
          <div style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
            {species.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdded || adding}
        style={{
          padding: '3px 10px', borderRadius: '4px', fontSize: '0.8em',
          fontWeight: 600, cursor: isAdded ? 'default' : 'pointer',
          border: 'none', flexShrink: 0, marginLeft: '8px',
          background: isAdded ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.15)',
          color: isAdded ? 'rgba(255,255,255,0.3)' : '#38bdf8',
        }}
      >
        {isAdded ? '已新增' : adding ? '…' : '新增'}
      </button>
    </div>
  );
}

const formInputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};
