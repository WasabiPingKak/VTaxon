import { getZodiacSign } from '../lib/zodiac';

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  active: { label: '活動中', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  hiatus: { label: '活動休止', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  preparing: { label: '準備中', bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
};

function parseVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    // YouTube
    if (host.includes('youtube.com') || host === 'youtu.be') {
      let vid: string | undefined;
      if (host === 'youtu.be') vid = u.pathname.slice(1);
      else vid = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    // Twitch VOD
    if (host.includes('twitch.tv')) {
      const m = u.pathname.match(/\/videos\/(\d+)/);
      if (m) return `https://player.twitch.tv/?video=${m[1]}&parent=${window.location.hostname}`;
    }
  } catch { /* ignore */ }
  return null;
}

interface CreatorItem {
  name: string;
  url?: string;
}

interface CreatorListProps {
  items: (string | CreatorItem)[];
}

function CreatorList({ items }: CreatorListProps): React.ReactElement | null {
  if (!items || items.length === 0) return null;
  return (
    <span>
      {items.map((item, i) => {
        const name = typeof item === 'string' ? item : item.name;
        const url = typeof item === 'string' ? null : item.url;
        return (
          <span key={i}>
            {i > 0 && '、'}
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#93c5fd', textDecoration: 'none' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.textDecoration = 'none'; }}>
                {name}
              </a>
            ) : name}
          </span>
        );
      })}
    </span>
  );
}

interface ProfileData {
  activity_status?: string;
  gender?: string;
  birthday_month?: number | null;
  birthday_day?: number | null;
  blood_type?: string | null;
  mbti?: string | null;
  debut_date?: string | null;
  representative_emoji?: string;
  fan_name?: string;
  illustrators?: (string | CreatorItem)[];
  riggers?: (string | CreatorItem)[];
  modelers_3d?: (string | CreatorItem)[];
  hashtags?: string[];
  debut_video_url?: string;
  [key: string]: unknown;
}

interface ProfileInfoCardProps {
  profileData: ProfileData | null | undefined;
}

/**
 * Renders profile_data fields in the side panel.
 * Only shows fields that have values.
 */
export default function ProfileInfoCard({ profileData }: ProfileInfoCardProps): React.ReactElement | null {
  if (!profileData) return null;
  const pd = profileData;

  const status = pd.activity_status ? STATUS_MAP[pd.activity_status] : undefined;
  const zodiac = getZodiacSign(pd.birthday_month, pd.birthday_day);
  const hasBirthday = pd.birthday_month && pd.birthday_day;
  const hasBasicInfo = status || pd.gender || hasBirthday || pd.blood_type
    || pd.mbti || pd.debut_date || pd.representative_emoji || pd.fan_name;
  const hasCreators = ((pd.illustrators?.length ?? 0) > 0) || ((pd.riggers?.length ?? 0) > 0) || ((pd.modelers_3d?.length ?? 0) > 0);
  const hasHashtags = (pd.hashtags?.length ?? 0) > 0;
  const embedUrl = pd.debut_video_url ? parseVideoEmbed(pd.debut_video_url) : null;

  if (!hasBasicInfo && !hasCreators && !hasHashtags && !embedUrl) return null;

  return (
    <>
      {/* Basic info card */}
      {(hasBasicInfo || hasCreators || hasHashtags) && (
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>基本資訊</div>
          <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
            {/* Activity status */}
            {status && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={lblStyle}>狀態</span>
                <span style={{
                  padding: '1px 8px', borderRadius: '10px', fontSize: '0.85em',
                  background: status.bg, color: status.color,
                }}>{status.label}</span>
              </div>
            )}

            {/* Gender */}
            {pd.gender && (
              <div><span style={lblStyle}>性別</span>{pd.gender}</div>
            )}

            {/* Birthday + zodiac */}
            {hasBirthday && (
              <div>
                <span style={lblStyle}>生日</span>
                {pd.birthday_month}月{pd.birthday_day}日
                {zodiac && (
                  <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.5)' }}>
                    {zodiac.emoji} {zodiac.name}
                  </span>
                )}
              </div>
            )}

            {/* Blood type */}
            {pd.blood_type && (
              <div><span style={lblStyle}>血型</span>{pd.blood_type} 型</div>
            )}

            {/* MBTI */}
            {pd.mbti && (
              <div><span style={lblStyle}>MBTI</span>{pd.mbti}</div>
            )}

            {/* Debut date + duration */}
            {pd.debut_date && (
              <div>
                <span style={lblStyle}>初配信</span>{pd.debut_date}
                {(() => {
                  const d = new Date(pd.debut_date!);
                  const now = new Date();
                  if (isNaN(d.getTime()) || d > now) return null;
                  let y = now.getFullYear() - d.getFullYear();
                  let m = now.getMonth() - d.getMonth();
                  let dd = now.getDate() - d.getDate();
                  if (dd < 0) { m--; dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
                  if (m < 0) { y--; m += 12; }
                  const parts: string[] = [];
                  if (y > 0) parts.push(`${y} 年`);
                  if (m > 0) parts.push(`${m} 個月`);
                  parts.push(`${dd} 天`);
                  return (
                    <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>
                      ({parts.join(' ')})
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Representative emoji */}
            {pd.representative_emoji && (
              <div><span style={lblStyle}>Emoji</span>{pd.representative_emoji}</div>
            )}

            {/* Fan name */}
            {pd.fan_name && (
              <div><span style={lblStyle}>粉絲名</span>{pd.fan_name}</div>
            )}

            {/* Creators */}
            {hasCreators && (
              <>
                {(pd.illustrators?.length ?? 0) > 0 && (
                  <div><span style={lblStyle}>繪師</span><CreatorList items={pd.illustrators!} /></div>
                )}
                {(pd.riggers?.length ?? 0) > 0 && (
                  <div><span style={lblStyle}>建模</span><CreatorList items={pd.riggers!} /></div>
                )}
                {(pd.modelers_3d?.length ?? 0) > 0 && (
                  <div><span style={lblStyle}>3D 製作</span><CreatorList items={pd.modelers_3d!} /></div>
                )}
              </>
            )}

            {/* Hashtags */}
            {hasHashtags && (
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {pd.hashtags!.map((tag, i) => (
                  <span key={i} style={{
                    padding: '1px 8px', borderRadius: '10px', fontSize: '0.85em',
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video embed */}
      {embedUrl && (
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>初配信影片</div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '6px', overflow: 'hidden' }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}

const lblStyle: React.CSSProperties = {
  display: 'inline-block', width: '50px',
  fontWeight: 500, color: 'rgba(255,255,255,0.45)',
};
