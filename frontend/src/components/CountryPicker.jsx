import { useState, useRef, useEffect } from 'react';
import COUNTRIES from '../lib/countries';

export default function CountryPicker({ selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = COUNTRIES.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  function toggle(code) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  function remove(code) {
    onChange(selected.filter((c) => c !== code));
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Selected tags */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px',
          padding: '8px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
          minHeight: '40px', cursor: 'pointer', background: '#1a2433',
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>點擊選擇國家/地區…</span>
        )}
        {selected.map((code) => {
          const country = COUNTRIES.find((c) => c.code === code);
          return (
            <span key={code} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', background: 'rgba(56,189,248,0.12)', borderRadius: '12px',
              fontSize: '0.85em', color: '#93c5fd',
            }}>
              [{code}] {country?.name || code}
              <span
                onClick={(e) => { e.stopPropagation(); remove(code); }}
                style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                ×
              </span>
            </span>
          );
        })}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: '#141c2b', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none',
          borderRadius: '0 0 4px 4px', maxHeight: '250px', overflow: 'auto',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋國家…"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px', boxSizing: 'border-box',
                background: '#1a2433', color: '#e2e8f0',
              }}
            />
          </div>
          {filtered.map((c) => {
            const isSelected = selected.includes(c.code);
            return (
              <div
                key={c.code}
                onClick={() => toggle(c.code)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  background: isSelected ? 'rgba(56,189,248,0.1)' : 'transparent',
                  color: '#e2e8f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>[{c.code}] {c.name}</span>
                {isSelected && <span style={{ color: '#38bdf8' }}>✓</span>}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              找不到符合的國家
            </div>
          )}
        </div>
      )}
    </div>
  );
}
