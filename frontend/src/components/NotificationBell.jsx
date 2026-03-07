import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 個月前`;
}

const STATUS_COLORS = {
  received: '#38bdf8',
  in_progress: '#eab308',
  completed: '#4ade80',
  rejected: '#f87171',
  investigating: '#38bdf8',
  confirmed: '#4ade80',
  dismissed: '#f87171',
  approved: '#4ade80',
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Poll unread count every 60s
  useEffect(() => {
    let cancelled = false;
    const fetch = () => {
      api.getUnreadCount()
        .then(d => { if (!cancelled) setUnreadCount(d.count); })
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [open]);

  const handleOpen = useCallback(() => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    api.getNotifications({ limit: 5 })
      .then(d => {
        setNotifications(d.notifications || []);
        // Mark all as read
        if (unreadCount > 0) {
          api.markNotificationsRead({ all: true })
            .then(() => setUnreadCount(0))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, unreadCount]);

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const handleClickNotification = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleOpen}
        title="通知"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '4px', display: 'flex', alignItems: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            fontSize: '0.65em', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 34,
          width: 320, maxHeight: 400, overflowY: 'auto',
          background: '#141c2b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 200,
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '0.85em', fontWeight: 600,
          }}>
            通知
          </div>
          {loading ? (
            <div style={{ padding: '20px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8em', textAlign: 'center' }}>
              載入中...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '20px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8em', textAlign: 'center' }}>
              沒有通知
            </div>
          ) : (
            <>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={handleClickNotification}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  {n.status && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: STATUS_COLORS[n.status] || 'rgba(255,255,255,0.3)',
                      flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                  {!n.status && !n.is_read && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#38bdf8', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.82em', fontWeight: 600 }}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div style={{
                        color: 'rgba(255,255,255,0.55)', fontSize: '0.78em',
                        marginTop: 3, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72em', marginTop: 4 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={handleViewAll}
                style={{
                  padding: '10px 14px', textAlign: 'center',
                  color: '#38bdf8', fontSize: '0.82em',
                  cursor: 'pointer', fontWeight: 500,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                查看全部通知
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
