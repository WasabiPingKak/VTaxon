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

export default function SettingsFictional() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (user) loadTraits();
  }, [user?.id]);

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      // Only fictional traits (fictional_species_id is set)
      setTraits((data.traits || []).filter(t => t.fictional_species_id));
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
          {traits.map(trait => (
            <div key={trait.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '8px',
            }}>
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
          ))}
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
