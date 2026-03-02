import { useMemo } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { buildTree } from '../lib/treeUtils';

// ── Layout constants ──
const NODE_DX = 110;   // base horizontal spacing (used as separation denominator)
const NODE_DY = 180;   // vertical spacing between depth levels
const GRID_THRESHOLD = 5;  // vtuber count above which grid layout kicks in
const GRID_COLS = 6;
const GRID_CELL_W = 90;   // minimum grid cell width
const GRID_CELL_H = 80;

// ── Text measurement constants (mirror renderers.js) ──
const FONT_MIN_SCALE = 0.55;
const FONT_FAMILY = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const LABEL_PADDING = 14;  // minimum gap between adjacent labels (world px)

// ── Label width caps per node type (world px at worst-case font) ──
const MAX_LABEL_W = {
  VTUBER: 120,
  TAXONOMY: 160,
  SPECIES: 160,
  BREED: 120,
};
const SPECIES_MAX_RECT_W = MAX_LABEL_W.SPECIES + 24;  // 184

// ── Offscreen canvas for measureText ──
let _measureCtx = null;
function getMeasureCtx() {
  if (!_measureCtx) {
    const c = document.createElement('canvas');
    _measureCtx = c.getContext('2d');
  }
  return _measureCtx;
}

function measureTextWidth(text, baseFontPx, weight = 'bold') {
  if (!text) return 0;
  const ctx = getMeasureCtx();
  // Worst-case world-space size: scale clamped at FONT_MIN_SCALE
  const fontSize = baseFontPx / FONT_MIN_SCALE;
  ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`;
  return ctx.measureText(text).width;
}

/**
 * Tokenize text for wrapping:
 * - Each CJK character becomes its own token (break anywhere)
 * - Latin text splits by word (space-delimited); each word + trailing space is one token
 */
function tokenize(text) {
  if (!text) return [];
  const tokens = [];
  // Match: individual CJK char | Latin word + trailing spaces | standalone spaces
  const re = /[\u3000-\u9fff\uf900-\ufaff]|[^\u3000-\u9fff\uf900-\ufaff\s]+\s*|\s+/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

/**
 * Greedy line-fill wrapping: push tokens into lines until exceeding maxWidth.
 * Single token > maxWidth is split char-by-char.
 */
function wrapTokens(tokens, maxWidth, ctx) {
  const lines = [];
  let cur = '';
  for (const tok of tokens) {
    const candidate = cur + tok;
    if (ctx.measureText(candidate).width <= maxWidth) {
      cur = candidate;
    } else if (cur === '') {
      // Single token exceeds maxWidth — split char-by-char
      let charLine = '';
      for (const ch of tok) {
        const cc = charLine + ch;
        if (ctx.measureText(cc).width > maxWidth && charLine !== '') {
          lines.push(charLine);
          charLine = ch;
        } else {
          charLine = cc;
        }
      }
      cur = charLine;
    } else {
      lines.push(cur.trimEnd());
      cur = tok;
    }
  }
  if (cur) lines.push(cur.trimEnd());
  return lines.length > 0 ? lines : [''];
}

/**
 * Wrap text into lines fitting maxWidth, using worst-case font size.
 * Returns { lines: string[], widest: number }.
 */
function computeWrappedLines(ctx, text, maxW, basePx, weight = 'bold') {
  const fontSize = basePx / FONT_MIN_SCALE;
  ctx.font = `${weight} ${fontSize}px ${FONT_FAMILY}`;
  const fullW = ctx.measureText(text || '').width;
  if (fullW <= maxW) return { lines: [text || ''], widest: fullW };
  const tokens = tokenize(text);
  const lines = wrapTokens(tokens, maxW, ctx);
  const widest = Math.min(Math.max(...lines.map(l => ctx.measureText(l).width)), maxW);
  return { lines, widest };
}

/**
 * Compute _labelLines (string[]) and _labelHalfW (capped) for a node.
 * Used by separation() and resolveCollisions() for overlap detection,
 * and by renderers for multi-line drawing.
 */
function computeLabelLayout(data) {
  const { _rank, _vtuber, _name, _nameZh, _displayName } = data;
  const ctx = getMeasureCtx();

  if (_vtuber) {
    const label = _displayName || '?';
    const { lines, widest } = computeWrappedLines(ctx, label, MAX_LABEL_W.VTUBER, 12);
    data._labelLines = lines;
    data._labelHalfW = Math.max(widest, 42) / 2;
    return;
  }

  if (_rank === 'SPECIES' || _rank === 'SUBSPECIES') {
    // Species: wrap main label inside rect, cap collision width.
    const mainLabel = _nameZh || _name;
    const { lines, widest } = computeWrappedLines(ctx, mainLabel, MAX_LABEL_W.SPECIES, 12);
    data._labelLines = lines;
    const mainW = widest + 24;  // rect padding
    const latinW = Math.min(measureTextWidth(_name, 10, 'normal'), SPECIES_MAX_RECT_W);
    data._labelHalfW = Math.max(mainW, latinW, 70) / 2;
    return;
  }

  if (_rank === 'BREED') {
    const label = _nameZh || _name;
    const { lines, widest } = computeWrappedLines(ctx, label, MAX_LABEL_W.BREED, 11);
    data._labelLines = lines;
    const rectW = widest + 20;  // rect padding
    data._labelHalfW = Math.max(rectW, 60) / 2;
    return;
  }

  // Taxonomy node (circle + label)
  const label = _nameZh || _name;
  const { lines, widest } = computeWrappedLines(ctx, label, MAX_LABEL_W.TAXONOMY, 13);
  data._labelLines = lines;
  data._labelHalfW = Math.max(widest, 20) / 2;
}

/**
 * Convert flat entries + expandedSet into a d3 tree layout.
 * Returns { nodes, edges, bounds } ready for Canvas rendering.
 */
export default function useTreeLayout(entries, expandedSet, currentUserId) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return { nodes: [], edges: [], rootData: null, bounds: null };
    }

    const root = buildTree(entries);
    const hierData = mapToHierarchy(root, expandedSet, currentUserId);
    const h = hierarchy(hierData, d => d.children);

    // ── Pre-compute label widths for every node ──
    for (const node of h.descendants()) {
      computeLabelLayout(node.data);
    }

    // ── Tree layout with width-aware separation ──
    const treeLayout = tree()
      .nodeSize([NODE_DX, NODE_DY])
      .separation((a, b) => {
        // Dynamic separation based on actual label widths
        const aHalf = a.data._labelHalfW || 40;
        const bHalf = b.data._labelHalfW || 40;
        const needed = (aHalf + bHalf + LABEL_PADDING) / NODE_DX;

        // Minimum separations by node type
        const aV = a.data._vtuber;
        const bV = b.data._vtuber;
        let minSep;
        if (aV && bV) minSep = 0.7;
        else if (aV || bV) minSep = 1.0;
        else minSep = a.parent === b.parent ? 1 : 1.2;

        return Math.max(needed, minSep);
      });

    treeLayout(h);

    // ── Post-layout: intermediate level for higher-rank vtubers ──
    applyIntermediateLevel(h);

    // ── Post-layout: grid for dense vtuber groups ──
    applyGridLayout(h);

    // ── Post-layout: collision sweep to fix remaining overlaps ──
    resolveCollisions(h);

    const nodes = h.descendants();
    const edges = h.links();

    // Recalculate bounds after post-processing
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    return {
      nodes,
      edges,
      rootData: root,
      bounds: { minX, maxX, minY, maxY },
    };
  }, [entries, expandedSet, currentUserId]);
}

/**
 * When a vtuber node has taxonomy siblings (registered at a higher rank
 * like Family/Genus), shift it to an intermediate y-level between
 * its parent and the normal child depth.
 */
function applyIntermediateLevel(root) {
  for (const node of root.descendants()) {
    if (!node.data._vtuber || !node.parent) continue;

    const siblings = node.parent.children;
    const hasTaxonomySiblings = siblings.some(s => !s.data._vtuber);
    if (hasTaxonomySiblings) {
      // Place vtuber 40% of the way down (between parent and children)
      node.y = node.parent.y + NODE_DY * 0.4;
    }
  }
}

/**
 * When a parent has more than GRID_THRESHOLD vtuber children,
 * rearrange them into a compact grid instead of a single row.
 * Cell width adapts to the widest label in the group.
 */
function applyGridLayout(root) {
  for (const node of root.descendants()) {
    if (!node.children) continue;

    const vtubers = node.children.filter(c => c.data._vtuber);
    if (vtubers.length <= GRID_THRESHOLD) continue;

    // Dynamic cell width: at least GRID_CELL_W, or widest label + padding
    const maxLabelFullW = Math.max(
      ...vtubers.map(v => (v.data._labelHalfW || 40) * 2 + LABEL_PADDING)
    );
    const cellW = Math.max(GRID_CELL_W, maxLabelFullW);

    // Dynamic cell height: account for max label line count in this group
    // Next row hex top (y+cellH-hexR) must be below current row text bottom
    const HEX_R = 21;
    const worstFs = 12 / FONT_MIN_SCALE;          // worst-case font size
    const worstLineH = worstFs * 1.25;             // worst-case line height
    const maxLines = Math.max(...vtubers.map(v => (v.data._labelLines || ['']).length));
    // text bottom from center = hexR + fs*0.3 + (maxLines-1)*lineH + fs
    const textBottom = HEX_R + worstFs * 0.3 + (maxLines - 1) * worstLineH + worstFs;
    const cellH = Math.max(GRID_CELL_H, textBottom + HEX_R + 10);

    const cols = Math.min(GRID_COLS, vtubers.length);

    // Push grid down based on first row's tallest label so it clears sibling branches
    const firstRowCount = Math.min(cols, vtubers.length);
    const firstRowMaxLines = Math.max(
      ...vtubers.slice(0, firstRowCount).map(v => (v.data._labelLines || ['']).length)
    );
    const gridYOffset = Math.max(0, (firstRowMaxLines - 1) * worstLineH);

    // Center of the original vtuber positions
    const centerX = vtubers.reduce((s, n) => s + n.x, 0) / vtubers.length;
    const baseY = vtubers[0].y + gridYOffset;

    const gridW = (cols - 1) * cellW;
    const startX = centerX - gridW / 2;
    const barY = baseY - 25;  // horizontal bar Y position

    for (let i = 0; i < vtubers.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      vtubers[i].x = startX + col * cellW;
      vtubers[i].y = baseY + row * cellH;
      vtubers[i].data._inGrid = true;
      vtubers[i].data._gridBarY = barY;
    }
  }
}

/**
 * Post-layout collision sweep: for each depth level, scan left-to-right
 * and push overlapping nodes (+ their entire subtree) rightward.
 * Skips grid nodes (handled by dynamic cell width in applyGridLayout).
 */
function resolveCollisions(root) {
  // Group non-grid nodes by depth
  const levels = new Map();
  for (const node of root.descendants()) {
    if (node.data._inGrid) continue;
    const d = node.depth;
    if (!levels.has(d)) levels.set(d, []);
    levels.get(d).push(node);
  }

  // Process top-to-bottom so parent pushes cascade naturally
  const sortedDepths = [...levels.keys()].sort((a, b) => a - b);

  for (const depth of sortedDepths) {
    const nodes = levels.get(depth);
    nodes.sort((a, b) => a.x - b.x);

    for (let i = 1; i < nodes.length; i++) {
      const left = nodes[i - 1];
      const right = nodes[i];

      // Only compare nodes at similar y (skip intermediate-level vs normal)
      if (Math.abs(left.y - right.y) > NODE_DY * 0.5) continue;

      const leftHalf = left.data._labelHalfW || 40;
      const rightHalf = right.data._labelHalfW || 40;
      const minDist = leftHalf + rightHalf + LABEL_PADDING;
      const actual = right.x - left.x;

      if (actual < minDist) {
        const shift = minDist - actual;
        shiftSubtree(right, shift);
      }
    }
  }
}

/** Recursively shift a node and all its descendants by dx. */
function shiftSubtree(node, dx) {
  node.x += dx;
  if (node.children) {
    for (const child of node.children) {
      shiftSubtree(child, dx);
    }
  }
}

/**
 * Recursively convert Map-based tree node → plain object for d3.hierarchy.
 * Only includes children that are expanded. Also creates vtuber leaf nodes.
 */
function mapToHierarchy(node, expandedSet, currentUserId, depth = 0) {
  const isExpanded = depth === 0 || expandedSet.has(node.pathKey);
  const children = [];

  if (isExpanded) {
    // Vtubers FIRST (so they appear before taxonomy children when
    // at intermediate levels — see applyIntermediateLevel)
    for (const v of node.vtubers) {
      children.push({
        _name: v.display_name,
        _displayName: v.display_name,
        _rank: 'VTUBER',
        _vtuber: true,
        _entry: v,
        _userId: v.user_id,
        _avatarUrl: v.avatar_url,
        _isCurrentUser: v.user_id === currentUserId,
        _pathKey: `${node.pathKey}|__vtuber__${v.user_id}`,
        children: null,
      });
    }

    const sorted = [...node.children.values()].sort((a, b) => b.count - a.count);
    for (const child of sorted) {
      children.push(mapToHierarchy(child, expandedSet, currentUserId, depth + 1));
    }
  }

  const hasHiddenChildren = !isExpanded && (node.children.size > 0 || node.vtubers.length > 0);

  return {
    _name: node.name,
    _nameZh: node.nameZh,
    _rank: node.rank || 'ROOT',
    _pathKey: node.pathKey,
    _count: node.count,
    _hasHiddenChildren: hasHiddenChildren,
    children: children.length > 0 ? children : null,
  };
}
