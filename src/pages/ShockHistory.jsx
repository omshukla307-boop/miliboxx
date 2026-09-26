import { useState, useMemo } from 'react';
import { Zap, MapPin, Clock, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/ui/StatusBadge';

const LEVELS = ['All', 'HIGH', 'MEDIUM', 'LOW'];

export default function ShockHistory() {
  const { state } = useApp();
  const [filter, setFilter] = useState('All');

  const realShockEvents = useMemo(() => {
    if (!state.alerts || state.alerts.length === 0) return [];

    return state.alerts.map((a) => {
      const sev = (a.severity || 'INFO').toUpperCase();
      const level = sev === 'CRITICAL' ? 'HIGH' : sev === 'WARNING' ? 'MEDIUM' : 'LOW';

      return {
        timestamp: a.timestamp || 'Just now',
        container: a.container || 'ESP32_MILITARY_BOX_01',
        level: level,
        location: a.location || 'Alpha Base',
        status: a.status || 'UNREAD',
        action: a.status === 'RESOLVED' ? 'Inspected & Cleared' : 'Inspect Box Hardware',
        rawMessage: a.event
      };
    });
  }, [state.alerts]);

  const filtered = realShockEvents.filter((e) => filter === 'All' || e.level === filter);

  return (
    <div className="page-container">
      <p className="text-xs text-text-secondary">
        Chronological log of all detected shock and impact events across the fleet from live sensors
      </p>

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter size={13} className="text-text-muted mr-1" />
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={filter === l ? 'filter-tab-active' : 'filter-tab'}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total Events', value: realShockEvents.length, color: 'text-text-primary' },
          { label: 'High Severity', value: realShockEvents.filter((e) => e.level === 'HIGH').length, color: 'text-status-critical' },
          { label: 'Medium', value: realShockEvents.filter((e) => e.level === 'MEDIUM').length, color: 'text-status-warning' },
          { label: 'Low', value: realShockEvents.filter((e) => e.level === 'LOW').length, color: 'text-status-info' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-2.5 flex items-center gap-3">
            <Zap size={14} className={color} />
            <div>
              <div className={`text-lg font-bold leading-none ${color}`}>{value}</div>
              <div className="text-2xs text-text-muted">{label}</div>
            </div>
          </div>
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
                <th><Zap size={11} className="inline mr-1" />Impact Level</th>
                <th><MapPin size={11} className="inline mr-1" />Location</th>
                <th>Status</th>
                <th>Action Required</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={i}
                  className={
                    e.level === 'HIGH'
                      ? 'border-l-2 border-l-status-critical'
                      : e.level === 'MEDIUM'
                      ? 'border-l-2 border-l-status-warning'
                      : ''
                  }
                >
                  <td className="font-mono text-xs text-text-secondary">{e.timestamp}</td>
                  <td className="font-mono text-xs font-semibold text-accent-blue">{e.container}</td>
                  <td><StatusBadge status={e.level} size="xs" /></td>
                  <td>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin size={11} />{e.location}
                    </div>
                  </td>
                  <td><StatusBadge status={e.status} size="xs" /></td>
                  <td className="text-text-secondary text-xs">{e.action}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-text-muted py-8">
                    No shock events recorded from hardware sensors.
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
