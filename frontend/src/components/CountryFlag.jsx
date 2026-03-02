import { getCountryName } from '../lib/countries';

export default function CountryFlag({ code, showName = true }) {
  if (!code) return null;
  const upper = code.toUpperCase();
  const name = getCountryName(upper);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
      fontSize: '0.85em', color: 'rgba(255,255,255,0.7)',
    }}>
      [{upper}]
      {showName && <span>{name}</span>}
    </span>
  );
}
