import type { LayoutNode } from '../../../types/graph';
import type { TreeEntry } from '../../../types/tree';
import type { DrawGraphState } from './types';
import {
  VTUBER_COLOR, VTUBER_GLOW, CURRENT_USER_COLOR, CURRENT_USER_GLOW,
  FOCUSED_COLOR, FOCUSED_GLOW, CLOSE_COLOR, CLOSE_GLOW,
  LIVE_COLOR, LIVE_GLOW,
  LABEL_COLOR, LABEL_DIM,
} from '../colors';
import { LOD_DOTS_ONLY } from './constants';
import {
  scaledFontSize, fontStr, drawWrappedText, drawHexRing,
  roundedRect, drawPlatformIcon,
} from './utils';
import { FONT_MIN_SCALE } from './constants';
import { getActiveFilterBadges, getSortBadge } from '../../../lib/filterBadges';
import { getFlagImage } from '../../../lib/flagImages';

// ── Vtuber node (hexagon + avatar) ──
export function drawVtuberNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;
  const isCurrentUser = d._isCurrentUser;
  const isFocused = state.focusedUserId && d._userId === state.focusedUserId;
  const isClose = state.closeVtuberIds && state.closeVtuberIds.get(d._userId ?? '')?.has((d._entry as TreeEntry)?.fictional_path || (d._entry as TreeEntry)?.taxon_path || '');
  const isLive = state.liveUserIds && state.liveUserIds.has(d._userId ?? '');
  const hovered = state.hoveredNode === node;
  const hexR = 21;

  // Color priority: live > focused > close > currentUser > default
  let color: string, glow: string;
  if (isLive) { color = LIVE_COLOR; glow = LIVE_GLOW; }
  else if (isFocused) { color = FOCUSED_COLOR; glow = FOCUSED_GLOW; }
  else if (isClose) { color = CLOSE_COLOR; glow = CLOSE_GLOW; }
  else if (isCurrentUser) { color = CURRENT_USER_COLOR; glow = CURRENT_USER_GLOW; }
  else { color = VTUBER_COLOR; glow = VTUBER_GLOW; }

  // ── 3A. Focus: large radial spotlight ──
  if (isFocused) {
    const t = performance.now();
    const spotAlpha = 0.06 + 0.06 * Math.sin(t / 900);
    const spotGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 50);
    spotGrad.addColorStop(0, `rgba(212,160,23,${spotAlpha})`);
    spotGrad.addColorStop(1, 'rgba(212,160,23,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 4A. Close: static radial aura ──
  if (isClose && !isFocused) {
    const auraGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 38);
    auraGrad.addColorStop(0, 'rgba(34,197,94,0.12)');
    auraGrad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 3B. Focus: triple converge-wave hex rings (outer→middle→inner) ──
  if (isFocused) {
    const period = 1800;
    const wave = (performance.now() % period) / period;  // 0→1

    // Gaussian pulse — sharp "sweep" at center, K controls width
    const convergePulse = (w: number, center: number): number => {
      let d = w - center;
      if (d < -0.5) d += 1;
      if (d > 0.5) d -= 1;
      return Math.exp(-d * d * 50);
    };

    // Outer peaks at 0.1, middle at 0.4, inner at 0.7
    const outerA = 0.08 + 0.55 * convergePulse(wave, 0.1);
    const midA   = 0.08 + 0.6  * convergePulse(wave, 0.4);
    const innerA = 0.1  + 0.7  * convergePulse(wave, 0.7);

    drawHexRing(ctx, node.x, node.y, hexR + 12, `rgba(212,160,23,${outerA})`, 1.5);
    drawHexRing(ctx, node.x, node.y, hexR + 8,  `rgba(212,160,23,${midA})`,   2.0);
    drawHexRing(ctx, node.x, node.y, hexR + 4,  `rgba(212,160,23,${innerA})`, 2.5);
  }

  // ── 4B. Close: static outer hex ring ──
  if (isClose && !isFocused) {
    drawHexRing(ctx, node.x, node.y, hexR + 5, 'rgba(34,197,94,0.5)', 1.5);
  }

  // ── 5. Live: pulsing hex ring + outer glow (highest priority) ──
  if (isLive) {
    const liveAlpha = 0.4 + 0.4 * Math.sin(performance.now() / 1000);
    // Outer glow
    ctx.save();
    ctx.shadowColor = `rgba(255,107,53,${liveAlpha * 0.6})`;
    ctx.shadowBlur = 12;
    drawHexRing(ctx, node.x, node.y, hexR + 6, `rgba(255,107,53,${liveAlpha})`, 3.0);
    ctx.restore();
  }

  // ── Flash: dramatic double-pulse burst (traceBack change or filter match) ──
  if (state.flashMap) {
    const entry = d._entry as TreeEntry | undefined;
    const flashKey = d._userId + '\0' + (entry?.fictional_path || entry?.taxon_path);
    const flashStart = state.flashMap.get(flashKey);
    if (flashStart) {
      const elapsed = performance.now() - flashStart;
      const FLASH_TOTAL = 2800;
      if (elapsed < FLASH_TOTAL) {
        // Two pulses: 0-1200ms (full), 1400-2600ms (0.65x), gap in between
        let t = -1, intensity = 0;
        if (elapsed < 1200) {
          t = elapsed / 1200;
          intensity = 1.0;
        } else if (elapsed >= 1400 && elapsed < 2600) {
          t = (elapsed - 1400) / 1200;
          intensity = 0.65;
        }

        if (t >= 0) {
          // Layer 1: Triple expanding hex shockwave rings (staggered)
          for (let i = 0; i < 3; i++) {
            const delay = i * 0.12;
            const rt = Math.max(0, t - delay) / (1 - delay);
            if (rt > 0 && rt < 1) {
              const ringR = hexR + 5 + rt * 55;
              const ringAlpha = Math.max(0, 1 - rt) * 0.85 * intensity;
              const ringWidth = Math.max(0.5, 4.5 - rt * 4);
              const r = 34 + i * 20, g = 197 - i * 30, b = 94 - i * 20;
              drawHexRing(ctx, node.x, node.y, ringR,
                `rgba(${r},${g},${b},${ringAlpha})`, ringWidth);
            }
          }

          // Layer 2: Center burst — white-hot flash that peaks at t=0.15 then fades
          const burstT = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85);
          const burstAlpha = burstT * 0.6 * intensity;
          const burstR = hexR + 20 + t * 10;
          const burstGrad = ctx.createRadialGradient(
            node.x, node.y, 0, node.x, node.y, burstR);
          burstGrad.addColorStop(0, `rgba(200,255,220,${burstAlpha})`);
          burstGrad.addColorStop(0.3, `rgba(60,200,100,${burstAlpha * 0.6})`);
          burstGrad.addColorStop(1, 'rgba(34,197,94,0)');
          ctx.fillStyle = burstGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, burstR, 0, Math.PI * 2);
          ctx.fill();

          // Layer 3: Outer soft glow — large radius, slow fade
          const glowAlpha = Math.max(0, 1 - t) * 0.18 * intensity;
          const glowGrad = ctx.createRadialGradient(
            node.x, node.y, hexR, node.x, node.y, hexR + 60);
          glowGrad.addColorStop(0, `rgba(40,200,100,${glowAlpha})`);
          glowGrad.addColorStop(1, 'rgba(34,197,94,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, hexR + 60, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Hexagon path
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = node.x + hexR * Math.cos(angle);
    const py = node.y + hexR * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = '#0d1526';
  // 3C + 4C: enhanced shadowBlur
  ctx.shadowBlur = hovered ? 28 : (isFocused ? 35 : (isClose ? 22 : 14));
  ctx.shadowColor = glow;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = color;
  // 3D: thicker border when focused
  ctx.lineWidth = isFocused ? 3 : 2;
  ctx.stroke();

  // Avatar (visible whenever labels are visible — scales naturally with zoom)
  if (scale > LOD_DOTS_ONLY && d._avatarUrl && state.imageCache) {
    const img = state.imageCache.get(d._avatarUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, node.x - 15, node.y - 15, 30, 30);
      ctx.restore();
    }
  }

  // LIVE red dot (upper-left of hexagon) with glow
  if (isLive && scale > LOD_DOTS_ONLY) {
    const dotR = 5;
    const dotX = node.x - hexR + 2;
    const dotY = node.y - hexR + 2;
    const dotAlpha = 0.7 + 0.3 * Math.sin(performance.now() / 600);
    ctx.save();
    ctx.shadowColor = 'rgba(239,68,68,0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239,68,68,${dotAlpha})`;
    ctx.fill();
    ctx.restore();
  }

  // Name label (multi-line via _labelLines from layout)
  if (scale > LOD_DOTS_ONLY) {
    const lines = (d._labelLines || [d._displayName || '?']) as string[];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isLive ? LIVE_COLOR : (isFocused ? FOCUSED_COLOR : (isClose ? CLOSE_COLOR : (isCurrentUser ? CURRENT_USER_COLOR : LABEL_COLOR)));
    ctx.font = fontStr(12, scale, 'bold');
    const vFs = scaledFontSize(12, scale);
    const lineHeight = vFs * 1.25;
    const startY = node.y + hexR + vFs * 0.3;
    drawWrappedText(ctx, lines, node.x, startY, lineHeight);

    // LIVE badge below name
    let liveBadgeBottomY = startY + lines.length * lineHeight;
    if (isLive) {
      const liveFs = scaledFontSize(9, scale);
      const livePadX = 5 / Math.max(scale, FONT_MIN_SCALE);
      const livePadY = 2 / Math.max(scale, FONT_MIN_SCALE);
      const liveR = 3 / Math.max(scale, FONT_MIN_SCALE);
      const liveY = liveBadgeBottomY + liveFs * 0.2;
      ctx.font = fontStr(9, scale, 'bold');
      const liveText = 'LIVE';
      const liveW = ctx.measureText(liveText).width + livePadX * 2;
      const dotR = 3 / Math.max(scale, FONT_MIN_SCALE);
      const dotGap = 3 / Math.max(scale, FONT_MIN_SCALE);
      const totalW = dotR * 2 + dotGap + liveW;
      const liveH = liveFs + livePadY * 2;
      const bx = node.x - totalW / 2;

      // Background
      ctx.beginPath();
      roundedRect(ctx, bx, liveY, totalW, liveH, liveR);
      ctx.fillStyle = 'rgba(239,68,68,0.9)';
      ctx.fill();

      // Pulsing dot
      const dotAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 600);
      ctx.beginPath();
      ctx.arc(bx + dotR + dotGap * 0.5, liveY + liveH / 2, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${dotAlpha})`;
      ctx.fill();

      // Text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(liveText, bx + dotR * 2 + dotGap + (liveW / 2), liveY + livePadY);

      liveBadgeBottomY = liveY + liveH;
    }

    // Badges below name (filter badges + sort badge)
    const entry = d._entry as TreeEntry | undefined;
    if (entry) {
      const badges = state.activeFilters ? getActiveFilterBadges(entry, state.activeFilters) : [];
      const sortBadge = getSortBadge(entry, state.sortKey || '', state.liveUserIds);
      if (Array.isArray(sortBadge)) badges.push(...sortBadge);
      else if (sortBadge) badges.push(sortBadge);
      if (badges.length > 0) {
        const badgeFs = scaledFontSize(9, scale);
        const badgeY = liveBadgeBottomY + badgeFs * 0.3;
        const padX = 3 / Math.max(scale, FONT_MIN_SCALE);
        const padY = 1 / Math.max(scale, FONT_MIN_SCALE);
        const gap = 3 / Math.max(scale, FONT_MIN_SCALE);
        const badgeR = 3 / Math.max(scale, FONT_MIN_SCALE);

        // Flag badge dimensions (4:3 aspect)
        const flagH = badgeFs;
        const flagW = flagH * 4 / 3;
        const flagPad = 2 / Math.max(scale, FONT_MIN_SCALE);

        // Icon badge dimensions
        const iconSize = badgeFs;
        const iconPad = 2 / Math.max(scale, FONT_MIN_SCALE);

        // Measure total width to center the row
        ctx.font = fontStr(9, scale, 'bold');
        const widths = badges.map(b => {
          if (b.isCountry && b.countryCode) return flagW + flagPad * 2;
          if (b.isPlatform) return iconSize + iconPad * 2;
          return ctx.measureText(b.label || '').width + padX * 2;
        });
        const totalW = widths.reduce((s, w) => s + w, 0) + (badges.length - 1) * gap;
        let bx = node.x - totalW / 2;

        for (let i = 0; i < badges.length; i++) {
          const b = badges[i];
          const bw = widths[i];
          const bh = badgeFs + padY * 2;

          // Rounded rect background
          ctx.beginPath();
          roundedRect(ctx, bx, badgeY, bw, bh, badgeR);
          ctx.fillStyle = b.bg;
          ctx.fill();

          if (b.isCountry && b.countryCode) {
            // Draw flag SVG image
            const flagImg = getFlagImage(b.countryCode);
            if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
              ctx.drawImage(flagImg, bx + flagPad, badgeY + padY, flagW, flagH);
            }
          } else if (b.isPlatform) {
            // Draw platform icon (YT / Twitch)
            drawPlatformIcon(ctx, b.platform || '', bx + iconPad, badgeY + padY, iconSize);
          } else {
            // Text badge
            ctx.fillStyle = b.color || '#fff';
            ctx.font = fontStr(9, scale, 'bold');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(b.label || '', bx + bw / 2, badgeY + padY);
          }

          bx += bw + gap;
        }
      }
    }
  }
}

// ── Dot-tier Vtuber node (small dot + name, no avatar/hexagon) ──
export function drawDotVtuberNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;
  const dotR = 5;

  const isCurrentUser = d._isCurrentUser;
  const isFocused = state.focusedUserId && d._userId === state.focusedUserId;
  const entry = d._entry as TreeEntry | undefined;
  const isClose = state.closeVtuberIds && state.closeVtuberIds.get(d._userId ?? '')?.has(entry?.fictional_path || entry?.taxon_path || '');
  const isLive = state.liveUserIds && state.liveUserIds.has(d._userId ?? '');

  // Color priority: live > focused > close > currentUser > default
  let dotColor: string;
  if (isLive) dotColor = LIVE_COLOR;
  else if (isFocused) dotColor = FOCUSED_COLOR;
  else if (isClose) dotColor = CLOSE_COLOR;
  else if (isCurrentUser) dotColor = CURRENT_USER_COLOR;
  else dotColor = 'rgba(255,255,255,0.25)';

  // Live: pulsing glow around dot
  if (isLive) {
    const liveAlpha = 0.4 + 0.4 * Math.sin(performance.now() / 1000);
    ctx.save();
    ctx.shadowColor = `rgba(255,107,53,${liveAlpha * 0.6})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, dotR + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,107,53,${liveAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Dot
  ctx.beginPath();
  ctx.arc(node.x, node.y, dotR, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();

  // Name label below dot
  if (scale > LOD_DOTS_ONLY) {
    const lines = (d._labelLines || [d._displayName || '?']) as string[];
    let labelColor: string;
    if (isLive) labelColor = LIVE_COLOR;
    else if (isFocused) labelColor = FOCUSED_COLOR;
    else if (isClose) labelColor = CLOSE_COLOR;
    else if (isCurrentUser) labelColor = CURRENT_USER_COLOR;
    else labelColor = LABEL_DIM;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = labelColor;
    ctx.font = fontStr(11, scale);
    const fs = scaledFontSize(11, scale);
    const lineHeight = fs * 1.25;
    const startY = node.y + dotR + fs * 0.3;
    drawWrappedText(ctx, lines, node.x, startY, lineHeight);

    // LIVE badge below name
    if (isLive) {
      const liveFs = scaledFontSize(8, scale);
      const livePadX = 4 / Math.max(scale, FONT_MIN_SCALE);
      const livePadY = 1.5 / Math.max(scale, FONT_MIN_SCALE);
      const liveR = 2 / Math.max(scale, FONT_MIN_SCALE);
      const liveY = startY + lines.length * lineHeight + liveFs * 0.2;
      ctx.font = fontStr(8, scale, 'bold');
      const liveText = 'LIVE';
      const liveW = ctx.measureText(liveText).width + livePadX * 2;
      const liveH = liveFs + livePadY * 2;
      const bx = node.x - liveW / 2;

      ctx.beginPath();
      roundedRect(ctx, bx, liveY, liveW, liveH, liveR);
      ctx.fillStyle = 'rgba(239,68,68,0.9)';
      ctx.fill();

      // Pulsing dot
      const pDotR = 2 / Math.max(scale, FONT_MIN_SCALE);
      const pDotAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 600);
      ctx.beginPath();
      ctx.arc(bx + pDotR + 2, liveY + liveH / 2, pDotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${pDotAlpha})`;
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(liveText, node.x + pDotR, liveY + livePadY);
    }
  }
}
