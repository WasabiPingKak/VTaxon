import { describe, it, expect } from 'vitest';
import {
  parseAltNames,
  formatAltNamesInline,
  formatAltNamesFull,
  altNamesTooltip,
} from '../altNames';

/* ─── parseAltNames ─── */

describe('parseAltNames', () => {
  it('returns empty for null / undefined / empty string', () => {
    const empty = { visible: [], hidden: [], total: 0 };
    expect(parseAltNames(null)).toEqual(empty);
    expect(parseAltNames(undefined)).toEqual(empty);
    expect(parseAltNames('')).toEqual(empty);
  });

  it('parses single name', () => {
    expect(parseAltNames('貓咪')).toEqual({
      visible: ['貓咪'],
      hidden: [],
      total: 1,
    });
  });

  it('splits by half-width comma', () => {
    const result = parseAltNames('狗,貓,鳥', 2);
    expect(result.visible).toEqual(['狗', '貓']);
    expect(result.hidden).toEqual(['鳥']);
    expect(result.total).toBe(3);
  });

  it('splits by full-width comma', () => {
    const result = parseAltNames('狗，貓，鳥', 2);
    expect(result.visible).toEqual(['狗', '貓']);
    expect(result.hidden).toEqual(['鳥']);
  });

  it('splits by mixed comma types', () => {
    const result = parseAltNames('狗,貓，鳥', 2);
    expect(result.visible).toEqual(['狗', '貓']);
    expect(result.hidden).toEqual(['鳥']);
  });

  it('trims whitespace around names', () => {
    const result = parseAltNames('  狗 , 貓  ');
    expect(result.visible).toEqual(['狗', '貓']);
  });

  it('filters out empty segments', () => {
    const result = parseAltNames('狗,,貓,  ,');
    expect(result.visible).toEqual(['狗', '貓']);
    expect(result.total).toBe(2);
  });

  it('respects custom max', () => {
    const result = parseAltNames('A,B,C,D,E', 3);
    expect(result.visible).toEqual(['A', 'B', 'C']);
    expect(result.hidden).toEqual(['D', 'E']);
  });

  it('max=0 hides all', () => {
    const result = parseAltNames('A,B', 0);
    expect(result.visible).toEqual([]);
    expect(result.hidden).toEqual(['A', 'B']);
  });
});

/* ─── formatAltNamesInline ─── */

describe('formatAltNamesInline', () => {
  it('returns empty string for null', () => {
    expect(formatAltNamesInline(null)).toBe('');
  });

  it('wraps single name in parentheses', () => {
    expect(formatAltNamesInline('貓咪')).toBe('（貓咪）');
  });

  it('joins with 、 and shows overflow count', () => {
    expect(formatAltNamesInline('A,B,C', 2)).toBe('（A、B +1）');
  });

  it('no overflow when within max', () => {
    expect(formatAltNamesInline('A,B', 2)).toBe('（A、B）');
  });
});

/* ─── formatAltNamesFull ─── */

describe('formatAltNamesFull', () => {
  it('returns empty string for null', () => {
    expect(formatAltNamesFull(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatAltNamesFull('')).toBe('');
  });

  it('joins all names with 、', () => {
    expect(formatAltNamesFull('A,B,C')).toBe('A、B、C');
  });

  it('handles full-width comma', () => {
    expect(formatAltNamesFull('A，B，C')).toBe('A、B、C');
  });
});

/* ─── altNamesTooltip ─── */

describe('altNamesTooltip', () => {
  it('returns empty string for null', () => {
    expect(altNamesTooltip(null)).toBe('');
  });

  it('formats as tooltip with prefix', () => {
    expect(altNamesTooltip('狗,貓')).toBe('俗名：狗、貓');
  });
});
