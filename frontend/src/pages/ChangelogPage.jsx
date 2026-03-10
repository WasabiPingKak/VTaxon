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

const subHeading = {
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  fontSize: '0.92em',
  marginTop: 18,
  marginBottom: 8,
};

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
      <SEOHead
        title="更新日誌"
        description="VTaxon 歷次更新內容紀錄"
        url="/changelog"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '更新日誌 — VTaxon',
          description: 'VTaxon 歷次更新內容紀錄',
          url: 'https://vtaxon.com/changelog',
        }}
      />

      {/* ── 標題 ── */}
      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>更新日誌</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88em', margin: '0 0 32px' }}>
        VTaxon 歷次更新內容紀錄
      </p>

      {/* ══════════════════════════════════════════════ */}
      {/* v1 — 2026/3/7 ~ 3/10                         */}
      {/* ══════════════════════════════════════════════ */}
      <div style={{
        padding: '20px 24px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        marginBottom: 32,
      }}>
        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '1.1em', margin: '0 0 4px' }}>
          2026/3/7 ~ 3/10 更新
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82em', margin: 0 }}>
          上線後首次大型更新
        </p>
      </div>

      {/* ── 物種搜尋改善 ── */}
      <h2 style={heading}>物種搜尋改善</h2>
      <ul style={listStyle}>
        <li>搜尋結果新增<strong>俗名（別名）</strong>顯示：例如搜尋「石虎」時，會在主名下方顯示其他常見中文稱呼，資料來自 TaiCOL（台灣物種名錄）與 Wikidata</li>
        <li>現在可以搜尋到<strong>更高階的分類群</strong>，不再只限物種級。例如「水母亞門（Medusozoa）」、「缽水母綱（Scyphozoa）」等都可以直接搜尋</li>
        <li>搜尋同義詞時會<strong>自動導向正式學名</strong>，不會再找到過時的舊名</li>
        <li>新增支援 <strong>FORM（型）</strong>、<strong>SUBPHYLUM（亞門）</strong>、<strong>SUBCLASS（亞綱）</strong> 分類階層</li>
        <li>修正部分手機搜尋時跳出信用卡自動填入的問題</li>
      </ul>

      {/* ── 分類樹瀏覽體驗 ── */}
      <h2 style={heading}>分類樹（圖鑑）瀏覽體驗</h2>
      <ul style={listStyle}>
        <li><strong>自動展開優化</strong>：路徑上只有一個子節點時自動展開，子節點 5 個以內也會遞迴展開，大幅減少手動點擊次數</li>
        <li>修正格狀排列的連線在往下捲動時消失的問題</li>
        <li>學名不再顯示作者引用（例如「Linnaeus, 1758」），畫面更簡潔</li>
        <li>樹上的重複物種節點已合併；有品種資料的物種下方會顯示「未指定品種」節點</li>
        <li>預設排序改為<strong>新加入的在前面</strong></li>
        <li>使用群組排序時，樹節點上會顯示<strong>國旗</strong>和<strong>組織徽章</strong></li>
        <li>登入後首次載入時，鏡頭會正確對焦到你的位置</li>
      </ul>
      <h3 style={subHeading}>行動版</h3>
      <ul style={listStyle}>
        <li>重新設計了底部工具列，改為水平頂部列 + 抽屜式資訊面板，操作更順手</li>
      </ul>

      {/* ── 虛構物種分類重整 ── */}
      <h2 style={heading}>虛構物種分類重整</h2>
      <p style={para}>
        虛構物種的分類結構從 3 層擴充為 <strong>4 層</strong>，新增了「<strong>類型</strong>」層級：
      </p>
      <ul style={listStyle}>
        <li><strong>舊結構</strong>：來源 → 文化圈 → 物種</li>
        <li><strong>新結構</strong>：來源 → 文化圈 → <strong>類型</strong> → 物種</li>
      </ul>
      <p style={para}>例如：</p>
      <ul style={listStyle}>
        <li>東方神話 → 日本神話 → <strong>妖獸</strong> → 妖狐</li>
        <li>東方神話 → 中國神話 → <strong>四聖獸</strong> → 青龍</li>
        <li>西方神話 → 歐洲民間傳說 → <strong>魔物</strong> → 石像鬼</li>
        <li>奇幻文學 → 通用 → <strong>魔族</strong> → 魅魔</li>
      </ul>

      <h3 style={subHeading}>分類調整</h3>
      <ul style={listStyle}>
        <li><strong>狼人（Werewolf）</strong>：從「不死族」移至「魔物」——狼人是詛咒變身，不是死而復生</li>
        <li><strong>偽人（Doppelgänger）</strong>：歸入「魔物」</li>
        <li><strong>西方龍</strong>：變為類型節點，下設「四足飛龍（Dragon）」和「雙足飛龍（Wyvern）」</li>
      </ul>

      <h3 style={subHeading}>上線後新增的虛構物種（共 19 個）</h3>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>奇幻文學 → 通用</strong></p>
      <ul style={listStyle}>
        <li>夢魔（Incubus）、曼德拉草（Mandrake）、樹人（Ent）、半精靈（Half-elven）、墮天使（Fallen Angel）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>西方神話 → 希臘神話</strong></p>
      <ul style={listStyle}>
        <li>卡戎（Charon）、半神（Demigod）、樹精（Dryad）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>西方神話 → 歐洲民間傳說</strong></p>
      <ul style={listStyle}>
        <li>所羅門魔神（Goetic Demon）、雙足飛龍（Wyvern）、死神（Grim Reaper）、四足飛龍（Dragon, Four-legged）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>西方神話 → 凱爾特神話</strong>（新增文化圈）</p>
      <ul style={listStyle}>
        <li>費伊（Fey）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>現代虛構 → 克蘇魯神話</strong></p>
      <ul style={listStyle}>
        <li>外神（Outer God）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>東方神話 → 中國神話</strong></p>
      <ul style={listStyle}>
        <li>盤古（Pangu）、陸吾（Lu Wu）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>人造生命 → 機械生命</strong></p>
      <ul style={listStyle}>
        <li>泰迪熊（Teddy Bear）、機械鳥（Mechanical Bird）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>非物質生命 → 能量態生命</strong></p>
      <ul style={listStyle}>
        <li>植物精靈（Plant Spirit）、時間精靈（Chrono Spirit）</li>
      </ul>
      <p style={{ ...para, marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>東方神話 → 台灣民間傳說</strong></p>
      <ul style={listStyle}>
        <li>山藥怪物（Yam Monster）</li>
      </ul>

      {/* ── 通知系統 ── */}
      <h2 style={heading}>通知系統（新功能）</h2>
      <ul style={listStyle}>
        <li>提交的品種申請或虛構物種申請被處理後，現在會<strong>收到站內通知</strong></li>
        <li>通知流程：已收到 → 已排入待辦 → 已完成 / 不處理</li>
        <li>通知中心有明確的已讀 / 未讀視覺區分</li>
      </ul>

      {/* ── 申請表單改善 ── */}
      <h2 style={heading}>申請表單改善</h2>
      <ul style={listStyle}>
        <li>品種申請：三個欄位都改為必填，新增「學名」欄位，並附上填寫說明</li>
        <li>虛構物種申請：四個欄位都改為必填，並附上填寫說明引導</li>
      </ul>

      {/* ── 使用者資料 ── */}
      <h2 style={heading}>使用者資料</h2>
      <ul style={listStyle}>
        <li>新增「<strong>社團勢</strong>」組織類型，與「企業勢」並列，組織名稱皆為選填</li>
        <li>所有頁面統一顯示組織類型徽章</li>
        <li>平台圖示和社群連結圖示之間新增分隔線，視覺更清楚</li>
        <li>建立時間改為顯示你的本地時區</li>
      </ul>

      {/* ── 導覽列與首頁 ── */}
      <h2 style={heading}>導覽列與首頁</h2>
      <ul style={listStyle}>
        <li>導覽列「圖鑑」按鈕旁新增<strong>已標註 VTuber 總數</strong> badge</li>
        <li>首頁說明方塊移到右上角，可以關閉</li>
        <li>新增「關於本站」連結</li>
      </ul>

      {/* ── 已處理的物種名稱修正 ── */}
      <h2 style={heading}>已處理的物種名稱修正</h2>
      <p style={para}>以下物種的中文名稱 / 學名已修正或新增，感謝回報的各位：</p>
      <ul style={listStyle}>
        <li><strong>狼（Canis lupus）</strong>：中文名從「家犬」修正為「狼」（Wikidata 資料錯誤），同時修正所有亞種在樹狀圖中的上層顯示</li>
        <li><strong>兔猻</strong>：新增中文名覆蓋，學名顯示改為主流的 Otocolobus manul（GBIF 用 Felis manul）</li>
        <li><strong>褐家鼠（Rattus norvegicus）</strong>：中文名從「花枝鼠」修正為「褐家鼠」（花枝鼠是品種名，不是物種名）</li>
        <li><strong>前突三角龍（Triceratops prorsus）</strong>：新增中文名「前突三角龍」</li>
        <li><strong>毒茄蔘（Mandragora officinarum）</strong>：中文名修正為台灣慣用的「毒茄蔘」</li>
        <li><strong>西部灰松鼠（Sciurus griseus）</strong>：新增中文名「西部灰松鼠」</li>
        <li><strong>紅爪雨林蠍（Gigantometrus swammerdami）</strong>：新增中文名「紅爪雨林蠍」+ 蠍科（Scorpionidae）中文名</li>
        <li><strong>家豬（Sus scrofa domesticus）</strong>：新增中文名「家豬」</li>
        <li><strong>花枝鼠（Fancy Rat）</strong>：新增為褐家鼠的品種，並建立 8 個品種分類（標準型、飛耳鼠、捲毛鼠、無毛鼠、緞毛鼠、無尾鼠、鋼毛鼠）</li>
        <li><strong>種級中文名「屬」後綴</strong>：全站修正——部分物種的中文名被 Wikidata 誤帶「XX屬」後綴，現在已統一去除</li>
      </ul>

      {/* ── 隱私權政策 ── */}
      <h2 style={heading}>隱私權政策</h2>
      <ul style={listStyle}>
        <li>補充了資料分享揭露（說明與哪些第三方服務共享資料）及資料安全章節</li>
      </ul>

      {/* ── 效能改善 ── */}
      <h2 style={heading}>效能改善</h2>
      <ul style={listStyle}>
        <li>頁面載入速度提升（按需載入，不再一次載入全站）</li>
        <li>修復部分場景的記憶體洩漏問題</li>
        <li>修正多處導致頁面意外重新整理的問題（設定頁、管理頁、分類樹）</li>
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
