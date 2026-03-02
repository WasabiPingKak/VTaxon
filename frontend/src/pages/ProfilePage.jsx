import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import ChannelCard from '../components/ChannelCard';
import RankBadge from '../components/RankBadge';
import { YouTubeIcon, TwitchIcon, SNS_ICON_MAP, SNS_LABELS } from '../components/SnsIcons';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

/** Convert country code to flag emoji */
function flagEmoji(code) {
  const upper = code.toUpperCase();
  const cp = [...upper].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0));
  return String.fromCodePoint(...cp);
}

/** Links row: OAuth icons + SNS icons + flag emojis */
function LinksRow({ oauthAccounts, socialLinks, countryFlags }) {
  const flagEmojis = (countryFlags || []).map(flagEmoji);
  const hasLinks = oauthAccounts.length > 0 || Object.keys(socialLinks || {}).length > 0;

  if (!hasLinks && flagEmojis.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', flexWrap: 'wrap',
    }}>
      {oauthAccounts.map(a => {
        const Icon = a.provider === 'youtube' ? YouTubeIcon
          : a.provider === 'twitch' ? TwitchIcon : null;
        if (!Icon) return null;
        return a.channel_url ? (
          <a key={a.id} href={a.channel_url} target="_blank" rel="noopener noreferrer"
            title={`${a.provider_display_name || a.provider} 頻道`}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        ) : (
          <span key={a.id} title={a.provider_display_name || a.provider}
            style={{ display: 'inline-flex', lineHeight: 0, opacity: 0.5 }}>
            <Icon size={18} />
          </span>
        );
      })}

      {Object.entries(socialLinks || {}).map(([key, url]) => {
        const Icon = SNS_ICON_MAP[key];
        if (!Icon || !url) return null;
        return (
          <a key={key} href={url} target="_blank" rel="noopener noreferrer"
            title={SNS_LABELS[key] || key}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        );
      })}

      {flagEmojis.length > 0 && (
        <>
          {hasLinks && (
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
          )}
          {flagEmojis.map((flag, i) => (
            <span key={i} style={{ fontSize: '1.1em' }}>{flag}</span>
          ))}
        </>
      )}
    </div>
  );
}

/** Indented taxonomy path (matching VtuberDetailPanel) */
function TaxonomyPath({ species }) {
  const pathParts = (species.taxon_path || '').split('|');
  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = species[`${rank}_zh`];
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
        {species.common_name_zh
          ? `${species.common_name_zh} (${species.scientific_name})`
          : species.scientific_name}
      </div>
    </div>
  );
}

const PREVIEW_ANIM_IN = 300;
const PREVIEW_ANIM_OUT = 250;

/** Slide-in preview panel – replicates VtuberDetailPanel as fixed right panel */
function PreviewPanel({ user, oauthAccounts, traits, selectedTraitIdx, onSelectTrait, onClose }) {
  const [closing, setClosing] = useState(false);
  const realTraits = traits.filter(t => t.taxon_id);
  const trait = realTraits[selectedTraitIdx] || realTraits[0];
  const species = trait?.species;

  const handleClose = useCallback(() => setClosing(true), []);
  const handleAnimEnd = useCallback((e) => {
    if (e.animationName === 'profSlideOut') { setClosing(false); onClose(); }
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes profSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes profSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes profFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes profFadeOut  { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose}
        onAnimationEnd={(e) => { if (e.animationName === 'profFadeOut') e.stopPropagation(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
          animation: closing
            ? `profFadeOut ${PREVIEW_ANIM_OUT}ms ease-in forwards`
            : `profFadeIn ${PREVIEW_ANIM_IN}ms ease-out forwards`,
        }}
      />

      {/* Panel */}
      <div onAnimationEnd={handleAnimEnd} style={{
        position: 'fixed', top: 44, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#0d1526', zIndex: 1000,
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0',
        animation: closing
          ? `profSlideOut ${PREVIEW_ANIM_OUT}ms ease-in forwards`
          : `profSlideIn ${PREVIEW_ANIM_IN}ms ease-out forwards`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>側邊欄預覽</span>
          <button type="button" onClick={handleClose} style={{
            background: 'none', border: 'none', fontSize: '1.4em',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}>✕</button>
        </div>

        {/* Hint */}
        <div style={{
          textAlign: 'center', fontSize: '0.75em', color: 'rgba(255,255,255,0.3)',
          padding: '10px 20px 0',
        }}>
          這是你在生物樹被點擊時，其他人看到的畫面
        </div>

        {/* Trait selector tabs */}
        {realTraits.length > 1 && (
          <div style={{
            display: 'flex', gap: '6px', padding: '10px 20px 0', flexWrap: 'wrap',
          }}>
            {realTraits.map((t, i) => {
              const label = t.species?.common_name_zh || t.species?.scientific_name || t.display_name;
              const active = i === (selectedTraitIdx ?? 0);
              return (
                <button key={t.id} type="button" onClick={() => onSelectTrait(i)} style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em',
                  cursor: 'pointer', border: 'none',
                  background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', color: 'rgba(255,255,255,0.4)',
              }}>?</div>
            )}
          </div>

          {/* Display name */}
          <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 600, marginBottom: '10px' }}>
            {user.display_name}
          </div>

          {/* Links row */}
          <div style={{ marginBottom: '16px' }}>
            <LinksRow
              oauthAccounts={oauthAccounts}
              socialLinks={user.social_links}
              countryFlags={user.country_flags}
            />
          </div>

          {/* Bio */}
          {user.bio && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px',
              marginBottom: '16px', fontSize: '0.9em', lineHeight: '1.6',
              color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
            }}>
              {user.bio}
            </div>
          )}

          {/* Species info card */}
          {species && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={{ ...previewLabelStyle }}>學名</span>
                  {species.scientific_name}
                </div>
                {species.common_name_zh && (
                  <div>
                    <span style={{ ...previewLabelStyle }}>中文名</span>
                    {species.common_name_zh}
                  </div>
                )}
                {trait.breed_name && (
                  <div>
                    <span style={{ ...previewLabelStyle }}>品種</span>
                    {trait.breed_name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Taxonomy path card */}
          {species && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <TaxonomyPath species={species} />
            </div>
          )}

          {/* No real species fallback */}
          {!species && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em', textAlign: 'center' }}>
              尚未設定物種特徵
            </div>
          )}
        </div>
      </div>
    </>
  );
}


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [traits, setTraits] = useState([]);
  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTraitIdx, setPreviewTraitIdx] = useState(0);

  useEffect(() => {
    if (user) {
      loadTraits();
      loadOAuthAccounts();
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;

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

  const realTraits = traits.filter(t => t.taxon_id);
  const fictionalTraits = traits.filter(t => t.fictional_species_id);

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header – centered */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        {/* Avatar */}
        <div style={{ marginBottom: '8px' }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
              background: '#38bdf8', color: '#0d1526',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8em', fontWeight: 'bold',
            }}>
              {(user.display_name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Display name */}
        <h2 style={{ margin: '0 0 4px', fontSize: '1.2em', fontWeight: 600 }}>
          {user.display_name}
        </h2>

        {/* Organization */}
        {user.organization && (
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            {user.organization}
          </div>
        )}

        {/* Links row */}
        <div style={{ marginBottom: '10px' }}>
          <LinksRow
            oauthAccounts={oauthAccounts}
            socialLinks={user.social_links}
            countryFlags={user.country_flags}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Link to="/settings" style={{ ...smallBtnStyle, textDecoration: 'none' }}>
            編輯設定
          </Link>
          <button type="button" onClick={() => setShowPreview(true)} style={smallBtnStyle}>
            預覽側邊欄
          </button>
        </div>
      </div>

      {/* Preview slide-in panel */}
      {showPreview && (
        <PreviewPanel
          user={user}
          oauthAccounts={oauthAccounts}
          traits={traits}
          selectedTraitIdx={previewTraitIdx}
          onSelectTrait={setPreviewTraitIdx}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Bio */}
      {user.bio && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px',
          marginBottom: '24px', fontSize: '0.95em', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
        }}>
          {user.bio}
        </div>
      )}

      {/* Channel cards */}
      {oauthAccounts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {oauthAccounts.map(a => (
            <ChannelCard key={a.id} account={a} mode="compact"
              isPrimary={user.primary_platform === a.provider} />
          ))}
        </div>
      )}

      {/* Real species traits */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px' }}>物種特徵</h3>
        {realTraits.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>尚未新增物種特徵</p>
        ) : (
          realTraits.map(trait => {
            const displayName = trait.species?.common_name_zh || trait.species?.scientific_name || trait.display_name;
            const rank = (trait.species?.taxon_rank || '').toUpperCase() || null;

            return (
              <div key={trait.id} style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                padding: '14px', marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                  {rank && <RankBadge rank={rank} />}
                  {displayName && (
                    <span style={{ fontWeight: 700, fontSize: '1.05em', color: '#e2e8f0' }}>
                      {displayName}
                    </span>
                  )}
                  {trait.species && (
                    <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
                      {trait.species.scientific_name}
                    </span>
                  )}
                  {trait.species?.common_name_en && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>
                      ({trait.species.common_name_en})
                    </span>
                  )}
                  {trait.breed_name && (
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                      fontSize: '0.8em', fontWeight: 600,
                      background: trait.breed_id ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.06)',
                      color: trait.breed_id ? '#fb923c' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${trait.breed_id ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.12)'}`,
                    }}>
                      {trait.breed_name}
                    </span>
                  )}
                </div>
                {trait.species && <TaxonomyPath species={trait.species} />}
                {trait.trait_note && (
                  <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                    {trait.trait_note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Fictional species traits */}
      {fictionalTraits.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px' }}>虛構物種特徵</h3>
          {fictionalTraits.map(trait => (
            <div key={trait.id} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
              padding: '14px', marginBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                  {trait.fictional?.name_zh || trait.fictional?.name || trait.display_name}
                </span>
                {trait.fictional?.name_zh && trait.fictional?.name && trait.fictional.name_zh !== trait.fictional.name && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em' }}>
                    ({trait.fictional.name})
                  </span>
                )}
                {trait.fictional?.origin && (
                  <span style={{
                    display: 'inline-block', padding: '1px 6px', borderRadius: '3px', fontSize: '0.75em',
                    background: 'rgba(168,85,247,0.15)', color: '#a855f7',
                    border: '1px solid rgba(168,85,247,0.25)',
                  }}>
                    {trait.fictional.origin}
                    {trait.fictional.sub_origin && ` / ${trait.fictional.sub_origin}`}
                  </span>
                )}
              </div>
              {trait.trait_note && (
                <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                  {trait.trait_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const smallBtnStyle = {
  padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
  background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.9em',
  color: 'rgba(255,255,255,0.7)',
};

const previewLabelStyle = {
  display: 'inline-block', width: '50px',
  fontWeight: 500, color: 'rgba(255,255,255,0.45)',
};
