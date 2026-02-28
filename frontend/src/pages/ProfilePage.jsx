import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import SpeciesSearch from '../components/SpeciesSearch';
import CountryFlag from '../components/CountryFlag';
import ChannelCard from '../components/ChannelCard';

const SNS_LABELS = {
  twitter: 'Twitter / X',
  threads: 'Threads',
  instagram: 'Instagram',
  bluesky: 'Bluesky',
  discord: 'Discord',
  facebook: 'Facebook',
  marshmallow: '棉花糖',
};

/** Taxonomy breadcrumb: 中文(Latin) > ... up to genus */
function TraitBreadcrumb({ species }) {
  const ranks = [
    { key: 'kingdom', label: species.kingdom, zh: species.kingdom_zh },
    { key: 'phylum', label: species.phylum, zh: species.phylum_zh },
    { key: 'class', label: species.class, zh: species.class_zh },
    { key: 'order', label: species.order, zh: species.order_zh },
    { key: 'family', label: species.family, zh: species.family_zh },
    { key: 'genus', label: species.genus, zh: species.genus_zh },
  ].filter(r => r.label);

  if (ranks.length === 0) return null;

  return (
    <div style={{ fontSize: '0.8em', color: '#888', marginTop: '2px', lineHeight: 1.4 }}>
      {ranks.map((r, i) => (
        <span key={r.key}>
          {i > 0 && <span style={{ margin: '0 3px' }}>&gt;</span>}
          {r.zh ? (
            <span>{r.zh}<span style={{ color: '#aaa' }}>({r.label})</span></span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>{r.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [traits, setTraits] = useState([]);
  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) {
      loadTraits();
      loadOAuthAccounts();
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>載入中…</p>;

  async function loadTraits() {
    try {
      const data = await api.getTraits(user.id);
      setTraits(data.traits || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadOAuthAccounts() {
    try {
      const data = await api.getUser(user.id);
      setOauthAccounts(data.oauth_accounts || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddTrait(species) {
    try {
      await api.createTrait({
        taxon_id: species.taxon_id,
        display_name: species.common_name_zh || species.common_name_en || species.scientific_name,
      });
      setShowSearch(false);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTrait(traitId) {
    if (!confirm('確定要移除此特徵嗎？')) return;
    try {
      await api.deleteTrait(traitId);
      loadTraits();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#4a90d9', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5em', fontWeight: 'bold',
          }}>
            {(user.display_name || '?')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0 }}>{user.display_name}</h2>
          {user.organization && (
            <div style={{ color: '#666', marginTop: '4px' }}>{user.organization}</div>
          )}
          {user.country_flags?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {user.country_flags.map((code) => (
                <CountryFlag key={code} code={code} />
              ))}
            </div>
          )}
          {user.social_links && Object.keys(user.social_links).length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {Object.entries(user.social_links).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                    background: '#f0f0f0', color: '#4a90d9', fontSize: '0.85em',
                    textDecoration: 'none',
                  }}>
                  {SNS_LABELS[key] || key}
                </a>
              ))}
            </div>
          )}
          <Link to="/profile/edit" style={{
            ...smallBtnStyle, display: 'inline-block', marginTop: '8px',
            textDecoration: 'none', color: '#333',
          }}>
            編輯個人資料
          </Link>
        </div>
      </div>

      {/* Channel cards */}
      {oauthAccounts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {oauthAccounts.map(a => (
            <ChannelCard key={a.id} account={a} mode="compact"
              isPrimary={user.primary_platform === a.provider} />
          ))}
        </div>
      )}

      {/* Traits section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>物種特徵</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSearch(!showSearch)} style={{
            padding: '6px 14px', background: '#4a90d9', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
          }}>
            {showSearch ? '取消' : '+ 新增特徵'}
          </button>
          <Link to={`/kinship/${user.id}`} style={{
            padding: '6px 14px', background: '#27ae60', color: '#fff',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            查看親緣關係
          </Link>
        </div>
      </div>

      {showSearch && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
          <SpeciesSearch onSelect={handleAddTrait} />
        </div>
      )}

      {traits.length === 0 ? (
        <p style={{ color: '#999' }}>尚未新增物種特徵，點擊上方按鈕開始新增！</p>
      ) : (
        <div>
          {traits.map((trait) => (
            <div key={trait.id} style={{
              padding: '12px 16px', borderBottom: '1px solid #eee',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                  {trait.display_name && (
                    <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#222' }}>
                      {trait.display_name}
                    </span>
                  )}
                  {trait.species && (
                    <span style={{ fontStyle: 'italic', color: '#555' }}>
                      {trait.species.scientific_name}
                    </span>
                  )}
                  {trait.species?.common_name_en && (
                    <span style={{ color: '#999', fontSize: '0.9em' }}>
                      ({trait.species.common_name_en})
                    </span>
                  )}
                  {trait.fictional && (
                    <span style={{ color: '#888' }}>
                      [{trait.fictional.origin}]
                    </span>
                  )}
                </div>
                {trait.species && <TraitBreadcrumb species={trait.species} />}
                {trait.trait_note && (
                  <div style={{ fontSize: '0.85em', color: '#999', marginTop: '2px' }}>{trait.trait_note}</div>
                )}
              </div>
              <button onClick={() => handleDeleteTrait(trait.id)} style={{
                padding: '4px 10px', background: '#e74c3c', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const smallBtnStyle = {
  padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px',
  background: '#fff', cursor: 'pointer', fontSize: '0.9em',
};
