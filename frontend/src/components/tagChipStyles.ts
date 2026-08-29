import type { CSSProperties } from 'react';

/** 藍色小膠囊 tag（TagInput 與 CountryPicker 共用） */
export const tagChipStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 8px', background: 'rgba(56,189,248,0.12)',
  borderRadius: '12px', fontSize: '0.85em', color: '#93c5fd',
};

/** tag 內的移除 ✕ */
export const tagRemoveStyle: CSSProperties = {
  cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold',
};

/** tag 輸入容器外框（padding 與 cursor 由使用端指定） */
export const tagFieldStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '6px',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
  minHeight: '40px', background: '#1a2433', boxSizing: 'border-box',
};
