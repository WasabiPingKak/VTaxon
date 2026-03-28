import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const heading: React.CSSProperties = {
  color: '#fff',
  fontWeight: 600,
  fontSize: '1.05em',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  paddingBottom: 8,
  marginTop: 32,
  marginBottom: 12,
};

const para: React.CSSProperties = {
  color: 'rgba(255,255,255,0.65)',
  fontSize: '0.88em',
  lineHeight: 1.75,
  margin: '8px 0',
};

const listStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.85em',
  lineHeight: 1.8,
  paddingLeft: 22,
  margin: '6px 0',
};

/* English section uses dimmed colors */
const headingEn: React.CSSProperties = { ...heading, color: 'rgba(255,255,255,0.5)' };
const paraEn: React.CSSProperties = { ...para, color: 'rgba(255,255,255,0.45)' };
const listStyleEn: React.CSSProperties = { ...listStyle, color: 'rgba(255,255,255,0.42)' };

const LAST_UPDATED = '2026-03-10';

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
      <SEOHead
        title="隱私權政策"
        description="VTaxon 的隱私權政策與資料保護說明"
        url="/privacy"
      />

      {/* 中文版 */}

      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>隱私權政策</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82em', margin: '0 0 32px' }}>
        最後更新：{LAST_UPDATED}
      </p>

      <h2 style={heading}>1. 服務說明</h2>
      <p style={para}>
        VTaxon（以下簡稱「本服務」）是一個面向 VTuber 社群的公開服務，將 VTuber 角色的形象特徵對應到
        現實世界的生物分類學體系，以分類樹的形式呈現角色之間的關聯。本服務由山葵冰角（Wasabi PingKak）
        由個人獨立開發與維護。
      </p>

      <h2 style={heading}>2. 收集的資料</h2>
      <p style={para}>當你登入本服務時，我們會收集以下資料：</p>
      <ul style={listStyle}>
        <li><strong>平台帳號資訊</strong>：帳號識別碼（ID）、顯示名稱、頭像 URL。這些資料來自你的 YouTube 或 Twitch 帳號。</li>
        <li><strong>角色設定資料</strong>：你在本服務中自行填寫的物種標註、角色描述等資訊。</li>
      </ul>
      <p style={para}>
        我們的應用程式<strong>不會主動儲存</strong>你的電子郵件地址。但認證服務（Supabase Auth）在 OAuth
        登入過程中會記錄你的電子郵件，僅用於帳號識別，我們不會將其用於其他用途。
        我們<strong>不會</strong>收集你的真實姓名、影片內容、觀眾資料或任何其他平台私人資訊。
      </p>

      <h2 style={heading}>3. OAuth 存取範圍</h2>
      <ul style={listStyle}>
        <li><strong>Google（YouTube）</strong>：僅請求讀取公開頻道資訊的權限（readonly），無法存取你的影片、留言或其他私人資料。</li>
        <li><strong>Twitch</strong>：僅請求基本帳號資訊（預設存取範圍），無法存取你的直播內容、訂閱者或其他私人資料。</li>
      </ul>

      <h2 style={heading}>4. 資料用途</h2>
      <p style={para}>我們收集的資料僅用於以下用途：</p>
      <ul style={listStyle}>
        <li>建立並顯示你的角色檔案（顯示名稱、頭像、物種標註）</li>
        <li>在分類樹中展示已建檔的角色關聯</li>
        <li>維持登入狀態與帳號識別</li>
        <li>管理員審核帳號資格（確認為 VTuber / ACG 頻道主）</li>
      </ul>

      <h2 style={heading}>5. 資料保留</h2>
      <p style={para}>
        你的資料會在帳號存續期間持續保留。如果你希望刪除帳號及所有相關資料，
        可以透過服務內的回報功能或直接聯繫管理員提出刪除請求。我們會在合理時間內處理你的請求。
      </p>

      <h2 style={heading}>6. Cookie 與類似技術</h2>
      <p style={para}>本服務使用以下技術維持正常運作：</p>
      <ul style={listStyle}>
        <li><strong>Cookie</strong>：用於 OAuth 認證流程與登入狀態維持。</li>
        <li><strong>localStorage</strong>：儲存 Supabase 認證 token，維持登入狀態。</li>
        <li><strong>sessionStorage</strong>：快取物種搜尋結果，提升使用體驗。</li>
      </ul>
      <p style={para}>
        我們使用 Google Analytics 來了解網站使用狀況，以改善服務品質。
        Google Analytics 會使用 Cookie 收集匿名的瀏覽資料（如頁面瀏覽次數、停留時間），但不會用於識別你的個人身份。
        我們不會使用任何追蹤 Cookie 向你投放廣告。
      </p>

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

      <h2 style={heading}>8. 資料分享與第三方服務</h2>
      <p style={para}>
        我們<strong>不會出售、交易或轉讓</strong>你的個人資料給任何第三方用於行銷或其他與本服務無關的目的。
        你的資料僅在以下情況下與第三方服務共享，且僅限於提供本服務所必需的範圍：
      </p>
      <ul style={listStyle}>
        <li><strong>Supabase</strong>（資料庫與認證託管）：儲存你的帳號資料（帳號 ID、顯示名稱、頭像 URL）與認證資訊。Supabase 作為資料處理者，依其安全政策保護資料。</li>
        <li><strong>Google OAuth / YouTube API</strong>：登入時透過 OAuth 取得你的 YouTube 頻道公開資訊（頻道 ID、名稱、頭像）。我們僅使用 OAuth token 讀取你自己的公開頻道資料，不會將你的資料回傳給 Google。</li>
        <li><strong>Twitch OAuth</strong>：登入時透過 OAuth 取得你的 Twitch 帳號公開資訊。同樣不會將你的資料回傳給 Twitch。</li>
        <li><strong>Google Cloud Run</strong>（後端執行環境）與 <strong>Firebase Hosting</strong>（前端託管）：你的請求資料經過這些 Google Cloud 基礎設施處理，受 Google Cloud 安全措施保護。</li>
        <li><strong>Google Analytics</strong>：收集匿名的網站瀏覽統計（頁面瀏覽次數、停留時間），不包含個人身份資訊。</li>
        <li><strong>GBIF / Wikidata / TaiCOL</strong>（生物分類資料來源）：我們僅向這些服務傳送物種學名進行查詢，<strong>不會傳送任何使用者個人資料</strong>。</li>
      </ul>
      <p style={para}>
        除上述情況外，我們不會向任何其他第三方揭露你的個人資料，除非法律要求或為保護使用者安全而必須配合。
      </p>

      <h2 style={heading}>9. 資料安全</h2>
      <p style={para}>
        我們採取多項技術與組織措施來保護你的資料安全：
      </p>
      <ul style={listStyle}>
        <li><strong>傳輸加密</strong>：所有資料傳輸均透過 HTTPS/TLS 加密，包括前端（Firebase Hosting）與後端（Google Cloud Run）之間的通訊。</li>
        <li><strong>認證安全</strong>：採用 JWT 數位簽章驗證（ES256 公鑰演算法），確保認證 token 無法被偽造。</li>
        <li><strong>資料庫存取控制</strong>：所有資料表均啟用行級安全策略（Row-Level Security），確保使用者只能存取自己的資料。</li>
        <li><strong>安全標頭</strong>：後端設置多項安全 HTTP 標頭（包括 X-Content-Type-Options、X-Frame-Options、Referrer-Policy），防範常見的網路攻擊。</li>
        <li><strong>跨域存取限制</strong>：CORS 政策僅允許白名單網域存取 API，防止未授權的跨域請求。</li>
        <li><strong>最小權限原則</strong>：OAuth 僅請求運作所需的最小存取範圍（YouTube readonly、Twitch 預設範圍），不會請求超出服務需求的權限。</li>
        <li><strong>託管平台安全</strong>：資料庫託管於 Supabase（具備加密儲存與自動備份），後端部署於 Google Cloud Run（符合 SOC 2、ISO 27001 等安全認證）。</li>
      </ul>
      <p style={para}>
        儘管我們盡力保護你的資料，但沒有任何網路傳輸或電子儲存方式能保證 100% 安全。
        如果你發現任何安全問題，請立即透過下方聯絡方式通知我們。
      </p>

      <h2 style={heading}>10. 兒童隱私</h2>
      <p style={para}>
        本服務不以 13 歲以下的兒童為對象，也不會刻意收集兒童的個人資料。如果我們發現不慎收集了
        兒童的資料，將會盡速刪除。
      </p>

      <h2 style={heading}>11. 政策變更</h2>
      <p style={para}>
        本隱私權政策可能會不定期更新。重大變更時，我們會在服務首頁公告。
        繼續使用本服務即表示你同意更新後的政策。
      </p>

      <h2 style={heading}>12. 聯絡方式</h2>
      <p style={para}>如果你對本隱私權政策有任何疑問，歡迎透過以下方式聯繫：</p>
      <ul style={listStyle}>
        <li>Email：<a href="mailto:wasabi.pingkak@gmail.com" style={{ color: '#38bdf8' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord：<a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues：<a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* 分隔線 */}

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '48px 0' }} />

      {/* English Version */}

      <h1 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5em', marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82em', margin: '0 0 32px' }}>
        Last updated: {LAST_UPDATED}
      </p>

      <h2 style={headingEn}>1. About This Service</h2>
      <p style={paraEn}>
        VTaxon ("the Service") is a community service for VTubers that maps VTuber character traits
        to the real-world biological taxonomy system, presenting character relationships in a
        taxonomy tree. The Service is operated by Wasabi PingKak as an independent personal project.
      </p>

      <h2 style={headingEn}>2. Data We Collect</h2>
      <p style={paraEn}>When you sign in, we collect the following data:</p>
      <ul style={listStyleEn}>
        <li><strong>Platform account information</strong>: Account ID, display name, and avatar URL from your YouTube or Twitch account.</li>
        <li><strong>Character profile data</strong>: Species annotations and character descriptions that you voluntarily provide within the Service.</li>
      </ul>
      <p style={paraEn}>
        Our application does <strong>not</strong> actively store your email address. However, the
        authentication service (Supabase Auth) records your email during the OAuth sign-in process
        solely for account identification purposes; we do not use it for any other purpose.
        We do <strong>not</strong> collect your real name, video content, viewer data,
        or any other private platform information.
      </p>

      <h2 style={headingEn}>3. OAuth Scopes</h2>
      <ul style={listStyleEn}>
        <li><strong>Google (YouTube)</strong>: We only request read-only access to public channel information. We cannot access your videos, comments, or other private data.</li>
        <li><strong>Twitch</strong>: We only request default account information scope. We cannot access your streams, subscribers, or other private data.</li>
      </ul>

      <h2 style={headingEn}>4. How We Use Your Data</h2>
      <p style={paraEn}>We use collected data solely for the following purposes:</p>
      <ul style={listStyleEn}>
        <li>Creating and displaying your character profile (display name, avatar, species annotations)</li>
        <li>Presenting character relationships in the taxonomy tree</li>
        <li>Maintaining login sessions and account identification</li>
        <li>Administrator review of account eligibility (confirming VTuber / ACG channel ownership)</li>
      </ul>

      <h2 style={headingEn}>5. Data Retention</h2>
      <p style={paraEn}>
        Your data is retained for as long as your account exists. If you wish to delete your account
        and all associated data, you may submit a request through the in-app report feature or
        contact the administrator directly. We will process your request within a reasonable timeframe.
      </p>

      <h2 style={headingEn}>6. Cookies and Similar Technologies</h2>
      <p style={paraEn}>The Service uses the following technologies to function properly:</p>
      <ul style={listStyleEn}>
        <li><strong>Cookies</strong>: Used for OAuth authentication flow and login state.</li>
        <li><strong>localStorage</strong>: Stores Supabase authentication tokens to maintain login sessions.</li>
        <li><strong>sessionStorage</strong>: Caches species search results to improve user experience.</li>
      </ul>
      <p style={paraEn}>
        We use Google Analytics to understand website usage and improve service quality.
        Google Analytics uses cookies to collect anonymous browsing data (such as page views and
        session duration), but this data is not used to identify you personally.
        We do not use any tracking cookies to serve advertisements.
      </p>

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

      <h2 style={headingEn}>8. Data Sharing and Third-Party Services</h2>
      <p style={paraEn}>
        We do <strong>not sell, trade, or transfer</strong> your personal data to any third party for marketing
        or any purpose unrelated to the Service. Your data is shared with third-party services only to the
        extent necessary to operate the Service:
      </p>
      <ul style={listStyleEn}>
        <li><strong>Supabase</strong> (database and authentication hosting): Stores your account data (account ID, display name, avatar URL) and authentication information. Supabase acts as a data processor and protects data per its security policies.</li>
        <li><strong>Google OAuth / YouTube API</strong>: During sign-in, we retrieve your YouTube channel's public information (channel ID, name, avatar) via OAuth. We only use OAuth tokens to read your own public channel data and do not transmit your data back to Google.</li>
        <li><strong>Twitch OAuth</strong>: During sign-in, we retrieve your Twitch account's public information via OAuth. We do not transmit your data back to Twitch.</li>
        <li><strong>Google Cloud Run</strong> (backend) and <strong>Firebase Hosting</strong> (frontend): Your request data is processed through these Google Cloud infrastructure services, protected by Google Cloud security measures.</li>
        <li><strong>Google Analytics</strong>: Collects anonymous website usage statistics (page views, session duration) and does not include personally identifiable information.</li>
        <li><strong>GBIF / Wikidata / TaiCOL</strong> (biological taxonomy data sources): We only send species scientific names to these services for queries. <strong>No user personal data is transmitted.</strong></li>
      </ul>
      <p style={paraEn}>
        Beyond the above, we do not disclose your personal data to any other third party unless required
        by law or necessary to protect user safety.
      </p>

      <h2 style={headingEn}>9. Data Security</h2>
      <p style={paraEn}>
        We implement multiple technical and organizational measures to protect your data:
      </p>
      <ul style={listStyleEn}>
        <li><strong>Encryption in transit</strong>: All data transmission is encrypted via HTTPS/TLS, including communication between the frontend (Firebase Hosting) and backend (Google Cloud Run).</li>
        <li><strong>Authentication security</strong>: We use JWT digital signature verification (ES256 public key algorithm) to ensure authentication tokens cannot be forged.</li>
        <li><strong>Database access control</strong>: All database tables have Row-Level Security (RLS) policies enabled, ensuring users can only access their own data.</li>
        <li><strong>Security headers</strong>: The backend sets multiple security HTTP headers (including X-Content-Type-Options, X-Frame-Options, Referrer-Policy) to defend against common web attacks.</li>
        <li><strong>Cross-origin restrictions</strong>: CORS policies only allow whitelisted domains to access the API, preventing unauthorized cross-origin requests.</li>
        <li><strong>Principle of least privilege</strong>: OAuth requests only the minimum scopes required (YouTube readonly, Twitch default scope), never requesting permissions beyond what the Service needs.</li>
        <li><strong>Hosting platform security</strong>: The database is hosted on Supabase (with encrypted storage and automatic backups), and the backend runs on Google Cloud Run (compliant with SOC 2, ISO 27001, and other security certifications).</li>
      </ul>
      <p style={paraEn}>
        While we strive to protect your data, no method of internet transmission or electronic storage
        is 100% secure. If you discover any security issues, please notify us immediately via the
        contact methods below.
      </p>

      <h2 style={headingEn}>10. Children's Privacy</h2>
      <p style={paraEn}>
        The Service is not directed at children under 13 years of age, and we do not knowingly collect
        personal data from children. If we discover that we have inadvertently collected data from a
        child, we will delete it promptly.
      </p>

      <h2 style={headingEn}>11. Changes to This Policy</h2>
      <p style={paraEn}>
        This Privacy Policy may be updated from time to time. Significant changes will be announced
        on the Service's homepage. Continued use of the Service constitutes acceptance of the updated policy.
      </p>

      <h2 style={headingEn}>12. Contact Us</h2>
      <p style={paraEn}>If you have any questions about this Privacy Policy, please reach out through:</p>
      <ul style={listStyleEn}>
        <li>Email: <a href="mailto:wasabi.pingkak@gmail.com" style={{ color: 'rgba(56,189,248,0.6)' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord: <a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(56,189,248,0.6)' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues: <a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(56,189,248,0.6)' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* Footer */}

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', textDecoration: 'none' }}>
          ← 回到首頁
        </Link>
      </div>

    </div>
  );
}
