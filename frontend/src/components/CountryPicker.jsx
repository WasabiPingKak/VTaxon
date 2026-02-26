import { useState, useRef, useEffect } from 'react';
import COUNTRIES from '../lib/countries';

export default function CountryPicker({ selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close dropdown on outside click
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
          padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
          minHeight: '40px', cursor: 'pointer', background: '#fff',
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: '#999' }}>點擊選擇國家/地區…</span>
        )}
        {selected.map((code) => {
          const country = COUNTRIES.find((c) => c.code === code);
          return (
            <span key={code} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', background: '#e8f0fe', borderRadius: '12px',
              fontSize: '0.85em',
            }}>
              [{code}] {country?.name || code}
              <span
                onClick={(e) => { e.stopPropagation(); remove(code); }}
                style={{ cursor: 'pointer', color: '#999', fontWeight: 'bold' }}
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
          background: '#fff', border: '1px solid #ccc', borderTop: 'none',
          borderRadius: '0 0 4px 4px', maxHeight: '250px', overflow: 'auto',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋國家…"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', padding: '6px', border: '1px solid #ddd',
                borderRadius: '4px', boxSizing: 'border-box',
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
                  background: isSelected ? '#e8f0fe' : '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
              >
                <span>[{c.code}] {c.name}</span>
                {isSelected && <span style={{ color: '#4a90d9' }}>✓</span>}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
              找不到符合的國家
            </div>
          )}
        </div>
      )}
    </div>
  );
}
