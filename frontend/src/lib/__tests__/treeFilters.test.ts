import { describe, it, expect } from 'vitest';
import { filterEntries, computeFacets, countActiveFilters, emptyFilters } from '../treeFilters';
import { realEntry } from './fixtures';

/* ─── emptyFilters ─── */

describe('emptyFilters', () => {
  it('returns all empty Sets', () => {
    const f = emptyFilters();
    expect(f.country.size).toBe(0);
    expect(f.gender.size).toBe(0);
    expect(f.status.size).toBe(0);
    expect(f.org_type.size).toBe(0);
    expect(f.platform.size).toBe(0);
  });
});

/* ─── countActiveFilters ─── */

describe('countActiveFilters', () => {
  it('returns 0 for null', () => {
    expect(countActiveFilters(null)).toBe(0);
  });

  it('returns 0 when all empty', () => {
    expect(countActiveFilters(emptyFilters())).toBe(0);
  });

  it('counts non-empty dimensions', () => {
    const f = emptyFilters();
    f.country.add('TW');
    f.gender.add('男');
    expect(countActiveFilters(f)).toBe(2);
  });
});

/* ─── filterEntries ─── */

describe('filterEntries', () => {
  const entries = [
    realEntry('u1', 'Animalia|Chordata', { country_flags: ['TW'], gender: '男', activity_status: 'active', org_type: 'indie', platforms: ['youtube'] }),
    realEntry('u2', 'Animalia|Chordata', { country_flags: ['JP'], gender: '女', activity_status: 'hiatus', org_type: 'corporate', platforms: ['twitch'] }),
    realEntry('u3', 'Animalia|Chordata', { country_flags: [], gender: undefined, activity_status: undefined, organization: 'Hololive', platforms: ['youtube', 'twitch'] }),
  ];

  it('returns all entries when filters is null', () => {
    expect(filterEntries(entries, null)).toEqual(entries);
  });

  it('returns all entries when no active filters', () => {
    expect(filterEntries(entries, emptyFilters())).toBe(entries); // same reference
  });

  it('returns empty array when entries is null', () => {
    expect(filterEntries(null, emptyFilters())).toEqual([]);
  });

  it('filters by country', () => {
    const f = emptyFilters();
    f.country.add('TW');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u1']);
  });

  it('country "none" matches entries with no flags', () => {
    const f = emptyFilters();
    f.country.add('none');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u3']);
  });

  it('country "none" + specific flag matches both', () => {
    const f = emptyFilters();
    f.country.add('none');
    f.country.add('TW');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u1', 'u3']);
  });

  it('filters by gender with normalization', () => {
    const f = emptyFilters();
    f.gender.add('unset');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u3']);
  });

  it('filters by activity_status, missing defaults to unset', () => {
    const f = emptyFilters();
    f.status.add('unset');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u3']);
  });

  it('filters by org_type with fallback to organization field', () => {
    const f = emptyFilters();
    f.org_type.add('corporate');
    const result = filterEntries(entries, f);
    // u2 has org_type=corporate, u3 has no org_type but has organization → corporate
    expect(result.map(e => e.user_id)).toEqual(['u2', 'u3']);
  });

  it('filters by platform', () => {
    const f = emptyFilters();
    f.platform.add('twitch');
    const result = filterEntries(entries, f);
    // u2 has twitch, u3 has both
    expect(result.map(e => e.user_id)).toEqual(['u2', 'u3']);
  });

  it('combines multiple filter dimensions (AND logic)', () => {
    const f = emptyFilters();
    f.platform.add('youtube');
    f.gender.add('男');
    const result = filterEntries(entries, f);
    expect(result.map(e => e.user_id)).toEqual(['u1']);
  });

  it('country flag matching is case-insensitive', () => {
    const lower = [realEntry('u1', 'A', { country_flags: ['tw'] })];
    const f = emptyFilters();
    f.country.add('TW');
    expect(filterEntries(lower, f).length).toBe(1);
  });
});

/* ─── computeFacets ─── */

describe('computeFacets', () => {
  it('returns empty maps for null/empty', () => {
    const f = computeFacets(null);
    expect(f.country.size).toBe(0);
    expect(computeFacets([]).country.size).toBe(0);
  });

  it('deduplicates by user_id', () => {
    const entries = [
      realEntry('u1', 'A|B', { gender: '男' }),
      realEntry('u1', 'A|C', { gender: '男' }), // duplicate user
    ];
    const f = computeFacets(entries);
    expect(f.gender.get('男')).toBe(1);
  });

  it('counts country "none" for users without flags', () => {
    const entries = [realEntry('u1', 'A', { country_flags: [] })];
    const f = computeFacets(entries);
    expect(f.country.get('none')).toBe(1);
  });

  it('counts each country flag separately', () => {
    const entries = [realEntry('u1', 'A', { country_flags: ['tw', 'jp'] })];
    const f = computeFacets(entries);
    expect(f.country.get('TW')).toBe(1);
    expect(f.country.get('JP')).toBe(1);
  });

  it('normalizes gender correctly', () => {
    const entries = [
      realEntry('u1', 'A', { gender: '男' }),
      realEntry('u2', 'A', { gender: '女' }),
      realEntry('u3', 'A', { gender: 'non-binary' }),
      realEntry('u4', 'A', { gender: undefined }),
    ];
    const f = computeFacets(entries);
    expect(f.gender.get('男')).toBe(1);
    expect(f.gender.get('女')).toBe(1);
    expect(f.gender.get('other')).toBe(1);
    expect(f.gender.get('unset')).toBe(1);
  });

  it('counts platforms per user', () => {
    const entries = [
      realEntry('u1', 'A', { platforms: ['youtube', 'twitch'] }),
      realEntry('u2', 'A', { platforms: ['youtube'] }),
    ];
    const f = computeFacets(entries);
    expect(f.platform.get('youtube')).toBe(2);
    expect(f.platform.get('twitch')).toBe(1);
  });
});
