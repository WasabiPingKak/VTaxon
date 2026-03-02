import { useState } from 'react';
import RankBadge from './RankBadge';

export default function VtuberCard({ entry, isCurrentUser, onClick }) {
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
        border: isCurrentUser ? '2px solid #D4A017' : '1px solid #e0e0e0',
        background: isCurrentUser ? '#FFFDF5' : '#fff',
        cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.15s',
        boxShadow: 'none',
        maxWidth: '280px',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {entry.avatar_url && !imgError ? (
        <img
          src={entry.avatar_url} alt=""
          style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: '#999',
        }}>?</div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9em' }}>{entry.display_name}</span>
          {flags && <span style={{ fontSize: '0.85em' }}>{flags}</span>}
        </div>
        <div style={{ fontSize: '0.78em', color: '#888', marginTop: '1px' }}>
          {entry.breed_name || speciesLabel}
          {entry.breed_name && <span style={{ color: '#aaa' }}> ({speciesLabel})</span>}
          <RankBadge rank={entry.breed_name ? 'BREED' : entry.taxon_rank} style={{ marginLeft: '4px', fontSize: '0.7em' }} />
        </div>
      </div>
    </button>
  );
}
