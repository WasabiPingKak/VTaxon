/**
 * Unified rank badge component — dark mode.
 * Each taxonomy rank gets a distinct color optimized for dark backgrounds.
 */

const RANK_CONFIG = {
  KINGDOM:    { label: '界',   bg: 'rgba(192,132,252,0.15)', color: '#c084fc', border: 'rgba(192,132,252,0.3)' },
  PHYLUM:     { label: '門',   bg: 'rgba(129,140,248,0.15)', color: '#818cf8', border: 'rgba(129,140,248,0.3)' },
  CLASS:      { label: '綱',   bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  ORDER:      { label: '目',   bg: 'rgba(52,211,153,0.15)',  color: '#34d399', border: 'rgba(52,211,153,0.3)' },
  FAMILY:     { label: '科',   bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
  GENUS:      { label: '屬',   bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  SPECIES:    { label: '種',   bg: 'rgba(147,197,253,0.15)', color: '#93c5fd', border: 'rgba(147,197,253,0.3)' },
  SUBSPECIES: { label: '亞種', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  VARIETY:    { label: '變種', bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  BREED:      { label: '品種', bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)' },
};

export function getRankConfig(rank) {
  return RANK_CONFIG[(rank || '').toUpperCase()] || null;
}

export function getRankLabel(rank) {
  return RANK_CONFIG[(rank || '').toUpperCase()]?.label || null;
}

export default function RankBadge({ rank, style: extraStyle }) {
  const config = getRankConfig(rank);
  if (!config) return null;

  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
      fontSize: '0.75em', fontWeight: 600, marginRight: '4px',
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}>
      {config.label}
    </span>
  );
}
