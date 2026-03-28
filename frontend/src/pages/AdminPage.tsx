import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import SEOHead from '../components/SEOHead';
import type { User, OAuthAccount } from '../types';

// ── Local types ──

interface StatusTab {
  key: string;
  label: string;
}

interface SectionTab {
  key: string;
  label: string;
}

interface StatusBadgeDef {
  bg: string;
  color: string;
  label: string;
}

interface ActionDef {
  status: string;
  label: string;
  style: 'primary' | 'success' | 'danger';
}

interface ActionStyleDef {
  background: string;
  color: string;
  border: string;
}

// Base request fields shared by fictional/breed/name_report
interface BaseRequest {
  id: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  user?: { display_name?: string; avatar_url?: string };
  [key: string]: unknown;
}

interface FictionalRequest extends BaseRequest {
  name_zh?: string;
  name_en?: string;
  suggested_origin?: string;
  suggested_sub_origin?: string;
  description?: string;
}

interface BreedRequestItem extends BaseRequest {
  name_zh?: string;
  name_en?: string;
  species_name?: string;
  taxon_id?: number;
  description?: string;
}

interface NameReportItem extends BaseRequest {
  report_type?: string;
  species_name?: string;
  scientific_name?: string;
  taxon_id?: number;
  current_name_zh?: string;
  suggested_name_zh?: string;
  description?: string;
}

interface ReportItem extends BaseRequest {
  reporter?: { display_name?: string; avatar_url?: string };
  reported_user_id?: string;
  reported_user?: { display_name?: string; avatar_url?: string };
  report_type?: string;
  reason?: string;
  evidence_url?: string;
}

interface PendingReviewUser {
  id: string;
  display_name: string;
  avatar_url?: string;
  visibility_reason?: string;
  appeal_note?: string;
}

interface BlacklistPreviewItem {
  provider: string;
  provider_account_id: string;
  provider_display_name?: string;
  already_banned?: boolean;
}

interface UserDetail extends User {
  oauth_accounts?: OAuthAccount[];
}

// Union type for all request cards
type AnyRequest = FictionalRequest | BreedRequestItem | NameReportItem | ReportItem | PendingReviewUser;

// ── Constants ──

const REQUEST_STATUS_TABS: StatusTab[] = [
  { key: 'pending', label: '待審核' },
  { key: 'received', label: '已排入待辦' },
  { key: 'in_progress', label: '處理中' },
  { key: 'completed', label: '已完成' },
  { key: 'rejected', label: '不處理' },
];

const REPORT_STATUS_TABS: StatusTab[] = [
  { key: 'pending', label: '待審核' },
  { key: 'investigating', label: '調查中' },
  { key: 'confirmed', label: '已確認' },
  { key: 'dismissed', label: '不處理' },
];

const SECTION_TABS: SectionTab[] = [
  { key: 'fictional', label: '虛構物種回報' },
  { key: 'breed', label: '品種回報' },
  { key: 'name_report', label: '名稱回報' },
  { key: 'report', label: '帳號檢舉' },
  { key: 'visibility', label: '帳號審核' },
];

const SECTION_ACTIVE_STATUSES: Record<string, string[]> = {
  fictional: ['pending', 'received', 'in_progress'],
  breed: ['pending', 'received', 'in_progress'],
  name_report: ['pending', 'received', 'in_progress'],
  report: ['pending', 'investigating'],
  visibility: ['pending_review'],
};

const STATUS_BADGE: Record<string, StatusBadgeDef> = {
  pending:       { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: '待審核' },
  received:      { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8', label: '已排入待辦' },
  in_progress:   { bg: 'rgba(234,179,8,0.15)', color: '#eab308', label: '處理中' },
  completed:     { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: '已完成' },
  approved:      { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: '已批准' },
  rejected:      { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: '不處理' },
  investigating: { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8', label: '調查中' },
  confirmed:     { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: '已確認' },
  dismissed:     { bg: 'rgba(100,100,100,0.15)', color: '#999', label: '不處理' },
  pending_review: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '待審核' },
};

const REQUEST_ACTIONS: Record<string, ActionDef[]> = {
  pending:     [
    { status: 'received', label: '排入待辦', style: 'primary' },
    { status: 'rejected', label: '不處理', style: 'danger' },
  ],
  received:    [
    { status: 'in_progress', label: '開始處理', style: 'primary' },
    { status: 'rejected', label: '不處理', style: 'danger' },
  ],
  in_progress: [
    { status: 'completed', label: '完成', style: 'success' },
    { status: 'rejected', label: '不處理', style: 'danger' },
  ],
};

const REPORT_ACTIONS: Record<string, ActionDef[]> = {
  pending:        [
    { status: 'investigating', label: '開始調查', style: 'primary' },
    { status: 'dismissed', label: '不處理', style: 'danger' },
  ],
  investigating:  [
    { status: 'confirmed', label: '確認處理', style: 'success' },
    { status: 'dismissed', label: '不處理', style: 'danger' },
  ],
};

const ACTION_STYLES: Record<string, ActionStyleDef> = {
  primary: {
    background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
    border: '1px solid rgba(56,189,248,0.25)',
  },
  success: {
    background: 'rgba(34,197,94,0.15)', color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)', color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)',
  },
};

// ── Fictional Species Request Card ──────────────────

interface CardProps {
  req: AnyRequest;
  onUpdate: () => void;
}

const FictionalRequestCard = memo(function FictionalRequestCard({ req, onUpdate }: CardProps) {
  const r = req as FictionalRequest;
  const [note, setNote] = useState(r.admin_note || '');
  const [loading, setLoading] = useState(false);
  const actions = REQUEST_ACTIONS[r.status];

  const handleAction = async (status: string): Promise<void> => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await api.updateRequest(r.id, { status, admin_note: note || undefined } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequestCardShell req={r}>
      <div style={{ display: 'grid', gap: 6, fontSize: '0.9em' }}>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>中文名稱：</span>
          <span style={{ color: '#fff', fontWeight: 500 }}>{r.name_zh}</span>
        </div>
        {r.name_en && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>英文名稱：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.name_en}</span>
          </div>
        )}
        {(r.suggested_origin || r.suggested_sub_origin) && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>建議分類：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              {r.suggested_origin}
              {r.suggested_sub_origin && ` → ${r.suggested_sub_origin}`}
            </span>
          </div>
        )}
        {r.description && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>描述：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.description}</span>
          </div>
        )}
      </div>

      <MultiStageActions
        actions={actions}
        loading={loading}
        note={note}
        setNote={setNote}
        onAction={handleAction}
        adminNote={r.admin_note}
      />
    </RequestCardShell>
  );
});

// ── Breed Request Card ──────────────────

const BreedRequestCard = memo(function BreedRequestCard({ req, onUpdate }: CardProps) {
  const r = req as BreedRequestItem;
  const [note, setNote] = useState(r.admin_note || '');
  const [loading, setLoading] = useState(false);
  const actions = REQUEST_ACTIONS[r.status];

  const handleAction = async (status: string): Promise<void> => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await api.updateBreedRequest(r.id, { status, admin_note: note || undefined } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequestCardShell req={r}>
      <div style={{ display: 'grid', gap: 6, fontSize: '0.9em' }}>
        {r.name_zh && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>品種中文名：</span>
            <span style={{ color: '#fff', fontWeight: 500 }}>{r.name_zh}</span>
          </div>
        )}
        {r.name_en && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>品種英文名：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.name_en}</span>
          </div>
        )}
        {r.species_name && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>所屬物種：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.species_name}</span>
            {r.taxon_id && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em', marginLeft: 4 }}>
                (#{r.taxon_id})
              </span>
            )}
          </div>
        )}
        {r.description && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>描述：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.description}</span>
          </div>
        )}
      </div>

      <MultiStageActions
        actions={actions}
        loading={loading}
        note={note}
        setNote={setNote}
        onAction={handleAction}
        adminNote={r.admin_note}
      />
    </RequestCardShell>
  );
});

// ── Name Report Card ──────────────────

const NameReportCard = memo(function NameReportCard({ req, onUpdate }: CardProps) {
  const r = req as NameReportItem;
  const [note, setNote] = useState(r.admin_note || '');
  const [loading, setLoading] = useState(false);
  const actions = REQUEST_ACTIONS[r.status];

  const handleAction = async (status: string): Promise<void> => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await api.updateNameReport(r.id, { status, admin_note: note || undefined } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const reportTypeLabel = r.report_type === 'missing_zh' ? '中文名缺漏'
    : r.report_type === 'not_found' ? '搜尋不到物種' : '中文名錯誤';

  return (
    <RequestCardShell req={r}>
      <div style={{ display: 'grid', gap: 6, fontSize: '0.9em' }}>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>問題類型：</span>
          <span style={{
            display: 'inline-block', padding: '1px 8px', borderRadius: 4,
            fontSize: '0.85em', fontWeight: 600,
            background: r.report_type === 'not_found' ? 'rgba(239,68,68,0.15)'
              : r.report_type === 'missing_zh' ? 'rgba(56,189,248,0.15)' : 'rgba(251,146,60,0.15)',
            color: r.report_type === 'not_found' ? '#f87171'
              : r.report_type === 'missing_zh' ? '#38bdf8' : '#fb923c',
          }}>
            {reportTypeLabel}
          </span>
        </div>
        {r.species_name && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>物種：</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.species_name}</span>
            {r.scientific_name && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginLeft: 4 }}>
                {r.scientific_name}
              </span>
            )}
            {r.taxon_id && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em', marginLeft: 4 }}>
                (#{r.taxon_id})
              </span>
            )}
          </div>
        )}
        {r.current_name_zh && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>目前中文名：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.current_name_zh}</span>
          </div>
        )}
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>建議中文名：</span>
          <span style={{ color: '#fff', fontWeight: 500 }}>{r.suggested_name_zh}</span>
        </div>
        {r.description && (
          <div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>補充說明：</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.description}</span>
          </div>
        )}
      </div>

      <MultiStageActions
        actions={actions}
        loading={loading}
        note={note}
        setNote={setNote}
        onAction={handleAction}
        adminNote={r.admin_note}
      />
    </RequestCardShell>
  );
});

// ── Report Card ──────────────────

const ReportCard = memo(function ReportCard({ req, onUpdate }: CardProps) {
  const r = req as ReportItem;
  const [note, setNote] = useState(r.admin_note || '');
  const [loading, setLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<BlacklistPreviewItem[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hideLoading, setHideLoading] = useState(false);
  const actions = REPORT_ACTIONS[r.status];
  const isTerminal = !actions;

  // Fetch reported user detail
  useEffect(() => {
    if (!r.reported_user_id) return;
    let cancelled = false;
    setDetailLoading(true);
    api.getUser(r.reported_user_id)
      .then((data: UserDetail) => { if (!cancelled) setUserDetail(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [r.reported_user_id]);

  const handleAction = async (status: string): Promise<void> => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await api.updateReport(r.id, { status, admin_note: note || undefined } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (): Promise<void> => {
    setPreviewLoading(true);
    try {
      const data = await api.getBlacklistPreview(r.id) as unknown as { identifiers: BlacklistPreviewItem[] };
      const identifiers = data.identifiers;
      setPreviewItems(identifiers);
      const sel = new Set<string>();
      for (const it of identifiers) {
        if (!it.already_banned) sel.add(`${it.provider}:${it.provider_account_id}`);
      }
      setSelectedIds(sel);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleId = (key: string): void => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleBan = async (): Promise<void> => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const identifiers = [...selectedIds].map(k => {
        const [type, ...rest] = k.split(':');
        return { identifier_type: type, identifier_value: rest.join(':') };
      });
      await api.banUser(r.id, {
        identifiers,
        admin_note: note || undefined,
        reason: r.reason,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (): Promise<void> => {
    const reason = '您的頻道內容以真人形象為主，不符合本服務的收錄標準';
    const userName = r.reported_user?.display_name || '此使用者';
    const confirmed = window.confirm(
      `即將隱藏「${userName}」\n\n`
      + `對方下次登入時會看到以下通知：\n`
      + `────────────────\n`
      + `帳號已被暫時隱藏\n\n`
      + `經管理團隊審核，您的帳號目前已從分類樹和目錄中隱藏。\n`
      + `處分理由：${reason}\n\n`
      + `這不是永久封鎖。如果您認為此判斷有誤，或已改善相關情況，可以提出申訴，管理團隊會重新審核。\n`
      + `────────────────\n\n`
      + `確定要執行嗎？`
    );
    if (!confirmed) return;

    setHideLoading(true);
    try {
      await api.hideReportedUser(r.id, {
        reason,
        admin_note: note || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setHideLoading(false);
    }
  };

  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '16px 20px', marginBottom: 14,
    }}>
      {/* Header: reporter info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12, fontSize: '0.85em', color: 'rgba(255,255,255,0.5)',
      }}>
        {r.reporter?.avatar_url ? (
          <img src={r.reporter.avatar_url} alt={r.reporter?.display_name || ''} loading="lazy" style={{
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
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>
          舉報人：{r.reporter?.display_name || '匿名'}
        </span>
        <span>·</span>
        <span>{new Date(r.created_at).toLocaleDateString('zh-TW')}</span>
        <span style={{
          marginLeft: 'auto', padding: '2px 8px', borderRadius: 4,
          fontSize: '0.8em', fontWeight: 600,
          background: badge.bg, color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Report type badge */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: 4,
          fontSize: '0.8em', fontWeight: 600,
          background: r.report_type === 'not_vtuber'
            ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.15)',
          color: r.report_type === 'not_vtuber' ? '#fb923c' : '#f87171',
          border: `1px solid ${r.report_type === 'not_vtuber'
            ? 'rgba(251,146,60,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          {r.report_type === 'not_vtuber' ? '非VTuber/ACG' : '偽冒帳號'}
        </span>
      </div>

      {/* Reported user (highlighted) */}
      <div style={{
        borderRadius: 6,
        background: 'rgba(234,179,8,0.08)',
        border: '1px solid rgba(234,179,8,0.15)',
        marginBottom: 10, overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
        }}>
          {r.reported_user?.avatar_url ? (
            <img src={r.reported_user.avatar_url} alt={r.reported_user?.display_name || ''} loading="lazy" style={{
              width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'rgba(255,255,255,0.4)',
            }}>?</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#eab308' }}>
              {r.reported_user?.display_name || '已刪除使用者'}
            </div>
            <div style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.4)' }}>被舉報者</div>
          </div>

          {/* OAuth account badges */}
          {(userDetail?.oauth_accounts || []).map(a => (
            <a key={a.id || `${a.provider}-${a.provider_display_name}`}
              href={a.channel_url || '#'} target="_blank" rel="noopener noreferrer"
              title={`${a.provider === 'youtube' ? 'YouTube' : 'Twitch'}: ${a.provider_display_name || ''}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 4, fontSize: '0.75em', fontWeight: 500,
                textDecoration: 'none',
                background: a.provider === 'youtube' ? 'rgba(255,0,0,0.12)' : 'rgba(145,70,255,0.12)',
                color: a.provider === 'youtube' ? '#f87171' : '#a78bfa',
                border: `1px solid ${a.provider === 'youtube' ? 'rgba(255,0,0,0.2)' : 'rgba(145,70,255,0.2)'}`,
              }}>
              {a.provider === 'youtube' ? 'YT' : 'TW'}
              {a.provider_display_name && (
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.provider_display_name}
                </span>
              )}
            </a>
          ))}
          {detailLoading && (
            <span style={{
              display: 'inline-block', width: 12, height: 12,
              border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#eab308',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          )}

          {/* Detail toggle */}
          {r.reported_user && (
            <button type="button" onClick={() => setDetailOpen(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8em', padding: '2px 4px',
            }} title="展開詳細資訊">
              {detailOpen ? '▲' : '▼'}
            </button>
          )}
        </div>

        {/* Expandable detail panel */}
        {detailOpen && userDetail && (
          <div style={{
            padding: '0 12px 10px', fontSize: '0.83em',
            borderTop: '1px solid rgba(234,179,8,0.1)',
          }}>
            {userDetail.bio && (
              <div style={{
                marginTop: 8, padding: '6px 10px', borderRadius: 4,
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', lineHeight: 1.5,
              }}>
                {userDetail.bio}
              </div>
            )}
            {(userDetail.oauth_accounts || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>綁定帳號：</div>
                {(userDetail.oauth_accounts || []).map(a => (
                  <div key={a.id || `${a.provider}-${a.provider_display_name}`} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', marginBottom: 3, borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)',
                  }}>
                    <span style={{
                      fontWeight: 600, fontSize: '0.9em', minWidth: 56,
                      color: a.provider === 'youtube' ? '#f87171' : '#a78bfa',
                    }}>
                      {a.provider === 'youtube' ? 'YouTube' : 'Twitch'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {a.provider_display_name || '(unknown)'}
                    </span>
                    {a.channel_url && (
                      <a href={a.channel_url} target="_blank" rel="noopener noreferrer"
                        style={{ marginLeft: 'auto', color: '#38bdf8', fontSize: '0.9em' }}>
                        開啟頻道
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            {userDetail.social_links && Object.keys(userDetail.social_links).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>社群連結：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(userDetail.social_links).map(([key, url]) => (
                    <a key={key} href={key === 'email' ? `mailto:${url}` : url}
                      target={key === 'email' ? undefined : '_blank'} rel="noopener noreferrer"
                      style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: '0.85em',
                        background: 'rgba(255,255,255,0.05)', color: '#38bdf8',
                        textDecoration: 'none',
                      }}>
                      {key}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {userDetail.profile_data && Object.keys(userDetail.profile_data).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>角色資料：</div>
                <div style={{
                  display: 'grid', gap: 2, padding: '4px 8px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 4,
                }}>
                  {(userDetail.profile_data as Record<string, string>).activity_status && (
                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>狀態：</span>{
                      ({ active: '活動中', hiatus: '休止', preparing: '準備中' } as Record<string, string>)[(userDetail.profile_data as Record<string, string>).activity_status] || (userDetail.profile_data as Record<string, string>).activity_status
                    }</div>
                  )}
                  {(userDetail.profile_data as Record<string, string>).debut_date && (
                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>出道日期：</span>{(userDetail.profile_data as Record<string, string>).debut_date}</div>
                  )}
                  {(userDetail.profile_data as Record<string, string>).gender && (
                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>性別：</span>{(userDetail.profile_data as Record<string, string>).gender}</div>
                  )}
                  {(userDetail.profile_data as Record<string, string>).fan_name && (
                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>粉絲名：</span>{(userDetail.profile_data as Record<string, string>).fan_name}</div>
                  )}
                </div>
              </div>
            )}
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.35)' }}>
              註冊於 {new Date(userDetail.created_at).toLocaleDateString('zh-TW')}
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      <div style={{ fontSize: '0.9em', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>理由：</span>
        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.reason}</span>
      </div>

      {/* Evidence URL */}
      {r.evidence_url && (
        <div style={{ fontSize: '0.85em', marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>證據：</span>
          <a href={r.evidence_url} target="_blank" rel="noopener noreferrer"
            style={{ color: '#38bdf8', wordBreak: 'break-all' }}>
            {r.evidence_url}
          </a>
        </div>
      )}

      {/* Admin actions for non-terminal reports */}
      {!isTerminal && (
        <div style={{ marginTop: 14 }}>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="管理員備註（選填）" rows={2}
            autoComplete="new-password"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '8px 10px',
              color: '#fff', fontSize: '0.85em', resize: 'vertical',
            }}
          />

          {/* For investigating status with confirm action, show blacklist preview */}
          {r.status === 'investigating' && !previewItems && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" disabled={loading} onClick={() => handleAction('dismissed')} style={{
                padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                ...ACTION_STYLES.danger, fontSize: '0.85em',
                opacity: loading ? 0.5 : 1,
              }}>
                不處理
              </button>
              <button type="button" disabled={hideLoading || !r.reported_user} onClick={handleHide} style={{
                padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.85em',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
                opacity: (hideLoading || !r.reported_user) ? 0.5 : 1,
              }}>
                {hideLoading ? '處理中…' : '隱藏使用者'}
              </button>
              <button type="button" disabled={previewLoading || !r.reported_user} onClick={handlePreview} style={{
                padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                ...ACTION_STYLES.success, fontSize: '0.85em',
                opacity: (previewLoading || !r.reported_user) ? 0.5 : 1,
              }}>
                {previewLoading ? '載入中…' : r.report_type === 'not_vtuber'
                  ? '確認非VTuber並預覽可封鎖項目' : '確認偽冒並預覽可封鎖項目'}
              </button>
            </div>
          )}

          {/* For pending reports: simple action buttons */}
          {r.status === 'pending' && actions && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              {actions.map(act => (
                <button
                  key={act.status}
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction(act.status)}
                  style={{
                    padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                    ...ACTION_STYLES[act.style], fontSize: '0.85em',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}

          {/* Blacklist preview for investigating */}
          {r.status === 'investigating' && previewItems && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                選擇要封鎖的帳號識別碼：
              </div>
              {previewItems.map(it => {
                const key = `${it.provider}:${it.provider_account_id}`;
                const checked = selectedIds.has(key);
                return (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 4, marginBottom: 4,
                    background: it.already_banned
                      ? 'rgba(100,100,100,0.08)' : 'rgba(255,255,255,0.03)',
                    opacity: it.already_banned ? 0.5 : 1,
                    cursor: it.already_banned ? 'default' : 'pointer',
                    fontSize: '0.85em',
                  }}>
                    <input
                      type="checkbox"
                      checked={it.already_banned || checked}
                      disabled={it.already_banned}
                      onChange={() => toggleId(key)}
                    />
                    <span style={{
                      fontWeight: 500,
                      color: it.provider === 'youtube' ? '#f87171' : '#a78bfa',
                    }}>
                      {it.provider === 'youtube' ? 'YouTube' : 'Twitch'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {it.provider_display_name || it.provider_account_id}
                    </span>
                    {it.already_banned && (
                      <span style={{ fontSize: '0.8em', color: '#999' }}>（已封鎖）</span>
                    )}
                  </label>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" disabled={loading} onClick={() => handleAction('dismissed')} style={{
                  padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                  ...ACTION_STYLES.danger, fontSize: '0.85em',
                  opacity: loading ? 0.5 : 1,
                }}>
                  不處理
                </button>
                <button
                  type="button"
                  disabled={loading || selectedIds.size === 0}
                  onClick={handleBan}
                  style={{
                    padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                    ...ACTION_STYLES.success, fontSize: '0.85em',
                    fontWeight: 600,
                    opacity: (loading || selectedIds.size === 0) ? 0.5 : 1,
                  }}
                >
                  {loading ? '處理中…' : r.report_type === 'not_vtuber'
                    ? `確認非VTuber並封鎖 (${selectedIds.size})`
                    : `確認偽冒並封鎖 (${selectedIds.size})`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin note for terminal reports */}
      {isTerminal && r.admin_note && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6, fontSize: '0.85em',
          color: 'rgba(255,255,255,0.6)',
          borderLeft: '3px solid rgba(255,255,255,0.1)',
          whiteSpace: 'pre-wrap',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>管理員備註：</span>
          {r.admin_note}
        </div>
      )}
    </div>
  );
});

// ── Shared components ──────────────────

interface RequestCardShellProps {
  req: BaseRequest;
  children: React.ReactNode;
}

function RequestCardShell({ req, children }: RequestCardShellProps): React.JSX.Element {
  const badge = STATUS_BADGE[req.status] || STATUS_BADGE.pending;

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
          <img src={req.user.avatar_url} alt={req.user?.display_name || ''} loading="lazy" style={{
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
        <span style={{
          marginLeft: 'auto',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '0.8em',
          fontWeight: 600,
          background: badge.bg,
          color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>
      {children}
    </div>
  );
}

interface MultiStageActionsProps {
  actions: ActionDef[] | undefined;
  loading: boolean;
  note: string;
  setNote: (note: string) => void;
  onAction: (status: string) => void;
  adminNote: string | null;
}

function MultiStageActions({ actions, loading, note, setNote, onAction, adminNote }: MultiStageActionsProps): React.JSX.Element | null {
  if (!actions) {
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
        autoComplete="new-password"
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
        {actions.map(act => (
          <button
            key={act.status}
            type="button"
            disabled={loading}
            onClick={() => onAction(act.status)}
            style={{
              padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
              ...ACTION_STYLES[act.style],
              fontSize: '0.85em',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Export Toolbar (for "已受理" tab) ──────────────────

interface ExportToolbarProps {
  section: string;
  requestCount: number;
  onTransitioned: () => void;
}

function ExportToolbar({ section, requestCount, onTransitioned }: ExportToolbarProps): React.JSX.Element {
  const [exporting, setExporting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string): void => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const data = section === 'fictional'
        ? await api.exportFictionalRequests()
        : await api.exportBreedRequests();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${section}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`已匯出 ${((data as unknown as { export_metadata: { total_requests: number } }).export_metadata?.total_requests ?? (data as unknown[]).length)} 筆回報`);
    } catch (err) {
      alert('匯出失敗：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  const handleTransition = async (): Promise<void> => {
    setTransitioning(true);
    try {
      const data = section === 'fictional'
        ? await api.transitionFictionalRequests()
        : await api.transitionBreedRequests();
      showToast(`已將 ${((data as unknown as { updated: number }).updated ?? 0)} 筆回報轉為處理中`);
      onTransitioned();
    } catch (err) {
      alert('轉移失敗：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTransitioning(false);
    }
  };

  const disabled = requestCount === 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          disabled={disabled || exporting}
          onClick={handleExport}
          style={{
            padding: '6px 14px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
            background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
            border: '1px solid rgba(56,189,248,0.25)',
            fontSize: '0.85em', fontWeight: 500,
            opacity: (disabled || exporting) ? 0.4 : 1,
          }}
        >
          {exporting ? '匯出中…' : '匯出'}
        </button>
        <button
          type="button"
          disabled={disabled || transitioning}
          onClick={handleTransition}
          style={{
            padding: '6px 14px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
            background: 'rgba(234,179,8,0.12)', color: '#eab308',
            border: '1px solid rgba(234,179,8,0.25)',
            fontSize: '0.85em', fontWeight: 500,
            opacity: (disabled || transitioning) ? 0.4 : 1,
          }}
        >
          {transitioning ? '轉移中…' : '全部轉為處理中'}
        </button>
      </div>
      {toast && (
        <div style={{
          marginTop: 8, padding: '6px 12px', borderRadius: 6,
          background: 'rgba(34,197,94,0.15)', color: '#4ade80',
          fontSize: '0.85em', display: 'inline-block',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Pending Review Card (visibility appeals) ──────────────────

const PendingReviewCard = memo(function PendingReviewCard({ req: user, onUpdate }: CardProps) {
  const u = user as PendingReviewUser;
  const [loading, setLoading] = useState(false);

  const handleVisibility = async (visibility: string): Promise<void> => {
    setLoading(true);
    try {
      await api.setUserVisibility(u.id, {
        visibility,
        reason: visibility === 'hidden' ? u.visibility_reason : undefined,
      });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '16px 20px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {u.avatar_url ? (
          <img src={u.avatar_url} alt={u.display_name} loading="lazy" style={{
            width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(255,255,255,0.4)',
          }}>?</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95em' }}>{u.display_name}</div>
          <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)' }}>
            隱藏原因：{u.visibility_reason || '(未填寫)'}
          </div>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 4,
          fontSize: '0.8em', fontWeight: 600,
          background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
        }}>
          申訴中
        </span>
      </div>

      {u.appeal_note && (
        <div style={{
          padding: '10px 12px', marginBottom: 12, borderRadius: 6,
          background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.15)',
          fontSize: '0.9em', whiteSpace: 'pre-wrap', lineHeight: 1.6,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontSize: '0.85em' }}>
            申訴說明：
          </div>
          {u.appeal_note}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" disabled={loading} onClick={() => handleVisibility('hidden')} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
          fontSize: '0.85em',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#f87171',
          opacity: loading ? 0.5 : 1,
        }}>
          維持隱藏
        </button>
        <button type="button" disabled={loading} onClick={() => handleVisibility('visible')} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
          fontSize: '0.85em',
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#4ade80', fontWeight: 600,
          opacity: loading ? 0.5 : 1,
        }}>
          恢復顯示
        </button>
      </div>
    </div>
  );
});


// ── Main AdminPage ──────────────────

export default function AdminPage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState('fictional');
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState<AnyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchRequests = useCallback(async (status: string) => {
    setLoading(true);
    try {
      if (section === 'visibility') {
        const data = await api.getPendingReviews();
        const items = data as unknown as PendingReviewUser[];
        setRequests(items as AnyRequest[]);
        setCounts(prev => ({ ...prev, visibility_pending_review: items.length }));
      } else {
        const fn = section === 'fictional' ? api.getRequests
          : section === 'breed' ? api.getBreedRequests
          : section === 'name_report' ? api.getNameReports
          : api.getReports;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fn(status) as any;
        // API may return array directly or wrapped in {requests:} / {reports:}
        const items: AnyRequest[] = Array.isArray(data) ? data : (data.requests ?? data.reports ?? []);
        setRequests(items);
        setCounts(prev => ({ ...prev, [`${section}_${status}`]: items.length }));
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    if (isAdmin) {
      fetchRequests(activeTab);
    }
  }, [activeTab, isAdmin, fetchRequests]);

  const VISIBILITY_STATUS_TABS: StatusTab[] = [
    { key: 'pending_review', label: '待審核' },
  ];

  const currentStatusTabs = section === 'visibility' ? VISIBILITY_STATUS_TABS
    : section === 'report' ? REPORT_STATUS_TABS
    : section === 'name_report' ? REQUEST_STATUS_TABS
    : REQUEST_STATUS_TABS;

  const fetchAllPendingCounts = useCallback(() => {
    if (!isAdmin) return;
    api.getAdminCounts()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        const fc = data.fictional || {};
        const bc = data.breed || {};
        const nc = data.name_report || {};
        const rc = data.report || {};
        const vc = data.visibility || {};
        const newCounts: Record<string, number> = {};
        for (const [key, obj] of Object.entries({ fictional: fc, breed: bc, name_report: nc, report: rc, visibility: vc })) {
          for (const [status, count] of Object.entries(obj)) {
            newCounts[`${key}_${status}`] = count as number;
          }
        }
        setCounts(prev => ({ ...prev, ...newCounts }));
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => { fetchAllPendingCounts(); }, [fetchAllPendingCounts]);

  // Re-fetch counts when section changes (counts already pre-filled by fetchAllPendingCounts)
  useEffect(() => {
    if (isAdmin) fetchAllPendingCounts();
  }, [isAdmin, section, fetchAllPendingCounts]);

  const handleUpdate = useCallback(() => {
    fetchRequests(activeTab);
    fetchAllPendingCounts();
  }, [activeTab, fetchRequests, fetchAllPendingCounts]);

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

  function handleSectionChange(key: string): void {
    setSection(key);
    setActiveTab(key === 'visibility' ? 'pending_review' : 'pending');
    setRequests([]);
  }

  const CardComponent: React.ComponentType<CardProps> = section === 'fictional' ? FictionalRequestCard
    : section === 'breed' ? BreedRequestCard
    : section === 'name_report' ? NameReportCard
    : section === 'visibility' ? PendingReviewCard
    : ReportCard;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <SEOHead title="管理後台" noindex />
      <h2 style={{ marginBottom: 20 }}>管理後台</h2>

      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
      }}>
        {SECTION_TABS.map(tab => {
          return (
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
              {SECTION_ACTIVE_STATUSES[tab.key].map(status => {
                const c = counts[`${tab.key}_${status}`] ?? 0;
                const isActive = c > 0;
                return (
                  <span key={status} style={{
                    marginLeft: 4,
                    fontSize: '0.75em',
                    color: isActive ? (STATUS_BADGE[status]?.color || '#f87171') : 'rgba(255,255,255,0.3)',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    ({c})
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>

      {/* Status tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 24, overflowX: 'auto',
      }}>
        {currentStatusTabs.map(tab => {
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

      {/* Export toolbar for received tab (fictional / breed only) */}
      {activeTab === 'received' && section !== 'report' && (
        <ExportToolbar
          section={section}
          requestCount={requests.length}
          onTransitioned={handleUpdate}
        />
      )}

      {/* Content */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 30 }}>
          載入中…
        </p>
      ) : requests.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 30 }}>
          沒有{currentStatusTabs.find(t => t.key === activeTab)?.label}的{section === 'report' ? '檢舉' : '回報'}
        </p>
      ) : (
        requests.map(req => (
          <CardComponent key={(req as { id: string | number }).id} req={req} onUpdate={handleUpdate} />
        ))
      )}
    </div>
  );
}
