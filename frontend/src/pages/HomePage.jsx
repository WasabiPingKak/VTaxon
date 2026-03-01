import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import TaxonomyTree from '../components/TaxonomyTree';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '12px' }}>VTaxon</h1>
        <p style={{ fontSize: '1.1em', color: '#555', marginBottom: '20px' }}>
          Vtuber 生物分類系統 — 探索 Vtuber 的生物分類樹
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <Link to="/profile" style={btnStyle}>我的檔案</Link>
              <Link to="/search" style={btnStyle}>搜尋物種</Link>
            </>
          ) : (
            <Link to="/login" style={btnStyle}>登入開始使用</Link>
          )}
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
        padding: '20px', minHeight: '200px',
      }}>
        <TaxonomyTree currentUser={user} />
      </div>
    </div>
  );
}

const btnStyle = {
  display: 'inline-block', textDecoration: 'none',
  padding: '10px 24px', background: '#4a90d9', color: '#fff',
  borderRadius: '6px', fontSize: '0.95em',
};
