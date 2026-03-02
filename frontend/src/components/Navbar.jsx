import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useState, useRef, useEffect } from 'react';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

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
      padding: '0 20px',
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
      }}>
        VTaxon
      </Link>

      {/* Right section */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        {/* Search */}
        <Link to="/search" style={{
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.9em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          搜尋物種
        </Link>

        {!loading && (
          user ? (
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
                  <img src={user.avatar_url} alt="" style={{
                    width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <AvatarFallback name={user.display_name} size={28} />
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
                    我的檔案
                  </Link>
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
          ) : (
            <Link to="/login" style={{
              textDecoration: 'none',
              fontSize: '0.85em',
              padding: '5px 14px',
              borderRadius: 5,
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
            }}>
              登入
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
