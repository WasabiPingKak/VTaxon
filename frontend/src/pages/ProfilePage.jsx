import { useEffect, useState, useCallback } from 'react';
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

const RANK_LABELS = {
  ORDER: '目',
  FAMILY: '科',
  GENUS: '屬',
  SPECIES: '種',
  SUBSPECIES: '亞種',
  VARIETY: '變種',
};

/** Simple toast notification */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
      background: type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#27ae60',
      color: '#fff', fontSize: '0.95em', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      maxWidth: '90vw', textAlign: 'center',
    }}>
      {message}
    </div>
  );
}

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

/** Inline breed editor — API-driven select for SPECIES/SUBSPECIES-rank traits */
function BreedEditor({ trait, onSave }) {
  const rank = (trait.species?.taxon_rank || '').toUpperCase();
  if (rank !== 'SPECIES' && rank !== 'SUBSPECIES' && rank !== 'VARIETY') return null;
  const [editing, setEditing] = useState(false);
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [selectedBreedId, setSelectedBreedId] = useState(trait.breed_id || '');
  const [saving, setSaving] = useState(false);

  async function handleOpen() {
    setEditing(true);
    setLoadingBreeds(true);
    try {
      const data = await api.getBreeds(trait.taxon_id);
      setBreeds(data.breeds || []);
    } catch {
      setBreeds([]);
    } finally {
      setLoadingBreeds(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const breedId = selectedBreedId ? parseInt(selectedBreedId, 10) : null;
      await onSave(trait.id, breedId);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '4px' }}>
        {trait.breed_name ? (
          <span onClick={handleOpen} style={{ cursor: 'pointer' }}>
            ({trait.breed_name})
          </span>
        ) : (
          <button onClick={handleOpen} title="品種是人為培育的分類，如柴犬、布偶貓，不是生物學上的亞種" style={{
            background: 'none', border: '1px dashed #ccc', borderRadius: '3px',
            padding: '0 6px', fontSize: '0.85em', color: '#aaa', cursor: 'pointer',
          }}>
            + 品種
          </button>
        )}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', marginLeft: '4px' }}>
      {loadingBreeds ? (
        <span style={{ fontSize: '0.85em', color: '#999' }}>載入中…</span>
      ) : breeds.length === 0 ? (
        <span style={{ fontSize: '0.85em', color: '#999' }}>無可選品種</span>
      ) : (
        <select
          value={selectedBreedId}
          onChange={(e) => setSelectedBreedId(e.target.value)}
          autoFocus
          style={{
            padding: '2px 6px', border: '1px solid #ccc', borderRadius: '3px',
            fontSize: '0.85em',
          }}
        >
          <option value="">（不指定品種）</option>
          {breeds.map(b => (
            <option key={b.id} value={b.id}>
              {b.name_zh ? `${b.name_zh} (${b.name_en})` : b.name_en}
            </option>
          ))}
        </select>
      )}
      <button onClick={handleSave} disabled={saving || loadingBreeds} style={{
        padding: '2px 8px', background: '#27ae60', color: '#fff',
        border: 'none', borderRadius: '3px', fontSize: '0.8em', cursor: 'pointer',
      }}>
        {saving ? '…' : '存'}
      </button>
      <button onClick={() => setEditing(false)} style={{
        padding: '2px 8px', background: '#ccc', color: '#333',
        border: 'none', borderRadius: '3px', fontSize: '0.8em', cursor: 'pointer',
      }}>
        取消
      </button>
    </span>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [traits, setTraits] = useState([]);
  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

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
      const result = await api.createTrait({
        taxon_id: species.taxon_id,
      });
      if (result.replaced) {
        showToast(`已新增，原本的「${result.replaced.replaced_display_name}」已被取代（新的範圍更小、更準確）`);
      } else {
        showToast('特徵新增成功');
      }
      setShowSearch(false);
      loadTraits();
    } catch (err) {
      if (err.data?.code === 'ancestor_blocked') {
        showToast(`無法新增：你已經有「${err.data.existing_display_name}」，範圍比這個更小更準確`, 'warning');
      } else if (err.data?.code === 'rank_not_allowed') {
        showToast(err.message, 'error');
      } else {
        showToast(err.message, 'error');
      }
    }
  }

  async function handleUpdateBreed(traitId, breedId) {
    await api.updateTrait(traitId, { breed_id: breedId });
    loadTraits();
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

  function getTraitDisplayName(trait) {
    if (trait.species) {
      return trait.species.common_name_zh || trait.species.scientific_name;
    }
    return trait.display_name;
  }

  function getTraitRank(trait) {
    if (trait.species?.taxon_rank) {
      return (trait.species.taxon_rank || '').toUpperCase();
    }
    return null;
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.key} />}

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
          {!showSearch && (
            <button onClick={() => setShowSearch(true)} style={{
              padding: '6px 14px', background: '#4a90d9', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
            }}>
              + 新增特徵
            </button>
          )}
          <Link to={`/kinship/${user.id}`} style={{
            padding: '6px 14px', background: '#27ae60', color: '#fff',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            查看親緣關係
          </Link>
        </div>
      </div>

      {traits.length === 0 ? (
        <p style={{ color: '#999', marginBottom: '16px' }}>尚未新增物種特徵，點擊上方按鈕開始新增！</p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {traits.map((trait) => {
            const displayName = getTraitDisplayName(trait);
            const rank = getTraitRank(trait);
            const rankLabel = rank ? RANK_LABELS[rank] : null;

            return (
              <div key={trait.id} style={{
                padding: '12px 16px', borderBottom: '1px solid #eee',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                    {rankLabel && (
                      <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
                        fontSize: '0.75em', fontWeight: 600,
                        background: '#e8f4fd', color: '#2980b9', border: '1px solid #bee0f5',
                      }}>
                        {rankLabel}
                      </span>
                    )}
                    {displayName && (
                      <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#222' }}>
                        {displayName}
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
                    <BreedEditor trait={trait} onSave={handleUpdateBreed} />
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
            );
          })}
        </div>
      )}

      {showSearch && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
          <SpeciesSearch onSelect={handleAddTrait} onCancel={() => setShowSearch(false)} />
        </div>
      )}
    </div>
  );
}

const smallBtnStyle = {
  padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px',
  background: '#fff', cursor: 'pointer', fontSize: '0.9em',
};
