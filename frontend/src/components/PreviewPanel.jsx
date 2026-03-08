import { useState, useCallback } from 'react';
import RankBadge from './RankBadge';
import LinksRow from './LinksRow';
import ProfileInfoCard from './ProfileInfoCard';
import { displayScientificName } from '../lib/speciesName';

const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const RANK_TO_UPPER = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

const previewLabelStyle = {
  display: 'inline-block', width: '50px',
  fontWeight: 500, color: 'rgba(255,255,255,0.45)',
};

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
          ? `${species.common_name_zh} (${displayScientificName(species)})`
          : displayScientificName(species)}
      </div>
    </div>
  );
}

const PREVIEW_ANIM_IN = 300;
const PREVIEW_ANIM_OUT = 250;

/** Indented fictional species path (matching VtuberDetailPanel) */
function FictionalPath({ fictional }) {
  const levels = [
    { rank: 'F_ORIGIN', label: fictional.origin },
    fictional.sub_origin ? { rank: 'F_SUB_ORIGIN', label: fictional.sub_origin } : null,
    { rank: 'F_SPECIES', label: fictional.name_zh || fictional.name },
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

/** Slide-in preview panel – replicates VtuberDetailPanel as fixed right panel */
export default function PreviewPanel({ user, oauthAccounts, traits, selectedTraitIdx, onSelectTrait, onClose }) {
  const [closing, setClosing] = useState(false);
  // All traits (real + fictional) for tab switching
  const allTraits = traits.filter(t => t.taxon_id || t.fictional_species_id);
  const trait = allTraits[selectedTraitIdx] || allTraits[0];
  const isReal = !!trait?.taxon_id;
  const species = isReal ? trait?.species : null;
  const fictional = !isReal ? trait?.fictional : null;

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
        {allTraits.length > 1 && (
          <div style={{
            display: 'flex', gap: '6px', padding: '10px 20px 0', flexWrap: 'wrap',
          }}>
            {allTraits.map((t, i) => {
              const label = t.taxon_id
                ? (t.species?.common_name_zh || displayScientificName(t.species) || t.display_name)
                : (t.fictional?.name_zh || t.fictional?.name || t.display_name);
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
              <img src={user.avatar_url} alt={user.display_name} loading="lazy" style={{ width: 80, height: 80, borderRadius: '50%' }} />
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

          {/* Profile data */}
          <ProfileInfoCard profileData={user.profile_data} />

          {/* Species info card — real */}
          {species && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={{ ...previewLabelStyle }}>學名</span>
                  {displayScientificName(species)}
                </div>
                {species.common_name_zh && (
                  <div>
                    <span style={{ ...previewLabelStyle }}>中文名</span>
                    {species.common_name_zh}
                  </div>
                )}
                {species.alternative_names_zh && (
                  <div>
                    <span style={{ ...previewLabelStyle }}>俗名</span>
                    {species.alternative_names_zh.split(/[,，]/).map(s => s.trim()).filter(Boolean).join('、')}
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

          {/* Species info card — fictional */}
          {fictional && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>虛構物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={{ ...previewLabelStyle }}>名稱</span>
                  {fictional.name_zh || fictional.name}
                  {fictional.name_zh && fictional.name && fictional.name_zh !== fictional.name && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>({fictional.name})</span>
                  )}
                </div>
                <div>
                  <span style={{ ...previewLabelStyle }}>來源</span>
                  {fictional.origin}
                </div>
                {fictional.sub_origin && (
                  <div>
                    <span style={{ ...previewLabelStyle }}>子來源</span>
                    {fictional.sub_origin}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Taxonomy path card — real */}
          {species && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <TaxonomyPath species={species} />
            </div>
          )}

          {/* Fictional path card */}
          {fictional && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <FictionalPath fictional={fictional} />
            </div>
          )}

          {/* No traits fallback */}
          {!species && !fictional && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9em', textAlign: 'center' }}>
              尚未設定物種特徵
            </div>
          )}
        </div>
      </div>
    </>
  );
}
