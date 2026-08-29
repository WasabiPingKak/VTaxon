import { useState, useRef } from 'react';
import { tagChipStyle, tagRemoveStyle, tagFieldStyle } from './tagChipStyles';

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value = [], onChange, placeholder }: TagInputProps): React.ReactElement {
  const [input, setInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(text: string): void {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur(): void {
    if (input.trim()) {
      addTag(input);
      setInput('');
    }
  }

  function remove(idx: number): void {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{ ...tagFieldStyle, padding: '6px 8px', cursor: 'text' }}
    >
      {value.map((tag, i) => (
        <span key={i} style={tagChipStyle}>
          {tag}
          <span
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); remove(i); }}
            style={tagRemoveStyle}
          >×</span>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="new-password"
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
