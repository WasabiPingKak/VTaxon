/**
 * Pure computation functions extracted from TaxonomyGraph.tsx.
 * Each function corresponds to a useMemo body in the original component.
 */
import type { TreeEntry, ActiveTree, SortKey, SortOrder } from '../types';

// ── Local types (previously component-local) ──

export interface SortConfig {
  key: string;
  order: SortOrder;
  shuffleSeed: number | null;
  liveUserIds?: Set<string>;
}

export interface TraceBackLevel {
  label: string;
  value: number;
  available: boolean;
}

// ── Helpers ──

/** Deterministic daily hash for shuffle seed. */
export function getDailyHash(): number {
  const dateStr = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const c of dateStr) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Convert a TreeEntry to a stable unique key string. */
export function entryToKey(e: TreeEntry | null): string | null {
  if (!e) return null;
  if (e.fictional_path) return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '');
  return (e.taxon_path || '') + '\0' + (e.breed_id || '');
}

// ── Data derivation ──

/** All entries (real + fictional) for a given user. */
export function computeRawFocusedEntries(
  focusedUserId: string | null,
  entries: TreeEntry[] | null,
  fictionalEntries: TreeEntry[] | null,
): TreeEntry[] {
  if (!focusedUserId) return [];
  const real = entries ? entries.filter(e => e.user_id === focusedUserId) : [];
  const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === focusedUserId) : [];
  return [...real, ...fict];
}

/** Live filter deduplication: keep one entry per live user, preferring primary trait. */
export function applyLiveDedup(
  filtered: TreeEntry[],
  liveUserIds: Set<string>,
  livePrimaries: Map<string, { real?: string; fictional?: string }>,
  primaryField: 'real' | 'fictional',
): TreeEntry[] {
  const liveEntries = filtered.filter(e => liveUserIds.has(e.user_id));
  const seen = new Set<string>();
  const primary: TreeEntry[] = [];
  const fallback: TreeEntry[] = [];
  for (const e of liveEntries) {
    const p = livePrimaries.get(e.user_id);
    const traitId = (e as TreeEntry & { trait_id?: string }).trait_id;
    if (p?.[primaryField] && traitId === p[primaryField]) {
      if (!seen.has(e.user_id)) {
        seen.add(e.user_id);
        primary.push(e);
      }
    } else {
      fallback.push(e);
    }
  }
  for (const e of fallback) {
    if (!seen.has(e.user_id)) {
      seen.add(e.user_id);
      primary.push(e);
    }
  }
  return primary;
}

/** Count distinct live users across real + fictional entries. */
export function computeLiveCount(
  entries: TreeEntry[] | null,
  fictionalEntries: TreeEntry[] | null,
  liveUserIds: Set<string>,
): number {
  if (!entries || !liveUserIds || liveUserIds.size === 0) return 0;
  const seen = new Set<string>();
  for (const e of entries) {
    if (liveUserIds.has(e.user_id)) seen.add(e.user_id);
  }
  if (fictionalEntries) {
    for (const e of fictionalEntries) {
      if (liveUserIds.has(e.user_id)) seen.add(e.user_id);
    }
  }
  return seen.size;
}

// ── Sort config ──

/** Build sort configs for real and fictional trees. */
export function buildSortConfigs(
  sortKey: SortKey,
  sortOrder: SortOrder,
  shuffleSeed: number | null,
  liveUserIds: Set<string>,
  activeTree: ActiveTree,
): { realSortConfig: SortConfig; fictSortConfig: SortConfig } {
  const baseSortConfig: SortConfig = { key: sortKey, order: sortOrder, shuffleSeed: null, liveUserIds };
  const shuffleSortConfig: SortConfig | null =
    shuffleSeed != null
      ? { key: 'shuffle', order: sortOrder, shuffleSeed }
      : null;
  const realSortConfig = shuffleSortConfig && activeTree === 'real' ? shuffleSortConfig : baseSortConfig;
  const fictSortConfig = shuffleSortConfig && activeTree === 'fictional' ? shuffleSortConfig : baseSortConfig;
  return { realSortConfig, fictSortConfig };
}

// ── Focus ──

/** Derive the index of the focused species from entry key. */
export function deriveFocusedSpeciesIdx(
  focusedEntryKey: string | null,
  focusedEntries: TreeEntry[],
): number {
  if (!focusedEntryKey || focusedEntries.length === 0) return 0;
  const idx = focusedEntries.findIndex(e => {
    if (e.fictional_path) {
      return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '') === focusedEntryKey;
    }
    return (e.taxon_path || '') + '\0' + (e.breed_id || '') === focusedEntryKey;
  });
  return idx >= 0 ? idx : 0;
}

/** Get the single active focused entry as an array. */
export function computeActiveFocusedEntries(
  focusedEntries: TreeEntry[],
  focusedSpeciesIdx: number,
): TreeEntry[] {
  const entry = focusedEntries[focusedSpeciesIdx] || focusedEntries[0];
  return entry ? [entry] : [];
}

// ── Trace back ──

/** Maximum trace-back depth for the active focused entry. */
export function computeMaxTraceBack(
  activeFocusedEntries: TreeEntry[],
  isFictional: boolean,
): number {
  if (!activeFocusedEntries.length) return 0;
  if (isFictional) {
    const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
    return Math.max(0, segs - 1 - 0);
  }
  const segs = (activeFocusedEntries[0].taxon_path || '').split('|').length;
  return Math.max(0, segs - 1 - 2);
}

/** Build trace-back level options for the UI slider. */
export function computeTraceBackLevels(
  activeFocusedEntries: TreeEntry[],
  maxTraceBack: number,
  isFictional: boolean,
): TraceBackLevel[] {
  if (!activeFocusedEntries.length) return [];

  if (isFictional) {
    const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
    const levels: TraceBackLevel[] = [];
    if (segs >= 4) {
      levels.push({ label: '同來源', value: 3, available: 3 <= maxTraceBack });
      levels.push({ label: '同體系', value: 2, available: 2 <= maxTraceBack });
      levels.push({ label: '同類型', value: 1, available: 1 <= maxTraceBack });
      levels.push({ label: '同種', value: 0, available: true });
    } else if (segs === 3) {
      levels.push({ label: '同來源', value: 2, available: 2 <= maxTraceBack });
      levels.push({ label: '同體系', value: 1, available: 1 <= maxTraceBack });
      levels.push({ label: '同種', value: 0, available: true });
    } else {
      levels.push({ label: '同來源', value: 1, available: 1 <= maxTraceBack });
      levels.push({ label: '同種', value: 0, available: true });
    }
    return levels;
  }

  const REAL_LEVELS = [
    { label: '同綱', depth: 3 },
    { label: '同目', depth: 4 },
    { label: '同科', depth: 5 },
    { label: '同屬', depth: 6 },
    { label: '同種', depth: 7 },
  ];
  const maxDepth = (activeFocusedEntries[0].taxon_path || '').split('|').length;
  return REAL_LEVELS.map(lv => ({
    label: lv.label,
    value: maxDepth - lv.depth,
    available: (maxDepth - lv.depth) >= 0 && (maxDepth - lv.depth) <= maxTraceBack,
  }));
}

/** Depth-to-label mapping for the floating toolbar. */
export function computeDepthLabels(
  activeFocusedEntries: TreeEntry[],
  isFictional: boolean,
): Record<number, string> | null {
  if (!activeFocusedEntries.length) return null;
  if (isFictional) {
    const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
    if (segs >= 4) return { 4: '同種', 3: '同類型', 2: '同體系', 1: '同來源' };
    if (segs === 3) return { 3: '同種', 2: '同體系', 1: '同來源' };
    return { 2: '同種', 1: '同來源' };
  }
  return { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界' };
}
