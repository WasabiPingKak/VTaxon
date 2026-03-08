import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import TaxonomyGraph from '../components/graph/TaxonomyGraph';
import SEOHead from '../components/SEOHead';

export default function HomePage({ treeRefetchRef }) {
  const { user, loading: authLoading } = useAuth();
  const treeRef = useRef(null);

  useEffect(() => {
    if (treeRefetchRef) {
      treeRefetchRef.current = () => treeRef.current?.refetch();
    }
    return () => {
      if (treeRefetchRef) treeRefetchRef.current = null;
    };
  }, [treeRefetchRef]);

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
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'VTaxon',
            url: 'https://vtaxon.com',
            description: 'VTaxon — 將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。',
            applicationCategory: 'Entertainment',
            operatingSystem: 'Web',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'VTaxon',
            url: 'https://vtaxon.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://vtaxon.com/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <TaxonomyGraph ref={treeRef} currentUser={user} authLoading={authLoading} />

      <div style={{
        position: 'fixed',
        bottom: 12,
        left: 16,
        fontSize: '0.68em',
        zIndex: 10,
        display: 'flex',
        gap: 6,
      }}>
        <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
        >隱私權政策</Link>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
        <Link to="/terms" style={{ color: 'rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
        >服務條款</Link>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
        <Link to="/about" style={{ color: 'rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
        >關於本站</Link>
      </div>
    </div>
  );
}
