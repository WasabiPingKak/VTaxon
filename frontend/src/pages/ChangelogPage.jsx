import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEOHead from '../components/SEOHead';

import changelog_v2 from '../../../docs/changelogs/changelog-v2/changelog.md?raw';
import changelog_2026_03_10 from '../../../docs/changelogs/changelog-v1/changelog.md?raw';

const versions = [
  {
    date: '2026/3/10 ~ 3/12',
    title: '搜尋 UX 改進、品種 Grid 排列、虛構物種更新',
    content: changelog_v2,
  },
  {
    date: '2026/3/7 ~ 3/10',
    title: '上線後首次大型更新',
    content: changelog_2026_03_10,
  },
];

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

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85em',
  margin: '12px 0',
};

const thStyle = {
  color: 'rgba(255,255,255,0.8)',
  borderBottom: '1px solid rgba(255,255,255,0.15)',
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
};

const tdStyle = {
  color: 'rgba(255,255,255,0.6)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  padding: '8px 12px',
  verticalAlign: 'top',
};

const mdComponents = {
  h1: () => null,
  h2: ({ children }) => <h2 style={heading}>{children}</h2>,
  h3: ({ children }) => <h3 style={subHeading}>{children}</h3>,
  p: ({ children }) => <p style={para}>{children}</p>,
  ul: ({ children }) => <ul style={listStyle}>{children}</ul>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong style={{ color: '#fff' }}>{children}</strong>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '24px 0' }} />,
  table: ({ children }) => <table style={tableStyle}>{children}</table>,
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th style={thStyle}>{children}</th>,
  td: ({ children }) => <td style={tdStyle}>{children}</td>,
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

      <h1 style={{ color: '#fff', fontSize: '1.5em', marginBottom: 4 }}>更新日誌</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88em', margin: '0 0 32px' }}>
        VTaxon 歷次更新內容紀錄
      </p>

      {versions.map((v, i) => (
        <section key={i}>
          <div style={{
            padding: '20px 24px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: 32,
          }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '1.1em', margin: '0 0 4px' }}>
              {v.date} 更新
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82em', margin: 0 }}>
              {v.title}
            </p>
          </div>

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{v.content}</ReactMarkdown>
        </section>
      ))}

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', textDecoration: 'none' }}>
          ← 回到首頁
        </Link>
      </div>
    </div>
  );
}
