import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '700px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '16px' }}>VTaxon</h1>
      <p style={{ fontSize: '1.2em', color: '#555', marginBottom: '40px' }}>
        Vtuber 生物分類系統
      </p>
      <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
        將你的 Vtuber 角色特徵對應到現實世界的生物分類學體系，
        找出資料庫中與你最接近的「親緣角色」。
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
  );
}

const btnStyle = {
  display: 'inline-block', textDecoration: 'none',
  padding: '12px 28px', background: '#4a90d9', color: '#fff',
  borderRadius: '6px', fontSize: '1em',
};
