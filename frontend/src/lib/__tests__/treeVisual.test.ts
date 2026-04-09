import { describe, it, expect } from 'vitest';
import {
  getVisualTier,
  subtreeHasNormalUser,
  hashUserId,
  buildTree,
  BUDGET_TIER_DOT,
  BUDGET_TIER_HIDDEN,
} from '../tree';
import { realEntry } from './fixtures';

describe('getVisualTier', () => {
  it('returns "normal" for low trait_count', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 1 }))).toBe('normal');
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 4 }))).toBe('normal');
  });

  it('returns "dot" at BUDGET_TIER_DOT threshold', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: BUDGET_TIER_DOT }))).toBe('dot');
  });

  it('returns "hidden" at BUDGET_TIER_HIDDEN threshold', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: BUDGET_TIER_HIDDEN }))).toBe('hidden');
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 10 }))).toBe('hidden');
  });

  it('returns "normal" when is_live_primary regardless of trait_count', () => {
    expect(getVisualTier(realEntry('u1', 'A', { trait_count: 99, is_live_primary: true }))).toBe('normal');
  });

  it('returns "normal" when trait_count is undefined', () => {
    expect(getVisualTier(realEntry('u1', 'A'))).toBe('normal');
  });
});

describe('subtreeHasNormalUser', () => {
  it('returns true when node has normal-tier vtuber', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: 1 })]);
    expect(subtreeHasNormalUser(tree)).toBe(true);
  });

  it('returns false when all vtubers are hidden', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: BUDGET_TIER_HIDDEN })]);
    expect(subtreeHasNormalUser(tree)).toBe(false);
  });

  it('returns true when nested child has dot-tier vtuber', () => {
    const tree = buildTree([realEntry('u1', 'A|B', { trait_count: BUDGET_TIER_DOT })]);
    expect(subtreeHasNormalUser(tree)).toBe(true);
  });
});

describe('hashUserId', () => {
  it('returns a non-negative integer', () => {
    const result = hashUserId('user-abc-123');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('is deterministic', () => {
    expect(hashUserId('u1')).toBe(hashUserId('u1'));
    expect(hashUserId('long-user-id-xyz')).toBe(hashUserId('long-user-id-xyz'));
  });

  it('produces different hashes for different ids', () => {
    expect(hashUserId('u1')).not.toBe(hashUserId('u2'));
  });

  it('handles empty string', () => {
    const result = hashUserId('');
    expect(result).toBe(0);
  });
});
