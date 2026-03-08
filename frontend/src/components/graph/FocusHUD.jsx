import { useState } from 'react';
import { displayScientificName } from '../../lib/speciesName';

/**
 * Bottom HUD showing focused Vtuber info with multi-species navigation.
 * Uses CSS grid for fixed arrow positions.
 */
export default function FocusHUD({ focusedEntries, speciesIndex, onPrev, onNext, onLocate, isMobile }) {
  const [imgError, setImgError] = useState(false);

  if (!focusedEntries || focusedEntries.length === 0) return null;

  const current = focusedEntries[speciesIndex] || focusedEntries[0];
  const total = focusedEntries.length;
  const speciesLabel = current.fictional_name_zh
    || current.breed_name_zh || current.breed_name
    || current.common_name_zh || displayScientificName(current) || '?';

  if (isMobile) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 64px)',
        maxWidth: 360,
        boxSizing: 'border-box',
        background: 'rgba(8,13,21,0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,107,53,0.3)',
        borderRadius: 10,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 60,
        color: '#e2e8f0',
        userSelect: 'none',
      }}>
        {/* Avatar */}
        {current.avatar_url && !imgError ? (
          <img
            src={current.avatar_url} alt={current.display_name}
            loading="lazy"
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'rgba(255,255,255,0.4)',
          }}>?</div>
        )}

        {/* Name + species stacked */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontWeight: 600, fontSize: '0.82em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current.display_name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {total > 1 && (
              <button type="button" onClick={onPrev} style={navBtnStyleMobile} title="上一個物種">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {speciesLabel}
              {total > 1 && <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 3 }}>({speciesIndex + 1}/{total})</span>}
            </span>
            {total > 1 && (
              <button type="button" onClick={onNext} style={navBtnStyleMobile} title="下一個物種">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Locate button — styled like Navbar, stretches to fill HUD height */}
        <button type="button" onClick={onLocate} style={{
          background: 'rgba(233,30,140,0.1)',
          border: '1px solid rgba(233,30,140,0.3)',
          borderRadius: 8, cursor: 'pointer',
          padding: '6px 12px',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#E91E8C', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', flexShrink: 0,
          alignSelf: 'stretch',
        }} title="定位回自己"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.5)'; e.currentTarget.style.background = 'rgba(233,30,140,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.3)'; e.currentTarget.style.background = 'rgba(233,30,140,0.1)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
          </svg>
          定位
        </button>
      </div>
    );
  }

  // Desktop layout
  return (
    <>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,13,21,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,107,53,0.3)',
        borderRadius: 12,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 60,
        color: '#e2e8f0',
        minWidth: 200,
        userSelect: 'none',
      }}>
        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {current.avatar_url && !imgError ? (
            <img
              src={current.avatar_url} alt={current.display_name}
              loading="lazy"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'rgba(255,255,255,0.4)',
            }}>?</div>
          )}
          <span style={{ fontWeight: 600, fontSize: '0.95em', whiteSpace: 'nowrap' }}>
            {current.display_name}
          </span>
        </div>

        {/* Species navigation — grid layout for fixed arrow positions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 28px',
          alignItems: 'center',
          width: 200,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          paddingLeft: 12,
        }}>
          <div>
            {total > 1 && (
              <button type="button" onClick={onPrev} style={navBtnStyle} title="上一個物種">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.7)' }}>
              {speciesLabel}
              {total > 1 && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>({speciesIndex + 1}/{total})</span>}
            </span>
          </div>
          <div>
            {total > 1 && (
              <button type="button" onClick={onNext} style={navBtnStyle} title="下一個物種">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Locate button — styled like Navbar */}
        <button type="button" onClick={onLocate} style={{
          marginLeft: 4,
          background: 'rgba(233,30,140,0.1)',
          border: '1px solid rgba(233,30,140,0.3)',
          borderRadius: 6, cursor: 'pointer',
          padding: '5px 10px',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#E91E8C', fontSize: '0.8em',
          whiteSpace: 'nowrap', flexShrink: 0,
        }} title="定位回自己"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.5)'; e.currentTarget.style.background = 'rgba(233,30,140,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.3)'; e.currentTarget.style.background = 'rgba(233,30,140,0.1)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
          </svg>
          定位
        </button>
      </div>

      {/* Keyboard hint */}
      {total > 1 && (
        <div style={{
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.68em', color: 'rgba(255,255,255,0.28)', pointerEvents: 'none', zIndex: 59,
        }}>
          ← → 方向鍵切換
        </div>
      )}
    </>
  );
}

const navBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.6)',
  padding: 4,
  display: 'flex',
  alignItems: 'center',
  borderRadius: 4,
};

const navBtnStyleMobile = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.65)',
  width: 28,
  height: 28,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  flexShrink: 0,
};
