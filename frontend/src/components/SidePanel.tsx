import { useState, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const ANIM_IN = 300;
const ANIM_OUT = 250;

/** 面板內 trait 切換膠囊 tab 的樣式 */
export function panelTabStyle(active: boolean): CSSProperties {
  return {
    padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em',
    cursor: 'pointer', border: 'none',
    background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
    color: active ? '#38bdf8' : 'rgba(255,255,255,0.6)',
    fontWeight: active ? 600 : 400,
  };
}

type RenderWithClose = ReactNode | ((close: () => void) => ReactNode);

interface SidePanelProps {
  title: string;
  /** 滑出動畫結束後呼叫（實際卸載面板） */
  onClose: () => void;
  /** header 之下、捲動區之上的固定內容（提示列、tab 列） */
  topContent?: RenderWithClose;
  /** 捲動主體；function 形式可拿到 close 來觸發滑出動畫 */
  children: RenderWithClose;
}

/** 右側滑入面板外殼：backdrop + 容器 + header + 捲動區（VtuberDetailPanel / PreviewPanel 共用） */
export default function SidePanel({ title, onClose, topContent, children }: SidePanelProps) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => setClosing(true), []);
  const handleAnimEnd = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === 'vtaxonSlideOut') { setClosing(false); onClose(); }
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes vtaxonSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes vtaxonSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes vtaxonFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vtaxonFadeOut  { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={close}
        onAnimationEnd={(e: React.AnimationEvent) => { if (e.animationName === 'vtaxonFadeOut') e.stopPropagation(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
          animation: closing
            ? `vtaxonFadeOut ${ANIM_OUT}ms ease-in forwards`
            : `vtaxonFadeIn ${ANIM_IN}ms ease-out forwards`,
        }}
      />

      {/* Panel */}
      <div onAnimationEnd={handleAnimEnd} style={{
        position: 'fixed', top: 44, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#0d1526', zIndex: 1000,
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0',
        animation: closing
          ? `vtaxonSlideOut ${ANIM_OUT}ms ease-in forwards`
          : `vtaxonSlideIn ${ANIM_IN}ms ease-out forwards`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>{title}</span>
          <button type="button" onClick={close} style={{
            background: 'none', border: 'none', fontSize: '1.4em',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}>✕</button>
        </div>

        {typeof topContent === 'function' ? topContent(close) : topContent}

        {/* Body (scrollable) */}
        <div className="vtaxon-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      </div>
    </>
  );
}
