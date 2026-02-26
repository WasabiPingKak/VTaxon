import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

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
        <Link to="/search" style={{ textDecoration: 'none', color: '#555' }}>Search Species</Link>
        {!loading && (
          user ? (
            <>
              <Link to="/profile" style={{ textDecoration: 'none', color: '#555' }}>
                {user.display_name}
              </Link>
              <button onClick={signOut} style={{
                padding: '6px 12px', cursor: 'pointer',
                border: '1px solid #ccc', borderRadius: '4px', background: '#fff',
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              textDecoration: 'none', color: '#fff', background: '#4a90d9',
              padding: '6px 16px', borderRadius: '4px',
            }}>
              Sign In
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
