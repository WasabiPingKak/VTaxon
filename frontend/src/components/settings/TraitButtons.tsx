import { useState } from 'react';

/** 低調的移除按鈕，hover 時轉為危險紅 */
export function RemoveButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 10px',
        background: 'transparent',
        color: hovered ? '#f87171' : 'rgba(255,255,255,0.3)',
        border: `1px solid ${hovered ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.8em',
        flexShrink: 0,
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      移除
    </button>
  );
}

/** 設定代表物種的星號按鈕 */
export function LivePrimaryButton({ isActive, onClick, disabled }: { isActive: boolean; onClick: () => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      title={isActive ? '目前的代表物種' : '設為代表物種'}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '1.2em',
        color: isActive ? '#f59e0b' : (hovered ? '#fbbf24' : 'rgba(255,255,255,0.15)'),
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {isActive ? '★' : '☆'}
    </button>
  );
}
