import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import SEOHead from '../components/SEOHead';

/* ── SVG Brand Icons (local, not exported) ── */

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function TwitchLogoWhite() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 268" fill="#fff">
      <path d="M17.458 0L0 46.556v185.262h63.98v35.686h36.592l35.638-35.686h53.505L256 165.85V0H17.458zm23.14 23.362h192.04v128.118l-40.37 40.37h-63.98L92.6 227.536v-35.686H40.598V23.362zm64.078 35.686v71.534h23.362V59.048h-23.362zm63.98 0v71.534h23.361V59.048h-23.362z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ── Styles ── */

const cardStyle = {
  maxWidth: 480,
  width: '100%',
  margin: '0 auto',
  padding: '36px 32px 32px',
  background: 'rgba(20,28,43,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

const sectionGap = { marginTop: 24 };

const amberBoxStyle = {
  background: 'rgba(245,158,11,0.08)',
  border: '1px solid rgba(245,158,11,0.25)',
  borderRadius: 10,
  padding: '14px 16px',
  ...sectionGap,
};

const infoBoxStyle = {
  background: 'rgba(56,189,248,0.05)',
  border: '1px solid rgba(56,189,248,0.12)',
  borderRadius: 10,
  padding: '16px 18px',
  ...sectionGap,
};

const btnBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  padding: '12px 0',
  fontSize: '0.95em',
  fontWeight: 500,
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

/* ── Component ── */

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithTwitch } = useAuth();
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  if (!loading && user) return <Navigate to="/profile" replace />;

  const disabled = !agreedToPrivacy;

  return (
    <div style={{
      minHeight: 'calc(100vh - 44px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <SEOHead title="登入" noindex />
      <div style={cardStyle}>

        {/* Section 1: Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <h2 style={{ margin: 0, fontSize: '1.35em', color: '#fff' }}>VTuber 物種登錄</h2>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.88em', lineHeight: 1.5 }}>
            使用直播平台帳號登入，開始標註角色的物種特徵
          </p>
        </div>

        {/* Section 2: Amber warning */}
        <div style={amberBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <WarningIcon />
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.92em' }}>僅限頻道主</span>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.82em', lineHeight: 1.6 }}>
            本服務僅供 VTuber 及 ACG 角色形象頻道主使用。尚未出道也可以註冊，只要頻道連結能識別你的身份即可。<br />
            管理員會審核帳號資格，不符資格的帳號可能被停用。
          </p>
        </div>

        {/* Section 3: Info box */}
        <div style={infoBoxStyle}>
          <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.7)', fontSize: '0.88em', fontWeight: 600 }}>
            登入時會發生什麼？
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.5)', fontSize: '0.8em', lineHeight: 1.8, listStyleType: "'▸ '" }}>
            <li><strong style={{ color: 'rgba(255,255,255,0.7)' }}>平台存取範圍</strong>：YouTube 僅讀取公開頻道資訊（readonly）；Twitch 僅讀取基本帳號資訊</li>
            <li><strong style={{ color: 'rgba(255,255,255,0.7)' }}>我們收集的資料</strong>：平台帳號識別碼、顯示名稱、頭像，以及你自行填寫的角色設定</li>
            <li><strong style={{ color: 'rgba(255,255,255,0.7)' }}>Cookie 與類似技術</strong>：用於維持登入狀態（JWT）與快取搜尋結果，不追蹤瀏覽行為</li>
          </ul>
        </div>

        {/* Section 4: Privacy checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          cursor: 'pointer',
          marginTop: 20,
          padding: '0 2px',
        }}>
          <input
            type="checkbox"
            checked={agreedToPrivacy}
            onChange={e => setAgreedToPrivacy(e.target.checked)}
            style={{ marginTop: 3, accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82em', lineHeight: 1.5 }}>
            我已閱讀並同意{' '}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'underline' }}
              onClick={e => e.stopPropagation()}
            >
              隱私權政策
            </Link>
          </span>
        </label>

        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.72em', lineHeight: 1.5, textAlign: 'center' }}>
          登入時會跳轉至認證平台 <span style={{ color: 'rgba(255,255,255,0.45)' }}>Supabase</span>，因免費方案限制，網址會顯示一串隨機字元的 supabase.co 網域，此為正常現象，並非可疑連結。
        </p>

        {/* Section 5: OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...sectionGap }}>
          <button
            disabled={disabled}
            onClick={() => { if (!disabled) signInWithGoogle(); }}
            style={{
              ...btnBase,
              background: '#141c2b',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.18)',
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          >
            <GoogleLogo />
            使用 Google（YouTube）帳號登入
          </button>

          <button
            disabled={disabled}
            onClick={() => { if (!disabled) signInWithTwitch(); }}
            style={{
              ...btnBase,
              background: '#9146ff',
              color: '#fff',
              border: 'none',
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#a970ff'; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#9146ff'; }}
          >
            <TwitchLogoWhite />
            使用 Twitch 帳號登入
          </button>

        </div>

      </div>
    </div>
  );
}
