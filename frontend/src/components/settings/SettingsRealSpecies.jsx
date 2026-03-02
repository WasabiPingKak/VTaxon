import { useState, useEffect, useCallback, useRef } from 'react';
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

/** Indented taxonomy path (compact version for settings) */
function TaxonomyPath({ species }) {
  const pathParts = (species.taxon_path || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = species[`${rank}_zh`];
    return { rank, latin, zh };
  }).filter(r => r.latin);

  if (ranks.length === 0) return null;

  return (
    <div style={{ fontSize: '0.8em', lineHeight: '1.6', marginTop: '4px' }}>
      {ranks.map((r, i) => (
        <div key={r.rank} style={{ paddingLeft: i * 10, display: 'flex', alignItems: 'center' }}>
          <RankBadge rank={RANK_TO_UPPER[r.rank]} style={{ fontSize: '0.7em' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            {r.zh ? `${r.zh} (${r.latin})` : r.latin}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Inline breed editor */
function BreedEditor({ trait, onSave, onSaveManual }) {
  const rank = (trait.species?.taxon_rank || '').toUpperCase();
  if (rank !== 'SPECIES' && rank !== 'SUBSPECIES' && rank !== 'VARIETY') return null;

  const [editing, setEditing] = useState(false);
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [manualName, setManualName] = useState('');

  const hasBreeds = breeds.length > 0;
  const panelRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    function onPointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setEditing(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [editing]);

  async function handleOpen() {
    setEditing(true);
    setLoadingBreeds(true);
    setSearchQuery('');
    setSelectedBreed(null);
    setManualName(trait.breed_name || '');
    try {
      const data = await api.getBreeds(trait.taxon_id);
      const list = data.breeds || [];
      setBreeds(list);
      if (list.length > 0) {
        setMode('search');
        if (trait.breed_id) {
          const existing = list.find(b => b.id === trait.breed_id);
          if (existing) setSelectedBreed(existing);
        }
      } else {
        setMode('manual');
      }
    } catch {
      setBreeds([]);
      setMode('manual');
    } finally {
      setLoadingBreeds(false);
    }
  }

  function handleClose() {
    setEditing(false);
    setSearchQuery('');
    setSelectedBreed(null);
    setManualName('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (mode === 'search' && selectedBreed) {
        await onSave(trait.id, selectedBreed.id);
      } else if (mode === 'manual') {
        await onSaveManual(trait.id, manualName.trim());
      } else if (mode === 'search' && !selectedBreed) {
        await onSave(trait.id, null);
      }
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredBreeds = (() => {
    if (!hasBreeds) return [];
    const q = searchQuery.trim();
    if (!q) return breeds;
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(q);
    return breeds.filter(b => {
      if (isCJK) return b.name_zh && b.name_zh.includes(q);
      return b.name_en && b.name_en.toLowerCase().startsWith(q.toLowerCase());
    });
  })();

  if (!editing) {
    const isSystemBreed = !!trait.breed_id;
    return (
      <span style={{ marginLeft: '6px' }}>
        {trait.breed_name ? (
          <span
            onClick={handleOpen}
            title={isSystemBreed ? '系統品種（點擊修改）' : '手動輸入品種（點擊修改）'}
            style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
              fontSize: '0.8em', fontWeight: 600, cursor: 'pointer',
              background: isSystemBreed ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.06)',
              color: isSystemBreed ? '#fb923c' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isSystemBreed ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.12)'}`,
              borderStyle: isSystemBreed ? 'solid' : 'dashed',
            }}
            onMouseEnter={e => { e.currentTarget.style.outline = '2px solid #38bdf8'; e.currentTarget.style.outlineOffset = '1px'; }}
            onMouseLeave={e => { e.currentTarget.style.outline = 'none'; }}
          >
            {trait.breed_name} ✎
          </span>
        ) : (
          <button onClick={handleOpen} title="品種是人為培育的分類，如柴犬、布偶貓，不是生物學上的亞種" style={{
            background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '3px',
            padding: '0 6px', fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
          }}>
            + 品種
          </button>
        )}
      </span>
    );
  }

  if (loadingBreeds) {
    return (
      <span style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.4)', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{
          display: 'inline-block', width: '14px', height: '14px',
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fb923c',
          borderRadius: '50%',
          animation: 'vtaxonSpin 0.8s linear infinite',
        }} />
        載入品種中…
      </span>
    );
  }

  const canSave = mode === 'manual'
    ? manualName.trim().length > 0
    : selectedBreed !== null;

  return (
    <div ref={panelRef} style={{
      marginLeft: '4px', marginTop: '6px',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
      background: '#141c2b', width: '320px', maxWidth: '90vw',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {mode === 'search' ? (
        <>
          <div style={{ padding: '8px 10px 4px', position: 'relative' }}>
            <input
              type="text"
              value={selectedBreed ? (selectedBreed.name_zh ? `${selectedBreed.name_zh} (${selectedBreed.name_en})` : selectedBreed.name_en) : searchQuery}
              onChange={(e) => {
                if (selectedBreed) { setSelectedBreed(null); setSearchQuery(e.target.value); }
                else setSearchQuery(e.target.value);
              }}
              onFocus={() => { if (selectedBreed) { setSelectedBreed(null); setSearchQuery(''); } }}
              placeholder="搜尋品種…"
              autoFocus
              style={{
                width: '100%', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
                background: selectedBreed ? 'rgba(52,211,153,0.1)' : '#1a2433', color: '#e2e8f0',
              }}
            />
          </div>
          {!selectedBreed && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {filteredBreeds.length === 0 ? (
                <div style={{ padding: '10px', color: 'rgba(255,255,255,0.35)', fontSize: '0.85em', textAlign: 'center' }}>
                  無匹配品種
                </div>
              ) : (
                filteredBreeds.map(b => (
                  <div key={b.id} onClick={() => setSelectedBreed(b)}
                    style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.9em', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {b.name_zh ? (<><strong>{b.name_zh}</strong> <span style={{ color: 'rgba(255,255,255,0.45)' }}>({b.name_en})</span></>) : (<span>{b.name_en}</span>)}
                  </div>
                ))
              )}
            </div>
          )}
          <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8em' }}>
            <span onClick={() => { setMode('manual'); setManualName(''); }} style={{ color: '#38bdf8', cursor: 'pointer' }}>
              找不到？手動輸入品種名稱 →
            </span>
          </div>
        </>
      ) : (
        <div style={{ padding: '8px 10px' }}>
          {!hasBreeds && (
            <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
              此物種尚無內建品種資料，可手動輸入品種名稱
            </div>
          )}
          <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
            placeholder="輸入品種名稱…" autoFocus
            style={{ width: '100%', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box', background: '#1a2433', color: '#e2e8f0' }}
          />
          {hasBreeds && (
            <div style={{ marginTop: '6px', fontSize: '0.8em' }}>
              <span onClick={() => { setMode('search'); setSearchQuery(''); setSelectedBreed(null); }} style={{ color: '#38bdf8', cursor: 'pointer' }}>
                ← 返回品種清單
              </span>
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '6px 10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving || !canSave} style={{
          padding: '4px 12px', background: canSave ? '#34d399' : 'rgba(255,255,255,0.1)',
          color: canSave ? '#0d1526' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '4px',
          fontSize: '0.85em', cursor: canSave ? 'pointer' : 'default', fontWeight: 600,
        }}>
          {saving ? '…' : '存'}
        </button>
        <button onClick={handleClose} style={{
          padding: '4px 12px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
          border: 'none', borderRadius: '4px', fontSize: '0.85em', cursor: 'pointer',
        }}>
          取消
        </button>
      </div>
    </div>
  );
}


export default function SettingsRealSpecies() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) loadTraits();
  }, [user]);

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

  async function handleUpdateBreed(traitId, breedId) {
    await api.updateTrait(traitId, { breed_id: breedId });
    loadTraits();
  }

  async function handleUpdateBreedManual(traitId, breedName) {
    await api.updateTrait(traitId, { breed_name: breedName || null });
    loadTraits();
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
      <h3 style={{ margin: '0 0 12px', fontSize: '1em', color: '#e2e8f0' }}>真實物種特徵</h3>

      <AiPromptBlock />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {!showSearch && (
          <button onClick={() => setShowSearch(true)} style={{
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
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                    <BreedEditor trait={trait} onSave={handleUpdateBreed} onSaveManual={handleUpdateBreedManual} />
                  </div>
                  {trait.species && <TaxonomyPath species={trait.species} />}
                  {trait.trait_note && (
                    <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{trait.trait_note}</div>
                  )}
                </div>
                <button onClick={() => handleDeleteTrait(trait.id)} style={{
                  padding: '4px 10px', background: '#f87171', color: '#0d1526',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
                }}>
                  移除
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showSearch && (
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <SpeciesSearch onSelect={handleAddTrait} onCancel={() => setShowSearch(false)} />
        </div>
      )}
    </div>
  );
}
