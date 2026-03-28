const PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange, perPage, onPerPageChange }: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1 && !onPerPageChange) return null;

  const pages: (number | string)[] = [];
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
              onClick={() => onPageChange(p as number)}
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
      {onPerPageChange && (
        <select
          value={perPage}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPerPageChange(Number(e.target.value))}
          style={{
            marginLeft: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '4px 8px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85em',
            cursor: 'pointer',
          }}
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n} style={{ background: '#1e293b', color: 'rgba(255,255,255,0.85)' }}>每頁 {n} 筆</option>
          ))}
        </select>
      )}
    </div>
  );
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '4px 10px',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.85em',
  };
}

function pageBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 6, padding: '4px 10px',
    color: active ? '#38bdf8' : 'rgba(255,255,255,0.7)',
    cursor: 'pointer', fontSize: '0.85em',
    fontWeight: active ? 600 : 400,
  };
}
