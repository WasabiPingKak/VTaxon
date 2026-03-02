/**
 * Unified rank badge component for all interfaces.
 * Each taxonomy rank gets a distinct color.
 */

const RANK_CONFIG = {
  KINGDOM:    { label: '界',   bg: '#f3e8ff', color: '#7c3aed', border: '#ddd6fe' },
  PHYLUM:     { label: '門',   bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  CLASS:      { label: '綱',   bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  ORDER:      { label: '目',   bg: '#d1fae5', color: '#047857', border: '#a7f3d0' },
  FAMILY:     { label: '科',   bg: '#e8f4fd', color: '#2980b9', border: '#bee0f5' },
  GENUS:      { label: '屬',   bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  SPECIES:    { label: '種',   bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  SUBSPECIES: { label: '亞種', bg: '#e0e7ff', color: '#4f46e5', border: '#c7d2fe' },
  VARIETY:    { label: '變種', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  BREED:      { label: '品種', bg: '#fef3e6', color: '#e67e22', border: '#f5d5a0' },
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
