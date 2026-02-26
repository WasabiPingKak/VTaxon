import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import CountryPicker from '../components/CountryPicker';

export default function ProfileEditPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [countryFlags, setCountryFlags] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setOrganization(user.organization || '');
      setCountryFlags(user.country_flags || []);
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>載入中…</p>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('名稱為必填欄位');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateMe({
        display_name: displayName.trim(),
        organization: organization.trim() || null,
        country_flags: countryFlags,
      });
      setUser(updated);
      navigate('/profile');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h2>編輯個人資料</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>名稱 *</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>所屬組織</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="例如：Hololive、NIJISANJI…"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>國家/地區</label>
          <CountryPicker selected={countryFlags} onChange={setCountryFlags} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{
            padding: '10px 24px', background: '#4a90d9', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em',
          }}>
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/profile')} style={{
            padding: '10px 24px', background: '#fff', color: '#333',
            border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '1em',
          }}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333',
};

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid #ccc',
  borderRadius: '4px', fontSize: '1em', boxSizing: 'border-box',
};
