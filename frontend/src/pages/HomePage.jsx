import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '700px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '16px' }}>VTaxon</h1>
      <p style={{ fontSize: '1.2em', color: '#555', marginBottom: '40px' }}>
        Vtuber Biological Classification System
      </p>
      <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
        Map your Vtuber character's traits to real-world biological taxonomy
        and discover which characters are your closest "relatives."
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {user ? (
          <>
            <Link to="/profile" style={btnStyle}>My Profile</Link>
            <Link to="/search" style={btnStyle}>Search Species</Link>
          </>
        ) : (
          <Link to="/login" style={btnStyle}>Sign In to Get Started</Link>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  display: 'inline-block', textDecoration: 'none',
  padding: '12px 28px', background: '#4a90d9', color: '#fff',
  borderRadius: '6px', fontSize: '1em',
};
