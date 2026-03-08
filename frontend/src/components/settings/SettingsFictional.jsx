import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import FictionalSpeciesPicker from '../FictionalSpeciesPicker';

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

export default function SettingsFictional({ onReorder }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [allTraits, setAllTraits] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    if (user) loadTraits();
  }, [user?.id]);

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      const all = data.traits || [];
      setAllTraits(all);
      setTraits(all.filter(t => t.fictional_species_id));
    } catch (err) {
      console.error(err);
    }
  }

  async function applyReorder(newFictionalTraits) {
    const prevTraits = traits;
    const prevAll = allTraits;
    const realTraits = allTraits.filter(t => !t.fictional_species_id);
    const newAll = [...realTraits, ...newFictionalTraits];
    const orderedIds = newAll.map(t => t.id);

    setTraits(newFictionalTraits);
    setAllTraits(newAll);
    try {
      await api.reorderTraits(orderedIds);
      onReorder?.();
    } catch (err) {
      setTraits(prevTraits);
      setAllTraits(prevAll);
      addToast('排序更新失敗', { type: 'error' });
    }
  }

  function moveTraitBy(index, delta) {
    const newIdx = index + delta;
    if (newIdx < 0 || newIdx >= traits.length) return;
    const newTraits = [...traits];
    [newTraits[index], newTraits[newIdx]] = [newTraits[newIdx], newTraits[index]];
    applyReorder(newTraits);
  }

  const existingFictionalIds = useMemo(
    () => traits.map(t => t.fictional_species_id),
    [traits],
  );

  useEffect(() => {
    if (showPicker && pickerRef.current) {
      pickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showPicker]);

  async function handleAdd(species) {
    try {
      await api.createTrait({ fictional_species_id: species.id });
      addToast(`已新增虛構物種特徵：${species.name_zh || species.name}`, { type: 'success' });
      setShowPicker(false);
      loadTraits();
    } catch (err) {
      if (err.status === 409) {
        addToast('你已經有這個虛構物種特徵了', { type: 'warning' });
      } else {
        addToast(err.message, { type: 'error' });
      }
    }
  }

  async function handleDelete(traitId) {
    if (!confirm('確定要移除此虛構物種特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      loadTraits();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  return (
    <div>
      {/* Title row: heading + add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1em', color: '#e2e8f0' }}>虛構物種特徵</h3>
        {!showPicker && (
          <button onClick={() => setShowPicker(true)} style={{
            marginLeft: 'auto',
            padding: '6px 14px', background: '#38bdf8', color: '#0d1526',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em',
          }}>
            + 新增
          </button>
        )}
      </div>

      {traits.length === 0 && !showPicker ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>尚未新增虛構物種特徵</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map((trait, idx) => {
            const showSortControls = traits.length >= 2;
            return (
              <div
                key={trait.id}
                draggable={!isTouch && showSortControls}
                onDragStart={() => setDragIdx(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                onDrop={() => {
                  if (dragIdx !== null && dragIdx !== idx) {
                    const newTraits = [...traits];
                    const [moved] = newTraits.splice(dragIdx, 1);
                    newTraits.splice(idx, 0, moved);
                    applyReorder(newTraits);
                  }
                  setDragIdx(null);
                  setDragOverIdx(null);
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: dragOverIdx === idx && dragIdx !== null && dragIdx !== idx
                    ? '1px solid rgba(56,189,248,0.5)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: dragIdx === idx ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                  marginBottom: '8px',
                  opacity: dragIdx === idx ? 0.5 : 1,
                  cursor: !isTouch && showSortControls ? 'grab' : 'default',
                }}
              >
                {showSortControls && (
                  isTouch ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => moveTraitBy(idx, -1)}
                        disabled={idx === 0}
                        style={{
                          padding: '2px 6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '3px', color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                          cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.7em', lineHeight: 1,
                        }}
                      >▲</button>
                      <button
                        onClick={() => moveTraitBy(idx, 1)}
                        disabled={idx === traits.length - 1}
                        style={{
                          padding: '2px 6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '3px', color: idx === traits.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                          cursor: idx === traits.length - 1 ? 'default' : 'pointer', fontSize: '0.7em', lineHeight: 1,
                        }}
                      >▼</button>
                    </div>
                  ) : (
                    <div style={{
                      marginRight: '8px', color: 'rgba(255,255,255,0.2)', fontSize: '1.1em',
                      display: 'flex', alignItems: 'center', flexShrink: 0, userSelect: 'none',
                    }}>⠿</div>
                  )
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {trait.fictional?.name_zh || trait.fictional?.name || trait.display_name}
                  </span>
                  {trait.fictional?.name_zh && trait.fictional?.name && trait.fictional.name_zh !== trait.fictional.name && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', marginLeft: '6px' }}>
                      ({trait.fictional.name})
                    </span>
                  )}
                  {trait.fictional?.origin && (
                    <span style={{
                      marginLeft: '8px', display: 'inline-block',
                      padding: '1px 6px', borderRadius: '3px', fontSize: '0.75em',
                      background: 'rgba(168,85,247,0.15)', color: '#a855f7',
                      border: '1px solid rgba(168,85,247,0.25)',
                    }}>
                      {trait.fictional.origin}
                      {trait.fictional.sub_origin && ` / ${trait.fictional.sub_origin}`}
                    </span>
                  )}
                  {trait.trait_note && (
                    <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                      {trait.trait_note}
                    </div>
                  )}
                </div>
                <RemoveButton onClick={() => handleDelete(trait.id)} />
              </div>
            );
          })}
        </div>
      )}

      {showPicker && (
        <div ref={pickerRef} style={{
          padding: '16px', background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <FictionalSpeciesPicker
            existingTraitIds={existingFictionalIds}
            onAdd={handleAdd}
          />
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button onClick={() => setShowPicker(false)} style={{
              padding: '6px 14px', background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)', border: 'none',
              borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em',
            }}>
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
