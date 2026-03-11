import { useRef, useEffect } from 'react';
import { select } from 'd3-selection';

const COLORS = {
  default: '#38bdf8',
  fictional: '#a78bfa',
};

export default function HorizontalBarChart({
  data,
  variant = 'default',
  height: barH = 28,
  gap = 6,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const maxCount = Math.max(...data.map(d => d.count));
    const labelW = Math.min(width * 0.32, 140);
    const countW = 40;
    const barAreaW = width - labelW - countW - 12;
    const svgH = data.length * (barH + gap) - gap;
    const color = COLORS[variant] || COLORS.default;

    const svg = select(svgRef.current);
    svg.attr('width', width).attr('height', svgH);
    svg.selectAll('*').remove();

    const rows = svg.selectAll('g.row')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(0, ${i * (barH + gap)})`);

    // Label
    rows.append('text')
      .attr('x', labelW - 8)
      .attr('y', barH / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '0.82em')
      .text(d => {
        const name = d.name || d.scientific_name || '';
        return name.length > 10 ? name.slice(0, 9) + '…' : name;
      });

    // Bar background
    rows.append('rect')
      .attr('x', labelW)
      .attr('y', 2)
      .attr('width', barAreaW)
      .attr('height', barH - 4)
      .attr('rx', 4)
      .attr('fill', 'rgba(255,255,255,0.04)');

    // Bar fill
    rows.append('rect')
      .attr('x', labelW)
      .attr('y', 2)
      .attr('width', 0)
      .attr('height', barH - 4)
      .attr('rx', 4)
      .attr('fill', color)
      .attr('opacity', 0.8)
      .transition()
      .duration(600)
      .delay((_, i) => i * 50)
      .attr('width', d => maxCount > 0
        ? Math.max(4, (d.count / maxCount) * barAreaW)
        : 0);

    // Count text
    rows.append('text')
      .attr('x', width - 4)
      .attr('y', barH / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgba(255,255,255,0.6)')
      .attr('font-size', '0.8em')
      .attr('font-weight', 600)
      .text(d => d.count);

  }, [data, variant, barH, gap]);

  if (!data?.length) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em' }}>暫無資料</div>;
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
