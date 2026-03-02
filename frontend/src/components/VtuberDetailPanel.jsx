import { useState, useEffect, useCallback } from 'react';
import RankBadge from './RankBadge';
import { YouTubeIcon, TwitchIcon, SNS_ICON_MAP, SNS_LABELS } from './SnsIcons';
import { api } from '../lib/api';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

const ANIM_DURATION_IN = 300;
const ANIM_DURATION_OUT = 250;

export default function VtuberDetailPanel({ entry, onClose, onFocus }) {
  const [imgError, setImgError] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch full user details when panel opens
  useEffect(() => {
    if (!entry?.user_id) return;
    setImgError(false);
    setUserDetail(null);
    setDetailLoading(true);
    let cancelled = false;
    api.getUser(entry.user_id)
      .then(data => { if (!cancelled) setUserDetail(data); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [entry?.user_id]);

  const handleClose = useCallback(() => {
    setClosing(true);
  }, []);

  const handleAnimEnd = useCallback((e) => {
    if (e.animationName === 'vtaxonSlideOut') {
      setClosing(false);
      onClose();
    }
  }, [onClose]);

  if (!entry) return null;

  const pathParts = (entry.taxon_path || '').split('|');
  const pathZh = entry.path_zh || {};

  // Country flags as emoji
  const flagEmojis = (entry.country_flags || []).map(c => {
    const upper = c.toUpperCase();
    const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
    return String.fromCodePoint(...cp);
  });

  // OAuth accounts (from fetched detail)
  const oauthAccounts = (userDetail?.oauth_accounts || []);
  const socialLinks = userDetail?.social_links || {};
  const bio = userDetail?.bio;

  return (
    <>
      <style>{`
        @keyframes vtaxonSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes vtaxonSlideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes vtaxonFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vtaxonFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        onAnimationEnd={(e) => {
          if (e.animationName === 'vtaxonFadeOut') e.stopPropagation();
        }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          animation: closing
            ? `vtaxonFadeOut ${ANIM_DURATION_OUT}ms ease-in forwards`
            : `vtaxonFadeIn ${ANIM_DURATION_IN}ms ease-out forwards`,
        }}
      />

      {/* Panel */}
      <div
        onAnimationEnd={handleAnimEnd}
        style={{
          position: 'fixed', top: 44, right: 0, bottom: 0,
          width: '360px', maxWidth: '90vw',
          background: '#0d1526', zIndex: 1000,
          boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
          animation: closing
            ? `vtaxonSlideOut ${ANIM_DURATION_OUT}ms ease-in forwards`
            : `vtaxonSlideIn ${ANIM_DURATION_IN}ms ease-out forwards`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>Vtuber 詳情</span>
          <button type="button" onClick={handleClose} style={{
            background: 'none', border: 'none', fontSize: '1.4em',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* 1. Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            {entry.avatar_url && !imgError ? (
              <img
                src={entry.avatar_url} alt=""
                style={{ width: 80, height: 80, borderRadius: '50%' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '32px',
                color: 'rgba(255,255,255,0.4)',
              }}>?</div>
            )}
          </div>

          {/* 2. Display name */}
          <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 600, marginBottom: '10px' }}>
            {entry.display_name}
          </div>

          {/* 3. Links row: OAuth + SNS + flags */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', flexWrap: 'wrap', marginBottom: '16px',
          }}>
            {/* OAuth platform links */}
            {oauthAccounts.map(a => {
              const Icon = a.provider === 'youtube' ? YouTubeIcon
                : a.provider === 'twitch' ? TwitchIcon : null;
              if (!Icon) return null;
              return a.channel_url ? (
                <a key={a.id} href={a.channel_url} target="_blank" rel="noopener noreferrer"
                  title={`${a.provider_display_name || a.provider} 頻道`}
                  style={{ display: 'inline-flex', lineHeight: 0 }}>
                  <Icon size={18} />
                </a>
              ) : (
                <span key={a.id} title={a.provider_display_name || a.provider}
                  style={{ display: 'inline-flex', lineHeight: 0, opacity: 0.5 }}>
                  <Icon size={18} />
                </span>
              );
            })}

            {/* SNS links */}
            {Object.entries(socialLinks).map(([key, url]) => {
              const Icon = SNS_ICON_MAP[key];
              if (!Icon || !url) return null;
              return (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  title={SNS_LABELS[key] || key}
                  style={{ display: 'inline-flex', lineHeight: 0 }}>
                  <Icon size={18} />
                </a>
              );
            })}

            {/* Separator + flags */}
            {flagEmojis.length > 0 && (
              <>
                {(oauthAccounts.length > 0 || Object.keys(socialLinks).length > 0) && (
                  <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
                )}
                {flagEmojis.map((flag, i) => (
                  <span key={i} style={{ fontSize: '1.1em' }}>{flag}</span>
                ))}
              </>
            )}

            {/* Loading indicator for detail */}
            {detailLoading && (
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'vtaxonSpin 0.8s linear infinite',
              }} />
            )}
          </div>

          {/* 4. Focus tracking button */}
          {onFocus && (
            <div style={{ marginBottom: '16px' }}>
              <button type="button" onClick={() => { onFocus(entry.user_id); handleClose(); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '8px 16px', borderRadius: '6px',
                fontSize: '0.9em',
                background: 'rgba(255,107,53,0.15)',
                color: '#FF6B35',
                border: '1px solid rgba(255,107,53,0.3)',
                cursor: 'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                </svg>
                在樹狀圖中定位
              </button>
            </div>
          )}

          {/* 5. Bio */}
          {bio && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px',
              marginBottom: '16px', fontSize: '0.9em', lineHeight: '1.6',
              color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
            }}>
              {bio}
            </div>
          )}

          {/* 6. Species info */}
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>物種資訊</div>
            <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
              <div>
                <span style={{ ...labelStyle, color: 'rgba(255,255,255,0.45)' }}>學名</span>
                {entry.scientific_name}
              </div>
              {entry.common_name_zh && (
                <div>
                  <span style={{ ...labelStyle, color: 'rgba(255,255,255,0.45)' }}>中文名</span>
                  {entry.common_name_zh}
                </div>
              )}
              {entry.breed_name && (
                <div>
                  <span style={{ ...labelStyle, color: 'rgba(255,255,255,0.45)' }}>品種</span>
                  {entry.breed_name}
                </div>
              )}
            </div>
          </div>

          {/* 7. Taxonomy path */}
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
            <div style={{ fontSize: '0.85em', lineHeight: '2' }}>
              {RANK_ORDER.map((rank, i) => {
                const latin = pathParts[i];
                const zh = pathZh[rank];
                if (!latin) return null;
                return (
                  <div key={rank} style={{ paddingLeft: i * 12, display: 'flex', alignItems: 'center' }}>
                    <RankBadge rank={RANK_TO_UPPER[rank]} style={{ fontSize: '0.7em' }} />
                    <span>{zh ? `${zh} (${latin})` : latin}</span>
                  </div>
                );
              })}
              <div style={{ paddingLeft: RANK_ORDER.length * 12, fontWeight: 600 }}>
                {entry.common_name_zh
                  ? `${entry.common_name_zh} (${entry.scientific_name})`
                  : entry.scientific_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: 'inline-block', width: '50px',
  fontWeight: 500,
};
