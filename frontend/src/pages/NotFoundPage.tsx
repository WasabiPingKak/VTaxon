import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <SEOHead title="找不到頁面" noindex />
      <div style={{ fontSize: '4em', fontWeight: 700, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }}>
        404
      </div>
      <div style={{ fontSize: '1.1em', color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
        找不到你要的頁面
      </div>
      <Link to="/" style={{
        display: 'inline-block', padding: '8px 20px', borderRadius: 6,
        background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
        border: '1px solid rgba(56,189,248,0.25)', textDecoration: 'none',
        fontSize: '0.9em',
      }}>
        返回首頁
      </Link>
    </div>
  );
}
