import { useAuth } from '../lib/AuthContext';
import TaxonomyGraph from '../components/graph/TaxonomyGraph';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#080d15',
    }}>
      <TaxonomyGraph currentUser={user} />
    </div>
  );
}
