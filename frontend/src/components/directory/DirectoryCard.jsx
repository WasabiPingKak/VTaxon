import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const STATUS_STYLES = {
  active: { label: '活動中', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  hiatus: { label: '休止中', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  preparing: { label: '準備中', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
};

const PLATFORM_ICONS = {
  youtube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f00">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>
    </svg>
  ),
  twitch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#9146ff">
      <path d="M11.6 11.2V6.8h-1.6v4.4h1.6Zm4.4 0V6.8h-1.6v4.4H16ZM4.8 1 2 4.6V19h5.6v3.4L11 19h3.4L22 11.4V1H4.8Zm15.6 9.8-3.4 3.4h-3.4l-3 3v-3H6.4V2.6h14v8.2Z"/>
    </svg>
  ),
};

/** 計算從日期到今天的活動時長 */
export function formatDuration(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  if (isNaN(start) || start > now) return null;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }

  if (years > 0 && months > 0) return `${years}年${months}個月`;
  if (years > 0) return `${years}年`;
  if (months > 0) return `${months}個月`;

  const days = Math.floor((now - start) / 86400000);
  return `${days}天`;
}

const dimStyle = { color: 'rgba(255,255,255,0.35)', fontSize: '0.78em' };

export default function DirectoryCard({ item, onClick }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const pd = item.profile_data || {};
  const statusInfo = STATUS_STYLES[pd.activity_status];
  const countryFlags = item.country_flags || [];
  const speciesNames = item.species_names || [];
  const maxShow = 3;

  const debutDate = pd.debut_date;
  const debutDuration = formatDuration(debutDate);
  const joinedDate = item.created_at ? item.created_at.slice(0, 10) : null;

  const handleLocate = (e) => {
    e.stopPropagation();
    navigate(`/?locate=${item.id}`);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.15s',
      cursor: 'pointer',
    }}
      onClick={() => onClick?.(item)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      {/* Top: avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {item.avatar_url && !imgError ? (
          <img
            src={item.avatar_url}
            alt={item.display_name}
            loading="lazy"
            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${(item.display_name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 55%, 55%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 'bold',
          }}>
            {(item.display_name || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: 600, fontSize: '0.95em', color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Link to={`/vtuber/${item.id}`}
              onClick={e => e.stopPropagation()}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'inherit', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
            >{item.display_name}</Link>
          </div>
          {countryFlags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
              {countryFlags.map(c => (
                <span
                  key={c}
                  className={`fi fi-${c.toLowerCase()}`}
                  style={{ width: 16, height: 12, display: 'inline-block', borderRadius: 2 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status + org */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.8em' }}>
        {statusInfo && (
          <span style={{
            background: statusInfo.bg, color: statusInfo.color,
            padding: '2px 8px', borderRadius: 10, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: statusInfo.color, display: 'inline-block',
            }} />
            {statusInfo.label}
          </span>
        )}
        {item.organization && (
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            {item.organization}
          </span>
        )}
      </div>

      {/* Debut date */}
      {debutDate && (
        <div style={dimStyle}>
          {debutDate} 出道{debutDuration && ` (${debutDuration})`}
        </div>
      )}

      {/* Species tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minHeight: 22 }}>
        {speciesNames.length > 0 ? (
          <>
            {speciesNames.slice(0, maxShow).map((name, i) => (
              <span key={i} style={{
                fontSize: '0.8em', color: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 7px', borderRadius: 6,
              }}>
                {name}
              </span>
            ))}
            {speciesNames.length > maxShow && (
              <span style={{ fontSize: '0.78em', color: 'rgba(255,255,255,0.4)' }}>
                +{speciesNames.length - maxShow}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
            尚未標註
          </span>
        )}
      </div>

      {/* Bottom: joined + platforms + locate */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(item.platforms || []).map(p => (
            <span key={p} title={p}>{PLATFORM_ICONS[p]}</span>
          ))}
          {joinedDate && (
            <span style={dimStyle}>{joinedDate} 建檔</span>
          )}
        </div>
        {item.has_traits && (
          <button
            type="button"
            onClick={handleLocate}
            title="在樹狀圖中定位"
            style={{
              background: 'rgba(233,30,140,0.08)',
              border: '1px solid rgba(233,30,140,0.25)',
              borderRadius: 6, padding: '3px 8px',
              color: '#E91E8C', fontSize: '0.75em',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.25)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            </svg>
            定位
          </button>
        )}
      </div>
    </div>
  );
}
