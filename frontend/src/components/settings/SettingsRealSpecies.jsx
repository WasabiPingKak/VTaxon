import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import SpeciesSearch from '../SpeciesSearch';
import RankBadge from '../RankBadge';
import AiPromptBlock from '../AiPromptBlock';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

/** Single-line breadcrumb taxonomy path */
function TaxonomyPath({ species }) {
  const pathParts = (species.taxon_path || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = species[`${rank}_zh`];
    return { rank, latin, zh };
  }).filter(r => r.latin);

  if (ranks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center', marginTop: '4px', fontSize: '0.8em', lineHeight: '1.6' }}>
      {ranks.map((r, i) => (
        <span key={r.rank} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 2px' }}>›</span>}
          <RankBadge rank={RANK_TO_UPPER[r.rank]} style={{ fontSize: '0.7em' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            {r.zh ? `${r.zh}` : r.latin}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Read-only breed label */
function BreedLabel({ trait }) {
  if (!trait.breed_name) return null;
  return (
    <span style={{
      marginLeft: '6px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
      fontSize: '0.8em', fontWeight: 600,
      background: 'rgba(251,146,60,0.15)',
      color: '#fb923c',
      border: '1px solid rgba(251,146,60,0.3)',
    }}>
      {trait.breed_name}
    </span>
  );
}

/** Subtle remove button with hover effect */
function RemoveButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 10px',
        background: 'transparent',
        color: hovered ? '#f87171' : 'rgba(255,255,255,0.3)',
        border: `1px solid ${hovered ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.8em',
        flexShrink: 0,
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      移除
    </button>
  );
}


export default function SettingsRealSpecies() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user) loadTraits();
  }, [user]);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showSearch]);

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      // Only real species traits (taxon_id is set)
      setTraits((data.traits || []).filter(t => t.taxon_id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddTrait(species) {
    try {
      const body = { taxon_id: species.taxon_id };
      if (species.result_type === 'breed' && species.breed?.id) {
        body.breed_id = species.breed.id;
      }
      const result = await api.createTrait(body);
      if (result.replaced) {
        addToast(`已新增，原本的「${result.replaced.replaced_display_name}」已被取代`, { type: 'success' });
      } else {
        const breedName = species.result_type === 'breed'
          ? (species.breed?.name_zh || species.breed?.name_en)
          : null;
        addToast(breedName ? `特徵新增成功（品種：${breedName}）` : '特徵新增成功', { type: 'success' });
      }
      setShowSearch(false);
      loadTraits();
    } catch (err) {
      if (err.data?.code === 'ancestor_blocked') {
        addToast(`無法新增：你已經有「${err.data.existing_display_name}」，範圍比這個更小更準確`, { type: 'warning' });
      } else if (err.status === 409 && species.result_type === 'breed') {
        addToast('你已經有這個物種的特徵了，可以在現有特徵上修改品種', { type: 'warning' });
      } else if (err.data?.code === 'rank_not_allowed') {
        addToast(err.message, { type: 'error' });
      } else {
        addToast(err.message, { type: 'error' });
      }
    }
  }

  async function handleDeleteTrait(traitId) {
    if (!confirm('確定要移除此特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      loadTraits();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  return (
    <div>
      {/* Title row: heading + breeds link + add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1em', color: '#e2e8f0' }}>真實物種特徵</h3>
        <Link to="/breeds" style={{
          padding: '3px 10px', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '4px',
          background: 'rgba(251,146,60,0.1)', fontSize: '0.8em', fontWeight: 600,
          color: '#fb923c', textDecoration: 'none',
        }}>
          已收錄品種 &rarr;
        </Link>
        {!showSearch && (
          <button onClick={() => setShowSearch(true)} style={{
            marginLeft: 'auto',
            padding: '6px 14px', background: '#38bdf8', color: '#0d1526',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em',
          }}>
            + 新增
          </button>
        )}
      </div>

      {traits.length === 0 && !showSearch ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>尚未新增真實物種特徵</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map(trait => {
            const displayName = trait.species?.common_name_zh || trait.species?.scientific_name || trait.display_name;
            const rank = (trait.species?.taxon_rank || '').toUpperCase() || null;

            return (
              <div key={trait.id} style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                    {rank && <RankBadge rank={rank} />}
                    {displayName && (
                      <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>
                        {displayName}
                      </span>
                    )}
                    {trait.species && (
                      <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
                        {trait.species.scientific_name}
                      </span>
                    )}
                    {trait.species?.common_name_en && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>
                        ({trait.species.common_name_en})
                      </span>
                    )}
                    <BreedLabel trait={trait} />
                  </div>
                  {trait.species && <TaxonomyPath species={trait.species} />}
                  {trait.trait_note && (
                    <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{trait.trait_note}</div>
                  )}
                </div>
                <RemoveButton onClick={() => handleDeleteTrait(trait.id)} />
              </div>
            );
          })}
        </div>
      )}

      {showSearch && (
        <div ref={searchRef} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AiPromptBlock />
          <SpeciesSearch onSelect={handleAddTrait} onCancel={() => setShowSearch(false)} autoFocus />
          <Link to="/breeds" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            marginTop: '12px', padding: '10px 14px',
            background: 'rgba(251,146,60,0.08)',
            border: '1px dashed rgba(251,146,60,0.35)',
            borderRadius: '6px', textDecoration: 'none',
            color: '#fb923c', fontSize: '0.9em', fontWeight: 500,
          }}>
            <span style={{ fontSize: '1.1em' }}>+</span>
            找不到想要的品種？回報遺漏
          </Link>
        </div>
      )}
    </div>
  );
}
