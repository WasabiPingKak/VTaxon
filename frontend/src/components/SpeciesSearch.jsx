import { useState, useMemo, useEffect } from 'react';
import { api } from '../lib/api';

// Inject pulse animation keyframes once
if (typeof document !== 'undefined' && !document.getElementById('vtaxon-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'vtaxon-pulse-style';
  style.textContent = `
    @keyframes vtaxonPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

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

/**
 * Group search results by species_key for subspecies collapsing.
 * Returns: [{ speciesKey, species: mainResult|null, subspecies: [...] }, ...]
 */
function groupBySpecies(results) {
  const groups = new Map();

  for (const sp of results) {
    const key = sp.species_key || sp.taxon_id;
    if (!groups.has(key)) {
      groups.set(key, { speciesKey: key, species: null, subspecies: [] });
    }
    const g = groups.get(key);
    const rank = (sp.taxon_rank || '').toUpperCase();
    if (rank === 'SPECIES') {
      g.species = sp;
    } else {
      g.subspecies.push(sp);
    }
  }

  return Array.from(groups.values());
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
function SpeciesRow({ sp, onSelect, indent, connector }) {
  const zhName = sp.common_name_zh;
  const binomial = sp.canonical_name || sp.scientific_name;
  const enName = sp.common_name_en;
  const hasChinese = !!zhName;

  return (
    <div style={{
      padding: indent ? '6px 14px 6px 32px' : '10px 14px',
      borderBottom: '1px solid #f0f0f0',
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
function SpeciesGroup({ group, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [allSubspecies, setAllSubspecies] = useState(group.subspecies);

  // Use the species-level result or the first subspecies as the header
  const mainResult = group.species || group.subspecies[0];
  const isSpeciesRank = (mainResult?.taxon_rank || '').toUpperCase() === 'SPECIES';

  // Subspecies to display (exclude main if it was promoted from subspecies list)
  // Sort: Chinese-named entries first
  const sortedSubspecies = [...(group.species ? allSubspecies : allSubspecies.slice(1))]
    .sort((a, b) => (a.common_name_zh ? 0 : 1) - (b.common_name_zh ? 0 : 1));
  const displaySubspecies = sortedSubspecies;

  // Show expander for all SPECIES-rank results (children API may have more)
  const showExpander = isSpeciesRank;

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
        <SpeciesRow sp={mainResult} onSelect={onSelect} />
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

      {/* Expanded subspecies (shown during and after loading) */}
      {expanded && displaySubspecies.map((sub, i) => (
        <SpeciesRow
          key={sub.taxon_id}
          sp={sub}
          onSelect={onSelect}
          indent
          connector={i === displaySubspecies.length - 1 ? '└' : '├'}
        />
      ))}

      {/* Loading skeleton for children streaming */}
      {expanded && loadingChildren && (
        <div style={{ padding: '8px 14px 8px 32px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <div style={{ height: '12px', width: '60px', background: '#e0e0e0', borderRadius: '4px', animation: 'vtaxonPulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '12px', width: '120px', background: '#e0e0e0', borderRadius: '4px', animation: 'vtaxonPulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
          </div>
        </div>
      )}

      {/* No subspecies found message */}
      {expanded && !loadingChildren && childrenLoaded && displaySubspecies.length === 0 && (
        <div style={{
          padding: '8px 14px 8px 32px', color: '#bbb', fontSize: '0.85em',
          background: '#fafafa', borderBottom: '1px solid #f0f0f0',
        }}>
          無已知亞種
        </div>
      )}
    </div>
  );
}

export default function SpeciesSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const groups = useMemo(() => {
    const g = groupBySpecies(results);
    g.sort((a, b) => {
      const mainA = a.species || a.subspecies[0];
      const mainB = b.species || b.subspecies[0];
      const aHasZh = mainA?.common_name_zh ? 0 : 1;
      const bHasZh = mainB?.common_name_zh ? 0 : 1;
      if (aHasZh !== bHasZh) return aHasZh - bHasZh;
      return (mainA?.scientific_name || '').localeCompare(mainB?.scientific_name || '');
    });
    return g;
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
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋物種（例如：貓、狼、鷹，或輸入學名）"
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" disabled={searching} style={{
          padding: '8px 16px', background: '#4a90d9', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
        }}>
          {searching ? '搜尋中…' : '搜尋'}
        </button>
      </form>

      {searching && results.length === 0 && <LoadingSkeleton />}

      {groups.length > 0 && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', maxHeight: '500px', overflow: 'auto' }}>
          {groups.map((g) => (
            <SpeciesGroup key={g.speciesKey} group={g} onSelect={onSelect} />
          ))}
          {searching && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <div style={{ height: '14px', width: '80px', background: '#e0e0e0', borderRadius: '4px', animation: 'vtaxonPulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '14px', width: '160px', background: '#e0e0e0', borderRadius: '4px', animation: 'vtaxonPulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
              </div>
              <div style={{ height: '10px', width: '240px', background: '#e0e0e0', borderRadius: '4px', animation: 'vtaxonPulse 1.5s ease-in-out infinite', animationDelay: '0.15s' }} />
            </div>
          )}
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
