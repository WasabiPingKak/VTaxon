import { useState } from 'react';
import RankBadge from './RankBadge';
import { YouTubeIcon, TwitchIcon } from './SnsIcons';

export default function VtuberCard({ entry, isCurrentUser, onClick, activeFilterBadges, sortBadge }) {
  const [imgError, setImgError] = useState(false);

  const flags = (entry.country_flags || [])
    .map(c => {
      const upper = c.toUpperCase();
      const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
      return String.fromCodePoint(...cp);
    })
    .join(' ');

  const speciesLabel = entry.common_name_zh || entry.scientific_name;

  return (
    <button
      type="button"
      onClick={onClick}
      {...(isCurrentUser ? { 'data-user-node': 'true' } : {})}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 10px', borderRadius: '8px',
        border: isCurrentUser ? '2px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
        background: isCurrentUser ? 'rgba(212,160,23,0.1)' : '#141c2b',
        color: '#e2e8f0',
        cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.15s',
        boxShadow: 'none',
        maxWidth: '280px',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(56,189,248,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
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
}
