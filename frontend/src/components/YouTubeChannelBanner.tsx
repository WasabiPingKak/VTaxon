import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import type { OAuthAccount } from '../types/models';

const LS_KEY = 'vtaxon_yt_channel_banner_dismissed';

export default function YouTubeChannelBanner(): React.ReactElement | null {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(LS_KEY) === 'true',
  );

  useEffect(() => {
    if (!user || dismissed) return;

    let cancelled = false;
    api.getMyOAuthAccounts().then((accounts: OAuthAccount[]) => {
      if (cancelled) return;
      const yt = accounts.find(a => a.provider === 'youtube');
      if (yt && !yt.channel_url) {
        setMissing(true);
      }
    }).catch(() => { /* non-critical */ });

    return () => { cancelled = true; };
  }, [user, dismissed]);

  if (!user || dismissed || !missing) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(LS_KEY, 'true');
  };

  const handleGoSettings = () => {
    navigate('/profile?tab=account');
  };

  return (
    <div style={bannerStyle}>
      <div style={contentStyle}>
        <span style={iconStyle}>⚠️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={textStyle}>
            你的 YouTube 頻道連結尚未取得，可能是登入時未勾選「查看您的 YouTube 帳戶」權限。
          </span>
        </div>
        <div style={actionsStyle}>
          <button onClick={handleGoSettings} style={linkBtnStyle}>
            前往設定
          </button>
          <button onClick={handleDismiss} style={closeBtnStyle} aria-label="關閉提示">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 44,
  left: 0,
  right: 0,
  zIndex: 99,
  background: 'rgba(234, 179, 8, 0.12)',
  borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
  backdropFilter: 'blur(8px)',
};

const contentStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const iconStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: '1.1em',
};

const textStyle: React.CSSProperties = {
  fontSize: '0.88em',
  color: 'rgba(255, 255, 255, 0.85)',
  lineHeight: 1.5,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};

const linkBtnStyle: React.CSSProperties = {
  padding: '5px 14px',
  borderRadius: 6,
  border: '1px solid rgba(234, 179, 8, 0.5)',
  background: 'rgba(234, 179, 8, 0.15)',
  color: '#eab308',
  fontSize: '0.85em',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.4)',
  cursor: 'pointer',
  padding: '4px 6px',
  fontSize: '1em',
  lineHeight: 1,
  borderRadius: 4,
};
