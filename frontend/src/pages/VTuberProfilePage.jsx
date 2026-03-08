import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import SEOHead, { SITE_URL } from '../components/SEOHead';
import LinksRow from '../components/LinksRow';
import RankBadge from '../components/RankBadge';
import ProfileInfoCard from '../components/ProfileInfoCard';
import { displayScientificName } from '../lib/speciesName';

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

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px' }}>
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
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.display_name}
              style={{ width: 96, height: 96, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%', margin: '0 auto',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', color: 'rgba(255,255,255,0.4)',
            }}>?</div>
          )}
        </div>

        {/* Name + org */}
        <h1 style={{ fontSize: '1.5em', margin: '0 0 4px', color: '#fff' }}>
          {user.display_name}
        </h1>
        {user.organization && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em', marginBottom: 8 }}>
            {user.organization}
          </div>
        )}

        {/* Links */}
        <div style={{ marginTop: 8 }}>
          <LinksRow
            oauthAccounts={oauthAccounts}
            socialLinks={user.social_links}
            countryFlags={user.country_flags}
          />
        </div>
      </div>

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
