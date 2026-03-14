/**
 * Pure Canvas 2D rendering functions for the taxonomy graph.
 * No React — just ctx drawing calls.
 */
import {
  BG_COLOR, BG_CENTER, RANK_COLORS, RANK_LABELS,
  VTUBER_COLOR, VTUBER_GLOW, CURRENT_USER_COLOR, CURRENT_USER_GLOW,
  FOCUSED_COLOR, FOCUSED_GLOW, CLOSE_COLOR, CLOSE_GLOW,
  LIVE_COLOR, LIVE_GLOW,
  EDGE_ALPHA, EDGE_GLOW_BLUR,
  LABEL_COLOR, LABEL_DIM, COUNT_BADGE_BG, COUNT_BADGE_TEXT,
} from './colors.js';
import { getActiveFilterBadges, getSortBadge } from '../../lib/filterBadges.js';
import { getFlagImage } from '../../lib/flagImages.js';
import { stripAuthor } from '../../lib/treeUtils.js';

// ── Platform icon SVG paths (viewBox 0 0 24 24) for canvas rendering ──
const PLATFORM_ICONS = {
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
function drawPlatformIcon(ctx, platform, x, y, iconSize) {
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

// ── LOD thresholds ──
const LOD_DOTS_ONLY = 0.2;

// ── Taxonomy node radius (area-proportional) ──
const MIN_R = 5;
const MAX_R = 30;

export function taxonomyNodeRadius(count, maxCount) {
  if (!count || !maxCount || maxCount <= 0) return MIN_R;
  return MIN_R + (MAX_R - MIN_R) * Math.sqrt(count / maxCount);
}

// ── Helpers ──
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isInViewport(x, y, vp, margin) {
  return x >= vp.x - margin && x <= vp.x + vp.w + margin &&
         y >= vp.y - margin && y <= vp.y + vp.h + margin;
}

// ── Scale-compensated font system ──
const FONT_MIN_SCALE = 0.55;
const FONT_FAMILY = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';

function scaledFontSize(basePx, scale) {
  return basePx / Math.max(scale, FONT_MIN_SCALE);
}

function fontStr(basePx, scale, weight = '', style = '') {
  const sz = scaledFontSize(basePx, scale);
  return `${style} ${weight} ${sz}px ${FONT_FAMILY}`.trim();
}

// ── Label width cap for species/breed rect ──
const SPECIES_MAX_RECT_W = 184;  // MAX_LABEL_W.SPECIES(160) + 24 padding
const BREED_MAX_RECT_W = 140;    // MAX_LABEL_W.BREED(120) + 20 padding

/** Draw multi-line text centered at x, starting from startY (textBaseline='top'). */
function drawWrappedText(ctx, lines, x, startY, lineHeight) {
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}

/** Truncate text to fit maxWidth, appending '…'. Uses current ctx.font. */
function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  const ellW = ctx.measureText('\u2026').width;
  while (t.length > 1 && ctx.measureText(t).width + ellW > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '\u2026';
}

// ── Edge flash alpha (synced with node flash double-pulse) ──
function edgeFlashAlpha(state) {
  if (!state.edgeFlashStart) return 0;
  const elapsed = performance.now() - state.edgeFlashStart;
  const FLASH_TOTAL = 2800;
  if (elapsed >= FLASH_TOTAL) return 0;
  let t, intensity;
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

// ── Main draw ──
export function drawGraph(ctx, nodes, edges, transform, canvasSize, state) {
  const { scale } = transform;
  const dpr = window.devicePixelRatio || 1;
  const w = canvasSize.width / dpr;
  const h = canvasSize.height / dpr;

  // Clear + background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Center radial gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  grad.addColorStop(0, BG_CENTER);
  grad.addColorStop(1, BG_COLOR);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Draw star field
  if (state.starField) {
    ctx.drawImage(state.starField, 0, 0, w, h);
  }

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(scale, scale);

  // Compute viewport in world coordinates
  const vp = {
    x: -transform.x / scale,
    y: -transform.y / scale,
    w: w / scale,
    h: h / scale,
  };
  const margin = 150;

  const pm = state.positionMap;

  // ── Edges (skip grid children — they use drawGridConnectors / drawBreedGridConnectors) ──
  for (const edge of edges) {
    if (edge.target.data._inGrid) continue;
    if (edge.target.data._inBreedGrid) continue;

    // Use animated positions if available
    const sp = pm?.get(edge.source.data._pathKey);
    const tp = pm?.get(edge.target.data._pathKey);
    const origSx = edge.source.x, origSy = edge.source.y;
    const origTx = edge.target.x, origTy = edge.target.y;
    if (sp) { edge.source.x = sp.x; edge.source.y = sp.y; }
    if (tp) { edge.target.x = tp.x; edge.target.y = tp.y; }

    const sx = edge.source.x, sy = edge.source.y;
    const tx = edge.target.x, ty = edge.target.y;
    if (!isInViewport(sx, sy, vp, margin) && !isInViewport(tx, ty, vp, margin)) {
      if (sp) { edge.source.x = origSx; edge.source.y = origSy; }
      if (tp) { edge.target.x = origTx; edge.target.y = origTy; }
      continue;
    }
    drawEdge(ctx, edge, scale, state);
    if (sp) { edge.source.x = origSx; edge.source.y = origSy; }
    if (tp) { edge.target.x = origTx; edge.target.y = origTy; }
  }

  // ── Grid connectors (stem + bar + columns) ──
  drawGridConnectors(ctx, nodes, scale, pm, vp, margin, state);

  // ── Breed grid connectors (per-row bars for multi-row breed arrangement) ──
  drawBreedGridConnectors(ctx, nodes, scale, pm, vp, margin, state);

  // ── Nodes ──
  for (const node of nodes) {
    const ap = pm?.get(node.data._pathKey);
    const origX = node.x, origY = node.y;
    if (ap) { node.x = ap.x; node.y = ap.y; }
    if (!isInViewport(node.x, node.y, vp, margin)) {
      if (ap) { node.x = origX; node.y = origY; }
      continue;
    }
    drawNode(ctx, node, scale, state);
    if (ap) { node.x = origX; node.y = origY; }
  }

  ctx.restore();
}

// ── Edge rendering ──
function drawEdge(ctx, edge, scale, state) {
  const s = edge.source;
  const t = edge.target;
  const rc = RANK_COLORS[s.data._rank] || RANK_COLORS.ROOT;

  const isHighlighted = state.closeEdgePaths?.has(t.data._pathKey);
  const flashA = isHighlighted ? edgeFlashAlpha(state) : 0;

  ctx.beginPath();
  const midY = (s.y + t.y) / 2;
  ctx.moveTo(s.x, s.y);
  ctx.bezierCurveTo(s.x, midY, t.x, midY, t.x, t.y);

  if (flashA > 0) {
    ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
    ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
    ctx.shadowBlur = 10 * flashA;
    ctx.shadowColor = 'rgba(34,197,94,0.7)';
  } else {
    const color = hexToRgba(rc.node, EDGE_ALPHA);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
    if (scale > LOD_DOTS_ONLY) {
      ctx.shadowBlur = EDGE_GLOW_BLUR;
      ctx.shadowColor = rc.glow;
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Grid connectors: stem + horizontal bar + vertical columns ──
function drawGridConnectors(ctx, nodes, scale, pm, vp, margin, state) {
  // Group grid nodes by parent _pathKey
  const groups = new Map();
  for (const node of nodes) {
    if (!node.data._inGrid || !node.parent) continue;
    const parentKey = node.parent.data._pathKey;
    if (!groups.has(parentKey)) groups.set(parentKey, { parent: node.parent, children: [] });
    groups.get(parentKey).children.push(node);
  }

  for (const [, group] of groups) {
    const parent = group.parent;
    const children = group.children;
    if (children.length === 0) continue;

    // Resolve animated positions
    const pp = pm?.get(parent.data._pathKey);
    const px = pp ? pp.x : parent.x;
    const py = pp ? pp.y : parent.y;
    const barY = children[0].data._gridBarY;

    // Collect unique column x positions & max y per column
    const colMap = new Map(); // colX → maxY
    for (const child of children) {
      const cp = pm?.get(child.data._pathKey);
      const cx = cp ? cp.x : child.x;
      const cy = cp ? cp.y : child.y;
      const prev = colMap.get(cx);
      if (prev === undefined || cy > prev) colMap.set(cx, cy);
    }

    const colXs = [...colMap.keys()].sort((a, b) => a - b);
    const minColX = colXs[0];
    const maxColX = colXs[colXs.length - 1];

    // Viewport cull: check if the grid connector bounding box overlaps the viewport
    const maxGridY = Math.max(...colMap.values());
    const gridLeft = minColX, gridRight = maxColX;
    const gridTop = Math.min(py, barY), gridBottom = maxGridY;
    const vpLeft = vp.x - margin, vpRight = vp.x + vp.w + margin;
    const vpTop = vp.y - margin, vpBottom = vp.y + vp.h + margin;
    if (gridRight < vpLeft || gridLeft > vpRight || gridBottom < vpTop || gridTop > vpBottom) continue;

    // Check if any child in this group is highlighted (edge flash)
    let groupHighlighted = false;
    if (state.closeEdgePaths) {
      for (const child of children) {
        if (state.closeEdgePaths.has(child.data._pathKey)) {
          groupHighlighted = true;
          break;
        }
      }
    }
    const flashA = groupHighlighted ? edgeFlashAlpha(state) : 0;

    // Color from parent rank
    const rc = RANK_COLORS[parent.data._rank] || RANK_COLORS.ROOT;

    if (flashA > 0) {
      ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
      ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
      ctx.shadowBlur = 10 * flashA;
      ctx.shadowColor = 'rgba(34,197,94,0.7)';
    } else {
      const lineColor = hexToRgba(rc.node, 0.15);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
      ctx.shadowBlur = 0;
    }

    // 1. Stem: parent center → bar midpoint (bezier)
    const barMidPt = (minColX + maxColX) / 2;
    ctx.beginPath();
    const midStemY = (py + barY) / 2;
    ctx.moveTo(px, py);
    ctx.bezierCurveTo(px, midStemY, barMidPt, midStemY, barMidPt, barY);
    ctx.stroke();

    // 2. Horizontal bar: minColX → maxColX at barY
    ctx.beginPath();
    ctx.moveTo(minColX, barY);
    ctx.lineTo(maxColX, barY);
    ctx.stroke();

    // 3. Vertical columns: from barY down to lowest child in that column
    for (const [colX, maxY] of colMap) {
      ctx.beginPath();
      ctx.moveTo(colX, barY);
      ctx.lineTo(colX, maxY);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }
}

// ── Breed grid connectors: per-row horizontal bars for multi-row breed layout ──
function drawBreedGridConnectors(ctx, nodes, scale, pm, vp, margin, state) {
  // Group breed-grid nodes by parent
  const groups = new Map();
  for (const node of nodes) {
    if (!node.data._inBreedGrid || !node.parent) continue;
    const pk = node.parent.data._pathKey;
    if (!groups.has(pk)) groups.set(pk, { parent: node.parent, children: [] });
    groups.get(pk).children.push(node);
  }

  for (const [, { parent, children }] of groups) {
    if (children.length === 0) continue;

    // Resolve animated positions
    const pp = pm?.get(parent.data._pathKey);
    const px = pp ? pp.x : parent.x;
    const py = pp ? pp.y : parent.y;

    // Group children by row
    const rowMap = new Map();
    for (const child of children) {
      const row = child.data._breedGridRow || 0;
      const cp = pm?.get(child.data._pathKey);
      const cx = cp ? cp.x : child.x;
      const cy = cp ? cp.y : child.y;
      if (!rowMap.has(row)) rowMap.set(row, []);
      rowMap.get(row).push({ x: cx, y: cy, node: child });
    }

    // Viewport culling
    let allMinX = Infinity, allMaxX = -Infinity, allMinY = py, allMaxY = -Infinity;
    for (const [, rowChildren] of rowMap) {
      for (const c of rowChildren) {
        allMinX = Math.min(allMinX, c.x);
        allMaxX = Math.max(allMaxX, c.x);
        allMaxY = Math.max(allMaxY, c.y);
      }
    }
    if (allMaxX < vp.x - margin || allMinX > vp.x + vp.w + margin ||
        allMaxY < vp.y - margin || allMinY > vp.y + vp.h + margin) continue;

    // Check flash state
    let groupHighlighted = false;
    if (state.closeEdgePaths) {
      for (const child of children) {
        if (state.closeEdgePaths.has(child.data._pathKey)) {
          groupHighlighted = true;
          break;
        }
      }
    }
    const flashA = groupHighlighted ? edgeFlashAlpha(state) : 0;

    const rc = RANK_COLORS[parent.data._rank] || RANK_COLORS.ROOT;
    if (flashA > 0) {
      ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
      ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
      ctx.shadowBlur = 10 * flashA;
      ctx.shadowColor = 'rgba(34,197,94,0.7)';
    } else {
      ctx.strokeStyle = hexToRgba(rc.node, 0.15);
      ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
      ctx.shadowBlur = 0;
    }

    const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

    // Estimate breed box half-height from label lines at current scale
    const breedBoxHalfH = (node) => {
      const lines = node.data._labelLines || [''];
      const fs = scaledFontSize(11, scale);
      const lh = fs * 1.25;
      const textH = fs + (lines.length - 1) * lh;
      return Math.max(24, textH + 10) / 2;
    };

    // Precompute each row's bar info — barY clears the tallest breed box in the row
    const rowBars = sortedRows.map(rowIdx => {
      const rowChildren = rowMap.get(rowIdx);
      const xs = rowChildren.map(c => c.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const maxHalfH = Math.max(...rowChildren.map(c => breedBoxHalfH(c.node)));
      const barY = Math.min(...rowChildren.map(c => c.y)) - maxHalfH - 8;
      return { rowIdx, rowChildren, minX, maxX, barY };
    });

    // Trunk X = left of leftmost breed label edge (avoid overlapping labels)
    let maxLeftLabelW = 0;
    for (const { rowChildren, minX } of rowBars) {
      for (const c of rowChildren) {
        if (c.x === minX) {
          maxLeftLabelW = Math.max(maxLeftLabelW, c.node.data._labelHalfW || 40);
        }
      }
    }
    const globalMinX = Math.min(...rowBars.map(r => r.minX));
    const trunkX = globalMinX - maxLeftLabelW - 15;

    // 1. Bezier stem: parent → trunk top (first row's bar Y)
    if (rowBars.length > 0) {
      const firstBar = rowBars[0];
      ctx.beginPath();
      const midY = (py + firstBar.barY) / 2;
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px, midY, trunkX, midY, trunkX, firstBar.barY);
      ctx.stroke();
    }

    // 2. Vertical trunk connecting all rows' bars
    if (rowBars.length > 1) {
      const lastBar = rowBars[rowBars.length - 1];
      ctx.beginPath();
      ctx.moveTo(trunkX, rowBars[0].barY);
      ctx.lineTo(trunkX, lastBar.barY);
      ctx.stroke();
    }

    // 3. Per-row: horizontal bar from trunk to rightmost breed + vertical drops
    for (const { rowChildren, maxX, barY } of rowBars) {
      ctx.beginPath();
      ctx.moveTo(trunkX, barY);
      ctx.lineTo(maxX, barY);
      ctx.stroke();

      // Vertical drops to each breed
      for (const child of rowChildren) {
        ctx.beginPath();
        ctx.moveTo(child.x, barY);
        ctx.lineTo(child.x, child.y);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  }
}

// ── Node dispatch ──
function drawNode(ctx, node, scale, state) {
  const d = node.data;

  if (d._vtuber && d._visualTier === 'dot') {
    drawDotVtuberNode(ctx, node, scale, state);
  } else if (d._vtuber) {
    drawVtuberNode(ctx, node, scale, state);
  } else if (d._rank === 'BREED') {
    drawBreedNode(ctx, node, scale, state);
  } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES' || d._rank === 'FORM' || d._rank === 'F_SPECIES') {
    drawSpeciesNode(ctx, node, scale, state);
  } else {
    drawTaxonomyNode(ctx, node, scale, state);
  }
}

// ── Budget badge: "+N 位" shown below node labels when hidden vtubers exist ──
function drawBudgetBadge(ctx, node, scale, bottomY, state) {
  const d = node.data;
  d._budgetBadgeBounds = null; // reset each frame
  if (!d._hiddenVtuberCount || d._hiddenVtuberCount <= 0) return;
  if (scale <= LOD_DOTS_ONLY) return;

  const text = `+${d._hiddenVtuberCount} 位`;
  const fs = scaledFontSize(9, scale);
  ctx.font = fontStr(9, scale);
  const textW = ctx.measureText(text).width;
  const padX = 5 / Math.max(scale, FONT_MIN_SCALE);
  const padY = 2 / Math.max(scale, FONT_MIN_SCALE);
  const w = textW + padX * 2;
  const h = fs + padY * 2;
  const r = h / 2;
  const x = node.x - w / 2;
  const y = bottomY + fs * 0.3;

  // Store bounds for hit-testing (world coordinates, unscaled)
  d._budgetBadgeBounds = { x, y, w, h };

  // Check if the badge itself is hovered (independent from parent node hover)
  const isHovered = state.hoveredBadgeNode === node;

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);

  if (isHovered) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(56,189,248,0.5)';
    ctx.fillStyle = 'rgba(56,189,248,0.15)';
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = isHovered ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = isHovered ? 1 : 0.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isHovered ? '#38bdf8' : LABEL_DIM;
  ctx.fillText(text, node.x, y + h / 2);
}

// ── Taxonomy node (circle) ──
function drawTaxonomyNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS[d._rank] || RANK_COLORS.ROOT;
  const count = d._count || 0;
  const r = taxonomyNodeRadius(count, state.maxCount);
  const hovered = state.hoveredNode === node;

  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
  ctx.fillStyle = rc.node;

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 22 : 12;
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  // Collapsed indicator — small + sign
  if (d._hasHiddenChildren) {
    const plusSz = scaledFontSize(8, scale);
    ctx.beginPath();
    ctx.arc(node.x + r + 4, node.y - r + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `${plusSz}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + r + 4, node.y - r + 2);
  }

  // Labels (multi-line via _labelLines from layout)
  if (scale > LOD_DOTS_ONLY) {
    const lines = d._labelLines || [d._nameZh || d._name];
    const rankLabel = RANK_LABELS[d._rank] || '';
    const mainFs = scaledFontSize(13, scale);
    const lineHeight = mainFs * 1.25;
    const startY = node.y + r + mainFs * 0.4;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = fontStr(13, scale, 'bold');
    drawWrappedText(ctx, lines, node.x, startY, lineHeight);

    // Rank label + count (positioned after the last line)
    let bottomY = startY + (lines.length - 1) * lineHeight + mainFs;
    if (rankLabel) {
      ctx.fillStyle = LABEL_DIM;
      ctx.font = fontStr(10, scale);
      const subY = bottomY + 2;
      ctx.fillText(`${rankLabel} · ${count}`, node.x, subY);
      bottomY = subY + scaledFontSize(10, scale);
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}

// ── Species node (rounded rect) ──
function drawSpeciesNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS[d._rank] || RANK_COLORS.SPECIES;
  const hovered = state.hoveredNode === node;
  const lines = d._labelLines || [d._nameZh || d._name];
  const fs = scaledFontSize(12, scale);
  const lineHeight = fs * 1.25;

  // Dynamic size: width from widest line (capped), height from line count
  ctx.font = fontStr(12, scale, 'bold');
  const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = Math.min(Math.max(70, widestLine + 24), SPECIES_MAX_RECT_W);
  const textBlockH = fs + (lines.length - 1) * lineHeight;  // first line fs + remaining lines
  const h = Math.max(26, textBlockH + 12);
  d._nodeWidth = w;  // cache for hit-test
  d._nodeHeight = h;
  const r = 6;
  const x = node.x - w / 2, y = node.y - h / 2;

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = '#1a2433';

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 18 : 6;
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = hexToRgba(rc.node, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Collapsed indicator
  if (d._hasHiddenChildren) {
    const plusSz = scaledFontSize(8, scale);
    ctx.beginPath();
    ctx.arc(node.x + w / 2 + 6, node.y - h / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `${plusSz}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + w / 2 + 6, node.y - h / 2 + 4);
  }

  if (scale > LOD_DOTS_ONLY) {
    // Multi-line main label inside rect
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = fontStr(12, scale, 'bold');
    const textStartY = node.y - textBlockH / 2;
    drawWrappedText(ctx, lines, node.x, textStartY, lineHeight);

    // Latin name below rect — show full name
    ctx.fillStyle = LABEL_DIM;
    ctx.font = fontStr(10, scale, '', 'italic');
    const latinFs = scaledFontSize(10, scale);
    const latinY = node.y + h / 2 + latinFs * 0.8;
    ctx.fillText(stripAuthor(d._name) || '', node.x, latinY);

    // Rank label + count below Latin name
    const count = d._count || 0;
    const rankLabel = RANK_LABELS[d._rank] || '';
    let bottomY = latinY + latinFs;
    if (rankLabel) {
      ctx.font = fontStr(10, scale);
      const rankY = latinY + latinFs + 2;
      ctx.fillText(`${rankLabel} · ${count}`, node.x, rankY);
      bottomY = rankY + scaledFontSize(10, scale);
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}

// ── Vtuber node (hexagon + avatar) ──
function drawVtuberNode(ctx, node, scale, state) {
  const d = node.data;
  const isCurrentUser = d._isCurrentUser;
  const isFocused = state.focusedUserId && d._userId === state.focusedUserId;
  const isClose = state.closeVtuberIds && state.closeVtuberIds.get(d._userId)?.has(d._entry?.fictional_path || d._entry?.taxon_path);
  const isLive = state.liveUserIds && state.liveUserIds.has(d._userId);
  const hovered = state.hoveredNode === node;
  const hexR = 21;

  // Color priority: live > focused > close > currentUser > default
  let color, glow;
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
    const convergePulse = (w, center) => {
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
    const flashKey = d._userId + '\0' + (d._entry?.fictional_path || d._entry?.taxon_path);
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
    const lines = d._labelLines || [d._displayName || '?'];
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
    if (d._entry) {
      const badges = state.activeFilters ? getActiveFilterBadges(d._entry, state.activeFilters) : [];
      const sortBadge = getSortBadge(d._entry, state.sortKey, state.liveUserIds);
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
          return ctx.measureText(b.label).width + padX * 2;
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
            drawPlatformIcon(ctx, b.platform, bx + iconPad, badgeY + padY, iconSize);
          } else {
            // Text badge
            ctx.fillStyle = b.color;
            ctx.font = fontStr(9, scale, 'bold');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(b.label, bx + bw / 2, badgeY + padY);
          }

          bx += bw + gap;
        }
      }
    }
  }
}

// ── Dot-tier Vtuber node (small dot + name, no avatar/hexagon) ──
function drawDotVtuberNode(ctx, node, scale, state) {
  const d = node.data;
  const dotR = 5;

  const isCurrentUser = d._isCurrentUser;
  const isFocused = state.focusedUserId && d._userId === state.focusedUserId;
  const isClose = state.closeVtuberIds && state.closeVtuberIds.get(d._userId)?.has(d._entry?.fictional_path || d._entry?.taxon_path);
  const isLive = state.liveUserIds && state.liveUserIds.has(d._userId);

  // Color priority: live > focused > close > currentUser > default
  let dotColor;
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
    const lines = d._labelLines || [d._displayName || '?'];
    let labelColor;
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

// ── Breed node (rounded rect, like species) ──
function drawBreedNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS.BREED;
  const hovered = state.hoveredNode === node;
  const lines = d._labelLines || [d._nameZh || d._name];
  const fs = scaledFontSize(11, scale);
  const lineHeight = fs * 1.25;

  // Dynamic size: width from widest line (capped), height from line count
  ctx.font = fontStr(11, scale, 'bold');
  const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = Math.min(Math.max(60, widestLine + 20), BREED_MAX_RECT_W);
  const textBlockH = fs + (lines.length - 1) * lineHeight;
  const h = Math.max(24, textBlockH + 10);
  d._nodeWidth = w;   // cache for hit-test
  d._nodeHeight = h;
  const r = 5;
  const x = node.x - w / 2, y = node.y - h / 2;

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = '#1a2433';

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 18 : 6;
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = hexToRgba(rc.node, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Collapsed indicator
  if (d._hasHiddenChildren) {
    const plusSz = scaledFontSize(8, scale);
    ctx.beginPath();
    ctx.arc(node.x + w / 2 + 6, node.y - h / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `${plusSz}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + w / 2 + 6, node.y - h / 2 + 4);
  }

  if (scale > LOD_DOTS_ONLY) {
    // Multi-line main label inside rect
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = fontStr(11, scale, 'bold');
    const textStartY = node.y - textBlockH / 2;
    drawWrappedText(ctx, lines, node.x, textStartY, lineHeight);

    // Count badge below rect
    const count = d._count || 0;
    let bottomY = y + h;
    if (count > 0) {
      const countFs = scaledFontSize(9, scale);
      ctx.font = fontStr(9, scale);
      ctx.fillStyle = LABEL_DIM;
      ctx.textBaseline = 'top';
      const countY = y + h + countFs * 0.3;
      ctx.fillText(`${count}`, node.x, countY);
      bottomY = countY + countFs;
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}

// ── Hex ring helper ──
function drawHexRing(ctx, x, y, radius, strokeStyle, lineWidth) {
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

// ── Utilities ──
function roundedRect(ctx, x, y, w, h, r) {
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


/**
 * Generate a static star-field offscreen canvas.
 */
export function createStarField(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const count = Math.floor((width * height) / 3000);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.2;
    const alpha = 0.15 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }

  return canvas;
}
