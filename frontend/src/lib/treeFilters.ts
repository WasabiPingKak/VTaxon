/**
 * Tree filtering and facet computation utilities.
 * Applied to raw entries BEFORE buildTree, so the tree only contains matching users.
 */

import type { TreeEntry, TreeFilters, TreeFacets } from '../types/tree';

export function filterEntries(entries: TreeEntry[] | null, filters: TreeFilters | null): TreeEntry[] {
  if (!entries || !filters) return entries || [];

  const { country, gender, status, org_type, platform } = filters;
  const hasCountry = country && country.size > 0;
  const hasGender = gender && gender.size > 0;
  const hasStatus = status && status.size > 0;
  const hasOrgType = org_type && org_type.size > 0;
  const hasPlatform = platform && platform.size > 0;

  if (!hasCountry && !hasGender && !hasStatus && !hasOrgType && !hasPlatform) {
    return entries;
  }

  return entries.filter(e => {
    if (hasCountry) {
      const flags = (e.country_flags || []).map(f => f.toUpperCase());
      if (country.has('none')) {
        if (flags.length > 0 && !flags.some(f => country.has(f))) return false;
      } else {
        if (!flags.some(f => country.has(f))) return false;
      }
    }

    if (hasGender) {
      const raw = e.gender;
      const g = !raw ? 'unset' : (raw === '男' || raw === '女') ? raw : 'other';
      if (!gender.has(g)) return false;
    }

    if (hasStatus) {
      const s = e.activity_status || 'unset';
      if (!status.has(s)) return false;
    }

    if (hasOrgType) {
      const ot = e.org_type || (e.organization ? 'corporate' : 'indie');
      if (!org_type.has(ot)) return false;
    }

    if (hasPlatform) {
      const platforms = e.platforms || [];
      if (!platforms.some(p => platform.has(p))) return false;
    }

    return true;
  });
}

export function computeFacets(entries: TreeEntry[] | null): TreeFacets {
  if (!entries || entries.length === 0) {
    return { country: new Map(), gender: new Map(), status: new Map(), org_type: new Map(), platform: new Map() };
  }

  const seen = new Set<string>();
  const uniqueUsers: TreeEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.user_id)) continue;
    seen.add(e.user_id);
    uniqueUsers.push(e);
  }

  const country = new Map<string, number>();
  const gender = new Map<string, number>();
  const status = new Map<string, number>();
  const org_type = new Map<string, number>();
  const platform = new Map<string, number>();

  for (const e of uniqueUsers) {
    const flags = e.country_flags || [];
    if (flags.length === 0) {
      country.set('none', (country.get('none') || 0) + 1);
    } else {
      for (const f of flags) {
        const key = f.toUpperCase();
        country.set(key, (country.get(key) || 0) + 1);
      }
    }

    const rawG = e.gender;
    const g = !rawG ? 'unset' : (rawG === '男' || rawG === '女') ? rawG : 'other';
    gender.set(g, (gender.get(g) || 0) + 1);

    const s = e.activity_status || 'unset';
    status.set(s, (status.get(s) || 0) + 1);

    const orgKey = e.org_type || (e.organization ? 'corporate' : 'indie');
    org_type.set(orgKey, (org_type.get(orgKey) || 0) + 1);

    const platforms = e.platforms || [];
    for (const p of platforms) {
      platform.set(p, (platform.get(p) || 0) + 1);
    }
  }

  return { country, gender, status, org_type, platform };
}

export function countActiveFilters(filters: TreeFilters | null): number {
  if (!filters) return 0;
  let count = 0;
  for (const key of Object.keys(filters) as Array<keyof TreeFilters>) {
    if (filters[key] && filters[key].size > 0) count++;
  }
  return count;
}

export function emptyFilters(): TreeFilters {
  return {
    country: new Set(),
    gender: new Set(),
    status: new Set(),
    org_type: new Set(),
    platform: new Set(),
  };
}
