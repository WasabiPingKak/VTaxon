const ORG_CONFIG = {
  corporate: { label: '企業勢', color: '#fb923c' },
  club:      { label: '社團勢', color: '#a78bfa' },
};

export default function OrgBadge({ orgType, organization, style }) {
  const resolved = orgType || (organization ? 'corporate' : 'indie');
  const cfg = ORG_CONFIG[resolved];
  if (!cfg) return null;

  return (
    <div style={{ color: cfg.color, fontSize: '0.85em', ...style }}>
      {cfg.label}{organization ? ` · ${organization}` : ''}
    </div>
  );
}
