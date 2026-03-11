import useIsMobile from '../../hooks/useIsMobile';

const cards = [
  { key: 'tagged_users', label: '已建檔 VTuber' },
  { key: 'species_used', label: '現實物種數' },
  { key: 'fictional_used', label: '奇幻生物數' },
  { key: 'avg_traits_per_user', label: '平均物種特徵數' },
];

export default function HeroCards({ totals }) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: 16,
    }}>
      {cards.map(({ key, label }) => (
        <div key={key} style={{
          background: 'rgba(20,28,43,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: isMobile ? '16px 12px' : '20px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: isMobile ? '1.8em' : '2.2em',
            fontWeight: 700,
            color: '#38bdf8',
            lineHeight: 1.2,
          }}>
            {totals?.[key] ?? '—'}
          </div>
          <div style={{
            fontSize: '0.82em',
            color: 'rgba(255,255,255,0.5)',
            marginTop: 4,
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
