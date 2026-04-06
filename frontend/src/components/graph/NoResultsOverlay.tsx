interface NoResultsOverlayProps {
  onClearFilters: () => void;
}

export default function NoResultsOverlay({ onClearFilters }: NoResultsOverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 40,
    }}>
      <div style={{
        background: 'rgba(8,13,21,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
        padding: '24px 32px', textAlign: 'center', pointerEvents: 'auto',
        maxWidth: 300,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          沒有符合條件的結果
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
          請嘗試調整篩選條件或清除篩選
        </div>
        <button
          type="button"
          data-testid="clear-filters"
          onClick={onClearFilters}
          style={{
            background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 6, padding: '6px 16px', cursor: 'pointer',
            color: '#38bdf8', fontSize: 12, fontWeight: 500,
          }}
        >
          清除全部篩選
        </button>
      </div>
    </div>
  );
}
