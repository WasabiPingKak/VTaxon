import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import SettingsProfile from '../components/settings/SettingsProfile';
import SettingsAccounts from '../components/settings/SettingsAccounts';
import SettingsRealSpecies from '../components/settings/SettingsRealSpecies';
import SettingsFictional from '../components/settings/SettingsFictional';

const TABS = [
  { key: 'profile', label: '基本資料' },
  { key: 'accounts', label: '平台帳號' },
  { key: 'real', label: '真實物種' },
  { key: 'fictional', label: '虛構生物' },
];

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>設定</h2>
        <Link to="/profile" style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)', fontSize: '0.9em',
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
        }}>
          回到個人檔案
        </Link>
      </div>

      {/* Horizontal tabs */}
      <div style={{
        display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '24px', overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === tab.key ? '#38bdf8' : 'rgba(255,255,255,0.5)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.95em',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <SettingsProfile />}
      {activeTab === 'accounts' && <SettingsAccounts />}
      {activeTab === 'real' && <SettingsRealSpecies />}
      {activeTab === 'fictional' && <SettingsFictional />}
    </div>
  );
}
