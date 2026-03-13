import { useState } from 'react';
import { displayScientificName } from '../../lib/speciesName';

const getSpeciesLabel = (entry) =>
  entry.fictional_name_zh
  || entry.breed_name_zh || entry.breed_name
  || entry.common_name_zh || displayScientificName(entry) || '?';

/**
 * Bottom HUD showing focused Vtuber info with multi-species navigation.
 * Mobile: drawer-style expandable card at bottom.
 * Desktop: centered HUD with grid-based arrow navigation.
 */
export default function FocusHUD({ focusedEntries, speciesIndex, onPrev, onNext, onLocate, onJumpToSpecies, isMobile }) {
  const [imgError, setImgError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!focusedEntries || focusedEntries.length === 0) return null;

  const current = focusedEntries[speciesIndex] || focusedEntries[0];
  const total = focusedEntries.length;
  const speciesLabel = getSpeciesLabel(current);

  if (isMobile) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        boxSizing: 'border-box',
        background: 'rgba(8,13,21,0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,107,53,0.3)',
        borderBottom: 'none',
        borderRadius: '12px 12px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 60,
        color: '#e2e8f0',
        userSelect: 'none',
        maxHeight: drawerOpen ? '60vh' : 64,
        overflow: 'hidden',
        transition: 'max-height 300ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* ── Collapsed header (always visible) ── */}
        <div
          onClick={() => setDrawerOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          {/* Avatar */}
          {current.avatar_url && !imgError ? (
            <img
              src={current.avatar_url} alt={current.display_name}
              loading="lazy"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'rgba(255,255,255,0.4)',
            }}>?</div>
          )}

          {/* Name + current species */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {current.display_name}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {speciesLabel}
              {total > 1 && <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>({speciesIndex + 1}/{total})</span>}
            </span>
          </div>

          {/* Expand/collapse indicator */}
          <span style={{
            fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0,
            transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
            transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            &#x25B2;
          </span>
        </div>

        {/* ── Expanded content ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
          maxHeight: 'calc(60vh - 100px)',
        }}>
          {/* Species list */}
          <div style={{ padding: '4px 0' }}>
            {focusedEntries.map((entry, idx) => {
              const isActive = idx === speciesIndex;
              const label = getSpeciesLabel(entry);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onJumpToSpecies?.(idx);
                    setDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isActive ? 'rgba(255,107,53,0.12)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '2px solid #FF6B35' : '2px solid transparent',
                    color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  {isActive && <span style={{ fontSize: 8, flexShrink: 0 }}>&#x25CF;</span>}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Locate button */}
          <div style={{ padding: '8px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={onLocate} style={{
              width: '100%',
              background: 'rgba(233,30,140,0.1)',
              border: '1px solid rgba(233,30,140,0.3)',
              borderRadius: 8, cursor: 'pointer',
              padding: '10px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#E91E8C', fontSize: 13, fontWeight: 500,
            }} title="定位回自己">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              </svg>
              定位回自己
            </button>
          </div>
        </div>
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
