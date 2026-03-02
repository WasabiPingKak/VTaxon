import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import FictionalSpeciesPicker from '../FictionalSpeciesPicker';

export default function SettingsFictional() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [traits, setTraits] = useState([]);

  useEffect(() => {
    if (user) loadTraits();
  }, [user]);

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

  async function handleAdd(species) {
    try {
      await api.createTrait({ fictional_species_id: species.id });
      addToast(`已新增虛構物種特徵：${species.name_zh || species.name}`, { type: 'success' });
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
      {/* Existing fictional traits */}
      <h3 style={{ margin: '0 0 12px', fontSize: '1em', color: '#e2e8f0' }}>虛構物種特徵</h3>

      {traits.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
          尚未新增虛構物種特徵，從下方選擇或搜尋
        </p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map(trait => (
            <div key={trait.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
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
              <button onClick={() => handleDelete(trait.id)} style={{
                padding: '4px 10px', background: '#f87171', color: '#0d1526',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
                flexShrink: 0,
              }}>
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Picker */}
      <div style={{
        padding: '16px', background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <FictionalSpeciesPicker
          existingTraitIds={existingFictionalIds}
          onAdd={handleAdd}
        />
      </div>
    </div>
  );
}
