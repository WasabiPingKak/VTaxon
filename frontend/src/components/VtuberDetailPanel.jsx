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

/** Convert country code to flag emoji */
function flagEmoji(code) {
  const upper = code.toUpperCase();
  const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
  return String.fromCodePoint(...cp);
}

/** Links row: OAuth icons + SNS icons + flag emojis + optional loading spinner */
function LinksRow({ oauthAccounts, socialLinks, countryFlags, loading }) {
  const flagEmojis = (countryFlags || []).map(flagEmoji);
  const hasLinks = oauthAccounts.length > 0 || Object.keys(socialLinks || {}).length > 0;

  if (!hasLinks && flagEmojis.length === 0 && !loading) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', flexWrap: 'wrap',
    }}>
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

      {Object.entries(socialLinks || {}).map(([key, url]) => {
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

      {flagEmojis.length > 0 && (
        <>
          {hasLinks && (
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
          )}
          {flagEmojis.map((flag, i) => (
            <span key={i} style={{ fontSize: '1.1em' }}>{flag}</span>
          ))}
        </>
      )}

      {loading && (
        <span style={{
          display: 'inline-block', width: 14, height: 14,
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'vtaxonSpin 0.8s linear infinite',
        }} />
      )}
    </div>
  );
}

/** Indented taxonomy path */
function TaxonomyPath({ taxonPath, pathZh, commonNameZh, scientificName }) {
  const pathParts = (taxonPath || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = pathZh ? pathZh[rank] : undefined;
    return { rank, latin, zh };
  }).filter(r => r.latin);

  if (ranks.length === 0) return null;

  return (
    <div style={{ fontSize: '0.85em', lineHeight: '2' }}>
      {ranks.map((r, i) => (
        <div key={r.rank} style={{ paddingLeft: i * 12, display: 'flex', alignItems: 'center' }}>
          <RankBadge rank={RANK_TO_UPPER[r.rank]} style={{ fontSize: '0.7em' }} />
          <span>{r.zh ? `${r.zh} (${r.latin})` : r.latin}</span>
        </div>
      ))}
      <div style={{ paddingLeft: ranks.length * 12, fontWeight: 600 }}>
        {commonNameZh
          ? `${commonNameZh} (${scientificName})`
          : scientificName}
      </div>
    </div>
  );
}

/** Indented fictional species path */
function FictionalPath({ entry }) {
  const levels = [
    { rank: 'F_ORIGIN', label: entry.origin },
    entry.sub_origin ? { rank: 'F_SUB_ORIGIN', label: entry.sub_origin } : null,
    { rank: 'F_SPECIES', label: entry.fictional_name_zh || entry.fictional_name },
  ].filter(Boolean);

  return (
    <div style={{ fontSize: '0.85em', lineHeight: '2' }}>
      {levels.map((lv, i) => (
        <div key={lv.rank} style={{
          paddingLeft: i * 12, display: 'flex', alignItems: 'center',
          fontWeight: i === levels.length - 1 ? 600 : 400,
        }}>
          <RankBadge rank={lv.rank} style={{ fontSize: '0.7em' }} />
          <span>{lv.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function VtuberDetailPanel({ entry, allEntries, onClose, onFocus, onSwitchEntry }) {
  const [imgError, setImgError] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // Derive active tab index from current entry
  const activeIdx = (allEntries && allEntries.length > 1)
    ? Math.max(0, allEntries.findIndex(e => {
        if (e.fictional_path) {
          return e.fictional_path === entry.fictional_path
            && (e.fictional_species_id || '') === (entry.fictional_species_id || '');
        }
        return e.taxon_path === entry.taxon_path && (e.breed_id || '') === (entry.breed_id || '');
      }))
    : 0;

  const handleClose = useCallback(() => setClosing(true), []);
  const handleAnimEnd = useCallback((e) => {
    if (e.animationName === 'vtaxonSlideOut') { setClosing(false); onClose(); }
  }, [onClose]);

  if (!entry) return null;

  const oauthAccounts = userDetail?.oauth_accounts || [];
  const socialLinks = userDetail?.social_links || {};
  const bio = userDetail?.bio;

  return (
    <>
      <style>{`
        @keyframes vtaxonSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes vtaxonSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes vtaxonFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vtaxonFadeOut  { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose}
        onAnimationEnd={(e) => { if (e.animationName === 'vtaxonFadeOut') e.stopPropagation(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
          animation: closing
            ? `vtaxonFadeOut ${ANIM_DURATION_OUT}ms ease-in forwards`
            : `vtaxonFadeIn ${ANIM_DURATION_IN}ms ease-out forwards`,
        }}
      />

      {/* Panel */}
      <div onAnimationEnd={handleAnimEnd} style={{
        position: 'fixed', top: 44, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#0d1526', zIndex: 1000,
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0',
        animation: closing
          ? `vtaxonSlideOut ${ANIM_DURATION_OUT}ms ease-in forwards`
          : `vtaxonSlideIn ${ANIM_DURATION_IN}ms ease-out forwards`,
      }}>
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

        {/* Trait selector tabs */}
        {allEntries && allEntries.length > 1 && (
          <div style={{
            display: 'flex', gap: '6px', padding: '10px 20px 0', flexWrap: 'wrap',
          }}>
            {allEntries.map((e, i) => {
              const label = e.fictional_name_zh || e.common_name_zh || e.scientific_name || e.display_name;
              const active = i === activeIdx;
              const tabKey = e.fictional_path
                ? `F\0${e.fictional_path}\0${e.fictional_species_id || ''}`
                : `${e.taxon_path}\0${e.breed_id || ''}`;
              return (
                <button key={tabKey} type="button"
                  onClick={() => { if (!active && onSwitchEntry) onSwitchEntry(e); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em',
                    cursor: 'pointer', border: 'none',
                    background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                    fontWeight: active ? 600 : 400,
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            {entry.avatar_url && !imgError ? (
              <img src={entry.avatar_url} alt=""
                style={{ width: 80, height: 80, borderRadius: '50%' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', color: 'rgba(255,255,255,0.4)',
              }}>?</div>
            )}
          </div>

          {/* Display name */}
          <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 600, marginBottom: '10px' }}>
            {entry.display_name}
          </div>

          {/* Links row */}
          <div style={{ marginBottom: '16px' }}>
            <LinksRow
              oauthAccounts={oauthAccounts}
              socialLinks={socialLinks}
              countryFlags={entry.country_flags}
              loading={detailLoading}
            />
          </div>

          {/* Focus button */}
          {onFocus && (
            <div style={{ marginBottom: '16px' }}>
              <button type="button" onClick={() => { onFocus(entry); handleClose(); }} style={{
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

          {/* Bio */}
          {bio && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px',
              marginBottom: '16px', fontSize: '0.9em', lineHeight: '1.6',
              color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
            }}>
              {bio}
            </div>
          )}

          {/* Species info card */}
          {entry.fictional_species_id ? (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>虛構物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={labelStyle}>名稱</span>
                  {entry.fictional_name_zh || entry.fictional_name}
                  {entry.fictional_name_zh && entry.fictional_name && entry.fictional_name_zh !== entry.fictional_name && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>({entry.fictional_name})</span>
                  )}
                </div>
                <div>
                  <span style={labelStyle}>來源</span>
                  {entry.origin}
                </div>
                {entry.sub_origin && (
                  <div>
                    <span style={labelStyle}>子來源</span>
                    {entry.sub_origin}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={labelStyle}>學名</span>
                  {entry.scientific_name}
                </div>
                {entry.common_name_zh && (
                  <div>
                    <span style={labelStyle}>中文名</span>
                    {entry.common_name_zh}
                  </div>
                )}
                {entry.breed_name && (
                  <div>
                    <span style={labelStyle}>品種</span>
                    {entry.breed_name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Taxonomy / Fictional path card */}
          {entry.fictional_species_id ? (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <FictionalPath entry={entry} />
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <TaxonomyPath
                taxonPath={entry.taxon_path}
                pathZh={entry.path_zh}
                commonNameZh={entry.common_name_zh}
                scientificName={entry.scientific_name}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: 'inline-block', width: '50px',
  fontWeight: 500, color: 'rgba(255,255,255,0.45)',
};
