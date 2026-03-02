import { useState, useMemo, useEffect } from 'react';
import { api } from '../lib/api';
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
      border: 2px solid #4a90d9;
      border-top-color: transparent;
      border-radius: 50%;
      animation: vtaxonSpin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

const HIGH_RANKS = new Set(['ORDER', 'FAMILY', 'GENUS']);
const BREED_COLOR = '#e67e22';

// Soft colors for family-level grouping left border
const FAMILY_COLORS = [
  '#4a90d9', '#27ae60', '#e67e22', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#2980b9',
  '#8e44ad', '#16a085', '#d35400', '#c0392b',
];

/** Loading skeleton — 3 pulsing grey bars */
function LoadingSkeleton() {
  const barStyle = (width) => ({
    height: '14px',
    width,
    background: '#e0e0e0',
    borderRadius: '4px',
    animation: 'vtaxonPulse 1.5s ease-in-out infinite',
  });

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: '12px 14px', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
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


/** Breed result row — shows breed name + parent species info */
function BreedRow({ sp, onSelect }) {
  const breed = sp.breed || {};
  const breedZh = breed.name_zh;
  const breedEn = breed.name_en;
  const parentZh = sp.common_name_zh;
  const parentScientific = sp.scientific_name;

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid #f0f0f0',
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
              <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#222' }}>{breedZh}</span>
              <span style={{ color: '#888', fontSize: '0.9em' }}>{breedEn}</span>
            </>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#333' }}>{breedEn}</span>
          )}
        </div>
        <div style={{ fontSize: '0.85em', color: '#999', marginTop: '2px' }}>
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
          padding: '4px 12px', background: '#27ae60', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          marginLeft: '8px', flexShrink: 0, marginTop: '2px',
        }}>
          新增
        </button>
      )}
    </div>
  );
}

/**
 * Group search results by species_key for subspecies collapsing.
 * High-rank results (ORDER/FAMILY/GENUS) are kept as standalone entries.
 * Returns: [{ speciesKey, species: mainResult|null, subspecies: [...] }, ...]
 */
function groupBySpecies(results) {
  const breeds = [];
  const groups = new Map();

  for (const sp of results) {
    // Breed results are collected separately
    if (sp.result_type === 'breed') {
      breeds.push(sp);
      continue;
    }

    const rank = (sp.taxon_rank || '').toUpperCase();

    // High-rank items are standalone — use their own taxon_id as key
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

/** Build breadcrumb: 中文(Latin) > ... up to genus level */
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
    <div style={{ fontSize: '0.8em', color: '#888', marginTop: '2px', lineHeight: 1.4 }}>
      {ranks.map((r, i) => (
        <span key={r.key}>
          {i > 0 && <span style={{ margin: '0 3px' }}>&gt;</span>}
          {r.zh ? (
            <span>{r.zh}<span style={{ color: '#aaa' }}>({r.label})</span></span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>{r.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Single species/subspecies result row.
 */
function SpeciesRow({ sp, onSelect, indent, connector, familyColor }) {
  const zhName = sp.common_name_zh;
  const binomial = sp.canonical_name || sp.scientific_name;
  const enName = sp.common_name_en;
  const hasChinese = !!zhName;
  const rank = (sp.taxon_rank || '').toUpperCase();

  return (
    <div style={{
      padding: indent ? '6px 14px 6px 32px' : '10px 14px',
      borderBottom: '1px solid #f0f0f0',
      borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      background: indent ? '#fafafa' : 'transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
          {connector && (
            <span style={{ color: '#ccc', fontFamily: 'monospace', fontSize: '0.9em', marginRight: '2px' }}>
              {connector}
            </span>
          )}
          <RankBadge rank={rank} />
          {hasChinese ? (
            <>
              <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#222' }}>{zhName}</span>
              <span style={{ fontStyle: 'italic', color: '#555' }}>{binomial}</span>
            </>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '1.05em', fontStyle: 'italic', color: '#333' }}>
              {binomial}
            </span>
          )}
          {enName && (
            <span style={{ color: '#999', fontSize: '0.9em' }}>({enName})</span>
          )}
        </div>
        {!indent && <Breadcrumb sp={sp} />}
      </div>
      {onSelect && (
        <button onClick={() => onSelect(sp)} style={{
          padding: '4px 12px', background: '#27ae60', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          marginLeft: '8px', flexShrink: 0, marginTop: '2px',
        }}>
          新增
        </button>
      )}
    </div>
  );
}

/** A species group: main species row + collapsible subspecies (lazy-loaded via children API) */
function SpeciesGroup({ group, onSelect, familyColor }) {
  const [expanded, setExpanded] = useState(false);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [allSubspecies, setAllSubspecies] = useState(group.subspecies);

  // Use the species-level result or the first subspecies as the header
  const mainResult = group.species || group.subspecies[0];
  const isSpeciesRank = (mainResult?.taxon_rank || '').toUpperCase() === 'SPECIES';
  const isHighRank = group.highRank;

  // Subspecies to display (exclude main if it was promoted from subspecies list)
  // Sort: Chinese-named entries first
  const sortedSubspecies = [...(group.species ? allSubspecies : allSubspecies.slice(1))]
    .sort((a, b) => (a.common_name_zh ? 0 : 1) - (b.common_name_zh ? 0 : 1));
  const displaySubspecies = sortedSubspecies;

  // Show expander only for SPECIES-rank results (not high ranks)
  const showExpander = isSpeciesRank && !isHighRank;

  // Count label
  const countLabel = displaySubspecies.length > 0
    ? `${displaySubspecies.length} 亞種`
    : '亞種';

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    // Lazy-load children on first expand (streaming)
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
      {/* Main species row */}
      <div style={{ position: 'relative' }}>
        <SpeciesRow sp={mainResult} onSelect={onSelect} familyColor={familyColor} />
        {showExpander && (
          <button
            onClick={handleExpand}
            style={{
              position: 'absolute', top: '10px', right: onSelect ? '80px' : '14px',
              background: 'none', border: '1px solid #ddd', borderRadius: '3px',
              cursor: 'pointer', padding: '1px 6px', fontSize: '0.8em', color: '#666',
            }}
            title={expanded ? '收合亞種' : '展開亞種'}
          >
            {expanded ? '▲' : '▼'} {countLabel}
          </button>
        )}
      </div>

      {/* Loading indicator for children streaming — top of subspecies list */}
      {expanded && loadingChildren && (
        <div style={{
          padding: '6px 14px 6px 32px', background: '#f0f7ff', borderBottom: '1px solid #e0e0e0',
          borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div className="vtaxon-spinner" style={{ width: '12px', height: '12px' }} />
          <span style={{ fontSize: '0.8em', color: '#4a90d9' }}>載入亞種中…</span>
        </div>
      )}

      {/* Expanded subspecies */}
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

      {/* No subspecies found message */}
      {expanded && !loadingChildren && childrenLoaded && displaySubspecies.length === 0 && (
        <div style={{
          padding: '8px 14px 8px 32px', color: '#bbb', fontSize: '0.85em',
          background: '#fafafa', borderBottom: '1px solid #f0f0f0',
          borderLeft: familyColor ? `3px solid ${familyColor}` : 'none',
        }}>
          無已知亞種
        </div>
      )}
    </div>
  );
}

export default function SpeciesSearch({ onSelect, onCancel }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(false);

  const { breedResults, groups, familyColorMap } = useMemo(() => {
    const { breeds, speciesGroups } = groupBySpecies(results);
    speciesGroups.sort((a, b) => {
      const mainA = a.species || a.subspecies[0];
      const mainB = b.species || b.subspecies[0];
      const pathA = mainA?.taxon_path || '';
      const pathB = mainB?.taxon_path || '';
      return pathA.localeCompare(pathB);
    });

    // Assign colors by family
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

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋物種或品種（例如：柴犬、布偶貓、貓、狼）"
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" disabled={searching} style={{
          padding: '8px 16px', background: '#4a90d9', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
        }}>
          {searching ? '搜尋中…' : '搜尋'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{
            padding: '8px 16px', background: '#fff', color: '#666',
            border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer',
          }}>
            取消
          </button>
        )}
      </form>

      <div style={{ fontSize: '0.8em', color: '#999', marginBottom: '16px', lineHeight: 1.7 }}>
        可直接搜尋品種名（如柴犬、布偶貓），系統會自動對應到正確物種。
        也可搜尋科、屬、種等分類層級，或直接輸入學名。
        <div style={{ marginTop: '6px' }}>
          <span
            onClick={() => setShowSourceInfo(!showSourceInfo)}
            style={{ cursor: 'pointer', color: '#4a90d9', userSelect: 'none' }}
          >
            {showSourceInfo ? '▾' : '▸'} 關於中文名稱與資料來源
          </span>
          {showSourceInfo && (
            <div style={{
              marginTop: '4px', padding: '8px 12px',
              background: '#f8f8f8', borderRadius: '4px',
              border: '1px solid #eee', color: '#777',
            }}>
              物種與品種資料來自 <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90d9' }}>GBIF</a>、
              <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90d9' }}>Wikidata</a> 及
              <a href="https://zh.wikipedia.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90d9' }}>維基百科</a>，
              數量龐大，中文名稱由程式自動處理。
              系統以台灣慣用名稱為優先，若無對應則使用其他中文來源，剩餘則顯示原文。
              <br />
              如發現名稱有誤或有更合適的台灣用語，歡迎聯繫我們修正。
            </div>
          )}
        </div>
      </div>

      {searching && results.length === 0 && <LoadingSkeleton />}

      {(breedResults.length > 0 || groups.length > 0) && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', maxHeight: '500px', overflow: 'auto' }}>
          {searching && (
            <div style={{
              padding: '8px 14px', background: '#f0f7ff', borderBottom: '1px solid #e0e0e0',
              display: 'flex', alignItems: 'center', gap: '8px',
              position: 'sticky', top: 0, zIndex: 1,
            }}>
              <div className="vtaxon-spinner" />
              <span style={{ fontSize: '0.85em', color: '#4a90d9' }}>搜尋中…</span>
            </div>
          )}
          {/* Breed results first */}
          {breedResults.map((sp) => (
            <BreedRow key={`breed-${sp.breed?.id}`} sp={sp} onSelect={onSelect} />
          ))}
          {/* Species results */}
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
        <p style={{ color: '#999', textAlign: 'center' }}>
          找不到具體物種？請嘗試輸入學名搜尋
        </p>
      )}
    </div>
  );
}
