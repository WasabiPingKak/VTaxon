export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const range = 2;

  // Always show first page
  pages.push(1);

  // Add ellipsis or pages between first and current range
  const rangeStart = Math.max(2, page - range);
  const rangeEnd = Math.min(totalPages - 1, page + range);

  if (rangeStart > 2) pages.push('...');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < totalPages - 1) pages.push('...');

  // Always show last page
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px 0', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={navBtnStyle(page <= 1)}
        >
          &lt;
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', color: 'rgba(255,255,255,0.3)' }}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={pageBtnStyle(p === page)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={navBtnStyle(page >= totalPages)}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

function navBtnStyle(disabled) {
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '4px 10px',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.85em',
  };
}

function pageBtnStyle(active) {
  return {
    background: active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 6, padding: '4px 10px',
    color: active ? '#38bdf8' : 'rgba(255,255,255,0.7)',
    cursor: 'pointer', fontSize: '0.85em',
    fontWeight: active ? 600 : 400,
  };
}
