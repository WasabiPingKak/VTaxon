/**
 * Pure Canvas 2D rendering functions for the taxonomy graph.
 * No React — just ctx drawing calls.
 */
import {
  BG_COLOR, BG_CENTER, RANK_COLORS, RANK_LABELS,
  VTUBER_COLOR, VTUBER_GLOW, CURRENT_USER_COLOR, CURRENT_USER_GLOW,
  EDGE_ALPHA, EDGE_GLOW_BLUR,
  LABEL_COLOR, LABEL_DIM, COUNT_BADGE_BG, COUNT_BADGE_TEXT,
} from './colors.js';

// ── LOD thresholds ──
const LOD_DOTS_ONLY = 0.2;
const LOD_NO_AVATAR = 0.5;

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

  // ── Edges ──
  for (const edge of edges) {
    const sx = edge.source.x, sy = edge.source.y;
    const tx = edge.target.x, ty = edge.target.y;
    // Quick cull — at least one end in viewport
    if (!isInViewport(sx, sy, vp, margin) && !isInViewport(tx, ty, vp, margin)) continue;
    drawEdge(ctx, edge, scale);
  }

  // ── Nodes ──
  for (const node of nodes) {
    if (!isInViewport(node.x, node.y, vp, margin)) continue;
    drawNode(ctx, node, scale, state);
  }

  ctx.restore();
}

// ── Edge rendering ──
function drawEdge(ctx, edge, scale) {
  const s = edge.source;
  const t = edge.target;
  const rc = RANK_COLORS[s.data._rank] || RANK_COLORS.ROOT;
  const color = hexToRgba(rc.node, EDGE_ALPHA);

  ctx.beginPath();
  const midY = (s.y + t.y) / 2;
  ctx.moveTo(s.x, s.y);
  ctx.bezierCurveTo(s.x, midY, t.x, midY, t.x, t.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 / Math.max(scale, 0.3);

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = EDGE_GLOW_BLUR;
    ctx.shadowColor = rc.glow;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Node dispatch ──
function drawNode(ctx, node, scale, state) {
  const d = node.data;

  if (d._vtuber) {
    drawVtuberNode(ctx, node, scale, state);
  } else if (d._rank === 'BREED') {
    drawBreedNode(ctx, node, scale, state);
  } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES') {
    drawSpeciesNode(ctx, node, scale, state);
  } else {
    drawTaxonomyNode(ctx, node, scale, state);
  }
}

// ── Taxonomy node (circle) ──
function drawTaxonomyNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS[d._rank] || RANK_COLORS.ROOT;
  const count = d._count || 0;
  const r = Math.min(5 + Math.sqrt(count) * 2.5, 14);
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
    ctx.beginPath();
    ctx.arc(node.x + r + 4, node.y - r + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + r + 4, node.y - r + 2);
  }

  // Labels
  if (scale > LOD_DOTS_ONLY) {
    const label = d._nameZh || d._name;
    const rankLabel = RANK_LABELS[d._rank] || '';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `bold ${Math.max(10, 11)}px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    ctx.fillText(label, node.x, node.y + r + 5);

    // Rank label + count
    if (rankLabel) {
      ctx.fillStyle = LABEL_DIM;
      ctx.font = `9px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
      ctx.fillText(`${rankLabel} · ${count}`, node.x, node.y + r + 20);
    }
  }
}

// ── Species node (rounded rect) ──
function drawSpeciesNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS[d._rank] || RANK_COLORS.SPECIES;
  const hovered = state.hoveredNode === node;
  const w = 70, h = 26, r = 6;
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
    ctx.beginPath();
    ctx.arc(node.x + w / 2 + 6, node.y - h / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + w / 2 + 6, node.y - h / 2 + 4);
  }

  if (scale > LOD_DOTS_ONLY) {
    const label = d._nameZh || d._name;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `bold 10px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    ctx.fillText(truncate(label, 8), node.x, node.y);

    // Latin name below
    ctx.fillStyle = LABEL_DIM;
    ctx.font = `italic 8px sans-serif`;
    ctx.fillText(truncate(d._name, 14), node.x, node.y + h / 2 + 10);
  }
}

// ── Vtuber node (hexagon + avatar) ──
function drawVtuberNode(ctx, node, scale, state) {
  const d = node.data;
  const isCurrentUser = d._isCurrentUser;
  const hovered = state.hoveredNode === node;
  const hexR = 21;
  const color = isCurrentUser ? CURRENT_USER_COLOR : VTUBER_COLOR;
  const glow = isCurrentUser ? CURRENT_USER_GLOW : VTUBER_GLOW;

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
  ctx.shadowBlur = hovered ? 28 : 14;
  ctx.shadowColor = glow;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Avatar (only at sufficient zoom)
  if (scale >= LOD_NO_AVATAR && d._avatarUrl && state.imageCache) {
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

  // Name label
  if (scale > LOD_DOTS_ONLY) {
    const label = d._displayName || '?';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isCurrentUser ? CURRENT_USER_COLOR : LABEL_COLOR;
    ctx.font = `bold 10px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    ctx.fillText(truncate(label, 8), node.x, node.y + hexR + 4);
  }
}

// ── Breed node (diamond) ──
function drawBreedNode(ctx, node, scale, state) {
  const d = node.data;
  const rc = RANK_COLORS.BREED;
  const hovered = state.hoveredNode === node;
  const s = 14;

  ctx.beginPath();
  ctx.moveTo(node.x, node.y - s);
  ctx.lineTo(node.x + s, node.y);
  ctx.lineTo(node.x, node.y + s);
  ctx.lineTo(node.x - s, node.y);
  ctx.closePath();

  ctx.fillStyle = '#1a2433';
  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 18 : 8;
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rc.node;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Collapsed indicator
  if (d._hasHiddenChildren) {
    ctx.beginPath();
    ctx.arc(node.x + s + 4, node.y - s + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + s + 4, node.y - s + 2);
  }

  if (scale > LOD_DOTS_ONLY) {
    const label = d._nameZh || d._name;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `bold 9px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    ctx.fillText(truncate(label, 8), node.x, node.y + s + 4);
  }
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

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
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
