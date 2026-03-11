import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { formatAltNamesFull, altNamesTooltip } from '../lib/altNames';
import { displayScientificName } from '../lib/speciesName';
import RankBadge from './RankBadge';
import BreedInterceptPanel from './BreedInterceptPanel';
import NameReportForm from './NameReportForm';

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

const HIGH_RANKS = new Set(['KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'SUBCLASS', 'INFRACLASS', 'ORDER', 'FAMILY', 'GENUS']);
const BLOCKED_RANKS = new Set(['KINGDOM', 'PHYLUM', 'SUPERCLASS']);
const BREED_COLOR = '#fb923c';

const FAMILY_COLORS = [
  '#38bdf8', '#34d399', '#fb923c', '#a78bfa',
  '#f87171', '#22d3ee', '#fbbf24', '#60a5fa',
  '#c084fc', '#2dd4bf', '#f97316', '#ef4444',
];

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;


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
  const binomial = displayScientificName(sp);
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
          {(sp.display_name_override
            ? <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', fontStyle: 'italic' }}>
                = {sp.canonical_name || sp.scientific_name} [GBIF]
              </div>
            : sp.synonym_name
              ? <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', fontStyle: 'italic' }}>
                  = {sp.synonym_name}
                </div>
              : null
          )}
          {altFull && (
            <div title={altTitle} style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '2px', lineHeight: 1.4 }}>
              {altFull}
            </div>
          )}
          {!indent && <Breadcrumb sp={sp} />}
        </div>
      </div>
      {onSelect && !BLOCKED_RANKS.has(rank) && (
        <button onClick={() => onSelect(sp)} style={{
          padding: '4px 12px', background: '#34d399', color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          marginLeft: '8px', flexShrink: 0, marginTop: '2px', fontWeight: 600,
        }}>
          新增
        </button>
      )}
      {onSelect && BLOCKED_RANKS.has(rank) && (
        <span style={{
          padding: '4px 8px', color: 'rgba(255,255,255,0.3)',
          fontSize: '0.8em', marginLeft: '8px', flexShrink: 0, marginTop: '2px',
        }}>
          階層過高
        </span>
      )}
    </div>
  );
}

function SpeciesGroup({ group, onSelect, familyColor }) {
  const [expanded, setExpanded] = useState(false);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [allSubspecies, setAllSubspecies] = useState(group.subspecies);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

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
          if (!mountedRef.current) return;
          if (!existing.has(sub.taxon_id)) {
            existing.set(sub.taxon_id, sub);
            setAllSubspecies(Array.from(existing.values()));
          }
        });
      } catch (err) {
        console.error('Failed to load subspecies:', err);
      } finally {
        if (!mountedRef.current) return;
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

export default function SpeciesSearch({ onSelect, onCancel, autoFocus, onSearchPerformed }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(false);
  const [latinRetry, setLatinRetry] = useState('');
  const [hasSearchedLatin, setHasSearchedLatin] = useState(false);
  const [interceptSpecies, setInterceptSpecies] = useState(null);
  const [showNameReport, setShowNameReport] = useState(false);
  const [showNotFoundReport, setShowNotFoundReport] = useState(false);
  const [notFoundForm, setNotFoundForm] = useState({ searched: '', expected: '', description: '' });
  const [notFoundSubmitting, setNotFoundSubmitting] = useState(false);
  const [notFoundSubmitted, setNotFoundSubmitted] = useState(false);

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

  function markLatinIfApplicable(q) {
    if (!CJK_RE.test(q)) {
      setHasSearchedLatin(true);
    }
  }

  async function handleSpeciesSelect(species) {
    // Breed results: pass through directly, no intercept
    if (species.result_type === 'breed') {
      onSelect(species);
      return;
    }
    // Only intercept SPECIES/SUBSPECIES rank
    const rank = (species.taxon_rank || '').toUpperCase();
    if (rank !== 'SPECIES' && rank !== 'SUBSPECIES') {
      onSelect(species);
      return;
    }
    // Check if this species has breeds
    try {
      const data = await api.getBreeds(species.taxon_id);
      if (data.breeds?.length > 0) {
        setInterceptSpecies({ ...species, _breeds: data.breeds, _speciesInfo: data.species || species });
        return;
      }
    } catch {}
    onSelect(species);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    setResults([]);
    setInterceptSpecies(null);
    markLatinIfApplicable(query.trim());
    let count = 0;
    try {
      await api.searchSpeciesStream(query, (sp) => {
        count++;
        setResults(prev => [...prev, sp]);
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSearching(false);
      setSearched(true);
      onSearchPerformed?.({ query: query.trim(), resultCount: count });
    }
  }

  // Show breed intercept panel
  if (interceptSpecies) {
    return (
      <div>
        <BreedInterceptPanel
          species={interceptSpecies}
          onSelectBreed={(payload) => {
            setInterceptSpecies(null);
            onSelect(payload);
          }}
          onSkip={() => {
            const sp = interceptSpecies;
            setInterceptSpecies(null);
            // Pass original species without breed
            const { _breeds, _speciesInfo, ...clean } = sp;
            onSelect(clean);
          }}
          onCancel={() => setInterceptSpecies(null)}
          hasSearchedLatin={hasSearchedLatin}
        />
      </div>
    );
  }

  // Default search view
  return (
    <div>
      <form onSubmit={handleSearch} autoComplete="off" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input type="text" name="prevent_autofill" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="輸入學名最精確（如 Canis lupus）也可搜中文"
          autoFocus={autoFocus}
          autoComplete="new-password"
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

      <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: 1.7 }}>
        搜尋框<strong style={{ color: 'rgba(255,255,255,0.55)' }}>建議直接輸入學名（如 Canis lupus familiaris）</strong>，結果最精確。中文名因 GBIF 及 Wikidata 資料涵蓋有限，經常搜不到或不完整，英文俗名亦僅供參考。
        <br />
        若該物種有已收錄的品種（如柴犬、布偶貓），選擇物種後會自動出現品種選擇。
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
            <BreedRow key={`breed-${sp.breed?.id}`} sp={sp} onSelect={handleSpeciesSelect} />
          ))}
          {groups.map((g) => {
            const main = g.species || g.subspecies[0];
            const family = main?.family || '';
            return (
              <SpeciesGroup
                key={g.speciesKey}
                group={g}
                onSelect={handleSpeciesSelect}
                familyColor={familyColorMap.get(family)}
              />
            );
          })}
        </div>
      )}

      {!searching && searched && results.length > 0 && hasSearchedLatin && !showNameReport && (
        <div style={{ textAlign: 'center', fontSize: '0.82em', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
          以上物種的中文名稱有誤？{' '}
          <button
            onClick={() => setShowNameReport(true)}
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '1em' }}
          >
            回報名稱問題
          </button>
        </div>
      )}

      {showNameReport && (
        <NameReportForm results={results} onClose={() => setShowNameReport(false)} />
      )}

      {!searching && searched && results.length > 0 && CJK_RE.test(query) && (
        <div style={{ textAlign: 'center', fontSize: '0.82em', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: 1.6 }}>
          找不到想要的結果？中文搜尋涵蓋有限，試試用拉丁文學名搜尋（Google「{query.trim()} 學名」即可查到）
        </div>
      )}

      {!searching && searched && results.length === 0 && query.trim() && (
        <div style={{
          marginTop: '8px', padding: '14px 16px',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '6px',
          background: 'rgba(56,189,248,0.06)',
        }}>
          <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '8px', fontSize: '0.95em' }}>
            找不到「{query.trim()}」？
          </div>
          <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            中文搜尋覆蓋有限，但<strong style={{ color: '#e2e8f0' }}>用拉丁文學名幾乎一定找得到</strong>。
            <br />
            不知道學名？Google 搜尋「<strong style={{ color: '#e2e8f0' }}>{query.trim()} 學名</strong>」即可。
            <br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              例：搜「雞 學名」→ 得到 <i>Gallus gallus domesticus</i> → 在上方輸入 "Gallus" 就能找到
            </span>
          </div>
          {CJK_RE.test(query) && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56,189,248,0.15)' }}>
              <div style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                查到學名了？直接貼上重新搜尋：
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!latinRetry.trim()) return;
                  const retryQuery = latinRetry.trim();
                  setQuery(retryQuery);
                  setLatinRetry('');
                  markLatinIfApplicable(retryQuery);
                  // trigger search
                  setSearching(true);
                  setSearched(false);
                  setResults([]);
                  let retryCount = 0;
                  api.searchSpeciesStream(retryQuery, (sp) => {
                    retryCount++;
                    setResults(prev => [...prev, sp]);
                  }).catch(() => {}).finally(() => {
                    setSearching(false);
                    setSearched(true);
                    onSearchPerformed?.({ query: retryQuery, resultCount: retryCount });
                  });
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="search"
                  value={latinRetry}
                  onChange={(e) => setLatinRetry(e.target.value)}
                  placeholder="貼上學名（如 Gallus gallus）"
                  autoComplete="new-password"
                  style={{
                    flex: 1, padding: '7px 10px',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: '4px', background: '#1a2433', color: '#e2e8f0',
                    fontSize: '0.9em', fontStyle: 'italic',
                  }}
                />
                <button type="submit" disabled={!latinRetry.trim()} style={{
                  padding: '7px 14px', background: '#38bdf8', color: '#0d1526',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85em',
                  opacity: latinRetry.trim() ? 1 : 0.5,
                }}>
                  搜尋學名
                </button>
              </form>
            </div>
          )}

          {/* Not-found report */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56,189,248,0.15)' }}>
            {notFoundSubmitted ? (
              <div style={{ fontSize: '0.85em', color: '#34d399' }}>
                回報已送出，等待管理員處理！
              </div>
            ) : !showNotFoundReport ? (
              <div style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.4)' }}>
                以上方法都試過了還是找不到？{' '}
                <button
                  onClick={() => {
                    setShowNotFoundReport(true);
                    setNotFoundForm(prev => ({ ...prev, searched: query.trim() }));
                  }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '1em' }}
                >
                  回報問題
                </button>
              </div>
            ) : (
              <form
                autoComplete="off"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const s = notFoundForm.searched.trim();
                  const ex = notFoundForm.expected.trim();
                  const d = notFoundForm.description.trim();
                  if (!s || !ex || !d) return;
                  setNotFoundSubmitting(true);
                  try {
                    await api.createNameReport({
                      report_type: 'not_found',
                      suggested_name_zh: ex,
                      description: `[搜尋內容: ${s}]\n${d}`,
                    });
                    setNotFoundSubmitted(true);
                  } catch (err) {
                    alert(err.message);
                  } finally {
                    setNotFoundSubmitting(false);
                  }
                }}
              >
                <input type="text" name="prevent_autofill" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} />
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9em', marginBottom: '8px' }}>
                  回報搜尋不到的物種
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <label style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                      搜尋了什麼 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text" value={notFoundForm.searched} required
                      onChange={(e) => setNotFoundForm(prev => ({ ...prev, searched: e.target.value }))}
                      placeholder="例：T. prorsus"
                      autoComplete="new-password"
                      style={{
                        width: '100%', padding: '6px 10px', boxSizing: 'border-box',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
                        background: '#1a2433', color: '#e2e8f0', fontSize: '0.85em',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                      期望找到的物種 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text" value={notFoundForm.expected} required
                      onChange={(e) => setNotFoundForm(prev => ({ ...prev, expected: e.target.value }))}
                      placeholder="例：前突三角龍"
                      autoComplete="new-password"
                      style={{
                        width: '100%', padding: '6px 10px', boxSizing: 'border-box',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
                        background: '#1a2433', color: '#e2e8f0', fontSize: '0.85em',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                      補充說明 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <textarea
                      value={notFoundForm.description} required
                      onChange={(e) => setNotFoundForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="請說明你嘗試過哪些搜尋方式"
                      rows={2} autoComplete="new-password"
                      style={{
                        width: '100%', padding: '6px 10px', boxSizing: 'border-box',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
                        background: '#1a2433', color: '#e2e8f0', fontSize: '0.85em',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(() => {
                      const dis = notFoundSubmitting || !notFoundForm.searched.trim() || !notFoundForm.expected.trim() || !notFoundForm.description.trim();
                      return (
                        <button type="submit" disabled={dis} style={{
                          padding: '5px 12px', background: '#38bdf8', color: '#0d1526',
                          border: 'none', borderRadius: '4px',
                          cursor: dis ? 'not-allowed' : 'pointer',
                          fontSize: '0.82em', fontWeight: 600, opacity: dis ? 0.4 : 1,
                        }}>
                          {notFoundSubmitting ? '送出中…' : '送出回報'}
                        </button>
                      );
                    })()}
                    <button type="button" onClick={() => setShowNotFoundReport(false)} style={{
                      padding: '5px 12px', background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', fontSize: '0.82em',
                    }}>
                      取消
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
