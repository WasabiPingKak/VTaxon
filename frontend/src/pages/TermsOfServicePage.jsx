import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

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

const LAST_UPDATED = '2026-03-05';

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
      <SEOHead
        title="服務條款"
        description="VTaxon 的服務條款與使用規範"
        url="/terms"
      />

      {/* ═══════════════════════ 中文版 ═══════════════════════ */}

      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>服務條款</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82em', margin: '0 0 32px' }}>
        最後更新：{LAST_UPDATED}
      </p>

      {/* 1. 服務說明 */}
      <h2 style={heading}>1. 服務說明</h2>
      <p style={para}>
        VTaxon（以下簡稱「本服務」）是一個面向 VTuber 社群的公開服務，將 VTuber 角色的形象特徵對應到
        現實世界的生物分類學體系，以分類樹的形式呈現角色之間的關聯。本服務由山葵冰角（Wasabi PingKak）
        個人獨立開發與維護，免費提供使用。
      </p>

      {/* 2. 帳號與資格 */}
      <h2 style={heading}>2. 帳號與資格</h2>
      <ul style={listStyle}>
        <li>你必須擁有 YouTube 或 Twitch 帳號才能登入本服務。</li>
        <li>本服務設計對象為 VTuber 及 ACG 相關頻道主。管理員有權審核帳號資格，並停權不符資格的帳號。</li>
        <li>每個 YouTube / Twitch 帳號僅能對應一個 VTaxon 角色。</li>
        <li>你對你帳號下的所有操作負完全責任。</li>
      </ul>

      {/* 3. 使用規範 */}
      <h2 style={heading}>3. 使用規範</h2>
      <p style={para}>使用本服務時，你同意不得：</p>
      <ul style={listStyle}>
        <li>冒充他人身份建立角色檔案</li>
        <li>上傳或填寫含有不當、歧視、色情或違法內容的資料</li>
        <li>透過自動化工具（爬蟲、機器人）大量存取本服務</li>
        <li>嘗試攻擊、破壞或干擾本服務的正常運作</li>
        <li>濫用回報功能或提交虛假檢舉</li>
      </ul>

      {/* 4. 內容所有權 */}
      <h2 style={heading}>4. 內容所有權</h2>
      <p style={para}>
        你在本服務中填寫的角色資料（物種標註、角色描述等）的智慧財產權歸你所有。
        但你同意授權本服務在平台上公開展示這些資料（例如：在分類樹、角色目錄中顯示）。
      </p>
      <p style={para}>
        本服務使用的生物分類資料來自 GBIF（全球生物多樣性資訊機構），依其授權條款使用。
      </p>

      {/* 5. 服務可用性 */}
      <h2 style={heading}>5. 服務可用性</h2>
      <p style={para}>
        本服務為個人專案，以「現況」提供，不保證 100% 的服務可用性或即時技術支援。
        我們會盡力維持服務穩定，但不對因停機、資料遺失或技術問題造成的損失負責。
      </p>
      <p style={para}>
        我們保留在任何時候修改、暫停或終止服務的權利，並會盡可能事先通知使用者。
      </p>

      {/* 6. 帳號停權與終止 */}
      <h2 style={heading}>6. 帳號停權與終止</h2>
      <p style={para}>
        管理員有權在以下情況下停權或刪除帳號：
      </p>
      <ul style={listStyle}>
        <li>違反本服務條款</li>
        <li>經確認非 VTuber / ACG 頻道主</li>
        <li>冒充他人身份</li>
        <li>收到有效的檢舉且經查證屬實</li>
      </ul>
      <p style={para}>
        你也可以隨時要求刪除自己的帳號，詳見<Link to="/privacy" style={{ color: '#38bdf8' }}>隱私權政策</Link>。
      </p>

      {/* 7. 免責聲明 */}
      <h2 style={heading}>7. 免責聲明</h2>
      <p style={para}>
        本服務不對以下情況負責：
      </p>
      <ul style={listStyle}>
        <li>使用者填寫的資料之正確性或合法性</li>
        <li>第三方服務（Supabase、Google、Twitch、GBIF）的可用性或資料準確度</li>
        <li>因使用本服務而產生的任何間接或附帶損害</li>
      </ul>

      {/* 8. 隱私權 */}
      <h2 style={heading}>8. 隱私權</h2>
      <p style={para}>
        你的個人資料受我們的<Link to="/privacy" style={{ color: '#38bdf8' }}>隱私權政策</Link>保護。
        使用本服務即表示你同意該政策的內容。
      </p>

      {/* 9. 條款變更 */}
      <h2 style={heading}>9. 條款變更</h2>
      <p style={para}>
        本服務條款可能會不定期更新。重大變更時，我們會在服務首頁公告。
        繼續使用本服務即表示你同意更新後的條款。
      </p>

      {/* 10. 聯絡方式 */}
      <h2 style={heading}>10. 聯絡方式</h2>
      <p style={para}>如果你對本服務條款有任何疑問，歡迎透過以下方式聯繫：</p>
      <ul style={listStyle}>
        <li>Email：<a href="mailto:wasabi.pingkak@gmail.com" style={{ color: '#38bdf8' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord：<a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues：<a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* ═══════════════════════ 分隔線 ═══════════════════════ */}

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '48px 0' }} />

      {/* ═══════════════════════ English Version ═══════════════════════ */}

      <h1 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5em', marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82em', margin: '0 0 32px' }}>
        Last updated: {LAST_UPDATED}
      </p>

      {/* 1 */}
      <h2 style={headingEn}>1. About This Service</h2>
      <p style={paraEn}>
        VTaxon ("the Service") is a community service for VTubers that maps VTuber character traits
        to the real-world biological taxonomy system, presenting character relationships in a
        taxonomy tree. The Service is operated by Wasabi PingKak as a free, independent personal project.
      </p>

      {/* 2 */}
      <h2 style={headingEn}>2. Accounts and Eligibility</h2>
      <ul style={listStyleEn}>
        <li>You must have a YouTube or Twitch account to sign in to the Service.</li>
        <li>The Service is designed for VTubers and ACG-related channel owners. Administrators may review account eligibility and suspend ineligible accounts.</li>
        <li>Each YouTube / Twitch account can only be linked to one VTaxon character.</li>
        <li>You are fully responsible for all actions taken under your account.</li>
      </ul>

      {/* 3 */}
      <h2 style={headingEn}>3. Acceptable Use</h2>
      <p style={paraEn}>When using the Service, you agree not to:</p>
      <ul style={listStyleEn}>
        <li>Impersonate another person when creating a character profile</li>
        <li>Submit content that is inappropriate, discriminatory, pornographic, or illegal</li>
        <li>Use automated tools (scrapers, bots) to access the Service in bulk</li>
        <li>Attempt to attack, damage, or interfere with the normal operation of the Service</li>
        <li>Abuse the report system or submit false reports</li>
      </ul>

      {/* 4 */}
      <h2 style={headingEn}>4. Content Ownership</h2>
      <p style={paraEn}>
        You retain intellectual property rights to the character data you provide (species annotations,
        character descriptions, etc.). However, you grant the Service permission to publicly display
        this data on the platform (e.g., in taxonomy trees and character directories).
      </p>
      <p style={paraEn}>
        Biological taxonomy data used by the Service is sourced from GBIF (Global Biodiversity
        Information Facility) and used in accordance with their licensing terms.
      </p>

      {/* 5 */}
      <h2 style={headingEn}>5. Service Availability</h2>
      <p style={paraEn}>
        The Service is a personal project provided "as is" with no guarantee of 100% availability
        or immediate technical support. We will make reasonable efforts to maintain service stability
        but are not liable for losses caused by downtime, data loss, or technical issues.
      </p>
      <p style={paraEn}>
        We reserve the right to modify, suspend, or terminate the Service at any time, with
        reasonable advance notice when possible.
      </p>

      {/* 6 */}
      <h2 style={headingEn}>6. Account Suspension and Termination</h2>
      <p style={paraEn}>Administrators may suspend or delete accounts under the following circumstances:</p>
      <ul style={listStyleEn}>
        <li>Violation of these Terms of Service</li>
        <li>Confirmed as not a VTuber / ACG channel owner</li>
        <li>Impersonation of another person</li>
        <li>Valid reports that have been verified</li>
      </ul>
      <p style={paraEn}>
        You may also request account deletion at any time. See our{' '}
        <Link to="/privacy" style={{ color: 'rgba(56,189,248,0.6)' }}>Privacy Policy</Link> for details.
      </p>

      {/* 7 */}
      <h2 style={headingEn}>7. Disclaimer</h2>
      <p style={paraEn}>The Service is not responsible for:</p>
      <ul style={listStyleEn}>
        <li>The accuracy or legality of user-submitted data</li>
        <li>The availability or accuracy of third-party services (Supabase, Google, Twitch, GBIF)</li>
        <li>Any indirect or incidental damages arising from the use of the Service</li>
      </ul>

      {/* 8 */}
      <h2 style={headingEn}>8. Privacy</h2>
      <p style={paraEn}>
        Your personal data is protected by our{' '}
        <Link to="/privacy" style={{ color: 'rgba(56,189,248,0.6)' }}>Privacy Policy</Link>.
        By using the Service, you agree to the terms of that policy.
      </p>

      {/* 9 */}
      <h2 style={headingEn}>9. Changes to These Terms</h2>
      <p style={paraEn}>
        These Terms of Service may be updated from time to time. Significant changes will be
        announced on the Service's homepage. Continued use of the Service constitutes acceptance
        of the updated terms.
      </p>

      {/* 10 */}
      <h2 style={headingEn}>10. Contact Us</h2>
      <p style={paraEn}>If you have any questions about these Terms of Service, please reach out through:</p>
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
