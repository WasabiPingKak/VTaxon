import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import { formatAltNamesInline, altNamesTooltip } from '../../lib/altNames';
import { displayScientificName } from '../../lib/speciesName';
import SpeciesSearch from '../SpeciesSearch';
import RankBadge from '../RankBadge';
import AiPromptBlock from '../AiPromptBlock';
import { RemoveButton, LivePrimaryButton } from './TraitButtons';
import { TraitBudgetNotice, LivePrimaryNotice } from './TraitNotices';
import { RANK_ORDER, RANK_TO_UPPER } from '../../lib/taxonomyConstants';
import type { SpeciesCache } from '../../types/models';

interface SpeciesWithZh extends SpeciesCache {
  kingdom_zh?: string;
  phylum_zh?: string;
  class_zh?: string;
  order_zh?: string;
  family_zh?: string;
  genus_zh?: string;
}

/** Single-line breadcrumb taxonomy path */
function TaxonomyPath({ species }: { species: SpeciesWithZh }) {
  const pathParts = (species.taxon_path || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = species[`${rank}_zh` as keyof SpeciesWithZh] as string | undefined;
    return { rank, latin, zh };
  }).filter(r => r.latin);

  if (ranks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center', fontSize: '0.8em', lineHeight: '1.6' }}>
      {ranks.map((r, i) => (
        <span key={r.rank} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 2px' }}>{'\u203A'}</span>}
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
function BreedLabel({ trait }: { trait: TraitData }) {
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

interface TraitData {
  id: string;
  taxon_id?: number | null;
  fictional_species_id?: number | null;
  species?: SpeciesWithZh | null;
  display_name?: string;
  breed_name?: string | null;
  breed_id?: number | null;
  trait_note?: string | null;
  [key: string]: unknown;
}

interface SpeciesSearchResult {
  taxon_id: number;
  result_type?: string;
  breed?: { id: number; name_zh?: string; name_en?: string };
  [key: string]: unknown;
}

interface SettingsRealSpeciesProps {
  traitVersion?: number;
  onTraitChange?: () => void;
}

export default function SettingsRealSpecies({ traitVersion, onTraitChange }: SettingsRealSpeciesProps) {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState<TraitData[]>([]);
  const [totalTraitCount, setTotalTraitCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) loadTraits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, traitVersion]);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showSearch]);

  async function loadTraits() {
    try {
      const allTraits = await api.getTraits(user!.id) as unknown as TraitData[];
      setTraits(allTraits.filter(t => t.taxon_id));
      setTotalTraitCount(allTraits.length);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddTrait(species: SpeciesSearchResult) {
    try {
      const body: Record<string, unknown> = { taxon_id: species.taxon_id };
      if (species.result_type === 'breed' && species.breed?.id) {
        body.breed_id = species.breed.id;
      }
      const result = await api.createTrait(body as Parameters<typeof api.createTrait>[0]) as unknown as { replaced?: { replaced_display_name: string } };
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
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: Record<string, string>; message?: string };
      if (apiErr.data?.code === 'ancestor_blocked') {
        addToast(`無法新增：你已經有「${apiErr.data.existing_display_name}」，範圍比這個更小更準確`, { type: 'error' });
      } else if (apiErr.status === 409 && species.result_type === 'breed') {
        addToast('你已經有這個物種的特徵了，可以在現有特徵上修改品種', { type: 'error' });
      } else if (apiErr.data?.code === 'rank_not_allowed') {
        addToast(apiErr.message || '發生錯誤', { type: 'error' });
      } else {
        addToast(apiErr.message || '發生錯誤', { type: 'error' });
      }
    }
  }

  async function handleDeleteTrait(traitId: string) {
    if (!confirm('確定要移除此特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      if ((user as unknown as Record<string, unknown>)?.live_primary_real_trait_id === traitId) {
        setUser(prev => prev ? { ...prev, live_primary_real_trait_id: null } as typeof prev : prev);
      }
      loadTraits();
      onTraitChange?.();
    } catch (err: unknown) {
      addToast((err as Error).message, { type: 'error' });
    }
  }

  async function handleSetPrimary(traitId: string) {
    try {
      const updated = await api.updateMe({ live_primary_real_trait_id: traitId } as Parameters<typeof api.updateMe>[0]);
      setUser(prev => prev ? { ...prev, live_primary_real_trait_id: (updated as unknown as Record<string, unknown>).live_primary_real_trait_id } as unknown as typeof prev : prev);
    } catch (err: unknown) {
      addToast((err as Error).message, { type: 'error' });
    }
  }

  const userExt = user as unknown as Record<string, unknown> | null;

  return (
    <div>
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

      <TraitBudgetNotice count={totalTraitCount} />
      <LivePrimaryNotice traitCount={traits.length} />

      {traits.length === 0 && !showSearch ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>尚未新增真實物種特徵</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map(trait => {
            const dn = trait.species?.common_name_zh || displayScientificName(trait.species ?? null) || trait.display_name;
            const rank = (trait.species?.taxon_rank || '').toUpperCase() || null;
            const isPrimary = userExt?.live_primary_real_trait_id
              ? userExt.live_primary_real_trait_id === trait.id
              : traits[0]?.id === trait.id;

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
                    isActive={!!isPrimary}
                    onClick={() => handleSetPrimary(trait.id)}
                    disabled={!!isPrimary}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {trait.species && <TaxonomyPath species={trait.species} />}
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: trait.species ? '4px' : 0 }}>
                    {rank && <RankBadge rank={rank} />}
                    {dn && (() => {
                      const altInline = formatAltNamesInline(trait.species?.alternative_names_zh as string | null | undefined);
                      const altTitle = altNamesTooltip(trait.species?.alternative_names_zh as string | null | undefined);
                      return (
                        <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>
                          {dn}
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
          <SpeciesSearch onSelect={handleAddTrait as (species: unknown) => void} onCancel={() => setShowSearch(false)} autoFocus />
        </div>
      )}
    </div>
  );
}
