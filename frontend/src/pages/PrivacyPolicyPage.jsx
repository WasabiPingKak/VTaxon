import { Link } from 'react-router-dom';

const heading = {
  color: '#fff',
  fontWeight: 600,
  fontSize: '1.05em',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  paddingBottom: 8,
  marginTop: 32,
  marginBottom: 12,
};

const para = {
  color: 'rgba(255,255,255,0.65)',
  fontSize: '0.88em',
  lineHeight: 1.75,
  margin: '8px 0',
};

const listStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.85em',
  lineHeight: 1.8,
  paddingLeft: 22,
  margin: '6px 0',
};

/* ── English section uses dimmed colors ── */
const headingEn = { ...heading, color: 'rgba(255,255,255,0.5)' };
const paraEn = { ...para, color: 'rgba(255,255,255,0.45)' };
const listStyleEn = { ...listStyle, color: 'rgba(255,255,255,0.42)' };

const LAST_UPDATED = '2026-03-04';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* ═══════════════════════ 中文版 ═══════════════════════ */}

      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>隱私權政策</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82em', margin: '0 0 32px' }}>
        最後更新：{LAST_UPDATED}
      </p>

      {/* 1. 服務說明 */}
      <h2 style={heading}>1. 服務說明</h2>
      <p style={para}>
        VTaxon（以下簡稱「本服務」）是一個面向 VTuber 社群的公開服務，將 VTuber 角色的形象特徵對應到
        現實世界的生物分類學體系，以分類樹的形式呈現角色之間的關聯。本服務由山葵冰角（Wasabi PingKak）
        由個人獨立開發與維護。
      </p>

      {/* 2. 收集的資料 */}
      <h2 style={heading}>2. 收集的資料</h2>
      <p style={para}>當你登入本服務時，我們會收集以下資料：</p>
      <ul style={listStyle}>
        <li><strong>平台帳號資訊</strong>：帳號識別碼（ID）、顯示名稱、頭像 URL。這些資料來自你的 YouTube 或 Twitch 帳號。</li>
        <li><strong>角色設定資料</strong>：你在本服務中自行填寫的物種標註、角色描述等資訊。</li>
      </ul>
      <p style={para}>
        我們<strong>不會</strong>收集你的電子郵件地址、真實姓名、影片內容、觀眾資料或任何其他平台私人資訊。
      </p>

      {/* 3. OAuth 存取範圍 */}
      <h2 style={heading}>3. OAuth 存取範圍</h2>
      <ul style={listStyle}>
        <li><strong>Google（YouTube）</strong>：僅請求讀取公開頻道資訊的權限（readonly），無法存取你的影片、留言或其他私人資料。</li>
        <li><strong>Twitch</strong>：僅請求基本帳號資訊（預設存取範圍），無法存取你的直播內容、訂閱者或其他私人資料。</li>
      </ul>

      {/* 4. 資料用途 */}
      <h2 style={heading}>4. 資料用途</h2>
      <p style={para}>我們收集的資料僅用於以下用途：</p>
      <ul style={listStyle}>
        <li>建立並顯示你的角色檔案（顯示名稱、頭像、物種標註）</li>
        <li>在分類樹中展示已建檔的角色關聯</li>
        <li>維持登入狀態與帳號識別</li>
        <li>管理員審核帳號資格（確認為 VTuber / ACG 頻道主）</li>
      </ul>

      {/* 5. 資料保留 */}
      <h2 style={heading}>5. 資料保留</h2>
      <p style={para}>
        你的資料會在帳號存續期間持續保留。如果你希望刪除帳號及所有相關資料，
        可以透過服務內的回報功能或直接聯繫管理員提出刪除請求。我們會在合理時間內處理你的請求。
      </p>

      {/* 6. Cookie 與類似技術 */}
      <h2 style={heading}>6. Cookie 與類似技術</h2>
      <p style={para}>本服務使用以下技術維持正常運作：</p>
      <ul style={listStyle}>
        <li><strong>Cookie</strong>：用於 OAuth 認證流程與登入狀態維持。</li>
        <li><strong>localStorage</strong>：儲存 Supabase 認證 token，維持登入狀態。</li>
        <li><strong>sessionStorage</strong>：快取物種搜尋結果，提升使用體驗。</li>
      </ul>
      <p style={para}>
        我們不使用任何第三方追蹤 Cookie 或分析工具。
      </p>

      {/* 7. 帳號刪除 */}
      <h2 style={heading}>7. 帳號刪除</h2>
      <p style={para}>
        你可以隨時透過以下方式請求刪除帳號：
      </p>
      <ul style={listStyle}>
        <li>使用服務內的「回報」功能，選擇帳號刪除類別</li>
        <li>寄送電子郵件至 <a href="mailto:wasabi.pingkak@gmail.com" style={{ color: '#38bdf8' }}>wasabi.pingkak@gmail.com</a></li>
        <li>透過 Discord 聯繫管理員</li>
      </ul>
      <p style={para}>
        帳號刪除後，你的所有資料（包括角色檔案、物種標註）將被永久移除。
      </p>

      {/* 8. 第三方服務 */}
      <h2 style={heading}>8. 第三方服務</h2>
      <p style={para}>本服務使用以下第三方服務：</p>
      <ul style={listStyle}>
        <li><strong>Supabase</strong>：資料庫託管與認證服務</li>
        <li><strong>Google OAuth</strong>：YouTube 帳號登入認證</li>
        <li><strong>Twitch OAuth</strong>：Twitch 帳號登入認證</li>
        <li><strong>GBIF（全球生物多樣性資訊機構）</strong>：生物分類學資料查詢</li>
        <li><strong>Google Cloud Run</strong>：後端服務部署</li>
      </ul>
      <p style={para}>
        這些服務有各自的隱私權政策，建議你參閱相關文件以了解它們如何處理資料。
      </p>

      {/* 9. 兒童隱私 */}
      <h2 style={heading}>9. 兒童隱私</h2>
      <p style={para}>
        本服務不以 13 歲以下的兒童為對象，也不會刻意收集兒童的個人資料。如果我們發現不慎收集了
        兒童的資料，將會盡速刪除。
      </p>

      {/* 10. 政策變更 */}
      <h2 style={heading}>10. 政策變更</h2>
      <p style={para}>
        本隱私權政策可能會不定期更新。重大變更時，我們會在服務首頁公告。
        繼續使用本服務即表示你同意更新後的政策。
      </p>

      {/* 11. 聯絡方式 */}
      <h2 style={heading}>11. 聯絡方式</h2>
      <p style={para}>如果你對本隱私權政策有任何疑問，歡迎透過以下方式聯繫：</p>
      <ul style={listStyle}>
        <li>Email：<a href="mailto:wasabi.pingkak@gmail.com" style={{ color: '#38bdf8' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord：<a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues：<a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* ═══════════════════════ 分隔線 ═══════════════════════ */}

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '48px 0' }} />

      {/* ═══════════════════════ English Version ═══════════════════════ */}

      <h1 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5em', marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82em', margin: '0 0 32px' }}>
        Last updated: {LAST_UPDATED}
      </p>

      {/* 1 */}
      <h2 style={headingEn}>1. About This Service</h2>
      <p style={paraEn}>
        VTaxon ("the Service") is a community service for VTubers that maps VTuber character traits
        to the real-world biological taxonomy system, presenting character relationships in a
        taxonomy tree. The Service is operated by Wasabi PingKak as an independent personal project.
      </p>

      {/* 2 */}
      <h2 style={headingEn}>2. Data We Collect</h2>
      <p style={paraEn}>When you sign in, we collect the following data:</p>
      <ul style={listStyleEn}>
        <li><strong>Platform account information</strong>: Account ID, display name, and avatar URL from your YouTube or Twitch account.</li>
        <li><strong>Character profile data</strong>: Species annotations and character descriptions that you voluntarily provide within the Service.</li>
      </ul>
      <p style={paraEn}>
        We do <strong>not</strong> collect your email address, real name, video content, viewer data,
        or any other private platform information.
      </p>

      {/* 3 */}
      <h2 style={headingEn}>3. OAuth Scopes</h2>
      <ul style={listStyleEn}>
        <li><strong>Google (YouTube)</strong>: We only request read-only access to public channel information. We cannot access your videos, comments, or other private data.</li>
        <li><strong>Twitch</strong>: We only request default account information scope. We cannot access your streams, subscribers, or other private data.</li>
      </ul>

      {/* 4 */}
      <h2 style={headingEn}>4. How We Use Your Data</h2>
      <p style={paraEn}>We use collected data solely for the following purposes:</p>
      <ul style={listStyleEn}>
        <li>Creating and displaying your character profile (display name, avatar, species annotations)</li>
        <li>Presenting character relationships in the taxonomy tree</li>
        <li>Maintaining login sessions and account identification</li>
        <li>Administrator review of account eligibility (confirming VTuber / ACG channel ownership)</li>
      </ul>

      {/* 5 */}
      <h2 style={headingEn}>5. Data Retention</h2>
      <p style={paraEn}>
        Your data is retained for as long as your account exists. If you wish to delete your account
        and all associated data, you may submit a request through the in-app report feature or
        contact the administrator directly. We will process your request within a reasonable timeframe.
      </p>

      {/* 6 */}
      <h2 style={headingEn}>6. Cookies and Similar Technologies</h2>
      <p style={paraEn}>The Service uses the following technologies to function properly:</p>
      <ul style={listStyleEn}>
        <li><strong>Cookies</strong>: Used for OAuth authentication flow and login state.</li>
        <li><strong>localStorage</strong>: Stores Supabase authentication tokens to maintain login sessions.</li>
        <li><strong>sessionStorage</strong>: Caches species search results to improve user experience.</li>
      </ul>
      <p style={paraEn}>
        We do not use any third-party tracking cookies or analytics tools.
      </p>

      {/* 7 */}
      <h2 style={headingEn}>7. Account Deletion</h2>
      <p style={paraEn}>You may request account deletion at any time by:</p>
      <ul style={listStyleEn}>
        <li>Using the in-app "Report" feature and selecting account deletion</li>
        <li>Sending an email to <a href="mailto:wasabi.pingkak@gmail.com" style={{ color: 'rgba(56,189,248,0.6)' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Contacting the administrator via Discord</li>
      </ul>
      <p style={paraEn}>
        Upon deletion, all your data (including character profile and species annotations) will be permanently removed.
      </p>

      {/* 8 */}
      <h2 style={headingEn}>8. Third-Party Services</h2>
      <p style={paraEn}>The Service uses the following third-party services:</p>
      <ul style={listStyleEn}>
        <li><strong>Supabase</strong>: Database hosting and authentication</li>
        <li><strong>Google OAuth</strong>: YouTube account login authentication</li>
        <li><strong>Twitch OAuth</strong>: Twitch account login authentication</li>
        <li><strong>GBIF (Global Biodiversity Information Facility)</strong>: Biological taxonomy data queries</li>
        <li><strong>Google Cloud Run</strong>: Backend service deployment</li>
      </ul>
      <p style={paraEn}>
        These services have their own privacy policies. We encourage you to review their documentation
        to understand how they handle data.
      </p>

      {/* 9 */}
      <h2 style={headingEn}>9. Children's Privacy</h2>
      <p style={paraEn}>
        The Service is not directed at children under 13 years of age, and we do not knowingly collect
        personal data from children. If we discover that we have inadvertently collected data from a
        child, we will delete it promptly.
      </p>

      {/* 10 */}
      <h2 style={headingEn}>10. Changes to This Policy</h2>
      <p style={paraEn}>
        This Privacy Policy may be updated from time to time. Significant changes will be announced
        on the Service's homepage. Continued use of the Service constitutes acceptance of the updated policy.
      </p>

      {/* 11 */}
      <h2 style={headingEn}>11. Contact Us</h2>
      <p style={paraEn}>If you have any questions about this Privacy Policy, please reach out through:</p>
      <ul style={listStyleEn}>
        <li>Email: <a href="mailto:wasabi.pingkak@gmail.com" style={{ color: 'rgba(56,189,248,0.6)' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord: <a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(56,189,248,0.6)' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues: <a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(56,189,248,0.6)' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* ═══════════════════════ Footer ═══════════════════════ */}

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', textDecoration: 'none' }}>
          ← 回到首頁
        </Link>
      </div>

    </div>
  );
}
