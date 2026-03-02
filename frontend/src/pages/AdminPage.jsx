import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const STATUS_TABS = [
  { key: 'pending', label: '待審核' },
  { key: 'approved', label: '已批准' },
  { key: 'rejected', label: '已駁回' },
];

function RequestCard({ req, onUpdate }) {
  const [note, setNote] = useState(req.admin_note || '');
  const [loading, setLoading] = useState(false);
  const isPending = req.status === 'pending';

  const handleAction = async (status) => {
    setLoading(true);
    try {
      const body = { status, admin_note: note || undefined };
      if (status === 'approved') {
        body.species = {
          name: req.name_en || req.name_zh,
          name_zh: req.name_zh,
          origin: req.suggested_origin,
          sub_origin: req.suggested_sub_origin,
          description: req.description,
        };
      }
      await api.updateRequest(req.id, body);
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 14,
    }}>
      {/* Header: user info + date */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12, fontSize: '0.85em', color: 'rgba(255,255,255,0.5)',
      }}>
        {req.user?.avatar_url ? (
          <img src={req.user.avatar_url} alt="" style={{
            width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
          }}>?</div>
        )}
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
          {req.user?.display_name || '已刪除使用者'}
        </span>
        <span>·</span>
        <span>{new Date(req.created_at).toLocaleDateString('zh-TW')}</span>
        {!isPending && (
          <span style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '0.8em',
            fontWeight: 600,
            background: req.status === 'approved'
              ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: req.status === 'approved'
              ? '#4ade80' : '#f87171',
          }}>
            {req.status === 'approved' ? '已批准' : '已駁回'}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gap: 6, fontSize: '0.9em' }}>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>中文名稱：</span>
          <span style={{ color: '#fff', fontWeight: 500 }}>{req.name_zh}</span>
        </div>
        {req.name_en && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>英文名稱：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{req.name_en}</span>
          </div>
        )}
        {(req.suggested_origin || req.suggested_sub_origin) && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>建議分類：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              {req.suggested_origin}
              {req.suggested_sub_origin && ` → ${req.suggested_sub_origin}`}
            </span>
          </div>
        )}
        {req.description && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>描述：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{req.description}</span>
          </div>
        )}
      </div>

      {/* Admin note + actions */}
      <div style={{ marginTop: 14 }}>
        {isPending ? (
          <>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="管理員備註（選填）"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '8px 10px',
                color: '#fff', fontSize: '0.85em', resize: 'vertical',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10,
            }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('rejected')}
                style={{
                  padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.12)', color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.85em',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                駁回
              </button>
              <button
                type="button"
                disabled={loading || !req.suggested_origin}
                onClick={() => handleAction('approved')}
                title={!req.suggested_origin ? '缺少分類來源，無法批准' : ''}
                style={{
                  padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.85em',
                  opacity: (loading || !req.suggested_origin) ? 0.5 : 1,
                }}
              >
                批准並新增
              </button>
            </div>
          </>
        ) : (
          req.admin_note && (
            <div style={{
              marginTop: 4, padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6, fontSize: '0.85em',
              color: 'rgba(255,255,255,0.6)',
              borderLeft: '3px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>管理員備註：</span>
              {req.admin_note}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});

  const fetchRequests = useCallback(async (status) => {
    setLoading(true);
    try {
      const data = await api.getRequests(status);
      setRequests(data.requests);
      setCounts(prev => ({ ...prev, [status]: data.requests.length }));
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests(activeTab);
    }
  }, [activeTab, user, fetchRequests]);

  // Fetch all tab counts on mount
  useEffect(() => {
    if (user?.role !== 'admin') return;
    for (const tab of STATUS_TABS) {
      if (tab.key !== activeTab) {
        api.getRequests(tab.key)
          .then(data => setCounts(prev => ({ ...prev, [tab.key]: data.requests.length })))
          .catch(() => {});
      }
    }
  }, [user, activeTab]);

  if (authLoading) {
    return <p style={{ textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.5)' }}>載入中…</p>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', marginTop: 80, color: 'rgba(255,255,255,0.5)' }}>
        <h2 style={{ color: 'rgba(255,255,255,0.7)' }}>無權限</h2>
        <p>此頁面僅限管理員存取。</p>
      </div>
    );
  }

  const handleUpdate = () => {
    fetchRequests(activeTab);
    // Refresh counts for other tabs
    for (const tab of STATUS_TABS) {
      if (tab.key !== activeTab) {
        api.getRequests(tab.key)
          .then(data => setCounts(prev => ({ ...prev, [tab.key]: data.requests.length })))
          .catch(() => {});
      }
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ marginBottom: 20 }}>管理後台</h2>

      {/* Status tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 24, overflowX: 'auto',
      }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === tab.key ? '#38bdf8' : 'rgba(255,255,255,0.5)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.95em',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
            {counts[tab.key] != null && (
              <span style={{
                marginLeft: 6, fontSize: '0.8em',
                opacity: 0.7,
              }}>
                ({counts[tab.key]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 30 }}>
          載入中…
        </p>
      ) : requests.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 30 }}>
          沒有{STATUS_TABS.find(t => t.key === activeTab)?.label}的回報
        </p>
      ) : (
        requests.map(req => (
          <RequestCard key={req.id} req={req} onUpdate={handleUpdate} />
        ))
      )}
    </div>
  );
}
