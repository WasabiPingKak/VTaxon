import { useState, memo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'flag-icons/css/flag-icons.min.css';
import OrgBadge from '../OrgBadge';
import { STATUS_STYLES, PlatformIcon } from './shared';
import type { DirectoryItem } from './shared';

interface CreditLineProps {
  label: string;
  items: Array<{ name: string; url?: string }> | null | undefined;
}

/** 計算從日期到今天的活動時長 */
export function formatDuration(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) return null;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }

  if (years > 0 && months > 0) return `${years}年${months}個月`;
  if (years > 0) return `${years}年`;
  if (months > 0) return `${months}個月`;

  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return `${days}天`;
}

const dimStyle: CSSProperties = { color: 'rgba(255,255,255,0.35)', fontSize: '0.78em' };
const creditLinkStyle: CSSProperties = { color: 'rgba(255,255,255,0.55)', textDecoration: 'none' };

function CreditLine({ label, items }: CreditLineProps) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ ...dimStyle, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      <span>{label}：</span>
      {items.map((p, i) => (
        <span key={i}>
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={creditLinkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >{p.name}</a>
          ) : p.name}
          {i < items.length - 1 && '、'}
        </span>
      ))}
    </div>
  );
}

interface DirectoryCardProps {
  item: DirectoryItem;
  onClick?: (item: DirectoryItem) => void;
  isLive?: boolean;
}

const DirectoryCard = memo(function DirectoryCard({ item, onClick, isLive }: DirectoryCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const pd = (item.profile_data || {}) as Record<string, unknown>;
  const statusInfo = STATUS_STYLES[pd.activity_status as string];
  const countryFlags = item.country_flags || [];
  const speciesNames = item.species_names || [];
  const maxShow = 3;

  const debutDate = pd.debut_date as string | undefined;
  const debutDuration = formatDuration(debutDate ?? null);
  const joinedDate = item.created_at ? new Date(item.created_at).toLocaleDateString('zh-TW') : null;

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/?locate=${item.id}`);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isLive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.15s',
      cursor: 'pointer',
    }}
      onClick={() => onClick?.(item)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'; }}
    >
      {/* Top: avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          position: 'relative', flexShrink: 0,
          padding: isLive ? 2 : 0,
          borderRadius: '50%',
          border: isLive ? '2px solid #ef4444' : 'none',
          boxShadow: isLive ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
        }}>
          {item.avatar_url && !imgError ? (
            <img
              src={item.avatar_url}
              alt={item.display_name}
              loading="lazy"
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `hsl(${(item.display_name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 55%, 55%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 20, fontWeight: 'bold',
            }}>
              {(item.display_name || '?')[0].toUpperCase()}
            </div>
          )}
          {isLive && (
            <span style={{
              position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
              padding: '0px 5px', borderRadius: '3px',
              background: '#ef4444', color: '#fff',
              fontSize: '0.55em', fontWeight: 700, letterSpacing: '0.5px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              lineHeight: '14px',
            }}>LIVE</span>
          )}
        </div>
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
        <OrgBadge orgType={item.org_type} organization={item.organization} style={{ display: 'inline' }} />
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

      {/* Credits: illustrator / rigger / 3D modeler */}
      <CreditLine label="繪師" items={pd.illustrators as CreditLineProps['items']} />
      <CreditLine label="建模" items={pd.riggers as CreditLineProps['items']} />
      <CreditLine label="3D 製作" items={pd.modelers_3d as CreditLineProps['items']} />

      {/* Bottom: joined + platforms + locate */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(item.platforms || []).map(p => (
            <span key={p} title={p}><PlatformIcon platform={p} size={16} /></span>
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
              background: 'rgba(212,160,23,0.08)',
              border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 6, padding: '3px 8px',
              color: '#D4A017', fontSize: '0.75em',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.25)'; }}
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
});

export default DirectoryCard;
