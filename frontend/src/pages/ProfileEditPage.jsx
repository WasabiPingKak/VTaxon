import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import CountryPicker from '../components/CountryPicker';
import ChannelCard from '../components/ChannelCard';

const SNS_FIELDS = [
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
  { key: 'threads', label: 'Threads', placeholder: 'https://www.threads.net/@username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'bluesky', label: 'Bluesky', placeholder: 'https://bsky.app/profile/handle' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite-code' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { key: 'marshmallow', label: '棉花糖', placeholder: 'https://marshmallow-qa.com/username' },
];

const PROVIDER_LABELS = { youtube: 'YouTube', twitch: 'Twitch' };
const PROVIDER_COLORS = { youtube: '#FF0000', twitch: '#9146FF' };
const SUPABASE_PROVIDER_MAP = { youtube: 'google', twitch: 'twitch' };
// PROVIDER_LABELS/COLORS kept for unbound provider buttons and handleUnlink

export default function ProfileEditPage() {
  const { user, loading, setUser, session, linkProvider, unlinkProvider } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [countryFlags, setCountryFlags] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [saving, setSaving] = useState(false);

  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  // Per-account loading states: { [accountId]: 'refreshing' | 'toggling' | 'settingPrimary' }
  const [accountLoading, setAccountLoading] = useState({});

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setOrganization(user.organization || '');
      setCountryFlags(user.country_flags || []);
      setSocialLinks(user.social_links || {});
      loadOAuthAccounts();
    }
  }, [user]);

  async function loadOAuthAccounts() {
    try {
      const accounts = await api.getMyOAuthAccounts();
      setOauthAccounts(accounts);
    } catch (err) {
      console.error('Failed to load OAuth accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }

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
        social_links: socialLinks,
      });
      setUser(updated);
      navigate('/profile');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleShow(account) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'toggling' }));
    try {
      const updated = await api.updateOAuthAccount(account.id, {
        show_on_profile: !account.show_on_profile,
      });
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      addToast(
        updated.show_on_profile ? '已設為在個人頁顯示' : '已取消在個人頁顯示',
        { type: 'success', duration: 3000 },
      );
    } catch (err) {
      addToast(`更新顯示設定失敗：${err.message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleSaveChannelUrl(account, url) {
    try {
      const updated = await api.updateOAuthAccount(account.id, {
        channel_url: url.trim() || null,
      });
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSetPrimary(account) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'settingPrimary' }));
    try {
      const updated = await api.updateMe({ primary_platform: account.provider });
      setUser(updated);
      const label = account.provider === 'youtube' ? 'YouTube' : 'Twitch';
      addToast(`已將 ${label} 設為主要平台`, { type: 'success', duration: 3000 });
    } catch (err) {
      addToast(`設定主要平台失敗：${err.message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleUnlink(account) {
    if (!confirm(`確定要解除 ${PROVIDER_LABELS[account.provider]} 綁定嗎？`)) return;

    try {
      // Skip Supabase unlinkIdentity — Manual linking is disabled on this project.
      // App-level unlinking is handled entirely by our backend DELETE endpoint.
      const result = await api.deleteOAuthAccount(account.id);
      setOauthAccounts(prev => prev.filter(a => a.id !== account.id));
      // Update user context if backend returned updated user (primary_platform may have changed)
      if (result.user) {
        setUser(result.user);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRefresh(account) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'refreshing' }));
    try {
      const updated = await api.refreshOAuthAccount(account.id);
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      // Update user avatar if this is the primary platform
      if (user.primary_platform === account.provider && updated.provider_avatar_url) {
        setUser(prev => ({ ...prev, avatar_url: updated.provider_avatar_url }));
      }
      addToast('同步成功', { type: 'success', duration: 3000 });
    } catch (err) {
      // No token (auto-linked account) or token expired → offer one-time OAuth redirect
      if (err.message.includes('請重新登入') || err.message.includes('授權已過期')) {
        const providerLabel = PROVIDER_LABELS[account.provider];
        if (confirm(`需要授權 ${providerLabel} 以同步資料，是否前往授權？（僅需一次）`)) {
          const supabaseProvider = SUPABASE_PROVIDER_MAP[account.provider];
          sessionStorage.setItem('vtaxon_login_provider', supabaseProvider);
          await supabase.auth.signInWithOAuth({
            provider: supabaseProvider,
            options: {
              redirectTo: window.location.origin + '/profile/edit',
              ...(supabaseProvider === 'google'
                ? { scopes: 'https://www.googleapis.com/auth/youtube.readonly' }
                : {}),
            },
          });
        }
      } else {
        addToast(`同步失敗：${err.message}`, { type: 'error' });
      }
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  function handleLink(provider) {
    const supabaseProvider = SUPABASE_PROVIDER_MAP[provider];
    linkProvider(supabaseProvider);
  }

  const boundProviders = new Set(oauthAccounts.map(a => a.provider));
  const unboundProviders = ['youtube', 'twitch'].filter(p => !boundProviders.has(p));
  const isLastAccount = oauthAccounts.length <= 1;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h2>編輯個人資料</h2>

      <form onSubmit={handleSubmit}>
        {/* OAuth Accounts Section — at the top */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>已綁定帳號</label>

          {loadingAccounts ? (
            <p style={{ color: '#999' }}>載入中…</p>
          ) : (
            <>
              {oauthAccounts.map(account => (
                <ChannelCard
                  key={account.id}
                  account={account}
                  mode="full"
                  isPrimary={user.primary_platform === account.provider}
                  onSetPrimary={() => handleSetPrimary(account)}
                  onRefresh={() => handleRefresh(account)}
                  onSaveUrl={(url) => handleSaveChannelUrl(account, url)}
                  onToggleShow={() => handleToggleShow(account)}
                  onUnlink={() => handleUnlink(account)}
                  disableUnlink={isLastAccount}
                  refreshing={accountLoading[account.id] === 'refreshing'}
                  toggling={accountLoading[account.id] === 'toggling'}
                  settingPrimary={accountLoading[account.id] === 'settingPrimary'}
                />
              ))}

              {unboundProviders.map(provider => (
                <button key={provider} type="button" onClick={() => handleLink(provider)}
                  style={{
                    display: 'block', width: '100%', padding: '10px', marginTop: '8px',
                    background: '#fff', border: `2px dashed ${PROVIDER_COLORS[provider]}`,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.95em',
                    color: PROVIDER_COLORS[provider], fontWeight: '500',
                  }}>
                  綁定 {PROVIDER_LABELS[provider]}
                </button>
              ))}
            </>
          )}
        </div>

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

        {/* SNS Links Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>SNS 連結</label>
          {SNS_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.9em', color: '#555', marginBottom: '4px' }}>
                {label}
              </label>
              <input
                type="url"
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
                style={inputStyle}
              />
            </div>
          ))}
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

