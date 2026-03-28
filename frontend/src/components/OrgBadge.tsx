import type { OrgType } from '../types';

interface OrgConfigEntry {
  label: string;
  color: string;
}

const ORG_CONFIG: Record<string, OrgConfigEntry> = {
  corporate: { label: '企業勢', color: '#fb923c' },
  club:      { label: '社團勢', color: '#a78bfa' },
};

interface OrgBadgeProps {
  orgType?: OrgType | string | null;
  organization?: string | null;
  style?: React.CSSProperties;
}

export default function OrgBadge({ orgType, organization, style }: OrgBadgeProps): React.ReactElement | null {
  const resolved = orgType || (organization ? 'corporate' : 'indie');
  const cfg = ORG_CONFIG[resolved];
  if (!cfg) return null;

  return (
    <div style={{ color: cfg.color, fontSize: '0.85em', ...style }}>
      {cfg.label}{organization ? ` · ${organization}` : ''}
    </div>
  );
}
