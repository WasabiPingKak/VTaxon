/**
 * Dark theme color system for the taxonomy graph canvas.
 */

export const BG_COLOR = '#080d15';
export const BG_CENTER = '#0d1526';

export const RANK_COLORS = {
  ROOT:       { node: '#e2e8f0', glow: 'rgba(226,232,240,0.5)' },
  KINGDOM:    { node: '#c084fc', glow: 'rgba(192,132,252,0.6)' },
  PHYLUM:     { node: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
  CLASS:      { node: '#38bdf8', glow: 'rgba(56,189,248,0.6)' },
  ORDER:      { node: '#34d399', glow: 'rgba(52,211,153,0.6)' },
  FAMILY:     { node: '#60a5fa', glow: 'rgba(96,165,250,0.6)' },
  GENUS:      { node: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
  SPECIES:    { node: '#93c5fd', glow: 'rgba(147,197,253,0.6)' },
  SUBSPECIES: { node: '#a78bfa', glow: 'rgba(167,139,250,0.6)' },
  BREED:      { node: '#fb923c', glow: 'rgba(251,146,60,0.6)' },
};

export const RANK_LABELS = {
  ROOT: '根', KINGDOM: '界', PHYLUM: '門', CLASS: '綱', ORDER: '目',
  FAMILY: '科', GENUS: '屬', SPECIES: '種', SUBSPECIES: '亞種', BREED: '品種',
};

export const VTUBER_COLOR = '#22d3ee';
export const VTUBER_GLOW = 'rgba(34,211,238,0.6)';
export const CURRENT_USER_COLOR = '#D4A017';
export const CURRENT_USER_GLOW = 'rgba(212,160,23,0.7)';

export const EDGE_ALPHA = 0.18;
export const EDGE_GLOW_BLUR = 4;

export const LABEL_COLOR = 'rgba(255,255,255,0.85)';
export const LABEL_DIM = 'rgba(255,255,255,0.45)';
export const COUNT_BADGE_BG = 'rgba(255,255,255,0.08)';
export const COUNT_BADGE_TEXT = 'rgba(255,255,255,0.5)';
