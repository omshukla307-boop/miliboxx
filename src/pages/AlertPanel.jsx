import { useState } from 'react';
import { Bell, Filter, MapPin, Clock, CheckCheck } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

const FILTERS = ['All', 'Critical', 'Warning', 'Resolved'];

export default function AlertPanel() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('All');

  const filtered = state.alerts.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Critical')  return a.severity === 'CRITICAL';
    if (filter === 'Warning')   return a.severity === 'WARNING';
    if (filter === 'Resolved')  return a.status === 'RESOLVED';
    return true;
  });

  const counts = {
    All:      state.alerts.length,
    Critical: state.alerts.filter((a) => a.severity === 'CRITICAL').length,
    Warning:  state.alerts.filter((a) => a.severity === 'WARNING').length,
    Resolved: state.alerts.filter((a) => a.status === 'RESOLVED').length,
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-text-secondary">
          Centralized alert management · {counts.All} total · {state.alerts.filter((a) => a.status === 'UNREAD').length} unread
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter size={13} className="text-text-muted mr-1" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'filter-tab-active' : 'filter-tab'}
          >
            {f}
            <span className="ml-1.5 text-2xs opacity-60">({counts[f] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Container</th>
                <th>Event</th>
                <th><Clock size={11} className="inline mr-1" />Timestamp</th>
                <th><MapPin size={11} className="inline mr-1" />Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={
                    a.severity === 'CRITICAL' && a.status !== 'RESOLVED'
                      ? 'border-l-2 border-l-status-critical'
                      : a.severity === 'WARNING'
                      ? 'border-l-2 border-l-status-warning'
                      : a.status === 'RESOLVED'
                      ? 'border-l-2 border-l-status-normal opacity-70'
                      : ''
                  }
                >
                  <td className="font-mono text-xs text-text-muted">{a.id}</td>
                  <td className="font-mono text-xs font-semibold text-accent-blue">{a.container}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Bell
                        size={12}
                        className={
                          a.severity === 'CRITICAL' ? 'text-status-critical' :
                          a.severity === 'WARNING'  ? 'text-status-warning'  :
                          'text-status-normal'
                        }
                      />
                      <span className={
                        a.severity === 'CRITICAL' ? 'text-status-critical font-medium' :
                        a.severity === 'WARNING'  ? 'text-status-warning' :
                        'text-text-secondary'
                      }>
                        {a.event}
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-text-secondary">{a.timestamp}</td>
                  <td>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin size={11} />{a.location}
                    </div>
                  </td>
                  <td><StatusBadge status={a.status} size="xs" /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {a.status === 'UNREAD' && (
                        <button
                          onClick={() => dispatch({ type: 'ACK_ALERT', id: a.id })}
                          className="text-2xs px-2 py-1 rounded bg-accent-blue-muted text-accent-blue
                                     hover:bg-accent-blue hover:text-white transition-colors border border-accent-blue/20"
                        >
                          Acknowledge
                        </button>
                      )}
                      {a.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => dispatch({ type: 'RESOLVE_ALERT', id: a.id })}
                          className="text-2xs px-2 py-1 rounded bg-status-normal-bg text-status-normal
                                     hover:bg-status-normal hover:text-white transition-colors border border-status-normal-dim/30 flex items-center gap-1"
                        >
                          <CheckCheck size={10} /> Resolve
                        </button>
                      )}
                      {a.status === 'RESOLVED' && (
                        <span className="text-2xs text-text-muted flex items-center gap-1">
                          <CheckCheck size={10} className="text-status-normal" /> Resolved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-8">
                    No alerts match the current filter.
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
