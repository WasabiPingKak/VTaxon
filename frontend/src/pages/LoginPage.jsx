import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithTwitch } = useAuth();

  if (!loading && user) return <Navigate to="/profile" replace />;

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <h2 style={{ marginBottom: '32px' }}>Sign In</h2>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Sign in with your streaming platform account to start tagging your character's species traits.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={signInWithGoogle} style={{
          padding: '12px', fontSize: '1em', cursor: 'pointer',
          border: '1px solid #ccc', borderRadius: '6px', background: '#fff',
        }}>
          Sign in with Google (YouTube)
        </button>
        <button onClick={signInWithTwitch} style={{
          padding: '12px', fontSize: '1em', cursor: 'pointer',
          border: '1px solid #ccc', borderRadius: '6px', background: '#9146ff', color: '#fff',
        }}>
          Sign in with Twitch
        </button>
      </div>
    </div>
  );
}
