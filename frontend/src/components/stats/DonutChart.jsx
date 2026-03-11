import { useRef, useEffect } from 'react';
import { select } from 'd3-selection';

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = {
    x: cx + r * Math.cos(startAngle),
    y: cy + r * Math.sin(startAngle),
  };
  const end = {
    x: cx + r * Math.cos(endAngle),
    y: cy + r * Math.sin(endAngle),
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function DonutChart({
  segments,
  size = 160,
  thickness = 24,
  centerLabel,
  centerValue,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!segments?.length) return;

    const total = segments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    const cx = size / 2;
    const cy = size / 2;
    const r = (size - thickness) / 2;
    const gapAngle = 0.03;

    const svg = select(svgRef.current);
    svg.attr('width', size).attr('height', size);
    svg.selectAll('*').remove();

    let currentAngle = -Math.PI / 2;

    segments.forEach((seg, i) => {
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      if (sliceAngle < 0.01) return;

      const startA = currentAngle + (i === 0 ? 0 : gapAngle / 2);
      const endA = currentAngle + sliceAngle - gapAngle / 2;

      svg.append('path')
        .attr('d', describeArc(cx, cy, r, startA, endA))
        .attr('fill', 'none')
        .attr('stroke', seg.color)
        .attr('stroke-width', thickness)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.85);

      currentAngle += sliceAngle;
    });

    // Center text
    if (centerValue != null) {
      svg.append('text')
        .attr('x', cx)
        .attr('y', centerLabel ? cy - 6 : cy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#fff')
        .attr('font-size', '1.5em')
        .attr('font-weight', 700)
        .text(centerValue);

      if (centerLabel) {
        svg.append('text')
          .attr('x', cx)
          .attr('y', cy + 16)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'rgba(255,255,255,0.4)')
          .attr('font-size', '0.72em')
          .text(centerLabel);
      }
    }

    return () => {
      svg.selectAll('*').remove();
    };
  }, [segments, size, thickness, centerLabel, centerValue]);

  if (!segments?.length) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85em' }}>暫無資料</div>;
  }

  const total = segments.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg ref={svgRef} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: '0.82em',
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: seg.color, flexShrink: 0,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{seg.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
