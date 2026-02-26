import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import SpeciesSearch from '../components/SpeciesSearch';

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();
  const [traits, setTraits] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (user) {
      loadTraits();
      setDisplayName(user.display_name);
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;

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
        display_name: species.common_name_en || species.scientific_name,
      });
      setShowSearch(false);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTrait(traitId) {
    if (!confirm('Remove this trait?')) return;
    try {
      await api.deleteTrait(traitId);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateName() {
    try {
      const updated = await api.updateMe({ display_name: displayName });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        {user.avatar_url && (
          <img src={user.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        )}
        <div>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <button onClick={handleUpdateName} style={smallBtnStyle}>Save</button>
              <button onClick={() => setEditing(false)} style={smallBtnStyle}>Cancel</button>
            </div>
          ) : (
            <div>
              <h2 style={{ margin: 0 }}>{user.display_name}</h2>
              <button onClick={() => setEditing(true)}
                style={{ ...smallBtnStyle, marginTop: '4px' }}>Edit Name</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Species Traits</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSearch(!showSearch)} style={{
            padding: '6px 14px', background: '#4a90d9', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
          }}>
            {showSearch ? 'Cancel' : '+ Add Trait'}
          </button>
          <Link to={`/kinship/${user.id}`} style={{
            padding: '6px 14px', background: '#27ae60', color: '#fff',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            View Kinship
          </Link>
        </div>
      </div>

      {showSearch && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
          <SpeciesSearch onSelect={handleAddTrait} />
        </div>
      )}

      {traits.length === 0 ? (
        <p style={{ color: '#999' }}>No traits yet. Add your first species trait!</p>
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
                Remove
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
