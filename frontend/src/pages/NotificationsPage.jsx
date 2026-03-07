import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import SEOHead from '../components/SEOHead';

const TYPE_LABELS = {
  fictional_request: '虛構物種',
  breed_request: '品種',
  report: '檢舉',
};

const TYPE_ICONS = {
  fictional_request: '🐉',
  breed_request: '🏷️',
  report: '⚠️',
};

const STATUS_LABELS = {
  received: '已受理',
  in_progress: '處理中',
  completed: '已完成',
  rejected: '已駁回',
  approved: '已批准',
  investigating: '調查中',
  confirmed: '已確認處理',
  dismissed: '已駁回',
};

const STATUS_COLORS = {
  received: '#38bdf8',
  in_progress: '#eab308',
  completed: '#4ade80',
  rejected: '#f87171',
  approved: '#4ade80',
  investigating: '#38bdf8',
  confirmed: '#4ade80',
  dismissed: '#999',
};

const FILTER_TABS = [
  { key: '', label: '全部' },
  { key: 'fictional_request', label: '虛構物種' },
  { key: 'breed_request', label: '品種' },
  { key: 'report', label: '檢舉' },
];

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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-TW', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotificationsGrouped(filter || undefined);
      setGroups(data.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user, fetchGroups]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead({ all: true });
      fetchGroups();
    } catch {
      // ignore
    }
  };

  const toggleExpand = (key) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (authLoading) {
    return <p style={{ textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: 650, margin: '40px auto', padding: '0 20px' }}>
      <SEOHead title="通知中心" noindex />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, flex: 1 }}>通知中心</h2>
        <button
          type="button"
          onClick={handleMarkAllRead}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '6px 14px',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.82em',
            cursor: 'pointer',
          }}
        >
          全部已讀
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 20, overflowX: 'auto',
      }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none',
              borderBottom: filter === tab.key ? '2px solid #38bdf8' : '2px solid transparent',
              color: filter === tab.key ? '#38bdf8' : 'rgba(255,255,255,0.5)',
              fontWeight: filter === tab.key ? 600 : 400,
              cursor: 'pointer', fontSize: '0.9em', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 30 }}>載入中…</p>
      ) : groups.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 40 }}>沒有通知</p>
      ) : (
        groups.map(group => {
          const key = `${group.type}:${group.reference_id}`;
          const expanded = expandedKeys.has(key);
          const statusColor = STATUS_COLORS[group.latest_status] || 'rgba(255,255,255,0.4)';

          return (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${group.has_unread ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, marginBottom: 10,
              overflow: 'hidden',
            }}>
              {/* Summary row */}
              <div
                onClick={() => toggleExpand(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', cursor: 'pointer',
                }}
              >
                {/* Type icon */}
                <span style={{ fontSize: '1.1em' }}>{TYPE_ICONS[group.type] || '📋'}</span>

                {/* Unread indicator */}
                {group.has_unread && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#38bdf8', flexShrink: 0,
                  }} />
                )}

                {/* Title + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff', fontSize: '0.88em', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {group.latest_title}
                  </div>
                  <div style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {TYPE_LABELS[group.type] || group.type} #{group.reference_id}
                  </div>
                </div>

                {/* Status badge */}
                {group.latest_status && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: '0.75em', fontWeight: 600,
                    background: `${statusColor}20`,
                    color: statusColor,
                    flexShrink: 0,
                  }}>
                    {STATUS_LABELS[group.latest_status] || group.latest_status}
                  </span>
                )}

                {/* Time */}
                <span style={{
                  fontSize: '0.75em', color: 'rgba(255,255,255,0.3)',
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {timeAgo(group.latest_at)}
                </span>

                {/* Expand arrow */}
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75em' }}>
                  {expanded ? '▲' : '▼'}
                </span>
              </div>

              {/* Timeline (expanded) */}
              {expanded && (
                <div style={{
                  padding: '0 16px 14px 42px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {group.timeline.map((item, idx) => {
                    const isLast = idx === group.timeline.length - 1;
                    const dotColor = STATUS_COLORS[item.status] || 'rgba(255,255,255,0.3)';

                    return (
                      <div key={item.id} style={{
                        position: 'relative',
                        paddingLeft: 20,
                        paddingBottom: isLast ? 0 : 14,
                        paddingTop: idx === 0 ? 14 : 0,
                      }}>
                        {/* Vertical line */}
                        {!isLast && (
                          <div style={{
                            position: 'absolute', left: 4, top: idx === 0 ? 22 : 8,
                            bottom: 0, width: 2,
                            background: 'rgba(255,255,255,0.08)',
                          }} />
                        )}
                        {/* Dot */}
                        <div style={{
                          position: 'absolute', left: 0,
                          top: idx === 0 ? 18 : 4,
                          width: 10, height: 10, borderRadius: '50%',
                          background: dotColor,
                          border: '2px solid #0d1117',
                        }} />
                        {/* Content */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#fff', fontSize: '0.84em', fontWeight: 500 }}>
                              {item.title}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72em' }}>
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          {item.message && (
                            <div style={{
                              color: 'rgba(255,255,255,0.5)', fontSize: '0.8em',
                              marginTop: 3, lineHeight: 1.4,
                            }}>
                              {item.message}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
