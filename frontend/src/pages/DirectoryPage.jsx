import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import DirectoryFilters from '../components/directory/DirectoryFilters';
import DirectoryCard from '../components/directory/DirectoryCard';
import DirectoryListItem, { LIST_GRID } from '../components/directory/DirectoryListItem';
import Pagination from '../components/Pagination';
import VtuberDetailPanel from '../components/VtuberDetailPanel';
import SEOHead, { SITE_URL } from '../components/SEOHead';
import useIsMobile from '../hooks/useIsMobile';
import useLiveStatus from '../hooks/useLiveStatus';

const DEFAULT_FILTERS = {
  q: '', country: '', gender: '', status: '',
  org_type: '', platform: '', has_traits: 'true', live_first: '',
  sort: 'created_at', order: 'desc', page: 1, per_page: 24,
};

export default function DirectoryPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { liveUserIds } = useLiveStatus();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItem, setSelectedItem] = useState(null);

  // Force grid view on mobile
  useEffect(() => {
    if (isMobile && viewMode !== 'grid') setViewMode('grid');
  }, [isMobile]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      for (const [k, v] of Object.entries(filters)) {
        if (v !== '' && v !== undefined && v !== null) params[k] = v;
      }
      const result = await api.getDirectory(params);
      setData(result);
    } catch (err) {
      console.error('Directory fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s, pausing when tab is hidden
  useEffect(() => {
    let id = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => fetchData(true), 30000);
    };
    const stop = () => { clearInterval(id); id = null; };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') { fetchData(true); start(); }
      else stop();
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [fetchData]);

  const handleFiltersChange = (newFilters) => {
    setFilters({ ...newFilters, per_page: filters.per_page });
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (perPage) => {
    setFilters(prev => ({ ...prev, per_page: perPage, page: 1 }));
  };

  const items = data?.items || [];

  const handleItemClick = (item) => {
    setSelectedItem({
      user_id: item.id,
      display_name: item.display_name,
      avatar_url: item.avatar_url,
      country_flags: item.country_flags,
    });
  };

  const currentPage = data?.page || 1;
  const totalPages = data?.total_pages || 1;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 20px' }}>
      <SEOHead
        title={currentPage > 1 ? `VTuber 圖鑑 — 第 ${currentPage} 頁` : 'VTuber 圖鑑'}
        description="探索所有已建檔的 VTuber 角色與物種分類"
        url={currentPage > 1 ? `/directory?page=${currentPage}` : '/directory'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'VTuber 圖鑑',
          description: '探索所有已建檔的 VTuber 角色與物種分類',
          url: 'https://vtaxon.com/directory',
        }}
      >
        {currentPage > 1 && (
          <link rel="prev" href={`${SITE_URL}/directory${currentPage > 2 ? `?page=${currentPage - 1}` : ''}`} />
        )}
        {currentPage < totalPages && (
          <link rel="next" href={`${SITE_URL}/directory?page=${currentPage + 1}`} />
        )}
      </SEOHead>
      <h2 style={{ marginBottom: 4 }}>圖鑑</h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9em', marginBottom: 20 }}>
        探索所有已建檔的角色與物種分類
        <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
        <Link to="/about" style={{ color: '#38bdf8', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7dd3fc'}
          onMouseLeave={e => e.currentTarget.style.color = '#38bdf8'}
        >關於本站</Link>
      </p>

      {data && (
        <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
          共 {data.total} 位實況主
        </div>
      )}
      <DirectoryFilters
        filters={filters}
        onChange={handleFiltersChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        facets={data?.facets}
        liveCount={liveUserIds.size}
      />

      {/* Content */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'rgba(255,255,255,0.3)',
          }}>
            <div style={{ fontSize: '2em', marginBottom: 12 }}>🔍</div>
            <div>沒有找到符合條件的實況主</div>
            <div style={{ fontSize: '0.85em', marginTop: 8 }}>
              試試調整篩選條件或搜尋關鍵字
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {items.map(item => (
              <DirectoryCard key={item.id} item={item} onClick={handleItemClick} isLive={liveUserIds.has(item.id)} />
            ))}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, overflow: 'hidden',
          }}>
            {/* List header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: LIST_GRID,
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75em', color: 'rgba(255,255,255,0.35)',
              fontWeight: 600,
            }}>
              <div />
              <div>名稱</div>
              <div>平台</div>
              <div>組織</div>
              <div>物種</div>
              <div>出道日期</div>
              <div>狀態</div>
              <div>建檔日期</div>
              <div />
            </div>
            {items.map(item => (
              <DirectoryListItem key={item.id} item={item} onClick={handleItemClick} isLive={liveUserIds.has(item.id)} />
            ))}
          </div>
        )}
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          onPageChange={handlePageChange}
          perPage={filters.per_page}
          onPerPageChange={handlePerPageChange}
        />
      )}

      {selectedItem && (
        <VtuberDetailPanel
          entry={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFocus={(entry) => navigate(`/?locate=${entry.user_id}`)}
        />
      )}
    </div>
  );
}

function LoadingSkeleton({ viewMode }) {
  const skeletons = Array.from({ length: 6 });

  if (viewMode === 'list') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {skeletons.map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 120, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 60, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ flex: 1, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
      gap: 12,
    }}>
      {skeletons.map((_, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: 16,
          height: 160,
        }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div>
              <div style={{ width: 100, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ width: 60, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ width: '70%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '50%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );
}
