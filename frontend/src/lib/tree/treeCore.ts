/**
 * Core tree utilities: shared helpers and constants.
 */

import { RANK_ORDER } from '../taxonomyConstants';

export const RANK_KEYS = RANK_ORDER;

export const RANK_NAMES: Record<number, string> = {
  0: 'KINGDOM', 1: 'PHYLUM', 2: 'CLASS', 3: 'ORDER',
  4: 'FAMILY', 5: 'GENUS', 6: 'SPECIES', 7: 'SUBSPECIES',
  8: 'BREED',
};

/** Strip taxonomic author citations from scientific names.
 *  "Vulpes zerda (Zimmermann, 1780)" -> "Vulpes zerda" */
export function stripAuthor(name: string | null | undefined): string {
  if (!name) return name as string;
  return name.replace(/\s+\(?[A-Z][\w.\s,''-]*,\s*\d{4}\)?$/, '').trim();
}

export function splitPath(taxonPath: string | null | undefined): string[] {
  const parts = (taxonPath || '').split('|');
  for (let i = RANK_KEYS.length; i < parts.length; i++) {
    parts[i] = stripAuthor(parts[i]);
  }
  return parts;
}

/** Fictional species constants */
export const F_PREFIX = '__F__';
export const F_ORIGIN_IDX = 0;
export const F_RANK_NAMES: Record<number, string> = { 0: 'F_ORIGIN', 1: 'F_SUB_ORIGIN', 2: 'F_TYPE' };
