import { useAuth } from '../lib/AuthContext';
import TaxonomyGraph from '../components/graph/TaxonomyGraph';
import SEOHead from '../components/SEOHead';

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
      <SEOHead
        url="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'VTaxon',
          url: 'https://vtaxon.com',
          description: 'VTaxon — 將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。',
          applicationCategory: 'Entertainment',
          operatingSystem: 'Web',
        }}
      />
      <TaxonomyGraph currentUser={user} />
    </div>
  );
}
