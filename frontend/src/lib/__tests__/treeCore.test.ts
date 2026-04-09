import { describe, it, expect } from 'vitest';
import { stripAuthor } from '../tree';

describe('stripAuthor', () => {
  it('returns null/undefined as-is', () => {
    expect(stripAuthor(null)).toBeNull();
    expect(stripAuthor(undefined)).toBeUndefined();
  });

  it('returns name without author unchanged', () => {
    expect(stripAuthor('Vulpes vulpes')).toBe('Vulpes vulpes');
  });

  it('strips parenthesized author + year', () => {
    expect(stripAuthor('Vulpes zerda (Zimmermann, 1780)')).toBe('Vulpes zerda');
  });

  it('strips non-parenthesized author + year', () => {
    expect(stripAuthor('Felis catus Linnaeus, 1758')).toBe('Felis catus');
  });

  it('strips author with apostrophe', () => {
    expect(stripAuthor("Canis lupus O'Brien, 2000")).toBe('Canis lupus');
  });

  it('handles empty string', () => {
    expect(stripAuthor('')).toBe('');
  });
});
