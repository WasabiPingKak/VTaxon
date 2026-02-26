import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import SpeciesSearch from '../components/SpeciesSearch';
import CountryFlag from '../components/CountryFlag';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [traits, setTraits] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) loadTraits();
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>載入中…</p>;

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      setTraits(data.traits || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddTrait(species) {
    try {
      await api.createTrait({
        taxon_id: species.taxon_id,
        display_name: species.common_name_zh || species.common_name_en || species.scientific_name,
      });
      setShowSearch(false);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTrait(traitId) {
    if (!confirm('確定要移除此特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#4a90d9', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5em', fontWeight: 'bold',
          }}>
            {(user.display_name || '?')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0 }}>{user.display_name}</h2>
          {user.organization && (
            <div style={{ color: '#666', marginTop: '4px' }}>{user.organization}</div>
          )}
          {user.country_flags?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {user.country_flags.map((code) => (
                <CountryFlag key={code} code={code} />
              ))}
            </div>
          )}
          <Link to="/profile/edit" style={{
            ...smallBtnStyle, display: 'inline-block', marginTop: '8px',
            textDecoration: 'none', color: '#333',
          }}>
            編輯個人資料
          </Link>
        </div>
      </div>

      {/* Traits section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>物種特徵</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSearch(!showSearch)} style={{
            padding: '6px 14px', background: '#4a90d9', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
          }}>
            {showSearch ? '取消' : '+ 新增特徵'}
          </button>
          <Link to={`/kinship/${user.id}`} style={{
            padding: '6px 14px', background: '#27ae60', color: '#fff',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            查看親緣關係
          </Link>
        </div>
      </div>

      {showSearch && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
          <SpeciesSearch onSelect={handleAddTrait} />
        </div>
      )}

      {traits.length === 0 ? (
        <p style={{ color: '#999' }}>尚未新增物種特徵，點擊上方按鈕開始新增！</p>
      ) : (
        <div>
          {traits.map((trait) => (
            <div key={trait.id} style={{
              padding: '12px 16px', borderBottom: '1px solid #eee',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <strong>{trait.display_name}</strong>
                {trait.species && (
                  <span style={{ marginLeft: '8px', color: '#888', fontStyle: 'italic' }}>
                    {trait.species.scientific_name}
                  </span>
                )}
                {trait.fictional && (
                  <span style={{ marginLeft: '8px', color: '#888' }}>
                    [{trait.fictional.origin}]
                  </span>
                )}
                {trait.trait_note && (
                  <div style={{ fontSize: '0.85em', color: '#999' }}>{trait.trait_note}</div>
                )}
              </div>
              <button onClick={() => handleDeleteTrait(trait.id)} style={{
                padding: '4px 10px', background: '#e74c3c', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const smallBtnStyle = {
  padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px',
  background: '#fff', cursor: 'pointer', fontSize: '0.9em',
};
