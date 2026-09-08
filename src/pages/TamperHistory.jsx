import { useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, MapPin, Clock, Filter } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { tamperEvents } from '../services/mockData';

const EVENT_LABELS = {
  UNAUTHORIZED_OPEN: { label: 'Unauthorized Opening', icon: ShieldX,     cls: 'text-status-critical' },
  LID_OPENED:        { label: 'Lid Opened',           icon: ShieldAlert, cls: 'text-status-warning'  },
  CONTAINER_SECURED: { label: 'Container Secured',    icon: ShieldCheck, cls: 'text-status-normal'   },
  LOCK_RESTORED:     { label: 'Lock Restored',        icon: ShieldCheck, cls: 'text-status-normal'   },
  CONTAINER_SEALED:  { label: 'Container Sealed',     icon: ShieldCheck, cls: 'text-status-normal'   },
};

const FILTERS = ['All', 'UNAUTHORIZED_OPEN', 'LID_OPENED', 'CONTAINER_SECURED'];

export default function TamperHistory() {
  const [filter, setFilter] = useState('All');

  const filtered = tamperEvents.filter((e) => filter === 'All' || e.event === filter);

  return (
    <div className="page-container">
      <p className="text-xs text-text-secondary">
        Security and access events for all monitored containers
      </p>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter size={13} className="text-text-muted mr-1" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'filter-tab-active' : 'filter-tab'}
          >
            {f === 'All' ? 'All' : EVENT_LABELS[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th><Clock size={11} className="inline mr-1" />Timestamp</th>
                <th>Container</th>
                <th>Event</th>
                <th><MapPin size={11} className="inline mr-1" />Location</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cfg = EVENT_LABELS[e.event] ?? { label: e.event, icon: ShieldAlert, cls: 'text-text-secondary' };
                const Icon = cfg.icon;
                const isUnauth = e.event === 'UNAUTHORIZED_OPEN';

                return (
                  <tr
                    key={i}
                    className={isUnauth ? 'bg-status-critical-bg/30 border-l-2 border-l-status-critical' : ''}
                  >
                    <td className="font-mono text-xs text-text-secondary">{e.timestamp}</td>
                    <td className="font-mono text-xs font-semibold text-accent-blue">{e.container}</td>
                    <td>
                      <div className={`flex items-center gap-2 text-sm ${cfg.cls}`}>
                        <Icon size={13} />
                        <span className="font-medium">{cfg.label}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <MapPin size={11} />{e.location}
                      </div>
                    </td>
                    <td><StatusBadge status={e.verification} size="xs" /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-8">
                    No tamper events match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
