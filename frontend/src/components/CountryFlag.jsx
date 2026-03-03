import { getCountryName } from '../lib/countries';

export default function CountryFlag({ code, showName = true, size = 16 }) {
  if (!code) return null;
  const lower = code.toLowerCase();
  const name = getCountryName(code);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
      fontSize: '0.85em', color: 'rgba(255,255,255,0.7)',
    }}>
      <span
        className={`fi fi-${lower}`}
        style={{ width: size, height: Math.round(size * 0.75), display: 'inline-block', borderRadius: 2 }}
      />
      {showName && <span>{name}</span>}
    </span>
  );
}
