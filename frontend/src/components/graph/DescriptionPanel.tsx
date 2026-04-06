import { Link } from 'react-router-dom';

interface DescriptionPanelProps {
  onClose: () => void;
}

export default function DescriptionPanel({ onClose }: DescriptionPanelProps) {
  return (
    <div style={{
      position: 'absolute', right: 16, top: 60, zIndex: 50,
      background: 'rgba(8,13,21,0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '8px 12px',
      maxWidth: 200,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          VTuber 生物分類系統
        </div>
        <button type="button" onClick={onClose}
          data-testid="description-close"
          style={{
            background: 'none', border: 'none', padding: 0, margin: '-2px -4px 0 0',
            color: 'rgba(255,255,255,0.3)', fontSize: 16, lineHeight: 1,
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >&times;</button>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
        將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。
      </div>
      <Link to="/about" style={{
        display: 'inline-block', marginTop: 8, padding: '3px 10px',
        fontSize: 10, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', transition: 'border-color 0.15s, color 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
      >關於本站</Link>
    </div>
  );
}
