import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function AvatarFallback({ name }) {
  const initial = (name || '?')[0].toUpperCase();
  // Simple hash for consistent color
  const hue = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: `hsl(${hue}, 55%, 55%)`, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.85em', fontWeight: 'bold',
    }}>
      {initial}
    </div>
  );
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', borderBottom: '1px solid #e0e0e0',
      background: '#fff',
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.4em', fontWeight: 'bold' }}>
        VTaxon
      </Link>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/search" style={{ textDecoration: 'none', color: '#555' }}>搜尋物種</Link>
        {!loading && (
          user ? (
            <>
              <Link to="/profile" style={{
                textDecoration: 'none', color: '#555',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" style={{
                    width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <AvatarFallback name={user.display_name} />
                )}
                <span>{user.display_name}</span>
              </Link>
              <button onClick={signOut} style={{
                padding: '6px 12px', cursor: 'pointer',
                border: '1px solid #ccc', borderRadius: '4px', background: '#fff',
              }}>
                登出
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              textDecoration: 'none', color: '#fff', background: '#4a90d9',
              padding: '6px 16px', borderRadius: '4px',
            }}>
              登入
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
