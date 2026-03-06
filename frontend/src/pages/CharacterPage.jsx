import { useState, useEffect, useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import LinksRow from '../components/LinksRow';
import PreviewPanel from '../components/PreviewPanel';
import SettingsProfile from '../components/settings/SettingsProfile';
import SettingsSnsLinks from '../components/settings/SettingsSnsLinks';
import SettingsRealSpecies from '../components/settings/SettingsRealSpecies';
import SettingsFictional from '../components/settings/SettingsFictional';
import SettingsAccounts from '../components/settings/SettingsAccounts';
import SEOHead from '../components/SEOHead';

const TABS = [
  { key: 'species', label: '物種標註' },
  { key: 'profile', label: '基本資料' },
  { key: 'account', label: '帳號設定' },
];

export default function CharacterPage() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthAccounts, setOauthAccounts] = useState([]);

  const activeTab = searchParams.get('tab') || 'species';

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

  function setActiveTab(tab) {
    if (tab === 'species') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  }

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
            <img src={user.avatar_url} alt={user.display_name} loading="lazy" style={{ width: 80, height: 80, borderRadius: '50%' }} />
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

      {/* === Tab Bar === */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px',
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === key ? '#38bdf8' : 'rgba(255,255,255,0.5)',
              fontWeight: activeTab === key ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.95em',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* === Tab Content === */}
      {activeTab === 'species' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <SettingsRealSpecies />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <SettingsFictional />
          </div>
        </>
      )}

      {activeTab === 'profile' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <SettingsProfile />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <SettingsSnsLinks />
          </div>
        </>
      )}

      {activeTab === 'account' && (
        <div style={{ marginBottom: '24px' }}>
          <SettingsAccounts />
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
