import { STATUS } from '../../services/mockData';

/**
 * StatusBadge — renders a themed chip for container/alert status.
 * All colours come from CSS variables so dark/light mode works correctly.
 */
export default function StatusBadge({ status, size = 'sm' }) {
  // dot colour uses CSS vars — works in both themes
  const cfg = {
    [STATUS.NORMAL]:   { cls: 'badge-normal',   dot: 'var(--status-normal)',   label: 'NORMAL' },
    [STATUS.SECURED]:  { cls: 'badge-normal',   dot: 'var(--status-normal)',   label: 'SECURED' },
    [STATUS.WARNING]:  { cls: 'badge-warning',  dot: 'var(--status-warning)',  label: 'WARNING' },
    [STATUS.CRITICAL]: { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'CRITICAL' },
    [STATUS.TAMPERED]: { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'TAMPERED' },
    [STATUS.SHOCK]:    { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'SHOCK' },
    [STATUS.OFFLINE]:  { cls: 'badge-muted',    dot: 'var(--text-muted)',      label: 'OFFLINE' },
    RESOLVED:          { cls: 'badge-normal',   dot: 'var(--status-normal)',   label: 'RESOLVED' },
    ACKNOWLEDGED:      { cls: 'badge-info',     dot: 'var(--status-info)',     label: "ACK'D" },
    UNREAD:            { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'UNREAD' },
    HIGH:              { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'HIGH' },
    MEDIUM:            { cls: 'badge-warning',  dot: 'var(--status-warning)',  label: 'MEDIUM' },
    LOW:               { cls: 'badge-info',     dot: 'var(--status-info)',     label: 'LOW' },
    VERIFIED:          { cls: 'badge-normal',   dot: 'var(--status-normal)',   label: 'VERIFIED' },
    PENDING:           { cls: 'badge-warning',  dot: 'var(--status-warning)',  label: 'PENDING' },
    FAILED:            { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'FAILED' },
    UNVERIFIED:        { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'UNVERIFIED' },
    OPEN:              { cls: 'badge-critical', dot: 'var(--status-critical)', label: 'OPEN' },
    INFO:              { cls: 'badge-info',     dot: 'var(--status-info)',     label: 'INFO' },
  };

  const c = cfg[status] ?? { cls: 'badge-muted', dot: 'var(--text-muted)', label: status ?? '—' };

  return (
    <span className={`${c.cls} ${size === 'xs' ? 'text-2xs px-1.5 py-px' : ''}`}>
      <span className="status-dot" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}
