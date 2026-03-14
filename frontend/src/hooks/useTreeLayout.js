import { useMemo } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { buildTree, buildFictionalTree } from '../lib/treeUtils';

// ── Layout constants ──
const NODE_DX = 110;   // base horizontal spacing (used as separation denominator)
const NODE_DY = 180;   // vertical spacing between depth levels
const GRID_THRESHOLD = 5;  // vtuber count above which grid layout kicks in
const GRID_COLS = 5;
const GRID_CELL_W = 90;   // minimum grid cell width
const GRID_CELL_H = 80;

// ── Breed grid constants (multi-row arrangement for high-fanout species) ──
const BREED_GRID_THRESHOLD = 5;   // non-vtuber child count above which breed grid kicks in
const BREED_GRID_COLS = 4;        // max breeds per row
const BREED_GRID_GAP_X = 40;     // horizontal gap between breed subtree columns
const BREED_GRID_GAP_Y = 60;     // vertical gap between breed grid rows
const BREED_GRID_VISUAL_BOTTOM = 100; // approx visual space below lowest node in a breed subtree

// ── Text measurement constants (mirror renderers.js) ──
const FONT_MIN_SCALE = 0.55;
const FONT_FAMILY = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const LABEL_PADDING = 14;  // minimum gap between adjacent labels (world px)
const BLOCK_TYPE_GAP = 40; // minimum gap between different block types (grid↔other, vtuber↔taxonomy)

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
  const { _rank, _vtuber, _name, _nameZh, _displayName, _visualTier } = data;
  const ctx = getMeasureCtx();

  // Dot-tier vtuber — smaller footprint
  if (_vtuber && _visualTier === 'dot') {
    const label = _displayName || '?';
    const { lines, widest } = computeWrappedLines(ctx, label, MAX_LABEL_W.VTUBER, 11);
    data._labelLines = lines;
    data._labelHalfW = Math.max(widest, 20) / 2;
    const DOT_R = 5;
    const hFs = 11;
    const hLineH = hFs * 1.25;
    data._labelBottomH = DOT_R + hFs * 0.3 + lines.length * hLineH;
    return;
  }

  if (_vtuber) {
    const label = _displayName || '?';
    const { lines, widest } = computeWrappedLines(ctx, label, MAX_LABEL_W.VTUBER, 12);
    data._labelLines = lines;
    data._labelHalfW = Math.max(widest, 42) / 2;

    // Compute vertical extent below node center (for intermediate level clearance).
    // Uses base font (scale=1) as reference; applyIntermediateLevel adds extra
    // margin to handle moderate zoom-out.  Always reserves LIVE badge space
    // since live status can change dynamically without triggering re-layout.
    const HEX_R = 21;
    const hFs = 12;          // base font at scale=1
    const hLineH = hFs * 1.25;
    const hLiveFs = 9;
    const hLivePadY = 2;
    data._labelBottomH = HEX_R + hFs * 0.3 + lines.length * hLineH
      + hLiveFs * 0.2 + hLiveFs + hLivePadY * 2;
    return;
  }

  if (_rank === 'SPECIES' || _rank === 'SUBSPECIES' || _rank === 'FORM' || _rank === 'F_SPECIES') {
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

// Ranks that use rect rendering (not circle)
const RECT_RANKS = new Set(['SPECIES', 'SUBSPECIES', 'FORM', 'BREED', 'F_SPECIES']);

/** Compute bounds from a list of d3 hierarchy nodes. */
function computeBounds(nodes) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }
  return { minX, maxX, minY, maxY };
}

/** Compute maxCount across taxonomy circle nodes. */
function computeMaxCount(nodes) {
  let maxCount = 1;
  for (const n of nodes) {
    const d = n.data;
    if (!d._vtuber && !RECT_RANKS.has(d._rank)) {
      if ((d._count || 0) > maxCount) maxCount = d._count;
    }
  }
  return maxCount;
}

/** Merge two bounds objects. */
function mergeBounds(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/** Run the full layout pipeline on a d3 hierarchy root. */
function layoutTree(h, activeFilterCount) {
  // Estimated badge row half-width (world px at worst-case font scale)
  // Average badge: text ~35px, icon ~18px → use 25px avg + 5px gap each
  const badgeHalfW = activeFilterCount > 0
    ? (activeFilterCount * 25 + (activeFilterCount - 1) * 5) / FONT_MIN_SCALE / 2
    : 0;

  for (const node of h.descendants()) {
    computeLabelLayout(node.data);
    // Widen vtuber nodes to accommodate badge row
    if (activeFilterCount > 0 && node.data._vtuber) {
      node.data._labelHalfW = Math.max(node.data._labelHalfW, badgeHalfW);
      // Also extend vertical extent for badge row (base font scale=1)
      if (node.data._labelBottomH) {
        node.data._labelBottomH += 9 * 0.3 + 9 + 1 * 2;
      }
    }
  }

  const treeLayout = tree()
    .nodeSize([NODE_DX, NODE_DY])
    .separation((a, b) => {
      const aHalf = a.data._labelHalfW || 40;
      const bHalf = b.data._labelHalfW || 40;
      const needed = (aHalf + bHalf + LABEL_PADDING) / NODE_DX;

      const aV = a.data._vtuber;
      const bV = b.data._vtuber;
      let minSep;
      if (aV && bV) minSep = 0.7;
      else if (aV || bV) minSep = 1.0;
      else minSep = a.parent === b.parent ? 1 : 1.2;

      return Math.max(needed, minSep);
    });

  treeLayout(h);
  applyIntermediateLevel(h);
  applyGridLayout(h, activeFilterCount);
  compactTree(h);
  resolveCollisions(h);
  applyBreedGridLayout(h);
  // Re-compact after breed grid shrinks subtrees (ancestor extents are stale)
  compactTree(h);
  resolveCollisions(h);
}

const DUAL_TREE_GAP = 400;

/**
 * Convert flat entries + expandedSet into a d3 tree layout.
 * Supports dual trees: real species (entries) + fictional species (fictionalEntries).
 * Returns { nodes, edges, bounds, rootData, fictionalRootData, maxCount }.
 */
// ── Seeded PRNG (xorshift32) + Fisher-Yates shuffle ──
function xorshift32(seed) {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ── Factoradic permutation for small arrays (guaranteed unique per seed) ──
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720]; // 0! .. 6!

function nthPermutation(arr, n) {
  const remaining = [...arr];
  const result = [];
  for (let i = remaining.length - 1; i >= 0; i--) {
    const fact = FACTORIALS[i];
    const idx = Math.floor(n / fact);
    n %= fact;
    result.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return result;
}

function shuffleArray(arr, seed) {
  const n = arr.length;
  if (n <= 1) return [...arr];

  // Small arrays: cycle through all n! permutations deterministically
  if (n <= 6) {
    const permCount = FACTORIALS[n];
    const permIndex = ((seed % permCount) + permCount) % permCount;
    return nthPermutation(arr, permIndex);
  }

  // Large arrays: Fisher-Yates with seeded PRNG
  const a = [...arr];
  const rng = xorshift32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sort vtuber entries within a node according to sortConfig.
 * @param {Array} vtubers - node.vtubers array
 * @param {Object} sortConfig - { key, order, shuffleSeed }
 * @returns {Array} sorted copy
 */
function sortVtubers(vtubers, sortConfig) {
  if (!sortConfig || !vtubers || vtubers.length <= 1) return vtubers;

  const { key, order = 'asc', shuffleSeed, liveUserIds } = sortConfig;

  if (key === 'shuffle' && shuffleSeed != null) {
    return shuffleArray(vtubers, shuffleSeed);
  }

  const sorted = [...vtubers].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'active_first': {
        const aLive = liveUserIds?.has(a.user_id) ? 1 : 0;
        const bLive = liveUserIds?.has(b.user_id) ? 1 : 0;
        if (aLive !== bLive) { cmp = aLive - bLive; break; }

        const aTime = a.last_live_at ? new Date(a.last_live_at).getTime() : 0;
        const bTime = b.last_live_at ? new Date(b.last_live_at).getTime() : 0;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const aRecent = aTime > sevenDaysAgo ? aTime : 0;
        const bRecent = bTime > sevenDaysAgo ? bTime : 0;
        if (aRecent !== bRecent) { cmp = aRecent - bRecent; break; }

        cmp = (a.display_name || '').localeCompare(b.display_name || '', 'zh-TW');
        break;
      }
      case 'created_at':
        cmp = (a.created_at || '').localeCompare(b.created_at || '');
        break;
      case 'debut_date': {
        const ad = a.debut_date || '\uffff';
        const bd = b.debut_date || '\uffff';
        cmp = ad.localeCompare(bd);
        break;
      }
      case 'display_name':
        cmp = (a.display_name || '').localeCompare(b.display_name || '', 'zh-TW');
        break;
      case 'country': {
        const af = (a.country_flags || [])[0] || '\uffff';
        const bf = (b.country_flags || [])[0] || '\uffff';
        cmp = af.localeCompare(bf);
        break;
      }
      case 'organization': {
        const ao = a.organization || '\uffff';
        const bo = b.organization || '\uffff';
        cmp = ao.localeCompare(bo, 'zh-TW');
        break;
      }
      default:
        break;
    }
    // active_first always uses desc (higher = better)
    if (key === 'active_first') return -cmp;
    return order === 'desc' ? -cmp : cmp;
  });

  return sorted;
}

export default function useTreeLayout(entries, fictionalEntries, expandedSet, currentUserId, realSortConfig, fictSortConfig, activeFilterCount, expandedBudgetGroups) {
  return useMemo(() => {
    const hasReal = entries && entries.length > 0;
    const hasFictional = fictionalEntries && fictionalEntries.length > 0;

    if (!hasReal && !hasFictional) {
      return { nodes: [], edges: [], rootData: null, fictionalRootData: null, bounds: null, maxCount: 1 };
    }

    let realNodes = [], realEdges = [], realBounds = null, realRoot = null;
    let fictNodes = [], fictEdges = [], fictBounds = null, fictRoot = null;

    // ── Real tree ──
    if (hasReal) {
      realRoot = buildTree(entries);
      const realLiveSet = realSortConfig?.key === 'active_first'
        ? buildLiveDescendantSet(realRoot, realSortConfig.liveUserIds)
        : null;
      const hierData = mapToHierarchy(realRoot, expandedSet, currentUserId, 0, realSortConfig, realLiveSet, expandedBudgetGroups);
      const h = hierarchy(hierData, d => d.children);
      layoutTree(h, activeFilterCount);
      realNodes = h.descendants();
      realEdges = h.links();
      realBounds = computeBounds(realNodes);
    }

    // ── Fictional tree ──
    if (hasFictional) {
      fictRoot = buildFictionalTree(fictionalEntries);
      const fictLiveSet = fictSortConfig?.key === 'active_first'
        ? buildLiveDescendantSet(fictRoot, fictSortConfig.liveUserIds)
        : null;
      const hierData = mapToHierarchy(fictRoot, expandedSet, currentUserId, 0, fictSortConfig, fictLiveSet, expandedBudgetGroups);
      const h = hierarchy(hierData, d => d.children);
      layoutTree(h, activeFilterCount);
      fictNodes = h.descendants();
      fictEdges = h.links();
      fictBounds = computeBounds(fictNodes);

      // Offset fictional tree to the right of real tree
      if (realBounds && fictBounds) {
        const offsetX = realBounds.maxX + DUAL_TREE_GAP - fictBounds.minX;
        for (const n of fictNodes) n.x += offsetX;
        fictBounds = { minX: fictBounds.minX + offsetX, maxX: fictBounds.maxX + offsetX, minY: fictBounds.minY, maxY: fictBounds.maxY };
      }
    }

    const allNodes = [...realNodes, ...fictNodes];
    const allEdges = [...realEdges, ...fictEdges];
    const allBounds = mergeBounds(realBounds, fictBounds);
    const maxCount = Math.max(computeMaxCount(realNodes), computeMaxCount(fictNodes));

    return {
      nodes: allNodes,
      edges: allEdges,
      rootData: realRoot,
      fictionalRootData: fictRoot,
      bounds: allBounds,
      maxCount,
    };
  }, [entries, fictionalEntries, expandedSet, currentUserId, realSortConfig, fictSortConfig, activeFilterCount, expandedBudgetGroups]);
}

/**
 * When a vtuber node has taxonomy siblings (registered at a higher rank
 * like Family/Genus), shift it to an intermediate y-level between
 * its parent and the normal child depth.
 */
function applyIntermediateLevel(root) {
  // Process parent-by-parent so sibling vtubers share the same intermediate y.
  for (const parent of root.descendants()) {
    if (!parent.children) continue;

    const vtubers = [];
    let hasTaxonomySiblings = false;

    for (const c of parent.children) {
      if (c.data._vtuber) vtubers.push(c);
      else if (c.data._rank !== 'BREED') hasTaxonomySiblings = true;
    }

    if (vtubers.length === 0 || !hasTaxonomySiblings) continue;

    // Place vtubers at fixed intermediate level (40% of NODE_DY)
    const intermediateY = parent.y + NODE_DY * 0.4;
    for (const v of vtubers) {
      v.y = intermediateY;
    }

    // Check if the tallest vtuber's bottom extent would overlap with
    // taxonomy children at NODE_DY.  If so, push those children down.
    // Height is computed at base font (scale=1); add 30% margin to
    // cover moderate zoom-out where text grows larger.
    const maxBottomH = Math.max(...vtubers.map(v => v.data._labelBottomH || 60));
    const vtuberBottom = intermediateY + maxBottomH * 1.3;
    const childY = parent.y + NODE_DY;
    const CHILD_TOP_H = 15;  // conservative top extent of child node
    const MIN_GAP = 8;

    if (vtuberBottom + MIN_GAP > childY - CHILD_TOP_H) {
      const pushDown = vtuberBottom + MIN_GAP - (childY - CHILD_TOP_H);
      for (const c of parent.children) {
        if (!c.data._vtuber) {
          shiftSubtreeXY(c, 0, pushDown);
        }
      }
    }
  }
}

/**
 * When a parent has more than GRID_THRESHOLD vtuber children,
 * rearrange them into a compact grid instead of a single row.
 * Cell width adapts to the widest label in the group.
 */
function applyGridLayout(root, activeFilterCount) {
  for (const node of root.descendants()) {
    if (!node.children) continue;

    // Only grid normal-tier vtubers; dot-tier nodes are placed after the grid
    const allVtubers = node.children.filter(c => c.data._vtuber);
    const normalVtubers = allVtubers.filter(c => !c.data._visualTier);
    const dotVtubers = allVtubers.filter(c => c.data._visualTier === 'dot');
    if (normalVtubers.length <= GRID_THRESHOLD) continue;

    // Dynamic cell width: at least GRID_CELL_W, or widest label + padding
    const maxLabelFullW = Math.max(
      ...normalVtubers.map(v => (v.data._labelHalfW || 40) * 2 + LABEL_PADDING)
    );
    // Estimate badge row width when filters active (same formula as badgeHalfW * 2)
    const badgeRowW = activeFilterCount > 0
      ? (activeFilterCount * 25 + (activeFilterCount - 1) * 5) / FONT_MIN_SCALE
      : 0;
    const cellW = Math.max(GRID_CELL_W, maxLabelFullW, badgeRowW + LABEL_PADDING);

    // Dynamic cell height: account for max label line count in this group
    // Next row hex top (y+cellH-hexR) must be below current row text bottom
    const HEX_R = 21;
    const worstFs = 12 / FONT_MIN_SCALE;          // worst-case font size
    const worstLineH = worstFs * 1.25;             // worst-case line height
    const maxLines = Math.max(...normalVtubers.map(v => (v.data._labelLines || ['']).length));
    // text bottom from center = hexR + fs*0.3 + (maxLines-1)*lineH + fs
    const textBottom = HEX_R + worstFs * 0.3 + (maxLines - 1) * worstLineH + worstFs;
    // Extra space for filter badge row (one line of badges at 9px font)
    const badgeExtra = activeFilterCount > 0 ? (9 / FONT_MIN_SCALE) * 1.25 + 4 : 0;
    const cellH = Math.max(GRID_CELL_H, textBottom + badgeExtra + HEX_R + 10);

    const cols = Math.min(GRID_COLS, normalVtubers.length);

    // Push grid down based on first row's tallest label so it clears sibling branches
    const firstRowCount = Math.min(cols, normalVtubers.length);
    const firstRowMaxLines = Math.max(
      ...normalVtubers.slice(0, firstRowCount).map(v => (v.data._labelLines || ['']).length)
    );
    const gridYOffset = Math.max(0, (firstRowMaxLines - 1) * worstLineH);

    // Center of the original vtuber positions
    const centerX = allVtubers.reduce((s, n) => s + n.x, 0) / allVtubers.length;
    const baseY = normalVtubers[0].y + gridYOffset;

    const gridW = (cols - 1) * cellW;
    const startX = centerX - gridW / 2;
    const barY = baseY - 25;  // horizontal bar Y position

    for (let i = 0; i < normalVtubers.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      normalVtubers[i].x = startX + col * cellW;
      normalVtubers[i].y = baseY + row * cellH;
      normalVtubers[i].data._inGrid = true;
      normalVtubers[i].data._gridBarY = barY;
    }

    // Place dot-tier vtubers in a row below the grid (not marked as _inGrid
    // so they use regular edge drawing instead of grid connectors)
    if (dotVtubers.length > 0) {
      const lastRow = Math.floor((normalVtubers.length - 1) / cols);
      const dotBaseY = baseY + (lastRow + 1) * cellH;
      const dotCellW = Math.max(60, ...dotVtubers.map(v => (v.data._labelHalfW || 20) * 2 + LABEL_PADDING));
      const dotGridW = (dotVtubers.length - 1) * dotCellW;
      const dotStartX = centerX - dotGridW / 2;
      for (let i = 0; i < dotVtubers.length; i++) {
        dotVtubers[i].x = dotStartX + i * dotCellW;
        dotVtubers[i].y = dotBaseY;
      }
    }
  }
}

/**
 * Bottom-up subtree compaction: close gaps created by grid compression.
 * For each node, compute the horizontal subtree extent (_extLeft, _extRight
 * relative to node.x). Non-grid siblings are slid together so subtrees are
 * separated by exactly LABEL_PADDING. Parents are re-centered over children.
 */
function compactTree(root) {
  _compactNode(root);
}

function _compactNode(node) {
  if (!node.children || node.children.length === 0) {
    const halfW = node.data._labelHalfW || 40;
    node.data._extLeft = -halfW;
    node.data._extRight = halfW;
    return;
  }

  // Recurse children first (bottom-up)
  for (const child of node.children) {
    _compactNode(child);
  }

  // Build typed block list: group children by type so we can apply different
  // gap sizes between different block types (grid↔other, vtuber↔taxonomy).
  // Block types: 'taxonomy' (each its own block), 'vtuber' (all non-grid
  // vtubers merged), 'grid' (all _inGrid merged), 'breedGrid' (all merged).
  const blocks = [];

  // Separate non-grid, non-breed-grid children into vtubers vs taxonomy
  const nonGridVtubers = [];
  for (const c of node.children) {
    if (c.data._inGrid || c.data._inBreedGrid) continue;
    if (c.data._vtuber) {
      nonGridVtubers.push(c);
    } else {
      blocks.push({
        type: 'taxonomy',
        left: c.x + c.data._extLeft,
        right: c.x + c.data._extRight,
        nodes: [c],
      });
    }
  }

  // Merge all non-grid vtubers into one block
  if (nonGridVtubers.length > 0) {
    let vL = Infinity, vR = -Infinity;
    for (const v of nonGridVtubers) {
      vL = Math.min(vL, v.x + v.data._extLeft);
      vR = Math.max(vR, v.x + v.data._extRight);
    }
    blocks.push({ type: 'vtuber', left: vL, right: vR, nodes: nonGridVtubers });
  }

  const gridNodes = node.children.filter(c => c.data._inGrid);
  if (gridNodes.length > 0) {
    let gL = Infinity, gR = -Infinity;
    for (const g of gridNodes) {
      gL = Math.min(gL, g.x + g.data._extLeft);
      gR = Math.max(gR, g.x + g.data._extRight);
    }
    blocks.push({ type: 'grid', left: gL, right: gR, nodes: gridNodes });
  }
  const breedGridNodes = node.children.filter(c => c.data._inBreedGrid);
  if (breedGridNodes.length > 0) {
    let bgL = Infinity, bgR = -Infinity;
    for (const bg of breedGridNodes) {
      bgL = Math.min(bgL, bg.x + (bg.data._extLeft ?? -(bg.data._labelHalfW || 40)));
      bgR = Math.max(bgR, bg.x + (bg.data._extRight ?? (bg.data._labelHalfW || 40)));
    }
    blocks.push({ type: 'breedGrid', left: bgL, right: bgR, nodes: breedGridNodes });
  }

  if (blocks.length > 1) {
    blocks.sort((a, b) => a.left - b.left);
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      const gap = curr.left - prev.right;
      // Use larger gap between different block types
      const sameType = prev.type === curr.type && prev.type === 'taxonomy';
      const minGap = sameType ? LABEL_PADDING : BLOCK_TYPE_GAP;
      const shift = minGap - gap;
      if (Math.abs(shift) > 0.5) {
        for (const n of curr.nodes) shiftSubtree(n, shift);
        curr.left += shift;
        curr.right += shift;
      }
    }
  }

  // Compute subtree extent from all children
  let minX = Infinity, maxX = -Infinity;
  for (const child of node.children) {
    minX = Math.min(minX, child.x + child.data._extLeft);
    maxX = Math.max(maxX, child.x + child.data._extRight);
  }

  // Re-center parent over children extent
  node.x = (minX + maxX) / 2;

  const halfW = node.data._labelHalfW || 40;
  node.data._extLeft = Math.min(-halfW, minX - node.x);
  node.data._extRight = Math.max(halfW, maxX - node.x);
}

/**
 * Post-layout collision sweep: for each depth level, scan left-to-right
 * and push overlapping nodes (+ their entire subtree) rightward.
 * Uses subtree extents (from compactTree) when available for accurate
 * overlap detection; falls back to label width for nodes without extents.
 * Skips grid nodes (handled by dynamic cell width in applyGridLayout).
 */
function resolveCollisions(root) {
  // Group non-grid nodes by depth
  const levels = new Map();
  for (const node of root.descendants()) {
    if (node.data._inGrid || node.data._inBreedGrid) continue;
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

      // Use subtree extent if available, otherwise label width
      const leftEnd = left.data._extRight != null
        ? left.x + left.data._extRight
        : left.x + (left.data._labelHalfW || 40);
      const rightStart = right.data._extLeft != null
        ? right.x + right.data._extLeft
        : right.x - (right.data._labelHalfW || 40);
      const actual = rightStart - leftEnd;

      if (actual < LABEL_PADDING) {
        const shift = LABEL_PADDING - actual;
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

/** Recursively shift a node and all its descendants by dx, dy. Also updates _gridBarY. */
function shiftSubtreeXY(node, dx, dy) {
  node.x += dx;
  node.y += dy;
  if (node.data._gridBarY != null) {
    node.data._gridBarY += dy;
  }
  if (node.children) {
    for (const child of node.children) {
      shiftSubtreeXY(child, dx, dy);
    }
  }
}

/**
 * When a parent has more than BREED_GRID_THRESHOLD non-vtuber children
 * (e.g. a species with many breeds), rearrange them into a multi-row grid
 * so the tree doesn't grow infinitely wide.
 * Runs AFTER compactTree + resolveCollisions so subtree extents are final.
 */
function applyBreedGridLayout(root) {
  for (const node of root.descendants()) {
    if (!node.children) continue;

    const breeds = node.children.filter(c => c.data._rank === 'BREED');
    if (breeds.length <= BREED_GRID_THRESHOLD) continue;

    // Compute subtree extent for each breed child (relative to child root)
    const infos = breeds.map(child => {
      let relMinX = -(child.data._labelHalfW || 40);
      let relMaxX = (child.data._labelHalfW || 40);
      let relMaxY = 0;
      for (const d of child.descendants()) {
        const hw = d.data._labelHalfW || 40;
        relMinX = Math.min(relMinX, d.x - child.x - hw);
        relMaxX = Math.max(relMaxX, d.x - child.x + hw);
        relMaxY = Math.max(relMaxY, d.y - child.y);
      }
      return { node: child, width: relMaxX - relMinX, height: relMaxY };
    });

    // Sort by VTuber count ascending — fewer VTubers → top rows
    infos.sort((a, b) => (a.node.data._count || 0) - (b.node.data._count || 0));

    // ── Balanced row assignment: greedy fill by subtree width ──
    const nominalCols = Math.min(BREED_GRID_COLS, infos.length);
    const targetRowCount = Math.ceil(infos.length / nominalCols);
    const totalWidth = infos.reduce((s, info) => s + info.width, 0);
    const targetWidthPerRow = totalWidth / targetRowCount;

    const rows = [[]];  // rows[r] = array of infos
    let curRowWidth = 0;
    for (const info of infos) {
      // Start a new row if adding this breed exceeds the target
      // (but never leave the current row empty, and respect max row count)
      if (rows[rows.length - 1].length > 0 &&
          curRowWidth + info.width > targetWidthPerRow * 1.15 &&
          rows.length < targetRowCount) {
        rows.push([]);
        curRowWidth = 0;
      }
      rows[rows.length - 1].push(info);
      curRowWidth += info.width;
    }

    // ── Per-row layout: each row has its own column count & widths ──
    const baseY = breeds[0].y;
    let curY = baseY;

    for (let r = 0; r < rows.length; r++) {
      const rowInfos = rows[r];
      const rowCols = rowInfos.length;

      // Column widths for this row
      const rowColWidths = rowInfos.map(info => info.width);
      const rowTotalW = rowColWidths.reduce((s, w) => s + w, 0) + (rowCols - 1) * BREED_GRID_GAP_X;

      // Column X centers (centered on parent node)
      const rowColXs = [];
      let accX = node.x - rowTotalW / 2;
      for (let c = 0; c < rowCols; c++) {
        rowColXs.push(accX + rowColWidths[c] / 2);
        accX += rowColWidths[c] + BREED_GRID_GAP_X;
      }

      // Row height = tallest subtree in this row
      const rowHeight = Math.max(...rowInfos.map(info => info.height));

      // Position each breed in this row
      for (let c = 0; c < rowInfos.length; c++) {
        const child = rowInfos[c].node;
        const dx = rowColXs[c] - child.x;
        const dy = curY - child.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          shiftSubtreeXY(child, dx, dy);
        }
        child.data._inBreedGrid = true;
        child.data._breedGridRow = r;
      }

      curY += rowHeight + BREED_GRID_VISUAL_BOTTOM + BREED_GRID_GAP_Y;
    }

    // Update parent subtree extent after rearrangement
    let minX = Infinity, maxX = -Infinity;
    for (const child of node.children) {
      for (const d of child.descendants()) {
        const hw = d.data._labelHalfW || 40;
        minX = Math.min(minX, d.x - hw);
        maxX = Math.max(maxX, d.x + hw);
      }
    }
    node.data._extLeft = minX - node.x;
    node.data._extRight = maxX - node.x;
  }
}

/**
 * Precompute which tree nodes have live descendants (DFS).
 * Returns a Set of node references that have at least one live vtuber in their subtree.
 */
function buildLiveDescendantSet(node, liveIds) {
  const result = new Set();
  if (!liveIds || liveIds.size === 0) return result;

  function dfs(n) {
    let hasLive = n.vtubers.some(v => liveIds.has(v.user_id));
    for (const child of n.children.values()) {
      if (dfs(child)) hasLive = true;
    }
    if (hasLive) result.add(n);
    return hasLive;
  }
  dfs(node);
  return result;
}

/**
 * Recursively convert Map-based tree node → plain object for d3.hierarchy.
 * Only includes children that are expanded. Also creates vtuber leaf nodes.
 */
// Visual budget tier thresholds
const BUDGET_TIER_DOT = 5;   // 5 traits → dot + name (no avatar)
const BUDGET_TIER_HIDDEN = 6; // 6+ traits → collapsed into "+N 位"

function getVisualTier(entry) {
  if (entry.is_live_primary) return 'normal';
  const tc = entry.trait_count || 0;
  if (tc >= BUDGET_TIER_HIDDEN) return 'hidden';
  if (tc >= BUDGET_TIER_DOT) return 'dot';
  return 'normal';
}

function mapToHierarchy(node, expandedSet, currentUserId, depth = 0, sortConfig = null, liveDescendantSet = null, expandedBudgetGroups = null) {
  const isExpanded = depth === 0 || expandedSet.has(node.pathKey);
  const children = [];
  const budgetGroupKey = `${node.pathKey}|__budget_group__`;
  const isBudgetExpanded = expandedBudgetGroups?.has(budgetGroupKey);
  let hiddenVtuberCount = 0;

  if (isExpanded) {
    // Vtubers FIRST (so they appear before taxonomy children when
    // at intermediate levels — see applyIntermediateLevel)
    const sortedVtubers = sortVtubers(node.vtubers, sortConfig);

    // Split vtubers into visual budget tiers
    const normalVtubers = [];
    const dotVtubers = [];
    const hiddenVtubers = [];
    for (const v of sortedVtubers) {
      const tier = getVisualTier(v);
      if (tier === 'hidden') hiddenVtubers.push(v);
      else if (tier === 'dot') dotVtubers.push(v);
      else normalVtubers.push(v);
    }

    // Normal tier: full avatar + name
    for (const v of normalVtubers) {
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

    // Dot tier: small dot + name (no avatar)
    for (const v of dotVtubers) {
      children.push({
        _name: v.display_name,
        _displayName: v.display_name,
        _rank: 'VTUBER',
        _vtuber: true,
        _visualTier: 'dot',
        _entry: v,
        _userId: v.user_id,
        _avatarUrl: v.avatar_url,
        _isCurrentUser: v.user_id === currentUserId,
        _pathKey: `${node.pathKey}|__vtuber__${v.user_id}`,
        children: null,
      });
    }

    // Hidden tier: only visible when parent node's budget group is expanded
    hiddenVtuberCount = hiddenVtubers.length;

    if (hiddenVtubers.length > 0 && isBudgetExpanded) {
      for (const v of hiddenVtubers) {
        children.push({
          _name: v.display_name,
          _displayName: v.display_name,
          _rank: 'VTUBER',
          _vtuber: true,
          _visualTier: 'dot',
          _entry: v,
          _userId: v.user_id,
          _avatarUrl: v.avatar_url,
          _isCurrentUser: v.user_id === currentUserId,
          _pathKey: `${node.pathKey}|__vtuber__${v.user_id}`,
          children: null,
        });
      }
    }

    let taxonomyChildren = [...node.children.values()];
    if (sortConfig?.key === 'shuffle' && sortConfig.shuffleSeed != null) {
      // Shuffle taxonomy nodes too so the entire tree layout changes
      taxonomyChildren = shuffleArray(taxonomyChildren, sortConfig.shuffleSeed + depth);
    } else if (sortConfig?.key === 'active_first' && liveDescendantSet && liveDescendantSet.size > 0) {
      // In active_first mode, sort taxonomy nodes with live descendants first
      taxonomyChildren.sort((a, b) => {
        const aHasLive = liveDescendantSet.has(a) ? 1 : 0;
        const bHasLive = liveDescendantSet.has(b) ? 1 : 0;
        if (aHasLive !== bHasLive) return bHasLive - aHasLive;
        return b.count - a.count;
      });
    } else {
      taxonomyChildren.sort((a, b) => b.count - a.count);
    }
    for (const child of taxonomyChildren) {
      children.push(mapToHierarchy(child, expandedSet, currentUserId, depth + 1, sortConfig, liveDescendantSet, expandedBudgetGroups));
    }
  }

  const hasHiddenChildren = !isExpanded && (node.children.size > 0 || node.vtubers.length > 0);

  // Hidden vtuber count for "+N 位" badge on this node
  const showBudgetBadge = hiddenVtuberCount > 0 && !isBudgetExpanded;

  return {
    _name: node.name,
    _nameZh: node.nameZh,
    _rank: node.rank || 'ROOT',
    _pathKey: node.pathKey,
    _count: node.count,
    _hasHiddenChildren: hasHiddenChildren,
    _hiddenVtuberCount: showBudgetBadge ? hiddenVtuberCount : 0,
    _budgetGroupKey: showBudgetBadge ? budgetGroupKey : null,
    children: children.length > 0 ? children : null,
  };
}
