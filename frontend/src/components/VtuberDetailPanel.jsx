import { useState } from 'react';
import { Link } from 'react-router-dom';
import RankBadge from './RankBadge';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

export default function VtuberDetailPanel({ entry, onClose }) {
  const [imgError, setImgError] = useState(false);

  if (!entry) return null;

  const pathParts = (entry.taxon_path || '').split('|');
  const pathZh = entry.path_zh || {};

  const flags = (entry.country_flags || [])
    .map(c => {
      const upper = c.toUpperCase();
      const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
      return String.fromCodePoint(...cp);
    })
    .join(' ');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#0d1526', zIndex: 1000,
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        color: '#e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>Vtuber 詳情</span>
          <button type="button" onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.4em',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Avatar + name */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
            <div style={{ marginTop: '10px', fontSize: '1.2em', fontWeight: 600 }}>
              {entry.display_name} {flags}
            </div>
          </div>

          {/* Species info */}
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

          {/* Taxonomy path */}
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to={`/kinship/${entry.user_id}`} style={{
              display: 'inline-block', textDecoration: 'none',
              padding: '8px 16px', borderRadius: '6px',
              fontSize: '0.9em', textAlign: 'center',
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
            }}>
              查看親緣關係
            </Link>
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
