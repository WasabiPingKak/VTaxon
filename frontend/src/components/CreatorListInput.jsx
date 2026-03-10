import { useCallback } from 'react';

export default function CreatorListInput({ value = [], onChange }) {
  const update = useCallback((idx, field, v) => {
    const next = value.map((item, i) => i === idx ? { ...item, [field]: v } : item);
    onChange(next);
  }, [value, onChange]);

  const add = useCallback(() => {
    onChange([...value, { name: '', url: '' }]);
  }, [value, onChange]);

  const remove = useCallback((idx) => {
    onChange(value.filter((_, i) => i !== idx));
  }, [value, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {value.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={item.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            placeholder="名稱"
            autoComplete="new-password"
            style={{ ...fieldStyle, flex: '0 0 120px' }}
          />
          <input
            type="text"
            value={item.url || ''}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="連結（選填）"
            autoComplete="new-password"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button type="button" onClick={() => remove(i)} style={removeBtnStyle}>✕</button>
        </div>
      ))}
      <button type="button" onClick={add} style={addBtnStyle}>+ 新增</button>
    </div>
  );
}

const fieldStyle = {
  padding: '7px 8px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};

const removeBtnStyle = {
  padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px', background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.85em',
  flexShrink: 0,
};

const addBtnStyle = {
  padding: '6px 12px', border: '1px dashed rgba(255,255,255,0.15)',
  borderRadius: '4px', background: 'transparent',
  color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.85em',
  alignSelf: 'flex-start',
};
