// ── Tree data structures ──

/** A node in the taxonomy tree built from flat entries by buildTree(). */
export interface TaxonomyTreeNode {
  name: string;
  nameZh: string;
  rank: string;
  pathKey: string;
  count: number;
  children: Map<string, TaxonomyTreeNode>;
  vtubers: TreeEntry[];
}

/** Flat entry from the /taxonomy/tree API endpoint. */
export interface TreeEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  taxon_path: string;
  taxon_id?: number;
  taxon_rank?: string;
  scientific_name?: string;
  canonical_name?: string;
  display_name_override?: string | null;
  path_ranks?: string[];
  path_zh?: Record<string, string>;
  common_name_zh?: string;
  breed_id?: number | null;
  breed_name?: string;
  breed_name_en?: string;
  breed_name_zh?: string;
  country_flags?: string[];
  gender?: string;
  activity_status?: string;
  org_type?: string;
  organization?: string | null;
  platforms?: string[];
  trait_count?: number;
  is_live_primary?: boolean;
  last_live_at?: string | null;
  debut_date?: string | null;
  created_at?: string;
  // Fictional fields (present when entry comes from fictional tree)
  fictional_path?: string;
  origin?: string;
  sub_origin?: string;
  fictional_name_zh?: string;
  fictional_species_id?: number;
}

export type VisualTier = 'normal' | 'dot' | 'hidden';

/** Active filter selections — each dimension is a Set of selected values. */
export interface TreeFilters {
  country: Set<string>;
  gender: Set<string>;
  status: Set<string>;
  org_type: Set<string>;
  platform: Set<string>;
}

/** Facet counts computed from unfiltered entries. */
export interface TreeFacets {
  country: Map<string, number>;
  gender: Map<string, number>;
  status: Map<string, number>;
  org_type: Map<string, number>;
  platform: Map<string, number>;
}

export type SortKey = 'created_at' | 'active_first' | 'name' | 'debut_date' | 'organization' | 'country';
export type SortOrder = 'asc' | 'desc';
export type ActiveTree = 'real' | 'fictional';
