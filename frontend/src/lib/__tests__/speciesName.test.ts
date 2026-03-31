import { describe, it, expect } from 'vitest';
import { displayScientificName } from '../speciesName';

describe('displayScientificName', () => {
  it('returns empty string for null', () => {
    expect(displayScientificName(null)).toBe('');
  });

  it('returns empty string when all fields missing', () => {
    expect(displayScientificName({})).toBe('');
  });

  it('prefers display_name_override', () => {
    expect(
      displayScientificName({
        display_name_override: 'Override',
        canonical_name: 'Canonical',
        scientific_name: 'Scientific Author',
      }),
    ).toBe('Override');
  });

  it('falls back to canonical_name when override is null', () => {
    expect(
      displayScientificName({
        display_name_override: null,
        canonical_name: 'Canonical',
        scientific_name: 'Scientific Author',
      }),
    ).toBe('Canonical');
  });

  it('falls back to scientific_name when canonical is also missing', () => {
    expect(
      displayScientificName({
        scientific_name: 'Felis catus Linnaeus, 1758',
      }),
    ).toBe('Felis catus Linnaeus, 1758');
  });

  it('skips empty string override', () => {
    expect(
      displayScientificName({
        display_name_override: '',
        canonical_name: 'Canis lupus',
      }),
    ).toBe('Canis lupus');
  });
});
