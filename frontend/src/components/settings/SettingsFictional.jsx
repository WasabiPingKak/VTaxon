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

/** Star button for selecting live primary trait */
function LivePrimaryButton({ isActive, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      title={isActive ? '目前的代表物種' : '設為代表物種'}
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

export default function SettingsFictional({ traitVersion, onTraitChange }) {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [totalTraitCount, setTotalTraitCount] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (user) loadTraits();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTraits is redefined each render; keyed on user id only
  }, [user?.id, traitVersion]);

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      const allTraits = data.traits || [];
      // Only fictional traits (fictional_species_id is set)
      setTraits(allTraits.filter(t => t.fictional_species_id));
      setTotalTraitCount(allTraits.length);
    } catch (err) {
      console.error(err);
    }
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
      const result = await api.createTrait({ fictional_species_id: species.id });
      if (result.replaced) {
        addToast(`已新增「${species.name_zh || species.name}」，取代了「${result.replaced.replaced_display_name}」`, { type: 'success' });
      } else {
        addToast(`已新增虛構物種特徵：${species.name_zh || species.name}`, { type: 'success' });
      }
      setShowPicker(false);
      loadTraits();
      onTraitChange?.();
    } catch (err) {
      if (err.status === 409) {
        const data = err.data || {};
        if (data.code === 'ancestor_blocked') {
          addToast(`無法新增：你已經有「${data.existing_display_name}」，範圍更精確`, { type: 'warning' });
        } else {
          addToast('你已經有這個虛構物種特徵了', { type: 'warning' });
        }
      } else {
        addToast(err.message, { type: 'error' });
      }
    }
  }

  async function handleDelete(traitId) {
    if (!confirm('確定要移除此虛構物種特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      if (user.live_primary_fictional_trait_id === traitId) {
        setUser(prev => ({ ...prev, live_primary_fictional_trait_id: null }));
      }
      loadTraits();
      onTraitChange?.();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  async function handleSetPrimary(traitId) {
    try {
      const updated = await api.updateMe({ live_primary_fictional_trait_id: traitId });
      setUser(prev => ({ ...prev, live_primary_fictional_trait_id: updated.live_primary_fictional_trait_id }));
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
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ 代表物種</span>
          <span style={{ marginLeft: '6px' }}>
            代表物種會在分類樹上優先顯示，也是直播篩選時唯一顯示的節點。點擊 ★ 來選擇。
          </span>
        </div>
      )}

      {traits.length === 0 && !showPicker ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>尚未新增虛構物種特徵</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map(trait => {
            const isPrimary = user.live_primary_fictional_trait_id
              ? user.live_primary_fictional_trait_id === trait.id
              : traits[0]?.id === trait.id;

            return (
            <div key={trait.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              border: isPrimary && traits.length > 1
                ? '1px solid rgba(245,158,11,0.35)'
                : '1px solid rgba(255,255,255,0.06)',
              background: isPrimary && traits.length > 1
                ? 'rgba(245,158,11,0.06)'
                : 'rgba(255,255,255,0.02)',
              marginBottom: '8px',
            }}>
              {traits.length > 1 && (
                <LivePrimaryButton
                  isActive={isPrimary}
                  onClick={() => handleSetPrimary(trait.id)}
                  disabled={isPrimary}
                />
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
