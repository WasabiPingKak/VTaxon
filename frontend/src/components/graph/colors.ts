/**
 * Dark theme color system for the taxonomy graph canvas.
 */

import type { RankColorDef } from '../../types/graph';

export const BG_COLOR = '#080d15';
export const BG_CENTER = '#0d1526';

export const RANK_COLORS: Record<string, RankColorDef> = {
  ROOT:       { node: '#e2e8f0', glow: 'rgba(226,232,240,0.5)' },
  KINGDOM:    { node: '#c084fc', glow: 'rgba(192,132,252,0.6)' },
  PHYLUM:     { node: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
  SUBPHYLUM:  { node: '#a5b4fc', glow: 'rgba(165,180,252,0.6)' },
  CLASS:      { node: '#38bdf8', glow: 'rgba(56,189,248,0.6)' },
  SUBCLASS:   { node: '#7dd3fc', glow: 'rgba(125,211,252,0.6)' },
  INFRACLASS: { node: '#bae6fd', glow: 'rgba(186,230,253,0.5)' },
  ORDER:      { node: '#34d399', glow: 'rgba(52,211,153,0.6)' },
  FAMILY:     { node: '#60a5fa', glow: 'rgba(96,165,250,0.6)' },
  GENUS:      { node: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
  SPECIES:    { node: '#93c5fd', glow: 'rgba(147,197,253,0.6)' },
  SUBSPECIES: { node: '#a78bfa', glow: 'rgba(167,139,250,0.6)' },
  FORM:       { node: '#10b981', glow: 'rgba(16,185,129,0.6)' },
  BREED:      { node: '#fb923c', glow: 'rgba(251,146,60,0.6)' },
  F_ROOT:       { node: '#f0abfc', glow: 'rgba(240,171,252,0.5)' },
  F_ORIGIN:     { node: '#f97316', glow: 'rgba(249,115,22,0.6)' },
  F_SUB_ORIGIN: { node: '#eab308', glow: 'rgba(234,179,8,0.6)' },
  F_TYPE:       { node: '#2dd4bf', glow: 'rgba(45,212,191,0.6)' },
  F_SPECIES:    { node: '#fb7185', glow: 'rgba(251,113,133,0.6)' },
};

export const RANK_LABELS: Record<string, string> = {
  ROOT: '根', KINGDOM: '界', PHYLUM: '門', SUBPHYLUM: '亞門', CLASS: '綱', SUBCLASS: '亞綱', INFRACLASS: '下綱', ORDER: '目',
  FAMILY: '科', GENUS: '屬', SPECIES: '種', SUBSPECIES: '亞種', FORM: '變型', BREED: '品種',
  F_ROOT: '虛構', F_ORIGIN: '來源', F_SUB_ORIGIN: '子來源', F_TYPE: '類型', F_SPECIES: '虛構種',
};

export const VTUBER_COLOR = '#64748b';
export const VTUBER_GLOW = 'rgba(100,116,139,0.5)';
export const CURRENT_USER_COLOR = '#E91E8C';
export const CURRENT_USER_GLOW = 'rgba(233,30,140,0.7)';

export const FOCUSED_COLOR = '#D4A017';
export const FOCUSED_GLOW = 'rgba(212,160,23,0.8)';
export const CLOSE_COLOR = '#22c55e';
export const CLOSE_GLOW = 'rgba(34,197,94,0.7)';

export const LIVE_COLOR = '#FF6B35';
export const LIVE_GLOW = 'rgba(255,107,53,0.6)';

export const EDGE_ALPHA = 0.18;
export const EDGE_GLOW_BLUR = 4;

export const LABEL_COLOR = 'rgba(255,255,255,0.85)';
export const LABEL_DIM = 'rgba(255,255,255,0.45)';
export const COUNT_BADGE_BG = 'rgba(255,255,255,0.08)';
export const COUNT_BADGE_TEXT = 'rgba(255,255,255,0.5)';
