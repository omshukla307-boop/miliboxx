/**
 * KPICard — compact metric card for the top dashboard row.
 * Props: label, value, sub, icon (Lucide node), variant ('normal'|'warning'|'critical'|'info'|'muted')
 */
export default function KPICard({ label, value, sub, icon: Icon, variant = 'muted' }) {
  const accent = {
    normal:   'text-status-normal',
    warning:  'text-status-warning',
    critical: 'text-status-critical',
    info:     'text-status-info',
    muted:    'text-accent-blue',
  }[variant];

  const iconBg = {
    normal:   'bg-status-normal-bg border-status-normal-dim/30',
    warning:  'bg-status-warning-bg border-status-warning-dim/30',
    critical: 'bg-status-critical-bg border-status-critical-dim/30',
    info:     'bg-status-info-bg border-accent-blue/20',
    muted:    'bg-accent-blue-muted border-accent-blue/20',
  }[variant];

  return (
    <div className="card p-4 flex items-start gap-4 hover:border-bg-border/80 transition-colors">
      {Icon && (
        <div className={`${iconBg} border rounded p-2 mt-0.5 flex-shrink-0`}>
          <Icon size={16} className={accent} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold leading-none ${accent}`}>{value}</div>
        {sub && (
          <div className="text-2xs text-text-secondary mt-1">{sub}</div>
        )}
      </div>
    </div>
  );
}
