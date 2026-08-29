import { useState, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'flag-icons/css/flag-icons.min.css';
import { formatDuration } from './DirectoryCard';
import OrgBadge from '../OrgBadge';
import { STATUS_STYLES, PlatformIcon } from './shared';
import type { DirectoryItem } from './shared';

interface DirectoryListItemProps {
  item: DirectoryItem;
  onClick?: (item: DirectoryItem) => void;
  isLive?: boolean;
}

// Shared grid template: avatar | name | platforms | org | species | debut | status | created | locate
export const LIST_GRID = '36px 1fr 50px minmax(100px, 180px) 1.2fr 90px 80px 90px 60px';

const DirectoryListItem = memo(function DirectoryListItem({ item, onClick, isLive }: DirectoryListItemProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const pd = (item.profile_data || {}) as Record<string, unknown>;
  const statusInfo = STATUS_STYLES[pd.activity_status as string];
  const countryFlags = item.country_flags || [];
  const speciesNames = item.species_names || [];

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/?locate=${item.id}`);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: LIST_GRID,
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: '0.85em',
      cursor: 'pointer',
    }}
      onClick={() => onClick?.(item)}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <div style={{
        padding: isLive ? 1 : 0,
        borderRadius: '50%',
        border: isLive ? '2px solid #ef4444' : 'none',
        boxShadow: isLive ? '0 0 6px rgba(239,68,68,0.3)' : 'none',
        width: 'fit-content',
      }}>
        {item.avatar_url && !imgError ? (
          <img
            src={item.avatar_url}
            alt={item.display_name}
            loading="lazy"
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `hsl(${(item.display_name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 55%, 55%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 'bold',
          }}>
            {(item.display_name || '?')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + flags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Link to={`/vtuber/${item.id}`}
          onClick={e => e.stopPropagation()}
          style={{
            fontWeight: 600, color: '#fff', textDecoration: 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#fff'}
        >
          {item.display_name}
        </Link>
        {isLive && (
          <span style={{
            padding: '0px 4px', borderRadius: 3,
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            fontSize: '0.7em', fontWeight: 700, letterSpacing: '0.5px',
            flexShrink: 0, lineHeight: '16px',
          }}>LIVE</span>
        )}
        {countryFlags.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
            {countryFlags.map(c => (
              <span
                key={c}
                className={`fi fi-${c.toLowerCase()}`}
                style={{ width: 14, height: 10, display: 'inline-block', borderRadius: 1 }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Platforms */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {(item.platforms || []).map(p => (
          <span key={p} title={p}><PlatformIcon platform={p} size={14} /></span>
        ))}
      </div>

      {/* Organization */}
      <div style={{ lineHeight: 1.3 }}>
        {(item.org_type === 'corporate' || item.org_type === 'club')
          ? <OrgBadge orgType={item.org_type} organization={item.organization} />
          : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.organization || '-'}</span>
        }
      </div>

      {/* Species */}
      <div
        title={speciesNames.length > 0 ? speciesNames.join(' · ') : undefined}
        style={{
          color: 'rgba(255,255,255,0.6)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {speciesNames.length > 0
          ? speciesNames.join(' · ')
          : <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>尚未標註</span>
        }
      </div>

      {/* Debut date */}
      <div style={{ color: 'rgba(255,255,255,0.4)' }}>
        {pd.debut_date ? (
          <>
            {pd.debut_date as string}
            {formatDuration(pd.debut_date as string) && (
              <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.25)' }}>
                {formatDuration(pd.debut_date as string)}
              </div>
            )}
          </>
        ) : '-'}
      </div>

      {/* Status */}
      <div>
        {statusInfo && (
          <span style={{
            background: statusInfo.bg, color: statusInfo.color,
            padding: '1px 6px', borderRadius: 8, fontSize: '0.9em',
            display: 'inline-flex', alignItems: 'center', gap: 3,
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: statusInfo.color, display: 'inline-block',
            }} />
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Created date */}
      <div style={{ color: 'rgba(255,255,255,0.4)' }}>
        {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-TW') : '-'}
      </div>

      {/* Locate */}
      <div>
        {item.has_traits && (
          <button
            type="button"
            onClick={handleLocate}
            title="在樹狀圖中定位"
            style={{
              background: 'rgba(212,160,23,0.08)',
              border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 6, padding: '3px 8px',
              color: '#D4A017', fontSize: '0.75em',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.25)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            </svg>
            定位
          </button>
        )}
      </div>
    </div>
  );
});

export default DirectoryListItem;
