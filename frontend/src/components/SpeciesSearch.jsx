import { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { breedEmoji } from '../lib/breedUtils';
import { formatAltNamesFull, altNamesTooltip } from '../lib/altNames';
import RankBadge from './RankBadge';

// Inject pulse animation keyframes once
if (typeof document !== 'undefined' && !document.getElementById('vtaxon-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'vtaxon-pulse-style';
  style.textContent = `
    @keyframes vtaxonPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes vtaxonSpin {
      to { transform: rotate(360deg); }
    }
    .vtaxon-spinner {
      width: 14px; height: 14px;
      border: 2px solid #38bdf8;
      border-top-color: transparent;
      border-radius: 50%;
      animation: vtaxonSpin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

const HIGH_RANKS = new Set(['KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS']);
const BREED_COLOR = '#fb923c';

const FAMILY_COLORS = [
  '#38bdf8', '#34d399', '#fb923c', '#a78bfa',
  '#f87171', '#22d3ee', '#fbbf24', '#60a5fa',
  '#c084fc', '#2dd4bf', '#f97316', '#ef4444',
];


/** Loading skeleton — dark pulsing bars */
function LoadingSkeleton() {
  const barStyle = (width) => ({
    height: '14px',
    width,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '4px',
    animation: 'vtaxonPulse 1.5s ease-in-out infinite',
  });

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '16px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: '12px 14px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ ...barStyle('80px'), animationDelay: `${i * 0.2}s` }} />
            <div style={{ ...barStyle('160px'), animationDelay: `${i * 0.2 + 0.1}s` }} />
          </div>
          <div style={{ ...barStyle('240px'), height: '10px', animationDelay: `${i * 0.2 + 0.15}s` }} />
        </div>
      ))}
    </div>
  );
}


/** Breed result row */
function BreedRow({ sp, onSelect }) {
  const breed = sp.breed || {};
  const breedZh = breed.name_zh;
  const breedEn = breed.name_en;
  const parentZh = sp.common_name_zh;
  const parentScientific = sp.scientific_name;

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `3px solid ${BREED_COLOR}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
          <RankBadge rank="BREED" />
          {breedZh ? (
            <>
              <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>{breedZh}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em' }}>{breedEn}</span>
            </>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>{breedEn}</span>
          )}
        </div>
        <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
          {parentZh ? (
            <span>{parentZh} <i>{parentScientific}</i></span>
          ) : (
            <i>{parentScientific}</i>
          )}
        </div>
        <Breadcrumb sp={sp} />
      </div>
      {onSelect && (
        <button onClick={() => onSelect(sp)} style={{
          padding: '4px 12px', background: '#34d399', color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          marginLeft: '8px', flexShrink: 0, marginTop: '2px', fontWeight: 600,
        }}>
          新增
        </button>
      )}
    </div>
  );
}

function groupBySpecies(results) {
  const breeds = [];
  const groups = new Map();

  for (const sp of results) {
    if (sp.result_type === 'breed') {
      breeds.push(sp);
      continue;
    }

    const rank = (sp.taxon_rank || '').toUpperCase();

    if (HIGH_RANKS.has(rank)) {
      groups.set(sp.taxon_id, { speciesKey: sp.taxon_id, species: sp, subspecies: [], highRank: true });
      continue;
    }

    const key = sp.species_key || sp.taxon_id;
    if (!groups.has(key)) {
      groups.set(key, { speciesKey: key, species: null, subspecies: [] });
    }
    const g = groups.get(key);
    if (rank === 'SPECIES') {
      g.species = sp;
    } else {
      g.subspecies.push(sp);
    }
  }

  return { breeds, speciesGroups: Array.from(groups.values()) };
}

/** Build breadcrumb */
function Breadcrumb({ sp }) {
  const ranks = [
    { key: 'kingdom', label: sp.kingdom, zh: sp.kingdom_zh },
    { key: 'phylum', label: sp.phylum, zh: sp.phylum_zh },
    { key: 'class', label: sp.class, zh: sp.class_zh },
    { key: 'order', label: sp.order, zh: sp.order_zh },
    { key: 'family', label: sp.family, zh: sp.family_zh },
    { key: 'genus', label: sp.genus, zh: sp.genus_zh },
  ].filter(r => r.label);

  return (
    <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', lineHeight: 1.4 }}>
      {ranks.map((r, i) => (
        <span key={r.key}>
          {i > 0 && <span style={{ margin: '0 3px' }}>&gt;</span>}
          {r.zh ? (
            <span>{r.zh}<span style={{ color: 'rgba(255,255,255,0.25)' }}>({r.label})</span></span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>{r.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function SpeciesRow({ sp, onSelect, indent, connector, familyColor }) {
  const zhName = sp.common_name_zh;
  const binomial = sp.canonical_name || sp.scientific_name;
  const enName = sp.common_name_en;
  const hasChinese = !!zhName;
  const rank = (sp.taxon_rank || '').toUpperCase();
  const altFull = formatAltNamesFull(sp.alternative_names_zh);
  const altTitle = altNamesTooltip(sp.alternative_names_zh);

  return (
    <div style={{
      padding: indent ? '6px 14px 6px 32px' : '10px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      background: indent ? 'rgba(255,255,255,0.02)' : 'transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline' }}>
          {connector && (
            <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '0.9em', marginRight: '2px' }}>
              {connector}
            </span>
          )}
          <RankBadge rank={rank} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
            {hasChinese ? (
              <>
                <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>
                  {zhName}
                </span>
                <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>{binomial}</span>
              </>
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1.05em', fontStyle: 'italic', color: '#cbd5e1' }}>
                {binomial}
              </span>
            )}
            {enName && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>({enName})</span>
            )}
          </div>
          {sp.synonym_name && (
            <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', fontStyle: 'italic' }}>
              = {sp.synonym_name}
            </div>
          )}
          {altFull && (
            <div title={altTitle} style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', lineHeight: 1.4 }}>
              {altFull}
            </div>
          )}
          {!indent && <Breadcrumb sp={sp} />}
        </div>
      </div>
      {onSelect && (
        <button onClick={() => onSelect(sp)} style={{
          padding: '4px 12px', background: '#34d399', color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          marginLeft: '8px', flexShrink: 0, marginTop: '2px', fontWeight: 600,
        }}>
          新增
        </button>
      )}
    </div>
  );
}

function SpeciesGroup({ group, onSelect, familyColor }) {
  const [expanded, setExpanded] = useState(false);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [allSubspecies, setAllSubspecies] = useState(group.subspecies);

  const mainResult = group.species || group.subspecies[0];
  const isSpeciesRank = (mainResult?.taxon_rank || '').toUpperCase() === 'SPECIES';
  const isHighRank = group.highRank;

  const sortedSubspecies = [...(group.species ? allSubspecies : allSubspecies.slice(1))]
    .sort((a, b) => (a.common_name_zh ? 0 : 1) - (b.common_name_zh ? 0 : 1));
  const displaySubspecies = sortedSubspecies;

  const showExpander = isSpeciesRank && !isHighRank;

  const countLabel = displaySubspecies.length > 0
    ? `${displaySubspecies.length} 亞種`
    : '亞種';

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    if (next && !childrenLoaded && isSpeciesRank) {
      setLoadingChildren(true);
      try {
        const speciesKey = group.species?.taxon_id || group.speciesKey;
        const existing = new Map(group.subspecies.map(s => [s.taxon_id, s]));
        await api.getSubspeciesStream(speciesKey, (sub) => {
          if (!existing.has(sub.taxon_id)) {
            existing.set(sub.taxon_id, sub);
            setAllSubspecies(Array.from(existing.values()));
          }
        });
      } catch (err) {
        console.error('Failed to load subspecies:', err);
      } finally {
        setLoadingChildren(false);
        setChildrenLoaded(true);
      }
    }
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <SpeciesRow sp={mainResult} onSelect={onSelect} familyColor={familyColor} />
        {showExpander && (
          <button
            onClick={handleExpand}
            style={{
              position: 'absolute', top: '10px', right: onSelect ? '80px' : '14px',
              background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px',
              cursor: 'pointer', padding: '1px 6px', fontSize: '0.8em', color: 'rgba(255,255,255,0.5)',
            }}
            title={expanded ? '收合亞種' : '展開亞種'}
          >
            {expanded ? '▲' : '▼'} {countLabel}
          </button>
        )}
      </div>

      {expanded && loadingChildren && (
        <div style={{
          padding: '6px 14px 6px 32px', background: 'rgba(56,189,248,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div className="vtaxon-spinner" style={{ width: '12px', height: '12px' }} />
          <span style={{ fontSize: '0.8em', color: '#38bdf8' }}>載入亞種中…</span>
        </div>
      )}

      {expanded && displaySubspecies.map((sub, i) => (
        <SpeciesRow
          key={sub.taxon_id}
          sp={sub}
          onSelect={onSelect}
          indent
          connector={i === displaySubspecies.length - 1 && !loadingChildren ? '└' : '├'}
          familyColor={familyColor}
        />
      ))}

      {expanded && !loadingChildren && childrenLoaded && displaySubspecies.length === 0 && (
        <div style={{
          padding: '8px 14px 8px 32px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85em',
          background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
        }}>
          無已知亞種
        </div>
      )}
    </div>
  );
}

/** Quick breed entry buttons — fully dynamic from /breeds/categories API */
function BreedQuickButtons({ onPickCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getBreedCategories().then(data => {
      const all = data.categories || [];
      setCategories(all.filter(c => c.breed_count >= 10));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
      {categories.map(cat => (
        <button
          key={cat.taxon_id}
          onClick={() => onPickCategory({
            taxon_id: cat.taxon_id,
            label: `${cat.common_name_zh || cat.scientific_name}品種`,
            emoji: breedEmoji(cat),
          })}
          style={{
            padding: '5px 10px',
            background: 'rgba(251,146,60,0.1)',
            color: BREED_COLOR,
            border: `1px solid rgba(251,146,60,0.25)`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85em',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {breedEmoji(cat)} {cat.common_name_zh || cat.scientific_name} ({cat.breed_count})
        </button>
      ))}
    </div>
  );
}

/** Breed category list view — shows all breeds for a species */
function BreedCategoryList({ category, onSelect, onBack }) {
  const [breeds, setBreeds] = useState([]);
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getBreeds(category.taxon_id).then(data => {
      setBreeds(data.breeds || []);
      setSpecies(data.species || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [category.taxon_id]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return breeds;
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(q);
    return breeds.filter(b => {
      if (isCJK) return b.name_zh && b.name_zh.includes(q);
      return b.name_en && b.name_en.toLowerCase().includes(q.toLowerCase());
    });
  }, [breeds, filter]);

  function handleSelectBreed(breed) {
    if (!species || !onSelect) return;
    // Construct payload matching existing breed search result format
    const payload = {
      result_type: 'breed',
      taxon_id: species.taxon_id,
      scientific_name: species.scientific_name,
      common_name_zh: species.common_name_zh,
      common_name_en: species.common_name_en,
      taxon_rank: species.taxon_rank,
      taxon_path: species.taxon_path,
      kingdom: species.kingdom,
      phylum: species.phylum,
      class: species.class,
      order: species.order,
      family: species.family,
      genus: species.genus,
      kingdom_zh: species.kingdom_zh,
      phylum_zh: species.phylum_zh,
      class_zh: species.class_zh,
      order_zh: species.order_zh,
      family_zh: species.family_zh,
      genus_zh: species.genus_zh,
      breed: breed,
    };
    onSelect(payload);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#38bdf8',
          cursor: 'pointer', fontSize: '0.95em', padding: '4px 0',
        }}>
          &larr; 返回
        </button>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1em' }}>
          {category.emoji} {category.label}
        </span>
        {breeds.length > 0 && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em' }}>
            ({breeds.length})
          </span>
        )}
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="過濾品種名稱…"
        autoFocus
        style={{
          width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
          background: '#1a2433', color: '#e2e8f0',
        }}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9em' }}>
          {filter ? '無匹配品種' : '此物種尚無品種資料'}
        </p>
      ) : (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', maxHeight: '420px', overflow: 'auto' }}>
          {filtered.map(breed => (
              <div
                key={breed.id}
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${BREED_COLOR}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <RankBadge rank="BREED" />
                    {breed.name_zh ? (
                      <>
                        <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{breed.name_zh}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em' }}>{breed.name_en}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{breed.name_en}</span>
                    )}
                  </div>
                  {breed.breed_group && (
                    <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                      {breed.breed_group}
                    </div>
                  )}
                </div>
                {onSelect && (
                  <button onClick={() => handleSelectBreed(breed)} style={{
                    padding: '4px 12px', background: '#34d399', color: '#0d1526',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    marginLeft: '8px', flexShrink: 0, fontWeight: 600,
                  }}>
                    新增
                  </button>
                )}
              </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default function SpeciesSearch({ onSelect, onCancel, autoFocus }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(false);
  const [view, setView] = useState('default'); // 'default' | 'breedList'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { breedResults, groups, familyColorMap } = useMemo(() => {
    const { breeds, speciesGroups } = groupBySpecies(results);
    speciesGroups.sort((a, b) => {
      const mainA = a.species || a.subspecies[0];
      const mainB = b.species || b.subspecies[0];
      const pathA = mainA?.taxon_path || '';
      const pathB = mainB?.taxon_path || '';
      return pathA.localeCompare(pathB);
    });

    const colorMap = new Map();
    let colorIdx = 0;
    for (const group of speciesGroups) {
      const main = group.species || group.subspecies[0];
      const family = main?.family || '';
      if (family && !colorMap.has(family)) {
        colorMap.set(family, FAMILY_COLORS[colorIdx % FAMILY_COLORS.length]);
        colorIdx++;
      }
    }

    return { breedResults: breeds, groups: speciesGroups, familyColorMap: colorMap };
  }, [results]);

  function handlePickCategory(entry) {
    setSelectedCategory(entry);
    setView('breedList');
  }

  function handleBackFromBreedList() {
    setView('default');
    setSelectedCategory(null);
  }

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    // Typing in search box while in breedList → switch back to default
    if (view === 'breedList' && val.trim()) {
      setView('default');
      setSelectedCategory(null);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    setResults([]);
    try {
      await api.searchSpeciesStream(query, (sp) => {
        setResults(prev => [...prev, sp]);
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  // Show breed list view
  if (view === 'breedList' && selectedCategory) {
    return (
      <div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="搜尋物種或品種（例如：柴犬、布偶貓、貓、狼）"
            style={{
              flex: 1, padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px', background: '#1a2433', color: '#e2e8f0',
            }}
          />
          <button type="submit" disabled={searching} style={{
            padding: '8px 16px', background: '#38bdf8', color: '#0d1526',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
          }}>
            搜尋
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} style={{
              padding: '8px 16px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', cursor: 'pointer',
            }}>
              取消
            </button>
          )}
        </form>
        <BreedCategoryList
          category={selectedCategory}
          onSelect={onSelect}
          onBack={handleBackFromBreedList}
        />
      </div>
    );
  }

  // Default search view
  const showQuickButtons = !query.trim() && !searched && results.length === 0 && !searching;

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="搜尋物種或品種（例如：柴犬、布偶貓、貓、狼）"
          autoFocus={autoFocus}
          style={{
            flex: 1, padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px', background: '#1a2433', color: '#e2e8f0',
          }}
        />
        <button type="submit" disabled={searching} style={{
          padding: '8px 16px', background: '#38bdf8', color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
        }}>
          {searching ? '搜尋中…' : '搜尋'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', cursor: 'pointer',
          }}>
            取消
          </button>
        )}
      </form>

      {showQuickButtons && (
        <BreedQuickButtons onPickCategory={handlePickCategory} />
      )}

      <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: 1.7 }}>
        上方按鈕為已收錄的品種（如柴犬、布偶貓），若沒有列出你要的品種，代表系統尚未收錄，建議先選好物種後再回報想要的品種。
        <br />
        搜尋框可輸入中文名、英文俗名或學名。<strong style={{ color: 'rgba(255,255,255,0.55)' }}>學名的搜尋結果最精確</strong>，中文名有時會找不到或不完整。
        <div style={{ marginTop: '6px' }}>
          <span
            onClick={() => setShowSourceInfo(!showSourceInfo)}
            style={{ cursor: 'pointer', color: '#38bdf8', userSelect: 'none' }}
          >
            {showSourceInfo ? '▾' : '▸'} 關於中文名稱與資料來源
          </span>
          {showSourceInfo && (
            <div style={{
              marginTop: '4px', padding: '8px 12px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
            }}>
              物種資料來自 <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>GBIF</a> 全球資料庫，涵蓋所有已知物種。
              中文名稱取自 <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Wikidata</a>、
              <a href="https://taicol.tw" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>TaiCOL 臺灣物種名錄</a>及靜態對照表，
              以台灣慣用名稱為優先，若無對應則顯示原文。
              <br />
              如發現名稱有誤或有更合適的台灣用語，歡迎聯繫我們修正。
            </div>
          )}
        </div>
      </div>

      {searching && results.length === 0 && <LoadingSkeleton />}

      {(breedResults.length > 0 || groups.length > 0) && (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', maxHeight: '500px', overflow: 'auto' }}>
          {searching && (
            <div style={{
              padding: '8px 14px', background: 'rgba(56,189,248,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: '8px',
              position: 'sticky', top: 0, zIndex: 1,
            }}>
              <div className="vtaxon-spinner" />
              <span style={{ fontSize: '0.85em', color: '#38bdf8' }}>搜尋中…</span>
            </div>
          )}
          {breedResults.map((sp) => (
            <BreedRow key={`breed-${sp.breed?.id}`} sp={sp} onSelect={onSelect} />
          ))}
          {groups.map((g) => {
            const main = g.species || g.subspecies[0];
            const family = main?.family || '';
            return (
              <SpeciesGroup
                key={g.speciesKey}
                group={g}
                onSelect={onSelect}
                familyColor={familyColorMap.get(family)}
              />
            );
          })}
        </div>
      )}

      {!searching && searched && results.length === 0 && query.trim() && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          找不到結果？試試輸入學名（如 <i>Canis lupus</i>），學名搜尋最精確
        </p>
      )}
    </div>
  );
}
