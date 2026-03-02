import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import CountryPicker from '../CountryPicker';

export default function SettingsProfile() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [bio, setBio] = useState('');
  const [countryFlags, setCountryFlags] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setOrganization(user.organization || '');
      setBio(user.bio || '');
      setCountryFlags(user.country_flags || []);
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('名稱為必填欄位', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateMe({
        display_name: displayName.trim(),
        organization: organization.trim() || null,
        bio: bio.trim() || null,
        country_flags: countryFlags,
      });
      setUser(updated);
      addToast('個人資料已儲存', { type: 'success', duration: 3000 });
    } catch (err) {
      addToast(err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
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

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>自我介紹</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="簡單介紹一下你的角色吧！（最多 500 字）"
          maxLength={500}
          rows={6}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
        />
        <div style={{ textAlign: 'right', fontSize: '0.8em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
          {bio.length}/500
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>國家/地區</label>
        <CountryPicker selected={countryFlags} onChange={setCountryFlags} />
      </div>

      <button type="submit" disabled={saving} style={{
        padding: '10px 24px', background: '#38bdf8', color: '#0d1526',
        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', fontWeight: 600,
      }}>
        {saving ? '儲存中…' : '儲存'}
      </button>
    </form>
  );
}

const labelStyle = {
  display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#e2e8f0',
};

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '1em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};
