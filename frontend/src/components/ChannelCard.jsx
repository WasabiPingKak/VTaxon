import { useState, useEffect } from 'react';

function YouTubeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/>
    </svg>
  );
}

function TwitchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M11.571 4.714h1.715v5.143H11.57V4.714zm4.715 0H18v5.143h-1.714V4.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z" fill="#9146FF"/>
    </svg>
  );
}

function PlatformIconLink({ provider, channelUrl, size = 20 }) {
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

function AvatarFallback({ provider, size }) {
  const colors = { youtube: '#FF0000', twitch: '#9146FF' };
  const letters = { youtube: 'Y', twitch: 'T' };
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

export default function ChannelCard({
  account, mode = 'compact',
  isPrimary = false, onSetPrimary, onRefresh,
  onSaveUrl, onToggleShow, onUnlink, disableUnlink,
  refreshing = false, toggling = false, settingPrimary = false,
}) {
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account.channel_url || '');

  useEffect(() => { setDraft(account.channel_url || ''); }, [account.channel_url]);

  const avatarSize = mode === 'full' ? 40 : 32;

  const avatar = account.provider_avatar_url && !imgError ? (
    <img
      src={account.provider_avatar_url} alt=""
      style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', flexShrink: 0 }}
      onError={() => setImgError(true)}
    />
  ) : (
    <AvatarFallback provider={account.provider} size={avatarSize} />
  );

  const displayName = account.provider_display_name || account.provider_account_id;

  const primaryBadge = isPrimary ? (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
      background: 'rgba(212,160,23,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)',
      fontSize: '0.72em', fontWeight: '600', lineHeight: '1.4',
    }}>
      ★ 主要
    </span>
  ) : null;

  if (mode === 'compact') {
    return (
      <div style={{
        border: isPrimary ? '2px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '10px 12px',
        background: isPrimary ? 'rgba(212,160,23,0.06)' : '#141c2b', display: 'inline-block',
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
      border: isPrimary ? '2px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '12px',
      marginBottom: '8px', background: isPrimary ? 'rgba(212,160,23,0.06)' : '#141c2b', position: 'relative',
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
            <span style={{ color: account.channel_url ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', fontSize: '0.9em' }}>
              {account.channel_url ? '已設定頻道連結' : '未設定頻道連結'}
            </span>
            <button type="button" onClick={() => setEditing(true)}
              title="編輯頻道連結"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '1em', color: 'rgba(255,255,255,0.5)' }}>
              ✏️
            </button>
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

const miniBtn = {
  padding: '4px 10px', border: 'none', borderRadius: '4px',
  cursor: 'pointer', fontSize: '0.85em', background: '#38bdf8', color: '#0d1526',
};
