import { useState, useEffect } from 'react';
import { YouTubeIcon, TwitchIcon } from './SnsIcons';
import type { Provider } from '../types';

interface PlatformIconLinkProps {
  provider: Provider;
  channelUrl: string | null;
  size?: number;
}

function PlatformIconLink({ provider, channelUrl, size = 20 }: PlatformIconLinkProps) {
  const icon = provider === 'youtube' ? <YouTubeIcon size={size} />
    : provider === 'twitch' ? <TwitchIcon size={size} />
    : null;

  if (!icon) return null;

  if (channelUrl) {
    return (
      <a href={channelUrl} target="_blank" rel="noopener noreferrer"
        title={channelUrl}
        style={{ display: 'inline-flex', lineHeight: 0, flexShrink: 0 }}>
        {icon}
      </a>
    );
  }

  return <span style={{ display: 'inline-flex', lineHeight: 0, flexShrink: 0 }}>{icon}</span>;
}

interface AvatarFallbackProps {
  provider: Provider;
  size: number;
}

function AvatarFallback({ provider, size }: AvatarFallbackProps) {
  const colors: Record<string, string> = { youtube: '#FF0000', twitch: '#9146FF' };
  const letters: Record<string, string> = { youtube: 'Y', twitch: 'T' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[provider] || 'rgba(255,255,255,0.2)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 'bold', flexShrink: 0,
    }}>
      {letters[provider] || '?'}
    </div>
  );
}

export interface ChannelCardAccount {
  id: string;
  provider: Provider;
  provider_account_id: string;
  provider_display_name?: string;
  provider_avatar_url?: string | null;
  channel_url: string | null;
  show_on_profile: boolean;
  live_sub_status?: string;
}

export interface ChannelCardProps {
  account: ChannelCardAccount;
  mode?: 'compact' | 'full';
  isPrimary?: boolean;
  onSetPrimary?: () => void;
  onRefresh?: () => void;
  onSaveUrl?: (url: string) => void;
  onToggleShow?: () => void;
  onUnlink?: () => void;
  disableUnlink?: boolean;
  refreshing?: boolean;
  toggling?: boolean;
  settingPrimary?: boolean;
}

export default function ChannelCard({
  account, mode = 'compact',
  isPrimary = false, onSetPrimary, onRefresh,
  onSaveUrl, onToggleShow, onUnlink, disableUnlink,
  refreshing = false, toggling = false, settingPrimary = false,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account.channel_url || '');

  useEffect(() => { setDraft(account.channel_url || ''); }, [account.channel_url]);

  const avatarSize = mode === 'full' ? 40 : 32;
  const displayName = account.provider_display_name || account.provider_account_id;

  const avatar = account.provider_avatar_url && !imgError ? (
    <img
      src={account.provider_avatar_url} alt={displayName}
      loading="lazy"
      style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', flexShrink: 0 }}
      onError={() => setImgError(true)}
    />
  ) : (
    <AvatarFallback provider={account.provider} size={avatarSize} />
  );

  const primaryBadge = isPrimary ? (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
      background: 'rgba(233,30,140,0.15)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.3)',
      fontSize: '0.72em', fontWeight: '600', lineHeight: '1.4',
    }}>
      ★ 主要
    </span>
  ) : null;

  if (mode === 'compact') {
    return (
      <div style={{
        border: isPrimary ? '2px solid rgba(244,114,182,0.3)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '10px 12px',
        background: isPrimary ? 'rgba(233,30,140,0.06)' : '#141c2b', display: 'inline-block',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {avatar}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95em', color: '#e2e8f0' }}>{displayName}</span>
            <PlatformIconLink provider={account.provider} channelUrl={account.channel_url} size={16} />
            {primaryBadge}
          </div>
        </div>
      </div>
    );
  }

  // full mode
  return (
    <div style={{
      border: isPrimary ? '2px solid rgba(244,114,182,0.3)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '12px',
      marginBottom: '8px', background: isPrimary ? 'rgba(233,30,140,0.06)' : '#141c2b', position: 'relative',
    }}>
      {/* Row 1: avatar + name + icon + badges + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{displayName}</span>
            <PlatformIconLink provider={account.provider} channelUrl={account.channel_url} size={18} />
            {primaryBadge}
            {!isPrimary && onSetPrimary && (
              <button type="button" onClick={onSetPrimary}
                disabled={settingPrimary}
                style={{
                  padding: '1px 8px', borderRadius: '3px',
                  background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                  cursor: settingPrimary ? 'not-allowed' : 'pointer',
                  fontSize: '0.72em', color: 'rgba(255,255,255,0.6)',
                  lineHeight: '1.4', opacity: settingPrimary ? 0.5 : 1,
                }}>
                {settingPrimary ? '設定中…' : '設為主要'}
              </button>
            )}
            {onRefresh && (
              <button type="button" onClick={onRefresh}
                disabled={refreshing}
                title="同步平台資料"
                style={{
                  padding: '1px 8px', borderRadius: '3px',
                  background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '0.72em', color: 'rgba(255,255,255,0.6)',
                  lineHeight: '1.4', opacity: refreshing ? 0.5 : 1,
                }}>
                {refreshing ? '同步中…' : '同步'}
              </button>
            )}
          </div>
        </div>
        {onUnlink && (
          <button type="button" onClick={onUnlink}
            disabled={disableUnlink}
            title={disableUnlink ? '無法解除最後一個綁定帳號' : '解除綁定'}
            style={{
              background: 'none', border: 'none',
              cursor: disableUnlink ? 'not-allowed' : 'pointer',
              color: disableUnlink ? 'rgba(255,255,255,0.2)' : '#f87171',
              fontSize: '1.2em', padding: '4px', lineHeight: 1,
            }}>
            ✕
          </button>
        )}
      </div>

      {/* Row 2: channel_url edit + show_on_profile */}
      <div style={{ marginTop: '6px', marginLeft: avatarSize + 10 }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="url" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://..."
              autoComplete="new-password"
              style={{
                flex: 1, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
                background: '#1a2433', color: '#e2e8f0',
              }}
            />
            <button type="button" onClick={() => { onSaveUrl?.(draft); setEditing(false); }}
              style={miniBtn}>儲存</button>
            <button type="button" onClick={() => { setDraft(account.channel_url || ''); setEditing(false); }}
              style={{ ...miniBtn, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}>取消</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {account.channel_url ? (
              <a href={account.channel_url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9em', textDecoration: 'none', wordBreak: 'break-all' }}
                onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.textDecoration = 'none'}>
                {account.channel_url}
              </a>
            ) : (
              <span style={{ color: account.provider === 'youtube' ? '#f6ad55' : 'rgba(255,255,255,0.3)', fontSize: '0.9em' }}>
                {account.provider === 'youtube' ? '⚠ 未取得 YouTube 頻道資訊，請重新授權' : '未設定頻道連結'}
              </span>
            )}
            <button type="button" onClick={() => setEditing(true)}
              title="編輯頻道連結"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '1em', color: 'rgba(255,255,255,0.5)' }}>
              ✏️
            </button>
          </div>
        )}

        {account.live_sub_status === 'subscribed' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px',
          }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e', flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.5)' }}>
              直播通知已啟用
            </span>
          </div>
        )}

        {onToggleShow && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
            cursor: toggling ? 'not-allowed' : 'pointer', opacity: toggling ? 0.5 : 1,
          }}>
            <input type="checkbox" checked={account.show_on_profile}
              onChange={onToggleShow} disabled={toggling} />
            <span style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>
              {toggling ? '更新中…' : '在個人頁顯示'}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  padding: '4px 10px', border: 'none', borderRadius: '4px',
  cursor: 'pointer', fontSize: '0.85em', background: '#38bdf8', color: '#0d1526',
};
