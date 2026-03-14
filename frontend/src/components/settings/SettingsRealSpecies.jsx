import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import { formatAltNamesInline, altNamesTooltip } from '../../lib/altNames';
import { displayScientificName } from '../../lib/speciesName';
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center', fontSize: '0.8em', lineHeight: '1.6' }}>
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


/** Star button for selecting live primary trait */
function LivePrimaryButton({ isActive, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      title={isActive ? '目前的直播代表物種' : '設為直播代表物種'}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '1.2em',
        color: isActive ? '#f59e0b' : (hovered ? '#fbbf24' : 'rgba(255,255,255,0.15)'),
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {isActive ? '★' : '☆'}
    </button>
  );
}

export default function SettingsRealSpecies({ traitVersion, onTraitChange }) {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [totalTraitCount, setTotalTraitCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user) loadTraits();
  }, [user?.id, traitVersion]);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showSearch]);

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      const allTraits = data.traits || [];
      // Only real species traits (taxon_id is set)
      setTraits(allTraits.filter(t => t.taxon_id));
      setTotalTraitCount(allTraits.length);
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
      onTraitChange?.();
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
      // If deleted trait was the primary, update local user state
      if (user.live_primary_real_trait_id === traitId) {
        setUser(prev => ({ ...prev, live_primary_real_trait_id: null }));
      }
      loadTraits();
      onTraitChange?.();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  async function handleSetPrimary(traitId) {
    try {
      const updated = await api.updateMe({ live_primary_real_trait_id: traitId });
      setUser(prev => ({ ...prev, live_primary_real_trait_id: updated.live_primary_real_trait_id }));
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  return (
    <div>
      {/* Title row: heading + breeds link + add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1em', color: '#e2e8f0' }}>真實物種特徵</h3>
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

      {/* Visual budget warning — show when total traits ≥ 5 */}
      {totalTraitCount >= 5 && (
        <div style={{
          marginBottom: '12px', padding: '10px 14px', borderRadius: '8px',
          background: totalTraitCount >= 6 ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)',
          border: `1px solid ${totalTraitCount >= 6 ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.2)'}`,
          fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
        }}>
          <span style={{ color: totalTraitCount >= 6 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
            {totalTraitCount >= 6 ? '⚠' : 'ℹ'} 顯示限制
          </span>
          <span style={{ marginLeft: '6px' }}>
            {totalTraitCount >= 6
              ? `你目前共有 ${totalTraitCount} 個物種標註。超過 5 個時，你在分類樹上將不會直接顯示，而是被收入「+N 位」摺疊群組中，直播狀態也不會顯示。`
              : `你目前共有 ${totalTraitCount} 個物種標註。第 5 個起，你在分類樹上的顯示會縮小（無頭像）。`
            }
          </span>
        </div>
      )}

      {/* Live primary info banner — only show when multiple traits exist */}
      {traits.length > 1 && (
        <div style={{
          marginBottom: '12px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
        }}>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ 直播代表物種</span>
          <span style={{ marginLeft: '6px' }}>
            開啟「直播中」篩選器時，你只會出現在一個物種節點。點擊 ★ 來選擇要顯示的物種。
          </span>
        </div>
      )}

      {traits.length === 0 && !showSearch ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>尚未新增真實物種特徵</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map(trait => {
            const displayName = trait.species?.common_name_zh || displayScientificName(trait.species) || trait.display_name;
            const rank = (trait.species?.taxon_rank || '').toUpperCase() || null;
            // Determine if this trait is the live primary
            const isPrimary = user.live_primary_real_trait_id
              ? user.live_primary_real_trait_id === trait.id
              : traits[0]?.id === trait.id; // fallback: first trait is default primary

            return (
              <div key={trait.id} style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: isPrimary && traits.length > 1
                  ? '1px solid rgba(245,158,11,0.35)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: isPrimary && traits.length > 1
                  ? 'rgba(245,158,11,0.06)'
                  : 'rgba(255,255,255,0.02)',
                marginBottom: '8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                {traits.length > 1 && (
                  <LivePrimaryButton
                    isActive={isPrimary}
                    onClick={() => handleSetPrimary(trait.id)}
                    disabled={isPrimary}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {trait.species && <TaxonomyPath species={trait.species} />}
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: trait.species ? '4px' : 0 }}>
                    {rank && <RankBadge rank={rank} />}
                    {displayName && (() => {
                      const altInline = formatAltNamesInline(trait.species?.alternative_names_zh);
                      const altTitle = altNamesTooltip(trait.species?.alternative_names_zh);
                      return (
                        <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>
                          {displayName}
                          {altInline && (
                            <span title={altTitle} style={{ fontWeight: 400, fontSize: '0.85em', color: 'rgba(255,255,255,0.35)' }}>
                              {altInline}
                            </span>
                          )}
                        </span>
                      );
                    })()}
                    {trait.species && (
                      <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
                        {displayScientificName(trait.species)}
                      </span>
                    )}
                    {trait.species?.common_name_en && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>
                        ({trait.species.common_name_en})
                      </span>
                    )}
                    <BreedLabel trait={trait} />
                  </div>
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
        </div>
      )}
    </div>
  );
}
