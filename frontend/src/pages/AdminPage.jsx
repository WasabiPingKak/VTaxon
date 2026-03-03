import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const STATUS_TABS = [
  { key: 'pending', label: '待審核' },
  { key: 'approved', label: '已批准' },
  { key: 'rejected', label: '已駁回' },
];

const SECTION_TABS = [
  { key: 'fictional', label: '虛構物種回報' },
  { key: 'breed', label: '品種回報' },
];

// ── Fictional Species Request Card ──────────────────

function FictionalRequestCard({ req, onUpdate }) {
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
    <RequestCardShell req={req} isPending={isPending}>
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

      <AdminActions
        isPending={isPending}
        loading={loading}
        note={note}
        setNote={setNote}
        onApprove={() => handleAction('approved')}
        onReject={() => handleAction('rejected')}
        approveDisabled={!req.suggested_origin}
        approveTitle={!req.suggested_origin ? '缺少分類來源，無法批准' : ''}
        adminNote={req.admin_note}
      />
    </RequestCardShell>
  );
}

// ── Breed Request Card ──────────────────

function BreedRequestCard({ req, onUpdate }) {
  const [note, setNote] = useState(req.admin_note || '');
  const [nameEn, setNameEn] = useState(req.name_en || '');
  const [nameZh, setNameZh] = useState(req.name_zh || '');
  const [loading, setLoading] = useState(false);
  const isPending = req.status === 'pending';

  const handleAction = async (status) => {
    setLoading(true);
    try {
      const body = { status, admin_note: note || undefined };
      if (status === 'approved') {
        body.breed = {
          taxon_id: req.taxon_id,
          name_en: nameEn.trim(),
          name_zh: nameZh.trim() || undefined,
        };
      }
      await api.updateBreedRequest(req.id, body);
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '4px 8px', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, background: '#1a2433', color: '#e2e8f0',
    fontSize: '0.85em', width: '100%', boxSizing: 'border-box',
  };

  return (
    <RequestCardShell req={req} isPending={isPending}>
      <div style={{ display: 'grid', gap: 6, fontSize: '0.9em' }}>
        {req.name_zh && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>品種中文名：</span>
            <span style={{ color: '#fff', fontWeight: 500 }}>{req.name_zh}</span>
          </div>
        )}
        {req.name_en && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>品種英文名：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{req.name_en}</span>
          </div>
        )}
        {req.species_name && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>所屬物種：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{req.species_name}</span>
            {req.taxon_id && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em', marginLeft: 4 }}>
                (#{req.taxon_id})
              </span>
            )}
          </div>
        )}
        {req.description && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>描述：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{req.description}</span>
          </div>
        )}
      </div>

      {isPending && (
        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)' }}>批准時建立的品種資料：</div>
          <input
            type="text" value={nameEn} onChange={e => setNameEn(e.target.value)}
            placeholder="英文名（必填）" style={inputStyle}
          />
          <input
            type="text" value={nameZh} onChange={e => setNameZh(e.target.value)}
            placeholder="中文名" style={inputStyle}
          />
        </div>
      )}

      <AdminActions
        isPending={isPending}
        loading={loading}
        note={note}
        setNote={setNote}
        onApprove={() => handleAction('approved')}
        onReject={() => handleAction('rejected')}
        approveDisabled={!nameEn.trim() || !req.taxon_id}
        approveTitle={!req.taxon_id ? '缺少所屬物種' : !nameEn.trim() ? '需要英文名稱' : ''}
        adminNote={req.admin_note}
      />
    </RequestCardShell>
  );
}

// ── Shared components ──────────────────

function RequestCardShell({ req, isPending, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 14,
    }}>
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
      {children}
    </div>
  );
}

function AdminActions({ isPending, loading, note, setNote, onApprove, onReject, approveDisabled, approveTitle, adminNote }) {
  if (!isPending) {
    return adminNote ? (
      <div style={{
        marginTop: 10, padding: '8px 10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6, fontSize: '0.85em',
        color: 'rgba(255,255,255,0.6)',
        borderLeft: '3px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>管理員備註：</span>
        {adminNote}
      </div>
    ) : null;
  }

  return (
    <div style={{ marginTop: 14 }}>
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
          onClick={onReject}
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
          disabled={loading || approveDisabled}
          onClick={onApprove}
          title={approveTitle}
          style={{
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(34,197,94,0.15)', color: '#4ade80',
            border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.85em',
            opacity: (loading || approveDisabled) ? 0.5 : 1,
          }}
        >
          批准並新增
        </button>
      </div>
    </div>
  );
}

// ── Main AdminPage ──────────────────

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState('fictional');
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});

  const fetchRequests = useCallback(async (status) => {
    setLoading(true);
    try {
      const fn = section === 'fictional' ? api.getRequests : api.getBreedRequests;
      const data = await fn(status);
      setRequests(data.requests);
      setCounts(prev => ({ ...prev, [`${section}_${status}`]: data.requests.length }));
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests(activeTab);
    }
  }, [activeTab, user, fetchRequests]);

  // Fetch counts for all status tabs
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fn = section === 'fictional' ? api.getRequests : api.getBreedRequests;
    for (const tab of STATUS_TABS) {
      if (tab.key !== activeTab) {
        fn(tab.key)
          .then(data => setCounts(prev => ({ ...prev, [`${section}_${tab.key}`]: data.requests.length })))
          .catch(() => {});
      }
    }
  }, [user, section, activeTab]);

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
    const fn = section === 'fictional' ? api.getRequests : api.getBreedRequests;
    for (const tab of STATUS_TABS) {
      if (tab.key !== activeTab) {
        fn(tab.key)
          .then(data => setCounts(prev => ({ ...prev, [`${section}_${tab.key}`]: data.requests.length })))
          .catch(() => {});
      }
    }
  };

  function handleSectionChange(key) {
    setSection(key);
    setActiveTab('pending');
    setRequests([]);
    setCounts({});
  }

  const CardComponent = section === 'fictional' ? FictionalRequestCard : BreedRequestCard;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ marginBottom: 20 }}>管理後台</h2>

      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
      }}>
        {SECTION_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleSectionChange(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: section === tab.key ? 600 : 400,
              background: section === tab.key ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
              color: section === tab.key ? '#38bdf8' : 'rgba(255,255,255,0.6)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 24, overflowX: 'auto',
      }}>
        {STATUS_TABS.map(tab => {
          const countKey = `${section}_${tab.key}`;
          return (
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
              {counts[countKey] != null && (
                <span style={{
                  marginLeft: 6, fontSize: '0.8em',
                  opacity: 0.7,
                }}>
                  ({counts[countKey]})
                </span>
              )}
            </button>
          );
        })}
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
          <CardComponent key={req.id} req={req} onUpdate={handleUpdate} />
        ))
      )}
    </div>
  );
}
