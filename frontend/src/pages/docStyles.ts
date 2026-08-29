import type { CSSProperties } from 'react';

/** 內容長文頁（About / 隱私權 / 服務條款 / Changelog）共用的文字樣式 */

export const heading: CSSProperties = {
  color: '#fff',
  fontWeight: 600,
  fontSize: '1.05em',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  paddingBottom: 8,
  marginTop: 32,
  marginBottom: 12,
};

export const para: CSSProperties = {
  color: 'rgba(255,255,255,0.65)',
  fontSize: '0.88em',
  lineHeight: 1.75,
  margin: '8px 0',
};

export const listStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.85em',
  lineHeight: 1.8,
  paddingLeft: 22,
  margin: '6px 0',
};

/** 英文版降階配色（隱私權 / 服務條款頁） */
export const headingEn: CSSProperties = { ...heading, color: 'rgba(255,255,255,0.5)' };
export const paraEn: CSSProperties = { ...para, color: 'rgba(255,255,255,0.45)' };
export const listStyleEn: CSSProperties = { ...listStyle, color: 'rgba(255,255,255,0.42)' };
