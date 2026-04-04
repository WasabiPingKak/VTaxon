/** Shared taxonomy rank constants used across the frontend. */

export const RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'] as const;

export const RANK_TO_UPPER: Record<string, string> = {
  kingdom: 'KINGDOM', phylum: 'PHYLUM', class: 'CLASS', order: 'ORDER',
  family: 'FAMILY', genus: 'GENUS',
};

export const SUB_SPECIES_RANKS = new Set(['SUBSPECIES', 'VARIETY', 'FORM']);
