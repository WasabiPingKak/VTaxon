import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import LinksRow from '../components/LinksRow';
import PreviewPanel from '../components/PreviewPanel';
import SettingsProfile from '../components/settings/SettingsProfile';
import SettingsRealSpecies from '../components/settings/SettingsRealSpecies';
import SettingsFictional from '../components/settings/SettingsFictional';
import SEOHead from '../components/SEOHead';

export default function CharacterPage() {
  const { user, loading } = useAuth();
  const [oauthAccounts, setOauthAccounts] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  // Preview panel state — loaded on demand
  const [showPreview, setShowPreview] = useState(false);
  const [previewTraitIdx, setPreviewTraitIdx] = useState(0);
  const [previewTraits, setPreviewTraits] = useState([]);

  useEffect(() => {
    if (user) {
      api.getUser(user.id)
        .then(data => setOauthAccounts(data.oauth_accounts || []))
        .catch(err => console.error('Failed to load OAuth accounts:', err));
    }
  }, [user]);

  const openPreview = useCallback(async () => {
    if (!user) return;
    try {
      const traitsData = await api.getTraits(user.id);
      setPreviewTraits(traitsData.traits || []);
      setPreviewTraitIdx(0);
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to load preview data:', err);
    }
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <SEOHead title="我的角色" noindex />
      {/* === Header === */}
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

        {/* Links row (read-only OAuth + SNS + flags) */}
        <div style={{ marginBottom: '10px' }}>
          <LinksRow
            oauthAccounts={oauthAccounts}
            socialLinks={user.social_links}
            countryFlags={user.country_flags}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button type="button" onClick={openPreview} style={smallBtnStyle}>
            預覽側邊欄
          </button>
          <Link to="/account" style={{ ...smallBtnStyle, textDecoration: 'none' }}>
            帳號設定 →
          </Link>
        </div>
      </div>

      {/* === Preview Panel (slide-in) === */}
      {showPreview && (
        <PreviewPanel
          user={user}
          oauthAccounts={oauthAccounts}
          traits={previewTraits}
          selectedTraitIdx={previewTraitIdx}
          onSelectTrait={setPreviewTraitIdx}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* === 基本資料（收合式） === */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setProfileOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
            padding: '12px 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            cursor: 'pointer', color: '#e2e8f0', fontSize: '1em', fontWeight: 600,
          }}
        >
          <span style={{
            display: 'inline-block', transition: 'transform 0.2s',
            transform: profileOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>▸</span>
          編輯基本資料
        </button>
        {profileOpen && (
          <div style={{ marginTop: '16px' }}>
            <SettingsProfile />
          </div>
        )}
      </div>

      {/* === 真實物種特徵 (always visible) === */}
      <div style={{ marginBottom: '24px' }}>
        <SettingsRealSpecies />
      </div>

      {/* === 虛構物種特徵 (always visible) === */}
      <div style={{ marginBottom: '24px' }}>
        <SettingsFictional />
      </div>
    </div>
  );
}

const smallBtnStyle = {
  padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
  background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.9em',
  color: 'rgba(255,255,255,0.7)',
};
