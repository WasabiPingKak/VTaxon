import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const LS_KEY = 'vtaxon_last_seen_new_user';
const POLL_INTERVAL = 30_000;
const STAGGER_DELAY = 1_000;
const MOBILE_BP = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BP);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function ToastCard({ user, onClose, compact }) {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  const handleClose = (e) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    navigate(`/?locate=${user.id}`);
  };

  const avatarSize = compact ? 26 : 32;

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 10,
        padding: compact ? '7px 10px 7px 12px' : '10px 12px 10px 16px',
        background: 'rgba(20, 28, 40, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        cursor: 'pointer',
        color: '#e2e8f0',
        fontSize: compact ? '0.8em' : '0.85em',
        maxWidth: 300,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateX(40px)' : 'translateX(0)',
        animation: 'welcomeToastSlideIn 0.4s ease-out',
      }}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.display_name}
          loading="lazy"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
        }} />
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: compact ? 1 : 2 }}>
        <span style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}>
          🔬 VTaxon 發現了新物種
        </span>
        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.display_name}
        </strong>
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.35)',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '1.1em',
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: 'flex-start',
          borderRadius: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >
        ✕
      </button>
    </div>
  );
}

export default function WelcomeToast({ onNewUsers, visible = true }) {
  const [toasts, setToasts] = useState([]);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const seenIdsRef = useRef(new Set());
  const isMobile = useIsMobile();

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    const user = queueRef.current.shift();
    if (mountedRef.current) {
      setToasts(prev => [...prev, user]);
    }

    setTimeout(() => {
      processingRef.current = false;
      processQueue();
    }, STAGGER_DELAY);
  }, []);

  const fetchRecent = useCallback(async (since) => {
    try {
      const users = await api.getRecentUsers(since);
      if (!Array.isArray(users) || users.length === 0) return;

      // Update localStorage to latest created_at
      const latest = users[0].created_at;
      localStorage.setItem(LS_KEY, latest);

      // Deduplicate: skip users already seen/queued
      const newUsers = users.filter(u => !seenIdsRef.current.has(u.id));
      if (newUsers.length === 0) return;
      for (const u of newUsers) seenIdsRef.current.add(u.id);

      // Wait for tree to refetch so nodes exist before toast shows
      if (onNewUsers) {
        await onNewUsers();
      }

      // Queue in chronological order (oldest first so they pop in sequence)
      const chronological = [...newUsers].reverse();
      queueRef.current.push(...chronological);
      processQueue();
    } catch {
      // Silently ignore — non-critical feature
    }
  }, [processQueue, onNewUsers]);

  useEffect(() => {
    mountedRef.current = true;
    const saved = localStorage.getItem(LS_KEY);

    if (!saved) {
      localStorage.setItem(LS_KEY, new Date().toISOString());
    } else {
      fetchRecent(saved);
    }

    const interval = setInterval(() => {
      const since = localStorage.getItem(LS_KEY);
      if (since) fetchRecent(since);
    }, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRecent]);

  const dismissToast = useCallback((userId) => {
    setToasts(prev => prev.filter(t => t.id !== userId));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
    setMobileExpanded(false);
  }, []);

  if (!visible || toasts.length === 0) return null;

  const maxVisible = isMobile ? 10 : 10;
  const visibleToasts = toasts.slice(-maxVisible);
  const latestToast = visibleToasts[visibleToasts.length - 1];
  const hiddenCount = visibleToasts.length - 1;

  // Mobile collapsed: show only latest toast + badge
  const showCollapsedMobile = isMobile && !mobileExpanded && hiddenCount > 0;
  const displayToasts = showCollapsedMobile ? [latestToast] : visibleToasts;

  return (
    <>
      <style>{`
        @keyframes welcomeToastSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 12 : 20,
        right: isMobile ? 12 : 20,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 6 : 8,
        pointerEvents: 'none',
      }}>
        {displayToasts.map(user => (
          <div key={user.id} style={{ pointerEvents: 'auto', position: 'relative' }}>
            <ToastCard
              user={user}
              compact={isMobile}
              onClose={() => dismissToast(user.id)}
            />
            {/* Mobile collapsed badge: +N on the latest card */}
            {showCollapsedMobile && user.id === latestToast.id && (
              <button
                onClick={(e) => { e.stopPropagation(); setMobileExpanded(true); }}
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.7em',
                  fontWeight: 700,
                  padding: '2px 7px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  pointerEvents: 'auto',
                  lineHeight: 1.4,
                }}
              >
                +{hiddenCount}
              </button>
            )}
          </div>
        ))}
        <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          {isMobile && mobileExpanded && (
            <button
              onClick={() => setMobileExpanded(false)}
              style={{
                background: 'rgba(20, 28, 40, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.75em',
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(20,28,40,0.95)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(20,28,40,0.8)'; }}
            >
              收合
            </button>
          )}
          <button
            onClick={clearAll}
            style={{
              background: 'rgba(20, 28, 40, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75em',
              padding: '5px 12px',
              cursor: 'pointer',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(20,28,40,0.95)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(20,28,40,0.8)'; }}
          >
            清除全部通知
          </button>
        </div>
      </div>
    </>
  );
}
