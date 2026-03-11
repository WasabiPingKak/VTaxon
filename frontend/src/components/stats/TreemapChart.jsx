import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import useIsMobile from '../../hooks/useIsMobile';

const LEVELS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
const LEVEL_LABELS = {
  kingdom: '界', phylum: '門', class: '綱',
  order: '目', family: '科', genus: '屬',
};

const KINGDOM_HUES = {
  Animalia: 200,
  Plantae: 150,
  Fungi: 270,
};

function getCellColor(kingdomKey, index, total) {
  const hue = KINGDOM_HUES[kingdomKey] ?? 220;
  const t = total > 1 ? index / (total - 1) : 0.5;
  const sat = 65 - t * 20;
  const lit = 44 + t * 18;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function groupByLevel(data, path, levelIdx) {
  let filtered = data;
  for (let i = 0; i < path.length; i++) {
    const lvl = LEVELS[i];
    filtered = filtered.filter(d => d[lvl] === path[i].key);
  }
  if (levelIdx >= LEVELS.length) return [];

  const lvl = LEVELS[levelIdx];
  const zhKey = lvl + '_zh';
  const groups = {};
  filtered.forEach(d => {
    const key = d[lvl] || 'Unknown';
    if (!groups[key]) {
      groups[key] = { key, name_zh: d[zhKey] || key, count: 0, kingdom: d.kingdom };
    }
    groups[key].count += d.count;
  });
  return Object.values(groups).sort((a, b) => b.count - a.count);
}

export default function TreemapChart({ data }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [path, setPath] = useState([]);
  const isMobile = useIsMobile();
  const [containerWidth, setContainerWidth] = useState(0);
  const chartHeight = isMobile ? 280 : 340;

  const levelIdx = path.length;

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current.clientWidth;
      setContainerWidth(prev => (prev === w ? prev : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Group data for current drill level
  const groups = useMemo(() => {
    if (!data?.length) return [];
    return groupByLevel(data, path, levelIdx);
  }, [data, path, levelIdx]);

  // Compute treemap layout
  const leaves = useMemo(() => {
    if (!groups.length || !containerWidth) return [];
    const root = hierarchy({
      name: 'root',
      children: groups.map(g => ({ ...g, value: g.count })),
    }).sum(d => d.value || 0);

    treemap()
      .size([containerWidth, chartHeight])
      .padding(3)
      .tile(treemapSquarify)(root);

    return root.leaves().filter(d => d.value > 0);
  }, [groups, containerWidth, chartHeight]);

  // Resolve kingdom for coloring (from path or from item data)
  const kingdomKey = path[0]?.key || null;

  const handleCellClick = useCallback((group) => {
    if (levelIdx >= LEVELS.length - 1) return;
    setPath(prev => [...prev, {
      level: LEVELS[levelIdx],
      key: group.key,
      label: group.name_zh,
    }]);
    setTooltip(null);
  }, [levelIdx]);

  const handleBreadcrumbClick = useCallback((idx) => {
    setPath(prev => prev.slice(0, idx));
    setTooltip(null);
  }, []);

  const handleMouseEnter = useCallback((e, leaf) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      name_zh: leaf.data.name_zh,
      key: leaf.data.key,
      count: leaf.value,
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip(prev => prev ? {
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    } : null);
  }, []);

  if (!data?.length) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em' }}>暫無資料</div>;
  }

  const currentLevelLabel = levelIdx < LEVELS.length ? LEVEL_LABELS[LEVELS[levelIdx]] : '';

  // Tooltip clamping
  const tooltipStyle = tooltip ? {
    position: 'absolute',
    left: Math.min(tooltip.x + 14, containerWidth - 190),
    top: tooltip.y < chartHeight - 60 ? tooltip.y + 14 : tooltip.y - 64,
    background: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: '0.8em',
    pointerEvents: 'none',
    zIndex: 10,
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } : null;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        marginBottom: 8, fontSize: '0.78em', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => handleBreadcrumbClick(0)}
          style={{
            background: 'none', border: 'none', padding: '2px 4px',
            cursor: path.length > 0 ? 'pointer' : 'default',
            color: path.length > 0 ? '#38bdf8' : 'rgba(255,255,255,0.6)',
            textDecoration: path.length > 0 ? 'underline' : 'none',
          }}
        >
          全部
        </button>
        {path.map((p, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>›</span>
            <button
              onClick={() => handleBreadcrumbClick(i + 1)}
              style={{
                background: 'none', border: 'none', padding: '2px 4px',
                cursor: i < path.length - 1 ? 'pointer' : 'default',
                color: i < path.length - 1 ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                textDecoration: i < path.length - 1 ? 'underline' : 'none',
              }}
            >
              {p.label}
            </button>
          </span>
        ))}
        {levelIdx < LEVELS.length && (
          <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 4, fontSize: '0.92em' }}>
            按{currentLevelLabel}分佈
          </span>
        )}
      </div>

      {/* Treemap */}
      <div
        ref={containerRef}
        style={{ width: '100%', position: 'relative' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {containerWidth > 0 && (
          <svg
            key={path.map(p => p.key).join('/')}
            width={containerWidth}
            height={chartHeight}
            style={{ display: 'block' }}
          >
            {leaves.map((leaf, i) => {
              const w = leaf.x1 - leaf.x0;
              const h = leaf.y1 - leaf.y0;
              const kk = leaf.data.kingdom || kingdomKey || 'Other';
              const color = getCellColor(kk, i, leaves.length);
              const canDrill = levelIdx < LEVELS.length - 1;
              const maxChars = Math.floor(w / (w < 70 ? 9 : 11));
              const label = leaf.data.name_zh || leaf.data.key;
              const truncated = label.length > maxChars
                ? label.slice(0, Math.max(maxChars - 1, 1)) + '…'
                : label;

              return (
                <g
                  key={leaf.data.key}
                  transform={`translate(${leaf.x0},${leaf.y0})`}
                  onClick={() => canDrill && handleCellClick(leaf.data)}
                  onMouseEnter={(e) => handleMouseEnter(e, leaf)}
                  style={{ cursor: canDrill ? 'pointer' : 'default' }}
                >
                  <rect
                    width={Math.max(0, w)}
                    height={Math.max(0, h)}
                    rx={4}
                    fill={color}
                    opacity={0.85}
                  />
                  <rect
                    width={Math.max(0, w)}
                    height={Math.max(0, h)}
                    rx={4}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={2}
                    style={{ transition: 'stroke 0.15s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('stroke', 'rgba(255,255,255,0.4)');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('stroke', 'transparent');
                    }}
                  />
                  {w > 36 && h > 24 && (
                    <text
                      x={6} y={16}
                      fill="rgba(255,255,255,0.95)"
                      fontSize={w < 70 ? '0.65em' : '0.78em'}
                      fontWeight={600}
                      pointerEvents="none"
                    >
                      {truncated}
                    </text>
                  )}
                  {w > 36 && h > 40 && (
                    <text
                      x={6} y={32}
                      fill="rgba(255,255,255,0.45)"
                      fontSize="0.65em"
                      pointerEvents="none"
                    >
                      {leaf.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div style={tooltipStyle}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.name_zh}</div>
            {tooltip.key !== tooltip.name_zh && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85em', fontStyle: 'italic' }}>
                {tooltip.key}
              </div>
            )}
            <div style={{ color: '#38bdf8', marginTop: 3 }}>
              {tooltip.count} 位 VTuber
            </div>
            {levelIdx < LEVELS.length - 1 && (
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8em', marginTop: 2 }}>
                點擊展開
              </div>
            )}
          </div>
        )}
      </div>

      {groups.length === 0 && (
        <div style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '0.85em',
          textAlign: 'center', padding: 20,
        }}>
          此層級無資料
        </div>
      )}
    </div>
  );
}
