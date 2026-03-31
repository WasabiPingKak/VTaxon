import type { TreeEntry } from '../../types/tree';

/** Minimal TreeEntry factory — only user_id, display_name, taxon_path are required. */
export function makeEntry(overrides: Partial<TreeEntry> & Pick<TreeEntry, 'user_id' | 'taxon_path'>): TreeEntry {
  return {
    display_name: overrides.user_id,
    avatar_url: null,
    ...overrides,
  };
}

/** Shorthand: make a real-species entry with the given path. */
export function realEntry(userId: string, taxonPath: string, extra?: Partial<TreeEntry>): TreeEntry {
  return makeEntry({ user_id: userId, taxon_path: taxonPath, ...extra });
}

/** Shorthand: make a fictional-species entry. */
export function fictionalEntry(userId: string, fictionalPath: string, extra?: Partial<TreeEntry>): TreeEntry {
  return makeEntry({
    user_id: userId,
    taxon_path: '',
    fictional_path: fictionalPath,
    ...extra,
  });
}
