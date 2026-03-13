import { useState, memo } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import RankBadge from './RankBadge';
import { YouTubeIcon, TwitchIcon } from './SnsIcons';
import { displayScientificName } from '../lib/speciesName';

// Inject live-pulse keyframe once
let _livePulseInjected = false;
function ensureLivePulseKeyframe() {
  if (_livePulseInjected || typeof document === 'undefined') return;
  _livePulseInjected = true;
  const style = document.createElement('style');
  style.textContent = `@keyframes vtaxon-live-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`;
  document.head.appendChild(style);
}

const VtuberCard = memo(function VtuberCard({ entry, isCurrentUser, isLive, onClick, activeFilterBadges, sortBadge }) {
  if (isLive) ensureLivePulseKeyframe();
  const [imgError, setImgError] = useState(false);

  const flags = (entry.country_flags || [])
    .map(c => {
      const upper = c.toUpperCase();
      const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
      return String.fromCodePoint(...cp);
    })
    .join(' ');

  const speciesLabel = entry.common_name_zh || displayScientificName(entry);

  return (
    <button
      type="button"
      onClick={onClick}
      {...(isCurrentUser ? { 'data-user-node': 'true' } : {})}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 10px', borderRadius: '8px',
        border: isLive ? '2px solid #ef4444' : isCurrentUser ? '2px solid #E91E8C' : '1px solid rgba(255,255,255,0.1)',
        background: isLive ? 'rgba(239,68,68,0.08)' : isCurrentUser ? 'rgba(233,30,140,0.1)' : '#141c2b',
        color: '#e2e8f0',
        cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.15s',
        boxShadow: isLive ? '0 0 8px rgba(239,68,68,0.15)' : 'none',
        maxWidth: '280px',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = isLive ? '0 2px 16px rgba(239,68,68,0.3)' : '0 2px 12px rgba(56,189,248,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isLive ? '0 0 8px rgba(239,68,68,0.15)' : 'none'; }}
    >
      {entry.avatar_url && !imgError ? (
        <img
          src={entry.avatar_url} alt={entry.display_name}
          loading="lazy"
          style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: 'rgba(255,255,255,0.4)',
        }}>?</div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9em', color: '#e2e8f0' }}>{entry.display_name}</span>
          {isLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: '0.65em', fontWeight: 700, color: '#ef4444',
              lineHeight: 1,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#ef4444',
                animation: 'vtaxon-live-pulse 1.5s ease-in-out infinite',
                flexShrink: 0,
              }} />
              直播中
            </span>
          )}
          {flags && <span style={{ fontSize: '0.85em' }}>{flags}</span>}
        </div>
        <div style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>
          {entry.breed_name || speciesLabel}
          {entry.breed_name && <span style={{ color: 'rgba(255,255,255,0.35)' }}> ({speciesLabel})</span>}
          <RankBadge rank={entry.breed_name ? 'BREED' : entry.taxon_rank} style={{ marginLeft: '4px', fontSize: '0.7em' }} />
        </div>
        {((activeFilterBadges && activeFilterBadges.length > 0) || sortBadge) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px', alignItems: 'center' }}>
            {activeFilterBadges && activeFilterBadges.map((b, i) =>
              b.isCountry && b.countryCode ? (
                <span key={i} style={{
                  padding: '1px 3px', borderRadius: 3, background: b.bg,
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  <span className={`fi fi-${b.countryCode.toLowerCase()}`}
                    style={{ width: 16, height: 12, display: 'inline-block', borderRadius: 1 }} />
                </span>
              ) : b.isPlatform ? (
                <span key={i} style={{
                  padding: '1px 3px', borderRadius: 3, background: b.bg,
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  {b.platform === 'youtube' ? <YouTubeIcon size={12} /> : <TwitchIcon size={12} />}
                </span>
              ) : (
                <span key={i} style={{
                  fontSize: '0.65em', padding: '1px 4px', borderRadius: 4,
                  color: b.color, background: b.bg,
                  lineHeight: 1.4, whiteSpace: 'nowrap',
                }}>{b.label}</span>
              )
            )}
            {sortBadge && [].concat(sortBadge).map((b, i) =>
              b.isCountry && b.countryCode ? (
                <span key={`s${i}`} style={{
                  padding: '1px 3px', borderRadius: 3, background: b.bg,
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  <span className={`fi fi-${b.countryCode.toLowerCase()}`}
                    style={{ width: 16, height: 12, display: 'inline-block', borderRadius: 1 }} />
                </span>
              ) : (
                <span key={`s${i}`} style={{
                  fontSize: '0.65em', padding: '1px 4px', borderRadius: 4,
                  color: b.color, background: b.bg,
                  lineHeight: 1.4, whiteSpace: 'nowrap',
                }}>{b.label}</span>
              )
            )}
          </div>
        )}
      </div>
    </button>
  );
});

export default VtuberCard;
