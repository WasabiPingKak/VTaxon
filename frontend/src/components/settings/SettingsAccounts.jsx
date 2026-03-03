import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import ChannelCard from '../ChannelCard';

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

const PROVIDER_LABELS = { youtube: 'YouTube', twitch: 'Twitch' };
const PROVIDER_COLORS = { youtube: '#FF0000', twitch: '#9146FF' };
const SUPABASE_PROVIDER_MAP = { youtube: 'google', twitch: 'twitch' };

export default function SettingsAccounts() {
  const { user, setUser, linkProvider } = useAuth();
  const { addToast } = useToast();

  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountLoading, setAccountLoading] = useState({});
  const [socialLinks, setSocialLinks] = useState({});
  const [savingSns, setSavingSns] = useState(false);

  useEffect(() => {
    if (user) {
      loadOAuthAccounts();
      setSocialLinks(user.social_links || {});
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
      addToast(err.message, { type: 'error' });
    }
  }

  async function handleSetPrimary(account) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'settingPrimary' }));
    try {
      const updated = await api.updateMe({ primary_platform: account.provider });
      setUser(updated);
      addToast(`已將 ${PROVIDER_LABELS[account.provider]} 設為主要平台`, { type: 'success', duration: 3000 });
    } catch (err) {
      addToast(`設定主要平台失敗：${err.message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleUnlink(account) {
    if (!confirm(`確定要解除 ${PROVIDER_LABELS[account.provider]} 綁定嗎？`)) return;
    try {
      const result = await api.deleteOAuthAccount(account.id);
      setOauthAccounts(prev => prev.filter(a => a.id !== account.id));
      if (result.user) setUser(result.user);
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  }

  async function handleRefresh(account) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'refreshing' }));
    try {
      const updated = await api.refreshOAuthAccount(account.id);
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      if (user.primary_platform === account.provider && updated.provider_avatar_url) {
        setUser(prev => ({ ...prev, avatar_url: updated.provider_avatar_url }));
      }
      addToast('同步成功', { type: 'success', duration: 3000 });
    } catch (err) {
      if (err.message.includes('請重新登入') || err.message.includes('授權已過期')) {
        const providerLabel = PROVIDER_LABELS[account.provider];
        if (confirm(`${providerLabel} 的驗證已過期，需要重新授權才能同步資料。是否前往重新授權？`)) {
          const supabaseProvider = SUPABASE_PROVIDER_MAP[account.provider];
          sessionStorage.setItem('vtaxon_login_provider', supabaseProvider);
          await supabase.auth.signInWithOAuth({
            provider: supabaseProvider,
            options: {
              redirectTo: window.location.origin + '/account',
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

  const boundProviders = new Set(oauthAccounts.map(a => a.provider));
  const unboundProviders = ['youtube', 'twitch'].filter(p => !boundProviders.has(p));
  const isLastAccount = oauthAccounts.length <= 1;

  if (loadingAccounts) {
    return <p style={{ color: 'rgba(255,255,255,0.4)' }}>載入中…</p>;
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#e2e8f0' }}>
        已綁定帳號
      </label>

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
            background: 'transparent', border: `2px dashed ${PROVIDER_COLORS[provider]}`,
            borderRadius: '8px', cursor: 'pointer', fontSize: '0.95em',
            color: PROVIDER_COLORS[provider], fontWeight: '500',
          }}>
          綁定 {PROVIDER_LABELS[provider]}
        </button>
      ))}

      {/* SNS Links */}
      <form onSubmit={handleSaveSns} style={{ marginTop: '32px' }}>
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
    </div>
  );
}
