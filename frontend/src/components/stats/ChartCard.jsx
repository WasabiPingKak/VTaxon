export default function ChartCard({ title, children, style }) {
  return (
    <div style={{
      background: 'rgba(20,28,43,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 24,
      ...style,
    }}>
      {title && (
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '1.1em',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
