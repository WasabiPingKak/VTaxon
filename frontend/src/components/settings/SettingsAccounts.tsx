import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import ChannelCard from '../ChannelCard';
import type { OAuthAccount, User } from '../../types/models';

const PROVIDER_LABELS: Record<string, string> = { youtube: 'YouTube', twitch: 'Twitch' };
const PROVIDER_COLORS: Record<string, string> = { youtube: '#FF0000', twitch: '#9146FF' };
const SUPABASE_PROVIDER_MAP: Record<string, 'google' | 'twitch'> = { youtube: 'google', twitch: 'twitch' };

interface OAuthAccountExt extends OAuthAccount {
  live_sub_status?: string;
}

export default function SettingsAccounts() {
  const { user, setUser, linkProvider, ytPermissionFailed, signOut } = useAuth();
  const { addToast } = useToast();

  const [oauthAccounts, setOauthAccounts] = useState<OAuthAccountExt[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountLoading, setAccountLoading] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) {
      loadOAuthAccounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on user id only
  }, [user?.id]);

  async function loadOAuthAccounts() {
    try {
      const accounts = await api.getMyOAuthAccounts() as unknown as OAuthAccountExt[];
      setOauthAccounts(accounts);
    } catch (err) {
      console.error('Failed to load OAuth accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleToggleShow(account: OAuthAccountExt) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'toggling' }));
    try {
      const updated = await api.updateOAuthAccount(account.id, {
        show_on_profile: !account.show_on_profile,
      }) as unknown as OAuthAccountExt;
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      addToast(
        updated.show_on_profile ? '已設為在個人頁顯示' : '已取消在個人頁顯示',
        { type: 'success', duration: 3000 },
      );
    } catch (err: unknown) {
      addToast(`更新顯示設定失敗：${(err as Error).message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleSaveChannelUrl(account: OAuthAccountExt, url: string) {
    try {
      const updated = await api.updateOAuthAccount(account.id, {
        channel_url: url.trim() || null,
      }) as unknown as OAuthAccountExt;
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
    } catch (err: unknown) {
      addToast((err as Error).message, { type: 'error' });
    }
  }

  async function handleSetPrimary(account: OAuthAccountExt) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'settingPrimary' }));
    try {
      const updated = await api.updateMe({ primary_platform: account.provider } as Parameters<typeof api.updateMe>[0]);
      setUser(updated);
      addToast(`已將 ${PROVIDER_LABELS[account.provider]} 設為主要平台`, { type: 'success', duration: 3000 });
    } catch (err: unknown) {
      addToast(`設定主要平台失敗：${(err as Error).message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleUnlink(account: OAuthAccountExt) {
    if (!confirm(`確定要解除 ${PROVIDER_LABELS[account.provider]} 綁定嗎？`)) return;
    try {
      const result = await api.deleteOAuthAccount(account.id) as unknown as { ok: boolean; user?: User };
      setOauthAccounts(prev => prev.filter(a => a.id !== account.id));
      if (result.user) setUser(result.user);
    } catch (err: unknown) {
      addToast((err as Error).message, { type: 'error' });
    }
  }

  async function handleRefresh(account: OAuthAccountExt) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'refreshing' }));
    try {
      const updated = await api.refreshOAuthAccount(account.id) as unknown as OAuthAccountExt;
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      if (user?.primary_platform === account.provider && updated.provider_avatar_url) {
        setUser(prev => prev ? { ...prev, avatar_url: updated.provider_avatar_url } : prev);
      }
      addToast('已同步頭像與名稱', { type: 'success', duration: 3000 });
    } catch (err: unknown) {
      const errMsg = (err as Error).message;
      if (errMsg.includes('請重新登入') || errMsg.includes('授權已過期')) {
        const providerLabel = PROVIDER_LABELS[account.provider];
        if (confirm(`${providerLabel} 的驗證已過期，需要重新授權才能同步頭像與名稱。是否前往重新授權？`)) {
          const supabaseProvider = SUPABASE_PROVIDER_MAP[account.provider];
          sessionStorage.setItem('vtaxon_login_provider', supabaseProvider);
          await supabase.auth.signInWithOAuth({
            provider: supabaseProvider,
            options: {
              redirectTo: window.location.origin + '/profile?tab=account',
              ...(supabaseProvider === 'google'
                ? { scopes: 'https://www.googleapis.com/auth/youtube.readonly' }
                : {}),
            },
          });
        }
      } else {
        addToast(`同步頭像與名稱失敗：${errMsg}`, { type: 'error' });
      }
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  async function handleResubscribe(account: OAuthAccountExt) {
    setAccountLoading(prev => ({ ...prev, [account.id]: 'resubscribing' }));
    try {
      const updated = await api.resubscribe(account.id) as unknown as OAuthAccountExt;
      setOauthAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      if (updated.live_sub_status === 'subscribed') {
        addToast('直播訂閱已重新建立', { type: 'success', duration: 3000 });
      } else {
        addToast('直播訂閱仍然失敗，請稍後再試', { type: 'error' });
      }
    } catch (err: unknown) {
      addToast(`重新訂閱失敗：${(err as Error).message}`, { type: 'error' });
    } finally {
      setAccountLoading(prev => ({ ...prev, [account.id]: null }));
    }
  }

  function handleLink(provider: string) {
    const supabaseProvider = SUPABASE_PROVIDER_MAP[provider];
    linkProvider(supabaseProvider);
  }

  const boundProviders = new Set(oauthAccounts.map(a => a.provider));
  const unboundProviders = (['youtube', 'twitch'] as const).filter(p => !boundProviders.has(p));
  const isLastAccount = oauthAccounts.length <= 1;

  const ytAccount = oauthAccounts.find(a => a.provider === 'youtube');
  const showYtWarning = ytPermissionFailed
    || (ytAccount && !ytAccount.channel_url);

  const failedSubAccounts = oauthAccounts.filter(a =>
    a.live_sub_status === 'failed' && !(a.provider === 'youtube' && !a.channel_url)
  );

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
          isPrimary={user?.primary_platform === account.provider}
          onSetPrimary={() => handleSetPrimary(account)}
          onRefresh={() => handleRefresh(account)}
          onSaveUrl={(url: string) => handleSaveChannelUrl(account, url)}
          onToggleShow={() => handleToggleShow(account)}
          onUnlink={() => handleUnlink(account)}
          disableUnlink={isLastAccount}
          refreshing={accountLoading[account.id] === 'refreshing'}
          toggling={accountLoading[account.id] === 'toggling'}
          settingPrimary={accountLoading[account.id] === 'settingPrimary'}
        />
      ))}

      {showYtWarning && (
        <div style={{
          marginTop: 12, borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(234,179,8,0.35)',
          background: 'rgba(234,179,8,0.08)',
        }}>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '1em', fontWeight: 700, color: '#eab308', marginBottom: 6 }}>
              YouTube 頻道資料未授權
            </div>
            <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              VTaxon 無法取得您的 YouTube 頻道名稱與頭像。這通常是因為登入時未勾選「查看您的 YouTube 帳戶」權限。
            </div>
          </div>

          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
              請在登入畫面中勾選以下選項：
            </div>
            <img
              src="/help/yt-permission.png"
              alt='Google OAuth 授權畫面 — 勾選「查看您的 YouTube 帳戶」'
              style={{
                width: '100%', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(234,179,8,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '0.88em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              請登出後重新登入，並記得勾選此權限
            </div>
            <button
              onClick={signOut}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: '#fff', cursor: 'pointer',
                fontSize: '0.9em', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              登出並重新登入
            </button>
          </div>
        </div>
      )}

      {failedSubAccounts.map(account => (
        <div key={`sub-warn-${account.id}`} style={{
          marginTop: 12, borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(234,179,8,0.35)',
          background: 'rgba(234,179,8,0.08)',
        }}>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '1em', fontWeight: 700, color: '#eab308', marginBottom: 6 }}>
              {PROVIDER_LABELS[account.provider]} 直播通知訂閱失敗
            </div>
            <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              VTaxon 無法訂閱您的 {PROVIDER_LABELS[account.provider]} 頻道直播通知，直播狀態將無法自動更新。
            </div>
          </div>
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(234,179,8,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => handleResubscribe(account)}
              disabled={accountLoading[account.id] === 'resubscribing'}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#3b82f6', color: '#fff', cursor: accountLoading[account.id] === 'resubscribing' ? 'not-allowed' : 'pointer',
                fontSize: '0.9em', fontWeight: 600, whiteSpace: 'nowrap',
                opacity: accountLoading[account.id] === 'resubscribing' ? 0.6 : 1,
              }}
            >
              {accountLoading[account.id] === 'resubscribing' ? '訂閱中…' : '重新訂閱'}
            </button>
          </div>
        </div>
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

    </div>
  );
}
