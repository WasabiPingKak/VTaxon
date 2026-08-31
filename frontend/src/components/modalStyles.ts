import type { CSSProperties } from 'react';

/** Modal 全螢幕遮罩（zIndex 2000） */
export const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

/** Modal 容器（maxWidth 依內容指定） */
export function modalBoxStyle(maxWidth: number): CSSProperties {
  return {
    background: '#1a2236',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: `${maxWidth}px`,
    width: '100%',
    border: '1px solid rgba(255,255,255,0.1)',
  };
}
