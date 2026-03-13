import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import SEOHead, { SITE_URL } from '../components/SEOHead';
import LinksRow from '../components/LinksRow';
import OrgBadge from '../components/OrgBadge';
import RankBadge from '../components/RankBadge';
import ProfileInfoCard from '../components/ProfileInfoCard';
import { displayScientificName } from '../lib/speciesName';
import { YouTubeIcon, TwitchIcon } from '../components/SnsIcons';
import useLiveStatus from '../hooks/useLiveStatus';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

function TaxonomyPath({ trait }) {
  const sp = trait.species;
  if (!sp) return null;

  const pathParts = (sp.taxon_path || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = sp[`${rank}_zh`];
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
        {sp.common_name_zh
          ? `${sp.common_name_zh} (${displayScientificName(sp)})`
          : displayScientificName(sp)}
      </div>
      {trait.breed_name && (
        <div style={{ paddingLeft: (ranks.length + 1) * 12, color: '#fb923c' }}>
          <RankBadge rank="BREED" style={{ fontSize: '0.7em' }} />
          {trait.breed_name}
        </div>
      )}
    </div>
  );
}

function FictionalPath({ trait }) {
  const f = trait.fictional;
  if (!f) return null;

  const levels = [
    { rank: 'F_ORIGIN', label: f.origin },
    f.sub_origin ? { rank: 'F_SUB_ORIGIN', label: f.sub_origin } : null,
    { rank: 'F_SPECIES', label: f.name_zh || f.name },
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

export default function VTuberProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { liveUserIds, liveStreams } = useLiveStatus();
  const [user, setUser] = useState(null);
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getUser(userId),
      api.getTraits(userId),
    ])
      .then(([userData, traitsData]) => {
        if (cancelled) return;
        setUser(userData);
        setTraits(traitsData.traits || []);
      })
      .catch(err => {
        if (!cancelled) setError(err.message || '載入失敗');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <SEOHead title="載入中" noindex />
        <div style={{
          width: 32, height: 32, margin: '0 auto 16px',
          border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8',
          borderRadius: '50%', animation: 'vtaxonSpin 0.8s linear infinite',
        }} />
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>載入中…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <SEOHead title="找不到使用者" noindex />
        <div style={{ fontSize: '2em', marginBottom: 12 }}>404</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          {error || '找不到此使用者'}
        </div>
        <Link to="/directory" style={{ color: '#38bdf8' }}>返回圖鑑</Link>
      </div>
    );
  }

  const oauthAccounts = user.oauth_accounts || [];
  const realTraits = traits.filter(t => t.taxon_id && !t.fictional_species_id);
  const fictionalTraits = traits.filter(t => t.fictional_species_id);
  const speciesNames = traits.map(t => t.display_name).filter(Boolean).join('、');

  // Build sameAs from oauth channel URLs
  const sameAs = oauthAccounts
    .map(a => a.channel_url)
    .filter(Boolean);
  Object.values(user.social_links || {}).forEach(url => {
    if (url && !url.includes('@')) sameAs.push(url);
  });

  const isLive = liveUserIds.has(userId);
  const liveInfos = isLive ? (liveStreams.get(userId) || []) : [];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px' }}>
      <style>{`
        @keyframes vtaxon-live-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>
      <SEOHead
        title={user.display_name}
        description={
          user.bio
            ? `${user.display_name} — ${user.bio.slice(0, 120).replace(/\n/g, ' ')}${user.bio.length > 120 ? '…' : ''}`
            : speciesNames
              ? `${user.display_name} 的 VTuber 角色檔案 — 物種：${speciesNames}`
              : `${user.display_name} 的 VTuber 角色檔案`
        }
        image={user.avatar_url || undefined}
        url={`/vtuber/${userId}`}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: user.display_name,
            image: user.avatar_url || undefined,
            url: `${SITE_URL}/vtuber/${userId}`,
            ...(sameAs.length > 0 ? { sameAs } : {}),
          },
        }}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {/* Avatar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            position: 'relative', display: 'inline-block',
            padding: isLive ? 3 : 0,
            borderRadius: '50%',
            border: isLive ? '3px solid #ef4444' : 'none',
            boxShadow: isLive ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name}
                style={{ width: 96, height: 96, borderRadius: '50%', display: 'block' }} />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px', color: 'rgba(255,255,255,0.4)',
              }}>?</div>
            )}
            {isLive && (
              <span style={{
                position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
                padding: '1px 8px', borderRadius: 4,
                background: '#ef4444', color: '#fff',
                fontSize: '0.65em', fontWeight: 700, letterSpacing: '0.5px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}>LIVE</span>
            )}
          </div>
        </div>

        {/* Name + org */}
        <h1 style={{ fontSize: '1.5em', margin: '0 0 4px', color: '#fff' }}>
          {user.display_name}
        </h1>
        <OrgBadge orgType={user.org_type} organization={user.organization} style={{ marginBottom: 8 }} />

        {/* Links */}
        <div style={{ marginTop: 8 }}>
          <LinksRow
            oauthAccounts={oauthAccounts}
            socialLinks={user.social_links}
            countryFlags={user.country_flags}
          />
        </div>

        {/* Live stream links */}
        {isLive && liveInfos.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {liveInfos.map((li, i) => li.stream_url && (
              <a key={li.provider + i} href={li.stream_url} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 6,
                background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: '0.85em', fontWeight: 600, textDecoration: 'none',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'vtaxon-live-pulse 1.5s ease-in-out infinite',
                  flexShrink: 0,
                }} />
                {li.provider === 'youtube' ? <YouTubeIcon size={14} /> : li.provider === 'twitch' ? <TwitchIcon size={14} /> : null}
                {li.stream_title || '正在直播'}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Locate in tree */}
      {traits.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => navigate(`/?locate=${userId}`)}
            style={{
              background: 'rgba(212,160,23,0.08)',
              border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 8, padding: '8px 18px',
              color: '#D4A017', fontSize: '0.9em',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.25)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            </svg>
            在樹狀圖中定位
          </button>
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '14px 16px',
          marginBottom: 20, fontSize: '0.9em', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
        }}>
          {user.bio}
        </div>
      )}

      {/* Profile data */}
      <ProfileInfoCard profileData={user.profile_data} />

      {/* Real species traits */}
      {realTraits.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '16px 18px',
          marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 style={{ fontSize: '1em', margin: '0 0 12px', color: '#fff' }}>物種分類</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {realTraits.map(trait => (
              <div key={trait.id}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95em' }}>
                  {trait.display_name}
                </div>
                <TaxonomyPath trait={trait} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fictional species traits */}
      {fictionalTraits.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '16px 18px',
          marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 style={{ fontSize: '1em', margin: '0 0 12px', color: '#fff' }}>虛構物種</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fictionalTraits.map(trait => (
              <div key={trait.id}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95em' }}>
                  {trait.display_name}
                </div>
                <FictionalPath trait={trait} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to directory */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link to="/directory" style={{
          color: '#38bdf8', textDecoration: 'none', fontSize: '0.9em',
        }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          ← 返回圖鑑
        </Link>
      </div>
    </div>
  );
}
