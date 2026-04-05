import { describe, it, expect, vi } from 'vitest';
import {
  taxonomyNodeRadius,
  collapsedRectWeight,
  hexToRgba,
  isInViewport,
  scaledFontSize,
  fontStr,
  edgeFlashAlpha,
} from '../renderers';
import type { Viewport, DrawGraphState } from '../renderers';

/* ─── taxonomyNodeRadius ─── */

describe('taxonomyNodeRadius', () => {
  it('returns MIN_R when count is 0', () => {
    expect(taxonomyNodeRadius(0, 100)).toBe(5);
  });

  it('returns MIN_R when maxCount is 0', () => {
    expect(taxonomyNodeRadius(10, 0)).toBe(5);
  });

  it('returns MIN_R when maxCount is negative', () => {
    expect(taxonomyNodeRadius(10, -5)).toBe(5);
  });

  it('returns MAX_R when count equals maxCount', () => {
    expect(taxonomyNodeRadius(100, 100)).toBe(5 + 25); // MIN_R + (MAX_R - MIN_R) * sqrt(1)
  });

  it('scales proportionally to sqrt of ratio', () => {
    const r = taxonomyNodeRadius(25, 100);
    // sqrt(25/100) = 0.5 → 5 + 25 * 0.5 = 17.5
    expect(r).toBeCloseTo(17.5);
  });
});

/* ─── collapsedRectWeight ─── */

describe('collapsedRectWeight', () => {
  it('returns 0 when count is undefined', () => {
    expect(collapsedRectWeight(undefined, 100)).toBe(0);
  });

  it('returns 0 when count is 0', () => {
    expect(collapsedRectWeight(0, 100)).toBe(0);
  });

  it('returns 0 when count is 1', () => {
    expect(collapsedRectWeight(1, 100)).toBe(0);
  });

  it('returns 0 when maxCount is undefined', () => {
    expect(collapsedRectWeight(50, undefined)).toBe(0);
  });

  it('returns 0 when maxCount is 1', () => {
    expect(collapsedRectWeight(50, 1)).toBe(0);
  });

  it('returns sqrt ratio capped at 1', () => {
    const w = collapsedRectWeight(25, 100);
    expect(w).toBeCloseTo(Math.sqrt(25 / 100));
  });

  it('caps at 1 when count equals maxCount', () => {
    expect(collapsedRectWeight(100, 100)).toBe(1);
  });
});

/* ─── hexToRgba ─── */

describe('hexToRgba', () => {
  it('converts #ff0000 with alpha 0.5', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
  });

  it('converts #00ff00 with alpha 1', () => {
    expect(hexToRgba('#00ff00', 1)).toBe('rgba(0,255,0,1)');
  });

  it('converts #1a2b3c with alpha 0', () => {
    expect(hexToRgba('#1a2b3c', 0)).toBe('rgba(26,43,60,0)');
  });
});

/* ─── isInViewport ─── */

describe('isInViewport', () => {
  const vp: Viewport = { x: 100, y: 100, w: 200, h: 200 };
  const margin = 50;

  it('returns true for point inside viewport', () => {
    expect(isInViewport(150, 150, vp, margin)).toBe(true);
  });

  it('returns true for point within margin', () => {
    // x=60 is outside viewport (100-300) but within margin (50-350)
    expect(isInViewport(60, 150, vp, margin)).toBe(true);
  });

  it('returns false for point outside margin', () => {
    expect(isInViewport(0, 0, vp, margin)).toBe(false);
  });

  it('returns true at exact margin boundary', () => {
    // x = vp.x - margin = 50, y = vp.y - margin = 50
    expect(isInViewport(50, 50, vp, margin)).toBe(true);
  });

  it('returns false just outside margin boundary', () => {
    expect(isInViewport(49, 50, vp, margin)).toBe(false);
  });
});

/* ─── scaledFontSize ─── */

describe('scaledFontSize', () => {
  it('returns basePx / scale for normal scale', () => {
    expect(scaledFontSize(12, 1)).toBe(12);
    expect(scaledFontSize(12, 2)).toBe(6);
  });

  it('clamps at FONT_MIN_SCALE (0.55) for very small scale', () => {
    // scale < 0.55 → uses 0.55
    expect(scaledFontSize(12, 0.1)).toBeCloseTo(12 / 0.55);
    expect(scaledFontSize(12, 0.3)).toBeCloseTo(12 / 0.55);
  });

  it('uses actual scale when above FONT_MIN_SCALE', () => {
    expect(scaledFontSize(12, 0.6)).toBeCloseTo(12 / 0.6);
  });
});

/* ─── fontStr ─── */

describe('fontStr', () => {
  it('builds basic font string', () => {
    const result = fontStr(12, 1);
    expect(result).toContain('12px');
    expect(result).toContain('Microsoft JhengHei');
  });

  it('includes weight when provided', () => {
    const result = fontStr(12, 1, 'bold');
    expect(result).toContain('bold');
  });

  it('includes style when provided', () => {
    const result = fontStr(12, 1, '', 'italic');
    expect(result).toContain('italic');
  });

  it('includes both weight and style', () => {
    const result = fontStr(12, 1, 'bold', 'italic');
    expect(result).toContain('italic');
    expect(result).toContain('bold');
  });
});

/* ─── edgeFlashAlpha ─── */

describe('edgeFlashAlpha', () => {
  it('returns 0 when no edgeFlashStart', () => {
    expect(edgeFlashAlpha({} as DrawGraphState)).toBe(0);
    expect(edgeFlashAlpha({ edgeFlashStart: null } as DrawGraphState)).toBe(0);
  });

  it('returns 0 when elapsed >= 2800ms (FLASH_TOTAL)', () => {
    const now = performance.now();
    expect(edgeFlashAlpha({ edgeFlashStart: now - 3000 } as DrawGraphState)).toBe(0);
  });

  it('returns > 0 during first pulse (0-1200ms)', () => {
    // At ~360ms (t=0.3, peak of first pulse)
    const now = performance.now();
    vi.spyOn(performance, 'now').mockReturnValue(now);
    const state = { edgeFlashStart: now - 360 } as DrawGraphState;
    vi.spyOn(performance, 'now').mockReturnValue(now);
    const alpha = edgeFlashAlpha(state);
    expect(alpha).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });

  it('returns 0 during gap (1200-1400ms)', () => {
    const now = performance.now();
    vi.spyOn(performance, 'now').mockReturnValue(now);
    const state = { edgeFlashStart: now - 1300 } as DrawGraphState;
    const alpha = edgeFlashAlpha(state);
    expect(alpha).toBe(0);
    vi.restoreAllMocks();
  });

  it('returns > 0 during second pulse (1400-2600ms)', () => {
    const now = performance.now();
    vi.spyOn(performance, 'now').mockReturnValue(now);
    const state = { edgeFlashStart: now - 1760 } as DrawGraphState; // t=0.3 of second pulse
    const alpha = edgeFlashAlpha(state);
    expect(alpha).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });

  it('second pulse is weaker than first (0.65x intensity)', () => {
    const now = performance.now();
    vi.spyOn(performance, 'now').mockReturnValue(now);
    // Peak of first pulse: elapsed=360 → t=0.3, intensity=1.0
    const alpha1 = edgeFlashAlpha({ edgeFlashStart: now - 360 } as DrawGraphState);
    // Peak of second pulse: elapsed=1400+360=1760 → t=0.3, intensity=0.65
    const alpha2 = edgeFlashAlpha({ edgeFlashStart: now - 1760 } as DrawGraphState);
    expect(alpha2).toBeLessThan(alpha1);
    expect(alpha2).toBeCloseTo(alpha1 * 0.65, 1);
    vi.restoreAllMocks();
  });
});
