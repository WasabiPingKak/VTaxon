import { useState } from 'react';

/**
 * Bottom HUD showing focused Vtuber info with multi-species navigation.
 * Uses CSS grid for fixed arrow positions.
 */
export default function FocusHUD({ focusedEntries, speciesIndex, onPrev, onNext, onLocate }) {
  const [imgError, setImgError] = useState(false);

  if (!focusedEntries || focusedEntries.length === 0) return null;

  const current = focusedEntries[speciesIndex] || focusedEntries[0];
  const total = focusedEntries.length;
  const speciesLabel = current.breed_name_zh || current.breed_name || current.common_name_zh || current.scientific_name || '?';

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
              src={current.avatar_url} alt=""
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

        {/* Locate button — pan back to focused node */}
        <button type="button" onClick={onLocate} style={{
          marginLeft: 4,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          paddingLeft: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.78em',
          whiteSpace: 'nowrap',
          borderRadius: 4,
          padding: '4px 6px 4px 10px',
        }} title="定位回自己">
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
