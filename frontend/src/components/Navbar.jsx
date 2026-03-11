import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { useState, useRef, useEffect, useCallback } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import NotificationBell from './NotificationBell';

function AvatarFallback({ name, size = 32 }) {
  const initial = (name || '?')[0].toUpperCase();
  const hue = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 55%, 55%)`, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 'bold',
    }}>
      {initial}
    </div>
  );
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [adminPendingTotal, setAdminPendingTotal] = useState(0);
  const [directoryCount, setDirectoryCount] = useState(null);

  const handleRefocusSelf = useCallback(() => {
    if (location.pathname !== '/') navigate('/');
    window.dispatchEvent(new CustomEvent('vtaxon:refocus-self'));
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [dropdownOpen]);

  // Fetch tagged VTuber count for directory badge
  useEffect(() => {
    let cancelled = false;
    api.getDirectory({ has_traits: 'true', per_page: 1 })
      .then(data => { if (!cancelled) setDirectoryCount(data.total ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch admin pending counts on mount + periodically
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let cancelled = false;
    const fetchCounts = () => {
      api.getAdminCounts()
        .then(data => {
          if (cancelled) return;
          const fc = data.fictional || {};
          const bc = data.breed || {};
          const rc = data.report || {};
          const total = (fc.pending || 0) + (fc.received || 0) + (fc.in_progress || 0)
                      + (bc.pending || 0) + (bc.received || 0) + (bc.in_progress || 0)
                      + (rc.pending || 0) + (rc.investigating || 0);
          setAdminPendingTotal(total);
        })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.role]);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 44,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 10px' : '0 20px',
      background: 'rgba(8,13,21,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        textDecoration: 'none',
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 0 12px rgba(56,189,248,0.5)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <img src="/favicon.svg" alt="VTaxon" width={22} height={22} />
        VTaxon
      </Link>

      {/* Right section */}
      <div style={{ display: 'flex', gap: isMobile ? '8px' : '14px', alignItems: 'center' }}>
        <Link to="/stats" title="統計" style={{
          textDecoration: 'none',
          fontSize: '0.8em',
          padding: isMobile ? '5px 7px' : '4px 10px',
          borderRadius: 6,
          color: location.pathname === '/stats' ? '#38bdf8' : 'rgba(255,255,255,0.65)',
          border: `1px solid ${location.pathname === '/stats' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.12)'}`,
          background: location.pathname === '/stats' ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.04)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="18" y="3" width="4" height="18" rx="1" />
            <rect x="10" y="8" width="4" height="13" rx="1" />
            <rect x="2" y="13" width="4" height="8" rx="1" />
          </svg>
          {!isMobile && '統計'}
        </Link>
        <Link to="/directory" title="圖鑑" style={{
          textDecoration: 'none',
          fontSize: '0.8em',
          padding: isMobile ? '5px 7px' : '4px 10px',
          borderRadius: 6,
          color: location.pathname === '/directory' ? '#38bdf8' : 'rgba(255,255,255,0.65)',
          border: `1px solid ${location.pathname === '/directory' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.12)'}`,
          background: location.pathname === '/directory' ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.04)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {!isMobile && '圖鑑'}
          {directoryCount != null && (
            <span style={{
              fontSize: '0.75em', fontWeight: 600,
              padding: '1px 6px', borderRadius: 8,
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              minWidth: 14, textAlign: 'center',
            }}>
              {directoryCount}
            </span>
          )}
        </Link>
        {!loading && (
          user ? (
            <>
              <button
                type="button"
                onClick={handleRefocusSelf}
                title="在樹狀圖中定位自己"
                style={{
                  background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.3)',
                  borderRadius: 6, cursor: 'pointer', padding: isMobile ? '5px 7px' : '4px 8px',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  color: '#E91E8C', fontSize: '0.8em',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.6)'; e.currentTarget.style.background = 'rgba(233,30,140,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.3)'; e.currentTarget.style.background = 'rgba(233,30,140,0.1)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                </svg>
                {!isMobile && '定位自己'}
              </button>
              <NotificationBell />
              <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '2px 0',
                }}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} loading="lazy" style={{
                    width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <AvatarFallback name={user.display_name} size={28} />
                )}
                {!isMobile && (
                  <span style={{
                    fontSize: '0.85em', color: 'rgba(255,255,255,0.85)',
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{user.display_name}</span>
                )}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 38,
                  background: '#141c2b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  minWidth: 160,
                  overflow: 'hidden',
                  zIndex: 200,
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '0.85em',
                    fontWeight: 600,
                  }}>
                    {user.display_name}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 14px',
                      textDecoration: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.85em',
                    }}
                  >
                    我的角色
                  </Link>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.85em',
                      }}
                    >
                      管理後台
                      {adminPendingTotal > 0 && (
                        <span style={{
                          fontSize: '0.75em', fontWeight: 600,
                          padding: '1px 7px', borderRadius: 8,
                          background: 'rgba(239,68,68,0.2)',
                          color: '#f87171',
                          minWidth: 16, textAlign: 'center',
                        }}>
                          {adminPendingTotal}
                        </span>
                      )}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); signOut(); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.85em',
                    }}
                  >
                    登出
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link to="/login" style={{
              textDecoration: 'none',
              fontSize: '0.85em',
              padding: isMobile ? '5px 10px' : '5px 14px',
              borderRadius: 5,
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
              background: 'rgba(56,189,248,0.08)',
            }}>
              {isMobile ? '登入' : 'VTuber 登入'}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
