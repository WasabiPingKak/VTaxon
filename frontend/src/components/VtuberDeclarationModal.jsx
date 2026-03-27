import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function VtuberDeclarationModal() {
  const { user, setUser, signOut } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.vtuber_declaration_at) return null;

  async function handleConfirm() {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      const updated = await api.updateMe({ vtuber_declaration_at: true });
      setUser(updated);
    } catch (err) {
      console.error('Declaration failed:', err);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeave() {
    await signOut();
    window.location.href = '/';
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.2em' }}>VTuber 身份確認</h2>

        <div style={{ marginBottom: '16px', lineHeight: 1.7, fontSize: '0.95em', color: 'rgba(255,255,255,0.85)' }}>
          <p style={{ margin: '0 0 12px' }}>
            本服務僅供<strong>以虛擬角色身份進行創作活動的頻道主</strong>使用。
          </p>
          <p style={{ margin: '0 0 12px' }}>
            為了維護社群品質，請確認您符合以下條件後再繼續使用：
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li>您的頻道以虛擬形象活動為主</li>
            <li>偶爾露臉不影響資格，但虛擬形象應為您的主要活動身份</li>
          </ul>
          <p style={{ margin: 0, fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>
            管理團隊保留依實際情況判斷是否符合收錄標準的權利。
            不符標準的帳號可能會被隱藏，您可以透過申訴流程提出說明。
          </p>
        </div>

        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px',
          marginBottom: '20px', cursor: 'pointer', fontSize: '0.95em',
        }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
          <span>我確認自己以虛擬角色身份進行創作活動</span>
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLeave}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.95em',
              cursor: 'pointer',
            }}
          >
            我不符合條件
          </button>
          <button
            onClick={handleConfirm}
            disabled={!agreed || submitting}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: agreed ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              color: agreed ? '#0d1526' : 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontSize: '0.95em',
              cursor: agreed ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {submitting ? '提交中...' : '確認並繼續'}
          </button>
        </div>

        <p style={{
          margin: '12px 0 0', fontSize: '0.8em', color: 'rgba(255,255,255,0.35)',
          textAlign: 'center', lineHeight: 1.5,
        }}>
          若您不符合條件但已誤觸註冊，點選「我不符合條件」即可登出。
          您的帳號不會被刪除，日後若符合條件仍可重新登入使用。
        </p>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const modalStyle = {
  background: '#1a2236',
  borderRadius: '12px',
  padding: '28px',
  maxWidth: '480px',
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)',
};
