import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function ShadowBanNotice(): React.ReactElement | null {
  const { user, setUser } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showAppeal, setShowAppeal] = useState<boolean>(false);
  const [appealNote, setAppealNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!user) return null;
  if (user.visibility !== 'hidden' && user.visibility !== 'pending_review') return null;
  if (dismissed) return null;

  async function handleAppeal(): Promise<void> {
    if (!appealNote.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.submitAppeal({ appeal_note: appealNote.trim() });
      const updated = await api.getMe();
      setUser(updated);
      setShowAppeal(false);
    } catch (err: unknown) {
      console.error('Appeal failed:', err);
      alert(err instanceof Error ? err.message : '提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {user.visibility === 'hidden' ? (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2em', color: '#f59e0b' }}>
              帳號已被暫時隱藏
            </h2>

            <div style={{ marginBottom: '16px', lineHeight: 1.7, fontSize: '0.95em', color: 'rgba(255,255,255,0.85)' }}>
              <p style={{ margin: '0 0 12px' }}>
                經管理團隊審核，您的帳號目前已從分類樹和目錄中隱藏。
              </p>
              {user.visibility_reason && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(245,158,11,0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(245,158,11,0.2)',
                  marginBottom: '12px',
                }}>
                  <strong>處分理由：</strong>{user.visibility_reason}
                </div>
              )}
              {user.appeal_note ? (
                <>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    borderRadius: '6px',
                    border: '1px solid rgba(239,68,68,0.15)',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontWeight: 600, color: '#f87171', marginBottom: '6px' }}>
                      申訴已審核，維持原判
                      {user.visibility_changed_at && (
                        <span style={{ fontWeight: 400, fontSize: '0.85em', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
                          {new Date(user.visibility_changed_at).toLocaleDateString('zh-TW')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.5)' }}>
                      您先前的申訴說明：
                    </div>
                    <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{user.appeal_note}</div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9em', color: 'rgba(255,255,255,0.5)' }}>
                    若您的頻道內容已有實質改變，歡迎透過其他管道聯繫管理團隊。
                  </p>
                </>
              ) : (
                <p style={{ margin: '0 0 12px' }}>
                  這不是永久封鎖。如果您認為此判斷有誤，或已改善相關情況，
                  可以提出申訴，管理團隊會重新審核。
                </p>
              )}
            </div>

            {user.appeal_note ? (
              <button onClick={() => setDismissed(true)} style={secondaryBtnStyle}>
                我知道了
              </button>
            ) : !showAppeal ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowAppeal(true)} style={primaryBtnStyle}>
                  提出申訴
                </button>
                <button onClick={() => setDismissed(true)} style={secondaryBtnStyle}>
                  我知道了
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={appealNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAppealNote(e.target.value)}
                  placeholder="請說明您的情況，例如：已調整頻道內容、虛擬形象使用比例等..."
                  maxLength={2000}
                  style={textareaStyle}
                />
                <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'right' }}>
                  {appealNote.length} / 2000
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAppeal}
                    disabled={!appealNote.trim() || submitting}
                    style={{
                      ...primaryBtnStyle,
                      opacity: (!appealNote.trim() || submitting) ? 0.5 : 1,
                      cursor: (!appealNote.trim() || submitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? '提交中...' : '送出申訴'}
                  </button>
                  <button onClick={() => setShowAppeal(false)} style={secondaryBtnStyle}>
                    取消
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* pending_review state */
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2em', color: '#38bdf8' }}>
              申訴審核中
            </h2>
            <div style={{ marginBottom: '16px', lineHeight: 1.7, fontSize: '0.95em', color: 'rgba(255,255,255,0.85)' }}>
              <p style={{ margin: '0 0 12px' }}>
                您的申訴已送出，管理團隊正在審核中。
                審核完成後，您的帳號狀態將會更新。
              </p>
              {user.appeal_note && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(56,189,248,0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(56,189,248,0.2)',
                }}>
                  <strong>您的申訴說明：</strong>
                  <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{user.appeal_note}</div>
                </div>
              )}
            </div>
            <button onClick={() => setDismissed(true)} style={secondaryBtnStyle}>
              我知道了
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  background: '#1a2236',
  borderRadius: '12px',
  padding: '28px',
  maxWidth: '520px',
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)',
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
  background: '#38bdf8',
  color: '#0d1526',
  fontWeight: 600,
  fontSize: '0.95em',
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.7)',
  fontWeight: 500,
  fontSize: '0.95em',
  cursor: 'pointer',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100px',
  padding: '10px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: '0.95em',
  resize: 'vertical',
  boxSizing: 'border-box',
};
