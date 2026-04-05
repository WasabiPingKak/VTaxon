import type { DrawGraphState, Viewport, PlatformIcon } from './types';
import {
  MIN_R, MAX_R, FONT_MIN_SCALE, FONT_FAMILY,
} from './constants';

export function taxonomyNodeRadius(count: number, maxCount: number): number {
  if (!count || !maxCount || maxCount <= 0) return MIN_R;
  return MIN_R + (MAX_R - MIN_R) * Math.sqrt(count / maxCount);
}

// ── Collapsed rect node scale factor (0→1) based on count ──
// Returns a 0–1 factor for scaling rect size, border, glow when collapsed
export function collapsedRectWeight(count: number | undefined, maxCount: number | undefined): number {
  if (!count || count <= 1 || !maxCount || maxCount <= 1) return 0;
  return Math.min(Math.sqrt(count / maxCount), 1);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function isInViewport(x: number, y: number, vp: Viewport, margin: number): boolean {
  return x >= vp.x - margin && x <= vp.x + vp.w + margin &&
         y >= vp.y - margin && y <= vp.y + vp.h + margin;
}

export function scaledFontSize(basePx: number, scale: number): number {
  return basePx / Math.max(scale, FONT_MIN_SCALE);
}

export function fontStr(basePx: number, scale: number, weight = '', style = ''): string {
  const sz = scaledFontSize(basePx, scale);
  return `${style} ${weight} ${sz}px ${FONT_FAMILY}`.trim();
}

/** Draw multi-line text centered at x, starting from startY (textBaseline='top'). */
export function drawWrappedText(ctx: CanvasRenderingContext2D, lines: string[], x: number, startY: number, lineHeight: number): void {
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}

// ── Edge flash alpha (synced with node flash double-pulse) ──
export function edgeFlashAlpha(state: DrawGraphState): number {
  if (!state.edgeFlashStart) return 0;
  const elapsed = performance.now() - state.edgeFlashStart;
  const FLASH_TOTAL = 2800;
  if (elapsed >= FLASH_TOTAL) return 0;
  let t: number, intensity: number;
  if (elapsed < 1200) {
    t = elapsed / 1200;
    intensity = 1.0;
  } else if (elapsed >= 1400 && elapsed < 2600) {
    t = (elapsed - 1400) / 1200;
    intensity = 0.65;
  } else {
    return 0; // gap or end
  }
  // Smooth pulse: peak at t=0.3, fade out
  const pulse = t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7);
  return pulse * intensity;
}

// ── Hex ring helper ──
export function drawHexRing(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, strokeStyle: string, lineWidth: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
}

// ── Platform icon SVG paths (viewBox 0 0 24 24) for canvas rendering ──
const PLATFORM_ICONS: Record<string, PlatformIcon> = {
  youtube: {
    paths: [
      { d: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z', fill: '#FF0000' },
      { d: 'M9.545 15.568V8.432L15.818 12l-6.273 3.568z', fill: '#fff' },
    ],
  },
  twitch: {
    paths: [
      { d: 'M11.571 4.714h1.715v5.143H11.57V4.714zm4.715 0H18v5.143h-1.714V4.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z', fill: '#9146FF' },
    ],
  },
};

/** Draw a platform icon (YT/Twitch) on canvas, scaled to fit iconSize at (x, y). */
export function drawPlatformIcon(ctx: CanvasRenderingContext2D, platform: string, x: number, y: number, iconSize: number): void {
  const icon = PLATFORM_ICONS[platform];
  if (!icon) return;
  const s = iconSize / 24; // scale from 24x24 viewBox
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const p of icon.paths) {
    const path = new Path2D(p.d);
    ctx.fillStyle = p.fill;
    ctx.fill(path);
  }
  ctx.restore();
}
