import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import SettingsAccounts from '../components/settings/SettingsAccounts';
import SEOHead from '../components/SEOHead';

export default function AccountPage() {
  const { user, loading } = useAuth();

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <SEOHead title="帳號設定" noindex />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>帳號設定</h2>
        <Link to="/profile" style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)', fontSize: '0.9em',
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
        }}>
          ← 回到我的角色
        </Link>
      </div>

      <SettingsAccounts />
    </div>
  );
}
