import { getCountryName } from '../lib/countries';

export default function CountryFlag({ code, showName = true }) {
  if (!code) return null;
  const upper = code.toUpperCase();
  const name = getCountryName(upper);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', background: '#f0f0f0', borderRadius: '12px',
      fontSize: '0.85em', color: '#333',
    }}>
      [{upper}]
      {showName && <span>{name}</span>}
    </span>
  );
}
