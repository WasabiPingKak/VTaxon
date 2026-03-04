import { useState, useRef, useEffect } from 'react';

export default function FilterDropdown({
  label,
  options,        // [{ value, label, emoji? }]
  selected,       // Set or array of selected values
  onChange,        // (newSet) => void
  multi = true,   // multi-select or single-select
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedSet = selected instanceof Set ? selected : new Set(selected || []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [open]);

  const count = selectedSet.size;

  const toggle = (val) => {
    if (multi) {
      const next = new Set(selectedSet);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      onChange(next);
    } else {
      if (selectedSet.has(val)) {
        onChange(new Set());
      } else {
        onChange(new Set([val]));
      }
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: count > 0 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${count > 0 ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 6, padding: '5px 10px',
          color: count > 0 ? '#38bdf8' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontSize: '0.8em',
          display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {label}{count > 0 && `(${count})`}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4 L5 7 L8 4" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#141c2b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          minWidth: 160, maxHeight: 280, overflowY: 'auto',
          zIndex: 300, padding: '4px 0',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 12px',
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.82em', cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: multi ? 3 : 8,
                border: `1.5px solid ${selectedSet.has(opt.value) ? '#38bdf8' : 'rgba(255,255,255,0.25)'}`,
                background: selectedSet.has(opt.value) ? 'rgba(56,189,248,0.2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {selectedSet.has(opt.value) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#38bdf8" strokeWidth="2">
                    <path d="M2 5 L4 7 L8 3" />
                  </svg>
                )}
              </span>
              {opt.flagClass && (
                <span
                  className={opt.flagClass}
                  style={{ width: 16, height: 12, display: 'inline-block', borderRadius: 2, flexShrink: 0 }}
                />
              )}
              <span style={{ flex: 1 }}>{opt.label}</span>
              {opt.count != null && (
                <span style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.9em',
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
