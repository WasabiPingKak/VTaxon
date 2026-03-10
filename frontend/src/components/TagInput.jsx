import { useState, useRef } from 'react';

export default function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function addTag(text) {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTag(input);
      setInput('');
    }
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        padding: '6px 8px', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '4px', minHeight: '40px', cursor: 'text',
        background: '#1a2433', boxSizing: 'border-box',
      }}
    >
      {value.map((tag, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', background: 'rgba(56,189,248,0.12)',
          borderRadius: '12px', fontSize: '0.85em', color: '#93c5fd',
        }}>
          {tag}
          <span
            onClick={(e) => { e.stopPropagation(); remove(i); }}
            style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
          >×</span>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="nope"
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1, minWidth: '80px', border: 'none', outline: 'none',
          background: 'transparent', color: '#e2e8f0', fontSize: '0.9em',
          padding: '4px 0',
        }}
      />
    </div>
  );
}
