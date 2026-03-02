import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithTwitch } = useAuth();

  if (!loading && user) return <Navigate to="/profile" replace />;

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <h2 style={{ marginBottom: '32px' }}>登入</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
        使用你的直播平台帳號登入，開始標註角色的物種特徵。
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={signInWithGoogle} style={{
          padding: '12px', fontSize: '1em', cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
          background: '#141c2b', color: '#e2e8f0',
        }}>
          使用 Google（YouTube）登入
        </button>
        <button onClick={signInWithTwitch} style={{
          padding: '12px', fontSize: '1em', cursor: 'pointer',
          border: 'none', borderRadius: '6px', background: '#9146ff', color: '#fff',
        }}>
          使用 Twitch 登入
        </button>
      </div>
    </div>
  );
}
