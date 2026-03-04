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

const pillBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 16px',
  borderRadius: 20,
  fontSize: '0.84em',
  textDecoration: 'none',
  color: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.04)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* ── 標題 ── */}
      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>關於 VTaxon</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88em', margin: '0 0 32px' }}>
        VTuber 生物分類系統
      </p>

      {/* ── 專案介紹 ── */}
      <h2 style={heading}>專案介紹</h2>
      <p style={para}>
        VTaxon 是一個面向 VTuber 社群的公開服務，將 VTuber 角色的形象特徵對應到現實世界的生物分類學體系
        （界、門、綱、目、科、屬、種），以分類樹的形式呈現角色之間的關聯。
      </p>
      <p style={para}>
        無論你的角色是貓咪、龍、狐狸還是史萊姆，都可以在這裡找到對應的分類位置，
        和同類型的角色一起出現在分類樹上。
      </p>

      {/* ── 功能特色 ── */}
      <h2 style={heading}>功能特色</h2>
      <ul style={listStyle}>
        <li><strong>物種標註</strong>：透過 YouTube / Twitch 帳號登入後，標註自己角色的物種特徵</li>
        <li><strong>分類樹瀏覽</strong>：以生物分類階層呈現所有已建檔的角色關聯</li>
        <li><strong>VTuber 圖鑑</strong>：依物種、地區等多維度瀏覽所有已建檔角色</li>
        <li><strong>奇幻生物</strong>：支援龍、鳳凰等幻想物種的獨立分類體系</li>
      </ul>

      {/* ── 技術棧 ── */}
      <h2 style={heading}>技術棧</h2>
      <ul style={listStyle}>
        <li>前端：React + Vite</li>
        <li>後端：Python Flask</li>
        <li>資料庫：PostgreSQL（Supabase）</li>
        <li>認證：Supabase Auth（OAuth）</li>
        <li>生物分類資料：<a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>GBIF</a>（全球生物多樣性資訊機構）、<a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Wikidata</a>、<a href="https://taicol.tw/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>TaiCOL 臺灣物種名錄</a></li>
        <li>部署：Google Cloud Run</li>
      </ul>
      <p style={para}>
        原始碼公開於{' '}
        <a href="https://github.com/WasabiPingKak/VTaxon" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
          GitHub
        </a>
        ，歡迎參與討論或回報問題。
      </p>

      {/* ── 支持專案 ── */}
      <div style={{
        marginTop: 36,
        padding: '24px 24px 20px',
        borderRadius: 12,
        background: 'rgba(56,189,248,0.04)',
        border: '1px solid rgba(56,189,248,0.12)',
      }}>
        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '1.05em', margin: '0 0 10px' }}>
          支持專案
        </h2>
        <p style={{ ...para, margin: '0 0 16px' }}>
          VTaxon 由社群成員獨立開發與維護。伺服器、資料庫、API 等維運成本由開發者個人負擔。
          如果你覺得這個專案有幫助，歡迎支持專案的持續運作：
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href="https://payment.ecpay.com.tw/Broadcaster/Donate/29C04D2522B2011D2EE69C4AAC3AEE6A" target="_blank" rel="noopener noreferrer" style={pillBtn}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >綠界 ECPay</a>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78em', margin: '14px 0 0' }}>
          每一筆贊助都將用於維持伺服器與服務營運。
        </p>
      </div>

      {/* ── 開發與維護 ── */}
      <h2 style={heading}>開發與維護</h2>
      <p style={para}>
        由社群成員 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>山葵冰角（Wasabi PingKak）</strong> 獨立開發與維護。
      </p>
      <p style={para}>聯絡方式：</p>
      <ul style={listStyle}>
        <li>Email：<a href="mailto:wasabi.pingkak@gmail.com" style={{ color: '#38bdf8' }}>wasabi.pingkak@gmail.com</a></li>
        <li>Discord：<a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>discord.gg/ABpdGBbDe4</a></li>
        <li>GitHub Issues：<a href="https://github.com/WasabiPingKak/VTaxon/issues" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>WasabiPingKak/VTaxon</a></li>
      </ul>

      {/* ── 頁尾 ── */}
      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', textDecoration: 'none' }}>
          ← 回到首頁
        </Link>
      </div>

    </div>
  );
}
