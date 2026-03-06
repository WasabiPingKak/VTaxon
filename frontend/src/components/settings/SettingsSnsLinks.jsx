import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';

const SNS_FIELDS = [
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
  { key: 'threads', label: 'Threads', placeholder: 'https://www.threads.net/@username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'bluesky', label: 'Bluesky', placeholder: 'https://bsky.app/profile/handle' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite-code' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { key: 'marshmallow', label: '棉花糖', placeholder: 'https://marshmallow-qa.com/username' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
];

export default function SettingsSnsLinks() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();

  const [socialLinks, setSocialLinks] = useState({});
  const [savingSns, setSavingSns] = useState(false);

  useEffect(() => {
    if (user) setSocialLinks(user.social_links || {});
  }, [user]);

  async function handleSaveSns(e) {
    e.preventDefault();
    setSavingSns(true);
    try {
      const updated = await api.updateMe({ social_links: socialLinks });
      setUser(updated);
      addToast('SNS 連結已儲存', { type: 'success', duration: 3000 });
    } catch (err) {
      addToast(err.message, { type: 'error' });
    } finally {
      setSavingSns(false);
    }
  }

  return (
    <form onSubmit={handleSaveSns}>
      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#e2e8f0' }}>
        SNS 連結
      </label>
      {SNS_FIELDS.map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.9em', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
            {label}
          </label>
          <input
            type={type || 'url'}
            value={socialLinks[key] || ''}
            onChange={(e) => setSocialLinks(prev => {
              const next = { ...prev };
              if (e.target.value) {
                next[key] = e.target.value;
              } else {
                delete next[key];
              }
              return next;
            })}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px', fontSize: '1em', boxSizing: 'border-box',
              background: '#1a2433', color: '#e2e8f0',
            }}
          />
        </div>
      ))}
      <button type="submit" disabled={savingSns} style={{
        padding: '10px 24px', background: '#38bdf8', color: '#0d1526',
        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', fontWeight: 600,
      }}>
        {savingSns ? '儲存中…' : '儲存 SNS'}
      </button>
    </form>
  );
}
