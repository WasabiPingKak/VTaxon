import { useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import useIsMobile from '../../hooks/useIsMobile';

export default function GrowthChart({ data }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!data?.length || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = isMobile ? 200 : 240;
    const pad = { top: 20, right: 44, bottom: 36, left: 36 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const maxNew = Math.max(...data.map(d => d.new_users));
    const maxCum = Math.max(...data.map(d => d.cumulative));

    const svg = select(svgRef.current);
    svg.selectAll('*').interrupt();
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    const xScale = (i) => (plotW / (data.length - 1 || 1)) * i;
    const yNew = (v) => plotH - (maxNew > 0 ? (v / maxNew) * plotH : 0);
    const yCum = (v) => plotH - (maxCum > 0 ? (v / maxCum) * plotH : 0);

    // X axis labels (show every N months)
    const step = Math.max(1, Math.floor(data.length / (isMobile ? 4 : 6)));
    data.forEach((d, i) => {
      if (i % step !== 0 && i !== data.length - 1) return;
      g.append('text')
        .attr('x', xScale(i))
        .attr('y', plotH + 22)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.35)')
        .attr('font-size', '0.65em')
        .text(d.month.slice(2)); // "25-01"
    });

    // Y axis labels (left = new users)
    [0, Math.round(maxNew / 2), maxNew].forEach(v => {
      const y = yNew(v);
      g.append('line')
        .attr('x1', 0).attr('x2', plotW)
        .attr('y1', y).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.06)');
      g.append('text')
        .attr('x', -6).attr('y', y)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(255,255,255,0.3)')
        .attr('font-size', '0.6em')
        .text(v);
    });

    // Y axis labels (right = cumulative)
    [0, Math.round(maxCum / 2), maxCum].forEach(v => {
      g.append('text')
        .attr('x', plotW + 6).attr('y', yCum(v))
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(56,189,248,0.4)')
        .attr('font-size', '0.6em')
        .text(v);
    });

    // Bars (new users)
    const barW = Math.max(4, Math.min(20, plotW / data.length - 2));
    data.forEach((d, i) => {
      g.append('rect')
        .attr('x', xScale(i) - barW / 2)
        .attr('y', plotH)
        .attr('width', barW)
        .attr('height', 0)
        .attr('rx', 2)
        .attr('fill', 'rgba(56,189,248,0.25)')
        .transition()
        .duration(500)
        .delay(i * 30)
        .attr('y', yNew(d.new_users))
        .attr('height', plotH - yNew(d.new_users));
    });

    // Line (cumulative)
    if (data.length > 1) {
      const linePath = data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yCum(d.cumulative)}`
      ).join(' ');

      g.append('path')
        .attr('d', linePath)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);

      // Dots
      data.forEach((d, i) => {
        g.append('circle')
          .attr('cx', xScale(i))
          .attr('cy', yCum(d.cumulative))
          .attr('r', 3)
          .attr('fill', '#38bdf8');
      });
    }

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${pad.left}, 6)`);
    legend.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2)
      .attr('fill', 'rgba(56,189,248,0.25)');
    legend.append('text').attr('x', 14).attr('y', 9)
      .attr('fill', 'rgba(255,255,255,0.5)').attr('font-size', '0.65em')
      .text('每月新增');

    const leg2 = svg.append('g').attr('transform', `translate(${pad.left + 76}, 6)`);
    leg2.append('line').attr('x1', 0).attr('x2', 10).attr('y1', 5).attr('y2', 5)
      .attr('stroke', '#38bdf8').attr('stroke-width', 2);
    leg2.append('circle').attr('cx', 5).attr('cy', 5).attr('r', 2.5).attr('fill', '#38bdf8');
    leg2.append('text').attr('x', 14).attr('y', 9)
      .attr('fill', 'rgba(255,255,255,0.5)').attr('font-size', '0.65em')
      .text('累計');

    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
    };
  }, [data, isMobile]);

  if (!data?.length) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em' }}>暫無資料</div>;
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  );
}
