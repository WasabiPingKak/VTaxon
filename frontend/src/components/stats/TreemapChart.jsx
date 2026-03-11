import { useRef, useEffect, useState } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { select } from 'd3-selection';
import useIsMobile from '../../hooks/useIsMobile';

const KINGDOM_COLORS = {
  Animalia: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  Plantae: ['#34d399', '#10b981', '#059669', '#047857'],
  Fungi: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'],
};
const DEFAULT_COLORS = ['#94a3b8', '#64748b', '#475569', '#334155'];

export default function TreemapChart({ data }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!data?.length || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = isMobile ? 260 : 320;

    // Build hierarchy: root → kingdoms → classes
    const kingdoms = {};
    data.forEach(d => {
      const k = d.kingdom || 'Other';
      if (!kingdoms[k]) {
        kingdoms[k] = { name: k, name_zh: d.kingdom_zh || k, children: [] };
      }
      kingdoms[k].children.push({
        name: d.class || 'Unknown',
        name_zh: d.class_zh || d.class || '未知',
        kingdom: k,
        value: d.count,
      });
    });

    const root = hierarchy({
      name: 'root',
      children: Object.values(kingdoms),
    }).sum(d => d.value || 0);

    treemap()
      .size([width, height])
      .padding(2)
      .tile(treemapSquarify)
      (root);

    const svg = select(svgRef.current);
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const leaves = root.leaves().filter(d => d.value > 0);

    // Assign colors: each kingdom gets a palette, children get shades
    const kingdomChildIndex = {};

    leaves.forEach(d => {
      const k = d.data.kingdom || 'Other';
      const palette = KINGDOM_COLORS[k] || DEFAULT_COLORS;
      if (!kingdomChildIndex[k]) kingdomChildIndex[k] = 0;
      const idx = kingdomChildIndex[k]++;
      d._color = palette[idx % palette.length];
    });

    const cells = svg.selectAll('g')
      .data(leaves)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    cells.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', d => d._color)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        select(event.currentTarget).attr('opacity', 1);
        const parentName = d.parent?.data?.name_zh || d.parent?.data?.name || '';
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          text: `${parentName} → ${d.data.name_zh}：${d.value} 位 VTuber`,
        });
      })
      .on('mouseleave', (event) => {
        select(event.currentTarget).attr('opacity', 0.8);
        setTooltip(null);
      });

    // Only show label if cell is big enough
    cells.each(function (d) {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      if (w < 40 || h < 28) return;

      const g = select(this);
      g.append('text')
        .attr('x', 6)
        .attr('y', 16)
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', w < 70 ? '0.65em' : '0.78em')
        .attr('font-weight', 600)
        .text(() => {
          const label = d.data.name_zh;
          const maxChars = Math.floor(w / (w < 70 ? 9 : 11));
          return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
        });

      if (h > 38) {
        g.append('text')
          .attr('x', 6)
          .attr('y', 30)
          .attr('fill', 'rgba(255,255,255,0.5)')
          .attr('font-size', '0.65em')
          .text(d.value);
      }
    });

  }, [data, isMobile]);

  if (!data?.length) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em' }}>暫無資料</div>;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 8,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: '0.78em',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
