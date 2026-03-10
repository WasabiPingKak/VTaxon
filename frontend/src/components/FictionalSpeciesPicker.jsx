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
  const [expandedTypes, setExpandedTypes] = useState({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ name_zh: '', name_en: '', suggested_origin: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

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

  // Pre-compute type names from ALL species (not just filtered) so search doesn't break type grouping
  const globalTypeNamesPerSub = useMemo(() => {
    const m = new Map(); // key: "origin|sub_origin" → Set of type names
    for (const sp of allSpecies) {
      if (!sp.category_path) continue;
      const segments = sp.category_path.split('|');
      if (segments.length === 4) {
        const subKey = `${segments[0]}|${segments[1]}`;
        if (!m.has(subKey)) m.set(subKey, new Set());
        m.get(subKey).add(segments[2]);
      }
    }
    return m;
  }, [allSpecies]);

  // Index type nodes by category_path for quick lookup when we need to inject them during search
  const typeNodeByPath = useMemo(() => {
    const m = new Map();
    for (const sp of allSpecies) {
      if (!sp.category_path) continue;
      const segments = sp.category_path.split('|');
      if (segments.length === 3) {
        const subKey = `${segments[0]}|${segments[1]}`;
        const knownTypes = globalTypeNamesPerSub.get(subKey);
        if (knownTypes && knownTypes.has(segments[2])) {
          m.set(sp.category_path, sp);
        }
      }
    }
    return m;
  }, [allSpecies, globalTypeNamesPerSub]);

  // Group filtered species by origin → sub_origin → { types, directSpecies }
  const grouped = useMemo(() => {
    // Group species
    const map = new Map();
    for (const sp of filteredSpecies) {
      const origin = sp.origin || '其他';
      if (!map.has(origin)) map.set(origin, new Map());
      const subMap = map.get(origin);
      const sub = sp.sub_origin || null;
      const subKey = `${origin}|${sub}`;

      if (!subMap.has(sub)) {
        subMap.set(sub, { types: new Map(), directSpecies: [] });
      }
      const group = subMap.get(sub);

      if (!sp.category_path) {
        group.directSpecies.push(sp);
        continue;
      }

      const segments = sp.category_path.split('|');
      const knownTypes = globalTypeNamesPerSub.get(subKey);

      if (segments.length === 4) {
        // Leaf species under a type
        const typeName = segments[2];
        if (!group.types.has(typeName)) {
          group.types.set(typeName, { typeNode: null, children: [] });
        }
        group.types.get(typeName).children.push(sp);
        // Ensure the type node is always present when its children are shown
        const entry = group.types.get(typeName);
        if (!entry.typeNode) {
          const typePath = `${segments[0]}|${segments[1]}|${typeName}`;
          const tn = typeNodeByPath.get(typePath);
          if (tn) entry.typeNode = tn;
        }
      } else if (segments.length === 3 && knownTypes && knownTypes.has(segments[2])) {
        // This is a type node itself (3-segment path matching a known type name)
        const typeName = segments[2];
        if (!group.types.has(typeName)) {
          group.types.set(typeName, { typeNode: null, children: [] });
        }
        group.types.get(typeName).typeNode = sp;
      } else {
        // Direct species (3-segment path with no type children, or other)
        group.directSpecies.push(sp);
      }
    }
    return map;
  }, [filteredSpecies, globalTypeNamesPerSub, typeNodeByPath]);

  // Auto-expand all when searching
  const isSearching = searchQuery.trim().length > 0;

  const toggleOrigin = useCallback((origin) => {
    setExpandedOrigins(prev => ({ ...prev, [origin]: !prev[origin] }));
  }, []);

  const toggleSub = useCallback((key) => {
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleType = useCallback((key) => {
    setExpandedTypes(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (!requestForm.name_zh.trim() || !requestForm.name_en.trim() || !requestForm.suggested_origin.trim() || !requestForm.description.trim()) return;
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
        autoComplete="nope"
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
          // Count total species across all subs
          let totalCount = 0;
          for (const [, group] of subMap) {
            totalCount += group.directSpecies.length;
            for (const [, typeData] of group.types) {
              totalCount += typeData.children.length;
              if (typeData.typeNode) totalCount++;
            }
          }
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
                  ({totalCount})
                </span>
              </button>
              {originExpanded && (
                <div style={{ paddingLeft: '16px' }}>
                  {sortedEntries(subMap, SUB_ORIGIN_ORDER[origin] || []).map(([sub, group]) => {
                    const subKey = `${origin}|${sub}`;
                    const hasSubCategories = subMap.size > 1 || sub !== null;
                    const subExpanded = isSearching || !hasSubCategories || !!expandedSubs[subKey];

                    // Count items in this sub
                    let subCount = group.directSpecies.length;
                    for (const [, typeData] of group.types) {
                      subCount += typeData.children.length;
                      if (typeData.typeNode) subCount++;
                    }

                    if (!hasSubCategories) {
                      return (
                        <SubContent
                          key={subKey}
                          subKey={subKey}
                          group={group}
                          existingSet={existingSet}
                          onAdd={onAdd}
                          isSearching={isSearching}
                          expandedTypes={expandedTypes}
                          toggleType={toggleType}
                        />
                      );
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
                            ({subCount})
                          </span>
                        </button>
                        {subExpanded && (
                          <div style={{ paddingLeft: '12px' }}>
                            <SubContent
                              subKey={subKey}
                              group={group}
                              existingSet={existingSet}
                              onAdd={onAdd}
                              isSearching={isSearching}
                              expandedTypes={expandedTypes}
                              toggleType={toggleType}
                            />
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
            {/* Collapsible guide */}
            <div style={{
              marginBottom: '10px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                type="button"
                onClick={() => setGuideOpen(prev => !prev)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.6)', fontSize: '0.8em', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <span style={{ fontSize: '0.85em' }}>{guideOpen ? '▼' : '▶'}</span>
                送出回報前，請先確認以下事項
              </button>
              {guideOpen && (
                <div style={{
                  fontSize: '0.78em', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
                  padding: '0 10px 10px 10px',
                }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                    1. 必須是有具體形象的物種
                  </p>
                  <div style={{ paddingLeft: '12px', marginBottom: '8px' }}>
                    虛構物種必須有明確的外觀形象特徵。<br />
                    <span style={{ color: 'rgba(239,68,68,0.7)' }}>✗</span>「神」「精靈」「妖怪」等空泛分類不會被收錄<br />
                    <span style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span> 應具體到某個文化體系中的特定物種，例如「阿努比斯（埃及神話）」「九尾狐（東亞神話）」「獨角獸（西方神話）」
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                    2. 希望分類可以自創階層
                  </p>
                  <div style={{ paddingLeft: '12px', marginBottom: '8px' }}>
                    如果現有分類中沒有合適的，你可以自行建議新的分類路徑（例：「北歐神話 → 巨人族」）。<br />
                    管理員會根據你的建議整理到合適的位置。
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                    3. 補充說明請附上來源或典故
                  </p>
                  <div style={{ paddingLeft: '12px', marginBottom: '10px' }}>
                    請在補充說明中簡述該物種的文化出處，或附上維基百科等參考連結。<br />
                    這能幫助管理員快速確認並正確分類。
                  </div>
                  <div style={{
                    padding: '8px 10px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '4px', borderLeft: '3px solid rgba(56,189,248,0.3)',
                  }}>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
                      回報受理條件（缺少以下任一項將會被退回）：
                    </div>
                    <span style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span> 物種名稱明確且具體（非空泛分類詞）<br />
                    <span style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span> 已填寫英文名稱（方便國際化與查證）<br />
                    <span style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span> 已填寫希望的分類路徑<br />
                    <span style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span> 補充說明中包含來源典故或參考連結<br />
                    <span style={{ marginTop: '4px', display: 'inline-block' }}>四個欄位皆為必填。</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={formLabelStyle}>物種中文名稱 *</label>
                <input
                  type="text"
                  value={requestForm.name_zh}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, name_zh: e.target.value }))}
                  placeholder="虛構物種中文名稱"
                  required
                  autoComplete="nope"
                  style={formInputStyle}
                />
                <div style={formHintStyle}>（例：九尾狐、鳳凰、克拉肯）</div>
              </div>
              <div>
                <label style={formLabelStyle}>物種英文名稱 *</label>
                <input
                  type="text"
                  value={requestForm.name_en}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="虛構物種英文名稱"
                  required
                  autoComplete="nope"
                  style={formInputStyle}
                />
                <div style={formHintStyle}>（例：Nine-tailed Fox、Phoenix、Kraken）</div>
              </div>
              <div>
                <label style={formLabelStyle}>希望分類 *</label>
                <input
                  type="text"
                  value={requestForm.suggested_origin}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, suggested_origin: e.target.value }))}
                  placeholder="希望歸入的分類（如：東方神話 → 日本神話）"
                  required
                  autoComplete="nope"
                  style={formInputStyle}
                />
                <div style={formHintStyle}>（可自創階層，例：東方神話 → 日本神話）</div>
              </div>
              <div>
                <label style={formLabelStyle}>補充說明 *</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="簡述物種形象特徵、來源典故或附上參考連結（必填）"
                  rows={2}
                  required
                  autoComplete="nope"
                  style={{ ...formInputStyle, resize: 'vertical' }}
                />
                <div style={formHintStyle}>（請附上來源典故或參考連結）</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={submitting || !requestForm.name_zh.trim() || !requestForm.name_en.trim() || !requestForm.suggested_origin.trim() || !requestForm.description.trim()}
                  style={{
                    padding: '6px 14px', background: '#38bdf8', color: '#0d1526',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.85em', fontWeight: 600,
                    opacity: (submitting || !requestForm.name_zh.trim() || !requestForm.name_en.trim() || !requestForm.suggested_origin.trim() || !requestForm.description.trim()) ? 0.5 : 1,
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


/** Renders type rows + direct species inside a sub_origin group */
function SubContent({ subKey, group, existingSet, onAdd, isSearching, expandedTypes, toggleType }) {
  return (
    <>
      {/* Type rows */}
      {Array.from(group.types.entries()).map(([typeName, typeData]) => (
        <TypeRow
          key={`${subKey}|${typeName}`}
          typeKey={`${subKey}|${typeName}`}
          typeName={typeName}
          typeNode={typeData.typeNode}
          children={typeData.children}
          existingSet={existingSet}
          onAdd={onAdd}
          isSearching={isSearching}
          expanded={isSearching || !!expandedTypes[`${subKey}|${typeName}`]}
          onToggle={() => toggleType(`${subKey}|${typeName}`)}
        />
      ))}
      {/* Direct species (no type grouping) */}
      {group.directSpecies.map(sp => (
        <SpeciesItem
          key={sp.id}
          species={sp}
          isAdded={existingSet.has(sp.id)}
          onAdd={onAdd}
        />
      ))}
    </>
  );
}


/** A type-level row: expandable grouping header, also selectable as trait if typeNode exists */
function TypeRow({ typeKey, typeName, typeNode, children, existingSet, onAdd, isSearching, expanded, onToggle }) {
  const hasChildren = children.length > 0;
  const [adding, setAdding] = useState(false);
  const isAdded = typeNode ? existingSet.has(typeNode.id) : false;

  async function handleAddType() {
    if (!typeNode || isAdded || adding) return;
    setAdding(true);
    try {
      await onAdd(typeNode);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={{ marginBottom: '1px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '5px 8px',
        background: 'rgba(168,85,247,0.04)',
        borderRadius: '3px',
      }}>
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.7em',
              width: '16px', padding: 0, flexShrink: 0,
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: '16px', flexShrink: 0 }} />
        )}

        {/* Type name + count */}
        <button
          type="button"
          onClick={hasChildren ? onToggle : undefined}
          style={{
            flex: 1, minWidth: 0, textAlign: 'left',
            background: 'none', border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            color: 'rgba(255,255,255,0.65)', fontSize: '0.85em',
            fontWeight: 600, padding: 0,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {typeName}
          {hasChildren && (
            <span style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
              ({children.length})
            </span>
          )}
        </button>

        {/* Add button for type node itself */}
        {typeNode && (
          <button
            type="button"
            onClick={handleAddType}
            disabled={isAdded || adding}
            style={{
              padding: '3px 10px', borderRadius: '4px', fontSize: '0.75em',
              fontWeight: 600, cursor: isAdded ? 'default' : 'pointer',
              border: 'none', flexShrink: 0, marginLeft: '8px',
              background: isAdded ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.15)',
              color: isAdded ? 'rgba(255,255,255,0.3)' : '#38bdf8',
            }}
          >
            {isAdded ? '已新增' : adding ? '…' : '新增'}
          </button>
        )}
      </div>

      {/* Expanded children */}
      {expanded && hasChildren && (
        <div style={{ paddingLeft: '16px' }}>
          {children.map(sp => (
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

const formLabelStyle = {
  fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block',
};

const formHintStyle = {
  fontSize: '0.75em', color: 'rgba(255,255,255,0.3)', marginTop: '2px',
};
